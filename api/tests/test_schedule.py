"""
ScheduleSlot CRUD and filtering tests via /api/slots/ (ScheduleSlotViewSet).
Uses ScheduleSlotWriteSerializer for POST/PUT, ScheduleSlotReadSerializer for GET.
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


class ScheduleSlotTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='slotadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)

        cls.course = Course.objects.create(code='CS101', name='Intro')
        cls.course2 = Course.objects.create(code='CS102', name='DS')
        cls.lecturer = Lecturer.objects.create(name='Dr. S', email='s@uni.edu')
        cls.lecturer2 = Lecturer.objects.create(name='Dr. T', email='t@uni.edu')
        cls.venue = Venue.objects.create(code='LH1', name='Hall 1')
        cls.venue2 = Venue.objects.create(code='LH2', name='Hall 2')
        cls.group = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        cls.group2 = StudentGroup.objects.create(level='II', stream='bio', year='2026')
        cls.ts1 = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        cls.ts2 = TimeSlot.objects.create(day='Tuesday', start_time='08:00', end_time='09:00')

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _slot_data(self, **overrides):
        defaults = {
            'timeslot': self.ts1.pk,
            'course': self.course.pk,
            'lecturer': self.lecturer.pk,
            'venue': self.venue.pk,
            'group': self.group.pk,
            'semester': 'S2-2026',
        }
        defaults.update(overrides)
        return defaults

    def test_create_schedule_slot(self):
        resp = self.client.post(SLOTS_URL, self._slot_data())
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_schedule_slots(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        resp = self.client.get(SLOTS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_retrieve_schedule_slot(self):
        slot = ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        resp = self.client.get(_detail_url(slot.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Read serializer returns nested objects
        self.assertIn('timeslot', resp.data)
        self.assertIn('course', resp.data)

    def test_update_schedule_slot(self):
        slot = ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        resp = self.client.put(_detail_url(slot.pk), self._slot_data(
            timeslot=self.ts2.pk, notes='Updated',
        ))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_delete_schedule_slot(self):
        slot = ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        resp = self.client.delete(_detail_url(slot.pk))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    # ── Filtering (from ScheduleSlotViewSet.get_queryset) ────────────────

    def test_filter_by_lecturer(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        ScheduleSlot.objects.create(
            timeslot=self.ts2, course=self.course2, lecturer=self.lecturer2,
            venue=self.venue2, group=self.group2,
        )
        resp = self.client.get(SLOTS_URL, {'lecturer': self.lecturer.pk})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_filter_by_group(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        resp = self.client.get(SLOTS_URL, {'group': self.group.pk})
        self.assertEqual(len(resp.data), 1)

    def test_filter_by_semester(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group, semester='S1-2025',
        )
        ScheduleSlot.objects.create(
            timeslot=self.ts2, course=self.course2, lecturer=self.lecturer2,
            venue=self.venue2, group=self.group2, semester='S2-2026',
        )
        resp = self.client.get(SLOTS_URL, {'semester': 'S1-2025'})
        self.assertEqual(len(resp.data), 1)

    def test_filter_by_day(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        resp = self.client.get(SLOTS_URL, {'day': 'Monday'})
        self.assertEqual(len(resp.data), 1)
        resp2 = self.client.get(SLOTS_URL, {'day': 'Friday'})
        self.assertEqual(len(resp2.data), 0)

    def test_filter_by_level(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,  # level='I'
        )
        resp = self.client.get(SLOTS_URL, {'level': 'I'})
        self.assertEqual(len(resp.data), 1)
        resp2 = self.client.get(SLOTS_URL, {'level': 'III'})
        self.assertEqual(len(resp2.data), 0)

    def test_filter_by_stream(self):
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,  # stream='physical'
        )
        resp = self.client.get(SLOTS_URL, {'stream': 'physical'})
        self.assertEqual(len(resp.data), 1)

    def test_read_serializer_nests_objects(self):
        """GET returns nested serialized objects (ScheduleSlotReadSerializer)."""
        ScheduleSlot.objects.create(
            timeslot=self.ts1, course=self.course, lecturer=self.lecturer,
            venue=self.venue, group=self.group,
        )
        resp = self.client.get(SLOTS_URL)
        slot_data = resp.data[0]
        # Nested objects should have their own fields
        self.assertIsInstance(slot_data['course'], dict)
        self.assertIn('code', slot_data['course'])
        self.assertIsInstance(slot_data['venue'], dict)
        self.assertIn('code', slot_data['venue'])
