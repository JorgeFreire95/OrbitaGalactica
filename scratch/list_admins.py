import sqlite3
import os

DB_FILE = "backend/orbita_galactica.db"

def list_admins():
    if not os.path.exists(DB_FILE):
        print(f"Error: {DB_FILE} no existe")
        return
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("SELECT username, email, is_admin, is_super_admin FROM users WHERE is_admin = 1 OR is_super_admin = 1")
        rows = c.fetchall()
        print("Admins encontrados:")
        for r in rows:
            print(f"Username: {r[0]}, Email: {r[1]}, Admin: {r[2]}, SuperAdmin: {r[3]}")
    except sqlite3.OperationalError as e:
        print(f"Error accessando DB: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    list_admins()
