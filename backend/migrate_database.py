#!/usr/bin/env python3
"""
Database migration script to add invite code functionality.
Adds is_admin column to users table and creates invite_codes table.
"""

import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent / "tag_diary.db"


def migrate_database():
    """Add new columns and tables for invite code system"""

    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if is_admin column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'is_admin' not in columns:
            print("Adding is_admin column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            print("✓ Added is_admin column")
        else:
            print("✓ is_admin column already exists")

        # Check if invite_codes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='invite_codes'")
        if not cursor.fetchone():
            print("Creating invite_codes table...")
            cursor.execute("""
                CREATE TABLE invite_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code VARCHAR UNIQUE NOT NULL,
                    email VARCHAR,
                    created_by_id INTEGER NOT NULL,
                    used_by_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    used_at TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_used BOOLEAN DEFAULT 0,
                    FOREIGN KEY (created_by_id) REFERENCES users(id),
                    FOREIGN KEY (used_by_id) REFERENCES users(id)
                )
            """)
            cursor.execute("CREATE INDEX ix_invite_codes_code ON invite_codes (code)")
            print("✓ Created invite_codes table")
        else:
            print("✓ invite_codes table already exists")

        conn.commit()
        print("\n✓ Database migration completed successfully!")
        print("\nNext step: Create an admin user with:")
        print("  python3 make_admin.py create admin admin@example.com password 'Your Name'")
        print("OR promote an existing user:")
        print("  python3 make_admin.py make-admin existing-username")

    except Exception as e:
        conn.rollback()
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    print("Starting database migration...\n")
    migrate_database()
