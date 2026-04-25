import React, { useState, useEffect } from 'react';
import './FriendsPage.css';

const FriendsPage = ({ user, onNavigate }) => {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const API_URL = 'http://localhost:8000/api';

    const fetchFriends = async () => {
        if (!user) return;
        try {
            const resp = await fetch(`${API_URL}/friends/${user.username}`);
            if (resp.ok) {
                const data = await resp.json();
                setFriends(data.friends || []);
                setRequests(data.requests || []);
            }
        } catch (err) {
            console.error("Error fetching friends:", err);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const resp = await fetch(`${API_URL}/users`);
            if (resp.ok) {
                const data = await resp.json();
                setAllUsers(data || []);
            }
        } catch (err) {
            console.error("Error fetching all users:", err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchFriends(), fetchAllUsers()]);
            setLoading(false);
        };
        loadInitialData();
        
        const interval = setInterval(fetchFriends, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const handleAccept = async (sender) => {
        try {
            const resp = await fetch(`${API_URL}/friends/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender, receiver: user.username })
            });
            if (resp.ok) {
                fetchFriends();
            }
        } catch (err) {
            console.error("Error accepting friend:", err);
        }
    };

    const handleSendRequest = async (target) => {
        try {
            const resp = await fetch(`${API_URL}/friends/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: user.username, receiver: target })
            });
            if (resp.ok) {
                alert(`Solicitud enviada a ${target}`);
            } else {
                const data = await resp.json();
                alert(data.error || "Error al enviar solicitud");
            }
        } catch (err) {
            console.error("Error sending request:", err);
        }
    };

    const filteredUsers = allUsers.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) && 
        u.username !== user?.username &&
        !friends.includes(u.username)
    );

    return (
        <div className="friends-container">
            <div className="friends-header">
                <div className="friends-header-left">
                    <button className="back-button" onClick={() => onNavigate('menu')}>← VOLVER</button>
                    <h1>SISTEMA SOCIAL / AMIGOS</h1>
                </div>
                <div className="friends-stats">
                    <div className="stat-item">
                        <span className="stat-label">AMIGOS</span>
                        <span className="stat-value">{friends.length}</span>
                    </div>
                </div>
            </div>

            <div className="friends-grid">
                {/* BUSCADOR DE USUARIOS */}
                <div className="friends-panel search-panel">
                    <div className="panel-header">BUSCAR PILOTOS</div>
                    <div className="search-bar">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="panel-content">
                        {filteredUsers.length === 0 ? (
                            <div className="empty-state">No se encontraron pilotos.</div>
                        ) : (
                            filteredUsers.slice(0, 50).map(u => (
                                <div key={u.username} className="member-item">
                                    <div className="member-info">
                                        <span className={`member-name faction-${u.faction}`}>{u.username}</span>
                                        <span className="member-role">Nivel {u.level}</span>
                                    </div>
                                    <div className="member-actions">
                                        <button className="add-btn" onClick={() => handleSendRequest(u.username)}>AGREGAR</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SOLICITUDES PENDIENTES */}
                <div className="friends-panel">
                    <div className="panel-header">SOLICITUDES PENDIENTES</div>
                    <div className="panel-content">
                        {requests.length === 0 ? (
                            <div className="empty-state">No tienes solicitudes pendientes.</div>
                        ) : (
                            requests.map(req => (
                                <div key={req} className="member-item">
                                    <div className="member-info">
                                        <span className="member-name">{req}</span>
                                        <span className="member-role">Quiere ser tu amigo</span>
                                    </div>
                                    <div className="member-actions">
                                        <button className="accept-btn" onClick={() => handleAccept(req)}>ACEPTAR</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* LISTADO DE AMIGOS */}
                <div className="friends-panel">
                    <div className="panel-header">LISTA DE AMIGOS</div>
                    <div className="panel-content">
                        {friends.length === 0 ? (
                            <div className="empty-state">Aún no tienes amigos.</div>
                        ) : (
                            <div className="friends-list">
                                {friends.map(friend => (
                                    <div key={friend} className="member-item">
                                        <div className="member-info">
                                            <span className="member-name">{friend}</span>
                                            <span className="member-role">Amigo</span>
                                        </div>
                                        <div className="member-status">
                                            <span className="status-badge active">ONLINE</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendsPage;

