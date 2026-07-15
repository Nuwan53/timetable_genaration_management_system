from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CourseViewSet, LecturerViewSet, VenueViewSet,
    StudentGroupViewSet, TimeSlotViewSet, ScheduleSlotViewSet,
    auth_login, LecturerMeViewSet, LecturerScheduleViewSet,
    LecturerRequestViewSet, LecturerNotificationViewSet,
    StudentDashboardView, StudentProfileView,
    StudentAccountViewSet,
    PublicationRecordViewSet,
    AcademicStreamViewSet, AcademicLevelViewSet,
    AcademicPathwayViewSet, PracticalGroupViewSet,
    AnalyticsView,
    SystemSettingsView, VenueDefaultViewSet,
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lecturers', LecturerViewSet)
router.register(r'students', StudentAccountViewSet, basename='student')
router.register(r'venues', VenueViewSet)
router.register(r'groups', StudentGroupViewSet)
router.register(r'timeslots', TimeSlotViewSet)
router.register(r'slots', ScheduleSlotViewSet)
router.register(r'publications', PublicationRecordViewSet, basename='publication')
router.register(r'streams', AcademicStreamViewSet, basename='stream')
router.register(r'levels', AcademicLevelViewSet, basename='level')
router.register(r'pathways', AcademicPathwayViewSet, basename='pathway')
router.register(r'practical-groups', PracticalGroupViewSet, basename='practical-group')
router.register(r'venue-defaults', VenueDefaultViewSet, basename='venue-default')

urlpatterns = [
    path('auth/login/', auth_login),
    path('student/dashboard/', StudentDashboardView.as_view()),
    path('student/profile/', StudentProfileView.as_view()),
    path('lecturer/me/', LecturerMeViewSet.as_view({'get': 'list', 'put': 'update', 'patch': 'update'})),
    path('lecturer/schedule/', LecturerScheduleViewSet.as_view({'get': 'list'})),
    path('lecturer/requests/', LecturerRequestViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('lecturer/requests/<int:pk>/', LecturerRequestViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('lecturer/notifications/', LecturerNotificationViewSet.as_view({'get': 'list'})),
    path('analytics/', AnalyticsView.as_view()),
    path('system-settings/', SystemSettingsView.as_view(), name='system-settings'),
]

urlpatterns += router.urls
