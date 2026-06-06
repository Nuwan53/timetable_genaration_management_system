from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from .models import Course, Lecturer, Venue, StudentGroup, TimeSlot, ScheduleSlot
from .serializers import (
    CourseSerializer, LecturerSerializer, VenueSerializer,
    StudentGroupSerializer, TimeSlotSerializer,
    ScheduleSlotReadSerializer, ScheduleSlotWriteSerializer,
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


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


class LecturerViewSet(viewsets.ModelViewSet):
    queryset = Lecturer.objects.all()
    serializer_class = LecturerSerializer


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

        return qs

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
