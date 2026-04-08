import React from 'react';
import { getRank } from '../utils/gameData';

const Ranking = ({ leaderboard, onBack }) => {
  return (
    <div className="dashboard-container">
      <main className="dashboard-body" style={{ gridTemplateColumns: '1fr' }}>
        <section className="dashboard-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SALÓN DE LA FAMA - CLASIFICACIÓN GLOBAL</span>
            <button onClick={onBack} className="btn-link" style={{ fontSize: '0.8rem' }}>VOLVER AL MENÚ</button>
          </div>
          
          <div className="panel-content" style={{ padding: '0' }}>
            <div className="leaderboard-header" style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 1fr 120px 150px', 
              padding: '15px 20px', 
              borderBottom: '1px solid #334466',
              fontWeight: 'bold',
              color: '#00ffcc',
              fontSize: '0.9rem',
              textTransform: 'uppercase'
            }}>
              <span>RANGO</span>
              <span>PILOTO</span>
              <span>NIVEL</span>
              <span style={{ textAlign: 'right' }}>EXPERIENCIA</span>
            </div>
            
            <div className="ranking-list-scroll" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {leaderboard.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No hay datos disponibles en los servicios de inteligencia...
                </div>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={index} className="leaderboard-row" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px 1fr 120px 150px', 
                    padding: '12px 20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: index === 0 ? 'rgba(255,204,0,0.05)' : 'transparent',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold', 
                      color: index === 0 ? '#ffcc00' : index === 1 ? '#e5e4e2' : index === 2 ? '#cd7f32' : '#555' 
                    }}>
                      #{player.rank}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', color: '#fff' }}>{player.username}</span>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>{getRank(player.level)}</span>
                    </div>
                    <span style={{ color: '#aaa' }}>Nivel {player.level}</span>
                    <span style={{ textAlign: 'right', fontWeight: 'bold', color: '#00ffcc', fontFamily: 'monospace' }}>
                      {player.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid #334466', textAlign: 'center', color: '#555', fontSize: '0.8rem' }}>
              La clasificación se actualiza en tiempo real según el progreso de los comandantes en combate.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Ranking;
