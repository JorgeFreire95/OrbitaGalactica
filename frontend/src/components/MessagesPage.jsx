import React, { useState, useEffect } from 'react';
import './MessagesPage.css';

const MessagesPage = ({ user, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messageType, setMessageType] = useState('inbox'); // 'inbox' or 'sent'
    const API_URL = 'http://localhost:8000/api';

    const fetchMessages = async () => {
        if (!user) return;
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

    useEffect(() => {
        fetchMessages();
        setSelectedMessage(null);
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
            } catch (err) {
                console.error("Error marking as read:", err);
            }
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit' 
        });
    };

    return (
        <div className="messages-container">
            <div className="messages-header">
                <div className="header-left">
                    <button className="back-btn" onClick={onBack}>← VOLVER</button>
                    <h1>SISTEMA DE CORREO</h1>
                </div>
                <div className="msg-stats">
                    <span>{messages.filter(m => !m.is_read).length} SIN LEER</span>
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
                    </div>
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
                </div>

                <div className="message-detail-panel">
                    {selectedMessage ? (
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
                                {selectedMessage.type === 'mail' && (
                                    <button className="reply-btn" onClick={() => alert('Próximamente: Responder')}>RESPONDER</button>
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
