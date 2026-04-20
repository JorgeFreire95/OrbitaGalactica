
import requests
import json

def test_missions():
    try:
        # Reemplaza 'jorge' por el username real si es posible, o usa uno de la DB
        resp = requests.get('http://localhost:8000/api/missions/jorge')
        if resp.ok:
            data = resp.json()
            print("AVAILABLE MISSIONS:")
            for m in data.get('available', []):
                print(f"ID: {m['id']}, Title: {m['title']}, MinLevel: {m.get('min_level')}")
            
            print("\nACTIVE MISSIONS:")
            for m in data.get('active', []):
                print(f"ID: {m['id']}, Title: {m['title']}, MinLevel: {m.get('min_level')}")
        else:
            print(f"Error: {resp.status_code}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_missions()
