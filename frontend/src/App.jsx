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
import './index.css'

function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('game_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isGameActive, setIsGameActive] = useState(() => {
    return localStorage.getItem('og_game_running') === 'true';
  });

  const [currentView, setCurrentView] = useState(() => {
    const savedUser = sessionStorage.getItem('game_user');
    return savedUser ? 'menu' : 'auth';
  });
  const [selectedShipId, setSelectedShipId] = useState(() => {
    return sessionStorage.getItem('selected_ship_id') || 'tank';
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
    return val !== null ? parseInt(val) : 0;
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
    return saved ? JSON.parse(saved) : { atk: 0, shld: 0, spd: 0 };
  });

  const [paladio, setPaladio] = useState(() => {
    return parseInt(localStorage.getItem('game_paladio')) || 0;
  });

  const [clan, setClan] = useState(() => {
    const saved = sessionStorage.getItem('game_clan');
    return saved ? JSON.parse(saved) : null;
  });

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

    // Sincronización de Sesión de Juego entre pestañas
    const syncGameSession = (e) => {
      if (e.key === 'og_game_running') {
        setIsGameActive(e.newValue === 'true');
      }
    };

    const handleWindowClose = () => {
      if (window.location.search.includes('play=true')) {
        localStorage.removeItem('og_game_running');
      }
    };

    window.addEventListener('storage', syncGameSession);
    window.addEventListener('beforeunload', handleWindowClose);

    return () => {
      window.removeEventListener('storage', syncGameSession);
      window.removeEventListener('beforeunload', handleWindowClose);
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
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('game_credits', credits);
  }, [credits]);

  useEffect(() => {
    sessionStorage.setItem('selected_ship_id', selectedShipId);
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
    localStorage.setItem('game_paladio', paladio);
  }, [paladio]);

  useEffect(() => {
    localStorage.setItem('game_clan', JSON.stringify(clan));
  }, [clan]);

  // SYNC STATS WITH BACKEND
  const syncStats = async () => {
    if (!user || currentView === 'auth') return;
    try {
      await fetch(`${API_URL}/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          level,
          xp,
          credits,
          paladio
        })
      });
    } catch (e) {
      console.log("Sync error:", e);
    }
  };

  const refreshStats = async () => {
    if (!user || user.faction === null || currentView === 'auth') return;
    try {
      const resp = await fetch(`${API_URL}/user/stats?username=${user.username}`);
      if (resp.ok) {
        const data = await resp.json();
        // Solo actualizamos si hay cambios externos y no estamos en medio de una acción crítica
        if (data.credits !== credits) setCredits(data.credits);
        if (data.paladio !== paladio) setPaladio(data.paladio);
        if (data.level !== level) setLevel(data.level);
        if (data.xp !== xp) setXp(data.xp);
      }
    } catch (e) {
      console.error("Error refreshing stats:", e);
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
  }, [credits, paladio, xp, level]);

  useEffect(() => {
    if (user && user.faction) {
        sessionStorage.setItem('game_user', JSON.stringify(user));
    }
  }, [user]);

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
      setUser({ username: regData.username, email: regData.email, faction: null });
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
      setLevel(0);
      setXp(0);
      setMinerals({ titanium: 0, plutonium: 0, silicon: 0 });
      setInventory([]);
      setEquippedByShip({});
      setAmmo({ 
        'standard': 1000, 'thermal': 0, 'plasma': 0, 'siphon': 0,
        'missile_1': 0, 'missile_2': 0, 'missile_3': 0
      });
      setUpgrades({ atk: 0, shld: 0, spd: 0 });

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
    sessionStorage.removeItem('game_clan');
    sessionStorage.removeItem('orbita_galactica_user_id');
    
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
    setUpgrades({ atk: 0, shld: 0, spd: 0 });
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
    
    setUpgrades(prev => ({
      ...prev,
      [stat]: prev[stat] + amount
    }));
    
    alert(`¡Mejora aplicada! +${amount} a ${stat.toUpperCase()} base.`);
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

  const handleUpdateProgress = (newLvl, newXp) => {
    setLevel(newLvl);
    setXp(newXp);
  };

  const handleJoinGame = () => {
    setCurrentView('game');
  };

  const currentEquippedModules = equippedByShip[selectedShipId] || [];

  const isDashboardView = ['menu', 'hangar', 'shop', 'lab', 'clan', 'admin'].includes(currentView);

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
            initialClan={clan}
            initialClanTag={clan?.tag}
            onUpdateAmmo={(newAmmo) => setAmmo(newAmmo)}
            onUpdateProgress={handleUpdateProgress}
            onUpdateCredits={(newCredits) => setCredits(newCredits)}
            onUpdatePaladio={handleUpdatePaladio}
            onUpdateMinerals={handleUpdateMinerals}
          />
        </>
      )}
    </div>
  )
}

export default App
