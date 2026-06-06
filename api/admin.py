from django.contrib import admin
from .models import Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot

@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(admin.ModelAdmin):
    list_display = ['course', 'timeslot', 'venue', 'lecturer', 'group', 'semester']
    list_filter = ['timeslot__day', 'group__level', 'group__stream', 'semester']

admin.site.register(Course)
admin.site.register(Lecturer)
admin.site.register(Venue)
admin.site.register(StudentGroup)
admin.site.register(TimeSlot)
