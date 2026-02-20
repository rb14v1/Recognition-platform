import json
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from .models import Nomination, NominationTimeline, Notification, NOMINATION_CRITERIA
 
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
   
class CustomLoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
 
        # 1. Check if the username even exists
        user_exists = User.objects.filter(username=username).exists()
        if not user_exists:
            # APT REASON #1
            raise AuthenticationFailed({"detail": "This username does not exist."})
 
        # 2. If username exists, let standard logic check the password
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            # APT REASON #2
            # If we are here, username exists but password failed
            raise AuthenticationFailed({"detail": "Incorrect password. Please try again."})
           
        return data    
 
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # These are the fields your Frontend Context needs
        fields = ['id', 'username', 'email', 'role', 'employee_id', 'employee_dept', 'employee_role', 'location']
       
class UserNominationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'employee_id', 'employee_dept', 'employee_role', 'role', 'location']
 
class NominationTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = NominationTimeline
        fields = '__all__'
 
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
 
# 2. For the "Action" of nominating
class NominationSerializer(serializers.ModelSerializer):
    nominator_name = serializers.ReadOnlyField(source='nominator.username')
    nominee_name = serializers.ReadOnlyField(source='nominee.username')
    nominee_role = serializers.ReadOnlyField(source='nominee.employee_role')
    nominee_dept = serializers.ReadOnlyField(source='nominee.employee_dept')
    category = serializers.SerializerMethodField()
    nominee = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    # Expects list: [{"category": "Innovation", "metric": "Idea"}, {"category": "Innovation", "metric": "AI"}]
    selected_metrics = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=True
    )
 
    class Meta:
        model = Nomination
        fields = [
            'id',
            'nominee',          
            'nominator_name',
            'nominee_name',
            'nominee_role',
            'nominee_dept',
            'reason',
            'submitted_at',
            'status',
            'category',
            'selected_metrics'
        ]
        
    def get_category(self, obj):
        """Safely extract the category from the selected_metrics array"""
        try:
            metrics = obj.selected_metrics
            if isinstance(metrics, list) and len(metrics) > 0:
                return metrics[0].get('category', 'N/A')
            elif isinstance(metrics, str):
                parsed = json.loads(metrics)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed[0].get('category', 'N/A')
        except Exception:
            pass
        return 'N/A'

    def validate_selected_metrics(self, value):
        """
        Enforce:
        1. List is not empty.
        2. All items must belong to the SAME category.
        3. Metrics must be valid for that category.
        """
        if not value:
            raise serializers.ValidationError("You must select at least one metric.")
 
        # 1. Get the category of the first item
        first_category = value[0].get('category')
       
        if first_category not in NOMINATION_CRITERIA:
            raise serializers.ValidationError(f"Invalid category: '{first_category}'")
 
        # 2. Iterate and validate
        for item in value:
            cat = item.get('category')
            met = item.get('metric')
 
            # Enforce Single Category Rule
            if cat != first_category:
                 raise serializers.ValidationError(
                     "You can only select metrics from ONE category per nomination."
                 )
 
            # Check Metric Validity
            valid_metrics = NOMINATION_CRITERIA[cat]
            if met not in valid_metrics:
                raise serializers.ValidationError(f"'{met}' is not a valid metric for category '{cat}'")
 
        return value 

class FinalistSerializer(serializers.ModelSerializer):

    nominee_name = serializers.SerializerMethodField()
    nominee_dept = serializers.CharField(source='nominee.employee_dept')
    nominee_role = serializers.CharField(source='nominee.employee_role')
    nominator_name = serializers.CharField(source='nominator.username')
 
    class Meta:
        model = Nomination
        fields = ['id', 'nominee_name', 'nominee_dept', 'nominee_role', 'nominator_name', 'reason']

    def get_nominee_name(self, obj):
        return f"{obj.nominee.first_name} {obj.nominee.last_name}".strip() or obj.nominee.username
    
    
# 2. For Admins (Includes vote_count)
class AdminVoteResultSerializer(serializers.ModelSerializer):
    nominee_name = serializers.CharField(source='nominee.username')
    employee_id = serializers.CharField(source='nominee.employee_id')
    employee_role = serializers.CharField(source='nominee.employee_role')
    employee_dept = serializers.CharField(source='nominee.employee_dept')
    vote_count = serializers.IntegerField()
 
    class Meta:
        model = Nomination
        fields = [
            'id', 'nominee_name', 'employee_id', 'employee_role',
            'employee_dept', 'reason', 'status', 'vote_count'
        ]