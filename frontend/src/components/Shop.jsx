import React, { useState } from 'react';
import { SHIPS, MODULES_CATALOG, AMMO_CATALOG, MISSILE_CATALOG, MINERAL_TYPES, getRank } from '../utils/gameData';
import NavigationBar from './NavigationBar';

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
  onBack 
}) {
  const [activeCategory, setActiveCategory] = useState('armas');
  const [selectedItem, setSelectedItem] = useState(MODULES_CATALOG.find(m => m.type === 'lasers'));
  const [successMessage, setSuccessMessage] = useState('');

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
    { id: 'extras', label: 'Extras', icon: '⚛️' },
    { id: 'materiales', label: 'Materiales', icon: '💎' },
  ];

  const getCategoryItems = () => {
    switch (activeCategory) {
      case 'armas': return MODULES_CATALOG.filter(m => m.type === 'lasers');
      case 'municion': return [...AMMO_CATALOG, ...MISSILE_CATALOG];
      case 'generadores': return MODULES_CATALOG.filter(m => m.type === 'shields' || m.type === 'engines');
      case 'extras': return MODULES_CATALOG.filter(m => m.type === 'utility');
      case 'materiales': return MINERAL_TYPES;
      default: return [];
    }
  };

  const items = getCategoryItems();

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleAction = () => {
    if (!selectedItem) return;
    
    // Mineral Sale
    if (activeCategory === 'materiales') {
      const amountOwned = minerals[selectedItem.id] || 0;
      if (amountOwned > 0) {
        onSellMinerals(selectedItem.id, amountOwned, amountOwned * selectedItem.sellPrice);
        triggerSuccess(`Venta de ${selectedItem.name} exitosa`);
      }
      return;
    }

    // Ammo Purchase
    if (selectedItem.count) {
       onBuyAmmo(selectedItem.id, selectedItem.count, selectedItem.cost);
       triggerSuccess(`Compra de ${selectedItem.name} exitosa`);
       return;
    }

    // Module Purchase
    handleBuyModule(selectedItem);
  };

  const isAffordable = selectedItem ? credits >= (selectedItem.cost || 0) : false;
  const isMineral = activeCategory === 'materiales';
  const amountOwned = isMineral ? (minerals[selectedItem?.id] || 0) : 0;

  return (
    <div className="shop-view-container">

      {/* SUCCESS NOTIFICATION */}
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

      {/* MAIN LAYOUT */}
      <div className="shop-main-layout">
        
        {/* SIDEBAR */}
        <aside className="shop-sidebar">
          {categories.map(cat => (
            <div 
              key={cat.id} 
              className={`shop-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedItem(null); // Reset selection on category change
              }}
            >
              <span>{cat.label}</span>
              <span>{cat.icon}</span>
            </div>
          ))}
        </aside>

        {/* ITEM GRID */}
        <section className="shop-grid-area">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`shop-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <div style={{ fontSize: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
                {item.image ? <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} /> : item.icon}
              </div>
              <div className="shop-item-name">{item.name}</div>
              <div className="shop-item-price">
                {item.cost ? `${item.cost} Cr` : `${item.sellPrice} Cr/u`}
              </div>
            </div>
          ))}
        </section>

        {/* PREVIEW PANEL */}
        <aside className="shop-preview-panel">
          {selectedItem ? (
            <>
              <div className="preview-top" style={{ display: 'flex', justifyContent: 'center', minHeight: '150px', alignItems: 'center' }}>
                <div style={{ fontSize: '8rem' }}>
                  {selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '120px', height: '120px', objectFit: 'contain' }} /> : selectedItem.icon}
                </div>
              </div>

              <div className="preview-info">
                <div className="preview-title">{selectedItem.name}</div>
                <div className="preview-desc">
                  {selectedItem.desc || `Suministro de alto rendimiento para naves de clase ${getRank(level)}. Diseñado para operaciones en sectores peligrosos.`}
                </div>

                <div className="preview-stats">
                  {selectedItem.damage && (
                    <div className="preview-stat-row">
                      <span>Daño Base</span>
                      <span style={{ color: '#ff3366' }}>{selectedItem.damage} {selectedItem.count ? 'pt' : 'x'}</span>
                    </div>
                  )}
                  {selectedItem.atk && (
                    <div className="preview-stat-row">
                      <span>Potencia de Ataque</span>
                      <span>+{selectedItem.atk}</span>
                    </div>
                  )}
                  {selectedItem.shld && (
                    <div className="preview-stat-row">
                      <span>Refuerzo de Escudo</span>
                      <span>+{selectedItem.shld}</span>
                    </div>
                  )}
                  {selectedItem.count && (
                    <div className="preview-stat-row">
                      <span>Cantidad por pack</span>
                      <span>{selectedItem.count} unidades</span>
                    </div>
                  )}
                  {activeCategory === 'materiales' && (
                    <div className="preview-stat-row">
                      <span>En bodega</span>
                      <span style={{ color: '#fff' }}>{amountOwned} unidades</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shop-action-strip">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>PRECIO FINAL:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isAffordable || isMineral ? '#00ffcc' : '#ff3366' }}>
                    {isMineral ? amountOwned * selectedItem.sellPrice : selectedItem.cost} Cr
                  </div>
                </div>
                <button 
                  className="buy-button" 
                  disabled={isMineral ? amountOwned === 0 : !isAffordable}
                  onClick={handleAction}
                >
                  {isMineral ? 'VENDER TODO' : 'COMPRAR'}
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
    </div>
  );
}
