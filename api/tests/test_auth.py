"""
Authentication tests for POST /api/auth/login/.
Tests JWT token generation via SimpleJWT as used by the auth_login view.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Lecturer, StudentGroup, UserProfile

User = get_user_model()

LOGIN_URL = '/api/auth/login/'


class AuthenticationTests(APITestCase):
    """Tests for the auth_login function-based view."""

    @classmethod
    def setUpTestData(cls):
        # Admin user (is_staff + is_superuser, profile role ADMIN)
        cls.admin_user = User.objects.create_user(
            username='testadmin', password='Admin@Test123',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin_user, role='ADMIN', must_change_password=False)

        # Lecturer user
        cls.lecturer_obj = Lecturer.objects.create(
            name='Dr. Test Lec', email='lec@test.edu', department='CS',
            lecturer_id='LEC-TEST-001',
        )
        cls.lecturer_user = User.objects.create_user(username='testlecturer', password='Lec@Test123')
        UserProfile.objects.create(
            user=cls.lecturer_user, role='LECTURER',
            lecturer=cls.lecturer_obj, must_change_password=False,
        )

        # Student user
        cls.student_group = StudentGroup.objects.create(
            level='I', stream='physical', subgroup='A', year='2026',
        )
        cls.student_user = User.objects.create_user(username='teststudent', password='Stu@Test123')
        UserProfile.objects.create(
            user=cls.student_user, role='STUDENT',
            student_group=cls.student_group,
            registration_number='REG-TEST-001',
            must_change_password=False,
        )

    # ── Valid logins ─────────────────────────────────────────────────────

    def test_admin_login_success(self):
        resp = self.client.post(LOGIN_URL, {'username': 'testadmin', 'password': 'Admin@Test123'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('token', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertEqual(resp.data['role'], 'ADMIN')
        self.assertIn('user', resp.data)

    def test_lecturer_login_success(self):
        resp = self.client.post(LOGIN_URL, {'username': 'testlecturer', 'password': 'Lec@Test123'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['role'], 'LECTURER')
        self.assertIn('token', resp.data)

    def test_student_login_success(self):
        resp = self.client.post(LOGIN_URL, {'username': 'teststudent', 'password': 'Stu@Test123'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['role'], 'STUDENT')
        self.assertIn('token', resp.data)

    def test_login_response_has_user_data(self):
        resp = self.client.post(LOGIN_URL, {'username': 'testadmin', 'password': 'Admin@Test123'})
        user_data = resp.data['user']
        self.assertIn('id', user_data)
        self.assertIn('username', user_data)
        self.assertIn('role', user_data)
        self.assertIn('must_change_password', user_data)

    # ── Invalid logins ───────────────────────────────────────────────────

    def test_wrong_username(self):
        resp = self.client.post(LOGIN_URL, {'username': 'nonexistent', 'password': 'Admin@Test123'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_wrong_password(self):
        resp = self.client.post(LOGIN_URL, {'username': 'testadmin', 'password': 'WrongPassword'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_username(self):
        resp = self.client.post(LOGIN_URL, {'username': '', 'password': 'Admin@Test123'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_password(self):
        resp = self.client.post(LOGIN_URL, {'username': 'testadmin', 'password': ''})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_fields(self):
        resp = self.client.post(LOGIN_URL, {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ── JWT token tests ──────────────────────────────────────────────────

    def test_missing_token_on_protected_endpoint(self):
        """Accessing a protected endpoint without a token returns 401."""
        resp = self.client.get('/api/courses/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_jwt_token(self):
        """A garbage JWT token must be rejected."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalidtoken12345')
        resp = self.client.get('/api/courses/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_returns_refresh_token(self):
        """The login response includes a refresh token."""
        resp = self.client.post(LOGIN_URL, {'username': 'testadmin', 'password': 'Admin@Test123'})
        self.assertIn('refresh', resp.data)
        # The refresh token should be a non-empty string
        self.assertTrue(len(resp.data['refresh']) > 0)
