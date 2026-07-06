from django.contrib import admin
from .models import Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, UserProfile, Announcement, StudentNotification

@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(admin.ModelAdmin):
    list_display = ['course', 'timeslot', 'venue', 'lecturer', 'group', 'semester']
    list_filter = ['timeslot__day', 'group__level', 'group__stream', 'semester']

admin.site.register(Course)
admin.site.register(Lecturer)
admin.site.register(Venue)
admin.site.register(StudentGroup)
admin.site.register(TimeSlot)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'lecturer', 'student_group', 'registration_number', 'contact_number', 'must_change_password']
    list_filter = ['role', 'must_change_password']


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'audience', 'student_group', 'published_at']
    list_filter = ['audience', 'published_at']


@admin.register(StudentNotification)
class StudentNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'student_group', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
