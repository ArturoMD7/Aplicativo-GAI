from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    ficha = models.CharField(max_length=50, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def __str__(self):
        return self.user.username

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
import os

@receiver(post_delete, sender=Profile)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem
    when corresponding `Profile` object is deleted.
    """
    if instance.profile_picture:
        if os.path.isfile(instance.profile_picture.path):
            os.remove(instance.profile_picture.path)

@receiver(pre_save, sender=Profile)
def auto_delete_file_on_change(sender, instance, **kwargs):
    """
    Deletes old file from filesystem
    when corresponding `Profile` object is updated with new file.
    """
    if not instance.pk:
        return False

    try:
        old_file = Profile.objects.get(pk=instance.pk).profile_picture
    except Profile.DoesNotExist:
        return False

    new_file = instance.profile_picture
    if not old_file == new_file:
        if old_file and os.path.isfile(old_file.path):
            os.remove(old_file.path)
