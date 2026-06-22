from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):

    def has_permission(self, request, view):

        # GET allowed for authenticated users
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        # POST PUT DELETE admin only
        return request.user.is_staff

# permissions.py

from rest_framework.permissions import BasePermission

class IsInstructor(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "instructor_profile")
        )


class IsStudent(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user.is_authenticated
            and getattr(request.user, "role", None) == "student"
        )


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

        instructor_profile = getattr(request.user, "instructor_profile", None)
        return instructor_profile is not None and obj.instructor_id == instructor_profile.id


class IsInstructorNoteAccess(BasePermission):
    """
    Allow authenticated users to read notes.
    Allow instructors to create/update notes.
    Only the owning instructor can modify a note.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return hasattr(request.user, "instructor_profile")

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        instructor_profile = getattr(request.user, "instructor_profile", None)
        return instructor_profile is not None and obj.instructor_id == instructor_profile.id
