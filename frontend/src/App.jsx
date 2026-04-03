import { useState, useEffect } from 'react'
import GameCanvas from './components/GameCanvas'
import Hangar from './components/Hangar'
import Shop from './components/Shop'
import { SHIPS } from './utils/gameData'
import './index.css'

function App() {
  const [currentView, setCurrentView] = useState('hangar')
  const [selectedShipId, setSelectedShipId] = useState('tank')
  
  // Persistent Global State
  const [credits, setCredits] = useState(() => {
    return parseInt(localStorage.getItem('game_credits')) || 2000;
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
      'siphon': 0
    };
  });
  
  const [level, setLevel] = useState(() => {
    return parseInt(localStorage.getItem('game_level')) || 1;
  });

  const [xp, setXp] = useState(() => {
    return parseInt(localStorage.getItem('game_xp')) || 0;
  });

  const [minerals, setMinerals] = useState(() => {
    const saved = localStorage.getItem('game_minerals');
    return saved ? JSON.parse(saved) : { titanium: 0, plutonium: 0, silicon: 0 };
  });

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('game_upgrades');
    return saved ? JSON.parse(saved) : { atk: 0, shld: 0, spd: 0 };
  });

  useEffect(() => {
    localStorage.setItem('game_credits', credits);
  }, [credits]);

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
    setAmmo({ 'standard': 9999, 'thermal': 0, 'plasma': 0, 'siphon': 0 });
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

  const handleUpdateProgress = (newLvl, newXp) => {
    setLevel(newLvl);
    setXp(newXp);
  };

  const handleJoinGame = () => {
    setCurrentView('game');
  };

  const currentEquippedModules = equippedByShip[selectedShipId] || [];

  return (
    <div className="app-container">
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
          onGoToShop={() => setCurrentView('shop')}
          onJoinGame={handleJoinGame}
          onReset={handleReset}
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
          onBack={() => setCurrentView('hangar')}
        />
      )}
      
      {currentView === 'game' && (
        <>
          <h1 className="game-title">Órbita Galáctica</h1>
          <GameCanvas 
            selectedShip={selectedShipId} 
            initialModules={currentEquippedModules}
            initialAmmo={ammo}
            initialLevel={level}
            initialXp={xp}
            initialCredits={credits}
            initialMinerals={minerals}
            initialUpgrades={upgrades}
            onUpdateAmmo={(newAmmo) => setAmmo(newAmmo)}
            onUpdateProgress={handleUpdateProgress}
            onUpdateCredits={(newCredits) => setCredits(newCredits)}
            onUpdateMinerals={handleUpdateMinerals}
          />
          <button 
            style={{ position: 'absolute', top: '10px', right: '10px', padding: '10px', background: '#333', color: 'white', border: '1px solid #555', cursor: 'pointer', borderRadius: '5px' }}
            onClick={() => setCurrentView('hangar')}
          >
            SALIR AL HANGAR
          </button>
        </>
      )}
    </div>
  )
}

export default App
