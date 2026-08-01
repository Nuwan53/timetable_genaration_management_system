"""
Notification and LecturerRequest tests.
Tests LecturerRequestViewSet, LecturerNotificationViewSet,
and related notification creation logic.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import (
    Lecturer, StudentGroup, UserProfile,
    LecturerRequest, LecturerNotification,
    Course, Venue, TimeSlot, ScheduleSlot,
)

User = get_user_model()

REQUESTS_URL = '/api/lecturer/requests/'
NOTIFICATIONS_URL = '/api/lecturer/notifications/'


class LecturerRequestTests(APITestCase):
    """Tests for /api/lecturer/requests/ (LecturerRequestViewSet)."""

    @classmethod
    def setUpTestData(cls):
        # Admin
        cls.admin = User.objects.create_user(
            username='notifadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)

        # Lecturer with profile
        cls.lec = Lecturer.objects.create(name='Dr. Notif', email='notif@uni.edu', lecturer_id='LEC-N-001')
        cls.lec_user = User.objects.create_user(username='notiflec', password='Lec@1234')
        UserProfile.objects.create(
            user=cls.lec_user, role='LECTURER', lecturer=cls.lec, must_change_password=False,
        )

        # Schedule slot for change requests
        cls.course = Course.objects.create(code='NCS', name='Notif Course')
        cls.venue = Venue.objects.create(code='NV1', name='Notif Venue')
        cls.group = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        cls.ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        cls.slot = ScheduleSlot.objects.create(
            timeslot=cls.ts, course=cls.course, lecturer=cls.lec,
            venue=cls.venue, group=cls.group,
        )

    def _auth_lecturer(self):
        token = RefreshToken.for_user(self.lec_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _auth_admin(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_lecturer_create_availability_request(self):
        self._auth_lecturer()
        resp = self.client.post(REQUESTS_URL, {
            'request_type': 'AVAILABILITY',
            'reason': 'Conference attendance',
            'requested_date': '2026-08-15',
            'requested_start': '08:00',
            'requested_end': '12:00',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['status'], 'PENDING')
        self.assertEqual(resp.data['request_type'], 'AVAILABILITY')

    def test_lecturer_create_change_request(self):
        self._auth_lecturer()
        resp = self.client.post(REQUESTS_URL, {
            'request_type': 'CHANGE',
            'schedule_slot': self.slot.pk,
            'reason': 'Room too small',
            'requested_room': 'LH5',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_lecturer_list_own_requests(self):
        LecturerRequest.objects.create(
            lecturer=self.lec, request_type='AVAILABILITY', reason='Test',
        )
        self._auth_lecturer()
        resp = self.client.get(REQUESTS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_admin_can_approve_request(self):
        req = LecturerRequest.objects.create(
            lecturer=self.lec, request_type='AVAILABILITY', reason='Test',
        )
        self._auth_admin()
        resp = self.client.post(f'{REQUESTS_URL}{req.pk}/approve/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'APPROVED')

    def test_admin_can_reject_request(self):
        req = LecturerRequest.objects.create(
            lecturer=self.lec, request_type='CHANGE', reason='Test',
        )
        self._auth_admin()
        resp = self.client.post(f'{REQUESTS_URL}{req.pk}/reject/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'REJECTED')

    def test_approve_creates_notification(self):
        req = LecturerRequest.objects.create(
            lecturer=self.lec, request_type='AVAILABILITY', reason='Test',
        )
        self._auth_admin()
        self.client.post(f'{REQUESTS_URL}{req.pk}/approve/')
        notifs = LecturerNotification.objects.filter(
            lecturer=self.lec, notification_type='REQUEST',
        )
        self.assertTrue(notifs.exists())


class LecturerNotificationTests(APITestCase):
    """Tests for /api/lecturer/notifications/ (LecturerNotificationViewSet)."""

    @classmethod
    def setUpTestData(cls):
        cls.lec = Lecturer.objects.create(name='Dr. LN', email='ln@uni.edu')
        cls.lec_user = User.objects.create_user(username='lnuser', password='Lec@1234')
        UserProfile.objects.create(
            user=cls.lec_user, role='LECTURER', lecturer=cls.lec, must_change_password=False,
        )

    def setUp(self):
        token = RefreshToken.for_user(self.lec_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_list_notifications(self):
        LecturerNotification.objects.create(
            lecturer=self.lec, notification_type='CHANGE',
            title='Test', message='Test msg',
        )
        resp = self.client.get(NOTIFICATIONS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_empty_notifications(self):
        resp = self.client.get(NOTIFICATIONS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 0)

    def test_only_own_notifications(self):
        """Lecturer only sees their own notifications."""
        other_lec = Lecturer.objects.create(name='Dr. Other', email='other@uni.edu')
        LecturerNotification.objects.create(
            lecturer=other_lec, notification_type='CANCEL',
            title='Other', message='Not mine',
        )
        LecturerNotification.objects.create(
            lecturer=self.lec, notification_type='CHANGE',
            title='Mine', message='My notification',
        )
        resp = self.client.get(NOTIFICATIONS_URL)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['title'], 'Mine')
