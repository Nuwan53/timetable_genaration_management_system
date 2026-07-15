import re
import secrets
import string

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.http import HttpResponse
from django.db import IntegrityError, transaction, models
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from openpyxl import load_workbook
from .models import Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot, LecturerRequest, LecturerNotification, Announcement, StudentNotification, PublicationRecord, AcademicStream, AcademicLevel, AcademicPathway, PracticalGroup, ScheduleAnalytics, VenueUtilization, ConflictResolution, LecturerAnalytics, StudentGroupAnalytics, SystemSettings, VenueDefault, UserProfile
from .serializers import (
    CourseSerializer, LecturerSerializer, VenueSerializer,
    StudentGroupSerializer, TimeSlotSerializer,
    ScheduleSlotReadSerializer, ScheduleSlotWriteSerializer,
    AuthUserSerializer,
    StudentProfileSerializer, LecturerProfileSerializer, LecturerRequestSerializer, LecturerNotificationSerializer,
    StudentAccountSerializer,
    AnnouncementSerializer, StudentNotificationSerializer,
    PublicationRecordSerializer,
    AcademicStreamSerializer, AcademicStreamDetailSerializer,
    AcademicLevelSerializer, AcademicLevelDetailSerializer,
    AcademicPathwaySerializer, PracticalGroupSerializer,
    ScheduleAnalyticsSerializer, VenueUtilizationSerializer,
    ConflictResolutionSerializer, LecturerAnalyticsSerializer,
    StudentGroupAnalyticsSerializer,
    SystemSettingsSerializer, VenueDefaultSerializer,
)
from .signals import ensure_demo_accounts

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


def normalize_header(value):
    return re.sub(r'[^a-z0-9]+', '_', str(value or '').strip().lower()).strip('_')


def clean_value(value):
    if value is None:
        return ''
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def bool_from_value(value, default=False):
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {'1', 'true', 'yes', 'y', 'on'}


def generate_temporary_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def get_row_value(row, header_map, *names):
    for name in names:
        index = header_map.get(normalize_header(name))
        if index is None or index >= len(row):
            continue
        value = row[index]
        if value is not None and clean_value(value) != '':
            return value
    return None


def resolve_student_group(row, header_map):
    group_id = get_row_value(row, header_map, 'student_group_id', 'group_id')
    if group_id not in (None, ''):
        try:
            group = StudentGroup.objects.filter(pk=int(float(group_id))).first()
        except (TypeError, ValueError):
            group = None
        if group:
            return group
        raise ValueError(f'Unknown student_group_id {group_id}')

    level = clean_value(get_row_value(row, header_map, 'level', 'group_level'))
    stream = clean_value(get_row_value(row, header_map, 'stream', 'group_stream'))
    subgroup = clean_value(get_row_value(row, header_map, 'subgroup', 'group_subgroup'))
    year = clean_value(get_row_value(row, header_map, 'year', 'group_year'))

    if not level or not stream:
        return None

    if not year:
        year = str(timezone.localtime().year)

    group, _created = StudentGroup.objects.get_or_create(
        level=level,
        stream=stream,
        subgroup=subgroup,
        year=year,
    )
    return group


def send_student_password_email(*, recipient_email, name, username, password):
    subject = 'Your Timetable Management System login details'
    body = (
        f'Hello {name or username},\n\n'
        'Your student account has been created.\n\n'
        f'Username: {username}\n'
        f'Password: {password}\n\n'
        'Please sign in and change your password after first login.\n'
    )
    send_mail(subject, body, getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@timetable.local'), [recipient_email], fail_silently=False)


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
@permission_classes([AllowAny])
def auth_login(request):
    if settings.DEBUG:
        ensure_demo_accounts()

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
    permission_classes = [IsAdminRole]

    @action(detail=False, methods=['post'], url_path='import', parser_classes=[MultiPartParser, FormParser])
    def import_courses(self, request):
        upload = request.FILES.get('file')
        if upload is None:
            return Response({'detail': 'Please upload an Excel file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            workbook = load_workbook(upload, data_only=True)
        except Exception:
            return Response({'detail': 'The uploaded file must be a valid .xlsx workbook.'}, status=status.HTTP_400_BAD_REQUEST)

        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))
        if len(rows) < 2:
            return Response({'detail': 'The workbook must contain a header row and at least one course row.'}, status=status.HTTP_400_BAD_REQUEST)

        headers = [normalize_header(header) for header in rows[0]]
        header_map = {header: index for index, header in enumerate(headers) if header}

        created = 0
        updated = 0
        skipped = 0
        errors = []
        results = []

        for row_number, row in enumerate(rows[1:], start=2):
            if not any(cell not in (None, '') for cell in row):
                skipped += 1
                continue

            code = clean_value(get_row_value(row, header_map, 'code', 'course_code')).upper()
            name = clean_value(get_row_value(row, header_map, 'name', 'course_name'))
            credits = clean_value(get_row_value(row, header_map, 'credits'))
            department = clean_value(get_row_value(row, header_map, 'department'))
            lecture_hours = clean_value(get_row_value(row, header_map, 'lecture_hours', 'lectures'))
            lab_hours = clean_value(get_row_value(row, header_map, 'lab_hours', 'labs'))
            total_hours = clean_value(get_row_value(row, header_map, 'total_hours', 'weekly_hours'))

            if not code or not name:
                errors.append({'row': row_number, 'detail': 'code and name are required.'})
                continue

            try:
                credits_val = float(credits) if credits else 3
                lecture_hours_val = int(lecture_hours) if lecture_hours else 0
                lab_hours_val = int(lab_hours) if lab_hours else 0
                total_hours_val = int(total_hours) if total_hours else 0
            except (ValueError, TypeError):
                errors.append({'row': row_number, 'detail': 'Invalid numeric values for credits or hours.'})
                continue

            try:
                with transaction.atomic():
                    course, created_course = Course.objects.get_or_create(
                        code=code,
                        defaults={
                            'name': name,
                            'credits': credits_val,
                            'department': department,
                            'lecture_hours': lecture_hours_val,
                            'lab_hours': lab_hours_val,
                            'total_hours': total_hours_val,
                        }
                    )
                    
                    if not created_course:
                        course.name = name
                        course.credits = credits_val
                        course.department = department
                        course.lecture_hours = lecture_hours_val
                        course.lab_hours = lab_hours_val
                        course.total_hours = total_hours_val
                        course.save()

                    if created_course:
                        created += 1
                    else:
                        updated += 1

                    results.append({
                        'row': row_number,
                        'code': code,
                        'status': 'created' if created_course else 'updated',
                    })
            except IntegrityError as exc:
                errors.append({'row': row_number, 'detail': str(exc)})

        return Response({
            'created': created,
            'updated': updated,
            'skipped': skipped,
            'errors': errors,
            'results': results,
        })

    @action(detail=False, methods=['get'], url_path='export')
    def export_courses(self, request):
        from django.http import HttpResponse
        import csv
        
        courses = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="courses.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Code', 'Name', 'Credits', 'Department', 'Lecture Hours', 'Lab Hours', 'Weekly Contact Hours'])
        
        for course in courses:
            writer.writerow([
                course.code,
                course.name,
                course.credits,
                course.department,
                course.lecture_hours,
                course.lab_hours,
                course.total_hours,
            ])
        
        return response

    @action(detail=False, methods=['get'], url_path='validation')
    def validate_courses(self, request):
        """Check for course credit-hour discrepancies and conflicts"""
        courses = self.get_queryset()
        conflicts = []

        for course in courses:
            issues = []
            
            # Check if total hours match lecture + lab hours
            calculated_total = course.lecture_hours + course.lab_hours
            if course.total_hours > 0 and course.total_hours != calculated_total:
                issues.append({
                    'type': 'hours_mismatch',
                    'message': f"Total hours ({course.total_hours}) doesn't match lecture ({course.lecture_hours}) + lab ({course.lab_hours}) hours",
                })
            
            # Check for unusual credit-hour ratios
            if course.credits > 0 and course.total_hours > 0:
                ratio = course.total_hours / course.credits
                if ratio < 6 or ratio > 20:
                    issues.append({
                        'type': 'unusual_ratio',
                        'message': f"Unusual credit-hour ratio: {ratio:.1f} hours per credit (typical: 8-15)",
                    })
            
            if issues:
                conflicts.append({
                    'course_code': course.code,
                    'course_name': course.name,
                    'issues': issues,
                })

        return Response({
            'conflicts': conflicts,
            'total_courses': courses.count(),
            'conflicting_courses': len(conflicts),
        })


class LecturerViewSet(viewsets.ModelViewSet):
    queryset = Lecturer.objects.all()
    serializer_class = LecturerSerializer


class StudentAccountViewSet(viewsets.ModelViewSet):
    serializer_class = StudentAccountSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.select_related('profile', 'profile__student_group').filter(profile__role='STUDENT').order_by('username')

    @action(detail=False, methods=['post'], url_path='import', parser_classes=[MultiPartParser, FormParser])
    def import_students(self, request):
        upload = request.FILES.get('file')
        if upload is None:
            return Response({'detail': 'Please upload an Excel file.'}, status=status.HTTP_400_BAD_REQUEST)

        send_emails = bool_from_value(request.data.get('send_emails', True), default=True)

        try:
            workbook = load_workbook(upload, data_only=True)
        except Exception:
            return Response({'detail': 'The uploaded file must be a valid .xlsx workbook.'}, status=status.HTTP_400_BAD_REQUEST)

        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))
        if len(rows) < 2:
            return Response({'detail': 'The workbook must contain a header row and at least one student row.'}, status=status.HTTP_400_BAD_REQUEST)

        headers = [normalize_header(header) for header in rows[0]]
        header_map = {header: index for index, header in enumerate(headers) if header}

        created = 0
        updated = 0
        skipped = 0
        errors = []
        results = []

        for row_number, row in enumerate(rows[1:], start=2):
            if not any(cell not in (None, '') for cell in row):
                skipped += 1
                continue

            registration_number = clean_value(get_row_value(row, header_map, 'registration_number', 'reg_no', 'regno', 'student_registration_number', 'username'))
            full_name = clean_value(get_row_value(row, header_map, 'name', 'full_name', 'student_name'))
            email = clean_value(get_row_value(row, header_map, 'email', 'student_email'))
            contact_number = clean_value(get_row_value(row, header_map, 'contact_number', 'phone', 'mobile'))
            password = clean_value(get_row_value(row, header_map, 'password', 'initial_password', 'first_password'))
            must_change_password = bool_from_value(get_row_value(row, header_map, 'must_change_password', 'force_password_change'), default=True)

            if not registration_number or not full_name:
                errors.append({'row': row_number, 'detail': 'registration_number and name are required.'})
                continue

            try:
                student_group = resolve_student_group(row, header_map)
            except ValueError as exc:
                errors.append({'row': row_number, 'detail': str(exc)})
                continue

            username = registration_number
            temporary_password = password or generate_temporary_password()
            email_sent = False

            try:
                with transaction.atomic():
                    user = User.objects.filter(username=username).select_related('profile').first()
                    if user is None:
                        user = User.objects.filter(profile__registration_number=registration_number).select_related('profile').first()

                    created_user = user is None
                    if user is None:
                        user = User(username=username)

                    parts = [part for part in full_name.split() if part]
                    user.first_name = parts[0] if parts else ''
                    user.last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''
                    user.username = username
                    user.email = email
                    if created_user or password:
                        user.set_password(temporary_password)
                    user.save()

                    from .models import UserProfile
                    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'STUDENT'})
                    profile.role = 'STUDENT'
                    profile.student_group = student_group
                    profile.registration_number = registration_number
                    profile.contact_number = contact_number or None
                    profile.must_change_password = must_change_password or created_user or bool(password)
                    profile.save()

                if send_emails and email:
                    try:
                        send_student_password_email(recipient_email=email, name=full_name, username=username, password=temporary_password)
                        email_sent = True
                    except Exception:
                        email_sent = False

                if created_user:
                    created += 1
                else:
                    updated += 1

                results.append({
                    'row': row_number,
                    'registration_number': registration_number,
                    'username': username,
                    'status': 'created' if created_user else 'updated',
                    'email_sent': email_sent,
                })
            except IntegrityError as exc:
                errors.append({'row': row_number, 'detail': str(exc)})

        return Response({
            'created': created,
            'updated': updated,
            'skipped': skipped,
            'errors': errors,
            'results': results,
        })


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


def get_publication_publisher(request):
    user = request.user
    full_name = user.get_full_name().strip()
    return full_name or user.username or 'System'


def get_publication_initials(name):
    parts = [part for part in str(name).split() if part]
    if not parts:
        return 'SY'
    return ''.join(part[0] for part in parts[:2]).upper()[:4]


def get_next_publication_version():
    latest = PublicationRecord.objects.order_by('-published_at', '-id').first()
    if latest is None:
        return 'v1.0.0-release'

    match = re.match(r'^v(\d+)\.(\d+)\.(\d+)(?:-(.+))?$', latest.version)
    if not match:
        return f'v{PublicationRecord.objects.count() + 1}.0.0-release'

    major, minor, patch = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
    patch += 1
    return f'v{major}.{minor}.{patch}-release'


class PublicationRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PublicationRecordSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return PublicationRecord.objects.all().order_by('-published_at', '-id')

    def perform_create(self, serializer):
        publisher = get_publication_publisher(self.request)
        serializer.save(
            publisher=publisher,
            initials=get_publication_initials(publisher),
            status='PUBLISHED',
        )

    @action(detail=False, methods=['post'], url_path='publish')
    def publish(self, request):
        notes = str(request.data.get('notes', '')).strip()
        version = str(request.data.get('version', '')).strip() or get_next_publication_version()

        with transaction.atomic():
            PublicationRecord.objects.filter(status='PUBLISHED').update(status='ARCHIVED', archived_at=timezone.now())

            record = PublicationRecord.objects.create(
                version=version,
                status='PUBLISHED',
                publisher=get_publication_publisher(request),
                initials=get_publication_initials(get_publication_publisher(request)),
                notes=notes,
            )

        return Response(PublicationRecordSerializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        record = self.get_object()
        if record.status != 'ARCHIVED':
            record.status = 'ARCHIVED'
            record.archived_at = timezone.now()
            record.save(update_fields=['status', 'archived_at'])
        return Response(PublicationRecordSerializer(record).data)


class AcademicStreamViewSet(viewsets.ModelViewSet):
    queryset = AcademicStream.objects.prefetch_related('levels', 'levels__pathways', 'levels__practical_groups').all()
    serializer_class = AcademicStreamSerializer
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.action in ('retrieve', 'list'):
            return AcademicStreamDetailSerializer
        return AcademicStreamSerializer

    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """Import academic structure from Excel file"""
        upload = request.FILES.get('file')
        if upload is None:
            return Response({'detail': 'Please upload an Excel file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            workbook = load_workbook(upload, data_only=True)
        except Exception:
            return Response({'detail': 'The uploaded file must be a valid .xlsx workbook.'}, status=status.HTTP_400_BAD_REQUEST)

        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))
        if len(rows) < 2:
            return Response({'detail': 'The workbook must contain a header row and at least one stream row.'}, status=status.HTTP_400_BAD_REQUEST)

        headers = [normalize_header(header) for header in rows[0]]
        header_map = {header: index for index, header in enumerate(headers) if header}

        created_streams = 0
        created_levels = 0
        errors = []

        for row_number, row in enumerate(rows[1:], start=2):
            if not any(cell not in (None, '') for cell in row):
                continue

            stream_name = clean_value(get_row_value(row, header_map, 'stream_name', 'stream'))
            stream_type = clean_value(get_row_value(row, header_map, 'stream_type', 'type'))
            level_code = clean_value(get_row_value(row, header_map, 'level_code', 'code'))
            level_name = clean_value(get_row_value(row, header_map, 'level_name', 'name'))
            level_summary = clean_value(get_row_value(row, header_map, 'level_summary', 'summary'))

            if not stream_name or not stream_type or not level_code or not level_name:
                errors.append({'row': row_number, 'detail': 'stream_name, stream_type, level_code, and level_name are required.'})
                continue

            if stream_type not in dict(AcademicStream.STREAM_TYPE_CHOICES):
                errors.append({'row': row_number, 'detail': f'Invalid stream_type: {stream_type}'})
                continue

            try:
                with transaction.atomic():
                    stream, stream_created = AcademicStream.objects.get_or_create(
                        name=stream_name,
                        stream_type=stream_type,
                        defaults={'icon': 'leaf' if stream_type == 'Biological' else 'sigma'}
                    )
                    if stream_created:
                        created_streams += 1

                    level, level_created = AcademicLevel.objects.get_or_create(
                        stream=stream,
                        code=level_code,
                        defaults={'name': level_name, 'summary': level_summary}
                    )
                    if level_created:
                        created_levels += 1
            except Exception as exc:
                errors.append({'row': row_number, 'detail': str(exc)})

        return Response({
            'created_streams': created_streams,
            'created_levels': created_levels,
            'errors': errors,
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics of academic structure"""
        streams = self.get_queryset()
        total_streams = streams.count()
        total_levels = AcademicLevel.objects.count()
        total_pathways = AcademicPathway.objects.count()
        total_practical_groups = PracticalGroup.objects.count()

        student_distribution = StudentGroup.objects.values('stream').annotate(count=models.Count('id'))

        return Response({
            'total_streams': total_streams,
            'total_levels': total_levels,
            'total_pathways': total_pathways,
            'total_practical_groups': total_practical_groups,
            'student_distribution': list(student_distribution),
        })


class AcademicLevelViewSet(viewsets.ModelViewSet):
    queryset = AcademicLevel.objects.prefetch_related('pathways', 'practical_groups').all()
    serializer_class = AcademicLevelSerializer
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.action in ('retrieve', 'list'):
            return AcademicLevelDetailSerializer
        return AcademicLevelSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        stream_id = self.request.query_params.get('stream')
        if stream_id:
            qs = qs.filter(stream_id=stream_id)
        return qs


class AcademicPathwayViewSet(viewsets.ModelViewSet):
    queryset = AcademicPathway.objects.all()
    serializer_class = AcademicPathwaySerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = super().get_queryset()
        level_id = self.request.query_params.get('level')
        if level_id:
            qs = qs.filter(level_id=level_id)
        return qs


class PracticalGroupViewSet(viewsets.ModelViewSet):
    queryset = PracticalGroup.objects.all()
    serializer_class = PracticalGroupSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = super().get_queryset()
        level_id = self.request.query_params.get('level')
        if level_id:
            qs = qs.filter(level_id=level_id)
        return qs


class AnalyticsView(APIView):
    """Aggregated analytics overview"""
    permission_classes = [IsAdminRole]

    def get(self, request):
        period = request.query_params.get('period', 'Last 30 Days')
        
        # Get latest analytics or calculate
        try:
            latest_analytics = ScheduleAnalytics.objects.latest('date')
        except ScheduleAnalytics.DoesNotExist:
            latest_analytics = self._calculate_analytics()
        
        # Get venue heatmap data
        heatmap = self._get_venue_heatmap()
        
        # Get conflict velocity
        conflict_velocity = self._get_conflict_velocity()
        
        # Get lecturer workload
        lecturers_data = self._get_lecturer_workload()
        
        # Get student group load
        student_groups_data = self._get_student_group_load()
        
        # Get conflict history
        conflict_history = self._get_conflict_history()
        
        return Response({
            'metrics': {
                'utilization_rate': f"{latest_analytics.utilization_rate}%",
                'pending_conflicts': latest_analytics.pending_conflicts,
                'avg_lecturer_load': f"{latest_analytics.avg_lecturer_load}h",
                'resource_efficiency': latest_analytics.resource_efficiency,
            },
            'heatmap': heatmap,
            'conflict_velocity': conflict_velocity,
            'lecturers': lecturers_data,
            'student_groups': student_groups_data,
            'conflict_history': conflict_history,
            'period': period,
        })

    def _calculate_analytics(self):
        """Calculate analytics from current schedule"""
        from django.db.models import Count, Avg
        
        total_slots = ScheduleSlot.objects.count()
        filled_slots = ScheduleSlot.objects.filter(course__isnull=False).count()
        utilization_rate = (filled_slots / total_slots * 100) if total_slots > 0 else 0
        
        pending_conflicts = ConflictResolution.objects.filter(
            status='PENDING'
        ).count()
        
        avg_load = LecturerAnalytics.objects.aggregate(
            avg=Avg('total_hours')
        )['avg'] or 0
        
        analytics = ScheduleAnalytics.objects.create(
            utilization_rate=utilization_rate,
            pending_conflicts=pending_conflicts,
            avg_lecturer_load=avg_load,
            resource_efficiency='A+',
        )
        return analytics

    def _get_venue_heatmap(self):
        """Get venue utilization heatmap (5 days x 8 hours)"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        heatmap = []
        
        for day_idx, day in enumerate(days):
            day_data = []
            for hour_idx in range(8):
                utilizations = VenueUtilization.objects.filter(
                    day_of_week=day,
                    hour__gte=f'{8 + hour_idx * 2:02d}:00',
                    hour__lt=f'{10 + hour_idx * 2:02d}:00',
                ).values_list('utilization_level', flat=True)
                
                avg_level = sum(utilizations) / len(utilizations) if utilizations else 0
                day_data.append(int(avg_level))
            heatmap.append(day_data)
        
        return heatmap

    def _get_conflict_velocity(self):
        """Get weekly conflict resolution trend"""
        from datetime import timedelta
        velocities = []
        
        for week in range(7):
            start_date = timezone.now().date() - timedelta(days=7 * (6 - week))
            end_date = start_date + timedelta(days=7)
            
            count = ConflictResolution.objects.filter(
                created_at__date__gte=start_date,
                created_at__date__lt=end_date,
            ).count()
            velocities.append(count)
        
        return velocities

    def _get_lecturer_workload(self):
        """Get lecturer workload distribution"""
        analysts = LecturerAnalytics.objects.filter(
            date=timezone.now().date()
        ).select_related('lecturer')[:4]
        
        data = []
        for analyst in analysts:
            data.append({
                'name': analyst.lecturer.name,
                'teaching': int(analyst.teaching_load),
                'research': int(analyst.research_load),
                'hours': f"{analyst.total_hours}h / Week",
                'warning': analyst.overloaded,
            })
        
        return data

    def _get_student_group_load(self):
        """Get student group load index"""
        groups = StudentGroupAnalytics.objects.filter(
            date=timezone.now().date()
        ).select_related('student_group')[:4]
        
        data = []
        for group in groups:
            data.append({
                'title': str(group.student_group),
                'hours': f"{group.total_hours}h",
                'note': group.notes or 'Load tracking',
                'trend': group.trend.lower(),
            })
        
        return data

    def _get_conflict_history(self):
        """Get recent conflict resolution history"""
        conflicts = ConflictResolution.objects.all().order_by('-created_at')[:10]
        
        data = []
        for conflict in conflicts:
            created = conflict.created_at
            now = timezone.now()
            diff = now - created
            
            if diff.days > 0:
                time_str = f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
            else:
                hours = diff.seconds // 3600
                if hours > 0:
                    time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
                else:
                    time_str = f"{diff.seconds // 60} minutes ago"
            
            data.append({
                'time': time_str,
                'type': conflict.get_conflict_type_display(),
                'entity': conflict.entity,
                'resolvedBy': conflict.resolution_method or 'System',
                'status': conflict.status,
            })
        
        return data


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

        current_password = str(request.data.get('current_password', '')).strip()
        new_password = str(request.data.get('new_password', '')).strip()
        confirm_password = str(request.data.get('confirm_password', '')).strip()
        profile_data = request.data.copy()

        if current_password or new_password or confirm_password:
            if not request.user.check_password(current_password):
                return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
            if not new_password:
                return Response({'detail': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)
            if new_password != confirm_password:
                return Response({'detail': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

            request.user.set_password(new_password)
            request.user.save(update_fields=['password'])
            profile.must_change_password = False
            profile.save(update_fields=['must_change_password'])

        profile_data.pop('current_password', None)
        profile_data.pop('new_password', None)
        profile_data.pop('confirm_password', None)

        serializer = StudentProfileSerializer(profile, data=profile_data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(StudentProfileSerializer(profile, context={'request': request}).data)



class SystemSettingsView(APIView):
    """View for managing system settings - admin only"""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        """Retrieve current system settings"""
        settings = SystemSettings.get_settings()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        """Update system settings"""
        settings = SystemSettings.get_settings()
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Partially update system settings"""
        settings = SystemSettings.get_settings()
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VenueDefaultViewSet(viewsets.ModelViewSet):
    """ViewSet for managing departmental default venues"""
    queryset = VenueDefault.objects.all()
    serializer_class = VenueDefaultSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    filterset_fields = ['department', 'priority', 'is_active']
    search_fields = ['department', 'venue__name']
    ordering_fields = ['department', 'priority', 'created_at']
    ordering = ['department']

    def perform_create(self, serializer):
        """Log venue default creation"""
        serializer.save()

    def perform_update(self, serializer):
        """Log venue default update"""
        serializer.save()

    def perform_destroy(self, instance):
        """Soft delete by marking as inactive"""
        instance.is_active = False
        instance.save()
