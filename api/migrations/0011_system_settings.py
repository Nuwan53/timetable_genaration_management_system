# Generated migration for SystemSettings and VenueDefault models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0010_analytics_models'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('academic_year', models.CharField(default='2024/2025', max_length=20)),
                ('semester_type', models.CharField(choices=[('First Semester', 'First Semester'), ('Second Semester', 'Second Semester')], default='First Semester', max_length=20)),
                ('teaching_start', models.DateField()),
                ('teaching_end', models.DateField()),
                ('standard_lecture', models.BooleanField(default=True, help_text='Fixed 50-minute blocks')),
                ('laboratory_session', models.BooleanField(default=True, help_text='Extended 3-hour blocks')),
                ('tutorial_workshop', models.BooleanField(default=False, help_text='Flexible 1-2 hour blocks')),
                ('conflict_alerts', models.BooleanField(default=True)),
                ('publication_confirmations', models.BooleanField(default=True)),
                ('email_list', models.TextField(default='faculty-staff@ruh.ac.lk', help_text='Comma-separated email addresses')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'System Settings',
            },
        ),
        migrations.CreateModel(
            name='VenueDefault',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('department', models.CharField(max_length=200)),
                ('priority', models.CharField(choices=[('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low')], default='MEDIUM', max_length=10)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('venue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='default_for_departments', to='api.venue')),
            ],
            options={
                'verbose_name_plural': 'Venue Defaults',
                'unique_together': {('department', 'venue')},
            },
        ),
    ]
