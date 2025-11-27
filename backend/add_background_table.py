"""
Add background_images table to the database
"""

import sqlite3
from pathlib import Path

# Path to database
DB_PATH = Path(__file__).parent / "tag_diary.db"

def add_background_table():
    """Add background_images table"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='background_images'
        """)

        if cursor.fetchone():
            print("✓ background_images table already exists")
            return

        # Create background_images table
        cursor.execute("""
            CREATE TABLE background_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename VARCHAR NOT NULL,
                file_path VARCHAR NOT NULL,
                uploaded_by_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
            )
        """)

        conn.commit()
        print("✓ Created background_images table")

    except Exception as e:
        print(f"✗ Error: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Adding background_images table...")
    add_background_table()
    print("Migration complete!")
