from django.shortcuts import render
from rest_framework.permissions import IsAdminUser
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer, UserSerializer, GroupSerializer
from django.contrib.auth.models import User, Group

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (IsAdminUser,) 
    serializer_class = RegisterSerializer

class UserListView(generics.ListAPIView):
    """
    Vista de API para listar todos los usuarios.
    Solo los administradores (is_staff=True) pueden acceder.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

class GroupListView(generics.ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAdminUser]