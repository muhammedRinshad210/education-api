from django.contrib import admin
from django.apps import apps

from .models import Accounts, Course, Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "status", "enrolled_at")
    list_filter = ("status", "course")
    search_fields = ("student__username", "course__course_name")
    ordering = ("-enrolled_at",)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "student":
            kwargs["queryset"] = Accounts.objects.filter(role="student").order_by("username")
        elif db_field.name == "course":
            kwargs["queryset"] = Course.objects.filter(status=True).order_by("course_name")

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

# =====================================================
# AUTO REGISTER ALL MODELS
# =====================================================

app_models = apps.get_app_config('accounts').get_models()

for model in app_models:

    try:
        admin.site.register(model)

    except admin.sites.AlreadyRegistered:
        pass
