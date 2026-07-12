from django.db import migrations, connection

sql_mysql = """
                SET @sql := IF(
                    EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'api_userprofile'
                          AND column_name = 'must_change_password'
                    ),
                    'SELECT 1',
                    'ALTER TABLE `api_userprofile` ADD COLUMN `must_change_password` bool NOT NULL DEFAULT 0'
                );
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            """

reverse_sql_mysql = "ALTER TABLE `api_userprofile` DROP COLUMN `must_change_password`;"

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_userprofile_fk_columns'),
    ]

    operations = [
        migrations.RunSQL(
            sql='SELECT 1' if connection.vendor == 'sqlite' else sql_mysql,
            reverse_sql='SELECT 1' if connection.vendor == 'sqlite' else reverse_sql_mysql,
        )
    ]