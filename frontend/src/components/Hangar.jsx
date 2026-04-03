import React from 'react';
import { SHIPS } from '../utils/gameData';
import { SlotDisplay, StatRow } from './ShipComponents';

export default function Hangar({ 
  selectedShipId, 
  setSelectedShipId, 
  equippedByShip, 
  inventory,
  onEquip,
  onUnequip,
  onGoToShop, 
  onJoinGame,
  onReset,
  ammo 
}) {
  const selectedShip = SHIPS.find(s => s.id === selectedShipId);
  const currentEquipped = equippedByShip[selectedShipId] || [];

  return (
    <div className="hangar-container" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0d0d1a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Header Panel */}
      <div style={{ width: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
            <h1 className="game-title" style={{ fontSize: '3rem', margin: 0 }}>HANGAR ESTELAR</h1>
            <div style={{ display: 'flex', gap: '15px', color: '#888', fontSize: '0.8rem' }}>
                <span>⚪ {ammo.standard > 1000 ? '∞' : ammo.standard}</span>
                <span style={{ color: ammo.thermal > 0 ? '#ff6600' : '#444' }}>🔥 {ammo.thermal}</span>
                <span style={{ color: ammo.plasma > 0 ? '#ff33ff' : '#444' }}>🔷 {ammo.plasma}</span>
                <span style={{ color: ammo.siphon > 0 ? '#33ff33' : '#444' }}>🔋 {ammo.siphon}</span>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
             <button 
                onClick={onGoToShop}
                style={{ padding: '12px 25px', background: 'rgba(0,255,204,0.1)', border: '2px solid #00ffcc', color: '#00ffcc', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.3s' }}
                onMouseOver={(e) => { e.target.style.background = '#00ffcc'; e.target.style.color = 'black'; e.target.style.boxShadow = '0 0 15px #00ffcc'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#00ffcc'; e.target.style.boxShadow = 'none'; }}
            >
                🛒 Ir a la Tienda
            </button>
            <button 
                onClick={onReset}
                style={{ background: 'transparent', border: '1px solid #444', color: '#555', borderRadius: '30px', padding: '0 15px', cursor: 'pointer' }}
            >
                Reset
            </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', width: '1100px', height: '65vh' }}>
        
        {/* Left Panel: ALMACÉN (Warehouse) */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '15px', background: '#1a1a2e', borderBottom: '1px solid #333', textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#888' }}>📦 ALMACÉN</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', alignContent: 'start' }}>
                {inventory.length === 0 && <p style={{ gridColumn: 'span 4', textAlign: 'center', color: '#444', marginTop: '50px' }}>Tu almacén está vacío. Ve a la tienda para comprar módulos.</p>}
                {inventory.map((item, index) => (
                    <div 
                        key={item.instanceId} 
                        onClick={() => onEquip(index, selectedShipId)}
                        title={`Haz clic para equipar: ${item.name}`}
                        style={{ 
                            aspectRatio: '1/1', 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '8px', 
                            border: '1px solid #222', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#00ffcc'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        {item.icon}
                    </div>
                ))}
            </div>
        </div>

        {/* Center: Selected Ship & Selection Row */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {SHIPS.map(ship => (
                <div 
                    key={ship.id}
                    onClick={() => setSelectedShipId(ship.id)}
                    style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${selectedShipId === ship.id ? ship.color : '#333'}`,
                    backgroundColor: selectedShipId === ship.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    cursor: 'pointer',
                    width: '80px',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                    }}
                >
                    <img src={ship.image} alt={ship.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                ))}
            </div>

            <div style={{ flex: 1, backgroundColor: '#1a1a2e', padding: '30px', borderRadius: '15px', display: 'flex', gap: '40px', border: '1px solid #333', position: 'relative' }}>
                {/* Preview Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedShip.image ? (
                        <img src={selectedShip.image} alt={selectedShip.name} style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: 0, height: 0, borderLeft: '60px solid transparent', borderRight: '60px solid transparent', borderBottom: `120px solid ${selectedShip.color}` }}></div>
                    )}
                    <h3 style={{ margin: '15px 0 0 0', fontSize: '1.8rem', color: selectedShip.color }}>{selectedShip.name}</h3>
                    <p style={{ marginTop: '10px', color: '#666', textAlign: 'center', fontSize: '0.8rem' }}>{selectedShip.desc}</p>
                </div>

                {/* Stats & Config Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '15px', border: `1px solid ${selectedShip.color}22` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                            <SlotDisplay label="Lásers" count={selectedShip.slots.lasers} icon="🎯" color="#ffcc00" equipped={currentEquipped.filter(m => m.type === 'lasers')} onUnequip={(id) => onUnequip(id, selectedShipId)} />
                            <SlotDisplay label="Escudos" count={selectedShip.slots.shields} icon="🛡️" color="#00c8ff" equipped={currentEquipped.filter(m => m.type === 'shields')} onUnequip={(id) => onUnequip(id, selectedShipId)} />
                            <SlotDisplay label="Motores" count={selectedShip.slots.engines} icon="🚀" color="#ff3366" equipped={currentEquipped.filter(m => m.type === 'engines')} onUnequip={(id) => onUnequip(id, selectedShipId)} />
                            <SlotDisplay label="Utilidad" count={selectedShip.slots.utility} icon="⚛️" color="#9933ff" equipped={currentEquipped.filter(m => m.type === 'utility')} onUnequip={(id) => onUnequip(id, selectedShipId)} />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <StatRow label="❤️ HP" color="#ff3366" value={selectedShip.hp} bonus={currentEquipped.reduce((acc, m) => acc + (m.hp || 0), 0)} />
                        <StatRow label="🛡️ SHLD" color="#00c8ff" value={selectedShip.shld} bonus={currentEquipped.reduce((acc, m) => acc + (m.shld || 0), 0)} />
                        <StatRow label="💥 ATK" color="#ffcc00" value={selectedShip.atk} bonus={currentEquipped.reduce((acc, m) => acc + (m.atk || 0), 0)} />
                        <StatRow label="⚡ SPD" color="#00ccff" value={selectedShip.spd} bonus={currentEquipped.reduce((acc, m) => acc + (m.spd || 0), 0)} />
                        <StatRow label="🔋 ENG" color="#33ff33" value={selectedShip.eng} bonus={currentEquipped.reduce((acc, m) => acc + (m.eng || 0), 0)} />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <button 
          style={{ padding: '18px 80px', fontSize: '1.6rem', background: selectedShip.color, color: 'black', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: `0 10px 30px ${selectedShip.color}44`, transition: 'all 0.3s' }}
          onClick={onJoinGame}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 15px 40px ${selectedShip.color}66`; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 10px 30px ${selectedShip.color}44`; }}
        >
          DESPEGAR AL ESPACIO
        </button>
      </div>
    </div>
  );
}
