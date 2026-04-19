import sqlite3
import os
import json

DB_FILE = "backend/orbita_galactica.db"

def inspect_user(username):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    if not user:
        print(f"User {username} not found.")
        return
    
    # Get column names
    names = [description[0] for description in c.description]
    user_dict = dict(zip(names, user))
    
    print(f"User: {user_dict['username']}")
    print(f"Level: {user_dict['level']}, XP: {user_dict['xp']}, Credits: {user_dict['credits']}")
    print(f"Equipped: {user_dict['equipped_json']}")
    print(f"Owned Ships: {user_dict['owned_ships_json']}")
    
    conn.close()

if __name__ == "__main__":
    inspect_user("Shoyo")
