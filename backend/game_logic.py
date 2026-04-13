import math
import random
import time
from database import sync_user_stats

class GameState:
    def __init__(self):
        self.clients = {} # client_id: websocket
        self.players = {}
        self.enemies = []
        self.projectiles = []
        self.loot_boxes = []
        self.last_alien_spawn = time.time()
        self.alien_spawn_rate = 0.5 
        self.max_enemies = 1000 
        self.kill_events = [] 
        self.loot_events = [] 
        self.damage_events = []
        self.destruction_events = []
        self.last_special_spawn = time.time()
        self.special_spawn_rate = 30.0 # Más constante: cada 30 segundos
        
        # --- BASE Y ZONA SEGURA ---
        self.BASE_X = 1750
        self.BASE_Y = 1150
        self.SAFE_ZONE_RADIUS = 350
        
        self.GAME_WIDTH = 20000
        self.GAME_HEIGHT = 16000
        
        # --- PORTALES Y MAPAS (SISTEMA DINÁMICO) ---
        self.PORTAL_RADIUS = 150
        self.PORTAL_SAFE_ZONE_RADIUS = 350
        
        # Coordenadas Estándar para Portales (Esquinas Diagonales)
        # Portal A: Superior Izquierda (Entrada/Retorno)
        # Portal B: Inferior Derecha (Avance)
        PA_X, PA_Y = 500, 500
        PB_X, PB_Y = 19500, 15500

        self.MAPS = {
            # --- FACCIÓN MARS (Mapa Inicial: Sector de Hierro) ---
            "mars_1": {
                "name": "Sector de Hierro", "level": 1, "style": "mars",
                "portals": [
                    {"x": 18716, "y": 14834, "target": "mars_2",   "tx": 1532 + 220, "ty": 1066 + 220, "label": "Cañón del Óxido"}
                ],
                "station": {"x": 1750, "y": 1150} # Base de Inicio
            },
            "mars_2": {
                "name": "Cañón del Óxido", "level": 2, "style": "mars",
                "portals": [
                    {"x": 1532, "y": 1066, "target": "mars_1", "tx": 18716 - 220, "ty": 14834 - 220, "label": "Sector de Hierro"},
                    {"x": 18849, "y": 14995, "target": "mars_3", "tx": 1351 + 220, "ty": 900 + 220, "label": "Fundición Ares"}
                ]
            },
            "mars_3": {
                "name": "Fundición Ares", "level": 3, "style": "mars",
                "portals": [
                    {"x": 1351, "y": 900, "target": "mars_2", "tx": 18849 - 220, "ty": 14995 - 220, "label": "Cañón del Óxido"},
                    {"x": PB_X, "y": PB_Y, "target": "mars_4", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Valles de Magma"}
                ]
            },
            "mars_4": {
                "name": "Valles de Magma", "level": 4, "style": "mars_hazard",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "mars_3", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Fundición Ares"},
                    {"x": PB_X, "y": PB_Y, "target": "mars_5", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Base Dust-Storm"}
                ]
            },
            "mars_5": {
                "name": "Base Dust-Storm", "level": 5, "style": "mars_storm",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "mars_4", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Valles de Magma"},
                    {"x": PB_X, "y": PB_Y, "target": "mars_6", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Cantera Olympus"}
                ]
            },
            "mars_6": {
                "name": "Cantera Olympus", "level": 6, "style": "mars",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "mars_5", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Base Dust-Storm"},
                    {"x": PB_X, "y": PB_Y, "target": "mars_7", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Puesto Phobos"}
                ]
            },
            "mars_7": {
                "name": "Puesto de Avanzada Phobos", "level": 7, "style": "mars",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "mars_6", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Cantera Olympus"},
                    {"x": PB_X, "y": PB_Y, "target": "mars_8", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Plataforma Asedio"}
                ]
            },
            "mars_8": {
                "name": "Plataforma de Asedio", "level": 8, "style": "mars_industrial",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "mars_7", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Puesto Phobos"}
                ],
                "station": {"x": PB_X, "y": PB_Y} # Nueva estación en el punto celeste
            },
            # --- FACCIÓN MOON (Mapa Inicial: Bahía de Selene) ---
            "moon_1": {
                "name": "Bahía de Selene", "level": 1, "style": "moon",
                "portals": [
                    {"x": PB_X, "y": PB_Y, "target": "moon_2",   "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Cráter de Cristal"},
                    {"x": 1000, "y": 1000, "target": "pluto_1",  "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Abismo de Caronte"}
                ],
                "station": {"x": 1750, "y": 1150} # Base de Inicio (Luna)
            },
            "moon_2": {
                "name": "Cráter de Cristal", "level": 2, "style": "moon_crystal",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_1", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Bahía de Selene"},
                    {"x": PB_X, "y": PB_Y, "target": "moon_3", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Estación Zenit"}
                ]
            },
            "moon_3": {
                "name": "Estación de Relevo Zenit", "level": 3, "style": "moon_tech",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_2", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Cráter de Cristal"},
                    {"x": PB_X, "y": PB_Y, "target": "moon_4", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Mar de la Tranquilidad"}
                ]
            },
            "moon_4": {
                "name": "Mar de la Tranquilidad", "level": 4, "style": "moon_minimal",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_3", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Estación Zenit"},
                    {"x": PB_X, "y": PB_Y, "target": "moon_5", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Observatorio L-1"}
                ]
            },
            "moon_5": {
                "name": "Observatorio L-1", "level": 5, "style": "moon_space",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_4", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Mar de la Tranquilidad"},
                    {"x": PB_X, "y": PB_Y, "target": "moon_6", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Domos de Biodiversidad"}
                ]
            },
            "moon_6": {
                "name": "Domos de Biodiversidad", "level": 6, "style": "moon_biodome",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_5", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Observatorio L-1"},
                    {"x": PB_X, "y": PB_Y, "target": "moon_7", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Refinería Helio-3"}
                ]
            },
            "moon_7": {
                "name": "Refinería de Helio-3", "level": 7, "style": "moon_industrial",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_6", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Domos de Biodiversidad"},
                    {"x": PB_X, "y": PB_Y, "target": "moon_8", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Anillo de Plata"}
                ]
            },
            "moon_8": {
                "name": "Anillo de Plata", "level": 8, "style": "moon_racing",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_7", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Refinería Helio-3"}
                ],
                "station": {"x": PB_X, "y": PB_Y} # Avanzada de la Luna
            },
            # --- FACCIÓN PLUTO (Mapa Inicial: Abismo de Caronte) ---
            "pluto_1": {
                "name": "Abismo de Caronte", "level": 1, "style": "pluto",
                "portals": [
                    {"x": PB_X, "y": PB_Y, "target": "pluto_2",  "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Glaciar Eterno"},
                    {"x": 1000, "y": 1000, "target": "moon_1",   "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Bahía de Selene"}
                ],
                "station": {"x": 1750, "y": 1150} # Base de Inicio (Plutón)
            },
            "pluto_2": {
                "name": "Glaciar Eterno", "level": 2, "style": "pluto_ice",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "pluto_1", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Abismo Caronte"},
                    {"x": PB_X, "y": PB_Y, "target": "pluto_3", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Nébula Cobalto"}
                ]
            },
            "pluto_3": {
                "name": "Nébula de Cobalto", "level": 3, "style": "pluto_nebula",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "pluto_2", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Glaciar Eterno"},
                    {"x": PB_X, "y": PB_Y, "target": "pluto_4", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Punta Horizonte"}
                ]
            },
            "pluto_4": {
                "name": "Punta del Horizonte", "level": 4, "style": "pluto_void",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "pluto_3", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Nébula Cobalto"},
                    {"x": PB_X, "y": PB_Y, "target": "pluto_5", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Cripta Escarcha"}
                ]
            },
            "pluto_5": {
                "name": "Cripta de Escarcha", "level": 5, "style": "pluto_ancient",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "pluto_4", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Punta Horizonte"},
                    {"x": PB_X, "y": PB_Y, "target": "pluto_6", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Vórtice Sombrío"}
                ]
            },
            "pluto_6": {
                "name": "Vórtice Sombrío", "level": 6, "style": "pluto_vortex",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "pluto_5", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Cripta Escarcha"},
                    {"x": PB_X, "y": PB_Y, "target": "pluto_7", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Estación Exilio"}
                ]
            },
            "pluto_7": {
                "name": "Estación Exilio", "level": 7, "style": "pluto_prison",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "pluto_6", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Vórtice Sombrío"},
                    {"x": PB_X, "y": PB_Y, "target": "pluto_8", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Resplandor Hielo"}
                ]
            },
            "pluto_8": {
                "name": "Resplandor de Hielo", "level": 8, "style": "pluto_glow",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "pluto_7", "tx": PB_X - 220, "ty": PB_Y - 220, "label": "Estación Exilio"}
                ],
                "station": {"x": PB_X, "y": PB_Y} # Avanzada de Plutón
            }
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

    def add_player(self, client_id, websocket, ship_type="tank", initial_level=1, initial_xp=0, initial_credits=2000, initial_paladio=0, initial_minerals=None, initial_upgrades=None, initial_modules=None, initial_ammo=None, user_id=None, faction="MARS", clan_tag=None):
        self.clients[client_id] = websocket
        
        # Stats and Slot profiles
        profiles = {
            "starter": {
                "hp": 60, "shld": 30, "atk": 40, "spd": 120, "color": "#ffffff",
                "slots": {"lasers": 1, "shields": 1, "engines": 1, "utility": 1},
                "cargo_capacity": 100
            },
            "tank": {
                "hp": 180, "shld": 150, "atk": 70, "spd": 60, "color": "#ffb300",
                "slots": {"lasers": 2, "shields": 6, "engines": 3, "utility": 2},
                "cargo_capacity": 1500
            },
            "fast": {
                "hp": 80, "shld": 50, "atk": 110, "spd": 180, "color": "#00ccff",
                "slots": {"lasers": 3, "shields": 2, "engines": 7, "utility": 2},
                "cargo_capacity": 500
            },
            "stealth": {
                "hp": 90, "shld": 80, "atk": 130, "spd": 140, "color": "#9933ff",
                "slots": {"lasers": 5, "shields": 3, "engines": 4, "utility": 3},
                "cargo_capacity": 800
            },
            "heavy": {
                "hp": 160, "shld": 120, "atk": 180, "spd": 50, "color": "#ff3333",
                "slots": {"lasers": 8, "shields": 4, "engines": 2, "utility": 1},
                "cargo_capacity": 1200
            },
            "support": {
                "hp": 110, "shld": 100, "atk": 60, "spd": 100, "color": "#33ff99",
                "slots": {"lasers": 2, "shields": 3, "engines": 4, "utility": 6},
                "cargo_capacity": 2500
            }
        }
        
        prof = profiles.get(ship_type, profiles["starter"])
        
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
            "x": 1600, # Posición inicial segura
            "y": 1050,
            "target_x": None,
            "target_y": None,
            "score": 0,
            "credits": initial_credits, 
            "last_shot": 0,
            "fire_rate": 0.20, # Velocidad de ataque reducida (antes 0.12)
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
            "minerals": initial_minerals if (initial_minerals and isinstance(initial_minerals, dict)) else {"titanium": 0, "plutonium": 0, "silicon": 0},
            "max_cargo": prof.get("cargo_capacity", 1500), # Capacidad aumentada significativamente
            "current_map": "pluto_1" if faction == "PLUTO" else ("moon_1" if faction == "MOON" else "mars_1"),
            "paladio": initial_paladio,
            "faction": faction, # Mars, Moon, Pluto
            "clan_tag": clan_tag  # User created clan (e.g. [ABC])
        }

        # Guardar estadísticas base para recálculos
        player["base_atk"] = prof["atk"]
        player["base_spd"] = prof["spd"]
        player["base_max_shld"] = prof["shld"]
        player["base_max_hp"] = prof["hp"]

        # Procesar mejoras iniciales (pueden ser formato nuevo o viejo)
        raw_upg = initial_upgrades if (initial_upgrades and isinstance(initial_upgrades, dict)) else {}
        player["timed_upgrades"] = {
            "atk": raw_upg.get("atk", []) if isinstance(raw_upg.get("atk"), list) else [],
            "shld": raw_upg.get("shld", []) if isinstance(raw_upg.get("shld"), list) else [],
            "spd": raw_upg.get("spd", []) if isinstance(raw_upg.get("spd"), list) else []
        }

        # Convertir formato viejo si es necesario (retrocompatibilidad por si acaso)
        if isinstance(raw_upg.get("atk"), (int, float)) and raw_upg["atk"] > 0:
            player["timed_upgrades"]["atk"].append({"amount": raw_upg["atk"], "expires": time.time() + 7200})
        if isinstance(raw_upg.get("shld"), (int, float)) and raw_upg["shld"] > 0:
            player["timed_upgrades"]["shld"].append({"amount": raw_upg["shld"], "expires": time.time() + 7200})
        if isinstance(raw_upg.get("spd"), (int, float)) and raw_upg["spd"] > 0:
            player["timed_upgrades"]["spd"].append({"amount": raw_upg["spd"], "expires": time.time() + 7200})

        # Primera actualización de stats
        self.recalculate_player_stats(player)
 
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
            player["current_map"] = saved.get("current_map", "pluto_1" if faction == "PLUTO" else ("moon_1" if faction == "MOON" else "mars_1"))
            
            # Use provided faction/clan if they are fresh, else use saved
            player["faction"] = faction
            player["clan_tag"] = clan_tag
            
            # Sincronización inteligente de Monedas:
            # Si el frontend envía menos créditos/paladio que los guardados, 
            # asumimos que acaba de comprar algo en la tienda (offline) y usamos el valor del frontend.
            if initial_credits < saved.get("credits", initial_credits):
                player["credits"] = initial_credits
            else:
                player["credits"] = saved.get("credits", initial_credits)
            
            if initial_paladio < saved.get("paladio", initial_paladio):
                player["paladio"] = initial_paladio
            else:
                player["paladio"] = saved.get("paladio", initial_paladio)
            
            # Restaurar XP/Nivel si existen (Preferimos el backend si no hay discrepancia masiva)
            player["xp"] = saved.get("xp", initial_xp)
            player["level"] = saved.get("level", initial_level)
            
            print(f"Restaurando Sesión para {user_id}: Map={player['current_map']}, Credits={player['credits']}, Paladio={player['paladio']}")
        else:
            # Si no hay persistencia en memoria del servidor, usamos los valores iniciales del cliente
            player["credits"] = initial_credits
            player["paladio"] = initial_paladio
            print(f"Nueva sesión (o servidor reiniciado) para {user_id}: Usando valores del cliente ({initial_credits} C, {initial_paladio} U).")
        
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
                    "current_map": player.get("current_map", "pluto_1" if player.get("clan") == "PLUTO" else ("moon_1" if player.get("clan") == "MOON" else "mars_1")),
                    "paladio": player.get("paladio", 0),
                    "credits": player.get("credits", 0),
                    "xp": player.get("xp", 0),
                    "level": player.get("level", 1),
                    "ammo": player.get("ammo", {}).copy(),
                    "missiles": player.get("missiles", {}).copy(),
                    "minerals": player.get("minerals", {}).copy(),
                    "last_save": time.time()
                }
                print(f"Guardando persistencia para {user_id}: Credits={player['credits']}, Map={player['current_map']}")
                # Persistencia en BD real
                sync_user_stats(user_id, player["level"], player["xp"], player["credits"], player.get("paladio", 0))
                
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
        
        # Sincronización de destino de mouse persistente
        if "target_x" in keys: player["target_x"] = keys["target_x"]
        if "target_y" in keys: player["target_y"] = keys["target_y"]
        
        # Usar los valores persistentes del objeto player para la navegación
        nav_x = player.get("target_x")
        nav_y = player.get("target_y")

        # PERSISTENCIA MEJORADA: Solo actualizar si la clave está presente
        if "locked_target_id" in keys:
            player["locked_target_id"] = keys["locked_target_id"]
        
        locked_id = player.get("locked_target_id")
        MAX_COMBAT_RANGE = 700
        player["in_range"] = True
        target_enemy = None

        if locked_id:
            # Si hay un objetivo fijado, buscarlo (EN EL MISMO MAPA)
            target_enemy = next((e for e in self.enemies if e["id"] == locked_id and e.get("map_id") == player["current_map"]), None)
            if target_enemy:
                # Calcular distancia al objetivo
                dist = math.hypot(target_enemy["x"] - player["x"], target_enemy["y"] - player["y"])
                if dist > MAX_COMBAT_RANGE:
                    player["in_range"] = False
            else:
                # El objetivo murió o desapareció
                player["locked_target_id"] = None
        
        # Shooting Toggle / Logic
        is_shooting = keys.get("shoot", False)
        
        # El disparo automático solo persiste si hay un objetivo y está en rango
        player["shoot_active"] = is_shooting
        
        # BLOQUEO: No disparar si no hay un objetivo seleccionado
        if not locked_id:
            player["shoot_active"] = False
        
        # Override: si el target murió o está FUERA DE RANGO, obligar a que shoot_active sea False
        if locked_id:
            target_exists = next((e for e in self.enemies if e["id"] == locked_id and e.get("map_id") == player["current_map"]), None)
            if not target_exists or not player.get("in_range", True):
                player["shoot_active"] = False

        # --- LÓGICA DE ORIENTACIÓN (HEADING) ---
        new_heading = None

        # Prioridad 1: Mirar al Objetivo si disparo activamente (SOLO SI HAY TARGET Y ESTÁ EN RANGO)
        # IMPORTANTE: Usar el estado de disparo actualizado para este frame (Sincronización Crítica)
        if player.get("shoot_active") and target_enemy:
            dx = target_enemy["x"] - player["x"]
            dy = target_enemy["y"] - player["y"]
            new_heading = math.atan2(dy, dx)
        
        # Prioridad 2: Mirar hacia donde me muevo (Mouse o WASD)
        elif nav_x is not None and nav_y is not None:
            dx = nav_x - player["x"]
            dy = nav_y - player["y"]
            if dx*dx + dy*dy > 25:
                new_heading = math.atan2(dy, dx)
            else:
                # Llegamos al destino: limpiar navegación
                player["target_x"] = None
                player["target_y"] = None
        
        if new_heading is not None:
            player["heading"] = new_heading

        # Movement Calculation
        vx = 0
        vy = 0
        speed = player["spd"] * 3.5
        if player["powerup"] == "speed":
            speed *= 1.5

        if nav_x is not None and nav_y is not None:
            # Mouse point-and-click movement
            dx = nav_x - player["x"]
            dy = nav_y - player["y"]
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist > 5.0: # Threshold to stop exactly at target
                vx = (dx / dist) * speed
                vy = (dy / dist) * speed
            else:
                vx = 0
                vy = 0
                player["target_x"] = None
                player["target_y"] = None
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
                # Prioridad sobre el mouse si estamos usando teclas, pero cede si disparamos a un target
                if not (player.get("shoot_active") and player.get("locked_target_id")):
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
                # Determinar dirección del misil: al objetivo o al frente (SOLO SI EL OBJETIVO ESTÁ EN EL MISMO MAPA)
                locked_id = player.get("locked_target_id")
                target_enemy = next((e for e in self.enemies if e["id"] == locked_id and e.get("map_id") == player["current_map"]), None) if locked_id else None
                
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
                    "target_id": locked_id, # Guardar el ID del objetivo para el homing
                    "speed": conf["spd"],    # Mantener velocidad constante
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
                if len(self.enemies) >= self.max_enemies: break
                
                map_enemies_count = len([e for e in self.enemies if e.get("map_id") == map_id])
                # Límite bajado a 35 por mapa por petición del usuario
                if map_enemies_count < 35: 
                    # Spawnear hasta 3 aliens si el mapa está muy vacío, o 1 si ya tiene población
                    num_to_spawn = 3 if map_enemies_count < 15 else 1
                    for _ in range(num_to_spawn):
                        if len(self.enemies) < self.max_enemies:
                            self.spawn_alien(map_id)
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
            if p["hp"] <= 0:
                if not p.get("is_dead"):
                    p["is_dead"] = True
                    p["vx"] = 0
                    p["vy"] = 0
                    self.destruction_events.append({
                        "id": f"death_{pid}_{random.random()}",
                        "x": p["x"], "y": p["y"],
                        "type": "ship_explosion",
                        "time": now,
                        "owner_id": pid
                    })
                continue
            
            # Si el jugador estaba muerto (reparado), reseter flag
            if p.get("is_dead"): p["is_dead"] = False

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

            # --- GESTIÓN DE MEJORAS TEMPORALES (2 HORAS) ---
            upg_changed = False
            for stat in ["atk", "shld", "spd"]:
                current_list = p["timed_upgrades"].get(stat, [])
                # expires está en ms desde el frontend, convertir a s para time.time() o viceversa
                # El frontend envía Date.now() que es ms.
                # time.time() es segundos.
                active = [u for u in current_list if (u["expires"] / 1000.0) > now]
                if len(active) != len(current_list):
                    p["timed_upgrades"][stat] = active
                    upg_changed = True
            
            if upg_changed:
                self.recalculate_player_stats(p)
                
            # --- DETECCIÓN DE ZONA SEGURA (BASE Y PORTAL) ---
            # Localizar portales y estación del mapa actual
            map_cfg = self.MAPS.get(p["current_map"], {})
            
            in_base_safety = False
            if "station" in map_cfg:
                st = map_cfg["station"]
                dist_to_base = math.hypot(p["x"] - st["x"], p["y"] - st["y"])
                in_base_safety = dist_to_base < self.SAFE_ZONE_RADIUS
            
            # Localizar portales del mapa actual
            map_cfg = self.MAPS.get(p["current_map"], {})
            in_portal_safety = False
            for portal in map_cfg.get("portals", []):
                dist_to_portal = math.hypot(p["x"] - portal["x"], p["y"] - portal["y"])
                if dist_to_portal < self.PORTAL_SAFE_ZONE_RADIUS:
                    in_portal_safety = True
                    break
            
            p["in_safe_zone"] = in_base_safety or in_portal_safety

            # --- DAÑO AMBIENTAL DESACTIVADO (Lava eliminada por feedback de visibilidad) ---
            # if map_cfg.get("style") == "mars_hazard" and not p["in_safe_zone"]:
            #     if random.random() < 0.1:
            #         dmg = 10 * (map_cfg.get("level", 1) / 2)
            #         p["last_dmg_time"] = now
            #         if p["shld"] >= dmg:
            #             p["shld"] -= dmg
            #         else:
            #             rem = dmg - p["shld"]
            #             p["shld"] = 0
            #             p["hp"] -= rem
            #         self.damage_events.append({
            #             "id": f"lava_{random.random()}",
            #             "x": p["x"] + random.randint(-20, 20),
            #             "y": p["y"] + random.randint(-20, 20),
            #             "amount": int(dmg), "time": now, "owner_id": pid
            #         })
                
            if p.get("locked_target_id"):
                target_exists = any(en["id"] == p["locked_target_id"] for en in self.enemies)
                if not target_exists:
                    p["locked_target_id"] = None
                    p["shoot_active"] = False # Detener disparo al morir el blanco


        # 3. Update Projectiles
        for proj in self.projectiles:
            # --- LÓGICA DE MISILES TELEDIRIGIDOS (HOMING) ---
            if proj.get("is_missile") and proj.get("target_id"):
                target = next((e for e in self.enemies if e["id"] == proj["target_id"] and e.get("map_id") == proj.get("map_id")), None)
                if target and target.get("hp", 0) > 0:
                    dx = target["x"] - proj["x"]
                    dy = target["y"] - proj["y"]
                    dist = math.hypot(dx, dy)
                    if dist > 5:
                        target_angle = math.atan2(dy, dx)
                        current_angle = math.atan2(proj["vy"], proj["vx"])
                        # Ángulo relativo normalizado
                        diff = (target_angle - current_angle + math.pi) % (2 * math.pi) - math.pi
                        # Velocidad de giro: 4.5 radianes por segundo para misiles ágiles
                        turn_rate = 4.5 * dt 
                        new_angle = current_angle + max(-turn_rate, min(turn_rate, diff))
                        
                        speed = proj.get("speed", 500)
                        proj["vx"] = math.cos(new_angle) * speed
                        proj["vy"] = math.sin(new_angle) * speed

            proj["x"] += proj["vx"] * dt
            proj["y"] += proj["vy"] * dt
            proj["life"] -= dt
            
        self.projectiles = [p for p in self.projectiles if p["life"] > 0]
        
        # 4. Update Enemies (AI: Hunter vs Passive)
        DETECTION_RANGE = 600
        for enemy in self.enemies:
            ai_type = enemy.get("ai_type", "passive")
            m_id = enemy.get("map_id")
            
            target_player = None
            if ai_type == "hunter":
                # Si ya tiene target, verificar que siga en el mapa, vivo y FUERA de zona segura
                if enemy["aggro_target"] and enemy["aggro_target"] in self.players:
                    p = self.players[enemy["aggro_target"]]
                    if p["current_map"] == m_id and p["hp"] > 0 and not p.get("in_safe_zone", False):
                        target_player = p
                    else:
                        enemy["aggro_target"] = None # Perder rastro si entra a base o muere
                
                # Si no hay target o lo perdió, buscar el más cercano
                if not target_player:
                    min_dist = DETECTION_RANGE
                    for pid, p in self.players.items():
                        if p["current_map"] == m_id and p["hp"] > 0 and not p.get("in_safe_zone", False):
                            d = math.hypot(enemy["x"] - p["x"], enemy["y"] - p["y"])
                            if d < min_dist:
                                min_dist = d
                                target_player = p
                                enemy["aggro_target"] = pid

            # Lógica de Movimiento
            if target_player:
                dx = target_player["x"] - enemy["x"]
                dy = target_player["y"] - enemy["y"]
                dist = math.hypot(dx, dy)
                
                if dist > 50: # Mantener una pequeña distancia
                    enemy["vx"] = (dx / dist) * 120 # Velocidad de persecución
                    enemy["vy"] = (dy / dist) * 120
                else:
                    enemy["vx"], enemy["vy"] = 0, 0

                # Lógica de Ataque (Disparo) - Cada usuario se denomina enemigo de los aliens
                map_lvl = self.MAPS.get(m_id, {}).get("level", 1)
                shot_cooldown = max(0.4, 1.8 - (map_lvl * 0.15)) # Más rápidos en mapas altos
                
                if dist < 500 and now - enemy.get("last_shot", 0) > shot_cooldown:
                    angle = math.atan2(dy, dx)
                    p_speed = 400 + (map_lvl * 40) # Balas más rápidas en mapas altos
                    self.projectiles.append({
                        "id": "alien_laser_" + str(random.random()),
                        "owner_id": enemy["id"],
                        "is_player": False,
                        "x": enemy["x"],
                        "y": enemy["y"],
                        "vx": math.cos(angle) * p_speed,
                        "vy": math.sin(angle) * p_speed,
                        "damage": enemy.get("atk", 15),
                        "life": 1.5,
                        "map_id": m_id,
                        "color": "#ff3333" # Rojo para aliens
                    })
                    enemy["last_shot"] = now
            
            # Actualización de posición final para TODOS los tipos de movimiento
            enemy["x"] += enemy["vx"] * dt
            enemy["y"] += enemy["vy"] * dt
            
            # Si salen de los límites del mapa, reaparecen
            if (enemy["y"] > self.GAME_HEIGHT + 100 or enemy["y"] < -100 or
                enemy["x"] > self.GAME_WIDTH + 100 or enemy["x"] < -100):
                enemy["y"] = -50 
                enemy["x"] = random.randint(50, self.GAME_WIDTH - 50)
                enemy["vx"] = random.uniform(-50, 50)
                enemy["vy"] = random.uniform(50, 150)
        
        # Limpiar eventos antiguos (2.5 segundos)
        self.kill_events = [e for e in self.kill_events if now - e["time"] < 2.5]
        self.loot_events = [e for e in self.loot_events if now - e["time"] < 2.5]
        self.damage_events = [e for e in self.damage_events if now - e["time"] < 1.0] # Daño dura 1 seg
        self.destruction_events = [e for e in self.destruction_events if now - e["time"] < 2.0] # Explosión dura 2 seg
                
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
                    if p.get("map_id") != e.get("map_id"): continue
                    dist = math.hypot(p["x"] - e["x"], p["y"] - e["y"])
                    if dist < 20 or (p.get("is_missile") and dist < 45): # Radio colisión mayor para misiles
                        # Solo aplicar daño si NO es munición Sifón
                        if p.get("ammo_type") != "siphon":
                            # Aplicar Resistencia (Defense)
                            final_damage = p["damage"] * (1 - e.get("defense", 0))
                            e["hp"] -= final_damage
                            
                            # Retaliation: Si es un hunter, fijar como target al que le disparó
                            if e.get("ai_type") == "hunter":
                                e["aggro_target"] = p["owner_id"]

                            # Registrar evento de daño para el frontend
                            self.damage_events.append({
                                "id": str(random.random()),
                                "x": e["x"] + random.randint(-15, 15),
                                "y": e["y"] + random.randint(-15, 15),
                                "amount": int(final_damage), # Mostrar daño real (mitigado)
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
                                paladio_reward = e.get("level", 1) * (3 if e.get("is_hard") else 1)
                                player["paladio"] = player.get("paladio", 0) + paladio_reward
                                self.gain_xp(player, 100) # Award 100 XP per kill
                                
                                # Registrar evento de recompensa para el HUD
                                self.kill_events.append({
                                    "id": str(random.random()),
                                    "x": e["x"],
                                    "y": e["y"],
                                    "xp": 100,
                                    "credits": 250,
                                    "paladio": paladio_reward,
                                    "time": now,
                                    "owner_id": p["owner_id"]
                                })
                                
                                # Chance de recuperar un poco de munición térmica (5%)
                                if random.random() < 0.05:
                                    player["ammo"]["thermal"] += 5
                                    
                                # --- DROP GARANTIZADO DE CARGA DE MINERALES ---
                                self.loot_boxes.append({
                                    "id": str(random.random()),
                                    "x": e["x"],
                                    "y": e["y"],
                                    "type": "cargo",
                                    "minerals": {
                                        "titanium": random.randint(5, 12),
                                        "plutonium": random.randint(2, 6),
                                        "silicon": random.randint(1, 4)
                                    },
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
                                            paladio_shared = e.get("level", 1) * (3 if e.get("is_hard") else 1)
                                            m["credits"] += 250
                                            m["paladio"] = m.get("paladio", 0) + paladio_shared
                                            self.gain_xp(m, 100)
                                            # Evento visual para el compañero
                                            self.kill_events.append({
                                                "id": str(random.random()),
                                                "x": e["x"], "y": e["y"],
                                                "xp": 100, "credits": 250, "paladio": paladio_shared,
                                                "time": now, "owner_id": member_id, "is_party_share": True
                                            })
                        break
                # Check contra jugadores
                for pid, target in self.players.items():
                    if p["owner_id"] == pid: continue # No friendly fire
                    if target["hp"] <= 0: continue
                    if p.get("map_id") != target.get("current_map"): continue # FIX: Map check

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
                # PROYECTILES DE ALIENS -> JUGADORES
                for pid, target in self.players.items():
                    if target["hp"] <= 0 or target.get("in_safe_zone"): continue
                    if p.get("map_id") != target.get("current_map"): continue

                    dist = math.hypot(p["x"] - target["x"], p["y"] - target["y"])
                    if dist < 25: # Colisión un poco más generosa para aliens
                        damage = p["damage"]
                        target["last_dmg_time"] = now
                        if target["shld"] >= damage:
                            target["shld"] -= damage
                        else:
                            rem = damage - target["shld"]
                            target["shld"] = 0
                            target["hp"] -= rem
                        
                        # Registrar evento de daño recibido por el jugador
                        self.damage_events.append({
                            "id": f"alien_hit_{pid}_{random.random()}",
                            "x": target["x"] + random.randint(-15, 15),
                            "y": target["y"] + random.randint(-15, 15),
                            "amount": int(damage),
                            "time": now,
                            "owner_id": pid, 
                            "color": "#ff4444" 
                        })
                        hit = True
                        break
                
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
                if box.get("map_id") != player.get("current_map"): continue # FIX: Map check
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
                        # (Legacy) Caja de un solo mineral
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
                            # Si no se llevó todo, la caja se queda con el resto
                            if can_take < box["amount"]:
                                box["amount"] -= can_take
                                taken = False
                        else:
                            # Notificar bodega llena para cajas legacy
                            if not hasattr(self, "_last_full_warn"): self._last_full_warn = {}
                            if now - self._last_full_warn.get(pid, 0) > 2:
                                self.loot_events.append({
                                    "id": str(random.random()), "x": box["x"], "y": box["y"],
                                    "type": "cargo_full", "time": now, "owner_id": pid
                                })
                                self._last_full_warn[pid] = now
                            taken = False 
                    elif box["type"] == "cargo":
                        # Recoger múltiples minerales
                        minerals_dict = player.get("minerals", {})
                        # Asegurar que sea un dict
                        if not isinstance(minerals_dict, dict):
                            minerals_dict = {"titanium": 0, "plutonium": 0, "silicon": 0}
                            player["minerals"] = minerals_dict
                        
                        current_shared_cargo = sum(minerals_dict.values())
                        box_minerals = box.get("minerals", {})
                        
                        collected_info = {}
                        has_remaining = False
                        for m_type, amount in box_minerals.items():
                            if amount <= 0: continue
                            if current_shared_cargo < player["max_cargo"]:
                                can_take = min(amount, player["max_cargo"] - current_shared_cargo)
                                if can_take > 0:
                                    minerals_dict[m_type] += can_take
                                    current_shared_cargo += can_take
                                    collected_info[m_type] = can_take
                                    box_minerals[m_type] -= can_take # Restar de la caja
                                    if box_minerals[m_type] > 0:
                                        has_remaining = True
                                else:
                                    has_remaining = True
                            else:
                                has_remaining = True
                        
                        if collected_info:
                            self.loot_events.append({
                                "id": str(random.random()),
                                "x": box["x"], "y": box["y"],
                                "type": "cargo", "minerals": collected_info,
                                "time": now, "owner_id": pid
                            })
                            # Si quedan minerales en la caja, no la eliminamos
                            if has_remaining:
                                taken = False
                        else:
                            # Notificar bodega llena (Cooldown de 2 seg para no spamear eventos)
                            if not hasattr(self, "_last_full_warn"): self._last_full_warn = {}
                            if now - self._last_full_warn.get(pid, 0) > 2:
                                self.loot_events.append({
                                    "id": str(random.random()), "x": box["x"], "y": box["y"],
                                    "type": "cargo_full", "time": now, "owner_id": pid
                                })
                                self._last_full_warn[pid] = now
                            taken = False # Bodega llena
                    elif box["type"] == "special_coin":
                        # --- RECOMPENSA ALEATORIA PALADIO/CRÉDITOS/MUNICIÓN ---
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
                        elif rand < 0.65: # 25% Munición Láser
                            amt = random.randint(50, 150)
                            ammo_id = random.choice(["thermal", "plasma", "siphon"])
                            player["ammo"][ammo_id] += amt
                            self.loot_events.append({
                                "id": str(random.random()),
                                "x": box["x"], "y": box["y"],
                                "type": "ammo", "ammo_type": ammo_id, "amount": amt,
                                "time": now, "owner_id": pid
                            })
                        elif rand < 0.80: # 15% Munición Misiles
                            amt = random.randint(5, 15)
                            m_type = random.choice(["missile_1", "missile_2", "missile_3"])
                            if "missiles" not in player: player["missiles"] = {"missile_1": 0, "missile_2": 0, "missile_3": 0}
                            player["missiles"][m_type] += amt
                            self.loot_events.append({
                                "id": str(random.random()),
                                "x": box["x"], "y": box["y"],
                                "type": "missile_loot", "missile_type": m_type, "amount": amt,
                                "time": now, "owner_id": pid
                            })
                        else: # 20% Paladio
                            amt = random.randint(2, 10)
                            player["paladio"] = player.get("paladio", 0) + amt
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
                # FIX: Solo colisionar si están en el mismo mapa
                if e.get("map_id") != p["current_map"]: continue
                
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
                    
                    # Registrar evento de daño para ambos (Jugador y Alien)
                    self.damage_events.append({
                        "id": f"col_p_{pid}_{random.random()}",
                        "x": p["x"] + random.randint(-10, 10),
                        "y": p["y"] + random.randint(-10, 10),
                        "amount": int(damage), "time": now, "owner_id": pid, "color": "#ff4444"
                    })
                    self.damage_events.append({
                        "id": f"col_e_{pid}_{random.random()}",
                        "x": e["x"] + random.randint(-10, 10),
                        "y": e["y"] + random.randint(-10, 10),
                        "amount": 50, "time": now, "owner_id": pid # Blanco por defecto
                    })
        self.enemies = [e for e in self.enemies if e["hp"] > 0]

    def spawn_alien(self, map_id="mars_1"):
        # Determinar nombre del alien según el mapa
        if map_id in ["mars_1", "moon_1", "pluto_1"]:
            alien_name = "Gryllos"
        elif map_id in ["mars_2", "moon_2", "pluto_2"]:
            alien_name = "Xylos"
        elif map_id in ["mars_3", "moon_3", "pluto_3"]:
            alien_name = "Nykor"
        elif map_id in ["mars_4", "moon_4", "pluto_4"]:
            alien_name = "Syrith"
        elif map_id in ["mars_5", "moon_5", "pluto_5"]:
            alien_name = "Vexis"
        elif map_id in ["mars_6", "moon_6", "pluto_6"]:
            alien_name = "Kragos"
        elif map_id in ["mars_7", "moon_7", "pluto_7"]:
            alien_name = "Zoltan"
        elif map_id in ["mars_8", "moon_8", "pluto_8"]:
            alien_name = "Drakon"
        else:
            alien_name = "Alien"

        # Escalamiento de dificultad basado en el nivel del mapa
        map_info = self.MAPS.get(map_id, {"level": 1})
        lvl = map_info["level"]
        level_mult = 1.0 + (lvl - 1) * 0.35 # +35% por nivel extra (más agresivo)
        
        # --- BUMPEO DE DIFICULTAD PARA NIVELES 5+ (PEDIDO POR EL USUARIO) ---
        # "Más vida y más resistencia"
        defense = 0
        if lvl >= 5:
            stats_boost = 1.0 + (lvl - 4) * 0.75 # Multiplicador extra de 1.75x a 4.0x
            level_mult *= stats_boost
            defense = min(0.45, (lvl - 4) * 0.12) # Resistencia (Reducción de daño hasta 45%)

        speed_mult = 1.0 + (lvl - 1) * 0.15 # Los aliens son más rápidos en niveles altos
        
        alien_id = str(random.random())
        # Más chance de aliens "Hard" a medida que sube el nivel del mapa
        is_hard = map_id not in ["mars_1", "moon_1", "pluto_1"] and random.random() < (0.20 + (lvl * 0.08))
        
        # Base stats
        base_hp = 120 * level_mult
        base_shld = 60 * level_mult
        base_atk = 18 * level_mult
        
        self.enemies.append({
            "id": alien_id,
            "name": alien_name,
            "x": random.randint(100, self.GAME_WIDTH - 100),
            "y": random.randint(100, self.GAME_HEIGHT - 100),
            "hp": int(base_hp * (2.8 if is_hard else 1.0)),
            "max_hp": int(base_hp * (2.8 if is_hard else 1.0)),
            "shield": int(base_shld * (3.5 if is_hard else 1.0)),
            "max_shield": int(base_shld * (3.5 if is_hard else 1.0)),
            "atk": int(base_atk * (2.2 if is_hard else 1.0)),
            "vx": random.uniform(-60, 60) * speed_mult,
            "vy": random.uniform(-60, 60) * speed_mult,
            "map_id": map_id,
            "level": lvl, # Guardar nivel para recompensas
            "defense": defense, # Resistencia porcentual
            "is_hard": is_hard,
            "ai_type": "hunter", # Todos los aliens son agresivos ahora (cazan al usuario enemigo)
            "aggro_target": None,
            "last_shot": 0
        })

    def spawn_special_chest(self, map_id="mars_1"):
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

    def recalculate_player_stats(self, player):
        """Recalcula las estadísticas finales sumando base + módulos + mejoras temporales."""
        # Reiniciar a base
        player["atk"] = player.get("base_atk", player.get("atk", 70))
        player["spd"] = player.get("base_spd", player.get("spd", 60))
        player["max_shld"] = player.get("base_max_shld", player.get("max_shld", 150))
        player["max_hp"] = player.get("base_max_hp", player.get("max_hp", 180))

        # 1. Sumar Módulos Equipados
        player["lasers"] = 0
        player["engines"] = 0
        player["shields"] = 0
        
        for mod in player.get("equipped", []):
            if "atk" in mod: player["atk"] += mod["atk"]
            if "shld" in mod: player["max_shld"] += mod["shld"]
            if "spd" in mod: player["spd"] += mod["spd"]
            if "hp" in mod: player["max_hp"] += mod["hp"]

            # Recount for visuals
            m_type = mod.get("type", "")
            if m_type == "lasers": player["lasers"] += 1
            if m_type == "engines": player["engines"] += 1
            if m_type == "shields": player["shields"] += 1

        # 2. Sumar Mejoras Temporales (Laboratorio)
        if "timed_upgrades" in player:
            for stat_key in ["atk", "shld", "spd"]:
                bonus_total = sum(u["amount"] for u in player["timed_upgrades"].get(stat_key, []))
                if stat_key == "shld":
                    player["max_shld"] += bonus_total
                else:
                    player[stat_key] += bonus_total

        # Ajustar valores actuales si el máximo bajó
        player["shld"] = min(player["shld"], player["max_shld"])
        player["hp"] = min(player["hp"], player["max_hp"])

    def buy_module(self, client_id, module_data, free=False):
        if client_id not in self.players:
            return
            
        player = self.players[client_id]
        cost = module_data.get("cost", 0)
        m_type = module_data.get("type", "") 
        
        if not free:
            if player["credits"] < cost: return
            if not player.get("in_safe_zone", False): return
            
        max_slots = player["slots"].get(m_type, 0)
        current_used = len([m for m in player["equipped"] if m["type"] == m_type])
        
        if current_used >= max_slots: return
            
        if not free:
            player["credits"] -= cost
        
        player["equipped"].append(module_data)
        self.recalculate_player_stats(player)

    def update_equipped_modules(self, client_id, modules):
        """Sincroniza el equipamiento completo en tiempo real (solo en zona segura)."""
        if client_id not in self.players: return
        player = self.players[client_id]
        
        # Solo permitir cambios de equipamiento en zona segura
        if not player.get("in_safe_zone", False):
            print(f"Intento de cambio de equipamiento fuera de zona segura para {client_id}")
            return
            
        player["equipped"] = modules if isinstance(modules, list) else []
        self.recalculate_player_stats(player)
        print(f"Equipamiento sincronizado para {client_id}: {len(player['equipped'])} módulos.")

    def update_resources(self, client_id, ammo_data):
        """Sincroniza munición y otros recursos en tiempo real."""
        if client_id not in self.players: return
        player = self.players[client_id]
        
        # Si llega un objeto 'ammo' plano (como el del frontend), lo procesamos
        # de forma inteligente separando láseres de misiles.
        raw_ammo = ammo_data.get("ammo", {})
        for k, v in raw_ammo.items():
            if k.startswith("missile_"):
                player["missiles"][k] = v
            else:
                player["ammo"][k] = v
        
        # Si por alguna razón llegan por separado
        if "missiles" in ammo_data:
            for k, v in ammo_data["missiles"].items():
                player["missiles"][k] = v
        
        print(f"Recursos sincronizados para {client_id}")

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
        map_info = self.MAPS.get(p["current_map"])
        if not map_info or "portals" not in map_info:
            return False
            
        # Revisar si colisiona con cualquier portal del mapa actual
        for portal in map_info["portals"]:
            dist = math.hypot(p["x"] - portal["x"], p["y"] - portal["y"])
            if dist < self.PORTAL_RADIUS:
                # Realizar el JUMP
                p["current_map"] = portal["target"]
                p["x"] = portal["tx"]
                p["y"] = portal["ty"]
                
                # Reset movement and target
                p["vx"] = 0
                p["vy"] = 0
                p["target_x"] = None
                p["target_y"] = None
                p["locked_target_id"] = None
                p["shoot_active"] = False
                p["last_jump_time"] = time.time()
                return True
        return False

    def get_state(self, client_id=None):
        # Si se proporciona client_id, devolvemos solo lo que le interesa a ese mapa
        players_list = list(self.players.values())
        
        if client_id and client_id in self.players:
            me = self.players[client_id]
            m_id = me["current_map"]
            map_info = self.MAPS.get(m_id, {"name": "Espacio", "level": 1})
            
            # Portales dinámicos según el mapa
            portals = map_info.get("portals", [])

            return {
                "players": [{**p, "is_self": p["id"] == client_id} for p in players_list if p["current_map"] == m_id],
                "enemies": [e for e in self.enemies if e.get("map_id") == m_id],
                "projectiles": [p for p in self.projectiles if p.get("map_id") == m_id],
                "loot_boxes": [b for b in self.loot_boxes if b.get("map_id") == m_id],
                "kill_events": [e for e in self.kill_events if e.get("owner_id") == client_id],
                "loot_events": [e for e in self.loot_events if e.get("owner_id") == client_id],
                "base": {"x": map_info["station"]["x"], "y": map_info["station"]["y"], "radius": self.SAFE_ZONE_RADIUS} if "station" in map_info else None,
                "portals": portals,
                "current_map_name": map_info["name"],
                "current_map_style": map_info.get("style", "space"),
                "map_width": self.GAME_WIDTH,
                "map_height": self.GAME_HEIGHT,
                "damage_events": [e for e in self.damage_events if e.get("owner_id") == client_id],
                "destruction_events": self.destruction_events,
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
            "base": {"x": self.BASE_X, "y": self.BASE_Y, "radius": self.SAFE_ZONE_RADIUS}
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
    def handle_chat(self, sender_id, text, channel="global"):
        if sender_id not in self.players:
            return
            
        sender = self.players[sender_id]
        sender_name = sender.get("user_id", "Desconocido")
        # Si tiene clan_tag, mostrarlo: [TAG] Nombre
        display_name = f"[{sender['clan_tag']}] {sender_name}" if sender.get("clan_tag") else sender_name
        
        chat_msg = {
            "type": "chat_update",
            "message": {
                "id": str(random.random()),
                "sender": sender_name,
                "display_name": display_name,
                "text": text,
                "channel": channel,
                "faction": sender["faction"],
                "time": time.time()
            }
        }
        
        # Broadcast logic
        import json
        msg_str = json.dumps(chat_msg)
        
        # Use a separate thread or non-blocking way if possible, 
        # but since we are in the main loop context, we use the websockets directly.
        for pid, ws in list(self.clients.items()):
            target_p = self.players.get(pid)
            if not target_p: continue
            
            should_send = False
            if channel == "global":
                should_send = True
            elif channel == "company" and target_p["faction"] == sender["faction"]:
                should_send = True
            elif channel == "clan" and sender.get("clan_tag") and target_p.get("clan_tag") == sender["clan_tag"]:
                should_send = True
                
            if should_send:
                try:
                    import asyncio
                    # Use the current event loop to schedule sending
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(ws.send_text(msg_str))
                except Exception as e:
                    print(f"Error sending chat: {e}")
