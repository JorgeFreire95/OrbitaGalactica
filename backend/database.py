import sqlite3
import hashlib
import os
import secrets
from datetime import datetime, timedelta

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
            minerals_json TEXT DEFAULT '{"titanium": 0, "plutonium": 0, "silicon": 0, "iridium": 0}',
            owned_ships_json TEXT DEFAULT '["starter"]',
            inventory_json TEXT DEFAULT '[]',
            equipped_json TEXT DEFAULT '{}',
            timed_upgrades_json TEXT DEFAULT '{"atk": [], "shld": [], "spd": [], "hp": []}',
            wips_json TEXT DEFAULT '[]',
            clan_tag TEXT,
            clan_role TEXT,
            clan_joined_at TIMESTAMP
        )
    ''')
    
    # Migración: Añadir columnas si no existen
    columns = [
        ("owned_ships_json", "TEXT DEFAULT '[\"starter\"]'"),
        ("inventory_json", "TEXT DEFAULT '[]'"),
        ("equipped_json", "TEXT DEFAULT '{}'"),
        ("timed_upgrades_json", "TEXT DEFAULT '{\"atk\": [], \"shld\": [], \"spd\": [], \"hp\": []}'"),
        ("wips_json", "TEXT DEFAULT '[]'")
    ]
    for col_name, col_type in columns:
        try:
            c.execute(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}')
        except sqlite3.OperationalError:
            pass # Ya existe


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
            status TEXT DEFAULT 'Reclutando',
            news TEXT DEFAULT '[]',
            faction TEXT,
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

    c.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS clan_diplomacy (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_tag TEXT NOT NULL,
            receiver_tag TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS missions (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            target_alien TEXT NOT NULL,
            target_count INTEGER NOT NULL,
            min_level INTEGER DEFAULT 1,
            reward_xp INTEGER DEFAULT 0,
            reward_credits INTEGER DEFAULT 0,
            reward_paladio INTEGER DEFAULT 0,
            reward_ammo_json TEXT DEFAULT '{}',
            next_mission_id INTEGER
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS user_missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            mission_id INTEGER NOT NULL,
            progress INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(mission_id) REFERENCES missions(id)
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
    try:
        c.execute("ALTER TABLE clans ADD COLUMN status TEXT DEFAULT 'Reclutando'")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE clans ADD COLUMN news TEXT DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE clans ADD COLUMN faction TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        c.execute("ALTER TABLE clans ADD COLUMN join_type TEXT DEFAULT 'Abierto'")
    except sqlite3.OperationalError:
        pass
        
    c.execute('''
        CREATE TABLE IF NOT EXISTS clan_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clan_tag TEXT NOT NULL,
            username TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    try:
        c.execute("ALTER TABLE users ADD COLUMN minerals_json TEXT DEFAULT '{\"titanium\": 0, \"plutonium\": 0, \"silicon\": 0}'")
    except sqlite3.OperationalError:
        pass

    try:
        c.execute("ALTER TABLE users ADD COLUMN selected_ship TEXT DEFAULT 'starter'")
    except sqlite3.OperationalError:
        pass
        
    try:
        c.execute("ALTER TABLE users ADD COLUMN vip_until TIMESTAMP")
    except sqlite3.OperationalError:
        pass
        
    try:
        c.execute("ALTER TABLE users ADD COLUMN is_invisible BOOLEAN DEFAULT 0")
    except sqlite3.OperationalError:
        pass
        
    try:
        c.execute("ALTER TABLE users ADD COLUMN wips_json TEXT DEFAULT '[]'")
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

    # Limpiar diplomacia huérfana al inicio para mantener integridad
    try:
        c.execute('DELETE FROM clan_diplomacy WHERE sender_tag NOT IN (SELECT tag FROM clans) OR receiver_tag NOT IN (SELECT tag FROM clans)')
    except sqlite3.OperationalError:
        pass

    conn.commit()
    
    # Initialize missions
    init_missions(conn)
    
    conn.close()

def init_missions(conn):
    import json
    c = conn.cursor()
    # Check if missions already exist
    c.execute("SELECT COUNT(*) FROM missions")
    if c.fetchone()[0] == 0:
        missions = [
            (1, "Bautismo de Fuego", "Elimina 10 alienígenas Gryllos para demostrar tu valía.", "Gryllos", 10, 1, 1000, 5000, 10, json.dumps({"standard": 1000}), 2),
            (2, "Limpieza de Selene", "Los Xylos están invadiendo sectores lunares. Acaba con 15 de ellos.", "Xylos", 15, 2, 2500, 12000, 25, json.dumps({"thermal": 200}), 3),
            (3, "Nebulosa Hostil", "Caza 20 Nykor en las zonas de gas denso.", "Nykor", 20, 3, 6000, 25000, 50, json.dumps({"plasma": 100}), 4),
            (4, "Punta del Horizonte", "El vacío es peligroso. Elimina 25 Syrith para asegurar la ruta.", "Syrith", 25, 4, 12000, 50000, 100, json.dumps({"siphon": 50, "missile_1": 20}), 5),
            (5, "Tormenta sobre Marte", "Caza 30 Vexis bajo las tormentas de polvo.", "Vexis", 30, 5, 25000, 100000, 250, json.dumps({"plasma": 500, "missile_2": 50}), 6),
            (6, "Desafío de los Antiguos", "Elimina 40 Kragos en las ruinas de Plutón.", "Kragos", 40, 6, 50000, 250000, 500, json.dumps({"plasma": 1000, "missile_3": 25}), None)
        ]
        c.executemany('''
            INSERT INTO missions (id, title, description, target_alien, target_count, min_level, reward_xp, reward_credits, reward_paladio, reward_ammo_json, next_mission_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', missions)
        conn.commit()
        print("Misiones inicializadas correctamente.")

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
        vip_until = (datetime.now() + timedelta(days=30)).isoformat()
        c.execute('''
            INSERT INTO users (username, email, password_hash, salt, level, xp, credits, paladio, minerals_json, owned_ships_json, inventory_json, equipped_json, vip_until, wips_json) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (username, email, hashed, salt, 1, 0, 2000, 0, '{"titanium": 0, "plutonium": 0, "silicon": 0, "iridium": 0}', '["starter"]', '[]', '{}', vip_until, '[]'))
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
        try:
            c.execute('SELECT level, xp, credits, paladio, minerals_json, vip_until, owned_ships_json, inventory_json, equipped_json, timed_upgrades_json, is_invisible, wips_json FROM users WHERE username = ?', (username,))
        except sqlite3.OperationalError:
            c.execute('SELECT level, xp, credits, paladio, minerals_json, NULL as vip_until, \'["starter"]\', \'[]\', \'{}\', \'{"atk":[],"shld":[],"spd":[],"hp":[]}\', 0 as is_invisible, \'[]\' as wips_json FROM users WHERE username = ?', (username,))
        row = c.fetchone()
        if not row:
            return None
        
        import json
        try:
            minerals = json.loads(row[4]) if row[4] else {"titanium": 0, "plutonium": 0, "silicon": 0, "iridium": 0}
            owned_ships = json.loads(row[6]) if row[6] else ["starter"]
            inventory = json.loads(row[7]) if row[7] else []
            equipped = json.loads(row[8]) if row[8] else {}
            timed_upgrades = json.loads(row[9]) if (len(row) > 9 and row[9]) else {"atk":[], "shld":[], "spd":[], "hp":[]}
            wips = json.loads(row[11]) if (len(row) > 11 and row[11]) else []
        except:
            minerals = {"titanium": 0, "plutonium": 0, "silicon": 0, "iridium": 0}
            owned_ships = ["starter"]
            inventory = []
            equipped = {}
            timed_upgrades = {"atk":[], "shld":[], "spd":[], "hp":[]}
            wips = []

        return {
            "level": row[0],
            "xp": row[1],
            "credits": row[2],
            "paladio": row[3],
            "minerals": minerals,
            "vip_until": row[5] if len(row) > 5 else None,
            "owned_ships": owned_ships,
            "inventory": inventory,
            "equipped": equipped,
            "timed_upgrades": timed_upgrades,
            "is_invisible": bool(row[10]) if len(row) > 10 else False,
            "wips": wips
        }
    finally:
        conn.close()

def login_user(username, password):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('SELECT username, faction, is_admin, is_super_admin, level, xp, credits, paladio, password_hash, salt, selected_ship, vip_until, owned_ships_json, inventory_json, equipped_json, is_invisible, wips_json FROM users WHERE username = ?', (username,))
    except sqlite3.OperationalError:
        c.execute('SELECT username, faction, is_admin, is_super_admin, level, xp, credits, paladio, password_hash, salt, selected_ship, NULL as vip_until, \'["starter"]\', \'[]\', \'{}\', 0 as is_invisible, \'[]\' as wips_json FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return {"success": False, "error": "Credenciales incorrectas"}
    
    # row unpack
    db_username, faction, is_admin, is_super_admin, level, xp, credits, paladio, db_hash, salt, selected_ship, vip_until, owned_ships_json, inventory_json, equipped_json, is_invisible, wips_json = row
    test_hash, _ = hash_password(password, salt)
    
    if test_hash == db_hash:
        # Recuperar minerales para la sesión inicial
        stats = get_user_stats_db(db_username)
        import json
        return {
            "success": True, 
            "username": db_username, 
            "faction": faction, 
            "is_admin": bool(is_admin),
            "is_super_admin": bool(is_super_admin),
            "level": level,
            "xp": xp,
            "credits": credits,
            "paladio": paladio,
            "selected_ship": selected_ship or "starter",
            "vip_until": vip_until,
            "minerals": stats["minerals"] if stats else {"titanium": 0, "plutonium": 0, "silicon": 0, "iridium": 0},
            "owned_ships": json.loads(owned_ships_json) if owned_ships_json else ["starter"],
            "inventory": json.loads(inventory_json) if inventory_json else [],
            "equipped": json.loads(equipped_json) if equipped_json else {},
            "timed_upgrades": stats["timed_upgrades"] if (stats and "timed_upgrades" in stats) else {"atk":[], "shld":[], "spd":[], "hp":[]},
            "is_invisible": bool(row[15]) if len(row) > 15 else False,
            "wips": json.loads(row[16]) if (len(row) > 16 and row[16]) else []
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
    try:
        c.execute('SELECT username, email, faction, is_admin, is_super_admin, clan_tag, clan_role, level, xp, credits, paladio, vip_until FROM users')
    except sqlite3.OperationalError:
        c.execute('SELECT username, email, faction, is_admin, is_super_admin, clan_tag, clan_role, level, xp, credits, paladio, NULL as vip_until FROM users')
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
        "paladio": r[10],
        "vip_until": r[11] if len(r) > 11 else None
    } for r in rows]

def add_vip_days_db(username, days):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('SELECT vip_until FROM users WHERE username = ?', (username,))
        row = c.fetchone()
        if not row:
            return False
            
        current_vip = row[0]
        now = datetime.now()
        
        if current_vip:
            try:
                current_date = datetime.fromisoformat(current_vip)
                if current_date < now:
                    current_date = now
            except ValueError:
                current_date = now
        else:
            current_date = now
            
        new_vip = (current_date + timedelta(days=days)).isoformat()
        c.execute('UPDATE users SET vip_until = ? WHERE username = ?', (new_vip, username))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating vip_until: {e}")
        return False
    finally:
        conn.close()

def revoke_vip_db(username):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('UPDATE users SET vip_until = NULL WHERE username = ?', (username,))
        conn.commit()
        return c.rowcount > 0
    except Exception:
        return False
    finally:
        conn.close()

def delete_user(username):
    conn = get_connection()
    c = conn.cursor()
    try:
        # 1. Verificar si es Líder de un clan
        c.execute('SELECT clan_tag, clan_role FROM users WHERE username = ?', (username,))
        res = c.fetchone()
        if res and res[1] == 'Líder':
            clan_tag = res[0]
            # Disolver el clan primero para limpiar todas las tablas relacionadas
            # No podemos llamar a dissolve_clan_db directamente porque ya cerramos/abrimos conexiones
            # pero podemos replicar la lógica aquí o simplemente usar la conexión actual
            
            # Remover clan de todos los miembros
            c.execute('UPDATE users SET clan_tag = NULL, clan_role = NULL, clan_joined_at = NULL WHERE clan_tag = ?', (clan_tag,))
            # Borrar logs
            c.execute('DELETE FROM clan_logs WHERE clan_tag = ?', (clan_tag,))
            # Borrar diplomacia
            c.execute('DELETE FROM clan_diplomacy WHERE sender_tag = ? OR receiver_tag = ?', (clan_tag, clan_tag))
            # Borrar solicitudes
            c.execute('DELETE FROM clan_requests WHERE clan_tag = ?', (clan_tag,))
            # Borrar el clan
            c.execute('DELETE FROM clans WHERE tag = ?', (clan_tag,))

        # 2. Borrar al usuario
        c.execute('DELETE FROM users WHERE username = ?', (username,))
        deleted = c.rowcount > 0
        conn.commit()
        return deleted
    except Exception as e:
        print(f"Error deleting user: {e}")
        return False
    finally:
        conn.close()

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

def sync_user_stats(username, level, xp, credits, paladio, minerals=None, owned_ships=None, inventory=None, equipped=None, timed_upgrades=None, is_invisible=None, wips=None, **kwargs):
    conn = get_connection()
    c = conn.cursor()
    import json
    try:
        # SEGURIDAD: Recuperar valores actuales antes de sobreescribir
        c.execute('SELECT level, xp, credits, paladio FROM users WHERE username = ?', (username,))
        current = c.fetchone()
        
        if current:
            curr_lvl, curr_xp, curr_cred, curr_pal = current
            # No permitir bajar de nivel ni perder XP (el progreso es acumulativo)
            safe_level = max(level, curr_lvl)
            safe_xp = max(xp, curr_xp) if level >= curr_lvl else curr_xp
            
            # Protección contra reseteo accidental de créditos a 0
            # Si los créditos recibidos son 0 pero en DB hay más de 50,000, 
            # ignoramos el 0 (probablemente un bug de sincronización/race condition)
            safe_credits = credits
            if credits <= 0 and curr_cred > 50000:
                print(f"ALERTA: Intento de reseteo de créditos bloqueado para {username} ({curr_cred} -> {credits})")
                safe_credits = curr_cred
                
            safe_paladio = max(paladio, curr_pal) if paladio <= 0 and curr_pal > 0 else paladio
        else:
            safe_level, safe_xp, safe_credits, safe_paladio = level, xp, credits, paladio

        fields = ["level = ?", "xp = ?", "credits = ?", "paladio = ?"]
        params = [safe_level, safe_xp, safe_credits, safe_paladio]
        
        if minerals is not None:
            fields.append("minerals_json = ?")
            params.append(json.dumps(minerals))
        if owned_ships is not None:
            fields.append("owned_ships_json = ?")
            params.append(json.dumps(owned_ships))
        if inventory is not None:
            fields.append("inventory_json = ?")
            params.append(json.dumps(inventory))
        if equipped is not None:
            fields.append("equipped_json = ?")
            params.append(json.dumps(equipped))
        if timed_upgrades is not None:
            fields.append("timed_upgrades_json = ?")
            params.append(json.dumps(timed_upgrades))
        if is_invisible is not None:
            fields.append("is_invisible = ?")
            params.append(1 if is_invisible else 0)
        if wips is not None:
            fields.append("wips_json = ?")
            params.append(json.dumps(wips))
            
        params.append(username)
        query = f"UPDATE users SET {', '.join(fields)} WHERE username = ?"
        c.execute(query, params)
        conn.commit()
        return True
    except Exception as e:
        print(f"Error syncing stats: {e}")
        return False
    finally:
        conn.close()

def update_user_ship(username, ship_id):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('UPDATE users SET selected_ship = ? WHERE username = ?', (ship_id, username))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating user ship: {e}")
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
                        
                        # 4. Registrar en el historial del clan (Individual)
                        c.execute('''
                            INSERT INTO clan_logs (clan_tag, type, description, amount, username)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (tag, 'IMPUESTO', f"Impuesto diario ({rate}%)", tax_amount, username))

                        # 5. Enviar notificación
                        send_system_message_db(
                            username, 
                            "Cobro de Impuestos", 
                            f"Se ha descontado {tax_amount:,} créditos de tu banco por concepto de impuestos del clan ({rate}%)."
                        )
            
            # 6. Sumar a la tesorería del clan
            if total_tax_collected > 0:
                c.execute('UPDATE clans SET credits = credits + ? WHERE tag = ?', (total_tax_collected, tag))

        
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
        # 0. Obtener la facción del líder
        c.execute('SELECT faction FROM users WHERE username = ?', (leader,))
        user_row = c.fetchone()
        faction = user_row[0] if user_row else "MARS"

        # 1. Crear el clan con la facción del líder
        c.execute('''
            INSERT INTO clans (tag, name, leader, faction) 
            VALUES (?, ?, ?, ?)
        ''', (tag.upper(), name, leader, faction))
        
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

def send_system_message_db(username, subject, body):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO messages (sender, receiver, subject, body)
            VALUES (?, ?, ?, ?)
        ''', ("SYSTEM", username, subject, body))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def create_clan_request_db(clan_tag, username, message):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Verificar si ya tiene una solicitud pendiente
        c.execute('SELECT id FROM clan_requests WHERE username = ? AND status = "pending"', (username,))
        if c.fetchone():
            return {"success": False, "error": "Ya tienes una solicitud pendiente en un clan."}
        
        c.execute('''
            INSERT INTO clan_requests (clan_tag, username, message)
            VALUES (?, ?, ?)
        ''', (clan_tag.upper(), username, message))
        
        # Notificar al líder
        c.execute('SELECT leader FROM clans WHERE tag = ?', (clan_tag.upper(),))
        leader = c.fetchone()
        if leader:
            send_system_message_db(
                leader[0], 
                "Nueva Solicitud de Ingreso", 
                f"El piloto {username} ha enviado una solicitud para unirse a tu clan [{clan_tag.upper()}]. Revisa el panel de administración."
            )

        conn.commit()
        return {"success": True}
    finally:
        conn.close()

def get_clan_requests_db(clan_tag):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('SELECT id, username, message, created_at FROM clan_requests WHERE clan_tag = ? AND status = "pending"', (clan_tag.upper(),))
        rows = c.fetchall()
        return [{"id": r[0], "username": r[1], "message": r[2], "date": r[3]} for r in rows]
    finally:
        conn.close()

def respond_clan_request_db(request_id, response):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('SELECT username, clan_tag FROM clan_requests WHERE id = ?', (request_id,))
        req = c.fetchone()
        if not req: return {"success": False, "error": "Solicitud no encontrada."}
        
        username, clan_tag = req
        
        if response == 'accept':
            # Intentar unir al usuario
            join_res = join_clan_db(username, clan_tag)
            if not join_res["success"]:
                return join_res
            
            c.execute('UPDATE clan_requests SET status = "accepted" WHERE id = ?', (request_id,))
            send_system_message_db(username, "Solicitud Aceptada", f"¡Bienvenido! Tu solicitud para unirte al clan [{clan_tag}] ha sido aceptada.")
        else:
            c.execute('UPDATE clan_requests SET status = "rejected" WHERE id = ?', (request_id,))
            send_system_message_db(username, "Solicitud Rechazada", f"Tu solicitud para unirte al clan [{clan_tag}] ha sido rechazada.")

        conn.commit()
        return {"success": True}
    finally:
        conn.close()

def donate_from_clan_db(clan_tag, target_username, amount, sender_username="UNKNOWN"):
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
        description = f"Donación: {sender_username} -> {target_username}"
        c.execute('''
            INSERT INTO clan_logs (clan_tag, type, description, amount, username)
            VALUES (?, ?, ?, ?, ?)
        ''', (clan_tag, 'DONACION', description, amount, target_username))
        
        # 4. Enviar notificación al receptor
        send_system_message_db(
            target_username, 
            "Transferencia de Clan", 
            f"{sender_username} te ha transferido {amount:,} créditos desde la tesorería del clan [{clan_tag}]."
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
        c.execute('''
            SELECT c.tag, c.name, c.leader, 
                   (SELECT COUNT(*) FROM users u WHERE u.clan_tag = c.tag) as real_count, 
                   c.tax_rate, c.credits, c.join_type, c.faction 
            FROM clans c WHERE c.tag LIKE ? OR c.name LIKE ?
        ''', (query, query))
    else:
        c.execute('''
            SELECT c.tag, c.name, c.leader, 
                   (SELECT COUNT(*) FROM users u WHERE u.clan_tag = c.tag) as real_count, 
                   c.tax_rate, c.credits, c.join_type, c.faction 
            FROM clans c LIMIT 50
        ''')
    
    rows = c.fetchall()
    conn.close()
    return [{"tag": r[0], "name": r[1], "leader": r[2], "members": r[3], "tax_rate": r[4], "credits": r[5], "join_type": r[6] if len(r) > 6 else "Abierto", "faction": r[7] if len(r) > 7 else "MARS"} for r in rows]

def join_clan_db(username, clan_tag):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Verificar si el clan existe y su estado
        c.execute('SELECT tag, members_count, status FROM clans WHERE tag = ?', (clan_tag.upper(),))
        clan_data = c.fetchone()
        if not clan_data:
            return {"success": False, "error": "El clan no existe."}
            
        current_members = clan_data[1]
        status = clan_data[2]
        
        if current_members >= 30:
            return {"success": False, "error": "El clan ha alcanzado su límite máximo de 30 miembros."}
            
        if status == 'Sin Cupo':
            return {"success": False, "error": "Este clan no está aceptando nuevos miembros actualmente."}
            
        # Verificar si el usuario ya está en un clan
        c.execute('SELECT clan_tag FROM users WHERE username = ?', (username,))
        user_res = c.fetchone()
        if user_res and user_res[0]:
            return {"success": False, "error": "Ya perteneces a un clan. Debes abandonarlo primero."}

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
    c.execute('SELECT tag, name, leader, members_count, description, created_at, tax_rate, credits, join_type, faction FROM clans WHERE tag = ?', (clan_tag,))
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
    
    import json
    try:
        # need to fetch news and logo_url too
        c = get_connection().cursor()
        c.execute('SELECT news, logo_url, status FROM clans WHERE tag = ?', (clan_tag,))
        row = c.fetchone()
        news_data = json.loads(row[0]) if row and row[0] else []
        logo_url = row[1] if row else ""
        status = row[2] if row else "Reclutando"
    except Exception:
        news_data = []
        logo_url = ""
        status = "Reclutando"

    return {
        "tag": clan[0],
        "name": clan[1],
        "leader": clan[2],
        "members_count": len(members_list),
        "description": clan[4],
        "created_at": clan[5],
        "tax_rate": clan[6],
        "credits": clan[7],
        "join_type": clan[8] or "Abierto",
        "faction": clan[9] or "MARS",
        "status": status,
        "news": news_data,
        "logo": logo_url,
        "members": members_list
    }

def update_clan_metadata_db(old_tag, new_tag, name, description, status, news, logo, join_type="Abierto"):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Si el tag cambia, debemos actualizarlo en todas las tablas relacionadas
        if old_tag != new_tag:
            # Verificar si el nuevo tag ya existe
            c.execute('SELECT tag FROM clans WHERE tag = ?', (new_tag,))
            if c.fetchone():
                return {"success": False, "error": "La nueva sigla ya está en uso."}
            
            # Actualizar clanes
            c.execute('''
                UPDATE clans 
                SET tag = ?, name = ?, description = ?, status = ?, news = ?, logo_url = ?, join_type = ?
                WHERE tag = ?
            ''', (new_tag, name, description, status, news, logo, join_type, old_tag))
            
            # Actualizar usuarios
            c.execute('UPDATE users SET clan_tag = ? WHERE clan_tag = ?', (new_tag, old_tag))
            
            # Actualizar logs
            c.execute('UPDATE clan_logs SET clan_tag = ? WHERE clan_tag = ?', (new_tag, old_tag))
        else:
            # Solo actualizar metadata normal
            c.execute('''
                UPDATE clans 
                SET name = ?, description = ?, status = ?, news = ?, logo_url = ?, join_type = ?
                WHERE tag = ?
            ''', (name, description, status, news, logo, join_type, old_tag))
            
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

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
        
        # Borrar logs
        c.execute('DELETE FROM clan_logs WHERE clan_tag = ?', (clan_tag,))
        # Borrar diplomacia (tanto si fue emisor como receptor)
        c.execute('DELETE FROM clan_diplomacy WHERE sender_tag = ? OR receiver_tag = ?', (clan_tag, clan_tag))
        # Borrar solicitudes pendientes
        c.execute('DELETE FROM clan_requests WHERE clan_tag = ?', (clan_tag,))
        
        # Borrar el clan
        c.execute('DELETE FROM clans WHERE tag = ?', (clan_tag,))
        
        conn.commit()
        return {"success": True, "message": "Clan disuelto y miembros notificados."}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def send_user_message_db(sender, receiver, subject, body, msg_type='user'):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Si el receptor es una circular para todo el clan
        if receiver.startswith("CLAN:"):
            clan_tag = receiver.split(":")[1]
            # Obtener todos los miembros del clan
            c.execute('SELECT username FROM users WHERE clan_tag = ?', (clan_tag,))
            members = [r[0] for r in c.fetchall()]
            for member in members:
                 # Añadimos un prefijo al asunto para identificar circulares
                 c.execute('''
                    INSERT INTO messages (sender, receiver, subject, body, type)
                    VALUES (?, ?, ?, ?, ?)
                ''', (sender, member, f"[CIRCULAR] {subject}", body, 'clan'))
        else:
            c.execute('''
                INSERT INTO messages (sender, receiver, subject, body, type)
                VALUES (?, ?, ?, ?, ?)
            ''', (sender, receiver, subject, body, msg_type))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error sending user messaging: {e}")
        return False
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
# --- ANUNCIOS ---

def create_announcement_db(title, content, type='info'):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('INSERT INTO announcements (title, content, type) VALUES (?, ?, ?)', (title, content, type))
        conn.commit()
        return True
    finally:
        conn.close()

def get_announcements_db():
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('SELECT id, title, content, type, created_at FROM announcements ORDER BY created_at DESC')
        rows = c.fetchall()
        return [{
            "id": r[0],
            "title": r[1],
            "content": r[2],
            "type": r[3],
            "date": r[4]
        } for r in rows]
    finally:
        conn.close()

def delete_announcement_db(announcement_id):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('DELETE FROM announcements WHERE id = ?', (announcement_id,))
        conn.commit()
        return c.rowcount > 0
    finally:
        conn.close()

# --- DIPLOMACIA ---

def add_diplomacy_request(sender_tag, receiver_tag, type):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Evitar duplicados pendientes
        c.execute('SELECT id FROM clan_diplomacy WHERE sender_tag = ? AND receiver_tag = ? AND status = "pending"', (sender_tag, receiver_tag))
        if c.fetchone():
            return {"success": False, "error": "Ya existe una petición pendiente a este clan."}
        
        c.execute('INSERT INTO clan_diplomacy (sender_tag, receiver_tag, type) VALUES (?, ?, ?)', (sender_tag, receiver_tag, type))
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def respond_diplomacy_request(request_id, response):
    conn = get_connection()
    c = conn.cursor()
    try:
        status = "accepted" if response == "accept" else "rejected"
        c.execute('UPDATE clan_diplomacy SET status = ? WHERE id = ?', (status, request_id))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def get_clan_diplomacy_status(clan_tag):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Relaciones aceptadas (Alianzas/Guerras)
        c.execute('''
            SELECT id, sender_tag, receiver_tag, type, created_at 
            FROM clan_diplomacy 
            WHERE (sender_tag = ? OR receiver_tag = ?) AND status = "accepted"
        ''', (clan_tag, clan_tag))
        active_rows = c.fetchall()
        
        # Peticiones pendientes (Enviadas o Recibidas)
        c.execute('''
            SELECT id, sender_tag, receiver_tag, type, created_at, status 
            FROM clan_diplomacy 
            WHERE (sender_tag = ? OR receiver_tag = ?) AND status = "pending"
        ''', (clan_tag, clan_tag))
        pending_rows = c.fetchall()
        
        relations = {"alliances": [], "wars": [], "pending": []}
        
        for r in active_rows:
            other_tag = r[2] if r[1] == clan_tag else r[1]
            item = {"id": r[0], "tag": other_tag, "type": r[3], "date": r[4]}
            if r[3] == "war":
                relations["wars"].append(item)
            else:
                relations["alliances"].append(item)
                
        for r in pending_rows:
            is_receiver = (r[2] == clan_tag)
            relations["pending"].append({
                "id": r[0],
                "sender": r[1],
                "receiver": r[2],
                "type": r[3],
                "date": r[4],
                "is_incoming": is_receiver
            })
            
        return relations
    finally:
        conn.close()

def get_all_clans_detailed():
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('SELECT tag, name, leader, members_count, logo_url FROM clans ORDER BY members_count DESC')
        rows = c.fetchall()
        return [{
            "tag": r[0],
            "name": r[1],
            "leader": r[2],
            "members": r[3],
            "logo": r[4]
        } for r in rows]
    finally:
        conn.close()

def get_clan_details_db(clan_tag):
    conn = get_connection()
    c = conn.cursor()
    try:
        # 1. Metadatos del clan
        c.execute('''
            SELECT tag, name, leader, description, created_at, faction, logo_url, join_type, status
            FROM clans 
            WHERE tag = ?
        ''', (clan_tag.upper(),))
        clan = c.fetchone()
        if not clan:
            return None
            
        # 2. Miembros reales
        c.execute('''
            SELECT username, clan_role, clan_joined_at 
            FROM users 
            WHERE clan_tag = ?
            ORDER BY 
                CASE clan_role 
                    WHEN 'Líder' THEN 1 
                    WHEN 'Oficial' THEN 2 
                    ELSE 3 
                END
        ''', (clan_tag.upper(),))
        members_rows = c.fetchall()
        
        members_list = [{
            "name": m[0],
            "role": m[1] or "Miembro",
            "joined": m[2]
        } for m in members_rows]

        return {
            "tag": clan[0],
            "name": clan[1],
            "leader": clan[2],
            "description": clan[3] or "Sin descripción.",
            "created_at": clan[4],
            "faction": clan[5] or "MARS",
            "logo": clan[6] or "",
            "join_type": clan[7] or "Abierto",
            "status": clan[8] or "Reclutando",
            "members_count": len(members_list),
            "members": members_list
        }
    finally:
        conn.close()

# --- MISSION FUNCTIONS ---

def get_missions_db(username):
    conn = get_connection()
    c = conn.cursor()
    import json
    try:
        # Get active missions
        c.execute('''
            SELECT m.id, m.title, m.description, m.target_alien, m.target_count, 
                   m.min_level, m.reward_xp, m.reward_credits, m.reward_paladio, m.reward_ammo_json,
                   um.progress, um.status
            FROM missions m
            JOIN user_missions um ON m.id = um.mission_id
            WHERE um.username = ? AND um.status IN ('active', 'completed')
        ''', (username,))
        active_rows = c.fetchall()
        
        active_missions = []
        completed_mission_ids = []
        for r in active_rows:
            active_missions.append({
                "id": r[0], "title": r[1], "description": r[2], 
                "target_alien": r[3], "target_count": r[4],
                "min_level": r[5], "reward_xp": r[6], "reward_credits": r[7], "reward_paladio": r[8],
                "reward_ammo": json.loads(r[9]),
                "progress": r[10], "status": r[11]
            })
            if r[10] == 'completed': completed_mission_ids.append(r[0])
            
        # Get all completed/claimed missions for this user to know what to offer next
        c.execute('''
            SELECT m.id, m.title, m.description, m.target_alien, m.target_count, 
                   m.min_level, m.reward_xp, m.reward_credits, m.reward_paladio, m.reward_ammo_json,
                   um.progress, um.status
            FROM missions m
            JOIN user_missions um ON m.id = um.mission_id
            WHERE um.username = ? AND um.status = "claimed"
        ''', (username,))
        claimed_rows = c.fetchall()
        
        completed_missions = []
        claimed_ids = []
        for r in claimed_rows:
            completed_missions.append({
                "id": r[0], "title": r[1], "description": r[2], 
                "target_alien": r[3], "target_count": r[4],
                "min_level": r[5], "reward_xp": r[6], "reward_credits": r[7], "reward_paladio": r[8],
                "reward_ammo": json.loads(r[9]),
                "progress": r[10], "status": r[11]
            })
            claimed_ids.append(r[0])
        
        # Obtener todas las misiones que NO han sido aceptadas ni completadas
        available_missions = []
        already_interacted_ids = set(claimed_ids) | set(m["id"] for m in active_missions)
        
        if already_interacted_ids:
            placeholders = ','.join(['?'] * len(already_interacted_ids))
            query = f"SELECT * FROM missions WHERE id NOT IN ({placeholders}) ORDER BY id ASC"
            c.execute(query, list(already_interacted_ids))
        else:
            c.execute("SELECT * FROM missions ORDER BY id ASC")
            
        rows = c.fetchall()
        for m in rows:
            available_missions.append({
                "id": m[0], "title": m[1], "description": m[2],
                "target_alien": m[3], "target_count": m[4], "min_level": m[5],
                "reward_xp": m[6], "reward_credits": m[7], "reward_paladio": m[8],
                "reward_ammo": json.loads(m[9])
            })

        return {"active": active_missions, "available": available_missions, "completed": completed_missions}
    finally:
        conn.close()

def accept_mission_db(username, mission_id):
    conn = get_connection()
    c = conn.cursor()
    try:
        # Check active limit (2)
        c.execute('SELECT COUNT(*) FROM user_missions WHERE username = ? AND status IN ("active", "completed")', (username,))
        if c.fetchone()[0] >= 2:
            return {"success": False, "error": "Ya tienes el máximo de 2 misiones activas."}
            
        # Check if already accepted
        c.execute('SELECT id FROM user_missions WHERE username = ? AND mission_id = ?', (username, mission_id))
        if c.fetchone():
            return {"success": False, "error": "Ya has aceptado esta misión."}
            
        c.execute('INSERT INTO user_missions (username, mission_id) VALUES (?, ?)', (username, mission_id))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()

def update_mission_progress_db(username, mission_id, progress, status='active'):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('UPDATE user_missions SET progress = ?, status = ? WHERE username = ? AND mission_id = ?', (progress, status, username, mission_id))
        conn.commit()
        return True
    finally:
        conn.close()

def claim_mission_reward_db(username, mission_id):
    conn = get_connection()
    c = conn.cursor()
    import json
    try:
        # 1. Verify it's completed but not claimed
        c.execute('SELECT status FROM user_missions WHERE username = ? AND mission_id = ?', (username, mission_id))
        row = c.fetchone()
        if not row or row[0] != 'completed':
            return {"success": False, "error": "La misión no está completada."}
            
        # 2. Get rewards
        c.execute('SELECT reward_xp, reward_credits, reward_paladio, reward_ammo_json FROM missions WHERE id = ?', (mission_id,))
        rew = c.fetchone()
        if not rew: return {"success": False, "error": "Misión no encontrada."}
        
        rxp, rcre, rpal, rammo_json = rew
        rammo = json.loads(rammo_json)
        
        # 3. Apply rewards to user
        # We need current stats
        c.execute('SELECT level, xp, credits, paladio, inventory_json FROM users WHERE username = ?', (username,))
        u = c.fetchone()
        ulvl, uxp, ucre, upal, uinv_json = u
        
        # Update user stats
        new_cre = ucre + rcre
        new_pal = upal + rpal
        
        # XP and Level up (simplified, we should use similar logic as gain_xp)
        new_xp = uxp + rxp
        new_lvl = ulvl
        xp_next = (new_lvl * (new_lvl + 1) // 2) * 1000
        while new_xp >= xp_next:
            new_lvl += 1
            xp_next = (new_lvl * (new_lvl + 1) // 2) * 1000
            
        # Ammo/Items (we'll just update inventory/ammo in users if needed, 
        # but in this game ammo is handled in a dict in memory and synced back.
        # Actually, let's just use the sync_user_stats or equivalent if possible.
        # For simplicity here, we'll update the users table directly.)
        
        c.execute('''
            UPDATE users 
            SET credits = ?, paladio = ?, xp = ?, level = ?
            WHERE username = ?
        ''', (new_cre, new_pal, new_xp, new_lvl, username))
        
        # 4. Mark as claimed
        c.execute('UPDATE user_missions SET status = "claimed" WHERE username = ? AND mission_id = ?', (username, mission_id))
        
        conn.commit()
        return {
            "success": True, 
            "rewards": {"xp": rxp, "credits": rcre, "paladio": rpal, "ammo": rammo},
            "new_stats": {"xp": new_xp, "level": new_lvl, "credits": new_cre, "paladio": new_pal}
        }
    finally:
        conn.close()
