from django.contrib.auth.models import User
from django.db import models


class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    credits = models.PositiveSmallIntegerField(default=3)

    def __str__(self):
        return f"{self.code} — {self.name}"

    class Meta:
        ordering = ['code']


class Lecturer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Venue(models.Model):
    VENUE_TYPES = [
        ('lecture', 'Lecture Hall'),
        ('lab', 'Laboratory'),
        ('auditorium', 'Auditorium'),
    ]
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField(default=100)
    venue_type = models.CharField(max_length=20, choices=VENUE_TYPES, default='lecture')

    def __str__(self):
        return self.code

    class Meta:
        ordering = ['code']


class StudentGroup(models.Model):
    LEVEL_CHOICES = [('I', 'Level I'), ('II', 'Level II'), ('III', 'Level III')]
    STREAM_CHOICES = [('physical', 'Physical Science'), ('bio', 'Bio Science'), ('both', 'Both')]

    level = models.CharField(max_length=5, choices=LEVEL_CHOICES)
    stream = models.CharField(max_length=10, choices=STREAM_CHOICES)
    subgroup = models.CharField(max_length=10, blank=True)
    year = models.CharField(max_length=4, default='2024')

    def __str__(self):
        sub = f" ({self.subgroup})" if self.subgroup else ""
        return f"Level {self.level} — {self.get_stream_display()}{sub}"

    class Meta:
        unique_together = ('level', 'stream', 'subgroup', 'year')
        ordering = ['level', 'stream', 'subgroup']


class TimeSlot(models.Model):
    DAY_CHOICES = [
        ('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'), ('Friday', 'Friday'),
    ]
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.day} {self.start_time.strftime('%H:%M')}–{self.end_time.strftime('%H:%M')}"

    class Meta:
        ordering = ['day', 'start_time']
        unique_together = ('day', 'start_time', 'end_time')


class ScheduleSlot(models.Model):
    timeslot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='schedule_slots')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedule_slots')
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='schedule_slots')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='schedule_slots')
    group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='schedule_slots')
    semester = models.CharField(max_length=20, default='S2-2026')
    notes = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.course.code} | {self.timeslot} | {self.venue.code}"

    class Meta:
        ordering = ['timeslot__day', 'timeslot__start_time']


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('LECTURER', 'Lecturer'),
        ('STUDENT', 'Student'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    lecturer = models.ForeignKey(Lecturer, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profiles')
    student_group = models.ForeignKey(StudentGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profiles')
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.user.username} ({self.role})'
