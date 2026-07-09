from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('ADMIN', 'Admin'), ('LECTURER', 'Lecturer'), ('STUDENT', 'Student')], max_length=20)),
                ('registration_number', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('contact_number', models.CharField(blank=True, max_length=30, null=True)),
                ('avatar', models.FileField(blank=True, null=True, upload_to='student_avatars/')),
                ('must_change_password', models.BooleanField(default=False)),
                ('lecturer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_profiles', to='api.lecturer')),
                ('student_group', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_profiles', to='api.studentgroup')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]