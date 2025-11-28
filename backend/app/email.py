"""
Email utility for sending invite codes and notifications.
Supports Gmail SMTP for easy setup.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional


def get_email_config():
    """Get email configuration from environment variables"""
    return {
        'smtp_host': os.getenv('SMTP_HOST', 'smtp.gmail.com'),
        'smtp_port': int(os.getenv('SMTP_PORT', '587')),
        'smtp_user': os.getenv('SMTP_USER'),
        'smtp_password': os.getenv('SMTP_PASSWORD'),
        'from_email': os.getenv('FROM_EMAIL'),
        'from_name': os.getenv('FROM_NAME', 'Family Tree'),
        'site_url': os.getenv('SITE_URL', 'http://localhost:3000'),
    }


def is_email_configured():
    """Check if email is properly configured"""
    config = get_email_config()
    return all([
        config['smtp_user'],
        config['smtp_password'],
        config['from_email']
    ])


def send_invite_email(to_email: str, invite_code: str, recipient_name: Optional[str] = None) -> bool:
    """
    Send an invite code email to a user.

    Args:
        to_email: Recipient email address
        invite_code: The invite code to send
        recipient_name: Optional recipient name for personalization

    Returns:
        True if email sent successfully, False otherwise
    """

    if not is_email_configured():
        print("[EMAIL] Email not configured. Skipping send.")
        return False

    config = get_email_config()

    # Create greeting
    greeting = f"Hi {recipient_name}," if recipient_name else "Hi,"

    # Create email content
    subject = "Join L&TG's Private Memories Website"

    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
            }}
            .invite-code {{
                background: #f8f9fa;
                border: 2px dashed #667eea;
                padding: 20px;
                text-align: center;
                margin: 25px 0;
                border-radius: 8px;
            }}
            .code {{
                font-family: 'Courier New', monospace;
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
                letter-spacing: 2px;
            }}
            .button {{
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 8px 8px;
                font-size: 14px;
                color: #666;
            }}
            .steps {{
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }}
            .steps ol {{
                margin: 10px 0;
                padding-left: 20px;
            }}
            .steps li {{
                margin: 8px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌳 Welcome to Lorna and Tom's Memories Website</h1>
        </div>

        <div class="content">
            <p>{greeting}</p>

            <p>This is an invitation to join Lorna and Tom's private Memories website... we will be posting written vignettes, photos, audio files (maybe), and other files you may be interested to view sometime, to know more about us!</p>

            <div class="invite-code">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your Invite Code:</p>
                <div class="code">{invite_code}</div>
            </div>

            <div class="steps">
                <p style="margin: 0 0 10px 0; font-weight: bold;">How to get started:</p>
                <ol>
                    <li>Click the button below to visit the website</li>
                    <li>Click "Register" on the login page</li>
                    <li>Enter your invite code: <strong>{invite_code}</strong></li>
                    <li>Complete the registration form</li>
                    <li>Start exploring and sharing memories!</li>
                </ol>
            </div>

            <div style="text-align: center;">
                <a href="{config['site_url']}/login" class="button">Get Started</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                <strong>Note:</strong> This invite code can only be used once and will expire in 30 days.
            </p>
        </div>

        <div class="footer">
            <p>This is an automated email from our Family Tree website.</p>
            <p>If you have any questions, please contact the site administrator.</p>
        </div>
    </body>
    </html>
    """

    # Plain text version
    text_body = f"""
    {greeting}

    You've been invited to join our family tree website!

    Your Invite Code: {invite_code}

    How to get started:
    1. Visit: {config['site_url']}/login
    2. Click "Register"
    3. Enter your invite code: {invite_code}
    4. Complete the registration form
    5. Start exploring and sharing memories!

    Note: This invite code can only be used once and will expire in 30 days.

    ---
    This is an automated email from our Family Tree website.
    """

    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{config['from_name']} <{config['from_email']}>"
        msg['To'] = to_email

        # Attach both plain text and HTML versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        print(f"[EMAIL] Connecting to {config['smtp_host']}:{config['smtp_port']}")
        with smtplib.SMTP(config['smtp_host'], config['smtp_port']) as server:
            server.starttls()
            server.login(config['smtp_user'], config['smtp_password'])
            server.send_message(msg)

        print(f"[EMAIL] Successfully sent invite to {to_email}")
        return True

    except Exception as e:
        print(f"[EMAIL] Failed to send email to {to_email}: {str(e)}")
        return False


def test_email_config():
    """Test email configuration by attempting to connect"""
    if not is_email_configured():
        return False, "Email not configured. Missing SMTP credentials."

    config = get_email_config()

    try:
        with smtplib.SMTP(config['smtp_host'], config['smtp_port'], timeout=10) as server:
            server.starttls()
            server.login(config['smtp_user'], config['smtp_password'])
        return True, "Email configuration is working correctly!"
    except Exception as e:
        return False, f"Email configuration error: {str(e)}"
