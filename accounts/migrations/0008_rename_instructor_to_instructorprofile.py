from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_alter_customuser_managers'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Instructor',
            new_name='InstructorProfile',
        ),
    ]
