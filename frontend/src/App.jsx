// Last update: 2026-04-25 01:17
import { useState, useEffect, useRef, useCallback } from 'react'
import GameCanvas from './components/GameCanvas'
import Hangar from './components/Hangar'
import Shop from './components/Shop'
import MainMenu from './components/MainMenu'
import Laboratory from './components/Laboratory'
import Clan from './components/Clan'
import Auth from './components/Auth'
import FactionSelect from './components/FactionSelect'
import AdminPanel from './components/AdminPanel'
import TopBar from './components/TopBar'
import NavigationBar from './components/NavigationBar'
import { SHIPS, WIPS_CATALOG, getItemById } from './utils/gameData'
import Ranking from './components/Ranking'
import Packages from './components/Packages'
import Missions from './components/Missions'
import FriendsPage from './components/FriendsPage'
import MessagesPage from './components/MessagesPage'
import Auctions from './components/Auctions'
import './index.css'

const API_URL = 'http://127.0.0.1:8000/api';
const WS_BASE_URL = 'ws://127.0.0.1:8000';

function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('game_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isGameActive, setIsGameActive] = useState(() => {
    return localStorage.getItem('og_game_running') === 'true';
  });

  const [inSafeZone, setInSafeZone] = useState(() => {
    return localStorage.getItem('og_player_safe_zone') === 'true';
  });

  const [currentView, setCurrentView] = useState(() => {
    const savedUser = sessionStorage.getItem('game_user');
    return savedUser ? 'menu' : 'auth';
  });
  const [selectedShipId, setSelectedShipId] = useState(() => {
    return localStorage.getItem('selected_ship_id') || 'starter';
  });
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Persistent Global State - Usamos localStorage para sincronizar entre el Menú y el Juego (Nueva Pestaña)
  const [credits, setCredits] = useState(() => {
    const val = localStorage.getItem('game_credits');
    return val !== null ? parseInt(val) : 50000;
  });
  
  const [equippedByShip, setEquippedByShip] = useState(() => {
    const saved = localStorage.getItem('equipped_modules');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('game_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [ammo, setAmmo] = useState(() => {
    const saved = localStorage.getItem('game_ammo');
    return saved ? JSON.parse(saved) : { 
      'standard': 9999,
      'thermal': 0,
      'plasma': 0,
      'siphon': 0,
      'missile_1': 0,
      'missile_2': 0,
      'missile_3': 0
    };
  });
  
  const [level, setLevel] = useState(() => {
    const val = localStorage.getItem('game_level');
    return val !== null ? parseInt(val) : 1;
  });

  const [xp, setXp] = useState(() => {
    const val = localStorage.getItem('game_xp');
    return val !== null ? parseInt(val) : 0;
  });

  const [minerals, setMinerals] = useState(() => {
    const saved = localStorage.getItem('game_minerals');
    return saved ? JSON.parse(saved) : { titanium: 0, plutonium: 0, silicon: 0, iridium: 0 };
  });

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('game_upgrades');
    // Si es el formato viejo (número), resetear a objeto
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.atk === 'number' || !parsed.hp) return { atk: [], shld: [], spd: [], hp: [] };
      return parsed;
    }
    return { atk: [], shld: [], spd: [], hp: [] };
  });

  const [paladio, setPaladio] = useState(() => {
    return parseInt(localStorage.getItem('game_paladio')) || 0;
  });

  const [clan, setClan] = useState(() => {
    const saved = localStorage.getItem('game_clan');
    return saved ? JSON.parse(saved) : null;
  });

  const [unreadMessages, setUnreadMessages] = useState(0);

  const [onlineCount, setOnlineCount] = useState(0);

  const [isInvisible, setIsInvisible] = useState(() => {
    return localStorage.getItem('game_is_invisible') === 'true';
  });

  const [ownedShips, setOwnedShips] = useState(() => {
    const saved = localStorage.getItem('owned_ships');
    return saved ? JSON.parse(saved) : ['starter'];
  });

  const [wips, setWips] = useState(() => {
    const saved = localStorage.getItem('game_wips');
    return saved ? JSON.parse(saved) : [];
  });

  const [equippedDesigns, setEquippedDesigns] = useState(() => {
    const saved = localStorage.getItem('game_equipped_designs');
    return saved ? JSON.parse(saved) : {};
  });

  const [logoutCountdown, setLogoutCountdown] = useState(null);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'game_equipped_designs' && e.newValue) {
        setEquippedDesigns(JSON.parse(e.newValue));
      }
      if (e.key === 'selected_ship_id' && e.newValue) {
        setSelectedShipId(e.newValue);
      }
      if (e.key === 'game_credits' && e.newValue) {
        setCredits(parseInt(e.newValue));
      }
      if (e.key === 'game_paladio' && e.newValue) {
        setPaladio(parseInt(e.newValue));
      }
      if (e.key === 'og_logout_trigger') {
        if (e.newValue && window.location.search.includes('play=true')) {
          setLogoutCountdown(10);
        } else if (!e.newValue) {
          setLogoutCountdown(null);
        }
      }
      if (e.key === 'og_game_running' && !e.newValue && !window.location.search.includes('play=true')) {
        // Si el juego se cerró y estábamos esperando para logout
        if (localStorage.getItem('og_logout_pending')) {
          handleLogout();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (logoutCountdown === null) return;
    if (logoutCountdown <= 0) {
      if (window.location.search.includes('play=true')) {
        window.close();
      } else {
        handleLogout();
      }
      return;
    }
    const timer = setTimeout(() => {
      setLogoutCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [logoutCountdown]);

  const startLogoutFlow = () => {
    const isGameRunning = localStorage.getItem('og_game_running') === 'true';
    const isGameWindow = window.location.search.includes('play=true');

    if (isGameWindow) {
      setLogoutCountdown(10);
    } else if (isGameRunning) {
      localStorage.setItem('og_logout_trigger', Date.now().toString());
      localStorage.setItem('og_logout_pending', 'true');
      // No ponemos countdown aquí, solo esperamos
      alert("Se ha solicitado el cierre de sesión. El juego se cerrará en 10 segundos.");
    } else {
      handleLogout();
    }
  };

  const [eco, setEco] = useState(() => {
    const saved = localStorage.getItem('game_eco');
    const defaultEco = {
      active: false,
      deployed: false,
      mode: 'passive',
      level: 1,
      xp: 0,
      integrity: 50000,
      max_integrity: 50000,
      fuel: 100000,
      max_fuel: 100000,
      hp: 50000,
      max_hp: 50000,
      shield: 0,
      max_shield: 0,
      speed: 0,
      customName: 'E.C.O.',
      unlocked_slots: { lasers: 1, generators: 1, protocols: 1, utility: 1 },
      equipped: {
        lasers: [],
        generators: [],
        protocols: [],
        utility: []
      }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...defaultEco, 
          ...parsed, 
          equipped: { ...defaultEco.equipped, ...(parsed.equipped || {}) },
          unlocked_slots: { ...defaultEco.unlocked_slots, ...(parsed.unlocked_slots || {}) }
        };
      } catch (e) {
        return defaultEco;
      }
    }
    return defaultEco;
  });

  const [auctions, setAuctions] = useState([]);
  const [auctionResetIn, setAuctionResetIn] = useState(0);

  // Legacy fleet cleanup removed.

  // Auto-lanzamiento si se abre en pestaña nueva con ?play=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('play') === 'true') {
      setCurrentView('game');
      // Marcar el juego como activo solo si estamos en la vista de juego
      localStorage.setItem('og_game_running', 'true');
    }
    const token = params.get('token');
    if (token) {
      setCurrentView('reset_password');
    }
    fetchLeaderboard();
    fetchUnreadCount();
    if (user) {
      fetchClanData(user.username);
    }

    // Polling para correos sin leer cada 30 segundos
    const unreadInterval = setInterval(() => {
      if (user) fetchUnreadCount();
    }, 30000);

    return () => clearInterval(unreadInterval);
  }, [user, API_URL]);

  useEffect(() => {
    // Sincronización de Sesión de Juego entre pestañas
    const syncGameSession = (e) => {
      if (e.key === 'og_game_running') {
        setIsGameActive(e.newValue === 'true');
      }
      if (e.key === 'og_player_safe_zone') {
        setInSafeZone(e.newValue === 'true');
      }
    };

    const handleWindowClose = () => {
      // SOLO si esta pestaña es la que tiene el juego abierto
      if (window.location.search.includes('play=true')) {
        localStorage.removeItem('og_game_running');
        localStorage.removeItem('og_player_safe_zone');
      }
    };

    window.addEventListener('storage', syncGameSession);
    window.addEventListener('beforeunload', handleWindowClose);
    window.addEventListener('pagehide', handleWindowClose);

    return () => {
      window.removeEventListener('storage', syncGameSession);
      window.removeEventListener('beforeunload', handleWindowClose);
      window.removeEventListener('pagehide', handleWindowClose);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const resp = await fetch(`${API_URL}/leaderboard`);
      const data = await resp.json();
      if (data.leaderboard) setLeaderboard(data.leaderboard);
    } catch (e) {
      console.error("Error fetching leaderboard:", e);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${API_URL}/mail/unread_count/${user.username}`);
      if (resp.ok) {
        const data = await resp.json();
        setUnreadMessages(data.count || 0);
      }
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  };

  const fetchOnlineCount = async () => {
    try {
      const resp = await fetch(`${API_URL}/online_count`);
      const data = await resp.json();
      if (data.online_count !== undefined) setOnlineCount(data.online_count);
    } catch (e) {
      console.error("Error fetching online count:", e);
    }
  };

  // Synchronize dynamic updates coming from the Game Canvas window
  useEffect(() => {
    const handleStorageChange = (e) => {
      switch (e.key) {
        case 'game_credits': setCredits(parseInt(e.newValue) || 0); break;
        case 'game_paladio': setPaladio(parseInt(e.newValue) || 0); break;
        case 'game_level': setLevel(parseInt(e.newValue) || 0); break;
        case 'game_xp': setXp(parseInt(e.newValue) || 0); break;
        case 'game_minerals': if (e.newValue) setMinerals(JSON.parse(e.newValue)); break;
        case 'game_ammo': if (e.newValue) setAmmo(JSON.parse(e.newValue)); break;
        case 'game_inventory': if (e.newValue) setInventory(JSON.parse(e.newValue)); break;
        case 'equipped_modules': if (e.newValue) setEquippedByShip(JSON.parse(e.newValue)); break;
        case 'selected_ship_id': if (e.newValue) setSelectedShipId(e.newValue); break;
        case 'owned_ships': if (e.newValue) setOwnedShips(JSON.parse(e.newValue)); break;
        case 'game_upgrades': if (e.newValue) setUpgrades(JSON.parse(e.newValue)); break;
        case 'game_wips': if (e.newValue) setWips(JSON.parse(e.newValue)); break;
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('game_credits', credits);
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('selected_ship_id', selectedShipId);
  }, [selectedShipId]);

  useEffect(() => {
    localStorage.setItem('equipped_modules', JSON.stringify(equippedByShip));
  }, [equippedByShip]);

  useEffect(() => {
    localStorage.setItem('game_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('game_ammo', JSON.stringify(ammo));
  }, [ammo]);

  useEffect(() => {
    localStorage.setItem('game_level', level);
  }, [level]);

  useEffect(() => {
    localStorage.setItem('game_xp', xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('game_minerals', JSON.stringify(minerals));
  }, [minerals]);

  useEffect(() => {
    localStorage.setItem('game_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('owned_ships', JSON.stringify(ownedShips));
  }, [ownedShips]);

  useEffect(() => {
    localStorage.setItem('game_paladio', paladio);
  }, [paladio]);

  useEffect(() => {
    localStorage.setItem('game_clan', JSON.stringify(clan));
  }, [clan]);

  useEffect(() => {
    localStorage.setItem('game_is_invisible', isInvisible);
  }, [isInvisible]);

  useEffect(() => {
    localStorage.setItem('game_wips', JSON.stringify(wips));
  }, [wips]);

  useEffect(() => {
    localStorage.setItem('game_eco', JSON.stringify(eco));
  }, [eco]);

  // SYNC STATS WITH BACKEND (Debounced to prevent race conditions during multiple state updates)
  const syncStats = async () => {
    if (!user || currentView === 'auth') return;
    
    // VALIDACIÓN DE SEGURIDAD: Nunca sincronizar si los valores parecen reseteados accidentalmente
    // El nivel nunca puede ser 0 en este juego (mínimo 1)
    if (level <= 0) {
      console.warn("Sincronización abortada: Nivel detectado como 0. Posible error de estado.");
      return;
    }

    // Clear existing timer
    if (window.syncTimer) clearTimeout(window.syncTimer);
    
    window.syncTimer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/user/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            level,
            xp,
            credits,
            paladio,
            minerals,
            owned_ships: ownedShips,
            inventory,
            equipped: equippedByShip,
            timed_upgrades: upgrades,
            wips,
            eco,
            ammo
          })
        });
        const result = await response.json();
        if (result.success && result.updated_stats && hudState) {
          // Actualización instantánea del HUD local con los valores calculados por el servidor
          setHudState(prev => ({
            ...prev,
            max_cargo: result.updated_stats.max_cargo,
            hp: result.updated_stats.hp,
            max_hp: result.updated_stats.max_hp,
            shld: result.updated_stats.shld,
            max_shld: result.updated_stats.max_shld,
            atk: result.updated_stats.atk,
            spd: result.updated_stats.spd
          }));
        }
      } catch (e) {
        console.log("Sync error:", e);
      }
    }, 500); // 500ms debounce
  };

  const hydrateInventory = (rawInventory) => {
    if (!rawInventory) return [];
    
    const hydrated = [];
    const ammoToRestore = {};

    rawInventory.forEach(item => {
      if (typeof item === 'string') {
        const itemDef = getItemById(item);
        if (itemDef) {
          // If it's ammo or fuel that ended up in inventory by mistake
          if (itemDef.isStackable || itemDef.id.startsWith('missile') || ['thermal', 'plasma', 'siphon', 'standard'].includes(itemDef.id)) {
            const amount = itemDef.id.startsWith('missile') ? 1000 : 10000;
            ammoToRestore[item] = (ammoToRestore[item] || 0) + amount;
          } else {
            // It's a module ID
            hydrated.push({ ...itemDef, instanceId: Date.now() + Math.random() });
          }
        }
      } else {
        // It's already an object
        hydrated.push(item);
      }
    });

    if (Object.keys(ammoToRestore).length > 0 || rawInventory.some(i => typeof i === 'string')) {
      if (Object.keys(ammoToRestore).length > 0) {
        setAmmo(prev => {
          const newAmmo = { ...prev };
          Object.keys(ammoToRestore).forEach(id => {
            newAmmo[id] = (newAmmo[id] || 0) + ammoToRestore[id];
          });
          return newAmmo;
        });
      }
      // Force a sync soon to clean up the DB and persist hydrated objects
      setTimeout(syncStats, 2000);
    }

    return hydrated;
  };

  const hydrateEquipped = (rawEquipped) => {
    if (!rawEquipped) return {};
    const hydrated = {};
    let changed = false;
    Object.keys(rawEquipped).forEach(shipId => {
      hydrated[shipId] = rawEquipped[shipId].map(item => {
        if (typeof item === 'string') {
          const def = getItemById(item);
          changed = true;
          return def ? { ...def, instanceId: Date.now() + Math.random() } : null;
        }
        return item;
      }).filter(Boolean);
    });
    if (changed) setTimeout(syncStats, 2000);
    return hydrated;
  };

  const hydrateWips = (rawWips) => {
    if (!rawWips) return [];
    let changed = false;
    const hydrated = rawWips.map(wip => {
      const hydratedEquipped = (wip.equipped || []).map(item => {
        if (typeof item === 'string') {
          const def = getItemById(item);
          changed = true;
          return def ? { ...def, instanceId: Date.now() + Math.random() } : null;
        }
        return item;
      }).filter(Boolean);
      return { ...wip, equipped: hydratedEquipped };
    });
    if (changed) setTimeout(syncStats, 2000);
    return hydrated;
  };

  const hydrateEco = (rawEco) => {
    if (!rawEco) return { active: false };
    if (!rawEco.equipped) return rawEco;
    
    let changed = false;
    const hydratedEquipped = {};
    Object.keys(rawEco.equipped).forEach(type => {
      hydratedEquipped[type] = rawEco.equipped[type].map(item => {
        if (typeof item === 'string') {
          const def = getItemById(item);
          changed = true;
          return def ? { ...def, instanceId: Date.now() + Math.random() } : null;
        }
        return item;
      }).filter(Boolean);
    });
    
    if (changed) setTimeout(syncStats, 2000);
    return { ...rawEco, equipped: hydratedEquipped };
  };

  const refreshStats = async () => {
    if (!user || user.faction === null || currentView === 'auth') return;
    try {
      const resp = await fetch(`${API_URL}/user/stats?username=${user.username}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.credits !== credits) setCredits(data.credits);
        if (data.paladio !== paladio) setPaladio(data.paladio);
        if (data.level !== level) setLevel(data.level);
        if (data.xp !== xp) setXp(data.xp);
        
        // Refresh complex state if they differ
        if (data.owned_ships && JSON.stringify(data.owned_ships) !== JSON.stringify(ownedShips)) {
          setOwnedShips(data.owned_ships);
        }
        if (data.inventory && JSON.stringify(data.inventory) !== JSON.stringify(inventory)) {
          setInventory(hydrateInventory(data.inventory));
        }
        if (data.is_invisible !== undefined && data.is_invisible !== isInvisible) {
          setIsInvisible(data.is_invisible);
        }
        if (data.equipped && JSON.stringify(data.equipped) !== JSON.stringify(equippedByShip)) {
          setEquippedByShip(hydrateEquipped(data.equipped));
        }
        if (data.minerals && JSON.stringify(data.minerals) !== JSON.stringify(minerals)) {
          setMinerals(data.minerals);
        }
        if (data.wips && JSON.stringify(data.wips) !== JSON.stringify(wips)) {
          setWips(hydrateWips(data.wips));
        }
        if (data.eco && JSON.stringify(data.eco) !== JSON.stringify(eco)) {
          setEco(hydrateEco(data.eco));
        }
        if (data.ammo && JSON.stringify(data.ammo) !== JSON.stringify(ammo)) {
          setAmmo(data.ammo);
        }
        if (data.auctions) {
          console.log("Subastas recibidas:", data.auctions.length);
          setAuctions(data.auctions);
        }
        if (data.auction_reset_in !== undefined) {
          setAuctionResetIn(data.auction_reset_in);
        }
      }
      // Also refresh clan data periodically
      fetchClanData(user.username);
    } catch (e) {
      console.error("Error refreshing stats:", e);
    }
  };

  const fetchClanData = async (username) => {
    if (!username) return;
    try {
      const resp = await fetch(`${API_URL}/clan/my?username=${username}`);
      if (resp.ok) {
        const data = await resp.json();
        setClan(data.clan);
      }
    } catch (e) {
      console.log("Error fetching initial clan data:", e);
    }
  };

  // Polling for external updates (donations, taxes, admin edits)
  // Polling for external updates (donations, taxes, admin edits)
  useEffect(() => {
    if (!user) return;
    refreshStats(); // Cargar inmediatamente al montar o cambiar usuario
    const interval = setInterval(refreshStats, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user && currentView === 'subasta') {
      refreshStats();
    }
  }, [currentView]);

  // Real-time Presence WebSocket
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    let pollInterval = null;
    const connectPresence = () => {
      const WS_STATUS_URL = `${WS_BASE_URL}/ws/status`;
      ws = new WebSocket(WS_STATUS_URL);

      ws.onopen = () => {
        if (pollInterval) clearInterval(pollInterval);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'online_count') {
            setOnlineCount(data.count);
          }
        } catch (e) {
          console.error("Error parsing presence data:", e);
        }
      };

      ws.onclose = () => {
        console.log("Presence WS closed, reconnecting...");
        reconnectTimeout = setTimeout(connectPresence, 5000);
      };

      ws.onerror = () => {
        console.info("Presence System: WebSocket restricted locally. Using HTTP Fallback.");
        if (!pollInterval) {
          const fetchCount = async () => {
            try {
              const resp = await fetch(`${API_URL}/health`);
              const data = await resp.json();
              setOnlineCount(data.online_count ?? data.online_game ?? 0);
            } catch (e) {}
          };
          fetchCount();
          pollInterval = setInterval(fetchCount, 10000);
        }
        ws.close();
      };
    };

    connectPresence();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Sync on every relevant change (Transaction-based as requested)
  useEffect(() => {
    // We only sync if we are already logged in and not in the auth/faction screen
    if (user && user.faction) {
      syncStats();
    }
  }, [credits, paladio, xp, level, minerals, ownedShips, inventory, equippedByShip, upgrades, isInvisible, eco, wips]);

  useEffect(() => {
    if (user && user.faction) {
        sessionStorage.setItem('game_user', JSON.stringify(user));
    }
  }, [user]);

  // Limpieza periódica de mejoras expiradas (cada 10 segundos para mayor precisión visual)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const nextUpgrades = { ...upgrades };

      ['atk', 'shld', 'spd', 'hp'].forEach(stat => {
        const filtered = nextUpgrades[stat].filter(u => u.expires > now);
        if (filtered.length !== nextUpgrades[stat].length) {
          nextUpgrades[stat] = filtered;
          changed = true;
        }
      });

      if (changed) {
        setUpgrades(nextUpgrades);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [upgrades]);


  const handleLogin = async (username, password) => {
    try {
      const resp = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        const error = await resp.json();
        alert(error.detail || 'Error al iniciar sesión');
        return;
      }
      const data = await resp.json();
      if (data.clan) {
        setClan(data.clan);
      }
      
      // Initialize stats from database
      if (data.credits !== undefined) setCredits(data.credits);
      if (data.paladio !== undefined) setPaladio(data.paladio);
      if (data.level !== undefined) setLevel(data.level);
      if (data.xp !== undefined) setXp(data.xp);
      if (data.selected_ship) {
        setSelectedShipId(data.selected_ship);
        localStorage.setItem('selected_ship_id', data.selected_ship);
      }
      
      if (data.owned_ships) {
        setOwnedShips(data.owned_ships);
        localStorage.setItem('owned_ships', JSON.stringify(data.owned_ships));
      }
      if (data.inventory) {
        const hydrated = hydrateInventory(data.inventory);
        setInventory(hydrated);
        localStorage.setItem('game_inventory', JSON.stringify(hydrated));
      }
      if (data.equipped) {
        const hydrated = hydrateEquipped(data.equipped);
        setEquippedByShip(hydrated);
        localStorage.setItem('equipped_modules', JSON.stringify(hydrated));
      }
      if (data.minerals) {
        setMinerals(data.minerals);
        localStorage.setItem('game_minerals', JSON.stringify(data.minerals));
      }
      if (data.timed_upgrades) {
        setUpgrades(data.timed_upgrades);
        localStorage.setItem('game_upgrades', JSON.stringify(data.timed_upgrades));
      }
      if (data.is_invisible !== undefined) {
        setIsInvisible(data.is_invisible);
      }
      if (data.wips) {
        const hydrated = hydrateWips(data.wips);
        setWips(hydrated);
        localStorage.setItem('game_wips', JSON.stringify(hydrated));
      }
      if (data.eco) {
        const hydrated = hydrateEco(data.eco);
        setEco(hydrated);
        localStorage.setItem('game_eco', JSON.stringify(hydrated));
      }
      if (data.ammo) {
        setAmmo(data.ammo);
        localStorage.setItem('game_ammo', JSON.stringify(data.ammo));
      }

      if (!data.faction) {
        setUser(data);
        setCurrentView('faction_select');
      } else {
        sessionStorage.setItem('game_user', JSON.stringify(data));
        // Finalmente establecemos el usuario después de que todos los demás estados estén listos
        setUser(data);
        setCurrentView('menu');
      }
    } catch (e) {
      alert('Error de conexión con el servidor principal.');
    }
  };

  const handleRegister = async (regData) => {
    try {
      const resp = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regData.username, email: regData.email, password: regData.password })
      });
      if (!resp.ok) {
        const error = await resp.json();
        alert(error.detail || 'Error al registrarse');
        return;
      }
      const tempVip = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      setUser({ username: regData.username, email: regData.email, faction: null, vip_until: tempVip });
      setCurrentView('faction_select');
    } catch (e) {
      alert('Error de conexión con el servidor principal.');
    }
  };

  const handleSelectFaction = async (factionId) => {
    try {
      const resp = await fetch(`${API_URL}/set_faction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, faction: factionId })
      });
      if (!resp.ok) {
         alert('Error al establecer tu alineación.');
         return;
      }
      const updatedUser = { ...user, faction: factionId };
      setUser(updatedUser);
      sessionStorage.setItem('game_user', JSON.stringify(updatedUser)); 

      // Wipe current local stats and set standard fresh-start stats
      setCredits(50000);
      setPaladio(0);
      setLevel(1);
      setXp(0);
      setMinerals({ titanium: 0, plutonium: 0, silicon: 0, iridium: 0 });
      setInventory([]);
      setEquippedByShip({});
      setAmmo({ 
        'standard': 1000, 'thermal': 0, 'plasma': 0, 'siphon': 0,
        'missile_1': 0, 'missile_2': 0, 'missile_3': 0
      });
      setUpgrades({ atk: [], shld: [], spd: [] });
      setOwnedShips(['starter']);
      setSelectedShipId('starter');
      setWips([]);

      setCurrentView('menu');
    } catch (e) {
      alert('Error de conexión con el servidor principal.');
    }
  };

  const handleAuctionBid = async (auctionId, amount) => {
    try {
      const resp = await fetch(`${API_URL}/auctions/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, auction_id: auctionId, amount: parseInt(amount) })
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(data.message);
        refreshStats(); // Actualizar inmediatamente
      } else {
        alert(data.detail || 'Error al pujar');
      }
    } catch (e) {
      alert('Error de conexión.');
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      const resp = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      alert(data.message);
    } catch (e) {
      alert('Error al procesar la solicitud.');
    }
  };

  const handleResetPassword = async (newPassword) => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return alert('Token no encontrado en la URL.');

    try {
      const resp = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword })
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(data.message);
        window.history.replaceState({}, document.title, "/"); // Limpiar URL
        setCurrentView('auth');
      } else {
        alert(data.detail || 'Error al restablecer contraseña.');
      }
    } catch (e) {
      alert('Error de conexión.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('game_user');
    sessionStorage.removeItem('game_credits');
    sessionStorage.removeItem('game_paladio');
    sessionStorage.removeItem('game_level');
    sessionStorage.removeItem('game_xp');
    sessionStorage.removeItem('game_minerals');
    sessionStorage.removeItem('game_inventory');
    sessionStorage.removeItem('game_equipped');
    sessionStorage.removeItem('game_ammo');
    sessionStorage.removeItem('game_upgrades');
    localStorage.removeItem('game_clan');
    localStorage.removeItem('game_credits');
    localStorage.removeItem('game_paladio');
    localStorage.removeItem('game_level');
    localStorage.removeItem('game_xp');
    localStorage.removeItem('game_minerals');
    localStorage.removeItem('game_inventory');
    localStorage.removeItem('equipped_modules');
    localStorage.removeItem('game_ammo');
    localStorage.removeItem('game_upgrades');
    localStorage.removeItem('owned_ships');
    localStorage.removeItem('selected_ship_id');
    localStorage.removeItem('game_wips');
    localStorage.removeItem('og_game_running');
    localStorage.removeItem('og_player_safe_zone');
    
    sessionStorage.clear();
    localStorage.clear(); // Limpieza total para evitar fugas de datos

    
    localStorage.removeItem('og_logout_trigger');
    localStorage.removeItem('og_logout_pending');
    setUser(null);
    setCurrentView('auth');
    // Forzar recarga para resetear estados de React de forma limpia
    window.location.reload(); 
  };

  const handleBuyAmmo = (ammoId, count, cost, currency = 'credits') => {
    if (currency === 'paladio') {
      if (paladio < cost) return alert('No tienes suficiente paladio');
      setPaladio(prev => prev - cost);
    } else {
      if (credits < cost) return alert('No tienes suficientes créditos');
      setCredits(prev => prev - cost);
    }
    setAmmo(prev => ({
      ...prev,
      [ammoId]: (prev[ammoId] || 0) + count
    }));
  };

  const handleEquip = (moduleIndex, shipId) => {
    // SECURITY CHECK: Solo permitir equipar en Zona Segura si el juego está activo
    if (isGameActive && !inSafeZone) {
      alert("⚠️ PROTOCOLO DE SEGURIDAD: Debes estar en una Zona Segura (Base o Portal) para modificar la nave.");
      return;
    }

    const module = inventory[moduleIndex];
    if (!module) return;

    const ship = SHIPS.find(s => s.id === shipId);
    if (!ship) return;
    
    const currentEquipped = equippedByShip[shipId] || [];
    
    // RESTRICCIÓN: Solo una CPU de expansión de ranuras por nave
    const isSlotCpu = module.extraSlots || module.extraLaserSlots || module.extraShieldSlots || module.extraEngineSlots;
    if (isSlotCpu) {
      const alreadyHasSlotCpu = currentEquipped.some(m => 
        m.extraSlots || m.extraLaserSlots || m.extraShieldSlots || m.extraEngineSlots
      );
      if (alreadyHasSlotCpu) {
        alert("⚠️ Error: Solo puedes equipar UNA CPU de expansión de ranuras por nave.");
        return;
      }
    }
    
    // Calcular ranuras disponibles dinámicamente
    const extraUtilitySlots = currentEquipped.reduce((acc, m) => acc + (m.extraSlots || 0), 0);
    const extraLaserSlots = currentEquipped.reduce((acc, m) => acc + (m.extraLaserSlots || 0), 0);
    const extraShieldSlots = currentEquipped.reduce((acc, m) => acc + (m.extraShieldSlots || 0), 0);
    const extraEngineSlots = currentEquipped.reduce((acc, m) => acc + (m.extraEngineSlots || 0), 0);

    let totalSlotsForType = 0;
    if (module.type === 'utility') totalSlotsForType = (ship.slots.utility || 0) + extraUtilitySlots;
    else if (module.type === 'lasers') totalSlotsForType = (ship.slots.lasers || 0) + extraLaserSlots;
    else if (module.type === 'shields') totalSlotsForType = (ship.slots.shields || 0) + extraShieldSlots;
    else if (module.type === 'engines') totalSlotsForType = (ship.slots.engines || 0) + extraEngineSlots;
    else totalSlotsForType = ship.slots[module.type] || 0;

    const usedSlots = currentEquipped.filter(m => m.type === module.type).length;
    
    if (usedSlots >= totalSlotsForType) {
      alert(`No hay ranuras libres para ${module.type} en esta nave.`);
      return;
    }

    // Move from inventory to ship
    const newInventory = [...inventory];
    newInventory.splice(moduleIndex, 1);
    setInventory(newInventory);
    
    setEquippedByShip(prev => ({
      ...prev,
      [shipId]: [...(prev[shipId] || []), module]
    }));
  };

  const handleEquipWip = (moduleIndex, wipId) => {
    if (isGameActive && !inSafeZone) {
      alert("⚠️ PROTOCOLO DE SEGURIDAD: Debes estar en una Zona Segura para modificar los Wips.");
      return;
    }
    const module = inventory[moduleIndex];
    if (!module) return;
    if (module.type !== 'lasers' && module.type !== 'shields') {
      alert("Solo puedes equipar láseres o escudos en los Wips.");
      return;
    }

    const wipIndex = wips.findIndex(w => w.instanceId === wipId);
    if (wipIndex === -1) return;
    const wip = wips[wipIndex];
    const wipDef = WIPS_CATALOG.find(d => d.id === wip.type);
    
    if (wip.equipped.length >= wipDef.slots) {
      alert("Este Wip ya no tiene ranuras libres.");
      return;
    }

    const newInventory = [...inventory];
    newInventory.splice(moduleIndex, 1);
    setInventory(newInventory);

    const newWips = [...wips];
    newWips[wipIndex] = { ...wip, equipped: [...wip.equipped, module] };
    setWips(newWips);
  };

  const handleUnequipWip = (moduleInstanceId, wipId) => {
    if (isGameActive && !inSafeZone) {
      alert("⚠️ PROTOCOLO DE SEGURIDAD: Debes estar en una Zona Segura para modificar los Wips.");
      return;
    }
    const wipIndex = wips.findIndex(w => w.instanceId === wipId);
    if (wipIndex === -1) return;
    const wip = wips[wipIndex];
    
    const module = wip.equipped.find(m => m.instanceId === moduleInstanceId);
    if (!module) return;

    const newWips = [...wips];
    newWips[wipIndex] = { ...wip, equipped: wip.equipped.filter(m => m.instanceId !== moduleInstanceId) };
    setWips(newWips);

    setInventory(prev => [...prev, module]);
  };

  const handleBuyWip = (wipId) => {
    const SPARKS_PRICES = [15000, 24000, 42000, 60000, 84000, 96000, 126000, 200000];
    const currentWipsCount = wips.length;

    if (currentWipsCount >= 8) {
      alert("Ya has alcanzado el límite máximo de 8 Wips.");
      return false;
    }

    if (wipId === 'sparks') {
      const currentCost = SPARKS_PRICES[currentWipsCount];
      if (paladio < currentCost) {
        alert(`No tienes suficiente Paladio. Necesitas ${currentCost.toLocaleString()} PAL.`);
        return false;
      }
      setPaladio(prev => prev - currentCost);
    } else {
      // Dron: starts at 100,000 and doubles
      const currentCost = 100000 * Math.pow(2, currentWipsCount);
      if (credits < currentCost) {
        alert(`No tienes suficientes créditos. Necesitas ${currentCost.toLocaleString()} Cr.`);
        return false;
      }
      setCredits(prev => prev - currentCost);
    }

    setWips(prev => [...prev, {
      instanceId: Date.now(),
      type: wipId,
      equipped: [],
      integrity: 100
    }]);
    return true;
  };

  const handleBuyEco = (cost, name) => {
    if (paladio < cost) return false;
    if (eco.active) return false;
    setPaladio(prev => prev - cost);
    setEco(prev => ({ ...prev, active: true, customName: name || 'E.C.O.' }));
    return true;
  };

  const handleRenameEco = (newName) => {
    setEco(prev => ({ ...prev, customName: newName }));
  };

  const handleBuyProtocol = (protocol, cost) => {
    if (credits < cost) return false;
    setCredits(prev => prev - cost);
    setInventory(prev => [...prev, { ...protocol, instanceId: Date.now() }]);
    return true;
  };


  const handleBuyEcoFuel = (amount, totalCost) => {
    if (paladio < totalCost) return false;
    setPaladio(prev => prev - totalCost);
    setEco(prev => {
      const newFuel = (prev.fuel || 0) + amount;
      const maxFuel = prev.max_fuel || 100000;
      return {
        ...prev,
        fuel: Math.floor(Math.min(newFuel, maxFuel))
      };
    });
    return true;
  };

  const handleEquipEco = (inventoryIndex, ecoSlotType) => {
    if (isGameActive && !inSafeZone) {
      alert("⚠️ PROTOCOLO DE SEGURIDAD: Debes estar en una Zona Segura para modificar el E.C.O.");
      return;
    }

    const item = inventory[inventoryIndex];
    if (!item) return;

    // REQUISITOS DE NIVEL DEL ECO
    const ecoLevel = eco.level || 1;
    const itemLevel = item.lvl || 1;
    
    if (itemLevel === 2 && ecoLevel < 5) {
      alert("⚠️ REQUISITO DE NIVEL: El E.C.O. necesita nivel 5 para equipar este módulo.");
      return;
    }
    if (itemLevel === 3 && ecoLevel < 10) {
      alert("⚠️ REQUISITO DE NIVEL: El E.C.O. necesita nivel 10 para equipar este módulo.");
      return;
    }

    const currentEquipped = eco.equipped?.[ecoSlotType] || [];
    const unlockedCount = eco.unlocked_slots?.[ecoSlotType === 'generators' ? 'generators' : (ecoSlotType === 'lasers' ? 'lasers' : (ecoSlotType === 'protocols' ? 'protocols' : 'utility'))] || 1;
    
    if (currentEquipped.length >= unlockedCount) {
      alert(`⚠️ ERROR DE CAPACIDAD: Necesitas desbloquear más ranuras de ${ecoSlotType} usando Paladio.`);
      return;
    }

    const limits = { lasers: 5, generators: 10, protocols: 10, utility: 5 };
    if (currentEquipped.length >= (limits[ecoSlotType] || 0)) {
      alert(`El E.C.O. no tiene más ranuras disponibles para ${ecoSlotType}.`);
      return;
    }

    setInventory(prev => prev.filter((_, i) => i !== inventoryIndex));
    setEco(prev => ({
      ...prev,
      equipped: {
        ...(prev.equipped || { lasers: [], generators: [], protocols: [], utility: [] }),
        [ecoSlotType]: [...((prev.equipped && prev.equipped[ecoSlotType]) || []), item]
      }
    }));
  };

  const handleUnlockEcoSlot = (category) => {
    const UNLOCK_COST = 5000;
    if (paladio < UNLOCK_COST) {
      alert(`Necesitas ${UNLOCK_COST.toLocaleString()} de Paladio para desbloquear una ranura de ${category}.`);
      return;
    }

    if (!window.confirm(`¿Desbloquear ranura de ${category} por ${UNLOCK_COST.toLocaleString()} Paladio?`)) return;

    setPaladio(p => p - UNLOCK_COST);
    setEco(prev => {
      const current = prev.unlocked_slots || { lasers: 1, generators: 1, protocols: 1, utility: 1 };
      return {
        ...prev,
        unlocked_slots: {
          ...current,
          [category]: (current[category] || 1) + 1
        }
      };
    });
  };

  const handleUnequipEco = (moduleInstanceId, ecoSlotType) => {
    if (isGameActive && !inSafeZone) {
      alert("⚠️ PROTOCOLO DE SEGURIDAD: Debes estar en una Zona Segura para modificar el E.C.O.");
      return;
    }
    const item = eco.equipped[ecoSlotType].find(m => m.instanceId === moduleInstanceId);
    if (!item) return;

    setEco(prev => ({
      ...prev,
      equipped: {
        ...prev.equipped,
        [ecoSlotType]: prev.equipped[ecoSlotType].filter(m => m.instanceId !== moduleInstanceId)
      }
    }));
    setInventory(prev => [...prev, item]);
  };

  const handleUnequip = (instanceId, shipId) => {
    // SECURITY CHECK: Solo permitir desequipar en Zona Segura si el juego está activo
    if (isGameActive && !inSafeZone) {
      alert("⚠️ PROTOCOLO DE SEGURIDAD: Debes estar en una Zona Segura (Base o Portal) para modificar la nave.");
      return;
    }

    const currentEquipped = equippedByShip[shipId] || [];
    const module = currentEquipped.find(m => m.instanceId === instanceId);
    if (!module) return;

    // PROTECCIÓN: No permitir quitar CPU de ranuras si hay módulos que dependen de ellas
    const isSlotCpu = module.extraSlots || module.extraLaserSlots || module.extraShieldSlots || module.extraEngineSlots;
    if (isSlotCpu) {
      const ship = SHIPS.find(s => s.id === shipId);
      const remaining = currentEquipped.filter(m => m.instanceId !== instanceId);
      
      const checkCategory = (type, extraProp) => {
        const equippedCount = remaining.filter(m => m.type === type).length;
        const availableSlots = (ship.slots[type] || 0) + remaining.reduce((acc, m) => acc + (m[extraProp] || 0), 0);
        return equippedCount <= availableSlots;
      };

      if (!checkCategory('utility', 'extraSlots') || 
          !checkCategory('lasers', 'extraLaserSlots') || 
          !checkCategory('shields', 'extraShieldSlots') || 
          !checkCategory('engines', 'extraEngineSlots')) {
        alert("⚠️ No puedes desequipar esta CPU: Tienes demasiados módulos instalados. Quita primero algunos módulos para liberar espacio.");
        return;
      }
    }

    // Move from ship to inventory
    setEquippedByShip(prev => ({
      ...prev,
      [shipId]: prev[shipId].filter(m => m.instanceId !== instanceId)
    }));
    
    setInventory(prev => [...prev, module]);
  };

  const handleReset = () => {
    setCredits(2000);
    setEquippedByShip({});
    setInventory([]);
    setAmmo({ 
      'standard': 9999, 'thermal': 0, 'plasma': 0, 'siphon': 0,
      'missile_1': 0, 'missile_2': 0, 'missile_3': 0
    });
    setLevel(1);
    setXp(0);
    setMinerals({ titanium: 0, plutonium: 0, silicon: 0, iridium: 0 });
    setUpgrades({ atk: [], shld: [], spd: [] });
    localStorage.clear();
  };

  const handleUpdateMinerals = (newMinerals) => {
    setMinerals(newMinerals);
  };

  const handleRefine = (mineralType, cost, stat, amount) => {
    if (minerals[mineralType] < cost) return alert('No tienes suficientes minerales');
    
    setMinerals(prev => ({
      ...prev,
      [mineralType]: prev[mineralType] - cost
    }));
    
    const DURATION = 2 * 60 * 60 * 1000; // 2 Horas en ms
    const newEntry = {
      amount,
      expires: Date.now() + DURATION
    };

    setUpgrades(prev => ({
      ...prev,
      [stat]: [...prev[stat], newEntry]
    }));
    
    alert(`¡Mejora aplicada! +${amount}% a ${stat.toUpperCase()} (Duración: 2 Horas).`);
  };

  const handleSellMinerals = (mineralId, amount, totalCredits) => {
    setMinerals(prev => ({
      ...prev,
      [mineralId]: prev[mineralId] - amount
    }));
    setCredits(prev => prev + totalCredits);
  };

  const handleUpdatePaladio = (newUridium) => {
    setPaladio(newUridium);
  };

  const handleEquipDesign = (shipId, designId) => {
    setEquippedDesigns(prev => {
      const next = { ...prev };
      if (designId) {
        next[shipId] = designId;
      } else {
        delete next[shipId];
      }
      localStorage.setItem('game_equipped_designs', JSON.stringify(next));
      return next;
    });
  };

  const handleBuyShip = (shipId, shipCost) => {
    const ship = SHIPS.find(s => s.id === shipId);
    if (!ship) return false;
    
    const currency = ship.currency || 'credits';
    if (currency === 'paladio') {
      if (paladio < shipCost) {
        alert('No tienes suficiente paladio');
        return false;
      }
      setPaladio(prev => prev - shipCost);
    } else {
      if (credits < shipCost) {
        alert('No tienes suficientes créditos');
        return false;
      }
      setCredits(prev => prev - shipCost);
    }

    if (ownedShips.includes(shipId)) return false;
    setOwnedShips(prev => [...prev, shipId]);
    return true;
  };

  const handleRepair = async () => {
    if (!user) return false;
    try {
      const resp = await fetch(`${API_URL}/user/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      const data = await resp.json();
      if (data.success) {
        setCredits(data.credits);
        return true;
      } else {
        alert(data.error || "Error al reparar la nave.");
        return false;
      }
    } catch (error) {
      console.error("Repair error:", error);
      return false;
    }
  };

  const handleUpdateProgress = (newLvl, newXp) => {
    setLevel(newLvl);
    setXp(newXp);
  };

  const handleJoinGame = () => {
    setCurrentView('game');
  };

  const currentEquippedModules = equippedByShip[selectedShipId] || [];

  const isDashboardView = ['menu', 'hangar', 'shop', 'lab', 'clan', 'admin', 'packages', 'missions', 'subasta', 'messages', 'friends', 'ranking'].includes(currentView);

  return (
    <div className="app-container">
      {isDashboardView && (
        <>
          <TopBar 
            credits={credits} 
            paladio={paladio} 
            level={level} 
            onlineCount={onlineCount}
            user={user} 
            onLogout={startLogoutFlow} 
            onNavigate={setCurrentView} 
          />
          <NavigationBar currentView={currentView} onNavigate={setCurrentView} unreadCount={unreadMessages} />
        </>
      )}


      <div className="main-view-area">
        {currentView === 'auth' && (
        <Auth onLogin={handleLogin} onRegister={handleRegister} onForgotPassword={handleForgotPassword} />
      )}

      {currentView === 'reset_password' && (
        <div className="auth-wrapper">
          <div className="auth-page-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ color: '#00ffff', fontFamily: 'Orbitron', marginBottom: '20px' }}>NUEVA CONTRASEÑA</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const p = e.target.pass.value;
              const cp = e.target.conf.value;
              if (p !== cp) return alert('Las contraseñas no coinciden.');
              if (p.length < 4) return alert('La contraseña es muy corta.');
              handleResetPassword(p);
            }} className="register-form-vertical">
              <div className="reg-input-group">
                <label>NUEVA CONTRASEÑA</label>
                <input name="pass" type="password" required placeholder="Escribe tu nueva clave" />
              </div>
              <div className="reg-input-group">
                <label>CONFIRMAR CONTRASEÑA</label>
                <input name="conf" type="password" required placeholder="Repite la clave" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>ACTUALIZAR</button>
                <button type="button" className="btn-link" onClick={() => {
                   window.history.replaceState({}, document.title, "/");
                   setCurrentView('auth');
                }} style={{ flex: 1 }}>CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentView === 'faction_select' && (
        <FactionSelect onSelectFaction={handleSelectFaction} />
      )}

      {currentView === 'menu' && (
        <MainMenu 
          user={user}
          onNavigate={(view) => setCurrentView(view)} 
          onLogout={startLogoutFlow}
          credits={credits}
          paladio={paladio}
          xp={xp}
          level={level}
          unreadCount={unreadMessages}
          minerals={minerals}
          selectedShipId={selectedShipId}
          equippedByShip={equippedByShip}
          upgrades={upgrades}
          leaderboard={leaderboard}
          isGameActive={isGameActive}
          equippedDesign={equippedDesigns[selectedShipId]}
        />
      )}

        {currentView === 'missions' && (
          <Missions 
            user={user} 
            onNavigate={setCurrentView}
            credits={credits}
            level={level}
            xp={xp}
            paladio={paladio}
          />
        )}
        {currentView === 'friends' && (
          <FriendsPage 
            user={user}
            onNavigate={setCurrentView}
          />
        )}

      {currentView === 'hangar' && (
        <Hangar 
          user={user}
          selectedShipId={selectedShipId}
          setSelectedShipId={setSelectedShipId}
          equippedByShip={equippedByShip}
          inventory={inventory}
          ammo={ammo}
          level={level}
          xp={xp}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onBack={() => setCurrentView('menu')}
          onNavigate={setCurrentView}
          onReset={handleReset}
          credits={credits}
          paladio={paladio}
          minerals={minerals}
          upgrades={upgrades}
          onRefine={handleRefine}
          ownedShips={ownedShips}
          inSafeZone={inSafeZone}
          isPlaying={isGameActive}
          wips={wips}
          onEquipWip={handleEquipWip}
          onUnequipWip={handleUnequipWip}
          equippedDesigns={equippedDesigns}
          onEquipDesign={handleEquipDesign}
          eco={eco}
          onEquipEco={handleEquipEco}
          onUnequipEco={handleUnequipEco}
          onUnlockEcoSlot={handleUnlockEcoSlot}
          onRenameEco={handleRenameEco}
        />
      )}

      {currentView === 'shop' && (
        <Shop 
          selectedShipId={selectedShipId}
          credits={credits}
          setCredits={setCredits}
          paladio={paladio}
          setPaladio={setPaladio}
          equippedByShip={equippedByShip}
          inventory={inventory}
          setInventory={setInventory}
          ammo={ammo}
          onBuyAmmo={handleBuyAmmo}
          minerals={minerals}
          onSellMinerals={handleSellMinerals}
          upgrades={upgrades}
          level={level}
          onBack={() => setCurrentView('menu')}
          onNavigate={setCurrentView}
          ownedShips={ownedShips}
          onBuyShip={handleBuyShip}
          setIsInvisible={setIsInvisible}
          user={user}
          onBuyWip={handleBuyWip}
          wipsCount={wips.length}
          eco={eco}
          onBuyEco={handleBuyEco}
          onBuyProtocol={handleBuyProtocol}
          onBuyEcoFuel={handleBuyEcoFuel}
        />
      )}

      {currentView === 'lab' && (
        <Laboratory 
          minerals={minerals}
          upgrades={upgrades}
          credits={credits}
          paladio={paladio}
          level={level}
          onRefine={handleRefine}
          onSellMinerals={handleSellMinerals}
          onBack={() => setCurrentView('menu')}
          onNavigate={setCurrentView}
          selectedShip={SHIPS.find(s => s.id === selectedShipId)}
        />
      )}
      
      {currentView === 'clan' && (
        <Clan 
          credits={credits}
          paladio={paladio}
          level={level}
          xp={xp}
          setCredits={setCredits}
          clan={clan}
          setClan={setClan}
          user={user}
          onBack={() => setCurrentView('menu')}
          onNavigate={setCurrentView}
        />
      )}
      
      {currentView === 'admin' && (
        <AdminPanel 
          user={user} 
          onBack={() => setCurrentView('menu')} 
          onUpdateCredits={setCredits}
          onUpdatePaladio={setPaladio}
          onUpdateLevel={setLevel}
          onUpdateXp={setXp}
        />
      )}

        {currentView === 'ranking' && (
          <Ranking onBack={() => setCurrentView('menu')} />
        )}

        {currentView === 'packages' && (
          <Packages 
            user={user}
            paladio={paladio}
            setPaladio={setPaladio}
            onBack={() => setCurrentView('menu')}
          />
        )}

        {currentView === 'messages' && (
        <MessagesPage 
          user={user} 
          onBack={() => {
            setCurrentView('menu');
            fetchUnreadCount();
          }} 
          onNavigate={setCurrentView}
          onRefreshUnread={fetchUnreadCount}
        />
      )}

      {currentView === 'subasta' && (
        <Auctions 
          auctions={auctions}
          resetIn={auctionResetIn}
          onBid={handleAuctionBid}
          userCredits={credits}
          onBack={() => setCurrentView('menu')}
        />
      )}
</div>
      
      {currentView === 'game' && (
        <>
          <h1 className="game-title">Órbita Galáctica</h1>
          <GameCanvas 
            user={user}
            isGameActive={isGameActive}
            selectedShip={selectedShipId} 
            initialModules={currentEquippedModules}
            initialAmmo={ammo}
            initialLevel={level}
            initialXp={xp}
            initialCredits={credits}
            initialPaladio={paladio}
            initialMinerals={minerals}
            initialUpgrades={upgrades}
            initialWips={wips}
            initialEco={eco}
            initialClan={user?.faction}
            initialClanTag={clan?.tag}
            onUpdateAmmo={(newAmmo) => setAmmo(newAmmo)}
            onUpdateProgress={handleUpdateProgress}
            onUpdateCredits={(newCredits) => setCredits(newCredits)}
            onUpdatePaladio={handleUpdatePaladio}
            onUpdateMinerals={handleUpdateMinerals}
            onRepair={handleRepair}
            isInvisible={isInvisible}
            onUpdateInvisibility={setIsInvisible}
            onUpdateWips={(newWips) => setWips(newWips)}
            onUpdateEco={(newEco) => setEco(newEco)}
            onUpdateOwnedShips={setOwnedShips}
            equippedDesign={equippedDesigns[selectedShipId]}
          />
        </>
      )}
      {logoutCountdown !== null && window.location.search.includes('play=true') && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(15px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, color: 'white', fontFamily: 'Orbitron', textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '10px', 
            color: '#ff3366', 
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(255, 51, 102, 0.5)',
            letterSpacing: '4px'
          }}>
            DESCONEXIÓN
          </div>
          <div style={{ fontSize: '1.4rem', marginBottom: '40px', color: '#aaa' }}>
            Cerrando sesión en <span style={{ 
              color: '#00ffcc', 
              fontSize: '3.5rem', 
              display: 'block', 
              marginTop: '10px',
              fontWeight: '900',
              textShadow: '0 0 15px #00ffcc'
            }}>{logoutCountdown}</span> segundos
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', maxWidth: '400px', lineHeight: '1.5' }}>
            Por favor, espera mientras los sistemas de navegación se estabilizan para una desconexión segura.
          </div>
          <button 
            onClick={() => {
              setLogoutCountdown(null);
              localStorage.removeItem('og_logout_trigger');
            }}
            style={{
              marginTop: '50px',
              padding: '12px 30px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#888', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            ABORTAR DESCONEXIÓN
          </button>
        </div>
      )}
    </div>
  )
}

export default App
