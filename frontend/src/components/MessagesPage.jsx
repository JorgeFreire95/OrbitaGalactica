import React, { useState, useEffect } from 'react';
import './MessagesPage.css';

const MessagesPage = ({ user, onBack, onRefreshUnread }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messageType, setMessageType] = useState('inbox'); // 'inbox', 'sent', or 'compose'
    const [friends, setFriends] = useState([]);
    const [recipients, setRecipients] = useState([]); // Combined list of friends and admins
    const [sending, setSending] = useState(false);
    
    const API_URL = 'http://localhost:8000/api';

    const fetchMessages = async () => {
        if (!user || messageType === 'compose') return;
        setLoading(true);
        try {
            const endpoint = messageType === 'inbox' ? `mail/list/${user.username}` : `mail/sent/${user.username}`;
            const resp = await fetch(`${API_URL}/${endpoint}`);
            if (resp.ok) {
                const data = await resp.json();
                setMessages(data.messages || []);
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipients = async () => {
        if (!user) return;
        try {
            // Fetch friends and all users (to find admins)
            const [friendsResp, allUsersResp] = await Promise.all([
                fetch(`${API_URL}/friends/${user.username}`),
                fetch(`${API_URL}/users`)
            ]);

            let friendsList = [];
            let adminsList = [];

            if (friendsResp.ok) {
                const data = await friendsResp.json();
                friendsList = data.friends || [];
            }

            if (allUsersResp.ok) {
                const data = await allUsersResp.json();
                // Filter admins and exclude self
                adminsList = data.filter(u => u.is_admin && u.username !== user.username).map(u => ({
                    username: u.username,
                    isAdmin: true
                }));
            }

            // Combine and remove duplicates
            const combined = [...adminsList];
            friendsList.forEach(f => {
                if (!combined.find(c => c.username === f)) {
                    combined.push({ username: f, isAdmin: false });
                }
            });

            setRecipients(combined.sort((a, b) => a.username.localeCompare(b.username)));
        } catch (err) {
            console.error("Error fetching recipients:", err);
        }
    };

    useEffect(() => {
        if (messageType === 'compose') {
            fetchRecipients();
        } else {
            fetchMessages();
            setSelectedMessage(null);
        }
    }, [user, messageType]);

    const handleRead = async (msg) => {
        setSelectedMessage(msg);
        if (!msg.is_read) {
            try {
                await fetch(`${API_URL}/mail/read`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: msg.id })
                });
                // Update local state
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
                if (onRefreshUnread) onRefreshUnread();
            } catch (err) {
                console.error("Error marking as read:", err);
            }
        }
    };

    const handleSendMail = async (e) => {
        e.preventDefault();
        setSending(true);
        const formData = new FormData(e.target);
        const body = {
            sender: user.username,
            receiver: formData.get('receiver'),
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
                alert('Mensaje enviado con éxito');
                setMessageType('sent');
            } else {
                alert('Error al enviar el mensaje');
            }
        } catch (err) {
            console.error("Send mail error:", err);
            alert('Error de conexión');
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        // SQLite usa formato YYYY-MM-DD HH:MM:SS. Aseguramos que se trate como UTC
        const normalized = dateStr.includes('Z') || dateStr.includes('UTC') ? dateStr : dateStr + " UTC";
        const d = new Date(normalized);
        
        // Verificamos si la fecha es válida
        if (isNaN(d.getTime())) return dateStr;

        return d.toLocaleString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            hour12: false
        });
    };

    const handleClearTray = async () => {
        const trayName = messageType === 'inbox' ? 'entrada' : 'enviados';
        if (!window.confirm(`¿Estás seguro de que deseas vaciar toda tu bandeja de ${trayName}?`)) return;

        try {
            const resp = await fetch(`${API_URL}/mail/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, tray_type: messageType })
            });
            if (resp.ok) {
                fetchMessages();
                setSelectedMessage(null);
            } else {
                alert('Error al limpiar la bandeja');
            }
        } catch (err) {
            console.error("Clear tray error:", err);
            alert('Error de conexión');
        }
    };

    return (
        <div className="messages-container">
            <div className="messages-header">
                <div className="header-left">
                    <button className="back-btn" onClick={onBack}>← VOLVER</button>
                    <h1>SISTEMA DE CORREO</h1>
                </div>
                <div className="msg-stats">
                    {messageType !== 'compose' && <span>{messages.filter(m => !m.is_read).length} SIN LEER</span>}
                    {messageType === 'compose' && <span>REDACTANDO</span>}
                </div>
            </div>

            <div className="messages-layout">
                <div className="messages-list-panel">
                    <div className="panel-tabs">
                        <button 
                            className={`tab-btn ${messageType === 'inbox' ? 'active' : ''}`}
                            onClick={() => setMessageType('inbox')}
                        >
                            ENTRADA
                        </button>
                        <button 
                            className={`tab-btn ${messageType === 'sent' ? 'active' : ''}`}
                            onClick={() => setMessageType('sent')}
                        >
                            ENVIADOS
                        </button>
                        <button 
                            className={`tab-btn ${messageType === 'compose' ? 'active' : ''}`}
                            onClick={() => setMessageType('compose')}
                            style={{ background: messageType === 'compose' ? 'rgba(0, 255, 204, 0.2)' : undefined, color: messageType === 'compose' ? '#00ffcc' : undefined }}
                        >
                            REDACTAR
                        </button>
                    </div>

                    {messageType !== 'compose' && messages.length > 0 && (
                        <div style={{ padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={handleClearTray}
                                style={{ 
                                    background: 'rgba(255, 51, 102, 0.1)', 
                                    color: '#ff3366', 
                                    border: '1px solid #ff336644', 
                                    padding: '5px 12px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.7rem', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.target.style.background = 'rgba(255, 51, 102, 0.2)'}
                                onMouseOut={e => e.target.style.background = 'rgba(255, 51, 102, 0.1)'}
                            >
                                🗑️ VACIAR BANDEJA
                            </button>
                        </div>
                    )}
                    
                    {messageType !== 'compose' ? (
                        <div className="messages-scroll">
                            {loading ? (
                                <div className="msg-loading">Sincronizando...</div>
                            ) : messages.length === 0 ? (
                                <div className="msg-empty">No hay mensajes en esta sección.</div>
                            ) : (
                                messages.map(msg => (
                                    <div 
                                        key={msg.id} 
                                        className={`message-item ${msg.is_read ? 'read' : 'unread'} ${selectedMessage?.id === msg.id ? 'active' : ''}`}
                                        onClick={() => handleRead(msg)}
                                    >
                                        <div className="msg-icon">
                                            {msg.type === 'mail' ? '📧' : '🛡️'}
                                        </div>
                                        <div className="msg-main">
                                            <div className="msg-subject">{msg.subject}</div>
                                            <div className="msg-meta">
                                                <span className="msg-sender">
                                                    {messageType === 'inbox' ? `De: ${msg.sender}` : `Para: ${msg.receiver}`}
                                                </span>
                                                <span className="msg-date">{formatDate(msg.sent_at)}</span>
                                            </div>
                                        </div>
                                        {messageType === 'inbox' && !msg.is_read && <div className="unread-dot"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="compose-info">
                            <h3>Consejos de Redacción</h3>
                            <p>Mantén la cordialidad con otros pilotos.</p>
                            <p>Los administradores recibirán tu mensaje en su buzón prioritario.</p>
                        </div>
                    )}
                </div>

                <div className="message-detail-panel">
                    {messageType === 'compose' ? (
                        <div className="compose-view">
                            <h2>REDACTAR NUEVO MENSAJE</h2>
                            <form onSubmit={handleSendMail} className="compose-form">
                                <div className="form-group">
                                    <label>PARA:</label>
                                    <select name="receiver" required defaultValue="">
                                        <option value="" disabled>Selecciona un destinatario...</option>
                                        {recipients.map(r => (
                                            <option key={r.username} value={r.username}>
                                                {r.username} {r.isAdmin ? '(admin)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>ASUNTO:</label>
                                    <input name="subject" type="text" placeholder="Asunto del mensaje..." required />
                                </div>
                                <div className="form-group">
                                    <label>MENSAJE:</label>
                                    <textarea name="body" placeholder="Escribe tu mensaje aquí..." required rows={10}></textarea>
                                </div>
                                <div className="compose-footer">
                                    <button type="button" className="back-btn" onClick={() => setMessageType('inbox')}>CANCELAR</button>
                                    <button type="submit" className="send-btn" disabled={sending}>
                                        {sending ? 'ENVIANDO...' : 'ENVIAR TRANSMISIÓN'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : selectedMessage ? (
                        <div className="message-view">
                            <div className="detail-header">
                                <div className="detail-title">{selectedMessage.subject}</div>
                                <div className="detail-meta">
                                    <span>{messageType === 'inbox' ? 'DE:' : 'PARA:'} <strong>{messageType === 'inbox' ? selectedMessage.sender : selectedMessage.receiver}</strong></span>
                                    <span>FECHA: {formatDate(selectedMessage.sent_at)}</span>
                                    <span>TIPO: {selectedMessage.type === 'mail' ? 'Correo Privado' : 'Aviso del Sistema'}</span>
                                </div>
                            </div>
                            <div className="detail-body">
                                {selectedMessage.body}
                            </div>
                            <div className="detail-footer">
                                <button className="delete-btn" onClick={() => alert('Próximamente: Eliminar')}>ELIMINAR</button>
                                {messageType === 'inbox' && selectedMessage.type === 'mail' && (
                                    <button className="reply-btn" onClick={() => {
                                        // Set recipient and subject automatically for reply
                                        setMessageType('compose');
                                        // We'll need to pass these values to the form, but for now just switching view
                                    }}>RESPONDER</button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection">
                            <div className="selection-icon">📬</div>
                            <p>Selecciona un mensaje para leer su contenido</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
