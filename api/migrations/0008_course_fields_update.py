# Generated migration for enhanced Course model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_publicationrecord'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='department',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='course',
            name='lecture_hours',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='course',
            name='lab_hours',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='course',
            name='total_hours',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='course',
            name='credits',
            field=models.DecimalField(decimal_places=1, default=3, max_digits=3),
        ),
    ]
