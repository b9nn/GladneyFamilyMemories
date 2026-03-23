import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@mrtag.com")
FROM_NAME = os.getenv("FROM_NAME", "Gladney Family Tree")
SITE_URL = os.getenv("SITE_URL", "https://mrtag.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", SMTP_USER)


def send_email(to: str, subject: str, html: str) -> bool:
    if not SMTP_HOST or not SMTP_USER:
        print(f"[EMAIL] Not configured. Would send to {to}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(FROM_EMAIL, to, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL] Failed: {e}")
        return False


def notify_admin_new_registration(username: str, email: str) -> None:
    if not ADMIN_EMAIL:
        return
    send_email(
        ADMIN_EMAIL,
        f"New registration: {username}",
        f"<h2>New Registration</h2><p><b>Username:</b> {username}<br><b>Email:</b> {email or 'not provided'}</p><p><a href='{SITE_URL}/admin'>View Admin Panel</a></p>",
    )
