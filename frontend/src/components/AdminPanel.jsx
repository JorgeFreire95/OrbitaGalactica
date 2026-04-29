import React, { useState, useEffect } from 'react';

const AdminPanel = ({ user: currentUser, onBack, onUpdateCredits, onUpdatePaladio, onUpdateLevel, onUpdateXp }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ 
    username: '', email: '', faction: '', 
    level: 1, xp: 0, credits: 0, paladio: 0,
    is_admin: false,
    is_super_admin: false
  });
  const [activeAdminTab, setActiveAdminTab] = useState('users'); // 'users' or 'announcements'
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'info' });

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_URL}/admin/users`);
      if (!resp.ok) throw new Error('Error al obtener usuarios');
      const data = await resp.json();
      // Inspect data structure, backend returns { "users": [...] } or just [...]
      const userList = data.users || data;
      setUsers(Array.isArray(userList) ? userList : []);
      setLoading(false);
    } catch (err) {
      setError("Error conectando con el servidor");
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const resp = await fetch(`${API_URL}/announcements`);
      if (resp.ok) {
        const data = await resp.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeAdminTab]);

  const handleDelete = async (username) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${username}? Esta acción no se puede deshacer.`)) return;
    try {
      const resp = await fetch(`${API_URL}/admin/users/${username}`, { method: 'DELETE' });
      if (resp.ok) fetchUsers();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const startEdit = (user) => {
    setEditForm({ 
      username: user.username, 
      email: user.email, 
      faction: user.faction || '',
      level: user.level || 1,
      xp: user.xp || 0,
      credits: user.credits || 0,
      paladio: user.paladio || 0,
      is_admin: user.is_admin || false,
      is_super_admin: user.is_super_admin || false
    });
    setEditingUser(user.username);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_URL}/admin/users/${editingUser}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (resp.ok) {
        // Si el admin se está editando a sí mismo, actualizar el estado global inmediatamente
        if (editingUser === currentUser.username) {
            if (onUpdateCredits) onUpdateCredits(editForm.credits);
            if (onUpdatePaladio) onUpdatePaladio(editForm.paladio);
            if (onUpdateLevel) onUpdateLevel(editForm.level);
            if (onUpdateXp) onUpdateXp(editForm.xp);
        }
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await resp.json();
        alert(data.detail || "Error al actualizar");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    try {
      const resp = await fetch(`${API_URL}/admin/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement)
      });
      if (resp.ok) {
        setNewAnnouncement({ title: '', content: '', type: 'info' });
        fetchAnnouncements();
      }
    } catch (err) {
      alert("Error al publicar anuncio");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("¿Eliminar este anuncio?")) return;
    try {
      const resp = await fetch(`${API_URL}/admin/announcements/${id}`, { method: 'DELETE' });
      if (resp.ok) fetchAnnouncements();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const handleAddVip = async (username) => {
    if (!window.confirm(`¿Añadir 30 días VIP a ${username}?`)) return;
    try {
      const resp = await fetch(`${API_URL}/admin/users/${username}/vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 })
      });
      if (resp.ok) {
        fetchUsers();
      } else {
        const data = await resp.json();
        alert(data.detail || "Error al otorgar VIP");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };
  
  const handleRevokeVip = async (username) => {
    if (!window.confirm(`¿Estás seguro de REVOCAR el estatus VIP de ${username}?`)) return;
    try {
      const resp = await fetch(`${API_URL}/admin/users/${username}/vip`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        fetchUsers();
      } else {
        const data = await resp.json();
        alert(data.detail || "Error al revocar VIP");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getNextLevelXp = (lvl) => lvl * 1000;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#00ffcc', fontFamily: 'Orbitron' }}>INICIALIZANDO SISTEMA DE CONTROL...</div>;

  return (
    <div className="admin-view-container" style={{ fontFamily: 'Orbitron, sans-serif' }}>
      {/* HEADER SECTION */}
      <div className="admin-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2.5rem' }}>⚙️</div>
          <div>
            <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '3px', color: '#00ffcc', fontSize: '1.8rem' }}>Fleet Commander</h1>
            <p style={{ margin: 0, color: '#88aaff', fontSize: '0.8rem' }}>Terminal de Supervisión Táctica v3.0</p>
          </div>
        </div>
        <div className="admin-header-buttons">
          <button 
            onClick={() => setActiveAdminTab('users')} 
            className={`nav-button ${activeAdminTab === 'users' ? 'active' : ''}`}
            style={{ fontSize: '0.7rem', opacity: activeAdminTab === 'users' ? 1 : 0.6 }}
          >
            GESTIÓN DE PILOTOS
          </button>
          <button 
            onClick={() => setActiveAdminTab('announcements')} 
            className={`nav-button ${activeAdminTab === 'announcements' ? 'active' : ''}`}
            style={{ fontSize: '0.7rem', opacity: activeAdminTab === 'announcements' ? 1 : 0.6 }}
          >
            SISTEMA DE ANUNCIOS
          </button>
          <button 
            onClick={() => setActiveAdminTab('events')} 
            className={`nav-button ${activeAdminTab === 'events' ? 'active' : ''}`}
            style={{ fontSize: '0.7rem', opacity: activeAdminTab === 'events' ? 1 : 0.6 }}
          >
            SISTEMA DE EVENTOS
          </button>
          <button onClick={onBack} className="back-btn" style={{ marginLeft: '20px' }}>SALIR DE TERMINAL</button>
        </div>
      </div>

      {activeAdminTab === 'users' ? (
        <div className="admin-glass-panel">
        {/* TOOLBAR */}
        <div className="admin-toolbar">
          <input 
            type="text" 
            className="admin-search-input" 
            placeholder="Buscar piloto por alias o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="admin-toolbar-stats">
            <div className="stat-item">
              <span className="stat-label">Pilotos Totales</span>
              <span className="stat-value">{users.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Activos</span>
              <span className="stat-value" style={{ color: '#00ff00' }}>{users.filter(u => u.faction).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Créditos Totales</span>
              <span className="stat-value" style={{ color: '#ffcc00' }}>{users.reduce((acc, u) => acc + (u.credits || 0), 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="user-card-grid">
          {filteredUsers.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#555' }}>
              NO SE ENCONTRARON REGISTROS QUE COINCIDAN CON LA BÚSQUEDA
            </div>
          ) : (
            filteredUsers.map(u => (
              <div key={u.username} className={`admin-user-card ${u.is_admin ? 'is-admin' : ''}`}>
                <div className="user-card-header">
                  <div className="user-card-main">
                    <div className="user-avatar-circle" style={{ 
                      borderColor: u.faction === 'MARS' ? '#ff3333' : u.faction === 'MOON' ? '#3366ff' : u.faction === 'PLUTO' ? '#9933ff' : '#334466',
                      boxShadow: u.faction ? `0 0 10px ${u.faction === 'MARS' ? '#ff333344' : u.faction === 'MOON' ? '#3366ff44' : '#9933ff44'}` : 'none'
                    }}>
                      {u.username.substring(0, 2)}
                    </div>
                    <div className="user-info-text">
                      <h3 style={{ display: 'flex', alignItems: 'center' }}>
                        {u.username} 
                        {u.is_super_admin && <span style={{ fontSize: '0.5rem', background: '#ff00ff', color: '#fff', padding: '2px 5px', borderRadius: '3px', marginLeft: '8px' }}>SUPERADMIN</span>}
                        {u.is_admin && !u.is_super_admin && <span style={{ fontSize: '0.5rem', background: '#ffcc00', color: '#000', padding: '2px 5px', borderRadius: '3px', marginLeft: '8px' }}>ADMIN</span>}
                      </h3>
                      <p>{u.email}</p>
                      <p style={{ color: u.faction === 'MARS' ? '#ff3333' : u.faction === 'MOON' ? '#3366ff' : u.faction === 'PLUTO' ? '#9933ff' : '#aaa', fontWeight: 'bold', marginTop: '3px', fontSize: '0.7rem' }}>
                        {u.faction || 'SIN ASIGNAR'}
                      </p>
                    </div>
                  </div>
                  {(!u.is_admin || currentUser?.is_super_admin) && (
                    <button 
                      onClick={() => handleDelete(u.username)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff3333', fontSize: '1.1rem', opacity: 0.4 }}
                      title="Purgar Usuario"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className="card-stats-row">
                  <div className="stat-pill">
                    <span className="stat-pill-label">Nivel</span>
                    <span className="stat-pill-value" style={{ color: '#00ffcc' }}>{u.level}</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">Créditos</span>
                    <span className="stat-pill-value" style={{ color: '#ffcc00' }}>🔋 {u.credits?.toLocaleString()}</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">Paladio</span>
                    <span className="stat-pill-value" style={{ color: '#aa88ff' }}>🪐 {u.paladio?.toLocaleString()}</span>
                  </div>
                  <div className="stat-pill" style={{ gridColumn: '1/-1', background: 'rgba(255, 204, 0, 0.05)', border: '1px solid rgba(255, 204, 0, 0.2)' }}>
                    <span className="stat-pill-label" style={{ color: '#ffcc00' }}>⭐ ESTADO VIP</span>
                    <span className="stat-pill-value" style={{ fontSize: '0.7rem', color: u.vip_until && new Date(u.vip_until) > new Date() ? '#00ffcc' : '#555' }}>
                      {u.vip_until && new Date(u.vip_until) > new Date() 
                        ? `ACTIVO HASTA ${new Date(u.vip_until).toLocaleDateString()}` 
                        : 'SIN VIP'}
                    </span>
                  </div>
                </div>

                <div className="xp-progress-container">
                  <div className="xp-label-row">
                    <span>EXP: {u.xp?.toLocaleString()} / {getNextLevelXp(u.level).toLocaleString()}</span>
                    <span>{Math.floor(((u.xp || 0) / getNextLevelXp(u.level)) * 100)}%</span>
                  </div>
                  <div className="xp-bar-container" style={{ height: '6px', margin: 0, background: '#1a1a3a' }}>
                    <div className="xp-bar-fill" style={{ width: `${Math.min(100, ((u.xp || 0) / getNextLevelXp(u.level)) * 100)}%` }}></div>
                  </div>
                </div>

                {(!u.is_admin || currentUser?.is_super_admin) && (
                  <div className="vip-actions-container">
                    <button 
                      className="gestionar-button vip-btn-main" 
                      onClick={() => handleAddVip(u.username)}
                    >
                      🌟 OTORGAR +30 DÍAS VIP
                    </button>
                    {u.vip_until && new Date(u.vip_until) > new Date() && (
                      <button 
                        className="gestionar-button vip-btn-revoke" 
                        onClick={() => handleRevokeVip(u.username)}
                        title="Revocar estatus VIP"
                      >
                        🚫
                      </button>
                    )}
                  </div>
                )}

                <button 
                  className="gestionar-button" 
                  style={{ 
                    margin: 0, 
                    marginTop: '10px', 
                    fontSize: '0.7rem', 
                    padding: '10px', 
                    opacity: (u.is_admin && !currentUser?.is_super_admin) ? 0.5 : 1,
                    background: u.is_super_admin ? 'linear-gradient(45deg, #ff00ff, #aa00ff)' : undefined
                  }}
                  onClick={() => startEdit(u)}
                  disabled={u.is_admin && !currentUser?.is_super_admin}
                >
                  {(u.is_admin && !currentUser?.is_super_admin) ? "ARCHIVO PROTEGIDO" : u.is_super_admin ? "GIGANTE DEL SISTEMA" : "RECONFIGURAR DATOS"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      ) : activeAdminTab === 'announcements' ? (
        <div className="admin-glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ color: '#00ffcc', marginBottom: '20px', fontSize: '1.2rem' }}>📢 PUBLICAR COMUNICADO ESTELAR</h2>
          <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px', marginBottom: '40px' }}>
            <div className="input-field">
              <label>Título del Anuncio</label>
              <input 
                type="text" 
                value={newAnnouncement.title} 
                onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} 
                placeholder="Ej: Mantenimiento Programado"
              />
            </div>
            <div className="input-field">
              <label>Contenido del Mensaje</label>
              <textarea 
                value={newAnnouncement.content} 
                onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} 
                style={{ background: '#0a0f1a', color: '#fff', border: '1px solid #334466', padding: '10px', minHeight: '100px', fontFamily: 'Inter' }}
                placeholder="Describe los detalles del anuncio..."
              />
            </div>
            <div className="input-field">
              <label>Prioridad / Tipo</label>
              <select value={newAnnouncement.type} onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value})}>
                <option value="info">INFORMACIÓN (AZUL)</option>
                <option value="warning">ALERTA (AMARILLO)</option>
                <option value="event">EVENTO (VERDE)</option>
                <option value="critical">CRÍTICO (ROJO)</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '15px' }}>TRANSMITIR A TODA LA FLOTA</button>
          </form>

          <h2 style={{ color: '#00ffcc', marginBottom: '20px', fontSize: '1.2rem' }}>📜 HISTORIAL DE COMUNICADOS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {announcements.length === 0 ? (
              <div style={{ color: '#555', fontStyle: 'italic' }}>No hay anuncios activos en el sistema.</div>
            ) : (
              announcements.map(a => (
                <div key={a.id} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid #334466', 
                  borderRadius: '8px', 
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.6rem', 
                      background: a.type === 'critical' ? '#ff3333' : a.type === 'warning' ? '#ffcc00' : a.type === 'event' ? '#00ff66' : '#00aaff',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontWeight: 'bold',
                      marginRight: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {a.type}
                    </span>
                    <strong style={{ color: '#fff' }}>{a.title}</strong>
                    <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '5px' }}>{a.content}</p>
                    <small style={{ color: '#555' }}>Publicado el: {new Date(a.date).toLocaleString()}</small>
                  </div>
                  <button 
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    style={{ background: 'none', border: 'none', color: '#ff3333', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeAdminTab === 'events' ? (
        <div className="admin-glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px', filter: 'drop-shadow(0 0 20px #ff3333)', animation: 'pulse 2s infinite' }}>🔒</div>
          <h2 style={{ color: '#ff3333', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 10px 0' }}>SISTEMA ENCRIPTADO</h2>
          <p style={{ color: '#88aaff', maxWidth: '500px', lineHeight: '1.6', fontSize: '0.9rem' }}>
            El módulo de **Gestión de Eventos Globales** se encuentra actualmente bajo protocolos de seguridad de alto nivel. 
            Esta sección será desbloqueada en futuras actualizaciones de la comandancia.
          </p>
          <div style={{ marginTop: '30px', padding: '10px 25px', background: 'rgba(255, 51, 51, 0.1)', border: '1px solid #ff3333', borderRadius: '4px', color: '#ff3333', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '2px' }}>
            ACCESO DENEGADO - NIVEL DE AUTORIZACIÓN INSUFICIENTE
          </div>
        </div>
      ) : null}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00ffcc' }}>🛠️ RECONFIGURACIÓN: {editingUser}</h2>
              <button 
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', color: '#555', fontSize: '1.8rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="input-field">
                  <label>Alias de Piloto</label>
                  <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                </div>
                <div className="input-field">
                  <label>Enlace de Red (Email)</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                </div>
                <div className="input-field">
                  <label>Consorcio / Facción</label>
                  <select value={editForm.faction} onChange={e => setEditForm({...editForm, faction: e.target.value})}>
                    <option value="">SIN ASIGNAR</option>
                    <option value="MARS">MARS (MMO)</option>
                    <option value="MOON">MOON (EIC)</option>
                    <option value="PLUTO">PLUTO (VRU)</option>
                  </select>
                </div>
                <div className="input-field">
                  <label>Nivel de Autoridad</label>
                  <input type="number" value={editForm.level} onChange={e => setEditForm({...editForm, level: parseInt(e.target.value)})} />
                </div>
                <div className="input-field">
                  <label>Experiencia de Combate</label>
                  <input type="number" value={editForm.xp} onChange={e => setEditForm({...editForm, xp: parseInt(e.target.value)})} />
                </div>
                <div className="input-field">
                  <label>Créditos Hangar</label>
                  <input type="number" value={editForm.credits} onChange={e => setEditForm({...editForm, credits: parseInt(e.target.value)})} />
                </div>
                <div className="input-field">
                  <label>Paladio disponible</label>
                  <input type="number" value={editForm.paladio} onChange={e => setEditForm({...editForm, paladio: parseInt(e.target.value)})} />
                </div>
                <div className="input-field" style={{ gridColumn: 'span 2', flexDirection: 'row', alignItems: 'center', gap: '15px', background: 'rgba(255,204,0,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,204,0,0.2)' }}>
                  <input 
                    type="checkbox" 
                    id="is_admin_check"
                    checked={editForm.is_admin} 
                    onChange={e => setEditForm({...editForm, is_admin: e.target.checked})} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_admin_check" style={{ color: '#ffcc00', fontWeight: 'bold', cursor: 'pointer', margin: 0 }}>
                    OTORGAR PRIVILEGIOS DE ADMINISTRADOR (NIVEL 1)
                  </label>
                </div>

                {currentUser?.is_super_admin && (
                  <div className="input-field" style={{ gridColumn: 'span 2', flexDirection: 'row', alignItems: 'center', gap: '15px', background: 'rgba(255,0,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,0,255,0.2)', marginTop: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="is_super_admin_check"
                      checked={editForm.is_super_admin} 
                      onChange={e => setEditForm({...editForm, is_super_admin: e.target.checked})} 
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_super_admin_check" style={{ color: '#ff00ff', fontWeight: 'bold', cursor: 'pointer', margin: 0 }}>
                      OTORGAR RANGO DE SUPERADMINISTRADOR (NIVEL SUPREMO)
                    </label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary" style={{ flex: 1, height: '50px' }}>CONFIRMAR RECONFIGURACIÓN</button>
                <button type="button" className="back-btn" onClick={() => setEditingUser(null)} style={{ flex: 1, margin: 0, height: '50px' }}>ABORTAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
