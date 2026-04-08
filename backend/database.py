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
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            credits INTEGER DEFAULT 2000,
            paladio INTEGER DEFAULT 0,
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
            tax_rate REAL DEFAULT 0.0,
            credits INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS clan_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clan_tag TEXT,
            type TEXT,
            description TEXT,
            amount INTEGER,
            username TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
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
        c.execute("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 2000")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN paladio INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT 0")
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
        
    # Migraciones Clanes
    try:
        c.execute("ALTER TABLE clans ADD COLUMN tax_rate REAL DEFAULT 0.0")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE clans ADD COLUMN credits INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    # Migraciones para Recuperación de Contraseña
    try:
        c.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN reset_token_expiry TEXT")
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
            INSERT INTO users (username, email, password_hash, salt, level, xp, credits, paladio) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (username, email, hashed, salt, 1, 0, 2000, 0))
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

def get_user_stats_db(username):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('SELECT level, xp, credits, paladio FROM users WHERE username = ?', (username,))
        row = c.fetchone()
        if not row:
            return None
        return {
            "level": row[0],
            "xp": row[1],
            "credits": row[2],
            "paladio": row[3]
        }
    finally:
        conn.close()

def login_user(username, password):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT username, faction, is_admin, is_super_admin, level, xp, credits, paladio, password_hash, salt FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return {"success": False, "error": "Credenciales incorrectas"}
    
    db_username, faction, is_admin, is_super_admin, level, xp, credits, paladio, db_hash, salt = row
    test_hash, _ = hash_password(password, salt)
    
    if test_hash == db_hash:
        return {
            "success": True, 
            "username": db_username, 
            "faction": faction, 
            "is_admin": bool(is_admin),
            "is_super_admin": bool(is_super_admin),
            "level": level,
            "xp": xp,
            "credits": credits,
            "paladio": paladio
        }
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
    c.execute('SELECT username, email, faction, is_admin, is_super_admin, clan_tag, clan_role, level, xp, credits, paladio FROM users')
    rows = c.fetchall()
    conn.close()
    return [{
        "username": r[0], 
        "email": r[1], 
        "faction": r[2], 
        "is_admin": bool(r[3]), 
        "is_super_admin": bool(r[4]),
        "clan_tag": r[5], 
        "clan_role": r[6],
        "level": r[7],
        "xp": r[8],
        "credits": r[9],
        "paladio": r[10]
    } for r in rows]

def delete_user(username):
    conn = get_connection()
    c = conn.cursor()
    c.execute('DELETE FROM users WHERE username = ?', (username,))
    deleted = c.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def update_user(target_username, new_username, new_email, new_faction, level=None, xp=None, credits=None, paladio=None, is_admin=None, **kwargs):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Build dynamic query
        fields = ["username = ?", "email = ?", "faction = ?"]
        params = [new_username, new_email, new_faction]
        
        if level is not None:
            fields.append("level = ?")
            params.append(level)
        if xp is not None:
            fields.append("xp = ?")
            params.append(xp)
        if credits is not None:
            fields.append("credits = ?")
            params.append(credits)
        if paladio is not None:
            fields.append("paladio = ?")
            params.append(paladio)
        if is_admin is not None:
            fields.append("is_admin = ?")
            params.append(1 if is_admin else 0)
        
        if kwargs.get("is_super_admin") is not None:
            fields.append("is_super_admin = ?")
            params.append(1 if kwargs["is_super_admin"] else 0)
            
        params.append(target_username)
        query = f"UPDATE users SET {', '.join(fields)} WHERE username = ?"
        
        c.execute(query, params)
        updated = c.rowcount > 0
        conn.commit()
        return {"success": updated}
    except sqlite3.IntegrityError:
        return {"success": False, "error": "Username o email ya en uso"}
    finally:
        conn.close()

def sync_user_stats(username, level, xp, credits, paladio):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE users 
            SET level = ?, xp = ?, credits = ?, paladio = ?
            WHERE username = ?
        ''', (level, xp, credits, paladio, username))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def update_clan_tax_db(clan_tag, tax_rate):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('UPDATE clans SET tax_rate = ? WHERE tag = ?', (tax_rate, clan_tag))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def collect_all_taxes():
    conn = get_connection()
    c = conn.cursor()
    try:
        # 1. Obtener todos los clanes con tasa mayor a 0
        c.execute('SELECT tag, tax_rate FROM clans WHERE tax_rate > 0')
        clans = c.fetchall()
        
        for tag, rate in clans:
            # 2. Buscar todos los miembros de este clan
            c.execute('SELECT username, credits FROM users WHERE clan_tag = ?', (tag,))
            members = c.fetchall()
            
            total_tax_collected = 0
            for username, player_credits in members:
                if player_credits > 0:
                    tax_amount = int(player_credits * (rate / 100))
                    if tax_amount > 0:
                        # 3. Descontar al jugador
                        c.execute('UPDATE users SET credits = credits - ? WHERE username = ?', (tax_amount, username))
                        total_tax_collected += tax_amount
                        
                        # 4. Enviar notificación (opcional, pero útil)
                        send_system_message_db(
                            username, 
                            "Cobro de Impuestos", 
                            f"Se ha descontado {tax_amount:,} créditos de tu banco por concepto de impuestos del clan ({rate}%)."
                        )
            
            # 5. Sumar a la tesorería del clan
            if total_tax_collected > 0:
                c.execute('UPDATE clans SET credits = credits + ? WHERE tag = ?', (total_tax_collected, tag))
                # 6. Registrar en el historial del clan
                c.execute('''
                    INSERT INTO clan_logs (clan_tag, type, description, amount, username)
                    VALUES (?, ?, ?, ?, ?)
                ''', (tag, 'IMPUESTO', f"Recaudación diaria de {rate}%", total_tax_collected, "SYSTEM"))
        
        conn.commit()
        print(f"Impuestos recaudados exitosamente.")
        return True
    except Exception as e:
        print(f"Error en recaudación: {e}")
        return False
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

def donate_from_clan_db(clan_tag, target_username, amount):
    conn = get_connection()
    c = conn.cursor()
    try:
        # 1. Verificar fondos del clan
        c.execute('SELECT credits FROM clans WHERE tag = ?', (clan_tag,))
        row = c.fetchone()
        if not row or row[0] < amount:
            return {"success": False, "error": "Fondos insuficientes en el clan."}
        
        # 2. Descontar del clan
        c.execute('UPDATE clans SET credits = credits - ? WHERE tag = ?', (amount, clan_tag))
        
        # 3. Sumar al usuario
        c.execute('UPDATE users SET credits = credits + ? WHERE username = ?', (amount, target_username))
        
        # 3.5 Registrar en el historial
        c.execute('''
            INSERT INTO clan_logs (clan_tag, type, description, amount, username)
            VALUES (?, ?, ?, ?, ?)
        ''', (clan_tag, 'DONACION', "Donación de mando", amount, target_username))
        
        # 4. Enviar notificación al receptor
        send_system_message_db(
            target_username, 
            "Transferencia de Clan", 
            f"El mando de tu clan [{clan_tag}] te ha transferido {amount:,} créditos desde la tesorería."
        )
        
        conn.commit()
        return {"success": True, "new_clan_credits": row[0] - amount}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def get_clan_logs_db(clan_tag):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            SELECT type, description, amount, username, timestamp 
            FROM clan_logs 
            WHERE clan_tag = ? 
            ORDER BY timestamp DESC 
            LIMIT 50
        ''', (clan_tag,))
        rows = c.fetchall()
        return [{
            "type": r[0],
            "description": r[1],
            "amount": r[2],
            "username": r[3],
            "timestamp": r[4]
        } for r in rows]
    finally:
        conn.close()

def get_available_clans(search=None):
    conn = get_connection()
    c = conn.cursor()
    if search:
        query = "%" + search.upper() + "%"
        c.execute('SELECT tag, name, leader, members_count, tax_rate, credits FROM clans WHERE tag LIKE ? OR name LIKE ?', (query, query))
    else:
        c.execute('SELECT tag, name, leader, members_count, tax_rate, credits FROM clans LIMIT 50')
    
    rows = c.fetchall()
    conn.close()
    return [{"tag": r[0], "name": r[1], "leader": r[2], "members": r[3], "tax_rate": r[4], "credits": r[5]} for r in rows]

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
    c.execute('SELECT tag, name, leader, members_count, description, created_at, tax_rate, credits FROM clans WHERE tag = ?', (clan_tag,))
    clan = c.fetchone()
    if not clan:
        conn.close()
        return None
        
    # Obtener lista de miembros
    c.execute('''
        SELECT username, clan_role, clan_joined_at, credits, xp 
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
            "credits": m[3],
            "xp": m[4] or 0
        })
    
    return {
        "tag": clan[0],
        "name": clan[1],
        "leader": clan[2],
        "members_count": len(members_list), # Usamos el conteo real de la tabla usuarios
        "description": clan[4],
        "created_at": clan[5],
        "tax_rate": clan[6],
        "credits": clan[7],
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
def get_user_by_email_db(email):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT username FROM users WHERE email = ?', (email,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def set_reset_token_db(username, token, expiry_str):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE username = ?', (token, expiry_str, username))
    conn.commit()
    conn.close()

def get_user_by_token_db(token):
    conn = get_connection()
    c = conn.cursor()
    # Compararemos cadenas de fecha directamente en ISO format
    c.execute('SELECT username, reset_token_expiry FROM users WHERE reset_token = ?', (token,))
    row = c.fetchone()
    conn.close()
    return row

def update_password_by_token_db(token, hashed, salt):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        UPDATE users 
        SET password_hash = ?, salt = ?, reset_token = NULL, reset_token_expiry = NULL 
        WHERE reset_token = ?
    ''', (hashed, salt, token))
    conn.commit()
    conn.close()

def get_leaderboard_db():
    conn = get_connection()
    c = conn.cursor()
    # Obtenemos usuarios ordenados por XP de forma descendente
    c.execute('SELECT username, level, xp FROM users ORDER BY xp DESC')
    rows = c.fetchall()
    conn.close()
    
    leaderboard = []
    for i, row in enumerate(rows):
        leaderboard.append({
            "rank": i + 1,
            "username": row[0],
            "level": row[1],
            "xp": row[2]
        })
    return leaderboard
