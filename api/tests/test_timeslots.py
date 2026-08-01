"""
TimeSlot CRUD tests via /api/timeslots/ (TimeSlotViewSet, router-based).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import TimeSlot, UserProfile

User = get_user_model()

TIMESLOTS_URL = '/api/timeslots/'


def _detail_url(pk):
    return f'{TIMESLOTS_URL}{pk}/'


class TimeSlotTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='tsadmin', password='Pass@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.user, role='ADMIN', must_change_password=False)

    def setUp(self):
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_create_timeslot(self):
        data = {'day': 'Monday', 'start_time': '08:00', 'end_time': '09:00'}
        resp = self.client.post(TIMESLOTS_URL, data)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['day'], 'Monday')

    def test_list_timeslots(self):
        TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        TimeSlot.objects.create(day='Tuesday', start_time='08:00', end_time='09:00')
        resp = self.client.get(TIMESLOTS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_retrieve_timeslot(self):
        ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        resp = self.client.get(_detail_url(ts.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['day'], 'Monday')

    def test_update_timeslot(self):
        ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        resp = self.client.put(_detail_url(ts.pk), {
            'day': 'Tuesday', 'start_time': '10:00', 'end_time': '11:00',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['day'], 'Tuesday')

    def test_delete_timeslot(self):
        ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        resp = self.client.delete(_detail_url(ts.pk))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_duplicate_timeslot(self):
        """unique_together = ('day', 'start_time', 'end_time')"""
        TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        resp = self.client.post(TIMESLOTS_URL, {
            'day': 'Monday', 'start_time': '08:00', 'end_time': '09:00',
        })
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_allowed_weekdays(self):
        """DAY_CHOICES: Monday through Friday only."""
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
            ts = TimeSlot.objects.create(
                day=day, start_time='08:00', end_time='09:00',
            )
            self.assertEqual(ts.day, day)

    def test_same_day_different_times_allowed(self):
        TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        resp = self.client.post(TIMESLOTS_URL, {
            'day': 'Monday', 'start_time': '10:00', 'end_time': '11:00',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
