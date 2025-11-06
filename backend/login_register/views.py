from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import render
from rest_framework.permissions import IsAdminUser
from rest_framework import generics, permissions
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer, UserSerializer, GroupSerializer, UserUpdateSerializer, ChangePasswordSerializer
from django.contrib.auth.models import User, Group

class IsAdminGroup(permissions.BasePermission):
    """
    Permiso personalizado que verifica si el usuario pertenece al grupo 'Admin'
    """
    def has_permission(self, request, view):
        # Verificar si el usuario está autenticado y pertenece al grupo Admin
        return request.user and request.user.is_authenticated and request.user.groups.filter(name='Admin').exists()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (IsAdminGroup,) 
    serializer_class = RegisterSerializer

class UserListView(generics.ListAPIView):
    """
    Vista de API para listar todos los usuarios.
    Solo los administradores (is_staff=True) pueden acceder.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminGroup]

class GroupListView(generics.ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAdminGroup]

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Obtener o actualizar el perfil del usuario autenticado
    """
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Cambiar contraseña del usuario autenticado
    """
    user = request.user
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"message": "Contraseña actualizada correctamente."})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminGroup])
def user_detail(request, user_id):
    """
    Obtener, actualizar o eliminar un usuario específico
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "Usuario no encontrado."}, 
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Actualizar grupos si se envían en la request
            if 'groups' in request.data:
                groups_data = request.data['groups']
                groups = Group.objects.filter(name__in=groups_data)
                user.groups.set(groups)
            
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # No permitir eliminar al propio usuario
        if user == request.user:
            return Response(
                {"error": "No puedes eliminar tu propio usuario."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_email = user.email
        user.delete()
        return Response(
            {"message": f"Usuario {user_email} eliminado correctamente."},
            status=status.HTTP_200_OK
        )

