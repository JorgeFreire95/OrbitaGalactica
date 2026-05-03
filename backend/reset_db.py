import os
import sqlite3
import sys

# Add current directory to path to import database
sys.path.append(os.path.dirname(__file__))
from database import DB_FILE, init_db

def reset():
    print(f"Target Database: {DB_FILE}")
    if os.path.exists(DB_FILE):
        print(f"Resetting existing database...")
        try:
            # Attempt to delete file first (cleanest)
            os.remove(DB_FILE)
            print("Database file removed successfully.")
        except Exception as e:
            print(f"Could not remove file (likely in use): {e}")
            print("Falling back to dropping all tables...")
            try:
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                # Get all tables
                c.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = c.fetchall()
                for table_name in tables:
                    name = table_name[0]
                    if name != 'sqlite_sequence':
                        print(f"Dropping table: {name}")
                        c.execute(f"DROP TABLE IF EXISTS {name}")
                conn.commit()
                conn.close()
                print("All tables dropped successfully.")
            except Exception as e2:
                print(f"Critical error resetting database: {e2}")
                return

    print("Re-initializing database schema...")
    try:
        init_db()
        print("Database schema initialized successfully.")
    except Exception as e:
        print(f"Error during initialization: {e}")

if __name__ == "__main__":
    reset()
