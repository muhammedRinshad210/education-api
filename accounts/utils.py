from django.contrib.auth import get_user_model

from .models import Enrollment, InstructorCourseAllocation


User = get_user_model()


def is_admin_user(user):
    return bool(
        user
        and user.is_authenticated
        and (user.is_staff or user.is_superuser or getattr(user, "role", None) == "admin")
    )


def get_instructor_profile(user):
    return getattr(user, "instructor_profile", None)


def instructor_has_course_allocation(instructor, course, active_only=True):
    if instructor is None or course is None:
        return False

    filters = {
        "instructor": instructor,
        "course": course,
    }
    if active_only:
        filters["allocation_status"] = "active"

    return InstructorCourseAllocation.objects.filter(**filters).exists()


def get_instructor_allocated_courses_queryset(instructor, active_only=True):
    allocation_filters = {"instructor": instructor}
    if active_only:
        allocation_filters["allocation_status"] = "active"

    return (
        InstructorCourseAllocation.objects.filter(**allocation_filters)
        .select_related("course")
        .values_list("course_id", flat=True)
    )


def student_is_enrolled_in_course(student, course):
    if student is None or course is None:
        return False

    return Enrollment.objects.filter(student=student, course=course, status=True).exists()


def resolve_content_instructor(course, provided_instructor=None):
    if provided_instructor is not None:
        return provided_instructor

    active_allocations = (
        InstructorCourseAllocation.objects.filter(
            course=course,
            allocation_status="active",
        )
        .select_related("instructor")
    )

    if active_allocations.count() == 1:
        return active_allocations.first().instructor

    return None
