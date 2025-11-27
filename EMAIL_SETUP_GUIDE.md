# Email Configuration Guide

This guide will help you set up automatic email invitations for your family tree website.

## Quick Setup with Gmail (Recommended)

### Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google," click **2-Step Verification**
   - If not enabled, enable it first (required for app passwords)
4. Scroll to the bottom and click **App passwords**
5. In the "Select app" dropdown, choose **Mail**
6. In the "Select device" dropdown, choose **Other (Custom name)**
7. Type "Family Tree Website" and click **Generate**
8. Google will show you a 16-character password like: `abcd efgh ijkl mnop`
9. **Copy this password** (you won't see it again!)

### Step 2: Create .env File

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit the `.env` file with your information:
   ```bash
   # Use your favorite text editor
   nano .env
   # or
   code .env
   ```

3. Update these values:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Family Tree
   SITE_URL=http://localhost:3000
   ```

   **Important:**
   - Use the 16-character app password (remove spaces)
   - Replace `your-email@gmail.com` with your actual Gmail address
   - Change `SITE_URL` to your actual website URL when deploying

4. Save and close the file

### Step 3: Restart Your Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
cd backend
python3 run.py
```

### Step 4: Test It Out!

1. Login to your website as admin
2. Go to **Admin Panel**
3. Click **Create Invite Code**
4. Fill in:
   - Email: A family member's email
   - Recipient Name: Their name (optional)
   - Check ✓ **Send invite code via email**
5. Click **Generate & Send Email**

They should receive a beautiful email with:
- The invite code
- Link to register
- Step-by-step instructions

## How It Works

When you create an invite code with "Send email" checked:

1. The system generates a secure invite code
2. Creates a personalized HTML email
3. Sends it via Gmail SMTP
4. The recipient gets a professional invitation
5. They click the link and register with the code

## Email Template

The email includes:
- Professional header with gradient background
- Personalized greeting
- Large, easy-to-read invite code
- Step-by-step instructions
- Direct link to registration
- Mobile-friendly design

## Troubleshooting

### "Email not configured" message
- Make sure you created the `.env` file
- Check that all required fields are filled
- Restart the backend server

### "Authentication failed" error
- Double-check your app password (no spaces)
- Make sure 2-Step Verification is enabled
- Try generating a new app password

### Email not arriving
- Check spam/junk folder
- Verify the email address is correct
- Check backend logs for error messages
- Try sending a test email to yourself first

### Gmail security alert
- Google may send you a security alert the first time
- This is normal - click "Yes, it was me"
- The app password is safe to use

## Alternative Email Services

### SendGrid (Free tier: 100 emails/day)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=your-verified-email@yourdomain.com
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
FROM_EMAIL=noreply@your-domain.com
```

## Security Notes

- Never commit your `.env` file to git (it's in .gitignore)
- Keep your app password secure
- Use a strong SECRET_KEY in production
- Consider using environment variables in production instead of .env file

## Support

If you encounter issues:
1. Check the backend logs for error messages
2. Verify all environment variables are set correctly
3. Test with a simple email to yourself first
4. Make sure your Gmail account has 2-Step Verification enabled
