import { SHIPS, MODULES_CATALOG, AMMO_CATALOG, MINERAL_TYPES, getRank } from '../utils/gameData';
import { SlotDisplay, StatRow } from './ShipComponents';

export default function Shop({ 
  selectedShipId, 
  credits, 
  setCredits, 
  equippedByShip,
  inventory, 
  setInventory, 
  ammo,
  onBuyAmmo,
  minerals,
  onSellMinerals,
  upgrades,
  level,
  onBack 
}) {
  const selectedShip = SHIPS.find(s => s.id === selectedShipId);
  const currentEquipped = equippedByShip[selectedShipId] || [];

  const handleBuyModule = (module) => {
    if (credits < module.cost) return alert('No tienes suficientes créditos');
    
    setCredits(c => c - module.cost);
    setInventory(prev => [...prev, { ...module, instanceId: Date.now() }]);
  };

  return (
    <div className="shop-container" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0a0a14', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* Header with Credits */}
      <div style={{ width: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onBack}
          style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#888', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' }}
          onMouseOver={(e) => { e.target.style.borderColor = '#fff'; e.target.style.color = '#fff'; }}
          onMouseOut={(e) => { e.target.style.borderColor = '#555'; e.target.style.color = '#888'; }}
        >
          ⬅️ Volver al Hangar
        </button>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* Rango */}
            <div style={{ background: 'rgba(0,119,255,0.15)', padding: '5px 15px', borderRadius: '10px', border: '1px solid #0077ff', color: '#0077ff', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {getRank(level)}
            </div>
            {/* Nivel */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '10px', border: '1px solid #444', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                NIVEL {level}
            </div>
            {/* Créditos */}
            <div style={{ padding: '10px 30px', background: 'rgba(0,255,204,0.1)', border: '2px solid #00ffcc', borderRadius: '40px', fontSize: '1.8rem', fontWeight: 'bold', color: '#00ffcc', boxShadow: '0 0 15px rgba(0,255,204,0.3)' }}>
              💰 {credits} Cr.
            </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', width: '1000px', maxHeight: '75vh' }}>
        
        {/* Left: Ship View & Config */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <img src={selectedShip.image} alt={selectedShip.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            <h2 style={{ margin: 0, color: selectedShip.color }}>{selectedShip.name}</h2>
          </div>

          <div style={{ padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <SlotDisplay label="Lásers" count={selectedShip.slots.lasers} icon="🎯" color="#ffcc00" equipped={currentEquipped.filter(m => m.type === 'lasers')} />
              <SlotDisplay label="Escudos" count={selectedShip.slots.shields} icon="🛡️" color="#00c8ff" equipped={currentEquipped.filter(m => m.type === 'shields')} />
              <SlotDisplay label="Motores" count={selectedShip.slots.engines} icon="🚀" color="#ff3366" equipped={currentEquipped.filter(m => m.type === 'engines')} />
              <SlotDisplay label="Utilidad" count={selectedShip.slots.utility} icon="⚛️" color="#9933ff" equipped={currentEquipped.filter(m => m.type === 'utility')} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <StatRow label="❤️ HP" color="#ff3366" value={selectedShip.hp} bonus={currentEquipped.reduce((acc, m) => acc + (m.hp || 0), 0)} permanent={0} />
            <StatRow label="🛡️ SHLD" color="#00c8ff" value={selectedShip.shld} bonus={currentEquipped.reduce((acc, m) => acc + (m.shld || 0), 0)} permanent={upgrades.shld} />
            <StatRow label="💥 ATK" color="#ffcc00" value={selectedShip.atk} bonus={currentEquipped.reduce((acc, m) => acc + (m.atk || 0), 0)} permanent={upgrades.atk} />
            <StatRow label="⚡ SPD" color="#00ccff" value={selectedShip.spd} bonus={currentEquipped.reduce((acc, m) => acc + (m.spd || 0), 0)} permanent={upgrades.spd} />
          </div>
        </div>

        {/* Right: Module & Ammo Catalog */}
        <div style={{ flex: 1.5, background: 'rgba(0,0,0,0.4)', borderRadius: '15px', border: '1px solid #333', overflowY: 'auto' }}>
          
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#888', fontSize: '1rem', borderBottom: '1px solid #222', paddingBottom: '5px' }}>MÓDULOS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '30px' }}>
                {MODULES_CATALOG.map(item => {
                const canAfford = credits >= item.cost;
                return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                        <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#00ffcc' }}>{item.atk ? `+${item.atk} ATK ` : ''}{item.hp ? `+${item.hp} HP ` : ''}{item.spd ? `+${item.spd} SPD ` : ''}{item.eng ? `+${item.eng} ENG` : ''}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleBuyModule(item)}
                        disabled={!canAfford}
                        style={{ padding: '6px 15px', borderRadius: '15px', border: 'none', background: canAfford ? '#0077ff' : '#222', color: canAfford ? '#fff' : '#555', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                        {item.cost} Cr.
                    </button>
                    </div>
                );
                })}
            </div>

            <h3 style={{ margin: '0 0 15px 0', color: '#888', fontSize: '1rem', borderBottom: '1px solid #222', paddingBottom: '5px' }}>MUNICIÓN</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {AMMO_CATALOG.filter(a => a.id !== 'standard').map(item => {
                const canAfford = credits >= item.cost;
                return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', color: item.color }}>{item.icon}</span>
                        <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name} ({item.count} disparos)</div>
                        <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                            {item.damage > 1 && `Daño x${item.damage} `}
                            {item.effect === 'shield_steal' && '¡Roba escudos!' }
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>En posesión: <span style={{ color: '#00ffcc' }}>{ammo[item.id] || 0}</span></div>
                        </div>
                    </div>
                    <button 
                        onClick={() => onBuyAmmo(item.id, item.count, item.cost)}
                        disabled={!canAfford}
                        style={{ padding: '6px 15px', borderRadius: '15px', border: 'none', background: canAfford ? '#00cc66' : '#222', color: canAfford ? '#fff' : '#555', cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                        {item.cost} Cr.
                    </button>
                    </div>
                );
                })}
            </div>

            <h3 style={{ margin: '30px 0 15px 0', color: '#ffcc00', fontSize: '1rem', borderBottom: '1px solid #222', paddingBottom: '5px' }}>VENDER MINERALES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {MINERAL_TYPES.map(item => {
                const amountOwned = minerals[item.id] || 0;
                return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,150,0,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid #ffcc0022' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                        <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: item.color }}>{item.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Precio venta: <span style={{ color: '#00ffcc' }}>{item.sellPrice} Cr./u</span></div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>En bodega: <span style={{ color: '#fff' }}>{amountOwned} u.</span></div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => onSellMinerals(item.id, 1, item.sellPrice)}
                            disabled={amountOwned < 1}
                            style={{ padding: '6px 10px', borderRadius: '5px', border: 'none', background: amountOwned >= 1 ? '#444' : '#222', color: '#fff', cursor: amountOwned >= 1 ? 'pointer' : 'not-allowed', fontSize: '0.7rem' }}
                        >
                            Vender 1
                        </button>
                        <button 
                            onClick={() => onSellMinerals(item.id, amountOwned, amountOwned * item.sellPrice)}
                            disabled={amountOwned < 1}
                            style={{ padding: '6px 15px', borderRadius: '5px', border: 'none', background: amountOwned >= 1 ? '#d4af37' : '#222', color: '#000', cursor: amountOwned >= 1 ? 'pointer' : 'not-allowed', fontSize: '0.7rem', fontWeight: 'bold' }}
                        >
                            Vender Todo ({amountOwned * item.sellPrice} Cr.)
                        </button>
                    </div>
                    </div>
                );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
