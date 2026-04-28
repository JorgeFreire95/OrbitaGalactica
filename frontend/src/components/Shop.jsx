import React, { useState } from 'react';
import { SHIPS, MODULES_CATALOG, AMMO_CATALOG, MISSILE_CATALOG, MINERAL_TYPES, WIPS_CATALOG, ECO_CONFIG, ECO_PROTOCOLS, ECO_FUEL, ECO_REPAIR, ECO_COLLECTOR, ECO_TRACKER, ECO_KAMIKAZE, ECO_SELF_REPAIR, getRank } from '../utils/gameData';
import NavigationBar from './NavigationBar';
import ShipIcon from './ShipIcon';

export default function Shop({ 
  credits, 
  setCredits, 
  inventory, 
  setInventory, 
  ammo,
  onBuyAmmo,
  minerals,
  onSellMinerals,
  level,
  paladio,
  onNavigate,
  onBack,
  ownedShips = [],
  onBuyShip,
  setIsInvisible,
  user,
  onBuyWip,
  wipsCount,
  eco,
  onBuyEco,
  onBuyProtocol,
  setPaladio,
  onBuyEcoFuel
}) {
  const [activeCategory, setActiveCategory] = useState('armas');
  const [selectedItem, setSelectedItem] = useState(MODULES_CATALOG.find(m => m.type === 'lasers'));
  const [selectedLvl, setSelectedLvl] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  const [tempEcoName, setTempEcoName] = useState('E.C.O.');

  const handleBuyModule = (module) => {
    const currency = module.currency || 'credits';
    if (currency === 'paladio') {
      if (paladio < module.cost) return alert('No tienes suficiente paladio');
      if (setPaladio) setPaladio(p => p - module.cost);
    } else {
      if (credits < module.cost) return alert('No tienes suficientes créditos');
      setCredits(c => c - module.cost);
    }
    
    setInventory(prev => [...prev, { ...module, instanceId: Date.now() }]);
    triggerSuccess('Ítem adquirido con éxito');
  };

  const triggerSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const categories = [
    { id: 'armas', label: 'Armas', icon: '🎯' },
    { id: 'municion', label: 'Munición', icon: '📦' },
    { id: 'generadores', label: 'Generadores', icon: '🛡️' },
    { id: 'wips', label: 'Wips', icon: '🛰️' },
    { id: 'eco', label: 'E.C.O.', icon: '🤖' },
    { id: 'naves', label: 'Naves', icon: '🚀' },
    { id: 'extras', label: 'Extras', icon: '⚛️' },
    { id: 'materiales', label: 'Materiales', icon: '💎' },
  ];

  const getCategoryItems = () => {
    let raw = [];
    switch (activeCategory) {
      case 'armas': raw = MODULES_CATALOG.filter(m => m.type === 'lasers'); break;
      case 'municion': raw = [...AMMO_CATALOG, ...MISSILE_CATALOG]; break;
      case 'generadores': raw = MODULES_CATALOG.filter(m => m.type === 'shields' || m.type === 'engines'); break;
      case 'naves': raw = SHIPS; break;
      case 'extras': raw = MODULES_CATALOG.filter(m => m.type === 'utility'); break;
      case 'wips': raw = WIPS_CATALOG; break;
      case 'eco': raw = [ECO_CONFIG, ...ECO_REPAIR, ...ECO_COLLECTOR, ...ECO_TRACKER, ...ECO_KAMIKAZE, ...ECO_SELF_REPAIR, ...ECO_FUEL, ...ECO_PROTOCOLS]; break;
      case 'materiales': raw = MINERAL_TYPES; break;
    }

    const grouped = [];
    const seen = new Set();
    raw.forEach(item => {
      if (item.lvl && activeCategory === 'eco') {
        const baseId = item.id.replace(/_\d$/, '');
        if (!seen.has(baseId)) {
          seen.add(baseId);
          grouped.push({ ...item, baseId, isLeveled: true });
        }
      } else {
        grouped.push(item);
      }
    });
    return grouped;
  };

  const items = getCategoryItems();

  // Helper to get the actual item data based on selected level
  const getCurrentItem = () => {
    if (!selectedItem) return null;
    if (!selectedItem.isLeveled) return selectedItem;
    
    const allLeveled = [...MODULES_CATALOG, ...ECO_PROTOCOLS, ...ECO_REPAIR, ...ECO_COLLECTOR, ...ECO_TRACKER, ...ECO_KAMIKAZE, ...ECO_SELF_REPAIR];
    return allLeveled.find(i => i.id === `${selectedItem.baseId}_${selectedLvl}`) || selectedItem;
  };

  const currentItem = getCurrentItem();

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedLvl(1); // Reset level when changing item
    setBuyQty(1); // Reset quantity
  };

  const handleAction = () => {
    if (!selectedItem) return;
    setShowConfirm(true);
  };

  const executePurchase = () => {
    setShowConfirm(false);
    if (!selectedItem) return;
    
    if (activeCategory === 'materiales') {
      const amountOwned = minerals[selectedItem.id] || 0;
      if (amountOwned > 0) {
        onSellMinerals(selectedItem.id, amountOwned, amountOwned * selectedItem.sellPrice);
        triggerSuccess(`Venta de ${selectedItem.name} exitosa`);
      }
      return;
    }

    const targetItem = currentItem;

    if (targetItem.isStackable) {
       const totalCost = targetItem.cost * buyQty;
       if (targetItem.type === 'fuel') {
         onBuyEcoFuel(buyQty, totalCost);
       } else {
         onBuyAmmo(targetItem.id, buyQty, totalCost, targetItem.currency);
       }
       triggerSuccess(`Compra de ${buyQty} ${targetItem.name} exitosa`);
       setBuyQty(1);
       return;
    }

    if (targetItem.id === 'eco') {
      onBuyEco(targetItem.cost, tempEcoName);
      triggerSuccess('E.C.O. Adquirido');
      return;
    }

    if (targetItem.type === 'protocols') {
      onBuyProtocol(targetItem, targetItem.cost);
      triggerSuccess('Protocolo adquirido');
      return;
    }

    if (activeCategory === 'wips') {
      onBuyWip(targetItem);
      triggerSuccess('Wip adquirido');
      return;
    }

    if (activeCategory === 'naves') {
      onBuyShip(targetItem.id, targetItem.cost);
      triggerSuccess(`Nave ${targetItem.name} adquirida`);
      return;
    }

    handleBuyModule(targetItem);
  };

  const currentQty = currentItem?.isStackable ? buyQty : 1;
  const currentTotalCost = currentItem ? (currentItem.cost * currentQty) : 0;

  const isAffordable = currentItem 
    ? (currentItem.currency === 'paladio' ? paladio >= currentTotalCost : credits >= currentTotalCost) 
    : false;
  const isMineral = activeCategory === 'materiales';
  const amountOwned = isMineral ? (minerals[selectedItem?.id] || 0) : 0;

  return (
    <div className="shop-view-container">

      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 255, 204, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #00ffcc',
          borderBottom: '4px solid #00ffcc',
          padding: '12px 30px',
          borderRadius: '8px',
          color: '#00ffcc',
          fontFamily: 'Orbitron',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          zIndex: 10000,
          boxShadow: '0 0 30px rgba(0, 255, 204, 0.3)',
          animation: 'fade-in-out 3s forwards'
        }}>
          <style>{`
            @keyframes fade-in-out {
              0% { opacity: 0; transform: translate(-50%, -20px); }
              15% { opacity: 1; transform: translate(-50%, 0); }
              85% { opacity: 1; transform: translate(-50%, 0); }
              100% { opacity: 0; transform: translate(-50%, -20px); }
            }
          `}</style>
          ✓ COMPRA EXITOSA: {successMessage.toUpperCase()}
        </div>
      )}

      <div className="shop-main-layout">
        
        <aside className="shop-sidebar">
          {categories.map(cat => (
            <div 
              key={cat.id} 
              className={`shop-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedItem(null);
              }}
            >
              <span>{cat.label}</span>
              <span>{cat.icon}</span>
            </div>
          ))}
        </aside>

        <section className="shop-grid-area">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`shop-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {activeCategory === 'naves' && ownedShips.includes(item.id) && (
                <div style={{ position: 'absolute', top: '5px', left: '5px', background: '#00ffcc', color: 'black', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold', zIndex: 10 }}>ADQUIRIDA</div>
              )}
              {activeCategory === 'eco' && item.id === 'eco' && eco.active && (
                <div style={{ position: 'absolute', top: '5px', left: '5px', background: '#00ffcc', color: 'black', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold', zIndex: 10 }}>ADQUIRIDO</div>
              )}
              <div style={{ fontSize: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
                {activeCategory === 'naves' ? (
                  <ShipIcon type={item.id} image={item.image} color={item.color || (item.id === 'sovereign' ? '#e6b800' : '#00b3ff')} size={50} />
                ) : (
                  item.image ? <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} /> : item.icon
                )}
              </div>
              <div className="shop-item-name">{item.name}</div>
              <div className="shop-item-price">
                {(item.cost !== undefined) ? `${item.cost.toLocaleString()} ${item.currency === 'paladio' ? 'PAL' : 'Cr'}` : `${item.sellPrice} Cr/u`}
              </div>
            </div>
          ))}
        </section>

        <aside className="shop-preview-panel">
          {currentItem ? (
            <>
                <div className="preview-header">
                  <div className="preview-icon-container" style={{ display: 'flex', justifyContent: 'center', height: '120px' }}>
                    {currentItem.image ? (
                       <img src={currentItem.image} alt={currentItem.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                    ) : (
                       <span style={{ fontSize: '3rem' }}>{currentItem.icon}</span>
                    )}
                  </div>
                  <div className="preview-title">
                    <h3>{currentItem.name}</h3>
                    <div style={{ color: '#00ffcc', fontSize: '0.8rem' }}>{currentItem.type?.toUpperCase()}</div>
                  </div>
                </div>

                <div className="preview-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <p className="item-description">{currentItem.desc || 'Módulo de equipamiento avanzado para naves espaciales.'}</p>
                  
                  {selectedItem.isLeveled && (
                    <div style={{ margin: '15px 0', background: 'rgba(0,255,204,0.05)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(0,255,204,0.1)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Seleccionar Nivel tecnológico:</div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[1, 2, 3].map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => setSelectedLvl(lvl)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: selectedLvl === lvl ? '#00ffcc' : 'transparent',
                              border: `1px solid ${selectedLvl === lvl ? '#00ffcc' : '#333'}`,
                              color: selectedLvl === lvl ? '#000' : '#888',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              transition: 'all 0.2s'
                            }}
                          >
                            LVL {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentItem.id !== 'eco' && (
                  <div style={{ margin: '20px 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '1px' }}>Especificaciones Técnicas</span>
                  </div>
                  )}

                  <div className="preview-stats">
                    {currentItem.damage && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Daño de explosión</span>
                         <span style={{ color: '#ff3333' }}>{currentItem.damage.toLocaleString()}</span>
                       </div>
                    )}
                    {currentItem.radius && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Radio de explosión</span>
                         <span style={{ color: '#ffcc00' }}>{currentItem.radius} m</span>
                       </div>
                    )}
                    {currentItem.range && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Alcance de radar</span>
                         <span style={{ color: '#00ffcc' }}>{currentItem.range} m</span>
                       </div>
                    )}
                    {currentItem.hp_sec && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Reparación / seg</span>
                         <span style={{ color: '#00ffcc' }}>{currentItem.hp_sec.toLocaleString()} PV</span>
                       </div>
                    )}
                    {currentItem.regen && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Reparación / seg (ECO)</span>
                         <span style={{ color: '#ccff00' }}>{currentItem.regen.toLocaleString()} PV</span>
                       </div>
                    )}
                    {currentItem.duration && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Duración efecto</span>
                         <span style={{ color: '#fff' }}>{currentItem.duration} s</span>
                       </div>
                    )}
                    {currentItem.fail_prob !== undefined && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Prob. de rechazo</span>
                         <span style={{ color: '#ff3366' }}>{currentItem.fail_prob}%</span>
                       </div>
                    )}
                    {currentItem.fuel_cons && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Consumo base</span>
                         <span style={{ color: '#ffcc00' }}>{currentItem.fuel_cons} ⛽</span>
                       </div>
                    )}
                    {currentItem.extra_cons && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Consumo extra</span>
                         <span style={{ color: '#ffcc00' }}>+{currentItem.extra_cons}% ⛽</span>
                       </div>
                    )}
                    {currentItem.atk && activeCategory !== 'naves' && (
                       <div className="preview-stat-row">
                         <span>Bono de Ataque</span>
                         <span style={{ color: '#ffcc00' }}>+{currentItem.atk}</span>
                       </div>
                    )}
                    {currentItem.shld && activeCategory !== 'naves' && (
                       <>
                         <div className="preview-stat-row">
                           <span>Bono de Escudo</span>
                           <span style={{ color: '#00c8ff' }}>+{currentItem.shld}</span>
                         </div>
                         {currentItem.absorption && (
                           <div className="preview-stat-row">
                             <span>Absorción de daño</span>
                             <span style={{ color: '#00c8ff' }}>{(currentItem.absorption * 100)}%</span>
                           </div>
                         )}
                       </>
                    )}
                    {currentItem.cargo && activeCategory === 'eco' && (
                       <div className="preview-stat-row">
                         <span>Capacidad de Carga</span>
                         <span style={{ color: '#ffaa00' }}>+{currentItem.cargo.toLocaleString()}</span>
                       </div>
                    )}
                    {currentItem.hp && activeCategory !== 'naves' && currentItem.id !== 'eco' && (
                       <div className="preview-stat-row">
                         <span>Bono de Vida</span>
                         <span style={{ color: '#ff3366' }}>+{currentItem.hp.toLocaleString()}</span>
                       </div>
                    )}
                    {currentItem.spd && activeCategory !== 'naves' && (
                      <div className="preview-stat-row">
                        <span>Velocidad motor</span>
                        <span style={{ color: '#00ffcc' }}>+{currentItem.spd} m/s</span>
                      </div>
                    )}
                    {currentItem.cargo && (
                      <div className="preview-stat-row">
                        <span>Capacidad carga</span>
                        <span style={{ color: '#88aaff' }}>+{currentItem.cargo} t</span>
                      </div>
                    )}
                    {currentItem.repair_rate && (
                      <div className="preview-stat-row">
                        <span>Tasa reparación</span>
                        <span style={{ color: '#00ffcc' }}>{currentItem.repair_rate} HP/s</span>
                      </div>
                    )}
                    {activeCategory === 'naves' && (
                      <>
                        <div style={{ marginTop: '15px', marginBottom: '10px', color: '#00ffcc', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '5px' }}>ESPECIFICACIONES TÉCNICAS</div>
                        <div className="preview-stat-row">
                          <span>Vida Base</span>
                          <span style={{ color: '#ff3366' }}>{currentItem.hp?.toLocaleString()} HP</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Velocidad Base</span>
                          <span style={{ color: '#00ffcc' }}>{currentItem.spd}</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Ranuras Láser</span>
                          <span style={{ color: '#ffcc00' }}>{currentItem.slots.lasers}</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Ranuras Escudos</span>
                          <span style={{ color: '#00c8ff' }}>{currentItem.slots.shields}</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Ranuras Motores</span>
                          <span style={{ color: '#ff3366' }}>{currentItem.slots.engines}</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Bodega</span>
                          <span style={{ color: '#88aaff' }}>{currentItem.cargo_capacity?.toLocaleString()} unidades</span>
                        </div>
                      </>
                    )}
                    {activeCategory === 'eco' && currentItem.id === 'eco' && (
                      <>
                        <div style={{ marginTop: '15px', marginBottom: '10px', color: '#00ffcc', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '5px' }}>ESPECIFICACIONES DEL SISTEMA</div>
                        <div className="preview-stat-row">
                          <span>Vida Base</span>
                          <span style={{ color: '#ff3366' }}>{currentItem.hp?.toLocaleString()} HP</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Capacidad Combustible</span>
                          <span style={{ color: '#ffcc00' }}>{currentItem.fuel?.toLocaleString()} u</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Ranuras Láser</span>
                          <span style={{ color: '#ffcc00' }}>{currentItem.slots.lasers}</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Ranuras Generadores</span>
                          <span style={{ color: '#00c8ff' }}>{currentItem.slots.generators}</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Ranuras Protocolos</span>
                          <span style={{ color: '#9933ff' }}>{currentItem.slots.protocols}</span>
                        </div>
                        <div className="preview-stat-row">
                          <span>Ranuras Utilidad</span>
                          <span style={{ color: '#00ffcc' }}>{currentItem.slots.utility}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {currentItem.isStackable && (
                    <div className="quantity-selector-container" style={{ margin: '15px 0', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>CANTIDAD:</span>
                        <span style={{ fontSize: '1rem', color: '#00ffcc', fontWeight: 'bold' }}>{buyQty.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                        {[10, 100, 1000].map(q => (
                          <button 
                            key={q}
                            onClick={() => setBuyQty(q)}
                            style={{ 
                              background: buyQty === q ? '#00ffcc' : '#111',
                              color: buyQty === q ? 'black' : '#ccc',
                              border: '1px solid #333',
                              padding: '5px 0',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              transition: 'all 0.2s'
                            }}
                          >
                            +{q}
                          </button>
                        ))}
                        <button 
                          onClick={() => {
                            const affordable = currentItem.currency === 'paladio' ? paladio : credits;
                            let max = Math.floor(affordable / currentItem.cost);
                            
                            // Si es combustible, limitar por el espacio disponible en el ECO
                            if (currentItem.type === 'fuel') {
                               const spaceLeft = (eco.max_fuel || 100000) - (eco.fuel || 0);
                               max = Math.min(max, Math.max(0, spaceLeft));
                            }
                            
                            setBuyQty(Math.max(1, Math.floor(max)));
                          }}
                          style={{ 
                            background: '#333',
                            color: '#00ffcc',
                            border: '1px solid #00ffcc44',
                            padding: '5px 0',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          MAX
                        </button>
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                         <button onClick={() => setBuyQty(prev => Math.max(1, prev - 1))} style={{ flex: 1, background: '#222', border: '1px solid #333', color: '#ccc', borderRadius: '4px' }}>-</button>
                         <button onClick={() => setBuyQty(prev => prev + 1)} style={{ flex: 1, background: '#222', border: '1px solid #333', color: '#ccc', borderRadius: '4px' }}>+</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shop-action-strip">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {(activeCategory === 'naves' && ownedShips.includes(currentItem.id)) || (activeCategory === 'eco' && currentItem.id === 'eco' && eco.active) ? 'ESTADO:' : 'PRECIO FINAL:'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (isAffordable || isMineral) ? '#00ffcc' : '#ff3366' }}>
                      {(activeCategory === 'naves' && ownedShips.includes(currentItem.id)) || (activeCategory === 'eco' && currentItem.id === 'eco' && eco.active) ? 'ADQUIRIDO' :
                       isMineral ? (amountOwned * currentItem.sellPrice).toLocaleString() : currentTotalCost.toLocaleString()} {currentItem.currency === 'paladio' ? 'PAL' : 'Cr'}
                    </div>
                  </div>
                  <button 
                    className="buy-button" 
                    disabled={isMineral ? amountOwned === 0 : (activeCategory === 'naves' && ownedShips.includes(currentItem.id)) || (activeCategory === 'eco' && currentItem.id === 'eco' && eco.active) || !isAffordable}
                    onClick={handleAction}
                    style={{ background: ((activeCategory === 'naves' && ownedShips.includes(currentItem.id)) || (activeCategory === 'eco' && currentItem.id === 'eco' && eco.active)) ? '#333' : '' }}
                  >
                    {(activeCategory === 'naves' && ownedShips.includes(currentItem.id)) || (activeCategory === 'eco' && currentItem.id === 'eco' && eco.active) ? 'YA EN PROPIEDAD' : isMineral ? 'VENDER TODO' : 'COMPRAR'}
                  </button>
                </div>
              </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', textAlign: 'center', padding: '40px' }}>
              SELECCIONA UN ÍTEM PARA VER SUS ESPECIFICACIONES TÉCNICAS
            </div>
          )}
        </aside>

      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20000, animation: 'fade-in 0.3s ease-out'
        }}>
          <style>{`
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>
          
          <div style={{
            background: 'rgba(10, 15, 25, 0.95)',
            border: '1px solid #00ffcc44',
            borderTop: '4px solid #00ffcc',
            padding: '40px',
            borderRadius: '15px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 50px rgba(0, 255, 204, 0.15)',
            animation: 'scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <h2 style={{ fontFamily: 'Orbitron', color: '#00ffcc', marginBottom: '15px', letterSpacing: '2px' }}>
              REQUERIDA CONFIRMACIÓN
            </h2>
            <div style={{ marginBottom: '20px' }}>
              {selectedItem?.image ? (
                <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '3rem' }}>{selectedItem?.icon || '📦'}</div>
              )}
            </div>
            <p style={{ color: '#ccc', marginBottom: '30px', lineHeight: '1.6' }}>
              ¿Estás seguro de que deseas proceder con la adquisición de <span style={{ color: '#fff', fontWeight: 'bold' }}> {buyQty.toLocaleString()} {selectedItem?.name}</span>?
              <br/>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>
                {isMineral ? 'Recibirás' : 'Se descontarán'} 
                <b style={{ color: isMineral ? '#00ffcc' : '#ffcc00' }}> {isMineral ? (amountOwned * selectedItem.sellPrice).toLocaleString() : (currentTotalCost).toLocaleString()} </b> 
                {selectedItem.currency === 'paladio' ? 'paladio' : 'créditos'} de tu cuenta.
              </span>
            </p>

            {selectedItem?.id === 'eco' && (
              <div style={{ marginBottom: '30px', textAlign: 'left' }}>
                <label style={{ color: '#00ffcc', fontSize: '0.75rem', display: 'block', marginBottom: '10px', fontFamily: 'Orbitron' }}>ASIGNA UN NOMBRE A TU E.C.O.:</label>
                <input 
                  type="text" 
                  value={tempEcoName} 
                  onChange={(e) => setTempEcoName(e.target.value.toUpperCase())}
                  maxLength={15}
                  placeholder="NOMBRE DEL DRON"
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #00ffcc44',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'Orbitron',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={executePurchase}
                style={{
                  flex: 1, padding: '15px', background: '#00ffcc', color: '#000',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.filter = 'brightness(1.2)'}
                onMouseOut={(e) => e.target.style.filter = 'none'}
              >
                ACEPTAR
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '15px', background: 'rgba(255,255,255,0.05)', color: '#ff3366',
                  border: '1px solid #ff336644', borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.target.style.background = '#ff3366'; e.target.style.color = '#fff'; }}
                onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#ff3366'; }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
