import React from 'react';
import NavigationBar from './NavigationBar';

const Laboratory = ({ minerals, upgrades, onRefine, onSellMinerals, onBack, onNavigate, selectedShip, credits, paladio, level }) => {
  const currentCargo = Object.values(minerals).reduce((a, b) => a + b, 0);
  const maxCargo = selectedShip?.cargo_capacity || 50;

  const mineralTypes = [
    { id: 'plutonium', name: 'Plutonio', stat: 'atk', icon: '🏮', color: '#ff3333', amount: 50, bonus: 5, desc: 'Aumenta el daño base de todos tus láseres' },
    { id: 'titanium',  name: 'Titanio',  stat: 'shld', icon: '💎', color: '#00c8ff', amount: 50, bonus: 10, desc: 'Refuerza la capacidad máxima de tus escudos' },
    { id: 'silicon',   name: 'Silicio',   stat: 'spd',  icon: '💾', color: '#00ffcc', amount: 50, bonus: 8, desc: 'Mejora la propulsión y velocidad de maniobra' },
    { id: 'iridium',   name: 'Iridio',    stat: 'hp',   icon: '🧲', color: '#ff4466', amount: 50, bonus: 15, desc: 'Aumenta la integridad estructural de tu casco (Vida)' },
  ];

  return (
    <div className="lab-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '30px', flex: 1, padding: '20px' }}>
        {/* Left: Storage Status */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '30px', border: '1px solid #333' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#888', marginBottom: '20px' }}>ESTADO DE LA BODEGA</h2>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '15px', border: '1px solid #444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Carga Total</span>
              <span>{currentCargo} / {maxCargo}</span>
            </div>
            <div style={{ width: '100%', height: '15px', background: '#222', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(100, (currentCargo / maxCargo) * 100)}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #00ffcc, #0077ff)',
                boxShadow: '0 0 10px #00ffcc'
              }} />
            </div>
          </div>
          
          <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0,255,204,0.05)', borderRadius: '15px', border: '1px solid #00ffcc33' }}>
            <h3 style={{ color: '#00ffcc', fontSize: '1rem' }}>SISTEMA DE REFINAMIENTO</h3>
            <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: '1.5' }}>
              Utiliza minerales para aplicar mejoras tácticas de 2 horas. 
              Cada refinamiento añade un bono temporal acumulable.
            </p>
          </div>
        </div>

        {/* Right: Mineral Processing */}
        <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr', gap: '20px', overflowY: 'auto' }}>
          {mineralTypes.map(min => {
            const activeStacks = upgrades[min.stat] || [];
            const totalBonus = activeStacks.reduce((sum, stack) => sum + stack.amount, 0);
            
            // Encontrar la expiración más próxima
            const now = Date.now();
            const nextExpiry = activeStacks.length > 0 
              ? Math.min(...activeStacks.map(s => s.expires))
              : null;
            
            const minutesLeft = nextExpiry 
              ? Math.max(0, Math.ceil((nextExpiry - now) / 60000))
              : 0;

            return (
              <div key={min.id} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '20px', 
                padding: '25px', 
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                gap: '25px'
              }}>
                <div style={{ fontSize: '4rem', background: 'rgba(0,0,0,0.3)', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', border: `1px solid ${min.color}44` }}>
                  {min.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ margin: 0, color: min.color, fontSize: '1.5rem' }}>{min.name}</h3>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem' }}>Disponibles: <b>{minerals[min.id] || 0}</b></div>
                      {totalBonus > 0 && (
                        <div style={{ color: min.color, fontSize: '0.8rem', fontWeight: 'bold' }}>
                          BONO TOTAL ACUMULADO: +{totalBonus}
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ color: '#666', margin: '5px 0 15px 0' }}>{min.desc}</p>
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: '4px', background: '#222', borderRadius: '2px' }}>
                      <div style={{ width: `${Math.min(100, (minerals[min.id] / min.amount) * 100)}%`, height: '100%', background: min.color }} />
                    </div>
                    <button 
                      onClick={() => onRefine(min.id, min.amount, min.stat, min.bonus)}
                      disabled={minerals[min.id] < min.amount}
                      style={{ 
                        padding: '12px 25px', 
                        background: minerals[min.id] >= min.amount ? min.color : '#1a1a1a', 
                        color: minerals[min.id] >= min.amount ? 'black' : '#444',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: minerals[min.id] >= min.amount ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        transition: 'all 0.3s',
                        minWidth: '200px'
                      }}
                    >
                      REFINAR {min.amount} (+{min.bonus} {min.stat.toUpperCase()})
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>BONUS ACTIVO</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: min.color }}>+{totalBonus}</div>
                  {minutesLeft > 0 && (
                    <div style={{ fontSize: '0.65rem', color: '#ffcc00', marginTop: '5px' }}>
                      EXPIRA EN: {minutesLeft} min
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Laboratory;
