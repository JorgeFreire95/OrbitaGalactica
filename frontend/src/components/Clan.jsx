import React, { useState } from 'react';
import NavigationBar from './NavigationBar';

const Clan = ({ credits, uridium, level, xp, setCredits, clan, setClan, onBack, onNavigate }) => {
  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [editMode, setEditMode] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [msgTab, setMsgTab] = useState('inbox');
  const [draftTo, setDraftTo] = useState('all');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const CLAN_COST = 0;

  const handleCreateClan = (e) => {
    e.preventDefault();
    if (tag.length < 2 || tag.length > 4) {
      alert("La sigla del clan debe tener entre 2 y 4 caracteres.");
      return;
    }
    if (name.length < 4) {
      alert("El nombre del clan debe tener al menos 4 caracteres.");
      return;
    }
    if (credits < CLAN_COST) {
      alert(`No tienes suficientes créditos. Crear un clan cuesta ${CLAN_COST.toLocaleString()} CR.`);
      return;
    }

    setCredits(prev => prev - CLAN_COST);
    
    setClan({ 
      tag: tag.toUpperCase(), 
      name,
      leader: 'PILOTO_ESTELAR',
      created_at: new Date().toLocaleDateString(),
      members: [
        { id: '1', name: 'PILOTO_ESTELAR', role: 'Líder', joined: new Date().toLocaleDateString(), xp: xp }
      ]
    });
    
    alert("¡Clan creado exitosamente!");
  };

  const SIDEMENU = [
    { id: 'summary', label: 'INFORMACIÓN' },
    { id: 'members', label: 'MIEMBROS' },
    { id: 'admin', label: 'ADMINISTRACIÓN' },
    { id: 'msg', label: 'MENSAJES' },
    { id: 'diplomacy', label: 'DIPLOMACIA' },
    { id: 'company', label: 'EMPRESA' },
    { id: 'station', label: 'ESTACIÓN' },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ height: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0 30px', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <h1 style={{ fontSize: '1.2rem', color: '#00ffcc', margin: 0, letterSpacing: '1px' }}>GABINETE: ALIANZAS Y CLANES</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="status-item">
              <span className="status-icon">🔋</span>
              <span className="status-value">{credits ? credits.toLocaleString() : 0} CRÉDITOS</span>
            </div>
            <div className="status-item">
              <span className="status-icon" style={{ color: '#cc33ff' }}>💎</span>
              <span className="status-value">{uridium ? uridium.toLocaleString() : 0} URIDIUM</span>
            </div>
            <div className="status-item">
              <span className="status-icon" style={{ color: '#ffcc00' }}>🎖️</span>
              <span className="status-value">NIVEL {level || 1}</span>
            </div>
          </div>
        </div>
      </header>

      <NavigationBar currentView="clan" onNavigate={onNavigate} />

      <main className="shop-main-layout" style={{ margin: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1a2a4a' }}>
        
        {clan ? (
          <>
            {/* Sidebar from existing Shop classes */}
            <div className="shop-sidebar">
              {SIDEMENU.map(item => (
                <div 
                  key={item.id} 
                  className={`shop-tab ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.label}
                </div>
              ))}
            </div>

            {/* Right Content */}
            <div className="dashboard-panel" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
              <div className="panel-header">PANEL DEL CLAN</div>
              <div className="panel-content">
                
                {activeTab === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Top Row: Info Table and Logo */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                      
                      {/* Info Table */}
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Información del clan</span>
                          {editMode === 'info' ? (
                              <span>
                                 <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '10px' }} onClick={() => { setClan({...clan, tag: editValues.tag.toUpperCase(), name: editValues.name}); setEditMode(null); }}>✔ guardar</span>
                                 <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖ cancelar</span>
                              </span>
                          ) : (
                              <span style={{ color: '#88aaff', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => {setEditMode('info'); setEditValues({tag: clan.tag, name: clan.name})}}>✎ editar</span>
                          )}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', alignItems: 'center' }}>
                          <div style={{ color: '#888' }}>Sigla/Nombre de clan:</div>
                          {editMode === 'info' ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                  <input value={editValues.tag} onChange={e => setEditValues({...editValues, tag: e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0,4)})} style={{width: '50px', background: '#0a0f1a', color: '#fff', border:'1px solid #334466', padding: '2px 5px', outline: 'none'}} />
                                  <input value={editValues.name} onChange={e => setEditValues({...editValues, name: e.target.value})} style={{flex: 1, background: '#0a0f1a', color: '#fff', border:'1px solid #334466', padding: '2px 5px', outline: 'none'}} />
                              </div>
                          ) : (
                              <div style={{ color: '#fff', fontWeight: 'bold' }}>[{clan.tag}] {clan.name}</div>
                          )}
                          
                          <div style={{ color: '#888' }}>Fecha de fundación:</div>
                          <div style={{ color: '#fff' }}>{clan.created_at || 'Desconocido'}</div>
                          
                          <div style={{ color: '#888' }}>Líder del clan:</div>
                          <div style={{ color: '#ffcc00' }}>{clan.leader || 'PILOTO_ESTELAR'}</div>
                          
                          <div style={{ color: '#888' }}>Nº de miembros:</div>
                          <div style={{ color: '#fff' }}>{clan.members ? clan.members.length : 1}</div>
                          
                          <div style={{ color: '#888' }}>Posición del clan:</div>
                          <div style={{ color: '#fff' }}>0</div>
                          
                          <div style={{ color: '#888' }}>Afiliación a empresa:</div>
                          <div style={{ color: '#fff' }}>Todo</div>
                          
                          <div style={{ color: '#888' }}>Tasa de impuestos:</div>
                          <div style={{ color: '#fff' }}>{clan.taxRate || 0}% ({ ((clan.members || []).length * 10000 * ((clan.taxRate || 0) / 100)).toLocaleString() } CR diarios)</div>
                          
                          <div style={{ color: '#888' }}>Estado de reclutamiento:</div>
                          <div style={{ color: '#00ffcc' }}>Reclutando</div>
                        </div>
                      </div>
                      
                      {/* Logo Box */}
                      <div style={{ width: '150px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                          <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '0.8rem' }}>Logo</span>
                          {editMode === 'logo' ? (
                             <span>
                               <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '5px' }} onClick={() => {setClan({...clan, logo: editValues.logo}); setEditMode(null)}}>✔</span>
                               <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖</span>
                             </span>
                          ) : (
                             <span style={{ color: '#88aaff', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => {setEditMode('logo'); setEditValues({logo: clan.logo || ''})}}>✎</span>
                          )}
                        </div>
                        {editMode === 'logo' ? (
                            <input type="text" placeholder="IMG URL..." value={editValues.logo} onChange={e => setEditValues({logo: e.target.value})} style={{width: '100%', background: '#0a0f1a', color: '#fff', border:'1px solid #334466', fontSize: '0.7rem', padding: '5px', outline: 'none'}} />
                        ) : (
                            <div style={{ width: '100px', height: '100px', background: '#0a0f1a', border: '1px dashed #334466', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', overflow: 'hidden' }}>
                              {clan.logo ? <img src={clan.logo} style={{width:'100%', height:'100%', objectFit: 'contain'}} alt="Logo" /> : <span style={{ fontSize: '2rem', opacity: 0.5 }}>🛡️</span>}
                            </div>
                        )}
                      </div>
                    </div>

                    {/* Text Box 1 */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Texto del clan</span>
                        {editMode === 'text' ? (
                           <span>
                             <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '10px' }} onClick={() => {setClan({...clan, description: editValues.text}); setEditMode(null)}}>✔ guardar</span>
                             <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖ cancelar</span>
                           </span>
                        ) : (
                           <span style={{ color: '#88aaff', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => {setEditMode('text'); setEditValues({text: clan.description || ''})}}>✎ editar</span>
                        )}
                      </div>
                      
                      {editMode === 'text' ? (
                          <textarea value={editValues.text} onChange={e => setEditValues({text: e.target.value})} placeholder="Redacta la biografía de tu clan..." style={{width: '100%', height: '80px', background: '#0a0f1a', color: '#fff', border:'1px solid #334466', padding: '10px', resize: 'vertical', outline: 'none'}} />
                      ) : (
                          <div style={{ color: '#aaa', fontSize: '0.85rem', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                            {clan.description || 'Luchamos por honor. [Esto es un texto de prueba]'}
                          </div>
                      )}
                    </div>

                    {/* Text Box 2 */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Novedades / Información</span>
                        {editMode === 'news' ? (
                           <span>
                             <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '10px' }} onClick={() => {
                                 if(!editValues.news) return setEditMode(null);
                                 setClan({...clan, news: [{date: new Date().toLocaleDateString(), text: editValues.news}, ...(clan.news || [])]}); 
                                 setEditMode(null);
                             }}>✔ publicar</span>
                             <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖ cancelar</span>
                           </span>
                        ) : (
                           <span style={{ color: '#00cc66', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => {setEditMode('news'); setEditValues({news: ''})}}>+ añadir entrada</span>
                        )}
                      </div>
                      
                      {editMode === 'news' && (
                          <div style={{ marginBottom: '15px' }}>
                              <input type="text" placeholder="Escribe una nueva entrada o regla global..." value={editValues.news} onChange={e => setEditValues({news: e.target.value})} style={{width: '100%', background: '#0a0f1a', color: '#fff', border:'1px solid #334466', padding: '10px', outline: 'none'}} />
                          </div>
                      )}

                      <div style={{ color: '#666', fontSize: '0.85rem', minHeight: '60px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {clan.news && clan.news.length > 0 ? clan.news.map((n, i) => (
                            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>
                                <strong style={{ color: '#00aaff' }}>[{n.date}]</strong> <span style={{ color: '#ddd' }}>{n.text}</span>
                            </div>
                        )) : (
                            <div style={{ fontStyle: 'italic' }}>Ninguna entrada registrada en el historial...</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a' }}>
                    <h3 style={{ color: '#00ffcc', marginBottom: '15px' }}>Tripulación del Clan</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#888', fontSize: '0.9rem' }}>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Piloto</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Experiencia</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Ingreso</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Rango</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(clan.members && clan.members.length > 0 ? clan.members : [
                                { name: clan.leader || 'PILOTO_ESTELAR', role: 'Líder', joined: clan.created_at || new Date().toLocaleDateString(), xp: xp }
                            ]).map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', color: '#fff', fontSize: '0.9rem' }}>{m.name}</td>
                                    <td style={{ padding: '12px', color: '#00cc66', fontSize: '0.9rem' }}>{m.xp ? m.xp.toLocaleString() : 0} XP</td>
                                    <td style={{ padding: '12px', color: '#888', fontSize: '0.9rem' }}>{m.joined}</td>
                                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                        <select 
                                            value={m.role}
                                            onChange={(e) => {
                                                const currentMembers = clan.members && clan.members.length > 0 ? clan.members : [
                                                    { name: clan.leader || 'PILOTO_ESTELAR', role: 'Líder', joined: clan.created_at || new Date().toLocaleDateString(), xp: xp }
                                                ];
                                                const newMembers = [...currentMembers];
                                                newMembers[i].role = e.target.value;
                                                setClan({ ...clan, members: newMembers });
                                            }}
                                            style={{ 
                                                background: '#0a0f1a', 
                                                color: m.role === 'Líder' ? '#ffcc00' : '#88aaff', 
                                                border: '1px solid #334466', 
                                                padding: '5px',
                                                borderRadius: '4px',
                                                fontWeight: m.role === 'Líder' ? 'bold' : 'normal',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="Líder" style={{ color: '#ffcc00' }}>Líder</option>
                                            <option value="Oficial" style={{ color: '#00ffcc' }}>Oficial</option>
                                            <option value="Piloto" style={{ color: '#88aaff' }}>Piloto</option>
                                            <option value="Recluta" style={{ color: '#aaa' }}>Recluta</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                )}

                {['diplomacy', 'company', 'station'].includes(activeTab) && (
                  <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid #1a2a4a' }}>
                    <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '20px' }}>🚧</div>
                    <h3 style={{ color: '#88aaff', letterSpacing: '2px' }}>MÓDULO EN CONSTRUCCIÓN</h3>
                    <p style={{ color: '#666' }}>Esta sección estará disponible en futuras actualizaciones.</p>
                  </div>
                )}

                {activeTab === 'msg' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>Comunicaciones del Clan</h3>
                    
                    <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #1a2a4a', paddingBottom: '10px' }}>
                       <button onClick={() => setMsgTab('inbox')} style={{ background: msgTab === 'inbox' ? '#1a253a' : 'transparent', color: msgTab === 'inbox' ? '#00ffcc' : '#88aaff', border: '1px solid #334466', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Bandeja de Entrada</button>
                       <button onClick={() => setMsgTab('sent')} style={{ background: msgTab === 'sent' ? '#1a253a' : 'transparent', color: msgTab === 'sent' ? '#00ffcc' : '#88aaff', border: '1px solid #334466', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Enviados</button>
                       <button onClick={() => setMsgTab('compose')} style={{ background: msgTab === 'compose' ? '#0a3a2a' : 'transparent', color: msgTab === 'compose' ? '#00ffcc' : '#00cc66', border: '1px solid #00cc66', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}>+ Redactar Mensaje</button>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', minHeight: '300px' }}>
                       {msgTab === 'inbox' && (
                           <div>
                               <h4 style={{ color: '#88aaff', marginTop: 0 }}>Caja de Entrada</h4>
                               {(clan.messages || []).filter(m => m.to === 'PILOTO_ESTELAR' || m.to === 'all').length === 0 ? (
                                   <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>No tienes mensajes nuevos.</div>
                               ) : (
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                       {(clan.messages || []).filter(m => m.to === 'PILOTO_ESTELAR' || m.to === 'all').reverse().map((msg, idx) => (
                                           <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #334466', borderRadius: '4px', padding: '10px' }}>
                                               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2a4a', paddingBottom: '5px', marginBottom: '5px' }}>
                                                   <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>De: {msg.from}</span>
                                                   <span style={{ color: '#555', fontSize: '0.8rem' }}>{msg.date}</span>
                                               </div>
                                               <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Asunto: {msg.subject}</div>
                                               <div style={{ color: '#aaa', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                       )}

                       {msgTab === 'sent' && (
                           <div>
                               <h4 style={{ color: '#88aaff', marginTop: 0 }}>Mensajes Enviados</h4>
                               {(clan.messages || []).filter(m => m.from === 'PILOTO_ESTELAR').length === 0 ? (
                                   <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>No has enviado ningún mensaje.</div>
                               ) : (
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                       {(clan.messages || []).filter(m => m.from === 'PILOTO_ESTELAR').reverse().map((msg, idx) => (
                                           <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #334466', borderRadius: '4px', padding: '10px' }}>
                                               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2a4a', paddingBottom: '5px', marginBottom: '5px' }}>
                                                   <span style={{ color: '#88aaff', fontWeight: 'bold' }}>Para: {msg.to === 'all' ? 'Todos los miembros' : msg.to}</span>
                                                   <span style={{ color: '#555', fontSize: '0.8rem' }}>{msg.date}</span>
                                               </div>
                                               <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Asunto: {msg.subject}</div>
                                               <div style={{ color: '#aaa', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                       )}

                       {msgTab === 'compose' && (
                           <form onSubmit={(e) => {
                               e.preventDefault();
                               if (!draftSubject || !draftBody) return alert('El mensaje y el asunto no pueden estar vacíos.');
                               
                               const newMsg = {
                                   id: Date.now(),
                                   from: 'PILOTO_ESTELAR',
                                   to: draftTo,
                                   subject: draftSubject,
                                   body: draftBody,
                                   date: new Date().toLocaleString()
                               };
                               setClan({ ...clan, messages: [...(clan.messages || []), newMsg] });
                               setDraftSubject('');
                               setDraftBody('');
                               setMsgTab('sent');
                           }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                               <div>
                                   <label style={{ display: 'block', color: '#ffcc00', marginBottom: '5px', fontSize: '0.85rem' }}>Destinatario:</label>
                                   <select value={draftTo} onChange={e => setDraftTo(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', outline: 'none' }}>
                                       <option value="all">TODOS LOS MIEMBROS DEL CLAN</option>
                                       {(clan.members && clan.members.length > 0 ? clan.members : [{name: clan.leader || 'PILOTO_ESTELAR'}]).map((m, i) => (
                                           <option key={i} value={m.name}>{m.name}</option>
                                       ))}
                                   </select>
                               </div>
                               <div>
                                   <label style={{ display: 'block', color: '#ffcc00', marginBottom: '5px', fontSize: '0.85rem' }}>Asunto:</label>
                                   <input type="text" value={draftSubject} onChange={e => setDraftSubject(e.target.value)} placeholder="Escribe el asunto del mensaje..." style={{ width: '100%', padding: '10px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', outline: 'none' }} required />
                               </div>
                               <div>
                                   <label style={{ display: 'block', color: '#ffcc00', marginBottom: '5px', fontSize: '0.85rem' }}>Mensaje:</label>
                                   <textarea value={draftBody} onChange={e => setDraftBody(e.target.value)} placeholder="Redacta las órdenes o mensajes aquí..." style={{ width: '100%', padding: '10px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', height: '150px', resize: 'vertical', outline: 'none' }} required />
                               </div>
                               <button type="submit" style={{ background: '#00cc66', color: '#000', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}>ENVIAR TRANSMISIÓN</button>
                           </form>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'admin' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>Administración del Clan</h3>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {/* Recuadro Estado de Cuenta */}
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a' }}>
                            <h4 style={{ color: '#00cc66', borderBottom: '1px solid #334466', paddingBottom: '10px', marginTop: 0 }}>Tesorería del Clan</h4>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                               <span style={{ color: '#888', fontSize: '0.9rem' }}>Estado de cuenta:</span>
                               <span style={{ color: '#fff', fontWeight: 'bold' }}>{(clan.balance || 0).toLocaleString()} CR</span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', alignItems: 'center' }}>
                               <span style={{ color: '#888', fontSize: '0.9rem' }}>Tasa de impuestos:</span>
                               <select 
                                   value={clan.taxRate || 0}
                                   onChange={(e) => setClan({ ...clan, taxRate: parseInt(e.target.value) })}
                                   style={{ background: '#0a0f1a', color: '#00ffcc', border: '1px solid #334466', padding: '5px', borderRadius: '4px', outline: 'none' }}
                               >
                                  {[0,1,2,3,4,5].map(rate => (
                                      <option key={rate} value={rate}>{rate}%</option>
                                  ))}
                               </select>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                               <span style={{ color: '#888', fontSize: '0.9rem' }}>Ingresos / Día (Estimado):</span>
                               <span style={{ color: '#00aaff', fontWeight: 'bold' }}>+{((clan.members && clan.members.length > 0 ? clan.members.length : 1) * 10000 * ((clan.taxRate || 0) / 100)).toLocaleString()} CR</span>
                            </div>
                        </div>

                        {/* Recuadro Detalles de Aporte */}
                        <div style={{ flex: 1.2, background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', overflowY: 'auto', maxHeight: '250px' }}>
                            <h4 style={{ color: '#ffcc00', borderBottom: '1px solid #334466', paddingBottom: '10px', marginTop: 0 }}>Aportes por Miembro</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ color: '#888', fontSize: '0.8rem' }}>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Piloto</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Aporte Diario</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Total Aportado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(clan.members && clan.members.length > 0 ? clan.members : [{ name: clan.leader || 'PILOTO_ESTELAR', contribution: 0 }]).map((m, i) => {
                                        const estimatedContrib = 10000 * ((clan.taxRate || 0) / 100);
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '8px', color: '#fff', fontSize: '0.85rem' }}>{m.name}</td>
                                                <td style={{ padding: '8px', color: '#00aaff', fontSize: '0.85rem' }}>{estimatedContrib.toLocaleString()} CR</td>
                                                <td style={{ padding: '8px', color: '#00cc66', fontSize: '0.85rem', fontWeight: 'bold' }}>{m.contribution ? m.contribution.toLocaleString() : 0} CR</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ marginTop: '10px', padding: '20px', border: '1px solid #ff336633', background: 'rgba(255, 51, 102, 0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <h4 style={{ color: '#ff3366', margin: '0 0 5px 0' }}>Zona de Peligro</h4>
                           <div style={{ color: '#888', fontSize: '0.85rem' }}>Al abandonar el clan perderás todos tus aportes y permisos administrativos.</div>
                        </div>
                        <button 
                            onClick={() => {
                              if(window.confirm('ALERTA: ¿Estás seguro de que deseas disolver / abandonar el clan? Se perderá todo el progreso.')) {
                                 setClan(null);
                              }
                            }}
                            style={{ background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.3s' }}
                            onMouseOver={e => { e.target.style.background = '#ff3366'; e.target.style.color = '#fff'; }}
                            onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ff3366'; }}
                        >
                            Abandonar Clan
                        </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </>
        ) : (
          <div className="dashboard-panel" style={{ maxWidth: '600px', width: '100%', margin: 'auto' }}>
            <div className="panel-header">SISTEMA DE CLANES</div>
            <div className="panel-content" style={{ padding: '40px 30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ color: '#00ffcc', marginBottom: '10px', fontSize: '1.5rem' }}>Funda tu propio Clan</h3>
                <p style={{ color: '#88aaff', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Establece una base de operaciones y muestra tu sigla en toda la galaxia.
                </p>
              </div>

              <form onSubmit={handleCreateClan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffcc00', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Sigla del Clan (2-4 caracteres)</label>
                  <input 
                    type="text" 
                    value={tag} 
                    onChange={e => setTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} 
                    maxLength={4}
                    placeholder="STAR"
                    style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid #334466', color: 'white', borderRadius: '4px', fontSize: '1.2rem', textTransform: 'uppercase', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#ffcc00', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre Completo</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    maxLength={20}
                    placeholder="Ej. Starfleet Academy"
                    style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid #334466', color: 'white', borderRadius: '4px', fontSize: '1.1rem', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '4px', border: '1px solid #1a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ color: '#88aaff', fontSize: '0.9rem' }}>Costo de fundación:</span>
                  <span style={{ color: credits >= CLAN_COST ? '#00ffcc' : '#ff3366', fontWeight: 'bold', fontSize: '1.3rem' }}>
                    {CLAN_COST.toLocaleString()} CR
                  </span>
                </div>

                <button 
                  type="submit" 
                  disabled={credits < CLAN_COST || tag.length < 2 || name.length < 4}
                  className="buy-button"
                  style={{ 
                    background: credits >= CLAN_COST && tag.length >= 2 && name.length >= 4 ? 'linear-gradient(to bottom, #00ffcc, #0088aa)' : '#333', 
                    color: credits >= CLAN_COST && tag.length >= 2 && name.length >= 4 ? '#000' : '#888',
                    marginTop: '10px'
                  }}
                >
                  FUNDAR CLAN
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Clan;
