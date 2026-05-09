import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';

const API_URL = 'http://localhost:8000/api';

export default function Missions({ user, onNavigate, credits, level, xp, paladio }) {
    const [missions, setMissions] = useState({ available: [], active: [], completed: [] });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('available'); // 'available', 'active', 'completed'
    const [subCategory, setSubCategory] = useState('aliens'); // 'aliens', 'invasion'
    const [selectedAlien, setSelectedAlien] = useState('Gryllos');
    const invasionFactions = ["MARS", "MOON", "PLUTO"].filter(f => f !== user?.faction);
    const [selectedFaction, setSelectedFaction] = useState('MARS');

    // Asegurar que la facción seleccionada no sea la propia al iniciar o cambiar de usuario
    useEffect(() => {
        if (user?.faction === selectedFaction) {
            const other = invasionFactions[0];
            if (other) setSelectedFaction(other);
        }
    }, [user, selectedFaction]);

    const alienList = ["Gryllos", "Xylos", "Nykor", "Syrith", "Vexis", "Kragos", "Zoltan", "Drakon"];

    useEffect(() => {
        fetchMissions();
    }, [user]);

    const fetchMissions = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const resp = await fetch(`${API_URL}/missions/${user.username}`);
            if (resp.ok) {
                const data = await resp.json();
                setMissions({
                    available: data.available || [],
                    active: data.active || [],
                    completed: data.completed || []
                });
            }
        } catch (e) {
            console.error("Error fetching missions:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (missionId) => {
        try {
            const resp = await fetch(`${API_URL}/missions/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, mission_id: missionId })
            });
            if (resp.ok) {
                fetchMissions();
            } else {
                const err = await resp.json();
                alert(err.detail || "No se pudo aceptar la misión");
            }
        } catch (e) {
            console.error("Error accepting mission:", e);
        }
    };

    const handleClaim = async (missionId) => {
        try {
            const resp = await fetch(`${API_URL}/missions/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, mission_id: missionId })
            });
            if (resp.ok) {
                const data = await resp.json();
                alert(`¡Recompensas reclamadas!\nXP: +${data.rewards.xp}\nCréditos: +${data.rewards.credits}\nPaladio: +${data.rewards.paladio}`);
                fetchMissions();
                // Opcional: Recargar stats globales si es necesario, 
                // aunque App.jsx debería sincronizar con el backend o el storage.
                window.location.reload(); // Forma rápida de sincronizar todo el estado
            }
        } catch (e) {
            console.error("Error claiming reward:", e);
        }
    };

    const MissionCard = ({ m, type, onAccept, onClaim }) => {
        const [isFlipped, setIsFlipped] = useState(false);
        const isCompleted = m.status === 'completed' || m.status === 'claimed';
        const isActive = m.status === 'active';
        
        return (
            <div 
                key={m.id} 
                className={`mission-card-container ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className="mission-card-inner">
                    {/* FRONT SIDE: Details */}
                    <div className={`mission-card-front ${type} ${isActive ? 'active-gradient' : ''}`}>
                        <div className="mission-header">
                            <div className="mission-title">{m.title}</div>
                        </div>
                        <div className="mission-description">{m.description}</div>
                        <div className="mission-objectives">
                            <div className="objective">
                                <span>Objetivo:</span>
                                <span className="objective-progress">{m.progress || 0} / {m.target_count}</span>
                            </div>
                            {m.map_name && (
                                <div className="objective">
                                    <span style={{ color: '#00d4ff', fontSize: '0.7rem' }}>📍 {m.map_name}</span>
                                </div>
                            )}
                            {isActive && (
                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar-fill" 
                                        style={{ width: `${Math.min(100, ((m.progress || 0) / m.target_count) * 100)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                        <div className="flip-hint">CLICK PARA VER RECOMPENSAS</div>
                    </div>

                    {/* BACK SIDE: Rewards & Action */}
                    <div className={`mission-card-back ${type}`}>
                        <div className="reward-header">RECOMPENSAS DE MISIÓN</div>
                        <div className="mission-rewards">
                            <div className="reward-item">XP: <span>{m.reward_xp}</span></div>
                            <div className="reward-item">Créditos: <span>{m.reward_credits}</span></div>
                            <div className="reward-item">Paladio: <span>{m.reward_paladio}</span></div>
                            {m.reward_ammo && Object.entries(m.reward_ammo).map(([k, v]) => (
                                <div key={k} className="reward-item ammo">
                                    {k.replace('missile_', 'M-').toUpperCase()}: <span>{v}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mission-actions" onClick={(e) => e.stopPropagation()}>
                            {type === 'available' && (
                                <button className="accept-btn" onClick={() => onAccept(m.id)}>ACEPTAR</button>
                            )}
                            {type === 'active' && isCompleted && (
                                <button className="claim-btn pulse" onClick={() => onClaim(m.id)}>COBRAR</button>
                            )}
                            {type === 'active' && !isCompleted && (
                                <button className="status-btn" disabled>EN CURSO...</button>
                            )}
                        </div>
                        <div className="flip-hint">CLICK PARA VOLVER</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="missions-view-container">
            <div className="missions-main-layout">
                <aside className="missions-sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-header">CENTRO DE CONTROL</div>
                        
                        {/* DISPONIBLES SECTION */}
                        <div className={`sidebar-item parent ${tab === 'available' && subCategory === 'aliens' ? 'active' : ''}`} 
                             onClick={() => { setTab('available'); setSubCategory('aliens'); }}>
                            <span className="icon">🛸</span> MATAR ALIENS
                        </div>
                        
                        {(tab === 'available' && subCategory === 'aliens') && (
                            <div className="sidebar-sub-items">
                                {alienList.map(alien => (
                                    <div 
                                        key={alien} 
                                        className={`sidebar-sub-item ${selectedAlien === alien ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setSelectedAlien(alien); }}
                                    >
                                        {alien.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`sidebar-item parent ${tab === 'available' && subCategory === 'invasion' ? 'active' : ''}`}
                             onClick={() => { setTab('available'); setSubCategory('invasion'); }}>
                            <span className="icon">⚔️</span> INVASIÓN
                        </div>

                        {(tab === 'available' && subCategory === 'invasion') && (
                            <div className="sidebar-sub-items">
                                {invasionFactions.map(fac => (
                                    <div 
                                        key={fac} 
                                        className={`sidebar-sub-item ${selectedFaction === fac ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setSelectedFaction(fac); }}
                                        style={{ color: fac === 'MARS' ? '#ff4444' : fac === 'MOON' ? '#00ccff' : '#cc33ff' }}
                                    >
                                        {fac}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="sidebar-divider"></div>

                        {/* STATUS SECTION */}
                        <div className={`sidebar-item ${tab === 'active' ? 'active' : ''}`}
                             onClick={() => setTab('active')}>
                            <span className="icon">🛰️</span> ACTIVAS ({missions.active?.length || 0}/2)
                        </div>

                        <div className={`sidebar-item ${tab === 'completed' ? 'active' : ''}`}
                             onClick={() => setTab('completed')}>
                            <span className="icon">📜</span> HISTORIAL
                        </div>
                    </div>
                </aside>

                <section className="missions-grid-area">
                    <header className="missions-area-header">
                        <h2>
                            {tab === 'available' 
                                ? (subCategory === 'aliens' ? `PROTOCOLO DE CAZA: ${selectedAlien.toUpperCase()}` : `OPERACIONES DE INVASIÓN: ${selectedFaction}`)
                                : (tab === 'active' ? 'SISTEMAS DE SEGUIMIENTO ACTIVO' : 'REGISTRO DE OPERACIONES FINALIZADAS')
                            }
                        </h2>
                    </header>

                    <div className="missions-scroll-content">
                        {loading ? (
                            <div className="loading-spinner">Sincronizando con el satélite de mando...</div>
                        ) : (
                            <div className="mission-grid">
                                {tab === 'available' && missions.available
                                    ?.filter(m => {
                                        if (subCategory === 'invasion') return m.category === 'invasion' && m.faction === selectedFaction;
                                        return m.category === 'aliens' && (m.target_alien === selectedAlien || m.target_alien === `Boss ${selectedAlien}`);
                                    })
                                    .map(m => <MissionCard key={m.id} m={m} type="available" onAccept={handleAccept} onClaim={handleClaim} />)}
                                
                                {tab === 'active' && missions.active?.map(m => <MissionCard key={m.id} m={m} type="active" onAccept={handleAccept} onClaim={handleClaim} />)}
                                {tab === 'completed' && missions.completed?.map(m => <MissionCard key={m.id} m={m} type="completed" onAccept={handleAccept} onClaim={handleClaim} />)}
                                
                                {((tab === 'available' && missions.available.filter(m => {
                                    if (subCategory === 'invasion') return m.category === 'invasion' && m.faction === selectedFaction;
                                    return m.category === 'aliens' && (m.target_alien === selectedAlien || m.target_alien === `Boss ${selectedAlien}`);
                                }).length === 0) ||
                                  (tab === 'active' && missions.active.length === 0) ||
                                  (tab === 'completed' && missions.completed.length === 0)) && !loading && (
                                    <div className="empty-state">
                                        <div className="empty-icon">📡</div>
                                        <div className="empty-text">No se detectan señales de misión en este cuadrante.</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <footer className="dashboard-footer">
                <div className="pilot-info"> PILOTO: <span>{user?.username}</span> | RANGO: <span>{level}</span></div>
                <div className="alert-info">⚠️ PROTOCOLO: MÁXIMO 2 MISIONES ACTIVAS SIMULTÁNEAS</div>
            </footer>
        </div>
    );
}
