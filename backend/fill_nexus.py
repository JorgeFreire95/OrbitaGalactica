import sqlite3
import json
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "orbita_galactica.db")
conn = sqlite3.connect(DB_FILE)
c = conn.cursor()

c.execute('SELECT username, altares_estelares_json FROM users')
rows = c.fetchall()
print("Antes:")
for row in rows:
    print("User:", row[0], "Altar State:", row[1])

username = 'admin'
altares = {"energy": 10, "nexus": 25, "eclipse": 0, "cosmos": 0, "completions": {"nexus": 0, "eclipse": 0, "cosmos": 0}}
c.execute('UPDATE users SET altares_estelares_json = ? WHERE username = ?', (json.dumps(altares), username))
conn.commit()

print("Después:")
c.execute('SELECT username, altares_estelares_json FROM users WHERE username = ?', (username,))
print("Updated admin state:", c.fetchone())

conn.close()
