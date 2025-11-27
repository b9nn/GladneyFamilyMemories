#!/usr/bin/env python3
"""
Script to make a user an admin or create an admin user.
This is needed to access the invite code generation endpoints.
"""

import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models import User
from app.auth import get_password_hash


def make_user_admin(username: str):
    """Make an existing user an admin"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"Error: User '{username}' not found")
            return False

        user.is_admin = True
        db.commit()
        print(f"✓ User '{username}' is now an admin")
        return True
    finally:
        db.close()


def create_admin_user(username: str, email: str, password: str, full_name: str = None):
    """Create a new admin user"""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()

        if existing:
            print(f"Error: User with username '{username}' or email '{email}' already exists")
            return False

        # Create new admin user
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_admin=True,
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"✓ Admin user '{username}' created successfully")
        return True
    finally:
        db.close()


def list_users():
    """List all users and their admin status"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            print("No users found in database")
            return

        print("\nCurrent users:")
        print("-" * 60)
        for user in users:
            admin_status = "ADMIN" if user.is_admin else "User"
            print(f"{user.username:20} {user.email:30} [{admin_status}]")
        print("-" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    # Initialize database
    init_db()

    if len(sys.argv) < 2:
        print("Usage:")
        print("  List users:           python make_admin.py list")
        print("  Make user admin:      python make_admin.py make-admin <username>")
        print("  Create admin user:    python make_admin.py create <username> <email> <password> [full_name]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "list":
        list_users()

    elif command == "make-admin":
        if len(sys.argv) < 3:
            print("Error: Username required")
            print("Usage: python make_admin.py make-admin <username>")
            sys.exit(1)
        make_user_admin(sys.argv[2])

    elif command == "create":
        if len(sys.argv) < 5:
            print("Error: Missing required arguments")
            print("Usage: python make_admin.py create <username> <email> <password> [full_name]")
            sys.exit(1)

        username = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        full_name = sys.argv[5] if len(sys.argv) > 5 else None

        create_admin_user(username, email, password, full_name)

    else:
        print(f"Error: Unknown command '{command}'")
        print("Valid commands: list, make-admin, create")
        sys.exit(1)
