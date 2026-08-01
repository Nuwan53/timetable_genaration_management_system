"""
Venue CRUD tests via /api/venues/ (VenueViewSet, router-based).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Venue, UserProfile

User = get_user_model()

VENUES_URL = '/api/venues/'


def _detail_url(pk):
    return f'{VENUES_URL}{pk}/'


class VenueTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='venueadmin', password='Pass@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.user, role='ADMIN', must_change_password=False)

    def setUp(self):
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_create_venue(self):
        data = {'code': 'LH1', 'name': 'Lecture Hall 1', 'capacity': 200, 'venue_type': 'lecture'}
        resp = self.client.post(VENUES_URL, data)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['code'], 'LH1')
        self.assertEqual(resp.data['capacity'], 200)

    def test_list_venues(self):
        Venue.objects.create(code='LH1', name='Hall 1')
        Venue.objects.create(code='LAB1', name='Lab 1', venue_type='lab')
        resp = self.client.get(VENUES_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_retrieve_venue(self):
        v = Venue.objects.create(code='LH1', name='Hall 1')
        resp = self.client.get(_detail_url(v.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['code'], 'LH1')

    def test_update_venue(self):
        v = Venue.objects.create(code='LH1', name='Old')
        resp = self.client.put(_detail_url(v.pk), {
            'code': 'LH1', 'name': 'New Name', 'capacity': 300, 'venue_type': 'auditorium',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'New Name')
        self.assertEqual(resp.data['venue_type'], 'auditorium')

    def test_delete_venue(self):
        v = Venue.objects.create(code='LH1', name='Hall 1')
        resp = self.client.delete(_detail_url(v.pk))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Venue.objects.filter(pk=v.pk).exists())

    def test_duplicate_venue_code(self):
        Venue.objects.create(code='LH1', name='First')
        resp = self.client.post(VENUES_URL, {'code': 'LH1', 'name': 'Second'})
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_missing_required_code(self):
        resp = self.client.post(VENUES_URL, {'name': 'No Code', 'capacity': 100})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_name(self):
        resp = self.client.post(VENUES_URL, {'code': 'XX', 'capacity': 100})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_venue_type_choices(self):
        """venue_type must be one of: lecture, lab, auditorium."""
        for vtype in ['lecture', 'lab', 'auditorium']:
            v = Venue.objects.create(code=f'V-{vtype}', name=f'Venue {vtype}', venue_type=vtype)
            self.assertEqual(v.venue_type, vtype)
