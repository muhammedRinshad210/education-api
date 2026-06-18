from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Accounts, AdminProfile, StudentProfile


@receiver(post_save, sender=Accounts)
def create_role_profile(sender, instance, created, **kwargs):
    if not created:
        return

    if instance.role == "admin" or instance.is_superuser:
        AdminProfile.objects.get_or_create(user=instance)
    elif instance.role == "student":
        StudentProfile.objects.get_or_create(user=instance)
