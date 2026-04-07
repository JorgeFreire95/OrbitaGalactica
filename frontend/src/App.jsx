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
import './index.css'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('game_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState(() => {
    const savedUser = localStorage.getItem('game_user');
    return savedUser ? 'menu' : 'auth';
  });
  const [selectedShipId, setSelectedShipId] = useState(() => {
    return localStorage.getItem('selected_ship_id') || 'tank';
  });
  
  // Persistent Global State
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

  const [uridium, setUridium] = useState(() => {
    return parseInt(localStorage.getItem('game_uridium')) || 0;
  });

  const [clan, setClan] = useState(() => {
    const saved = localStorage.getItem('game_clan');
    return saved ? JSON.parse(saved) : null;
  });

  // Auto-lanzamiento si se abre en pestaña nueva con ?play=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('play') === 'true') {
      setCurrentView('game');
    }
  }, []);

  // Synchronize dynamic updates coming from the Game Canvas window
  useEffect(() => {
    const handleStorageChange = (e) => {
      switch (e.key) {
        case 'game_credits': setCredits(parseInt(e.newValue) || 0); break;
        case 'game_uridium': setUridium(parseInt(e.newValue) || 0); break;
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
    localStorage.setItem('game_uridium', uridium);
  }, [uridium]);

  useEffect(() => {
    localStorage.setItem('game_clan', JSON.stringify(clan));
  }, [clan]);

  useEffect(() => {
    if (user && user.faction) {
        localStorage.setItem('game_user', JSON.stringify(user));
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
      if (!data.faction) {
        setCurrentView('faction_select');
      } else {
        localStorage.setItem('game_user', JSON.stringify(data));
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
      localStorage.setItem('game_user', JSON.stringify(updatedUser)); 

      // Wipe current local stats and set standard fresh-start stats
      setCredits(50000);
      setUridium(0);
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

  const handleLogout = () => {
    localStorage.removeItem('game_user');
    localStorage.removeItem('game_credits');
    localStorage.removeItem('game_uridium');
    localStorage.removeItem('game_level');
    localStorage.removeItem('game_xp');
    localStorage.removeItem('game_minerals');
    localStorage.removeItem('game_inventory');
    localStorage.removeItem('game_equipped');
    localStorage.removeItem('game_ammo');
    localStorage.removeItem('game_upgrades');
    localStorage.removeItem('game_clan');
    localStorage.removeItem('orbita_galactica_user_id');
    
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

  const handleUpdateUridium = (newUridium) => {
    setUridium(newUridium);
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
            uridium={uridium} 
            level={level} 
            user={user} 
            onLogout={handleLogout} 
            onNavigate={setCurrentView} 
          />
          <NavigationBar currentView={currentView} onNavigate={setCurrentView} />
        </>
      )}

      {currentView === 'auth' && (
        <Auth onLogin={handleLogin} onRegister={handleRegister} />
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
          uridium={uridium}
          xp={xp}
          level={level}
          minerals={minerals}
          selectedShipId={selectedShipId}
          equippedByShip={equippedByShip}
          upgrades={upgrades}
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
          uridium={uridium}
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
          uridium={uridium}
          onBack={() => setCurrentView('menu')}
          onNavigate={setCurrentView}
        />
      )}

      {currentView === 'lab' && (
        <Laboratory 
          minerals={minerals}
          upgrades={upgrades}
          credits={credits}
          uridium={uridium}
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
          uridium={uridium}
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
        <AdminPanel onBack={() => setCurrentView('menu')} />
      )}
      
      {currentView === 'game' && (
        <>
          <h1 className="game-title">Órbita Galáctica</h1>
          <GameCanvas 
            user={user}
            selectedShip={selectedShipId} 
            initialModules={currentEquippedModules}
            initialAmmo={ammo}
            initialLevel={level}
            initialXp={xp}
            initialCredits={credits}
            initialUridium={uridium}
            initialMinerals={minerals}
            initialUpgrades={upgrades}
            initialClan={clan}
            onUpdateAmmo={(newAmmo) => setAmmo(newAmmo)}
            onUpdateProgress={handleUpdateProgress}
            onUpdateCredits={(newCredits) => setCredits(newCredits)}
            onUpdateUridium={handleUpdateUridium}
            onUpdateMinerals={handleUpdateMinerals}
          />
        </>
      )}
    </div>
  )
}

export default App
