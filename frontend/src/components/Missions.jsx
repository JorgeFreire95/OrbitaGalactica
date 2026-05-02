import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';

const API_URL = 'http://localhost:8000/api';

export default function Missions({ user, onNavigate, credits, level, xp, paladio }) {
    const [missions, setMissions] = useState({ available: [], active: [], completed: [] });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('available'); // 'available', 'active', 'completed'

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

    const renderMissionCard = (m, type) => {
        const isCompleted = m.status === 'completed' || m.status === 'claimed';
        const isActive = m.status === 'active';
        
        // Calcular dificultad relativa al nivel del jugador
        const mLevel = parseInt(m.min_level || 1, 10);
        const pLevel = parseInt(level || 1, 10);
        
        let difficulty = 'facil';
        let diffLabel = 'FÁCIL';

        if (mLevel >= pLevel + 4) {
            difficulty = 'extrem';
            diffLabel = 'EXTREMO';
        } else if (mLevel >= pLevel + 2) {
            difficulty = 'dificil';
            diffLabel = 'DIFÍCIL';
        } else if (mLevel > pLevel) {
            difficulty = 'media';
            diffLabel = 'MEDIO';
        } else if (mLevel === pLevel) {
            difficulty = 'media';
            diffLabel = 'NORMAL';
        }

        return (
            <div key={m.id} className={`mission-card ${type} ${isActive ? 'active-gradient' : ''}`}>
                <div className="mission-header">
                    <div className="mission-title">
                        {m.title} <span style={{ fontSize: '0.8rem', color: '#888' }}>(Nivel {mLevel})</span>
                    </div>
                    <div className={`mission-difficulty difficulty-${difficulty}`}>{diffLabel}</div>
                </div>
                <div className="mission-description">{m.description}</div>
                
                <div className="mission-objectives">
                    <div className="objective">
                        <span>Eliminar {m.target_alien}:</span>
                        <span className="objective-progress">{m.progress || 0} / {m.target_count}</span>
                    </div>
                    {m.map_name && (
                        <div className="objective">
                            <span>Sector de Operaciones:</span>
                            <span className="objective-progress" style={{ color: '#00d4ff' }}>{m.map_name}</span>
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

                <div className="mission-actions">
                    {type === 'available' && (
                        <button className="accept-btn" onClick={() => handleAccept(m.id)}>ACEPTAR MISIÓN</button>
                    )}
                    {type === 'active' && isCompleted && (
                        <button className="claim-btn pulse" onClick={() => handleClaim(m.id)}>COBRAR RECOMPENSA</button>
                    )}
                    {type === 'active' && !isCompleted && (
                        <button className="status-btn" disabled>EN CURSO...</button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="missions-view-container">
            <main className="missions-main-layout">
                <header className="missions-page-header">
                    <h1>CENTRO DE MANDO: MISIONES</h1>
                    <div className="mission-tabs">
                        <button className={tab === 'available' ? 'active' : ''} onClick={() => setTab('available')}>DISPONIBLES</button>
                        <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>ACTIVAS ({missions.active?.length || 0}/2)</button>
                        <button className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>HISTORIAL</button>
                    </div>
                </header>

                <div className="missions-content">
                    {loading ? (
                        <div className="loading-spinner">Cargando protocolos de misión...</div>
                    ) : (
                        <div className="mission-grid">
                            {tab === 'available' && missions.available?.map(m => renderMissionCard(m, 'available'))}
                            {tab === 'active' && missions.active?.map(m => renderMissionCard(m, 'active'))}
                            {tab === 'completed' && missions.completed?.map(m => renderMissionCard(m, 'completed'))}
                            
                            {((tab === 'available' && missions.available.length === 0) ||
                              (tab === 'active' && missions.active.length === 0) ||
                              (tab === 'completed' && missions.completed.length === 0)) && !loading && (
                                <div className="empty-state">No hay misiones coincidentes en este sector.</div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <footer className="dashboard-footer">
                <div>ESTADO DEL PILOTO: {user?.username} | NIVEL {level}</div>
                <div>AVISO: Solo se pueden tener 2 misiones activas simultáneamente.</div>
            </footer>
        </div>
    );
}
