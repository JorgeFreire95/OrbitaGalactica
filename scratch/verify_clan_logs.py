import sqlite3
import os
import sys

# Add backend to path to import database functions
backend_path = r'c:\Users\jorge\OneDrive\Escritorio\Proyectos\OrbitaGalactica\backend'
sys.path.append(backend_path)

from database import collect_all_taxes, get_connection, get_clan_logs_db

def verify_tax_logging():
    print("Iniciando verificación de impuestos...")
    
    conn = get_connection()
    c = conn.cursor()
    
    # 1. Crear un clan de prueba y usuarios de prueba si no existen
    # (O usar los existentes si ya hay)
    c.execute("SELECT tag FROM clans LIMIT 1")
    clan_row = c.fetchone()
    if not clan_row:
        print("No hay clanes en la DB. Creando uno de prueba...")
        c.execute("INSERT OR REPLACE INTO clans (tag, name, leader, tax_rate, credits) VALUES ('TEST', 'Test Clan', 'admin', 5.0, 0)")
        c.execute("UPDATE users SET clan_tag = 'TEST', credits = 10000 WHERE username = 'admin'")
        clan_tag = 'TEST'
    else:
        clan_tag = clan_row[0]
        # Asegurarse de que el clan tenga una tasa de impuestos y créditos para probar
        c.execute("UPDATE clans SET tax_rate = 10.0 WHERE tag = ?", (clan_tag,))
        c.execute("UPDATE users SET credits = 50000 WHERE clan_tag = ?", (clan_tag,))
    
    conn.commit()
    conn.close()
    
    # 2. Ejecutar la recaudación
    print(f"Ejecutando recaudación para el clan {clan_tag}...")
    success = collect_all_taxes()
    
    if success:
        print("Recaudación ejecutada exitosamente.")
        # 3. Verificar los logs
        logs = get_clan_logs_db(clan_tag)
        print(f"\nLogs encontrados para {clan_tag}:")
        found_piloto_tax = False
        for log in logs:
            print(f"- Tipo: {log['type']}, Piloto: {log['username']}, Monto: {log['amount']}, Desc: {log['description']}")
            if log['type'] == 'IMPUESTO' and log['username'] != 'SYSTEM':
                found_piloto_tax = True
        
        if found_piloto_tax:
            print("\n✅ ÉXITO: Se encontró una entrada de impuesto con el nombre del piloto.")
        else:
            print("\n❌ FALLO: No se encontraron entradas de impuesto con nombre de piloto individual.")
    else:
        print("Error al ejecutar collect_all_taxes.")

if __name__ == "__main__":
    verify_tax_logging()
