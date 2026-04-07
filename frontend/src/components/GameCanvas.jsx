import { useEffect, useRef, useState, useCallback } from 'react';
import { drawGame } from '../utils/renderer';
import { getRank } from '../utils/gameData';

const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function GameCanvas({ user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialMinerals, initialUpgrades, initialClan, onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdateMinerals }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const gameStateRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [isJumping, setIsJumping] = useState(false);
  const [showJumpPrompt, setShowJumpPrompt] = useState(false);

  // --- DRAGGABLE HUD STATE ---
  const [hotbarPos, setHotbarPos] = useState(() => {
    const saved = localStorage.getItem('og_hotbar_pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth / 2 - 275, y: window.innerHeight - 100 };
  });
  const [isUiLocked, setIsUiLocked] = useState(() => {
    return localStorage.getItem('og_ui_locked') === 'true';
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastSyncRef = useRef({ credits: -1, uridium: -1, xp: -1, level: -1, minerals: '' });
  
  const [inviteIdText, setInviteIdText] = useState('');
  const [showPartyMenu, setShowPartyMenu] = useState(false);

  // Keyboard state
  const keys = useRef({
    up: false, down: false, left: false, right: false,
    shoot: false, missile_shoot: false,
    target_x: null, target_y: null, locked_target_id: null
  });

  const triggerJumpAnimation = useCallback(() => {
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 800);
  }, []);

  const handleJump = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      keys.current.target_x = null;
      keys.current.target_y = null;
      wsRef.current.send(JSON.stringify({ type: 'jump_portal' }));
    }
  }, []);

  // --- INPUT HANDLERS ---
  const handleKeyDown = useCallback((e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (k === 'w' || k === 'arrowup') keys.current.up = true;
      if (k === 's' || k === 'arrowdown') keys.current.down = true;
      if (k === 'a' || k === 'arrowleft') keys.current.left = true;
      if (k === 'd' || k === 'arrowright') keys.current.right = true;
      keys.current.target_x = null;
      keys.current.target_y = null;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (k === '1' || k === '2' || k === '3' || k === '4') {
        const ammoId = k === '1' ? 'standard' : k === '2' ? 'thermal' : k === '3' ? 'plasma' : 'siphon';
        wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: ammoId }));
      }
      if (k === '5' || k === '6' || k === '7') {
        const mId = k === '5' ? 'missile_1' : k === '6' ? 'missile_2' : 'missile_3';
        wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: mId }));
      }
    }
    if (k === ' ') {
      if (keys.current.locked_target_id) keys.current.shoot = !keys.current.shoot;
      else keys.current.shoot = false;
    }
    if (k === 'e') keys.current.missile_shoot = true;
    if (k === 'j') handleJump();
  }, [handleJump]);

  const handleKeyUp = useCallback((e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.current.up = false;
    if (k === 's' || k === 'arrowdown') keys.current.down = false;
    if (k === 'a' || k === 'arrowleft') keys.current.left = false;
    if (k === 'd' || k === 'arrowright') keys.current.right = false;
    if (k === 'e' || k === '6' || k === '7' || k === '8') keys.current.missile_shoot = false;
  }, []);

  const handleMouseDown = useCallback((e) => { 
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const width = canvasRef.current.width, height = canvasRef.current.height;
    const mmW = 200, mmH = 150, margin = 20;
    const mmX_start = width - mmW - margin, mmY_start = height - mmH - margin;

    if (screenX >= mmX_start && screenX <= width - margin && screenY >= mmY_start && screenY <= height - margin) {
      keys.current.target_x = ((screenX - mmX_start) / mmW) * 10000;
      keys.current.target_y = ((screenY - mmY_start) / mmH) * 8000;
      return;
    }

    const mouseX = screenX + cameraRef.current.x, mouseY = screenY + cameraRef.current.y;
    if(e.button === 0) {
      // Check if we clicked an ally to target them
      const hitPlayer = gameStateRef.current?.players?.find(p => !p.is_self && Math.hypot(p.x - mouseX, p.y - mouseY) < 45);
      if (hitPlayer) {
        keys.current.locked_target_id = hitPlayer.id;
        keys.current.target_x = null; keys.current.target_y = null;
        return; // Detener ejecución
      }

      const hitTarget = gameStateRef.current?.enemies?.find(en => Math.hypot(en.x - mouseX, en.y - mouseY) < 45);
      if (hitTarget) {
        keys.current.locked_target_id = hitTarget.id;
        keys.current.target_x = null; keys.current.target_y = null;
      } else {
        keys.current.target_x = mouseX; keys.current.target_y = mouseY;
      }
    } else if (e.button === 2) { 
      keys.current.locked_target_id = null; keys.current.shoot = false;
    }
  }, []);

  const handleMouseUp = useCallback(() => { 
    if (isDragging) {
      localStorage.setItem('og_hotbar_pos', JSON.stringify(hotbarPos));
    }
    setIsDragging(false);
  }, [isDragging, hotbarPos]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setHotbarPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    }
  }, [isDragging]);

  const handleHotbarMouseDown = useCallback((e) => {
    if (isUiLocked) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - hotbarPos.x, y: e.clientY - hotbarPos.y };
    e.stopPropagation();
  }, [isUiLocked, hotbarPos]);

  const toggleUiLock = useCallback(() => {
    setIsUiLocked(prev => {
      const next = !prev;
      localStorage.setItem('og_ui_locked', next.toString());
      return next;
    });
  }, []);

  const handleInviteToParty = (targetId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && targetId) {
      wsRef.current.send(JSON.stringify({ type: 'party_invite', target_id: targetId }));
      setInviteIdText('');
    }
  };
  const handleJoinParty = (partyId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'party_join', party_id: partyId }));
    }
  };
  const handleLeaveParty = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'party_leave' }));
    }
  };

  const handleContextMenu = useCallback((e) => e.preventDefault(), []);

  // --- STABLE PROPS REF ---
  // We store props in a ref to avoid re-triggering the main effect when parents re-render
  const propsRef = useRef({
    user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialMinerals, initialUpgrades, initialClan,
    onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdateMinerals
  });
  
  useEffect(() => {
    propsRef.current = {
      user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialMinerals, initialUpgrades, initialClan,
      onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdateMinerals
    };
  });

  // --- CORE SYSTEM EFFECT ---
  useEffect(() => {
    let isMounted = true;
    let animationId;
    let lastInputTime = 0;

    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    const connectWs = () => {
      if (!isMounted) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!isMounted) return ws.close();
        let userId = propsRef.current.user?.username || localStorage.getItem('orbita_galactica_user_id') || ('user_' + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('orbita_galactica_user_id', userId);
        
        const p = propsRef.current;
        ws.send(JSON.stringify({ 
          type: 'join', userId, ship_type: p.selectedShip,
          modules: p.initialModules, initial_ammo: p.initialAmmo,
          level: p.initialLevel, xp: p.initialXp, credits: p.initialCredits,
          initialUridium: propsRef.current.initialUridium,
          minerals: p.initialMinerals, upgrades: p.initialUpgrades,
          clan: p.initialClan
        }));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          if (gameStateRef.current?.current_map_name && gameStateRef.current.current_map_name !== data.state.current_map_name) {
            triggerJumpAnimation();
            keys.current.target_x = null; keys.current.target_y = null;
          }
          gameStateRef.current = data.state;
          setGameState(data.state);
          const me = data.state.players?.find(p => p.is_self);
          if (me) {
            const p = propsRef.current;
            const last = lastSyncRef.current;
            
            // Throttled/Smart Updates: Only trigger React state change if value actually differs
            if (p.onUpdateCredits && me.credits !== last.credits) {
                p.onUpdateCredits(me.credits);
                last.credits = me.credits;
            }
            if (p.onUpdateUridium && me.uridium !== last.uridium) {
                p.onUpdateUridium(me.uridium);
                last.uridium = me.uridium;
            }
            if (p.onUpdateProgress && (me.level !== last.level || me.xp !== last.xp)) {
                p.onUpdateProgress(me.level, me.xp);
                last.level = me.level;
                last.xp = me.xp;
            }
            if (p.onUpdateMinerals) {
                const minStr = JSON.stringify(me.minerals);
                if (minStr !== last.minerals) {
                    p.onUpdateMinerals(me.minerals);
                    last.minerals = minStr;
                }
            }
            if (p.onUpdateAmmo) {
                const combinedAmmo = { ...me.ammo, ...me.missiles };
                const ammoStr = JSON.stringify(combinedAmmo);
                if (ammoStr !== last.ammo) {
                    p.onUpdateAmmo(combinedAmmo);
                    last.ammo = ammoStr;
                }
            }
            
            // Check portal prompt
            if (data.state.portal) {
              const dist = Math.hypot(me.x - data.state.portal.x, me.y - data.state.portal.y);
              setShowJumpPrompt(dist < data.state.portal.radius);
            } else setShowJumpPrompt(false);

            // Cleanup target if dead or disconnected
            if (keys.current.locked_target_id) {
                const isEnemy = data.state.enemies?.some(en => en.id === keys.current.locked_target_id);
                const isPlayer = data.state.players?.some(p => p.id === keys.current.locked_target_id);
                if (!isEnemy && !isPlayer) {
                    keys.current.locked_target_id = null;
                    keys.current.shoot = false;
                }
            }
          }
        }

      };

      ws.onclose = () => { if (isMounted) setTimeout(connectWs, 2000); };
    };

    const renderLoop = () => {
      const now = Date.now();
      if (wsRef.current?.readyState === WebSocket.OPEN && now - lastInputTime > 50) {
        wsRef.current.send(JSON.stringify({ type: 'input', keys: keys.current }));
        lastInputTime = now;
      }
      const canvas = canvasRef.current;
      if (gameStateRef.current && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const me = gameStateRef.current.players?.find(p => p.is_self);
          if (me) {
            cameraRef.current.x = Math.max(0, Math.min(10000 - canvas.width, me.x - canvas.width / 2));
            cameraRef.current.y = Math.max(0, Math.min(8000 - canvas.height, me.y - canvas.height / 2));
          }
          drawGame(ctx, { ...gameStateRef.current, selectedTargetId: keys.current.locked_target_id }, cameraRef.current.x, cameraRef.current.y);
        }
      }
      animationId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    
    resize();
    connectWs();
    renderLoop();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      if (wsRef.current) wsRef.current.close();
    };
  }, []); // WE ONLY CONNECT ONCE

  const me = gameState?.players?.find(p => p.is_self);
  const party = gameState?.party;
  const partyInvites = gameState?.party_invites || {};

  return (
    <>
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} onContextMenu={handleContextMenu} style={{ display: 'block' }} />
      
      {me?.in_safe_zone && (
        <div style={{
          position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0, 255, 255, 0.07)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 255, 255, 0.3)', borderBottom: '3px solid #00ffff',
          padding: '6px 12px', borderRadius: '4px', color: '#00ffff',
          fontFamily: 'Orbitron', fontSize: '12px', fontWeight: 'bold',
          letterSpacing: '1px', pointerEvents: 'none', zIndex: 100,
          animation: 'pulse-safe 2s infinite ease-in-out'
        }}>
          <style>{`@keyframes pulse-safe { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }`}</style>
          <span>🛡️</span>
          <span>ZONA SEGURA</span>
        </div>
      )}

      {showJumpPrompt && (
        <div onClick={handleJump} style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 255, 255, 0.2)', backdropFilter: 'blur(10px)',
            border: '2px solid #00ffff', padding: '20px 40px', borderRadius: '15px', color: '#00ffff',
            fontFamily: 'Orbitron', cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '10px', boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)', zIndex: 1000
        }}>
          <span>🌀</span>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>SALTAR SECTOR [J]</span>
        </div>
      )}

      {isJumping && <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 9999, animation: 'jump-flash 0.8s forwards' }}>
        <style>{`@keyframes jump-flash { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }`}</style>
      </div>}

      <div className="ui-overlay">
        {me && (
          <>
            <div className="status-display-container hud-mode">
                <div className="status-block hud-variant">
                    <div className="status-item"><span>✪</span><span className="status-value">{Math.floor(me.xp).toLocaleString()} XP</span></div>
                    <div className="status-item"><span style={{ color: '#ffcc00' }}>🔋</span><span className="status-value">{me.credits.toLocaleString()} CR</span></div>
                    <div className="status-item"><span style={{ color: '#00ffcc' }}>🎖️</span><span className="status-value">Lvl {me.level}</span></div>
                    <div className="status-item" style={{ background: 'rgba(100,0,200,0.1)', borderLeft: '2px solid #cc33ff' }}>
                        <span style={{ color: '#cc33ff' }}>💎</span>
                        <span className="status-value">{me.uridium.toLocaleString()} URI</span>
                    </div>
                    <div className="status-item"><span>🎯</span><span className="status-value">{me.score.toLocaleString()} PTS</span></div>
                </div>
                <div className="status-block hud-variant">
                    <div className="status-item"><span>❤️</span><span className="status-value">{Math.floor(me.hp).toLocaleString()}</span></div>
                    <div className="status-item"><span>🛡️</span><span className="status-value">{Math.floor(me.shield).toLocaleString()}</span></div>
                    <div className="status-item"><span>🚀</span><span className="status-value">{me.spd}</span></div>
                    <div className="status-item"><span>💥</span><span className="status-value">{me.atk}</span></div>
                </div>
            </div>

            {/* PARTY HUD IN-GAME */}
            <div className="party-hud-overlay" style={{ position: 'fixed', top: '80px', left: '20px', zIndex: 1000, pointerEvents: 'auto' }}>
                <button onClick={() => setShowPartyMenu(!showPartyMenu)} style={{ background: 'rgba(0, 255, 204, 0.2)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Orbitron', fontWeight: 'bold' }}>
                   👥 GRUPO TÁCTICO {Object.keys(partyInvites).length > 0 ? `(${Object.keys(partyInvites).length})` : ''}
                </button>
                
                {showPartyMenu && (
                  <div style={{ marginTop: '10px', background: 'rgba(5, 8, 16, 0.9)', backdropFilter: 'blur(5px)', border: '1px solid #00ffcc44', padding: '15px', borderRadius: '8px', width: '280px' }}>
                    {party ? (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '10px' }}>ID GRUPO: {party.id}</div>
                        {party.members.map(mid => {
                          const data = party.member_data[mid];
                          const pPlayer = gameState?.players?.find(p => p.id === mid);
                          return (
                            <div key={mid} style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '0.8rem', color: pPlayer ? 'white' : '#555', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{data.name} {party.leader === mid ? '★' : ''}</span>
                                {pPlayer ? <span style={{ color: '#00ffcc' }}>ACTIVO</span> : <span style={{ color: '#ff3366' }}>LEJOS</span>}
                              </div>
                              {pPlayer && (
                                <div style={{ width: '100%', height: '4px', background: '#333', marginTop: '3px', borderRadius: '2px', display: 'flex' }}>
                                  <div style={{ width: `${(pPlayer.hp / pPlayer.max_hp) * 100}%`, height: '100%', background: '#ff3366' }} />
                                  <div style={{ width: `${(pPlayer.shield / pPlayer.max_shield) * 100}%`, height: '100%', background: '#0077ff' }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button onClick={handleLeaveParty} style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#ff3366', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>ABANDONAR GRUPO</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>No estás en ningún grupo.</div>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                          <input type="text" value={inviteIdText} onChange={(e) => setInviteIdText(e.target.value)} placeholder="ID del Jugador" style={{ width: '100%', padding: '5px', background: '#000', border: '1px solid #333', color: 'white' }} />
                          <button onClick={() => handleInviteToParty(inviteIdText)} style={{ padding: '5px 10px', background: '#00ffcc', border: 'none', cursor: 'pointer', color: 'black', fontWeight: 'bold' }}>INVITAR</button>
                        </div>
                      </div>
                    )}
                    
                    {Object.keys(partyInvites).length > 0 && (
                      <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '10px' }}>INVITACIONES</div>
                        {Object.entries(partyInvites).map(([lId, inv]) => (
                          <div key={lId} style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#00ffcc' }}>De: {inv.leader_name}</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleJoinParty(inv.party_id)} style={{ flex: 1, background: '#00ffcc', color: 'black', fontWeight: 'bold', border: 'none', padding: '5px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.7rem' }}>ACEPTAR</button>
                                {/* Implement Reject just as simple clearance locally for now */}
                                <button onClick={() => {
                                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                                      // Tell backend you decline (or we can just ignore it)
                                      wsRef.current.send(JSON.stringify({ type: 'party_reject', leader_id: lId }));
                                    }
                                }} style={{ flex: 1, background: '#ff3366', color: 'white', fontWeight: 'bold', border: 'none', padding: '5px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.7rem' }}>RECHAZAR</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
            
            {/* IN-WORLD TARGET ACTIONS */}
            {keys.current.locked_target_id && gameState?.players?.find(p => p.id === keys.current.locked_target_id) && (
              (() => {
                const targetPlayer = gameState.players.find(p => p.id === keys.current.locked_target_id);
                // No mostrar si ya está en nuestro grupo
                const isAlreadyInParty = party?.members.includes(targetPlayer.id);
                // Checkear si ya le enviamos invi localmente (o simplemente desaparece el UI si enviamos invi)
                return !isAlreadyInParty && (
                  <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}>
                    <button 
                      onClick={(e) => {
                          handleInviteToParty(targetPlayer.id);
                          // Pequeño truco visual para ocultar el botón al instante al hacer click
                          e.currentTarget.style.display = 'none';
                      }}
                      style={{
                        background: 'rgba(0, 255, 204, 0.2)', border: '2px solid #00ffcc', color: '#00ffcc',
                        padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Orbitron',
                        fontWeight: 'bold', backdropFilter: 'blur(5px)', boxShadow: '0 0 15px rgba(0,255,204,0.3)',
                        transition: 'all 0.2s', textTransform: 'uppercase'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,255,204,0.5)'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0,255,204,0.2)'; e.currentTarget.style.color = '#00ffcc'; }}
                    >
                      📨 Reclutar al Grupo
                    </button>
                  </div>
                );
              })()
            )}

            <div className="weapon-hotbar-container" style={{ position: 'fixed', left: hotbarPos.x, top: hotbarPos.y, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', pointerEvents: 'auto', userSelect: 'none', cursor: isUiLocked ? 'default' : 'move' }} onMouseDown={handleHotbarMouseDown}>
                 <div style={{ display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                  {me.minerals && Object.entries(me.minerals).map(([type, amount]) => amount > 0 && (
                    <div key={type} className="hud-item" style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'rgba(0,0,0,0.6)' }}>
                      {type === 'titanium' ? '💎' : type === 'plutonium' ? '🏮' : '💾'} {amount}
                    </div>
                  ))}
                </div>
                <div className="weapon-hotbar" style={{ display: 'flex', alignItems: 'center' }}>
                    <div onClick={(e) => { e.stopPropagation(); toggleUiLock(); }} style={{ width: '30px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUiLocked ? 'rgba(255,204,0,0.1)' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (isUiLocked ? '#ffcc0044' : '#333'), marginRight: '5px', borderRadius: '4px', cursor: 'pointer' }}>
                      {isUiLocked ? '🔒' : '🔓'}
                    </div>
                    {[
                        { id: 'standard', type: 'laser', icon: '⚪', image: '/std_ammo.jpg', key: '1' },
                        { id: 'thermal', type: 'laser', icon: '🔥', image: '/thermal_ammo.jpg', key: '2' },
                        { id: 'plasma', type: 'laser', icon: '🔷', image: '/plasma_ammo.jpg', key: '3' },
                        { id: 'siphon', type: 'laser', icon: '🔋', image: '/siphon_ammo.png', key: '4' },
                        { id: 'missile_1', type: 'missile', icon: '🚀', key: '5' },
                        { id: 'missile_2', type: 'missile', icon: '🚀', key: '6' },
                        { id: 'missile_3', type: 'missile', icon: '☢️', key: '7' },
                        { id: 'blank_8', key: '8', disabled: true },
                        { id: 'blank_9', key: '9', disabled: true },
                        { id: 'blank_0', key: '0', disabled: true },
                    ].map((slot) => {
                        const isActive = (slot.type === 'laser' && me.ammo_type === slot.id) || (slot.type === 'missile' && me.missile_type === slot.id);
                        const count = slot.type === 'laser' ? me.ammo[slot.id] : slot.type === 'missile' ? (me.missiles?.[slot.id] || 0) : null;
                        return (
                            <div key={slot.id} className={`hotbar-slot ${isActive ? 'active' : ''} ${slot.disabled ? 'disabled' : ''}`} onMouseDown={(e) => e.stopPropagation()} onClick={() => !slot.disabled && wsRef.current?.send(JSON.stringify({ type: 'switch_ammo', ammo_id: slot.id }))}>
                                <div className="slot-progress-bar"><div className="slot-progress-fill" style={{ width: isActive ? '100%' : '20%', opacity: isActive ? 1 : 0.3 }} /></div>
                                <div className="slot-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {slot.image ? <img src={slot.image} alt="ammo icon" style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : slot.icon}
                                </div>
                                {count !== null && <div className="slot-count">{count}</div>}
                                <div className="slot-key">{slot.key}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
