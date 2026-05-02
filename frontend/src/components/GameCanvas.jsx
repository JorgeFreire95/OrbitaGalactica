import { useEffect, useRef, useState, useCallback } from 'react';
import { drawGame } from '../utils/renderer';
import { getRank, MODULES_CATALOG, getItemById } from '../utils/gameData';
import ChatBox from './ChatBox';

const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function GameCanvas({ user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialPaladio, initialMinerals, initialUpgrades, initialWips, initialEco, initialClan, initialClanTag, onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdatePaladio, onUpdateMinerals, onRepair, isInvisible, onUpdateInvisibility, onUpdateWips, onUpdateEco, onUpdateOwnedShips, equippedDesign }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const gameStateRef = useRef(null);
  const joinSentRef = useRef(false);
  const lastToggleRef = useRef(0); // Cooldown para el botón de ECO
  const cameraRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState(null);
  // Estado liviano y dedicado para el HUD — garantiza re-renders al recibir daño, etc.
  const [hudState, setHudState] = useState(null);
  const [error, setError] = useState(null);
  const [isJumping, setIsJumping] = useState(false);
  const [showJumpPrompt, setShowJumpPrompt] = useState(false);
  const [activeMissions, setActiveMissions] = useState([]);
  const [missionTrackerExpanded, setMissionTrackerExpanded] = useState(false);
  
  const [isEcoMinimized, setIsEcoMinimized] = useState(false);
  const isNavigatingRef = useRef(false);
  const lastFrameTimeRef = useRef(performance.now());
  const lastReactRenderRef = useRef(0);
  const isDraggingRef = useRef(false);

  // --- DRAGGABLE HUD STATE ---
  const [isUiLocked, setIsUiLocked] = useState(() => localStorage.getItem('og_ui_locked') === 'true');
  const [hotbarPos, setHotbarPos] = useState(() => {
    const saved = localStorage.getItem('og_hotbar_pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth / 2 - 300, y: window.innerHeight - 120 };
  });
  const [ecoPos, setEcoPos] = useState(() => {
    const saved = localStorage.getItem('og_eco_pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 620, y: 20 };
  });
  const [missionPos, setMissionPos] = useState(() => {
    const saved = localStorage.getItem('og_mission_pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 320, y: 150 };
  });
  const [statusPos, setStatusPos] = useState(() => JSON.parse(localStorage.getItem('og_status_pos')) || { x: 20, y: 20 });
  const [partyPos, setPartyPos] = useState(() => JSON.parse(localStorage.getItem('og_party_pos')) || { x: 20, y: 80 });
  const [chatPos, setChatPos] = useState(() => JSON.parse(localStorage.getItem('og_chat_pos')) || { x: 20, y: window.innerHeight - 320 });
  const [minimapPos, setMinimapPos] = useState(() => JSON.parse(localStorage.getItem('og_minimap_pos')) || { x: window.innerWidth - 220, y: window.innerHeight - 170 });
  const [safeZonePos, setSafeZonePos] = useState(() => JSON.parse(localStorage.getItem('og_safe_zone_pos')) || { x: window.innerWidth / 2, y: window.innerHeight - 180 });

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const missionDragOffset = useRef({ x: 0, y: 0 });
  const lastSyncRef = useRef({ credits: -1, paladio: -1, xp: -1, level: -1, minerals: '', ammo: '', wips: '', eco: '', is_invisible: null });
  const [inviteIdText, setInviteIdText] = useState('');
  const [showPartyMenu, setShowPartyMenu] = useState(false);
  const [missionNotification, setMissionNotification] = useState(null);
  const [eco, setEco] = useState(initialEco || { active: false, deployed: false, mode: 'passive', level: 1, integrity: 100, shield: 100, max_shield: 100, fuel: 5000, speed: 0, equipped: { lasers: [], generators: [], protocols: [], utility: [] } });
  const [activeCategory, setActiveCategory] = useState('lasers');
  const [showCategoryBar, setShowCategoryBar] = useState(false);
  const [hotbarSlots, setHotbarSlots] = useState(() => {
    const saved = localStorage.getItem('og_hotbar_slots');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'standard', type: 'laser', icon: '⚪', image: '/std_ammo.jpg', key: '1' },
      { id: 'thermal', type: 'laser', icon: '🔥', image: '/thermal_ammo.jpg', key: '2' },
      { id: 'plasma', type: 'laser', icon: '🔷', image: '/plasma_ammo.jpg', key: '3' },
      { id: 'siphon', type: 'laser', icon: '🔋', image: '/siphon_ammo.png', key: '4' },
      { id: 'missile_1', type: 'missile', icon: '🚀', key: '5' },
      { id: 'missile_2', type: 'missile', icon: '🚀', key: '6' },
      { id: 'missile_3', type: 'missile', icon: '☢️', key: '7' },
      { id: 'blank_8', key: '8', disabled: true },
      { id: 'repair_bot', type: 'utility', icon: '🔧', key: '9' },
      { id: 'blank_0', key: '0', disabled: true },
    ];
  });
  const [draggedItem, setDraggedItem] = useState(null); // { item, sourceIndex, sourceType }
  
  const minimapPosRef = useRef(minimapPos);
  const isUiLockedRef = useRef(isUiLocked);

  useEffect(() => { minimapPosRef.current = minimapPos; }, [minimapPos]);
  useEffect(() => { isUiLockedRef.current = isUiLocked; }, [isUiLocked]);

  const draggingElementRef = useRef(null); // { type, offset: {x, y} }

  const resetHudPositions = () => {
    const defaults = {
      hotbar: { x: window.innerWidth / 2 - 300, y: window.innerHeight - 120 },
      status: { x: 20, y: 20 },
      eco: { x: window.innerWidth - 200, y: 20 },
      mission: { x: window.innerWidth - 220, y: window.innerHeight - 400 },
      party: { x: 20, y: 80 },
      chat: { x: 20, y: window.innerHeight - 320 },
      minimap: { x: window.innerWidth - 220, y: window.innerHeight - 170 },
      safezone: { x: window.innerWidth / 2, y: window.innerHeight - 180 }
    };
    setHotbarPos(defaults.hotbar);
    setEcoPos(defaults.eco);
    setMissionPos(defaults.mission);
    setStatusPos(defaults.status);
    setPartyPos(defaults.party);
    setChatPos(defaults.chat);
    setMinimapPos(defaults.minimap);
    setSafeZonePos(defaults.safezone);
    
    const defaultSlots = [
      { id: 'standard', type: 'laser', icon: '⚪', image: '/std_ammo.jpg', key: '1' },
      { id: 'thermal', type: 'laser', icon: '🔥', image: '/thermal_ammo.jpg', key: '2' },
      { id: 'plasma', type: 'laser', icon: '🔷', image: '/plasma_ammo.jpg', key: '3' },
      { id: 'siphon', type: 'laser', icon: '🔋', image: '/siphon_ammo.png', key: '4' },
      { id: 'missile_1', type: 'missile', icon: '🚀', key: '5' },
      { id: 'missile_2', type: 'missile', icon: '🚀', key: '6' },
      { id: 'missile_3', type: 'missile', icon: '☢️', key: '7' },
      { id: 'blank_8', key: '8', disabled: true },
      { id: 'repair_bot', type: 'utility', icon: '🔧', key: '9' },
      { id: 'blank_0', key: '0', disabled: true },
    ];
    setHotbarSlots(defaultSlots);
    localStorage.setItem('og_hotbar_slots', JSON.stringify(defaultSlots));

    Object.keys(defaults).forEach(key => {
      localStorage.setItem(`og_${key}_pos`, JSON.stringify(defaults[key]));
    });
  };

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
      const slotMap = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9 };
      
      if (slotMap[k] !== undefined) {
          const slot = hotbarSlots[slotMap[k]];
          if (slot && !slot.disabled) {
              if (slot.type === 'utility' && slot.id === 'repair_bot') {
                  wsRef.current.send(JSON.stringify({ type: 'toggle_repair' }));
              } else if (slot.type === 'laser' || slot.type === 'missile') {
                  wsRef.current.send(JSON.stringify({ type: 'switch_ammo', ammo_id: slot.id }));
              }
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
    if (k === 'c') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'use_cloak' }));
      }
    }
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
    if (!canvasRef.current || e.target !== canvasRef.current) return;
    isNavigatingRef.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const mmW = 200, mmH = 150;
    const mmX_start = minimapPos.x, mmY_start = minimapPos.y;

    // Si clicamos en el minimapa
    if (screenX >= mmX_start && screenX <= mmX_start + mmW && screenY >= mmY_start && screenY <= mmY_start + mmH) {
      // MODO JUEGO: Navegar (Modo edición minimapa desactivado por petición de usuario)
      // MODO JUEGO: Navegar
      isNavigatingRef.current = true;
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
    if (draggingElementRef.current) {
      const { type } = draggingElementRef.current;
      if (type === 'hotbar') localStorage.setItem('og_hotbar_pos', JSON.stringify(hotbarPos));
      if (type === 'eco') localStorage.setItem('og_eco_pos', JSON.stringify(ecoPos));
      if (type === 'mission') localStorage.setItem('og_mission_pos', JSON.stringify(missionPos));
      if (type === 'status') localStorage.setItem('og_status_pos', JSON.stringify(statusPos));
      if (type === 'party') localStorage.setItem('og_party_pos', JSON.stringify(partyPos));
      if (type === 'chat') localStorage.setItem('og_chat_pos', JSON.stringify(chatPos));
      if (type === 'minimap') localStorage.setItem('og_minimap_pos', JSON.stringify(minimapPos));
      if (type === 'safezone') localStorage.setItem('og_safe_zone_pos', JSON.stringify(safeZonePos));
      
      draggingElementRef.current = null;
    }
    setIsDragging(false);
    isNavigatingRef.current = false;
  }, [hotbarPos, missionPos, ecoPos, statusPos, partyPos, chatPos, minimapPos, safeZonePos]);

  const handleMouseMove = useCallback((e) => {
    if (draggingElementRef.current) {
      const { type, offset } = draggingElementRef.current;
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;

      switch (type) {
        case 'hotbar': setHotbarPos({ x: newX, y: newY }); break;
        case 'eco': setEcoPos({ x: newX, y: newY }); break;
        case 'mission': setMissionPos({ x: newX, y: newY }); break;
        case 'status': setStatusPos({ x: newX, y: newY }); break;
        case 'party': setPartyPos({ x: newX, y: newY }); break;
        case 'chat': setChatPos({ x: newX, y: newY }); break;
        case 'minimap': setMinimapPos({ x: newX, y: newY }); break;
        case 'safezone': setSafeZonePos({ x: newX, y: newY }); break;
        default: break;
      }
      return;
    }

    // MOVIMIENTO CONTINUO: Si se mantiene el click izquierdo (buttons === 1)
    if (e.buttons === 1 && canvasRef.current && isNavigatingRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const mmW = 200, mmH = 150;
        const mmX_start = minimapPos.x, mmY_start = minimapPos.y;

        // Si estamos interactuando con el minimapa (arrastrando en el minimapa)
        if (screenX >= mmX_start && screenX <= mmX_start + mmW && screenY >= mmY_start && screenY <= mmY_start + mmH) {
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
  }, []);

  const handleHotbarMouseDown = useCallback((e) => {
    if (isUiLocked) return;
    draggingElementRef.current = { type: 'hotbar', offset: { x: e.clientX - hotbarPos.x, y: e.clientY - hotbarPos.y } };
    setIsDragging(true);
    e.stopPropagation();
  }, [isUiLocked, hotbarPos]);

  const handleMissionMouseDown = (e) => { /* Disabled as per user request */ };
  const handleEcoMouseDown = (e) => { /* Disabled as per user request */ };
  const handleStatusMouseDown = (e) => { /* Disabled as per user request */ };
  const handlePartyMouseDown = (e) => { /* Disabled as per user request */ };
  const handleChatMouseDown = useCallback((e) => {
    if (isUiLocked) return;
    draggingElementRef.current = { type: 'chat', offset: { x: e.clientX - chatPos.x, y: e.clientY - chatPos.y } };
    setIsDragging(true);
    e.stopPropagation();
  }, [isUiLocked, chatPos]);
  const handleMinimapMouseDown = (e) => { /* Disabled as per user request */ };

  const handleSafeZoneMouseDown = useCallback((e) => {
    if (isUiLocked) return;
    draggingElementRef.current = { type: 'safezone', offset: { x: e.clientX - safeZonePos.x, y: e.clientY - safeZonePos.y } };
    setIsDragging(true);
    e.stopPropagation();
  }, [isUiLocked, safeZonePos]);

  // --- ITEM DRAG & DROP LOGIC ---
  const handleItemDragStart = (e, index, type, item) => {
    if (isUiLocked) {
      e.preventDefault();
      return;
    }
    setDraggedItem({ item, index, type });
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleItemDrop = (e, targetIndex) => {
    e.preventDefault();
    if (isUiLocked || !draggedItem) return;

    const newSlots = [...hotbarSlots];
    const sourceItem = draggedItem.item;

    if (draggedItem.type === 'hotbar') {
      // Intercambiar si viene de la hotbar
      const targetItem = newSlots[targetIndex];
      newSlots[targetIndex] = { ...sourceItem, key: (targetIndex + 1) % 10 + "" };
      newSlots[draggedItem.index] = { ...targetItem, key: (draggedItem.index + 1) % 10 + "" };
    } else {
      // Reemplazar si viene de la preview
      newSlots[targetIndex] = { ...sourceItem, key: (targetIndex + 1) % 10 + "" };
    }

    setHotbarSlots(newSlots);
    localStorage.setItem('og_hotbar_slots', JSON.stringify(newSlots));
    setDraggedItem(null);
  };

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
    onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdatePaladio, onUpdateMinerals, isInvisible, onUpdateInvisibility, onUpdateWips, onUpdateEco, equippedDesign
  });
  
  useEffect(() => {
    propsRef.current = {
      user, selectedShip, initialModules, initialAmmo, initialLevel, initialXp, initialCredits, initialPaladio, initialMinerals, initialUpgrades, initialWips, initialEco, initialClan, initialClanTag,
      onUpdateAmmo, onUpdateProgress, onUpdateCredits, onUpdatePaladio, onUpdateMinerals, isInvisible, onUpdateInvisibility, onUpdateWips, onUpdateEco, equippedDesign
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
                   
                   // Sincronizar interpolación del ECO si existe
                   if (p.eco && oldP.eco && p.eco.x !== undefined) {
                       p.eco.tx = p.eco.x; p.eco.ty = p.eco.y;
                       p.eco.x = oldP.eco.x; p.eco.y = oldP.eco.y;
                   }
               } else {
                   p.tx = p.x; p.ty = p.y;
                   if (p.eco) { p.eco.tx = p.eco.x; p.eco.ty = p.eco.y; }
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
            if (p.onUpdateOwnedShips) {
                const shipsStr = JSON.stringify(me.owned_ships || ["starter"]);
                if (shipsStr !== last.owned_ships) {
                    p.onUpdateOwnedShips(me.owned_ships || ["starter"]);
                    last.owned_ships = shipsStr;
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
             if (p.tx == null || isNaN(p.tx)) p.tx = p.x || 0;
             if (p.ty == null || isNaN(p.ty)) p.ty = p.y || 0;
             if (p.x == null || isNaN(p.x)) p.x = p.tx;
             if (p.y == null || isNaN(p.y)) p.y = p.ty;
             
             const dist = Math.hypot(p.tx - p.x, p.ty - p.y);
             // Si hay demasiada diferencia (lag spike), hacer salto instantáneo (snap)
             if (dist > 500 || isNaN(dist)) {
                 p.x = p.tx; p.y = p.ty;
             } else {
                 // El jugador propio necesita interpolación más agresiva
                 // para que la cámara siga de cerca y evite desync visual
                  const glideFactor = p.is_self ? 40.0 : 15.0;
                  const glide = Math.min(1.0, dt * glideFactor); 
                  p.x += (p.tx - p.x) * glide;
                  p.y += (p.ty - p.y) * glide;

                  // Interpolar posición del ECO con la misma suavidad que la nave para evitar desincronización visual
                  if (p.eco && p.eco.tx !== undefined) {
                      if (p.eco.x === undefined) {
                          p.eco.x = p.eco.tx;
                          p.eco.y = p.eco.ty;
                      }
                      // IMPORTANTE: El ECO debe usar el MISMO glide que la nave para no "tiritar"
                      p.eco.x += (p.eco.tx - p.eco.x) * glide;
                      p.eco.y += (p.eco.ty - p.eco.y) * glide;
                  }
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
            const safeMeX = isNaN(me.x) ? 0 : (me.x || 0);
            const safeMeY = isNaN(me.y) ? 0 : (me.y || 0);
            cameraRef.current.x = Math.max(0, Math.min(m_width - canvas.width, safeMeX - canvas.width / 2)) || 0;
            cameraRef.current.y = Math.max(0, Math.min(m_height - canvas.height, safeMeY - canvas.height / 2)) || 0;
          }
          try {
            drawGame(ctx, { ...gameStateRef.current, selectedTargetId: keys.current.locked_target_id }, cameraRef.current.x, cameraRef.current.y, minimapPosRef.current, isUiLockedRef.current);
          } catch (e) {
            console.error("Rendering error:", e);
            setError(e.stack || e.toString());
          }
        }
      }
      animationId = requestAnimationFrame(renderLoop);
    };

    connectWs();
    renderLoop();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      if (wsRef.current) wsRef.current.close();
    };
  }, []); // WE ONLY CONNECT ONCE

  // Event Listeners effect
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Llamada inicial para establecer el tamaño correcto
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseUp, handleMouseMove]);

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
        eco: p.initialEco,
        equippedDesign: p.equippedDesign
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
        type: 'update_design', 
        equippedDesign: equippedDesign 
      }));
    }
  }, [equippedDesign, gameStarted]);

  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      wsRef.current.send(JSON.stringify({ 
        type: 'update_wips', 
        wips: initialWips 
      }));
    }
  }, [initialWips, gameStarted]);

  // Sincronizar ECO solo cuando cambie el equipamiento o estado básico (no por integridad/fuel que vienen del server)
  useEffect(() => {
    if (gameStarted && wsRef.current?.readyState === WebSocket.OPEN && joinSentRef.current) {
      // Evitamos enviar actualizaciones constantes si no hay cambios estructurales
      wsRef.current.send(JSON.stringify({ 
        type: 'update_eco', 
        eco_data: {
          active: eco.active,
          equipped: eco.equipped,
          mode: eco.mode
        }
      }));
    }
  }, [eco.equipped, eco.active, gameStarted]);

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
        <div 
          onMouseDown={handleSafeZoneMouseDown}
          style={{
            position: 'fixed', 
            left: `${safeZonePos.x}px`, 
            top: `${safeZonePos.y}px`,
            transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0, 255, 255, 0.07)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 255, 255, 0.3)', borderBottom: '3px solid #00ffff',
            padding: '6px 12px', borderRadius: '4px', color: '#00ffff',
            fontFamily: 'Orbitron', fontSize: '12px', fontWeight: 'bold',
            letterSpacing: '1px', pointerEvents: 'auto', zIndex: 100,
            cursor: isUiLocked ? 'default' : 'move',
            animation: 'pulse-safe 2s infinite ease-in-out',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🛡️</span>
            <span>ZONA SEGURA</span>
          </div>
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
            <div className="status-display-container hud-mode" style={{ position: 'fixed', left: `${statusPos.x}px`, top: `${statusPos.y}px`, cursor: isUiLocked ? 'default' : 'move' }} onMouseDown={handleStatusMouseDown}>
                {!isUiLocked && <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#00ffcc', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>ARRÁSTRAME</div>}
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
                                {Math.floor(hudState?.hp ?? 0)} / {Math.floor(hudState?.max_hp ?? 0)}
                                {gameState?.timed_bonuses?.hp > 0 && <span style={{ color: '#ff4466', fontSize: '0.6rem', marginLeft: '4px' }}>(+{Math.floor(gameState.timed_bonuses.hp)})</span>}
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
                                {Math.floor(hudState?.shld ?? 0)} / {Math.floor(hudState?.max_shld ?? 0)}
                                {gameState?.timed_bonuses?.shld > 0 && <span style={{ color: '#00aaff', fontSize: '0.6rem', marginLeft: '4px' }}>(+{Math.floor(gameState.timed_bonuses.shld)})</span>}
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

            {/* ECO CONTROL HUD - Arrastrable y Minimizable */}
            <div className="eco-control-hud" 
                onMouseDown={(e) => {
                    e.stopPropagation();
                    isNavigatingRef.current = false;
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    isNavigatingRef.current = false;
                }}
                style={{
                position: 'fixed',
                left: `${ecoPos.x}px`,
                top: `${ecoPos.y}px`,
                width: isEcoMinimized ? '40px' : '180px',
                height: isEcoMinimized ? '40px' : 'auto',
                background: 'rgba(5, 8, 16, 0.9)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${eco.deployed ? '#00ffcc88' : '#ff336644'}`,
                borderRadius: '8px',
                padding: isEcoMinimized ? '0' : '12px',
                zIndex: 1000,
                fontFamily: 'Orbitron',
                boxShadow: eco.deployed ? '0 0 15px rgba(0, 255, 204, 0.1)' : 'none',
                pointerEvents: 'auto',
                transition: 'width 0.3s, height 0.3s, padding 0.3s',
                overflow: 'hidden',
                userSelect: 'none'
            }}>
                {/* Botón Minimizar/Maximizar - Siempre visible */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEcoMinimized(!isEcoMinimized);
                    }}
                    style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'none',
                        border: 'none',
                        color: '#00ffcc',
                        cursor: 'pointer',
                        zIndex: 1001,
                        fontSize: '1rem'
                    }}
                >
                    {isEcoMinimized ? '🔲' : '➖'}
                </button>

                {/* Handle para arrastrar - Header */}
                <div 
                    onMouseDown={handleEcoMouseDown}
                    style={{ 
                        cursor: (isDragging && draggingElementRef.current?.type === 'eco') ? 'grabbing' : 'grab',
                        padding: '5px',
                        marginBottom: isEcoMinimized ? '0' : '10px',
                        borderBottom: isEcoMinimized ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: isEcoMinimized ? 'center' : 'flex-start',
                        alignItems: 'center',
                        height: isEcoMinimized ? '40px' : 'auto'
                    }}
                >
                    {isEcoMinimized ? (
                         <img src="/eco_drone.png" alt="ECO" style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: eco.deployed ? 1 : 0.4, mixBlendMode: 'screen', filter: 'contrast(1.8) brightness(1.4)' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                                width: '32px', height: '32px', 
                                background: '#070b16', 
                                borderRadius: '4px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: `1px solid ${eco.deployed ? '#00ffcc' : '#333'}`,
                                overflow: 'hidden'
                            }}>
                                <img src="/eco_drone.png" alt="ECO" style={{ width: '24px', height: '24px', objectFit: 'contain', opacity: eco.deployed ? 1 : 0.4, mixBlendMode: 'screen', filter: 'contrast(1.8) brightness(1.4)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#00ffcc', fontWeight: 'bold' }}>{eco.customName || 'SISTEMA E.C.O.'}</div>
                                <div style={{ fontSize: '0.5rem', color: eco.deployed ? '#00ffcc' : '#ff3366' }}>{eco.deployed ? 'MODO ACTIVO' : 'DESCONECTADO'}</div>
                            </div>
                        </div>
                    )}
                </div>

                {!isEcoMinimized && (
                    <div className="eco-content-wrapper" style={{ opacity: 1, transition: 'opacity 0.3s' }}>
                        {!eco.active ? (
                            <div style={{ fontSize: '0.6rem', color: '#555', textAlign: 'center', padding: '5px' }}>SISTEMA NO ADQUIRIDO</div>
                        ) : (
                            <>
                        {/* Stats Bars */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '6px', 
                            marginBottom: '12px',
                            opacity: eco.deployed ? 1 : 0.5,
                            transition: 'opacity 0.3s ease'
                        }}>
                            {/* Vida (HP) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa', marginBottom: '2px' }}>
                                <span>VIDA</span>
                                <span>{eco.deployed ? `${Math.floor(eco?.integrity || 0).toLocaleString()} / ${Math.floor(eco?.max_integrity || 50000).toLocaleString()}` : '0 / 0'}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${eco.deployed ? Math.min(100, ((eco?.integrity || 0) / (eco?.max_integrity || 50000)) * 100) : 0}%`, 
                                    height: '100%', 
                                    background: ((eco?.integrity || 0) / (eco?.max_integrity || 50000)) > 0.3 ? '#00ffcc' : '#ff3366', 
                                    boxShadow: '0 0 5px rgba(0,255,204,0.3)',
                                    transition: 'width 0.5s ease-in-out'
                                }} />
                            </div>

                            {/* Shield (Escudo) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa', marginBottom: '2px' }}>
                                <span>ESCUDO</span>
                                <span>{eco.deployed ? `${Math.floor(eco?.shield || 0).toLocaleString()} / ${Math.floor(eco?.max_shield || 0).toLocaleString()}` : '0 / 0'}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${eco.deployed ? Math.min(100, ((eco?.shield ?? 0) / (eco?.max_shield || 1)) * 100) : 0}%`, 
                                    height: '100%', 
                                    background: '#00ccff', 
                                    boxShadow: '0 0 5px rgba(0,204,255,0.3)',
                                    transition: 'width 0.5s ease-in-out'
                                }} />
                            </div>

                            {/* Fuel (Combustible) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa', marginBottom: '2px' }}>
                                <span>COMBUSTIBLE</span>
                                <span>{eco.deployed ? `${Math.floor(eco?.fuel || 0).toLocaleString()} / ${Math.floor(eco?.max_fuel || 100000).toLocaleString()}` : '0 / 0'}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${eco.deployed ? Math.min(100, ((eco?.fuel || 0) / (eco?.max_fuel || 100000)) * 100) : 0}%`, 
                                    height: '100%', 
                                    background: '#ffaa00', 
                                    boxShadow: '0 0 5px rgba(255,170,0,0.3)',
                                    transition: 'width 0.5s ease-in-out'
                                }} />
                            </div>

                            {/* Speed */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#aaa' }}>
                                <span>VELOCIDAD</span>
                                <span style={{ color: eco.deployed ? '#fff' : '#444' }}>{eco.deployed ? Math.floor(eco.speed || 0) : 0} KM/H</span>
                            </div>
                        </div>

                        {/* Mode Selector */}
                        <div style={{ marginBottom: '12px', opacity: eco.deployed ? 1 : 0.4 }}>
                            <div style={{ fontSize: '0.55rem', color: '#aaa', marginBottom: '4px' }}>PROTOCOLO DE ACCIÓN {eco.deployed ? '' : '(APAGADO)'}</div>
                            <select 
                                disabled={!eco.deployed}
                                value={eco.mode}
                                onMouseDown={(e) => { e.stopPropagation(); isNavigatingRef.current = false; }}
                                onPointerDown={(e) => { e.stopPropagation(); isNavigatingRef.current = false; }}
                                onClick={(e) => { e.stopPropagation(); isNavigatingRef.current = false; }}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                isNavigatingRef.current = false;
                                const now = Date.now();
                                if (now - lastToggleRef.current < 1000) return; // 1s cooldown
                                lastToggleRef.current = now;

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
                                transition: 'all 0.3s',
                                marginBottom: '8px'
                            }}
                        >
                            {eco.deployed ? 'DESACTIVAR SISTEMA' : 'ACTIVAR SISTEMA'}
                        </button>

                        {/* Botón de Reparación ECO */}
                        {eco.deployed && eco.equipped?.utility?.some(u => u.id.startsWith('eco_rep')) && (
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                isNavigatingRef.current = false;
                                if (wsRef.current?.readyState === WebSocket.OPEN) {
                                    wsRef.current.send(JSON.stringify({ type: 'eco_repair' }));
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'rgba(0, 204, 255, 0.2)',
                                border: '1px solid #00ccff',
                                color: '#00ccff',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                          >
                            REPARAR NAVE
                          </button>
                        )}

                        {/* Botón de Autorreparación ECO */}
                        {eco.deployed && eco.equipped?.utility?.some(u => u.id.startsWith('eco_self_rep')) && (
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                isNavigatingRef.current = false;
                                if (wsRef.current?.readyState === WebSocket.OPEN) {
                                    wsRef.current.send(JSON.stringify({ type: 'eco_self_repair' }));
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'rgba(204, 255, 0, 0.2)',
                                border: '1px solid #ccff00',
                                color: '#ccff00',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                marginTop: '8px'
                            }}
                          >
                            AUTORREPARAR ECO
                          </button>
                        )}
                    </>
                )}
            </div>
                )}
            </div>

            {/* MISSION TRACKER HUD */}
            {activeMissions && activeMissions.length > 0 && (
              <div 
                className={`mission-tracker-hud ${missionTrackerExpanded ? 'expanded' : ''}`}
                onMouseEnter={() => !missionTrackerExpanded && setMissionTrackerExpanded(true)}
                onMouseLeave={() => missionTrackerExpanded && setMissionTrackerExpanded(false)}
                style={{
                  position: 'fixed',
                  left: `${missionPos.x}px`,
                  top: `${missionPos.y}px`,
                  zIndex: 900,
                  pointerEvents: 'auto',
                  cursor: (isDragging && draggingElementRef.current?.type === 'mission') ? 'grabbing' : 'default'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMissionTrackerExpanded(!missionTrackerExpanded);
                }}
              >
                <div className="mission-hud-header" onMouseDown={handleMissionMouseDown} style={{ cursor: (isDragging && draggingElementRef.current?.type === 'mission') ? 'grabbing' : 'grab' }}>
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
            <div className="party-hud-overlay" style={{ position: 'fixed', top: `${partyPos.y}px`, left: `${partyPos.x}px`, zIndex: 1000, pointerEvents: 'auto', cursor: isUiLocked ? 'default' : 'move' }} onMouseDown={handlePartyMouseDown}>
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

            <div className="weapon-hotbar-container" style={{ 
              position: 'fixed', 
              left: hotbarPos.x, 
              top: hotbarPos.y, 
              zIndex: 1000, 
              display: 'flex', 
              flexDirection: 'column-reverse', 
              alignItems: 'flex-start', 
              gap: '0px', 
              pointerEvents: 'auto', 
              userSelect: 'none',
              transform: 'translateY(-100%)'
            }}>
                {/* LA BARRA PRINCIPAL SIEMPRE ESTÁ ABAJO EN EL CONTENEDOR REVERSO */}
                {/* LA BARRA PRINCIPAL SIEMPRE ESTÁ EN LA BASE (PRIMER HIJO EN REVERSE) */}
                <div className="weapon-hotbar" 
                    onMouseDown={handleHotbarMouseDown}
                    style={{ 
                        border: isUiLocked ? '1px solid rgba(255, 204, 0, 0.1)' : '2px solid #ffcc00',
                        boxShadow: isUiLocked ? 'none' : '0 0 20px rgba(255, 204, 0, 0.5)',
                        cursor: isUiLocked ? 'pointer' : 'move',
                        borderRadius: showCategoryBar ? '0 0 4px 4px' : '4px'
                    }}
                >
                    <div className="category-toggle-btn" onClick={(e) => { e.stopPropagation(); setShowCategoryBar(!showCategoryBar); }} title="Categorías">
                        {showCategoryBar ? '▼' : '▲'}
                    </div>
                    
                    <div onClick={(e) => { e.stopPropagation(); toggleUiLock(); }} style={{ width: '24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUiLocked ? 'rgba(255,204,0,0.1)' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (isUiLocked ? '#ffcc0044' : '#333'), marginRight: '4px', borderRadius: '4px', cursor: 'pointer' }}>
                      {isUiLocked ? '🔒' : '🔓'}
                    </div>

                    {!isUiLocked && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetHudPositions(); }}
                        style={{ width: '24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,0,0,0.1)', border: '1px solid #ff336644', marginRight: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', color: '#ff3366' }}
                        title="Reiniciar Posiciones"
                      >
                        🔄
                      </button>
                    )}

                    {hotbarSlots.map((slot, index) => {
                        const isActive = (slot.type === 'laser' && me?.ammo_type === slot.id) || (slot.type === 'missile' && me?.missile_type === slot.id);
                        const count = slot.type === 'laser' ? me?.ammo?.[slot.id] : slot.type === 'missile' ? (me?.missiles?.[slot.id] || 0) : null;
                        const isRepairing = slot.id === 'repair_bot' && hudState?.is_repairing;

                        return (
                            <div 
                                key={index} 
                                className={`hotbar-slot ${isActive ? 'active' : ''} ${isRepairing ? 'repairing-active' : ''} ${slot.disabled ? 'disabled' : ''}`} 
                                onMouseDown={(e) => e.stopPropagation()} 
                                draggable={!isUiLocked}
                                onDragStart={(e) => handleItemDragStart(e, index, 'hotbar', slot)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleItemDrop(e, index)}
                                onClick={() => {
                                    if (slot.disabled) return;
                                    if (slot.type === 'utility' && slot.id === 'repair_bot') {
                                        wsRef.current?.send(JSON.stringify({ type: 'toggle_repair' }));
                                    } else if (slot.type === 'laser' || slot.type === 'missile') {
                                        wsRef.current?.send(JSON.stringify({ type: 'switch_ammo', ammo_id: slot.id }));
                                    } else if (slot.type === 'ability') {
                                        wsRef.current?.send(JSON.stringify({ type: 'use_ability', ability_id: slot.ability_id }));
                                    }
                                }}
                                style={{ position: 'relative' }}
                                title={slot.desc || slot.name}
                            >
                                <div className="slot-progress-bar"><div className="slot-progress-fill" style={{ width: (isActive || isRepairing) ? '100%' : '20%', opacity: (isActive || isRepairing) ? 1 : 0.3, background: isRepairing ? '#00ff66' : '' }} /></div>
                                <div className="slot-icon">
                                    {slot.image ? <img src={slot.image} alt="icon" /> : (slot.icon || '')}
                                </div>
                                {slot.type === 'ability' && me?.ability_cooldowns?.[slot.ability_id] && (
                                     (() => {
                                         const now = gameState?.server_time || (Date.now() / 1000);
                                         const readyTime = me.ability_cooldowns[slot.ability_id];
                                         const rem = Math.max(0, Math.ceil(readyTime - now));
                                         if (rem > 0) {
                                             return (
                                                 <div className="cooldown-overlay" style={{
                                                     position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                     background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
                                                     justifyContent: 'center', color: '#ffcc00', fontWeight: 'bold',
                                                     fontSize: '1rem', pointerEvents: 'none', borderRadius: '4px',
                                                     border: '1px solid #ffcc00'
                                                 }}>
                                                     {rem}s
                                                 </div>
                                             );
                                         }
                                         return null;
                                     })()
                                 )}
                                 {count !== null && <div className="slot-count">{count}</div>}
                                <div className="slot-key">{(index + 1) % 10}</div>
                            </div>
                        );
                    })}
                </div>

                {/* FILA 2: SELECTOR DE CATEGORÍAS */}
                {showCategoryBar && (
                    <div className="category-bar">
                        <div className={`category-slot ${activeCategory === 'lasers' ? 'active' : ''}`} onClick={() => setActiveCategory('lasers')} title="Láseres">🔫</div>
                        <div className={`category-slot ${activeCategory === 'missiles' ? 'active' : ''}`} onClick={() => setActiveCategory('missiles')} title="Misiles">🚀</div>
                        <div className={`category-slot ${activeCategory === 'extras' ? 'active' : ''}`} onClick={() => setActiveCategory('extras')} title="Extras">🛠️</div>
                        <div className={`category-slot ${activeCategory === 'abilities' ? 'active' : ''}`} onClick={() => setActiveCategory('abilities')} title="Habilidades">⭐</div>
                    </div>
                )}

                {/* FILA 3: ITEMS DE LA CATEGORÍA */}
                {showCategoryBar && (
                    <div className="items-preview-bar">
                        {(() => {
                            const categoryItems = {
                                lasers: [
                                    { id: 'standard', type: 'laser', icon: '⚪', image: '/std_ammo.jpg' },
                                    { id: 'thermal', type: 'laser', icon: '🔥', image: '/thermal_ammo.jpg' },
                                    { id: 'plasma', type: 'laser', icon: '🔷', image: '/plasma_ammo.jpg' },
                                    { id: 'siphon', type: 'laser', icon: '🔋', image: '/siphon_ammo.png' },
                                ],
                                missiles: [
                                    { id: 'missile_1', type: 'missile', icon: '🚀', image: '/m1_seta.jpg' },
                                    { id: 'missile_2', type: 'missile', icon: '🚀', image: '/m2_ciclon.jpg' },
                                    { id: 'missile_3', type: 'missile', icon: '☢️', image: '/m3_giganuke.jpg' },
                                ],
                                extras: (propsRef.current.initialModules || [])
                                    .map(moduleId => {
                                        // moduleId podría ser un string o un objeto {id, ...}
                                        const id = typeof moduleId === 'string' ? moduleId : moduleId.id;
                                        const itemData = MODULES_CATALOG.find(m => m.id === id);
                                        if (!itemData || itemData.type !== 'utility') return null;
                                        
                                        // Solo mostrar extras activables/relevantes para la hotbar
                                        const activatableIds = [
                                            'util_repair_1', 'util_repair_2', 
                                            'util_cloak', 'util_auto_repair_cpu', 
                                            'util_auto_missile', 'util_turbo_missile'
                                        ];
                                        
                                        if (!activatableIds.includes(id) && !itemData.repair_rate) return null;

                                        return {
                                            id: id,
                                            type: 'utility',
                                            icon: itemData.icon,
                                            image: itemData.image,
                                            repairing: (id.startsWith('util_repair') || itemData.repair_rate) && hudState?.is_repairing
                                        };
                                    })
                                    .filter(Boolean),
                                abilities: (me?.ship_type === 'support') ? [
                                    { id: 'ability_beacon_heal', type: 'ability', name: 'Reparación de Vida', icon: '🔧', ability_id: 'beacon_heal', desc: 'Con esta habilidad, tu nave arrojará una unidad que restablecerá poco a poco los PV de todas tus naves amigas cercanas.' },
                                    { id: 'ability_beacon_shield', type: 'ability', name: 'Reparación de Escudo', icon: '🛡️', ability_id: 'beacon_shield', desc: 'Con esta habilidad, tu nave arrojará una unidad que restablecerá poco a poco los Escudos de todas tus naves amigas cercanas.' }
                                ] : (me?.ship_type === 'bastion') ? [
                                    { id: 'ability_provocation', type: 'ability', name: 'Provocación', icon: '📣', ability_id: 'provocation', desc: 'Redirige los ataques de todos los enemigos hacia ti durante 10 segundos.' },
                                    { id: 'ability_shield_reinforcement', type: 'ability', name: 'Refuerzo de Escudo', icon: '🛡️', ability_id: 'shield_reinforcement', desc: 'Aumenta tu escudo máximo en un 15% durante 10 segundos.' }
                                ] : (me?.ship_type === 'interceptor') ? [
                                    { id: 'ability_invulnerability', type: 'ability', name: 'Invulnerabilidad', icon: '✨', ability_id: 'invulnerability', desc: 'Te hace completamente invulnerable a todo daño durante 7 segundos.' },
                                    { id: 'ability_advanced_invisibility', type: 'ability', name: 'Invisibilidad Avanzada', icon: '👻', ability_id: 'advanced_invisibility', desc: 'Te hace invisible por 7 segundos y no se revela al disparar.' }
                                ] : [],
                            };

                            const items = categoryItems[activeCategory] || [];
                            return items.map((item, idx) => {
                                const isActive = (item.type === 'laser' && me?.ammo_type === item.id) || (item.type === 'missile' && me?.missile_type === item.id);
                                const count = item.type === 'laser' ? me?.ammo?.[item.id] : item.type === 'missile' ? (me?.missiles?.[item.id] || 0) : null;
                                const isRepairing = item.repairing;
                                return (
                                    <div key={item.id} className={`hotbar-slot ${isActive ? 'active' : ''} ${isRepairing ? 'repairing-active' : ''}`}
                                        title={item.desc || item.name}
                                        draggable={!isUiLocked}
                                        onDragStart={(e) => handleItemDragStart(e, idx, 'preview', item)}
                                        onClick={() => {
                                            if (item.type === 'utility' && (item.id.startsWith('util_repair') || item.id === 'repair_bot')) {
                                                wsRef.current?.send(JSON.stringify({ type: 'toggle_repair' }));
                                            } else if (item.type === 'laser' || item.type === 'missile') {
                                                wsRef.current?.send(JSON.stringify({ type: 'switch_ammo', ammo_id: item.id }));
                                            } else if (item.type === 'ability') {
                                                wsRef.current?.send(JSON.stringify({ type: 'use_ability', ability_id: item.ability_id }));
                                            }
                                        }}
                                    >
                                        <div className="slot-progress-bar"><div className="slot-progress-fill" style={{ width: (isActive || isRepairing) ? '100%' : '20%', opacity: (isActive || isRepairing) ? 1 : 0.3, background: isRepairing ? '#00ff66' : '' }} /></div>
                                        <div className="slot-icon">
                                            {item.image ? <img src={item.image} alt="icon" /> : item.icon}
                                        </div>
                                        {item.type === 'ability' && me?.ability_cooldowns?.[item.ability_id] && (
                                            (() => {
                                                const now = gameState?.server_time || (Date.now() / 1000);
                                                const readyTime = me.ability_cooldowns[item.ability_id];
                                                const rem = Math.max(0, Math.ceil(readyTime - now));
                                                if (rem > 0) {
                                                    return (
                                                        <div className="cooldown-overlay" style={{
                                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', color: '#ffcc00', fontWeight: 'bold',
                                                            fontSize: '0.8rem', pointerEvents: 'none', borderRadius: '4px'
                                                        }}>
                                                            {rem}s
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()
                                        )}
                                        {count !== null && <div className="slot-count">{count}</div>}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
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
        pos={chatPos}
        onDragStart={handleChatMouseDown}
        isUiLocked={isUiLocked}
      />
    </>
  );
}
