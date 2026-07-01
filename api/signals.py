from django.contrib.auth.models import User
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import Lecturer, StudentGroup, UserProfile


def ensure_user(username, password, role, *, lecturer=None, student_group=None, is_superuser=False):
    user, created = User.objects.get_or_create(username=username, defaults={'is_staff': is_superuser, 'is_superuser': is_superuser})
    if created or not user.check_password(password):
        user.set_password(password)
        user.is_staff = is_superuser
        user.is_superuser = is_superuser
        user.save()

    profile_defaults = {
        'role': role,
        'lecturer': lecturer,
        'student_group': student_group,
        'must_change_password': False,
    }
    UserProfile.objects.update_or_create(user=user, defaults=profile_defaults)


@receiver(post_migrate)
def seed_demo_accounts(sender, **kwargs):
    if sender.name != 'api':
        return

    lecturer = Lecturer.objects.order_by('id').first()
    if lecturer is None:
        lecturer = Lecturer.objects.create(name='Dr. Sample Lecturer', email='lecturer@example.com', department='Computer Science')

    student_group = StudentGroup.objects.order_by('id').first()
    if student_group is None:
        student_group = StudentGroup.objects.create(level='I', stream='physical', subgroup='A', year='2026')

    ensure_user('admin', 'Admin@123', 'ADMIN', is_superuser=True)
    ensure_user('lecturer', 'Lecturer@123', 'LECTURER', lecturer=lecturer)
    ensure_user('student', 'Student@123', 'STUDENT', student_group=student_group)