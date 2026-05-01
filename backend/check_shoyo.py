import sqlite3
import os

DB_FILE = "orbita_galactica.db"
conn = sqlite3.connect(DB_FILE)
c = conn.cursor()
c.execute("SELECT * FROM users WHERE username = 'Shoyo'")
row = c.fetchone()
cols = [d[0] for d in c.description]
print(dict(zip(cols, row)))
conn.close()
