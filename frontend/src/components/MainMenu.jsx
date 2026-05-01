import React, { useState, useEffect } from 'react';
import { SHIPS, getRank, DESIGNS_CATALOG } from '../utils/gameData';
import NavigationBar from './NavigationBar';

const MainMenu = ({ user, onNavigate, onLogout, credits, paladio, xp, level, minerals, selectedShipId, equippedByShip, upgrades, isGameActive, leaderboard = [], equippedDesign }) => {
  const selectedShip = SHIPS.find(s => s.id === selectedShipId) || SHIPS[0];
  const currentEquipped = equippedByShip[selectedShipId] || [];
  
  // Get top 10 for the quick view
  const TOP_PILOTS = leaderboard.slice(0, 10);

  // Get active design info
  const activeDesign = DESIGNS_CATALOG.find(d => d.id === equippedDesign);
  const shipImage = activeDesign ? activeDesign.image : (selectedShip.ui_image || selectedShip.image);
  const shipDisplayName = activeDesign ? activeDesign.name : selectedShip.name;

  // Calculate Ship Stats including Bonuses (Base + Modules + Lab Upgrades)
  const baseHp = selectedShip.hp + currentEquipped.reduce((acc, m) => acc + (m.hp || 0), 0) + (upgrades.hp || []).reduce((acc, u) => acc + (u.amount || 0), 0);
  const baseShld = selectedShip.shld + currentEquipped.reduce((acc, m) => acc + (m.shld || 0), 0) + (upgrades.shld || []).reduce((acc, u) => acc + (u.amount || 0), 0);
  const baseAtk = selectedShip.atk + currentEquipped.reduce((acc, m) => acc + (m.atk || 0), 0) + (upgrades.atk || []).reduce((acc, u) => acc + (u.amount || 0), 0);
  const baseSpd = selectedShip.spd + currentEquipped.reduce((acc, m) => acc + (m.spd || 0), 0) + (upgrades.spd || []).reduce((acc, u) => acc + (u.amount || 0), 0);

  const shipStats = {
    hp: activeDesign?.bonus?.hp ? Math.floor(baseHp * (1 + activeDesign.bonus.hp)) : baseHp,
    shld: activeDesign?.bonus?.shld ? Math.floor(baseShld * (1 + activeDesign.bonus.shld)) : baseShld,
    atk: activeDesign?.bonus?.dmg ? Math.floor(baseAtk * (1 + activeDesign.bonus.dmg)) : (activeDesign?.bonus?.atk ? Math.floor(baseAtk * (1 + activeDesign.bonus.atk)) : baseAtk),
    spd: activeDesign?.bonus?.spd ? Math.floor(baseSpd * (1 + activeDesign.bonus.spd)) : baseSpd,
    cargo: Object.values(minerals).reduce((a,b)=>a+b,0),
    maxCargo: selectedShip.cargo_capacity
  };

  const totalMinerals = minerals.titanium + minerals.plutonium + minerals.silicon;

  const handleLaunchGame = () => {
    if (isGameActive) return;
    window.open(window.location.origin + window.location.pathname + '?play=true', '_blank');
  };

  const [announcements, setAnnouncements] = useState([]);
  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const resp = await fetch(`${API_URL}/announcements`);
        if (resp.ok) {
          const data = await resp.json();
          setAnnouncements(data.announcements || []);
        }
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };
    fetchAnnouncements();
  }, []);

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="dashboard-container">
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
                  <div className="pilot-name" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {user ? user.username : 'PILOTO_ESTELAR'}
                    {user?.vip_until && new Date(user.vip_until) > new Date() ? (
                      <span style={{
                        background: 'linear-gradient(45deg, #ffcc00, #ffaa00)',
                        color: '#000',
                        fontSize: '0.6rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '900',
                        boxShadow: '0 0 10px rgba(255,204,0,0.6)'
                      }}>VIP</span>
                    ) : (
                      <span style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: '#aaa',
                        fontSize: '0.6rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        border: '1px solid #444'
                      }}>FREE</span>
                    )}
                  </div>
                  <div className="pilot-rank">{getRank(level)}</div>
                  <div style={{ color: user?.faction === 'MARS' ? '#ff3333' : user?.faction === 'MOON' ? '#33ccff' : '#cc33ff', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>
                    {user?.faction || 'Sin Empresa'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Progreso de Nivel</span>
                <span style={{ color: '#00ffcc' }}>{xp} XP</span>
              </div>
              <div className="xp-bar-container">
                <div className="xp-bar-fill" style={{ width: `${Math.min(100, (xp / (level * 1000 + 1000)) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="dashboard-panel" style={{ flex: 1 }}>
            <div className="panel-header">CLASIFICACIÓN GLOBAL</div>
            <div className="panel-content" style={{ padding: '0' }}>
              {TOP_PILOTS.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '0.8rem' }}>Cargando datos de inteligencia...</div>
              ) : (
                TOP_PILOTS.map((p, i) => (
                  <div key={i} className="leaderboard-item" style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: i < 3 ? '#ffcc00' : '#555', width: '20px' }}>{p.rank}</span>
                      <span className="leaderboard-name">{p.username}</span>
                    </div>
                    <span className="leaderboard-level">{p.xp.toLocaleString()} XP</span>
                  </div>
                ))
              )}
              <div style={{ padding: '15px', textAlign: 'center' }}>
                <button 
                  onClick={() => onNavigate('ranking')}
                  style={{ background: 'none', border: '1px solid #334466', color: '#88aaff', padding: '5px 15px', fontSize: '0.7rem', cursor: 'pointer', borderRadius: '4px' }}
                >
                  VER SALÓN DE LA FAMA
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: SHIP PREVIEW & LAUNCH */}
        <section className="dashboard-center" style={{ position: 'relative' }}>
          <div 
            className="ship-preview-box" 
            onMouseMove={handleMouseMove}
            style={{ 
              filter: isGameActive ? 'grayscale(0.8) brightness(0.5)' : 'none', 
              transition: 'all 0.5s ease',
              background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(0, 255, 204, 0.15), transparent 60%), #050810`
            }}
          >
             <div style={{ position: 'absolute', top: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '3px', opacity: isGameActive ? 0.3 : 1, zIndex: 10, textAlign: 'center', width: '100%', padding: '0 20px' }}>
               {shipDisplayName}
             </div>
             
             <img 
               src={shipImage} 
               alt={shipDisplayName} 
               style={{ 
                 opacity: isGameActive ? 0.4 : 1,
                 maxWidth: '90%',
                 maxHeight: '70%',
                 filter: `drop-shadow(0 0 30px rgba(0, 255, 204, 0.2)) brightness(${1 + (100 - mousePos.y)/200})`,
                 transform: `perspective(1000px) rotateY(${(mousePos.x - 50) / 4}deg) rotateX(${(50 - mousePos.y) / 4}deg)`
               }} 
             />
             
             {/* Scanning Line Overlay for flavor */}
             <div className="scanline-overlay"></div>

             {/* Stats Overlay */}
             {!isGameActive && (
               <div style={{ 
                 position: 'absolute', 
                 right: '20px', 
                 top: '50%', 
                 transform: 'translateY(-50%)',
                 background: 'rgba(10, 15, 26, 0.7)',
                 padding: '15px',
                 borderRadius: '8px',
                 border: '1px solid rgba(0, 255, 204, 0.2)',
                 backdropFilter: 'blur(5px)',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '10px',
                 zIndex: 10,
                 minWidth: '150px'
               }}>
                 <div style={{ color: '#88aaff', fontSize: '0.65rem', fontWeight: 'bold', borderBottom: '1px solid #334466', paddingBottom: '5px', marginBottom: '5px' }}>ESPECIFICACIONES NAVE</div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: '0.6rem', color: '#888' }}>CASCO</span>
                   <span style={{ color: '#ff4466', fontWeight: 'bold', fontSize: '0.9rem' }}>
                     {shipStats.hp.toLocaleString()}
                     {activeDesign?.bonus?.hp && <span style={{ color: '#00ffcc', fontSize: '0.6rem', marginLeft: '4px' }}>(+{activeDesign.bonus.hp * 100}%)</span>}
                   </span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: '0.6rem', color: '#888' }}>ESCUDO</span>
                   <span style={{ color: '#00aaff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                     {shipStats.shld.toLocaleString()}
                     {activeDesign?.bonus?.shld && <span style={{ color: '#00ffcc', fontSize: '0.6rem', marginLeft: '4px' }}>(+{activeDesign.bonus.shld * 100}%)</span>}
                   </span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: '0.6rem', color: '#888' }}>ATAQUE</span>
                   <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '0.9rem' }}>
                     {shipStats.atk.toLocaleString()}
                     {(activeDesign?.bonus?.dmg || activeDesign?.bonus?.atk) && <span style={{ color: '#00ffcc', fontSize: '0.6rem', marginLeft: '4px' }}>(+{(activeDesign.bonus.dmg || activeDesign.bonus.atk) * 100}%)</span>}
                   </span>
                 </div>
               </div>
             )}
             
             <div style={{ position: 'absolute', bottom: '20px', color: isGameActive ? '#555' : '#00ffcc', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', zIndex: 10 }}>
               {isGameActive ? 'TRANSFIRIENDO CONTROL A CABINA...' : 'Estado: Sistemas al 100% | Combustible: Full'}
             </div>
          </div>

          <button 
            className={`launch-action-button ${isGameActive ? 'locked' : ''}`} 
            onClick={handleLaunchGame}
            disabled={isGameActive}
            style={{
              cursor: isGameActive ? 'not-allowed' : 'pointer',
              background: isGameActive ? 'linear-gradient(90deg, #1a1a1a, #333)' : undefined,
              boxShadow: isGameActive ? 'none' : undefined,
              borderColor: isGameActive ? '#444' : undefined,
              color: isGameActive ? '#666' : '#fff',
              position: 'relative'
            }}
          >
            {isGameActive ? '🛰️ EN ÓRBITA' : '🚀 DESPEGAR'}
          </button>
          
          {isGameActive && (
            <div style={{ 
              marginTop: '10px', 
              color: '#ffcc00', 
              fontSize: '0.7rem', 
              textAlign: 'center', 
              fontFamily: 'Orbitron',
              letterSpacing: '1px',
              animation: 'pulse 2s infinite'
            }}>
              SESIÓN ACTIVA DETECTADA. CIERRA EL JUEGO PARA REGLAJE.
            </div>
          )}

          {user && user.is_admin && (
            <button className="nav-button" onClick={() => onNavigate('admin')} style={{ marginTop: '15px', width: '100%', background: 'linear-gradient(90deg, #ff0000, #990000)', borderColor: '#ff3333', color: '#fff', textShadow: '0 0 5px #fff', fontWeight: 'bold', opacity: isGameActive ? 0.5 : 1 }}>
              🔧 PANEL DE ADMINISTRADOR
            </button>
          )}
        </section>

        {/* RIGHT COLUMN: EVENTS & NEWS */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-panel">
            <div className="panel-header">BITÁCORA DE MISIÓN</div>
            <div className="panel-content">
              <div style={{ marginBottom: '15px', borderLeft: '2px solid #00ffcc', paddingLeft: '10px' }}>
                <div style={{ color: '#00ffcc', fontSize: '0.8rem', fontWeight: 'bold' }}>ESTADO DE EXPLORACIÓN</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '5px' }}>Sistemas de navegación estables. Sin anomalías detectadas en el cuadrante actual.</div>
              </div>
              <div style={{ opacity: 0.5, fontSize: '0.75rem', textAlign: 'center', marginTop: '20px' }}>
                No hay más transmisiones encriptadas.
              </div>
            </div>
          </div>

          <div className="dashboard-panel" style={{ background: 'rgba(0,119,255,0.05)', border: '1px solid rgba(0,119,255,0.2)' }}>
            <div className="panel-header" style={{ background: 'linear-gradient(90deg, #004488, #001122)' }}>SOPORTE TÉCNICO</div>
            <div className="panel-content" style={{ fontSize: '0.8rem', color: '#88aaff', lineHeight: '1.4' }}>
              ¿Necesitas ayuda con tu equipamiento? Visita el Hangar para configurar tus láseres y escudos antes de salir al espacio.
            </div>
          </div>

          <div className="dashboard-panel" style={{ background: 'rgba(255,255,255,0.02)', borderColor: '#334466' }}>
            <div className="panel-header" style={{ background: 'linear-gradient(90deg, #1a2a44, #0a0a1a)' }}>📢 COMUNICADOS DE COMANDANCIA</div>
            <div className="panel-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {announcements.length === 0 ? (
                <div style={{ opacity: 0.5, fontSize: '0.75rem', textAlign: 'center', padding: '20px' }}>
                  No hay transmisiones entrantes de la comandancia.
                </div>
              ) : (
                announcements.map(a => (
                  <div key={a.id} style={{ 
                    marginBottom: '15px', 
                    borderLeft: `2px solid ${a.type === 'critical' ? '#ff3333' : a.type === 'warning' ? '#ffcc00' : a.type === 'event' ? '#00ffcc' : '#00aaff'}`, 
                    paddingLeft: '10px' 
                  }}>
                    <div style={{ 
                      color: a.type === 'critical' ? '#ff3333' : a.type === 'warning' ? '#ffcc00' : a.type === 'event' ? '#00ffcc' : '#00aaff', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {a.type === 'event' ? 'EVENTO' : a.type === 'warning' ? 'ALERTA' : a.type === 'critical' ? 'CRÍTICO' : 'AVISO'}: {a.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#ddd', marginTop: '5px', lineHeight: '1.4' }}>{a.content}</div>
                  </div>
                ))
              )}
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
