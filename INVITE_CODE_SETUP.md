# Invite Code System - Setup Guide

Your family tree website now has an invite-only registration system! Only users with valid invite codes can register.

## Quick Start

### 1. Create Your Admin Account

First, you need to make yourself an admin to generate invite codes. Run one of these commands in the `backend` directory:

**Option A: Create a new admin account**
```bash
cd backend
python make_admin.py create admin admin@example.com YourPassword123 "Your Name"
```

**Option B: Make your existing account an admin**
```bash
cd backend
python make_admin.py make-admin your-username
```

**List all users to check admin status:**
```bash
cd backend
python make_admin.py list
```

### 2. Start Your Application

```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Generate Invite Codes

1. Login to your website with your admin account
2. Click "Admin Panel" in the navigation menu (only visible to admins)
3. Click "Create Invite Code"
4. Fill in the form:
   - **Email (Optional)**: Leave blank for any email, or specify a specific email address
   - **Expires In**: Set how many days the code is valid (default: 30 days)
5. Click "Generate Code"
6. Copy the generated code and send it to your family member

### 4. Share Invite Codes

Send the invite code to your family member. They will:
1. Go to your website
2. Click "Register"
3. Enter the invite code (required field)
4. Complete the registration form
5. The code will be marked as "used" and cannot be reused

## Admin Dashboard Features

- **Create Invite Codes**: Generate new codes with optional email restrictions
- **View All Codes**: See all codes with their status (Active, Used, Expired)
- **Copy to Clipboard**: Quick copy button for each code
- **Delete Codes**: Remove unused or expired codes
- **Track Usage**: See when codes were created, used, and by whom

## Security Features

✅ Each invite code can only be used once
✅ Codes expire after specified number of days
✅ Optional email restriction per code
✅ Admin-only access to invite code management
✅ No open registration - all new users need a valid code

## Troubleshooting

### "You do not have admin access"
Run: `python backend/make_admin.py make-admin your-username`

### "Invalid or already used invite code"
- The code may have already been used
- The code may have expired
- Double-check the code was copied correctly
- Generate a new code from the Admin Panel

### Can't see Admin Panel link
- Make sure you're logged in as an admin user
- Check admin status: `python backend/make_admin.py list`

## Database Migration

If you have existing users, the database will automatically add the new `is_admin` and `invite_codes` tables when you restart the backend. Existing users will have `is_admin = False` by default.
