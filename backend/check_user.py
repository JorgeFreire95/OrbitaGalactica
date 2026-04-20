
import sqlite3

def check_user_level():
    conn = sqlite3.connect('orbita_galactica.db')
    c = conn.cursor()
    c.execute("SELECT username, level, xp FROM users WHERE username = 'jorge'")
    row = c.fetchone()
    if row:
        print(f"User: {row[0]}, Level: {row[1]}, XP: {row[2]}")
    else:
        print("User jorge not found.")
    conn.close()

if __name__ == "__main__":
    check_user_level()
