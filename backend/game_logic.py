import math
import random
import time

class GameState:
    def __init__(self):
        self.clients = {} # client_id: websocket
        self.players = {}
        self.enemies = []
        self.projectiles = []
        self.loot_boxes = []
        self.last_alien_spawn = time.time()
        self.alien_spawn_rate = 1.2 
        self.max_enemies = 60 
        self.kill_events = [] 
        self.loot_events = [] 
        self.damage_events = []
        self.last_special_spawn = time.time()
        self.special_spawn_rate = 30.0 # Más constante: cada 30 segundos
        
        # --- BASE Y ZONA SEGURA ---
        self.BASE_X = 1750
        self.BASE_Y = 1150
        self.SAFE_ZONE_RADIUS = 350
        
        self.GAME_WIDTH = 10000
        self.GAME_HEIGHT = 8000
        
        # --- PORTALES Y MAPAS ---
        self.PORTAL_ALFA_X = 9000
        self.PORTAL_ALFA_Y = 7000
        self.PORTAL_BETA_X = 1000
        self.PORTAL_BETA_Y = 1000
        self.PORTAL_RADIUS = 150
        self.PORTAL_SAFE_ZONE_RADIUS = 350
        self.MAPS = {
            "galaxy_1": {"name": "Sector Alfa", "level": 1},
            "galaxy_2": {"name": "Sector Beta", "level": 2}
        }
        
        # --- PERSISTENCIA DE SESIÓN ---
        self.player_persistence = {} # { user_id: {x, y} }
        
        # --- SISTEMA DE GRUPOS (PARTY) ---
        self.parties = {} # { party_id: { leader: id, members: [ids] } }
        self.party_invites = {} # { invited_id: { leader_id: time } }
        
        # --- INICIALIZAR CAJAS ESPECIALES (5 por mapa) ---
        for map_id in self.MAPS:
            for _ in range(5):
                self.spawn_special_chest(map_id)

    def add_player(self, client_id, websocket, ship_type="tank", initial_level=1, initial_xp=0, initial_credits=2000, initial_uridium=0, initial_minerals=None, initial_upgrades=None, initial_modules=None, initial_ammo=None, user_id=None, clan=None):
        self.clients[client_id] = websocket
        
        # Stats and Slot profiles
        profiles = {
            "tank": {
                "hp": 180, "shld": 150, "atk": 70, "spd": 60, "color": "#ffb300",
                "slots": {"lasers": 2, "shields": 6, "engines": 3, "utility": 2}
            },
            "fast": {
                "hp": 80, "shld": 50, "atk": 110, "spd": 180, "color": "#00ccff",
                "slots": {"lasers": 3, "shields": 2, "engines": 7, "utility": 2}
            },
            "stealth": {
                "hp": 90, "shld": 80, "atk": 130, "spd": 140, "color": "#9933ff",
                "slots": {"lasers": 5, "shields": 3, "engines": 4, "utility": 3}
            },
            "heavy": {
                "hp": 160, "shld": 120, "atk": 180, "spd": 50, "color": "#ff3333",
                "slots": {"lasers": 8, "shields": 4, "engines": 2, "utility": 1}
            },
            "support": {
                "hp": 110, "shld": 100, "atk": 60, "spd": 100, "color": "#33ff99",
                "slots": {"lasers": 2, "shields": 3, "engines": 4, "utility": 6}
            }
        }
        
        prof = profiles.get(ship_type, profiles["tank"])
        
        # Calculate modules based on stats (legacy logic, will be overridden by initial_modules eventually)
        c_lasers = max(1, round(prof["atk"] / 25))
        c_shields = max(1, round(prof["hp"] / 25))
        c_engines = max(1, round(prof["spd"] / 20))
        
        player = {
            "id": client_id,
            "user_id": user_id,
            "ship_type": ship_type,
            "x": 1600,
            "y": 1050,
            "vx": 0,
            "vy": 0,
            "hp": prof["hp"],
            "max_hp": prof["hp"],
            "shld": prof["shld"],
            "max_shld": prof["shld"],
            "last_dmg_time": 0,
            "lasers": 0,
            "shields": 0,
            "engines": 0,
            "slots": prof["slots"],
            "equipped": [], # List of modules
            "atk": prof["atk"],
            "spd": prof["spd"],
            "color": prof["color"],
            "score": 0,
            "credits": initial_credits, 
            "last_shot": 0,
            "fire_rate": 0.12, # Cadencia base más rápida (antes 0.25)
            "powerup": None,
            "powerup_time": 0,
            "heading": -1.57,
            "ammo": {"standard": 2000, "thermal": 0, "plasma": 0, "siphon": 0},
            "missiles": {"missile_1": 0, "missile_2": 0, "missile_3": 0},
            "missile_type": "missile_1",
            "last_missile_shot": 0,
            "ammo_type": "standard",
            "level": initial_level,
            "xp": initial_xp,
            "xp_next": initial_level * 1000,
            "minerals": initial_minerals if initial_minerals else {"titanium": 0, "plutonium": 0, "silicon": 0},
            "max_cargo": prof.get("cargo_capacity", 50),
            "permanent_upgrades": initial_upgrades if initial_upgrades else {"atk": 0, "shld": 0, "spd": 0},
            "current_map": "galaxy_1",
            "uridium": 0,
            "clan": clan
        }
        
        # Apply permanent upgrades to base stats
        upg = player["permanent_upgrades"]
        player["atk"] += upg.get("atk", 0)
        player["shld"] += upg.get("shld", 0)
        player["max_shld"] += upg.get("shld", 0)
        # Note: spd is used for calculations later, but we update the base here
        player["spd"] += upg.get("spd", 0)
 
        if initial_ammo:
            # Separar munición de láseres vs misiles
            for k, v in initial_ammo.items():
                if k.startswith("missile_"):
                    player["missiles"][k] = v
                else:
                    player["ammo"][k] = v
            
        # --- RESTAURAR POSICIÓN Y ESTADO PERSISTENTE ---
        if user_id and user_id in self.player_persistence:
            saved = self.player_persistence[user_id]
            player["x"] = saved.get("x", 1600)
            player["y"] = saved.get("y", 1050)
            player["current_map"] = saved.get("current_map", "galaxy_1")
            
            # Sincronización inteligente de Monedas:
            # Si el frontend envía menos créditos/uridium que los guardados, 
            # asumimos que acaba de comprar algo en la tienda (offline) y usamos el valor del frontend.
            if initial_credits < saved.get("credits", initial_credits):
                player["credits"] = initial_credits
            else:
                player["credits"] = saved.get("credits", initial_credits)
            
            if initial_uridium < saved.get("uridium", initial_uridium):
                player["uridium"] = initial_uridium
            else:
                player["uridium"] = saved.get("uridium", initial_uridium)
            
            # Restaurar XP/Nivel si existen (Preferimos el backend si no hay discrepancia masiva)
            player["xp"] = saved.get("xp", initial_xp)
            player["level"] = saved.get("level", initial_level)
            
            print(f"Restaurando Sesión para {user_id}: Map={player['current_map']}, Credits={player['credits']}, Uridium={player['uridium']}")
        else:
            # Si no hay persistencia en memoria del servidor, usamos los valores iniciales del cliente
            player["credits"] = initial_credits
            player["uridium"] = initial_uridium
            print(f"Nueva sesión (o servidor reiniciado) para {user_id}: Usando valores del cliente ({initial_credits} C, {initial_uridium} U).")
        
        player["party_id"] = None
        self.players[client_id] = player

        # Apply initial modules if provided
        if initial_modules:
            for mod in initial_modules:
                self.buy_module(client_id, mod, free=True)

    def remove_player(self, client_id):
        if client_id in self.players:
            player = self.players[client_id]
            user_id = player.get("user_id")
            if user_id:
                self.player_persistence[user_id] = {
                    "x": player["x"],
                    "y": player["y"],
                    "current_map": player.get("current_map", "galaxy_1"),
                    "uridium": player.get("uridium", 0),
                    "credits": player.get("credits", 0),
                    "xp": player.get("xp", 0),
                    "level": player.get("level", 1),
                    "ammo": player.get("ammo", {}).copy(),
                    "missiles": player.get("missiles", {}).copy(),
                    "minerals": player.get("minerals", {}).copy(),
                    "last_save": time.time()
                }
                print(f"Guardando persistencia para {user_id}: Credits={player['credits']}, Map={player['current_map']}")
                
            del self.players[client_id]
            
        if client_id in self.clients:
            del self.clients[client_id]

    def handle_input(self, client_id, keys):
        if client_id not in self.players:
            return
        player = self.players[client_id]
        # Detect Direction (Target or Mouse)
        target_x = keys.get("target_x")
        target_y = keys.get("target_y")
        
        # --- PRIORIDAD TECLADO ---
        if keys.get("up") or keys.get("down") or keys.get("left") or keys.get("right"):
            target_x = None
            target_y = None
            player["target_x"] = None # Persistencia en el objeto player si existiera
            player["target_y"] = None

        # PERSISTENCIA MEJORADA: Solo actualizar si la clave está presente
        if "locked_target_id" in keys:
            player["locked_target_id"] = keys["locked_target_id"]
        
        locked_id = player.get("locked_target_id")
        MAX_COMBAT_RANGE = 700
        player["in_range"] = True

        if locked_id:
            # Si hay un objetivo fijado, buscarlo
            target_enemy = next((e for e in self.enemies if e["id"] == locked_id), None)
            if target_enemy:
                # Calcular distancia al objetivo
                dist = math.hypot(target_enemy["x"] - player["x"], target_enemy["y"] - player["y"])
                if dist > MAX_COMBAT_RANGE:
                    player["in_range"] = False
                
                # Si estamos disparando y EN RANGO, apuntar al objetivo automáticamente
                if keys.get("shoot") and player["in_range"]:
                    dx = target_enemy["x"] - player["x"]
                    dy = target_enemy["y"] - player["y"]
                    # Suavizado de rotación (opcional, por ahora directo)
                    player["heading"] = math.atan2(dy, dx)
            else:
                # El objetivo murió o desapareció
                player["locked_target_id"] = None
        
        # Si NO hay objetivo fijado pero sí destino de movimiento, apuntar al destino
        if not locked_id and target_x is not None and target_y is not None:
            dx = target_x - player["x"]
            dy = target_y - player["y"]
            dist_sq = dx*dx + dy*dy
            if dist_sq > 25:
                player["heading"] = math.atan2(dy, dx)

        # Shooting Toggle / Logic
        is_shooting = keys.get("shoot", False)
        
        # El disparo automático solo persiste si hay un objetivo y está en rango
        player["shoot_active"] = is_shooting
        
        # BLOQUEO: No disparar si no hay un objetivo seleccionado
        if not locked_id:
            player["shoot_active"] = False
        
        # Override: si el target murió o está FUERA DE RANGO, obligar a que shoot_active sea False
        if locked_id:
            target_exists = next((e for e in self.enemies if e["id"] == locked_id), None)
            if not target_exists or not player.get("in_range", True):
                player["shoot_active"] = False

        # Movement Calculation
        vx = 0
        vy = 0
        speed = player["spd"] * 3.5
        if player["powerup"] == "speed":
            speed *= 1.5

        if target_x is not None and target_y is not None:
            # Mouse point-and-click movement
            dx = target_x - player["x"]
            dy = target_y - player["y"]
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist > 5.0: # Threshold to stop exactly at target
                vx = (dx / dist) * speed
                vy = (dy / dist) * speed
            else:
                vx = 0
                vy = 0
        else:
            # WASD movement
            if keys.get("up"): vy -= speed
            if keys.get("down"): vy += speed
            if keys.get("left"): vx -= speed
            if keys.get("right"): vx += speed
            
            # Normalize diagonal
            if vx != 0 or vy != 0:
                norm = math.sqrt(vx*vx + vy*vy)
                vx = (vx/norm) * speed
                vy = (vy/norm) * speed
                # --- ACTUALIZAR HEADING CON TECLADO ---
                if not locked_id:
                    player["heading"] = math.atan2(vy, vx)
            
        player["vx"] = vx
        player["vy"] = vy
        
        # Shooting
        now = time.time()
        fire_rate = player["fire_rate"]
        if player["powerup"] == "rapid_fire":
            fire_rate *= 0.4
            
        # IMPORTANTE: Usar shoot_active que ya tiene filtrado el rango y el objetivo
        if player.get("shoot_active", False) and (now - player["last_shot"] > fire_rate):
            player["last_shot"] = now
            
            # Apply Ammo Multipliers
            ammo_type = player.get("ammo_type", "standard")
            ammo_config = {
                "standard": {"dmg": 1.0},
                "thermal":  {"dmg": 1.5},
                "plasma":   {"dmg": 2.5},
                "siphon":   {"dmg": 1.0, "effect": "shield_steal"}
            }
            config = ammo_config.get(ammo_type, ammo_config["standard"])
            
            # Consume Ammo
            if player["ammo"].get(ammo_type, 0) > 0:
                player["ammo"][ammo_type] -= 1
            else:
                # Si se acabó la munición especial, intentar volver a la estándar
                if ammo_type != "standard":
                    player["ammo_type"] = "standard"
                    ammo_type = "standard"
                    config = ammo_config["standard"]
                    # Pero si la estándar también está en 0, no disparar
                    if player["ammo"].get("standard", 0) <= 0:
                         player["shoot_active"] = False
                         return
                else:
                    # Se acabó la estándar
                    player["shoot_active"] = False
                    return

            # Un solo Rayo Láser potente (el daño ahora escala con num_lasers en un solo disparo)
            num_lasers = player.get("lasers", 1)
            actual_damage = (player["atk"] * 0.25 * config["dmg"]) * max(1, num_lasers)
            
            projectile_speed = 1400 # Velocidad de rayo láser
            angle = player.get("heading", -1.57)
            
            self.projectiles.append({
                "id": str(random.random()),
                "owner_id": client_id,
                "is_player": True,
                "x": player["x"],
                "y": player["y"],
                "vx": math.cos(angle) * projectile_speed,
                "vy": math.sin(angle) * projectile_speed,
                "damage": actual_damage,
                "ammo_type": ammo_type,
                "life": 1.2, # segundos de vida del rayo
                "map_id": player["current_map"]
            })

        # Missile Firing (Tecla E)
        if keys.get("missile_shoot") and (now - player["last_missile_shot"] > 1.5): # Cooldown de 1.5s
            m_type = player.get("missile_type", "missile_1")
            if player["missiles"].get(m_type, 0) > 0:
                player["missiles"][m_type] -= 1
                player["last_missile_shot"] = now
                
                # Configuración de daño de misiles (Proporcional al Atk del jugador)
                atk = player.get("atk", 100)
                m_config = {
                    "missile_1": {"dmg": atk * 5.0,  "spd": 800}, # Equiv a 500 si atk=100
                    "missile_2": {"dmg": atk * 12.0, "spd": 700}, # Equiv a 1200 si atk=100
                    "missile_3": {"dmg": atk * 35.0, "spd": 500}  # Equiv a 3500 si atk=100
                }
                conf = m_config.get(m_type)
                # Determinar dirección del misil: al objetivo o al frente
                locked_id = player.get("locked_target_id")
                target_enemy = next((e for e in self.enemies if e["id"] == locked_id), None) if locked_id else None
                
                if target_enemy:
                    dx = target_enemy["x"] - player["x"]
                    dy = target_enemy["y"] - player["y"]
                    angle = math.atan2(dy, dx)
                else:
                    angle = player.get("heading", -1.57)
                
                self.projectiles.append({
                    "id": "missile_" + str(random.random()),
                    "owner_id": client_id,
                    "is_player": True,
                    "is_missile": True,
                    "x": player["x"],
                    "y": player["y"],
                    "vx": math.cos(angle) * conf["spd"],
                    "vy": math.sin(angle) * conf["spd"],
                    "damage": conf["dmg"],
                    "m_type": m_type,
                    "life": 4.0, # Los misiles duran más
                    "map_id": player["current_map"]
                })

    def update(self, dt):
        now = time.time()
        
        # 1. Spawn Enemies (Por cada mapa)
        if now - self.last_alien_spawn > self.alien_spawn_rate:
            for map_id in self.MAPS:
                map_enemies = [e for e in self.enemies if e.get("map_id") == map_id]
                if len(map_enemies) < self.max_enemies // 2: # Repartir límite entre mapas
                    self.spawn_alien(map_id)
            # Si el mapa está lleno, reseteamos el temporizador para no spawnear todos de golpe al vaciarse
            self.last_alien_spawn = now
            
        # Spawn de Cofre Especial (Cada 30 segundos mantenemos 5 por mapa)
        if now - self.last_special_spawn > self.special_spawn_rate:
            for map_id in self.MAPS:
                special_count = len([b for b in self.loot_boxes if b.get("type") == "special_coin" and b.get("map_id") == map_id])
                if special_count < 5:
                    self.spawn_special_chest(map_id)
            self.last_special_spawn = now
            
        # 2. Update Players
        for pid, p in self.players.items():
            if p["hp"] <= 0: continue
            
            p["x"] += p["vx"] * dt
            p["y"] += p["vy"] * dt
            
            # Constrain to screen/world limits
            p["x"] = max(20, min(self.GAME_WIDTH - 20, p["x"]))
            p["y"] = max(20, min(self.GAME_HEIGHT - 20, p["y"]))
            
            # Regenerar Escudos
            # Regenerar Escudos si no ha recibido daño en 3 segundos
            if now - p["last_dmg_time"] > 3.0:
                p["shld"] = min(p["max_shld"], p["shld"] + (20.0 * dt)) # 20 SHLD/s
            
            # Quitar powerup si expiró
            if p["powerup"] and now > p["powerup_time"]:
                p["powerup"] = None
                
            # --- DETECCIÓN DE ZONA SEGURA (BASE Y PORTAL) ---
            # La base solo existe en el Sector Alfa (Mapa 1)
            in_base_safety = False
            if p["current_map"] == "galaxy_1":
                dist_to_base = math.hypot(p["x"] - self.BASE_X, p["y"] - self.BASE_Y)
                in_base_safety = dist_to_base < self.SAFE_ZONE_RADIUS
            
            # Localizar el portal del mapa actual
            px = self.PORTAL_ALFA_X if p["current_map"] == "galaxy_1" else self.PORTAL_BETA_X
            py = self.PORTAL_ALFA_Y if p["current_map"] == "galaxy_1" else self.PORTAL_BETA_Y
            dist_to_portal = math.hypot(p["x"] - px, p["y"] - py)
            
            p["in_safe_zone"] = in_base_safety or dist_to_portal < self.PORTAL_SAFE_ZONE_RADIUS
                
            if p.get("locked_target_id"):
                target_exists = any(en["id"] == p["locked_target_id"] for en in self.enemies)
                if not target_exists:
                    p["locked_target_id"] = None
                    p["shoot_active"] = False # Detener disparo al morir el blanco


        # 3. Update Projectiles
        for proj in self.projectiles:
            proj["x"] += proj["vx"] * dt
            proj["y"] += proj["vy"] * dt
            proj["life"] -= dt
            
        self.projectiles = [p for p in self.projectiles if p["life"] > 0]
        
        # 4. Update Enemies (Simple AI: move towards nearest player, or random)
        for enemy in self.enemies:
            enemy["y"] += enemy["vy"] * dt
            enemy["x"] += enemy["vx"] * dt
            
            # Si salen de los límites del mapa (cualquiera de los 4 bordes), reaparecen
            if (enemy["y"] > self.GAME_HEIGHT + 100 or enemy["y"] < -100 or
                enemy["x"] > self.GAME_WIDTH + 100 or enemy["x"] < -100):
                enemy["y"] = -50 # Reaparecer desde arriba
                enemy["x"] = random.randint(50, self.GAME_WIDTH - 50)
                enemy["vx"] = random.uniform(-50, 50)
                enemy["vy"] = random.uniform(50, 150)
        
        # Limpiar eventos antiguos (2.5 segundos)
        self.kill_events = [e for e in self.kill_events if now - e["time"] < 2.5]
        self.loot_events = [e for e in self.loot_events if now - e["time"] < 2.5]
        self.damage_events = [e for e in self.damage_events if now - e["time"] < 1.0] # Daño dura 1 seg
                
        # 5. Collisions
        self._check_collisions(now)
        
    def _check_collisions(self, now):
        # Proyectiles vs Aliens y Proyectiles vs Jugadores
        alive_projectiles = []
        for p in self.projectiles:
            hit = False
            
            if p["is_player"]:
                # Check contra aliens
                for e in self.enemies:
                    dist = math.hypot(p["x"] - e["x"], p["y"] - e["y"])
                    if dist < 20 or (p.get("is_missile") and dist < 45): # Radio colisión mayor para misiles
                        # Solo aplicar daño si NO es munición Sifón
                        if p.get("ammo_type") != "siphon":
                            e["hp"] -= p["damage"]
                            
                            # Registrar evento de daño para el frontend
                            self.damage_events.append({
                                "id": str(random.random()),
                                "x": e["x"] + random.randint(-15, 15),
                                "y": e["y"] + random.randint(-15, 15),
                                "amount": int(p["damage"]),
                                "time": now,
                                "owner_id": p["owner_id"]
                            })
                        
                        # Siphon effect (Roba escudos)
                        if p.get("ammo_type") == "siphon" and p["owner_id"] in self.players:
                            player = self.players[p["owner_id"]]
                            # Robar solo de los escudos del alien
                            steal_amount = 15 # Cantidad a robar
                            if e.get("shield", 0) > 0:
                                val = min(e["shield"], steal_amount)
                                e["shield"] -= val
                                # Transferir al jugador usando la propiedad correcta "shld"
                                player["shld"] = min(player["max_shld"], player["shld"] + val)
                        
                        hit = True
                        if e["hp"] <= 0:
                            # Kill enemy, award score, credits and XP
                            if p["owner_id"] in self.players:
                                player = self.players[p["owner_id"]]
                                player["score"] += 100
                                player["credits"] += 250 
                                self.gain_xp(player, 100) # Award 100 XP per kill
                                
                                # Registrar evento de recompensa para el HUD
                                self.kill_events.append({
                                    "id": str(random.random()),
                                    "x": e["x"],
                                    "y": e["y"],
                                    "xp": 100,
                                    "credits": 250,
                                    "time": now,
                                    "owner_id": p["owner_id"]
                                })
                                
                                # Chance de recuperar un poco de munición térmica (5%)
                                if random.random() < 0.05:
                                    player["ammo"]["thermal"] += 5
                                    
                                # Soltar loot box! Chance del 20%
                                if random.random() < 0.2:
                                    self.loot_boxes.append({
                                        "id": str(random.random()),
                                        "x": e["x"],
                                        "y": e["y"],
                                        "type": random.choice(["heal", "rapid_fire", "speed"]),
                                        "spawn_time": now,
                                        "map_id": e["map_id"]
                                    })
                                # Soltar MINERALES! Chance del 40%
                                if random.random() < 0.4:
                                    self.loot_boxes.append({
                                        "id": str(random.random()),
                                        "x": e["x"] + random.randint(-15, 15),
                                        "y": e["y"] + random.randint(-15, 15),
                                        "type": "mineral",
                                        "mineral_type": random.choice(["titanium", "plutonium", "silicon"]),
                                        "amount": random.randint(3, 8),
                                        "spawn_time": now,
                                        "map_id": e["map_id"]
                                    })
                            
                            # RECOMPENSAS COMPARTIDAS EN GRUPO (Duplicar para el resto de miembros)
                            if player.get("party_id") and player["party_id"] in self.parties:
                                party = self.parties[player["party_id"]]
                                for member_id in party["members"]:
                                    if member_id == player["id"]: continue
                                    if member_id in self.players:
                                        m = self.players[member_id]
                                        if m["current_map"] == e["map_id"]:
                                            m["credits"] += 250
                                            self.gain_xp(m, 100)
                                            # Evento visual para el compañero
                                            self.kill_events.append({
                                                "id": str(random.random()),
                                                "x": e["x"], "y": e["y"],
                                                "xp": 100, "credits": 250,
                                                "time": now, "owner_id": member_id, "is_party_share": True
                                            })
                        break
                # Check contra jugadores
                for pid, target in self.players.items():
                    if p["owner_id"] == pid: continue # No friendly fire
                    if target["hp"] <= 0: continue
                    dist = math.hypot(p["x"] - target["x"], p["y"] - target["y"])
                    if dist < 20:
                        damage = p["damage"]
                        target["last_dmg_time"] = now
                        if target["shld"] >= damage:
                            target["shld"] -= damage
                        else:
                            rem = damage - target["shld"]
                            target["shld"] = 0
                            target["hp"] -= rem
                        hit = True
                        break
            else:
                pass # Aquí para el MVP, los aliens no disparan, mueren por chocar.
                
            if not hit:
                alive_projectiles.append(p)
                
        self.projectiles = alive_projectiles
        
        # Aliens muertos desaparecen
        self.enemies = [e for e in self.enemies if e["hp"] > 0]
        
        # Jugadores vs Cajas (Looting)
        alive_boxes = []
        for box in self.loot_boxes:
            taken = False
            # Check lifetime (10 secs)
            if now - box["spawn_time"] > 10:
                continue # expiró
                
            for pid, player in self.players.items():
                if player["hp"] <= 0: continue
                dist = math.hypot(box["x"] - player["x"], box["y"] - player["y"])
                if dist < 30: # 15 box width + 15 player size
                    taken = True
                    if box["type"] == "heal":
                        player["hp"] = min(player["max_hp"], player["hp"] + 50)
                        self.loot_events.append({
                            "id": str(random.random()),
                            "x": box["x"], "y": box["y"],
                            "type": "heal", "amount": 50,
                            "time": now, "owner_id": pid
                        })
                    elif box["type"] == "mineral":
                        # Verificar espacio en bodega
                        current_cargo = sum(player["minerals"].values())
                        can_take = min(box["amount"], player["max_cargo"] - current_cargo)
                        if can_take > 0:
                            m_type = box["mineral_type"]
                            player["minerals"][m_type] += can_take
                            self.loot_events.append({
                                "id": str(random.random()),
                                "x": box["x"], "y": box["y"],
                                "type": "mineral", "mineral_type": m_type, "amount": can_take,
                                "time": now, "owner_id": pid
                            })
                        else:
                            taken = False # No pudo recoger nada porque está lleno
                    elif box["type"] == "special_coin":
                        # --- RECOMPENSA ALEATORIA URIDIUM/CRÉDITOS/MUNICIÓN ---
                        rand = random.random()
                        if rand < 0.40: # 40% Créditos
                            amt = random.randint(1000, 5000)
                            player["credits"] += amt
                            self.loot_events.append({
                                "id": str(random.random()),
                                "x": box["x"], "y": box["y"],
                                "type": "credits", "amount": amt,
                                "time": now, "owner_id": pid
                            })
                        elif rand < 0.80: # 40% Munición Especial
                            amt = random.randint(50, 150)
                            ammo_id = random.choice(["thermal", "plasma", "siphon"])
                            player["ammo"][ammo_id] += amt
                            self.loot_events.append({
                                "id": str(random.random()),
                                "x": box["x"], "y": box["y"],
                                "type": "ammo", "ammo_type": ammo_id, "amount": amt,
                                "time": now, "owner_id": pid
                            })
                        else: # 20% Uridium
                            amt = random.randint(2, 10)
                            player["uridium"] = player.get("uridium", 0) + amt
                            self.loot_events.append({
                                "id": str(random.random()),
                                "x": box["x"], "y": box["y"],
                                "type": "special_coin", "amount": amt,
                                "time": now, "owner_id": pid
                            })
                    else:
                        player["powerup"] = box["type"]
                        player["powerup_time"] = now + 10.0 # dura 10 segundos
                        self.loot_events.append({
                            "id": str(random.random()),
                            "x": box["x"], "y": box["y"],
                            "type": box["type"], # rapid_fire, speed
                            "time": now, "owner_id": pid
                        })
                    break
            
            if not taken:
                alive_boxes.append(box)
                
        self.loot_boxes = alive_boxes
        
        # Aliens vs Jugadores (Daño por contacto)
        for e in self.enemies:
            for pid, p in self.players.items():
                if p["hp"] <= 0 or p.get("in_safe_zone", False): continue
                dist = math.hypot(e["x"] - p["x"], e["y"] - p["y"])
                if dist < 25:
                    damage = 10
                    p["last_dmg_time"] = now
                    if p["shld"] >= damage:
                        p["shld"] -= damage
                    else:
                        remaining = damage - p["shld"]
                        p["shld"] = 0
                        p["hp"] -= remaining
                        
                    e["hp"] -= 50 # El alien también sufre daño
        self.enemies = [e for e in self.enemies if e["hp"] > 0]

    def spawn_alien(self, map_id="galaxy_1"):
        is_beta = map_id == "galaxy_2"
        
        hp = 150 if is_beta else 50
        shield = 100 if is_beta else 30
        
        self.enemies.append({
            "id": str(random.random()),
            "x": random.randint(100, self.GAME_WIDTH - 100),
            "y": random.randint(100, self.GAME_HEIGHT - 100),
            "vx": random.uniform(-60, 60),
            "vy": random.uniform(-60, 60),
            "hp": hp,
            "max_hp": hp,
            "shield": shield,
            "max_shield": shield,
            "map_id": map_id,
            "is_elite": is_beta
        })

    def spawn_special_chest(self, map_id="galaxy_1"):
        # Spawnear un cofre en una posición totalmente aleatoria
        self.loot_boxes.append({
            "id": "special_" + str(random.random()),
            "x": random.randint(200, self.GAME_WIDTH - 200),
            "y": random.randint(200, self.GAME_HEIGHT - 200),
            "type": "special_coin",
            "spawn_time": time.time() + 100, # Los cofres especiales duran más (100+10 segundos por el check de update)
            "map_id": map_id
        })
        print(f"¡Cofre Especial spawneado en {map_id}!")

    def buy_module(self, client_id, module_data, free=False):
        if client_id not in self.players:
            return
            
        player = self.players[client_id]
        cost = module_data.get("cost", 0)
        m_type = module_data.get("type", "") # lasers, shields, engines, utility
        
        # Check credits (unless it's free/initial)
        if not free:
            if player["credits"] < cost:
                return # Not enough money
            
            # BLOQUEO: Solo permitir equipar en la Base / Zona Segura
            if not player.get("in_safe_zone", False):
                return # Debe estar en la base para equipar
            
        # Check slot capacity
        max_slots = player["slots"].get(m_type, 0)
        current_used = len([m for m in player["equipped"] if m["type"] == m_type])
        
        if current_used >= max_slots:
            return # No more slots available for this type
            
        # Deduct credits and equip
        if not free:
            player["credits"] -= cost
        player["equipped"].append(module_data)
        
        # Apply bonuses
        if "atk" in module_data: player["atk"] += module_data["atk"]
        if "hp" in module_data: 
            player["max_hp"] += module_data["hp"]
            player["hp"] += module_data["hp"]
        if "shld" in module_data:
            player["max_shld"] += module_data["shld"]
            player["shld"] += module_data["shld"]
        if "spd" in module_data: player["spd"] += module_data["spd"]
            
        # Recalculate modules count for visuals (lasers, engines etc)
        if m_type == "lasers": player["lasers"] += 1
        if m_type == "engines": player["engines"] += 1
        if m_type == "shields": player["shields"] += 1

    def switch_ammo(self, client_id, ammo_id):
        if client_id in self.players:
            player = self.players[client_id]
            # Verify if player has ammo of that type (standard is always available)
            if ammo_id.startswith("missile_"):
                if player["missiles"].get(ammo_id, 0) > 0:
                    player["missile_type"] = ammo_id
            elif ammo_id == "standard" or player["ammo"].get(ammo_id, 0) > 0:
                player["ammo_type"] = ammo_id

    def gain_xp(self, player, amount):
        player["xp"] += amount
        # Level up logic
        while player["xp"] >= player["xp_next"]:
            player["xp"] -= player["xp_next"]
            player["level"] += 1
            player["xp_next"] = player["level"] * 1000
            
            # Bonus per level up (Example: heal a bit)
            player["hp"] = min(player["max_hp"], player["hp"] + 25)
            # You could also add a notification flag here if needed

    def update_player_input(self, client_id, keys):
        if client_id in self.players:
            player = self.players[client_id]
            player["keys"] = keys
            # Only update locked_target_id if it's explicitly provided in the keys object
            if "locked_target_id" in keys:
                player["locked_target_id"] = keys["locked_target_id"]

    def jump_portal(self, client_id):
        if client_id not in self.players:
            return
        
        p = self.players[client_id]
        # Localizar el portal del mapa actual
        px = self.PORTAL_ALFA_X if p["current_map"] == "galaxy_1" else self.PORTAL_BETA_X
        py = self.PORTAL_ALFA_Y if p["current_map"] == "galaxy_1" else self.PORTAL_BETA_Y
        dist_to_portal = math.hypot(p["x"] - px, p["y"] - py)
        
        # Debe estar dentro del radio del portal para activarlo
        if dist_to_portal < self.PORTAL_RADIUS:
            if p["current_map"] == "galaxy_1":
                p["current_map"] = "galaxy_2"
                # Aparecer cerca del portal de retorno en Beta
                p["x"] = self.PORTAL_BETA_X + 220
                p["y"] = self.PORTAL_BETA_Y + 220
            else:
                p["current_map"] = "galaxy_1"
                # Volver cerca del portal en el Sector Alfa
                p["x"] = self.PORTAL_ALFA_X - 220
                p["y"] = self.PORTAL_ALFA_Y - 220
            
            # --- RESETEO DE MOVIMIENTO Y BLOQUEO TEMPORAL ---
            p["vx"] = 0
            p["vy"] = 0
            p["target_x"] = None
            p["target_y"] = None
            p["last_jump_time"] = time.time()
            
            return True
        return False

    def get_state(self, client_id=None):
        # Si se proporciona client_id, devolvemos solo lo que le interesa a ese mapa
        players_list = list(self.players.values())
        
        if client_id and client_id in self.players:
            me = self.players[client_id]
            m_id = me["current_map"]
            
            # Portal dinámico según el mapa
            px = self.PORTAL_ALFA_X if m_id == "galaxy_1" else self.PORTAL_BETA_X
            py = self.PORTAL_ALFA_Y if m_id == "galaxy_1" else self.PORTAL_BETA_Y

            return {
                "players": [{**p, "is_self": p["id"] == client_id} for p in players_list if p["current_map"] == m_id],
                "enemies": [e for e in self.enemies if e.get("map_id") == m_id],
                "projectiles": [p for p in self.projectiles if p.get("map_id") == m_id],
                "loot_boxes": [b for b in self.loot_boxes if b.get("map_id") == m_id],
                "kill_events": [e for e in self.kill_events if e.get("owner_id") == client_id],
                "loot_events": [e for e in self.loot_events if e.get("owner_id") == client_id],
                "base": {"x": self.BASE_X, "y": self.BASE_Y, "radius": self.SAFE_ZONE_RADIUS} if m_id == "galaxy_1" else None,
                "portal": {"x": px, "y": py, "radius": self.PORTAL_RADIUS, "target": "galaxy_2" if m_id == "galaxy_1" else "galaxy_1"},
                "current_map_name": self.MAPS[m_id]["name"],
                "damage_events": [e for e in self.damage_events if e.get("owner_id") == client_id],
                "party": self.parties.get(me.get("party_id")) if me.get("party_id") else None,
                "party_invites": self.party_invites.get(client_id, {})
            }

        return {
            "players": players_list,
            "enemies": self.enemies,
            "projectiles": self.projectiles,
            "loot_boxes": self.loot_boxes,
            "kill_events": self.kill_events,
            "loot_events": self.loot_events,
            "damage_events": self.damage_events,
            "base": {"x": self.BASE_X, "y": self.BASE_Y, "radius": self.SAFE_ZONE_RADIUS},
            "portal": {"x": self.PORTAL_ALFA_X, "y": self.PORTAL_ALFA_Y, "radius": self.PORTAL_RADIUS}
        }

    # --- PARTY METHODS ---
    def create_party(self, client_id):
        if client_id not in self.players: return
        p = self.players[client_id]
        if p.get("party_id"): return
        
        party_id = f"party_{str(random.random())[2:8]}"
        self.parties[party_id] = {
            "id": party_id,
            "leader": client_id,
            "members": [client_id],
            "member_data": {client_id: {"name": p.get("user_id", "Piloto")}}
        }
        p["party_id"] = party_id
        return party_id

    def invite_to_party(self, leader_id, guest_id):
        if leader_id not in self.players or guest_id not in self.players: return
        p_leader = self.players[leader_id]
        if not p_leader.get("party_id"):
            self.create_party(leader_id)
        
        party_id = p_leader["party_id"]
        if guest_id not in self.party_invites:
            self.party_invites[guest_id] = {}
        
        self.party_invites[guest_id][leader_id] = {
            "party_id": party_id,
            "leader_name": p_leader.get("user_id", "Líder"),
            "time": time.time()
        }

    def join_party(self, client_id, party_id):
        if client_id not in self.players: return
        p = self.players[client_id]
        if p.get("party_id"): return
        if party_id not in self.parties: return
        
        party = self.parties[party_id]
        if len(party["members"]) >= 8: return # Max limit
        
        party["members"].append(client_id)
        party["member_data"][client_id] = {"name": p.get("user_id", "Piloto")}
        p["party_id"] = party_id
        
        # Clean up invites for this player
        if client_id in self.party_invites:
            del self.party_invites[client_id]

    def reject_party(self, client_id, leader_id):
        if client_id in self.party_invites and leader_id in self.party_invites[client_id]:
            del self.party_invites[client_id][leader_id]
            if not self.party_invites[client_id]:
                del self.party_invites[client_id]

    def leave_party(self, client_id):
        if client_id not in self.players: return
        p = self.players[client_id]
        party_id = p.get("party_id")
        if not party_id or party_id not in self.parties: return
        
        party = self.parties[party_id]
        party["members"].remove(client_id)
        if client_id in party["member_data"]:
            del party["member_data"][client_id]
        p["party_id"] = None
        
        if not party["members"]:
            del self.parties[party_id]
        elif party["leader"] == client_id:
            party["leader"] = party["members"][0]
