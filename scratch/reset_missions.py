import sqlite3
import os

db_path = os.path.join("backend", "orbita_galactica.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()
try:
    c.execute("DELETE FROM user_missions")
    c.execute("DELETE FROM missions")
    conn.commit()
    print("Misiones eliminadas correctamente.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
