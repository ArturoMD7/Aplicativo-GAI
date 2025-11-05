from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth.models import User, Group

@receiver(post_migrate)
def create_default_admin_and_group(sender, **kwargs):
    
    group_names = [
        'Admin',
        'AdminCentral',
        'SupervisorNTE',
        'OperadorNTE',
        'SupervisorSUR',
        'OperadorSUR',
        'SupervisorSTE',
        'OperadorSTE',
        'SupervisorALT',
        'OperadorALT',
        'SupervisorOFC',
        'OperadorOFC',
    ]

    for name in group_names:
        Group.objects.get_or_create(name=name)
    
    # 2. Crear el usuario Admin por defecto si no existe
    if not User.objects.filter(username='admin@pemex.com').exists():
        print("Creando usuario admin por defecto: admin@pemex.com")
        
        # Usamos 'create_superuser' para que sea admin de Django
        admin_user = User.objects.create_superuser(
            username='admin@pemex.com',
            email='admin@pemex.com',
            password='admin1234',
            first_name='Admin',
            last_name='Pemex'
        )
        
        # 3. Asignar el usuario al grupo "Admin"
        admin_group = Group.objects.get(name='Admin')
        admin_user.groups.add(admin_group)
        print("Usuario admin creado y añadido al grupo 'Admin'.")