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
        self.alien_spawn_rate = 3.0 # Segundos
        
        self.GAME_WIDTH = 2000
        self.GAME_HEIGHT = 1500

    def add_player(self, client_id, websocket, ship_type="tank", initial_level=1, initial_xp=0, initial_credits=2000, initial_minerals=None, initial_upgrades=None, initial_modules=None, initial_ammo=None):
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
            "ship_type": ship_type,
            "x": self.GAME_WIDTH / 2,
            "y": self.GAME_HEIGHT / 2,
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
            "fire_rate": 0.25,
            "powerup": None,
            "powerup_time": 0,
            "heading": -1.57,
            "ammo": {"standard": 9999, "thermal": 0, "plasma": 0, "siphon": 0},
            "ammo_type": "standard",
            "level": initial_level,
            "xp": initial_xp,
            "xp_next": initial_level * 1000,
            "minerals": initial_minerals if initial_minerals else {"titanium": 0, "plutonium": 0, "silicon": 0},
            "max_cargo": prof.get("cargo_capacity", 50),
            "permanent_upgrades": initial_upgrades if initial_upgrades else {"atk": 0, "shld": 0, "spd": 0}
        }
        
        # Apply permanent upgrades to base stats
        upg = player["permanent_upgrades"]
        player["atk"] += upg.get("atk", 0)
        player["shld"] += upg.get("shld", 0)
        player["max_shld"] += upg.get("shld", 0)
        # Note: spd is used for calculations later, but we update the base here
        player["spd"] += upg.get("spd", 0)

        if initial_ammo:
            player["ammo"] = {**player["ammo"], **initial_ammo}
        
        self.players[client_id] = player

        # Apply initial modules if provided
        if initial_modules:
            for mod in initial_modules:
                self.buy_module(client_id, mod, free=True)

    def remove_player(self, client_id):
        if client_id in self.clients:
            del self.clients[client_id]
        if client_id in self.players:
            del self.players[client_id]

    def handle_input(self, client_id, keys):
        if client_id not in self.players:
            return
        player = self.players[client_id]
        if player["hp"] <= 0:
            return # Dead
            
        # Detect Heading (Mouse)
        mx = keys.get("mouseX")
        my = keys.get("mouseY")
        if mx is not None and my is not None:
            player["heading"] = math.atan2(my - player["y"], mx - player["x"])

        # Movement Target
        vx = 0
        vy = 0
        # Convert stat SPD (100) to pixel speed (350)
        speed = player["spd"] * 3.5
        if player["powerup"] == "speed":
            speed *= 1.5

        target_x = keys.get("target_x")
        target_y = keys.get("target_y")

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
            if vx != 0 and vy != 0:
                norm = math.sqrt(vx*vx + vy*vy)
                vx = (vx/norm) * speed
                vy = (vy/norm) * speed
            
        player["vx"] = vx
        player["vy"] = vy
        
        # Shooting
        now = time.time()
        fire_rate = player["fire_rate"]
        if player["powerup"] == "rapid_fire":
            fire_rate *= 0.4
            
        if keys.get("shoot") and (now - player["last_shot"] > fire_rate):
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
            
            # Consume Ammo (except standard)
            if ammo_type != "standard":
                if player["ammo"].get(ammo_type, 0) > 0:
                    player["ammo"][ammo_type] -= 1
                else:
                    player["ammo_type"] = "standard" # Revert
                    ammo_type = "standard"
                    config = ammo_config["standard"]

            actual_damage = player["atk"] * 0.25 * config["dmg"]
            
            # Disparar hacia el mouse (heading) en abanico según cantidad de láseres
            projectile_speed = 800
            base_heading = player.get("heading", -1.57)
            
            # Si tiene múltiples lásers, calcular spread angle
            num_lasers = player.get("lasers", 1)
            spread = 0.15 # Radianes entre proyectiles
            
            # Centrar el abanico
            start_angle = base_heading - (spread * (num_lasers - 1)) / 2
            
            for i in range(num_lasers):
                angle = start_angle + (spread * i)
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
                    "life": 1.5 # seconds
                })

    def update(self, dt):
        now = time.time()
        
        # 1. Spawn Enemies
        if now - self.last_alien_spawn > self.alien_spawn_rate:
            self.last_alien_spawn = now
            self.spawn_alien()
            
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
            
            # Si salen por abajo reaparecen arriba
            if enemy["y"] > self.GAME_HEIGHT + 50:
                enemy["y"] = -50
                enemy["x"] = random.randint(50, self.GAME_WIDTH - 50)
                
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
                    if dist < 20: # Radio colisión
                        # Solo aplicar daño si NO es munición Sifón
                        if p.get("ammo_type") != "siphon":
                            e["hp"] -= p["damage"]
                        
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
                                    "spawn_time": now
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
                                    "spawn_time": now
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
                    elif box["type"] == "mineral":
                        # Verificar espacio en bodega
                        current_cargo = sum(player["minerals"].values())
                        can_take = min(box["amount"], player["max_cargo"] - current_cargo)
                        if can_take > 0:
                            m_type = box["mineral_type"]
                            player["minerals"][m_type] += can_take
                        else:
                            taken = False # No pudo recoger nada porque está lleno
                    else:
                        player["powerup"] = box["type"]
                        player["powerup_time"] = now + 10.0 # dura 10 segundos
                    break
            
            if not taken:
                alive_boxes.append(box)
                
        self.loot_boxes = alive_boxes
        
        # Aliens vs Jugadores (Daño por contacto)
        for e in self.enemies:
            for pid, p in self.players.items():
                if p["hp"] <= 0: continue
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

    def spawn_alien(self):
        self.enemies.append({
            "id": str(random.random()),
            "x": random.randint(50, self.GAME_WIDTH - 50),
            "y": -50,
            "vx": random.uniform(-50, 50),
            "vy": random.uniform(50, 150),
            "hp": 50,
            "max_hp": 50,
            "shield": 30,
            "max_shield": 30
        })

    def buy_module(self, client_id, module_data, free=False):
        if client_id not in self.players:
            return
            
        player = self.players[client_id]
        cost = module_data.get("cost", 0)
        m_type = module_data.get("type", "") # lasers, shields, engines, utility
        
        # Check credits (unless it's free/initial)
        if not free and player["credits"] < cost:
            return # Not enough money
            
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
            if ammo_id == "standard" or player["ammo"].get(ammo_id, 0) > 0:
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


    def get_state(self):
        return {
            "players": list(self.players.values()),
            "enemies": self.enemies,
            "projectiles": self.projectiles,
            "loot_boxes": self.loot_boxes
        }
