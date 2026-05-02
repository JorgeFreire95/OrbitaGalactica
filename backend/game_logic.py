import math
import random
import time
from database import sync_user_stats, get_missions_db, update_mission_progress_db, claim_mission_reward_db

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
        self.mission_events = []
        self.destruction_events = []
        self.beacons = [] # client_id: {id, x, y, type, radius, power, expiry, map_id, owner_id}
        self.last_beacon_update = time.time()
        self.last_special_spawn = time.time()
        self.special_spawn_rate = 30.0 # Más constante: cada 30 segundos
        
        # --- SISTEMA DE SUBASTAS ---
        self.auctions = self._init_auctions()
        from datetime import datetime
        self.last_reset_hour = datetime.now().hour
        self.auction_duration = 3600
        self.last_auction_reset = time.time()
        print(f"DEBUG: GameState iniciado con {len(self.auctions)} subastas. Hora local: {self.last_reset_hour}")
        
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
                    {"x": 18849, "y": 14995, "target": "mars_3", "tx": 1134 + 220, "ty": 1134 + 220, "label": "Fundición Ares"}
                ]
            },
            "mars_3": {
                "name": "Fundición Ares", "level": 3, "style": "mars",
                "portals": [
                    {"x": 1134, "y": 1134, "target": "mars_2", "tx": 18849 - 220, "ty": 14995 - 220, "label": "Cañón del Óxido"},
                    {"x": 18774, "y": 15149, "target": "mars_4", "tx": 2051 + 220, "ty": 1585 + 220, "label": "Valles de Magma"}
                ]
            },
            "mars_4": {
                "name": "Valles de Magma", "level": 4, "style": "mars_hazard",
                "portals": [
                    {"x": 2051, "y": 1585, "target": "mars_3", "tx": 18774 - 220, "ty": 15149 - 220, "label": "Fundición Ares"},
                    {"x": 18500, "y": 14613, "target": "neutral_1", "tx": 9700 + 220, "ty": 7680 + 220, "label": "Zona Neutral"},
                    {"x": 2000, "y": 14293, "target": "moon_4", "tx": 1810 + 220, "ty": 14391 + 220, "label": "Mar de la Tranquilidad"},
                    {"x": 9895, "y": 13867, "target": "pluto_4", "tx": 1700 + 220, "ty": 13547 + 220, "label": "Punta Horizonte"}
                ]
            },
            "mars_5": {
                "name": "Base Dust-Storm", "level": 5, "style": "mars_storm",
                "portals": [
                    {"x": 1207, "y": 1015, "target": "neutral_1", "tx": 1338 + 220, "ty": 1274 + 220, "label": "Zona Neutral"},
                    {"x": 18657, "y": 14530, "target": "mars_6", "tx": 1852 + 220, "ty": 1556 + 220, "label": "Cantera Olympus"},
                    {"x": 2200, "y": 13653, "target": "mars_7", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Puesto Phobos"}
                ]
            },
            "mars_6": {
                "name": "Cantera Olympus", "level": 6, "style": "mars",
                "portals": [
                    {"x": 1852, "y": 1556, "target": "mars_5", "tx": 18657 - 220, "ty": 14530 - 220, "label": "Base Dust-Storm"},
                    {"x": 18238, "y": 14463, "target": "mars_7", "tx": 1833 + 220, "ty": 1680 + 220, "label": "Puesto Phobos"}
                ]
            },
            "mars_7": {
                "name": "Puesto de Avanzada Phobos", "level": 7, "style": "mars",
                "portals": [
                    {"x": 17532, "y": 14300, "target": "mars_8", "tx": 1526 + 220, "ty": 1422 + 220, "label": "Plataforma Asedio"},
                    {"x": 1600, "y": 1920, "target": "mars_5", "tx": 2200 + 220, "ty": 13653 + 220, "label": "Base Dust-Storm"}
                ]
            },
            "mars_8": {
                "name": "Plataforma de Asedio", "level": 8, "style": "mars_industrial",
                "portals": [
                    {"x": 1526, "y": 1422, "target": "mars_7", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Puesto Phobos"}
                ],
                "station": {"x": 18742, "y": 14911} # Nueva estación en el punto celeste
            },
            # --- FACCIÓN MOON (Mapa Inicial: Bahía de Selene) ---
            "moon_1": {
                "name": "Bahía de Selene", "level": 1, "style": "moon",
                "portals": [
                    {"x": 17880, "y": 14793, "target": "moon_2",   "tx": 1600 + 220, "ty": 1920 + 220, "label": "Cráter de Cristal"}
                ],
                "station": {"x": 1750, "y": 1150} # Base de Inicio (Luna)
            },
            "moon_2": {
                "name": "Cráter de Cristal", "level": 2, "style": "moon_crystal",
                "portals": [
                    {"x": 1600, "y": 1920, "target": "moon_1", "tx": 17880 - 220, "ty": 14793 - 220, "label": "Bahía de Selene"},
                    {"x": 17532, "y": 14300, "target": "moon_3", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Estación Zenit"}
                ]
            },
            "moon_3": {
                "name": "Estación de Relevo Zenit", "level": 3, "style": "moon_tech",
                "portals": [
                    {"x": 1600, "y": 1920, "target": "moon_2", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Cráter de Cristal"},
                    {"x": 17532, "y": 14300, "target": "moon_4", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Mar de la Tranquilidad"}
                ]
            },
            "moon_4": {
                "name": "Mar de la Tranquilidad", "level": 4, "style": "moon_minimal",
                "portals": [
                    {"x": 1600, "y": 1920, "target": "moon_3", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Estación Zenit"},
                    {"x": 1810, "y": 14391, "target": "mars_4", "tx": 2000 - 220, "ty": 14293 - 220, "label": "Valles de Magma"},
                    {"x": 10283, "y": 14189, "target": "pluto_4", "tx": 10000 + 220, "ty": 13333 + 220, "label": "Punta Horizonte"},
                    {"x": 17532, "y": 14300, "target": "neutral_1", "tx": 8954 + 220, "ty": 8141 + 220, "label": "Zona Neutral"}
                ]
            },
            "moon_5": {
                "name": "Observatorio L-1", "level": 5, "style": "moon_space",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "neutral_1", "tx": 2000 + 220, "ty": 14400 + 220, "label": "Zona Neutral 1"},
                    {"x": PB_X, "y": PB_Y, "target": "moon_6", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Domos de Biodiversidad"},
                    {"x": 2200, "y": 13653, "target": "moon_7", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Refinería Helio-3"}
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
                    {"x": 17532, "y": 14300, "target": "moon_8", "tx": PA_X + 220, "ty": PA_Y + 220, "label": "Anillo de Plata"},
                    {"x": 1600, "y": 1920, "target": "moon_5", "tx": 2200 + 220, "ty": 13653 + 220, "label": "Observatorio L-1"}
                ]
            },
            "moon_8": {
                "name": "Anillo de Plata", "level": 8, "style": "moon_racing",
                "portals": [
                    {"x": PA_X, "y": PA_Y, "target": "moon_7", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Refinería Helio-3"}
                ],
                "station": {"x": PB_X, "y": PB_Y} # Avanzada de la Luna
            },
            # --- FACCIÓN PLUTO (Mapa Inicial: Abismo de Caronte) ---
            "pluto_1": {
                "name": "Abismo de Caronte", "level": 1, "style": "pluto",
                "portals": [
                    {"x": 17900, "y": 14080, "target": "pluto_2",  "tx": 1996 + 220, "ty": 1597 + 220, "label": "Glaciar Eterno"}
                ],
                "station": {"x": 1750, "y": 1150} # Base de Inicio (Plutón)
            },
            "pluto_2": {
                "name": "Glaciar Eterno", "level": 2, "style": "pluto_ice",
                "portals": [
                    {"x": 1996, "y": 1597, "target": "pluto_1", "tx": 17900 - 220, "ty": 14080 - 220, "label": "Abismo Caronte"},
                    {"x": 17900, "y": 14080, "target": "pluto_3", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Nébula Cobalto"}
                ]
            },
            "pluto_3": {
                "name": "Nébula de Cobalto", "level": 3, "style": "pluto_nebula",
                "portals": [
                    {"x": 1600, "y": 1920, "target": "pluto_2", "tx": 17900 - 220, "ty": 14080 - 220, "label": "Glaciar Eterno"},
                    {"x": 17532, "y": 14300, "target": "pluto_4", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Punta Horizonte"}
                ]
            },
            "pluto_4": {
                "name": "Punta del Horizonte", "level": 4, "style": "pluto_void",
                "portals": [
                    {"x": 1600, "y": 1920, "target": "pluto_3", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Nébula Cobalto"},
                    {"x": 1700, "y": 13547, "target": "mars_4", "tx": 9895 - 220, "ty": 13867 - 220, "label": "Valles de Magma"},
                    {"x": 10000, "y": 13333, "target": "moon_4", "tx": 10283 - 220, "ty": 14189 - 220, "label": "Mar de la Tranquilidad"},
                    {"x": 17532, "y": 14300, "target": "neutral_1", "tx": 10371 + 220, "ty": 8333 + 220, "label": "Zona Neutral"}
                ]
            },
            "pluto_5": {
                "name": "Cripta de Escarcha", "level": 5, "style": "pluto_ancient",
                "portals": [
                    {"x": 17532, "y": 14300, "target": "pluto_6", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Vórtice Sombrío"},
                    {"x": 1600, "y": 1920, "target": "neutral_1", "tx": 18000 + 220, "ty": 14000 + 220, "label": "Zona Neutral"},
                    {"x": 2200, "y": 13653, "target": "pluto_7", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Estación Exilio"}
                ]
            },
            "pluto_6": {
                "name": "Vórtice Sombrío", "level": 6, "style": "pluto_vortex",
                "portals": [
                    {"x": 1600, "y": 1920, "target": "pluto_5", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Cripta Escarcha"},
                    {"x": 17532, "y": 14300, "target": "pluto_8", "tx": 1999 + 220, "ty": 2024 + 220, "label": "Resplandor Hielo"}
                ]
            },
            "pluto_7": {
                "name": "Estación Exilio", "level": 7, "style": "pluto_prison",
                "portals": [
                    {"x": 17532, "y": 14300, "target": "pluto_8", "tx": 2012 + 220, "ty": 14088 + 220, "label": "Resplandor Hielo"},
                    {"x": 1600, "y": 2500, "target": "pluto_5", "tx": 2200 + 220, "ty": 13653 + 220, "label": "Cripta Escarcha"}
                ]
            },
            "pluto_8": {
                "name": "Resplandor de Hielo", "level": 8, "style": "pluto_glow",
                "portals": [
                    {"x": 2012, "y": 14088, "target": "pluto_7", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Estación Exilio"},
                    {"x": 1999, "y": 2024, "target": "pluto_6", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Vórtice Sombrío"}
                ],
                "station": {"x": PB_X, "y": PB_Y} # Avanzada de Plutón
            },
            # --- MAPAS NEUTRALES ---
            "neutral_1": {
                "name": "Zona Neutral 1", "level": 1, "style": "neutral",
                "portals": [
                    {"x": 9700, "y": 7680, "target": "mars_4", "tx": 18500 - 220, "ty": 14613 - 220, "label": "Valles de Magma"},
                    {"x": 1338, "y": 1274, "target": "mars_5", "tx": 1207 + 220, "ty": 1015 + 220, "label": "Base Dust-Storm"},
                    {"x": 8954, "y": 8141, "target": "moon_4", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Mar de la Tranquilidad"},
                    {"x": 2000, "y": 14400, "target": "moon_5", "tx": 500 + 220, "ty": 500 + 220, "label": "Observatorio L-1"},
                    {"x": 10371, "y": 8333, "target": "pluto_4", "tx": 17532 - 220, "ty": 14300 - 220, "label": "Punta Horizonte"},
                    {"x": 18000, "y": 14000, "target": "pluto_5", "tx": 1600 + 220, "ty": 1920 + 220, "label": "Cripta de Escarcha"}
                ]
            }
        }
        
        # --- PERFIL DE NAVES ---
        self.SHIP_PROFILES = {
            "starter": {
                "hp": 104000, "shld": 0, "atk": 40, "spd": 120, "color": "#ffffff",
                "slots": {"lasers": 1, "shields": 1, "engines": 1, "utility": 1},
                "cargo_capacity": 500
            },
            "tank": {
                "hp": 260000, "shld": 150, "atk": 70, "spd": 260, "color": "#ffb300",
                "slots": {"lasers": 8, "shields": 10, "engines": 5, "utility": 3},
                "cargo_capacity": 800
            },
            "fast": {
                "hp": 116000, "shld": 50, "atk": 110, "spd": 330, "color": "#00ccff",
                "slots": {"lasers": 4, "shields": 3, "engines": 3, "utility": 2},
                "cargo_capacity": 500
            },
            "stealth": {
                "hp": 164000, "shld": 80, "atk": 130, "spd": 360, "color": "#9933ff",
                "slots": {"lasers": 6, "shields": 4, "engines": 4, "utility": 2},
                "cargo_capacity": 600
            },
            "heavy": {
                "hp": 356000, "shld": 150, "atk": 180, "spd": 300, "color": "#ff3333",
                "slots": {"lasers": 15, "shields": 7, "engines": 7, "utility": 3},
                "cargo_capacity": 1500
            },
            "support": {
                "hp": 375000, "shld": 120, "atk": 60, "spd": 300, "color": "#33ff99",
                "slots": {"lasers": 10, "shields": 7, "engines": 8, "utility": 3},
                "cargo_capacity": 2000
            },
            "sovereign": {
                "hp": 360000, "shld": 250, "atk": 250, "spd": 220, "color": "#e6b800",
                "slots": {"lasers": 14, "shields": 7, "engines": 8, "utility": 3},
                "cargo_capacity": 1500
            },
            "harvester": {
                "hp": 325000, "shld": 150, "atk": 80, "spd": 400, "color": "#00ff00",
                "slots": {"lasers": 13, "shields": 5, "engines": 5, "utility": 3},
                "cargo_capacity": 1500
            },
            "interceptor": {
                "hp": 200000, "shld": 120, "atk": 150, "spd": 370, "color": "#ffff00",
                "slots": {"lasers": 5, "shields": 6, "engines": 6, "utility": 2},
                "cargo_capacity": 500
            },
            "bastion": {
                "hp": 650000, "shld": 400, "atk": 100, "spd": 240, "color": "#333333",
                "slots": {"lasers": 7, "shields": 15, "engines": 5, "utility": 5},
                "cargo_capacity": 4000
            }
        }
        
        # --- PERSISTENCIA DE SESIÓN ---
        self.player_persistence = {} # { user_id: {x, y} }
        
        # --- SISTEMA DE GRUPOS (PARTY) ---
        self.parties = {} # { party_id: { leader: id, members: [ids] } }
        self.party_invites = {} # { invited_id: { leader_id: time } }
        
        # --- ESTADÍSTICAS DE ALIENS (BASE) ---
        self.ALIEN_STATS = {
            "Gryllos": {"hp": 800, "shld": 400, "atk": [50, 100], "xp": 400, "credits": 400, "paladio": 1, "speed": 160},
            "Xylos": {"hp": 2000, "shld": 2000, "atk": [100, 200], "xp": 800, "credits": 800, "paladio": 2, "speed": 140},
            "Nykor": {"hp": 6000, "shld": 3000, "atk": [200, 400], "xp": 1600, "credits": 1600, "paladio": 4, "speed": 100},
            "Syrith": {"hp": 20000, "shld": 10000, "atk": [400, 800], "xp": 3200, "credits": 6400, "paladio": 8, "speed": 70},
            "Vexis": {"hp": 35000, "shld": 15000, "atk": 1000, "xp": 12800, "credits": 65000, "paladio": 25, "speed": 45},
            "Kragos": {"hp": 120000, "shld": 80000, "atk": 1500, "xp": 6400, "credits": 12800, "paladio": 16, "speed": 90},
            "Zoltan": {"hp": 400000, "shld": 300000, "atk": [2000, 4000], "xp": 51000, "credits": 350000, "paladio": 115, "speed": 60},
            "Drakon": {"hp": 700000, "shld": 500000, "atk": 5000, "xp": 200000, "credits": 1000000, "paladio": 1000, "speed": 35}
        }
        
        # --- INICIALIZAR CAJAS ESPECIALES (5 por mapa) ---
        for map_id in self.MAPS:
            for _ in range(5):
                self.spawn_special_chest(map_id)

    def add_player(self, client_id, websocket, ship_type="tank", initial_level=1, initial_xp=0, initial_credits=2000, initial_paladio=0, initial_minerals=None, initial_upgrades=None, initial_modules=None, initial_ammo=None, user_id=None, faction="MARS", clan_tag=None, initial_wips=None, initial_eco=None, equipped_design=None):
        self.clients[client_id] = websocket
        
        prof = self.SHIP_PROFILES.get(ship_type, self.SHIP_PROFILES["starter"])
        
        # Calculate modules based on stats (legacy logic, will be overridden by initial_modules eventually)
        c_lasers = max(1, round(prof["atk"] / 25))
        c_shields = max(1, round(prof["hp"] / 25))
        c_engines = max(1, round(prof["spd"] / 20))
        
        player = {
            "id": client_id,
            "user_id": user_id,
            "ship_type": ship_type,
            "x": 1750,
            "y": 1150,
            "vx": 0,
            "vy": 0,
            "hp": prof["hp"],
            "max_hp": prof["hp"],
            "base_max_hp": prof["hp"],
            "shld": prof["shld"],
            "max_shld": prof["shld"],
            "base_max_shld": prof["shld"],
            "last_dmg_time": 0,
            "lasers": 0,
            "shields": 0,
            "engines": 0,
            "slots": prof["slots"],
            "equipped": [], # List of modules
            "atk": prof["atk"],
            "base_atk": prof["atk"],
            "spd": prof["spd"],
            "base_spd": prof["spd"],
            "color": prof["color"],
            "x": 1750, # Posición inicial segura (Base)
            "y": 1150,
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
            "xp": initial_xp + (((initial_level - 1) * initial_level // 2) * 1000) if initial_xp < (((initial_level - 1) * initial_level // 2) * 1000) else initial_xp,
            "xp_next": (initial_level * (initial_level + 1) // 2) * 1000,
            "minerals": initial_minerals if (initial_minerals and isinstance(initial_minerals, dict)) else {"titanium": 0, "plutonium": 0, "silicon": 0},
            "max_cargo": prof.get("cargo_capacity", 1500),
            "base_max_cargo": prof.get("cargo_capacity", 1500),
            "current_map": "pluto_1" if faction == "PLUTO" else ("moon_1" if faction == "MOON" else "mars_1"),
            "paladio": initial_paladio,
            "faction": faction, # Mars, Moon, Pluto
            "clan_tag": clan_tag,  # User created clan (e.g. [ABC])
            "equipped_design": equipped_design,
            "repair_accumulated": 0.0,
            "last_repair_msg_time": 0.0,
            "active_missions": [],
            "needs_mission_sync": True, # Enviar misiones al unirse
            "is_invisible": False,
            "repair_bot_active": False,
            "wips": initial_wips if (initial_wips and isinstance(initial_wips, list)) else [],
            "owned_ships": ["starter"],
            "eco": initial_eco if (initial_eco and isinstance(initial_eco, dict)) else {
                "active": False, "deployed": False, "mode": "passive", "level": 1, 
                "integrity": 50000, "max_integrity": 50000, "shield": 100000, "max_shield": 100000, 
                "fuel": 100000, "max_fuel": 100000, "speed": 0,
                "x": 1750, "y": 1150, "vx": 0, "vy": 0,
                "equipped": {"lasers": [], "generators": [], "protocols": [], "utility": []},
                "unlocked_slots": {"lasers": 1, "generators": 1, "protocols": 1, "utility": 1},
                "xp": 0, "xp_next": 100000
            },
            "active_abilities": {}, # {id: expiry_time}
            "ability_cooldowns": {}  # {id: ready_time}
        }
        
        # Cargar datos desde DB si hay user_id (misiones y mejoras)
        if user_id:
            try:
                # Cargar misiones
                from database import get_missions_db, get_user_stats_db
                mission_data = get_missions_db(user_id)
                player["active_missions"] = mission_data.get("active", [])
                
                # Cargar mejoras temporales (AHORA DESDE DB PARA QUE SEA 100% PERSISTENTE)
                db_stats = get_user_stats_db(user_id)
                if db_stats:
                    if "timed_upgrades" in db_stats:
                        initial_upgrades = db_stats["timed_upgrades"]
                    if "is_invisible" in db_stats:
                        player["is_invisible"] = bool(db_stats["is_invisible"])
                    if "eco" in db_stats:
                        player["eco"] = db_stats["eco"]
                    if "wips" in db_stats:
                        player["wips"] = db_stats["wips"]
                    if "owned_ships" in db_stats:
                        player["owned_ships"] = db_stats["owned_ships"]
                    if "ammo" in db_stats:
                        # Priorizar munición de DB sobre la recibida por el cliente
                        db_ammo = db_stats["ammo"]
                        player["ammo"] = {k: v for k, v in db_ammo.items() if not k.startswith("missile")}
                        player["missiles"] = {k: v for k, v in db_ammo.items() if k.startswith("missile")}
                    print(f"Estado cargado desde DB para {user_id}: ammo={player['ammo']}, missiles={player['missiles']}, ships={player['owned_ships']}")
            except Exception as e:
                print(f"Error loading missions/upgrades for {user_id}: {e}")

        # Guardar estadísticas base para recálculos
        player["base_atk"] = prof["atk"]
        player["base_spd"] = prof["spd"]
        player["base_max_shld"] = prof["shld"]
        player["base_max_hp"] = prof["hp"]
        player["base_max_cargo"] = prof.get("cargo_capacity", 1500)

        # Procesar mejoras iniciales (pueden ser formato nuevo o viejo)
        raw_upg = initial_upgrades if (initial_upgrades and isinstance(initial_upgrades, dict)) else {}
        player["timed_upgrades"] = {
            "atk": raw_upg.get("atk", []) if isinstance(raw_upg.get("atk"), list) else [],
            "shld": raw_upg.get("shld", []) if isinstance(raw_upg.get("shld"), list) else [],
            "spd": raw_upg.get("spd", []) if isinstance(raw_upg.get("spd"), list) else [],
            "hp": raw_upg.get("hp", []) if isinstance(raw_upg.get("hp"), list) else []
        }

        # Convertir formato viejo si es necesario (retrocompatibilidad por si acaso)
        if isinstance(raw_upg.get("atk"), (int, float)) and raw_upg["atk"] > 0:
            player["timed_upgrades"]["atk"].append({"amount": raw_upg["atk"], "expires": (time.time() + 7200) * 1000})
        if isinstance(raw_upg.get("shld"), (int, float)) and raw_upg["shld"] > 0:
            player["timed_upgrades"]["shld"].append({"amount": raw_upg["shld"], "expires": (time.time() + 7200) * 1000})
        if isinstance(raw_upg.get("spd"), (int, float)) and raw_upg["spd"] > 0:
            player["timed_upgrades"]["spd"].append({"amount": raw_upg["spd"], "expires": (time.time() + 7200) * 1000})
        if isinstance(raw_upg.get("hp"), (int, float)) and raw_upg["hp"] > 0:
            player["timed_upgrades"]["hp"].append({"amount": raw_upg["hp"], "expires": (time.time() + 7200) * 1000})

        # Primera actualización de stats
        self.recalculate_player_stats(player)
 
        if initial_ammo and not user_id:
            # Separar munición de láseres vs misiles (Solo si no hay datos persistentes en DB)
            for k, v in initial_ammo.items():
                if k.startswith("missile_"):
                    player["missiles"][k] = v
                else:
                    player["ammo"][k] = v
            
        # --- RESTAURAR POSICIÓN Y ESTADO PERSISTENTE ---
        if user_id and user_id in self.player_persistence:
            saved = self.player_persistence[user_id]
            player["level"] = saved.get("level", initial_level)
            current_xp = saved.get("xp", initial_xp)
            
            # Migración al nuevo sistema de 100k por nivel
            threshold_lvl_prev = (player["level"] - 1) * 100000
            if current_xp < threshold_lvl_prev:
                player["xp"] = current_xp + threshold_lvl_prev
            else:
                player["xp"] = current_xp
                
            player["xp_next"] = player["level"] * 100000
            player["x"] = saved.get("x", 1750)
            player["y"] = saved.get("y", 1150)
            player["current_map"] = saved.get("current_map", "pluto_1" if faction == "PLUTO" else ("moon_1" if faction == "MOON" else "mars_1"))
            player["equipped_design"] = saved.get("equipped_design", equipped_design)
            
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
        self.broadcast_user_list()

        # Apply initial modules if provided
        if initial_modules:
            for mod in initial_modules:
                self.buy_module(client_id, mod, free=True)
                
        # Apply initial wips if provided
        player["wips"] = initial_wips if isinstance(initial_wips, list) else []
        self.recalculate_player_stats(player)

    def remove_player(self, client_id):
        if client_id in self.players:
            player = self.players[client_id]
            user_id = player.get("user_id")
            if user_id:
                self.player_persistence[user_id] = {
                    "x": player["x"],
                    "y": player["y"],
                    "current_map": player.get("current_map", "pluto_1" if player.get("faction") == "PLUTO" else ("moon_1" if player.get("faction") == "MOON" else "mars_1")),
                    "paladio": player.get("paladio", 0),
                    "credits": player.get("credits", 0),
                    "xp": player.get("xp", 0),
                    "level": player.get("level", 1),
                    "ammo": player.get("ammo", {}).copy(),
                    "missiles": player.get("missiles", {}).copy(),
                    "minerals": player.get("minerals", {}).copy(),
                    "is_invisible": player.get("is_invisible", False),
                    "equipped_design": player.get("equipped_design"),
                    "last_save": time.time()
                }
                print(f"Guardando persistencia para {user_id}: Credits={player['credits']}, Map={player['current_map']}, Invisible={player.get('is_invisible')}")
                # Persistencia en BD real
                sync_user_stats(user_id, player["level"], player["xp"], player["credits"], player.get("paladio", 0), is_invisible=player.get("is_invisible", False))
                
            del self.players[client_id]
            self.broadcast_user_list()
            
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
        
        # Sincronización de destino de mouse: Solo actualizar si el cliente envía coordenadas reales.
        # Si el cliente envía cancel_nav, limpiar explícitamente el destino.
        if keys.get("cancel_nav"):
            player["target_x"] = None
            player["target_y"] = None
            player["vx"] = 0
            player["vy"] = 0
        elif keys.get("target_x") is not None and keys.get("target_y") is not None:
            player["target_x"] = keys["target_x"]
            player["target_y"] = keys["target_y"]
        
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
            # Si hay un objetivo fijado, buscarlo (EN EL MISMO MAPA) - Incluye Enemigos y Jugadores (PVP)
            target_enemy = next((e for e in self.enemies if e["id"] == locked_id and e.get("map_id") == player["current_map"]), None)
            if not target_enemy and locked_id in self.players and self.players[locked_id].get("current_map") == player["current_map"]:
                target_enemy = self.players[locked_id]
            
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
            # Buscar objetivo en enemigos o jugadores (PVP)
            target_exists = next((e for e in self.enemies if e["id"] == locked_id and e.get("map_id") == player["current_map"]), None)
            if not target_exists and locked_id in self.players and self.players[locked_id].get("current_map") == player["current_map"]:
                target_exists = self.players[locked_id]

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
            
        # Trigger si presiona E O si tiene el CPU automático, un objetivo fijado y la nave está atacando (shoot_active)
        # Esto cumple con el requisito de "una vez empiece el ataque, empiece a tirar misiles de forma automática"
        has_auto = player.get("has_auto_missile", False)
        locked = player.get("locked_target_id")
        is_attacking = player.get("shoot_active", False)
        
        should_fire_missile = keys.get("missile_shoot") or (has_auto and locked and is_attacking)

        # --- LÓGICA DE REVELACIÓN (Invisibilidad) ---
        # Si el jugador está intentando disparar (Láser o Misil), se revela inmediatamente
        # EXCEPCIÓN: Si tiene activa la habilidad de Invisibilidad Avanzada, no se revela al disparar
        if (player.get("shoot_active") or should_fire_missile):
            if player.get("is_invisible") and "advanced_invisibility" not in player.get("active_abilities", {}):
                player["is_invisible"] = False
                print(f"REVELADO: {player.get('user_id')} ha iniciado un ataque.")

        # Laser Firing
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
            locked_id = player.get("locked_target_id")
            
            target_enemy = None
            if locked_id:
                target_enemy = next((e for e in self.enemies if e["id"] == locked_id and e.get("map_id") == player["current_map"]), None)
                if not target_enemy and locked_id in self.players and self.players[locked_id].get("current_map") == player["current_map"]:
                    target_enemy = self.players[locked_id]
                    
            if target_enemy:
                dx = target_enemy["x"] - player["x"]
                dy = target_enemy["y"] - player["y"]
                angle = math.atan2(dy, dx)
                target_id_for_proj = locked_id
            else:
                angle = player.get("heading", -1.57)
                target_id_for_proj = None
            
            # --- DETERMINAR COLOR DEL LÁSER ---
            proj_color = None
            if ammo_type in ["standard", "thermal", "plasma"]:
                if player.get("all_heavy_cannons"):
                    proj_color = "#00ff00" # Verde (Todas las ranuras con Cañón Pesado)
                else:
                    proj_color = "#ff0000" # Rojo (Default para estas municiones)

            self.projectiles.append({
                "id": str(random.random()),
                "owner_id": client_id,
                "is_player": True,
                "x": player["x"],
                "y": player["y"],
                "vx": math.cos(angle) * projectile_speed,
                "vy": math.sin(angle) * projectile_speed,
                "speed": projectile_speed,
                "damage": actual_damage,
                "ammo_type": ammo_type,
                "color": proj_color,
                "life": 1.2, # segundos de vida del rayo
                "map_id": player["current_map"],
                "is_homing": True if target_id_for_proj else False,
                "target_id": target_id_for_proj
            })

        # Missile Firing (Tecla E o Automático)
        missile_cooldown = 0.75 if player.get("has_turbo_missile") else 1.5
        
        if should_fire_missile and (now - player["last_missile_shot"] > missile_cooldown):
            m_type = player.get("missile_type", "missile_1")
            if player["missiles"].get(m_type, 0) > 0:
                player["missiles"][m_type] -= 1
                player["last_missile_shot"] = now
                
                # Configuración de daño de misiles (Proporcional al Atk del jugador)
                atk = player.get("atk", 100)
                m_config = {
                    "missile_1": {"dmg": 1000, "spd": 800},
                    "missile_2": {"dmg": 2000, "spd": 700},
                    "missile_3": {"dmg": 4000, "spd": 500}
                }
                conf = m_config.get(m_type)
                # Determinar dirección del misil: al objetivo o al frente (SOLO SI EL OBJETIVO ESTÁ EN EL MISMO MAPA)
                # Determinar dirección del misil: al objetivo o al frente
                locked_id = player.get("locked_target_id")
                target_enemy = next((e for e in self.enemies if e["id"] == locked_id and e.get("map_id") == player["current_map"]), None) if locked_id else None
                if not target_enemy and locked_id and locked_id in self.players and self.players[locked_id].get("current_map") == player["current_map"]:
                    target_enemy = self.players[locked_id]
                
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

    def _init_auctions(self):
        # Artículos que se venden por Paladio (pujables por Créditos)
        # Excluidos: ECO, módulos de ECO y protocolos de ECO.
        items = [
            # --- NAVES (Por Paladio) ---
            {"id": "heavy", "name": "Titan Hammer", "type": "ship", "value": "100.000 Paladio", "start_bid": 10000},
            {"id": "support", "name": "Helix Support", "type": "ship", "value": "200.000 Paladio", "start_bid": 10000},
            {"id": "sovereign", "name": "Sovereign Exterminator", "type": "ship", "value": "200.000 Paladio", "start_bid": 10000},
            {"id": "harvester", "name": "Cosmic Harvester", "type": "ship", "value": "250.000 Paladio", "start_bid": 10000},
            {"id": "interceptor", "name": "Solar Wind", "type": "ship", "value": "45.000 Paladio", "start_bid": 10000},
            {"id": "bastion", "name": "Obsidian Bastion", "type": "ship", "value": "160.000 Paladio", "start_bid": 10000},
            
            # --- MUNICIÓN (Por Paladio) ---
            {"id": "thermal", "name": "10.000 x Munición Térmica", "type": "ammo", "value": "5.000 Paladio", "start_bid": 10000},
            {"id": "plasma", "name": "10.000 x Munición Plasma", "type": "ammo", "value": "10.000 Paladio", "start_bid": 10000},
            {"id": "siphon", "name": "10.000 x Munición Sifón", "type": "ammo", "value": "10.000 Paladio", "start_bid": 10000},
            {"id": "missile_3", "name": "1.000 x Misiles Giga-Nuke", "type": "ammo", "value": "5.000 Paladio", "start_bid": 10000},
            
            # --- GENERADORES (Por Paladio) ---
            {"id": "shield_2", "name": "Escudo Reforzado", "type": "module", "value": "25.000 Paladio", "start_bid": 10000},
            {"id": "shield_3", "name": "Escudo Hiper", "type": "module", "value": "50.000 Paladio", "start_bid": 10000},
            {"id": "engine_2", "name": "Turbo Motor", "type": "module", "value": "3.000 Paladio", "start_bid": 10000},
            {"id": "engine_3", "name": "Hiper Motor", "type": "module", "value": "6.000 Paladio", "start_bid": 10000},
            
            # --- LÁSERES Y OTROS (Por Paladio) ---
            {"id": "laser_2", "name": "Láser Plus", "type": "module", "value": "5.000 Paladio", "start_bid": 10000},
            {"id": "laser_3", "name": "Cañón Pesado", "type": "module", "value": "10.000 Paladio", "start_bid": 10000},
            {"id": "util_repair_2", "name": "Robot Reparación II", "type": "module", "value": "15.000 Paladio", "start_bid": 10000},
            {"id": "sparks", "name": "WIP Sparks", "type": "wip", "value": "15.000 Paladio", "start_bid": 10000},
            {"id": "util_cloak", "name": "Camuflaje Sigiloso", "type": "module", "value": "500 Paladio", "start_bid": 10000},
            {"id": "util_auto_repair_cpu", "name": "Robo-reparación", "type": "module", "value": "10.000 Paladio", "start_bid": 10000},
            {"id": "util_turbo_missile", "name": "Misil Turbo CPU", "type": "module", "value": "10.000 Paladio", "start_bid": 10000},
            {"id": "util_auto_missile", "name": "CPU Misil Auto", "type": "module", "value": "25.000 Paladio", "start_bid": 10000},
            {"id": "util_cloak_l", "name": "CPU Camuflaje L", "type": "module", "value": "5.000 Paladio", "start_bid": 10000},
            {"id": "util_cloak_xl", "name": "CPU Camuflaje XL", "type": "module", "value": "22.500 Paladio", "start_bid": 10000},
            {"id": "util_cargo_compressor", "name": "Compresor de Carga", "type": "module", "value": "10.000 Paladio", "start_bid": 10000},
            {"id": "util_slot_cpu_2", "name": "Ranuras Extra II", "type": "module", "value": "150.000 Paladio", "start_bid": 10000},
            {"id": "util_slot_cpu_3", "name": "Ranuras Extra III", "type": "module", "value": "250.000 Paladio", "start_bid": 10000},
        ]
        
        auctions = []
        for i, item in enumerate(items):
            auctions.append({
                "id": f"auc_{i}",
                "item_id": item["id"],
                "name": item["name"],
                "type": item["type"],
                "value": item["value"],
                "highest_bid": item["start_bid"],
                "highest_bidder": None,
                "highest_bidder_name": "-",
                "player_bids": {} # player_id: amount
            })
        return auctions

    def place_auction_bid(self, client_id, auction_id, amount):
        p = self.players.get(client_id)
        if not p: return False, "Jugador no encontrado"
        
        auction = next((a for a in self.auctions if a["id"] == auction_id), None)
        if not auction: return False, "Subasta no encontrada"
        
        min_increment = 10000
        if auction["highest_bidder"] is None:
            if amount < auction["highest_bid"]:
                return False, f"La puja mínima inicial es de {auction['highest_bid']:,} Créditos"
        else:
            if amount < auction["highest_bid"] + min_increment:
                return False, f"Debes superar la puja actual por al menos {min_increment:,} Créditos adicionales"
        
        # Créditos necesarios (considerando si ya pujó antes)
        user_id = p.get("user_id")
        current_p_bid = auction["player_bids"].get(user_id, 0)
        needed = amount - current_p_bid
        
        if p["credits"] < needed:
            return False, "Créditos insuficientes"
        
        # Devolver créditos al anterior líder
        if auction["highest_bidder"] and auction["highest_bidder"] != user_id:
            old_leader_id = auction["highest_bidder"]
            old_amount = auction["highest_bid"]
            
            # Notificar al anterior líder que le han superado la puja
            from database import send_system_message_db
            send_system_message_db(
                old_leader_id, 
                "Puja Superada", 
                f"Otro usuario ha superado tu puja por el artículo: {auction['name']}. Tus {old_amount:,} créditos han sido devueltos a tu cuenta."
            )
            
            # Buscar si el anterior líder está online
            old_leader_p = next((pl for pl in self.players.values() if pl.get("user_id") == old_leader_id), None)
            if old_leader_p:
                old_leader_p["credits"] += old_amount
            else:
                # Offline: Actualizar en DB
                try:
                    from database import get_user_stats_db, update_user_credits
                    stats = get_user_stats_db(old_leader_id)
                    if stats:
                        new_credits = stats.get("credits", 0) + old_amount
                        update_user_credits(old_leader_id, new_credits)
                except Exception as e:
                    print(f"DEBUG: Error devolviendo créditos offline: {e}")
        
        # Aplicar puja
        p["credits"] -= needed
        auction["highest_bid"] = amount
        auction["highest_bidder"] = user_id
        auction["highest_bidder_name"] = p.get("display_name", p.get("user_id", "Piloto"))
        auction["player_bids"][user_id] = amount
        
        # Notificar al usuario que su puja es la líder
        from database import send_system_message_db
        send_system_message_db(
            user_id,
            "Puja Realizada",
            f"Has realizado una puja líder de {amount:,} créditos por el artículo: {auction['name']}."
        )
        
        return True, "¡Puja líder realizada!"

    def place_auction_bid_offline(self, user_id, auction_id, amount):
        # Esta función maneja pujas desde el menú cuando el jugador NO está en el mapa
        auction = next((a for a in self.auctions if a["id"] == auction_id), None)
        if not auction: return False, "Subasta no encontrada"
        
        min_increment = 10000
        if auction["highest_bidder"] is None:
            if amount < auction["highest_bid"]:
                return False, f"La puja mínima inicial es de {auction['highest_bid']:,} Créditos"
        else:
            if amount < auction["highest_bid"] + min_increment:
                return False, f"Debes superar la puja actual por al menos {min_increment:,} Créditos adicionales"
            
        from database import get_user_stats_db, update_user_credits, send_system_message_db
        stats = get_user_stats_db(user_id)
        if not stats: return False, "Usuario no encontrado"
        
        current_credits = stats.get("credits", 0)
        current_p_bid = auction["player_bids"].get(user_id, 0)
        needed = amount - current_p_bid
        
        if current_credits < needed:
            return False, "Créditos insuficientes"
            
        # Devolver créditos al anterior líder
        if auction["highest_bidder"] and auction["highest_bidder"] != user_id:
            old_leader_id = auction["highest_bidder"]
            old_amount = auction["highest_bid"]
            
            old_leader_p = next((pl for pl in self.players.values() if pl.get("user_id") == old_leader_id), None)
            if old_leader_p:
                old_leader_p["credits"] += old_amount
            else:
                old_stats = get_user_stats_db(old_leader_id)
                if old_stats:
                    update_user_credits(old_leader_id, old_stats.get("credits", 0) + old_amount)
            
            # Notificar al anterior líder
            send_system_message_db(
                old_leader_id,
                "Puja Superada",
                f"Otro usuario ha superado tu puja por el artículo: {auction['name']}. Tus {old_amount:,} créditos han sido devueltos a tu cuenta."
            )
                    
        # Aplicar puja
        update_user_credits(user_id, current_credits - needed)
        auction["highest_bid"] = amount
        auction["highest_bidder"] = user_id
        auction["highest_bidder_name"] = stats.get("display_name", user_id)
        auction["player_bids"][user_id] = amount
        
        # Notificar al usuario
        send_system_message_db(
            user_id,
            "Puja Realizada",
            f"Has realizado una puja líder de {amount:,} créditos por el artículo: {auction['name']}."
        )
        
        return True, "¡Puja líder realizada!"

    def finalize_auctions(self):
        for auc in self.auctions:
            winner_id = auc["highest_bidder"]
            if winner_id:
                self._reward_auction_winner(winner_id, auc)
                # Notificar al ganador
                from database import send_system_message_db
                send_system_message_db(
                    winner_id,
                    "¡Subasta Ganada!",
                    f"¡Felicidades! Has ganado la subasta del artículo: {auc['name']}. El objeto ha sido añadido a tu cuenta."
                )
        
        self.auctions = self._init_auctions()
        self.last_auction_reset = time.time()

    def _reward_auction_winner(self, player_id, auction):
        player = self.players.get(player_id)
        item_id = auction["item_id"]
        item_type = auction["type"]
        
        if player:
            if item_type == "ship":
                if "owned_ships" not in player: player["owned_ships"] = ["starter"]
                if item_id not in player["owned_ships"]:
                    player["owned_ships"].append(item_id)
            elif item_type == "wip":
                if "wips" not in player: player["wips"] = []
                # El frontend espera 'instanceId' e 'integrity'
                player["wips"].append({
                    "instanceId": f"wip_{random.random()}", 
                    "type": item_id, 
                    "lvl": 1, 
                    "integrity": 100,
                    "equipped": []
                })
            elif item_type == "module":
                if "inventory" not in player: player["inventory"] = []
                player["inventory"].append(item_id)
            elif item_type == "ammo":
                count = 10000 if not item_id.startswith("missile") else 1000
                if item_id.startswith("missile"):
                    if "missiles" not in player: player["missiles"] = {"missile_1": 0, "missile_2": 0, "missile_3": 0}
                    player["missiles"][item_id] = player["missiles"].get(item_id, 0) + count
                else:
                    if "ammo" not in player: player["ammo"] = {"standard": 0, "thermal": 0, "plasma": 0, "siphon": 0}
                    player["ammo"][item_id] = player["ammo"].get(item_id, 0) + count
            
            self.recalculate_player_stats(player)
        else:
            # Offline
            try:
                from database import get_user_stats_db, update_stats_offline
                stats = get_user_stats_db(player_id)
                if stats:
                    if item_type == "ship":
                        ships = stats.get("owned_ships", ["starter"])
                        if item_id not in ships:
                            ships.append(item_id)
                            update_stats_offline(player_id, {"owned_ships": ships})
                    elif item_type == "module":
                        inv = stats.get("inventory", [])
                        inv.append(item_id)
                        update_stats_offline(player_id, {"inventory": inv})
                    elif item_type == "wip":
                        wips = stats.get("wips", [])
                        wips.append({
                            "instanceId": f"wip_{random.random()}", 
                            "type": item_id, 
                            "lvl": 1, 
                            "integrity": 100,
                            "equipped": []
                        })
                        update_stats_offline(player_id, {"wips": wips})
                    elif item_type == "ammo":
                        ammo = stats.get("ammo", {}) # Note: stats['ammo'] from DB contains combined ammo
                        count = 10000 if not item_id.startswith("missile") else 1000
                        ammo[item_id] = ammo.get(item_id, 0) + count
                        update_stats_offline(player_id, {"ammo": ammo})
            except Exception as e:
                print(f"DEBUG: Error entregando premio offline: {e}")

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
                    # --- SISTEMA DE INTEGRIDAD DE WIPS ---
                    # Cada vez que mueres, tus Wips pierden un 10% de integridad
                    new_wips = []
                    for wip in p.get("wips", []):
                        wip["integrity"] = max(0, wip.get("integrity", 100) - 10)
                        if wip["integrity"] > 0:
                            new_wips.append(wip)
                    
                    p["wips"] = new_wips

                    # --- SISTEMA DE INTEGRIDAD DE E.C.O. ---
                    eco = p.get("eco", {})
                    if eco.get("active"):
                        eco["integrity"] = max(0, eco.get("integrity", 100) - 10)
                        
                        # Trigger Kamikaze if it's about to be destroyed or inactive
                        self.trigger_eco_kamikaze(pid)
                        
                        if eco["integrity"] <= 0:
                            eco["active"] = False
                            eco["integrity"] = 0
                        p["eco"] = eco

                    # Recalcular stats por si perdimos un Wip o el ECO con módulos
                    self.recalculate_player_stats(p)
                continue
            
            # Si el jugador estaba muerto (reparado), reseter flag
            if p.get("is_dead"): p["is_dead"] = False

            # Stop exactly at target to prevent overshoot and reverse heading bugs
            if p.get("target_x") is not None and p.get("target_y") is not None:
                dx = p["target_x"] - p["x"]
                dy = p["target_y"] - p["y"]
                dist = math.hypot(dx, dy)
                step = math.hypot(p["vx"]*dt, p["vy"]*dt)
                if step >= dist:
                    p["x"] = p["target_x"]
                    p["y"] = p["target_y"]
                    p["vx"] = 0
                    p["vy"] = 0
                    p["target_x"] = None
                    p["target_y"] = None
                else:
                    p["x"] += p["vx"] * dt
                    p["y"] += p["vy"] * dt
            else:
                p["x"] += p["vx"] * dt
                p["y"] += p["vy"] * dt
            
            # Constrain to screen/world limits
            p["x"] = max(20, min(self.GAME_WIDTH - 20, p["x"]))
            p["y"] = max(20, min(self.GAME_HEIGHT - 20, p["y"]))
            
            # Regenerar Escudos
            # Regenerar Escudos si no ha recibido daño en 3 segundos
            if now - p["last_dmg_time"] > 3.0:
                p["shld"] = min(p["max_shld"], p["shld"] + (20.0 * dt)) # 20 SHLD/s
            
            # --- AUTO-REPARACIÓN ---
            # Si tiene el módulo de reparación automática, no está disparando y han pasado 5s sin daño
            if p.get("has_auto_repair") and p.get("repair_rate", 0) > 0:
                if not p.get("shoot_active") and now - p["last_dmg_time"] > 5.0 and p["hp"] < p["max_hp"]:
                    p["repair_bot_active"] = True
            
            # Regenerar HP (Robot de Reparación)
            # Solo si lleva 5 segundos sin recibir daño (frente a los 3s de los escudos)
            # Y SOLO SI EL BOT ESTÁ ACTIVADO MANUALMENTE
            if p.get("repair_rate", 0) > 0 and p.get("repair_bot_active") and now - p["last_dmg_time"] > 5.0:
                if p["hp"] < p["max_hp"]:
                    hp_before = p["hp"]
                    p["hp"] = min(p["max_hp"], p["hp"] + (p["repair_rate"] * dt))
                    healed = p["hp"] - hp_before
                    p["repair_accumulated"] += healed
                    p["is_repairing"] = True
                    
                    # Lanzar evento visual cada 2 segundos mientras repara para evitar spam de +42 HP
                    if now - p.get("last_repair_msg_time", 0) >= 2.0:
                        self.loot_events.append({
                            "type": "heal",
                            "amount": round(p["repair_accumulated"]),
                            "x": p["x"], "y": p["y"],
                            "time": now, "owner_id": pid
                        })
                        p["repair_accumulated"] = 0
                        p["last_repair_msg_time"] = now
                else:
                    # Si ya está al máximo HP, desactivar el bot automáticamente
                    p["is_repairing"] = False
                    p["repair_bot_active"] = False
                    p["repair_accumulated"] = 0
            else:
                p["is_repairing"] = False
                p["repair_accumulated"] = 0 
                
            # Interrupción manual: Si el bot está activo pero recibe daño, se apaga
            if p.get("repair_bot_active") and now - p["last_dmg_time"] < 0.1: # Recién dañado
                 p["repair_bot_active"] = False
                 p["is_repairing"] = False
            
            # Quitar powerup si expiró
            if p["powerup"] and now > p["powerup_time"]:
                p["powerup"] = None

            # --- GESTIÓN DE MEJORAS TEMPORALES (2 HORAS) ---
            upg_changed = False
            for stat in ["atk", "shld", "spd", "hp"]:
                current_list = p["timed_upgrades"].get(stat, [])
                active = [u for u in current_list if (u.get("expires", 0) / 1000.0) > now]
                if len(active) != len(current_list):
                    p["timed_upgrades"][stat] = active
                    upg_changed = True
            
            # --- GESTIÓN DE HABILIDADES ACTIVAS ---
            ability_expired = False
            for abi_id, expiry in list(p.get("active_abilities", {}).items()):
                if now > expiry:
                    if abi_id == "advanced_invisibility":
                        p["is_invisible"] = False
                    del p["active_abilities"][abi_id]
                    ability_expired = True
            
            if upg_changed or ability_expired:
                self.recalculate_player_stats(p)
                # Persistir limpieza en DB si hubo cambios de mejoras
                if upg_changed and "guest" not in pid and p.get("user_id"):
                    try:
                        sync_user_stats(
                            p["user_id"], 
                            p["level"], p["xp"], p["credits"], p["paladio"],
                            timed_upgrades=p["timed_upgrades"]
                        )
                        print(f"Limpieza de mejoras expiradas persistida para {pid}")
                    except: pass
                
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

            # --- LÓGICA DE OXÍGENO (BORDES DEL MAPA) ---
            OXYGEN_ZONE = 400
            is_oxygen_lacking = (
                p["x"] < OXYGEN_ZONE or 
                p["x"] > self.GAME_WIDTH - OXYGEN_ZONE or 
                p["y"] < OXYGEN_ZONE or 
                p["y"] > self.GAME_HEIGHT - OXYGEN_ZONE
            )
            
            p["oxygen_warning"] = is_oxygen_lacking
            
            if is_oxygen_lacking and not p["in_safe_zone"]:
                # Daño por falta de oxígeno: 15 HP por segundo
                dmg = 15 * dt
                
                if p["shld"] >= dmg:
                    p["shld"] -= dmg
                else:
                    rem = dmg - p["shld"]
                    p["shld"] = 0
                    p["hp"] -= rem
                
                p["last_dmg_time"] = now # Interrumpir reparación
                
                # Efecto visual cada 0.5s
                if now - p.get("last_oxygen_dmg_time", 0) > 0.5:
                    self.damage_events.append({
                        "id": f"oxygen_{random.random()}",
                        "x": p["x"] + random.randint(-15, 15),
                        "y": p["y"] + random.randint(-15, 15),
                        "amount": 15, "time": now, "owner_id": pid
                    })
                    p["last_oxygen_dmg_time"] = now

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
                target_id = p["locked_target_id"]
                target_exists = any(en["id"] == target_id for en in self.enemies) or (target_id in self.players)
                if not target_exists:
                    p["locked_target_id"] = None
                    p["shoot_active"] = False # Detener disparo al morir el blanco

        # --- UPDATE E.C.O. SYSTEMS ---
        for pid, p in self.players.items():
            eco = p.get("eco")
            if not eco or not eco.get("active") or not eco.get("deployed"):
                continue
            
            # 1. Consumo de combustible
            # Consumo base: 1 unidad por segundo
            fuel_cons = 1.0 * eco.get("fuel_efficiency_mult", 1.0)
            
            # Consumo extra por reparación activa
            is_repairing = False
            now = time.time()
            if p.get("eco_repair_end_time", 0) > now:
                is_repairing = True
                fuel_cons *= p.get("eco_repair_fuel_extra_factor", 1.35)
                
                # Efecto de reparación
                heal = p.get("eco_repair_hp_sec", 0) * dt
                if p["hp"] < p["max_hp"]:
                    p["hp"] = min(p["max_hp"], p["hp"] + heal)
                    # Opcional: registrar evento visual de reparación (verde)
                    if random.random() < 0.1: # No saturar
                        self.damage_events.append({
                            "id": f"eco_heal_{pid}_{random.random()}",
                            "x": p["x"], "y": p["y"],
                            "amount": int(heal / dt), "time": now, "owner_id": pid, "color": "#00ffcc"
                        })

            # 2. Autorreparación del ECO
            if p.get("eco_self_repair_end_time", 0) > now:
                regen = p.get("eco_self_repair_hp_sec", 0) * dt
                # Reparar integridad (PV del ECO)
                max_int = eco.get("max_integrity", 50000)
                if eco.get("integrity", 0) < max_int:
                    eco["integrity"] = min(max_int, eco["integrity"] + regen)
                    # Opcional: efecto visual en el ECO
                    if random.random() < 0.1:
                        self.damage_events.append({
                            "id": f"eco_self_heal_{pid}_{random.random()}",
                            "x": eco["x"], "y": eco["y"],
                            "amount": int(regen / dt), "time": now, "owner_id": pid, "color": "#ccff00" # Lima/Amarillo para el ECO
                        })

            eco["fuel"] = max(0, eco["fuel"] - (fuel_cons * dt))
            if eco["fuel"] <= 0:
                eco["deployed"] = False
                
                # Notificar al jugador vía chat de sistema
                ws = self.clients.get(pid)
                if ws:
                    try:
                        import asyncio
                        import json
                        loop = asyncio.get_event_loop()
                        error_msg = json.dumps({
                            "type": "chat_update",
                            "message": {
                                "id": "sys_" + str(time.time()),
                                "sender": "SISTEMA",
                                "display_name": "SISTEMA",
                                "text": "🛑 El E.C.O. se ha quedado sin combustible y ha regresado a la base.",
                                "channel": "global",
                                "faction": "SYSTEM",
                                "time": time.time()
                            }
                        })
                        if loop.is_running():
                            loop.create_task(ws.send_text(error_msg))
                    except:
                        pass
                continue

            # 2. IA de comportamiento
            target_x, target_y = p["x"], p["y"]
            attacking = False
            target_id = None

            if eco.get("mode") == "aggressive":
                # Si el jugador ha sido atacado recientemente (en los últimos 5s)
                if now - p.get("last_dmg_time", 0) < 5.0:
                    attacker_id = p.get("last_attacker_id")
                    if attacker_id:
                        # Buscar atacante en enemigos
                        attacker = next((e for e in self.enemies if e["id"] == attacker_id), None)
                        if not attacker and attacker_id in self.players:
                            attacker = self.players[attacker_id]
                        
                        if attacker and attacker.get("hp", 0) > 0:
                            a_map = attacker.get("map_id") or attacker.get("current_map")
                            if a_map == p["current_map"]:
                                dist_to_attacker = math.hypot(attacker["x"] - p["x"], attacker["y"] - p["y"])
                                # Rango de ataque del ECO: 600m
                                if dist_to_attacker < 600:
                                    target_x, target_y = attacker["x"], attacker["y"]
                                    attacking = True
                                    target_id = attacker_id
            
                                    target_id = attacker_id
                    
                    # 2.5 Lógica de Autorrecolección (Módulo ECO)
                    collector_range = eco.get("collector_range", 0)
                    if collector_range > 0 and not attacking:
                        # Buscar cajas en el mapa actual dentro del rango del ECO
                        nearby_boxes = [b for b in self.loot_boxes if b.get("map_id") == p["current_map"]]
                        closest_box = None
                        min_dist_to_ship = collector_range
                        
                        for box in nearby_boxes:
                            d_ship_box = math.hypot(box["x"] - p["x"], box["y"] - p["y"])
                            if d_ship_box < min_dist_to_ship:
                                min_dist_to_ship = d_ship_box
                                closest_box = box
                        
                        if closest_box:
                            # El ECO va directo a la caja
                            target_x, target_y = closest_box["x"], closest_box["y"]
                            ideal_dist = 5 # Pegarse a la caja
                            
                            # Si el ECO ya está muy cerca de la caja, recogerla
                            d_eco_box = math.hypot(closest_box["x"] - old_x, closest_box["y"] - old_y)
                            if d_eco_box < 40:
                                if self._try_collect_loot(p, closest_box):
                                    if closest_box in self.loot_boxes:
                                        self.loot_boxes.remove(closest_box)
            
            # 3. Movimiento del ECO (Sistema de Referencia Móvil)
            # Guardamos posición anterior para derivar vx/vy
            old_x = eco.get("x", p["x"])
            old_y = eco.get("y", p["y"])
            
            # El ECO intenta estar a una distancia ideal del objetivo (jugador o atacante)
            dx = target_x - old_x
            dy = target_y - old_y
            dist = math.hypot(dx, dy)
            ideal_dist = 120 if not attacking else 280

            # Calculamos el punto exacto donde el ECO "quiere" estar
            if dist > 0.1:
                target_x_point = target_x - (dx / dist) * ideal_dist
                target_y_point = target_y - (dy / dist) * ideal_dist
            else:
                target_x_point = target_x - ideal_dist
                target_y_point = target_y

            # LÓGICA DE MOVIMIENTO ESTABLE:
            # 1. Primero, movemos el ECO lo mismo que se movió la nave (Inercia base)
            ship_move_x = p.get("vx", 0) * dt
            ship_move_y = p.get("vy", 0) * dt
            
            new_x = old_x + ship_move_x
            new_y = old_y + ship_move_y
            
            # 2. Luego, aplicamos una corrección suave hacia el punto ideal (LERP)
            # Aumentamos el umbral de calma y suavizamos el aterrizaje
            dist_to_ideal = math.hypot(target_x_point - new_x, target_y_point - new_y)
            
            if dist_to_ideal > 8.0: # Umbral de calma aumentado significativamente
                # Factor de suavizado variable: si está a menos de 40px, reduce la velocidad
                arrival_factor = 1.0
                if dist_to_ideal < 40.0:
                    arrival_factor = dist_to_ideal / 40.0
                
                lerp_speed = 5.0 * arrival_factor
                lerp_factor = min(1.0, lerp_speed * dt)
                new_x += (target_x_point - new_x) * lerp_factor
                new_y += (target_y_point - new_y) * lerp_factor

            # 3. Actualizar y derivar velocidades para el frontend (rotación)
            eco["x"] = new_x
            eco["y"] = new_y
            # Aplicamos un filtro de paso bajo a la velocidad para evitar tirones visuales en la rotación
            v_inst_x = (new_x - old_x) / dt if dt > 0 else 0
            v_inst_y = (new_y - old_y) / dt if dt > 0 else 0
            
            eco["vx"] = (eco.get("vx", 0) * 0.7) + (v_inst_x * 0.3)
            eco["vy"] = (eco.get("vy", 0) * 0.7) + (v_inst_y * 0.3)

            # 4. Lógica de Disparo del ECO
            if attacking and target_id and now - eco.get("last_shot", 0) > 0.8:
                # Disparar al atacante
                angle = math.atan2(target_y - eco["y"], target_x - eco["x"])
                self.projectiles.append({
                    "id": f"eco_laser_{pid}_{random.random()}",
                    "owner_id": pid,
                    "is_player": True, # Se trata como daño de jugador para recompensas
                    "x": eco["x"],
                    "y": eco["y"],
                    "vx": math.cos(angle) * 600,
                    "vy": math.sin(angle) * 600,
                    "damage": eco.get("atk", 25),
                    "anti_alien_mult": eco.get("anti_alien_mult", 1.0),
                    "life": 1.0,
                    "map_id": p["current_map"],
                    "color": "#00ffcc" # Color cian para el ECO
                })
                eco["last_shot"] = now
            
            # Regenerar escudo del ECO
            if now - p.get("last_dmg_time", 0) > 5.0: # Si el dueño no recibe daño, el eco regenera
                eco["shield"] = min(eco["max_shield"], eco.get("shield", 0) + (15 * dt))

            p["eco"] = eco


        # --- ACTUALIZAR SUBASTAS (A cada hora en punto local) ---
        from datetime import datetime
        now_dt = datetime.now()
        if now_dt.hour != self.last_reset_hour:
            self.finalize_auctions()
            self.last_reset_hour = now_dt.hour
            print(f"DEBUG: Subasta reiniciada a las {self.last_reset_hour}:00")
            
        # 3. Update Projectiles
        for proj in self.projectiles:
            # --- LÓGICA DE MISILES TELEDIRIGIDOS (HOMING) ---
            if (proj.get("is_missile") or proj.get("is_homing")) and proj.get("target_id"):
                target = next((e for e in self.enemies if e["id"] == proj["target_id"] and e.get("map_id") == proj.get("map_id")), None)
                if not target and proj["target_id"] in self.players and self.players[proj["target_id"]].get("current_map") == proj.get("map_id"):
                    target = self.players[proj["target_id"]]
                
                if target and target.get("hp", 0) > 0:
                    dx = target["x"] - proj["x"]
                    dy = target["y"] - proj["y"]
                    dist = math.hypot(dx, dy)
                    if dist > 5:
                        target_angle = math.atan2(dy, dx)
                        current_angle = math.atan2(proj["vy"], proj["vx"])
                        # Ángulo relativo normalizado
                        diff = (target_angle - current_angle + math.pi) % (2 * math.pi) - math.pi
                        # Velocidad de giro: 15.0 radianes por sec para misiles, 50.0 para lasers (casi instantáneo)
                        turn_rate = 50.0 * dt if proj.get("is_homing") else 15.0 * dt 
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
            
            # 1. SIEMPRE PRIORIZAR PROVOCACIÓN (Override actual target)
            provocation_target = None
            min_prov_dist = 1200 # Rango máximo de influencia
            for pid, p in self.players.items():
                if p["current_map"] == m_id and p["hp"] > 0 and not p.get("in_safe_zone", False) and not p.get("is_invisible", False):
                    if "provocation" in p.get("active_abilities", {}):
                        d = math.hypot(enemy["x"] - p["x"], enemy["y"] - p["y"])
                        if d < min_prov_dist:
                            min_prov_dist = d
                            provocation_target = p
                            enemy["aggro_target"] = pid

            if provocation_target:
                target_player = provocation_target
            else:
                # 2. Si no hay provocación, seguir con el target actual si existe y es válido
                if enemy.get("aggro_target") and enemy["aggro_target"] in self.players:
                    p = self.players[enemy["aggro_target"]]
                    if p["current_map"] == m_id and p["hp"] > 0 and not p.get("in_safe_zone", False) and not p.get("is_invisible", False):
                        target_player = p
                    else:
                        enemy["aggro_target"] = None # Perder rastro
                
                # 3. Si es hunter y no tiene target, buscar el más cercano
                if not target_player and ai_type == "hunter":
                    min_dist = DETECTION_RANGE
                    for pid, p in self.players.items():
                        if p["current_map"] == m_id and p["hp"] > 0 and not p.get("in_safe_zone", False) and not p.get("is_invisible", False):
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
                # Lógica de Movimiento (Mantener distancia de ~300m)
                # Si el usuario se aleja de los 300m, el alien lo persigue usando su velocidad base.
                base_speed = enemy.get("base_speed", 80)
                if dist > 310:
                    # Velocidad de persecución escalada por su base_speed
                    chase_speed = base_speed * 1.3 * enemy.get("speed_mult", 1.0)
                    enemy["vx"] = (dx / dist) * chase_speed
                    enemy["vy"] = (dy / dist) * chase_speed
                elif dist < 290 and dist > 0:
                    # Si el usuario se acerca, el alien mantiene la distancia retrocediendo
                    retreat_speed = base_speed * 0.9 * enemy.get("speed_mult", 1.0)
                    enemy["vx"] = -(dx / dist) * retreat_speed
                    enemy["vy"] = -(dy / dist) * retreat_speed
                else:
                    # Dentro del rango ideal (~300m), detenerse gradualmente o dist=0
                    enemy["vx"], enemy["vy"] = 0, 0

                # Lógica de Ataque (Disparo) - Cada usuario se denomina enemigo de los aliens
                map_lvl = self.MAPS.get(m_id, {}).get("level", 1)
                shot_cooldown = max(0.4, 1.8 - (map_lvl * 0.15)) # Más rápidos en mapas altos
                
                # Lógica de Ataque: Rango de láser fijado a 300 metros
                if dist < 315 and now - enemy.get("last_shot", 0) > shot_cooldown:
                    angle = math.atan2(dy, dx)
                    p_speed = 400 + (map_lvl * 40) 
                    # El alcance es 300m, por lo que life = 300 / p_speed
                    laser_life = 300.0 / p_speed
                    
                    self.projectiles.append({
                        "id": "alien_laser_" + str(random.random()),
                        "owner_id": enemy["id"],
                        "is_player": False,
                        "x": enemy["x"],
                        "y": enemy["y"],
                        "vx": math.cos(angle) * p_speed,
                        "vy": math.sin(angle) * p_speed,
                        "damage": enemy.get("atk", 15),
                        "life": laser_life,
                        "map_id": m_id,
                        "color": "#ff3333"
                    })
                    enemy["last_shot"] = now
            
            # Actualización de posición final para TODOS los tipos de movimiento
            enemy["x"] += enemy["vx"] * dt
            enemy["y"] += enemy["vy"] * dt
            
            # --- LÓGICA DE BORDES (REBOTE) ---
            # Si tocan los bordes del mapa, rebotan invirtiendo velocidad (100% permanencia)
            if enemy["x"] < 50:
                enemy["x"] = 50
                enemy["vx"] = abs(enemy["vx"])
            elif enemy["x"] > self.GAME_WIDTH - 50:
                enemy["x"] = self.GAME_WIDTH - 50
                enemy["vx"] = -abs(enemy["vx"])
                
            if enemy["y"] < 50:
                enemy["y"] = 50
                enemy["vy"] = abs(enemy["vy"])
            elif enemy["y"] > self.GAME_HEIGHT - 50:
                enemy["y"] = self.GAME_HEIGHT - 50
                enemy["vy"] = -abs(enemy["vy"])
        
        # Limpiar eventos antiguos
        self.kill_events = [e for e in self.kill_events if now - e["time"] < 2.5]
        self.loot_events = [e for e in self.loot_events if now - e["time"] < 2.5]
        self.damage_events = [e for e in self.damage_events if now - e["time"] < 1.0]
        self.mission_events = [e for e in self.mission_events if now - e["time"] < 6.0]
        self.destruction_events = [e for e in self.destruction_events if now - e["time"] < 3.0]
                
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
                    # Radio colisión mayor para armas de jugadores (100% efectividad/puntería)
                    laser_hit_radius = 80 if p.get("is_homing") else 35 
                    if dist < laser_hit_radius or (p.get("is_missile") and dist < 60): 
                        # Solo aplicar daño si NO es munición Sifón
                        if p.get("ammo_type") != "siphon":
                            # 100% EFECTIVIDAD: Los jugadores ignoran la defensa del alien
                            final_damage = p["damage"] 
                            if p.get("anti_alien_mult"):
                                final_damage *= p["anti_alien_mult"]
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
                                
                                # Boss multipliers (x4 as requested)
                                reward_mult = 4.0 if e.get("is_boss") else 1.0
                                # Hard multiplier (x2 for XP and Credits, x3 for Paladio as per original logic)
                                hard_mult = 2.0 if e.get("is_hard") else 1.0
                                pal_hard_mult = 3.0 if e.get("is_hard") else 1.0
                                
                                base_kill_credits = e.get("reward_credits", 250) * reward_mult * hard_mult
                                base_kill_xp = e.get("reward_xp", 100) * reward_mult * hard_mult
                                paladio_reward = e.get("reward_paladio", 1) * reward_mult * pal_hard_mult
                                
                                player["score"] += int(base_kill_xp)
                                player["credits"] += int(base_kill_credits)
                                player["paladio"] = player.get("paladio", 0) + paladio_reward
                                self.gain_xp(player, int(base_kill_xp)) 
                                
                                # Registrar evento de recompensa para el HUD
                                self.kill_events.append({
                                    "id": str(random.random()),
                                    "x": e["x"],
                                    "y": e["y"],
                                    "xp": int(base_kill_xp),
                                    "credits": int(base_kill_credits),
                                    "paladio": int(paladio_reward),
                                    "time": now,
                                    "owner_id": p["owner_id"]
                                })
                                
                                # Actualizar progreso de misión para el jugador
                                self._update_mission_progress(player, e["name"])
                                
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
                                        "silicon": random.randint(1, 4),
                                        "iridium": random.randint(1, 3)
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
                                            # Boss multipliers (x4 as requested)
                                            reward_mult = 4.0 if e.get("is_boss") else 1.0
                                            hard_mult = 2.0 if e.get("is_hard") else 1.0
                                            pal_hard_mult = 3.0 if e.get("is_hard") else 1.0

                                            base_shared_credits = e.get("reward_credits", 250) * reward_mult * hard_mult
                                            base_shared_xp = e.get("reward_xp", 100) * reward_mult * hard_mult
                                            paladio_shared = e.get("reward_paladio", 1) * reward_mult * pal_hard_mult
                                            
                                            m["credits"] += int(base_shared_credits)
                                            m["paladio"] = m.get("paladio", 0) + int(paladio_shared)
                                            self.gain_xp(m, int(base_shared_xp))
                                            # Actualizar progreso de misión para el compañero de grupo
                                            self._update_mission_progress(m, e["name"])
                                            # Evento visual para el compañero
                                            self.kill_events.append({
                                                "id": str(random.random()),
                                                "x": e["x"], "y": e["y"],
                                                "xp": int(base_shared_xp), "credits": int(base_shared_credits), "paladio": int(paladio_shared),
                                                "time": now, "owner_id": member_id, "is_party_share": True
                                            })
                        break
                # Check contra jugadores
                for pid, target in self.players.items():
                    if p["owner_id"] == pid: continue # No friendly fire
                    if target["hp"] <= 0: continue
                    if p.get("map_id") != target.get("current_map"): continue # FIX: Map check
                    # Comprobar habilidad de invulnerabilidad
                    if "invulnerability" in target.get("active_abilities", {}): continue

                    dist = math.hypot(p["x"] - target["x"], p["y"] - target["y"])
                    if dist < 20:
                        damage = p["damage"]
                        target["last_dmg_time"] = now
                        target["last_attacker_id"] = p["owner_id"]
                        # DAMAGE LOGIC WITH ABSORPTION (PvP)
                        abs_rate = target.get("shield_absorption", 0.8)
                        shld_dmg = damage * abs_rate
                        hp_dmg = damage * (1 - abs_rate)

                        if target["shld"] >= shld_dmg:
                            target["shld"] -= shld_dmg
                        else:
                            rem = shld_dmg - target["shld"]
                            target["shld"] = 0
                            hp_dmg += rem

                        target["hp"] -= hp_dmg
                        
                        # Trigger Kamikaze if HP < 20%
                        if target["hp"] > 0 and target["hp"] < target["max_hp"] * 0.2:
                            self.trigger_eco_kamikaze(pid)

                        hit = True
                        break
            else:
                # PROYECTILES DE ALIENS -> JUGADORES
                for pid, target in self.players.items():
                    if target["hp"] <= 0 or target.get("in_safe_zone"): continue
                    if p.get("map_id") != target.get("current_map"): continue
                    # Comprobar habilidad de invulnerabilidad
                    if "invulnerability" in target.get("active_abilities", {}): continue

                    dist = math.hypot(p["x"] - target["x"], p["y"] - target["y"])
                    if dist < 25: # Colisión un poco más generosa para aliens
                        damage = p["damage"]
                        target["last_dmg_time"] = now
                        target["last_attacker_id"] = p["owner_id"]
                        # DAMAGE LOGIC WITH ABSORPTION (PvE)
                        abs_rate = target.get("shield_absorption", 0.8)
                        shld_dmg = damage * abs_rate
                        hp_dmg = damage * (1 - abs_rate)

                        if target["shld"] >= shld_dmg:
                            target["shld"] -= shld_dmg
                        else:
                            rem = shld_dmg - target["shld"]
                            target["shld"] = 0
                            hp_dmg += rem

                        target["hp"] -= hp_dmg
                        
                        # Trigger Kamikaze if HP < 20%
                        if target["hp"] > 0 and target["hp"] < target["max_hp"] * 0.2:
                            self.trigger_eco_kamikaze(pid)
                        
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
            if now - box["spawn_time"] > 20: 
                continue # expiró
                
            taken = False
            for pid, player in self.players.items():
                if player["hp"] <= 0: continue
                if box.get("map_id") != player.get("current_map"): continue
                
                dist = math.hypot(box["x"] - player["x"], box["y"] - player["y"])
                if dist < 30:
                    if self._try_collect_loot(player, box):
                        taken = True
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
                    
                    # Si la colisión mata al alien, contar progreso de misión
                    if e["hp"] <= 0:
                        self._update_mission_progress(p, e["name"])
                        # Si está en grupo, dar crédito a los demás también
                        if p.get("party_id") and p["party_id"] in self.parties:
                            party = self.parties[p["party_id"]]
                            for member_id in party["members"]:
                                if member_id == pid: continue
                                if member_id in self.players:
                                    m = self.players[member_id]
                                    if m["current_map"] == e["map_id"]:
                                        self._update_mission_progress(m, e["name"])
        self.enemies = [e for e in self.enemies if e["hp"] > 0]

        # 8. Update Beacons (Habilidades Helix Support)
        alive_beacons = []
        do_tick = (now - self.last_beacon_update >= 2.0)
        if do_tick:
            self.last_beacon_update = now

        for b in self.beacons:
            if now > b["expiry"]:
                continue
            
            if do_tick:
                # Aplicar efecto a jugadores cercanos en el mismo mapa
                for pid, p in self.players.items():
                    if p["hp"] <= 0: continue
                    if p["current_map"] != b["map_id"]: continue
                    
                    # Solo curar aliados (Misma facción o misma Party)
                    is_ally = (p.get("faction") == b.get("faction")) or \
                              (p.get("party_id") and p.get("party_id") == self.players.get(b["owner_id"], {}).get("party_id"))

                    if not is_ally: continue

                    dist = math.hypot(p["x"] - b["x"], p["y"] - b["y"])
                    if dist <= b["radius"]:
                        if b["type"] == "heal":
                            if p["hp"] < p["max_hp"]:
                                heal_amt = min(b["power"], p["max_hp"] - p["hp"])
                                p["hp"] += heal_amt
                                self.loot_events.append({
                                    "type": "heal", "amount": int(heal_amt),
                                    "x": p["x"], "y": p["y"], "time": now, "owner_id": pid
                                })
                        elif b["type"] == "shield":
                            if p["shld"] < p["max_shld"]:
                                shld_amt = min(b["power"], p["max_shld"] - p["shld"])
                                p["shld"] += shld_amt
                                self.damage_events.append({
                                    "id": f"shld_{pid}_{now}",
                                    "x": p["x"] + random.randint(-15, 15),
                                    "y": p["y"] + random.randint(-15, 15),
                                    "amount": int(shld_amt), "time": now, "owner_id": pid, "color": "#00ccff"
                                })
            alive_beacons.append(b)
        self.beacons = alive_beacons

    def spawn_alien(self, map_id="mars_1"):
        if map_id == "neutral_1":
            return
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
        
        # --- LÓGICA DE BOSS ---
        # Drakon no tendrá versión boss por petición del usuario
        is_boss = (random.random() < 0.15) if alien_name != "Drakon" else False
        
        # Base stats
        if alien_name in self.ALIEN_STATS:
            base_hp = self.ALIEN_STATS[alien_name]["hp"]
            base_shld = self.ALIEN_STATS[alien_name]["shld"]
            atk_val = self.ALIEN_STATS[alien_name]["atk"]
            base_speed_val = self.ALIEN_STATS[alien_name].get("speed", 80)
            if isinstance(atk_val, list):
                base_atk = random.randint(atk_val[0], atk_val[1])
            else:
                base_atk = atk_val
        else:
            base_hp = 120 * level_mult
            base_shld = 60 * level_mult
            base_atk = 18 * level_mult
            base_speed_val = 60
        
        final_name = f"Boss {alien_name}" if is_boss else alien_name
        stat_boss_mult = 4.0 if is_boss else 1.0
        size_mult = 1.6 if is_boss else 1.0

        # Base rewards
        if alien_name in self.ALIEN_STATS:
            base_reward_xp = self.ALIEN_STATS[alien_name]["xp"]
            base_reward_credits = self.ALIEN_STATS[alien_name]["credits"]
            base_reward_paladio = self.ALIEN_STATS[alien_name]["paladio"]
        else:
            base_reward_xp = 100
            base_reward_credits = 250
            base_reward_paladio = lvl

        self.enemies.append({
            "id": alien_id,
            "name": final_name,
            "x": random.randint(100, self.GAME_WIDTH - 100),
            "y": random.randint(100, self.GAME_HEIGHT - 100),
            "hp": int(base_hp * (2.8 if is_hard else 1.0) * stat_boss_mult),
            "max_hp": int(base_hp * (2.8 if is_hard else 1.0) * stat_boss_mult),
            "shield": int(base_shld * (3.5 if is_hard else 1.0) * stat_boss_mult),
            "max_shield": int(base_shld * (3.5 if is_hard else 1.0) * stat_boss_mult),
            "atk": int(base_atk * (2.2 if is_hard else 1.0) * stat_boss_mult),
            "vx": random.uniform(-base_speed_val, base_speed_val) * speed_mult,
            "vy": random.uniform(-base_speed_val, base_speed_val) * speed_mult,
            "speed_mult": speed_mult, # Guardar para la lógica de persecución
            "base_speed": base_speed_val, # Guardar base para IA
            "map_id": map_id,
            "level": lvl, # Guardar nivel para recompensas
            "defense": defense, # Resistencia porcentual
            "is_hard": is_hard,
            "is_boss": is_boss,
            "size_mult": size_mult,
            "ai_type": "hunter", # Todos los aliens son agresivos ahora (cazan al usuario enemigo)
            "aggro_target": None,
            "reward_xp": base_reward_xp,
            "reward_credits": base_reward_credits,
            "reward_paladio": base_reward_paladio,
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
    
    def _apply_mission_rewards(self, player, rewards):
        """Aplica las recompensas de una misión al jugador en memoria."""
        self.gain_xp(player, rewards.get("xp", 0))
        player["credits"] += rewards.get("credits", 0)
        player["paladio"] = player.get("paladio", 0) + rewards.get("paladio", 0)
        
        # Munición
        if "ammo" in rewards:
            for k, v in rewards["ammo"].items():
                if k.startswith("missile_"):
                    # Asegurar que missiles existe
                    if "missiles" not in player: player["missiles"] = {}
                    player["missiles"][k] = player["missiles"].get(k, 0) + v
                else:
                    if "ammo" not in player: player["ammo"] = {}
                    player["ammo"][k] = player["ammo"].get(k, 0) + v
        
        # Recalcular estadísticas por si subió de nivel
        self.recalculate_player_stats(player)
    def recalculate_player_stats(self, player):
        """Recalcula las estadísticas finales sumando base + módulos + mejoras temporales."""
        # Reiniciar a base
        # Reiniciar a base usando valores persistentes si existen, de lo contrario fallback a defaults
        player["atk"] = player.get("base_atk", 70)
        player["spd"] = player.get("base_spd", 60)
        player["max_shld"] = player.get("base_max_shld", 150)
        player["max_hp"] = player.get("base_max_hp", 180)
        player["max_cargo"] = player.get("base_max_cargo", 100) # Default to 100 for Phoenix if not found
        player["shield_absorption"] = 0.8 # Default 80%

        # 1. Sumar Módulos Equipados
        player["lasers"] = 0
        player["engines"] = 0
        player["shields"] = 0
        player["repair_rate"] = 0 # Reiniciar tasa de reparación
        player["has_auto_repair"] = False
        player["has_turbo_missile"] = False
        player["has_auto_missile"] = False
        player["has_cargo_compressor"] = False
        
        # Para el cálculo del color del láser
        heavy_cannon_count = 0
        
        # Para el cálculo del promedio ponderado de absorción
        total_shld_for_abs = 0
        weighted_abs_sum = 0
        
        for mod in player.get("equipped", []):
            # SEGURIDAD: Los protocolos NUNCA afectan a la nave principal ni a los Wips
            # Filtramos por tipo y por ID para evitar cualquier fuga de estadísticas
            m_type = str(mod.get("type", "")).lower()
            m_id = str(mod.get("id", "")).lower()
            if "protocol" in m_type or "proto" in m_id:
                continue

            if "atk" in mod: player["atk"] += mod["atk"]
            if "shld" in mod: 
                s_val = mod["shld"]
                player["max_shld"] += s_val
                # Si el módulo tiene absorción específica, usarla para el promedio
                if "absorption" in mod:
                    weighted_abs_sum += (s_val * mod["absorption"])
                    total_shld_for_abs += s_val

            if "spd" in mod: player["spd"] += mod["spd"]
            if "hp" in mod: player["max_hp"] += mod["hp"]
            if "repair_rate" in mod: player["repair_rate"] += mod["repair_rate"]
            if mod.get("is_auto_repair"): player["has_auto_repair"] = True
            if mod.get("is_turbo_missile"): player["has_turbo_missile"] = True
            if mod.get("is_auto_missile"): 
                player["has_auto_missile"] = True
                # Asegurar que tiene un tipo de misil seleccionado si no tiene ninguno o se acaba de equipar
                if not player.get("missile_type"):
                    player["missile_type"] = "missile_1"
            if mod.get("is_cargo_compressor"): player["has_cargo_compressor"] = True

            # Recount for visuals
            m_type = mod.get("type", "")
            if m_type == "lasers": 
                player["lasers"] += 1
                if mod.get("id") == "laser_3":
                    heavy_cannon_count += 1
            if m_type == "shields": 
                player["shields"] += 1

        # 1.5. Sumar Módulos de Wips (Drones)
        for wip in player.get("wips", []):
            for mod in wip.get("equipped", []):
                # SEGURIDAD: Los protocolos solo afectan al ECO
                m_type = str(mod.get("type", "")).lower()
                m_id = str(mod.get("id", "")).lower()
                if "protocol" in m_type or "proto" in m_id:
                    continue

                if "atk" in mod: player["atk"] += mod["atk"]
                if "shld" in mod: 
                    s_val = mod["shld"]
                    player["max_shld"] += s_val
                    if "absorption" in mod:
                        weighted_abs_sum += (s_val * mod["absorption"])
                        total_shld_for_abs += s_val

                if "spd" in mod: player["spd"] += mod["spd"]
                if "hp" in mod: player["max_hp"] += mod["hp"]
                if "repair_rate" in mod: player["repair_rate"] += mod["repair_rate"]
                if mod.get("is_auto_repair"): player["has_auto_repair"] = True
                if mod.get("is_turbo_missile"): player["has_turbo_missile"] = True
                if mod.get("is_auto_missile"): player["has_auto_missile"] = True
                if mod.get("is_cargo_compressor"): player["has_cargo_compressor"] = True
                
                # Recount for visuals (las drones incrementan el poder de fuego visual)
                m_type = mod.get("type", "")
                if m_type == "lasers": 
                    player["lasers"] += 1
                    if mod.get("id") == "laser_3":
                        heavy_cannon_count += 1
                if m_type == "shields": player["shields"] += 1

        # Finalizar cálculo de absorción (si hay escudos con absorción)
        if total_shld_for_abs > 0:
            player["shield_absorption"] = weighted_abs_sum / total_shld_for_abs

        # Aplicar multiplicadores finales de extras
        if player.get("has_cargo_compressor"):
            player["max_cargo"] *= 2

        # --- DETERMINAR COLOR DEL LÁSER ---
        # El usuario quiere que si TODAS las ranuras de armas tienen Cañón Pesado (laser_3), el color sea verde.
        # De lo contrario (para muni estándar/térmica/plasma), será rojo.
        ship_type = player.get("ship_type", "starter")
        ship_laser_slots = self.SHIP_PROFILES.get(ship_type, {}).get("slots", {}).get("lasers", 0)
        total_available_slots = ship_laser_slots
        for wip in player.get("wips", []):
            total_available_slots += wip.get("slots", 0)
        
        # Si tiene equipados tantos Cañones Pesados como ranuras totales disponibles, activamos el flag
        player["all_heavy_cannons"] = (heavy_cannon_count >= total_available_slots) and (total_available_slots > 0)

        # 1.6 Sumar Módulos de E.C.O. (Solo si está activo Y desplegado)
        eco = player.get("eco", {})
        if eco.get("active") and eco.get("deployed"):
            # Los protocolos ahora solo afectan al propio E.C.O. para potenciar su rendimiento individual
            pass

        # --- CALCULO DE STATS PROPIAS DEL E.C.O. ---
        eco = player.get("eco", {})
        if eco.get("active"):
            # Base stats del dron (Ahora dependen del equipo)
            lvl_mult = 1 + (eco.get("level", 1) * 0.05)
            eco["max_shield"] = 0 
            eco["atk"] = 0 
            eco["max_hp"] = 50000
            eco["max_integrity"] = 50000
            if "max_fuel" not in eco: eco["max_fuel"] = 100000
            # Sincronizar velocidad con la nave principal (multiplicador aumentado a 4.0 para ser siempre superior)
            eco["speed"] = player["spd"] * 4.0
            
            if eco.get("deployed"):
                # Sumar módulos equipados específicamente en el ECO
                equipped = eco.get("equipped", {})
                
                # 1. Calcular multiplicadores de protocolos
                radar_bonus = 0
                laser_bonus = 0
                hp_bonus = 0
                econ_bonus = 0
                anti_alien_bonus = 0
                for mods in equipped.values():
                    for mod in mods:
                        if mod.get("radar_bonus"):
                            radar_bonus += mod["radar_bonus"]
                        if mod.get("laser_bonus"):
                            laser_bonus += mod["laser_bonus"]
                        if mod.get("hp_bonus"):
                            hp_bonus += mod["hp_bonus"]
                        if mod.get("econ_bonus"):
                            econ_bonus += mod["econ_bonus"]
                        if mod.get("anti_alien_bonus"):
                            anti_alien_bonus += mod["anti_alien_bonus"]
                
                radar_mult = 1.0 + radar_bonus
                laser_mult = 1.0 + laser_bonus
                hp_mult = 1.0 + hp_bonus
                eco["fuel_efficiency_mult"] = max(0.1, 1.0 - econ_bonus)
                eco["anti_alien_mult"] = 1.0 + anti_alien_bonus

                for cat, mods in equipped.items():
                    for mod in mods:
                        if "atk" in mod: eco["atk"] += mod["atk"]
                        if "shld" in mod: eco["max_shield"] += mod["shld"]
                        if "spd" in mod: eco["speed"] += mod["spd"]
                        if "hp" in mod: eco["max_hp"] += mod["hp"]
                        
                        # Autorrecolector
                        if "range" in mod and "eco_coll" in mod.get("id", ""):
                            eco["collector_range"] = max(eco.get("collector_range", 0), mod["range"] * radar_mult)
                        
                        # Rastreador de Enemigos
                        if "range" in mod and "eco_track" in mod.get("id", ""):
                            eco["tracker_range"] = max(eco.get("tracker_range", 0), mod["range"] * radar_mult)

                        # Kamikaze
                        if "damage" in mod and "eco_kami" in mod.get("id", ""):
                            eco["kamikaze_damage"] = max(eco.get("kamikaze_damage", 0), mod["damage"])
                            eco["kamikaze_radius"] = max(eco.get("kamikaze_radius", 0), mod["radius"])

                        # Protocolos del ECO (bonos directos a sus propias stats)
                        if mod.get("type") == "protocol" or mod.get("type") == "protocols":
                            if "atk_bonus" in mod: eco["atk"] *= (1 + mod["atk_bonus"])
                            if "shld_bonus" in mod: eco["max_shield"] *= (1 + mod["shld_bonus"])
                            if "spd_bonus" in mod: eco["speed"] *= (1 + mod["spd_bonus"])

                # Aplicar multiplicadores finales de protocolos
                eco["atk"] *= laser_mult
                eco["max_hp"] *= hp_mult

                # El nivel del dron potencia el equipo instalado (total final)
                eco["max_shield"] *= lvl_mult
                eco["atk"] *= lvl_mult
            
            # Asegurar consistencia de escudo e integridad actual
            if "shield" not in eco: eco["shield"] = eco["max_shield"]
            eco["shield"] = min(eco["shield"], eco["max_shield"])
            
            # FORZAR ESTADÍSTICAS DEL E.C.O. (CERRADO POR PETICIÓN)
            eco["max_hp"] = 50000
            eco["max_integrity"] = 50000
            eco["max_fuel"] = 100000
            
            # La integridad es el valor actual de vida
            if "integrity" not in eco or eco["integrity"] <= 100: eco["integrity"] = 50000
            eco["integrity"] = min(eco["integrity"], eco["max_integrity"])
            
            # Redondear combustible para evitar decimales en el cliente
            eco["fuel"] = int(eco.get("fuel", 0))
            
            player["eco"] = eco

        # 2. Sumar Mejoras Temporales (Laboratorio) - ACUMULATIVO (%)
        if "timed_upgrades" in player:
            for stat_key in ["atk", "shld", "spd", "hp"]:
                # Sumamos todos los porcentajes acumulados (ej: 5 + 5 = 10%)
                percent_total = sum(u.get("amount", 0) for u in player["timed_upgrades"].get(stat_key, []))
                if percent_total > 0:
                    mult = 1.0 + (percent_total / 100.0)
                    if stat_key == "shld":
                        player["max_shld"] *= mult
                    elif stat_key == "hp":
                        player["max_hp"] *= mult
                    else:
                        player[stat_key] *= mult

        # 3. Aplicar Bonos de Diseño Legendario
        design_id = player.get("equipped_design")
        if design_id:
            DESIGNS_BONUSES = {
                "design_support_emerald": {"hp": 0.10, "shld": 0.10},
                "design_sovereign_ember_fang": {"atk": 0.15, "spd": 0.05},
                "design_harvester_industrial": {"atk": 0.20},
                "design_solar_wind_eclipse": {"shld": 0.10, "absorption": 0.05},
                "design_bastion_celestial": {"hp": 0.15, "shld": 0.15, "absorption": 0.15}
            }
            bonus = DESIGNS_BONUSES.get(design_id)
            if bonus:
                if "hp" in bonus: player["max_hp"] *= (1 + bonus["hp"])
                if "shld" in bonus: player["max_shld"] *= (1 + bonus["shld"])
                if "atk" in bonus: player["atk"] *= (1 + bonus["atk"])
                if "spd" in bonus: player["spd"] *= (1 + bonus["spd"])
                if "absorption" in bonus: player["shield_absorption"] += bonus["absorption"]

        # 3.5. Aplicar Habilidades Activas
        if "shield_reinforcement" in player.get("active_abilities", {}):
            player["max_shld"] *= 1.15

        # 4. Asegurar Enteros para evitar decimales en HUD
        player["max_hp"] = int(player["max_hp"])
        player["max_shld"] = int(player["max_shld"])
        player["hp"] = int(player["hp"])
        player["shld"] = int(player["shld"])
        player["atk"] = int(player["atk"])
        player["spd"] = int(player["spd"])

        # Ajustar valores actuales si el máximo bajó
        player["shld"] = min(player["shld"], player["max_shld"])
        player["hp"] = min(player["hp"], player["max_hp"])

    def trigger_eco_kamikaze(self, player_id):
        if player_id not in self.players:
            return
            
        player = self.players[player_id]
        eco = player.get("eco", {})
        
        # Verificar si tiene el módulo y si está desplegado
        if not eco.get("active") or not eco.get("deployed"):
            return
            
        damage = eco.get("kamikaze_damage", 0)
        radius = eco.get("kamikaze_radius", 0)
        
        if damage <= 0 or radius <= 0:
            return
            
        # Cooldown o bandera para evitar triggers múltiples
        if eco.get("kamikaze_triggered_time") and time.time() - eco["kamikaze_triggered_time"] < 10.0:
            return
            
        eco["kamikaze_triggered_time"] = time.time()
        now = time.time()
        
        # 1. Crear evento de explosión masiva
        self.destruction_events.append({
            "id": f"kamikaze_{player_id}_{now}",
            "x": eco["x"],
            "y": eco["y"],
            "type": "kamikaze_explosion", 
            "radius": radius,
            "time": now,
            "owner_id": player_id
        })
        
        # 2. Aplicar daño expansivo a enemigos cercanos
        for enemy in self.enemies:
            if enemy.get("map_id") != player.get("current_map"): continue
            
            dist = math.hypot(enemy["x"] - eco["x"], enemy["y"] - eco["y"])
            if dist <= radius:
                enemy["hp"] -= damage
                
                # Registrar daño individual
                self.damage_events.append({
                    "id": f"kami_dmg_{enemy['id']}_{now}",
                    "x": enemy["x"], "y": enemy["y"],
                    "amount": int(damage), "time": now, "owner_id": player_id
                })
                
                # Si el alien muere por la explosión, darle las recompensas al jugador
                if enemy["hp"] <= 0:
                    # Boss multipliers (x4 as requested)
                    reward_mult = 4.0 if enemy.get("is_boss") else 1.0
                    hard_mult = 2.0 if enemy.get("is_hard") else 1.0
                    pal_hard_mult = 3.0 if enemy.get("is_hard") else 1.0

                    base_kill_credits = enemy.get("reward_credits", 250) * reward_mult * hard_mult
                    base_kill_xp = enemy.get("reward_xp", 100) * reward_mult * hard_mult
                    paladio_reward = enemy.get("reward_paladio", 1) * reward_mult * pal_hard_mult
                    
                    player["score"] += int(base_kill_xp)
                    player["credits"] += int(base_kill_credits)
                    player["paladio"] = player.get("paladio", 0) + int(paladio_reward)
                    self.gain_xp(player, int(base_kill_xp))
                    
                    self.kill_events.append({
                        "id": f"kami_kill_{enemy['id']}_{now}",
                        "x": enemy["x"], "y": enemy["y"],
                        "xp": int(base_kill_xp), "credits": int(base_kill_credits), "paladio": int(paladio_reward),
                        "time": now, "owner_id": player_id
                    })

        # 3. El ECO se destruye/desactiva
        eco["active"] = False
        eco["integrity"] = 0
        eco["deployed"] = False
        player["eco"] = eco

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
        
        had_auto = player.get("has_auto_missile", False)
        player["equipped"].append(module_data)
        self.recalculate_player_stats(player)
        if not had_auto and player.get("has_auto_missile"):
            self._send_sys_msg(client_id, "🛰️ CPU DE MISIL AUTOMÁTICO EQUIPADA. Selecciona un misil para comenzar el fuego automático al atacar.")

    def update_equipped_modules(self, client_id, modules):
        """Sincroniza el equipamiento completo en tiempo real (solo en zona segura)."""
        if client_id not in self.players: return
        player = self.players[client_id]
        
        # Solo permitir cambios de equipamiento en zona segura
        if not player.get("in_safe_zone", False):
            print(f"Intento de cambio de equipamiento fuera de zona segura para {client_id}")
            return
            
        had_auto = player.get("has_auto_missile", False)
        player["equipped"] = modules if isinstance(modules, list) else []
        self.recalculate_player_stats(player)
        
        if not had_auto and player.get("has_auto_missile"):
            self._send_sys_msg(client_id, "🛰️ CPU DE MISIL AUTOMÁTICO EQUIPADA. Selecciona un misil para comenzar el fuego automático al atacar.")

    def use_ability(self, client_id, ability_id):
        """Activa una habilidad especial de la nave si está disponible y fuera de cooldown."""
        if client_id not in self.players: return
        player = self.players[client_id]
        now = time.time()
        ship_type = player.get("ship_type", "starter")
        
        # 1. Validar disponibilidad por tipo de nave
        ALLOWED_ABILITIES = {
            "bastion": ["provocation", "shield_reinforcement"],
            "support": ["beacon_heal", "beacon_shield"],
            "interceptor": ["invulnerability", "advanced_invisibility"]
        }
        
        if ship_type not in ALLOWED_ABILITIES or ability_id not in ALLOWED_ABILITIES[ship_type]:
            print(f"DEBUG: Habilidad rechazada. Ship: {ship_type}, Ability: {ability_id}, Allowed: {ALLOWED_ABILITIES.get(ship_type)}")
            self._send_sys_msg(client_id, "⚠️ Tu nave no dispone de esta habilidad avanzada.")
            return
            
        # 2. Configuración de parámetros
        now = time.time()
        ABILITIES_CONFIG = {
            "provocation": {"duration": 10, "cooldown": 90},
            "shield_reinforcement": {"duration": 10, "cooldown": 60},
            "beacon_heal": {"duration": 10, "cooldown": 60},
            "beacon_shield": {"duration": 10, "cooldown": 60},
            "invulnerability": {"duration": 7, "cooldown": 60},
            "advanced_invisibility": {"duration": 7, "cooldown": 60}
        }
        
        if ability_id not in ABILITIES_CONFIG:
            return
            
        config = ABILITIES_CONFIG[ability_id]
        
        # 3. Verificar Cooldown
        last_ready = player.get("ability_cooldowns", {}).get(ability_id, 0)
        if now < last_ready:
            rem = int(last_ready - now)
            self._send_sys_msg(client_id, f"⏳ Habilidad en recarga. Espera {rem}s.")
            return
            
        # 4. Activar Habilidad
        player["active_abilities"][ability_id] = now + config["duration"]
        player["ability_cooldowns"][ability_id] = now + config["cooldown"]
        
        # 5. Ejecutar efectos específicos
        if ability_id == "shield_reinforcement":
            old_max = player["max_shld"]
            self.recalculate_player_stats(player)
            new_max = player["max_shld"]
            player["shld"] = int(player["shld"] * (new_max / old_max)) if old_max > 0 else player["shld"]
            self._send_sys_msg(client_id, "🛡️ REFUERZO DE ESCUDO ACTIVADO (+15% MAX SHIELD)")
            
        elif ability_id == "provocation":
            m_id = player.get("current_map")
            for en in self.enemies:
                if en.get("map_id") == m_id:
                    d = math.hypot(en["x"] - player["x"], en["y"] - player["y"])
                    if d < 1000:
                        en["aggro_target"] = client_id
                        en["state"] = "hunting"
            self._send_sys_msg(client_id, "📣 PROVOCACIÓN ACTIVADA: ¡Todos los enemigos te atacan!")
            
        elif ability_id == "invulnerability":
            self._send_sys_msg(client_id, "✨ INVULNERABILIDAD ACTIVADA (7s)")

        elif ability_id == "advanced_invisibility":
            player["is_invisible"] = True
            self._send_sys_msg(client_id, "👻 INVISIBILIDAD AVANZADA ACTIVADA (7s)")
            
        elif ability_id == "beacon_heal":
            beacon = {
                "id": f"beacon_hp_{client_id}_{now}",
                "x": player["x"], "y": player["y"],
                "type": "heal",
                "radius": 350,
                "power": 10000,
                "owner_id": client_id,
                "owner_name": player.get("name", "Piloto"),
                "faction": player.get("faction"),
                "map_id": player["current_map"],
                "expiry": now + config["duration"]
            }
            self.beacons.append(beacon)
            self._send_sys_msg(client_id, "🔧 Reparación de Vida desplegada.")
            
        elif ability_id == "beacon_shield":
            beacon = {
                "id": f"beacon_shld_{client_id}_{now}",
                "x": player["x"], "y": player["y"],
                "type": "shield",
                "radius": 350,
                "power": 10000,
                "owner_id": client_id,
                "owner_name": player.get("name", "Piloto"),
                "faction": player.get("faction"),
                "map_id": player["current_map"],
                "expiry": now + config["duration"]
            }
            self.beacons.append(beacon)
            self._send_sys_msg(client_id, "🛡️ Reparación de Escudo desplegada.")

    def update_wips(self, client_id, wips):
        """Sincroniza el sistema de drones Wips (solo en zona segura)."""
        if client_id not in self.players: return
        player = self.players[client_id]
        
        # Solo permitir cambios de equipamiento en zona segura
        if not player.get("in_safe_zone", False):
            print(f"Intento de cambio de drones fuera de zona segura para {client_id}")
            return
            
        player["wips"] = wips if isinstance(wips, list) else []
        self.recalculate_player_stats(player)
        print(f"Drones Wips sincronizados para {client_id}: {len(player['wips'])} drones.")

    # Los métodos de ECO se han consolidado al final del archivo para evitar duplicados.

    def update_timed_upgrades(self, client_id, updates):
        """Sincroniza las mejoras temporales del laboratorio en tiempo real (pestaña Lab -> Juego)."""
        if client_id not in self.players: return
        player = self.players[client_id]
        
        if not updates or not isinstance(updates, dict):
            return

        # Guardar máximos actuales antes del cambio para aplicar el "curado" proporcional o directo
        old_max_shld = player.get("max_shld", 0)
        old_max_hp = player.get("max_hp", 0)

        # Actualizar el diccionario de mejoras temporales (Ahora incluye HP)
        player["timed_upgrades"] = {
            "atk": updates.get("atk", []),
            "shld": updates.get("shld", []),
            "spd": updates.get("spd", []),
            "hp": updates.get("hp", [])
        }
        
        # Persistir en base de datos inmediatamente para que sea "acumulable" y no se pierda
        if "guest" not in client_id:
             try:
                # Usar los valores actuales del jugador
                from database import sync_user_stats
                sync_user_stats(
                    player["user_id"], 
                    player["level"], player["xp"], player["credits"], player["paladio"],
                    timed_upgrades=player["timed_upgrades"]
                )
                print(f"Mejoras persistidas en DB para {client_id}")
             except Exception as e:
                print(f"Error persistiendo mejoras para {client_id}: {e}")

        # Aplicar cambios a las estadísticas máximas
        self.recalculate_player_stats(player)

        # SI EL MÁXIMO AUMENTÓ (por el nuevo refinamiento), sumar la diferencia al actual
        # Esto cumple con: "si tenía 230 y refino +50, pásame a 280"
        if player["max_shld"] > old_max_shld:
            diff = player["max_shld"] - old_max_shld
            player["shld"] = min(player["max_shld"], player["shld"] + diff)
            
        if player["max_hp"] > old_max_hp:
            diff = player["max_hp"] - old_max_hp
            player["hp"] = min(player["max_hp"], player["hp"] + diff)
        
        print(f"Mejoras de laboratorio sincronizadas (+Salud/Escudo aplicado) para {client_id}.")

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

    def toggle_repair(self, client_id):
        if client_id in self.players:
            player = self.players[client_id]
            if player.get("repair_rate", 0) > 0:
                player["repair_bot_active"] = not player.get("repair_bot_active", False)
                print(f"Repair bot toggled for {client_id}: {player['repair_bot_active']}")


    def use_cloak(self, client_id):
        if client_id not in self.players: return
        player = self.players[client_id]
        
        if player.get("is_invisible"):
            self._send_sys_msg(client_id, "ℹ️ Ya eres invisible.")
            return

        # Buscar un CPU de camuflaje con cargas entre los equipados
        cloak_module = None
        for mod in player.get("equipped", []):
            if mod.get("is_cloak_cpu") and mod.get("charges", 0) > 0:
                cloak_module = mod
                break
        
        if cloak_module:
            cloak_module["charges"] -= 1
            player["is_invisible"] = True
            self._send_sys_msg(client_id, f"🎭 Camuflaje activado. Quedan {cloak_module['charges']} cargas en este CPU.")
            
            # Persistir inmediatamente
            if player.get("user_id") and "guest" not in client_id:
                try:
                    from database import sync_user_stats
                    sync_user_stats(
                        player["user_id"], 
                        player["level"], player["xp"], player["credits"], player["paladio"],
                        equipped=player["equipped"],
                        is_invisible=True
                    )
                except: pass
        else:
            self._send_sys_msg(client_id, "⚠️ No tienes CPUs de camuflaje con cargas equipadas.")

    def switch_ship(self, client_id, ship_type):
        """Cambia la nave del jugador en tiempo real actualizando sus estadísticas base."""
        if client_id not in self.players:
            return
        
        player = self.players[client_id]
        if ship_type not in self.SHIP_PROFILES:
            return
            
        print(f"Cambiando nave de {client_id} a {ship_type}...")
        prof = self.SHIP_PROFILES[ship_type]
        
        # 1. Actualizar Tipo y Visuales
        player["ship_type"] = ship_type
        player["color"] = prof["color"]
        
        # 2. Actualizar Estadísticas Base
        player["base_max_hp"] = prof["hp"]
        player["base_max_shld"] = prof["shld"]
        player["base_atk"] = prof["atk"]
        player["base_spd"] = prof["spd"]
        player["base_max_cargo"] = prof.get("cargo_capacity", 1500)
        player["slots"] = prof["slots"]
        
        # 3. Recalcular Estadísticas Finales (Módulos + Laboratorio)
        self.recalculate_player_stats(player)
        
        # 4. Ajustar Salud/Escudo actual al nuevo máximo (sin excederlo)
        player["hp"] = min(player["hp"], player["max_hp"])
        player["shld"] = min(player["shld"], player["max_shld"])
        
        print(f"Cambio de nave completado para {client_id}.")

    def update_design(self, client_id, design_id):
        if client_id not in self.players: return
        player = self.players[client_id]
        
        old_max_hp = player.get("max_hp", player.get("base_max_hp", 100))
        old_max_shld = player.get("max_shld", player.get("base_max_shld", 100))
        
        player["equipped_design"] = design_id
        self.recalculate_player_stats(player)
        
        # Escalar salud/escudo actual proporcionalmente al nuevo máximo
        if old_max_hp > 0:
            hp_ratio = player["hp"] / old_max_hp
            player["hp"] = player["max_hp"] * hp_ratio
        if old_max_shld > 0:
            shld_ratio = player["shld"] / old_max_shld
            player["shld"] = player["max_shld"] * shld_ratio
            
        print(f"Diseño actualizado y stats escaladas para {client_id}: {design_id}")

    def gain_xp(self, player, amount):
        # Aplicar bono de diseño si corresponde
        design_id = player.get("equipped_design")
        if design_id == "design_sovereign_ember_fang":
            amount = int(amount * 1.15)
            
        # El 15% de la experiencia se desvía al ECO si está activo
        if player.get("eco") and player["eco"].get("active"):
            eco_portion = int(amount * 0.15)
            self.gain_eco_xp(player, eco_portion)
            # El jugador recibe el resto (opcionalmente podrías darle el 100% y al ECO extra, 
            # pero el usuario dijo "cierto porcentaje se vaya", lo que suele implicar división)
            # amount = amount - eco_portion # Si queremos que sea compartido. 
            # Mantendré el 100% para el jugador para que no sienta que el ECO le "roba" XP, 
            # pero el ECO recibe su propia porción.

        player["xp"] += amount
        # Level up logic (Cumulative System)
        while player["xp"] >= player["xp_next"]:
            player["level"] += 1
            player["xp_next"] = player["level"] * 100000
            player["hp"] = min(player["max_hp"], player["hp"] + 25)

    def gain_eco_xp(self, player, amount):
        if not player.get("eco"): return
        eco = player["eco"]
        if not eco.get("active"): return
        
        # Inicializar campos si no existen (migración)
        if "xp" not in eco: eco["xp"] = 0
        if "xp_next" not in eco: eco["xp_next"] = (eco.get("level", 1) * (eco.get("level", 1) + 1) // 2) * 500
        
        eco["xp"] += amount
        
        # Level up logic for ECO (Max Level 15)
        while eco["xp"] >= eco.get("xp_next", 9999999) and eco.get("level", 1) < 15:
            eco["level"] = eco.get("level", 1) + 1
            # Requisitos de nivel más suaves para el ECO (escalado x500 en lugar de x1000)
            eco["xp_next"] = (eco["level"] * (eco["level"] + 1) // 2) * 500
            print(f"DEBUG: ECO Level Up! Player {player.get('username')} | ECO Level: {eco['level']}")

    def _update_mission_progress(self, player, alien_name):
        """Actualiza el progreso de las misiones activas si el alien coincide."""
        if not player.get("active_missions"): return
        
        updated = False
        # Handle Boss prefix for missions
        base_alien_name = alien_name.replace("Boss ", "")
        
        for mission in player["active_missions"]:
            if mission["status"] == "active" and (mission.get("target_alien") == alien_name or mission.get("target_alien") == base_alien_name):
                mission["progress"] += 1
                updated = True
                
                # Verificar si se completó
                status = "active"
                if mission["progress"] >= mission["target_count"]:
                    status = "completed"
                    mission["status"] = "completed"
                
                try:
                    update_mission_progress_db(player["user_id"], mission["id"], mission["progress"], status)
                except Exception as e:
                    print(f"Error updating mission progress for {player['user_id']}: {e}")
                
                # COBRO AUTOMÁTICO DE RECOMPENSAS
                if status == "completed":
                    try:
                        result = claim_mission_reward_db(player["user_id"], mission["id"])
                        if result.get("success"):
                            rewards = result.get("rewards", {})
                            self._apply_mission_rewards(player, rewards)
                            # Eliminar de la lista de activas del HUD
                            player["active_missions"] = [am for am in player["active_missions"] if am["id"] != mission["id"]]
                            print(f"Misión {mission['id']} auto-cobrada para {player['user_id']}")
                            
                            # Registrar evento de misión completada para la UI
                            self.mission_events.append({
                                "id": f"mission_{mission['id']}_{time.time()}",
                                "owner_id": player["id"],
                                "title": mission.get("title", "Misión"),
                                "rewards": rewards,
                                "time": time.time()
                            })
                    except Exception as e:
                        print(f"Error en auto-cobro de misión {mission['id']}: {e}")
        
        if updated:
            # Enviar actualización al cliente
            self._send_mission_update(player)

    def _send_mission_update(self, player):
        """Marca al jugador para enviar el estado actual de las misiones en el próximo tick de estado."""
        player["needs_mission_sync"] = True

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

            players_to_send = []
            for p in players_list:
                if p["current_map"] == m_id:
                    # Si es invisible, solo enviar si es el propio jugador
                    is_visible = not p.get("is_invisible") or p["id"] == client_id
                    
                    if is_visible:
                        p_data = {**p, "is_self": p["id"] == client_id}
                        # Redondear combustible e integridad del ECO antes de enviar
                        if "eco" in p_data and p_data["eco"]:
                            p_data["eco"] = {**p_data["eco"]}
                            p_data["eco"]["fuel"] = int(p_data["eco"].get("fuel", 0))
                            p_data["eco"]["integrity"] = int(p_data["eco"].get("integrity", 0))
                            p_data["eco"]["max_integrity"] = 50000 
                        players_to_send.append(p_data)

            state = {
                "players": players_to_send,
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
                "mission_events": [e for e in self.mission_events if e.get("owner_id") == client_id],
                "destruction_events": self.destruction_events,
                "party": self.parties.get(me.get("party_id")) if me.get("party_id") else None,
                "party_invites": self.party_invites.get(client_id, {}),
                "active_missions": me["active_missions"] if me.get("needs_mission_sync") else None,
                "timed_bonuses": {
                    k: sum(u.get("amount", 0) for u in me.get("timed_upgrades", {}).get(k, []))
                    for k in ["atk", "shld", "spd", "hp"]
                },
                "auctions": [{**auc, "your_bid": auc["player_bids"].get(client_id, 0)} for auc in self.auctions],
                "auction_reset_in": max(0, int(self.auction_duration - (time.time() - self.last_auction_reset))),
                "beacons": [b for b in self.beacons if b.get("map_id") == m_id],
                "server_time": time.time()
            }
        # Resetear flag tras incluirlo en el estado
            if me.get("needs_mission_sync"):
                me["needs_mission_sync"] = False
                
            return state

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

    def update_eco(self, client_id, eco_data):
        """Sincroniza los datos del ECO (equipamiento, estado activo, etc)."""
        if client_id not in self.players: return
        player = self.players[client_id]
        if "eco" not in player:
            player["eco"] = {"active": False, "deployed": False, "mode": "passive", "equipped": {}, "hp": 5000, "max_hp": 5000, "shld": 2000, "max_shld": 2000}
        
        # Sincronización segura de datos
        if isinstance(eco_data, dict):
            player["eco"].update(eco_data)
        
        self.recalculate_player_stats(player)

    def toggle_eco(self, client_id, deployed):
        """Maneja el despliegue/repliegue del dron."""
        if client_id not in self.players: return
        player = self.players[client_id]
        
        # Solo permitimos toggle si el jugador posee el sistema ECO
        if "eco" in player and player["eco"].get("active", False):
            # BLOQUEO: Si intenta activar pero no tiene combustible
            if deployed and player["eco"].get("fuel", 0) <= 0:
                player["eco"]["deployed"] = False
                
                # Notificar al jugador vía chat de sistema
                ws = self.clients.get(client_id)
                if ws:
                    try:
                        import asyncio
                        import json
                        loop = asyncio.get_event_loop()
                        error_msg = json.dumps({
                            "type": "chat_update",
                            "message": {
                                "id": "sys_" + str(time.time()),
                                "sender": "SISTEMA",
                                "display_name": "SISTEMA",
                                "text": "⚠️ El E.C.O. no tiene combustible y no puede activarse.",
                                "channel": "global",
                                "faction": "SYSTEM",
                                "time": time.time()
                            }
                        })
                        if loop.is_running():
                            loop.create_task(ws.send_text(error_msg))
                    except:
                        pass
                return

            player["eco"]["deployed"] = deployed
            
            # Posicionamiento inicial al desplegar para evitar que aparezca en el origen
            if deployed:
                player["eco"]["x"] = player["x"] - 60
                player["eco"]["y"] = player["y"] - 60
                player["eco"]["vx"] = 0
                player["eco"]["vy"] = 0
            
            self.recalculate_player_stats(player)

    def update_eco_mode(self, client_id, mode):
        """Cambia el modo de combate del ECO."""
        if client_id not in self.players: return
        player = self.players[client_id]
        if "eco" in player:
            player["eco"]["mode"] = mode
            # Forzamos recalculación por si el modo afecta a bonos futuros
            self.recalculate_player_stats(player)

    def handle_chat(self, sender_id, text, channel="global", receiver=None):
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
                "receiver": receiver,
                "faction": sender["faction"],
                "time": time.time()
            }
        }
        
        import json
        msg_str = json.dumps(chat_msg)
        
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
            elif channel == "private":
                # Solo remitente y destinatario
                if target_p["user_id"] == receiver or target_p["user_id"] == sender_name:
                    should_send = True
                
            if should_send:
                try:
                    import asyncio
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(ws.send_text(msg_str))
                except:
                    pass


    def broadcast_user_list(self):
        # Enviar lista de usuarios online con su info básica
        online_users = []
        for pid in self.players:
            p = self.players[pid]
            online_users.append({
                "username": p.get("user_id"),
                "display_name": f"[{p['clan_tag']}] {p.get('user_id')}" if p.get("clan_tag") else p.get("user_id"),
                "faction": p.get("faction"),
                "clan_tag": p.get("clan_tag")
            })
        
        msg = {
            "type": "user_list_update",
            "users": online_users
        }
        
        import json
        msg_str = json.dumps(msg)
        for ws in self.clients.values():
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(ws.send_text(msg_str))
            except:
                pass

    def handle_friend_request(self, sender_id, receiver_name):
        if sender_id not in self.players: return
        sender = self.players[sender_id]
        sender_name = sender.get("user_id")
        
        from database import send_friend_request
        result = send_friend_request(sender_name, receiver_name)
        
        if result.get("success"):
            # Buscar si el receptor está online para notificarle en tiempo real
            for pid, p in self.players.items():
                if p.get("user_id") == receiver_name:
                    ws = self.clients.get(pid)
                    if ws:
                        try:
                            import asyncio
                            import json
                            loop = asyncio.get_event_loop()
                            msg = json.dumps({"type": "friend_request_received", "from": sender_name})
                            if loop.is_running():
                                loop.create_task(ws.send_text(msg))
                        except:
                            pass
                    break
        else:
            # Notificar al remitente del error vía chat de sistema
            ws_sender = self.clients.get(sender_id)
            if ws_sender:
                try:
                    import asyncio
                    import json
                    loop = asyncio.get_event_loop()
                    error_msg = json.dumps({
                        "type": "chat_update",
                        "message": {
                            "id": "sys_" + str(time.time()),
                            "sender": "SISTEMA",
                            "display_name": "SISTEMA",
                            "text": f"Error al enviar solicitud: {result.get('error')}",
                            "channel": "global",
                            "faction": "SYSTEM",
                            "time": time.time()
                        }
                    })
                    if loop.is_running():
                        loop.create_task(ws_sender.send_text(error_msg))
                except:
                    pass

    def handle_friend_accept(self, receiver_id, sender_name):
        if receiver_id not in self.players: return
        receiver = self.players[receiver_id]
        receiver_name = receiver.get("user_id")
        
        from database import accept_friend_request
        if accept_friend_request(sender_name, receiver_name):
            # Notificar a ambos que ahora son amigos
            # (El receptor ya está procesando la acción, notificamos al remitente si está online)
            for pid, p in self.players.items():
                if p.get("user_id") == sender_name:
                    ws = self.clients.get(pid)
                    if ws:
                        try:
                            import asyncio
                            import json
                            loop = asyncio.get_event_loop()
                            msg = json.dumps({"type": "friend_request_accepted", "by": receiver_name})
                            if loop.is_running():
                                loop.create_task(ws.send_text(msg))
                        except:
                            pass
                    break

    def _send_sys_msg(self, client_id, text):
        ws = self.clients.get(client_id)
        if ws:
            try:
                import asyncio
                import json
                loop = asyncio.get_event_loop()
                msg = json.dumps({
                    "type": "chat_update",
                    "message": {
                        "id": "sys_" + str(time.time()),
                        "sender": "SISTEMA",
                        "display_name": "SISTEMA",
                        "text": text,
                        "channel": "global",
                        "faction": "SYSTEM",
                        "time": time.time()
                    }
                })
                if loop.is_running():
                    loop.create_task(ws.send_text(msg))
            except:
                pass

    def eco_repair(self, client_id):
        if client_id not in self.players: return
        player = self.players[client_id]
        eco = player.get("eco")
        
        if not eco or not eco.get("active") or not eco.get("deployed"):
            self._send_sys_msg(client_id, "⚠️ El E.C.O. debe estar desplegado para reparar.")
            return
            
        # Buscar módulo de reparación equipado
        repair_module = None
        equipped_util = eco.get("equipped", {}).get("utility", [])
        # equipped_util puede ser una lista de dicts o IDs
        for item in equipped_util:
            iid = item.get("id", "") if isinstance(item, dict) else str(item)
            if iid.startswith("eco_rep_"):
                repair_module = iid
                break
        
        if not repair_module:
            self._send_sys_msg(client_id, "⚠️ No tienes un Módulo de Reparación equipado en el E.C.O.")
            return

        now = time.time()
        # Cooldown o verificación si ya está reparando
        if player.get("eco_repair_end_time", 0) > now:
            self._send_sys_msg(client_id, "⚠️ El protocolo de reparación ya está en curso.")
            return

        # Stats según el nivel
        lvl = 1
        if "rep_2" in repair_module: lvl = 2
        elif "rep_3" in repair_module: lvl = 3
        
        stats = {
            1: {"hp_sec": 10000, "fuel": 200, "fail": 65},
            2: {"hp_sec": 15000, "fuel": 400, "fail": 75},
            3: {"hp_sec": 25000, "fuel": 750, "fail": 85}
        }
        
        s = stats[lvl]
        
        # Consumo de combustible base
        if eco.get("fuel", 0) < s["fuel"]:
             self._send_sys_msg(client_id, "⚠️ Combustible insuficiente para iniciar reparación.")
             return

        # Probabilidad de rechazo
        if random.random() * 100 < s["fail"]:
            # Falló pero igual consume el combustible base por el intento
            eco["fuel"] -= s["fuel"]
            self._send_sys_msg(client_id, f"❌ El sistema E.C.O. ha rechazado la orden ({s['fail']}% de probabilidad de fallo).")
            return

        eco["fuel"] -= s["fuel"]
        
        # Iniciar reparación
        player["eco_repair_hp_sec"] = s["hp_sec"]
        player["eco_repair_end_time"] = now + 5
        player["eco_repair_fuel_extra_factor"] = 1.35 # 35% extra fuel consumption during repair
        
        self._send_sys_msg(client_id, f"🔧 Iniciando reparación remota Nivel {lvl} (5s)...")

    def eco_self_repair(self, client_id):
        if client_id not in self.players: return
        player = self.players[client_id]
        eco = player.get("eco")
        
        if not eco or not eco.get("active") or not eco.get("deployed"):
            self._send_sys_msg(client_id, "⚠️ El E.C.O. debe estar desplegado para autorrepararse.")
            return
            
        # Buscar módulo de autorreparación equipado
        repair_module = None
        equipped_util = eco.get("equipped", {}).get("utility", [])
        for item in equipped_util:
            iid = item.get("id", "") if isinstance(item, dict) else str(item)
            if iid.startswith("eco_self_rep_"):
                repair_module = iid
                break
        
        if not repair_module:
            self._send_sys_msg(client_id, "⚠️ No tienes un Módulo de Autorreparación equipado en el E.C.O.")
            return

        now = time.time()
        # Verificar si ya está reparando
        if player.get("eco_self_repair_end_time", 0) > now:
            self._send_sys_msg(client_id, "⚠️ El sistema de autorreparación ya está activo.")
            return

        # Stats según el nivel
        lvl = 1
        if "rep_2" in repair_module: lvl = 2
        elif "rep_3" in repair_module: lvl = 3
        
        # Nivel 1: 2000 HP/s, 89s, 2500 paladio
        # Nivel 2: 6000 HP/s, 30s, 6000 paladio
        # Nivel 3: 12000 HP/s, 15s, 12500 paladio
        stats = {
            1: {"hp_sec": 2000, "duration": 89},
            2: {"hp_sec": 6000, "duration": 30},
            3: {"hp_sec": 12000, "duration": 15}
        }
        
        s = stats[lvl]
        
        # Iniciar autorreparación
        player["eco_self_repair_hp_sec"] = s["hp_sec"]
        player["eco_self_repair_end_time"] = now + s["duration"]
        
        self._send_sys_msg(client_id, f"🛠️ Autorreparación del E.C.O. Nivel {lvl} activada ({s['duration']}s).")

    def _try_collect_loot(self, player, box):
        """Intenta recoger una caja. Retorna True si la caja debe ser eliminada."""
        now = time.time()
        pid = player["id"]
        
        if box["type"] == "heal":
            player["hp"] = min(player["max_hp"], player["hp"] + 50)
            self.loot_events.append({
                "id": str(random.random()),
                "x": box["x"], "y": box["y"],
                "type": "heal", "amount": 50,
                "time": now, "owner_id": pid
            })
            return True
            
        elif box["type"] == "mineral":
            current_cargo = sum(player["minerals"].values())
            can_take = min(box["amount"], player["max_cargo"] - current_cargo)
            if can_take > 0:
                m_type = box["mineral_type"]
                player["minerals"][m_type] = player["minerals"].get(m_type, 0) + can_take
                self.loot_events.append({
                    "id": str(random.random()),
                    "x": box["x"], "y": box["y"],
                    "type": "mineral", "mineral_type": m_type, "amount": can_take,
                    "time": now, "owner_id": pid
                })
                if can_take < box["amount"]:
                    box["amount"] -= can_take
                    return False
                return True
            else:
                self._warn_cargo_full(pid, box)
                return False
                
        elif box["type"] == "cargo":
            minerals_dict = player.get("minerals", {})
            if not isinstance(minerals_dict, dict):
                minerals_dict = {"titanium": 0, "plutonium": 0, "silicon": 0, "iridium": 0}
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
                        minerals_dict[m_type] = minerals_dict.get(m_type, 0) + can_take
                        current_shared_cargo += can_take
                        collected_info[m_type] = can_take
                        box_minerals[m_type] -= can_take
                        if box_minerals[m_type] > 0: has_remaining = True
                    else: has_remaining = True
                else: has_remaining = True
            
            if collected_info:
                self.loot_events.append({
                    "id": str(random.random()),
                    "x": box["x"], "y": box["y"],
                    "type": "cargo", "minerals": collected_info,
                    "time": now, "owner_id": pid
                })
                return not has_remaining
            else:
                self._warn_cargo_full(pid, box)
                return False
                
        elif box["type"] == "special_coin":
            rand = random.random()
            if rand < 0.40: # Credits
                amt = random.randint(1000, 5000)
                player["credits"] += amt
                self.loot_events.append({
                    "id": str(random.random()), "x": box["x"], "y": box["y"],
                    "type": "credits", "amount": amt, "time": now, "owner_id": pid
                })
            elif rand < 0.65: # Ammo
                amt = random.randint(50, 150)
                ammo_id = random.choice(["thermal", "plasma", "siphon"])
                player["ammo"][ammo_id] += amt
                self.loot_events.append({
                    "id": str(random.random()), "x": box["x"], "y": box["y"],
                    "type": "credits", "amount": 0, "text": f"+{amt} {ammo_id.upper()}",
                    "time": now, "owner_id": pid
                })
            else: # Paladio
                amt = random.randint(10, 30)
                player["paladio"] = player.get("paladio", 0) + amt
                self.loot_events.append({
                    "id": str(random.random()), "x": box["x"], "y": box["y"],
                    "type": "paladio", "amount": amt, "time": now, "owner_id": pid
                })
            return True
            
        return False

    def _warn_cargo_full(self, pid, box):
        now = time.time()
        if not hasattr(self, "_last_full_warn"): self._last_full_warn = {}
        if now - self._last_full_warn.get(pid, 0) > 2:
            self.loot_events.append({
                "id": str(random.random()), "x": box["x"], "y": box["y"],
                "type": "cargo_full", "time": now, "owner_id": pid
            })
            self._last_full_warn[pid] = now
