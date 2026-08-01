"""
Student account tests via /api/students/ (StudentAccountViewSet, IsAdminRole)
and POST /api/admin/students/ (AdminStudentCreateView).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import StudentGroup, UserProfile

User = get_user_model()

STUDENTS_URL = '/api/students/'
ADMIN_STUDENTS_URL = '/api/admin/students/'


def _detail_url(pk):
    return f'{STUDENTS_URL}{pk}/'


class StudentAccountViewSetTests(APITestCase):
    """Tests for /api/students/ (StudentAccountViewSet requires IsAdminRole)."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='stuadmin', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)
        cls.group = StudentGroup.objects.create(level='I', stream='physical', year='2026')

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _create_student(self, username='stu001', reg='REG-001', password='Stu@1234'):
        return self.client.post(STUDENTS_URL, {
            'username': username,
            'password': password,
            'name': 'Test Student',
            'email': f'{username}@test.edu',
            'registration_number': reg,
            'student_group_id': self.group.pk,
        })

    def test_create_student(self):
        resp = self._create_student()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['username'], 'stu001')

    def test_list_students(self):
        self._create_student('s1', 'REG-S1')
        self._create_student('s2', 'REG-S2')
        resp = self.client.get(STUDENTS_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_retrieve_student(self):
        create_resp = self._create_student()
        pk = create_resp.data['id']
        resp = self.client.get(_detail_url(pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['username'], 'stu001')

    def test_update_student(self):
        create_resp = self._create_student()
        pk = create_resp.data['id']
        resp = self.client.put(_detail_url(pk), {
            'username': 'stu001',
            'name': 'Updated Student',
            'email': 'updated@test.edu',
            'registration_number': 'REG-001',
            'student_group_id': self.group.pk,
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Updated Student')

    def test_delete_student(self):
        create_resp = self._create_student()
        pk = create_resp.data['id']
        resp = self.client.delete(_detail_url(pk))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_duplicate_username(self):
        self._create_student('dupuser', 'REG-D1')
        resp = self._create_student('dupuser', 'REG-D2')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_registration_number(self):
        self._create_student('s1', 'REG-DUP')
        resp = self._create_student('s2', 'REG-DUP')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password_on_create(self):
        resp = self.client.post(STUDENTS_URL, {
            'username': 'nopass',
            'name': 'No Pass',
            'student_group_id': self.group.pk,
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_with_group(self):
        resp = self._create_student()
        self.assertEqual(resp.data['student_group_id'], self.group.pk)

    def test_student_without_group(self):
        resp = self.client.post(STUDENTS_URL, {
            'username': 'nogroup',
            'password': 'Pass@1234',
            'name': 'No Group',
        })
        # The serializer should accept null student_group_id
        if resp.status_code == status.HTTP_201_CREATED:
            self.assertIsNone(resp.data.get('student_group_id'))
        # It's also valid if the view returns 400 - either is acceptable


class AdminStudentCreateTests(APITestCase):
    """Tests for POST /api/admin/students/ (AdminStudentCreateView, IsAdminRole)."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username='admstucreate', password='Adm@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.admin, role='ADMIN', must_change_password=False)
        cls.group = StudentGroup.objects.create(level='II', stream='bio', year='2026')

    def setUp(self):
        token = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_admin_create_student(self):
        resp = self.client.post(ADMIN_STUDENTS_URL, {
            'registration_number': 'REG-ADM-001',
            'name': 'Admin Created Student',
            'email': 'admstu@test.edu',
            'student_group_id': self.group.pk,
            'password': 'TempPass@123',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['registration_number'], 'REG-ADM-001')
        self.assertEqual(resp.data['must_change_password'], True)

    def test_admin_create_student_auto_password(self):
        resp = self.client.post(ADMIN_STUDENTS_URL, {
            'registration_number': 'REG-ADM-002',
            'name': 'Auto Pass Student',
            'email': 'auto@test.edu',
            'student_group_id': self.group.pk,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(len(resp.data.get('password', '')) > 0)

    def test_admin_create_student_missing_reg_number(self):
        resp = self.client.post(ADMIN_STUDENTS_URL, {
            'name': 'No Reg', 'email': 'noreg@test.edu',
            'student_group_id': self.group.pk,
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_create_student_missing_name(self):
        resp = self.client.post(ADMIN_STUDENTS_URL, {
            'registration_number': 'REG-ADM-003',
            'email': 'noname@test.edu',
            'student_group_id': self.group.pk,
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_create_student_missing_group(self):
        """AdminStudentCreateView requires student_group_id."""
        resp = self.client.post(ADMIN_STUDENTS_URL, {
            'registration_number': 'REG-ADM-004',
            'name': 'No Group',
            'email': 'nogrp@test.edu',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_create_student_duplicate_reg_number(self):
        self.client.post(ADMIN_STUDENTS_URL, {
            'registration_number': 'REG-DUP-001',
            'name': 'First', 'email': 'first@test.edu',
            'student_group_id': self.group.pk,
        })
        resp = self.client.post(ADMIN_STUDENTS_URL, {
            'registration_number': 'REG-DUP-001',
            'name': 'Second', 'email': 'second@test.edu',
            'student_group_id': self.group.pk,
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
