import sys
import os

# Add backend to path
backend_path = r'c:\Users\jorge\OneDrive\Escritorio\Proyectos\OrbitaGalactica\backend'
if backend_path not in sys.path:
    sys.path.append(backend_path)

from database import hash_password, get_connection

def reset_password(username, new_password):
    print(f"Reseteando contraseña para {username}...")
    
    hashed, salt = hash_password(new_password)
    
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE users 
            SET password_hash = ?, salt = ?
            WHERE username = ?
        ''', (hashed, salt, username))
        
        if c.rowcount > 0:
            conn.commit()
            print("¡Éxito! La contraseña ha sido actualizada.")
        else:
            print("Error: No se encontró al usuario.")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    reset_password('SUPERADMIN', '123456')
