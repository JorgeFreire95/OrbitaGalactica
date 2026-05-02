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
    cargo_capacity: 500,
    cost: 0
  },
  {
    id: 'tank',
    name: 'Aegis Vanguard',
    hp: 260000,
    shld: 150,
    atk: 70,
    spd: 260,
    color: '#ffb300',
    desc: 'Un acorazado pesado diseñado para absorber grandes cantidades de castigo.',
    image: '/aegis_vanguard_v2.png?v=2',
    ui_image: '/aegis_vanguard_v2.png?v=2',
    slots: { lasers: 8, shields: 10, engines: 5, utility: 3 },
    cargo_capacity: 800,
    cost: 285000
  },
  {
    id: 'fast',
    name: 'Nova Striker (Rápida)',
    hp: 116000,
    atk: 110,
    spd: 330,
    color: '#00ccff',
    desc: 'Frágil pero muy rápida ⚡',
    image: '/nova_striker_v2.png?v=2',
    slots: { lasers: 4, shields: 3, engines: 3, utility: 2 },
    shld: 50,
    cargo_capacity: 500,
    cost: 70000
  },
  {
    id: 'stealth',
    name: 'Orion Phantom',
    hp: 164000,
    shld: 80,
    atk: 130,
    spd: 360,
    color: '#9933ff',
    desc: 'Una nave de asalto sigilosa capaz de emboscar enemigos sin ser detectada.',
    image: '/orion_phantom_v2.png?v=2',
    ui_image: '/orion_phantom_v2.png?v=2',
    slots: { lasers: 6, shields: 4, engines: 4, utility: 2 },
    cargo_capacity: 600,
    cost: 100000
  },
  {
    id: 'heavy',
    name: 'Titan Hammer',
    hp: 356000,
    shld: 150,
    atk: 180,
    spd: 300,
    color: '#ff3333',
    desc: 'Una nave pesada con una potencia de fuego devastadora y un blindaje impenetrable.',
    image: '/titan_hammer_v2.png?v=2',
    ui_image: '/titan_hammer_v2.png?v=2',
    slots: { lasers: 15, shields: 7, engines: 7, utility: 3 },
    cargo_capacity: 1500,
    cost: 100000,
    currency: 'paladio'
  },
  {
    id: 'support',
    name: 'Helix Support',
    hp: 375000,
    shld: 120,
    atk: 60,
    spd: 300,
    color: '#33ff99',
    desc: 'Nave de apoyo táctico avanzada. Habilidades: Reparación de Vida y Reparación de Escudo (estacas de área para aliados).',
    image: '/helix_support_v2.png?v=2',
    ui_image: '/helix_support_v2.png?v=2',
    slots: { lasers: 10, shields: 7, engines: 8, utility: 3 },
    cargo_capacity: 2000,
    abilities: [
      { name: "Reparación de Vida", desc: "Con esta habilidad, tu nave arrojará una unidad que restablecerá poco a poco los PV de todas tus naves amigas cercanas.", icon: '🔧' },
      { name: "Reparación de Escudo", desc: "Con esta habilidad, tu nave arrojará una unidad que restablecerá poco a poco los Escudos de todas tus naves amigas cercanas.", icon: '🛡️' }
    ],
    cost: 200000,
    currency: 'paladio'
  },
  {
    id: 'sovereign',
    name: 'Sovereign Exterminator',
    desc: 'El pináculo del combate táctico. Equipada con 14 ranuras de láser y un casco reforzado con tecnología de materia oscura.',
    image: '/sovereign_v3.png?v=3',
    cost: 200000,
    currency: 'paladio',
    hp: 360000, shld: 250, spd: 220, cargo_capacity: 1500,
    slots: { lasers: 14, shields: 7, engines: 8, utility: 3 }
  },
  {
    id: 'harvester',
    name: 'Cosmic Harvester',
    desc: 'Una planta de procesamiento móvil. Su bodega ultra-expandida permite recolectar flotas enteras de minerales.',
    image: '/harvester_v2.png?v=2',
    cost: 250000,
    currency: 'paladio',
    hp: 325000, shld: 150, spd: 400, cargo_capacity: 1500,
    slots: { lasers: 13, shields: 5, engines: 5, utility: 3 }
  },
  {
    id: 'interceptor',
    name: 'Solar Wind',
    desc: 'La nave más rápida jamás construida. Su diseño minimalista sacrifica blindaje por una velocidad de evasión inigualable.',
    image: '/interceptor_v2.png?v=2',
    cost: 45000,
    currency: 'paladio',
    hp: 200000, shld: 120, spd: 370, cargo_capacity: 500,
    slots: { lasers: 5, shields: 6, engines: 6, utility: 2 },
    abilities: [
      { id: 'invulnerability', name: "Invulnerabilidad", desc: "Te hace completamente invulnerable a todo daño durante 7 segundos. Enfriamiento: 60s.", icon: '✨', duration: 7, cooldown: 60 },
      { id: 'advanced_invisibility', name: "Invisibilidad Avanzada", desc: "Te hace invisible por 7 segundos y no se revela al disparar. Enfriamiento: 60s.", icon: '👻', duration: 7, cooldown: 60 }
    ]
  },
  {
    id: 'bastion',
    name: 'Obsidian Bastion',
    desc: 'Una fortaleza inexpugnable. Su casco de obsidiana reforzada y sus múltiples generadores de escudo la hacen casi indestructible.',
    image: '/bastion_v2.png?v=2',
    cost: 160000,
    currency: 'paladio',
    hp: 650000, shld: 400, spd: 240, cargo_capacity: 4000,
    slots: { lasers: 7, shields: 15, engines: 5, utility: 5 },
    abilities: [
      { id: 'provocation', name: "Provocación", desc: "Redirige los ataques de todos los enemigos hacia ti durante 10 segundos. Enfriamiento: 90s.", icon: '📣', duration: 10, cooldown: 90 },
      { id: 'shield_reinforcement', name: "Refuerzo de Escudo", desc: "Aumenta tu escudo máximo en un 15% durante 10 segundos. Enfriamiento: 60s.", icon: '🛡️', duration: 10, cooldown: 60 }
    ]
  }
];

export const MODULES_CATALOG = [
  { id: 'laser_1', type: 'lasers', lvl: 1, name: 'Láser LF-1',      cost: 10000, atk: 40,   icon: '🔫', desc: 'Emisor de partículas básico para combate de corto alcance.', image: '/basic_laser.png' },
  { id: 'laser_2', type: 'lasers', lvl: 2, name: 'Láser Plus',      cost: 5000,  currency: 'paladio', atk: 100,  icon: '🔫', desc: 'Versión mejorada con mayor estabilidad de haz y daño concentrado.', image: '/plus_laser.png' },
  { id: 'laser_3', type: 'lasers', lvl: 3, name: 'Cañón Pesado',    cost: 10000, currency: 'paladio', atk: 180,  icon: '🔫', desc: 'Tecnología de última generación que dispara ráfagas de plasma altamente destructivas.', image: '/heavy_laser.jpg' },
  
  { id: 'shield_1', type: 'shields', lvl: 1, name: 'Escudo Liviano',   cost: 16000, shld: 2000, icon: '🛡️', absorption: 0.5, desc: 'Generador de campo defensivo básico con absorción del 50%.', image: '/light_shield.png' },
  { id: 'shield_2', type: 'shields', lvl: 2, name: 'Escudo Reforzado', cost: 25000, currency: 'paladio', shld: 5000, icon: '🛡️', absorption: 0.6, desc: 'Estructura molecular optimizada para una mayor capacidad de energía y absorción del 60%.', image: '/reinforced_shield.png' },
  { id: 'shield_3', type: 'shields', lvl: 3, name: 'Escudo Hiper',    cost: 50000, currency: 'paladio', shld: 10000, icon: '🛡️', absorption: 0.8, desc: 'Defensa de grado militar. Absorción masiva del 80% y altísima capacidad de carga.', image: '/hyper_shield.png' },
  
  { id: 'engine_1', type: 'engines', lvl: 1, name: 'Micro Motor',     cost: 16000, spd: 5,  icon: '🚀', desc: 'Propulsor estándar de bajo consumo para naves ligeras.', image: '/micro_motor.png' },
  { id: 'engine_2', type: 'engines', lvl: 2, name: 'Turbo Motor',     cost: 3000, currency: 'paladio', spd: 7,  icon: '🚀', desc: 'Inyectores de paladio que permiten una aceleración significativamente mayor.', image: '/turbo_motor.png' },
  { id: 'engine_3', type: 'engines', lvl: 3, name: 'Hiper Motor',     cost: 6000, currency: 'paladio', spd: 10,  icon: '🚀', desc: 'Núcleo de energía inestable que impulsa la nave a velocidades extremas.', image: '/hyper_motor.png' },
  
  { id: 'util_repair_1', type: 'utility', lvl: 1, name: 'Robot Reparación I', cost: 10000, repair_rate: 315, icon: '🔧', desc: 'Unidad de mantenimiento automatizada básica para reparaciones en el casco.', image: '/repair_robot_1.jpg' },
  { id: 'util_repair_2', type: 'utility', lvl: 2, name: 'Robot Reparación II', cost: 15000, currency: 'paladio', repair_rate: 1155, icon: '🛠️', desc: 'Robot de nanotecnología avanzada capaz de reparar daños estructurales a gran velocidad.', image: '/repair_robot_2.jpg' },
  { id: 'util_cloak', type: 'utility', lvl: 2, name: 'Camuflaje Sigiloso', cost: 500, currency: 'paladio', desc: 'Activa invisibilidad inmediata. Se desactiva al atacar.', icon: '👻', image: '/cloak_extra.png' },
  { id: 'util_auto_repair_cpu', type: 'utility', lvl: 2, name: 'AUTO-CPU de roboreparación', cost: 10000, currency: 'paladio', desc: 'Inicia automáticamente a un robot de reparación disponible cuando no estás en combate.', icon: '🤖', is_auto_repair: true },
  { id: 'util_turbo_missile', type: 'utility', lvl: 2, name: 'Misil Turbo', cost: 10000, currency: 'paladio', desc: 'Duplica la velocidad de lanzamiento de los misiles.', icon: '☄️', is_turbo_missile: true },
  { id: 'util_auto_missile', type: 'utility', lvl: 2, name: 'CPU Misil Automático', cost: 25000, currency: 'paladio', desc: 'Dispara misiles automáticamente lo más rápido posible durante un ataque.', icon: '🛰️', is_auto_missile: true },
  { id: 'util_cloak_l', type: 'utility', lvl: 2, name: 'CPU de camuflaje L', cost: 5000, currency: 'paladio', desc: 'Proporciona 10 camuflajes para hacer tu nave invisible.', icon: '🎭', charges: 10, is_cloak_cpu: true },
  { id: 'util_cloak_xl', type: 'utility', lvl: 2, name: 'CPU de camuflaje XL', cost: 22500, currency: 'paladio', desc: 'Proporciona 50 camuflajes para hacer tu nave invisible.', icon: '👺', charges: 50, is_cloak_cpu: true },
  { id: 'util_cargo_compressor', type: 'utility', lvl: 2, name: 'Compresor de Carga', cost: 10000, currency: 'paladio', desc: 'Duplica el tonelaje disponible con compresión molecular.', icon: '🎒', is_cargo_compressor: true },
  { id: 'util_slot_cpu_1', type: 'utility', lvl: 1, name: 'CPU 1 de ranura', cost: 600000, currency: 'credits', desc: 'Añade 2 nuevas ranuras libres para extras en la nave.', icon: '🎛️', extraSlots: 2 },
  { id: 'util_slot_cpu_2', type: 'utility', lvl: 2, name: 'CPU 2 de ranura', cost: 150000, currency: 'paladio', desc: 'Proporciona 6 nuevas ranuras para extras para tu nave.', icon: '📟', extraSlots: 6 },
  { id: 'util_slot_cpu_3', type: 'utility', lvl: 3, name: 'CPU 3 de ranura', cost: 250000, currency: 'paladio', desc: 'Proporciona 10 ranuras nuevas para extras en la nave.', icon: '📼', extraSlots: 10 },
];

export const WIPS_CATALOG = [
  { id: 'dron', name: 'Dron', cost: 100000, slots: 1, desc: 'Wip básico con 1 ranura para arma o escudo.', icon: '🛰️', image: '/wisp_v1.png' },
  { id: 'sparks', name: 'Sparks', cost: 15000, currency: 'paladio', slots: 2, desc: 'Wip avanzado con 2 ranuras para arma o escudo.', icon: '🛰️', image: '/wisp_v2.png' }
];

export const AMMO_CATALOG = [
  { id: 'standard', name: 'Estándar',  damage: 1.0, cost: 10,      count: 1, icon: '⚪', color: '#ff0000', image: '/std_ammo.jpg', isStackable: true },
  { id: 'thermal',  name: 'Térmica',   damage: 1.5, cost: 0.5,     currency: 'paladio', count: 1, icon: '🔥', color: '#ff0000', image: '/thermal_ammo.jpg', isStackable: true },
  { id: 'plasma',   name: 'Plasma',    damage: 2.5, cost: 1,       currency: 'paladio', count: 1, icon: '🔷', color: '#ff0000', image: '/plasma_ammo.jpg', isStackable: true },
  { id: 'siphon',   name: 'Sifón',     damage: 1.0, cost: 1,       currency: 'paladio', count: 1, icon: '🔋', color: '#33ff33', effect: 'shield_steal', image: '/siphon_ammo.png', isStackable: true },
];

export const MISSILE_CATALOG = [
  { id: 'missile_1', name: 'M-1 "Seta"',    damage: 1000,  cost: 100,   count: 1, icon: '🚀', image: '/m1_seta.jpg', color: '#ffcc00', isStackable: true },
  { id: 'missile_2', name: 'M-2 "Ciclón"',  damage: 2000, cost: 500,  count: 1, icon: '🚀', image: '/m2_ciclon.jpg', color: '#ff6600', isStackable: true },
  { id: 'missile_3', name: 'M-3 "Giga-Nuke"', damage: 4000, cost: 5, currency: 'paladio', count: 1, icon: '☢️', image: '/m3_giganuke.jpg', color: '#ff0000', isStackable: true },
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
  { id: 'proto_radar_1', type: 'protocols', lvl: 1, name: 'Protocolo de Radar I', cost: 3000, currency: 'paladio', radar_bonus: 0.02, icon: '📡', desc: 'Aumenta el alcance del radar de tu ECO en un 2%.' },
  { id: 'proto_radar_2', type: 'protocols', lvl: 2, name: 'Protocolo de Radar II', cost: 7500, currency: 'paladio', radar_bonus: 0.06, icon: '📡', desc: 'Aumenta el alcance del radar de tu ECO en un 6%.' },
  { id: 'proto_radar_3', type: 'protocols', lvl: 3, name: 'Protocolo de Radar III', cost: 25000, currency: 'paladio', radar_bonus: 0.12, icon: '📡', desc: 'Aumenta el alcance del radar de tu ECO en un 12%.' },
  { id: 'proto_laser_1', type: 'protocols', lvl: 1, name: 'Protocolo de Arma Láser I', cost: 5000, currency: 'paladio', laser_bonus: 0.01, icon: '🎯', desc: 'Aumenta los daños de láser de tu ECO en un 1%.' },
  { id: 'proto_laser_2', type: 'protocols', lvl: 2, name: 'Protocolo de Arma Láser II', cost: 12500, currency: 'paladio', laser_bonus: 0.02, icon: '🎯', desc: 'Aumenta los daños de láser de tu ECO en un 2%.' },
  { id: 'proto_laser_3', type: 'protocols', lvl: 3, name: 'Protocolo de Arma Láser III', cost: 45000, currency: 'paladio', laser_bonus: 0.04, icon: '🎯', desc: 'Aumenta los daños de láser de tu ECO en un 4%.' },
  { id: 'proto_hp_1', type: 'protocols', lvl: 1, name: 'Protocolo de PV I', cost: 5000, currency: 'paladio', hp_bonus: 0.01, icon: '❤️', desc: 'Aumenta los PV de tu ECO en un 1%.' },
  { id: 'proto_hp_2', type: 'protocols', lvl: 2, name: 'Protocolo de PV II', cost: 12500, currency: 'paladio', hp_bonus: 0.02, icon: '❤️', desc: 'Aumenta los PV de tu ECO en un 2%.' },
  { id: 'proto_hp_3', type: 'protocols', lvl: 3, name: 'Protocolo de PV III', cost: 45000, currency: 'paladio', hp_bonus: 0.04, icon: '❤️', desc: 'Aumenta los PV de tu ECO en un 4%.' },
  { id: 'proto_econ_1', type: 'protocols', lvl: 1, name: 'Protocolo de Economía I', cost: 5000, currency: 'paladio', econ_bonus: 0.03, icon: '⛽', desc: 'Reduce el consumo de combustible de tu ECO en un 3%.' },
  { id: 'proto_econ_2', type: 'protocols', lvl: 2, name: 'Protocolo de Economía II', cost: 12500, currency: 'paladio', econ_bonus: 0.035, icon: '⛽', desc: 'Reduce el consumo de combustible de tu ECO en un 3.5%.' },
  { id: 'proto_econ_3', type: 'protocols', lvl: 3, name: 'Protocolo de Economía III', cost: 45000, currency: 'paladio', econ_bonus: 0.04, icon: '⛽', desc: 'Reduce el consumo de combustible de tu ECO en un 4%.' },
  { id: 'proto_alien_1', type: 'protocols', lvl: 1, name: 'Protocolo Antialienígenas I', cost: 3000, currency: 'paladio', anti_alien_bonus: 0.01, icon: '👽', desc: 'Aumenta los daños de tu ECO contra alienígenas en un 1%.' },
  { id: 'proto_alien_2', type: 'protocols', lvl: 2, name: 'Protocolo Antialienígenas II', cost: 7500, currency: 'paladio', anti_alien_bonus: 0.03, icon: '👽', desc: 'Aumenta los daños de tu ECO contra alienígenas en un 3%.' },
  { id: 'proto_alien_3', type: 'protocols', lvl: 3, name: 'Protocolo Antialienígenas III', cost: 25000, currency: 'paladio', anti_alien_bonus: 0.06, icon: '👽', desc: 'Aumenta los daños de tu ECO contra alienígenas en un 6%.' },
];

export const DESIGNS_CATALOG = [
  {
    id: 'design_sovereign_ember_fang',
    type: 'design',
    name: 'Sovereign Exterminator Ember Fang',
    ship_id: 'sovereign',
    bonus: { xp: 0.15 },
    cost: 50000,
    currency: 'paladio',
    desc: 'Un diseño legendario que imbuye al Sovereign Exterminator con la furia del Colmillo de Brasa. Otorga un 15% de experiencia adicional al estar equipado.',
    image: '/ember_fang.png',
    icon: '🔥'
  },
  {
    id: 'design_support_emerald',
    type: 'design',
    name: 'Helix Support Emerald Guardian',
    ship_id: 'support',
    bonus: { hp: 0.10, shld: 0.10 },
    cost: 60000,
    currency: 'paladio',
    desc: 'Un diseño de vanguardia médica que refuerza la integridad estructural y los escudos del Helix Support. Otorga un 10% de vida y 10% de escudo adicionales.',
    image: '/helix_emerald.png',
    icon: '💚'
  },
  {
    id: 'design_harvester_industrial',
    type: 'design',
    name: 'Harvester Dynimeric Industrial',
    ship_id: 'harvester',
    bonus: { dmg: 0.20 },
    cost: 75000,
    currency: 'paladio',
    desc: 'Un diseño industrial reforzado por Dynimeric. Incrementa la potencia de fuego un 20% para una extracción y defensa agresiva.',
    image: '/harvester_industrial.png',
    icon: '🚜'
  },
  {
    id: 'design_solar_wind_eclipse',
    type: 'design',
    name: 'Solar Wind Crimson Eclipse',
    ship_id: 'interceptor',
    bonus: { shld: 0.10, absorption: 0.05 },
    cost: 80000,
    currency: 'paladio',
    desc: 'Un diseño elegante de oro y obsidiana con núcleos de energía roja. Otorga un 10% de escudo adicional y absorbe un 5% de los daños enemigos.',
    image: '/solar_wind_eclipse.png',
    icon: '🌘'
  },
  {
    id: 'design_bastion_celestial',
    type: 'design',
    name: 'Obsidian Bastion Celestial Fortress',
    ship_id: 'bastion',
    bonus: { hp: 0.15, shld: 0.15, absorption: 0.15 },
    cost: 120000,
    currency: 'paladio',
    desc: 'Una megaestructura circular convertida en nave de asalto. Otorga un 15% de vida, 15% de escudo y 15% de absorción de daño adicionales.',
    image: '/bastion_celestial.png',
    icon: '🪐'
  }
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
  { id: 'iridium',   name: 'Iridio',   color: '#cc00ff', icon: '🔮', stat: 'hp',   desc: 'Mejora casco base', sellPrice: 50 },
];

export const getItemById = (id) => {
  const all = [
    ...MODULES_CATALOG,
    ...AMMO_CATALOG,
    ...MISSILE_CATALOG,
    ...WIPS_CATALOG,
    ...SHIPS,
    ...ECO_PROTOCOLS,
    ...ECO_REPAIR,
    ...ECO_COLLECTOR,
    ...ECO_TRACKER,
    ...ECO_KAMIKAZE,
    ...ECO_SELF_REPAIR,
    ...ECO_FUEL,
    ...DESIGNS_CATALOG
  ];
  return all.find(item => item.id === id);
};
