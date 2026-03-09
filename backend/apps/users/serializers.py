from rest_framework import serializers
from .models import User, Role, Permission, UserRole, RolePermission

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Role
        fields = ['id', 'role_name', 'description', 'permissions', 'permission_ids']

    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)
        for perm_id in permission_ids:
            RolePermission.objects.create(role=role, permission_id=perm_id)
        return role

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if permission_ids is not None:
            RolePermission.objects.filter(role=instance).delete()
            for perm_id in permission_ids:
                RolePermission.objects.create(role=instance, permission_id=perm_id)
                
        return instance

class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name', 
            'role', 'roles', 'role_ids', 'is_active', 'is_staff', 
            'is_superuser', 'mfa_enabled', 'last_login', 'date_joined',
            'phone_number', 'department', 'hub'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False}
        }

    def validate(self, attrs):
        # Ensure username is set to email if not provided
        if not attrs.get('username') and attrs.get('email'):
            attrs['username'] = attrs.get('email')
        return attrs

    def create(self, validated_data):
        role_ids = validated_data.pop('role_ids', [])
        password = validated_data.pop('password', None)
        
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        for role_id in role_ids:
            UserRole.objects.create(user=user, role_id=role_id)
        return user

    def update(self, instance, validated_data):
        role_ids = validated_data.pop('role_ids', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        if role_ids is not None:
            UserRole.objects.filter(user=instance).delete()
            for role_id in role_ids:
                UserRole.objects.create(user=instance, role_id=role_id)
        
        return instance
