# Generated migration for Analytics models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0009_academic_structure'),
    ]

    operations = [
        migrations.CreateModel(
            name='ScheduleAnalytics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(auto_now_add=True)),
                ('period', models.CharField(default='daily', max_length=20)),
                ('utilization_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('pending_conflicts', models.PositiveIntegerField(default=0)),
                ('avg_lecturer_load', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('resource_efficiency', models.CharField(default='A+', max_length=2)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='VenueUtilization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day_of_week', models.CharField(max_length=10)),
                ('hour', models.TimeField()),
                ('utilization_level', models.PositiveIntegerField(default=0)),
                ('date', models.DateField(auto_now_add=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('venue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='utilization_records', to='api.venue')),
            ],
            options={
                'ordering': ['venue', 'day_of_week', 'hour'],
            },
        ),
        migrations.CreateModel(
            name='LecturerAnalytics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(auto_now_add=True)),
                ('period', models.CharField(default='weekly', max_length=20)),
                ('teaching_load', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('research_load', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('admin_load', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('total_hours', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('overloaded', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lecturer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='analytics_records', to='api.lecturer')),
            ],
            options={
                'ordering': ['-date', 'lecturer'],
            },
        ),
        migrations.CreateModel(
            name='StudentGroupAnalytics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(auto_now_add=True)),
                ('period', models.CharField(default='weekly', max_length=20)),
                ('total_hours', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('trend', models.CharField(choices=[('UP', 'Increasing'), ('DOWN', 'Decreasing'), ('STEADY', 'Stable')], default='STEADY', max_length=10)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('student_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='analytics_records', to='api.studentgroup')),
            ],
            options={
                'ordering': ['-date', 'student_group'],
            },
        ),
        migrations.CreateModel(
            name='ConflictResolution',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('conflict_type', models.CharField(choices=[('VENUE_DOUBLE_BOOKING', 'Room Double-Booking'), ('LECTURER_OVERLAP', 'Lecturer Overlap'), ('RESOURCE_CONFLICT', 'Resource Conflict'), ('STUDENT_OVERLAP', 'Student Group Overlap'), ('OTHER', 'Other')], max_length=30)),
                ('entity', models.CharField(max_length=200)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('IN_PROGRESS', 'In Progress'), ('RESOLVED', 'Resolved'), ('REJECTED', 'Rejected')], default='PENDING', max_length=20)),
                ('resolution_method', models.CharField(blank=True, max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_conflicts', to=settings.AUTH_USER_MODEL)),
                ('schedule_slot', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='conflicts', to='api.scheduleslot')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='schedulegroupanalytics',
            unique_together={('student_group', 'date', 'period')},
        ),
        migrations.AlterUniqueTogether(
            name='lectureraanalytics',
            unique_together={('lecturer', 'date', 'period')},
        ),
        migrations.AlterUniqueTogether(
            name='venueutil',
            unique_together={('venue', 'day_of_week', 'hour', 'date')},
        ),
        migrations.AlterUniqueTogether(
            name='schedulanaly',
            unique_together={('date', 'period')},
        ),
    ]
