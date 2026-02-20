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

    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2d3436;">{title}</h2>
        <p>{message}</p>
        <br>
        <hr size="1" color="#eee">
        <p style="font-size: 12px; color: #636e72;">This is an automated system message. Please do not reply.</p>
    </div>
    """

    # Send email (DO NOT silence errors)
    send_mail(
        subject=title,
        message=message,
        from_email=settings.EMAIL_HOST_USER,  
        recipient_list=[user.email],
        html_message=html_content,
        fail_silently=False,                   
    )
