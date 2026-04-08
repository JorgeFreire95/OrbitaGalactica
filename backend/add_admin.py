import sys
import os
import sqlite3

# Añadir el directorio actual al path (que es backend/)
sys.path.append(os.path.dirname(__file__))

from database import hash_password, get_connection

def add_admin(username, email, password):
    hashed, salt = hash_password(password)
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO users (username, email, password_hash, salt, faction, is_admin)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, email, hashed, salt, "MARS", 1))
        conn.commit()
        print(f"Usuario administrador '{username}' creado exitosamente.")
    except sqlite3.IntegrityError:
        print(f"Error: El usuario o email ya existe. Intentando promocionar si ya existe...")
        c.execute('UPDATE users SET is_admin = 1 WHERE username = ?', (username,))
        if c.rowcount > 0:
            conn.commit()
            print(f"Usuario '{username}' ahora es administrador.")
        else:
            print(f"Error fatal: no se pudo crear ni promocionar al usuario '{username}'.")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        # Default admin if no args
        add_admin("admin", "admin@orbitagalactica.com", "admin123")
    else:
        add_admin(sys.argv[1], sys.argv[2], sys.argv[3])
