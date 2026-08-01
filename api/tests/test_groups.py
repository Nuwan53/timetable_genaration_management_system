"""
StudentGroup CRUD tests via /api/groups/ (StudentGroupViewSet, router-based).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import StudentGroup, UserProfile

User = get_user_model()

GROUPS_URL = '/api/groups/'


def _detail_url(pk):
    return f'{GROUPS_URL}{pk}/'


class StudentGroupTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='grpadmin', password='Pass@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.user, role='ADMIN', must_change_password=False)

    def setUp(self):
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_create_group(self):
        data = {'level': 'I', 'stream': 'physical', 'subgroup': 'A', 'year': '2026'}
        resp = self.client.post(GROUPS_URL, data)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['level'], 'I')
        self.assertEqual(resp.data['stream'], 'physical')

    def test_list_groups(self):
        StudentGroup.objects.create(level='I', stream='physical', year='2026')
        StudentGroup.objects.create(level='II', stream='bio', year='2026')
        resp = self.client.get(GROUPS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_retrieve_group(self):
        g = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        resp = self.client.get(_detail_url(g.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['level'], 'I')

    def test_update_group(self):
        g = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        resp = self.client.put(_detail_url(g.pk), {
            'level': 'I', 'stream': 'bio', 'subgroup': '', 'year': '2026',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['stream'], 'bio')

    def test_delete_group(self):
        g = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        resp = self.client.delete(_detail_url(g.pk))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_duplicate_group_combination(self):
        """unique_together = ('level', 'stream', 'subgroup', 'year')"""
        StudentGroup.objects.create(level='I', stream='physical', subgroup='A', year='2026')
        resp = self.client.post(GROUPS_URL, {
            'level': 'I', 'stream': 'physical', 'subgroup': 'A', 'year': '2026',
        })
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_valid_level_choices(self):
        """Level choices are I, II, III."""
        for level in ['I', 'II', 'III']:
            g = StudentGroup.objects.create(level=level, stream='physical', year=f'20{level}')
            self.assertEqual(g.level, level)

    def test_valid_stream_choices(self):
        """Stream choices are physical, bio, both."""
        for stream in ['physical', 'bio', 'both']:
            g = StudentGroup.objects.create(level='I', stream=stream, year=f'20{stream[:2]}')
            self.assertEqual(g.stream, stream)

    def test_missing_required_level(self):
        resp = self.client.post(GROUPS_URL, {'stream': 'physical', 'year': '2026'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_stream(self):
        resp = self.client.post(GROUPS_URL, {'level': 'I', 'year': '2026'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_group_has_display_field(self):
        """StudentGroupSerializer includes a computed 'display' field."""
        g = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        resp = self.client.get(_detail_url(g.pk))
        self.assertIn('display', resp.data)
