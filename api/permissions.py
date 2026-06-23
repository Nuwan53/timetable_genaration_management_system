from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow only admin users (superuser or user with admin role)."""
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or 
             (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'))
        )


class IsLecturer(BasePermission):
    """Allow only lecturer users."""
    message = "Only lecturers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'lecturer'
        )


class IsStudent(BasePermission):
    """Allow only student users."""
    message = "Only students can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'student'
        )


class IsAdminOrReadOnly(BasePermission):
    """Allow admins to edit; others read-only."""
    
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user and request.user.is_authenticated
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or 
             (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'))
        )


class IsAdminOrLecturerOrReadOnly(BasePermission):
    """Admins and lecturers can edit their own; students read-only."""
    
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user and request.user.is_authenticated
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or 
             (hasattr(request.user, 'profile') and 
              request.user.profile.role in ('admin', 'lecturer')))
        )
