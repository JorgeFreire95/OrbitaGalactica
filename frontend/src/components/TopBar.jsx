import React from 'react';

const TopBar = ({ credits, paladio, level, onlineCount, user, onLogout, onNavigate }) => {
  return (
    <header className="dashboard-header" style={{ justifyContent: 'space-between', padding: '10px 30px', height: 'auto', minHeight: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img src="/logo_og.png" alt="Logo mini" className="game-logo-topbar" />
        <span className="game-title-topbar">ÓRBITA GALÁCTICA</span>
        {user?.vip_until && new Date(user.vip_until) > new Date() && (
          <span style={{
            background: 'linear-gradient(45deg, #ffcc00, #ffaa00)',
            color: '#000',
            fontWeight: '900',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.9rem',
            marginLeft: '5px',
            boxShadow: '0 0 15px rgba(255, 204, 0, 0.8), inset 0 0 5px rgba(255,255,255,0.8)',
            textShadow: '1px 1px 0px rgba(255,255,255,0.5)',
            letterSpacing: '1px'
          }}>VIP</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* USUARIOS CONECTADOS */}
        <div className="status-item" style={{ 
          background: 'rgba(0, 255, 204, 0.05)', 
          padding: '8px 18px', 
          borderRadius: '6px', 
          border: '1px solid rgba(0, 255, 204, 0.3)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          boxShadow: '0 0 10px rgba(0, 255, 204, 0.1)'
        }}>
          <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 5px #00ffcc)' }}>📡</span>
          <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>
            {onlineCount || 0} EN LÍNEA
          </span>
        </div>
        
        {/* CRÉDITOS */}
        <div className="status-item" style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 18px', borderRadius: '6px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔋</span>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>{credits.toLocaleString()} CRÉDITOS</span>
        </div>

        {/* PALADIO */}
        <div className="status-item" style={{ background: 'rgba(20,0,50,0.6)', padding: '8px 18px', borderRadius: '6px', border: '1px solid #6633ff', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 10px rgba(102, 51, 255, 0.2)' }}>
          <span style={{ fontSize: '1.2rem' }}>🪐</span>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>{paladio.toLocaleString()} PALADIO</span>
        </div>

        {/* NIVEL */}
        <div className="status-item" style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 18px', borderRadius: '6px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🎖️</span>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>NIVEL {level}</span>
        </div>

        {/* ACCIONES */}
        <div style={{ display: 'flex', gap: '15px', marginLeft: '10px', borderLeft: '1px solid #333', paddingLeft: '20px' }}>
          {user && user.is_admin && (
            <button 
              onClick={() => onNavigate('admin')} 
              title="Administración"
              style={{ background: 'none', border: 'none', color: '#88aaff', cursor: 'pointer', fontSize: '1.4rem', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'rotate(45deg)'}
              onMouseOut={e => e.currentTarget.style.transform = 'rotate(0deg)'}
            >
              ⚙️
            </button>
          )}
          
          <button 
            onClick={onLogout} 
            title="Cerrar sesión" 
            style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', fontSize: '1.4rem', transition: 'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            🚪
          </button>
        </div>

      </div>
    </header>
  );
};

export default TopBar;
