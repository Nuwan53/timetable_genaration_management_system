from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_userprofile'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                SET @sql := IF(
                    EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'api_userprofile'
                          AND column_name = 'lecturer_id'
                    ),
                    'SELECT 1',
                    'ALTER TABLE `api_userprofile` ADD COLUMN `lecturer_id` bigint NULL, ADD COLUMN `student_group_id` bigint NULL'
                );
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;

                SET @fk_sql := IF(
                    EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE table_schema = DATABASE()
                          AND table_name = 'api_userprofile'
                          AND constraint_name = 'api_userprofile_lecturer_id_5a0a4a21_fk_api_lecturer_id'
                    ),
                    'SELECT 1',
                    'ALTER TABLE `api_userprofile` ADD CONSTRAINT `api_userprofile_lecturer_id_5a0a4a21_fk_api_lecturer_id` FOREIGN KEY (`lecturer_id`) REFERENCES `api_lecturer` (`id`) ON DELETE SET NULL'
                );
                PREPARE stmt2 FROM @fk_sql;
                EXECUTE stmt2;
                DEALLOCATE PREPARE stmt2;

                SET @sg_fk_sql := IF(
                    EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE table_schema = DATABASE()
                          AND table_name = 'api_userprofile'
                          AND constraint_name = 'api_userprofile_student_group_id_57c7b3d2_fk_api_studentgroup_id'
                    ),
                    'SELECT 1',
                    'ALTER TABLE `api_userprofile` ADD CONSTRAINT `api_userprofile_student_group_id_57c7b3d2_fk_api_studentgroup_id` FOREIGN KEY (`student_group_id`) REFERENCES `api_studentgroup` (`id`) ON DELETE SET NULL'
                );
                PREPARE stmt3 FROM @sg_fk_sql;
                EXECUTE stmt3;
                DEALLOCATE PREPARE stmt3;
            """,
            reverse_sql="""
                ALTER TABLE `api_userprofile`
                    DROP FOREIGN KEY `api_userprofile_lecturer_id_5a0a4a21_fk_api_lecturer_id`,
                    DROP FOREIGN KEY `api_userprofile_student_group_id_57c7b3d2_fk_api_studentgroup_id`,
                    DROP COLUMN `lecturer_id`,
                    DROP COLUMN `student_group_id`;
            """,
        )
    ]