from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        CREATE TABLE IF NOT EXISTS `api_userprofile` (
                            `id` bigint NOT NULL AUTO_INCREMENT,
                            `role` varchar(20) NOT NULL,
                            `must_change_password` bool NOT NULL,
                            `lecturer_id` bigint NULL,
                            `student_group_id` bigint NULL,
                            `user_id` bigint NOT NULL,
                            PRIMARY KEY (`id`),
                            UNIQUE KEY `api_userprofile_user_id_key` (`user_id`),
                            KEY `api_userprofile_lecturer_id_5a0a4a21_fk_api_lecturer_id` (`lecturer_id`),
                            KEY `api_userprofile_student_group_id_57c7b3d2_fk_api_studentgroup_id` (`student_group_id`),
                            CONSTRAINT `api_userprofile_user_id_1d0dfc76_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`) ON DELETE CASCADE,
                            CONSTRAINT `api_userprofile_lecturer_id_5a0a4a21_fk_api_lecturer_id` FOREIGN KEY (`lecturer_id`) REFERENCES `api_lecturer` (`id`) ON DELETE SET NULL,
                            CONSTRAINT `api_userprofile_student_group_id_57c7b3d2_fk_api_studentgroup_id` FOREIGN KEY (`student_group_id`) REFERENCES `api_studentgroup` (`id`) ON DELETE SET NULL
                        ) ENGINE=InnoDB;
                    """,
                    reverse_sql="DROP TABLE IF EXISTS `api_userprofile`;",
                )
            ],
            state_operations=[
                migrations.CreateModel(
                    name='UserProfile',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('role', models.CharField(choices=[('ADMIN', 'Admin'), ('LECTURER', 'Lecturer'), ('STUDENT', 'Student')], max_length=20)),
                        ('must_change_password', models.BooleanField(default=False)),
                        ('lecturer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_profiles', to='api.lecturer')),
                        ('student_group', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_profiles', to='api.studentgroup')),
                        ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
                    ],
                )
            ],
        ),
    ]