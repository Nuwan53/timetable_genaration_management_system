"""
Conflict detection tests.
Tests the ScheduleSlotWriteSerializer._check_conflicts() logic:
  - Same venue at same timeslot → rejected
  - Same lecturer at same timeslot → rejected
  - Same group at same timeslot → rejected
  - Different entities → allowed
  - Self-update → no false conflict
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import (
    Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, UserProfile,
)

User = get_user_model()

SLOTS_URL = '/api/slots/'


def _detail_url(pk):
    return f'{SLOTS_URL}{pk}/'


class ConflictDetectionTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='conflictadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)

        cls.course1 = Course.objects.create(code='C1', name='Course 1')
        cls.course2 = Course.objects.create(code='C2', name='Course 2')
        cls.lec1 = Lecturer.objects.create(name='Lec1', email='lec1@uni.edu')
        cls.lec2 = Lecturer.objects.create(name='Lec2', email='lec2@uni.edu')
        cls.venue1 = Venue.objects.create(code='V1', name='Venue 1')
        cls.venue2 = Venue.objects.create(code='V2', name='Venue 2')
        cls.grp1 = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        cls.grp2 = StudentGroup.objects.create(level='II', stream='bio', year='2026')
        cls.ts1 = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        cls.ts2 = TimeSlot.objects.create(day='Tuesday', start_time='08:00', end_time='09:00')

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        # Create the initial booking in setUp so each test starts clean
        self.existing = ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course1, lecturer=self.lec1,
            venue=self.venue1, group=self.grp1, semester='S2-2026',
        )

    def test_venue_conflict_same_timeslot(self):
        """Same venue + same timeslot → conflict."""
        resp = self.client.post(SLOTS_URL, {
            'timeslot': self.ts1.pk, 'course': self.course2.pk,
            'lecturer': self.lec2.pk, 'venue': self.venue1.pk,  # same venue
            'group': self.grp2.pk, 'semester': 'S2-2026',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflicts', resp.data)

    def test_lecturer_conflict_same_timeslot(self):
        """Same lecturer + same timeslot → conflict."""
        resp = self.client.post(SLOTS_URL, {
            'timeslot': self.ts1.pk, 'course': self.course2.pk,
            'lecturer': self.lec1.pk,  # same lecturer
            'venue': self.venue2.pk, 'group': self.grp2.pk,
            'semester': 'S2-2026',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflicts', resp.data)

    def test_group_conflict_same_timeslot(self):
        """Same group + same timeslot → conflict."""
        resp = self.client.post(SLOTS_URL, {
            'timeslot': self.ts1.pk, 'course': self.course2.pk,
            'lecturer': self.lec2.pk, 'venue': self.venue2.pk,
            'group': self.grp1.pk,  # same group
            'semester': 'S2-2026',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('conflicts', resp.data)

    def test_no_conflict_different_timeslot(self):
        """Different timeslot → no conflict even with same venue/lecturer/group."""
        resp = self.client.post(SLOTS_URL, {
            'timeslot': self.ts2.pk,  # different timeslot
            'course': self.course2.pk,
            'lecturer': self.lec1.pk, 'venue': self.venue1.pk,
            'group': self.grp1.pk, 'semester': 'S2-2026',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_no_conflict_all_different(self):
        """All different entities at same timeslot → allowed."""
        resp = self.client.post(SLOTS_URL, {
            'timeslot': self.ts1.pk, 'course': self.course2.pk,
            'lecturer': self.lec2.pk, 'venue': self.venue2.pk,
            'group': self.grp2.pk, 'semester': 'S2-2026',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_self_update_no_conflict(self):
        """Updating an existing slot must not conflict with itself."""
        resp = self.client.put(_detail_url(self.existing.pk), {
            'timeslot': self.ts1.pk, 'course': self.course1.pk,
            'lecturer': self.lec1.pk, 'venue': self.venue1.pk,
            'group': self.grp1.pk, 'semester': 'S2-2026',
            'notes': 'Updated notes',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_multiple_conflicts_reported(self):
        """If venue AND lecturer conflict, both are reported."""
        resp = self.client.post(SLOTS_URL, {
            'timeslot': self.ts1.pk, 'course': self.course2.pk,
            'lecturer': self.lec1.pk,  # conflict
            'venue': self.venue1.pk,  # conflict
            'group': self.grp2.pk, 'semester': 'S2-2026',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        conflicts = resp.data.get('conflicts', [])
        self.assertGreaterEqual(len(conflicts), 2)
