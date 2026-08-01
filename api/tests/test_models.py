"""
Tests for all 11 models: object creation, __str__, unique constraints, ordering.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from api.models import (
    Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot,
    LecturerRequest, LecturerNotification, Announcement,
    StudentNotification, UserProfile,
)

User = get_user_model()


class CourseModelTests(TestCase):

    def test_create_course(self):
        course = Course.objects.create(code='CS101', name='Intro to CS', credits=3)
        self.assertEqual(course.code, 'CS101')
        self.assertEqual(course.name, 'Intro to CS')
        self.assertEqual(course.credits, 3)

    def test_str(self):
        course = Course.objects.create(code='CS101', name='Intro to CS')
        self.assertIn('CS101', str(course))
        self.assertIn('Intro to CS', str(course))

    def test_unique_code(self):
        Course.objects.create(code='CS101', name='First')
        with self.assertRaises(IntegrityError):
            Course.objects.create(code='CS101', name='Second')

    def test_ordering(self):
        Course.objects.create(code='ZZ999', name='Last')
        Course.objects.create(code='AA100', name='First')
        codes = list(Course.objects.values_list('code', flat=True))
        self.assertEqual(codes, sorted(codes))

    def test_default_credits(self):
        course = Course.objects.create(code='CS102', name='Data Structures')
        self.assertEqual(course.credits, 3)


class LecturerModelTests(TestCase):

    def test_create_lecturer(self):
        lec = Lecturer.objects.create(name='Dr. Smith', email='smith@uni.edu', department='CS')
        self.assertEqual(lec.name, 'Dr. Smith')
        self.assertEqual(lec.email, 'smith@uni.edu')

    def test_str(self):
        lec = Lecturer.objects.create(name='Dr. Smith', email='smith@uni.edu')
        self.assertEqual(str(lec), 'Dr. Smith')

    def test_unique_email(self):
        Lecturer.objects.create(name='A', email='same@uni.edu')
        with self.assertRaises(IntegrityError):
            Lecturer.objects.create(name='B', email='same@uni.edu')

    def test_unique_lecturer_id(self):
        Lecturer.objects.create(name='A', email='a@uni.edu', lecturer_id='LEC-001')
        with self.assertRaises(IntegrityError):
            Lecturer.objects.create(name='B', email='b@uni.edu', lecturer_id='LEC-001')

    def test_ordering(self):
        Lecturer.objects.create(name='Zara', email='z@uni.edu')
        Lecturer.objects.create(name='Anna', email='a@uni.edu')
        names = list(Lecturer.objects.values_list('name', flat=True))
        self.assertEqual(names, sorted(names))

    def test_must_change_password_default(self):
        lec = Lecturer.objects.create(name='Dr. X', email='x@uni.edu')
        self.assertTrue(lec.must_change_password)


class VenueModelTests(TestCase):

    def test_create_venue(self):
        venue = Venue.objects.create(code='LH1', name='Lecture Hall 1', capacity=200, venue_type='lecture')
        self.assertEqual(venue.code, 'LH1')
        self.assertEqual(venue.capacity, 200)

    def test_str(self):
        venue = Venue.objects.create(code='LH1', name='Lecture Hall 1')
        self.assertEqual(str(venue), 'LH1')

    def test_unique_code(self):
        Venue.objects.create(code='LH1', name='A')
        with self.assertRaises(IntegrityError):
            Venue.objects.create(code='LH1', name='B')

    def test_default_capacity(self):
        venue = Venue.objects.create(code='LH2', name='Hall 2')
        self.assertEqual(venue.capacity, 100)

    def test_default_venue_type(self):
        venue = Venue.objects.create(code='LH3', name='Hall 3')
        self.assertEqual(venue.venue_type, 'lecture')

    def test_ordering(self):
        Venue.objects.create(code='ZZ', name='Z')
        Venue.objects.create(code='AA', name='A')
        codes = list(Venue.objects.values_list('code', flat=True))
        self.assertEqual(codes, sorted(codes))


class StudentGroupModelTests(TestCase):

    def test_create_group(self):
        grp = StudentGroup.objects.create(level='I', stream='physical', subgroup='A', year='2026')
        self.assertEqual(grp.level, 'I')
        self.assertEqual(grp.stream, 'physical')

    def test_str(self):
        grp = StudentGroup.objects.create(level='I', stream='physical', subgroup='A', year='2026')
        s = str(grp)
        self.assertIn('Level I', s)
        self.assertIn('Physical Science', s)
        self.assertIn('A', s)

    def test_str_no_subgroup(self):
        grp = StudentGroup.objects.create(level='II', stream='bio', subgroup='', year='2026')
        s = str(grp)
        self.assertIn('Level II', s)
        self.assertIn('Bio Science', s)

    def test_unique_together(self):
        StudentGroup.objects.create(level='I', stream='physical', subgroup='A', year='2026')
        with self.assertRaises(IntegrityError):
            StudentGroup.objects.create(level='I', stream='physical', subgroup='A', year='2026')

    def test_ordering(self):
        StudentGroup.objects.create(level='III', stream='bio', year='2026')
        StudentGroup.objects.create(level='I', stream='physical', year='2026')
        levels = list(StudentGroup.objects.values_list('level', flat=True))
        self.assertEqual(levels, sorted(levels))


class TimeSlotModelTests(TestCase):

    def test_create_timeslot(self):
        ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        self.assertEqual(ts.day, 'Monday')

    def test_str(self):
        ts = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        s = str(ts)
        self.assertIn('Monday', s)
        self.assertIn('08:00', s)

    def test_unique_together(self):
        TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        with self.assertRaises(IntegrityError):
            TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')

    def test_ordering(self):
        TimeSlot.objects.create(day='Monday', start_time='10:00', end_time='11:00')
        TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')
        times = list(TimeSlot.objects.values_list('start_time', flat=True))
        self.assertEqual(times, sorted(times))


class ScheduleSlotModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.course = Course.objects.create(code='CS101', name='Intro')
        cls.lecturer = Lecturer.objects.create(name='Dr. A', email='a@uni.edu')
        cls.venue = Venue.objects.create(code='LH1', name='Hall 1')
        cls.group = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        cls.timeslot = TimeSlot.objects.create(day='Monday', start_time='08:00', end_time='09:00')

    def test_create_schedule_slot(self):
        slot = ScheduleSlot.objects.create(
            timeslot=self.timeslot, course=self.course,
            lecturer=self.lecturer, venue=self.venue,
            group=self.group, semester='S2-2026',
        )
        self.assertEqual(slot.semester, 'S2-2026')

    def test_str(self):
        slot = ScheduleSlot.objects.create(
            timeslot=self.timeslot, course=self.course,
            lecturer=self.lecturer, venue=self.venue,
            group=self.group,
        )
        s = str(slot)
        self.assertIn('CS101', s)
        self.assertIn('LH1', s)

    def test_default_semester(self):
        slot = ScheduleSlot.objects.create(
            timeslot=self.timeslot, course=self.course,
            lecturer=self.lecturer, venue=self.venue,
            group=self.group,
        )
        self.assertEqual(slot.semester, 'S2-2026')


class UserProfileModelTests(TestCase):

    def test_create_admin_profile(self):
        user = User.objects.create_user(username='testadmin', password='pass1234')
        profile = UserProfile.objects.create(user=user, role='ADMIN')
        self.assertEqual(profile.role, 'ADMIN')
        self.assertTrue(profile.must_change_password)

    def test_str(self):
        user = User.objects.create_user(username='testuser', password='pass1234')
        profile = UserProfile.objects.create(user=user, role='STUDENT')
        s = str(profile)
        self.assertIn('testuser', s)
        self.assertIn('STUDENT', s)

    def test_unique_registration_number(self):
        u1 = User.objects.create_user(username='s1', password='pass1234')
        u2 = User.objects.create_user(username='s2', password='pass1234')
        UserProfile.objects.create(user=u1, role='STUDENT', registration_number='REG-001')
        with self.assertRaises(IntegrityError):
            UserProfile.objects.create(user=u2, role='STUDENT', registration_number='REG-001')

    def test_user_one_to_one(self):
        user = User.objects.create_user(username='onetoone', password='pass1234')
        UserProfile.objects.create(user=user, role='ADMIN')
        with self.assertRaises(IntegrityError):
            UserProfile.objects.create(user=user, role='LECTURER')


class LecturerRequestModelTests(TestCase):

    def test_create_request(self):
        lec = Lecturer.objects.create(name='Dr. B', email='b@uni.edu')
        req = LecturerRequest.objects.create(
            lecturer=lec, request_type='AVAILABILITY', reason='Conference',
        )
        self.assertEqual(req.status, 'PENDING')
        self.assertEqual(req.request_type, 'AVAILABILITY')

    def test_str(self):
        lec = Lecturer.objects.create(name='Dr. B', email='b@uni.edu')
        req = LecturerRequest.objects.create(lecturer=lec, request_type='CHANGE')
        s = str(req)
        self.assertIn('Dr. B', s)
        self.assertIn('CHANGE', s)
        self.assertIn('PENDING', s)


class LecturerNotificationModelTests(TestCase):

    def test_create_notification(self):
        lec = Lecturer.objects.create(name='Dr. C', email='c@uni.edu')
        notif = LecturerNotification.objects.create(
            lecturer=lec, notification_type='CHANGE',
            title='Test', message='Test message',
        )
        self.assertFalse(notif.is_read)

    def test_str(self):
        lec = Lecturer.objects.create(name='Dr. C', email='c@uni.edu')
        notif = LecturerNotification.objects.create(
            lecturer=lec, notification_type='CANCEL',
            title='Cancelled', message='msg',
        )
        self.assertIn('Dr. C', str(notif))
        self.assertIn('Cancelled', str(notif))


class AnnouncementModelTests(TestCase):

    def test_create_announcement(self):
        ann = Announcement.objects.create(title='Notice', message='Hello', audience='FACULTY')
        self.assertEqual(ann.audience, 'FACULTY')

    def test_str(self):
        ann = Announcement.objects.create(title='Notice', message='Hello')
        self.assertEqual(str(ann), 'Notice')


class StudentNotificationModelTests(TestCase):

    def test_create_notification(self):
        grp = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        notif = StudentNotification.objects.create(
            student_group=grp, notification_type='GENERAL',
            title='Test', message='Hello',
        )
        self.assertFalse(notif.is_read)

    def test_str(self):
        grp = StudentGroup.objects.create(level='I', stream='physical', year='2026')
        notif = StudentNotification.objects.create(
            student_group=grp, notification_type='RESCHEDULE',
            title='Rescheduled', message='msg',
        )
        self.assertIn('Rescheduled', str(notif))
