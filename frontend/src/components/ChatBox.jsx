import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';

const ChatBox = ({ socket, user, playerFaction, clanTag }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [activeChannel, setActiveChannel] = useState('global'); // 'global', 'company', 'clan'
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_update') {
        setMessages((prev) => [...prev, data.message].slice(-50)); // Last 50 messages
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChannel]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;

    const chatData = {
      type: 'chat',
      text: inputValue,
      channel: activeChannel
    };

    socket.send(JSON.stringify(chatData));
    setInputValue('');
  };

  const filteredMessages = messages.filter(msg => {
    if (activeChannel === 'global') return msg.channel === 'global';
    if (activeChannel === 'company') return msg.channel === 'company';
    if (activeChannel === 'clan') return msg.channel === 'clan';
    return true;
  });

  const getFactionName = (f) => {
    if (f === 'MARS') return 'Mars';
    if (f === 'MOON') return 'Selene';
    if (f === 'PLUTO') return 'Caronte';
    return f;
  };

  return (
    <div 
      className={`chat-container ${isOpen ? 'open' : 'closed'}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
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
        </div>
        <button className="toggle-chat" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="chat-messages" ref={scrollRef}>
            {filteredMessages.length === 0 && (
              <div className="no-messages">No hay mensajes en este canal...</div>
            )}
            {filteredMessages.map((msg) => (
              <div key={msg.id} className={`chat-message channel-${msg.channel}`}>
                <span className="msg-time">{new Date(msg.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`msg-sender faction-${msg.faction}`}>
                  {msg.display_name}: 
                </span>
                <span className="msg-text">{msg.text}</span>
              </div>
            ))}
          </div>

          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              placeholder={`Hablar en #${activeChannel.toUpperCase()}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={150}
            />
            <button type="submit">↩</button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;
