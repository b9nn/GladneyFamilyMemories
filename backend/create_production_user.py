"""
One-time script to create a user directly in the production PostgreSQL database.
This bypasses the invite code system for emergency user creation.
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt
from app import models
from app.database import Base

def get_password_hash(password):
    """Hash a password using bcrypt"""
    if isinstance(password, str):
        password_bytes = password.encode('utf-8')[:72]
    else:
        password_bytes = password[:72]

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_production_user(database_url, username, password, email=None, full_name=None, is_admin=False):
    """Create a user directly in the production database"""

    # Convert database URL for psycopg3 if needed
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)

    # Create engine and session
    engine = create_engine(database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.username == username).first()
        if existing_user:
            print(f"Error: User '{username}' already exists in the database.")
            return False

        # Create new user
        hashed_password = get_password_hash(password)
        new_user = models.User(
            username=username,
            hashed_password=hashed_password,
            email=email,
            full_name=full_name,
            is_admin=is_admin
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print(f"✓ User created successfully!")
        print(f"  ID: {new_user.id}")
        print(f"  Username: {new_user.username}")
        print(f"  Email: {new_user.email}")
        print(f"  Full Name: {new_user.full_name}")
        print(f"  Is Admin: {new_user.is_admin}")

        return True

    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Get the production database URL from environment or prompt
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("Error: DATABASE_URL environment variable not set.")
        print("\nUsage:")
        print("  Set DATABASE_URL environment variable to your production PostgreSQL URL")
        print("  Then run: python create_production_user.py")
        sys.exit(1)

    print("Creating user in production database...")
    print(f"Database: {database_url.split('@')[1] if '@' in database_url else 'local'}")
    print()

    # User details for Tom Gladney
    username = "TAG1"
    password = "Tagtame1941"
    email = "tgladney@gmail.com"
    full_name = "Tom Gladney"
    is_admin = False

    print(f"Creating user: {username} ({full_name})")

    success = create_production_user(
        database_url=database_url,
        username=username,
        password=password,
        email=email,
        full_name=full_name,
        is_admin=is_admin
    )

    if success:
        print("\n✓ User can now login at https://mrtag.com")
    else:
        print("\n✗ Failed to create user")
        sys.exit(1)
