# Email Invite System - Summary

I've successfully added automatic email invitations to your family tree website! 🎉

## What's New

### Admin Panel Updates
- **"Send invite code via email"** checkbox in the create form
- **"Recipient Name"** field for personalizing emails
- Button changes to **"Generate & Send Email"** when email sending is enabled
- Success message shows when email is sent

### Email Features
- Beautiful HTML email template with your site branding
- Personalized greeting with recipient's name
- Large, easy-to-read invite code
- Direct link to registration page
- Step-by-step instructions
- Mobile-friendly design

### How to Use (Once Configured)

1. Go to Admin Panel
2. Click "Create Invite Code"
3. Enter the recipient's **email** (required for sending)
4. Enter their **name** (optional, for personalization)
5. Check ✓ **"Send invite code via email"**
6. Click **"Generate & Send Email"**

They'll receive a professional email invitation!

## Setup Required

Email functionality is **optional** and currently **disabled**. To enable it:

### Quick Setup (5 minutes with Gmail)

1. **Get a Gmail App Password**
   - See detailed instructions in `EMAIL_SETUP_GUIDE.md`
   - Or follow: https://support.google.com/accounts/answer/185833

2. **Edit the `.env` file** in the `backend` folder:
   ```bash
   cd backend
   nano .env  # or use any text editor
   ```

3. **Uncomment and fill in these lines**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Family Tree
   SITE_URL=http://localhost:3000
   ```

4. **Restart the backend server**
   ```bash
   python3 run.py
   ```

That's it! Email invitations are now working.

## Without Email Setup

If you don't configure email, the system still works perfectly:
- You can still generate invite codes
- The checkbox will be present but won't send emails
- You manually copy and send codes (like before)
- No errors or issues

## Files Created

1. `backend/app/email.py` - Email sending utility
2. `backend/.env.example` - Email configuration template
3. `backend/.env` - Your configuration file (edit this)
4. `EMAIL_SETUP_GUIDE.md` - Detailed setup instructions
5. `EMAIL_INVITE_SUMMARY.md` - This file

## Email Template Preview

```
╔════════════════════════════════════════╗
║   🌳 Welcome to Our Family Tree        ║
╠════════════════════════════════════════╣
║                                        ║
║  Hi John,                             ║
║                                        ║
║  You've been invited to join our      ║
║  family tree website!                 ║
║                                        ║
║  ┌────────────────────────────────┐  ║
║  │  Your Invite Code:              │  ║
║  │  ABC123XYZ456                  │  ║
║  └────────────────────────────────┘  ║
║                                        ║
║  How to get started:                  ║
║  1. Click the button below            ║
║  2. Click "Register"                  ║
║  3. Enter your invite code            ║
║  4. Complete registration             ║
║  5. Start exploring!                  ║
║                                        ║
║    [Get Started Button]               ║
║                                        ║
╚════════════════════════════════════════╝
```

## Support

- Full setup guide: `EMAIL_SETUP_GUIDE.md`
- Email works with Gmail, SendGrid, Mailgun, and others
- No email? System works fine without it!

Enjoy your new email invitation feature! 📧
