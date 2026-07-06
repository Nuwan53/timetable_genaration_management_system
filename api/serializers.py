from rest_framework import serializers
from .models import (
    Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot,
    LecturerRequest, LecturerNotification, Announcement, StudentNotification,
)


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


class StudentProfileSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    contact_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    avatar = serializers.FileField(required=False, allow_null=True)
    registration_number = serializers.CharField(read_only=True)
    student_group = StudentGroupSerializer(read_only=True)
    student_group_id = serializers.IntegerField(read_only=True)
    avatar_url = serializers.CharField(read_only=True)
    enrolled_subjects = serializers.ListField(read_only=True)

    def to_representation(self, instance):
        request = self.context.get('request')
        user = instance.user

        avatar_url = None
        if instance.avatar:
            avatar_url = instance.avatar.url
            if request is not None:
                avatar_url = request.build_absolute_uri(avatar_url)

        subjects = []
        seen_course_ids = set()
        if instance.student_group_id:
            slots = ScheduleSlot.objects.select_related('course').filter(group=instance.student_group).order_by('course__code', 'course__name')
            for slot in slots:
                if slot.course_id in seen_course_ids:
                    continue
                seen_course_ids.add(slot.course_id)
                subjects.append(CourseSerializer(slot.course).data)

        return {
            'name': user.get_full_name().strip() or user.username,
            'email': user.email,
            'contact_number': instance.contact_number or '',
            'registration_number': instance.registration_number or '',
            'student_group': StudentGroupSerializer(instance.student_group).data if instance.student_group else None,
            'student_group_id': instance.student_group_id,
            'avatar_url': avatar_url,
            'enrolled_subjects': subjects,
        }

    def validate_avatar(self, value):
        allowed_types = {'image/jpeg', 'image/png'}
        content_type = getattr(value, 'content_type', '')
        filename = value.name.lower()

        if value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError('Avatar must be 2 MB or smaller.')

        if content_type not in allowed_types and not filename.endswith(('.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError('Avatar must be a JPG or PNG image.')

        return value

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        email = validated_data.pop('email', None)
        contact_number = validated_data.pop('contact_number', None)
        avatar = validated_data.pop('avatar', None)

        user = instance.user

        if name is not None:
            parts = [part for part in str(name).split() if part]
            user.first_name = parts[0] if parts else ''
            user.last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''

        if email is not None:
            user.email = email

        if contact_number is not None:
            instance.contact_number = contact_number

        if avatar is not None:
            instance.avatar = avatar

        user.save(update_fields=['first_name', 'last_name', 'email'])
        instance.save(update_fields=['contact_number', 'avatar'])
        return instance


class LecturerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lecturer
        fields = ['id', 'name', 'email', 'department']


class LecturerRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LecturerRequest
        fields = '__all__'
        read_only_fields = ['lecturer', 'status', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']


class LecturerNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LecturerNotification
        fields = '__all__'
        read_only_fields = ['lecturer', 'notification_type', 'title', 'message', 'schedule_slot', 'is_read', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    student_group = StudentGroupSerializer(read_only=True)

    class Meta:
        model = Announcement
        fields = '__all__'


class StudentNotificationSerializer(serializers.ModelSerializer):
    student_group = StudentGroupSerializer(read_only=True)
    schedule_slot = ScheduleSlotReadSerializer(read_only=True)

    class Meta:
        model = StudentNotification
        fields = '__all__'
