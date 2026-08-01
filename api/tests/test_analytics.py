"""
Analytics endpoint tests.
Tests AdminAnalyticsSummaryView (GET /api/admin/analytics/summary/)
and AdminFreeSlotsView (GET /api/admin/analytics/free-slots/).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import (
    Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, UserProfile,
)

User = get_user_model()

SUMMARY_URL = '/api/admin/analytics/summary/'
FREE_SLOTS_URL = '/api/admin/analytics/free-slots/'


class AnalyticsSummaryTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='analyticsadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)

        cls.course = Course.objects.create(code='AN1', name='Analytics Course')
        cls.lec = Lecturer.objects.create(name='Analytics Lec', email='analytics@uni.edu')
        cls.venue = Venue.objects.create(code='AV1', name='Analytics Venue')
        cls.group = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        cls.ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_summary_returns_expected_keys(self):
        resp = self.client.get(SUMMARY_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('semester', resp.data)
        self.assertIn('room_utilization', resp.data)
        self.assertIn('lecturer_workload', resp.data)
        self.assertIn('day_distribution', resp.data)
        self.assertIn('busiest_times', resp.data)

    def test_summary_with_semester_param(self):
        resp = self.client.get(SUMMARY_URL, {'semester': 'S1-2025'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['semester'], 'S1-2025')

    def test_summary_room_utilization_with_booking(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts, course=self.course, lecturer=self.lec,
            venue=self.venue, group=self.group, semester='S2-2026',
        )
        resp = self.client.get(SUMMARY_URL, {'semester': 'S2-2026'})
        room_util = resp.data['room_utilization']
        # Our venue should appear with at least 1 booked slot
        venue_data = next((r for r in room_util if r['venue_code'] == 'AV1'), None)
        self.assertIsNotNone(venue_data)
        self.assertGreaterEqual(venue_data['booked_slots'], 1)

    def test_summary_day_distribution(self):
        resp = self.client.get(SUMMARY_URL)
        day_dist = resp.data['day_distribution']
        days = [d['day'] for d in day_dist]
        self.assertIn('Monday', days)
        self.assertIn('Friday', days)


class FreeSlotsTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='freeadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)

        cls.venue = Venue.objects.create(code='FV1', name='Free Venue')
        cls.lec = Lecturer.objects.create(name='Free Lec', email='free@uni.edu')
        cls.course = Course.objects.create(code='FC1', name='Free Course')
        cls.group = StudentGroup.objects.create(level='I', stream='bio', year='2026')
        cls.ts = TimeSlot.objects.create(day='Friday', start_time='14:00', end_time='15:00')

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_free_slots_by_venue(self):
        resp = self.client.get(FREE_SLOTS_URL, {'type': 'venue', 'id': self.venue.pk})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)
        # All slots should be free since no bookings exist
        for slot in resp.data:
            self.assertTrue(slot['is_free'])

    def test_free_slots_by_lecturer(self):
        resp = self.client.get(FREE_SLOTS_URL, {'type': 'lecturer', 'id': self.lec.pk})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_free_slots_occupied_slot(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts, course=self.course, lecturer=self.lec,
            venue=self.venue, group=self.group, semester='S2-2026',
        )
        resp = self.client.get(FREE_SLOTS_URL, {
            'type': 'venue', 'id': self.venue.pk, 'semester': 'S2-2026',
        })
        occupied = [s for s in resp.data if not s['is_free']]
        self.assertGreaterEqual(len(occupied), 1)

    def test_free_slots_missing_id(self):
        resp = self.client.get(FREE_SLOTS_URL, {'type': 'venue'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_free_slots_invalid_type(self):
        resp = self.client.get(FREE_SLOTS_URL, {'type': 'invalid', 'id': 1})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
