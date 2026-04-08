import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';

const Clan = ({ credits, paladio, level, xp, setCredits, clan, setClan, user, onBack, onNavigate }) => {
  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [editMode, setEditMode] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [msgTab, setMsgTab] = useState('inbox');
  const [draftTo, setDraftTo] = useState('all');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [clanList, setClanList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([]);
  const [donationAmounts, setDonationAmounts] = useState({});
  const [clanLogs, setClanLogs] = useState([]);
  const CLAN_COST = 0;
  const API_URL = 'http://localhost:8000/api';

  const currentUserMember = clan?.members?.find(m => m.name === user.username);
  const myRole = currentUserMember?.role || 'Novato';
  const canEdit = ['Líder', 'Oficial'].includes(myRole);

  React.useEffect(() => {
    if (!clan) {
      fetchClans();
    }
  }, [clan]);

  const fetchClans = async (search = '') => {
    try {
      const resp = await fetch(`${API_URL}/clans?search=${search}`);
      const data = await resp.json();
      setClanList(data.clans || []);
    } catch (e) {
      console.error("Error fetching clans:", e);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${API_URL}/messages?username=${user.username}`);
      if (resp.ok) {
        const data = await resp.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    }
  };

  const markMessageRead = async (msgId) => {
    try {
      await fetch(`${API_URL}/messages/read/${msgId}`, { method: 'POST' });
      fetchMessages();
    } catch (e) {
      console.error("Error marking msg read:", e);
    }
  };

  const fetchClanData = async () => {
    if (!user) return;
    fetchMessages(); // También refrescamos mensajes al pedir data de clan
    try {
      const resp = await fetch(`${API_URL}/clan/my?username=${user.username}`);
      if (resp.ok) {
        const data = await resp.json();
        setClan(data.clan);
      }
    } catch (e) {
      console.error("Error fetching my clan data:", e);
    }
  };

  const handleCreateClan = async (e) => {
    e.preventDefault();
    if (tag.length < 2 || tag.length > 4) {
      alert("La sigla del clan debe tener entre 2 y 4 caracteres.");
      return;
    }
    if (name.length < 4) {
      alert("El nombre del clan debe tener al menos 4 caracteres.");
      return;
    }
    const cost = 0; // CLAN_COST
    if (credits < cost) {
      alert(`No tienes suficientes créditos.`);
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/clans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: tag.toUpperCase(),
          name,
          leader: user ? user.username : 'PILOTO_ESTELAR'
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert(err.detail || "Error al fundar el clan.");
        return;
      }

      setCredits(prev => prev - cost);
      fetchClanData();
      alert("¡Clan fundado exitosamente!");
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor.");
    }
  };

  const handleJoinClan = async (clanTag) => {
    try {
      const resp = await fetch(`${API_URL}/clans/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          clan_tag: clanTag
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setClan(data.clan);
        alert(`Te has unido al clan [${clanTag}] correctamente.`);
      } else {
        const data = await resp.json();
        alert(data.detail || "Error al unirse.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al unirse.");
    }
  };

  React.useEffect(() => {
    // Primero, si estamos en clan, refrescamos al montar
    if (clan) {
      fetchClanData();
    }
    
    // Polling cada 20 segundos
    const interval = setInterval(() => {
      fetchClanData();
    }, 20000);

    return () => clearInterval(interval);
  }, [user.username]);

  const handleLeaveClan = async () => {
    try {
      const resp = await fetch(`${API_URL}/clans/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (resp.ok) {
        const data = await resp.json();
        setClan(null);
        alert(data.message || "Has abandonado el clan.");
      } else {
        const error = await resp.json();
        alert(error.detail || "Error al abandonar el clan.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    }
  };

  const handleKickMember = async (targetUsername) => {
    if(!window.confirm(`¿Seguro que deseas expulsar a ${targetUsername} del clan?`)) return;
    try {
      const resp = await fetch(`${API_URL}/clans/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, target_username: targetUsername })
      });
      if (resp.ok) {
        fetchClanData();
        alert(`Has expulsado a ${targetUsername}.`);
      } else {
        const error = await resp.json();
        alert(error.detail || "Error al expulsar al miembro.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    }
  };

  const handleUpdateTax = async (newRate) => {
    try {
      const resp = await fetch(`${API_URL}/clans/tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clan_tag: clan.tag,
          tax_rate: parseFloat(newRate)
        })
      });

      if (resp.ok) {
        setClan({ ...clan, tax_rate: newRate });
      } else {
        const err = await resp.json();
        alert(err.detail || "Error al actualizar la tasa de impuestos.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al servidor.");
    }
  };

  const handleDonateMember = async (targetUsername) => {
    const amount = donationAmounts[targetUsername];
    if (!amount || amount <= 0) {
      alert("Ingresa una cantidad válida para donar.");
      return;
    }

    if (amount > clan.credits) {
      alert("No hay suficientes créditos en la tesorería del clan.");
      return;
    }

    if (!window.confirm(`¿Seguro que deseas donar ${amount.toLocaleString()} CR a ${targetUsername}?`)) return;

    try {
      const resp = await fetch(`${API_URL}/clans/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clan_tag: clan.tag,
          target_username: targetUsername,
          amount: parseInt(amount)
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setClan({ ...clan, credits: data.new_clan_credits });
        setDonationAmounts({ ...donationAmounts, [targetUsername]: '' });
        alert(`Has donado ${amount.toLocaleString()} CR a ${targetUsername} con éxito.`);
      } else {
        const err = await resp.json();
        alert(err.detail || "Error al realizar la donación.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al servidor.");
    }
  };

  const fetchClanLogs = async () => {
    try {
      const resp = await fetch(`${API_URL}/clans/logs?clan_tag=${clan.tag}`);
      if (resp.ok) {
        const data = await resp.json();
        setClanLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && clan) {
      fetchClanLogs();
    }
  }, [activeTab, clan]);

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
            <div className="dashboard-panel" style={{ flex: 1, border: 'none', borderRadius: 0, overflow: 'hidden' }}>
              <div className="panel-header">PANEL DEL CLAN</div>
              <div className="panel-content" style={{ overflowY: 'auto' }}>
                
                {activeTab === 'summary' && (
                  <div className="clan-summary-wrapper">
                    
                    {/* Top Row: Info Table and Logo */}
                    <div className="clan-info-row">
                      
                      {/* Info Table */}
                      <div className="clan-info-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Información del clan</span>
                          {canEdit && (
                            editMode === 'info' ? (
                                <span>
                                   <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '10px' }} onClick={() => { setClan({...clan, tag: editValues.tag.toUpperCase(), name: editValues.name}); setEditMode(null); }}>✔ guardar</span>
                                   <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖ cancelar</span>
                                </span>
                            ) : (
                                <span style={{ color: '#88aaff', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => {setEditMode('info'); setEditValues({tag: clan.tag, name: clan.name})}}>✎ editar</span>
                            )
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
                          <div style={{ color: '#ffcc00' }}>{clan.leader || (user ? user.username : 'PILOTO_ESTELAR')}</div>
                          
                          <div style={{ color: '#888' }}>Nº de miembros:</div>
                          <div style={{ color: '#fff' }}>{clan.members ? clan.members.length : 1}</div>
                          
                          <div style={{ color: '#888' }}>Posición del clan:</div>
                          <div style={{ color: '#fff' }}>0</div>
                          
                          <div style={{ color: '#888' }}>Afiliación a empresa:</div>
                          <div style={{ color: '#fff' }}>Todo</div>
                          
                          <div style={{ color: '#888' }}>Tasa de impuestos:</div>
                          <div style={{ color: '#fff' }}>{clan.tax_rate || 0}% ({ ((clan.members || []).reduce((sum, m) => sum + (m.credits || 0), 0) * ((clan.tax_rate || 0) / 100)).toLocaleString() } CR diarios)</div>
                          
                          <div style={{ color: '#888' }}>Estado de reclutamiento:</div>
                          <div style={{ color: '#00ffcc' }}>Reclutando</div>
                        </div>
                      </div>
                      
                      {/* Logo Box */}
                      <div className="clan-logo-card">
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                          <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '0.8rem' }}>Logo</span>
                          {canEdit && (
                            editMode === 'logo' ? (
                               <span>
                                 <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '5px' }} onClick={() => {setClan({...clan, logo: editValues.logo}); setEditMode(null)}}>✔</span>
                                 <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖</span>
                               </span>
                            ) : (
                               <span style={{ color: '#88aaff', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => {setEditMode('logo'); setEditValues({logo: clan.logo || ''})}}>✎</span>
                            )
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
                    <div className="clan-text-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Texto del clan</span>
                        {canEdit && (
                          editMode === 'text' ? (
                             <span>
                               <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '10px' }} onClick={() => {setClan({...clan, description: editValues.text}); setEditMode(null)}}>✔ guardar</span>
                               <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖ cancelar</span>
                             </span>
                          ) : (
                             <span style={{ color: '#88aaff', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => {setEditMode('text'); setEditValues({text: clan.description || ''})}}>✎ editar</span>
                          )
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
                    <div className="clan-text-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Novedades / Información</span>
                        {canEdit && (
                          editMode === 'news' ? (
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
                          )
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
                  <div className="clan-members-view">
                    <h3 style={{ color: '#00ffcc', marginBottom: '15px' }}>Tripulación del Clan</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#888', fontSize: '0.9rem' }}>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Miembro / Piloto</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Experiencia</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Ingreso</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Rango</th>
                                {canEdit && <th style={{ padding: '12px', borderBottom: '1px solid #334466' }}>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {(clan.members && clan.members.length > 0 ? clan.members : [
                            { name: clan.leader || (user ? user.username : 'PILOTO_ESTELAR'), role: 'Líder', joined: clan.created_at || new Date().toLocaleDateString(), xp: xp }
                        ]).map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', color: '#fff', fontSize: '0.9rem' }}>{m.name}</td>
                                    <td style={{ padding: '12px', color: '#00cc66', fontSize: '0.9rem' }}>{m.xp ? m.xp.toLocaleString() : 0} XP</td>
                                    <td style={{ padding: '12px', color: '#888', fontSize: '0.9rem' }}>{m.joined}</td>
                                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ 
                                                color: m.role === 'Líder' ? '#ffcc00' : (m.role === 'Novato' ? '#aaa' : (m.role === 'Oficial' ? '#00ffcc' : '#88aaff')), 
                                                fontWeight: m.role === 'Líder' ? 'bold' : 'normal',
                                                fontSize: '0.85rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                minWidth: '70px'
                                            }}>
                                                {m.role}
                                            </span>
                                            
                                            {canEdit && m.role !== 'Líder' && (
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
                                                        background: 'rgba(0,255,204,0.1)', 
                                                        color: '#00ffcc', 
                                                        border: '1px solid #00ffcc44', 
                                                        padding: '2px 5px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        outline: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="Oficial" style={{ background: '#0a0f1a' }}>Oficial</option>
                                                    <option value="Miembro" style={{ background: '#0a0f1a' }}>Miembro</option>
                                                    <option value="Novato" style={{ background: '#0a0f1a' }}>Novato</option>
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                    {canEdit && (
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {m.name !== user.username && m.role !== 'Líder' && (
                                                <button 
                                                    onClick={() => handleKickMember(m.name)}
                                                    style={{ background: 'rgba(255,51,102,0.1)', color: '#ff3366', border: '1px solid #ff336644', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                                >
                                                    EXPULSAR
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                )}

                {['company', 'station'].includes(activeTab) && (
                  <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid #1a2a4a' }}>
                    <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '20px' }}>🚧</div>
                    <h3 style={{ color: '#88aaff', letterSpacing: '2px' }}>MÓDULO EN CONSTRUCCIÓN</h3>
                    <p style={{ color: '#666' }}>Esta sección estará disponible en futuras actualizaciones.</p>
                  </div>
                )}

                {activeTab === 'diplomacy' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>Relaciones Diplomáticas</h3>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {/* Send Request Panel */}
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a' }}>
                            {canEdit && (
                             <>
                             <h4 style={{ color: '#ffcc00', borderBottom: '1px solid #334466', paddingBottom: '10px', marginTop: 0 }}>Gestionar Diplomacia</h4>
                             
                             <form onSubmit={(e) => {
                                 e.preventDefault();
                                 if(!editValues.dipTag) return alert('Debes ingresar la sigla de un clan.');
                                 
                                 const tagToContact = editValues.dipTag.toUpperCase();
                                 if(tagToContact === clan.tag) return alert('No puedes interactuar diplomáticamente con tu propio clan.');

                                 const currentDiplomacy = clan.diplomacy || { alliances: [], wars: [], pending: [] };
                                 
                                 // Revisar si ya existe una relación
                                 if (currentDiplomacy.alliances.find(a => a.tag === tagToContact)) return alert('Ya tienes una alianza o PNA con este clan.');
                                 if (currentDiplomacy.wars.find(w => w.tag === tagToContact)) return alert('Ya estás en guerra con este clan.');
                                 if (currentDiplomacy.pending.find(p => p.tag === tagToContact)) return alert('Ya hay una petición pendiente con este clan.');

                                 const newReq = {
                                     id: Date.now(),
                                     tag: tagToContact,
                                     type: editValues.dipType || 'alliance',
                                     date: new Date().toLocaleDateString(),
                                     status: 'Pendiente'
                                 };
                                 
                                 if (newReq.type === 'war') {
                                     setClan({
                                         ...clan,
                                         diplomacy: {
                                             ...currentDiplomacy,
                                             wars: [{tag: newReq.tag, date: newReq.date}, ...currentDiplomacy.wars]
                                         }
                                     });
                                     alert(`Se ha declarado la guerra al clan [${newReq.tag}]`);
                                 } else {
                                     setClan({
                                         ...clan,
                                         diplomacy: {
                                             ...currentDiplomacy,
                                             pending: [newReq, ...currentDiplomacy.pending]
                                         }
                                     });
                                     alert(`Petición diplomática enviada a [${newReq.tag}]`);
                                 }
                                 
                                 setEditValues({...editValues, dipTag: ''});
                             }} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                 <div>
                                     <label style={{ display: 'block', color: '#88aaff', marginBottom: '5px', fontSize: '0.85rem' }}>Sigla del Clan a Contactar:</label>
                                     <input 
                                         type="text" 
                                         maxLength={4}
                                         value={editValues.dipTag || ''} 
                                         onChange={e => setEditValues({...editValues, dipTag: e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0,4)})} 
                                         placeholder="Ej. STAR" 
                                         style={{ width: '100%', padding: '10px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', outline: 'none', textTransform: 'uppercase' }} 
                                     />
                                 </div>
                                 <div>
                                     <label style={{ display: 'block', color: '#88aaff', marginBottom: '5px', fontSize: '0.85rem' }}>Tipo de Relación:</label>
                                     <select 
                                         value={editValues.dipType || 'alliance'} 
                                         onChange={e => setEditValues({...editValues, dipType: e.target.value})} 
                                         style={{ width: '100%', padding: '10px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', outline: 'none' }}
                                     >
                                         <option value="alliance" style={{ color: '#00cc66' }}>Proponer Alianza</option>
                                         <option value="pna" style={{ color: '#00aaff' }}>Pacto de No Agresión (PNA)</option>
                                         <option value="war" style={{ color: '#ff3366' }}>Declarar Guerra</option>
                                     </select>
                                 </div>
                                 <button type="submit" style={{ background: ((editValues.dipType || 'alliance') === 'war' ? '#ff3366' : '#00cc66'), color: '#000', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}>
                                     {(editValues.dipType || 'alliance') === 'war' ? 'DECLARAR GUERRA' : 'ENVIAR PROPUESTA'}
                                 </button>
                             </form>
                             </>
                            )}
                        </div>

                        {/* Current Relations Panel */}
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', flex: 1 }}>
                                <h4 style={{ color: '#00cc66', marginTop: 0, marginBottom: '10px' }}>Alianzas / PNA Activos</h4>
                                {(clan.diplomacy?.alliances?.length) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {clan.diplomacy.alliances.map((all, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 204, 102, 0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #00cc66' }}>
                                                <div>
                                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>[{all.tag}]</span>
                                                    <span style={{ color: '#00cc66', fontSize: '0.85rem', marginLeft: '8px' }}>{all.type === 'pna' ? 'PNA' : 'Alianza'}</span>
                                                    <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '3px' }}>Desde: {all.date}</div>
                                                </div>
                                                {canEdit && (
                                                  <button onClick={() => {
                                                      if(window.confirm(`¿Seguro que deseas romper la ${all.type === 'pna' ? 'PNA' : 'Alianza'} con [${all.tag}]?`)) {
                                                          const updatedAlliances = clan.diplomacy.alliances.filter(a => a.tag !== all.tag);
                                                          setClan({ ...clan, diplomacy: { ...clan.diplomacy, alliances: updatedAlliances }});
                                                      }
                                                  }} style={{ background: 'transparent', color: '#ff3366', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>Romper</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay alianzas activas.</div>
                                )}
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', flex: 1 }}>
                                <h4 style={{ color: '#ff3366', marginTop: 0, marginBottom: '10px' }}>Guerras Activas</h4>
                                {(clan.diplomacy?.wars?.length) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {clan.diplomacy.wars.map((war, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 51, 102, 0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #ff3366' }}>
                                                <div>
                                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>[{war.tag}]</span>
                                                    <span style={{ color: '#ff3366', fontSize: '0.85rem', marginLeft: '8px' }}>Guerra</span>
                                                    <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '3px' }}>Desde: {war.date}</div>
                                                </div>
                                                {canEdit && (
                                                  <button onClick={() => {
                                                      if(window.confirm(`¿Terminar la guerra y ofrecer paz a [${war.tag}]?`)) {
                                                          const updatedWars = clan.diplomacy.wars.filter(w => w.tag !== war.tag);
                                                          setClan({ ...clan, diplomacy: { ...clan.diplomacy, wars: updatedWars }});
                                                      }
                                                  }} style={{ background: 'transparent', color: '#00cc66', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>Paz</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay guerras activas.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pending Requests */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ color: '#88aaff', marginTop: 0, borderBottom: '1px solid #334466', paddingBottom: '10px' }}>Peticiones Pendientes</h4>
                        {(clan.diplomacy?.pending?.length) ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ color: '#888', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Sigla Destino</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Tipo</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Fecha</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Estado</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clan.diplomacy.pending.map((req, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px', color: '#fff', fontWeight: 'bold' }}>[{req.tag}]</td>
                                            <td style={{ padding: '8px', color: req.type === 'pna' ? '#00aaff' : '#00cc66' }}>
                                                {req.type === 'pna' ? 'Pacto de No Agresión' : 'Alianza'}
                                            </td>
                                            <td style={{ padding: '8px', color: '#888', fontSize: '0.85rem' }}>{req.date}</td>
                                            <td style={{ padding: '8px', color: '#ffcc00', fontSize: '0.85rem' }}>{req.status}</td>
                                            <td style={{ padding: '8px', display: 'flex', gap: '5px' }}>
                                                {canEdit && (
                                                    <>
                                                    {/* Demo Accept Button (Local Mock) */}
                                                    <button onClick={() => {
                                                        const updatedPending = clan.diplomacy.pending.filter(p => p.id !== req.id);
                                                        setClan({
                                                            ...clan,
                                                            diplomacy: {
                                                                ...clan.diplomacy,
                                                                pending: updatedPending,
                                                                alliances: [{tag: req.tag, type: req.type, date: new Date().toLocaleDateString()}, ...(clan.diplomacy.alliances || [])]
                                                            }
                                                        });
                                                    }} style={{ background: '#00cc66', color: '#000', border: '1px solid #00cc66', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', outline: 'none', fontWeight: 'bold' }} title="Simular que el otro clan acepta (Debug)">
                                                        ✓ Mock Aceptar
                                                    </button>

                                                    <button onClick={() => {
                                                        const updatedPending = clan.diplomacy.pending.filter(p => p.id !== req.id);
                                                        setClan({
                                                            ...clan,
                                                            diplomacy: {
                                                                ...clan.diplomacy,
                                                                pending: updatedPending
                                                            }
                                                        });
                                                    }} style={{ background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', outline: 'none' }}>
                                                        Cancelar
                                                    </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No hay peticiones enviadas ni recibidas.</div>
                        )}
                    </div>
                  </div>
                )}

                {activeTab === 'msg' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>Comunicaciones del Pilloto</h3>
                    
                    <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #1a2a4a', paddingBottom: '10px' }}>
                       <button onClick={() => setMsgTab('inbox')} style={{ background: msgTab === 'inbox' ? '#1a253a' : 'transparent', color: msgTab === 'inbox' ? '#00ffcc' : '#88aaff', border: '1px solid #334466', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Bandeja de Entrada</button>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', minHeight: '300px' }}>
                       {msgTab === 'inbox' && (
                           <div>
                               <h4 style={{ color: '#88aaff', marginTop: 0 }}>Caja de Entrada</h4>
                               {messages.length === 0 ? (
                                   <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>No tienes mensajes nuevos.</div>
                               ) : (
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                       {messages.map((msg, idx) => (
                                           <div 
                                               key={idx} 
                                               onClick={() => !msg.read && markMessageRead(msg.id)}
                                               style={{ 
                                                   background: msg.read ? 'rgba(255,255,255,0.02)' : 'rgba(0,170,255,0.05)', 
                                                   border: msg.read ? '1px solid #334466' : '1px solid #00aaff', 
                                                   borderRadius: '4px', 
                                                   padding: '10px',
                                                   cursor: 'pointer'
                                               }}
                                           >
                                               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2a4a', paddingBottom: '5px', marginBottom: '5px' }}>
                                                   <span style={{ color: msg.sender === 'SYSTEM' ? '#ff3366' : '#00ffcc', fontWeight: 'bold' }}>
                                                       De: {msg.sender} {msg.sender === 'SYSTEM' && '🛡️'}
                                                   </span>
                                                   <span style={{ color: '#555', fontSize: '0.8rem' }}>{msg.date}</span>
                                               </div>
                                               <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Asunto: {msg.subject}</div>
                                               <div style={{ color: msg.read ? '#aaa' : '#fff', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
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
                               <span style={{ color: '#fff', fontWeight: 'bold' }}>{(clan.credits || 0).toLocaleString()} CR</span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', alignItems: 'center' }}>
                               <span style={{ color: '#888', fontSize: '0.9rem' }}>Tasa de impuestos:</span>
                               <select 
                                   value={clan.tax_rate || 0}
                                   disabled={!canEdit}
                                   onChange={(e) => handleUpdateTax(parseInt(e.target.value))}
                                   style={{ 
                                       background: '#0a0f1a', 
                                       color: '#00ffcc', 
                                       border: '1px solid #334466', 
                                       padding: '5px', 
                                       borderRadius: '4px', 
                                       outline: 'none',
                                       cursor: canEdit ? 'pointer' : 'default'
                                   }}
                               >
                                  {[0,1,2,3,4,5].map(rate => (
                                      <option key={rate} value={rate}>{rate}%</option>
                                  ))}
                               </select>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                               <span style={{ color: '#888', fontSize: '0.9rem' }}>Ingresos / Día (Estimado):</span>
                               <span style={{ color: '#00aaff', fontWeight: 'bold' }}>+{((clan.members && clan.members.length > 0 ? clan.members.length : 1) * 10000 * ((clan.tax_rate || 0) / 100)).toLocaleString()} CR</span>
                            </div>
                        </div>

                        {/* Recuadro Detalles de Aporte y Donación */}
                        <div style={{ flex: 1.5, background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a', overflowY: 'auto', maxHeight: '400px' }}>
                            <h4 style={{ color: '#ffcc00', borderBottom: '1px solid #334466', paddingBottom: '10px', marginTop: 0 }}>Gestión de Fondos por Miembro</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ color: '#888', fontSize: '0.8rem' }}>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Piloto</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Aporte Diario</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Total Aportado</th>
                                        {canEdit && <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Donar Credits</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(clan.members && clan.members.length > 0 ? clan.members : [{ name: clan.leader || (user ? user.username : 'PILOTO_ESTELAR'), contribution: 0, credits: credits }]).map((m, i) => {
                                        const actualContrib = (m.credits || 0) * ((clan.tax_rate || 0) / 100);
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '8px', color: '#fff', fontSize: '0.85rem' }}>{m.name}</td>
                                                <td style={{ padding: '8px', color: '#00aaff', fontSize: '0.85rem' }}>{parseInt(actualContrib).toLocaleString()} CR</td>
                                                <td style={{ padding: '8px', color: '#00cc66', fontSize: '0.85rem', fontWeight: 'bold' }}>{(m.credits || 0).toLocaleString()} CR (Banco)</td>
                                                {canEdit && (
                                                    <td style={{ padding: '8px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            placeholder="Monto..."
                                                            value={donationAmounts[m.name] || ''}
                                                            onChange={(e) => setDonationAmounts({ ...donationAmounts, [m.name]: e.target.value })}
                                                            style={{ width: '80px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', padding: '5px', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}
                                                        />
                                                        <button 
                                                            onClick={() => handleDonateMember(m.name)}
                                                            style={{ 
                                                                background: 'rgba(0, 255, 204, 0.1)', 
                                                                color: '#00ffcc', 
                                                                border: '1px solid #00ffcc44', 
                                                                padding: '5px 10px', 
                                                                borderRadius: '4px', 
                                                                fontSize: '0.75rem', 
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            DONAR
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Historial de Movimientos - Pantalla Completa abajo */}
                    <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '15px', border: '1px solid #1a2a4a' }}>
                        <h4 style={{ color: '#00ffcc', borderBottom: '1px solid #334466', paddingBottom: '10px', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
                            HISTORIAL DE MOVIMIENTOS
                            <button onClick={fetchClanLogs} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.8rem' }}>🔄 Refrescar</button>
                        </h4>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#0a101a', zIndex: 1 }}>
                                    <tr style={{ color: '#888', fontSize: '0.8rem' }}>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Fecha</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Tipo</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Descripción</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Piloto</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid #334466' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clanLogs.length > 0 ? clanLogs.map((log, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '8px', color: '#666' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ 
                                                    padding: '2px 6px', 
                                                    borderRadius: '3px', 
                                                    fontSize: '0.7rem', 
                                                    background: log.type === 'IMPUESTO' ? 'rgba(0,255,100,0.1)' : 'rgba(255,100,0,0.1)',
                                                    color: log.type === 'IMPUESTO' ? '#00ffcc' : '#ffaa00',
                                                    border: `1px solid ${log.type === 'IMPUESTO' ? '#00ffcc44' : '#ffaa0044'}`
                                                }}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', color: '#ccc' }}>{log.description}</td>
                                            <td style={{ padding: '8px', color: '#fff' }}>{log.username}</td>
                                            <td style={{ 
                                                padding: '8px', 
                                                fontWeight: 'bold',
                                                color: log.type === 'IMPUESTO' ? '#00ffcc' : '#ff6666'
                                            }}>
                                                {log.type === 'IMPUESTO' ? '+' : '-'}{log.amount.toLocaleString()} CR
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#555' }}>No hay movimientos registrados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ marginTop: '10px', padding: '20px', border: '1px solid #ff336633', background: 'rgba(255, 51, 102, 0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <h4 style={{ color: '#ff3366', margin: '0 0 5px 0' }}>Zona de Peligro</h4>
                           <div style={{ color: '#888', fontSize: '0.85rem' }}>
                               {myRole === 'Líder' 
                                   ? 'Como Líder, al eliminar el clan se disolverá la alianza y todos los miembros serán expulsados.' 
                                   : 'Al abandonar el clan perderás todos tus aportes y permisos administrativos.'}
                           </div>
                        </div>
                        <button 
                            onClick={async () => {
                                const action = myRole === 'Líder' ? 'ELIMINAR Y DISOLVER' : 'ABANDONAR';
                                if(window.confirm(`ALERTA: ¿Estás seguro de que deseas ${action} el clan? Esta acción es irreversible.`)) {
                                    handleLeaveClan();
                                }
                            }}
                            style={{ background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.3s' }}
                            onMouseOver={e => { e.target.style.background = '#ff3366'; e.target.style.color = '#fff'; }}
                            onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ff3366'; }}
                        >
                            {myRole === 'Líder' ? 'Eliminar Clan' : 'Abandonar Clan'}
                        </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', height: '100%' }}>
            
            {/* LADO IZQUIERDO: Fundar */}
            <div className="dashboard-panel" style={{ flex: 1 }}>
              <div className="panel-header">FUNDAR NUEVO CLAN</div>
              <div className="panel-content" style={{ padding: '25px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ color: '#88aaff', fontSize: '0.9rem' }}>Crea tu propia alianza estelar hoy mismo.</p>
                </div>

                <form onSubmit={handleCreateClan} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#ffcc00', marginBottom: '5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sigla (2-4)</label>
                    <input 
                      type="text" 
                      value={tag} 
                      onChange={e => setTag(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} 
                      maxLength={4}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid #334466', color: 'white', borderRadius: '4px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#ffcc00', marginBottom: '5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Nombre del Clan</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid #334466', color: 'white', borderRadius: '4px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '4px', border: '1px solid #1a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#88aaff', fontSize: '0.85rem' }}>Costo:</span>
                    <span style={{ color: credits >= CLAN_COST ? '#00ffcc' : '#ff3366', fontWeight: 'bold' }}>{CLAN_COST.toLocaleString()} CR</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={credits < CLAN_COST || tag.length < 2 || name.length < 4}
                    className="buy-button"
                    style={{ 
                      background: credits >= CLAN_COST && tag.length >= 2 && name.length >= 4 ? 'linear-gradient(to bottom, #00ffcc, #0088aa)' : '#333'
                    }}
                  >
                    FUNDAR CLAN
                  </button>
                </form>
              </div>
            </div>

            {/* LADO DERECHO: Explorar */}
            <div className="dashboard-panel" style={{ flex: 1.5 }}>
              <div className="panel-header">EXPLORAR ALIANZAS REGISTRADAS</div>
              <div className="panel-content" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ padding: '20px', borderBottom: '1px solid #1a2a4a', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Buscar por sigla o nombre..." 
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        fetchClans(e.target.value);
                      }}
                      style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid #334466', color: '#fff', borderRadius: '4px', outline: 'none' }}
                    />
                    <button style={{ background: '#334466', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '4px', cursor: 'pointer' }}>🔍</button>
                  </div>
                </div>

                <div style={{ overflowY: 'auto', maxHeight: '450px' }}>
                  {clanList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>No se encontraron clanes registrados.</div>
                  ) : (
                    clanList.map((cl, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '15px 25px', borderBottom: '1px solid #1a2a4a', transition: 'background 0.2s' }} className="clan-list-item">
                        <div style={{ width: '45px', height: '45px', background: '#0a0f1a', borderRadius: '4px', border: '1px solid #334466', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginRight: '20px' }}>
                          🛡️
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '1.1rem' }}>[{cl.tag}]</span>
                            <span style={{ color: '#fff' }}>{cl.name}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                            Líder: <span style={{ color: '#ffcc00' }}>{cl.leader}</span> • Miembros: <span style={{ color: '#fff' }}>{cl.members}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleJoinClan(cl.tag)}
                          style={{ background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 15px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          UNIRSE
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Clan;
