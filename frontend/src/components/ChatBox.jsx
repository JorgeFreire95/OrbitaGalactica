import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';

const ChatBox = ({ socket, user, playerFaction, clanTag }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [activeChannel, setActiveChannel] = useState('global'); // 'global', 'company', 'clan', or 'private_USER'
  const [isOpen, setIsOpen] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [privateTabs, setPrivateTabs] = useState([]);
  const [showUserList, setShowUserList] = useState(true); // Open by default for visibility
  const [contextMenu, setContextMenu] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_update') {
        const msg = data.message;
        setMessages((prev) => [...prev, msg].slice(-100));
        
        // Si es un mensaje privado recibido, asegurar que la pestaña esté abierta
        if (msg.channel === 'private' && msg.sender !== user?.username) {
          setPrivateTabs(prev => {
            if (!prev.includes(msg.sender)) {
              return [...prev, msg.sender];
            }
            return prev;
          });
        }
      } else if (data.type === 'user_list_update') {
        setOnlineUsers(data.users);
      } else if (data.type === 'friend_request_received') {
        setMessages(prev => [...prev, {
            id: 'sys_' + Date.now(),
            sender: 'SISTEMA',
            display_name: 'SISTEMA',
            text: `Has recibido una solicitud de amistad de ${data.from}. Ve a la página de amigos para aceptarla.`,
            channel: 'global',
            faction: 'SYSTEM',
            time: Date.now() / 1000
        }]);
      } else if (data.type === 'friend_request_accepted') {
        setMessages(prev => [...prev, {
            id: 'sys_' + Date.now(),
            sender: 'SISTEMA',
            display_name: 'SISTEMA',
            text: `${data.by} ha aceptado tu solicitud de amistad.`,
            channel: 'global',
            faction: 'SYSTEM',
            time: Date.now() / 1000
        }]);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChannel]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;

    const isPrivate = activeChannel.startsWith('private_');
    const targetUser = isPrivate ? activeChannel.split('private_')[1] : null;

    const chatData = {
      type: 'chat',
      text: inputValue,
      channel: isPrivate ? 'private' : activeChannel,
      receiver: targetUser
    };

    socket.send(JSON.stringify(chatData));
    setInputValue('');
  };

  const filteredMessages = messages.filter(msg => {
    if (activeChannel.startsWith('private_')) {
        const target = activeChannel.split('private_')[1];
        // En privado mostramos solo los que son entre el user actual y el target
        return msg.channel === 'private' && (
            (msg.sender === user.username && msg.receiver === target) ||
            (msg.sender === target && msg.receiver === user.username)
        );
    }
    if (activeChannel === 'global') return msg.channel === 'global';
    if (activeChannel === 'company') return msg.channel === 'company';
    if (activeChannel === 'clan') return msg.channel === 'clan';
    return true;
  });

  const getFilteredUsers = () => {
    if (activeChannel === 'company') return onlineUsers.filter(u => u.faction === playerFaction);
    if (activeChannel === 'clan') return onlineUsers.filter(u => u.clan_tag === clanTag);
    return onlineUsers;
  };

  const handleUserContextMenu = (e, targetUser) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Context menu triggered for:", targetUser.username, "at", e.clientX, e.clientY);
    
    setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetUser
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const startPrivateChat = (targetUsername) => {
    if (!privateTabs.includes(targetUsername)) {
        setPrivateTabs([...privateTabs, targetUsername]);
    }
    setActiveChannel(`private_${targetUsername}`);
    closeContextMenu();
  };

  const sendFriendRequest = (targetUsername) => {
    if (socket) {
        socket.send(JSON.stringify({
            type: 'friend_request',
            receiver: targetUsername
        }));
    }
    closeContextMenu();
  };

  const getFactionName = (f) => {

    if (f === 'MARS') return 'Mars';
    if (f === 'MOON') return 'Selene';
    if (f === 'PLUTO') return 'Caronte';
    return f;
  };

  return (
    <>
    <div 
      className={`chat-container ${isOpen ? 'open' : 'closed'} ${showUserList ? 'with-user-list' : ''}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="chat-header">
        <div className="chat-tabs">
          <button 
            className={activeChannel === 'global' ? 'active' : ''} 
            onClick={() => setActiveChannel('global')}
          >
            GLOBAL
          </button>
          <button 
            className={activeChannel === 'company' ? 'active' : ''} 
            onClick={() => setActiveChannel('company')}
          >
            EMPRESA
          </button>
          <button 
            className={activeChannel === 'clan' ? 'active' : ''} 
            onClick={() => setActiveChannel('clan')}
            disabled={!clanTag}
          >
            CLAN
          </button>
          {privateTabs.map(tab => (
              <button 
                key={tab}
                className={activeChannel === `private_${tab}` ? 'active private' : 'private'}
                onClick={() => setActiveChannel(`private_${tab}`)}
              >
                {tab.toUpperCase()}
                <span className="close-tab" onClick={(e) => {
                    e.stopPropagation();
                    setPrivateTabs(privateTabs.filter(t => t !== tab));
                    if (activeChannel === `private_${tab}`) setActiveChannel('global');
                }}>×</span>
              </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button className="toggle-users-btn" onClick={() => setShowUserList(!showUserList)} title="Ver usuarios conectados">
            {showUserList ? '👥' : '👤'}
          </button>
          <button className="toggle-chat" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? '−' : '+'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="chat-content-wrapper">
          <div className="chat-main-section">
            <div className="chat-messages" ref={scrollRef}>
              {filteredMessages.length === 0 && (
                <div className="no-messages">No hay mensajes en este canal...</div>
              )}
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`chat-message channel-${msg.channel}`}
                >
                  <span className="msg-time">{new Date(msg.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span 
                    className={`msg-sender faction-${msg.faction}`}
                    onContextMenu={(e) => handleUserContextMenu(e, { username: msg.sender, display_name: msg.display_name })}
                    onClick={(e) => handleUserContextMenu(e, { username: msg.sender, display_name: msg.display_name })}
                  >
                    {msg.display_name}: 
                  </span>

                  <span className="msg-text">{msg.text}</span>
                </div>
              ))}
            </div>

            <form className="chat-input-form" onSubmit={handleSend}>
              <input
                type="text"
                placeholder={activeChannel.startsWith('private_') ? `Mensaje privado a ${activeChannel.split('_')[1]}...` : `Hablar en #${activeChannel.toUpperCase()}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={150}
              />
              <button type="submit">↩</button>
            </form>
          </div>

          {showUserList && (
            <div className="chat-user-list">
                <div className="user-list-header">ONLINE ({getFilteredUsers().length})</div>
                <div className="user-list-items">
                    {getFilteredUsers().map(u => (
                        <div 
                          key={u.username} 
                          className={`user-list-item faction-${u.faction}`}
                          onContextMenu={(e) => handleUserContextMenu(e, u)}
                          onClick={(e) => handleUserContextMenu(e, u)}
                          title="Click derecho para opciones"
                        >
                            <span className="user-status-dot"></span>
                            {u.display_name}
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}

    </div>

    {contextMenu && (
        <div 
          className="chat-context-menu" 
          style={{ 
            top: Math.min(contextMenu.y, window.innerHeight - 120), 
            left: Math.min(contextMenu.x, window.innerWidth - 180) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="menu-header">
              <span className="menu-user-icon">👤</span>
              {contextMenu.targetUser.display_name || contextMenu.targetUser.username}
              {contextMenu.targetUser.username === user?.username && " (Tú)"}
            </div>
            <button 
              className="menu-item" 
              onClick={() => startPrivateChat(contextMenu.targetUser.username)}
              disabled={contextMenu.targetUser.username === user?.username}
            >
              <span className="item-icon">💬</span> Hablar al privado
            </button>
            <button 
              className="menu-item" 
              onClick={() => sendFriendRequest(contextMenu.targetUser.username)}
              disabled={contextMenu.targetUser.username === user?.username}
            >
              <span className="item-icon">➕</span> Agregar amigos
            </button>
        </div>
    )}
    </>
  );
};

export default ChatBox;
