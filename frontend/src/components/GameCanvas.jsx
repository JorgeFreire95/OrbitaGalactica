import { useEffect, useRef, useState, useCallback } from 'react';
import { drawGame } from '../utils/renderer';
import { getRank } from '../utils/gameData';
import ChatBox from './ChatBox';

const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function GameCanvas({ user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialPaladio, initialMinerals, initialUpgrades, initialWips, initialEco, initialClan, initialClanTag, onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdatePaladio, onUpdateMinerals, onRepair, isInvisible, onUpdateInvisibility, onUpdateWips, onUpdateEco }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const gameStateRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState(null);
  // Estado liviano y dedicado para el HUD — garantiza re-renders al recibir daño, etc.
  const [hudState, setHudState] = useState(null);
  const [error, setError] = useState(null);
  const [isJumping, setIsJumping] = useState(false);
  const [showJumpPrompt, setShowJumpPrompt] = useState(false);
  const [activeMissions, setActiveMissions] = useState([]);
  const [missionTrackerExpanded, setMissionTrackerExpanded] = useState(false);
  const joinSentRef = useRef(false);
  const lastFrameTimeRef = useRef(performance.now());
  const lastReactRenderRef = useRef(0);

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
  const lastSyncRef = useRef({ credits: -1, paladio: -1, xp: -1, level: -1, minerals: '', ammo: '', wips: '', eco: '', is_invisible: null });
  
  const [inviteIdText, setInviteIdText] = useState('');
  const [showPartyMenu, setShowPartyMenu] = useState(false);
  const [missionNotification, setMissionNotification] = useState(null);
  const [eco, setEco] = useState(initialEco || { active: false, deployed: false, mode: 'passive', level: 1, integrity: 100, shield: 100, max_shield: 100, fuel: 5000, speed: 0, equipped: { lasers: [], generators: [], protocols: [], utility: [] } });

  // Keyboard state
  const keys = useRef({
    up: false, down: false, left: false, right: false,
    shoot: false, missile_shoot: false,
    target_x: null, target_y: null, locked_target_id: null,
    is_targeting_click: false,
    cancel_nav: false
  });

  // --- LOADING SCREEN STATE ---
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('INICIANDO SISTEMAS DE SALTO...');
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const loadingMessages = [
    'INICIANDO SISTEMAS DE SALTO...',
    'CALIBRANDO GENERADORES DE ESCUDO...',
    'SITUANDO COORDENADAS DE MAPA...',
    'SINCRO-ENLACE CON LA FLOTA...',
    'CARGANDO BATERÍAS LÁSER...',
    'ESTADO DE SISTEMAS: COMPLETO'
  ];

  useEffect(() => {
    if (gameStarted) return;
    
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoaded(true);
          setLoadingMessage('SISTEMAS PREPARADOS');
          return 100;
        }
        const next = prev + Math.random() * 15;
        const msgIndex = Math.floor((next / 100) * (loadingMessages.length - 1));
        setLoadingMessage(loadingMessages[msgIndex]);
        return Math.min(next, 100);
      });
    }, 400 + Math.random() * 400);

    return () => clearInterval(interval);
  }, [gameStarted]);

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
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    // Movimiento desactivado por teclado (Pedido por el usuario)
    /*
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (k === 'w' || k === 'arrowup') keys.current.up = true;
      if (k === 's' || k === 'arrowdown') keys.current.down = true;
      if (k === 'a' || k === 'arrowleft') keys.current.left = true;
      if (k === 'd' || k === 'arrowright') keys.current.right = true;
      keys.current.target_x = null;
      keys.current.target_y = null;
    }
    */
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const hotbarConfig = [
        { id: 'standard', type: 'laser' },
        { id: 'thermal', type: 'laser' },
        { id: 'plasma', type: 'laser' },
        { id: 'siphon', type: 'laser' },
        { id: 'missile_1', type: 'missile' },
        { id: 'missile_2', type: 'missile' },
        { id: 'missile_3', type: 'missile' },
        { id: 'blank_8', type: 'blank' },
        { id: 'repair_bot', type: 'utility' },
        { id: 'blank_0', type: 'blank' }
      ];

      const slotMap = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9 };
      if (slotMap[k] !== undefined) {
          const slot = hotbarConfig[slotMap[k]];
          if (slot.type === 'utility' && slot.id === 'repair_bot') {
              wsRef.current.send(JSON.stringify({ type: 'toggle_repair' }));
          } else if (slot.type === 'laser' || slot.type === 'missile') {
              wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: slot.id }));
          }
      }
    }
    if (k === ' ') {
      if (keys.current.locked_target_id) keys.current.shoot = !keys.current.shoot;
      else keys.current.shoot = false;
    }
    if (k === 'e') {
      // Solo disparar misiles si hay un objetivo marcado
      if (keys.current.locked_target_id) {
        keys.current.missile_shoot = true;
      } else {
        keys.current.missile_shoot = false;
      }
    }
    if (k === 'j') handleJump();
  }, [handleJump]);

  const handleKeyUp = useCallback((e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    // Movimiento desactivado por teclado
    /*
    if (k === 'w' || k === 'arrowup') keys.current.up = false;
    if (k === 's' || k === 'arrowdown') keys.current.down = false;
    if (k === 'a' || k === 'arrowleft') keys.current.left = false;
    if (k === 'd' || k === 'arrowright') keys.current.right = false;
    */
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
      const m_width = gameStateRef.current?.map_width || 10000;
      const m_height = gameStateRef.current?.map_height || 8000;
      keys.current.target_x = ((screenX - mmX_start) / mmW) * m_width;
      keys.current.target_y = ((screenY - mmY_start) / mmH) * m_height;
      return;
    }

    const mouseX = screenX + cameraRef.current.x, mouseY = screenY + cameraRef.current.y;
    if(e.button === 0) {
      // Check if we clicked an ally to target them
      const hitPlayer = gameStateRef.current?.players?.find(p => !p.is_self && Math.hypot(p.x - mouseX, p.y - mouseY) < 45);
      if (hitPlayer) {
        keys.current.locked_target_id = hitPlayer.id;
        keys.current.target_x = null; 
        keys.current.target_y = null;
        keys.current.cancel_nav = true;
        keys.current.is_targeting_click = true;
        return; 
      }

      const hitTarget = gameStateRef.current?.enemies?.find(en => Math.hypot(en.x - mouseX, en.y - mouseY) < 45);
      if (hitTarget) {
        keys.current.locked_target_id = hitTarget.id;
        keys.current.target_x = null; 
        keys.current.target_y = null;
        keys.current.cancel_nav = true;
        keys.current.is_targeting_click = true;
      } else {
        keys.current.target_x = mouseX; 
        keys.current.target_y = mouseY;
        keys.current.is_targeting_click = false;
      }
    } else if (e.button === 2) { 
      keys.current.locked_target_id = null; 
      keys.current.shoot = false;
      keys.current.is_targeting_click = false;
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
      return;
    }

    // MOVIMIENTO CONTINUO: Si se mantiene el click izquierdo (buttons === 1)
    if (e.buttons === 1 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const width = canvasRef.current.width, height = canvasRef.current.height;
        const mmW = 200, mmH = 150, margin = 20;
        const mmX_start = width - mmW - margin, mmY_start = height - mmH - margin;

        // Si estamos interactuando con el minimapa (arrastrando en el minimapa)
        if (screenX >= mmX_start && screenX <= width - margin && screenY >= mmY_start && screenY <= height - margin) {
          const m_width = gameStateRef.current?.map_width || 10000;
          const m_height = gameStateRef.current?.map_height || 8000;
          keys.current.target_x = ((screenX - mmX_start) / mmW) * m_width;
          keys.current.target_y = ((screenY - mmY_start) / mmH) * m_height;
        } else if (!keys.current.is_targeting_click) {
          // Movimiento normal por el espacio (cursor sigue al mouse)
          // SOLO si el click inicial no fue para marcar un objetivo
          keys.current.target_x = screenX + cameraRef.current.x;
          keys.current.target_y = screenY + cameraRef.current.y;
        }
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
    user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialPaladio, initialMinerals, initialUpgrades, initialWips, initialEco, initialClan, initialClanTag,
    onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdatePaladio, onUpdateMinerals, isInvisible, onUpdateInvisibility, onUpdateWips, onUpdateEco
  });
  
  useEffect(() => {
    propsRef.current = {
      user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialPaladio, initialMinerals, initialUpgrades, initialWips, initialEco, initialClan, initialClanTag,
      onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdatePaladio, onUpdateMinerals, isInvisible, onUpdateInvisibility, onUpdateWips, onUpdateEco
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
        // El join se enviará por el useEffect de gameStarted
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          if (gameStateRef.current?.current_map_name && gameStateRef.current.current_map_name !== data.state.current_map_name) {
            triggerJumpAnimation();
            keys.current.target_x = null; keys.current.target_y = null;
          }

          // True Visual Interpolation Setup
          if (gameStateRef.current) {
            const oldState = gameStateRef.current;
            
            data.state.players?.forEach(p => {
               const oldP = oldState.players?.find(op => op.id === p.id);
               if (oldP && p.hp > 0) {
                   p.tx = p.x; p.ty = p.y; // Meta del servidor
                   p.x = oldP.x; p.y = oldP.y; // Conservar pos visual local actual
               } else {
                   p.tx = p.x; p.ty = p.y;
               }
            });

            data.state.enemies?.forEach(e => {
               const oldE = oldState.enemies?.find(op => op.id === e.id);
               if (oldE) {
                   e.tx = e.x; e.ty = e.y;
                   e.x = oldE.x; e.y = oldE.y;
               } else {
                   e.tx = e.x; e.ty = e.y;
               }
            });

            data.state.projectiles?.forEach(pr => {
               const oldPr = oldState.projectiles?.find(op => op.id === pr.id);
               if (oldPr) {
                   pr.tx = pr.x; pr.ty = pr.y;
                   pr.x = oldPr.x; pr.y = oldPr.y;
               } else {
                   pr.tx = pr.x; pr.ty = pr.y;
               }
            });
          }

          gameStateRef.current = data.state;
          const me = data.state.players?.find(p => p.is_self);
          
          const nowMs = performance.now();
          if (nowMs - lastReactRenderRef.current > 100) {
              setGameState(data.state);
              if (me) {
                // Actualizar HUD estado liviano — dispara re-render garantizado
                setHudState({
                  hp: me.hp, max_hp: me.max_hp,
                  shld: me.shld, max_shld: me.max_shld,
                  atk: me.atk,
                  spd: me.spd,
                  xp: me.xp, credits: me.credits, level: me.level,
                  paladio: me.paladio,
                  minerals: me.minerals, max_cargo: me.max_cargo,
                  in_safe_zone: me.in_safe_zone,
                  is_dead: me.hp <= 0,
                  repair_rate: me.repair_rate,
                  is_repairing: me.is_repairing,
                });
              }
              lastReactRenderRef.current = nowMs;
          }

          // Gestionar notificaciones de misión completada
          if (data.state.mission_events?.length > 0) {
              const lastMission = data.state.mission_events[data.state.mission_events.length - 1];
              // Evitar duplicados si ya la estamos mostrando
              if (!missionNotification || missionNotification.id !== lastMission.id) {
                  setMissionNotification(lastMission);
                  // Auto-ocultar con animación
                  setTimeout(() => {
                      setMissionNotification(prev => prev?.id === lastMission.id ? { ...prev, exiting: true } : prev);
                      setTimeout(() => {
                          setMissionNotification(prev => prev?.id === lastMission.id ? null : prev);
                      }, 500);
                  }, 6000);
              }
          }

          if (me) {
            // Persist safe zone status for other views (Hangar)
            if (localStorage.getItem('og_player_safe_zone') !== String(me.in_safe_zone)) {
              localStorage.setItem('og_player_safe_zone', me.in_safe_zone);
            }

            const p = propsRef.current;
            const last = lastSyncRef.current;
            
            // Throttled/Smart Updates: Only trigger React state change if value actually differs
            if (p.onUpdateCredits && me.credits !== last.credits) {
                p.onUpdateCredits(me.credits);
                last.credits = me.credits;
            }
            if (p.onUpdatePaladio && me.paladio !== last.paladio) {
                p.onUpdatePaladio(me.paladio);
                last.paladio = me.paladio;
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
            if (p.onUpdateInvisibility && me.is_invisible !== last.is_invisible) {
                p.onUpdateInvisibility(me.is_invisible);
                last.is_invisible = me.is_invisible;
            }
            if (p.onUpdateWips) {
                const wipsStr = JSON.stringify(me.wips || []);
                if (wipsStr !== last.wips) {
                    p.onUpdateWips(me.wips || []);
                    last.wips = wipsStr;
                }
            }
            if (p.onUpdateEco) {
                const ecoStr = JSON.stringify(me.eco || {});
                if (ecoStr !== last.eco) {
                    p.onUpdateEco(me.eco || {});
                    setEco(me.eco || {});
                    last.eco = ecoStr;
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
            // Sync missions if present in state (on-demand sync)
            if (data.state.active_missions && isMounted) {
              setActiveMissions(data.state.active_missions);
            }
          }
         } else if (data.type === 'mission_update') {
           if (isMounted) {
             setActiveMissions(data.active_missions || []);
           }
         }

      };

      ws.onclose = () => { if (isMounted) setTimeout(connectWs, 2000); };
    };

    const renderLoop = () => {
      const now = performance.now();
      const dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      // --- CLIENT-SIDE PREDICTION / INTERPOLATION ---
      if (gameStateRef.current) {
        const state = gameStateRef.current;
        const M_WIDTH = state.map_width || 20800;
        const M_HEIGHT = state.map_height || 15150;

        // Smooth Chasing / Interpolation for Players
        state.players?.forEach(p => {
          if (p.hp > 0 && p.tx !== undefined) {
             const dist = Math.hypot(p.tx - p.x, p.ty - p.y);
             // Si hay demasiada diferencia (lag spike), hacer salto instantáneo (snap)
             if (dist > 500) {
                 p.x = p.tx; p.y = p.ty;
             } else {
                 // El jugador propio necesita interpolación más agresiva
                 // para que la cámara siga de cerca y evite desync visual
                 const glideFactor = p.is_self ? 40.0 : 15.0;
                 const glide = Math.min(1.0, dt * glideFactor); 
                 p.x += (p.tx - p.x) * glide;
                 p.y += (p.ty - p.y) * glide;
             }
             p.x = Math.max(20, Math.min(M_WIDTH - 20, p.x));
             p.y = Math.max(20, Math.min(M_HEIGHT - 20, p.y));
          }
        });

        // Move Enemies smoothly
        state.enemies?.forEach(e => {
            if (e.tx !== undefined) {
                const dist = Math.hypot(e.tx - e.x, e.ty - e.y);
                if (dist > 500) {
                    e.x = e.tx; e.y = e.ty;
                } else {
                    const glide = Math.min(1.0, dt * 15.0);
                    e.x += (e.tx - e.x) * glide;
                    e.y += (e.ty - e.y) * glide;
                }
            }
        });

        // Move Projectiles smoothly
        state.projectiles?.forEach(pr => {
            if (pr.tx !== undefined) {
                const glide = Math.min(1.0, dt * 30.0);
                pr.x += (pr.tx - pr.x) * glide;
                pr.y += (pr.ty - pr.y) * glide;
            }
        });
      }

      const inputNow = Date.now();
      if (wsRef.current?.readyState === WebSocket.OPEN && inputNow - lastInputTime > 50) {
        // Construir payload limpio: solo enviar target_x/y si tienen coordenadas reales
        const payload = { ...keys.current };
        if (payload.target_x === null || payload.target_y === null) {
          delete payload.target_x;
          delete payload.target_y;
        }
        // Consumir cancel_nav después de enviarlo una vez
        if (payload.cancel_nav) {
          keys.current.cancel_nav = false;
        } else {
          delete payload.cancel_nav;
        }
        wsRef.current.send(JSON.stringify({ type: 'input', keys: payload }));
        lastInputTime = inputNow;
      }
      const canvas = canvasRef.current;
      if (gameStateRef.current && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const me = gameStateRef.current.players?.find(p => p.is_self);
          if (me) {
            const m_width = gameStateRef.current.map_width || 10000;
            const m_height = gameStateRef.current.map_height || 8000;
            cameraRef.current.x = Math.max(0, Math.min(m_width - canvas.width, me.x - canvas.width / 2));
            cameraRef.current.y = Math.max(0, Math.min(m_height - canvas.height, me.y - canvas.height / 2));
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

  // --- SEND JOIN MESSAGE ONLY WHEN STARTED ---
  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && !joinSentRef.current) {
      let userId = propsRef.current.user?.username || sessionStorage.getItem('orbita_galactica_user_id') || ('user_' + Math.random().toString(36).substr(2, 9));
      sessionStorage.setItem('orbita_galactica_user_id', userId);
      
      const p = propsRef.current;
      wsRef.current.send(JSON.stringify({ 
        type: 'join', userId, ship_type: p.selectedShip,
        modules: p.initialModules, initial_ammo: p.initialAmmo,
        level: p.initialLevel, xp: p.initialXp, credits: p.initialCredits,
        initialPaladio: propsRef.current.initialPaladio,
        minerals: p.initialMinerals, upgrades: p.initialUpgrades,
        clan: p.initialClan, clanTag: p.initialClanTag,
        wips: p.initialWips,
        eco: p.initialEco
      }));
      joinSentRef.current = true;
    }
  }, [gameStarted]);

  // --- REAL-TIME EQUIPMENT & RESOURCE SYNC ---
  // If modules or ammo change via props (from Hangar/Shop), sync with the active session
  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      wsRef.current.send(JSON.stringify({ 
        type: 'update_equipment', 
        modules: initialModules 
      }));
    }
  }, [initialModules, gameStarted]);

  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      wsRef.current.send(JSON.stringify({ 
        type: 'update_resources', 
        ammo_data: { ammo: initialAmmo, missiles: {} } 
      }));
    }
  }, [initialAmmo, gameStarted]);

  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      wsRef.current.send(JSON.stringify({ 
        type: 'update_upgrades', 
        upgrades: initialUpgrades 
      }));
    }
  }, [initialUpgrades, gameStarted]);

  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      wsRef.current.send(JSON.stringify({ 
        type: 'update_wips', 
        wips: initialWips 
      }));
    }
  }, [initialWips, gameStarted]);

  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      wsRef.current.send(JSON.stringify({ 
        type: 'update_eco', 
        eco_data: eco 
      }));
    }
  }, [eco, gameStarted]);

  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      wsRef.current.send(JSON.stringify({ 
        type: 'switch_ship', 
        ship_type: selectedShip 
      }));
    }
  }, [selectedShip, gameStarted]);

  const me = gameState?.players?.find(p => p.is_self);
  const party = gameState?.party;
  const partyInvites = gameState?.party_invites || {};

  return (
    <>
      {/* LOADING SCREEN OVERLAY */}
      {!gameStarted && (
        <div className="loading-screen-overlay">
          <div className="loading-container">
            <h1 className="loading-title">Órbita Galáctica</h1>
            
            {!isLoaded ? (
              <>
                <div style={{ width: '100%', position: 'relative' }}>
                  <div className="loading-bar-wrapper">
                    <div className="loading-bar-fill" style={{ width: `${loadingProgress}%` }} />
                  </div>
                  <span className="loading-percentage">{Math.floor(loadingProgress)}%</span>
                </div>
                <div className="loading-message">{loadingMessage}</div>
              </>
            ) : (
              <button className="battle-button" onClick={() => setGameStarted(true)}>
                ⚔️ A LA BATALLA
              </button>
            )}
          </div>
        </div>
      )}

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
          <style>{`
            @keyframes pulse-safe { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
            @keyframes pulse-repair {
              0% { box-shadow: 0 0 5px #00ff66; border-color: #00ff66; }
              50% { box-shadow: 0 0 20px #00ff66; border-color: #ffffff; }
              100% { box-shadow: 0 0 5px #00ff66; border-color: #00ff66; }
            }
            .hotbar-slot.repairing-active {
              animation: pulse-repair 1.5s infinite ease-in-out;
              background: rgba(0, 255, 100, 0.2) !important;
            }
            @keyframes flash-oxygen {
              0% { opacity: 0.5; transform: translateX(-50%) scale(1); }
              100% { opacity: 1; transform: translateX(-50%) scale(1.05); }
            }
          `}</style>
          <span>🛡️</span>
          <span>ZONA SEGURA</span>
        </div>
      )}

      {me?.oxygen_warning && !me?.in_safe_zone && (
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          background: 'rgba(255, 0, 0, 0.15)', backdropFilter: 'blur(10px)',
          border: '2px solid #ff4444', padding: '15px 30px', borderRadius: '10px',
          color: '#ff4444', fontFamily: 'Orbitron', fontWeight: 'bold',
          animation: 'flash-oxygen 1s infinite alternate', zIndex: 1000,
          boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)', pointerEvents: 'none'
        }}>
           <span style={{ fontSize: '24px' }}>⚠️ ALERTA: FALTA DE OXÍGENO ⚠️</span>
           <span style={{ fontSize: '14px', letterSpacing: '2px' }}>REGRESA AL CENTRO DEL MAPA DE INMEDIATO</span>
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

      {/* --- MISSION COMPLETION NOTIFICATION --- */}
      {missionNotification && (
          <div className={`mission-notification-overlay ${missionNotification.exiting ? 'mission-notif-exit' : ''}`}>
              <div className="mission-notification-card">
                  <h3 className="mission-notification-title">¡MISIÓN COMPLETADA!</h3>
                  <div className="mission-notification-name">{missionNotification.title}</div>
                  <div className="mission-notification-rewards">
                      {missionNotification.rewards.xp > 0 && (
                          <div className="notif-reward-item">
                              <span className="notif-reward-icon" style={{color: '#33ccff'}}>⭐</span>
                              <span className="notif-reward-value">{missionNotification.rewards.xp.toLocaleString()} XP</span>
                          </div>
                      )}
                      {missionNotification.rewards.credits > 0 && (
                          <div className="notif-reward-item">
                              <span className="notif-reward-icon" style={{color: '#ffcc00'}}>🪙</span>
                              <span className="notif-reward-value">{missionNotification.rewards.credits.toLocaleString()} CR</span>
                          </div>
                      )}
                      {missionNotification.rewards.paladio > 0 && (
                          <div className="notif-reward-item">
                              <span className="notif-reward-icon" style={{color: '#00ffcc'}}>💎</span>
                              <span className="notif-reward-value">{missionNotification.rewards.paladio.toLocaleString()} PLD</span>
                          </div>
                      )}
                      {missionNotification.rewards.ammo && Object.keys(missionNotification.rewards.ammo).length > 0 && (
                          <div className="notif-reward-item">
                              <span className="notif-reward-icon" style={{color: '#ff4444'}}>🔋</span>
                              <span className="notif-reward-value">MUNICIÓN</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className="ui-overlay">
        {(me || hudState) && (
          <>
            <div className="status-display-container hud-mode">
                <div className="status-block hud-variant">
                    <div className="status-item"><span>✪</span><span className="status-value">{Math.floor(hudState?.xp ?? 0).toLocaleString()} XP</span></div>
                    <div className="status-item"><span style={{ color: '#ffcc00' }}>🔋</span><span className="status-value">{(hudState?.credits ?? 0).toLocaleString()} CR</span></div>
                    <div className="status-item"><span style={{ color: '#00ffcc' }}>🎖️</span><span className="status-value">Lvl {hudState?.level ?? 0}</span></div>
                    <div className="status-item" style={{ background: 'rgba(100,0,200,0.1)', borderLeft: '2px solid #cc33ff' }}>
                        <span style={{ color: '#cc33ff' }}>🪐</span>
                        <span className="status-value">{(hudState?.paladio ?? 0).toLocaleString()} PAL</span>
                    </div>
                </div>
                <div className="status-block hud-variant" style={{ minWidth: '200px' }}>
                    {/* HP Bar */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.65rem', color: '#ff4466', fontWeight: 'bold', fontFamily: 'Orbitron' }}>❤️ CASCO</span>
                            <span style={{ fontSize: '0.65rem', color: '#fff', fontFamily: 'Orbitron' }}>
                                {Math.floor(hudState?.hp ?? 0)} / {hudState?.max_hp ?? 0}
                                {gameState?.timed_bonuses?.hp > 0 && <span style={{ color: '#ff4466', fontSize: '0.6rem', marginLeft: '4px' }}>(+{gameState.timed_bonuses.hp})</span>}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,68,102,0.2)' }}>
                            <div style={{
                                width: `${hudState?.max_hp > 0 ? Math.max(0, Math.min(100, ((hudState?.hp ?? 0) / hudState.max_hp) * 100)) : 0}%`,
                                height: '100%',
                                background: (hudState?.hp / hudState?.max_hp) > 0.5 ? '#ff4466' : (hudState?.hp / hudState?.max_hp) > 0.25 ? '#ff8800' : '#ff2200',
                                boxShadow: '0 0 6px #ff446688',
                                transition: 'width 0.3s ease-out, background 0.5s'
                            }} />
                        </div>
                    </div>

                    {/* Shield Bar */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.65rem', color: '#00aaff', fontWeight: 'bold', fontFamily: 'Orbitron' }}>🛡️ ESCUDO</span>
                            <span style={{ fontSize: '0.65rem', color: '#fff', fontFamily: 'Orbitron' }}>
                                {Math.floor(hudState?.shld ?? 0)} / {hudState?.max_shld ?? 0}
                                {gameState?.timed_bonuses?.shld > 0 && <span style={{ color: '#00aaff', fontSize: '0.6rem', marginLeft: '4px' }}>(+{gameState.timed_bonuses.shld})</span>}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(0,170,255,0.2)' }}>
                            <div style={{
                                width: `${hudState?.max_shld > 0 ? Math.max(0, Math.min(100, ((hudState?.shld ?? 0) / hudState.max_shld) * 100)) : 0}%`,
                                height: '100%',
                                background: '#00aaff',
                                boxShadow: '0 0 6px #00aaff88',
                                transition: 'width 0.3s ease-out'
                            }} />
                        </div>
                    </div>

                    {/* Speed */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#00ffcc', fontWeight: 'bold', fontFamily: 'Orbitron' }}>🚀 VELOCIDAD</span>
                        <span style={{ fontSize: '0.7rem', color: '#fff', fontFamily: 'Orbitron' }}>
                            {hudState?.spd ?? 0}
                            {gameState?.timed_bonuses?.spd > 0 && <span style={{ color: '#00ffcc', fontSize: '0.6rem', marginLeft: '4px' }}>(+{gameState.timed_bonuses.spd})</span>}
                        </span>
                    </div>

                    {/* Attack Damage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#ffcc00', fontWeight: 'bold', fontFamily: 'Orbitron' }}>🔥 ATAQUE</span>
                        <span style={{ fontSize: '0.7rem', color: '#fff', fontFamily: 'Orbitron' }}>
                            {hudState?.atk ?? 0}
                            {gameState?.timed_bonuses?.atk > 0 && <span style={{ color: '#ffcc00', fontSize: '0.6rem', marginLeft: '4px' }}>(+{gameState.timed_bonuses.atk})</span>}
                        </span>
                    </div>
                </div>

                {/* BLOQUE DE BODEGA */}
                <div className="status-block hud-variant" style={{ minWidth: '180px', borderLeft: '2px solid #00ffcc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#00ffcc', fontWeight: 'bold', fontFamily: 'Orbitron' }}>📦 BODEGA</span>
                        <span style={{ fontSize: '0.65rem', color: '#fff' }}>
                            {(() => {
                                const current = hudState?.minerals ? Object.values(hudState.minerals).reduce((a, b) => a + b, 0) : 0;
                                return `${current} / ${hudState?.max_cargo || 1500} T`;
                            })()}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {(() => {
                            const current = hudState?.minerals ? Object.values(hudState.minerals).reduce((a, b) => a + b, 0) : 0;
                            const max = hudState?.max_cargo || 1500;
                            const pct = Math.min(100, (current / max) * 100);
                            let barColor = '#00ffcc';
                            if (pct > 90) barColor = '#ff3366';
                            else if (pct > 70) barColor = '#ffcc00';
                            return <div style={{ width: `${pct}%`, height: '100%', background: barColor, boxShadow: `0 0 8px ${barColor}66`, transition: 'width 0.3s ease-out' }} />;
                        })()}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {[
                            { type: 'titanium', icon: '🔹' },
                            { type: 'plutonium', icon: '🏮' },
                            { type: 'silicon', icon: '💾' },
                            { type: 'iridium', icon: '☄️' }
                        ].map(m => (
                            <span key={m.type} style={{ fontSize: '0.65rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <span style={{ fontSize: '0.8rem' }}>{m.icon}</span>
                                <span style={{ color: '#aaa' }}>{hudState?.minerals?.[m.type] || 0}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ECO CONTROL HUD */}
            <div className="eco-control-hud" style={{
                position: 'fixed',
                top: '20px',
                right: '420px', 
                width: '180px',
                background: 'rgba(5, 8, 16, 0.9)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${eco.deployed ? '#00ffcc88' : '#ff336644'}`,
                borderRadius: '8px',
                padding: '12px',
                zIndex: 1000,
                fontFamily: 'Orbitron',
                boxShadow: eco.deployed ? '0 0 15px rgba(0, 255, 204, 0.1)' : 'none',
                pointerEvents: 'auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ 
                        width: '32px', height: '32px', 
                        background: '#070b16', 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: `1px solid ${eco.deployed ? '#00ffcc' : '#333'}`
                    }}>
                        <img src="/eco_drone.png" alt="ECO" style={{ width: '24px', height: '24px', objectFit: 'contain', opacity: eco.deployed ? 1 : 0.4 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#00ffcc', fontWeight: 'bold' }}>SISTEMA E.C.O.</div>
                        <div style={{ fontSize: '0.5rem', color: eco.deployed ? '#00ffcc' : '#ff3366' }}>{eco.deployed ? 'MODO ACTIVO' : 'DESCONECTADO'}</div>
                    </div>
                </div>

                {!eco.active ? (
                    <div style={{ fontSize: '0.6rem', color: '#555', textAlign: 'center', padding: '5px' }}>SISTEMA NO ADQUIRIDO</div>
                ) : (
                    <>
                        {/* Stats Bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                            {/* Integrity (Vida) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa', marginBottom: '2px' }}>
                                <span>INTEGRIDAD</span>
                                <span>{Math.floor(eco?.integrity ?? 100)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${eco?.integrity ?? 100}%`, height: '100%', background: (eco?.integrity ?? 100) > 30 ? '#00ffcc' : '#ff3366', boxShadow: '0 0 5px rgba(0,255,204,0.3)' }} />
                            </div>

                            {/* Shield (Escudo) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa', marginBottom: '2px' }}>
                                <span>ESCUDO</span>
                                <span>{Math.floor(((eco?.shield ?? 0) / (eco?.max_shield || 500)) * 100)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${((eco?.shield ?? 0) / (eco?.max_shield || 500)) * 100}%`, height: '100%', background: '#00ccff', boxShadow: '0 0 5px rgba(0,204,255,0.3)' }} />
                            </div>

                            {/* Fuel (Combustible) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa', marginBottom: '2px' }}>
                                <span>COMBUSTIBLE</span>
                                <span>{Math.floor(eco?.fuel ?? 5000)}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${((eco?.fuel ?? 5000) / 5000) * 100}%`, height: '100%', background: '#ffaa00', boxShadow: '0 0 5px rgba(255,170,0,0.3)' }} />
                            </div>

                            {/* Speed */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa' }}>
                                <span>VELOCIDAD</span>
                                <span style={{ color: '#fff' }}>{Math.floor(eco.speed || 0)} KM/H</span>
                            </div>
                        </div>

                        {/* Mode Selector */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.55rem', color: '#aaa', marginBottom: '4px' }}>PROTOCOLO DE ACCIÓN</div>
                            <select 
                                value={eco.mode}
                                onChange={(e) => {
                                    const newMode = e.target.value;
                                    const newEco = { ...eco, mode: newMode };
                                    setEco(newEco);
                                    if (onUpdateEco) onUpdateEco(newEco);
                                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                                        wsRef.current.send(JSON.stringify({ type: 'update_eco_mode', mode: newMode }));
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    background: '#070b16',
                                    border: '1px solid #1a2a4a',
                                    color: '#00ffcc',
                                    fontSize: '0.65rem',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="passive">MODO PASIVO</option>
                                <option value="aggressive">MODO AGRESIVO</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => {
                                const newEco = { ...eco, deployed: !eco.deployed };
                                setEco(newEco);
                                if (onUpdateEco) onUpdateEco(newEco);
                                if (wsRef.current?.readyState === WebSocket.OPEN) {
                                    wsRef.current.send(JSON.stringify({ type: 'toggle_eco', deployed: newEco.deployed }));
                                }
                            }}
                            className={`eco-toggle-btn ${eco.deployed ? 'active' : ''}`}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: eco.deployed ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 51, 102, 0.1)',
                                border: `1px solid ${eco.deployed ? '#00ffcc' : '#ff3366'}`,
                                color: eco.deployed ? '#00ffcc' : '#ff3366',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            {eco.deployed ? 'DESACTIVAR SISTEMA' : 'ACTIVAR SISTEMA'}
                        </button>
                    </>
                )}
            </div>

            {/* MISSION TRACKER HUD */}
            {activeMissions && activeMissions.length > 0 && (
              <div 
                className={`mission-tracker-hud ${missionTrackerExpanded ? 'expanded' : ''}`}
                onMouseEnter={() => !missionTrackerExpanded && setMissionTrackerExpanded(true)}
                onMouseLeave={() => missionTrackerExpanded && setMissionTrackerExpanded(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setMissionTrackerExpanded(!missionTrackerExpanded);
                }}
              >
                <div className="mission-hud-header">
                  <div className="mission-hud-title">
                    {missionTrackerExpanded ? '📜 BITÁCORA DE MISIONES' : '🎯 OBJETIVOS'}
                  </div>
                  <div className="mission-hud-toggle">▼</div>
                </div>

                <div className="mission-hud-content">
                  {activeMissions.map((m, idx) => (
                    <div key={m.id || idx} className="mission-hud-item">
                      <span className="mission-hud-mtitle">{m.title}</span>
                      
                      {missionTrackerExpanded && (
                        <div className="mission-hud-desc">{m.description}</div>
                      )}

                      <div className="mission-hud-row">
                        <span>{m.target_alien}:</span>
                        <span style={{ color: m.progress >= m.target_count ? '#00ffcc' : '#ffcc00', fontWeight: 'bold' }}>
                          {m.progress} / {m.target_count}
                        </span>
                      </div>

                      <div className="mission-hud-progress-bg">
                        <div className="mission-hud-progress-fill" style={{ 
                          width: `${Math.min(100, (m.progress / m.target_count) * 100)}%`,
                          background: m.progress >= m.target_count ? '#00ffcc' : '',
                          boxShadow: m.progress >= m.target_count ? '0 0 10px #00ffcc' : 'none'
                        }} />
                      </div>

                      {missionTrackerExpanded && (
                        <div className="mission-hud-reward-mini">
                          <div className="reward-tag">XP <span>+{m.reward_xp}</span></div>
                          <div className="reward-tag">CR <span>+{m.reward_credits}</span></div>
                          {m.reward_paladio > 0 && <div className="reward-tag">PAL <span>+{m.reward_paladio}</span></div>}
                          {m.reward_ammo && Object.entries(m.reward_ammo).map(([ammo, qty]) => (
                            <div key={ammo} className="reward-tag ammo">
                              {ammo.replace('missile_', 'M').toUpperCase()} <span>+{qty}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {m.progress >= m.target_count && (
                        <div style={{ fontSize: '0.6rem', color: '#00ffcc', textAlign: 'right', marginTop: '5px', fontWeight: 'bold', textShadow: '0 0 5px #00ffcc' }}>¡LISTA PARA COBRAR!</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        hudState?.repair_rate > 0 
                            ? { id: 'repair_bot', type: 'utility', icon: '🔧', key: '9', repairing: hudState.is_repairing }
                            : { id: 'blank_9', key: '9', disabled: true },
                        { id: 'blank_0', key: '0', disabled: true },
                    ].map((slot) => {
                        const isActive = (slot.type === 'laser' && me?.ammo_type === slot.id) || (slot.type === 'missile' && me?.missile_type === slot.id);
                        const count = slot.type === 'laser' ? me?.ammo?.[slot.id] : slot.type === 'missile' ? (me?.missiles?.[slot.id] || 0) : null;
                        return (
                            <div key={slot.id} className={`hotbar-slot ${isActive ? 'active' : ''} ${slot.repairing ? 'repairing-active' : ''} ${slot.disabled ? 'disabled' : ''}`} onMouseDown={(e) => e.stopPropagation()} 
                                onClick={() => {
                                    if (slot.disabled) return;
                                    if (slot.type === 'utility') {
                                        wsRef.current?.send(JSON.stringify({ type: 'toggle_repair' }));
                                    } else {
                                        wsRef.current?.send(JSON.stringify({ type: 'switch_ammo', ammo_id: slot.id }));
                                    }
                                }}
                            >
                                <div className="slot-progress-bar"><div className="slot-progress-fill" style={{ width: (isActive || slot.repairing) ? '100%' : '20%', opacity: (isActive || slot.repairing) ? 1 : 0.3, background: slot.repairing ? '#00ff66' : '' }} /></div>
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

      {hudState?.is_dead && (
          <div className="death-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'radial-gradient(circle, rgba(60, 0, 0, 0.9) 10%, rgba(10, 5, 5, 0.98) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, fontFamily: 'Orbitron', textAlign: 'center', backdropFilter: 'blur(10px)',
            animation: 'fade-in-death 1s forwards'
          }}>
            <style>{`
              @keyframes fade-in-death { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            
            <div style={{ padding: '40px', background: 'rgba(0,0,0,0.5)', border: '2px solid #ff333333', borderRadius: '20px', boxShadow: '0 0 50px rgba(255,0,0,0.2)' }}>
                <h1 style={{ color: '#ff3333', fontSize: '3rem', textShadow: '0 0 20px #ff0000', marginBottom: '10px' }}>CONEXIÓN PERDIDA</h1>
                <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '30px', letterSpacing: '2px', opacity: 0.8 }}>SU NAVE HA SIDO DESTRUIDA</h2>
                
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '40px', maxWidth: '400px' }}>
                    Los sistemas críticos han fallado debido a la desintegración catastrófica del casco. 
                    El seguro de su facción puede reconstruir su nave en la Base.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button 
                        onClick={async () => {
                            const success = await onRepair();
                            if (success) {
                                // Reparado
                            }
                        }}
                        className="battle-button" 
                        style={{ padding: '18px 40px', background: '#00ffcc', color: '#000', width: '100%', fontSize: '1.1rem' }}
                    >
                        🔧 RECONSTRUIR {user?.vip_until && new Date(user.vip_until) > new Date() ? '(GRATIS)' : '(500 CR)'}
                    </button>
                    
                    <button 
                        onClick={() => window.location.reload()}
                        style={{ padding: '12px', background: 'transparent', border: '1px solid #ff333366', color: '#ff3333', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '0.8rem' }}
                    >
                        ABANDONAR SESIÓN
                    </button>
                </div>
            </div>
          </div>
      )}

      <ChatBox 
        socket={wsRef.current} 
        user={user} 
        playerFaction={initialClan} 
        clanTag={initialClanTag} 
      />
    </>
  );
}
