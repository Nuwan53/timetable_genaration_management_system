"""
Course CRUD tests via /api/courses/ (CourseViewSet, router-based).
Default permission: IsAuthenticated (any role can CRUD).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Course, UserProfile

User = get_user_model()

COURSES_URL = '/api/courses/'


def _detail_url(pk):
    return f'{COURSES_URL}{pk}/'


class CourseTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='courseadmin', password='Pass@1234',
            is_staff=True, is_superuser=True,
        )
        UserProfile.objects.create(user=cls.user, role='ADMIN', must_change_password=False)

    def setUp(self):
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_create_course(self):
        data = {'code': 'CS101', 'name': 'Intro to CS', 'credits': 3}
        resp = self.client.post(COURSES_URL, data)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['code'], 'CS101')
        self.assertEqual(resp.data['name'], 'Intro to CS')
        self.assertEqual(resp.data['credits'], 3)

    def test_list_courses(self):
        Course.objects.create(code='CS101', name='Intro')
        Course.objects.create(code='CS102', name='Data Structures')
        resp = self.client.get(COURSES_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_retrieve_course(self):
        c = Course.objects.create(code='CS101', name='Intro')
        resp = self.client.get(_detail_url(c.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['code'], 'CS101')

    def test_update_course(self):
        c = Course.objects.create(code='CS101', name='Old Name')
        resp = self.client.put(_detail_url(c.pk), {'code': 'CS101', 'name': 'New Name', 'credits': 4})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'New Name')
        self.assertEqual(resp.data['credits'], 4)

    def test_partial_update_course(self):
        c = Course.objects.create(code='CS101', name='Old Name')
        resp = self.client.patch(_detail_url(c.pk), {'name': 'Patched Name'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Patched Name')

    def test_delete_course(self):
        c = Course.objects.create(code='CS101', name='Intro')
        resp = self.client.delete(_detail_url(c.pk))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Course.objects.filter(pk=c.pk).exists())

    def test_duplicate_course_code(self):
        Course.objects.create(code='CS101', name='First')
        resp = self.client.post(COURSES_URL, {'code': 'CS101', 'name': 'Second', 'credits': 3})
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_missing_required_code(self):
        resp = self.client.post(COURSES_URL, {'name': 'No Code', 'credits': 3})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_name(self):
        resp = self.client.post(COURSES_URL, {'code': 'CS999', 'credits': 3})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_course(self):
        resp = self.client.get(_detail_url(99999))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
