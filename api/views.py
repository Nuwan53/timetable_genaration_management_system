import secrets

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action, api_view, permission_classes
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
    AnnouncementSerializer, StudentNotificationSerializer,
)

# ── PDF export ───────────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
         '14:00', '15:00', '16:00', '17:00']


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
