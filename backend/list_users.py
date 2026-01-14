#!/usr/bin/env python3
"""
List all users in the database
"""

from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def list_users():
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username, email, is_admin FROM users"))
        users = result.fetchall()

        print(f"\nFound {len(users)} user(s):\n")
        for user in users:
            print(f"ID: {user[0]}")
            print(f"Username: {user[1]}")
            print(f"Email: {user[2]}")
            print(f"Admin: {user[3]}")
            print("-" * 40)

if __name__ == "__main__":
    list_users()
