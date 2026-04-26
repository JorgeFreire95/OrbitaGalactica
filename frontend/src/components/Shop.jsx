import React, { useState } from 'react';
import { SHIPS, MODULES_CATALOG, AMMO_CATALOG, MISSILE_CATALOG, MINERAL_TYPES, WIPS_CATALOG, ECO_CONFIG, ECO_PROTOCOLS, ECO_FUEL, getRank } from '../utils/gameData';
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
  onBuyEcoFuel
}) {
  const [activeCategory, setActiveCategory] = useState('armas');
  const [selectedItem, setSelectedItem] = useState(MODULES_CATALOG.find(m => m.type === 'lasers'));
  const [selectedLvl, setSelectedLvl] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBuyModule = (module) => {
    if (credits < module.cost) return alert('No tienes suficientes créditos');
    setCredits(c => c - module.cost);
    setInventory(prev => [...prev, { ...module, instanceId: Date.now() }]);
    triggerSuccess('Módulo equipado con éxito');
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
      case 'eco': raw = [ECO_CONFIG, ...ECO_FUEL, ...ECO_PROTOCOLS]; break;
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
    
    const allLeveled = [...MODULES_CATALOG, ...ECO_PROTOCOLS];
    return allLeveled.find(i => i.id === `${selectedItem.baseId}_${selectedLvl}`) || selectedItem;
  };

  const currentItem = getCurrentItem();

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedLvl(1); // Reset level when changing item
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

    if (targetItem.count && activeCategory === 'municion') {
       onBuyAmmo(targetItem.id, targetItem.count, targetItem.cost);
       triggerSuccess(`Compra de ${targetItem.name} exitosa`);
       return;
    }

    if (targetItem.type === 'fuel') {
      onBuyEcoFuel(targetItem.count, targetItem.cost);
      triggerSuccess('Combustible adquirido');
      return;
    }

    if (targetItem.id === 'eco') {
      onBuyEco(targetItem.cost);
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

  const isAffordable = currentItem ? credits >= (currentItem.cost || 0) : false;
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
              <div style={{ fontSize: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
                {activeCategory === 'naves' ? (
                  <ShipIcon type={item.id} image={item.image} color={item.color || (item.id === 'sovereign' ? '#e6b800' : '#00b3ff')} size={50} />
                ) : (
                  item.image ? <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} /> : item.icon
                )}
              </div>
              <div className="shop-item-name">{item.name}</div>
              <div className="shop-item-price">
                {(item.cost !== undefined) ? `${item.cost.toLocaleString()} Cr` : `${item.sellPrice} Cr/u`}
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

                <div className="preview-content">
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

                  <div className="preview-stats">
                    {currentItem.atk && (
                      <div className="preview-stat-row">
                        <span>Daño de ataque</span>
                        <span style={{ color: '#ffcc00' }}>+{currentItem.atk}</span>
                      </div>
                    )}
                    {currentItem.shld && (
                      <div className="preview-stat-row">
                        <span>Escudo adicional</span>
                        <span style={{ color: '#00c8ff' }}>+{currentItem.shld}</span>
                      </div>
                    )}
                    {currentItem.hp && activeCategory !== 'naves' && (
                      <div className="preview-stat-row">
                        <span>Casco estructural</span>
                        <span style={{ color: '#ff3366' }}>+{currentItem.hp}</span>
                      </div>
                    )}
                    {currentItem.spd && (
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
                    {activeCategory === 'naves' && currentItem.slots && (
                      <div className="preview-stat-row">
                        <span>Ranuras Láser</span>
                        <span>{currentItem.slots.lasers}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shop-action-strip">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {(activeCategory === 'naves' && ownedShips.includes(currentItem.id)) || (activeCategory === 'eco' && currentItem.id === 'eco' && eco.active) ? 'ESTADO:' : 'PRECIO FINAL:'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (isAffordable || isMineral) ? '#00ffcc' : '#ff3366' }}>
                      {(activeCategory === 'naves' && ownedShips.includes(currentItem.id)) || (activeCategory === 'eco' && currentItem.id === 'eco' && eco.active) ? 'ADQUIRIDO' :
                       isMineral ? (amountOwned * currentItem.sellPrice).toLocaleString() : (currentItem.cost || 0).toLocaleString()} Cr
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
              ¿Estás seguro de que deseas proceder con la adquisición de 
              <span style={{ color: '#fff', fontWeight: 'bold' }}> {selectedItem?.name}</span>?
              <br/>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>
                {isMineral ? 'Recibirás' : 'Se descontarán'} 
                <b style={{ color: isMineral ? '#00ffcc' : '#ffcc00' }}> {isMineral ? (amountOwned * selectedItem.sellPrice).toLocaleString() : (selectedItem.cost || 0).toLocaleString()} </b> 
                créditos de tu cuenta.
              </span>
            </p>
            
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
