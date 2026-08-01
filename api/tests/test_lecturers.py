"""
Lecturer CRUD tests via /api/lecturers/ (LecturerViewSet, router-based).
Also tests AdminLecturerCreateView at POST /api/admin/lecturers/.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Lecturer, UserProfile

User = get_user_model()

LECTURERS_URL = '/api/lecturers/'
ADMIN_LECTURERS_URL = '/api/admin/lecturers/'


def _detail_url(pk):
    return f'{LECTURERS_URL}{pk}/'


class LecturerViewSetTests(APITestCase):
    """Tests for the router-based LecturerViewSet (IsAuthenticated)."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='lecadmin', password='Pass@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.user, role='ADMIN', must_change_password=False)

    def setUp(self):
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_create_lecturer(self):
        data = {'name': 'Dr. Test', 'email': 'drtest@uni.edu', 'department': 'CS'}
        resp = self.client.post(LECTURERS_URL, data)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], 'Dr. Test')

    def test_list_lecturers(self):
        Lecturer.objects.create(name='Dr. A', email='a@uni.edu')
        Lecturer.objects.create(name='Dr. B', email='b@uni.edu')
        resp = self.client.get(LECTURERS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_retrieve_lecturer(self):
        lec = Lecturer.objects.create(name='Dr. A', email='a@uni.edu')
        resp = self.client.get(_detail_url(lec.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], 'a@uni.edu')

    def test_update_lecturer(self):
        lec = Lecturer.objects.create(name='Dr. Old', email='old@uni.edu')
        resp = self.client.put(_detail_url(lec.pk), {
            'name': 'Dr. New', 'email': 'new@uni.edu', 'department': 'Math',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Dr. New')

    def test_delete_lecturer(self):
        lec = Lecturer.objects.create(name='Dr. Del', email='del@uni.edu')
        resp = self.client.delete(_detail_url(lec.pk))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Lecturer.objects.filter(pk=lec.pk).exists())

    def test_duplicate_email(self):
        Lecturer.objects.create(name='Dr. A', email='dup@uni.edu')
        resp = self.client.post(LECTURERS_URL, {'name': 'Dr. B', 'email': 'dup@uni.edu'})
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_duplicate_lecturer_id(self):
        Lecturer.objects.create(name='Dr. A', email='a@uni.edu', lecturer_id='LEC-001')
        resp = self.client.post(LECTURERS_URL, {
            'name': 'Dr. B', 'email': 'b@uni.edu', 'lecturer_id': 'LEC-001',
        })
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_missing_required_name(self):
        resp = self.client.post(LECTURERS_URL, {'email': 'noname@uni.edu'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_email(self):
        resp = self.client.post(LECTURERS_URL, {'name': 'No Email'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class AdminLecturerCreateTests(APITestCase):
    """Tests for POST /api/admin/lecturers/ (AdminLecturerCreateView, IsAdminRole)."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='alecadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_admin_create_lecturer_with_account(self):
        """Admin creates a lecturer, which also creates a User + UserProfile."""
        resp = self.client.post(ADMIN_LECTURERS_URL, {
            'name': 'Dr. Admin Created',
            'email': 'admincreated@uni.edu',
            'department': 'Physics',
            'password': 'TempPass@123',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('lecturer_id', resp.data)
        self.assertEqual(resp.data['must_change_password'], True)

    def test_admin_create_lecturer_auto_password(self):
        """Password is auto-generated when not provided."""
        resp = self.client.post(ADMIN_LECTURERS_URL, {
            'name': 'Dr. AutoPass',
            'email': 'autopass@uni.edu',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(len(resp.data.get('password', '')) > 0)

    def test_admin_create_lecturer_duplicate_email(self):
        Lecturer.objects.create(name='Existing', email='existing@uni.edu')
        resp = self.client.post(ADMIN_LECTURERS_URL, {
            'name': 'New', 'email': 'existing@uni.edu',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_create_lecturer_missing_name(self):
        resp = self.client.post(ADMIN_LECTURERS_URL, {'email': 'noname@uni.edu'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_create_lecturer_missing_email(self):
        resp = self.client.post(ADMIN_LECTURERS_URL, {'name': 'No Email'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
