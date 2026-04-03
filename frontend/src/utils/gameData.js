export const SHIPS = [
  {
    id: 'tank',
    name: 'Aegis Vanguard (Tanque)',
    hp: 180,
    atk: 70,
    spd: 60,
    eng: 120,
    color: '#ffb300',
    desc: 'Mucha resistencia, poco daño',
    image: '/aegis_vanguard.png',
    slots: { lasers: 2, shields: 6, engines: 3, utility: 2 },
    shld: 150
  },
  {
    id: 'fast',
    name: 'Nova Striker (Rápida)',
    hp: 80,
    atk: 110,
    spd: 180,
    eng: 100,
    color: '#00ccff',
    desc: 'Frágil pero muy rápida ⚡',
    image: '/nova_striker.png',
    slots: { lasers: 3, shields: 2, engines: 7, utility: 2 },
    shld: 50
  },
  {
    id: 'stealth',
    name: 'Orion Phantom (Sigilo)',
    hp: 90,
    atk: 130,
    spd: 140,
    eng: 140,
    color: '#9933ff',
    desc: 'Ideal para emboscadas',
    image: '/orion_phantom.png',
    slots: { lasers: 5, shields: 3, engines: 4, utility: 3 },
    shld: 80
  },
  {
    id: 'heavy',
    name: 'Titan Hammer (Pesada)',
    hp: 160,
    atk: 180,
    spd: 50,
    eng: 80,
    color: '#ff3333',
    desc: 'Lenta pero destructiva 💥',
    image: '/titan_hammer.png',
    slots: { lasers: 8, shields: 4, engines: 2, utility: 1 },
    shld: 120
  },
  {
    id: 'support',
    name: 'Helix Support (Soporte)',
    hp: 110,
    atk: 60,
    spd: 100,
    eng: 180,
    color: '#33ff99',
    desc: 'Mucha energía para habilidades',
    image: '/helix_support.png',
    slots: { lasers: 2, shields: 3, engines: 4, utility: 6 },
    shld: 100
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
  
  { id: 'util_1',   type: 'utility', name: 'Célula Energía',   cost: 500,  eng: 50,  icon: '⚛️' },
  { id: 'util_2',   type: 'utility', name: 'Núcleo Reactor',   cost: 1500, eng: 150, icon: '⚛️' },
];

export const AMMO_CATALOG = [
  { id: 'standard', name: 'Estándar',  damage: 1.0, cost: 0,    count: 1,    icon: '⚪', color: '#ffffff' },
  { id: 'thermal',  name: 'Térmica',   damage: 1.5, cost: 500,  count: 50,   icon: '🔥', color: '#ff6600' },
  { id: 'plasma',   name: 'Plasma',    damage: 2.5, cost: 1200, count: 25,   icon: '🔷', color: '#ff33ff' },
  { id: 'siphon',   name: 'Sifón',     damage: 1.0, cost: 800,  count: 30,   icon: '🔋', color: '#33ff33', effect: 'shield_steal' },
];
