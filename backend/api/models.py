from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager

# 1. We define a custom manager to handle the "Auto-Admin" logic
class CustomUserManager(UserManager):
    def create_superuser(self, username, email, password=None, **extra_fields):
        # Force the role to be ADMIN by default for superusers
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

    # Custom Fields
    employee_id = models.CharField(max_length=20, unique=True, help_text="Unique Org ID")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=EMPLOYEE)
    email = models.EmailField(unique=True)

    # 2. Tell Django to use our smart Manager
    objects = CustomUserManager()

    # 3. This ensures 'createsuperuser' asks for these fields in the terminal
    REQUIRED_FIELDS = ['email', 'employee_id'] 

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def role_level(self):
        levels = {
            'ADMIN': 4,
            'COMMITTEE': 3,
            'COORDINATOR': 2,
            'EMPLOYEE': 1
        }
        return levels.get(self.role, 1)