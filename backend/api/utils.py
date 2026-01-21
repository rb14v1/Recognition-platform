from django.core.mail import send_mail
from django.conf import settings
from .models import Notification


def send_notification(user, message, title=None, notif_type="INFO"):
    if not title:
        title = "Notification"

    # Save notification in DB
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notif_type
    )

    # Safety check
    if not user.email:
        print(" No email for user:", user.username)
        return

    print("📨 Sending email to:", user.email)

    # Send email (DO NOT silence errors)
    send_mail(
        subject=title,
        message=message,
        from_email=settings.EMAIL_HOST_USER,   # MUST match login
        recipient_list=[user.email],
        fail_silently=False,                   # 🔥 VERY IMPORTANT
    )
