from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager

class CustomUserManager(UserManager):
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('role') != 'ADMIN':
            raise ValueError('Superuser must have role=ADMIN.')
        return super().create_superuser(username, email, password, **extra_fields)

class User(AbstractUser):
    # Constants
    EMPLOYEE = 'EMPLOYEE'
    COORDINATOR = 'COORDINATOR'
    COMMITTEE = 'COMMITTEE'
    ADMIN = 'ADMIN'

    ROLE_CHOICES = [
        (EMPLOYEE, 'Employee'),
        (COORDINATOR, 'Coordinator/Manager'),
        (COMMITTEE, 'Committee'),
        (ADMIN, 'Admin'),
    ]

    # SINGLE SOURCE OF TRUTH
    # We define the ranking here. Higher number = more power.
    ROLE_HIERARCHY = {
        EMPLOYEE: 1,
        COORDINATOR: 2,
        COMMITTEE: 3,
        ADMIN: 4
    }

    employee_id = models.CharField(max_length=20, unique=True, help_text="Unique Org ID")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=EMPLOYEE)
    email = models.EmailField(unique=True)

    objects = CustomUserManager()
    REQUIRED_FIELDS = ['email', 'employee_id'] 

    def __str__(self):
        return f"{self.username} ({self.role})"

    # ✅ BUSINESS LOGIC BELONGS HERE
    def get_role_level(self):
        """Returns integer level of current user's role"""
        return self.ROLE_HIERARCHY.get(self.role, 1)

    def can_promote(self, new_role_string):
        """
        Check if this user has authority to promote someone to new_role.
        Rule: You cannot promote someone to a level >= your own.
        """
        target_level = self.ROLE_HIERARCHY.get(new_role_string)
        
        # If role doesn't exist, we can't promote
        if target_level is None:
            return False
            
        return self.get_role_level() > target_level