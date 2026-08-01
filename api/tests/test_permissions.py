"""
Permission / role-based access tests.
Verifies IsAdminRole and default IsAuthenticated behaviour.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Lecturer, StudentGroup, UserProfile

User = get_user_model()

LOGIN_URL = '/api/auth/login/'


def _auth_header(user):
    """Return a JWT Bearer header dict for the given user."""
    token = RefreshToken.for_user(user)
    return f'Bearer {token.access_token}'


class PermissionTests(APITestCase):
    """Role-based access control tests."""

    @classmethod
    def setUpTestData(cls):
        # Admin
        cls.admin_user = User.objects.create_user(
            username='permadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin_user, role='ADMIN', must_change_password=False)

        # Lecturer
        cls.lec_obj = Lecturer.objects.create(name='Dr. Perm', email='perm@uni.edu', lecturer_id='LEC-P-001')
        cls.lec_user = User.objects.create_user(username='permlec', password='Lec@1234')
        UserProfile.objects.create(user=cls.lec_user, role='LECTURER', lecturer=cls.lec_obj, must_change_password=False)

        # Student
        cls.grp = StudentGroup.objects.create(level='I', stream='physical', subgroup='B', year='2026')
        cls.stu_user = User.objects.create_user(username='permstu', password='Stu@1234')
        UserProfile.objects.create(
            user=cls.stu_user, role='STUDENT', student_group=cls.grp,
            registration_number='REG-P-001', must_change_password=False,
        )

    # ── Anonymous ────────────────────────────────────────────────────────

    def test_anonymous_cannot_access_courses(self):
        resp = self.client.get('/api/courses/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_access_admin_endpoint(self):
        resp = self.client.get('/api/admin/admins/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Admin can access admin-only endpoints ────────────────────────────

    def test_admin_can_access_admin_accounts(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.admin_user))
        resp = self.client.get('/api/admin/admins/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_admin_can_access_students_endpoint(self):
        """StudentAccountViewSet requires IsAdminRole."""
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.admin_user))
        resp = self.client.get('/api/students/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_admin_can_access_analytics(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.admin_user))
        resp = self.client.get('/api/admin/analytics/summary/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # ── Lecturer cannot access admin-only ─────────────────────────────────

    def test_lecturer_cannot_access_admin_accounts(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.lec_user))
        resp = self.client.get('/api/admin/admins/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_lecturer_cannot_access_students_crud(self):
        """StudentAccountViewSet requires IsAdminRole."""
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.lec_user))
        resp = self.client.get('/api/students/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # ── Student cannot access admin-only ──────────────────────────────────

    def test_student_cannot_access_admin_accounts(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.stu_user))
        resp = self.client.get('/api/admin/admins/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_students_crud(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.stu_user))
        resp = self.client.get('/api/students/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_analytics(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.stu_user))
        resp = self.client.get('/api/admin/analytics/summary/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # ── Lecturer-specific endpoints ───────────────────────────────────────

    def test_lecturer_can_access_own_profile(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.lec_user))
        resp = self.client.get('/api/lecturer/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_lecturer_can_access_own_schedule(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.lec_user))
        resp = self.client.get('/api/lecturer/schedule/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # ── Student-specific endpoints ────────────────────────────────────────

    def test_student_can_access_dashboard(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.stu_user))
        resp = self.client.get('/api/student/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_student_can_access_profile(self):
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.stu_user))
        resp = self.client.get('/api/student/profile/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # ── Authenticated users can access default IsAuthenticated endpoints ──

    def test_authenticated_user_can_list_courses(self):
        """CourseViewSet uses default IsAuthenticated (any role)."""
        self.client.credentials(HTTP_AUTHORIZATION=_auth_header(self.stu_user))
        resp = self.client.get('/api/courses/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
