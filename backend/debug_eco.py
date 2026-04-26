
import sqlite3
import json

def check_eco():
    conn = sqlite3.connect('backend/orbita_galactica.db')
    c = conn.cursor()
    c.execute("SELECT username, eco_json FROM users")
    rows = c.fetchall()
    for row in rows:
        eco = json.loads(row[1]) if row[1] else {"active": False}
        print(f"User: {row[0]} | ECO Active: {eco.get('active')}")
    conn.close()

if __name__ == "__main__":
    check_eco()
