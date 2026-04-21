import sqlite3
import json

def check_users():
    try:
        conn = sqlite3.connect('backend/game.db')
        c = conn.cursor()
        c.execute('SELECT username, level, xp, credits, paladio, selected_ship, owned_ships_json FROM users')
        rows = c.fetchall()
        print("DETALLES DE USUARIOS:")
        for r in rows:
            owned = json.loads(r[6]) if r[6] else []
            print(f"User: {r[0]}")
            print(f"  Stats: Lvl {r[1]}, XP {r[2]}, Cred {r[3]}, Pal {r[4]}")
            print(f"  Ship: {r[5]}, Owned: {owned}")
            print("-" * 20)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
