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
    employee_dept = models.CharField(max_length=50, blank=True, null=True)
    employee_role = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(unique=True)
 
    objects = CustomUserManager()
    REQUIRED_FIELDS = ['email', 'employee_id']
 
    def __str__(self):
        return f"{self.username} ({self.role})"
 
    # ✅ BUSINESS LOGIC BELONGS HERE
    def get_role_level(self):
        """Returns integer level of current user's role"""
        return self.ROLE_HIERARCHY.get(self.role, 1)
 
    def can_promote(self, target_user, new_role_string):
        """
        Security Checks:
        1. Requestor cannot promote someone to a level higher than themselves.
        2. Requestor cannot modify someone who is ALREADY higher/equal to themselves.
        3. Requestor cannot modify themselves.
        """
        # 0. Self-check
        if self.id == target_user.id:
            return False, "You cannot change your own role."
 
        my_level = self.get_role_level()
        target_current_level = target_user.get_role_level()
        new_role_level = self.ROLE_HIERARCHY.get(new_role_string)
 
        if new_role_level is None:
            return False, "Invalid role."
 
        # 1. The "Ambition" Check (Cannot create a god)
        if new_role_level > my_level:
            return False, "You cannot promote someone to a level higher than your own."
 
        # 2. The "Mutiny" Check (Cannot touch your boss)
        if target_current_level >= my_level:
            return False, "You cannot modify the role of someone who outranks you or is your peer."
 
        return True, "Allowed"
 