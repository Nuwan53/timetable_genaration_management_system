from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CourseViewSet, LecturerViewSet, VenueViewSet,
    StudentGroupViewSet, TimeSlotViewSet, ScheduleSlotViewSet,
    auth_login,
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lecturers', LecturerViewSet)
router.register(r'venues', VenueViewSet)
router.register(r'groups', StudentGroupViewSet)
router.register(r'timeslots', TimeSlotViewSet)
router.register(r'slots', ScheduleSlotViewSet)

urlpatterns = [
    path('auth/login/', auth_login),
]

urlpatterns += router.urls
