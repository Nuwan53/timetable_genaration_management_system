# Generated migration for Academic Structure

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_course_fields_update'),
    ]

    operations = [
        migrations.CreateModel(
            name='AcademicStream',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('stream_type', models.CharField(choices=[('Biological', 'Biological Science'), ('Physical', 'Physical Science')], max_length=20)),
                ('icon', models.CharField(default='leaf', max_length=20)),
                ('summary', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='AcademicLevel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=150)),
                ('summary', models.CharField(blank=True, max_length=200)),
                ('expanded', models.BooleanField(default=False)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('stream', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='levels', to='api.academicstream')),
            ],
            options={
                'ordering': ['stream', 'order', 'code'],
            },
        ),
        migrations.CreateModel(
            name='PracticalGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('capacity', models.PositiveIntegerField(default=0)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('level', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='practical_groups', to='api.academiclevel')),
            ],
            options={
                'ordering': ['level', 'order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='AcademicPathway',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('description', models.TextField(blank=True)),
                ('students_count', models.PositiveIntegerField(default=0)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('level', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pathways', to='api.academiclevel')),
            ],
            options={
                'ordering': ['level', 'order', 'name'],
            },
        ),
        migrations.AddField(
            model_name='studentgroup',
            name='academic_level',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='student_groups', to='api.academiclevel'),
        ),
        migrations.AlterUniqueTogether(
            name='academiclevel',
            unique_together={('stream', 'code')},
        ),
        migrations.AlterUniqueTogether(
            name='academicstream',
            unique_together={('name', 'stream_type')},
        ),
        migrations.AlterUniqueTogether(
            name='practicalgroup',
            unique_together={('level', 'name')},
        ),
        migrations.AlterUniqueTogether(
            name='academicpathway',
            unique_together={('level', 'name')},
        ),
    ]
