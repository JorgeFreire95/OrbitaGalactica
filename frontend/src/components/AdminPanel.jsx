import { useState, useEffect } from 'react';
import '../index.css';

// API BASE URL
const API_URL = 'http://localhost:8000/api';

export default function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', faction: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/users`);
      if (!res.ok) throw new Error('Error al obtener usuarios');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (username) => {
    if (!window.confirm(`¿Estás SEGURO de querer ELIMINAR y purgar al usuario ${username}? No hay vuelta atrás.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${username}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falló la eliminación');
      // Refrescar lista
      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user.username);
    setEditForm({ username: user.username, email: user.email, faction: user.faction || '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/users/${editingUser}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Error al actualizar');
      }
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-wrapper" style={{ paddingTop: '20px' }}>
      <div className="auth-page-content" style={{ maxWidth: '1000px', padding: '30px' }}>
        <h1 style={{ color: '#ff3333', textAlign: 'center', marginBottom: '30px', textShadow: '0 0 10px red' }}>
          ⚠️ TERMINAL DEL SUPERVISOR ⚠️
        </h1>

        {error && (
          <div style={{ color: '#ff3333', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#00ffff' }}>Accediendo a la base de datos...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 255, 255, 0.1)', borderBottom: '2px solid #00ffff' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Alias</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Facción</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Rol / Clan</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.username} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {editingUser === u.username ? (
                      <td colSpan="5" style={{ padding: '15px' }}>
                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input className="auth-input" style={{ flex: 1, margin: 0 }}
                                 value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} required/>
                          <input className="auth-input" style={{ flex: 2, margin: 0 }}
                                 type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required/>
                          <select className="auth-input" style={{ flex: 1, margin: 0 }}
                                  value={editForm.faction} onChange={e => setEditForm({...editForm, faction: e.target.value})}>
                            <option value="">(Ninguna)</option>
                            <option value="MARS">MARS</option>
                            <option value="MOON">MOON</option>
                            <option value="PLUTO">PLUTO</option>
                          </select>
                          <button type="submit" style={{ background: '#00ffcc', color: '#000', padding: '10px', border: 'none', borderRadius:'4px', cursor:'pointer' }}>Guardar</button>
                          <button type="button" onClick={() => setEditingUser(null)} style={{ background: '#555', color: '#fff', padding: '10px', border: 'none', borderRadius:'4px', cursor:'pointer' }}>Cancelar</button>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td style={{ padding: '12px', color: '#00ffff', fontWeight: 'bold' }}>{u.username}</td>
                        <td style={{ padding: '12px' }}>{u.email}</td>
                        <td style={{ padding: '12px', color: u.faction==='MARS'?'#ff3333':u.faction==='MOON'?'#3366ff':u.faction==='PLUTO'?'#9933ff':'#fff' }}>
                          {u.faction || 'Sin asignar'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>
                          {u.is_admin ? (
                            <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>ADMIN</span>
                          ) : (
                            <span style={{ color: u.clan_tag ? '#88aaff' : '#666' }}>
                              {u.clan_tag ? `[${u.clan_tag}] ${u.clan_role || 'Miembro'}` : 'Sin Clan'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {!u.is_admin && (
                            <>
                              <button onClick={() => startEdit(u)} style={{ background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>
                                ✏️ Editar
                              </button>
                              <button onClick={() => handleDelete(u.username)} style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid red', color: '#ff3333', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                🗑️ Purgar
                              </button>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
