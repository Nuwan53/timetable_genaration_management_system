from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from api.models import (
    Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, StudentEnrollment
)
from api.permissions import IsAdmin


class DashboardViewSet(viewsets.ViewSet):
    """
    Dashboard statistics endpoint.
    Provides aggregate data for admin dashboard.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get dashboard statistics: GET /api/dashboard/stats/
        Returns aggregated counts and conflict data.
        """
        # Check if user is admin
        is_admin = request.user.is_superuser or (
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'admin'
        )
        
        if not is_admin:
            return Response(
                {'error': 'Only admins can view dashboard statistics.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Count resources
        total_courses = Course.objects.count()
        active_courses = Course.objects.filter(schedule_slots__isnull=False).distinct().count()
        
        total_lecturers = Lecturer.objects.count()
        active_lecturers = Lecturer.objects.filter(schedule_slots__isnull=False).distinct().count()
        
        total_venues = Venue.objects.count()
        active_venues = Venue.objects.filter(schedule_slots__isnull=False).distinct().count()
        
        total_groups = StudentGroup.objects.count()
        total_timeslots = TimeSlot.objects.count()
        total_slots = ScheduleSlot.objects.count()
        
        # Count published timetables (unique semester+group combinations with slots)
        published_timetables = ScheduleSlot.objects.values('semester', 'group').distinct().count()
        
        # Detect conflicts
        active_conflicts = self._detect_conflicts()
        
        # Weekly conflict summary
        DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        weekly_conflicts = []
        for day in DAYS:
            slots = ScheduleSlot.objects.filter(timeslot__day=day)
            conflicts_count = 0
            # Count venue, lecturer, group conflicts per day
            for slot in slots:
                slot_conflicts = self._check_slot_conflicts(slot)
                if slot_conflicts:
                    conflicts_count += 1
            weekly_conflicts.append({'day': day, 'conflicts': conflicts_count})
        
        return Response({
            'total_courses': total_courses,
            'active_courses': active_courses,
            'total_lecturers': total_lecturers,
            'active_lecturers': active_lecturers,
            'total_venues': total_venues,
            'active_venues': active_venues,
            'total_groups': total_groups,
            'total_timeslots': total_timeslots,
            'total_slots': total_slots,
            'published_timetables': published_timetables,
            'active_conflicts': active_conflicts,
            'weekly_conflicts': weekly_conflicts,
        })

    def _detect_conflicts(self):
        """Detect and count all conflicts in current schedule."""
        conflicts = set()
        
        for slot in ScheduleSlot.objects.all():
            # Check venue conflicts
            venue_clashes = ScheduleSlot.objects.filter(
                timeslot=slot.timeslot,
                venue=slot.venue
            ).exclude(pk=slot.pk)
            if venue_clashes.exists():
                conflicts.add(f"venue-{slot.venue.id}-{slot.timeslot.id}")
            
            # Check lecturer conflicts
            lecturer_clashes = ScheduleSlot.objects.filter(
                timeslot=slot.timeslot,
                lecturer=slot.lecturer
            ).exclude(pk=slot.pk)
            if lecturer_clashes.exists():
                conflicts.add(f"lecturer-{slot.lecturer.id}-{slot.timeslot.id}")
            
            # Check group conflicts
            group_clashes = ScheduleSlot.objects.filter(
                timeslot=slot.timeslot,
                group=slot.group
            ).exclude(pk=slot.pk)
            if group_clashes.exists():
                conflicts.add(f"group-{slot.group.id}-{slot.timeslot.id}")
        
        return len(conflicts)

    def _check_slot_conflicts(self, slot):
        """Check if a specific slot has conflicts."""
        errors = []
        
        # Venue conflict
        venue_clash = ScheduleSlot.objects.filter(
            timeslot=slot.timeslot,
            venue=slot.venue
        ).exclude(pk=slot.pk).exists()
        if venue_clash:
            errors.append(f"Venue {slot.venue.code} conflict")
        
        # Lecturer conflict
        lecturer_clash = ScheduleSlot.objects.filter(
            timeslot=slot.timeslot,
            lecturer=slot.lecturer
        ).exclude(pk=slot.pk).exists()
        if lecturer_clash:
            errors.append(f"Lecturer {slot.lecturer.name} conflict")
        
        # Group conflict
        group_clash = ScheduleSlot.objects.filter(
            timeslot=slot.timeslot,
            group=slot.group
        ).exclude(pk=slot.pk).exists()
        if group_clash:
            errors.append(f"Group {slot.group} conflict")
        
        return errors

    @action(detail=False, methods=['get'])
    def resource_summary(self, request):
        """
        Get resource utilization summary: GET /api/dashboard/resource-summary/
        """
        is_admin = request.user.is_superuser or (
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'admin'
        )
        
        if not is_admin:
            return Response(
                {'error': 'Only admins can view resource summary.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Venue utilization
        venues = Venue.objects.annotate(
            usage_count=Count('schedule_slots')
        ).values('id', 'code', 'name', 'usage_count').order_by('-usage_count')[:10]
        
        # Lecturer workload
        lecturers = Lecturer.objects.annotate(
            schedule_count=Count('schedule_slots')
        ).values('id', 'name', 'schedule_count').order_by('-schedule_count')[:10]
        
        # Course assignments
        courses = Course.objects.annotate(
            assignment_count=Count('schedule_slots')
        ).values('id', 'code', 'name', 'assignment_count').order_by('-assignment_count')[:10]
        
        return Response({
            'top_venues': list(venues),
            'busiest_lecturers': list(lecturers),
            'assigned_courses': list(courses),
        })

    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """
        Get recent schedule slot activity: GET /api/dashboard/recent-activity/
        """
        is_admin = request.user.is_superuser or (
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'admin'
        )
        
        if not is_admin:
            return Response(
                {'error': 'Only admins can view activity.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get recent schedule slots
        from api.serializers import ScheduleSlotReadSerializer
        recent_slots = ScheduleSlot.objects.select_related(
            'timeslot', 'course', 'lecturer', 'venue', 'group'
        ).order_by('-id')[:20]
        
        serializer = ScheduleSlotReadSerializer(recent_slots, many=True)
        return Response(serializer.data)
