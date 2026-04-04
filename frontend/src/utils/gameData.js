export const SHIPS = [
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
    cargo_capacity: 80
  },
  {
    id: 'fast',
    name: 'Nova Striker (Rápida)',
    hp: 80,
    atk: 110,
    spd: 180,
    color: '#00ccff',
    desc: 'Frágil pero muy rápida ⚡',
    image: '/nova_striker.png',
    slots: { lasers: 3, shields: 2, engines: 7, utility: 2 },
    shld: 50,
    cargo_capacity: 30
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
    cargo_capacity: 40
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
    cargo_capacity: 50
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
    cargo_capacity: 120
  }
];

export const MODULES_CATALOG = [
  { id: 'laser_1', type: 'lasers',  name: 'Láser Básico',     cost: 300,  atk: 5,   icon: '🎯' },
  { id: 'laser_2', type: 'lasers',  name: 'Láser Plus',       cost: 800,  atk: 12,  icon: '🎯' },
  { id: 'laser_3', type: 'lasers',  name: 'Cañón Pesado',     cost: 2000, atk: 30,  icon: '🎯' },
  
  { id: 'shield_1', type: 'shields', name: 'Escudo Liviano',   cost: 250,  shld: 20, icon: '🛡️' },
  { id: 'shield_2', type: 'shields', name: 'Escudo Reforzado', cost: 700,  shld: 50, icon: '🛡️' },
  
  { id: 'engine_1', type: 'engines', name: 'Micro Motor',     cost: 400,  spd: 15,  icon: '🚀' },
  { id: 'engine_2', type: 'engines', name: 'Turbo Motor',     cost: 1200, spd: 40,  icon: '🚀' },
  
  { id: 'util_1',   type: 'utility', name: 'Refuerzo HP',      cost: 500,  hp: 40,   icon: '⚛️' },
  { id: 'util_2',   type: 'utility', name: 'Superviviencia',   cost: 1500, hp: 100,  icon: '⚛️' },
];

export const AMMO_CATALOG = [
  { id: 'standard', name: 'Estándar',  damage: 1.0, cost: 50,    count: 1000, icon: '⚪', color: '#ffffff' },
  { id: 'thermal',  name: 'Térmica',   damage: 1.5, cost: 500,  count: 50,   icon: '🔥', color: '#ff6600' },
  { id: 'plasma',   name: 'Plasma',    damage: 2.5, cost: 1200, count: 25,   icon: '🔷', color: '#ff33ff' },
  { id: 'siphon',   name: 'Sifón',     damage: 1.0, cost: 800,  count: 30,   icon: '🔋', color: '#33ff33', effect: 'shield_steal' },
];

export const MISSILE_CATALOG = [
  { id: 'missile_1', name: 'M-1 "Seta"',    damage: 500,  cost: 1000,  count: 5, icon: '🚀', color: '#ffcc00' },
  { id: 'missile_2', name: 'M-2 "Ciclón"',  damage: 1200, cost: 3000,  count: 3, icon: '🚀', color: '#ff6600' },
  { id: 'missile_3', name: 'M-3 "Giga-Nuke"', damage: 3500, cost: 7500, count: 1, icon: '☢️', color: '#ff0000' },
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
