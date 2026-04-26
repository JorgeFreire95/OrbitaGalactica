export const SHIPS = [
  {
    id: 'starter',
    name: 'Phoenix (Básica)',
    hp: 60,
    atk: 40,
    spd: 120,
    color: '#ffffff',
    desc: 'Nave ligera de entrenamiento para cadetes recién alistados.',
    image: '/phoenix_v3.png?v=5',
    ui_image: '/phoenix_v3.png?v=5',
    slots: { lasers: 1, shields: 1, engines: 1, utility: 1 },
    shld: 30,
    cargo_capacity: 100,
    cost: 0
  },
  {
    id: 'tank',
    name: 'Aegis Vanguard (Tanque)',
    hp: 180,
    atk: 70,
    spd: 60,
    color: '#ffb300',
    desc: 'Mucha resistencia, poco daño',
    image: '/aegis_vanguard_v2.png?v=2',
    slots: { lasers: 2, shields: 6, engines: 3, utility: 2 },
    shld: 150,
    cargo_capacity: 1500,
    cost: 0
  },
  {
    id: 'fast',
    name: 'Nova Striker (Rápida)',
    hp: 80,
    atk: 110,
    spd: 160,
    color: '#00ccff',
    desc: 'Frágil pero muy rápida ⚡',
    image: '/nova_striker_v2.png?v=2',
    slots: { lasers: 3, shields: 2, engines: 7, utility: 2 },
    shld: 50,
    cargo_capacity: 500,
    cost: 0
  },
  {
    id: 'stealth',
    name: 'Orion Phantom (Sigilo)',
    hp: 90,
    atk: 130,
    spd: 140,
    color: '#9933ff',
    desc: 'Ideal para emboscadas',
    image: '/orion_phantom_v2.png?v=2',
    slots: { lasers: 5, shields: 3, engines: 4, utility: 3 },
    shld: 80,
    cargo_capacity: 800,
    cost: 0
  },
  {
    id: 'heavy',
    name: 'Titan Hammer (Pesada)',
    hp: 160,
    atk: 180,
    spd: 50,
    color: '#ff3333',
    desc: 'Lenta pero destructiva 💥',
    image: '/titan_hammer_v2.png?v=2',
    slots: { lasers: 8, shields: 4, engines: 2, utility: 1 },
    shld: 120,
    cargo_capacity: 1200,
    cost: 0
  },
  {
    id: 'support',
    name: 'Helix Support (Soporte)',
    hp: 110,
    atk: 60,
    spd: 100,
    color: '#33ff99',
    desc: 'Versátil con muchas utilidades',
    image: '/helix_support_v2.png?v=2',
    slots: { lasers: 2, shields: 3, engines: 4, utility: 6 },
    shld: 100,
    cargo_capacity: 2500,
    cost: 0
  },
  {
    id: 'sovereign',
    name: 'Sovereign Exterminator',
    desc: 'El pináculo del combate táctico. Equipada con 15 ranuras de láser y un casco reforzado con tecnología de materia oscura.',
    image: '/sovereign_v3.png?v=3',
    cost: 0,
    hp: 220, shld: 250, spd: 45, cargo_capacity: 800,
    slots: { lasers: 15, shields: 10, engines: 2, utility: 3 }
  },
  {
    id: 'harvester',
    name: 'Cosmic Harvester',
    desc: 'Una planta de procesamiento móvil. Su bodega ultra-expandida permite recolectar flotas enteras de minerales.',
    image: '/harvester_v2.png?v=2',
    cost: 0,
    hp: 180, shld: 150, spd: 35, cargo_capacity: 10000,
    slots: { lasers: 4, shields: 6, engines: 2, utility: 8 }
  },
  {
    id: 'interceptor',
    name: 'Solar Wind',
    desc: 'La nave más rápida jamás construida. Su diseño minimalista sacrifica blindaje por una velocidad de evasión inigualable.',
    image: '/interceptor_v2.png?v=2',
    cost: 0,
    hp: 120, shld: 120, spd: 65, cargo_capacity: 400,
    slots: { lasers: 6, shields: 4, engines: 12, utility: 2 }
  },
  {
    id: 'bastion',
    name: 'Obsidian Bastion',
    desc: 'Una fortaleza inamovible. Diseñada para resistir asedios prolongados en el frente de batalla.',
    image: '/bastion_v2.png?v=2',
    cost: 0,
    hp: 400, shld: 400, spd: 25, cargo_capacity: 1200,
    slots: { lasers: 5, shields: 15, engines: 4, utility: 2 }
  }
];

export const MODULES_CATALOG = [
  { id: 'laser_1', type: 'lasers',  lvl: 1, name: 'Láser Básico',     cost: 0,  atk: 5,   icon: '🎯', image: '/basic_laser.png' },
  { id: 'laser_2', type: 'lasers',  lvl: 2, name: 'Láser Plus',       cost: 0,  atk: 12,  icon: '🎯', image: '/plus_laser.png' },
  { id: 'laser_3', type: 'lasers',  lvl: 3, name: 'Cañón Pesado',     cost: 0, atk: 30,  icon: '🎯', image: '/heavy_laser.jpg' },
  
  { id: 'shield_1', type: 'shields', lvl: 1, name: 'Escudo Liviano',   cost: 0,  shld: 20, icon: '🛡️' },
  { id: 'shield_2', type: 'shields', lvl: 2, name: 'Escudo Reforzado', cost: 0,  shld: 50, icon: '🛡️' },
  { id: 'shield_3', type: 'shields', lvl: 3, name: 'Escudo Hiper',    cost: 0,  shld: 150, icon: '🛡️' },
  
  { id: 'engine_1', type: 'engines', lvl: 1, name: 'Micro Motor',     cost: 0,  spd: 15,  icon: '🚀' },
  { id: 'engine_2', type: 'engines', lvl: 2, name: 'Turbo Motor',     cost: 0, spd: 40,  icon: '🚀' },
  { id: 'engine_3', type: 'engines', lvl: 3, name: 'Hiper Motor',     cost: 0, spd: 85,  icon: '🚀' },
  
  { id: 'util_repair_1', type: 'utility', lvl: 1, name: 'Robot Reparación I', cost: 0, repair_rate: 5.0, icon: '🔧' },
  { id: 'util_repair_2', type: 'utility', lvl: 2, name: 'Robot Reparación II', cost: 0, repair_rate: 7.5, icon: '🛠️' },
  { id: 'util_cloak', type: 'utility', lvl: 2, name: 'Camuflaje Sigiloso', cost: 0, desc: 'Activa invisibilidad inmediata. Se desactiva al atacar.', icon: '👻', image: '/cloak_extra.png' },
  { id: 'util_auto_repair', type: 'utility', lvl: 2, name: 'Reparación Automática', cost: 0, desc: 'Activa el robot de reparación automáticamente cuando no estás en combate.', icon: '🤖', is_auto_repair: true },
];

export const WIPS_CATALOG = [
  { id: 'dron', name: 'Dron', cost: 0, slots: 1, desc: 'Wip básico con 1 ranura para arma o escudo.', icon: '🛰️', image: '/wisp_v1.png' },
  { id: 'sparks', name: 'Sparks', cost: 0, slots: 2, desc: 'Wip avanzado con 2 ranuras para arma o escudo.', icon: '🛰️', image: '/wisp_v2.png' }
];

export const AMMO_CATALOG = [
  { id: 'standard', name: 'Estándar',  damage: 1.0, cost: 0,    count: 1000, icon: '⚪', color: '#ffffff', image: '/std_ammo.jpg' },
  { id: 'thermal',  name: 'Térmica',   damage: 1.5, cost: 0, count: 1000, icon: '🔥', color: '#ff6600', image: '/thermal_ammo.jpg' },
  { id: 'plasma',   name: 'Plasma',    damage: 2.5, cost: 0, count: 1000, icon: '🔷', color: '#ff33ff', image: '/plasma_ammo.jpg' },
  { id: 'siphon',   name: 'Sifón',     damage: 1.0, cost: 0, count: 1000, icon: '🔋', color: '#33ff33', effect: 'shield_steal', image: '/siphon_ammo.png' },
];

export const MISSILE_CATALOG = [
  { id: 'missile_1', name: 'M-1 "Seta"',    damage: 500,  cost: 0,   count: 1000, icon: '🚀', color: '#ffcc00' },
  { id: 'missile_2', name: 'M-2 "Ciclón"',  damage: 1200, cost: 0,  count: 1000, icon: '🚀', color: '#ff6600' },
  { id: 'missile_3', name: 'M-3 "Giga-Nuke"', damage: 3500, cost: 0,  count: 1000, icon: '☢️', color: '#ff0000' },
];

export const ECO_CONFIG = {
  id: 'eco',
  name: 'E.C.O. (Extra Combat Observer)',
  cost: 0,
  slots: { lasers: 5, generators: 10, protocols: 10, utility: 5 },
  image: '/eco_drone.png',
  desc: 'Nave de apoyo táctico de alta capacidad diseñada para escolta pesada.'
};

export const ECO_PROTOCOLS = [
  // Nivel 1 (Habilitado para ECO Nivel 1-4)
  { id: 'proto_laser_1', type: 'protocols', lvl: 1, name: 'Protocolo de Precisión I', cost: 1000, atk: 15, icon: '🎯', desc: 'Aumenta la potencia de fuego (Nivel 1).' },
  { id: 'proto_shield_1', type: 'protocols', lvl: 1, name: 'Protocolo de Escudo I', cost: 1000, shld: 200, icon: '🛡️', desc: 'Refuerza la capacidad defensiva (Nivel 1).' },
  { id: 'proto_cargo_1', type: 'protocols', lvl: 1, name: 'Protocolo de Carga I', cost: 1000, cargo: 2000, icon: '📦', desc: 'Expande la bodega de carga (Nivel 1).' },
  { id: 'proto_hp_1', type: 'protocols', lvl: 1, name: 'Protocolo de Casco I', cost: 1000, hp: 500, icon: '❤️', desc: 'Aumenta la integridad estructural (Nivel 1).' },

  // Nivel 2 (Habilitado para ECO Nivel 5-9)
  { id: 'proto_laser_2', type: 'protocols', lvl: 2, name: 'Protocolo de Precisión II', cost: 5000, atk: 35, icon: '🎯', desc: 'Aumenta la potencia de fuego (Nivel 2).' },
  { id: 'proto_shield_2', type: 'protocols', lvl: 2, name: 'Protocolo de Escudo II', cost: 5000, shld: 500, icon: '🛡️', desc: 'Refuerza la capacidad defensiva (Nivel 2).' },
  { id: 'proto_cargo_2', type: 'protocols', lvl: 2, name: 'Protocolo de Carga II', cost: 5000, cargo: 5000, icon: '📦', desc: 'Expande la bodega de carga (Nivel 2).' },
  { id: 'proto_hp_2', type: 'protocols', lvl: 2, name: 'Protocolo de Casco II', cost: 5000, hp: 1200, icon: '❤️', desc: 'Aumenta la integridad estructural (Nivel 2).' },

  // Nivel 3 (Habilitado para ECO Nivel 10-15)
  { id: 'proto_laser_3', type: 'protocols', lvl: 3, name: 'Protocolo de Precisión III', cost: 25000, atk: 75, icon: '🎯', desc: 'Aumenta la potencia de fuego (Nivel 3).' },
  { id: 'proto_shield_3', type: 'protocols', lvl: 3, name: 'Protocolo de Escudo III', cost: 25000, shld: 1200, icon: '🛡️', desc: 'Refuerza la capacidad defensiva (Nivel 3).' },
  { id: 'proto_cargo_3', type: 'protocols', lvl: 3, name: 'Protocolo de Carga III', cost: 25000, cargo: 12000, icon: '📦', desc: 'Expande la bodega de carga (Nivel 3).' },
  { id: 'proto_hp_3', type: 'protocols', lvl: 3, name: 'Protocolo de Casco III', cost: 25000, hp: 3000, icon: '❤️', desc: 'Aumenta la integridad estructural (Nivel 3).' },
];

export const ECO_FUEL = [
  { id: 'eco_fuel_1', type: 'fuel', name: 'Combustible ECO (P)', cost: 1000, count: 1000, icon: '⛽', desc: 'Paquete pequeño de combustible para el E.C.O. (1.000 unidades)' },
  { id: 'eco_fuel_2', type: 'fuel', name: 'Combustible ECO (M)', cost: 4500, count: 5000, icon: '⛽', desc: 'Paquete mediano de combustible para el E.C.O. (5.000 unidades)' },
];

export const getRank = (level) => {
  if (level >= 35) return "Almirante Estelar";
  if (level >= 30) return "General";
  if (level >= 25) return "Coronel";
  if (level >= 20) return "Comandante";
  if (level >= 15) return "Capitán";
  if (level >= 10) return "Piloto";
  if (level >= 5)  return "Cadete";
  return "Recluta";
};

export const MINERAL_TYPES = [
  { id: 'titanium', name: 'Titanio', color: '#00c8ff', icon: '💎', stat: 'shld', desc: 'Mejora escudos base', sellPrice: 15 },
  { id: 'plutonium', name: 'Plutonio', color: '#ff3333', icon: '🏮', stat: 'atk',  desc: 'Mejora ataque base', sellPrice: 25 },
  { id: 'silicon',   name: 'Silicio',  color: '#00ffcc', icon: '💾', stat: 'spd',  desc: 'Mejora velocidad base', sellPrice: 18 },
];
