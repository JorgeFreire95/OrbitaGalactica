import React, { useState } from 'react';
import { SHIPS, WIPS_CATALOG, DESIGNS_CATALOG, getRank } from '../utils/gameData';
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
  ownedShips = [],
  wips = [],
  onEquipWip,
  onUnequipWip,
  eco,
  onEquipEco,
  onUnequipEco,
  onUnlockEcoSlot,
  onRenameEco,
  equippedDesigns = {},
  onEquipDesign
}) {
  const [viewedShipId, setViewedShipId] = useState(selectedShipId);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('ship'); // 'ship', 'wips', or 'eco'
  const [selectedWipId, setSelectedWipId] = useState(null);

  const isBlocked = isPlaying && !inSafeZone;

  const viewedShip = SHIPS.find(s => s.id === viewedShipId) || SHIPS[0];
  const currentEquipped = equippedByShip[viewedShipId] || [];
  const isActive = selectedShipId === viewedShipId;
  const isOwned = ownedShips.includes(viewedShipId);

  const currentDesignId = equippedDesigns[viewedShipId];
  const currentDesign = DESIGNS_CATALOG.find(d => d.id === currentDesignId);
  const shipImage = currentDesign ? currentDesign.image : viewedShip.image;
  const shipColor = currentDesign ? '#ff4500' : (viewedShip.color || (viewedShip.id === 'sovereign' ? '#e6b800' : (isOwned ? '#00ffcc' : '#555')));

  // Calculate stats for the viewed ship (Base + Modules + Lab Upgrades)
  const baseHp = viewedShip.hp + currentEquipped.reduce((acc, m) => acc + (m.hp || 0), 0) + (upgrades.hp || []).reduce((acc, u) => acc + (u.amount || 0), 0);
  const baseShld = viewedShip.shld + currentEquipped.reduce((acc, m) => acc + (m.shld || 0), 0) + (upgrades.shld || []).reduce((acc, u) => acc + (u.amount || 0), 0);
  const baseAtk = viewedShip.atk + currentEquipped.reduce((acc, m) => acc + (m.atk || 0), 0) + (upgrades.atk || []).reduce((acc, u) => acc + (u.amount || 0), 0);
  const baseSpd = viewedShip.spd + currentEquipped.reduce((acc, m) => acc + (m.spd || 0), 0) + (upgrades.spd || []).reduce((acc, u) => acc + (u.amount || 0), 0);

  const stats = {
    hp: currentDesign?.bonus?.hp ? Math.floor(baseHp * (1 + currentDesign.bonus.hp)) : baseHp,
    shld: currentDesign?.bonus?.shld ? Math.floor(baseShld * (1 + currentDesign.bonus.shld)) : baseShld,
    atk: currentDesign?.bonus?.dmg ? Math.floor(baseAtk * (1 + currentDesign.bonus.dmg)) : (currentDesign?.bonus?.atk ? Math.floor(baseAtk * (1 + currentDesign.bonus.atk)) : baseAtk),
    spd: currentDesign?.bonus?.spd ? Math.floor(baseSpd * (1 + currentDesign.bonus.spd)) : baseSpd,
    lasersSlots: viewedShip.slots.lasers + currentEquipped.reduce((acc, m) => acc + (m.extraLaserSlots || 0), 0),
    shieldSlots: viewedShip.slots.shields + currentEquipped.reduce((acc, m) => acc + (m.extraShieldSlots || 0), 0),
    engineSlots: viewedShip.slots.engines + currentEquipped.reduce((acc, m) => acc + (m.extraEngineSlots || 0), 0),
    utilitySlots: (viewedShip.slots.utility || 0) + currentEquipped.reduce((acc, m) => acc + (m.extraSlots || 0), 0),
    xpBonus: currentDesign ? (currentDesign.bonus?.xp || 0) * 100 : 0
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
                    image={equippedDesigns[ship.id] ? DESIGNS_CATALOG.find(d => d.id === equippedDesigns[ship.id])?.image : ship.image}
                    color={equippedDesigns[ship.id] ? '#ff4500' : (ship.color || (ship.id === 'sovereign' ? '#e6b800' : (shipOwned ? '#00ffcc' : '#555')))} 
                    size={60} 
                  />
                </div>
                <div className="ship-inventory-name">{ship.name}</div>
                {selectedShipId === ship.id && <div className="ship-status-icon">✓</div>}
              </div>
            );
          })}
        </section>

        {/* STATS PANEL */}
        <aside className="fleet-info-panel">
          <div className="fleet-info-header">
            <div className={`fleet-info-tab ${activeTab === 'ship' ? 'active' : ''}`} onClick={() => setActiveTab('ship')}>NAVE</div>
            <div className={`fleet-info-tab ${activeTab === 'disenos' ? 'active' : ''}`} onClick={() => setActiveTab('disenos')}>DISEÑOS</div>
            <div className={`fleet-info-tab ${activeTab === 'wips' ? 'active' : ''}`} onClick={() => setActiveTab('wips')}>WIPS</div>
            <div className={`fleet-info-tab ${activeTab === 'eco' ? 'active' : ''}`} onClick={() => setActiveTab('eco')}>E.C.O.</div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', background: 'radial-gradient(circle, rgba(0,255,204,0.05) 0%, transparent 70%)' }}>
             <ShipIcon 
                type={viewedShip.id} 
                image={shipImage} 
                color={shipColor} 
                size={180} 
             />
          </div>

          {activeTab === 'ship' ? (
            <div className="fleet-stats-list">
              <div className="fleet-stat-row">
                  <span className="fleet-stat-label">Puntos de Vida</span>
                  <span className="fleet-stat-value">
                    {stats.hp.toLocaleString()}
                    {currentDesign?.bonus?.hp && <span style={{ color: '#00ffcc', fontSize: '0.7rem', marginLeft: '5px' }}>(+{currentDesign.bonus.hp * 100}%)</span>}
                  </span>
              </div>
              <div className="fleet-stat-row">
                  <span className="fleet-stat-label">Escudo Total</span>
                  <span className="fleet-stat-value">
                    {stats.shld.toLocaleString()}
                    {currentDesign?.bonus?.shld && <span style={{ color: '#00ffcc', fontSize: '0.7rem', marginLeft: '5px' }}>(+{currentDesign.bonus.shld * 100}%)</span>}
                  </span>
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
                  <span className="fleet-stat-value">{stats.shieldSlots + stats.engineSlots}</span>
              </div>
              <div className="fleet-stat-row">
                  <span className="fleet-stat-label">Ranuras Extras</span>
                  <span className="fleet-stat-value">{stats.utilitySlots}</span>
              </div>
              <div className="fleet-stat-row">
                  <span className="fleet-stat-label">Experiencia Nave</span>
                  <span className="fleet-stat-value">{xp} XP {stats.xpBonus > 0 && <span style={{ color: '#00ffcc', fontSize: '0.7rem' }}>(+{stats.xpBonus}%)</span>}</span>
              </div>
              <div className="fleet-stat-row">
                  <span className="fleet-stat-label">Nivel de Piloto</span>
                  <span className="fleet-stat-value">{level}</span>
              </div>
              <div className="fleet-stat-row">
                  <span className="fleet-stat-label">Bodega de Carga</span>
                  <span className="fleet-stat-value">{viewedShip.cargo_capacity.toLocaleString()} t</span>
              </div>
              
              <div className="active-status-label" style={{ color: isActive ? '#00ffcc' : '#333' }}>
                  {isActive ? 'ACTIVA' : 'INACTIVA'}
              </div>
            </div>
          ) : activeTab === 'wips' ? (
            <div className="fleet-stats-list" style={{ padding: '10px' }}>
               <div style={{ color: '#00ffcc', fontFamily: 'Orbitron', fontSize: '0.8rem', marginBottom: '15px', textAlign: 'center' }}>
                  SISTEMA DE APOYO TÁCTICO (WIPS)
               </div>
               
               {wips.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px 10px', color: '#555', border: '1px dashed #333', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🛰️</div>
                    <p style={{ fontSize: '0.8rem' }}>NO TIENES WIPS ACTIVOS</p>
                    <button className="primary-button" onClick={() => onNavigate('shop')} style={{ marginTop: '10px', padding: '5px 15px', fontSize: '0.7rem' }}>IR A TIENDA</button>
                 </div>
               ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {wips.map((wip, i) => {
                      const def = WIPS_CATALOG.find(d => d.id === wip.type);
                      return (
                        <div key={wip.instanceId} className="wip-small-card" style={{ 
                          background: 'rgba(0,0,0,0.4)', 
                          border: wip.integrity < 30 ? '1px solid rgba(255,51,102,0.4)' : '1px solid rgba(0,255,204,0.2)',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>#{i+1} {def.name}</span>
                            <span style={{ color: wip.integrity < 30 ? '#ff3366' : '#888', fontSize: '0.6rem' }}>{wip.integrity || 100}%</span>
                          </div>
                          
                          {/* Barra de integridad */}
                          <div style={{ width: '100%', height: '3px', background: '#111', borderRadius: '10px', marginBottom: '8px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${wip.integrity || 100}%`, 
                              height: '100%', 
                              background: (wip.integrity || 100) > 50 ? '#00ffcc' : ((wip.integrity || 100) > 25 ? '#ffcc00' : '#ff3366'),
                              transition: 'width 0.5s ease'
                            }} />
                          </div>

                          <div style={{ display: 'flex', gap: '3px' }}>
                            {Array.from({ length: def.slots }).map((_, idx) => (
                              <div key={idx} style={{ 
                                width: '12px', height: '12px', 
                                background: wip.equipped[idx] ? '#00ffcc' : '#222',
                                border: '1px solid #444',
                                borderRadius: '2px'
                              }} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {wips.length < 8 && Array.from({ length: 8 - wips.length }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px dashed #333',
                        padding: '8px',
                        borderRadius: '4px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#444',
                        fontSize: '0.7rem'
                      }}>
                        VACÍO
                      </div>
                    ))}
                 </div>
               )}

               <div style={{ marginTop: '20px', color: '#888', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  <b style={{ color: '#ff3366' }}>⚠️ AVISO DE VIDA:</b> Cada vez que tu nave sea destruida, tus Wips perderán un <b style={{ color: '#fff' }}>10%</b> de vida. Al llegar al 0%, el Wip se destruirá permanentemente.<br/><br/>
                  <b style={{ color: '#00ffcc' }}>Dron:</b> 1 Ranura (Arma/Escudo)<br/>
                  <b style={{ color: '#00ffcc' }}>Sparks:</b> 2 Ranuras (Armas/Escudos)<br/>
                  Límite máximo: 8 unidades.
               </div>
            </div>
          ) : activeTab === 'eco' ? (
            <div className="fleet-stats-list" style={{ padding: '10px' }}>
               <div style={{ color: '#00ffcc', fontFamily: 'Orbitron', fontSize: '0.8rem', marginBottom: '15px', textAlign: 'center' }}>
                  SISTEMA E.C.O. (EXTRA COMBAT OBSERVER)
               </div>
               
               {!eco?.active ? (
                 <div style={{ textAlign: 'center', padding: '40px 10px', color: '#555', border: '1px dashed #333', borderRadius: '8px' }}>
                    <img src="/eco_drone.png" alt="E.C.O. Locked" style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: 0.2, marginBottom: '10px' }} />
                    <p style={{ fontSize: '0.8rem' }}>SISTEMA E.C.O. NO ADQUIRIDO</p>
                    <button className="primary-button" onClick={() => onNavigate('shop')} style={{ marginTop: '10px', padding: '5px 15px', fontSize: '0.7rem' }}>IR A TIENDA</button>
                 </div>
               ) : (
                 <div className="eco-stats-card" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,255,204,0.2)', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                       <div style={{ width: '60px', height: '60px', background: '#070b16', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="/eco_drone.png" alt="E.C.O." style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                             <input 
                               type="text" 
                               value={eco.customName || 'E.C.O.'} 
                               onChange={(e) => onRenameEco(e.target.value)}
                               style={{ 
                                 background: 'transparent', 
                                 border: 'none', 
                                 borderBottom: '1px solid rgba(0,255,204,0.3)', 
                                 color: '#00ffcc', 
                                 fontWeight: 'bold',
                                 fontSize: '0.9rem',
                                 width: '100%',
                                 outline: 'none'
                               }}
                               maxLength={20}
                             />
                          </div>
                          <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>Nivel {eco.level} / 15</div>
                          <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '3px' }}>EXP: {eco.xp || 0} / {eco.xp_next || 1000}</div>
                          <div style={{ width: '100%', height: '4px', background: '#111', borderRadius: '2px', marginTop: '2px' }}>
                             <div style={{ width: `${Math.min(100, ((eco.xp || 0) / (eco.xp_next || 1)) * 100)}%`, height: '100%', background: '#ffcc00' }}></div>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>VIDA: {eco.integrity?.toLocaleString()} / {(eco.max_integrity || 50000).toLocaleString()}</div>
                          <div style={{ width: '100%', height: '4px', background: '#111', borderRadius: '2px', marginTop: '2px' }}>
                             <div style={{ width: `${Math.min(100, (eco.integrity / (eco.max_integrity || 50000)) * 100)}%`, height: '100%', background: '#00ffcc' }}></div>
                          </div>
                       </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.7rem' }}>
                       <div style={{ color: '#888' }}>Vida: <span style={{ color: '#ff3366' }}>{(eco.hp || 50000).toLocaleString()} HP</span></div>
                       <div style={{ color: '#888' }}>Combustible: <span style={{ color: '#ffcc00' }}>{Math.floor(eco.fuel || 0).toLocaleString()} u</span></div>
                       <div style={{ color: '#888' }}>Láseres: <span style={{ color: '#fff' }}>{eco.equipped?.lasers?.length || 0}/5</span></div>
                       <div style={{ color: '#888' }}>Generadores: <span style={{ color: '#fff' }}>{eco.equipped?.generators?.length || 0}/10</span></div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.6rem', color: '#666', fontStyle: 'italic', borderTop: '1px solid #222', paddingTop: '5px' }}>
                       Requisitos: Lvl 1 (ECO 1-4), Lvl 2 (ECO 5-9), Lvl 3 (ECO 10-15)
                    </div>
                 </div>
               )}

               <div style={{ marginTop: '20px', color: '#888', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  <b style={{ color: '#00ffcc' }}>E.C.O.:</b> Robot de asistencia avanzada.<br/>
                  <b style={{ color: '#00ffcc' }}>Ranuras:</b> 5 Armas, 10 Generadores, 10 Protocolos.<br/>
                  Utiliza protocolos para mejorar tus estadísticas globales.
               </div>
            </div>
          ) : activeTab === 'disenos' ? (
            <div className="fleet-stats-list" style={{ padding: '10px' }}>
               <div style={{ color: '#00ffcc', fontFamily: 'Orbitron', fontSize: '0.8rem', marginBottom: '15px', textAlign: 'center' }}>
                  DISEÑOS DE NAVE DISPONIBLES
               </div>
               
               {(() => {
                 const availableDesigns = DESIGNS_CATALOG.filter(d => d.ship_id === viewedShipId);
                 const ownedDesigns = inventory.filter(i => i.type === 'design' && i.ship_id === viewedShipId);
                 
                 if (availableDesigns.length === 0) {
                   return (
                     <div style={{ textAlign: 'center', padding: '40px 10px', color: '#555', border: '1px dashed #333', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.8rem' }}>ESTA NAVE NO TIENE DISEÑOS DISPONIBLES ACTUALMENTE</p>
                     </div>
                   );
                 }

                 return (
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <div className={`design-card ${!currentDesignId ? 'selected' : ''}`} 
                        onClick={() => !isBlocked && onEquipDesign(viewedShipId, null)}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: !currentDesignId ? '1px solid #00ffcc' : '1px solid #333',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: isBlocked ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                         <div style={{ width: '40px', height: '40px', background: '#070b16', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShipIcon type={viewedShipId} image={viewedShip.image} color="#555" size={30} />
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>Diseño Estándar</div>
                            <div style={{ color: '#888', fontSize: '0.65rem' }}>Aspecto original de la nave. Sin bonos.</div>
                         </div>
                         {!currentDesignId && <div style={{ color: '#00ffcc' }}>✓</div>}
                      </div>

                      {availableDesigns.map(design => {
                        const isOwned = inventory.find(i => i.id === design.id);
                        const isEquipped = currentDesignId === design.id;
                        
                        return (
                          <div key={design.id} className={`design-card ${isEquipped ? 'selected' : ''} ${!isOwned ? 'locked' : ''}`}
                            onClick={() => {
                              if (isBlocked) return;
                              if (!isOwned) return onNavigate('shop');
                              onEquipDesign(viewedShipId, design.id);
                            }}
                            style={{
                              background: isEquipped ? 'rgba(0,255,204,0.05)' : 'rgba(0,0,0,0.3)',
                              border: isEquipped ? '1px solid #00ffcc' : '1px solid #333',
                              padding: '10px',
                              borderRadius: '6px',
                              cursor: isBlocked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              opacity: isOwned ? 1 : 0.6
                            }}
                          >
                             <div style={{ width: '40px', height: '40px', background: '#070b16', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <ShipIcon type={viewedShipId} image={design.image} color="#ff4500" size={30} />
                                {!isOwned && <div style={{ position: 'absolute', top: -5, right: -5, fontSize: '0.7rem' }}>🔒</div>}
                             </div>
                             <div style={{ flex: 1 }}>
                                <div style={{ color: isEquipped ? '#00ffcc' : '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{design.name}</div>
                                <div style={{ color: '#ffcc00', fontSize: '0.65rem' }}>{design.desc}</div>
                             </div>
                             {isEquipped ? <div style={{ color: '#00ffcc' }}>✓</div> : (isOwned ? null : <div style={{ color: '#888', fontSize: '0.6rem' }}>🛒</div>)}
                          </div>
                        );
                      })}
                   </div>
                 );
               })()}
            </div>
          ) : null}

          {/* ACCIONES DEL PANEL (COMÚN) */}
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
                className={`gestionar-button ${isBlocked ? 'blocked' : ''}`}
                onClick={() => {
                  if (isBlocked) {
                    alert("No puedes cambiar de nave fuera de una zona segura.");
                    return;
                  }
                  setSelectedShipId(viewedShipId);
                  // Persistir en backend
                  if (user && user.username) {
                    fetch('http://localhost:8000/api/user/ship', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: user.username, ship_id: viewedShipId })
                    })
                    .then(r => {
                      if (r.status === 403) alert("Error: Debes estar en una zona segura.");
                    })
                    .catch(console.error);
                  }
                }}
                style={{ width: '100%', margin: '0' }}
              >
                {isBlocked ? 'CAMBIO BLOQUEADO (ZONA PELIGROSA)' : 'EQUIPAR COMO ACTIVA'}
              </button>
            )}
            {!isOwned && (
              <button 
                className="primary-button"
                onClick={() => onNavigate('shop')}
                style={{ width: '100%', background: 'linear-gradient(to bottom, #ffcc00, #ff8800)', color: 'black' }}
              >
                ADQUIRIR EN TIENDA ({viewedShip.cost.toLocaleString()} {viewedShip.currency === 'paladio' ? 'PAL' : 'Cr'})
              </button>
            )}
            <button 
              className={`gestionar-button ${isBlocked || (!isOwned && activeTab === 'ship') || (activeTab === 'eco' && !eco?.active) || (activeTab === 'wips' && wips.length === 0) ? 'blocked' : ''}`} 
              onClick={() => {
                if (activeTab === 'ship' && isOwned) setEditMode(true);
                if (activeTab === 'wips' && wips.length > 0) {
                  setSelectedWipId(wips[0].instanceId);
                  setEditMode(true);
                }
                if (activeTab === 'eco' && eco?.active) {
                  setEditMode(true);
                }
              }}
              disabled={activeTab === 'ship' ? !isOwned : activeTab === 'wips' ? wips.length === 0 : !eco?.active}
              style={{ width: '100%', margin: '0' }}
            >
              {activeTab === 'ship' 
                ? (!isOwned ? 'BLOQUEADO: REQUIERE COMPRA' : isBlocked ? 'VER EQUIPAMIENTO (BLOQUEADO)' : 'GESTIONAR NAVE') 
                : activeTab === 'wips'
                  ? (wips.length === 0 ? 'SIN WIPS PARA GESTIONAR' : isBlocked ? 'VER WIPS (BLOQUEADO)' : 'GESTIONAR WIPS')
                  : (!eco?.active ? 'SIN E.C.O. ADQUIRIDO' : isBlocked ? 'VER E.C.O. (BLOQUEADO)' : 'GESTIONAR E.C.O.')
              }
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
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ffcc' }}>
                 {activeTab === 'ship' ? `GESTIÓN DE EQUIPAMIENTO: ${viewedShip.name}` : 'SISTEMA DE CONFIGURACIÓN WIPS'}
              </div>
              <button 
                onClick={() => {
                  setEditMode(false);
                  setSelectedWipId(null);
                }}
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
                    {inventory.map((item, originalIndex) => {
                       if (item.type === 'design') return null;
                      return (
                       <div 
                         key={item.instanceId} 
                         onClick={() => {
                           if (isBlocked) return;
                           if (activeTab === 'ship') onEquip(originalIndex, viewedShipId);
                           else if (activeTab === 'wips' && selectedWipId) {
                                if (item.type === 'lasers' || item.type === 'shields') onEquipWip(originalIndex, selectedWipId);
                           }
                           else if (activeTab === 'eco') {
                                if (item.type === 'lasers') onEquipEco(originalIndex, 'lasers');
                                else if (item.type === 'shields') onEquipEco(originalIndex, 'generators');
                                else if (item.type === 'protocols') onEquipEco(originalIndex, 'protocols');
                                else if (item.type === 'utility') onEquipEco(originalIndex, 'utility');
                                else {
                                    alert('Este módulo no es compatible con el sistema E.C.O.');
                                }
                           }
                         }}
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
                      );
                    })}
                    {inventory.length === 0 && <div style={{ gridColumn: 'span 5', color: '#555', textAlign: 'center', padding: '20px' }}>No hay módulos disponibles en el almacén.</div>}
                 </div>
              </div>

               {/* Ship Slots or Wip Slots */}
               <div style={{ flex: 1.5, background: '#0a0f1a', border: '1px solid #1a2a4a', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  {activeTab === 'ship' ? (
                    <>
                      <div style={{ marginBottom: '15px', color: '#ffcc00', fontSize: '1.1rem', fontWeight: 'bold' }}>🛠️ CONFIGURACIÓN DE RANURAS</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', opacity: isBlocked ? 0.7 : 1 }}>
                        <SlotDisplay label="Sistemas Láser" count={stats.lasersSlots} icon="🎯" color="#ffcc00" equipped={currentEquipped.filter(m => m.type === 'lasers')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                        <SlotDisplay label="Escudos de Energía" count={stats.shieldSlots} icon="🛡️" color="#00c8ff" equipped={currentEquipped.filter(m => m.type === 'shields')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                        <SlotDisplay label="Motores de Impulso" count={stats.engineSlots} icon="🚀" color="#ff3366" equipped={currentEquipped.filter(m => m.type === 'engines')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                        <SlotDisplay label="Módulos de Utilidad" count={stats.utilitySlots} icon="⚛️" color="#9933ff" equipped={currentEquipped.filter(m => m.type === 'utility')} onUnequip={(id) => !isBlocked && onUnequip(id, viewedShipId)} isBlocked={isBlocked} />
                      </div>
                    </>
                  ) : activeTab === 'eco' ? (
                    <>
                      <div style={{ marginBottom: '15px', color: '#00ffcc', fontSize: '1.1rem', fontWeight: 'bold' }}>🛠️ CONFIGURACIÓN DEL E.C.O.</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', opacity: isBlocked ? 0.7 : 1 }}>
                         <SlotDisplay label="Sistemas Láser" count={5} icon="🎯" color="#ffcc00" equipped={eco.equipped?.lasers || []} onUnequip={(id) => !isBlocked && onUnequipEco(id, 'lasers')} isBlocked={isBlocked} unlockedCount={eco.unlocked_slots?.lasers || 1} onUnlock={() => onUnlockEcoSlot('lasers')} />
                         <SlotDisplay label="Generadores de Escudo" count={10} icon="🛡️" color="#00c8ff" equipped={eco.equipped?.generators || []} onUnequip={(id) => !isBlocked && onUnequipEco(id, 'generators')} isBlocked={isBlocked} unlockedCount={eco.unlocked_slots?.generators || 1} onUnlock={() => onUnlockEcoSlot('generators')} />
                         <SlotDisplay label="Protocolos de I.A." count={10} icon="🤖" color="#00ffcc" equipped={eco.equipped?.protocols || []} onUnequip={(id) => !isBlocked && onUnequipEco(id, 'protocols')} isBlocked={isBlocked} unlockedCount={eco.unlocked_slots?.protocols || 1} onUnlock={() => onUnlockEcoSlot('protocols')} />
                         <SlotDisplay label="Módulos de Utilidad" count={5} icon="⚛️" color="#9933ff" equipped={eco.equipped?.utility || []} onUnequip={(id) => !isBlocked && onUnequipEco(id, 'utility')} isBlocked={isBlocked} unlockedCount={eco.unlocked_slots?.utility || 1} onUnlock={() => onUnlockEcoSlot('utility')} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: '15px', color: '#00ffcc', fontSize: '1.1rem', fontWeight: 'bold' }}>📡 CONFIGURACIÓN DE WIPS</div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {wips.map((w, i) => (
                          <div 
                            key={w.instanceId} 
                            onClick={() => setSelectedWipId(w.instanceId)}
                            style={{ 
                              minWidth: '80px', height: '80px', 
                              background: selectedWipId === w.instanceId ? 'rgba(0,255,204,0.1)' : '#070b16',
                              border: `1px solid ${selectedWipId === w.instanceId ? '#00ffcc' : '#1a2a4a'}`,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', borderRadius: '4px'
                            }}
                          >
                            <span style={{ fontSize: '1.5rem' }}>🛰️</span>
                            <span style={{ fontSize: '0.7rem', color: '#888' }}>WIP #{i+1}</span>
                          </div>
                        ))}
                      </div>

                      {selectedWipId && (
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', border: '1px solid #1a2a4a' }}>
                           {(() => {
                             const wip = wips.find(w => w.instanceId === selectedWipId);
                             if (!wip) return null;
                             const def = WIPS_CATALOG.find(d => d.id === wip.type);
                             return (
                               <>
                                 <div style={{ color: '#00ffcc', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #1a2a4a', paddingBottom: '5px' }}>
                                   {def.name.toUpperCase()} - {def.slots} RANURAS DISPONIBLES
                                 </div>
                                 <SlotDisplay 
                                   label="Equipamiento del Wip" 
                                   count={def.slots} 
                                   icon="🛰️" 
                                   color="#00ffcc" 
                                   equipped={wip.equipped} 
                                   onUnequip={(id) => !isBlocked && onUnequipWip(id, selectedWipId)} 
                                   isBlocked={isBlocked} 
                                 />
                               </>
                             );
                           })()}
                        </div>
                      )}
                    </>
                  )}
               </div>
           </div>
        </div>
      )}
    </div>
  );
}
