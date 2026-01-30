from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
import os
from django.conf import settings
from .models import CatalogoInvestigador

@receiver(post_delete, sender=CatalogoInvestigador)
def delete_constancia_on_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem when corresponding `CatalogoInvestigador` object is deleted.
    """
    if instance.archivo_constancia:
        if os.path.isfile(instance.archivo_constancia.path):
            os.remove(instance.archivo_constancia.path)


