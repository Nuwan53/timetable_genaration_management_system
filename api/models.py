from django.contrib.auth.models import User
from django.db import models


class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    credits = models.DecimalField(max_digits=3, decimal_places=1, default=3)
    department = models.CharField(max_length=100, blank=True)
    lecture_hours = models.PositiveIntegerField(default=0)
    lab_hours = models.PositiveIntegerField(default=0)
    total_hours = models.PositiveIntegerField(default=0)

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


class AcademicStream(models.Model):
    STREAM_TYPE_CHOICES = [
        ('Biological', 'Biological Science'),
        ('Physical', 'Physical Science'),
    ]
    
    name = models.CharField(max_length=150)
    stream_type = models.CharField(max_length=20, choices=STREAM_TYPE_CHOICES)
    icon = models.CharField(max_length=20, default='leaf')
    summary = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_stream_type_display()})"

    class Meta:
        ordering = ['name']
        unique_together = ('name', 'stream_type')


class AcademicLevel(models.Model):
    stream = models.ForeignKey(AcademicStream, on_delete=models.CASCADE, related_name='levels')
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=150)
    summary = models.CharField(max_length=200, blank=True)
    expanded = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.stream.name} - {self.code}: {self.name}"

    class Meta:
        ordering = ['stream', 'order', 'code']
        unique_together = ('stream', 'code')


class AcademicPathway(models.Model):
    level = models.ForeignKey(AcademicLevel, on_delete=models.CASCADE, related_name='pathways')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    students_count = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.level.code} - {self.name}"

    class Meta:
        ordering = ['level', 'order', 'name']
        unique_together = ('level', 'name')


class PracticalGroup(models.Model):
    level = models.ForeignKey(AcademicLevel, on_delete=models.CASCADE, related_name='practical_groups')
    name = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.level.code} - {self.name}"

    class Meta:
        ordering = ['level', 'order', 'name']
        unique_together = ('level', 'name')


class StudentGroup(models.Model):
    LEVEL_CHOICES = [('I', 'Level I'), ('II', 'Level II'), ('III', 'Level III')]
    STREAM_CHOICES = [('physical', 'Physical Science'), ('bio', 'Bio Science'), ('both', 'Both')]

    level = models.CharField(max_length=5, choices=LEVEL_CHOICES)
    stream = models.CharField(max_length=10, choices=STREAM_CHOICES)
    subgroup = models.CharField(max_length=10, blank=True)
    year = models.CharField(max_length=4, default='2024')
    academic_level = models.ForeignKey(AcademicLevel, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_groups')

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


class LecturerRequest(models.Model):
    REQUEST_TYPES = [
        ('AVAILABILITY', 'Availability / Leave'),
        ('CHANGE', 'Change Request'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    schedule_slot = models.ForeignKey(ScheduleSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='lecturer_requests')
    requested_date = models.DateField(null=True, blank=True)
    requested_start = models.TimeField(null=True, blank=True)
    requested_end = models.TimeField(null=True, blank=True)
    requested_room = models.CharField(max_length=30, blank=True)
    reason = models.TextField(blank=True)
    admin_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_lecturer_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.lecturer.name} - {self.request_type} - {self.status}'


class LecturerNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('CHANGE', 'Schedule Change'),
        ('CANCEL', 'Cancellation'),
        ('REASSIGN', 'Reassignment'),
        ('CONFLICT', 'Conflict Warning'),
        ('REQUEST', 'Request Update'),
    ]

    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=150)
    message = models.TextField()
    schedule_slot = models.ForeignKey(ScheduleSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.lecturer.name} - {self.title}'


class PublicationRecord(models.Model):
    STATUS_CHOICES = [
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]

    version = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PUBLISHED')
    publisher = models.CharField(max_length=100)
    initials = models.CharField(max_length=4, blank=True)
    notes = models.TextField(blank=True)
    published_at = models.DateTimeField(auto_now_add=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.version} - {self.status}'

    class Meta:
        ordering = ['-published_at', '-id']


class ScheduleAnalytics(models.Model):
    """Stores aggregated schedule analytics data"""
    date = models.DateField(auto_now_add=True)
    period = models.CharField(max_length=20, default='daily')  # daily, weekly, monthly
    
    utilization_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # 0-100
    pending_conflicts = models.PositiveIntegerField(default=0)
    avg_lecturer_load = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # hours
    resource_efficiency = models.CharField(max_length=2, default='A+')  # A+, A, B, C, etc
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analytics - {self.date} ({self.period})"

    class Meta:
        ordering = ['-date']
        unique_together = ('date', 'period')


class VenueUtilization(models.Model):
    """Tracks hourly venue utilization"""
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='utilization_records')
    day_of_week = models.CharField(max_length=10)  # Monday-Friday
    hour = models.TimeField()  # 08:00, 10:00, etc
    utilization_level = models.PositiveIntegerField(default=0)  # 0-5 scale
    date = models.DateField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.venue.code} - {self.day_of_week} {self.hour}"

    class Meta:
        ordering = ['venue', 'day_of_week', 'hour']
        unique_together = ('venue', 'day_of_week', 'hour', 'date')


class ConflictResolution(models.Model):
    """Tracks schedule conflicts and their resolution"""
    CONFLICT_TYPES = [
        ('VENUE_DOUBLE_BOOKING', 'Room Double-Booking'),
        ('LECTURER_OVERLAP', 'Lecturer Overlap'),
        ('RESOURCE_CONFLICT', 'Resource Conflict'),
        ('STUDENT_OVERLAP', 'Student Group Overlap'),
        ('OTHER', 'Other'),
    ]
    
    RESOLUTION_STATUS = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
    ]
    
    conflict_type = models.CharField(max_length=30, choices=CONFLICT_TYPES)
    entity = models.CharField(max_length=200)  # Description of conflicting entity
    schedule_slot = models.ForeignKey(ScheduleSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='conflicts')
    
    status = models.CharField(max_length=20, choices=RESOLUTION_STATUS, default='PENDING')
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_conflicts')
    resolution_method = models.CharField(max_length=100, blank=True)  # Auto-Optimizer, Admin, etc
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_conflict_type_display()} - {self.entity}"

    class Meta:
        ordering = ['-created_at']


class LecturerAnalytics(models.Model):
    """Stores per-lecturer workload analytics"""
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='analytics_records')
    date = models.DateField(auto_now_add=True)
    period = models.CharField(max_length=20, default='weekly')  # weekly, monthly
    
    teaching_load = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    research_load = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    admin_load = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # hours per week
    overloaded = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.lecturer.name} - {self.date}"

    class Meta:
        ordering = ['-date', 'lecturer']
        unique_together = ('lecturer', 'date', 'period')


class StudentGroupAnalytics(models.Model):
    """Stores per-student-group load analytics"""
    TREND_CHOICES = [
        ('UP', 'Increasing'),
        ('DOWN', 'Decreasing'),
        ('STEADY', 'Stable'),
    ]
    
    student_group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='analytics_records')
    date = models.DateField(auto_now_add=True)
    period = models.CharField(max_length=20, default='weekly')
    
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # hours per week
    trend = models.CharField(max_length=10, choices=TREND_CHOICES, default='STEADY')
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student_group} - {self.date}"

    class Meta:
        ordering = ['-date', 'student_group']
        unique_together = ('student_group', 'date', 'period')


class Announcement(models.Model):
    AUDIENCE_CHOICES = [
        ('FACULTY', 'Faculty-wide'),
        ('BATCH', 'Batch-wide'),
        ('GROUP', 'Student group'),
    ]

    title = models.CharField(max_length=150)
    message = models.TextField()
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='FACULTY')
    student_group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    published_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class StudentNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('RESCHEDULE', 'Class reschedule'),
        ('CANCEL', 'Class cancellation'),
        ('ROOM_CHANGE', 'Room change'),
        ('GENERAL', 'General notice'),
    ]

    student_group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='student_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=150)
    message = models.TextField()
    schedule_slot = models.ForeignKey(ScheduleSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.student_group} - {self.title}'


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
    registration_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    contact_number = models.CharField(max_length=30, blank=True, null=True)
    avatar = models.FileField(upload_to='student_avatars/', blank=True, null=True)
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.user.username} ({self.role})'


class SystemSettings(models.Model):
    """Singleton model for system-wide settings and configuration"""
    SEMESTER_CHOICES = [
        ('First Semester', 'First Semester'),
        ('Second Semester', 'Second Semester'),
    ]

    # Academic parameters
    academic_year = models.CharField(max_length=20, default='2024/2025')
    semester_type = models.CharField(max_length=20, choices=SEMESTER_CHOICES, default='First Semester')
    teaching_start = models.DateField()
    teaching_end = models.DateField()
    
    # Time slot definitions
    standard_lecture = models.BooleanField(default=True, help_text='Fixed 50-minute blocks')
    laboratory_session = models.BooleanField(default=True, help_text='Extended 3-hour blocks')
    tutorial_workshop = models.BooleanField(default=False, help_text='Flexible 1-2 hour blocks')
    
    # Notification preferences
    conflict_alerts = models.BooleanField(default=True)
    publication_confirmations = models.BooleanField(default=True)
    email_list = models.TextField(default='faculty-staff@ruh.ac.lk', help_text='Comma-separated email addresses')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name_plural = "System Settings"

    def __str__(self):
        return f"System Settings - {self.academic_year} ({self.semester_type})"

    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings


class VenueDefault(models.Model):
    """Departmental default venues for scheduling"""
    department = models.CharField(max_length=200)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='default_for_departments')
    priority = models.CharField(
        max_length=10, 
        choices=[('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low')],
        default='MEDIUM'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('department', 'venue')
        verbose_name_plural = "Venue Defaults"

    def __str__(self):
        return f"{self.department} - {self.venue.name}"
