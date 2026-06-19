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
