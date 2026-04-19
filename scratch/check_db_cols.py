import sqlite3
import os

DB_FILE = "backend/orbita_galactica.db"

def get_columns():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("PRAGMA table_info(users)")
    cols = c.fetchall()
    for col in cols:
        print(col)
    conn.close()

if __name__ == "__main__":
    get_columns()
