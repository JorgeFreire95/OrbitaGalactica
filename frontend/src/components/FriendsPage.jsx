import React, { useState, useEffect } from 'react';
import './FriendsPage.css';

const FriendsPage = ({ user, onNavigate }) => {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);
    const [mailModal, setMailModal] = useState(null);
    const [reportModal, setReportModal] = useState(null);
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

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

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

    const handleAction = async (type, target) => {
        setContextMenu(null);
        if (type === 'mail') {
            setMailModal(target);
            return;
        }
        if (type === 'report') {
            setReportModal(target);
            return;
        }

        const endpoint = type === 'remove' ? 'friends/remove' : 'users/block';
        const body = type === 'remove' ? 
            { user_a: user.username, user_b: target } : 
            { blocker: user.username, blocked: target };

        const confirmText = type === 'remove' ? 
            `¿Seguro que quieres eliminar a ${target}?` : 
            `¿Seguro que quieres bloquear a ${target}? Se eliminará de tus amigos.`;

        if (!window.confirm(confirmText)) return;

        try {
            const resp = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (resp.ok) {
                fetchFriends();
            }
        } catch (err) {
            console.error(`Error in action ${type}:`, err);
        }
    };

    const submitMail = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {
            sender: user.username,
            receiver: mailModal,
            subject: formData.get('subject'),
            body: formData.get('body')
        };
        try {
            const resp = await fetch(`${API_URL}/mail/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (resp.ok) {
                alert('Correo enviado con éxito');
                setMailModal(null);
            }
        } catch (err) {
            alert('Error al enviar correo');
        }
    };

    const submitReport = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {
            reporter: user.username,
            reported: reportModal,
            reason: formData.get('reason'),
            details: formData.get('details')
        };
        try {
            const resp = await fetch(`${API_URL}/users/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (resp.ok) {
                alert('Reporte enviado al comando central');
                setReportModal(null);
            }
        } catch (err) {
            alert('Error al enviar reporte');
        }
    };

    const handleContextMenu = (e, target) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            target
        });
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
                                    <div 
                                        key={friend} 
                                        className="member-item clickable" 
                                        onContextMenu={(e) => handleContextMenu(e, friend)}
                                    >
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

            {contextMenu && (
                <div 
                    className="social-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="social-menu-header">
                        <span className="social-item-icon">👤</span> {contextMenu.target}
                    </div>
                    <button className="social-menu-item" onClick={() => handleAction('mail', contextMenu.target)}>
                        <span className="social-item-icon">📧</span> Mandar correo
                    </button>
                    <button className="social-menu-item" onClick={() => handleAction('remove', contextMenu.target)}>
                        <span className="social-item-icon">🗑️</span> Eliminar amigo
                    </button>
                    <button className="social-menu-item danger" onClick={() => handleAction('block', contextMenu.target)}>
                        <span className="social-item-icon">🚫</span> Bloquear amigo
                    </button>
                    <button className="social-menu-item danger" onClick={() => handleAction('report', contextMenu.target)}>
                        <span className="social-item-icon">⚠️</span> Reportar
                    </button>
                </div>
            )}

            {mailModal && (
                <div className="modal-overlay">
                    <div className="friends-panel modal-content-social">
                        <div className="panel-header">ENVIAR CORREO A {mailModal}</div>
                        <form onSubmit={submitMail} className="modal-form">
                            <input name="subject" type="text" placeholder="Asunto" required />
                            <textarea name="body" placeholder="Mensaje..." required rows={5}></textarea>
                            <div className="modal-buttons">
                                <button type="submit" className="add-btn">ENVIAR</button>
                                <button type="button" className="back-button" onClick={() => setMailModal(null)}>CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {reportModal && (
                <div className="modal-overlay">
                    <div className="friends-panel modal-content-social">
                        <div className="panel-header">REPORTAR PILOTO: {reportModal}</div>
                        <form onSubmit={submitReport} className="modal-form">
                            <select name="reason" required>
                                <option value="">Selecciona un motivo...</option>
                                <option value="spam">Spam / Publicidad</option>
                                <option value="toxic">Comportamiento Tóxico</option>
                                <option value="cheat">Trampas / Hacks</option>
                                <option value="name">Nombre Inapropiado</option>
                                <option value="other">Otro</option>
                            </select>
                            <textarea name="details" placeholder="Detalles del reporte..." required rows={3}></textarea>
                            <div className="modal-buttons">
                                <button type="submit" className="add-btn danger-btn">ENVIAR REPORTE</button>
                                <button type="button" className="back-button" onClick={() => setReportModal(null)}>CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FriendsPage;

