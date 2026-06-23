from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import (
    UserProfile, Course, Lecturer, Venue, StudentGroup, TimeSlot,
    ScheduleSlot, StudentEnrollment
)
from datetime import time


class Command(BaseCommand):
    help = 'Load sample/seed data for testing and development'

    def handle(self, *args, **options):
        self.stdout.write("Loading sample data...")
        
        # Clear existing data (optional)
        # ScheduleSlot.objects.all().delete()
        # StudentEnrollment.objects.all().delete()
        # UserProfile.objects.all().delete()
        # User.objects.all().delete()

        # ── Create Admin User ────────────────────────────────────────────────
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@university.edu',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Created admin user: {admin_user.username}'))
        
        # Ensure admin has admin profile
        admin_profile, _ = UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={'role': 'admin'}
        )

        # ── Create Lecturers & Lecturer Users ────────────────────────────────
        lecturers_data = [
            {'name': 'Dr. John Smith', 'email': 'j.smith@university.edu', 'department': 'Mathematics'},
            {'name': 'Dr. Sarah Johnson', 'email': 's.johnson@university.edu', 'department': 'Physics'},
            {'name': 'Dr. Michael Williams', 'email': 'm.williams@university.edu', 'department': 'Chemistry'},
            {'name': 'Dr. Emma Brown', 'email': 'e.brown@university.edu', 'department': 'Biology'},
            {'name': 'Prof. James Wilson', 'email': 'j.wilson@university.edu', 'department': 'Computer Science'},
            {'name': 'Dr. Lisa Anderson', 'email': 'l.anderson@university.edu', 'department': 'Mathematics'},
        ]
        
        lecturers = []
        for lect_data in lecturers_data:
            lecturer, created = Lecturer.objects.get_or_create(
                email=lect_data['email'],
                defaults={
                    'name': lect_data['name'],
                    'department': lect_data['department']
                }
            )
            if created:
                self.stdout.write(f'✓ Created lecturer: {lecturer.name}')
            
            # Create lecturer user account
            username = lect_data['email'].split('@')[0]
            user, user_created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': lect_data['email'],
                    'first_name': lect_data['name'].split()[1] if len(lect_data['name'].split()) > 1 else '',
                    'last_name': lect_data['name'].split()[-1],
                }
            )
            if user_created:
                user.set_password('lecturer123')
                user.save()
                # Create lecturer profile
                profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'role': 'lecturer'}
                )
            
            lecturers.append(lecturer)

        # ── Create Courses ───────────────────────────────────────────────────
        courses_data = [
            {'code': 'MAT101', 'name': 'Calculus I', 'credits': 4},
            {'code': 'MAT102', 'name': 'Linear Algebra', 'credits': 3},
            {'code': 'PHY101', 'name': 'Physics I', 'credits': 4},
            {'code': 'PHY102', 'name': 'Physics II', 'credits': 4},
            {'code': 'CHM101', 'name': 'Chemistry I', 'credits': 3},
            {'code': 'CHM102', 'name': 'Chemistry II', 'credits': 3},
            {'code': 'BIO101', 'name': 'Biology I', 'credits': 3},
            {'code': 'BIO102', 'name': 'Biology II', 'credits': 3},
            {'code': 'CSC101', 'name': 'Programming I', 'credits': 4},
            {'code': 'CSC102', 'name': 'Programming II', 'credits': 4},
            {'code': 'ENG101', 'name': 'English I', 'credits': 2},
            {'code': 'ENG102', 'name': 'English II', 'credits': 2},
        ]
        
        courses = []
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                code=course_data['code'],
                defaults={
                    'name': course_data['name'],
                    'credits': course_data['credits']
                }
            )
            if created:
                self.stdout.write(f'✓ Created course: {course.code}')
            courses.append(course)

        # ── Create Venues ───────────────────────────────────────────────────
        venues_data = [
            {'code': 'H-101', 'name': 'Lecture Hall 101', 'capacity': 100, 'venue_type': 'lecture'},
            {'code': 'H-102', 'name': 'Lecture Hall 102', 'capacity': 80, 'venue_type': 'lecture'},
            {'code': 'H-103', 'name': 'Lecture Hall 103', 'capacity': 120, 'venue_type': 'lecture'},
            {'code': 'LAB-A', 'name': 'Lab A', 'capacity': 40, 'venue_type': 'lab'},
            {'code': 'LAB-B', 'name': 'Lab B', 'capacity': 40, 'venue_type': 'lab'},
            {'code': 'AUD-1', 'name': 'Auditorium 1', 'capacity': 300, 'venue_type': 'auditorium'},
            {'code': 'H-104', 'name': 'Lecture Hall 104', 'capacity': 90, 'venue_type': 'lecture'},
            {'code': 'H-105', 'name': 'Lecture Hall 105', 'capacity': 75, 'venue_type': 'lecture'},
            {'code': 'LAB-C', 'name': 'Lab C', 'capacity': 50, 'venue_type': 'lab'},
            {'code': 'LAB-D', 'name': 'Lab D', 'capacity': 35, 'venue_type': 'lab'},
        ]
        
        venues = []
        for venue_data in venues_data:
            venue, created = Venue.objects.get_or_create(
                code=venue_data['code'],
                defaults={
                    'name': venue_data['name'],
                    'capacity': venue_data['capacity'],
                    'venue_type': venue_data['venue_type']
                }
            )
            if created:
                self.stdout.write(f'✓ Created venue: {venue.code}')
            venues.append(venue)

        # ── Create Student Groups ────────────────────────────────────────────
        groups_data = [
            {'level': 'I', 'stream': 'physical', 'subgroup': '', 'year': '2026'},
            {'level': 'I', 'stream': 'bio', 'subgroup': '', 'year': '2026'},
            {'level': 'II', 'stream': 'physical', 'subgroup': 'W01', 'year': '2025'},
            {'level': 'II', 'stream': 'physical', 'subgroup': 'W02', 'year': '2025'},
            {'level': 'II', 'stream': 'bio', 'subgroup': '', 'year': '2025'},
            {'level': 'III', 'stream': 'physical', 'subgroup': '', 'year': '2024'},
        ]
        
        groups = []
        for group_data in groups_data:
            try:
                group, created = StudentGroup.objects.get_or_create(
                    level=group_data['level'],
                    stream=group_data['stream'],
                    subgroup=group_data['subgroup'],
                    year=group_data['year']
                )
                if created:
                    self.stdout.write(f'✓ Created group: {group}')
                groups.append(group)
            except Exception as e:
                self.stdout.write(f'✗ Failed to create group: {e}')

        # ── Create Time Slots ────────────────────────────────────────────────
        timeslots_data = [
            {'day': 'Monday', 'start_time': time(8, 0), 'end_time': time(9, 0)},
            {'day': 'Monday', 'start_time': time(9, 0), 'end_time': time(10, 0)},
            {'day': 'Monday', 'start_time': time(10, 0), 'end_time': time(11, 0)},
            {'day': 'Monday', 'start_time': time(11, 0), 'end_time': time(12, 0)},
            {'day': 'Monday', 'start_time': time(13, 0), 'end_time': time(14, 0)},
            {'day': 'Tuesday', 'start_time': time(8, 0), 'end_time': time(9, 0)},
            {'day': 'Tuesday', 'start_time': time(9, 0), 'end_time': time(10, 0)},
            {'day': 'Tuesday', 'start_time': time(10, 0), 'end_time': time(11, 0)},
            {'day': 'Tuesday', 'start_time': time(11, 0), 'end_time': time(12, 0)},
            {'day': 'Tuesday', 'start_time': time(13, 0), 'end_time': time(14, 0)},
            {'day': 'Wednesday', 'start_time': time(8, 0), 'end_time': time(9, 0)},
            {'day': 'Wednesday', 'start_time': time(9, 0), 'end_time': time(10, 0)},
            {'day': 'Wednesday', 'start_time': time(10, 0), 'end_time': time(11, 0)},
            {'day': 'Wednesday', 'start_time': time(11, 0), 'end_time': time(12, 0)},
            {'day': 'Thursday', 'start_time': time(8, 0), 'end_time': time(9, 0)},
            {'day': 'Thursday', 'start_time': time(9, 0), 'end_time': time(10, 0)},
            {'day': 'Thursday', 'start_time': time(10, 0), 'end_time': time(11, 0)},
            {'day': 'Thursday', 'start_time': time(11, 0), 'end_time': time(12, 0)},
            {'day': 'Friday', 'start_time': time(8, 0), 'end_time': time(9, 0)},
            {'day': 'Friday', 'start_time': time(9, 0), 'end_time': time(10, 0)},
            {'day': 'Friday', 'start_time': time(10, 0), 'end_time': time(11, 0)},
        ]
        
        timeslots = []
        for ts_data in timeslots_data:
            try:
                ts, created = TimeSlot.objects.get_or_create(
                    day=ts_data['day'],
                    start_time=ts_data['start_time'],
                    end_time=ts_data['end_time']
                )
                if created:
                    self.stdout.write(f'✓ Created timeslot: {ts}')
                timeslots.append(ts)
            except Exception as e:
                self.stdout.write(f'✗ Failed to create timeslot: {e}')

        # ── Create Schedule Slots (Sample Timetable) ──────────────────────────
        schedule_data = [
            # Level I Physical Science
            {'timeslot_idx': 0, 'course_idx': 0, 'lecturer_idx': 0, 'venue_idx': 0, 'group_idx': 0},
            {'timeslot_idx': 1, 'course_idx': 1, 'lecturer_idx': 1, 'venue_idx': 1, 'group_idx': 0},
            {'timeslot_idx': 2, 'course_idx': 2, 'lecturer_idx': 1, 'venue_idx': 2, 'group_idx': 0},
            {'timeslot_idx': 5, 'course_idx': 3, 'lecturer_idx': 2, 'venue_idx': 3, 'group_idx': 0},
            {'timeslot_idx': 10, 'course_idx': 8, 'lecturer_idx': 4, 'venue_idx': 4, 'group_idx': 0},
            
            # Level I Bio Science
            {'timeslot_idx': 0, 'course_idx': 4, 'lecturer_idx': 2, 'venue_idx': 0, 'group_idx': 1},
            {'timeslot_idx': 1, 'course_idx': 5, 'lecturer_idx': 2, 'venue_idx': 1, 'group_idx': 1},
            {'timeslot_idx': 2, 'course_idx': 6, 'lecturer_idx': 3, 'venue_idx': 2, 'group_idx': 1},
            {'timeslot_idx': 6, 'course_idx': 7, 'lecturer_idx': 3, 'venue_idx': 3, 'group_idx': 1},
            {'timeslot_idx': 14, 'course_idx': 10, 'lecturer_idx': 5, 'venue_idx': 5, 'group_idx': 1},
        ]
        
        slots_created = 0
        for slot_data in schedule_data:
            try:
                if (slot_data['timeslot_idx'] < len(timeslots) and
                    slot_data['course_idx'] < len(courses) and
                    slot_data['lecturer_idx'] < len(lecturers) and
                    slot_data['venue_idx'] < len(venues) and
                    slot_data['group_idx'] < len(groups)):
                    
                    slot, created = ScheduleSlot.objects.get_or_create(
                        timeslot=timeslots[slot_data['timeslot_idx']],
                        course=courses[slot_data['course_idx']],
                        lecturer=lecturers[slot_data['lecturer_idx']],
                        venue=venues[slot_data['venue_idx']],
                        group=groups[slot_data['group_idx']],
                        defaults={
                            'semester': 'S2-2026',
                            'notes': 'Sample schedule slot'
                        }
                    )
                    if created:
                        slots_created += 1
                        self.stdout.write(f'✓ Created schedule slot: {slot}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Failed to create schedule slot: {e}'))

        # ── Create Student Users & Enrollments ───────────────────────────────
        students_data = [
            {'username': 'student1', 'email': 'student1@university.edu', 'first_name': 'Alice', 'last_name': 'Wonder', 'group_idx': 0},
            {'username': 'student2', 'email': 'student2@university.edu', 'first_name': 'Bob', 'last_name': 'Smith', 'group_idx': 0},
            {'username': 'student3', 'email': 'student3@university.edu', 'first_name': 'Charlie', 'last_name': 'Brown', 'group_idx': 1},
            {'username': 'student4', 'email': 'student4@university.edu', 'first_name': 'Diana', 'last_name': 'Prince', 'group_idx': 1},
        ]
        
        for student_data in students_data:
            user, created = User.objects.get_or_create(
                username=student_data['username'],
                defaults={
                    'email': student_data['email'],
                    'first_name': student_data['first_name'],
                    'last_name': student_data['last_name'],
                }
            )
            if created:
                user.set_password('student123')
                user.save()
                # Create student profile
                profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'role': 'student'}
                )
                self.stdout.write(f'✓ Created student user: {user.username}')
            
            # Create enrollment
            if student_data['group_idx'] < len(groups):
                enrollment, created = StudentEnrollment.objects.get_or_create(
                    user=user,
                    group=groups[student_data['group_idx']],
                    semester='S2-2026'
                )
                if created:
                    self.stdout.write(f'✓ Enrolled {user.username} in {groups[student_data["group_idx"]]}')

        self.stdout.write(self.style.SUCCESS(f'\n✓ Sample data loaded successfully!'))
        self.stdout.write(self.style.SUCCESS(f'✓ Created {slots_created} schedule slots'))
        self.stdout.write(self.style.WARNING(f'\nTest Credentials:'))
        self.stdout.write(f'  Admin: admin / admin123')
        self.stdout.write(f'  Lecturer: j.smith / lecturer123')
        self.stdout.write(f'  Student: student1 / student123')
