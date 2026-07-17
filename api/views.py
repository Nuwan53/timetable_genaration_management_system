import secrets

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, LecturerRequest, LecturerNotification, Announcement, StudentNotification
from .serializers import (
    CourseSerializer, LecturerSerializer, VenueSerializer,
    StudentGroupSerializer, TimeSlotSerializer,
    ScheduleSlotReadSerializer, ScheduleSlotWriteSerializer,
    AuthUserSerializer,
    StudentProfileSerializer, LecturerProfileSerializer, LecturerRequestSerializer, LecturerNotificationSerializer,
    StudentAccountSerializer,
    AnnouncementSerializer, StudentNotificationSerializer,
)

# ── PDF export ───────────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from collections import Counter
from .emails import send_class_change_email
import io

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
         '14:00', '15:00', '16:00', '17:00']


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        profile = getattr(request.user, 'profile', None)
        return bool(request.user.is_staff or request.user.is_superuser or (profile and profile.role == 'ADMIN'))


def serialize_user(user, request=None):
    profile = getattr(user, 'profile', None)
    payload = {
        'id': user.id,
        'username': user.username,
        'role': profile.role if profile else 'ADMIN',
        'must_change_password': profile.must_change_password if profile else False,
    }
    if profile and profile.lecturer_id:
        payload['lecturer_id'] = profile.lecturer_id
    if profile and profile.student_group_id:
        payload['student_group_id'] = profile.student_group_id
    if profile:
        payload['name'] = user.get_full_name().strip() or user.username
        payload['email'] = user.email
        payload['contact_number'] = profile.contact_number or ''
        payload['registration_number'] = profile.registration_number or ''
        payload['avatar_url'] = request.build_absolute_uri(profile.avatar.url) if request and profile.avatar else None
    return payload


def get_student_profile(request):
    profile = getattr(request.user, 'profile', None)
    if profile is None or profile.role != 'STUDENT':
        return None
    return profile


def build_student_dashboard(profile, request, semester='S2-2026'):
    slots = ScheduleSlot.objects.select_related('timeslot', 'course', 'lecturer', 'venue', 'group').filter(group=profile.student_group)
    if semester:
        slots = slots.filter(semester=semester)
    slots = list(slots)

    now = timezone.localtime()
    today_name = now.strftime('%A')
    current_time = now.time()

    todays_slots = [slot for slot in slots if slot.timeslot.day == today_name]
    todays_remaining = [slot for slot in todays_slots if slot.timeslot.end_time >= current_time]
    todays_remaining.sort(key=lambda slot: slot.timeslot.start_time)

    total_minutes = 0
    course_ids = set()
    for slot in slots:
        start_minutes = slot.timeslot.start_time.hour * 60 + slot.timeslot.start_time.minute
        end_minutes = slot.timeslot.end_time.hour * 60 + slot.timeslot.end_time.minute
        total_minutes += max(0, end_minutes - start_minutes)
        course_ids.add(slot.course_id)

    announcements = Announcement.objects.select_related('student_group').filter(
        Q(audience='FACULTY') |
        Q(audience='BATCH', student_group=profile.student_group) |
        Q(audience='GROUP', student_group=profile.student_group)
    ).order_by('-published_at')[:10]

    notifications = StudentNotification.objects.select_related('student_group', 'schedule_slot', 'schedule_slot__course', 'schedule_slot__timeslot', 'schedule_slot__venue').filter(
        student_group=profile.student_group
    ).order_by('-created_at')[:10]

    return {
        'profile': StudentProfileSerializer(profile, context={'request': request}).data,
        'stats': {
            'classes_today': len(todays_slots),
            'weekly_hours': round(total_minutes / 60, 1),
            'subjects_enrolled': len(course_ids),
        },
        'timetable': ScheduleSlotReadSerializer(slots, many=True).data,
        'todays_remaining': ScheduleSlotReadSerializer(todays_remaining, many=True).data,
        'notifications': StudentNotificationSerializer(notifications, many=True).data,
        'announcements': AnnouncementSerializer(announcements, many=True).data,
        'today_name': today_name,
    }


@api_view(['POST'])
@authentication_classes([]) 
@permission_classes([AllowAny])
def auth_login(request):
    username = str(request.data.get('username', '')).strip()
    password = str(request.data.get('password', ''))
    role = str(request.data.get('role', '')).upper().strip()

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    profile = getattr(user, 'profile', None)
    actual_role = profile.role if profile else 'ADMIN'
    if role and role != actual_role:
        return Response({'detail': 'Role does not match this account'}, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)

    return Response({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': serialize_user(user, request=request),
    })


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


class LecturerViewSet(viewsets.ModelViewSet):
    queryset = Lecturer.objects.all()
    serializer_class = LecturerSerializer


class StudentAccountViewSet(viewsets.ModelViewSet):
    serializer_class = StudentAccountSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.select_related('profile', 'profile__student_group').filter(profile__role='STUDENT').order_by('username')


class LecturerMeViewSet(viewsets.ViewSet):
    def list(self, request):
        profile = getattr(request.user, 'profile', None)
        lecturer = profile.lecturer if profile else None
        if lecturer is None:
            return Response({'detail': 'Lecturer profile not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(LecturerProfileSerializer(lecturer).data)

    def update(self, request):
        profile = getattr(request.user, 'profile', None)
        lecturer = profile.lecturer if profile else None
        if lecturer is None:
            return Response({'detail': 'Lecturer profile not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = LecturerProfileSerializer(lecturer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer


class StudentGroupViewSet(viewsets.ModelViewSet):
    queryset = StudentGroup.objects.all()
    serializer_class = StudentGroupSerializer


class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer


class ScheduleSlotViewSet(viewsets.ModelViewSet):
    queryset = ScheduleSlot.objects.select_related(
        'timeslot', 'course', 'lecturer', 'venue', 'group'
    ).all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ScheduleSlotWriteSerializer
        return ScheduleSlotReadSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        if level := params.get('level'):
            qs = qs.filter(group__level=level)
        if stream := params.get('stream'):
            qs = qs.filter(group__stream=stream)
        if day := params.get('day'):
            qs = qs.filter(timeslot__day=day)
        if semester := params.get('semester'):
            qs = qs.filter(semester=semester)
        if lecturer := params.get('lecturer'):
            qs = qs.filter(lecturer_id=lecturer)
        if group := params.get('group'):
            qs = qs.filter(group_id=group)

        return qs


  # Add this import near the top of views.py, alongside your other imports:



# --- Inside ScheduleSlotViewSet, add these two methods ---
# (keep your existing get_serializer_class and get_queryset as they are)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_timeslot_id = instance.timeslot_id
        old_venue_id = instance.venue_id

        updated = serializer.save()

        timeslot_changed = updated.timeslot_id != old_timeslot_id
        venue_changed = updated.venue_id != old_venue_id

        if not (timeslot_changed or venue_changed):
            return  # nothing schedule-relevant changed, skip notifications

        # StudentNotification has RESCHEDULE / ROOM_CHANGE as separate types
        student_notif_type = 'ROOM_CHANGE' if (venue_changed and not timeslot_changed) else 'RESCHEDULE'
        # LecturerNotification only has a single generic "CHANGE" type — no RESCHEDULE/ROOM_CHANGE choice
        lecturer_notif_type = 'CHANGE'

        title = f"Schedule Updated: {updated.course.code}"
        message = (
            f"Your class has changed to {updated.timeslot.day} "
            f"{updated.timeslot.start_time.strftime('%H:%M')}-{updated.timeslot.end_time.strftime('%H:%M')} "
            f"at {updated.venue.code}."
        )

        LecturerNotification.objects.create(
            lecturer=updated.lecturer,
            schedule_slot=updated,
            title=title,
            message=message,
            notification_type=lecturer_notif_type,
        )
        StudentNotification.objects.create(
            student_group=updated.group,
            schedule_slot=updated,
            title=title,
            message=message,
            notification_type=student_notif_type,
        )

        student_emails = (
            User.objects
            .filter(profile__role='STUDENT', profile__student_group=updated.group)
            .exclude(email='')
            .values_list('email', flat=True)
        )

        send_class_change_email(
            notification_type=student_notif_type,
            course_code=updated.course.code,
            venue_code=updated.venue.code,
            day=updated.timeslot.day,
            start_time=updated.timeslot.start_time.strftime('%H:%M'),
            end_time=updated.timeslot.end_time.strftime('%H:%M'),
            lecturer_email=updated.lecturer.email,
            student_emails=student_emails,
        )

    def perform_destroy(self, instance):
        # 'CANCEL' is a valid choice on BOTH models — no mapping needed here
        title = f"Cancelled: {instance.course.code}"
        message = (
            f"Your class on {instance.timeslot.day} "
            f"{instance.timeslot.start_time.strftime('%H:%M')} at {instance.venue.code} "
            f"has been cancelled."
        )

        LecturerNotification.objects.create(
            lecturer=instance.lecturer,
            title=title,
            message=message,
            notification_type='CANCEL',
        )
        StudentNotification.objects.create(
            student_group=instance.group,
            title=title,
            message=message,
            notification_type='CANCEL',
        )

        student_emails = (
            User.objects
            .filter(profile__role='STUDENT', profile__student_group=instance.group)
            .exclude(email='')
            .values_list('email', flat=True)
        )

        send_class_change_email(
            notification_type='CANCEL',
            course_code=instance.course.code,
            venue_code=instance.venue.code,
            day=instance.timeslot.day,
            start_time=instance.timeslot.start_time.strftime('%H:%M'),
            end_time=instance.timeslot.end_time.strftime('%H:%M'),
            lecturer_email=instance.lecturer.email,
            student_emails=student_emails,
        )

        instance.delete()

class LecturerScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ScheduleSlotReadSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        lecturer = profile.lecturer if profile else None
        if lecturer is None:
            return ScheduleSlot.objects.none()
        return ScheduleSlot.objects.select_related('timeslot', 'course', 'lecturer', 'venue', 'group').filter(lecturer=lecturer)


class LecturerRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LecturerRequestSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        lecturer = profile.lecturer if profile else None
        if lecturer is None:
            return LecturerRequest.objects.none()
        return LecturerRequest.objects.select_related('lecturer', 'schedule_slot', 'reviewed_by').filter(lecturer=lecturer)

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        lecturer = profile.lecturer if profile else None
        serializer.save(lecturer=lecturer)


class LecturerNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LecturerNotificationSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        lecturer = profile.lecturer if profile else None
        if lecturer is None:
            return LecturerNotification.objects.none()
        return LecturerNotification.objects.select_related('lecturer', 'schedule_slot').filter(lecturer=lecturer)

    @action(detail=False, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request):
        level = request.query_params.get('level', 'I')
        stream = request.query_params.get('stream', 'physical')
        semester = request.query_params.get('semester', 'S2-2026')

        slots = ScheduleSlot.objects.select_related(
            'timeslot', 'course', 'lecturer', 'venue', 'group'
        ).filter(
            group__level=level,
            group__stream=stream,
            semester=semester,
        )

        # Build grid dict: grid[day][start_hour] = slot
        grid = {d: {} for d in DAYS}
        for slot in slots:
            hour = slot.timeslot.start_time.strftime('%H:%M')
            grid[slot.timeslot.day][hour] = slot

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                                leftMargin=1*cm, rightMargin=1*cm,
                                topMargin=1.5*cm, bottomMargin=1*cm)

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('title', fontSize=14, fontName='Helvetica-Bold',
                                     spaceAfter=8, alignment=1)
        cell_style = ParagraphStyle('cell', fontSize=7, fontName='Helvetica',
                                    leading=10, alignment=1)
        header_style = ParagraphStyle('hdr', fontSize=8, fontName='Helvetica-Bold',
                                      alignment=1, textColor=colors.white)

        stream_label = 'Physical Science' if stream == 'physical' else 'Bio Science'
        title = Paragraph(
            f"Timetable — Level {level} ({stream_label}) — {semester}",
            title_style
        )

        # Table: rows = times, cols = days
        header_row = [Paragraph('Time', header_style)] + \
                     [Paragraph(d[:3], header_style) for d in DAYS]
        rows = [header_row]

        for t in TIMES:
            row = [Paragraph(t, ParagraphStyle('t', fontSize=8, alignment=1))]
            for day in DAYS:
                slot = grid[day].get(t)
                if slot:
                    txt = (f"<b>{slot.course.code}</b><br/>"
                           f"{slot.venue.code}<br/>"
                           f"{slot.lecturer.name.split()[-1]}")
                    row.append(Paragraph(txt, cell_style))
                else:
                    row.append('')
            rows.append(row)

        col_widths = [2*cm] + [5.2*cm]*5
        tbl = Table(rows, colWidths=col_widths, rowHeights=[0.8*cm] + [1.5*cm]*len(TIMES))

        navy = colors.HexColor('#0D1B2A')
        accent = colors.HexColor('#2E86AB')

        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), navy),
            ('BACKGROUND', (0, 0), (0, -1), navy),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D0DCE8')),
            ('ROWBACKGROUNDS', (1, 1), (-1, -1), [colors.white, colors.HexColor('#F0F4F8')]),
        ]))

        # Highlight filled cells
        for r_idx, t in enumerate(TIMES, start=1):
            for c_idx, day in enumerate(DAYS, start=1):
                if grid[day].get(t):
                    tbl.setStyle(TableStyle([
                        ('BACKGROUND', (c_idx, r_idx), (c_idx, r_idx), colors.HexColor('#E8F4F8')),
                        ('TEXTCOLOR', (c_idx, r_idx), (c_idx, r_idx), colors.HexColor('#0D1B2A')),
                    ]))

        story = [title, Spacer(1, 0.3*cm), tbl]
        doc.build(story)

        buffer.seek(0)
        filename = f"timetable_level{level}_{stream}_{semester}.pdf"
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class StudentDashboardView(APIView):
    def get(self, request):
        profile = get_student_profile(request)
        if profile is None:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_403_FORBIDDEN)

        semester = request.query_params.get('semester', 'S2-2026')
        return Response(build_student_dashboard(profile, request, semester=semester))


class StudentProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile = get_student_profile(request)
        if profile is None:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_403_FORBIDDEN)
        return Response(StudentProfileSerializer(profile, context={'request': request}).data)

    def patch(self, request):
        profile = get_student_profile(request)
        if profile is None:
            return Response({'detail': 'Student profile not found'}, status=status.HTTP_403_FORBIDDEN)

        serializer = StudentProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(StudentProfileSerializer(profile, context={'request': request}).data)


def generate_lecturer_id():
    import datetime
    year = datetime.datetime.now().year
    prefix = f"LEC-{year}-"
    # Find all lecturers whose lecturer_id starts with prefix
    lecturers_list = Lecturer.objects.filter(lecturer_id__startswith=prefix)
    max_num = 0
    for lec in lecturers_list:
        if lec.lecturer_id:
            try:
                parts = lec.lecturer_id.split('-')
                if len(parts) == 3:
                    num = int(parts[2])
                    if num > max_num:
                        max_num = num
            except (ValueError, IndexError):
                pass
    return f"{prefix}{max_num + 1:03d}"


def generate_random_password():
    import secrets
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    return "".join(secrets.choice(chars) for _ in range(10))


class AdminLecturerCreateView(APIView):
    permission_classes = [IsAdminRole]

    @transaction.atomic
    def post(self, request):
        from django.db import transaction
        from .models import UserProfile
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        department = request.data.get('department', '').strip()
        lecturer_id = request.data.get('lecturer_id', '').strip()
        password = request.data.get('password', '').strip()

        if not name or not email:
            return Response({'detail': 'Name and Email are required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check unique email
        if Lecturer.objects.filter(email=email).exists():
            return Response({'detail': 'Lecturer with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle lecturer ID
        if not lecturer_id:
            lecturer_id = generate_lecturer_id()
        elif Lecturer.objects.filter(lecturer_id=lecturer_id).exists():
            return Response({'detail': 'Lecturer ID must be unique.'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle password
        raw_password = password
        if not raw_password:
            raw_password = generate_random_password()

        # Create Lecturer
        lecturer = Lecturer.objects.create(
            lecturer_id=lecturer_id,
            name=name,
            email=email,
            department=department,
            must_change_password=True
        )

        # Create User
        parts = [part for part in name.split() if part]
        first_name = parts[0] if parts else ''
        last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''

        if User.objects.filter(username=lecturer_id).exists():
            transaction.set_rollback(True)
            return Response({'detail': f'A user with username {lecturer_id} already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=lecturer_id,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(raw_password)
        user.save()

        # Create UserProfile
        UserProfile.objects.create(
            user=user,
            role='LECTURER',
            lecturer=lecturer,
            must_change_password=True
        )

        return Response({
            'id': lecturer.id,
            'lecturer_id': lecturer_id,
            'name': name,
            'email': email,
            'department': department,
            'username': lecturer_id,
            'password': raw_password,
            'must_change_password': True
        }, status=status.HTTP_201_CREATED)


class AdminStudentCreateView(APIView):
    permission_classes = [IsAdminRole]

    @transaction.atomic
    def post(self, request):
        from django.db import transaction
        from .models import UserProfile
        registration_number = request.data.get('registration_number', '').strip()
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        student_group_id = request.data.get('student_group_id')
        contact_number = request.data.get('contact_number', '').strip()
        password = request.data.get('password', '').strip()

        if not registration_number or not name:
            return Response({'detail': 'Registration Number and Name are required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check unique username/reg_number
        if User.objects.filter(username=registration_number).exists():
            return Response({'detail': 'A student account with this registration number/username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        if UserProfile.objects.filter(registration_number=registration_number).exists():
            return Response({'detail': 'Registration number is already in use.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get group
        student_group = None
        if student_group_id:
            try:
                student_group = StudentGroup.objects.get(pk=student_group_id)
            except StudentGroup.DoesNotExist:
                return Response({'detail': 'Invalid Student Group selected.'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle password
        raw_password = password
        if not raw_password:
            raw_password = generate_random_password()

        # Create User
        parts = [part for part in name.split() if part]
        first_name = parts[0] if parts else ''
        last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''

        user = User.objects.create(
            username=registration_number,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(raw_password)
        user.save()

        # Create UserProfile
        UserProfile.objects.create(
            user=user,
            role='STUDENT',
            student_group=student_group,
            registration_number=registration_number,
            contact_number=contact_number,
            must_change_password=True
        )

        return Response({
            'id': user.id,
            'username': registration_number,
            'registration_number': registration_number,
            'name': name,
            'email': email,
            'student_group_id': student_group_id,
            'contact_number': contact_number,
            'password': raw_password,
            'must_change_password': True
        }, status=status.HTTP_201_CREATED)


class AdminFreeSlotsView(APIView):
    """
    GET /api/admin/analytics/free-slots/?type=venue&id=<id>&semester=<semester>
    GET /api/admin/analytics/free-slots/?type=lecturer&id=<id>&semester=<semester>

    Returns every TimeSlot in the system, each tagged with is_free:
    True  -> no ScheduleSlot exists for the given venue/lecturer at that time
    False -> that venue/lecturer is already booked at that time
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        target_type = request.query_params.get('type', 'venue').strip().lower()
        target_id = request.query_params.get('id')
        semester = request.query_params.get('semester')

        if not target_id:
            return Response({'detail': 'id query param is required'}, status=status.HTTP_400_BAD_REQUEST)

        if target_type not in ('venue', 'lecturer'):
            return Response({'detail': 'type must be "venue" or "lecturer"'}, status=status.HTTP_400_BAD_REQUEST)

        all_slots = TimeSlot.objects.all().order_by('day', 'start_time')

        schedule_qs = ScheduleSlot.objects.all()
        if target_type == 'lecturer':
            schedule_qs = schedule_qs.filter(lecturer_id=target_id)
        else:
            schedule_qs = schedule_qs.filter(venue_id=target_id)

        if semester:
            schedule_qs = schedule_qs.filter(semester=semester)

        occupied_timeslot_ids = set(schedule_qs.values_list('timeslot_id', flat=True))

        results = [
            {
                'id': slot.id,
                'day': slot.day,
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'is_free': slot.id not in occupied_timeslot_ids,
            }
            for slot in all_slots
        ]

        return Response(results)






class AdminAnalyticsSummaryView(APIView):
    """
    GET /api/admin/analytics/summary/?semester=<semester>

    Returns aggregate stats for the Admin analytics dashboard:
    - room_utilization: % of all timeslots booked, per venue
    - lecturer_workload: weekly teaching hours + class count, per lecturer
    - day_distribution: total classes scheduled per weekday
    - busiest_times: the day+time combinations with the most concurrent bookings
      across all venues (useful for spotting peak-demand slots)
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        semester = request.query_params.get('semester', 'S2-2026')
        all_timeslots_count = TimeSlot.objects.count() or 1

        # ---- Room utilization ----
        room_utilization = []
        for venue in Venue.objects.all():
            booked = (
                ScheduleSlot.objects
                .filter(venue=venue, semester=semester)
                .values('timeslot_id')
                .distinct()
                .count()
            )
            room_utilization.append({
                'venue_code': venue.code,
                'venue_name': venue.name,
                'booked_slots': booked,
                'total_slots': all_timeslots_count,
                'utilization_pct': round((booked / all_timeslots_count) * 100, 1),
            })
        room_utilization.sort(key=lambda item: -item['utilization_pct'])

        # ---- Lecturer workload ----
        lecturer_workload = []
        for lecturer in Lecturer.objects.all():
            slots = list(
                ScheduleSlot.objects
                .select_related('timeslot')
                .filter(lecturer=lecturer, semester=semester)
            )
            total_minutes = 0
            for slot in slots:
                start = slot.timeslot.start_time
                end = slot.timeslot.end_time
                total_minutes += (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)
            lecturer_workload.append({
                'lecturer_name': lecturer.name,
                'classes_count': len(slots),
                'weekly_hours': round(total_minutes / 60, 1),
            })
        lecturer_workload.sort(key=lambda item: -item['weekly_hours'])

        # ---- Classes per day ----
        day_counts = {day: 0 for day in DAYS}
        for slot in ScheduleSlot.objects.select_related('timeslot').filter(semester=semester):
            day_counts[slot.timeslot.day] = day_counts.get(slot.timeslot.day, 0) + 1
        day_distribution = [{'day': day, 'classes': day_counts.get(day, 0)} for day in DAYS]

        # ---- Busiest time slots (most concurrent bookings across all venues) ----
        time_counter = Counter()
        for slot in ScheduleSlot.objects.select_related('timeslot').filter(semester=semester):
            key = (slot.timeslot.day, slot.timeslot.start_time.strftime('%H:%M'))
            time_counter[key] += 1

        busiest_times = [
            {'day': key[0], 'time': key[1], 'count': count}
            for key, count in sorted(time_counter.items(), key=lambda kv: -kv[1])[:8]
        ]

        return Response({
            'semester': semester,
            'room_utilization': room_utilization,
            'lecturer_workload': lecturer_workload,
            'day_distribution': day_distribution,
            'busiest_times': busiest_times,
        })

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.db import transaction
        from rest_framework.permissions import IsAuthenticated
        from .models import UserProfile
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')

        user = request.user
        if not user.check_password(current_password):
            return Response({'detail': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'New password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user.set_password(new_password)
            user.save()

            # Set must_change_password to False on UserProfile
            profile = getattr(user, 'profile', None)
            if profile:
                profile.must_change_password = False
                profile.save(update_fields=['must_change_password'])
                
                # Also set must_change_password to False on Lecturer (if applicable)
                if profile.lecturer:
                    profile.lecturer.must_change_password = False
                    profile.lecturer.save(update_fields=['must_change_password'])

        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
