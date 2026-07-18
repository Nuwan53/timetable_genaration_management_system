from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CourseViewSet, LecturerViewSet, VenueViewSet,
    StudentGroupViewSet, TimeSlotViewSet, ScheduleSlotViewSet,
    auth_login, LecturerMeViewSet, LecturerScheduleViewSet,
    LecturerRequestViewSet, LecturerNotificationViewSet,
    StudentDashboardView, StudentProfileView,
    StudentAccountViewSet,
    AdminLecturerCreateView, AdminStudentCreateView, ChangePasswordView,AdminFreeSlotsView,AdminAnalyticsSummaryView,AdminBulkStudentUploadView, AdminBulkLecturerUploadView
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lecturers', LecturerViewSet)
router.register(r'students', StudentAccountViewSet, basename='student')
router.register(r'venues', VenueViewSet)
router.register(r'groups', StudentGroupViewSet)
router.register(r'timeslots', TimeSlotViewSet)
router.register(r'slots', ScheduleSlotViewSet)

urlpatterns = [
    path('auth/login/', auth_login),
    path('auth/change-password/', ChangePasswordView.as_view()),
    path('admin/lecturers/', AdminLecturerCreateView.as_view()),
    path('admin/students/', AdminStudentCreateView.as_view()),
    path('admin/analytics/free-slots/', AdminFreeSlotsView.as_view(), name='admin-free-slots'),
    path('admin/analytics/summary/', AdminAnalyticsSummaryView.as_view(), name='admin-analytics-summary'),
    path('admin/students/bulk-upload/', AdminBulkStudentUploadView.as_view(), name='admin-bulk-students'),
    path('admin/lecturers/bulk-upload/', AdminBulkLecturerUploadView.as_view(), name='admin-bulk-lecturers'),
    path('student/dashboard/', StudentDashboardView.as_view()),
    path('student/profile/', StudentProfileView.as_view()),
    path('lecturer/me/', LecturerMeViewSet.as_view({'get': 'list', 'put': 'update', 'patch': 'update'})),
    path('lecturer/schedule/', LecturerScheduleViewSet.as_view({'get': 'list'})),
    path('lecturer/requests/', LecturerRequestViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('lecturer/requests/<int:pk>/', LecturerRequestViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('lecturer/notifications/', LecturerNotificationViewSet.as_view({'get': 'list'})),
]

urlpatterns += router.urls
