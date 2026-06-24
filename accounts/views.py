from collections import defaultdict

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q
from rest_framework import status
from rest_framework import mixins, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Accounts,
    Assignment,
    AssignmentSubmission,
    Category,
    Course,
    CourseVideo,
    Instructor,
    InstructorCourseAllocation,
    Note,
    StudentAssignment,
)
from .permissions import (
    IsAdminOrReadOnly,
    IsAdminOrInstructorCourseContent,
    IsInstructor,
    IsInstructorNoteAccess,
    IsStudent,
    IsStudentAssignmentOwnerOrInstructor,
)
from .serializers import (
    AdminProfileSerializer,
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    CategorySerializer,
    CourseSerializer,
    InstructorCourseAllocationSerializer,
    InstructorLoginSerializer,
    InstructorRegisterSerializer,
    InstructorSerializer,
    CourseVideoSerializer,
    NoteSerializer,
    StudentListSerializer,
    StudentAssignmentSerializer,
    StudentRegisterSerializer,
)
from .utils import (
    get_instructor_profile,
    instructor_has_course_allocation,
    is_admin_user,
    resolve_content_instructor,
    student_is_enrolled_in_course,
)

User = get_user_model()


class RegisterView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")

        if not username:
            return Response(
                {"message": "Username Required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password:
            return Response(
                {"message": "Password Required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != confirm_password:
            return Response(
                {"message": "Password Not Match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Accounts.objects.filter(username=username).exists():
            return Response(
                {"message": "Username Already Exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        Accounts.objects.create_user(username=username, password=password)

        return Response(
            {"message": "User Registered Successfully"},
            status=status.HTTP_201_CREATED,
        )


class StudentRegisterView(APIView):
    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student = serializer.save()

        return Response(
            {
                "message": "Student Registered Successfully",
                "data": {
                    "id": student.id,
                    "username": student.username,
                    "email": student.email,
                    "phone": student.phone,
                    "role": student.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"message": "Invalid Username or Password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class StudentLoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None or user.role != "student":
            return Response(
                {"message": "Invalid Username or Password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "student": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                },
            },
            status=status.HTTP_200_OK,
        )


class HomeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "Protected Route Working"}, status=status.HTTP_200_OK)


class CourseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = Course.objects.filter(user=request.user).select_related("category")
        grouped_data = defaultdict(list)

        for course in courses:
            category_key = course.category.id if course.category else None
            grouped_data[category_key].append(
                {
                    "id": course.id,
                    "course_name": course.course_name,
                    "duration": course.duration,
                    "fees": course.fees,
                }
            )

        result = []
        for category_id, course_list in grouped_data.items():
            category_data = None
            if category_id is not None:
                category = Category.objects.filter(id=category_id).first()
                if category:
                    category_data = {
                        "id": category.id,
                        "name": category.name,
                        "created_at": category.created_at,
                    }

            result.append(
                {
                    "category": category_data,
                    "courses": course_list,
                    "total_courses": len(course_list),
                }
            )

        return Response(result, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CourseSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(user=request.user)

        return Response(
            {"message": "Course Added Successfully", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, course_id, user):
        try:
            return Course.objects.get(id=course_id, user=user)
        except Course.DoesNotExist:
            return None

    def get(self, request, id):
        course = self.get_object(id, request.user)

        if not course:
            return Response(
                {"message": "Course Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CourseSerializer(course)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, id):
        course = self.get_object(id, request.user)

        if not course:
            return Response(
                {"message": "Course Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CourseSerializer(course, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response(
            {"message": "Course Updated Successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, id):
        course = self.get_object(id, request.user)

        if not course:
            return Response(
                {"message": "Course Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        course.delete()

        return Response(
            {"message": "Course Deleted Successfully"},
            status=status.HTTP_200_OK,
        )


class AdminProfileView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        admins = Accounts.objects.filter(is_superuser=True)
        serializer = AdminProfileSerializer(admins, many=True)

        return Response(
            {
                "status": True,
                "message": "Admin Profiles Fetched Successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class StudentListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        students = Accounts.objects.filter(role="student").order_by("-date_joined")
        serializer = StudentListSerializer(students, many=True)

        return Response(
            {
                "status": True,
                "message": "Students Fetched Successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class CategoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_object(self, pk):
        try:
            return Category.objects.get(id=pk)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)

        if not category:
            return Response(
                {"message": "Category Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        category = self.get_object(pk)

        if not category:
            return Response(
                {"message": "Category Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CategorySerializer(category, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        category = self.get_object(pk)

        if not category:
            return Response(
                {"message": "Category Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        category.delete()
        return Response(
            {"message": "Deleted Successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class CategoryCoursesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            category = Category.objects.get(id=pk)
        except Category.DoesNotExist:
            return Response(
                {"message": "Category Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        courses = Course.objects.filter(category=category, user=request.user)
        serializer = CourseSerializer(courses, many=True)

        return Response(
            {
                "category": CategorySerializer(category).data,
                "courses": serializer.data,
                "total_courses": courses.count(),
            },
            status=status.HTTP_200_OK,
        )


class InstructorView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk=None):
        if pk is not None:
            try:
                instructor = Instructor.objects.select_related("user").get(id=pk)
            except Instructor.DoesNotExist:
                return Response(
                    {"message": "Instructor Not Found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = InstructorSerializer(instructor)
            return Response(serializer.data, status=status.HTTP_200_OK)

        instructors = Instructor.objects.select_related("user").all()
        serializer = InstructorSerializer(instructors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = InstructorSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "Instructor Added Successfully", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, pk):
        try:
            instructor = Instructor.objects.get(id=pk)
        except Instructor.DoesNotExist:
            return Response(
                {"message": "Instructor Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = InstructorSerializer(instructor, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "Instructor Updated Successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        try:
            instructor = Instructor.objects.get(id=pk)
        except Instructor.DoesNotExist:
            return Response(
                {"message": "Instructor Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        instructor.delete()
        return Response(
            {"message": "Instructor Deleted Successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class CourseAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk=None):
        if pk is not None:
            try:
                course = Course.objects.select_related("category").get(id=pk)
            except Course.DoesNotExist:
                return Response(
                    {"message": "Course Not Found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = CourseSerializer(course)
            return Response(serializer.data, status=status.HTTP_200_OK)

        courses = Course.objects.select_related("category").all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CourseSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "Course Added Successfully", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, pk):
        try:
            course = Course.objects.get(id=pk)
        except Course.DoesNotExist:
            return Response(
                {"message": "Course Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CourseSerializer(course, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "Course Updated Successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        try:
            course = Course.objects.get(id=pk)
        except Course.DoesNotExist:
            return Response(
                {"message": "Course Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        course.delete()
        return Response(
            {"message": "Course Deleted Successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class InstructorCourseAllocationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk=None):
        if pk is not None:
            try:
                allocation = InstructorCourseAllocation.objects.select_related(
                    "instructor",
                    "course",
                    "allocated_by",
                ).get(id=pk)
            except InstructorCourseAllocation.DoesNotExist:
                return Response(
                    {"message": "Allocation Not Found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = InstructorCourseAllocationSerializer(allocation)
            return Response(serializer.data, status=status.HTTP_200_OK)

        allocations = InstructorCourseAllocation.objects.select_related(
            "instructor",
            "course",
            "allocated_by",
        ).all()
        serializer = InstructorCourseAllocationSerializer(allocations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        data["allocated_by"] = request.user.id

        serializer = InstructorCourseAllocationSerializer(data=data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "Course Allocated Successfully", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, pk):
        try:
            allocation = InstructorCourseAllocation.objects.get(id=pk)
        except InstructorCourseAllocation.DoesNotExist:
            return Response(
                {"message": "Allocation Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = InstructorCourseAllocationSerializer(
            allocation,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "Allocation Updated Successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        try:
            allocation = InstructorCourseAllocation.objects.get(id=pk)
        except InstructorCourseAllocation.DoesNotExist:
            return Response(
                {"message": "Allocation Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        allocation.delete()
        return Response(
            {"message": "Allocation Removed Successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class InstructorCoursesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, instructor_id):
        try:
            instructor = Instructor.objects.get(id=instructor_id)
        except Instructor.DoesNotExist:
            return Response(
                {"message": "Instructor Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        allocations = InstructorCourseAllocation.objects.filter(
            instructor=instructor
        ).select_related("course")
        serializer = InstructorCourseAllocationSerializer(allocations, many=True)

        return Response(
            {
                "instructor": instructor.name,
                "instructor_id": instructor.instructor_id,
                "total_courses": allocations.count(),
                "courses": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class InstructorRegisterView(APIView):
    def post(self, request):
        serializer = InstructorRegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        instructor = serializer.validated_data["instructor"]
        raw_password = serializer.validated_data["password"]

        instructor.password = make_password(raw_password)

        user, created = User.objects.get_or_create(
            username=instructor.instructor_id,
            defaults={
                "email": instructor.email,
                "first_name": instructor.name,
            },
        )

        if created:
            user.set_password(raw_password)
            user.save()

        instructor.user = user
        instructor.save()

        return Response(
            {
                "message": "Instructor Registered Successfully",
                "instructor_id": instructor.instructor_id,
                "name": instructor.name,
                "user_id": user.id,
            },
            status=status.HTTP_201_CREATED,
        )


class InstructorLoginView(APIView):
    def post(self, request):
        serializer = InstructorLoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        instructor = Instructor.objects.filter(
            Q(instructor_id=username) | Q(email=username) | Q(phone=username)
        ).first()

        if not instructor or not check_password(password, instructor.password):
            return Response(
                {"message": "Invalid Credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(instructor.user)
        refresh["instructor_id"] = instructor.id
        refresh["name"] = instructor.name

        return Response(
            {
                "message": "Login Successful",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "instructor": {
                    "id": instructor.id,
                    "instructor_id": instructor.instructor_id,
                    "name": instructor.name,
                    "email": instructor.email,
                    "phone": instructor.phone,
                    "user_id": instructor.user.id if instructor.user else None,
                },
            },
            status=status.HTTP_200_OK,
        )


class InstructorCoursesAPIView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def get(self, request):
        instructor = request.user.instructor_profile
        course_ids = (
            InstructorCourseAllocation.objects.filter(
                instructor=instructor,
                allocation_status="active",
            )
            .select_related("course")
            .values_list("course", flat=True)
        )

        courses = Course.objects.filter(id__in=course_ids).select_related("category")
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NoteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdminOrInstructorCourseContent]
    serializer_class = NoteSerializer

    def get_queryset(self):
        queryset = Note.objects.select_related(
            "course",
            "course__category",
            "instructor",
            "instructor__user",
        )

        user = self.request.user
        if is_admin_user(user):
            return queryset.all()

        instructor_profile = get_instructor_profile(user)
        if instructor_profile is None:
            return queryset.none()

        return queryset.filter(
            course__instructor_allocations__instructor=instructor_profile,
            course__instructor_allocations__allocation_status="active",
        ).distinct()

    def perform_create(self, serializer):
        course = serializer.validated_data.get("course")
        instructor = serializer.validated_data.get("instructor")

        if is_admin_user(self.request.user):
            instructor = resolve_content_instructor(course, instructor)
            if instructor is None:
                raise ValidationError(
                    {"instructor": "Provide an instructor for this course."}
                )
        else:
            instructor = get_instructor_profile(self.request.user)

        serializer.save(instructor=instructor)


class CourseVideoViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdminOrInstructorCourseContent]
    serializer_class = CourseVideoSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = CourseVideo.objects.select_related(
            "course",
            "course__category",
            "created_by",
        )

        course_id = self.request.query_params.get("course_id")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        user = self.request.user
        if is_admin_user(user):
            return queryset

        instructor_profile = get_instructor_profile(user)
        if instructor_profile is None:
            return queryset.none()

        return queryset.filter(
            course__instructor_allocations__instructor=instructor_profile,
            course__instructor_allocations__allocation_status="active",
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


class StudentCourseVideoListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"message": "Course Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not student_is_enrolled_in_course(request.user, course):
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        videos = CourseVideo.objects.filter(
            course_id=course_id,
            is_active=True,
        ).select_related("course", "course__category", "created_by")
        serializer = CourseVideoSerializer(videos, many=True, context={"request": request})
        return Response(
            {
                "message": "Course videos fetched successfully",
                "count": videos.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class StudentCourseVideoDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request, course_id, video_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"message": "Course Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not student_is_enrolled_in_course(request.user, course):
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            video = CourseVideo.objects.select_related(
                "course",
                "course__category",
                "created_by",
            ).get(id=video_id, course_id=course_id, is_active=True)
        except CourseVideo.DoesNotExist:
            return Response(
                {"message": "Video Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CourseVideoSerializer(video, context={"request": request})
        return Response(
            {
                "message": "Course video fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class InstructorAssignmentCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrInstructorCourseContent]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self, user):
        queryset = Assignment.objects.select_related("course", "instructor")

        if is_admin_user(user):
            return queryset.all()

        instructor = get_instructor_profile(user)
        if instructor is None:
            return queryset.none()

        return queryset.filter(
            course__instructor_allocations__instructor=instructor,
            course__instructor_allocations__allocation_status="active",
        ).distinct()

    def get_object(self, pk, user):
        try:
            return self.get_queryset(user).get(id=pk)
        except Assignment.DoesNotExist:
            return None

    def get(self, request, pk=None):
        if pk is not None:
            assignment = self.get_object(pk, request.user)

            if not assignment:
                return Response(
                    {"message": "Assignment Not Found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = AssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_200_OK)

        assignments = self.get_queryset(request.user)
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = serializer.validated_data["course"]
        instructor = serializer.validated_data.get("instructor")

        if is_admin_user(request.user):
            instructor = resolve_content_instructor(course, instructor)
            if instructor is None:
                raise ValidationError(
                    {"instructor": "Provide an instructor for this course."}
                )
        else:
            instructor = get_instructor_profile(request.user)

        serializer.save(instructor=instructor)

        return Response(
            {
                "message": "Assignment created successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, pk=None):
        if pk is None:
            return Response(
                {"message": "Assignment ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment = self.get_object(pk, request.user)

        if not assignment:
            return Response(
                {"message": "Assignment Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AssignmentSerializer(
            assignment,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "message": "Assignment updated successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk=None):
        if pk is None:
            return Response(
                {"message": "Assignment ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment = self.get_object(pk, request.user)

        if not assignment:
            return Response(
                {"message": "Assignment Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        assignment.delete()

        return Response(
            {"message": "Assignment deleted successfully"},
            status=status.HTTP_200_OK,
        )


class StudentAssignmentSubmissionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self, student):
        return AssignmentSubmission.objects.filter(
            student=student,
        ).select_related(
            "assignment",
            "assignment__course",
            "assignment__instructor",
            "student",
        )

    def get(self, request):
        submissions = self.get_queryset(request.user)
        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        return Response(
            {
                "message": "Student submissions fetched successfully",
                "count": submissions.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        student = request.user
        assignment_id = request.data.get("assignment")

        if not assignment_id:
            return Response(
                {"message": "Assignment is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            assignment = Assignment.objects.select_related(
                "course",
                "instructor",
            ).get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response(
                {"message": "Assignment Not Found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AssignmentSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        defaults = {
            "status": "submitted",
        }

        if "submission_file" in serializer.validated_data:
            defaults["submission_file"] = serializer.validated_data["submission_file"]

        if "submission_text" in serializer.validated_data:
            defaults["submission_text"] = serializer.validated_data["submission_text"]

        submission, created = AssignmentSubmission.objects.update_or_create(
            assignment=assignment,
            student=student,
            defaults=defaults,
        )

        response_serializer = AssignmentSubmissionSerializer(submission)

        return Response(
            {
                "message": (
                    "Assignment submitted successfully"
                    if created
                    else "Assignment resubmitted successfully"
                ),
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class InstructorAssignmentSubmissionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def get(self, request):
        instructor = request.user.instructor_profile
        assignment_id = request.query_params.get("assignment")

        submissions = AssignmentSubmission.objects.filter(
            assignment__instructor=instructor,
        ).select_related(
            "assignment",
            "assignment__course",
            "assignment__instructor",
            "student",
        )

        if assignment_id:
            submissions = submissions.filter(assignment_id=assignment_id)

        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        return Response(
            {
                "message": "Submitted assignments fetched successfully",
                "count": submissions.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class StudentAssignmentViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoint for student assignment submissions.

    GET /student-assignments/
    GET /student-assignments/{id}/
    POST /student-assignments/
    PATCH /student-assignments/{id}/
    DELETE /student-assignments/{id}/
    """

    serializer_class = StudentAssignmentSerializer
    permission_classes = [IsAuthenticated, IsStudentAssignmentOwnerOrInstructor]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user

        queryset = StudentAssignment.objects.select_related(
            "assignment",
            "assignment__course",
            "assignment__instructor",
            "student",
            "instructor",
        )

        if not user.is_authenticated:
            return queryset.none()

        if user.is_staff or user.is_superuser:
            return queryset

        instructor_profile = getattr(user, "instructor_profile", None)
        if instructor_profile is not None:
            return queryset.filter(instructor=instructor_profile)

        return queryset.filter(student=user)

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "message": "Student assignments fetched successfully",
                "count": queryset.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(
            {
                "message": "Student assignment fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Student assignment submitted successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            {
                "message": "Student assignment updated successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=False,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            {
                "message": "Student assignment updated successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        instance.delete()
        return Response(
            {"message": "Student assignment deleted successfully"},
            status=status.HTTP_200_OK,
        )
