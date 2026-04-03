import { useEffect, useRef, useState } from 'react';
import { drawGame } from '../utils/renderer';
import { getRank } from '../utils/gameData';

const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function GameCanvas({ selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialMinerals, initialUpgrades, onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdateMinerals }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  
  const [gameState, setGameState] = useState(null);
  const gameStateRef = useRef(null);
  const [error, setError] = useState(null);

  // Keyboard state
  const keys = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resizing
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // WebSocket Init
    let isMounted = true;
    const connectWs = () => {
      if (!isMounted) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!isMounted) return ws.close();
        console.log('Connected to server!');
        setError(null);
        ws.send(JSON.stringify({ 
          type: 'join', 
          ship_type: selectedShip,
          modules: initialModules || [],
          initial_ammo: initialAmmo,
          level: initialLevel,
          xp: initialXp,
          credits: initialCredits,
          minerals: initialMinerals,
          upgrades: initialUpgrades
        }));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          gameStateRef.current = data.state;
          setGameState(data.state);
          if (onUpdateAmmo && data.state.players) {
            const me = data.state.players.find(p => p.is_self);
            if (me) {
              // Update counts in App.jsx to persist
              onUpdateAmmo(me.ammo);
              if (onUpdateProgress) {
                onUpdateProgress(me.level, me.xp);
              }
              if (onUpdateCredits) {
                onUpdateCredits(me.credits);
              }
              if (onUpdateMinerals) {
                onUpdateMinerals(me.minerals);
              }
            }
          }
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        console.log('Disconnected.');
        setError('Desconectado del servidor. Intentando reconectar...');
        setTimeout(connectWs, 2000); // Reconnect loop
      };

      ws.onerror = (err) => {
        if (!isMounted) return;
        console.error('WebSocket Error:', err);
      };
    };
    
    connectWs();

    // Animation Loop
    let animationId;
    const renderLoop = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Send inputs
        wsRef.current.send(JSON.stringify({
          type: 'input',
          keys: keys.current
        }));
      }

      if (gameStateRef.current) {
        const ctx = canvas.getContext('2d');
        drawGame(ctx, gameStateRef.current);
        
        // Draw bullets with ammo colors
        if (gameStateRef.current.projectiles) {
          gameStateRef.current.projectiles.forEach(p => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            
            // Color based on ammo type
            const ammoColors = {
              'standard': '#ffffff',
              'thermal': '#ff6600',
              'plasma': '#ff33ff',
              'siphon': '#33ff33'
            };
            ctx.fillStyle = ammoColors[p.ammo_type] || '#fff';
            ctx.fill();
            ctx.restore();
          });
        }
      }
      
      animationId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Set up Input Listeners
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') { keys.current.up = true; keys.current.target_x = null; }
      if (k === 'arrowdown' || k === 's') { keys.current.down = true; keys.current.target_x = null; }
      if (k === 'arrowleft' || k === 'a') { keys.current.left = true; keys.current.target_x = null; }
      if (k === 'arrowright' || k === 'd') { keys.current.right = true; keys.current.target_x = null; }
      if (e.key === ' ' || e.key === 'Enter') keys.current.shoot = true;

      // Ammo switching
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        if (k === '1') wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: 'standard' }));
        if (k === '2') wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: 'thermal' }));
        if (k === '3') wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: 'plasma' }));
        if (k === '4') wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: 'siphon' }));
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') keys.current.up = false;
      if (k === 'arrowdown' || k === 's') keys.current.down = false;
      if (k === 'arrowleft' || k === 'a') keys.current.left = false;
      if (k === 'arrowright' || k === 'd') keys.current.right = false;
      if (e.key === ' ' || e.key === 'Enter') keys.current.shoot = false;
    };

    // Al hacer click, guardamos la coordenada como target
    const handleMouseDown = (e) => { 
      if(e.button === 0) {
        keys.current.target_x = e.clientX;
        keys.current.target_y = e.clientY;
      } else if (e.button === 2) { // Right click = shoot
        keys.current.shoot = true;
      }
    };
    
    const handleMouseUp = (e) => { 
      if(e.button === 2) {
        keys.current.shoot = false;
      }
    };

    const handleMouseMove = (e) => {
      keys.current.mouseX = e.clientX;
      keys.current.mouseY = e.clientY;
    };
    
    const handleContextMenu = (e) => e.preventDefault(); // Prevent right-click menu

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Bind to window or canvas
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      canvasEl.addEventListener('mousedown', handleMouseDown);
      canvasEl.addEventListener('mouseup', handleMouseUp);
      canvasEl.addEventListener('mousemove', handleMouseMove);
      canvasEl.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationId);
      if (wsRef.current) wsRef.current.close();
    };
  }, []); // Run only once on mount

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {error && (
        <div style={{ position: 'absolute', top: 10, left: 10, color: 'red', background: 'rgba(0,0,0,0.5)', padding: 10 }}>
          {error}
        </div>
      )}
      <div className="ui-overlay">
        {/* We can grab local player from gameState to show HUD */}
        {gameState?.players && (() => {
          const me = gameState.players.find(p => p.is_self);
          if (!me) return null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="hud-item">
                  <div style={{ color: '#ff3366', fontWeight: 'bold' }}>❤️ HP: {Math.max(0, Math.floor(me.hp))} / {me.max_hp}</div>
                </div>
                <div className="hud-item">
                  <div style={{ color: '#00c8ff', fontWeight: 'bold' }}>🛡️ SHLD: {Math.max(0, Math.floor(me.shld))} / {me.max_shld}</div>
                </div>
                <div className="hud-item">
                  <div style={{ color: '#ffcc00', fontWeight: 'bold' }}>💥 ATK: {me.atk}</div>
                </div>
                <div className="hud-item">
                  <div style={{ color: '#00ccff', fontWeight: 'bold' }}>⚡ SPD: {me.spd}</div>
                </div>
              </div>

              {/* NIVEL Y RANGO */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '5px',
                width: '1000px'
              }}>
                <div style={{ 
                  background: 'rgba(0,119,255,0.2)', 
                  border: '1px solid #0077ff', 
                  padding: '4px 12px', 
                  borderRadius: '15px',
                  color: '#0077ff',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {getRank(me.level)}
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid #fff', 
                  padding: '4px 12px', 
                  borderRadius: '15px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  NIVEL {me.level}
                </div>
              </div>

              {/* BARRA DE EXPERIENCIA */}
              <div style={{ width: '100%', maxWidth: '1000px', background: 'rgba(0,0,0,0.5)', height: '15px', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden', position: 'relative', marginBottom: '15px' }}>
                <div style={{ 
                  width: `${(me.xp / me.xp_next) * 100}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #0077ff, #00ffcc)',
                  transition: 'width 0.3s ease-out'
                }} />
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.65rem', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  textShadow: '0 0 5px black' 
                }}>
                  XP: {Math.floor(me.xp)} / {me.xp_next}
                </div>
              </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '1000px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div className="hud-item">
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>🏆 PUNTAJE: {me.score || 0}</div>
                  </div>
                  <div className="hud-item" style={{ background: 'rgba(0,255,204,0.2)', border: '1px solid #00ffcc' }}>
                    <div style={{ color: '#00ffcc', fontWeight: 'bold' }}>💰 CRÉDITOS: {me.credits || 0}</div>
                  </div>
                  <div className="hud-item" style={{ background: 'rgba(150,150,150,0.2)', border: '1px solid #aaa', marginTop: '5px' }}>
                    <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                      📦 BODEGA: {Object.values(me.minerals || {}).reduce((a, b) => a + b, 0)} / {me.max_cargo}
                    </div>
                  </div>
                </div>             

                {/* MINERALES RECOGIDOS */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {me.minerals && Object.entries(me.minerals).map(([type, amount]) => {
                    const icons = { titanium: '💎', plutonium: '🏮', silicon: '💾' };
                    const colors = { titanium: '#00c8ff', plutonium: '#ff3333', silicon: '#00ffcc' };
                    if (amount === 0) return null;
                    return (
                      <div key={type} className="hud-item" style={{ borderColor: colors[type], color: colors[type] }}>
                        {icons[type]} {amount}
                      </div>
                    );
                  })}
                </div>

                {/* HUD DE MUNICIÓN */}
                <div style={{ 
                    background: 'rgba(0,0,0,0.8)', 
                    padding: '12px', 
                    borderRadius: '10px', 
                    border: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    minWidth: '130px'
                }}>
                    {[
                        { id: 'standard', name: 'Básica', icon: '⚪', color: '#fff' },
                        { id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ff6600' },
                        { id: 'plasma', name: 'Plasma', icon: '🔷', color: '#ff33ff' },
                        { id: 'siphon', name: 'Sifón', icon: '🔋', color: '#33ff33' },
                    ].map(type => {
                        const count = me.ammo[type.id];
                        const isActive = me.ammo_type === type.id;
                        return (
                            <div key={type.id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                fontSize: '0.75rem',
                                color: isActive ? '#00ffcc' : (count > 0 || type.id === 'standard' ? '#fff' : '#444'),
                                background: isActive ? 'rgba(0,255,204,0.1)' : 'transparent',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                border: isActive ? '1px solid #00ffcc44' : '1px solid transparent'
                            }}>
                                <span>{type.icon} {type.name}</span>
                                <span style={{ fontWeight: isActive ? 'bold' : 'normal' }}>
                                    {type.id === 'standard' ? '∞' : count}
                                </span>
                            </div>
                        );
                    })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
