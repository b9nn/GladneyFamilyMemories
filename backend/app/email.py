import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

_SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password',
              'from_email', 'from_name', 'admin_email', 'site_url']


def get_smtp_config(db: 'Session | None' = None) -> dict:
    """Return effective SMTP config: DB values override env vars."""
    config: dict = {
        'smtp_host':     os.getenv("SMTP_HOST", ""),
        'smtp_port':     int(os.getenv("SMTP_PORT", "587")),
        'smtp_user':     os.getenv("SMTP_USER", ""),
        'smtp_password': os.getenv("SMTP_PASSWORD", ""),
        'from_email':    os.getenv("FROM_EMAIL", "noreply@mrtag.com"),
        'from_name':     os.getenv("FROM_NAME", "Gladney Family Tree"),
        'site_url':      os.getenv("SITE_URL", "https://mrtag.com"),
        'admin_email':   os.getenv("ADMIN_EMAIL", os.getenv("SMTP_USER", "")),
    }
    if db is not None:
        from .models import SiteSetting
        rows = db.query(SiteSetting).filter(SiteSetting.key.in_(_SMTP_KEYS)).all()
        for row in rows:
            if row.value:
                config[row.key] = int(row.value) if row.key == 'smtp_port' else row.value
    return config


def send_email(to: str, subject: str, html: str, db: 'Session | None' = None) -> tuple[bool, str]:
    """Returns (success, error_message). error_message is empty on success."""
    cfg = get_smtp_config(db)
    if not cfg['smtp_host'] or not cfg['smtp_user']:
        msg = "SMTP not configured — set SMTP host and username in Admin > SMTP/Email"
        print(f"[EMAIL] {msg}")
        return False, msg
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        port = cfg['smtp_port']
        if port == 465:
            with smtplib.SMTP_SSL(cfg['smtp_host'], port) as s:
                s.login(cfg['smtp_user'], cfg['smtp_password'])
                s.sendmail(cfg['from_email'], to, msg.as_string())
        else:
            with smtplib.SMTP(cfg['smtp_host'], port) as s:
                s.starttls()
                s.login(cfg['smtp_user'], cfg['smtp_password'])
                s.sendmail(cfg['from_email'], to, msg.as_string())
        print(f"[EMAIL] Sent to {to}: {subject}")
        return True, ""
    except Exception as e:
        print(f"[EMAIL] Failed sending to {to}: {e}")
        return False, str(e)


def send_invite_email(to_email: str, to_name: str, code: str, db: 'Session | None' = None) -> tuple[bool, str]:
    cfg = get_smtp_config(db)
    site_url = cfg['site_url']
    link = f"{site_url}/register?code={code}"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <p>Hi {to_name},</p>
      <p>This is your invitation to 'Lorna and Tom's Memories' website.</p>
      <p>We have included vignettes of our memories, some photos, and a few interesting historical files.</p>
      <p>At some point you might be interested to know more about us, we hope!</p>
      <p style="margin:24px 0;">
        <a href="{link}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Accept Invitation</a>
      </p>
      <p style="color:#666;font-size:13px;">Or copy this link: <a href="{link}">{link}</a></p>
      <p style="color:#666;font-size:13px;">This invitation code can only be used once.</p>
      <p>Lorna and Tom</p>
    </div>
    """
    return send_email(to_email, "Your invitation to Lorna and Tom's Memories", html, db)


def send_password_reset_email(to_email: str, username: str, token: str, db: 'Session | None' = None) -> bool:
    cfg = get_smtp_config(db)
    site_url = cfg['site_url'] or 'https://mrtag.com'
    link = f"{site_url}/reset-password?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">Reset your password</h2>
      <p>Hi {username},</p>
      <p>Someone (hopefully you) requested a password reset for your account on the Gladney Family Tree.</p>
      <p style="margin:24px 0;">
        <a href="{link}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a>
      </p>
      <p style="color:#666;font-size:13px;">Or copy this link: <a href="{link}">{link}</a></p>
      <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    </div>
    """
    ok, _ = send_email(to_email, "Reset your password", html, db)
    return ok


def notify_admin_new_registration(username: str, email: str, db: 'Session | None' = None) -> None:
    cfg = get_smtp_config(db)
    admin_email = cfg['admin_email']
    if not admin_email:
        return
    site_url = cfg['site_url']
    send_email(
        admin_email,
        f"New registration: {username}",
        f"<h2>New Registration</h2><p><b>Username:</b> {username}<br><b>Email:</b> {email or 'not provided'}</p>"
        f"<p><a href='{site_url}/admin'>View Admin Panel</a></p>",
        db,
    )  # fire-and-forget; ignore result
