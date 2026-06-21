from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminProfileView,
    CategoryCoursesView,
    CategoryDetailView,
    CategoryView,
    CourseAdminView,
    CourseDetailView,
    CourseView,
    HomeView,
    InstructorAssignmentCreateAPIView,
    InstructorAssignmentSubmissionAPIView,
    InstructorCourseAllocationView,
    InstructorCoursesAPIView,
    InstructorCoursesView,
    InstructorLoginView,
    InstructorRegisterView,
    InstructorView,
    LoginView,
    RegisterView,
    StudentAssignmentSubmissionAPIView,
    StudentAssignmentViewSet,
    StudentListView,
    StudentLoginView,
    StudentRegisterView,
)

router = DefaultRouter()
router.register(r"student-assignments", StudentAssignmentViewSet, basename="student-assignment")

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("student-register/", StudentRegisterView.as_view(), name="student-register"),
    path("student-login/", StudentLoginView.as_view(), name="student-login"),
    path("home/", HomeView.as_view()),
    path("course/", CourseView.as_view(), name="course-list-create"),
    path("course/<int:id>/", CourseDetailView.as_view(), name="course-detail"),
    path("admin/course/", CourseAdminView.as_view(), name="admin-course-list-create"),
    path("admin/course/<int:pk>/", CourseAdminView.as_view(), name="admin-course-detail"),
    path("admin-profile/", AdminProfileView.as_view(), name="admin-profile"),
    path("admin/students/", StudentListView.as_view(), name="admin-students"),
    path("category/", CategoryView.as_view(), name="category-list-create"),
    path("category/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path("category/<int:pk>/courses/", CategoryCoursesView.as_view(), name="category-courses"),
    path("instructor/", InstructorView.as_view(), name="instructor-list-create"),
    path("instructor/<int:pk>/", InstructorView.as_view(), name="instructor-detail"),
    path(
        "instructor-course-allocation/",
        InstructorCourseAllocationView.as_view(),
        name="allocation-list-create",
    ),
    path(
        "instructor-course-allocation/<int:pk>/",
        InstructorCourseAllocationView.as_view(),
        name="allocation-detail",
    ),
    path(
        "instructor/<int:instructor_id>/courses/",
        InstructorCoursesView.as_view(),
        name="instructor-courses-by-id",
    ),
    path("instructor-register/", InstructorRegisterView.as_view(), name="instructor-register"),
    path("instructor-login/", InstructorLoginView.as_view(), name="instructor-login"),
    path("instructor/courses/", InstructorCoursesAPIView.as_view(), name="instructor-courses"),
    path(
        "instructor/assignments/",
        InstructorAssignmentCreateAPIView.as_view(),
        name="instructor-assignment-create",
    ),
    path(
        "instructor/assignments/<int:pk>/",
        InstructorAssignmentCreateAPIView.as_view(),
        name="instructor-assignment-detail",
    ),
    path(
        "student/assignments/submissions/",
        StudentAssignmentSubmissionAPIView.as_view(),
        name="student-assignment-submissions",
    ),
    path(
        "instructor/assignments/submissions/",
        InstructorAssignmentSubmissionAPIView.as_view(),
        name="instructor-assignment-submissions",
    ),
]

urlpatterns += router.urls
