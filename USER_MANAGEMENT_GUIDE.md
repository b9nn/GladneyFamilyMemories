# User Management Guide for Gladney Family Memories

This guide shows you how to create and manage users on your family website.

## Prerequisites

You need to be logged in as an admin. Currently, these users are admins:
- `ben` (you)
- `TAG1` (Tom Gladney)

## Getting Your Admin Token

First, you need to get your access token. Run this command (replace username/password with your credentials):

```bash
curl -X POST "https://mrtag.com/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ben&password=Claudesaves88"
```

You'll get a response like this:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {...}
}
```

Copy the `access_token` value. You'll use it in the commands below by replacing `YOUR_TOKEN_HERE`.

## Creating a New User

To create a new user without needing an invite code:

```bash
curl -X POST "https://mrtag.com/api/auth/admin/create-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "username": "johndoe",
    "password": "SecurePassword123",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_admin": false
  }'
```

**Parameters:**
- `username`: The login username (required)
- `password`: The password (required, minimum 6 characters)
- `email`: Email address (optional)
- `full_name`: Full name (optional)
- `is_admin`: Set to `true` to make them an admin, `false` for regular user (default: false)

## Making Someone an Admin

To promote an existing user to admin (you need their user ID):

```bash
curl -X POST "https://mrtag.com/api/auth/admin/promote-user/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Example (promoting user ID 3):
```bash
curl -X POST "https://mrtag.com/api/auth/admin/promote-user/3" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Removing Admin Status

To remove admin status from a user (you need their user ID):

```bash
curl -X POST "https://mrtag.com/api/auth/admin/demote-user/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Note:** You cannot demote yourself!

## Finding a User's ID

You can find a user's ID in the response when you create them, or by looking at the database. Alternatively, you can check the admin panel on the website.

## Using Windows PowerShell

If you're using Windows PowerShell instead of bash, use this format:

```powershell
# Login
$response = Invoke-RestMethod -Uri "https://mrtag.com/api/auth/login" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "username=ben&password=Claudesaves88"
$token = $response.access_token

# Create user
$body = @{
    username = "johndoe"
    password = "SecurePassword123"
    email = "john@example.com"
    full_name = "John Doe"
    is_admin = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://mrtag.com/api/auth/admin/create-user" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body $body

# Promote to admin
Invoke-RestMethod -Uri "https://mrtag.com/api/auth/admin/promote-user/3" -Method Post -Headers @{Authorization="Bearer $token"}

# Demote from admin
Invoke-RestMethod -Uri "https://mrtag.com/api/auth/admin/demote-user/3" -Method Post -Headers @{Authorization="Bearer $token"}
```

## Quick Examples

### Example 1: Create a regular family member account
```bash
curl -X POST "https://mrtag.com/api/auth/admin/create-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "username": "grandma",
    "password": "GrandmaRocks123",
    "email": "grandma@example.com",
    "full_name": "Jane Gladney",
    "is_admin": false
  }'
```

### Example 2: Create an admin user directly
```bash
curl -X POST "https://mrtag.com/api/auth/admin/create-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "username": "mom",
    "password": "MomPassword456",
    "email": "mom@example.com",
    "full_name": "Sarah Gladney",
    "is_admin": true
  }'
```

## Troubleshooting

**Error: "Username or email already registered"**
- That username or email is already in use. Try a different one.

**Error: "Could not validate credentials"**
- Your token has expired (tokens last 30 minutes). Get a new one by logging in again.

**Error: "Admin access required"**
- You're not logged in as an admin, or your token is invalid.

**Error: "User not found"**
- The user ID doesn't exist. Double-check the ID number.

## Traditional Method: Invite Codes

You can also use the admin panel on the website to:
1. Create invite codes
2. Share them with family members
3. They can register using the invite code

This is good for when you want family members to choose their own password, but the direct creation method above is faster.

---

**Pro Tip:** Save this file somewhere safe and keep your admin credentials secure!
