import sqlite3
import pprint

conn = sqlite3.connect("orbita_galactica.db")
c = conn.cursor()
try:
    c.execute("SELECT username, vip_until FROM users")
    rows = c.fetchall()
    pprint.pprint(rows)
except Exception as e:
    print(e)
    # Check table schema
    c.execute("PRAGMA table_info(users)")
    pprint.pprint(c.fetchall())
conn.close()
