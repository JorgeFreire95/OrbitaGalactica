import React, { useState, useEffect } from 'react';
import { getRank } from '../utils/gameData';

const Ranking = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('global'); // global, mars, moon, pluto, clans
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchRanking();
  }, [activeTab]);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/leaderboard`;
      if (activeTab === 'clans') {
        url = `${API_URL}/clans/ranking`;
      } else if (activeTab !== 'global') {
        url = `${API_URL}/leaderboard?faction=${activeTab.toUpperCase()}`;
      }

      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        setData(json.leaderboard || json.ranking || []);
      }
    } catch (e) {
      console.error("Error fetching ranking:", e);
    } finally {
      setLoading(false);
    }
  };

  const getFactionColor = (faction) => {
      if (faction === 'MARS') return '#ff3333';
      if (faction === 'MOON') return '#00ffcc';
      if (faction === 'PLUTO') return '#aa00ff';
      return '#fff';
  };

  const getFactionName = (faction) => {
      if (faction === 'MARS') return 'M.A.R.S.';
      if (faction === 'MOON') return 'M.O.O.N.';
      if (faction === 'PLUTO') return 'P.L.U.T.O.';
      return 'Multifacción';
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-body" style={{ gridTemplateColumns: '1fr' }}>
        <section className="dashboard-panel" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                    { id: 'global', label: 'GLOBAL' },
                    { id: 'mars', label: 'MARS' },
                    { id: 'moon', label: 'MOON' },
                    { id: 'pluto', label: 'PLUTO' },
                    { id: 'clans', label: 'CLANES' }
                ].map(tab => (
                    <span 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        style={{ 
                            cursor: 'pointer', 
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            padding: '5px 10px',
                            color: activeTab === tab.id ? '#00ffcc' : '#444', 
                            borderBottom: activeTab === tab.id ? '2px solid #00ffcc' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </span>
                ))}
            </div>
            <button onClick={onBack} className="btn-link" style={{ fontSize: '0.8rem' }}>VOLVER AL MENÚ</button>
          </div>
          
          <div className="panel-content" style={{ padding: '0' }}>
            <div className="leaderboard-header" style={{ 
              display: 'grid', 
              gridTemplateColumns: activeTab === 'clans' ? '80px 1fr 200px' : '80px 1fr 100px 120px 150px', 
              padding: '15px 20px', 
              borderBottom: '1px solid #334466',
              fontWeight: 'bold',
              color: '#00ffcc',
              fontSize: '0.8rem',
              textTransform: 'uppercase'
            }}>
              <span>RANGO</span>
              <span>{activeTab === 'clans' ? 'ALIANZA' : 'PILOTO'}</span>
              {activeTab !== 'clans' && <span>EMPRESA</span>}
              {activeTab !== 'clans' && <span>NIVEL</span>}
              <span style={{ textAlign: 'right' }}>EXPERIENCIA</span>
            </div>
            
            <div className="ranking-list-scroll" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {loading ? (
                  <div style={{ padding: '50px', textAlign: 'center', color: '#00ffcc', fontFamily: 'Orbitron' }}>
                      <div className="loading-spinner" style={{ marginBottom: '15px' }}></div>
                      ACCEDIENDO A LOS ARCHIVOS CENTRALES...
                  </div>
              ) : data.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
                  No se han encontrado registros en este sector de la galaxia...
                </div>
              ) : (
                data.map((item, index) => (
                  <div key={index} className="leaderboard-row" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: activeTab === 'clans' ? '80px 1fr 200px' : '80px 1fr 100px 120px 150px', 
                    padding: '12px 20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: index === 0 ? 'rgba(0,255,204,0.05)' : 'transparent',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}>
                    <span style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold', 
                      color: index === 0 ? '#ffcc00' : index === 1 ? '#e5e4e2' : index === 2 ? '#cd7f32' : '#555' 
                    }}>
                      #{item.rank}
                    </span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>
                          {activeTab === 'clans' ? `[${item.tag}] ${item.name}` : item.username}
                      </span>
                      {activeTab !== 'clans' && <span style={{ fontSize: '0.7rem', color: '#888' }}>{getRank(item.level)}</span>}
                    </div>

                    {activeTab !== 'clans' && (
                        <span style={{ color: getFactionColor(item.faction), fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {getFactionName(item.faction)}
                        </span>
                    )}

                    {activeTab !== 'clans' && <span style={{ color: '#aaa' }}>Nivel {item.level}</span>}
                    
                    <span style={{ textAlign: 'right', fontWeight: 'bold', color: '#00ffcc', fontFamily: 'monospace' }}>
                      {item.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid #334466', textAlign: 'center', color: '#555', fontSize: '0.8rem' }}>
              {activeTab === 'clans' 
                ? 'Las alianzas suben de rango mediante la contribución de experiencia (5%) de sus miembros.'
                : `Clasificación ${activeTab === 'global' ? 'global de todos los pilotos' : `de los mejores pilotos de ${activeTab.toUpperCase()}`}.`}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Ranking;
