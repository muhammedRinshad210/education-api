# accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model  # ✅ Fix auth.User error

from accounts.models import (
    Accounts,
    Instructor,
    Course,
    Category,
    InstructorCourseAllocation,
    Assignment,
    AssignmentSubmission,
    Note,
    StudentEnrollment,
    StudentAssignment,
)

# ✅ Get correct User model (works with custom user model)
User = get_user_model()


# ─────────────────────────────────────────────
# User Serializer
# ─────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active'
        ]


# ─────────────────────────────────────────────
# Account Serializer
# ─────────────────────────────────────────────

class AccountSerializer(serializers.ModelSerializer):

    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'email',
            'phone',
            'role'
        ]


# ─────────────────────────────────────────────
# Register Serializer
# ─────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):

    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'password',
            'email',
            'phone',
            'role'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):

        user = Accounts.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            phone=validated_data.get('phone'),
            role=validated_data['role']
        )

        return user


class StudentRegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match"}
            )

        if Accounts.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError(
                {"username": "A user with that username already exists."}
            )

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        return Accounts.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email", ""),
            phone=validated_data.get("phone"),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="student",
        )


# ─────────────────────────────────────────────
# Admin Profile Serializer
# ─────────────────────────────────────────────

class AdminProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'phone',
            'is_active',
            'is_superuser',
            'is_staff'
        ]


class StudentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'phone',
            'role',
            'is_active',
            'date_joined',
        ]


# ─────────────────────────────────────────────
# Category Serializer
# ─────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = '__all__'

    def validate_name(self, value):

        value = value.lower()

        # Exclude current instance when updating
        if self.instance:

            if Category.objects.filter(
                name__iexact=value
            ).exclude(
                id=self.instance.id
            ).exists():

                raise serializers.ValidationError(
                    "Category already exists"
                )

        else:

            if Category.objects.filter(
                name__iexact=value
            ).exists():

                raise serializers.ValidationError(
                    "Category already exists"
                )

        return value


# ─────────────────────────────────────────────
# Course Serializer
# ─────────────────────────────────────────────

class CourseSerializer(serializers.ModelSerializer):

    # For writing (accepts category ID)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )

    # For reading (shows category details)
    category_details = CategorySerializer(
        source='category',
        read_only=True
    )

    class Meta:
        model = Course
        fields = [
            'id',
            'user',
            'category',
            'category_details',
            'course_name',
            'duration',
            'fees'
        ]
        read_only_fields = ['user']


# ─────────────────────────────────────────────
# Instructor Serializer
# ─────────────────────────────────────────────

class InstructorSerializer(serializers.ModelSerializer):

    # Show linked user details (read only)
    user_info = UserSerializer(
        source='user',
        read_only=True
    )

    class Meta:
        model = Instructor
        fields = [
            'id',
            'instructor_id',
            'name',
            'phone',
            'email',
            'status',
            'created_at',
            'user',         # FK field (write)
            'user_info'     # Nested (read)
        ]
        extra_kwargs = {
            'user': {
                'write_only': True,
                'required': False
            },
            'password': {
                'write_only': True
            }
        }


# ─────────────────────────────────────────────
# Instructor Course Allocation Serializer
# ─────────────────────────────────────────────

class InstructorCourseAllocationSerializer(serializers.ModelSerializer):

    # Nested read-only details
    instructor_detail = InstructorSerializer(
        source='instructor',
        read_only=True
    )

    course_detail = CourseSerializer(
        source='course',
        read_only=True
    )

    allocated_by_detail = UserSerializer(
        source='allocated_by',
        read_only=True
    )

    class Meta:
        model = InstructorCourseAllocation
        fields = [
            'id',
            'instructor',           # FK (write)
            'course',               # FK (write)
            'allocated_by',         # FK (write)
            'allocation_status',
            'start_date',
            'end_date',
            'allocated_at',
            'instructor_detail',    # Nested (read)
            'course_detail',        # Nested (read)
            'allocated_by_detail'   # Nested (read)
        ]
        extra_kwargs = {
            'instructor': {
                'write_only': True
            },
            'course': {
                'write_only': True
            },
            'allocated_by': {
                'write_only': True,
                'required': False
            }
        }

    def validate(self, data):

        instructor = data.get('instructor')
        course = data.get('course')

        # Duplicate check on create only
        if not self.instance:

            if InstructorCourseAllocation.objects.filter(
                instructor=instructor,
                course=course
            ).exists():

                raise serializers.ValidationError(
                    {
                        "error": "This instructor is already allocated to this course"
                    }
                )

        return data


# ─────────────────────────────────────────────
# Instructor Register Serializer
# ─────────────────────────────────────────────

class InstructorRegisterSerializer(serializers.Serializer):

    instructor_id = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):

        if data['password'] != data['confirm_password']:

            raise serializers.ValidationError(
                {
                    "confirm_password": "Passwords do not match"
                }
            )

        try:

            instructor = Instructor.objects.get(
                instructor_id=data['instructor_id'],
                email=data['email'],
                phone=data['phone']
            )

        except Instructor.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "error": "Invalid Instructor Credentials"
                }
            )

        data['instructor'] = instructor

        return data


# ─────────────────────────────────────────────
# Instructor Login Serializer
# ─────────────────────────────────────────────

class InstructorLoginSerializer(serializers.Serializer):

    username = serializers.CharField()
    password = serializers.CharField()


# serializers.py

from rest_framework import serializers
from .models import Course

class LegacyCourseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Course
        fields = [
            'id',
            'course_code',
            'course_name',
            'duration',
            'fees',
            'description'
        ]


class NoteSerializer(serializers.ModelSerializer):
    course_details = CourseSerializer(source="course", read_only=True)
    instructor_details = InstructorSerializer(source="instructor", read_only=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "course",
            "course_details",
            "instructor",
            "instructor_details",
            "title",
            "content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "instructor",
            "created_at",
            "updated_at",
        ]


class AssignmentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source='title'
    )

    class Meta:
        model = Assignment
        fields = [
            'id',
            'course',
            'instructor',
            'name',
            'description',
            'image',
            'due_date',
            'status',
            'created_at'
        ]
        read_only_fields = [
            'instructor',
            'status',
            'created_at'
        ]
        extra_kwargs = {
            'image': {
                'required': False,
                'allow_null': True
            }
        }


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment_details = serializers.SerializerMethodField()
    student_details = UserSerializer(
        source="student",
        read_only=True,
    )

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id",
            "assignment",
            "assignment_details",
            "student",
            "student_details",
            "submission_file",
            "submission_text",
            "status",
            "submitted_at",
            "updated_at",
        ]
        read_only_fields = [
            "student",
            "status",
            "submitted_at",
            "updated_at",
        ]

    def validate(self, data):
        if not data.get("submission_file") and not data.get("submission_text"):
            raise serializers.ValidationError(
                {
                    "submission": "Provide at least a file or submission text."
                }
            )

        return data

    def get_assignment_details(self, obj):
        return {
            "id": obj.assignment_id,
            "title": obj.assignment.title,
            "course": {
                "id": obj.assignment.course_id,
                "course_name": obj.assignment.course.course_name,
                "course_code": obj.assignment.course.course_code,
            },
            "instructor": {
                "id": obj.assignment.instructor_id,
                "name": obj.assignment.instructor.name,
                "instructor_id": obj.assignment.instructor.instructor_id,
            },
        }


class StudentAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the StudentAssignment submission API.

    The client sends assignment_id, name, description, and media_file.
    The instructor and student ownership are assigned server-side.
    """

    assignment_id = serializers.PrimaryKeyRelatedField(
        source="assignment",
        queryset=Assignment.objects.select_related("course", "instructor"),
        write_only=True,
    )
    assignment = serializers.PrimaryKeyRelatedField(read_only=True)
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    instructor = serializers.PrimaryKeyRelatedField(read_only=True)
    assignment_details = serializers.SerializerMethodField(read_only=True)
    instructor_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentAssignment
        fields = [
            "id",
            "assignment_id",
            "assignment",
            "student",
            "instructor",
            "name",
            "description",
            "media_file",
            "created_at",
            "updated_at",
            "assignment_details",
            "instructor_details",
        ]
        read_only_fields = [
            "assignment",
            "student",
            "instructor",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        assignment = attrs.get("assignment")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                {"detail": "Authentication is required."}
            )

        if not assignment:
            raise serializers.ValidationError(
                {"assignment_id": "Assignment is required."}
            )

        if getattr(request.user, "role", None) != "student":
            raise serializers.ValidationError(
                {"detail": "Only students can submit student assignments."}
            )

        if not StudentEnrollment.objects.filter(
            student=request.user,
            course=assignment.course,
        ).exists():
            raise serializers.ValidationError(
                {
                    "assignment_id": "You are not enrolled in the course for this assignment."
                }
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        assignment = validated_data["assignment"]

        return StudentAssignment.objects.create(
            student=request.user,
            instructor=assignment.instructor,
            **validated_data,
        )

    def update(self, instance, validated_data):
        validated_data.pop("assignment", None)
        validated_data.pop("student", None)
        validated_data.pop("instructor", None)
        return super().update(instance, validated_data)

    def get_assignment_details(self, obj):
        return {
            "id": obj.assignment_id,
            "title": obj.assignment.title,
            "course": {
                "id": obj.assignment.course_id,
                "name": obj.assignment.course.course_name,
                "course_code": obj.assignment.course.course_code,
            },
        }

    def get_instructor_details(self, obj):
        instructor = obj.instructor
        return {
            "id": instructor.id,
            "instructor_id": instructor.instructor_id,
            "name": instructor.name,
            "email": instructor.email,
        }
