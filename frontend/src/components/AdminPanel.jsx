import React, { useState, useEffect } from 'react';

const AdminPanel = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ 
    username: '', email: '', faction: '', 
    level: 1, xp: 0, credits: 0, uridium: 0,
    is_admin: false
  });

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
      uridium: user.uridium || 0,
      is_admin: user.is_admin || false
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

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getNextLevelXp = (lvl) => lvl * 1000;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#00ffcc', fontFamily: 'Orbitron' }}>INICIALIZANDO SISTEMA DE CONTROL...</div>;

  return (
    <div className="admin-view-container" style={{ fontFamily: 'Orbitron, sans-serif' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2.5rem' }}>⚙️</div>
          <div>
            <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '3px', color: '#00ffcc', fontSize: '1.8rem' }}>Fleet Commander</h1>
            <p style={{ margin: 0, color: '#88aaff', fontSize: '0.8rem' }}>Terminal de Supervisión Táctica v3.0</p>
          </div>
        </div>
        <button onClick={onBack} className="back-btn">SALIR DE TERMINAL</button>
      </div>

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
          <div style={{ display: 'flex', gap: '30px' }}>
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
                        {u.is_admin && <span style={{ fontSize: '0.5rem', background: '#ffcc00', color: '#000', padding: '2px 5px', borderRadius: '3px', marginLeft: '8px' }}>ADMIN</span>}
                      </h3>
                      <p>{u.email}</p>
                      <p style={{ color: u.faction === 'MARS' ? '#ff3333' : u.faction === 'MOON' ? '#3366ff' : u.faction === 'PLUTO' ? '#9933ff' : '#aaa', fontWeight: 'bold', marginTop: '3px', fontSize: '0.7rem' }}>
                        {u.faction || 'SIN ASIGNAR'}
                      </p>
                    </div>
                  </div>
                  {!u.is_admin && (
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
                    <span className="stat-pill-label">Uridium</span>
                    <span className="stat-pill-value" style={{ color: '#aa88ff' }}>💎 {u.uridium?.toLocaleString()}</span>
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

                <button 
                  className="gestionar-button" 
                  style={{ margin: 0, marginTop: '10px', fontSize: '0.7rem', padding: '10px', opacity: u.is_admin ? 0.5 : 1 }}
                  onClick={() => startEdit(u)}
                  disabled={u.is_admin}
                >
                  {u.is_admin ? "ARCHIVO PROTEGIDO" : "RECONFIGURAR DATOS"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

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
                  <label>Uridium disponible</label>
                  <input type="number" value={editForm.uridium} onChange={e => setEditForm({...editForm, uridium: parseInt(e.target.value)})} />
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
                    OTORGAR PRIVILEGIOS DE ADMINISTRADOR (PRECAUCIÓN)
                  </label>
                </div>
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
