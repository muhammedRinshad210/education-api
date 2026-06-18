# accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model  # ✅ Fix auth.User error

from accounts.models import (
    Accounts,
    Instructor,
    Course,
    Category,
    InstructorCourseAllocation,
    Assignment
)

# ✅ Get correct User model (works with custom user model)
User = get_user_model()


# ─────────────────────────────────────────────
# User Serializer
# ─────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active'
        ]


# ─────────────────────────────────────────────
# Account Serializer
# ─────────────────────────────────────────────

class AccountSerializer(serializers.ModelSerializer):

    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'email',
            'phone',
            'role'
        ]


# ─────────────────────────────────────────────
# Register Serializer
# ─────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):

    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'password',
            'email',
            'phone',
            'role'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):

        user = Accounts.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            phone=validated_data.get('phone'),
            role=validated_data['role']
        )

        return user


class StudentRegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match"}
            )

        if Accounts.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError(
                {"username": "A user with that username already exists."}
            )

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        return Accounts.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email", ""),
            phone=validated_data.get("phone"),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="student",
        )


# ─────────────────────────────────────────────
# Admin Profile Serializer
# ─────────────────────────────────────────────

class AdminProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'phone',
            'is_active',
            'is_superuser',
            'is_staff'
        ]


class StudentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accounts
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'phone',
            'role',
            'is_active',
            'date_joined',
        ]


# ─────────────────────────────────────────────
# Category Serializer
# ─────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = '__all__'

    def validate_name(self, value):

        value = value.lower()

        # Exclude current instance when updating
        if self.instance:

            if Category.objects.filter(
                name__iexact=value
            ).exclude(
                id=self.instance.id
            ).exists():

                raise serializers.ValidationError(
                    "Category already exists"
                )

        else:

            if Category.objects.filter(
                name__iexact=value
            ).exists():

                raise serializers.ValidationError(
                    "Category already exists"
                )

        return value


# ─────────────────────────────────────────────
# Course Serializer
# ─────────────────────────────────────────────

class CourseSerializer(serializers.ModelSerializer):

    # For writing (accepts category ID)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )

    # For reading (shows category details)
    category_details = CategorySerializer(
        source='category',
        read_only=True
    )

    class Meta:
        model = Course
        fields = [
            'id',
            'user',
            'category',
            'category_details',
            'course_name',
            'duration',
            'fees'
        ]
        read_only_fields = ['user']


# ─────────────────────────────────────────────
# Instructor Serializer
# ─────────────────────────────────────────────

class InstructorSerializer(serializers.ModelSerializer):

    # Show linked user details (read only)
    user_info = UserSerializer(
        source='user',
        read_only=True
    )

    class Meta:
        model = Instructor
        fields = [
            'id',
            'instructor_id',
            'name',
            'phone',
            'email',
            'status',
            'created_at',
            'user',         # FK field (write)
            'user_info'     # Nested (read)
        ]
        extra_kwargs = {
            'user': {
                'write_only': True,
                'required': False
            },
            'password': {
                'write_only': True
            }
        }


# ─────────────────────────────────────────────
# Instructor Course Allocation Serializer
# ─────────────────────────────────────────────

class InstructorCourseAllocationSerializer(serializers.ModelSerializer):

    # Nested read-only details
    instructor_detail = InstructorSerializer(
        source='instructor',
        read_only=True
    )

    course_detail = CourseSerializer(
        source='course',
        read_only=True
    )

    allocated_by_detail = UserSerializer(
        source='allocated_by',
        read_only=True
    )

    class Meta:
        model = InstructorCourseAllocation
        fields = [
            'id',
            'instructor',           # FK (write)
            'course',               # FK (write)
            'allocated_by',         # FK (write)
            'allocation_status',
            'start_date',
            'end_date',
            'allocated_at',
            'instructor_detail',    # Nested (read)
            'course_detail',        # Nested (read)
            'allocated_by_detail'   # Nested (read)
        ]
        extra_kwargs = {
            'instructor': {
                'write_only': True
            },
            'course': {
                'write_only': True
            },
            'allocated_by': {
                'write_only': True,
                'required': False
            }
        }

    def validate(self, data):

        instructor = data.get('instructor')
        course = data.get('course')

        # Duplicate check on create only
        if not self.instance:

            if InstructorCourseAllocation.objects.filter(
                instructor=instructor,
                course=course
            ).exists():

                raise serializers.ValidationError(
                    {
                        "error": "This instructor is already allocated to this course"
                    }
                )

        return data


# ─────────────────────────────────────────────
# Instructor Register Serializer
# ─────────────────────────────────────────────

class InstructorRegisterSerializer(serializers.Serializer):

    instructor_id = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):

        if data['password'] != data['confirm_password']:

            raise serializers.ValidationError(
                {
                    "confirm_password": "Passwords do not match"
                }
            )

        try:

            instructor = Instructor.objects.get(
                instructor_id=data['instructor_id'],
                email=data['email'],
                phone=data['phone']
            )

        except Instructor.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "error": "Invalid Instructor Credentials"
                }
            )

        data['instructor'] = instructor

        return data


# ─────────────────────────────────────────────
# Instructor Login Serializer
# ─────────────────────────────────────────────

class InstructorLoginSerializer(serializers.Serializer):

    username = serializers.CharField()
    password = serializers.CharField()


# serializers.py

from rest_framework import serializers
from .models import Course

class CourseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Course
        fields = [
            'id',
            'course_code',
            'course_name',
            'duration',
            'fees',
            'description'
        ]


class AssignmentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        source='title'
    )

    class Meta:
        model = Assignment
        fields = [
            'id',
            'course',
            'instructor',
            'name',
            'description',
            'image',
            'due_date',
            'status',
            'created_at'
        ]
        read_only_fields = [
            'instructor',
            'status',
            'created_at'
        ]
        extra_kwargs = {
            'image': {
                'required': False,
                'allow_null': True
            }
        }
