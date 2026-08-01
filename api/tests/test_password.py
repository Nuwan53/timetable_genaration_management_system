"""
Password change tests for POST /api/auth/change-password/ (ChangePasswordView).
Tests:
  - Successful change (min 8 chars)
  - Wrong current password
  - New password too short (< 8 chars)
  - Empty new password
  - Login with new password succeeds
  - Old password no longer works
  - must_change_password flag set to False after change
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Lecturer, UserProfile

User = get_user_model()

LOGIN_URL = '/api/auth/login/'
CHANGE_PWD_URL = '/api/auth/change-password/'


class PasswordChangeTests(APITestCase):

    def _create_user_with_profile(self, username, password, role='ADMIN', must_change=True):
        user = User.objects.create_user(
            username=username, password=password,
            is_staff=(role == 'ADMIN'), is_superuser=(role == 'ADMIN'),
        )
        profile_kwargs = {'user': user, 'role': role, 'must_change_password': must_change}
        if role == 'LECTURER':
            lec = Lecturer.objects.create(
                name=username, email=f'{username}@test.edu',
                must_change_password=must_change,
            )
            profile_kwargs['lecturer'] = lec
        UserProfile.objects.create(**profile_kwargs)
        return user

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_successful_password_change(self):
        user = self._create_user_with_profile('pwduser1', 'OldPass@123')
        self._auth(user)
        resp = self.client.post(CHANGE_PWD_URL, {
            'current_password': 'OldPass@123',
            'new_password': 'NewPass@456',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('Password changed', resp.data.get('detail', ''))

    def test_wrong_current_password(self):
        user = self._create_user_with_profile('pwduser2', 'OldPass@123')
        self._auth(user)
        resp = self.client.post(CHANGE_PWD_URL, {
            'current_password': 'WrongPassword',
            'new_password': 'NewPass@456',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_new_password_too_short(self):
        """ChangePasswordView requires new_password >= 8 chars."""
        user = self._create_user_with_profile('pwduser3', 'OldPass@123')
        self._auth(user)
        resp = self.client.post(CHANGE_PWD_URL, {
            'current_password': 'OldPass@123',
            'new_password': 'short',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_new_password(self):
        user = self._create_user_with_profile('pwduser4', 'OldPass@123')
        self._auth(user)
        resp = self.client.post(CHANGE_PWD_URL, {
            'current_password': 'OldPass@123',
            'new_password': '',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_new_password(self):
        user = self._create_user_with_profile('pwduser5', 'OldPass@123')
        self._auth(user)
        self.client.post(CHANGE_PWD_URL, {
            'current_password': 'OldPass@123',
            'new_password': 'NewPass@789',
        })
        # Clear credentials and try logging in with new password
        self.client.credentials()
        resp = self.client.post(LOGIN_URL, {'username': 'pwduser5', 'password': 'NewPass@789'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_old_password_no_longer_works(self):
        user = self._create_user_with_profile('pwduser6', 'OldPass@123')
        self._auth(user)
        self.client.post(CHANGE_PWD_URL, {
            'current_password': 'OldPass@123',
            'new_password': 'NewPass@789',
        })
        self.client.credentials()
        resp = self.client.post(LOGIN_URL, {'username': 'pwduser6', 'password': 'OldPass@123'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_must_change_password_flag_cleared(self):
        """After changing password, profile.must_change_password should be False."""
        user = self._create_user_with_profile('pwduser7', 'OldPass@123', must_change=True)
        self._auth(user)
        self.client.post(CHANGE_PWD_URL, {
            'current_password': 'OldPass@123',
            'new_password': 'NewPass@789',
        })
        user.refresh_from_db()
        profile = user.profile
        profile.refresh_from_db()
        self.assertFalse(profile.must_change_password)

    def test_lecturer_must_change_password_cleared(self):
        """For lecturers, both UserProfile and Lecturer must_change_password are cleared."""
        user = self._create_user_with_profile('pwdlec1', 'OldPass@123', role='LECTURER', must_change=True)
        self._auth(user)
        self.client.post(CHANGE_PWD_URL, {
            'current_password': 'OldPass@123',
            'new_password': 'NewPass@789',
        })
        user.refresh_from_db()
        profile = user.profile
        profile.refresh_from_db()
        self.assertFalse(profile.must_change_password)
        profile.lecturer.refresh_from_db()
        self.assertFalse(profile.lecturer.must_change_password)

    def test_unauthenticated_cannot_change_password(self):
        resp = self.client.post(CHANGE_PWD_URL, {
            'current_password': 'old', 'new_password': 'newpassword',
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
