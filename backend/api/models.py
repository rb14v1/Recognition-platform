from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.core.exceptions import ValidationError
from django.utils import timezone
 
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
    manager_name = models.CharField(max_length=100, blank=True, null=True, help_text="Reporting Manager")
    email = models.EmailField(unique=True)
    location = models.CharField(max_length=100, blank=True, null=True, help_text="Office Location")
    manager = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='team_members'
    )
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
 
class Nomination(models.Model):
    nominator = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='nominations_made'
    )
    nominee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='nominations_received'
    )
   
    STATUS_CHOICES = [
        ('SUBMITTED', 'Submitted'),             # Step 1: Pending Coordinator
        ('APPROVED', 'Coordinator Approved'),   # Step 2: Pending Committee
        ('COMMITTEE_APPROVED', 'Finalist'),     # Step 3: Pending Admin Vote
        ('AWARDED', 'Winner'),                  # Step 4: Final Winner (Admin Only)
        ('REJECTED', 'Rejected'),               # Dropped
    ]
        # New fields you want:
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    nominator_name = models.CharField(max_length=100, blank=True, null=True)
    nominee_name = models.CharField(max_length=100, blank=True, null=True)
 
    reason = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        # This constraint ensures a user can only nominate ONE person total.
        # If they try to nominate again, the DB will throw an error.
        unique_together = ('nominator',)
 
    def __str__(self):
        return f"{self.nominator.username} -> {self.nominee.username}"    

class NominationTimeline(models.Model):
    name = models.CharField(max_length=50, help_text="e.g., 'Q4 2024 Awards'")
    is_active = models.BooleanField(default=True, help_text="Only one timeline should be active at a time")

    # Phase 1: Employees Nominate
    nomination_start = models.DateTimeField()
    nomination_end = models.DateTimeField()

    # Phase 2: Coordinators Review
    coordinator_start = models.DateTimeField()
    coordinator_end = models.DateTimeField()

    # Phase 3: Committee Selects Finalists
    committee_start = models.DateTimeField()
    committee_end = models.DateTimeField()

    # Phase 4: Voting
    voting_start = models.DateTimeField()
    voting_end = models.DateTimeField()

    def clean(self):
        # Optional: Ensure dates are sequential (Nomination < Coordinator < Committee < Vote)
        if self.nomination_end > self.coordinator_start:
            raise ValidationError("Coordinator review cannot start before Nominations end.")
        if self.coordinator_end > self.committee_start:
            raise ValidationError("Committee review cannot start before Coordinator review ends.")
    
    def save(self, *args, **kwargs):
        if self.is_active:
            # Ensure no other timeline is active
            NominationTimeline.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (Active: {self.is_active})"
 
class Vote(models.Model):
    voter = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='vote_cast'
    )
    nomination = models.ForeignKey(
        Nomination,
        on_delete=models.CASCADE,
        related_name='votes'
    )
    voted_at = models.DateTimeField(auto_now_add=True)
 
    def __str__(self):
        return f"{self.voter.username} voted for {self.nomination.nominee.username}"