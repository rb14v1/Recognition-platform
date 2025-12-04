from rest_framework import serializers
from django.contrib.auth import get_user_model
 
User = get_user_model()
 
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
 
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'employee_id','employee_dept','employee_role']
        # Note: 'role' is excluded so they can't set it themselves.
 
    def create(self, validated_data):
        # Create user with default role (Employee)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            employee_id=validated_data['employee_id'],
            employee_dept=validated_data.get('employee_dept', None), 
            employee_role=validated_data.get('employee_role', None),
            role=User.EMPLOYEE # Force default
        )
        return user
 
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # These are the fields your Frontend Context needs
        fields = ['id', 'username', 'email', 'role', 'employee_id', 'employee_dept', 'employee_role']