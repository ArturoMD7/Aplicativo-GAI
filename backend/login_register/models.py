from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    ficha = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.user.username
