import React, { useState } from 'react';

const API_URL = 'http://localhost:8000/api';

const StarAltars = ({ user, altares, credits, paladio, level, onNavigate, onUpdateAltares, onUpdateCredits, onUpdatePaladio, onUpdateAmmo, onUpdateUpgrades }) => {
  const [loading, setLoading] = useState(null); // 'nexus', 'eclipse', 'cosmos' or general materialize
  const [lastMaterialized, setLastMaterialized] = useState(null); // { portalId, pieceIndex }

  const portals = [
    {
      id: 'nexus',
      name: 'Portal Nexus',
      requiredPieces: 25,
      currentPieces: altares?.nexus || 0,
      completions: altares?.completions?.nexus || 0,
      color: '#00ffcc',
      glowColor: 'rgba(0, 255, 204, 0.4)',
      bgGrad: 'linear-gradient(135deg, rgba(0, 255, 204, 0.05), rgba(0, 50, 40, 0.2))',
      icon: '🌀',
      rewards: [
        '🔋 +50,000 Créditos',
        '🪐 +500 Paladio',
        '📈 +25,000 Experiencia',
        '🔷 +5,000 Munición de Plasma',
        '❤️ Potenciador de Casco (+10% HP por 1 hora)'
      ]
    },
    {
      id: 'eclipse',
      name: 'Portal Eclipse',
      requiredPieces: 30,
      currentPieces: altares?.eclipse || 0,
      completions: altares?.completions?.eclipse || 0,
      color: '#ff00ff',
      glowColor: 'rgba(255, 0, 255, 0.4)',
      bgGrad: 'linear-gradient(135deg, rgba(255, 0, 255, 0.05), rgba(60, 0, 60, 0.2))',
      icon: '🌌',
      rewards: [
        '🔋 +100,000 Créditos',
        '🪐 +1,000 Paladio',
        '📈 +50,000 Experiencia',
        '🔷 +5,000 Munición de Plasma',
        '🛡️ Potenciador de Escudo (+15% Escudo por 1 hora)'
      ]
    },
    {
      id: 'cosmos',
      name: 'Portal Cosmos',
      requiredPieces: 35,
      currentPieces: altares?.cosmos || 0,
      completions: altares?.completions?.cosmos || 0,
      color: '#ffaa00',
      glowColor: 'rgba(255, 170, 0, 0.4)',
      bgGrad: 'linear-gradient(135deg, rgba(255, 170, 0, 0.05), rgba(60, 40, 0, 0.2))',
      icon: '🪐',
      rewards: [
        '🔋 +250,000 Créditos',
        '🪐 +2,500 Paladio',
        '📈 +100,000 Experiencia',
        '🔷 +5,000 Munición de Plasma',
        '⚡ Potenciador de Daño (+10% ATK por 1 hora)'
      ]
    }
  ];

  const handleMaterialize = async (portalId) => {
    if (!user || (altares?.energy || 0) < 1 || loading) return;
    setLoading('materialize_' + portalId);

    try {
      const response = await fetch(`${API_URL}/user/altars/materialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, portal: portalId })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        onUpdateAltares(result.altares);
        localStorage.setItem('game_altares', JSON.stringify(result.altares));
        
        // Guardar la última pieza obtenida para animarla
        const newPieces = result.altares[portalId];
        setLastMaterialized({ portalId, pieceIndex: newPieces - 1 });
        setTimeout(() => {
          setLastMaterialized(null);
        }, 3000);
      } else {
        alert(result.detail || 'Error al materializar la pieza.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al conectar con el altar.');
    } finally {
      setLoading(null);
    }
  };

  const handleComplete = async (portalId) => {
    if (!user || loading) return;
    setLoading('complete_' + portalId);

    try {
      const response = await fetch(`${API_URL}/user/altars/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, portal: portalId })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        onUpdateAltares(result.altares);
        onUpdateCredits(result.credits);
        onUpdatePaladio(result.paladio);
        onUpdateAmmo(result.ammo);
        onUpdateUpgrades(result.timed_upgrades);

        localStorage.setItem('game_altares', JSON.stringify(result.altares));
        localStorage.setItem('game_credits', result.credits);
        localStorage.setItem('game_paladio', result.paladio);
        localStorage.setItem('game_ammo', JSON.stringify(result.ammo));
        localStorage.setItem('game_upgrades', JSON.stringify(result.timed_upgrades));

        alert(`¡Portal ${portalId.toUpperCase()} completado con éxito! Recompensas acreditadas en el hangar.`);
      } else {
        alert(result.detail || 'Error al activar el portal.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al activar el portal.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="dashboard-container" style={{ height: 'calc(100vh - 155px)', overflowY: 'auto', padding: '20px', fontFamily: 'Orbitron, sans-serif' }}>
      
      {/* CSS KEYFRAMES */}
      <style>{`
        @keyframes altar-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes altar-spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes altar-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes altar-flash-piece {
          0% { filter: brightness(3) drop-shadow(0 0 20px #fff); stroke-width: 8; }
          50% { filter: brightness(2) drop-shadow(0 0 10px #fff); stroke-width: 6; }
          100% { filter: brightness(1) drop-shadow(0 0 4px #fff); stroke-width: 4; }
        }
        @keyframes altar-pulse-next {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.85; }
        }
        @keyframes altar-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(5, 8, 16, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 255, 204, 0.15)',
        borderRadius: '15px',
        padding: '20px 30px',
        marginBottom: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
            ALTARES ESTELARES
          </h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#88aaff', letterSpacing: '0.5px' }}>
            Canaliza la energía extra cósmica para forjar portales galácticos ancestrales.
          </p>
        </div>

        {/* ENERGY BOX */}
        <div style={{
          background: 'radial-gradient(circle at center, rgba(255, 170, 0, 0.12), rgba(0, 0, 0, 0.4))',
          border: '2px solid #ffaa00',
          borderRadius: '12px',
          padding: '12px 25px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(255, 170, 0, 0.25)',
          animation: 'betaPulse 2s infinite ease-in-out'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#ffcc00', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>
            ENERGÍA EXTRA DISPONIBLE
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', textShadow: '0 0 15px #ffaa00' }}>
            ✨ {altares?.energy || 0}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '25px' }}>
        {portals.map((portal) => {
          const progressPercent = Math.min(100, (portal.currentPieces / portal.requiredPieces) * 100);
          const isCompleteReady = portal.currentPieces >= portal.requiredPieces;
          const hasEnergy = (altares?.energy || 0) > 0;
          const isActionLoading = loading === 'materialize_' + portal.id || loading === 'complete_' + portal.id;

          return (
            <div
              key={portal.id}
              className="dashboard-panel"
              style={{
                background: portal.bgGrad,
                border: `1px solid ${portal.color}33`,
                borderRadius: '20px',
                padding: '25px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 15px ${portal.color}11`,
                transition: 'transform 0.3s, border-color 0.3s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = portal.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${portal.color}33`;
              }}
            >
              {/* Background Glow */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: portal.color,
                opacity: 0.05,
                filter: 'blur(50px)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              {/* Portal Info */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '2.2rem', filter: `drop-shadow(0 0 8px ${portal.color})` }}>{portal.icon}</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', letterSpacing: '1px' }}>{portal.name}</h2>
                      <span style={{ fontSize: '0.65rem', color: portal.color, fontWeight: 'bold' }}>
                        COMPLETADOS: {portal.completions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VISUALIZACIÓN CÓSMICA DEL PORTAL */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', position: 'relative' }}>
                  <svg width="180" height="180" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
                    <defs>
                       <radialGradient id={`vortex-${portal.id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                          <stop offset="30%" stopColor={portal.color} stopOpacity="0.8" />
                          <stop offset="70%" stopColor={`${portal.color}33`} stopOpacity="0.3" />
                          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                       </radialGradient>
                    </defs>
                    
                    {/* Carriles o chasis concéntricos de fondo */}
                    <circle cx="100" cy="100" r="86" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1.5" strokeDasharray="4 8" fill="none" />
                    <circle cx="100" cy="100" r="74" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1.5" strokeDasharray="4 8" fill="none" />
                    <circle cx="100" cy="100" r="80" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" fill="none" />
                    
                    {/* Si el portal está completo, mostramos una estructura de anillo continuo fusionado con brillo intenso */}
                    {isCompleteReady && (
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={portal.color}
                        strokeWidth="6"
                        style={{
                          filter: `drop-shadow(0 0 12px ${portal.color})`,
                          animation: 'altar-pulse 3s ease-in-out infinite',
                          transition: 'all 0.5s ease-in-out'
                        }}
                      />
                    )}
                    
                    {/* Arco para cada pieza */}
                    {Array.from({ length: portal.requiredPieces }).map((_, idx) => {
                       const step = (2 * Math.PI) / portal.requiredPieces;
                       const gap = 0.026; // Pequeño espacio para separar las piezas
                       const angle1 = idx * step - Math.PI / 2 + gap;
                       const angle2 = (idx + 1) * step - Math.PI / 2 - gap;
                       const R = 80;
                       
                       const x1 = 100 + R * Math.cos(angle1);
                       const y1 = 100 + R * Math.sin(angle1);
                       const x2 = 100 + R * Math.cos(angle2);
                       const y2 = 100 + R * Math.sin(angle2);
                       
                       const d = `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
                       const isActive = idx < portal.currentPieces;
                       const isNew = lastMaterialized && lastMaterialized.portalId === portal.id && lastMaterialized.pieceIndex === idx;
                       const isNext = !isActive && idx === portal.currentPieces && !isCompleteReady;
                       
                       let strokeColor = 'rgba(255, 255, 255, 0.12)';
                       let strokeW = 3.5;
                       let anim = 'none';
                       let filt = 'none';

                       if (isNew) {
                         strokeColor = portal.color;
                         strokeW = 8;
                         anim = 'altar-flash-piece 1.5s ease-out infinite';
                         filt = `drop-shadow(0 0 10px #fff)`;
                       } else if (isActive) {
                         strokeColor = portal.color;
                         strokeW = 6;
                         filt = `drop-shadow(0 0 6px ${portal.color})`;
                       } else if (isNext) {
                         // Vista previa fantasma y parpadeante de la siguiente pieza a encajar
                         strokeColor = portal.color;
                         strokeW = 5.5;
                         anim = 'altar-pulse-next 1.5s ease-in-out infinite';
                         filt = `drop-shadow(0 0 4px ${portal.color})`;
                       }

                       return (
                          <path
                            key={idx}
                            d={d}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeW}
                            strokeLinecap="round"
                            style={{
                              filter: filt,
                              animation: anim,
                              transition: 'stroke 0.4s, stroke-width 0.3s'
                            }}
                          />
                       );
                    })}
                    
                    {/* Interior: Vortex giratorio o texto de progreso */}
                    {isCompleteReady ? (
                      <g>
                        <circle
                          cx="100"
                          cy="100"
                          r="70"
                          fill={`url(#vortex-${portal.id})`}
                          style={{
                            transformOrigin: '100px 100px',
                            animation: 'altar-spin 8s linear infinite'
                          }}
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="50"
                          fill="none"
                          stroke={portal.color}
                          strokeWidth="1.5"
                          strokeDasharray="10 20"
                          style={{
                            transformOrigin: '100px 100px',
                            animation: 'altar-spin-reverse 12s linear infinite',
                            opacity: 0.6
                          }}
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="30"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="1"
                          strokeDasharray="5 15"
                          style={{
                            transformOrigin: '100px 100px',
                            animation: 'altar-spin 6s linear infinite',
                            opacity: 0.7
                          }}
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="10"
                          fill="#fff"
                          style={{
                            filter: `drop-shadow(0 0 8px ${portal.color})`,
                            animation: 'altar-pulse 2s ease-in-out infinite'
                          }}
                        />
                      </g>
                    ) : (
                      <g>
                        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeDasharray="3 3" />
                        <text
                          x="100"
                          y="95"
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="22"
                          fontWeight="900"
                          fontFamily="Orbitron"
                          letterSpacing="1px"
                        >
                          {portal.currentPieces}
                        </text>
                        <text
                          x="100"
                          y="115"
                          textAnchor="middle"
                          fill="rgba(255, 255, 255, 0.4)"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="Orbitron"
                          letterSpacing="0.5px"
                        >
                          DE {portal.requiredPieces}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* ESQUEMA DEL COMPONENTE: DETALLE DE PIEZA O PORTAL COMPLETO */}
                <div style={{
                  background: 'rgba(5, 8, 16, 0.4)',
                  border: `1px solid ${isCompleteReady ? `${portal.color}55` : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '12px 15px',
                  marginBottom: '20px',
                  boxShadow: isCompleteReady ? `0 0 15px ${portal.color}18, inset 0 0 10px ${portal.color}11` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  transition: 'all 0.3s'
                }}>
                  {/* Contenedor SVG de la pieza o portal completo */}
                  <div style={{ width: '60px', height: '60px', flexShrink: 0, position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCompleteReady ? (
                      // Portal completo mini
                      <svg width="50" height="50" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
                        <defs>
                          <radialGradient id={`vortex-mini-${portal.id}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                            <stop offset="35%" stopColor={portal.color} stopOpacity="0.8" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <circle cx="30" cy="30" r="22" fill={`url(#vortex-mini-${portal.id})`} style={{ transformOrigin: '30px 30px', animation: 'altar-spin 5s linear infinite' }} />
                        <circle cx="30" cy="30" r="24" fill="none" stroke={portal.color} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 4px ${portal.color})` }} />
                        <circle cx="30" cy="30" r="27" fill="none" stroke={portal.color} strokeWidth="0.8" strokeDasharray="3 3" style={{ opacity: 0.6 }} />
                        <circle cx="30" cy="30" r="18" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.8" strokeDasharray="2 4" style={{ transformOrigin: '30px 30px', animation: 'altar-spin-reverse 8s linear infinite' }} />
                      </svg>
                    ) : (
                      // Una pieza de portal en detalle con animación de flotación
                      <svg width="50" height="50" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                        <g style={{ animation: 'altar-float 3s ease-in-out infinite' }}>
                          {/* El arco de la pieza */}
                          <path
                            d="M 30 15.36 A 40 40 0 0 1 70 15.36"
                            fill="none"
                            stroke={portal.color}
                            strokeWidth="7"
                            strokeLinecap="round"
                            style={{
                              filter: `drop-shadow(0 0 6px ${portal.color})`
                            }}
                          />
                          {/* Conectores en los extremos (simulando acoplamiento magnético) */}
                          <circle cx="30" cy="15.36" r="2.5" fill="#fff" />
                          <circle cx="70" cy="15.36" r="2.5" fill="#fff" />
                          {/* Pistas de circuito internas */}
                          <path
                            d="M 33 20.56 A 34 34 0 0 1 67 20.56"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.7)"
                            strokeWidth="1.8"
                            strokeDasharray="2 2"
                          />
                        </g>
                      </svg>
                    )}
                  </div>

                  {/* Textos de estado y detalles de la pieza/portal */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>
                      {isCompleteReady ? 'PORTAL ESTABILIZADO' : 'ESQUEMA DE LA PIEZA'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#aaa', marginTop: '3px', lineHeight: '1.3' }}>
                      {isCompleteReady ? (
                        <span>El reactor orbital de <b>{portal.name}</b> está completamente sellado y el núcleo de hiperespacio está activo.</span>
                      ) : (
                        <span>Módulo de arco de aleación estelar. Encaja magnéticamente en la ranura <b>#{portal.currentPieces + 1}</b> del chasis del portal.</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress details */}
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#aaa' }}>PROGRESO RECOLECCIÓN</span>
                    <span style={{ color: portal.color, fontWeight: 'bold' }}>{Math.floor(progressPercent)}%</span>
                  </div>
                </div>

                {/* Rewards checklist */}
                <div style={{ marginBottom: '25px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#88aaff', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    RECOMPENSAS AL ACTIVAR
                  </div>
                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {portal.rewards.map((reward, i) => (
                      <li key={i} style={{ fontSize: '0.75rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: portal.color }}>✨</span>
                        {reward}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <button
                  disabled={!hasEnergy || isActionLoading || isCompleteReady}
                  onClick={() => handleMaterialize(portal.id)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isCompleteReady ? 'rgba(255,255,255,0.05)' : (hasEnergy ? `linear-gradient(90deg, ${portal.color}33, ${portal.color}55)` : 'rgba(255,255,255,0.02)'),
                    color: isCompleteReady ? '#555' : (hasEnergy ? '#fff' : '#444'),
                    border: `1px solid ${isCompleteReady ? 'rgba(255,255,255,0.05)' : (hasEnergy ? portal.color : '#333')}`,
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontFamily: 'Orbitron',
                    cursor: (hasEnergy && !isCompleteReady && !isActionLoading) ? 'pointer' : 'not-allowed',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s',
                    textShadow: hasEnergy && !isCompleteReady ? `0 0 5px ${portal.color}` : 'none',
                    boxShadow: hasEnergy && !isCompleteReady ? `0 0 10px ${portal.color}11` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (hasEnergy && !isCompleteReady && !isActionLoading) {
                      e.currentTarget.style.background = `linear-gradient(90deg, ${portal.color}55, ${portal.color}77)`;
                      e.currentTarget.style.boxShadow = `0 0 15px ${portal.color}33`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasEnergy && !isCompleteReady && !isActionLoading) {
                      e.currentTarget.style.background = `linear-gradient(90deg, ${portal.color}33, ${portal.color}55)`;
                      e.currentTarget.style.boxShadow = `0 0 10px ${portal.color}11`;
                    }
                  }}
                >
                  {isCompleteReady ? 'PORTAL COMPLETO' : (loading === 'materialize_' + portal.id ? 'MATERIALIZANDO...' : 'MATERIALIZAR PIEZA (✨ 1)')}
                </button>

                <button
                  disabled={!isCompleteReady}
                  onClick={() => {
                    if (isCompleteReady) {
                      const portalCoords = {
                        nexus: '(3500, 3500)',
                        eclipse: '(5000, 5000)',
                        cosmos: '(6500, 6500)'
                      }[portal.id] || '(0, 0)';
                      
                      alert(`🌌 ¡El Portal ${portal.name} está activo en órbita!\n\nSal al espacio exterior y cruza el portal en el mapa inicial de tu facción en las coordenadas:\n📍 ${portalCoords}\n\n⚠️ Desafío de Portal:\n- Cuentas con 3 vidas para completar las oleadas.\n- Si mueres 3 veces, el portal se destruirá y perderás las piezas.\n- ¡Completa las oleadas para reclamar las recompensas y el timed buff!`);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isCompleteReady ? `linear-gradient(90deg, ${portal.color}dd, ${portal.color})` : 'rgba(0,0,0,0.3)',
                    color: isCompleteReady ? '#fff' : '#444',
                    border: `1px solid ${isCompleteReady ? portal.color : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontFamily: 'Orbitron',
                    cursor: isCompleteReady ? 'pointer' : 'not-allowed',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s',
                    boxShadow: isCompleteReady ? `0 0 20px ${portal.color}aa` : 'none',
                    textShadow: isCompleteReady ? '0 0 5px rgba(0,0,0,0.5)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (isCompleteReady) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = `0 0 25px ${portal.color}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isCompleteReady) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = `0 0 20px ${portal.color}aa`;
                    }
                  }}
                >
                  {isCompleteReady ? '🌌 ENTRAR DESDE ÓRBITA' : 'PORTAL INCOMPLETO'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER INFO PANEL */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px 30px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: '2.5rem' }}>🎁</div>
        <div style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: '1.6' }}>
          <b>¿Cómo conseguir Energía Extra?</b><br />
          Explora los mapas galácticos en el modo de vuelo espacial. Los **Cofres Especiales** dorados (que aparecen periódicamente en órbita y tienen una gema rosada en su centro) te otorgarán de **1 a 3 de Energía Extra** garantizados al recogerlos. ¡Utiliza esta energía para forjar y activar los portales estelares!
        </div>
      </div>
      
    </div>
  );
};

export default StarAltars;
