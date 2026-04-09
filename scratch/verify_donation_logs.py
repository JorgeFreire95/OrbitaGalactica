import requests
import json
import sqlite3
import os

API_URL = "http://localhost:8000/api"

def verify_donation_attribution():
    print("Iniciando verificación de atribución de donaciones...")
    
    # Datos de prueba
    clan_tag = "MARS"
    sender = "AdminTest"
    receiver = "PilotTest"
    amount = 500
    
    payload = {
        "username": sender,
        "clan_tag": clan_tag,
        "target_username": receiver,
        "amount": amount
    }
    
    try:
        # 1. Realizar la donación vía API
        print(f"Enviando donación de {amount} CR de '{sender}' a '{receiver}'...")
        resp = requests.post(f"{API_URL}/clans/donate", json=payload)
        
        if resp.status_code == 200:
            print("Donación procesada exitosamente por la API.")
            
            # 2. Verificar en la base de datos
            # Nota: Necesitamos acceder directamente a la DB para leer el log reciente
            db_path = r'c:\Users\jorge\OneDrive\Escritorio\Proyectos\OrbitaGalactica\backend\orbita_galactica.db'
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            
            c.execute('''
                SELECT description, username FROM clan_logs 
                WHERE clan_tag = ? AND type = 'DONACION' 
                ORDER BY timestamp DESC LIMIT 1
            ''', (clan_tag,))
            row = c.fetchone()
            conn.close()
            
            if row:
                desc, uname = row
                print(f"\nÚltimo log encontrado:")
                print(f"- Piloto (Columna): {uname}")
                print(f"- Descripción: {desc}")
                
                if sender in desc and receiver in desc:
                    print("\n✅ ÉXITO: La descripción incluye correctamente tanto al emisor como al receptor.")
                else:
                    print("\n❌ FALLO: La descripción no contiene la información esperada.")
            else:
                print("\n❌ FALLO: No se encontró ningún log de donación.")
        else:
            print(f"Error en la API: {resp.status_code} - {resp.text}")
            print("Asegúrate de que el servidor backend (main.py) esté corriendo.")
            
    except Exception as e:
        print(f"Error de conexión: {e}")

if __name__ == "__main__":
    verify_donation_attribution()
