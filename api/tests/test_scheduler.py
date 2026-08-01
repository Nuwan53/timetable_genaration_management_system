"""
Tests for the auto-scheduler (api/scheduler.py → generate_timetable_for_group).
Tests via the API endpoint POST /api/admin/scheduling/auto-generate/ (AdminAutoScheduleView).
Also tests the scheduler function directly for edge cases.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import (
    Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, UserProfile,
)
from api.scheduler import generate_timetable_for_group

User = get_user_model()

AUTO_SCHEDULE_URL = '/api/admin/scheduling/auto-generate/'


class AutoSchedulerAPITests(APITestCase):
    """Tests for POST /api/admin/scheduling/auto-generate/ (preview only)."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='schedadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)

        cls.course1 = Course.objects.create(code='SC1', name='Sched Course 1')
        cls.course2 = Course.objects.create(code='SC2', name='Sched Course 2')
        cls.lec1 = Lecturer.objects.create(name='Sched Lec1', email='sl1@uni.edu')
        cls.lec2 = Lecturer.objects.create(name='Sched Lec2', email='sl2@uni.edu')
        cls.venue = Venue.objects.create(code='SV1', name='Sched Venue', venue_type='lecture')
        cls.lab = Venue.objects.create(code='SV2', name='Sched Lab', venue_type='lab')
        cls.group = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        # Create enough timeslots for scheduling
        cls.ts1 = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        cls.ts2 = TimeSlot.objects.create(day='Monday', start_time='10:00', end_time='11:00')
        cls.ts3 = TimeSlot.objects.create(day='Tuesday', start_time='08:00', end_time='09:00')

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_successful_scheduling(self):
        resp = self.client.post(AUTO_SCHEDULE_URL, {
            'group_id': self.group.pk,
            'semester': 'S2-2026',
            'requirements': [
                {'course_id': self.course1.pk, 'lecturer_id': self.lec1.pk},
                {'course_id': self.course2.pk, 'lecturer_id': self.lec2.pk},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['is_complete'])
        self.assertEqual(resp.data['assigned_count'], 2)

    def test_scheduling_preview_does_not_save(self):
        """Auto-schedule is preview only — no ScheduleSlots created."""
        before = ScheduleSlot.objects.count()
        self.client.post(AUTO_SCHEDULE_URL, {
            'group_id': self.group.pk,
            'semester': 'S2-2026',
            'requirements': [
                {'course_id': self.course1.pk, 'lecturer_id': self.lec1.pk},
            ],
        }, format='json')
        after = ScheduleSlot.objects.count()
        self.assertEqual(before, after)

    def test_missing_group_id(self):
        resp = self.client.post(AUTO_SCHEDULE_URL, {
            'semester': 'S2-2026',
            'requirements': [
                {'course_id': self.course1.pk, 'lecturer_id': self.lec1.pk},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_requirements(self):
        resp = self.client.post(AUTO_SCHEDULE_URL, {
            'group_id': self.group.pk,
            'semester': 'S2-2026',
            'requirements': [],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_course_in_requirements(self):
        resp = self.client.post(AUTO_SCHEDULE_URL, {
            'group_id': self.group.pk,
            'semester': 'S2-2026',
            'requirements': [
                {'course_id': 99999, 'lecturer_id': self.lec1.pk},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_venue_type_filter(self):
        """Requirements with venue_type should prefer matching venue types."""
        resp = self.client.post(AUTO_SCHEDULE_URL, {
            'group_id': self.group.pk,
            'semester': 'S2-2026',
            'requirements': [
                {'course_id': self.course1.pk, 'lecturer_id': self.lec1.pk, 'venue_type': 'lab'},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        if resp.data['is_complete']:
            # Should be assigned to the lab venue
            result = resp.data['results'][0]
            self.assertEqual(result['venue_code'], 'SV2')


class SchedulerFunctionTests(APITestCase):
    """Direct tests for generate_timetable_for_group function."""

    @classmethod
    def setUpTestData(cls):
        cls.course = Course.objects.create(code='SF1', name='Func Test')
        cls.lec = Lecturer.objects.create(name='Func Lec', email='func@uni.edu')
        cls.venue = Venue.objects.create(code='FV1', name='Func Venue')
        cls.group = StudentGroup.objects.create(level='III', stream='bio', year='2026')
        cls.ts = TimeSlot.objects.create(day='Wednesday', start_time='08:00', end_time='09:00')

    def test_scheduler_returns_tuple(self):
        requirements = [{'course': self.course, 'lecturer': self.lec, 'lecturer_id': self.lec.pk}]
        assignments, is_complete = generate_timetable_for_group(
            self.group.pk, 'S2-2026', requirements,
        )
        self.assertIsInstance(assignments, list)
        self.assertIsInstance(is_complete, bool)

    def test_scheduler_no_conflict_with_itself(self):
        """Single requirement with available slots should succeed."""
        requirements = [{'course': self.course, 'lecturer': self.lec, 'lecturer_id': self.lec.pk}]
        assignments, is_complete = generate_timetable_for_group(
            self.group.pk, 'S2-2026', requirements,
        )
        self.assertTrue(is_complete)
        self.assertIsNotNone(assignments[0])

    def test_scheduler_no_timeslots_available(self):
        """If all timeslots are occupied, scheduler returns incomplete."""
        # Block the only timeslot
        ScheduleSlot.objects.create(
            timeslot=self.ts, course=self.course, lecturer=self.lec,
            venue=self.venue, group=self.group, semester='S2-2026',
        )
        lec2 = Lecturer.objects.create(name='Func Lec2', email='func2@uni.edu')
        requirements = [{'course': self.course, 'lecturer': lec2, 'lecturer_id': lec2.pk}]
        assignments, is_complete = generate_timetable_for_group(
            self.group.pk, 'S2-2026', requirements,
        )
        # Group timeslot is occupied, so this requirement can't be placed
        # (only 1 timeslot exists and it's already used by this group)
        self.assertFalse(is_complete)
