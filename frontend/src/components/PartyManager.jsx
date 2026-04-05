import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';

const PartyManager = ({ currentParty, partyInvites, onInvite, onJoin, onLeave, onNavigate }) => {
  const [inviteId, setInviteId] = useState('');

  return (
    <div className="party-manager-container" style={{ padding: '40px', color: 'white', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ color: '#00ffcc', margin: 0 }}>SISTEMA DE GRUPOS TÁCTICOS</h1>
        <p style={{ color: '#888' }}>Forma alianzas para cazar alienígenas y compartir recompensas en tiempo real.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* LADO IZQUIERDO: EL GRUPO ACTUAL */}
        <section style={{ background: 'rgba(0, 255, 204, 0.05)', padding: '30px', borderRadius: '15px', border: '1px solid #00ffcc33' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#00ffcc' }}>👥</span> TU GRUPO
          </h2>

          {currentParty ? (
            <div>
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>ID DE GRUPO:</span>
                <div style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '1.1rem' }}>{currentParty.id}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                {currentParty.members.map(memberId => {
                  const data = currentParty.member_data[memberId];
                  const isLeader = currentParty.leader === memberId;
                  return (
                    <div key={memberId} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px 20px', 
                      background: '#0a0a1a', 
                      border: `1px solid ${isLeader ? '#00ffcc' : '#333'}`,
                      borderRadius: '8px'
                    }}>
                      <span>{data?.name || 'Piloto'} {isLeader && <span style={{ color: '#ffcc00', fontSize: '0.7rem', marginLeft: '5px' }}>★ LÍDER</span>}</span>
                      <span style={{ color: '#555', fontSize: '0.8rem' }}>ID: {memberId.slice(-4)}</span>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={onLeave}
                style={{ width: '100%', padding: '12px', background: '#ff3366', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ABANDONAR GRUPO
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.3 }}>🚫</div>
              <p style={{ color: '#666' }}>No perteneces a ningún grupo actualmente.</p>
              <button 
                onClick={() => onInvite('new_party')} // Lógica para crear party en backend
                style={{ marginTop: '20px', padding: '12px 30px', background: '#00ffcc', border: 'none', color: 'black', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                CREAR NUEVO GRUPO
              </button>
            </div>
          )}
        </section>

        {/* LADO DERECHO: INVITACIONES Y BÚSQUEDA */}
        <section>
          {/* INVITACIONES PENDIENTES */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>📩 INVITACIONES RECIBIDAS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(partyInvites).length > 0 ? (
                Object.entries(partyInvites).map(([leaderId, invite]) => (
                  <div key={leaderId} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '15px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid #333',
                    borderRadius: '10px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Invitación de {invite.leader_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>ID Grupo: {invite.party_id}</div>
                    </div>
                    <button 
                      onClick={() => onJoin(invite.party_id)}
                      style={{ padding: '8px 20px', background: '#00ffcc', border: 'none', color: 'black', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ACEPTAR
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ color: '#444' }}>No tienes invitaciones pendientes.</div>
              )}
            </div>
          </div>

          {/* INVITAR JUGADOR */}
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>➕ INVITAR POR ID</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Ingresar ID del jugador..." 
                value={inviteId}
                onChange={(e) => setInviteId(e.target.value)}
                style={{ flex: 1, padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
              />
              <button 
                onClick={() => { onInvite(inviteId); setInviteId(''); }}
                style={{ padding: '12px 25px', background: '#88aaff', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ENVIAR
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '10px' }}>
              Puedes encontrar el ID de otros jugadores en el radar o pidiéndoselo directamente.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PartyManager;
