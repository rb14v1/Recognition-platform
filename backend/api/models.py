from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.core.exceptions import ValidationError
from django.utils import timezone

class CustomUserManager(UserManager):
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'COORDINATOR')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('role') != 'COORDINATOR':
            raise ValueError('Superuser must have role=COORDINATOR.')
        return super().create_superuser(username, email, password, **extra_fields)

class User(AbstractUser):
    # Constants
    EMPLOYEE = 'EMPLOYEE'
    COORDINATOR = 'COORDINATOR'
    ADMIN = 'ADMIN' 

    ROLE_CHOICES = [
        (EMPLOYEE, 'Employee'),
        (COORDINATOR, 'Coordinator/Manager'),
        (ADMIN, 'Admin'),
    ]

    # ROLE_HIERARCHY
    ROLE_HIERARCHY = {
        EMPLOYEE: 1,
        COORDINATOR: 2,
        ADMIN: 3
    }

    # Standard Fields
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True, help_text="Unique Org ID")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=EMPLOYEE)
    email = models.EmailField(unique=True)
    
    contract_type = models.CharField(max_length=50, null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    line_manager_name = models.CharField(max_length=150, null=True, blank=True)
    # We use these existing columns to store Practice & Portfolio
    employee_dept = models.CharField(max_length=100, null=True, blank=True, help_text="Stores 'Practice'")
    employee_role = models.CharField(max_length=100, null=True, blank=True, help_text="Stores 'Portfolio'")

    # PYTHON MAPPINGS (Properties)
    @property
    def practice(self):
        return self.employee_dept

    @practice.setter
    def practice(self, value):
        self.employee_dept = value

    @property
    def portfolio(self):
        return self.employee_role

    @portfolio.setter
    def portfolio(self, value):
        self.employee_role = value

    def __str__(self):
        return f"{self.username} ({self.role})"

    def get_role_level(self):
        return self.ROLE_HIERARCHY.get(self.role, 1)

# NOMINATION CRITERIA & MODELS 

NOMINATION_CRITERIA = {
    "Collaboration & Engagement": [
        "Communication Response", "Community Engagement", "Cross-Team Collaboration",
        "Employee Engagement", "Knowledge Sharing", "Mentorship", "Team Participation"
    ],
    "Customer Impact": [
        "Critical Project Delivery", "Customer Acquisition", "Customer Satisfaction Score",
        "Response Time", "Retention Rate", "SLA Compliance"
    ],
    "Innovation & Growth": [
        "AI Tool Implementation", "Digital Transformation", "Idea Implementation",
        "Market Share", "New Initiatives", "New Revenue Streams",
        "Product Development", "Research & Development"
    ],
    "Performance & Efficiency": [
        "Cost Savings", "Onboarding Time", "Process Automation",
        "Project Delivery Speed", "Resource Utilisation", "Task Completion"
    ],
    "Quality & Compliance": [
        "Audit Non-Compliance", "Compliance Score", "Critical Defects",
        "Cybersecurity Incidents", "Data Accuracy", "Error Rate Reduction",
        "First-Time Resolution"
    ]
}

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
        ('NOMINATION_SUBMITTED', 'Submitted'),
        ('COORDINATOR_APPROVED', 'Coordinator Approved'),
        ('COORDINATOR_REJECTED', 'Coordinator Rejected'),
        ('COMMITTEE_APPROVED', 'Committee Approved'),
        ('COMMITTEE_REJECTED', 'Committee Rejected'),
        ('AWARDED', 'Winner'),
    ]

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='NOMINATION_SUBMITTED')
    nominator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nominations_made')
    nominee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nominations_received')
    selected_metrics = models.JSONField(default=list, blank=True)
    reason = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
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
    
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, default="INFO") 
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"