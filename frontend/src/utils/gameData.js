export const SHIPS = [
  {
    id: 'starter',
    name: 'Phoenix (Básica)',
    hp: 104000,
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
    name: 'Aegis Vanguard',
    hp: 260000,
    shld: 0,
    atk: 70,
    spd: 260,
    color: '#ffb300',
    desc: 'Un acorazado pesado diseñado para absorber grandes cantidades de castigo.',
    image: '/aegis_vanguard_v2.png?v=2',
    ui_image: '/aegis_vanguard_v2.png?v=2',
    slots: { lasers: 2, shields: 6, engines: 3, utility: 2 },
    cargo_capacity: 800,
    cost: 0
  },
  {
    id: 'fast',
    name: 'Nova Striker (Rápida)',
    hp: 116000,
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
    name: 'Orion Phantom',
    hp: 164000,
    shld: 0,
    atk: 130,
    spd: 360,
    color: '#9933ff',
    desc: 'Una nave de asalto sigilosa capaz de emboscar enemigos sin ser detectada.',
    image: '/orion_phantom_v2.png?v=2',
    ui_image: '/orion_phantom_v2.png?v=2',
    slots: { lasers: 5, shields: 3, engines: 4, utility: 3 },
    cargo_capacity: 600,
    cost: 0
  },
  {
    id: 'heavy',
    name: 'Titan Hammer',
    hp: 356000,
    shld: 0,
    atk: 180,
    spd: 300,
    color: '#ff3333',
    desc: 'Una nave pesada con una potencia de fuego devastadora y un blindaje impenetrable.',
    image: '/titan_hammer_v2.png?v=2',
    ui_image: '/titan_hammer_v2.png?v=2',
    slots: { lasers: 8, shields: 4, engines: 2, utility: 1 },
    cargo_capacity: 1500,
    cost: 0
  },
  {
    id: 'support',
    name: 'Helix Support',
    hp: 375000,
    shld: 0,
    atk: 60,
    spd: 300,
    color: '#33ff99',
    desc: 'Una nave de apoyo táctico con sistemas avanzados de reparación y una bodega masiva.',
    image: '/helix_support_v2.png?v=2',
    ui_image: '/helix_support_v2.png?v=2',
    slots: { lasers: 2, shields: 3, engines: 4, utility: 6 },
    cargo_capacity: 2000,
    cost: 0
  },
  {
    id: 'sovereign',
    name: 'Sovereign Exterminator',
    desc: 'El pináculo del combate táctico. Equipada con 15 ranuras de láser y un casco reforzado con tecnología de materia oscura.',
    image: '/sovereign_v3.png?v=3',
    cost: 150000,
    currency: 'paladio',
    hp: 360000, shld: 250, spd: 220, cargo_capacity: 1500,
    slots: { lasers: 15, shields: 10, engines: 2, utility: 3 }
  },
  {
    id: 'harvester',
    name: 'Cosmic Harvester',
    desc: 'Una planta de procesamiento móvil. Su bodega ultra-expandida permite recolectar flotas enteras de minerales.',
    image: '/harvester_v2.png?v=2',
    cost: 75000,
    currency: 'paladio',
    hp: 325000, shld: 150, spd: 400, cargo_capacity: 1500,
    slots: { lasers: 4, shields: 6, engines: 2, utility: 8 }
  },
  {
    id: 'interceptor',
    name: 'Solar Wind',
    desc: 'La nave más rápida jamás construida. Su diseño minimalista sacrifica blindaje por una velocidad de evasión inigualable.',
    image: '/interceptor_v2.png?v=2',
    cost: 100000,
    currency: 'paladio',
    hp: 200000, shld: 120, spd: 370, cargo_capacity: 500,
    slots: { lasers: 6, shields: 4, engines: 12, utility: 2 }
  },
  {
    id: 'bastion',
    name: 'Obsidian Bastion',
    desc: 'Una fortaleza inexpugnable. Su casco de obsidiana reforzada y sus múltiples generadores de escudo la hacen casi indestructible.',
    image: '/bastion_v2.png?v=2',
    cost: 250000,
    currency: 'paladio',
    hp: 650000, shld: 400, spd: 240, cargo_capacity: 4000,
    slots: { lasers: 7, shields: 15, engines: 5, utility: 5 }
  }
];

export const MODULES_CATALOG = [
  { id: 'laser_1', type: 'lasers',  lvl: 1, name: 'Láser Básico',     cost: 10000, atk: 64,   icon: '🎯', image: '/basic_laser.png' },
  { id: 'laser_2', type: 'lasers',  lvl: 2, name: 'Láser Plus',       cost: 5000, currency: 'paladio', atk: 140,  icon: '🎯', image: '/plus_laser.png' },
  { id: 'laser_3', type: 'lasers',  lvl: 3, name: 'Cañón Pesado',     cost: 10000, currency: 'paladio', atk: 175,  icon: '🎯', image: '/heavy_laser.jpg' },
  
  { id: 'shield_1', type: 'shields', lvl: 1, name: 'Escudo Liviano',   cost: 16000, shld: 2000, icon: '🛡️', absorption: 0.5 },
  { id: 'shield_2', type: 'shields', lvl: 2, name: 'Escudo Reforzado', cost: 25000, currency: 'paladio', shld: 5000, icon: '🛡️', absorption: 0.6 },
  { id: 'shield_3', type: 'shields', lvl: 3, name: 'Escudo Hiper',    cost: 50000, currency: 'paladio', shld: 10000, icon: '🛡️', absorption: 0.8 },
  
  { id: 'engine_1', type: 'engines', lvl: 1, name: 'Micro Motor',     cost: 16000, spd: 5,  icon: '🚀' },
  { id: 'engine_2', type: 'engines', lvl: 2, name: 'Turbo Motor',     cost: 1000, currency: 'paladio', spd: 7,  icon: '🚀' },
  { id: 'engine_3', type: 'engines', lvl: 3, name: 'Hiper Motor',     cost: 2000, currency: 'paladio', spd: 10,  icon: '🚀' },
  
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
  { id: 'standard', name: 'Estándar',  damage: 1.0, cost: 10,      count: 1, icon: '⚪', color: '#ffffff', image: '/std_ammo.jpg', isStackable: true },
  { id: 'thermal',  name: 'Térmica',   damage: 1.5, cost: 0.5,     currency: 'paladio', count: 1, icon: '🔥', color: '#ff6600', image: '/thermal_ammo.jpg', isStackable: true },
  { id: 'plasma',   name: 'Plasma',    damage: 2.5, cost: 1,       currency: 'paladio', count: 1, icon: '🔷', color: '#ff33ff', image: '/plasma_ammo.jpg', isStackable: true },
  { id: 'siphon',   name: 'Sifón',     damage: 1.0, cost: 1,       currency: 'paladio', count: 1, icon: '🔋', color: '#33ff33', effect: 'shield_steal', image: '/siphon_ammo.png', isStackable: true },
];

export const MISSILE_CATALOG = [
  { id: 'missile_1', name: 'M-1 "Seta"',    damage: 1000,  cost: 100,   count: 1, icon: '🚀', color: '#ffcc00', isStackable: true },
  { id: 'missile_2', name: 'M-2 "Ciclón"',  damage: 2000, cost: 500,  count: 1, icon: '🚀', color: '#ff6600', isStackable: true },
  { id: 'missile_3', name: 'M-3 "Giga-Nuke"', damage: 4000, cost: 5, currency: 'paladio', count: 1, icon: '☢️', color: '#ff0000', isStackable: true },
];

export const ECO_CONFIG = {
  id: 'eco',
  name: 'E.C.O. (Extra Combat Observer)',
  cost: 5000,
  currency: 'paladio',
  slots: { lasers: 5, generators: 10, protocols: 10, utility: 5 },
  image: '/eco_drone.png',
  desc: 'Nave de apoyo táctico de alta capacidad. Specs: 50.000 HP, 100.000 Combustible. Ranuras: 5 Láser, 10 Generadores, 10 Protocolos, 5 Utilidad.',
  hp: 50000,
  fuel: 100000
};

export const ECO_PROTOCOLS = [
  // Nivel 1 (Habilitado para ECO Nivel 1-4)
  { id: 'proto_laser_1', type: 'protocols', lvl: 1, name: 'Protocolo de Precisión I', cost: 1000, atk: 15, icon: '🎯', desc: 'Aumenta la potencia de fuego (Nivel 1).' },
  { id: 'proto_shield_1', type: 'protocols', lvl: 1, name: 'Protocolo de Escudo I', cost: 1000, shld: 200, icon: '🛡️', desc: 'Refuerza la capacidad defensiva (Nivel 1).' },
  { id: 'proto_cargo_1', type: 'protocols', lvl: 1, name: 'Protocolo de Carga I', cost: 1000, cargo: 2000, icon: '📦', desc: 'Expande la bodega de carga (Nivel 1).' },
  { id: 'proto_hp_1', type: 'protocols', lvl: 1, name: 'Protocolo de Casco I', cost: 1000, hp: 500, icon: '❤️', desc: 'Aumenta la vida estructural (Nivel 1).' },

  // Nivel 2 (Habilitado para ECO Nivel 5-9)
  { id: 'proto_laser_2', type: 'protocols', lvl: 2, name: 'Protocolo de Precisión II', cost: 5000, atk: 35, icon: '🎯', desc: 'Aumenta la potencia de fuego (Nivel 2).' },
  { id: 'proto_shield_2', type: 'protocols', lvl: 2, name: 'Protocolo de Escudo II', cost: 5000, shld: 500, icon: '🛡️', desc: 'Refuerza la capacidad defensiva (Nivel 2).' },
  { id: 'proto_cargo_2', type: 'protocols', lvl: 2, name: 'Protocolo de Carga II', cost: 5000, cargo: 5000, icon: '📦', desc: 'Expande la bodega de carga (Nivel 2).' },
  { id: 'proto_hp_2', type: 'protocols', lvl: 2, name: 'Protocolo de Casco II', cost: 5000, hp: 1200, icon: '❤️', desc: 'Aumenta la vida estructural (Nivel 2).' },

  // Nivel 3 (Habilitado para ECO Nivel 10-15)
  { id: 'proto_laser_3', type: 'protocols', lvl: 3, name: 'Protocolo de Precisión III', cost: 25000, atk: 75, icon: '🎯', desc: 'Aumenta la potencia de fuego (Nivel 3).' },
  { id: 'proto_shield_3', type: 'protocols', lvl: 3, name: 'Protocolo de Escudo III', cost: 25000, shld: 1200, icon: '🛡️', desc: 'Refuerza la capacidad defensiva (Nivel 3).' },
  { id: 'proto_cargo_3', type: 'protocols', lvl: 3, name: 'Protocolo de Carga III', cost: 25000, cargo: 12000, icon: '📦', desc: 'Expande la bodega de carga (Nivel 3).' },
  { id: 'proto_hp_3', type: 'protocols', lvl: 3, name: 'Protocolo de Casco III', cost: 25000, hp: 3000, icon: '❤️', desc: 'Aumenta la vida estructural (Nivel 3).' },
];

export const ECO_REPAIR = [
  { 
    id: 'eco_rep_1', 
    type: 'utility', 
    lvl: 1, 
    name: 'Módulo de Reparación ECO I', 
    cost: 20000, 
    currency: 'paladio',
    hp_sec: 10000, 
    duration: 5, 
    fail_prob: 65, 
    fuel_cons: 200, 
    extra_cons: 35,
    icon: '🔧', 
    desc: 'Repara tu nave mientras te encuentras en vuelo. Consume combustible extra por cada reparación.' 
  },
  { 
    id: 'eco_rep_2', 
    type: 'utility', 
    lvl: 2, 
    name: 'Módulo de Reparación ECO II', 
    cost: 30000, 
    currency: 'paladio',
    hp_sec: 15000, 
    duration: 5, 
    fail_prob: 75, 
    fuel_cons: 400, 
    extra_cons: 35,
    icon: '🔧', 
    desc: 'Repara tu nave mientras te encuentras en vuelo. Consume combustible extra por cada reparación.' 
  },
  { 
    id: 'eco_rep_3', 
    type: 'utility', 
    lvl: 3, 
    name: 'Módulo de Reparación ECO III', 
    cost: 55000, 
    currency: 'paladio',
    hp_sec: 25000, 
    duration: 5, 
    fail_prob: 85, 
    fuel_cons: 750, 
    extra_cons: 35,
    icon: '🔧', 
    desc: 'Repara tu nave mientras te encuentras en vuelo. Consume combustible extra por cada reparación.' 
  }
];

export const ECO_COLLECTOR = [
  {
    id: 'eco_coll_1',
    type: 'utility',
    lvl: 1,
    name: 'Módulo Autorrecolector I',
    cost: 7500,
    currency: 'paladio',
    range: 700,
    icon: '🤖',
    desc: 'Recoge automáticamente cajas de carga y bono en un radio de 700.'
  },
  {
    id: 'eco_coll_2',
    type: 'utility',
    lvl: 2,
    name: 'Módulo Autorrecolector II',
    cost: 17500,
    currency: 'paladio',
    range: 1500,
    icon: '🤖',
    desc: 'Recoge automáticamente cajas de carga y bono en un radio de 1500.'
  },
  {
    id: 'eco_coll_3',
    type: 'utility',
    lvl: 3,
    name: 'Módulo Autorrecolector III',
    cost: 37500,
    currency: 'paladio',
    range: 3000,
    icon: '🤖',
    desc: 'Recoge automáticamente cajas de carga y bono en un radio de 3000.'
  }
];

export const ECO_TRACKER = [
  {
    id: 'eco_track_1',
    type: 'utility',
    lvl: 1,
    name: 'Rastreador de Enemigos I',
    cost: 6000,
    currency: 'paladio',
    range: 2000,
    icon: '📡',
    desc: 'Localiza la posición de todos los alienígenas en un radio de 2000.'
  },
  {
    id: 'eco_track_2',
    type: 'utility',
    lvl: 2,
    name: 'Rastreador de Enemigos II',
    cost: 12500,
    currency: 'paladio',
    range: 3000,
    icon: '📡',
    desc: 'Localiza la posición de todos los alienígenas en un radio de 3000.'
  },
  {
    id: 'eco_track_3',
    type: 'utility',
    lvl: 3,
    name: 'Rastreador de Enemigos III',
    cost: 37500,
    currency: 'paladio',
    range: 5000,
    icon: '📡',
    desc: 'Localiza la posición de todos los alienígenas en un radio de 5000.'
  }
];

export const ECO_KAMIKAZE = [
  {
    id: 'eco_kami_1',
    type: 'utility',
    lvl: 1,
    name: 'Módulo Kamikaze I',
    cost: 7500,
    currency: 'paladio',
    damage: 25000,
    radius: 250,
    icon: '💥',
    desc: 'Al equiparlo, se activa cuando tu nave o tu ECO están a punto de ser destruidos. El ECO iniciará un último ataque kamikaze.'
  },
  {
    id: 'eco_kami_2',
    type: 'utility',
    lvl: 2,
    name: 'Módulo Kamikaze II',
    cost: 17500,
    currency: 'paladio',
    damage: 45000,
    radius: 350,
    icon: '💥',
    desc: 'Al equiparlo, se activa cuando tu nave o tu ECO están a punto de ser destruidos. El ECO iniciará un último ataque kamikaze.'
  },
  {
    id: 'eco_kami_3',
    type: 'utility',
    lvl: 3,
    name: 'Módulo Kamikaze III',
    cost: 50000,
    currency: 'paladio',
    damage: 75000,
    radius: 450,
    icon: '💥',
    desc: 'Al equiparlo, se activa cuando tu nave o tu ECO están a punto de ser destruidos. El ECO iniciará un último ataque kamikaze.'
  }
];

export const ECO_SELF_REPAIR = [
  {
    id: 'eco_self_rep_1',
    baseId: 'eco_self_rep',
    category: 'eco',
    type: 'active',
    lvl: 1,
    name: 'Módulo Autorreparación I',
    cost: 2500,
    currency: 'paladio',
    regen: 2000,
    duration: 89,
    icon: '🛠️',
    desc: 'Repara automáticamente la vida de tu ECO durante el vuelo.'
  },
  {
    id: 'eco_self_rep_2',
    baseId: 'eco_self_rep',
    category: 'eco',
    type: 'active',
    lvl: 2,
    name: 'Módulo Autorreparación II',
    cost: 6000,
    currency: 'paladio',
    regen: 6000,
    duration: 30,
    icon: '🛠️',
    desc: 'Repara rápidamente la vida de tu ECO durante el vuelo.'
  },
  {
    id: 'eco_self_rep_3',
    baseId: 'eco_self_rep',
    category: 'eco',
    type: 'active',
    lvl: 3,
    name: 'Módulo Autorreparación III',
    cost: 12500,
    currency: 'paladio',
    regen: 12000,
    duration: 15,
    icon: '🛠️',
    desc: 'Reparación de emergencia ultrarrápida para tu ECO.'
  }
];

export const ECO_FUEL = [
  { 
    id: 'eco_fuel_unit', 
    type: 'fuel', 
    name: 'Combustible ECO', 
    cost: 0.25, 
    currency: 'paladio', 
    isStackable: true, 
    icon: '⛽', 
    desc: 'Combustible de alta densidad para el sistema E.C.O.' 
  }
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
