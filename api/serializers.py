from rest_framework import serializers
from .models import Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class LecturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lecturer
        fields = '__all__'


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = '__all__'


class StudentGroupSerializer(serializers.ModelSerializer):
    display = serializers.SerializerMethodField()

    class Meta:
        model = StudentGroup
        fields = '__all__'

    def get_display(self, obj):
        return str(obj)


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = '__all__'


class ScheduleSlotReadSerializer(serializers.ModelSerializer):
    """Used for GET — returns full nested objects."""
    timeslot = TimeSlotSerializer()
    course = CourseSerializer()
    lecturer = LecturerSerializer()
    venue = VenueSerializer()
    group = StudentGroupSerializer()

    class Meta:
        model = ScheduleSlot
        fields = '__all__'


class ScheduleSlotWriteSerializer(serializers.ModelSerializer):
    """Used for POST/PUT — accepts FK ids and validates conflicts."""

    class Meta:
        model = ScheduleSlot
        fields = '__all__'

    def _check_conflicts(self, timeslot, venue, lecturer, group, exclude_id=None):
        qs = ScheduleSlot.objects.filter(timeslot=timeslot)
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)

        errors = []

        if qs.filter(venue=venue).exists():
            clash = qs.filter(venue=venue).first()
            errors.append(
                f"Venue conflict: {venue.code} is already used by "
                f"{clash.course.code} at this time slot."
            )

        if qs.filter(lecturer=lecturer).exists():
            clash = qs.filter(lecturer=lecturer).first()
            errors.append(
                f"Lecturer conflict: {lecturer.name} already has "
                f"{clash.course.code} at this time slot."
            )

        if qs.filter(group=group).exists():
            clash = qs.filter(group=group).first()
            errors.append(
                f"Student group conflict: {group} already has "
                f"{clash.course.code} at this time slot."
            )

        return errors

    def validate(self, data):
        timeslot = data.get('timeslot')
        venue = data.get('venue')
        lecturer = data.get('lecturer')
        group = data.get('group')
        exclude_id = self.instance.pk if self.instance else None

        errors = self._check_conflicts(timeslot, venue, lecturer, group, exclude_id)
        if errors:
            raise serializers.ValidationError({'conflicts': errors})

        return data


class AuthUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    role = serializers.CharField()
    must_change_password = serializers.BooleanField()
    lecturer_id = serializers.IntegerField(required=False, allow_null=True)
    student_group_id = serializers.IntegerField(required=False, allow_null=True)
