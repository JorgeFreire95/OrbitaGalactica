import sqlite3
import hashlib
import os
import secrets

DB_FILE = os.path.join(os.path.dirname(__file__), "orbita_galactica.db")

def get_connection():
    # Use check_same_thread=False since FastAPI runs multiple threads
    return sqlite3.connect(DB_FILE, check_same_thread=False)

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            faction TEXT,
            is_admin BOOLEAN DEFAULT 0,
            clan_tag TEXT,
            clan_role TEXT,
            clan_joined_at TIMESTAMP
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS clans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            leader TEXT NOT NULL,
            description TEXT,
            logo_url TEXT,
            members_count INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT DEFAULT 'SYSTEM',
            receiver TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            type TEXT DEFAULT 'notif',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT 0
        )
    ''')
    
    # Migraciones
    try:
        c.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN clan_tag TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN clan_role TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN clan_joined_at TIMESTAMP")
    except sqlite3.OperationalError:
        pass
        
    # Inyectar admin base si no existe
    c.execute("SELECT id FROM users WHERE username = 'admin'")
    if not c.fetchone():
        from database import hash_password
        hashed, salt = hash_password("admin")
        c.execute('''
            INSERT INTO users (username, email, password_hash, salt, faction, is_admin)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ("admin", "admin@orbitagalactica.com", hashed, salt, "MARS", 1))

    conn.commit()
    conn.close()

def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return hashed, salt

def register_user(username, email, password):
    conn = get_connection()
    c = conn.cursor()
    hashed, salt = hash_password(password)
    try:
        c.execute('''
            INSERT INTO users (username, email, password_hash, salt) 
            VALUES (?, ?, ?, ?)
        ''', (username, email, hashed, salt))
        conn.commit()
        return {"success": True}
    except sqlite3.IntegrityError as e:
        error_msg = str(e).lower()
        if "username" in error_msg:
            return {"success": False, "error": "El nombre de usuario ya está registrado."}
        elif "email" in error_msg:
            return {"success": False, "error": "Ese correo electrónico ya está en uso."}
        else:
            return {"success": False, "error": "Los datos ya existen."}
    finally:
        conn.close()

def login_user(username, password):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT username, password_hash, salt, faction, is_admin FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return {"success": False, "error": "Credenciales incorrectas"}
    
    db_username, db_hash, salt, faction, is_admin = row
    test_hash, _ = hash_password(password, salt)
    
    if test_hash == db_hash:
        return {"success": True, "username": db_username, "faction": faction, "is_admin": bool(is_admin)}
    else:
        return {"success": False, "error": "Credenciales incorrectas"}

def set_user_faction(username, faction):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE users SET faction = ? WHERE username = ?', (faction, username))
    updated = c.rowcount > 0
    conn.commit()
    conn.close()
    return updated

# --- ADMIN FUNCTIONS ---
def get_all_users():
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT username, email, faction, is_admin, clan_tag, clan_role FROM users')
    rows = c.fetchall()
    conn.close()
    return [{"username": r[0], "email": r[1], "faction": r[2], "is_admin": bool(r[3]), "clan_tag": r[4], "clan_role": r[5]} for r in rows]

def delete_user(username):
    conn = get_connection()
    c = conn.cursor()
    c.execute('DELETE FROM users WHERE username = ?', (username,))
    deleted = c.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def update_user(target_username, new_username, new_email, new_faction):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE users 
            SET username = ?, email = ?, faction = ? 
            WHERE username = ?
        ''', (new_username, new_email, new_faction, target_username))
        updated = c.rowcount > 0
        conn.commit()
        return {"success": updated}
    except sqlite3.IntegrityError:
        return {"success": False, "error": "Username o email ya en uso"}
    finally:
        conn.close()

# --- CLAN FUNCTIONS ---
def create_clan_db(tag, name, leader):
    conn = get_connection()
    c = conn.cursor()
    try:
        # 1. Crear el clan
        c.execute('''
            INSERT INTO clans (tag, name, leader) 
            VALUES (?, ?, ?)
        ''', (tag.upper(), name, leader))
        
        # 2. Asignar el clan al usuario líder con su rol
        c.execute('''
            UPDATE users 
            SET clan_tag = ?, clan_role = ?, clan_joined_at = CURRENT_TIMESTAMP 
            WHERE username = ?
        ''', (tag.upper(), "Líder", leader))
        
        conn.commit()
        return {"success": True}
    except sqlite3.IntegrityError:
        return {"success": False, "error": "La sigla del clan ya está registrada."}
    finally:
        conn.close()

def get_available_clans(search=None):
    conn = get_connection()
    c = conn.cursor()
    if search:
        query = "%" + search.upper() + "%"
        c.execute('SELECT tag, name, leader, members_count FROM clans WHERE tag LIKE ? OR name LIKE ?', (query, query))
    else:
        c.execute('SELECT tag, name, leader, members_count FROM clans LIMIT 50')
    
    rows = c.fetchall()
    conn.close()
    return [{"tag": r[0], "name": r[1], "leader": r[2], "members": r[3]} for r in rows]

def join_clan_db(username, clan_tag):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Verificar si el clan existe
        c.execute('SELECT tag FROM clans WHERE tag = ?', (clan_tag.upper(),))
        if not c.fetchone():
            return {"success": False, "error": "El clan no existe."}
            
        # Asignar clan al usuario con rol Novato
        c.execute('''
            UPDATE users 
            SET clan_tag = ?, clan_role = ?, clan_joined_at = CURRENT_TIMESTAMP 
            WHERE username = ?
        ''', (clan_tag.upper(), "Novato", username))
        
        # Incrementar contador de miembros
        c.execute('UPDATE clans SET members_count = members_count + 1 WHERE tag = ?', (clan_tag.upper(),))
        
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def get_user_clan_data(username):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT clan_tag FROM users WHERE username = ?', (username,))
    res = c.fetchone()
    if not res or not res[0]:
        conn.close()
        return None
        
    clan_tag = res[0]
    
    # Obtener metadata del clan
    c.execute('SELECT tag, name, leader, members_count, description, created_at FROM clans WHERE tag = ?', (clan_tag,))
    clan = c.fetchone()
    if not clan:
        conn.close()
        return None
        
    # Obtener lista de miembros
    # Intentamos obtener XP de alguna columna? El esquema de users no tiene XP explícito, 
    # pero el frontend lo maneja. Supone que está en algún lado o es mock por ahora.
    # Pero para que el listado sea real, buscaremos todos los usuarios con ese clan_tag.
    c.execute('''
        SELECT username, clan_role, clan_joined_at 
        FROM users 
        WHERE clan_tag = ?
    ''', (clan_tag,))
    members_rows = c.fetchall()
    conn.close()
    
    members_list = []
    for m in members_rows:
        members_list.append({
            "name": m[0],
            "role": m[1] or "Miembro",
            "joined": m[2] or "Recientemente",
            "xp": 0 # Mock XP por ahora si no hay columna, el frontend lo puede estimar o le pasamos 0
        })
    
    return {
        "tag": clan[0],
        "name": clan[1],
        "leader": clan[2],
        "members_count": len(members_list), # Usamos el conteo real de la tabla usuarios
        "description": clan[4],
        "created_at": clan[5],
        "members": members_list
    }

def leave_clan_db(username):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Obtener el clan del usuario
        c.execute('SELECT clan_tag, clan_role FROM users WHERE username = ?', (username,))
        res = c.fetchone()
        if not res or not res[0]:
            return {"success": False, "error": "No perteneces a ningún clan."}
        
        clan_tag = res[0]
        role = res[1]

        if role == 'Líder':
            # Si el líder sale, disolvemos el clan (según plan)
            return dissolve_clan_db(clan_tag)
        
        # Quitar clan al usuario
        c.execute('UPDATE users SET clan_tag = NULL, clan_role = NULL, clan_joined_at = NULL WHERE username = ?', (username,))
        
        # Decrementar contador
        c.execute('UPDATE clans SET members_count = MAX(0, members_count - 1) WHERE tag = ?', (clan_tag,))
        
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def kick_member_db(leader_username, target_username):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Verificar permisos del líder/oficial
        c.execute('SELECT clan_tag, clan_role FROM users WHERE username = ?', (leader_username,))
        res_leader = c.fetchone()
        if not res_leader or res_leader[1] not in ['Líder', 'Oficial']:
            return {"success": False, "error": "No tienes permisos para expulsar miembros."}
        
        clan_tag = res_leader[0]

        # Verificar que el objetivo esté en el mismo clan
        c.execute('SELECT clan_tag, clan_role FROM users WHERE username = ?', (target_username,))
        res_target = c.fetchone()
        if not res_target or res_target[0] != clan_tag:
            return {"success": False, "error": "El usuario no pertenece a tu clan."}
        
        if res_target[1] == 'Líder':
            return {"success": False, "error": "No puedes expulsar al líder."}
        
        # Quitar clan al usuario
        c.execute('UPDATE users SET clan_tag = NULL, clan_role = NULL, clan_joined_at = NULL WHERE username = ?', (target_username,))
        
        # Decrementar contador
        c.execute('UPDATE clans SET members_count = MAX(0, members_count - 1) WHERE tag = ?', (clan_tag,))
        
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def dissolve_clan_db(clan_tag):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Obtener nombres de todos los miembros antes de borrarlos
        c.execute('SELECT username FROM users WHERE clan_tag = ?', (clan_tag,))
        members = [row[0] for row in c.fetchall()]
        
        # Obtener nombre del clan para el mensaje
        c.execute('SELECT name FROM clans WHERE tag = ?', (clan_tag,))
        clan_name_row = c.fetchone()
        clan_name = clan_name_row[0] if clan_name_row else clan_tag

        # Enviar mensaje de despedida a cada uno
        for member in members:
            send_system_message_db(
                member, 
                "Notificación de Clan: Disolución", 
                f"Lamentamos informarte que el clan [{clan_tag}] {clan_name} ha sido disuelto por su Líder. Ya no formas parte de esta alianza."
            )

        # Remover clan de todos los miembros
        c.execute('UPDATE users SET clan_tag = NULL, clan_role = NULL, clan_joined_at = NULL WHERE clan_tag = ?', (clan_tag,))
        
        # Borrar el clan
        c.execute('DELETE FROM clans WHERE tag = ?', (clan_tag,))
        
        conn.commit()
        return {"success": True, "message": "Clan disuelto y miembros notificados."}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def send_system_message_db(receiver, subject, body):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO messages (sender, receiver, subject, body, type)
            VALUES (?, ?, ?, ?, ?)
        ''', ('SYSTEM', receiver, subject, body, 'notif'))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error sending msg: {e}")
        return False
    finally:
        conn.close()

def get_user_messages_db(username):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            SELECT id, sender, subject, body, sent_at, is_read, type
            FROM messages 
            WHERE receiver = ?
            ORDER BY sent_at DESC
        ''', (username,))
        rows = c.fetchall()
        msgs = []
        for r in rows:
            msgs.append({
                "id": r[0],
                "sender": r[1],
                "subject": r[2],
                "body": r[3],
                "date": r[4],
                "read": bool(r[5]),
                "type": r[6]
            })
        return msgs
    except Exception:
        return []
    finally:
        conn.close()

def mark_message_read_db(msg_id):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('UPDATE messages SET is_read = 1 WHERE id = ?', (msg_id,))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()
