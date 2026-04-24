import React, { useState } from 'react';
import { SHIPS, MODULES_CATALOG, AMMO_CATALOG, MISSILE_CATALOG, MINERAL_TYPES, WIPS_CATALOG, getRank } from '../utils/gameData';
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
  wipsCount
}) {
  const [activeCategory, setActiveCategory] = useState('armas');
  const [selectedItem, setSelectedItem] = useState(MODULES_CATALOG.find(m => m.type === 'lasers'));
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
    { id: 'naves', label: 'Naves', icon: '🚀' },
    { id: 'extras', label: 'Extras', icon: '⚛️' },
    { id: 'materiales', label: 'Materiales', icon: '💎' },
  ];

  const getCategoryItems = () => {
    switch (activeCategory) {
      case 'armas': return MODULES_CATALOG.filter(m => m.type === 'lasers');
      case 'municion': return [...AMMO_CATALOG, ...MISSILE_CATALOG];
      case 'generadores': return MODULES_CATALOG.filter(m => m.type === 'shields' || m.type === 'engines');
      case 'naves': return SHIPS;
      case 'extras': return MODULES_CATALOG.filter(m => m.type === 'utility');
      case 'wips': return WIPS_CATALOG;
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
    setShowConfirm(true);
  };

  const executePurchase = () => {
    setShowConfirm(false);
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

    // Ship Purchase
    if (activeCategory === 'naves') {
      const alreadyOwned = ownedShips.includes(selectedItem.id);
      if (alreadyOwned) return alert('Ya posees esta nave');
      
      const success = onBuyShip(selectedItem.id, selectedItem.cost);
      if (success) {
        triggerSuccess(`Adquisición de ${selectedItem.name} completada`);
      } else {
        alert('No tienes suficientes créditos');
      }
      return;
    }

    // Module Purchase
    if (selectedItem.id === 'util_cloak') {
      if (credits < selectedItem.cost) return alert('No tienes suficientes créditos');
      
      // Llamada al backend para compra y activación inmediata
      fetch('http://localhost:8000/api/user/buy_cloak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username, cost: selectedItem.cost })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCredits(data.credits);
          if (typeof setIsInvisible === 'function') {
            setIsInvisible(true);
          }
          triggerSuccess('Camuflaje activado con éxito');
        } else {
          alert(data.detail || 'Error al comprar camuflaje');
        }
      })
      .catch(() => alert('Error de conexión al comprar camuflaje'));
      
      return;
    }

    // Wip Purchase
    if (activeCategory === 'wips') {
      const success = onBuyWip(selectedItem.id, selectedItem.cost);
      if (success) {
        triggerSuccess(`Adquisición de ${selectedItem.name} completada`);
      } else {
        if (wipsCount >= 8) alert('Ya has alcanzado el límite de 8 Wips');
        else alert('No tienes suficientes créditos');
      }
      return;
    }

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
                {activeCategory === 'naves' && ownedShips.includes(item.id) ? '---' : 
                 (item.cost !== undefined) ? `${item.cost.toLocaleString()} Cr` : `${item.sellPrice} Cr/u`}
              </div>
            </div>
          ))}
        </section>

        {/* PREVIEW PANEL */}
        <aside className="shop-preview-panel">
          {selectedItem ? (
            <>
              <div className="preview-top" style={{ display: 'flex', justifyContent: 'center', minHeight: '150px', alignItems: 'center' }}>
                {activeCategory === 'naves' ? (
                  <ShipIcon type={selectedItem.id} image={selectedItem.image} color={selectedItem.color || (selectedItem.id === 'sovereign' ? '#e6b800' : '#00b3ff')} size={150} />
                ) : (
                  <div style={{ fontSize: '8rem' }}>
                    {selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '120px', height: '120px', objectFit: 'contain' }} /> : selectedItem.icon}
                  </div>
                )}
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
                  {activeCategory === 'naves' && (
                    <>
                      <div className="preview-stat-row">
                        <span>Casco Estructural</span>
                        <span style={{ color: '#00ffcc' }}>{selectedItem.hp} HP</span>
                      </div>
                      <div className="preview-stat-row">
                        <span>Escudo Base</span>
                        <span style={{ color: '#00c8ff' }}>{selectedItem.shld} SB</span>
                      </div>
                      <div className="preview-stat-row">
                        <span>Velocidad Base</span>
                        <span style={{ color: '#ffcc00' }}>{selectedItem.spd} m/s</span>
                      </div>
                      <div className="preview-stat-row">
                        <span>Bodega Carga</span>
                        <span style={{ color: '#88aaff' }}>{selectedItem.cargo_capacity} t</span>
                      </div>
                      <div className="preview-stat-row">
                        <span>Ranuras Láser</span>
                        <span>{selectedItem.slots.lasers}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="shop-action-strip">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    {activeCategory === 'naves' && ownedShips.includes(selectedItem.id) ? 'ESTADO:' : 'PRECIO FINAL:'}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (isAffordable || isMineral) ? '#00ffcc' : '#ff3366' }}>
                    {activeCategory === 'naves' && ownedShips.includes(selectedItem.id) ? 'ADQUIRIDA' :
                     isMineral ? (amountOwned * selectedItem.sellPrice).toLocaleString() : (selectedItem.cost || 0).toLocaleString()} Cr
                  </div>
                </div>
                <button 
                  className="buy-button" 
                  disabled={isMineral ? amountOwned === 0 : (activeCategory === 'naves' && ownedShips.includes(selectedItem.id)) || !isAffordable}
                  onClick={handleAction}
                  style={{ background: activeCategory === 'naves' && ownedShips.includes(selectedItem.id) ? '#333' : '' }}
                >
                  {activeCategory === 'naves' && ownedShips.includes(selectedItem.id) ? 'YA EN PROPIEDAD' : isMineral ? 'VENDER TODO' : 'COMPRAR'}
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
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>
              {selectedItem?.icon || '📦'}
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
