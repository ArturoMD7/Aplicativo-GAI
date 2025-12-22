from django.contrib.auth.models import User, Group
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para listar usuarios.
    Muestra los grupos (roles) a los que pertenece.
    """
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="name"
    )

    ficha = serializers.CharField(source='profile.ficha', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'groups', 'ficha']

class RegisterSerializer(serializers.ModelSerializer):

    ficha = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Este email ya está en uso.")]
    )
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, label="Confirmar contraseña")
    
    groups = serializers.SlugRelatedField(
        many=True,
        slug_field='name',
        queryset=Group.objects.all(),
        required=False 
    )

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'groups', 'ficha')
        


    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        ficha_value = validated_data.pop('ficha', None)
        groups_data = validated_data.pop('groups', None)
        
        user = User.objects.create_user(
            username=validated_data['email'], 
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        if groups_data:
            user.groups.set(groups_data)
            user.is_staff = True
            user.save()

        if ficha_value:
            user.profile.ficha = ficha_value
            user.profile.save()

        return user
    
class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar información básica del usuario
    """
    ficha = serializers.CharField(source='profile.ficha', required=False)

    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Este email ya está en uso.")]
    )

    class FichaField(serializers.Field):
        """
        Campo personalizado para validar y serializar el número de ficha.
        """
        def to_representation(self, value):
            return str(value) if value else None

        def to_internal_value(self, data):
            if not data:
                raise serializers.ValidationError("La ficha es requerida.")
            if not str(data).isdigit():
                raise serializers.ValidationError("La ficha debe contener solo números.")
            return str(data)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'ficha']
        read_only_fields = ['id', 'username']

    def update(self, instance, validated_data):
        # Extraer datos del perfil si existen
        profile_data = validated_data.pop('profile', {})
        ficha = profile_data.get('ficha')

        if 'email' in validated_data:
            instance.username = validated_data['email']
        
        # Actualizar usuario
        instance = super().update(instance, validated_data)

        # Actualizar ficha en el perfil
        if ficha:
            instance.profile.ficha = ficha
            instance.profile.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para cambio de contraseña
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "Las nuevas contraseñas no coinciden."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance

class AdminResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "Las nuevas contraseñas no coinciden."})
        return attrs

        
    
    