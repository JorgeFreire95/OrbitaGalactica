import React, { useState } from 'react';
import { SHIPS, getRank } from '../utils/gameData';
import { SlotDisplay, StatRow } from './ShipComponents';

export default function Hangar({ 
  selectedShipId, 
  setSelectedShipId, 
  equippedByShip, 
  inventory,
  onEquip,
  onUnequip,
  ammo,
  level,
  xp,
  upgrades,
  credits,
  uridium,
  onBack 
}) {
  const [viewedShipId, setViewedShipId] = useState(selectedShipId);
  const [editMode, setEditMode] = useState(false);

  const viewedShip = SHIPS.find(s => s.id === viewedShipId) || SHIPS[0];
  const currentEquipped = equippedByShip[viewedShipId] || [];
  const isActive = selectedShipId === viewedShipId;

  // Calculate stats for the viewed ship
  const stats = {
    hp: viewedShip.hp + currentEquipped.reduce((acc, m) => acc + (m.hp || 0), 0),
    shld: viewedShip.shld + currentEquipped.reduce((acc, m) => acc + (m.shld || 0), 0) + upgrades.shld,
    atk: viewedShip.atk + currentEquipped.reduce((acc, m) => acc + (m.atk || 0), 0) + upgrades.atk,
    spd: viewedShip.spd + currentEquipped.reduce((acc, m) => acc + (m.spd || 0), 0) + upgrades.spd,
    lasersSlots: viewedShip.slots.lasers,
    genSlots: viewedShip.slots.shields + viewedShip.slots.engines
  };

  return (
    <div className="hangar-view-container">
      <header className="dashboard-header" style={{ justifyContent: 'flex-start', padding: '10px 30px' }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid #334466', color: '#88aaff', padding: '8px 20px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
          ⬅ VOLVER AL MENÚ
        </button>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="status-item" style={{ background: 'rgba(0,0,0,0.4)', padding: '5px 15px', borderRadius: '4px', border: '1px solid #333' }}>
            <span className="status-icon" style={{ color: '#ffcc00' }}>🔋</span>
            <span className="status-value" style={{ color: '#fff' }}>{credits.toLocaleString()} CRÉDITOS</span>
          </div>
          <div className="status-item" style={{ background: 'rgba(50,0,100,0.4)', padding: '5px 15px', borderRadius: '4px', border: '1px solid #6633ff' }}>
            <span className="status-icon" style={{ color: '#cc33ff' }}>💎</span>
            <span className="status-value" style={{ color: '#fff' }}>{uridium.toLocaleString()} URIDIUM</span>
          </div>
          <div className="status-item" style={{ background: 'rgba(0,0,0,0.4)', padding: '5px 15px', borderRadius: '4px', border: '1px solid #333' }}>
            <span className="status-icon" style={{ color: '#00ffcc' }}>🎖️</span>
            <span className="status-value" style={{ color: '#fff' }}>NIVEL {level}</span>
          </div>
        </div>
      </header>

      <main className="hangar-main-layout">
        
        {/* SHIP GRID */}
        <section className="fleet-grid-area">
          {SHIPS.map(ship => (
            <div 
              key={ship.id} 
              className={`ship-inventory-card ${viewedShipId === ship.id ? 'selected' : ''}`}
              onClick={() => setViewedShipId(ship.id)}
            >
              <img src={ship.image} alt={ship.name} />
              <div className="ship-inventory-name">{ship.name}</div>
              {selectedShipId === ship.id && <div className="ship-status-icon">✓</div>}
            </div>
          ))}
          {/* Mock extra cards for the "grid" look */}
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="ship-inventory-card" style={{ opacity: 0.2, cursor: 'default' }}>
              <div style={{ fontSize: '2rem' }}>❔</div>
              <div className="ship-inventory-name">Desconocido</div>
            </div>
          ))}
        </section>

        {/* STATS PANEL */}
        <aside className="fleet-info-panel">
          <div className="fleet-info-header">
            <div className="fleet-info-tab active">NAVE</div>
            <div className="fleet-info-tab">VANTS</div>
            <div className="fleet-info-tab">P.E.T.</div>
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
             
             {/* Large Status Label */}
             <div className="active-status-label" style={{ color: isActive ? '#00ffcc' : '#333' }}>
                {isActive ? 'ACTIVA' : 'INACTIVA'}
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
            {!isActive && (
              <button 
                onClick={() => setSelectedShipId(viewedShipId)}
                style={{ marginBottom: '10px', padding: '12px', background: '#00ffcc', border: 'none', color: 'black', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
              >
                EQUIPAR COMO ACTIVA
              </button>
            )}
            <button className="gestionar-button" onClick={() => setEditMode(true)}>
              GESTIONAR
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

           <div className="management-content">
              {/* Warehouse (Inventory) */}
              <div style={{ flex: 1, background: '#0a0f1a', border: '1px solid #1a2a4a', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ marginBottom: '15px', color: '#88aaff', fontSize: '1.1rem', fontWeight: 'bold' }}>📦 ALMACÉN DE MÓDULOS</div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', overflowY: 'auto' }}>
                    {inventory.map((item, index) => (
                      <div 
                        key={item.instanceId} 
                        onClick={() => onEquip(index, viewedShipId)}
                        style={{ aspectRatio: '1/1', background: '#070b16', border: '1px solid #1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', cursor: 'pointer' }}
                        title={`Equipar ${item.name}`}
                      >
                        {item.icon}
                      </div>
                    ))}
                    {inventory.length === 0 && <div style={{ gridColumn: 'span 5', color: '#555', textAlign: 'center', padding: '20px' }}>No hay módulos disponibles en el almacén.</div>}
                 </div>
              </div>

              {/* Ship Slots */}
              <div style={{ flex: 1.5, background: '#0a0f1a', border: '1px solid #1a2a4a', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ marginBottom: '15px', color: '#ffcc00', fontSize: '1.1rem', fontWeight: 'bold' }}>🛠️ CONFIGURACIÓN DE RANURAS</div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    <SlotDisplay label="Sistemas Láser" count={viewedShip.slots.lasers} icon="🎯" color="#ffcc00" equipped={currentEquipped.filter(m => m.type === 'lasers')} onUnequip={(id) => onUnequip(id, viewedShipId)} />
                    <SlotDisplay label="Escudos de Energía" count={viewedShip.slots.shields} icon="🛡️" color="#00c8ff" equipped={currentEquipped.filter(m => m.type === 'shields')} onUnequip={(id) => onUnequip(id, viewedShipId)} />
                    <SlotDisplay label="Motores de Impulso" count={viewedShip.slots.engines} icon="🚀" color="#ff3366" equipped={currentEquipped.filter(m => m.type === 'engines')} onUnequip={(id) => onUnequip(id, viewedShipId)} />
                    <SlotDisplay label="Módulos de Utilidad" count={viewedShip.slots.utility} icon="⚛️" color="#9933ff" equipped={currentEquipped.filter(m => m.type === 'utility')} onUnequip={(id) => onUnequip(id, viewedShipId)} />
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
