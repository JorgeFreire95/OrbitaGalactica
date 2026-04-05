import React from 'react';
import { SHIPS, getRank } from '../utils/gameData';
import NavigationBar from './NavigationBar';

const MainMenu = ({ onNavigate, credits, uridium, xp, level, minerals, selectedShipId, equippedByShip, upgrades }) => {
  const selectedShip = SHIPS.find(s => s.id === selectedShipId) || SHIPS[0];
  const currentEquipped = equippedByShip[selectedShipId] || [];
  
  // Calculate Ship Stats including Bonuses
  const shipStats = {
    hp: selectedShip.hp + currentEquipped.reduce((acc, m) => acc + (m.hp || 0), 0),
    shld: selectedShip.shld + currentEquipped.reduce((acc, m) => acc + (m.shld || 0), 0) + upgrades.shld,
    atk: selectedShip.atk + currentEquipped.reduce((acc, m) => acc + (m.atk || 0), 0) + upgrades.atk,
    spd: selectedShip.spd + currentEquipped.reduce((acc, m) => acc + (m.spd || 0), 0) + upgrades.spd,
    cargo: Object.values(minerals).reduce((a,b)=>a+b,0),
    maxCargo: selectedShip.cargo_capacity
  };

  const totalMinerals = minerals.titanium + minerals.plutonium + minerals.silicon;

  const handleLaunchGame = () => {
    window.open(window.location.origin + window.location.pathname + '?play=true', '_blank');
  };

  // Mock Leaderboard Data
  const TOP_PILOTS = [
    { name: '-=Σиκi=-', rank: 1, level: 42, score: '2.506.932.185' },
    { name: 'Иαтε Đíαʑツ', rank: 2, level: 38, score: '1.973.381.430' },
    { name: 'Molusco', rank: 4, level: 35, score: '1.599.097.737' },
    { name: 'ΔDONG-*300*Δ', rank: 5, level: 32, score: '1.598.652.270' },
  ];

  return (
    <div className="dashboard-container">
      {/* HEADER: PLAYER DATA (CLEAN VERSION) */}
      <header className="dashboard-header" style={{ justifyContent: 'flex-end', padding: '10px 30px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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
          <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>⚙️</button>
          <button style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>❓</button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <NavigationBar currentView="menu" onNavigate={onNavigate} />

      {/* MAIN CONTENT AREA */}
      <main className="dashboard-body">
        
        {/* LEFT COLUMN: PILOT INFO & LEADERBOARD */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-panel" style={{ flex: '0 0 auto' }}>
            <div className="panel-header">CARNÉ DE PILOTO</div>
            <div className="panel-content">
              <div className="pilot-profile">
                <div className="pilot-avatar">👨‍🚀</div>
                <div className="pilot-stats">
                  <div className="pilot-name">PILOTO_ESTELAR</div>
                  <div className="pilot-rank">{getRank(level)}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Progreso de Nivel</span>
                <span style={{ color: '#00ffcc' }}>{xp} XP</span>
              </div>
              <div className="xp-bar-container">
                <div className="xp-bar-fill" style={{ width: `${Math.min(100, (xp / (level * 1000)) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="dashboard-panel" style={{ flex: 1 }}>
            <div className="panel-header">CLASIFICACIÓN GLOBAL</div>
            <div className="panel-content" style={{ padding: '0' }}>
              {TOP_PILOTS.map((p, i) => (
                <div key={i} className="leaderboard-item" style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: i < 3 ? '#ffcc00' : '#555', width: '20px' }}>{p.rank}</span>
                    <span className="leaderboard-name">{p.name}</span>
                  </div>
                  <span className="leaderboard-level">Lvl {p.level}</span>
                </div>
              ))}
              <div style={{ padding: '15px', textAlign: 'center' }}>
                <button 
                  onClick={() => showWIP('Ranking Completo')}
                  style={{ background: 'none', border: '1px solid #334466', color: '#88aaff', padding: '5px 15px', fontSize: '0.7rem', cursor: 'pointer', borderRadius: '4px' }}
                >
                  VER SALÓN DE LA FAMA
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: SHIP PREVIEW & LAUNCH */}
        <section className="dashboard-center">
          <div className="ship-preview-box">
             <div style={{ position: 'absolute', top: '20px', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '3px' }}>
               {selectedShip.name}
             </div>
             <img src={selectedShip.image} alt={selectedShip.name} />
             <div style={{ position: 'absolute', bottom: '20px', color: '#00ffcc', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
               Estado: Sistemas al 100% | Combustible: Full
             </div>
          </div>

          <button className="launch-action-button" onClick={handleLaunchGame}>
            🚀 DESPEGAR
          </button>
        </section>

        {/* RIGHT COLUMN: EVENTS & NEWS */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-panel">
            <div className="panel-header">BITÁCORA DE MISIÓN</div>
            <div className="panel-content">
              <div style={{ marginBottom: '15px', borderLeft: '2px solid #00ffcc', paddingLeft: '10px' }}>
                <div style={{ color: '#00ffcc', fontSize: '0.8rem', fontWeight: 'bold' }}>EVENTO: LLUVIA DE TITANIO</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '5px' }}>Los asteroides del sector Gamma-4 están soltando el doble de materiales.</div>
              </div>
              <div style={{ marginBottom: '15px', borderLeft: '2px solid #ffcc00', paddingLeft: '10px' }}>
                <div style={{ color: '#ffcc00', fontSize: '0.8rem', fontWeight: 'bold' }}>NIVEL DE AMENAZA: ALTA</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '5px' }}>Avistamientos de naves Boss en el sistema central. ¡Ten cuidado!</div>
              </div>
              <div style={{ opacity: 0.5, fontSize: '0.75rem', textAlign: 'center', marginTop: '20px' }}>
                No hay más mensajes encriptados.
              </div>
            </div>
          </div>

          <div className="dashboard-panel" style={{ background: 'rgba(0,119,255,0.05)', border: '1px solid rgba(0,119,255,0.2)' }}>
            <div className="panel-header" style={{ background: 'linear-gradient(90deg, #004488, #001122)' }}>SOPORTE TÉCNICO</div>
            <div className="panel-content" style={{ fontSize: '0.8rem', color: '#88aaff', lineHeight: '1.4' }}>
              ¿Necesitas ayuda con tu equipamiento? Visita el Hangar para configurar tus láseres y escudos antes de salir al espacio.
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <div>PROYECTO ÓRBITA GALÁCTICA v2.5 | COMANDANCIA ESTELAR</div>
        <div>SERVIDOR: ONLINE | LATENCIA: 14ms | JORGEFREIRE95</div>
      </footer>
    </div>
  );
};

export default MainMenu;
