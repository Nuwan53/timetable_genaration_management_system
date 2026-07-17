from django.core.mail import send_mail
from django.conf import settings


def send_class_change_email(notification_type, course_code, venue_code, day, start_time, end_time, lecturer_email, student_emails):
    """
    Sends one email covering a class reschedule, room change, or cancellation
    to the lecturer and every student in the affected group.
    Uses fail_silently=True so a broken email config never crashes the
    actual schedule update — the timetable change still succeeds either way.
    """
    if notification_type == 'CANCEL':
        subject = f"Class Cancelled: {course_code}"
        body = (
            f"Your class {course_code} scheduled on {day} at {start_time}-{end_time} "
            f"({venue_code}) has been cancelled.\n\n"
            f"Please check the Timetable Manager for updates."
        )
    elif notification_type == 'ROOM_CHANGE':
        subject = f"Room Changed: {course_code}"
        body = (
            f"Your class {course_code} on {day} {start_time}-{end_time} has moved "
            f"to room {venue_code}.\n\n"
            f"Please check the Timetable Manager for the full updated schedule."
        )
    else:  # RESCHEDULE
        subject = f"Class Rescheduled: {course_code}"
        body = (
            f"Your class {course_code} has been rescheduled to {day} {start_time}-{end_time} "
            f"at {venue_code}.\n\n"
            f"Please check the Timetable Manager for the full updated schedule."
        )

    recipients = [email for email in ([lecturer_email] + list(student_emails)) if email]
    if not recipients:
        return

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipients,
        fail_silently=True,
    )