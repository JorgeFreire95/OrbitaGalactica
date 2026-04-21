import sqlite3
import json

DB_FILE = 'backend/orbita_galactica.db'
USERNAME = 'Shoyo'

all_ships = ["starter", "tank", "fast", "stealth", "heavy", "support", "sovereign", "harvester", "interceptor", "bastion"]

def unlock_all_ships():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Check if user exists
    c.execute('SELECT username FROM users WHERE username = ?', (USERNAME,))
    user = c.fetchone()
    
    if not user:
        print(f"Error: Usuario '{USERNAME}' no encontrado.")
        conn.close()
        return

    # Update owned_ships_json
    owned_ships_json = json.dumps(all_ships)
    c.execute('UPDATE users SET owned_ships_json = ? WHERE username = ?', (owned_ships_json, USERNAME))
    
    conn.commit()
    print(f"Éxito: Se han desbloqueado {len(all_ships)} naves para el usuario {USERNAME}.")
    
    # Verify
    c.execute('SELECT owned_ships_json FROM users WHERE username = ?', (USERNAME,))
    print(f"Naves actuales: {c.fetchone()[0]}")
    
    conn.close()

if __name__ == "__main__":
    unlock_all_ships()
