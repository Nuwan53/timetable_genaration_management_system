from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from api.models import UserProfile, StudentEnrollment
from api.auth_serializers import (
    LoginSerializer, SignupSerializer, UserProfileSerializer,
    StudentEnrollmentSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint: POST /api/auth/login/
    Body: {"username": "...", "password": "..."}
    Returns: {"token": "...", "user": {...profile...}}
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password']
    )
    
    if not user:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    token, _ = Token.objects.get_or_create(user=user)
    profile_serializer = UserProfileSerializer(user.profile)
    
    return Response({
        'token': token.key,
        'user': profile_serializer.data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """
    Signup endpoint: POST /api/auth/signup/
    Body: {
        "username": "...",
        "email": "...",
        "password": "...",
        "password_confirm": "...",
        "role": "student|lecturer",
        "first_name": "...",
        "last_name": "..."
    }
    Returns: {"token": "...", "user": {...profile...}}
    """
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    profile_serializer = UserProfileSerializer(user.profile)
    
    return Response({
        'token': token.key,
        'user': profile_serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint: POST /api/auth/logout/
    Deletes user's auth token.
    """
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get current user's profile: GET /api/auth/me/
    """
    serializer = UserProfileSerializer(request.user.profile)
    return Response(serializer.data)


class UserProfileViewSet(viewsets.ViewSet):
    """
    Admin-only endpoint for managing user profiles.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """List all users (admin only)."""
        if not (request.user.is_superuser or 
                (hasattr(request.user, 'profile') and request.user.profile.role == 'admin')):
            return Response(
                {'error': 'Only admins can list users.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        users = UserProfile.objects.all()
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get a specific user's profile."""
        try:
            user = UserProfile.objects.get(pk=pk)
            serializer = UserProfileSerializer(user)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile."""
        serializer = UserProfileSerializer(request.user.profile)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_role(self, request, pk=None):
        """Update user role (admin only)."""
        if not (request.user.is_superuser or 
                (hasattr(request.user, 'profile') and request.user.profile.role == 'admin')):
            return Response(
                {'error': 'Only admins can update user roles.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = UserProfile.objects.get(pk=pk)
            if 'role' in request.data:
                profile.role = request.data['role']
                profile.save()
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    """
    Manage student enrollments (link students to groups).
    Admin can manage all; students can view their own.
    """
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admins see all enrollments
        if user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'admin'):
            return StudentEnrollment.objects.select_related('user', 'group')
        
        # Students see only their own
        if hasattr(user, 'profile') and user.profile.role == 'student':
            return StudentEnrollment.objects.filter(user=user).select_related('user', 'group')
        
        return StudentEnrollment.objects.none()

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            # Only admins can modify
            from api.permissions import IsAdmin
            self.permission_classes = [IsAdmin]
        return super().get_permissions()
