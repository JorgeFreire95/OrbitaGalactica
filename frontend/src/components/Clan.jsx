import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';

const Clan = ({ credits, paladio, level, xp, setCredits, clan, setClan, user, onBack, onNavigate }) => {
  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [selectedFaction, setSelectedFaction] = useState(user?.faction || 'MARS');
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
  const [clanApplications, setClanApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(null); // { tag, name }
  const [loading, setLoading] = useState(!clan);
  const CLAN_COST = 0;
  const API_URL = 'http://localhost:8000/api';

  const currentUserMember = clan?.members?.find(m => m.name === user.username);
  const myRole = currentUserMember?.role || 'Novato';
  const isLeader = clan?.leader === user?.username;
  const canEdit = isLeader || ['Líder', 'Oficial'].includes(myRole);
  
  // States para Diplomacia Interactiva
  const [allDetailedClans, setAllDetailedClans] = useState([]);
  const [diplomacy, setDiplomacy] = useState({ alliances: [], wars: [], pending: [] });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, clanTag: null, clanName: null });
  const [selectedClanDetails, setSelectedClanDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const getCompanyName = (f) => {
    if (f === 'MARS') return 'M.A.R.S.';
    if (f === 'MOON') return 'M.O.O.N.';
    if (f === 'PLUTO') return 'P.L.U.T.O.';
    return 'Multifacción';
  };

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!draftSubject || !draftBody) return alert('Por favor, completa el asunto y el mensaje.');
    
    try {
      const target = draftTo === 'all' ? `CLAN:${clan.tag}` : draftTo;
      const resp = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: user.username,
          receiver: target,
          subject: draftSubject,
          body: draftBody
        })
      });
      
      if (resp.ok) {
        // Notificación silenciosa o simplemente cambiar de tab
        setDraftSubject('');
        setDraftBody('');
        setMsgTab('inbox');
        fetchMessages();
      } else {
        alert('Error al enviar el mensaje.');
      }
    } catch (e) {
      alert('Error de conexión al enviar mensaje.');
    }
  };

  const fetchClanData = async (forceLoading = false) => {
    if (!user) return;
    // Solo mostrar loading si no hay datos previos del clan
    if (forceLoading || !clan) setLoading(true);
    fetchMessages(); 
    try {
      const resp = await fetch(`${API_URL}/clan/my?username=${user.username}`);
      if (resp.ok) {
        const data = await resp.json();
        setClan(data.clan);
      }
    } catch (e) {
      console.error("Error fetching my clan data:", e);
    } finally {
      setLoading(false);
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
          leader: user ? user.username : 'PILOTO_ESTELAR',
          faction: selectedFaction
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert(err.detail || "Error al fundar el clan.");
        return;
      }

      setCredits(prev => prev - cost);
      fetchClanData();
      setEditMode(null); // Salir de modo edición si aplica
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor.");
    }
  };

  const handleJoinClan = async (clanTag, isGated = false) => {
    if (isGated && !showJoinModal) {
        const targetClan = clanList.find(c => c.tag === clanTag);
        setShowJoinModal({ tag: clanTag, name: targetClan?.name || clanTag });
        return;
    }

    try {
      const resp = await fetch(`${API_URL}/clans/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username, 
          clan_tag: clanTag,
          message: joinMessage
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'joined') {
          setClan(data.clan);
        } else {
          // Si es una solicitud pendiente, podrías mostrar un pequeño toast o simplemente cerrar el modal
        }
        setShowJoinModal(null);
        setJoinMessage('');
      } else {
        const data = await resp.json();
        alert(data.detail || "Error al unirse.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al unirse.");
    }
  };

  const fetchApplications = async () => {
    if (!clan || !['Líder', 'Oficial'].includes(myRole)) return;
    setLoadingApps(true);
    try {
      const res = await fetch(`${API_URL}/clans/applications?clan_tag=${clan.tag}`);
      const data = await res.json();
      setClanApplications(data.applications || []);
    } catch (e) {
      console.error("Error fetching applications:", e);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleRespondApplication = async (requestId, response) => {
    try {
      const res = await fetch(`${API_URL}/clans/applications/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, response })
      });
      const data = await res.json();
      if (res.ok) {
        fetchApplications();
        if (response === 'accept') {
            fetchClanData(true);
        }
      } else {
        alert(data.detail);
      }
    } catch (e) {
      alert("Error al responder a la solicitud.");
    }
  };

  React.useEffect(() => {
    // Sincronización inmediata al entrar si hay un usuario
    if (user) {
      fetchClanData();
    }
    // El polling de 30s ahora es gestionado por App.jsx para evitar redundancia
    
    // Solo mantenemos un polling separado para MENSAJES ya que son locales a este componente
    const msgInterval = setInterval(fetchMessages, 30000);
    return () => clearInterval(msgInterval);
  }, [user.username]);

  const handleLeaveClan = async () => {
    try {
      const resp = await fetch(`${API_URL}/clans/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (resp.ok) {
        setClan(null);
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
          username: user.username,
          clan_tag: clan.tag,
          target_username: targetUsername,
          amount: parseInt(amount)
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setClan({ ...clan, credits: data.new_clan_credits });
        setDonationAmounts({ ...donationAmounts, [targetUsername]: '' });
      } else {
        const err = await resp.json();
        alert(err.detail || "Error al realizar la donación.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al servidor.");
    }
  };

  const handleUpdateClanMetadata = async (updates) => {
    try {
      // Prepare the data with defaults from current clan state
      const body = {
        old_tag: clan.tag,
        new_tag: updates.tag || clan.tag,
        name: updates.name || clan.name,
        description: updates.description !== undefined ? updates.description : clan.description,
        status: updates.status || clan.status || 'Reclutando',
        news: updates.news ? JSON.stringify(updates.news) : clan.news_json || '[]',
        logo: updates.logo !== undefined ? updates.logo : clan.logo,
        join_type: updates.join_type || clan.join_type || 'Abierto',
        faction: updates.faction || clan.faction || 'MARS'
      };

      const resp = await fetch(`${API_URL}/clans/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (resp.ok) {
        // Update local state with the same values
        setClan({ 
          ...clan, 
          tag: body.new_tag,
          name: body.name,
          description: body.description,
          status: body.status,
          join_type: body.join_type,
          news: updates.news || clan.news || [],
          logo: body.logo,
          faction: body.faction
        });
        setEditMode(null);
      } else {
        const err = await resp.json();
        alert(err.detail || "Error al actualizar la información.");
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

  const fetchDetailedClans = async () => {
      try {
          const resp = await fetch(`${API_URL}/clans/all`);
          if (resp.ok) {
              const data = await resp.json();
              setAllDetailedClans(data.clans || []);
          }
      } catch (err) { console.error(err); }
  };

  const fetchDiplomacyData = async () => {
      if (!clan) return;
      try {
          const resp = await fetch(`${API_URL}/clans/diplomacy?clan_tag=${clan.tag}`);
          if (resp.ok) {
              const data = await resp.json();
              setDiplomacy(data);
          }
      } catch (err) { console.error(err); }
  };

  const handleDiplomacyProposal = async (targetTag, type) => {
      if (targetTag === clan.tag) return alert("No puedes aliarte contigo mismo.");
      try {
          const resp = await fetch(`${API_URL}/clans/diplomacy/request`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sender_tag: clan.tag, receiver_tag: targetTag, type })
          });
          if (resp.ok) {
              fetchDiplomacyData();
          } else {
              const err = await resp.json();
              alert(err.detail || "Error al enviar propuesta.");
          }
    } catch (err) { alert("Error de conexión."); }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleShowClanDetails = async (clanTag) => {
    setLoadingDetails(true);
    try {
      const resp = await fetch(`${API_URL}/clans/details/${clanTag}`);
      if (resp.ok) {
        const data = await resp.json();
        setSelectedClanDetails(data);
      } else {
        const err = await resp.json();
        alert(err.detail || "Error al obtener detalles del clan.");
      }
    } catch (err) {
      alert("Error de conexión al servidor.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDiplomacyResponse = async (requestId, response) => {
      try {
          const resp = await fetch(`${API_URL}/clans/diplomacy/respond`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ request_id: requestId, response })
          });
          if (resp.ok) {
              fetchDiplomacyData();
          }
      } catch (err) { alert("Error de conexión."); }
  };

  useEffect(() => {
    if (activeTab === 'admin' && clan) {
      fetchClanLogs();
    }
    if (activeTab === 'requests' && clan) {
      fetchApplications();
    }
    if (activeTab === 'diplomacy' && clan) {
        fetchDetailedClans();
        fetchDiplomacyData();
    }
  }, [activeTab, clan]);

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const SIDEMENU = [
    { id: 'summary', label: 'INFORMACIÓN' },
    { id: 'members', label: 'MIEMBROS' },
    ...( (myRole === 'Líder' || myRole === 'Oficial') ? [{ id: 'requests', label: 'SOLICITUDES' }] : []),
    { id: 'admin', label: 'ADMINISTRACIÓN' },
    { id: 'msg', label: 'MENSAJES' },
    { id: 'diplomacy', label: 'DIPLOMACIA' },
    { id: 'company', label: 'EMPRESA' },
    { id: 'station', label: 'ESTACIÓN' },
  ];

  return (
    <div className="dashboard-container">
      <main className="shop-main-layout" style={{ margin: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1a2a4a' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
             <div className="loader-orbit" style={{ width: '50px', height: '50px', border: '3px solid transparent', borderTopColor: '#00ffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
             <div style={{ color: '#00ffff', fontFamily: 'Orbitron', fontSize: '1rem', letterSpacing: '2px' }}>SINCRONIZANDO DATOS DE CLAN...</div>
             <style>{`
               @keyframes spin { to { transform: rotate(360deg); } }
             `}</style>
          </div>
        ) : clan ? (
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
                                   <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '10px' }} onClick={() => handleUpdateClanMetadata({ tag: editValues.tag.toUpperCase(), name: editValues.name, status: editValues.status, join_type: editValues.join_type, faction: editValues.faction })}>✔ guardar</span>
                                   <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={() => setEditMode(null)}>✖ cancelar</span>
                                </span>
                            ) : (
                                <span style={{ color: '#88aaff', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => {setEditMode('info'); setEditValues({tag: clan.tag, name: clan.name, status: clan.status || 'Reclutando', join_type: clan.join_type || 'Abierto', faction: clan.faction || 'MARS'})}}>✎ editar</span>
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
                          <div style={{ color: clan?.members?.length >= 30 ? '#ff3366' : '#fff' }}>
                            {clan.members ? clan.members.length : 1} / 30
                          </div>
                          
                          <div style={{ color: '#888' }}>Posición del clan:</div>
                          <div style={{ color: '#00ffcc', fontWeight: 'bold' }}>#{clan.rank || 'N/A'}</div>
                          
                          <div style={{ color: '#888' }}>Afiliación a empresa:</div>
                          {editMode === 'info' ? (
                               <select 
                                 value={editValues.faction} 
                                 onChange={e => setEditValues({...editValues, faction: e.target.value})}
                                 style={{ background: '#0a0f1a', color: '#fff', border: '1px solid #334466', padding: '2px 5px', outline: 'none', cursor: 'pointer' }}
                               >
                                   <option value="MARS">M.A.R.S.</option>
                                   <option value="MOON">M.O.O.N.</option>
                                   <option value="PLUTO">P.L.U.T.O.</option>
                                   <option value="ALL">Multifacción</option>
                               </select>
                           ) : (
                               <div style={{ color: '#fff' }}>{getCompanyName(clan.faction)}</div>
                           )}
                          
                          <div style={{ color: '#888' }}>Tasa de impuestos:</div>
                          <div style={{ color: '#fff' }}>{clan.tax_rate || 0}% ({ Math.floor((clan.members || []).reduce((sum, m) => sum + (m.credits || 0), 0) * ((clan.tax_rate || 0) / 100)).toLocaleString() } CR diarios)</div>
                          
                          <div style={{ color: '#888' }}>Estado de reclutamiento:</div>
                          {editMode === 'info' ? (
                              <select 
                                value={editValues.status} 
                                onChange={e => setEditValues({...editValues, status: e.target.value})}
                                style={{ background: '#0a0f1a', color: '#00ffcc', border: '1px solid #334466', padding: '2px 5px', outline: 'none', cursor: 'pointer' }}
                              >
                                  <option value="Reclutando">Reclutando</option>
                                  <option value="Sin Cupo">Sin Cupo</option>
                              </select>
                          ) : (
                              <div style={{ color: '#00ffcc' }}>{clan.status || 'Reclutando'}</div>
                          )}

                          <div style={{ color: '#888' }}>Tipo de solicitud:</div>
                          {editMode === 'info' ? (
                              <select 
                                value={editValues.join_type} 
                                onChange={e => setEditValues({...editValues, join_type: e.target.value})}
                                style={{ background: '#0a0f1a', color: '#00ffcc', border: '1px solid #334466', padding: '2px 5px', outline: 'none', cursor: 'pointer' }}
                              >
                                  <option value="Abierto">Abierta (Directa)</option>
                                  <option value="Cerrado">Cerrada (Solicitud)</option>
                              </select>
                          ) : (
                              <div style={{ color: '#fff' }}>{clan.join_type || 'Abierta'}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Logo Box */}
                      <div className="clan-logo-card">
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334466', paddingBottom: '10px', marginBottom: '10px' }}>
                          <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '0.8rem' }}>Logo</span>
                          {canEdit && (
                            editMode === 'logo' ? (
                               <span>
                                 <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '5px' }} onClick={() => handleUpdateClanMetadata({ logo: editValues.logo })}>✔</span>
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
                                 <span style={{ color: '#00cc66', cursor: 'pointer', marginRight: '10px' }} onClick={() => handleUpdateClanMetadata({ description: editValues.text })}>✔ guardar</span>
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
                                     const newNews = [{date: new Date().toLocaleDateString(), text: editValues.news}, ...(clan.news || [])];
                                     handleUpdateClanMetadata({ news: newNews });
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
                        {Array.isArray(clan.news) && clan.news.length > 0 ? clan.news.map((n, i) => (
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', color: '#fff', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ color: '#00ffcc', margin: 0, fontFamily: 'Orbitron', fontSize: '1.4rem' }}>Centro de Diplomacia</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
                      
                      {/* SUB-PANEL: LISTA GLOBAL */}
                      <div className="diplomacy-panel" style={{ background: 'rgba(10, 20, 40, 0.7)', border: '1px solid #1a2a4a', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '15px', borderBottom: '1px solid #1a2a4a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ color: '#88aaff', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Lista Global de Clanes</span>
                          <input 
                            type="text" 
                            placeholder="Buscar clan..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', background: '#050a14', border: '1px solid #334466', padding: '8px', color: '#fff', borderRadius: '6px' }}
                          />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px', padding: '10px' }}>
                          {allDetailedClans.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.tag.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                            <div 
                              key={c.tag} 
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if(!canEdit) return;
                                if(c.tag === clan.tag) return; // Evitar autodiplomacia
                                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, clanTag: c.tag, clanName: c.name });
                              }}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', 
                                cursor: 'default', transition: 'background 0.2s', borderBottom: '1px solid rgba(26, 42, 74, 0.3)' 
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(0, 255, 204, 0.05)'}
                              onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                              <div style={{ width: '32px', height: '32px', background: '#1a2a4a', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                {c.logo ? <img src={c.logo} alt="" style={{ width: '100%', height: '100%' }} /> : c.tag}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{c.name} <span style={{ color: '#88aaff' }}>[{c.tag}]</span></div>
                                <div style={{ color: '#6688aa', fontSize: '0.75rem' }}>Líder: {c.leader} | {c.members} miembros</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: '10px', fontSize: '0.75rem', color: '#556688', textAlign: 'center' }}>
                          * Click derecho en un clan para interactuar
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* SUB-PANEL: SOLICITUDES PENDIENTES */}
                        {diplomacy.pending.length > 0 && (
                          <div className="diplomacy-panel" style={{ background: 'rgba(255, 204, 0, 0.05)', border: '1px solid #cc9900', borderRadius: '12px', padding: '15px' }}>
                            <h4 style={{ color: '#ffcc00', margin: '0 0 15px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', background: '#ffcc00', borderRadius: '50%' }}></span>
                                PETICIONES PENDIENTES
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {diplomacy.pending.map(p => (
                                <div key={p.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #332200' }}>
                                  <div>
                                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                                      {p.is_incoming ? (
                                        <>El clan <b style={{color: '#00ffcc'}}>[{p.sender}]</b> propone <b style={{textTransform: 'uppercase', color: p.type==='war'?'#ff3366':'#00cc66'}}>{p.type === 'war' ? 'Guerra' : p.type}</b></>
                                      ) : (
                                        <>Propuesta de <b style={{textTransform: 'uppercase'}}>{p.type}</b> enviada a <b style={{color: '#00ffcc'}}>[{p.receiver}]</b></>
                                      )}
                                    </div>
                                    <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px' }}>Fecha: {p.date}</div>
                                  </div>
                                  {p.is_incoming && canEdit && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button onClick={() => handleDiplomacyResponse(p.id, 'accept')} style={{ background: '#00cc66', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>ACEPTAR</button>
                                      <button onClick={() => handleDiplomacyResponse(p.id, 'reject')} style={{ background: '#ff3366', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>RECHAZAR</button>
                                    </div>
                                  )}
                                  {!p.is_incoming && (
                                    <span style={{ color: '#888', fontSize: '0.8rem', fontStyle: 'italic' }}>Esperando respuesta...</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SUB-PANEL: RELACIONES ACTIVAS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flex: 1 }}>
                          {/* ALIANZAS */}
                          <div className="diplomacy-panel" style={{ background: 'rgba(0, 204, 102, 0.05)', border: '1px solid #00cc66', borderRadius: '12px', padding: '15px' }}>
                            <h4 style={{ color: '#00cc66', margin: '0 0 12px 0', fontSize: '0.9rem' }}>ALIANZAS Y PNA</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {diplomacy.alliances.length > 0 ? diplomacy.alliances.map(a => (
                                <div key={a.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #00cc66' }}>
                                  <div style={{ color: '#fff', fontWeight: 'bold' }}>[{a.tag}]</div>
                                  <div style={{ color: '#00cc66', fontSize: '0.75rem', textTransform: 'uppercase' }}>{a.type}</div>
                                </div>
                              )) : <div style={{ color: '#555', fontSize: '0.8rem' }}>Sin alianzas activas.</div>}
                            </div>
                          </div>

                          {/* GUERRAS */}
                          <div className="diplomacy-panel" style={{ background: 'rgba(255, 51, 102, 0.05)', border: '1px solid #ff3366', borderRadius: '12px', padding: '15px' }}>
                            <h4 style={{ color: '#ff3366', margin: '0 0 12px 0', fontSize: '0.9rem' }}>GUERRAS ACTIVAS</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {diplomacy.wars.length > 0 ? diplomacy.wars.map(w => (
                                <div key={w.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #ff3366' }}>
                                  <div style={{ color: '#fff', fontWeight: 'bold' }}>[{w.tag}]</div>
                                  <div style={{ color: '#ff3366', fontSize: '0.75rem' }}>EN COMBATE</div>
                                </div>
                              )) : <div style={{ color: '#555', fontSize: '0.8rem' }}>Sin guerras activas.</div>}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'msg' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>Comunicaciones del Piloto</h3>
                    
                    <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #1a2a4a', paddingBottom: '10px' }}>
                       <button onClick={() => setMsgTab('inbox')} style={{ background: msgTab === 'inbox' ? '#1a253a' : 'transparent', color: msgTab === 'inbox' ? '#00ffcc' : '#88aaff', border: '1px solid #334466', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Bandeja de Entrada</button>
                       <button onClick={() => { setMsgTab('redactar'); setDraftTo('all'); }} style={{ background: msgTab === 'redactar' ? '#1a253a' : 'transparent', color: msgTab === 'redactar' ? '#00ffcc' : '#88aaff', border: '1px solid #334466', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Redactar</button>
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

                        {msgTab === 'redactar' && (
                            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                                <h4 style={{ color: '#00ffcc', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>NUEVO MENSAJE ESTELAR</h4>
                                <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: '#88aaff', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>DESTINATARIO</label>
                                        <select 
                                            value={draftTo}
                                            onChange={e => setDraftTo(e.target.value)}
                                            style={{ width: '100%', padding: '12px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', outline: 'none' }}
                                        >
                                            <option value="all">Todo el Clan (Circular)</option>
                                            {clan.members?.filter(m => m.name !== user.username).map(m => (
                                                <option key={m.name} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: '#88aaff', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>ASUNTO</label>
                                        <input 
                                            type="text"
                                            value={draftSubject}
                                            onChange={e => setDraftSubject(e.target.value)}
                                            placeholder="Escribe el asunto del mensaje..."
                                            style={{ width: '100%', padding: '12px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', outline: 'none' }}
                                            maxLength={50}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: '#88aaff', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>MENSAJE</label>
                                        <textarea 
                                            value={draftBody}
                                            onChange={e => setDraftBody(e.target.value)}
                                            placeholder="Escribe el contenido del mensaje aquí..."
                                            style={{ width: '100%', padding: '12px', background: '#0a0f1a', color: '#fff', border: '1px solid #334466', borderRadius: '4px', outline: 'none', height: '150px', resize: 'none' }}
                                        />
                                    </div>
                                    <button type="submit" className="buy-button" style={{ marginTop: '10px' }}>
                                        ENVIAR MENSAJE
                                    </button>
                                </form>
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
                               <span style={{ color: '#00aaff', fontWeight: 'bold' }}>+{Math.floor((clan.members && clan.members.length > 0 ? clan.members.length : 1) * 10000 * ((clan.tax_rate || 0) / 100)).toLocaleString()} CR</span>
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
                {activeTab === 'requests' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                        <h3 style={{ color: '#00ffcc', borderBottom: '1px solid #334466', paddingBottom: '10px' }}>SOLICITUDES DE INGRESO</h3>
                        {loadingApps ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Cargando solicitudes...</div>
                        ) : clanApplications.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                                {clanApplications.map(app => (
                                    <div key={app.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1a2a4a', borderRadius: '8px', padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '1.1rem' }}>{app.username}</span>
                                            <span style={{ color: '#666', fontSize: '0.8rem' }}>{new Date(app.date).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', marginBottom: '15px', minHeight: '60px', fontStyle: 'italic', fontSize: '0.9rem', color: '#ccc' }}>
                                            "{app.message || 'Sin mensaje adicional.'}"
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => handleRespondApplication(app.id, 'accept')}
                                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #00ffcc', background: 'rgba(0,255,204,0.1)', color: '#00ffcc', cursor: 'pointer', fontWeight: 'bold' }}
                                            >ACEPTAR</button>
                                            <button 
                                                onClick={() => handleRespondApplication(app.id, 'reject')}
                                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ff3366', background: 'rgba(255,51,102,0.1)', color: '#ff3366', cursor: 'pointer', fontWeight: 'bold' }}
                                            >RECHAZAR</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: '#555' }}>
                                No hay solicitudes pendientes en este momento.
                            </div>
                        )}
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
                   <div>
                    <label style={{ display: 'block', color: '#ffcc00', marginBottom: '5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Afiliación de Empresa</label>
                    <select 
                      value={selectedFaction} 
                      onChange={e => setSelectedFaction(e.target.value)} 
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid #334466', color: 'white', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="MARS">M.A.R.S.</option>
                      <option value="MOON">M.O.O.N.</option>
                      <option value="PLUTO">P.L.U.T.O.</option>
                      <option value="ALL">Multifacción (Cualquiera puede unirse)</option>
                    </select>
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
                        <div 
                          style={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => handleShowClanDetails(cl.tag)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '1.1rem' }}>[{cl.tag}]</span>
                            <span style={{ color: '#fff' }}>{cl.name}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                            Líder: <span style={{ color: '#ffcc00' }}>{cl.leader}</span> • Miembros: <span style={{ color: '#fff' }}>{cl.members}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleJoinClan(cl.tag, cl.join_type === 'Cerrado')}
                          style={{ background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 15px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          {cl.join_type === 'Cerrado' ? 'SOLICITAR' : 'UNIRSE'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {contextMenu.visible && (
          <div 
            style={{ 
              position: 'fixed', 
              top: contextMenu.y, 
              left: contextMenu.x, 
              background: '#0a101a', 
              border: '1px solid #00ffcc', 
              borderRadius: '8px', 
              boxShadow: '0 0 20px rgba(0, 255, 204, 0.3)', 
              zIndex: 99999, 
              overflow: 'hidden', 
              minWidth: '200px' 
            }}
          >
            <div style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid #1a2a4a', fontSize: '0.7rem', color: '#88aaff', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Diplomacia: {contextMenu.clanName}
            </div>
            <button 
                onClick={() => handleDiplomacyProposal(contextMenu.clanTag, 'alliance')}
                style={{ width: '100%', padding: '12px 15px', background: 'transparent', border: 'none', color: '#00cc66', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', outline: 'none' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(0, 204, 102, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              🤝 Proponer Alianza
            </button>
            <button 
                onClick={() => handleDiplomacyProposal(contextMenu.clanTag, 'pna')}
                style={{ width: '100%', padding: '12px 15px', background: 'transparent', border: 'none', color: '#00aaff', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', outline: 'none' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(0, 170, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              🛡️ Pacto No Agresión (PNA)
            </button>
            <button 
                onClick={() => handleDiplomacyProposal(contextMenu.clanTag, 'war')}
                style={{ width: '100%', padding: '12px 15px', background: 'transparent', border: 'none', color: '#ff3366', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', outline: 'none' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 51, 102, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              🔥 Declarar Guerra
            </button>
            <div style={{ padding: '8px 15px', fontSize: '0.65rem', color: '#445577', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
              Esc para cerrar
            </div>
          </div>
        )}
        {/* Modal de Solicitud de Ingreso */}
        {showJoinModal && (
            <div className="modal-overlay" style={{ zIndex: 1100 }}>
                <div className="modal-content" style={{ maxWidth: '450px', border: '1px solid #00ffcc' }}>
                    <h3 style={{ color: '#00ffcc', marginTop: 0 }}>SOLICITUD DE INGRESO</h3>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                        Estás solicitando unirte al clan <span style={{ color: '#fff' }}>[{showJoinModal.tag}] {showJoinModal.name}</span>. 
                        Este clan requiere aprobación manual.
                    </p>
                    
                    <div style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '0.85rem' }}>Mensaje para el Líder (Opcional):</label>
                        <textarea 
                            value={joinMessage}
                            onChange={e => setJoinMessage(e.target.value)}
                            placeholder="Ej: Hola, soy un jugador activo y busco una alianza competitiva..."
                            style={{ 
                                width: '100%', 
                                height: '100px', 
                                background: '#0a101a', 
                                border: '1px solid #1a2a4a', 
                                borderRadius: '4px', 
                                color: '#fff', 
                                padding: '10px',
                                resize: 'none',
                                boxSizing: 'border-box'
                            }}
                            maxLength={250}
                        />
                        <div style={{ textAlign: 'right', color: '#555', fontSize: '0.75rem', marginTop: '5px' }}>
                            {joinMessage.length}/250
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button 
                            className="secondary-button" 
                            style={{ flex: 1 }}
                            onClick={() => { setShowJoinModal(null); setJoinMessage(''); }}
                        >CANCELAR</button>
                        <button 
                            className="primary-button" 
                            style={{ flex: 1 }}
                            onClick={() => handleJoinClan(showJoinModal.tag)}
                        >ENVIAR SOLICITUD</button>
                    </div>
                </div>
            </div>
        )}
        {/* Modal de Detalles del Clan (Rediseño Premium) */}
        {selectedClanDetails && (
            <div className="modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <div className="modal-content" style={{ 
                    maxWidth: '650px', 
                    background: 'rgba(13, 20, 36, 0.95)', 
                    border: '2px solid rgba(0, 255, 204, 0.4)', 
                    boxShadow: '0 0 50px rgba(0, 255, 204, 0.15), inset 0 0 20px rgba(0, 255, 204, 0.05)',
                    position: 'relative',
                    padding: '40px',
                    borderRadius: '12px'
                }}>
                    <button 
                        onClick={() => setSelectedClanDetails(null)}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#00ffcc', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.target.style.background = 'rgba(255,0,0,0.2)'; e.target.style.borderColor = 'red'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >&times;</button>
                    
                    <div style={{ display: 'flex', gap: '30px', marginBottom: '35px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '25px' }}>
                        <div style={{ 
                            width: '100px', 
                            height: '100px', 
                            background: 'radial-gradient(circle at center, #1a2a4a, #050810)', 
                            borderRadius: '12px', 
                            border: '2px solid #00ffcc', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '3rem',
                            boxShadow: '0 0 20px rgba(0, 255, 204, 0.2)'
                        }}>
                           🛡️
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ 
                                color: '#fff', 
                                margin: 0, 
                                fontFamily: 'Orbitron, sans-serif', 
                                fontSize: '1.8rem', 
                                textShadow: '0 0 15px rgba(0, 255, 204, 0.5)',
                                letterSpacing: '1px'
                            }}>
                                <span style={{ color: '#00ffcc' }}>[{selectedClanDetails.tag}]</span> {selectedClanDetails.name}
                            </h2>
                            <div style={{ color: '#ffcc00', fontSize: '1rem', marginTop: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>CENTRAL DE MANDO:</span> {selectedClanDetails.leader}
                            </div>
                            <div style={{ color: '#6688aa', fontSize: '0.8rem', marginTop: '8px', letterSpacing: '1px' }}>
                                FUNDADO EL {new Date(selectedClanDetails.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#88aaff', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '2px', fontWeight: 'bold' }}>Facción / Empresa</div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>{getCompanyName(selectedClanDetails.faction)}</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#88aaff', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '2px', fontWeight: 'bold' }}>Capacidad de Pilotos</div>
                            <div style={{ color: selectedClanDetails.members_count >= 30 ? '#ff4444' : '#00ffcc', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                {selectedClanDetails.members_count} <span style={{ color: '#444', fontSize: '0.8rem' }}>/ 30</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ color: '#88aaff', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '2px', fontWeight: 'bold' }}>Manifiesto del Clan</div>
                        <div style={{ 
                            background: 'rgba(0,0,0,0.4)', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(0, 255, 204, 0.1)', 
                            color: '#aabccc', 
                            minHeight: '90px', 
                            fontStyle: 'italic',
                            lineHeight: '1.6',
                            fontSize: '0.95rem',
                            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
                        }}>
                            "{selectedClanDetails.description}"
                        </div>
                    </div>

                    <div>
                        <div style={{ color: '#88aaff', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '2px', fontWeight: 'bold' }}>Personal (Registro de Vuelo)</div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: '12px', fontSize: '0.7rem', color: '#556688', textTransform: 'uppercase' }}>Piloto</th>
                                        <th style={{ padding: '12px', fontSize: '0.7rem', color: '#556688', textTransform: 'uppercase', textAlign: 'right' }}>Rango Operativo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedClanDetails.members.map((m, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(0,255,204,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                                            <td style={{ padding: '12px', color: '#fff', fontWeight: 'bold' }}>{m.name}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <span style={{ 
                                                    color: m.role === 'Líder' ? '#ffcc00' : (m.role === 'Oficial' ? '#00eeff' : '#88aaff'),
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '4px 10px',
                                                    borderRadius: '4px',
                                                    border: `1px solid ${m.role === 'Líder' ? 'rgba(255,204,0,0.2)' : 'rgba(0,255,204,0.1)'}`
                                                }}>
                                                    {m.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ marginTop: '35px' }}>
                        <button 
                            className="primary-button" 
                            style={{ width: '100%', padding: '15px', fontSize: '1rem', letterSpacing: '3px' }}
                            onClick={() => setSelectedClanDetails(null)}
                        >FINALIZAR CONSULTA</button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Clan;
