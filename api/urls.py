from rest_framework.routers import DefaultRouter
from django.urls import path, include
from api.views import (
    CourseViewSet, LecturerViewSet, VenueViewSet,
    StudentGroupViewSet, TimeSlotViewSet, ScheduleSlotViewSet
)
from api.auth import (
    login_view, signup_view, logout_view, user_profile_view,
    UserProfileViewSet, StudentEnrollmentViewSet
)
from api.dashboard import DashboardViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lecturers', LecturerViewSet)
router.register(r'venues', VenueViewSet)
router.register(r'groups', StudentGroupViewSet)
router.register(r'timeslots', TimeSlotViewSet)
router.register(r'slots', ScheduleSlotViewSet, basename='slot')
router.register(r'users', UserProfileViewSet, basename='user')
router.register(r'enrollments', StudentEnrollmentViewSet, basename='enrollment')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    # Auth endpoints
    path('auth/login/', login_view, name='auth-login'),
    path('auth/signup/', signup_view, name='auth-signup'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('auth/me/', user_profile_view, name='auth-me'),
    
    # Router endpoints
    path('', include(router.urls)),
]
