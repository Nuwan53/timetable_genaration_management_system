from rest_framework.routers import DefaultRouter
from .views import (CourseViewSet, LecturerViewSet, VenueViewSet,
                    StudentGroupViewSet, TimeSlotViewSet, ScheduleSlotViewSet)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lecturers', LecturerViewSet)
router.register(r'venues', VenueViewSet)
router.register(r'groups', StudentGroupViewSet)
router.register(r'timeslots', TimeSlotViewSet)
router.register(r'slots', ScheduleSlotViewSet)

urlpatterns = router.urls
