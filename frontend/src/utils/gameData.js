export const SHIPS = [
  {
    id: 'starter',
    name: 'Phoenix (Básica)',
    hp: 60,
    atk: 40,
    spd: 120,
    color: '#ffffff',
    desc: 'Nave ligera de entrenamiento para cadetes recién alistados.',
    image: '/phoenix.png',
    ui_image: '/phoenix_ui.png',
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
    image: '/aegis_vanguard.png',
    slots: { lasers: 2, shields: 6, engines: 3, utility: 2 },
    shld: 150,
    cargo_capacity: 1500,
    cost: 150000
  },
  {
    id: 'fast',
    name: 'Nova Striker (Rápida)',
    hp: 80,
    atk: 110,
    spd: 160,
    color: '#00ccff',
    desc: 'Frágil pero muy rápida ⚡',
    image: '/nova_striker.png',
    slots: { lasers: 3, shields: 2, engines: 7, utility: 2 },
    shld: 50,
    cargo_capacity: 500,
    cost: 250000
  },
  {
    id: 'stealth',
    name: 'Orion Phantom (Sigilo)',
    hp: 90,
    atk: 130,
    spd: 140,
    color: '#9933ff',
    desc: 'Ideal para emboscadas',
    image: '/orion_phantom.png',
    slots: { lasers: 5, shields: 3, engines: 4, utility: 3 },
    shld: 80,
    cargo_capacity: 800,
    cost: 500000
  },
  {
    id: 'heavy',
    name: 'Titan Hammer (Pesada)',
    hp: 160,
    atk: 180,
    spd: 50,
    color: '#ff3333',
    desc: 'Lenta pero destructiva 💥',
    image: '/titan_hammer.png',
    slots: { lasers: 8, shields: 4, engines: 2, utility: 1 },
    shld: 120,
    cargo_capacity: 1200,
    cost: 1000000
  },
  {
    id: 'support',
    name: 'Helix Support (Soporte)',
    hp: 110,
    atk: 60,
    spd: 100,
    color: '#33ff99',
    desc: 'Versátil con muchas utilidades',
    image: '/helix_support.png',
    slots: { lasers: 2, shields: 3, engines: 4, utility: 6 },
    shld: 100,
    cargo_capacity: 2500,
    cost: 450000
  }
];

export const MODULES_CATALOG = [
  { id: 'laser_1', type: 'lasers',  name: 'Láser Básico',     cost: 300,  atk: 5,   icon: '🎯', image: '/basic_laser.png' },
  { id: 'laser_2', type: 'lasers',  name: 'Láser Plus',       cost: 800,  atk: 12,  icon: '🎯', image: '/plus_laser.png' },
  { id: 'laser_3', type: 'lasers',  name: 'Cañón Pesado',     cost: 2000, atk: 30,  icon: '🎯', image: '/heavy_laser.jpg' },
  
  { id: 'shield_1', type: 'shields', name: 'Escudo Liviano',   cost: 250,  shld: 20, icon: '🛡️' },
  { id: 'shield_2', type: 'shields', name: 'Escudo Reforzado', cost: 700,  shld: 50, icon: '🛡️' },
  
  { id: 'engine_1', type: 'engines', name: 'Micro Motor',     cost: 400,  spd: 15,  icon: '🚀' },
  { id: 'engine_2', type: 'engines', name: 'Turbo Motor',     cost: 1200, spd: 40,  icon: '🚀' },
  
  { id: 'util_1',   type: 'utility', name: 'Refuerzo HP',      cost: 500,  hp: 40,   icon: '⚛️' },
  { id: 'util_2',   type: 'utility', name: 'Superviviencia',   cost: 1500, hp: 100,  icon: '⚛️' },
  { id: 'util_repair_1', type: 'utility', name: 'Robot Reparación I', cost: 1200, repair_rate: 5.0, icon: '🔧' },
  { id: 'util_repair_2', type: 'utility', name: 'Robot Reparación II', cost: 3500, repair_rate: 7.5, icon: '🛠️' },
];

export const AMMO_CATALOG = [
  { id: 'standard', name: 'Estándar',  damage: 1.0, cost: 50,    count: 1000, icon: '⚪', color: '#ffffff', image: '/std_ammo.jpg' },
  { id: 'thermal',  name: 'Térmica',   damage: 1.5, cost: 15000, count: 1000, icon: '🔥', color: '#ff6600', image: '/thermal_ammo.jpg' },
  { id: 'plasma',   name: 'Plasma',    damage: 2.5, cost: 60000, count: 1000, icon: '🔷', color: '#ff33ff', image: '/plasma_ammo.jpg' },
  { id: 'siphon',   name: 'Sifón',     damage: 1.0, cost: 35000, count: 1000, icon: '🔋', color: '#33ff33', effect: 'shield_steal', image: '/siphon_ammo.png' },
];

export const MISSILE_CATALOG = [
  { id: 'missile_1', name: 'M-1 "Seta"',    damage: 500,  cost: 1500,   count: 1000, icon: '🚀', color: '#ffcc00' },
  { id: 'missile_2', name: 'M-2 "Ciclón"',  damage: 1200, cost: 10000,  count: 1000, icon: '🚀', color: '#ff6600' },
  { id: 'missile_3', name: 'M-3 "Giga-Nuke"', damage: 3500, cost: 35000,  count: 1000, icon: '☢️', color: '#ff0000' },
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
