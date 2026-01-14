#!/usr/bin/env python3
"""
Temporary script to update username
"""

from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def update_username(old_username, new_username):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

    with engine.connect() as conn:
        try:
            # Check if new username already exists
            result = conn.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": new_username}
            )
            if result.fetchone():
                print(f"❌ Username '{new_username}' already exists")
                return False

            # Update the username
            result = conn.execute(
                text("UPDATE users SET username = :new_username WHERE username = :old_username"),
                {"new_username": new_username, "old_username": old_username}
            )
            conn.commit()

            if result.rowcount > 0:
                print(f"✓ Username updated from '{old_username}' to '{new_username}'")
                return True
            else:
                print(f"❌ User '{old_username}' not found")
                return False

        except Exception as e:
            print(f"❌ Error updating username: {e}")
            return False

if __name__ == "__main__":
    update_username("TAG", "TAG1")
