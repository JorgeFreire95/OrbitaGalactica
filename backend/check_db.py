
import sqlite3
import json

def check_missions():
    conn = sqlite3.connect('orbita_galactica.db')
    c = conn.cursor()
    
    print("Missions Schema:")
    c.execute("PRAGMA table_info(missions)")
    for col in c.fetchall():
        print(col)
        
    print("\nSample Missions (SELECT *):")
    c.execute("SELECT * FROM missions LIMIT 5")
    for row in c.fetchall():
        print(row)
        
    conn.close()

if __name__ == "__main__":
    check_missions()
