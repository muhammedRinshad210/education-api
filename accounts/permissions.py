from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.utils import get_instructor_profile, instructor_has_course_allocation, is_admin_user


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin_user(request.user)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        return request.user.is_staff


class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_instructor_profile(request.user) is not None


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'student'


class IsStudentAssignmentOwnerOrInstructor(BasePermission):
    """
    Allow access to a StudentAssignment if the requester owns it or is the
    instructor responsible for the related assignment.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        if obj.student_id == request.user.id:
            return True

        instructor_profile = get_instructor_profile(request.user)
        return instructor_profile is not None and obj.instructor_id == instructor_profile.id


class IsAdminOrInstructorCourseContent(BasePermission):
    message = "You do not have permission to manage this course."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return is_admin_user(request.user) or get_instructor_profile(request.user) is not None

    def has_object_permission(self, request, view, obj):
        if is_admin_user(request.user):
            return True

        instructor_profile = get_instructor_profile(request.user)
        if instructor_profile is None:
            return False

        course = getattr(obj, 'course', None)
        if course is None and hasattr(obj, 'assignment'):
            course = getattr(obj.assignment, 'course', None)

        return instructor_has_course_allocation(instructor_profile, course)


class IsInstructorNoteAccess(IsAdminOrInstructorCourseContent):
    pass
