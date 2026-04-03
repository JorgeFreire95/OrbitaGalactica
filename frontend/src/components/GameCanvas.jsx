import { useEffect, useRef, useState } from 'react';
import { drawGame } from '../utils/renderer';
import { getRank } from '../utils/gameData';

const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function GameCanvas({ selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialMinerals, initialUpgrades, onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdateMinerals }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const gameStateRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [isJumping, setIsJumping] = useState(false);
  const [showJumpPrompt, setShowJumpPrompt] = useState(false);

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
        
        // Obtener o crear un userID persistente
        let userId = localStorage.getItem('orbita_galactica_user_id');
        if (!userId) {
          userId = 'user_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('orbita_galactica_user_id', userId);
        }

        ws.send(JSON.stringify({ 
          type: 'join', 
          userId: userId,
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
          // Detectar cambio de mapa para la animación y limpieza de navegación
          if (gameStateRef.current && gameStateRef.current.current_map_name !== data.state.current_map_name) {
            triggerJumpAnimation();
            // Limpieza TOTAL de navegación al cambiar de sector
            keys.current.target_x = null;
            keys.current.target_y = null;
            keys.current.up = false;
            keys.current.down = false;
            keys.current.left = false;
            keys.current.right = false;
          }

          gameStateRef.current = data.state;
          setGameState(data.state);
          
          // Verificar proximidad al portal para el prompt
          const me = data.state.players?.find(p => p.is_self);
          if (me && data.state.portal) {
            const dist = Math.hypot(me.x - data.state.portal.x, me.y - data.state.portal.y);
            setShowJumpPrompt(dist < data.state.portal.radius);
          } else {
            setShowJumpPrompt(false);
          }

          // Sincronizar estadísticas (XP, Créditos, etc) pero NO el objetivo fijado de forma directa
          // para evitar que el servidor limpie el target local por lag o latencia.
          if (data.state.players) {
            const me = data.state.players.find(p => p.is_self);
            if (me) {
              // SOLO limpiamos si el target YA NO EXISTE en la lista global de enemigos (Muerte)
              if (keys.current.locked_target_id) {
                const stillExists = data.state.enemies?.some(en => en.id === keys.current.locked_target_id);
                if (!stillExists) {
                  console.log("Sistema: Objetivo fuera del radar o destruido. Limpiando selección.");
                  keys.current.locked_target_id = null;
                  keys.current.shoot = false;
                }
              }
              
              if (onUpdateAmmo) onUpdateAmmo(me.ammo);
              if (onUpdateProgress) onUpdateProgress(me.level, me.xp);
              if (onUpdateCredits) onUpdateCredits(me.credits);
              if (onUpdateMinerals) onUpdateMinerals(me.minerals);
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

    const triggerJumpAnimation = () => {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 800);
    };

    const handleJump = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Reset local movement to prevent ghost navigation after jump
        keys.current.target_x = null;
        keys.current.target_y = null;
        wsRef.current.send(JSON.stringify({ type: 'jump_portal' }));
      }
    };

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
        const me = gameStateRef.current.players?.find(p => p.is_self);
        
        // --- CÁLCULO DE CÁMARA ---
        let camX = 0;
        let camY = 0;
        
        if (me) {
          // Centrar cámara en el jugador
          camX = me.x - canvas.width / 2;
          camY = me.y - canvas.height / 2;
          
          // Limitar cámara a los bordes del mundo (10000x8000)
          const WORLD_WIDTH = 10000;
          const WORLD_HEIGHT = 8000;
          
          camX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camX));
          camY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camY));
        }
        
        cameraRef.current = { x: camX, y: camY };

        // El estado ahora lo enviamos extendido con el target local para dibujar la retícula
        const stateToDraw = {
            ...gameStateRef.current,
            selectedTargetId: keys.current.locked_target_id
        };
        
        // Pasamos la cámara al renderer
        drawGame(ctx, stateToDraw, camX, camY);
      }
      
      animationId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Set up Input Listeners
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const k = e.key;

      // Cambiar munición (1-4)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        if (k === '1' || k === '2' || k === '3' || k === '4') {
          // SOLO disparar si hay un objetivo fijado
          if (keys.current.locked_target_id) {
            keys.current.shoot = true;
          }
          const ammoId = k === '1' ? 'standard' : k === '2' ? 'thermal' : k === '3' ? 'plasma' : 'siphon';
          wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: ammoId }));
        }
      }

      // Espacio alterna disparo SOLO si hay un objetivo
      if (k === ' ') {
        if (keys.current.locked_target_id) {
          keys.current.shoot = !keys.current.shoot;
        } else {
          keys.current.shoot = false;
        }
      }

      // Tecla J para saltar portal
      if (k.toLowerCase() === 'j') {
        handleJump();
      }
    };

    const handleKeyUp = (e) => { };

    const handleMouseDown = (e) => { 
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      // --- DETECCIÓN DE CLIC EN MINIMAPA ---
      const mmW = 200;
      const mmH = 150;
      const margin = 20;
      const mmX_start = width - mmW - margin;
      const mmY_start = height - mmH - margin;

      if (screenX >= mmX_start && screenX <= width - margin && 
          screenY >= mmY_start && screenY <= height - margin) {
        
        // Coordenadas relativas dentro del minimapa
        const relX = screenX - mmX_start;
        const relY = screenY - mmY_start;
        
        // Mapear a coordenadas del Mundo (10000x8000)
        keys.current.target_x = (relX / mmW) * 10000;
        keys.current.target_y = (relY / mmH) * 8000;
        
        console.log("Navegación Táctica:", keys.current.target_x, keys.current.target_y);
        return; // Detener aquí para no seleccionar enemigos "debajo" del minimapa
      }

      // Convertir coordenadas de PANTALLA a coordenadas de MUNDO para clics normales
      const mouseX = screenX + cameraRef.current.x;
      const mouseY = screenY + cameraRef.current.y;

      if(e.button === 0) {
        let hitTarget = null;
        if (gameStateRef.current?.enemies) {
          hitTarget = gameStateRef.current.enemies.find(en => {
            const dist = Math.hypot(en.x - mouseX, en.y - mouseY);
            return dist < 45; // Radio de selección
          });
        }

        if (hitTarget) {
            console.log("Objetivo Fijado:", hitTarget.id);
            keys.current.locked_target_id = hitTarget.id;
            keys.current.target_x = null;
            keys.current.target_y = null;
        } else {
            // Si hace click fuera de un enemigo, SOLO se mueve ahí. NO limpia el target.
            keys.current.target_x = mouseX;
            keys.current.target_y = mouseY;
        }
      } else if (e.button === 2) { 
        // CLIC DERECHO: Ahora SOLO sirve para DESMARCAR el objetivo
        console.log("Deseleccionando objetivo.");
        keys.current.locked_target_id = null;
        keys.current.shoot = false; // Detener disparo al desmarcar
      }
    };
    
    const handleMouseUp = (e) => { 
        // Eliminado el reseteo de 'shoot' para que sea toggle real
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

  const me = gameState?.players?.find(p => p.is_self);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      
      {/* Indicador de Zona Segura - Reubicado al centro inferior */}
      {me?.in_safe_zone && (() => {
        const dist_to_base = Math.hypot(me.x - (gameState.base?.x || 0), me.y - (gameState.base?.y || 0));
        return (
          <div style={{
            position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0, 255, 255, 0.07)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 255, 255, 0.3)', borderBottom: '3px solid #00ffff',
            padding: '6px 12px', borderRadius: '4px', color: '#00ffff',
            fontFamily: 'Orbitron', fontSize: '12px', fontWeight: 'bold',
            letterSpacing: '1px', pointerEvents: 'none',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)', zIndex: 100,
            animation: 'pulse-safe 2s infinite ease-in-out'
          }}>
            <style>{`
              @keyframes pulse-safe {
                0% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.1); border-color: rgba(0, 255, 255, 0.3); }
                50% { box-shadow: 0 0 25px rgba(0, 255, 255, 0.3); border-color: rgba(0, 255, 255, 0.7); }
                100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.1); border-color: rgba(0, 255, 255, 0.3); }
              }
            `}</style>
            <span style={{ fontSize: '16px' }}>🛡️</span>
            <span>{dist_to_base < 1000 ? "ESTACIÓN CENTRAL - ZONA SEGURA" : "PORTAL ESTELAR - ZONA SEGURA"}</span>
          </div>
        );
      })()}

      {/* PROMPT DE SALTO AL PORTAL */}
      {showJumpPrompt && (
        <div 
          onClick={() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'jump_portal' }));
            }
          }}
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #00ffff',
            padding: '20px 40px',
            borderRadius: '15px',
            color: '#00ffff',
            fontFamily: 'Orbitron',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)',
            zIndex: 1000,
            animation: 'float 2s infinite ease-in-out'
          }}
        >
          <style>{`
            @keyframes float {
              0%, 100% { transform: translate(-50%, -52%); }
              50% { transform: translate(-50%, -48%); }
            }
          `}</style>
          <span style={{ fontSize: '32px' }}>🌀</span>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>SALTAR SECTOR [J]</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>CLICK O TECLA J PARA INICIAR SALTO</span>
        </div>
      )}

      {/* ANIMACIÓN DE SALTO (FLASH) */}
      {isJumping && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'white',
          zIndex: 9999,
          animation: 'jump-flash 0.8s forwards ease-out'
        }}>
          <style>{`
            @keyframes jump-flash {
              0% { opacity: 0; }
              20% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

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
                  <div className="hud-item" style={{ background: 'rgba(255,0,255,0.2)', border: '1px solid #ff00ff' }}>
                    <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>✨ ESPECIAL: {me.special_currency || 0}</div>
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
