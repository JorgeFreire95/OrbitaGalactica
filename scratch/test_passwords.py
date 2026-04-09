import sqlite3
import hashlib

# From database.py
def hash_password(password, salt):
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return hashed

def check_password(username, password):
    conn = sqlite3.connect("backend/orbita_galactica.db")
    c = conn.cursor()
    c.execute("SELECT password_hash, salt FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return False
    
    db_hash, salt = row
    test_hash = hash_password(password, salt)
    return test_hash == db_hash

if __name__ == "__main__":
    passwords_to_try = ["admin123", "admin", "superadmin", "superadmin123", "Orbita2024", "Galactica2024", "123456", "password"]
    for p in passwords_to_try:
        if check_password("SUPERADMIN", p):
            print(f"PASSWORD FOUND: {p}")
            exit(0)
    print("Password not found in common list.")
