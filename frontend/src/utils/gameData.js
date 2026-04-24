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
  { id: 'laser_1', type: 'lasers',  name: 'Láser Básico',     cost: 0,  atk: 5,   icon: '🎯', image: '/basic_laser.png' },
  { id: 'laser_2', type: 'lasers',  name: 'Láser Plus',       cost: 0,  atk: 12,  icon: '🎯', image: '/plus_laser.png' },
  { id: 'laser_3', type: 'lasers',  name: 'Cañón Pesado',     cost: 0, atk: 30,  icon: '🎯', image: '/heavy_laser.jpg' },
  
  { id: 'shield_1', type: 'shields', name: 'Escudo Liviano',   cost: 0,  shld: 20, icon: '🛡️' },
  { id: 'shield_2', type: 'shields', name: 'Escudo Reforzado', cost: 0,  shld: 50, icon: '🛡️' },
  
  { id: 'engine_1', type: 'engines', name: 'Micro Motor',     cost: 0,  spd: 15,  icon: '🚀' },
  { id: 'engine_2', type: 'engines', name: 'Turbo Motor',     cost: 0, spd: 40,  icon: '🚀' },
  
  { id: 'util_repair_1', type: 'utility', name: 'Robot Reparación I', cost: 0, repair_rate: 5.0, icon: '🔧' },
  { id: 'util_repair_2', type: 'utility', name: 'Robot Reparación II', cost: 0, repair_rate: 7.5, icon: '🛠️' },
  { id: 'util_cloak', type: 'utility', name: 'Camuflaje Sigiloso', cost: 0, desc: 'Activa invisibilidad inmediata. Se desactiva al atacar.', icon: '👻', image: '/cloak_extra.png' },
  { id: 'util_auto_repair', type: 'utility', name: 'Reparación Automática', cost: 0, desc: 'Activa el robot de reparación automáticamente cuando no estás en combate.', icon: '🤖', is_auto_repair: true },
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
  { id: 'proto_laser_1', type: 'protocols', name: 'Protocolo de Precisión I', cost: 0, atk: 15, icon: '🎯', desc: 'Aumenta la potencia de fuego del E.C.O.' },
  { id: 'proto_shield_1', type: 'protocols', name: 'Protocolo de Escudo I', cost: 0, shld: 200, icon: '🛡️', desc: 'Refuerza la capacidad defensiva del E.C.O.' },
  { id: 'proto_cargo_1', type: 'protocols', name: 'Protocolo de Carga I', cost: 0, cargo: 2000, icon: '📦', desc: 'Expande la bodega de carga total.' },
  { id: 'proto_radar_1', type: 'protocols', name: 'Protocolo de Radar I', cost: 0, radar: 1000, icon: '📡', desc: 'Aumenta el rango de detección de enemigos.' },
  { id: 'proto_hp_1', type: 'protocols', name: 'Protocolo de Casco I', cost: 0, hp: 500, icon: '❤️', desc: 'Aumenta la integridad estructural del E.C.O.' },
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
