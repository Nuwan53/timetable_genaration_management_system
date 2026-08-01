from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from django.contrib.auth.models import User

class AdminLoginTest(APITestCase):

    def setUp(self):
        self.user, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@gmail.com"}
        )
        self.user.set_password("Admin123")
        self.user.save()

    def test_admin_login_success(self):

        data = {
            "username": "admin",
            "password": "Admin123"
        }

        response = self.client.post("/api/auth/login/", data)

        self.assertEqual(response.status_code, 200)

    def test_admin_login_wrong_password(self):

        data = {
            "username": "admin",
            "password": "WrongPassword123"
        }

        response = self.client.post("/api/auth/login/", data)

        self.assertEqual(response.status_code, 400)
