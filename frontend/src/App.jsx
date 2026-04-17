import { useState, useEffect } from 'react'
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
import { SHIPS } from './utils/gameData'
import Ranking from './components/Ranking'
import Packages from './components/Packages'
import './index.css'

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
    return saved ? JSON.parse(saved) : { titanium: 0, plutonium: 0, silicon: 0 };
  });

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('game_upgrades');
    // Si es el formato viejo (número), resetear a objeto
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.atk === 'number') return { atk: [], shld: [], spd: [] };
      return parsed;
    }
    return { atk: [], shld: [], spd: [] };
  });

  const [paladio, setPaladio] = useState(() => {
    return parseInt(localStorage.getItem('game_paladio')) || 0;
  });

  const [clan, setClan] = useState(() => {
    const saved = localStorage.getItem('game_clan');
    return saved ? JSON.parse(saved) : null;
  });

  const [ownedShips, setOwnedShips] = useState(() => {
    const saved = localStorage.getItem('owned_ships');
    return saved ? JSON.parse(saved) : ['starter'];
  });

  // One-time fleet cleanup: remove 'tank' if it was a default assignment from previous versions
  useEffect(() => {
    if (ownedShips.includes('tank') && ownedShips.includes('starter')) {
      // Only do this once to avoid annoying legitimate buyers later
      const hasCleaned = localStorage.getItem('og_tank_cleaned');
      if (!hasCleaned) {
        const newShips = ownedShips.filter(id => id !== 'tank');
        setOwnedShips(newShips);
        localStorage.setItem('owned_ships', JSON.stringify(newShips));
        localStorage.setItem('og_tank_cleaned', 'true');
        
        if (selectedShipId === 'tank') {
          setSelectedShipId('starter');
          localStorage.setItem('selected_ship_id', 'starter');
        }
      }
    }
  }, [ownedShips]);

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
    if (user) {
      fetchClanData(user.username);
    }

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

  // SYNC STATS WITH BACKEND (Debounced to prevent race conditions during multiple state updates)
  const syncStats = async () => {
    if (!user || currentView === 'auth') return;
    
    // Clear existing timer
    if (window.syncTimer) clearTimeout(window.syncTimer);
    
    window.syncTimer = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/user/sync`, {
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
            equipped: equippedByShip
          })
        });
      } catch (e) {
        console.log("Sync error:", e);
      }
    }, 500); // 500ms debounce
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
          setInventory(data.inventory);
        }
        if (data.equipped && JSON.stringify(data.equipped) !== JSON.stringify(equippedByShip)) {
          setEquippedByShip(data.equipped);
        }
        if (data.minerals && JSON.stringify(data.minerals) !== JSON.stringify(minerals)) {
          setMinerals(data.minerals);
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
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshStats, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, [user, credits, paladio, level, xp]);

  // Sync on every relevant change (Transaction-based as requested)
  useEffect(() => {
    // We only sync if we are already logged in and not in the auth/faction screen
    if (user && user.faction) {
      syncStats();
    }
  }, [credits, paladio, xp, level, minerals, ownedShips, inventory, equippedByShip]);

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

      ['atk', 'shld', 'spd'].forEach(stat => {
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

  const API_URL = 'http://localhost:8000/api';

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
      setUser(data);
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
        setInventory(data.inventory);
        localStorage.setItem('game_inventory', JSON.stringify(data.inventory));
      }
      if (data.equipped) {
        setEquippedByShip(data.equipped);
        localStorage.setItem('equipped_modules', JSON.stringify(data.equipped));
      }
      if (data.minerals) {
        setMinerals(data.minerals);
        localStorage.setItem('game_minerals', JSON.stringify(data.minerals));
      }

      if (!data.faction) {
        setCurrentView('faction_select');
      } else {
        sessionStorage.setItem('game_user', JSON.stringify(data));
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
      setMinerals({ titanium: 0, plutonium: 0, silicon: 0 });
      setInventory([]);
      setEquippedByShip({});
      setAmmo({ 
        'standard': 1000, 'thermal': 0, 'plasma': 0, 'siphon': 0,
        'missile_1': 0, 'missile_2': 0, 'missile_3': 0
      });
      setUpgrades({ atk: [], shld: [], spd: [] });
      setOwnedShips(['starter']);
      setSelectedShipId('starter');

      setCurrentView('menu');
    } catch (e) {
      alert('Error de conexión con el servidor principal.');
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
    localStorage.removeItem('og_game_running');
    localStorage.removeItem('og_player_safe_zone');
    
    sessionStorage.clear();
    localStorage.clear(); // Limpieza total para evitar fugas de datos

    
    setUser(null);
    setCurrentView('auth');
    // Forzar recarga para resetear estados de React de forma limpia
    window.location.reload(); 
  };

  const handleBuyAmmo = (ammoId, count, cost) => {
    if (credits < cost) return alert('No tienes suficientes créditos');
    setCredits(prev => prev - cost);
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
    const usedSlots = currentEquipped.filter(m => m.type === module.type).length;
    
    if (usedSlots >= ship.slots[module.type]) {
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

  const handleUnequip = (instanceId, shipId) => {
    // SECURITY CHECK: Solo permitir desequipar en Zona Segura si el juego está activo
    if (isGameActive && !inSafeZone) {
      alert("⚠️ PROTOCOLO DE SEGURIDAD: Debes estar en una Zona Segura (Base o Portal) para modificar la nave.");
      return;
    }

    const currentEquipped = equippedByShip[shipId] || [];
    const module = currentEquipped.find(m => m.instanceId === instanceId);
    if (!module) return;

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
    setMinerals({ titanium: 0, plutonium: 0, silicon: 0 });
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
    
    alert(`¡Mejora aplicada! +${amount} a ${stat.toUpperCase()} (Duración: 2 Horas).`);
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

  const handleBuyShip = (shipId, shipCost) => {
    if (credits < shipCost) return false;
    if (ownedShips.includes(shipId)) return false;
    
    setCredits(prev => prev - shipCost);
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

  const isDashboardView = ['menu', 'hangar', 'shop', 'lab', 'clan', 'admin', 'packages'].includes(currentView);

  return (
    <div className="app-container">
      {isDashboardView && (
        <>
          <TopBar 
            credits={credits} 
            paladio={paladio} 
            level={level} 
            user={user} 
            onLogout={handleLogout} 
            onNavigate={setCurrentView} 
          />
          <NavigationBar currentView={currentView} onNavigate={setCurrentView} />
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
          onLogout={handleLogout}
          credits={credits}
          paladio={paladio}
          xp={xp}
          level={level}
          minerals={minerals}
          selectedShipId={selectedShipId}
          equippedByShip={equippedByShip}
          upgrades={upgrades}
          leaderboard={leaderboard}
          isGameActive={isGameActive}
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
        />
      )}

      {currentView === 'shop' && (
        <Shop 
          selectedShipId={selectedShipId}
          credits={credits}
          setCredits={setCredits}
          equippedByShip={equippedByShip}
          inventory={inventory}
          setInventory={setInventory}
          ammo={ammo}
          onBuyAmmo={handleBuyAmmo}
          minerals={minerals}
          onSellMinerals={handleSellMinerals}
          upgrades={upgrades}
          level={level}
          paladio={paladio}
          onBack={() => setCurrentView('menu')}
          onNavigate={setCurrentView}
          ownedShips={ownedShips}
          onBuyShip={handleBuyShip}
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
        <AdminPanel user={user} onBack={() => setCurrentView('menu')} />
      )}

        {currentView === 'ranking' && (
          <Ranking leaderboard={leaderboard} onBack={() => setCurrentView('menu')} />
        )}

        {currentView === 'packages' && (
          <Packages 
            user={user}
            paladio={paladio}
            setPaladio={setPaladio}
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
            initialClan={user?.faction}
            initialClanTag={clan?.tag}
            onUpdateAmmo={(newAmmo) => setAmmo(newAmmo)}
            onUpdateProgress={handleUpdateProgress}
            onUpdateCredits={(newCredits) => setCredits(newCredits)}
            onUpdatePaladio={handleUpdatePaladio}
            onUpdateMinerals={handleUpdateMinerals}
            onRepair={handleRepair}
          />
        </>
      )}
    </div>
  )
}

export default App
