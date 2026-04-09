import sqlite3
import os

db_path = r'c:\Users\jorge\OneDrive\Escritorio\Proyectos\OrbitaGalactica\backend\orbita_galactica.db'

def delete_all_clans():
    if not os.path.exists(db_path):
        print(f"Error: No se encontró la base de datos en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    try:
        # Ver qué clanes existen antes de borrar
        c.execute("SELECT tag, name FROM clans")
        clans = c.fetchall()
        
        if not clans:
            print("No hay clanes registrados en la base de datos.")
            return

        print(f"Borrando {len(clans)} clan(es)...")
        for tag, name in clans:
            print(f"- [{tag}] {name}")

        # 1. Borrar clanes
        c.execute("DELETE FROM clans")
        
        # 2. Borrar logs de clanes
        c.execute("DELETE FROM clan_logs")
        
        # 3. Limpiar referencias en usuarios
        c.execute("UPDATE users SET clan_tag = NULL, clan_role = NULL, clan_joined_at = NULL")
        
        conn.commit()
        print("\n¡Éxito! Base de datos de clanes limpiada correctamente.")
        print("Se han desvinculado a todos los pilotos de sus antiguos clanes.")
        
    except Exception as e:
        print(f"Ocurrió un error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    delete_all_clans()
