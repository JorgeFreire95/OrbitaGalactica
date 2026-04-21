import React, { useState } from 'react';
import { SHIPS, getRank } from '../utils/gameData';
import { SlotDisplay, StatRow } from './ShipComponents';
import NavigationBar from './NavigationBar';
import ShipIcon from './ShipIcon';

export default function Hangar({ 
  user,
  selectedShipId, 
  setSelectedShipId, 
  equippedByShip, 
  inventory, 
  ammo, 
  level, 
  xp, 
  onEquip, 
  onUnequip, 
  onBack, 
  onNavigate,
  onReset,
  credits,
  paladio,
  minerals,
  upgrades,
  onRefine,
  inSafeZone,
  isPlaying,
  ownedShips = []
}) {
  const [viewedShipId, setViewedShipId] = useState(selectedShipId);
  const [editMode, setEditMode] = useState(false);

  const isBlocked = isPlaying && !inSafeZone;

  const viewedShip = SHIPS.find(s => s.id === viewedShipId) || SHIPS[0];
  const currentEquipped = equippedByShip[viewedShipId] || [];
  const isActive = selectedShipId === viewedShipId;
  const isOwned = ownedShips.includes(viewedShipId);

  // Calculate stats for the viewed ship
  const stats = {
    hp: viewedShip.hp + currentEquipped.reduce((acc, m) => acc + (m.hp || 0), 0),
    shld: viewedShip.shld + currentEquipped.reduce((acc, m) => acc + (m.shld || 0), 0) + (upgrades.shld || []).reduce((acc, u) => acc + (u.amount || 0), 0),
    atk: viewedShip.atk + currentEquipped.reduce((acc, m) => acc + (m.atk || 0), 0) + (upgrades.atk || []).reduce((acc, u) => acc + (u.amount || 0), 0),
    spd: viewedShip.spd + currentEquipped.reduce((acc, m) => acc + (m.spd || 0), 0) + (upgrades.spd || []).reduce((acc, u) => acc + (u.amount || 0), 0),
    lasersSlots: viewedShip.slots.lasers,
    genSlots: viewedShip.slots.shields + viewedShip.slots.engines
  };

  return (
    <div className="hangar-view-container">
      <main className="hangar-main-layout">
        
        {/* SHIP GRID */}
         <section className="fleet-grid-area">
          {SHIPS.map(ship => {
            const shipOwned = ownedShips.includes(ship.id);
            return (
              <div 
                key={ship.id} 
                className={`ship-inventory-card ${viewedShipId === ship.id ? 'selected' : ''} ${!shipOwned ? 'locked' : ''}`}
                onClick={() => setViewedShipId(ship.id)}
                style={{ opacity: shipOwned ? 1 : 0.5, filter: shipOwned ? 'none' : 'grayscale(80%)' }}
              >
                {!shipOwned && <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '1rem' }}>🔒</div>}
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShipIcon 
                    type={ship.id} 
                    image={ship.image}
                    color={ship.color || (ship.id === 'sovereign' ? '#e6b800' : (shipOwned ? '#00ffcc' : '#555'))} 
                    size={60} 
                  />
                </div>
                <div className="ship-inventory-name">{ship.name}</div>
                {selectedShipId === ship.id && <div className="ship-status-icon">✓</div>}
              </div>
            );
          })}
          {/* Removed mock extra cards as they looked like placeholder errors */}
        </section>

        {/* STATS PANEL */}
        <aside className="fleet-info-panel">
          <div className="fleet-info-header">
            <div className="fleet-info-tab active">NAVE</div>
            <div className="fleet-info-tab">VANTS</div>
            <div className="fleet-info-tab">P.E.T.</div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', background: 'radial-gradient(circle, rgba(0,255,204,0.05) 0%, transparent 70%)' }}>
             <ShipIcon 
                type={viewedShip.id} 
                image={viewedShip.image} 
                color={viewedShip.color || (viewedShip.id === 'sovereign' ? '#e6b800' : '#00ffcc')} 
                size={180} 
             />
          </div>

          <div className="fleet-stats-list">
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Puntos de Vida</span>
                <span className="fleet-stat-value">{stats.hp.toLocaleString()}</span>
             </div>
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Escudo Total</span>
                <span className="fleet-stat-value">{stats.shld.toLocaleString()}</span>
             </div>
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Velocidad Máxima</span>
                <span className="fleet-stat-value">{stats.spd}</span>
             </div>
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Ranuras Láser</span>
                <span className="fleet-stat-value">{stats.lasersSlots}</span>
             </div>
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Ranuras Generadores</span>
                <span className="fleet-stat-value">{stats.genSlots}</span>
             </div>
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Experiencia Nave</span>
                <span className="fleet-stat-value">{xp} XP</span>
             </div>
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Nivel de Piloto</span>
                <span className="fleet-stat-value">{level}</span>
             </div>
             <div className="fleet-stat-row">
                <span className="fleet-stat-label">Bodega de Carga</span>
                <span className="fleet-stat-value">{viewedShip.cargo_capacity.toLocaleString()} t</span>
             </div>
             
             {/* Large Status Label */}
             <div className="active-status-label" style={{ color: isActive ? '#00ffcc' : '#333' }}>
                {isActive ? 'ACTIVA' : 'INACTIVA'}
             </div>
          </div>

          <div style={{ 
            marginTop: 'auto', 
            padding: '20px', 
            background: 'rgba(0,0,0,0.4)', 
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', 
            flexDirection: 'column',
            gap: '10px' 
          }}>
            {!isActive && isOwned && (
              <button 
                className="gestionar-button"
                onClick={() => {
                  setSelectedShipId(viewedShipId);
                  // Persistir en backend
                  if (user && user.username) {
                    fetch('http://localhost:8000/api/user/ship', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: user.username, ship_id: viewedShipId })
                    }).catch(console.error);
                  }
                }}
                style={{ width: '100%', margin: '0' }}
              >
                EQUIPAR COMO ACTIVA
              </button>
            )}
            {!isOwned && (
              <button 
                className="primary-button"
                onClick={() => onNavigate('shop')}
                style={{ width: '100%', background: 'linear-gradient(to bottom, #ffcc00, #ff8800)', color: 'black' }}
              >
                ADQUIRIR EN TIENDA ({viewedShip.cost.toLocaleString()} Cr)
              </button>
            )}
            <button 
              className={`gestionar-button ${isBlocked || !isOwned ? 'blocked' : ''}`} 
              onClick={() => isOwned && setEditMode(true)}
              disabled={!isOwned}
              style={{ width: '100%', margin: '0' }}
            >
              {!isOwned ? 'BLOQUEADO: REQUIERE COMPRA' : isBlocked ? 'VER EQUIPAMIENTO (BLOQUEADO)' : 'GESTIONAR CONFIGURACIÓN'}
            </button>
          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <div>PROYECTO ÓRBITA GALÁCTICA v2.5 | HANGAR CENTRAL</div>
        <div>TASA DE REPARACIÓN: 100% | SECTOR: SEGURO</div>
      </footer>

      {/* MANAGEMENT OVERLAY */}
      {editMode && (
        <div className="management-overlay">
           <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ffcc' }}>GESTIÓN DE EQUIPAMIENTO: {viewedShip.name}</div>
              <button 
                onClick={() => setEditMode(false)}
                style={{ background: '#ff3366', border: 'none', color: 'white', padding: '10px 30px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
              >
                CERRAR Y VOLVER
              </button>
           </header>

           {isBlocked && (
             <div style={{ 
               background: 'rgba(255, 51, 102, 0.1)', 
               border: '1px solid #ff3366', 
               color: '#ff3366', 
               padding: '15px', 
               borderRadius: '4px', 
               marginBottom: '20px', 
               textAlign: 'center',
               fontWeight: 'bold',
               letterSpacing: '1px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '10px'
             }}>
               <span>⚠️</span>
               CONFIGURACIÓN BLOQUEADA: DEBES ESTAR EN UNA ZONA SEGURA (BASE O PORTAL) PARA MODIFICAR LA NAVE MIENTRAS EL JUEGO ESTÁ ACTIVO.
             </div>
           )}

           <div className="management-content">
              {/* Warehouse (Inventory) */}
              <div style={{ flex: 1, background: '#0a0f1a', border: '1px solid #1a2a4a', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ marginBottom: '15px', color: '#88aaff', fontSize: '1.1rem', fontWeight: 'bold' }}>📦 ALMACÉN DE MÓDULOS</div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', overflowY: 'auto' }}>
                    {inventory.map((item, index) => (
                      <div 
                        key={item.instanceId} 
                        onClick={() => !isBlocked && onEquip(index, viewedShipId)}
                        style={{ 
                          aspectRatio: '1/1', 
                          background: '#070b16', 
                          border: `1px solid ${isBlocked ? '#331122' : '#1a2a4a'}`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '2rem', 
                          cursor: isBlocked ? 'not-allowed' : 'pointer',
                          opacity: isBlocked ? 0.4 : 1,
                          filter: isBlocked ? 'grayscale(100%)' : 'none'
                        }}
                        title={isBlocked ? 'Bloqueado: No estás en zona segura' : `Equipar ${item.name}`}
                      >
                        {item.image ? <img src={item.image} alt={item.name} style={{ width: '32px', height: '32px', objectFit: 'contain' }} /> : item.icon}
                      </div>
                    ))}
                    {inventory.length === 0 && <div style={{ gridColumn: 'span 5', color: '#555', textAlign: 'center', padding: '20px' }}>No hay módulos disponibles en el almacén.</div>}
                 </div>
              </div>

              {/* Ship Slots */}
              <div style={{ flex: 1.5, background: '#0a0f1a', border: '1px solid #1a2a4a', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ marginBottom: '15px', color: '#ffcc00', fontSize: '1.1rem', fontWeight: 'bold' }}>🛠️ CONFIGURACIÓN DE RANURAS</div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', opacity: isBlocked ? 0.7 : 1 }}>
                    <SlotDisplay label="Sistemas Láser" count={viewedShip.slots.lasers} icon="🎯" color="#ffcc00" equipped={currentEquipped.filter(m => m.type === 'lasers')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                    <SlotDisplay label="Escudos de Energía" count={viewedShip.slots.shields} icon="🛡️" color="#00c8ff" equipped={currentEquipped.filter(m => m.type === 'shields')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                    <SlotDisplay label="Motores de Impulso" count={viewedShip.slots.engines} icon="🚀" color="#ff3366" equipped={currentEquipped.filter(m => m.type === 'engines')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                    <SlotDisplay label="Módulos de Utilidad" count={viewedShip.slots.utility} icon="⚛️" color="#9933ff" equipped={currentEquipped.filter(m => m.type === 'utility')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
