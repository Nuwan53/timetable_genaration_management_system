from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from django.contrib.auth.models import User

class AdminLoginTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@gmail.com",
            password="Admin123"
        )

    def test_admin_login_success(self):

        data = {
            "email": "admin@gmail.com",
            "password": "Admin123"
        }

        response = self.client.post("/api/login/", data)

        self.assertEqual(response.status_code, 200)