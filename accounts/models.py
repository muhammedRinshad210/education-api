from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import BaseUserManager, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import random


class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("The username must be set")

        extra_fields.setdefault("is_active", True)
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(username, password, **extra_fields)


class Accounts(AbstractBaseUser, PermissionsMixin):
    username_validator = UnicodeUsernameValidator()

    username = models.CharField(
        _("username"),
        max_length=150,
        unique=True,
        help_text=_(
            "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
        ),
        validators=[username_validator],
        error_messages={
            "unique": _("A user with that username already exists."),
        },
    )
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)
    email = models.EmailField(_("email address"), blank=True)
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into this admin site."),
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
        ('customer', 'Customer'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student'
    )
    phone = models.CharField(
        max_length=15,
        null=True,
        blank=True
    )

    objects = CustomUserManager()

    EMAIL_FIELD = "email"
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.username


class AdminProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_profile'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Admin Profile - {self.user.username}"


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Student Profile - {self.user.username}"


# Backward-compatible alias for existing imports.
CustomUser = Accounts


class Category(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class Course(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    course_code = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        null=True,
        blank=True
    )
    course_name = models.CharField(
        max_length=100
    )
    duration = models.CharField(
        max_length=50
    )
    fees = models.IntegerField()
    description = models.TextField(
        null=True,
        blank=True
    )
    status = models.BooleanField(
        default=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True
    )

    def save(self, *args, **kwargs):
        if not self.course_code:
            while True:
                random_number = random.randint(1, 999)
                code = f"CRS{random_number:03d}"
                if not Course.objects.filter(course_code=code).exists():
                    self.course_code = code
                    break

        super().save(*args, **kwargs)

    def __str__(self):
        return self.course_name


class InstructorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='instructor_profile'
    )
    instructor_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        null=True,
        blank=True
    )
    name = models.CharField(
        max_length=100
    )
    phone = models.CharField(
        max_length=15,
        unique=True,
        null=True,
        blank=True
    )
    email = models.EmailField(
        unique=True,
        null=True,
        blank=True
    )
    password = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )
    status = models.BooleanField(
        default=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def save(self, *args, **kwargs):
        if not self.instructor_id:
            while True:
                random_number = random.randint(1, 999)
                instructor_code = f"INST{random_number:03d}"
                if not InstructorProfile.objects.filter(instructor_id=instructor_code).exists():
                    self.instructor_id = instructor_code
                    break

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# Backward-compatible alias for existing imports and code paths.
Instructor = InstructorProfile


class InstructorCourseAllocation(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.CASCADE,
        related_name='course_allocations'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='instructor_allocations'
    )
    allocated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='allocations_made'
    )
    allocation_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    start_date = models.DateField(
        null=True,
        blank=True
    )
    end_date = models.DateField(
        null=True,
        blank=True
    )
    allocated_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = ('instructor', 'course')
        ordering = ['-allocated_at']

    def __str__(self):
        return f"{self.instructor.name} -> {self.course.course_name}"


class Assignment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    title = models.CharField(
        max_length=200
    )
    description = models.TextField(
        null=True,
        blank=True
    )
    image = models.ImageField(
        upload_to='assignments/',
        null=True,
        blank=True
    )
    due_date = models.DateField(
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.course.course_name}"


class AssignmentSubmission(models.Model):
    STATUS_CHOICES = [
        ("submitted", "Submitted"),
        ("reviewed", "Reviewed"),
    ]

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignment_submissions",
    )
    submission_file = models.FileField(
        upload_to="assignment_submissions/",
        null=True,
        blank=True,
    )
    submission_text = models.TextField(
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="submitted",
    )
    submitted_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-submitted_at"]
        unique_together = ("assignment", "student")

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"


class Note(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class CourseVideo(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="videos",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    video_url = models.URLField(max_length=500)
    thumbnail = models.ImageField(
        upload_to="course_videos/thumbnails/",
        null=True,
        blank=True,
    )
    order = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_videos",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["course", "order", "created_at"]

    def __str__(self):
        return self.title


class StudentEnrollment(models.Model):
    """
    Stores which students are enrolled in which courses.

    This is used to validate that only enrolled students can submit a
    StudentAssignment for a related assignment course.
    """

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_enrollments",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="student_enrollments",
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "course")
        ordering = ["-enrolled_at"]

    def __str__(self):
        return f"{self.student.username} -> {self.course.course_name}"


class StudentAssignment(models.Model):
    """
    A student submission for a specific assignment.

    The instructor is derived automatically from the related assignment so
    clients do not need to send instructor ids in request payloads.
    """

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="student_assignments",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_assignments",
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    media_file = models.FileField(
        upload_to="student_assignments/",
        null=True,
        blank=True,
    )
    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.CASCADE,
        related_name="student_assignments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("assignment", "student")

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"
