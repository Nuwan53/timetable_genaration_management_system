"""
PDF export tests for GET /api/lecturer/notifications/export-pdf/
(LecturerNotificationViewSet.export_pdf action).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import (
    Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, UserProfile,
)

User = get_user_model()

EXPORT_PDF_URL = '/api/lecturer/notifications/export-pdf/'


class PDFExportTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        # Lecturer user (required to access the endpoint)
        cls.lec = Lecturer.objects.create(name='Dr. PDF', email='pdf@uni.edu')
        cls.lec_user = User.objects.create_user(username='pdfuser', password='Lec@1234')
        UserProfile.objects.create(
            user=cls.lec_user, role='LECTURER', lecturer=cls.lec, must_change_password=False,
        )

        # Create some schedule data for the PDF
        cls.course = Course.objects.create(code='PDF1', name='PDF Course')
        cls.venue = Venue.objects.create(code='PV1', name='PDF Venue')
        cls.group = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        cls.ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        ScheduleSlot.objects.create(
            timeslot=cls.ts, course=cls.course, lecturer=cls.lec,
            venue=cls.venue, group=cls.group, semester='S2-2026',
        )

    def setUp(self):
        token = RefreshToken.for_user(self.lec_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_export_pdf_status_200(self):
        resp = self.client.get(EXPORT_PDF_URL, {'level': 'I', 'stream': 'physical', 'semester': 'S2-2026'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_export_pdf_content_type(self):
        resp = self.client.get(EXPORT_PDF_URL, {'level': 'I', 'stream': 'physical', 'semester': 'S2-2026'})
        self.assertEqual(resp['Content-Type'], 'application/pdf')

    def test_export_pdf_not_empty(self):
        resp = self.client.get(EXPORT_PDF_URL, {'level': 'I', 'stream': 'physical', 'semester': 'S2-2026'})
        self.assertGreater(len(resp.content), 0)

    def test_export_pdf_content_disposition(self):
        resp = self.client.get(EXPORT_PDF_URL, {'level': 'I', 'stream': 'physical', 'semester': 'S2-2026'})
        self.assertIn('attachment', resp.get('Content-Disposition', ''))
        self.assertIn('.pdf', resp.get('Content-Disposition', ''))

    def test_unauthenticated_export_denied(self):
        self.client.credentials()  # remove auth
        resp = self.client.get(EXPORT_PDF_URL)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_empty_timetable(self):
        """Exporting a timetable with no data should still return a valid PDF."""
        resp = self.client.get(EXPORT_PDF_URL, {'level': 'III', 'stream': 'bio', 'semester': 'S1-2020'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
