const tankImg = new Image();
tankImg.src = '/aegis_vanguard_v2.png?v=2';

const fastImg = new Image();
fastImg.src = '/nova_striker_v2.png?v=2';

const stealthImg = new Image();
stealthImg.src = '/orion_phantom_v2.png?v=2';

const heavyImg = new Image();
heavyImg.src = '/titan_hammer_v2.png?v=2';

const supportImg = new Image();
supportImg.src = '/helix_support_v2.png?v=2';

const starterImg = new Image();
starterImg.src = '/phoenix_v3.png?v=5';

const sovereignImg = new Image();
sovereignImg.src = '/sovereign_v3.png?v=3';

const harvesterImg = new Image();
harvesterImg.src = '/harvester_v2.png?v=2';

const interceptorImg = new Image();
interceptorImg.src = '/interceptor_v2.png?v=2';

const bastionImg = new Image();
bastionImg.src = '/bastion_v2.png?v=2';

const wispV1Img = new Image();
wispV1Img.src = '/wisp_v1.png';

const wispV2Img = new Image();
wispV2Img.src = '/wisp_v2.png';

const ecoImg = new Image();
ecoImg.src = '/eco_drone.png';

// --- FUNCIONES DE APOYO WIPS ---
const drawWips = (ctx, wips, shipSize, heading) => {
    if (!wips || wips.length === 0) return;

    // Posiciones relativas (2 izq, 2 der, 4 atrás)
    // Coordenadas [x, y] asumiendo nave mirando arriba
    const positions = [
        [-55, 0], [-85, 25],   // Izquierda
        [55, 0], [85, 25],     // Derecha
        [-40, 60], [-15, 75], [15, 75], [40, 60] // Atrás
    ];

    const time = Date.now() / 1000;

    wips.forEach((wip, i) => {
        if (i >= positions.length) return;
        const [relX, relY] = positions[i];
        
        ctx.save();
        // Oscilación suave para efecto de flotación
        const hover = Math.sin(time * 2 + i) * 3;
        
        // Rotar las posiciones según el heading de la nave
        ctx.rotate(heading); 
        ctx.translate(relX, relY + hover);
        
        const isSparks = wip.type === 'sparks';
        const img = isSparks ? wispV2Img : wispV1Img;
        const color = isSparks ? '#bf00ff' : '#00bbff'; // Púrpura para Sparks, Azul para Dron
        const pulse = 0.8 + Math.sin(time * 5 + i) * 0.2;

        // Dibujar Imagen del Drone con Screen Blending para eliminar fondos negros perfectamente
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = isSparks ? 0.9 : 1.0; 
        // Filtro para asegurar que los fondos oscuros sean negros puros para el blending screen
        if (!isSparks) ctx.filter = 'contrast(1.5) brightness(1.1)'; 
        const size = 28;
        ctx.drawImage(img, -size/2, -size/2, size, size);
        ctx.filter = 'none';
        ctx.restore();

        // Núcleo brillante extra (Casi invisible ahora para evitar exceso de brillo)
        ctx.globalAlpha = 0.2 * pulse;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
};

const drawEco = (ctx, eco, shipSize, heading, playerX, playerY) => {
    if (!eco || !eco.active || !eco.deployed) return;

    const time = Date.now() / 1000;
    const hover = Math.sin(time * 3) * 5;
    
    ctx.save();
    // Si el servidor envía la posición (IA activa), la usamos relativa al jugador
    if (eco.x !== undefined && eco.y !== undefined) {
        ctx.translate(eco.x - playerX, eco.y - playerY + hover);
        // Nueva rotación dinámica:
        // Si el dron se está moviendo con suficiente velocidad, mira hacia donde va. 
        // Si no, copia la rotación de la nave para mantenerse alineado.
        const vMag = Math.hypot(eco.vx || 0, eco.vy || 0);
        if (vMag > 5) { // Threshold para evitar rotaciones erráticas por ruido
            ctx.rotate(Math.atan2(eco.vy, eco.vx) + Math.PI/2);
        } else {
            ctx.rotate(heading);
        }
    } else {
        // Fallback: Posicionamiento relativo clásico
        ctx.rotate(heading);
        ctx.translate(-75, -75 + hover);
    }
    
    const color = '#00ffcc';
    const pulse = 0.8 + Math.sin(time * 8) * 0.2;

    // Dibujar Imagen del ECO con Screen Blending (Efecto Energético Limpio)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 1.0;
    ctx.filter = 'contrast(1.5) brightness(1.2)';
    const size = 50; // Tamaño de la ECO
    ctx.drawImage(ecoImg, -size/2, -size/2, size, size);
    ctx.filter = 'none';
    ctx.restore();

    // Halo exterior de energía
    ctx.globalAlpha = 0.2 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Status Bars (Pequeñas barras sobre el dron)
    const barW = 30;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(-barW/2, -35, barW, 3);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(-barW/2, -35, barW * (eco.integrity / 100), 3);

    if (eco.max_shield > 0) {
        ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.fillRect(-barW/2, -30, barW, 2);
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(-barW/2, -30, barW * (eco.shield / eco.max_shield), 2);
    }

    // Dibujar Nombre
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.fillStyle = '#00ffcc';
    ctx.textAlign = 'center';
    ctx.fillText(eco.customName || 'E.C.O.', 0, -42);

    ctx.restore();
};

// --- FUNCIONES DE RENDERIZADO DE ALIENS ---

const drawGryllos = (ctx, isHard) => {
    // Gryllos: Cúmulo de Gas (Nebulosa verde/gris)
    const color = isHard ? '#00ffaa' : '#aabbaa';
    ctx.save();
    ctx.shadowBlur = 0; // Optimización de rendimiento
    ctx.shadowColor = color;
    ctx.globalAlpha = 0.4 + Math.sin(Date.now()/400)*0.1;

    // Nube Nebular
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    for(let i=0; i<3; i++) {
        ctx.beginPath();
        const offX = Math.sin(Date.now()/500 + i)*5;
        const offY = Math.cos(Date.now()/500 + i)*5;
        ctx.arc(offX, offY, 15, 0, Math.PI*2);
        ctx.fill();
    }

    // Rayos internos
    if(Math.random() > 0.9) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10 + Math.random()*20, -10 + Math.random()*20);
        ctx.lineTo(-10 + Math.random()*20, -10 + Math.random()*20);
        ctx.stroke();
    }
    ctx.restore();
};

const drawXylos = (ctx, isHard) => {
    // Xylos: Llamarada de Hielo (Fragmento con cola)
    const color = isHard ? '#00ffff' : '#88ccff';
    
    // Cola de Viento Solar
    const grad = ctx.createLinearGradient(0, 0, 0, 30);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(0, 40);
    ctx.closePath();
    ctx.fill();

    // Núcleo de Hielo
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(0, -15); ctx.lineTo(10, 5); ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
};

const drawNykor = (ctx, isHard) => {
    // Nykor: Sombra del Vacío (Rediseño Spectral)
    const time = Date.now() / 1000;
    const wingColor = isHard ? '#ff0000' : '#8a2be2'; 
    const coreColor = isHard ? '#ffffff' : '#00ffff'; 
    
    ctx.save();
    
    // --- 1. ALAS ESPECTRALES (Orbitando) ---
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
        ctx.save();
        const ang = (i / 3) * Math.PI * 2 + time * 2;
        ctx.rotate(ang);
        
        // Oscilación de tamaño
        const scale = 1.0 + Math.sin(time * 5 + i) * 0.2;
        ctx.scale(scale, scale);
        
        // Gradiente del ala
        const grad = ctx.createLinearGradient(0, 0, 0, -25);
        grad.addColorStop(0, wingColor);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, -30);
        ctx.closePath();
        ctx.fill();
        
        // Brillo del borde
        ctx.strokeStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    // --- 2. NÚCLEO CENTRAL ---
    const pulse = 1 + Math.sin(time * 8) * 0.1;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10 * pulse);
    coreGrad.addColorStop(0, coreColor);
    coreGrad.addColorStop(0.5, wingColor);
    coreGrad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // --- 3. SENSORES / OJOS (Parpadeo) ---
    const blink = Math.sin(time * 1.5) > 0.8 ? 0 : 1;
    if (blink) {
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = 0.8;
        // Ojo izquierdo
        ctx.beginPath(); ctx.arc(-5, -2, 2, 0, Math.PI * 2); ctx.fill();
        // Ojo derecho (parpadeo alternado leve)
        const blink2 = Math.sin(time * 2.2) > 0.85 ? 0 : 1;
        if (blink2) {
            ctx.beginPath(); ctx.arc(5, -2, 2, 0, Math.PI * 2); ctx.fill();
        }
    }
    
    ctx.restore();
};

const drawSyrith = (ctx, isHard) => {
    // Syrith: Serpiente Solar (Bucle de plasma)
    const color = isHard ? '#ffaa00' : '#ff5500';
    const time = Date.now() / 200;
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    for(let i=0; i<20; i++) {
        const r = 12 + Math.sin(time + i*0.3)*5;
        const ang = (i/20)*Math.PI*2 + time;
        const x = Math.cos(ang)*r;
        const y = Math.sin(ang)*r;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.stroke();

    // Brillo interno
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
};

const drawVexis = (ctx, isHard) => {
    // Vexis: Núcleo de Supernova (Esferas expansivas)
    const color = isHard ? '#ffffff' : '#00ffff';
    const time = Date.now() / 500;
    
    // Capas de gas
    for(let i=0; i<3; i++) {
        const r = ((time + i) % 3) * 10;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1 - (r/30);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.stroke();
    }

    // El Core
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.shadowColor = color;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
};

const drawKragos = (ctx, isHard) => {
    // Kragos: Titán de Magma (Fragmentos de roca)
    ctx.fillStyle = '#222';
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#ff4400';

    // Rocas flotantes
    for(let i=0; i<5; i++) {
        const ang = (i/5)*Math.PI*2 + Date.now()/1000;
        const x = Math.cos(ang)*15;
        const y = Math.sin(ang)*15;
        ctx.beginPath();
        ctx.rect(x-5, y-5, 10, 10);
        ctx.fill();
        
        // Venas de magma
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(x-2, y-2, 4, 4);
        ctx.fillStyle = '#222';
    }

    // Núcleo de calor
    const pulse = 5 + Math.sin(Date.now()/100)*3;
    const grad = ctx.createRadialGradient(0,0,0,0,0,pulse*2);
    grad.addColorStop(0, '#ffaa00');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0,0, pulse*2, 0, Math.PI*2); ctx.fill();
};

const drawZoltan = (ctx, isHard) => {
    // Zoltan: Espiral de Cuásar (Vórtice cinético)
    const color = isHard ? '#ffffff' : '#0099ff';
    const time = Date.now() / 200;
    
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.shadowColor = color;
    
    for(let i=0; i<3; i++) {
        ctx.rotate(time/2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.quadraticCurveTo(20, 20, 0, 30);
        ctx.stroke();
    }
    
    // Centro brillante
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
};

const drawDrakon = (ctx, isHard) => {
    // Drakon: Nave Constelación (Puntos y líneas)
    const color = isHard ? '#fff' : '#ff4444';
    const time = Date.now() / 1000;
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = color;
    
    const points = [];
    for(let i=0; i<8; i++) {
        const ang = (i/8)*Math.PI*2 + time;
        const r = 25 + Math.sin(time*2 + i)*5;
        points.push({x: Math.cos(ang)*r, y: Math.sin(ang)*r});
    }

    // Dibujar líneas (Materia Oscura)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    points.forEach((p, i) => {
        if(i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Dibujar Estrellas
    points.forEach(p => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
        // Destello
        if(Math.random() > 0.8) {
             ctx.fillStyle = '#fff';
             ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
        }
    });

    // Corazón galáctico
    ctx.fillStyle = isHard ? '#fff' : 'rgba(255,0,0,0.5)';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
};

const drawSpaceStation = (ctx, x, y, radius, style) => {
    const time = Date.now() / 1000;
    
    // --- 0. PALETA DE COLORES ---
    let mainColor = '#00ffff'; 
    let accentColor = '#0088ff';
    let energyColor = '#ffffff';
    let industrialGray = '#2c3e50';

    if (style.includes('mars')) {
        mainColor = '#ff4400'; accentColor = '#ffcc00'; energyColor = '#ffff00';
    } else if (style.includes('pluto')) {
        mainColor = '#8a2be2'; accentColor = '#4b0082'; energyColor = '#00ffff';
    } else if (style.includes('moon')) {
        mainColor = '#00ffff'; accentColor = '#0088ff'; energyColor = '#ffffff';
    }

    ctx.save();
    ctx.translate(x, y);

    // --- FUNCIONES INTERNAS DE DIBUJO ---
    const drawIsometricBox = (ox, oy, w, h, d, color) => {
        ctx.save();
        ctx.translate(ox, oy);
        
        // Cara Frontal (Sombreada oscuridad)
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(-w/2, -h/2, w, h);
        
        // Cara Lateral (Sombreada profundidad)
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(w/2, -h/2);
        ctx.lineTo(w/2 + d, -h/2 - d/2);
        ctx.lineTo(w/2 + d, h/2 - d/2);
        ctx.lineTo(w/2, h/2);
        ctx.fill();
        
        // Cara Superior (Luz)
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/2);
        ctx.lineTo(-w/2 + d, -h/2 - d/2);
        ctx.lineTo(w/2 + d, -h/2 - d/2);
        ctx.lineTo(w/2, -h/2);
        ctx.fill();
        
        ctx.restore();
    };

    const drawLandingPad = (ox, oy, w, h, side) => {
        ctx.save();
        ctx.translate(ox, oy);
        const dir = side === 'left' ? -1 : 1;
        
        // Base de la plataforma (Trapecio)
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.lineTo(dir * w, -h/4);
        ctx.lineTo(dir * w, h/4);
        ctx.lineTo(0, h/2);
        ctx.fill();
        
        // Franjas de Peligro (Hazard Stripes)
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 10;
        for(let i=-100; i<100; i+=20) {
            ctx.beginPath();
            ctx.moveTo(i, -50);
            ctx.lineTo(i + 40, 50);
            ctx.stroke();
        }
        ctx.restore();
        
        // Borde metálico
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Luces de pista
        ctx.fillStyle = (Math.sin(time*2) > 0) ? '#00ff00' : '#004400';
        ctx.beginPath(); ctx.arc(dir * w * 0.8, 0, 3, 0, Math.PI*2); ctx.fill();
        
        ctx.restore();
    };

    // --- 1. RESPLANDOR AMBIENTAL ---
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 180);
    glow.addColorStop(0, mainColor + '11');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 180, 0, Math.PI * 2); ctx.fill();

    // --- 2. COLUMNA CENTRAL (Módulos apilados) ---
    // Módulo inferior
    drawIsometricBox(0, 60, 80, 40, 20, '#16213e');
    // Módulo medio (Desplazado asimétricamente)
    drawIsometricBox(-10, 10, 90, 50, 25, '#1a1a2e');
    // Módulo superior (Donde está el núcleo)
    drawIsometricBox(0, -50, 70, 60, 30, industrialGray);

    // --- 3. PLATAFORMAS DE ATERRIZAJE ---
    drawLandingPad(-45, -20, 120, 60, 'left');
    drawLandingPad(45, 30, 100, 50, 'right');
    drawLandingPad(35, -70, 80, 40, 'right');

    // --- 4. PUENTE DE MANDO SUPERIOR (Hexágono Azul) ---
    ctx.save();
    ctx.translate(0, -90);
    
    // Resplandor del puente
    ctx.shadowBlur = 20;
    ctx.shadowColor = mainColor;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    
    // Dibujar hexágono isométrico
    ctx.beginPath();
    for(let i=0; i<6; i++) {
        const ang = (i/6) * Math.PI * 2;
        const px = Math.cos(ang) * 40;
        const py = Math.sin(ang) * 20; // Aplastado para perspectiva
        if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Relleno de energía
    ctx.fillStyle = mainColor + '33';
    ctx.fill();
    
    // Icono de Zona Segura (Simulación rápida)
    ctx.fillStyle = energyColor;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-10, -5, 20, 10);
    ctx.restore();

    // --- 5. DETALLES DE AMBIENTACIÓN ---
    // Cables inferiores
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for(let i=0; i<3; i++) {
        ctx.beginPath();
        ctx.moveTo(-20 + i*20, 80);
        ctx.lineTo(-20 + i*20 + Math.sin(time + i)*5, 130);
        ctx.stroke();
    }
    
    // Ventanas iluminadas
    ctx.fillStyle = '#ffffaa';
    ctx.globalAlpha = 0.6;
    for(let j=0; j<5; j++) {
        ctx.fillRect(-30, 20 + j*10, 4, 3);
        ctx.fillRect(20, -40 + j*8, 3, 2);
    }
    
    // Naves minúsculas orbitando (Drones)
    for(let k=0; k<4; k++) {
        const orbitTime = time * 0.5 + k;
        const ox = Math.cos(orbitTime) * 140;
        const oy = Math.sin(orbitTime) * 100;
        ctx.fillStyle = (k % 2 === 0) ? '#fff' : mainColor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(ox, oy, 2, 0, Math.PI*2); ctx.fill();
        // Estela de motor
        ctx.strokeStyle = ctx.fillStyle;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox - Math.cos(orbitTime)*10, oy - Math.sin(orbitTime)*10);
        ctx.stroke();
    }

    ctx.restore();
};

export const drawGame = (ctx, gameState, camX = 0, camY = 0) => {
  const { width, height } = ctx.canvas;
  
  // 1. Determinar Estilo de Mapa
  const style = gameState.current_map_style || 'space';
  const isMars = style.startsWith('mars');
  const isMoon = style.startsWith('moon');
  const isPluto = style.startsWith('pluto');
  
  // 1. Limpiar canvas (Fondo fijo)
  if (isMars) ctx.fillStyle = '#1a0500';
  else if (isMoon) ctx.fillStyle = '#050a1a';
  else if (isPluto) ctx.fillStyle = '#0b041a';
  else ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, width, height);
  
  const me = gameState.players?.find(p => p.is_self);

  // 2. Dibujar cuadrícula Galáctica (Efecto Parallax Infinito)
  if (isMars) ctx.strokeStyle = 'rgba(255, 100, 0, 0.08)';
  else if (isMoon) ctx.strokeStyle = 'rgba(0, 200, 255, 0.08)';
  else if (isPluto) ctx.strokeStyle = 'rgba(100, 100, 255, 0.08)';
  else ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  const gridSize = 100;
  const offsetX = -camX % gridSize;
  const offsetY = -camY % gridSize;
  
  // --- DIBUJAR LÍMITES DEL MAPA (BORDES) ---
  ctx.save();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 10;
  const m_width = gameState.map_width || 10000;
  const m_height = gameState.map_height || 8000;
  ctx.strokeRect(-camX, -camY, m_width, m_height);
  ctx.restore();
  
  if (isMars) {
    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.strokeStyle = 'rgba(255, 69, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 3. Dibujar Bordes del Mundo (Dinámico)
  ctx.save();
  ctx.translate(-camX, -camY);
  if (isMars) ctx.strokeStyle = 'rgba(255, 50, 0, 0.3)';
  else if (isMoon) ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  else if (isPluto) ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
  else ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, m_width, m_height);
  
  // Resplandor en los bordes
  ctx.shadowBlur = 20;
  if (isMars) ctx.shadowColor = 'red';
  else if (isMoon) ctx.shadowColor = '#00ffff';
  else if (isPluto) ctx.shadowColor = '#4444ff';
  else ctx.shadowColor = 'cyan';
  ctx.strokeRect(0, 0, m_width, m_height);
  ctx.restore();

  // --- NUEVO: NEBLINA DE FALTA DE OXÍGENO (BORDES) ---
  ctx.save();
  ctx.translate(-camX, -camY);
  const OXYGEN_ZONE = 400;
  
  // Color de la niebla: Rojizo sutil para indicar peligro
  const fogColor = 'rgba(255, 0, 0, 0.12)';
  
  // Borde Izquierdo
  let gradL = ctx.createLinearGradient(0, 0, OXYGEN_ZONE, 0);
  gradL.addColorStop(0, fogColor); gradL.addColorStop(1, 'transparent');
  ctx.fillStyle = gradL; ctx.fillRect(0, 0, OXYGEN_ZONE, m_height);
  
  // Borde Derecho
  let gradR = ctx.createLinearGradient(m_width, 0, m_width - OXYGEN_ZONE, 0);
  gradR.addColorStop(0, fogColor); gradR.addColorStop(1, 'transparent');
  ctx.fillStyle = gradR; ctx.fillRect(m_width - OXYGEN_ZONE, 0, OXYGEN_ZONE, m_height);
  
  // Borde Superior
  let gradT = ctx.createLinearGradient(0, 0, 0, OXYGEN_ZONE);
  gradT.addColorStop(0, fogColor); gradT.addColorStop(1, 'transparent');
  ctx.fillStyle = gradT; ctx.fillRect(0, 0, m_width, OXYGEN_ZONE);
  
  // Borde Inferior
  let gradB = ctx.createLinearGradient(0, m_height, 0, m_height - OXYGEN_ZONE);
  gradB.addColorStop(0, fogColor); gradB.addColorStop(1, 'transparent');
  ctx.fillStyle = gradB; ctx.fillRect(0, m_height - OXYGEN_ZONE, m_width, OXYGEN_ZONE);
  
  // Nubes procedimentales decorativas
  const time = Date.now() / 2000;
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 60; i++) {
    const side = i % 4;
    let x, y;
    // Usar pseudo-aleatoriedad fija para evitar saltos bruscos
    if (side === 0) { x = (i * 123) % OXYGEN_ZONE; y = (i * 456) % m_height; }
    else if (side === 1) { x = m_width - (i * 123) % OXYGEN_ZONE; y = (i * 456) % m_height; }
    else if (side === 2) { x = (i * 456) % m_width; y = (i * 123) % OXYGEN_ZONE; }
    else { x = (i * 456) % m_width; y = m_height - (i * 123) % OXYGEN_ZONE; }
    
    const size = 180 + Math.sin(time + i) * 60;
    const cloudGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
    cloudGrad.addColorStop(0, 'rgba(255, 50, 50, 0.05)');
    cloudGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cloudGrad;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // --- COMIENZO DE RENDERIZADO DEL MUNDO (Coordenadas Reales) ---
  ctx.save();
  ctx.translate(-camX, -camY);

  // --- DIBUJAR BASE ESPACIAL (ZONA SEGURA) ---
  if (gameState.base) {
    const { x, y, radius } = gameState.base;
    
    // 1. Campo de fuerza (Safe Zone)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const pulse = Math.sin(Date.now() / 400) * 10;
    
    // Relleno suave
    ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.fill();
    
    // Borde de energía pulsante
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3 + pulse/5;
    ctx.globalAlpha = 0.5 + pulse/20;
    ctx.setLineDash([15, 10]); // Línea discontinua para efecto motor
    ctx.lineDashOffset = -Date.now() / 50; 
    ctx.stroke();
    ctx.restore();

    // 2. Estructura de la Estación Rediseñada
    drawSpaceStation(ctx, x, y, radius, style);
    
    // Etiqueta de la Base
    // Etiqueta de la Base con sombra para legibilidad
    ctx.fillStyle = style.includes('mars') ? '#ffaa00' : (style.includes('pluto') ? '#cc99ff' : '#00ffff');
    ctx.font = 'bold 22px Orbitron';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';
    ctx.fillText("ESTACIÓN CENTRAL", x, y - radius - 20);
    ctx.shadowBlur = 0;
  }

  // --- DIBUJAR PORTALES DE SALTO ---
  if (gameState.portals && gameState.portals.length > 0) {
    gameState.portals.forEach(portal => {
        const { x, y, label } = portal;
        const radius = 150; // self.PORTAL_RADIUS
        ctx.save();
        ctx.translate(x, y);
        
        // Efecto de distorsión pulsante
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 10;
        
        // Colores según el destino
        const isMarsPortal = portal.target.startsWith('mars');
        const isMoonPortal = portal.target.startsWith('moon');
        const isPlutoPortal = portal.target.startsWith('pluto');
        let pColor = '#ffffff';
        let pColor2 = '#cccccc';
        let pColor3 = '#999999';

        if (isMarsPortal) {
            pColor = '#ff6600'; pColor2 = '#ff3300'; pColor3 = '#990000';
        } else if (isMoonPortal) {
            pColor = '#00ffff'; pColor2 = '#00ccff'; pColor3 = '#0088ff';
        } else if (isPlutoPortal) {
            pColor = '#6666ff'; pColor2 = '#3333ff'; pColor3 = '#000099';
        } else {
            pColor = '#00ffff'; pColor2 = '#0088ff'; pColor3 = '#0044ff';
        }

        // Capas del Agujero de Gusano
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, radius - (i * 20) + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = i === 0 ? pColor : (i === 1 ? pColor2 : pColor3);
            ctx.lineWidth = 5 - i;
            ctx.globalAlpha = 0.6 - (i * 0.2);
            ctx.setLineDash([20, 15]);
            ctx.lineDashOffset = (i % 2 === 0 ? 1 : -1) * time * 100;
            ctx.stroke();
        }
        
        // Núcleo brillante
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 30;
        ctx.shadowColor = pColor;
        ctx.fillStyle = pColor + '33';
        ctx.beginPath();
        ctx.arc(0, 0, 30 + pulse/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Etiqueta del Portal
        ctx.fillStyle = pColor;
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("PORTAL DE SALTO", 0, -radius - 30);
        ctx.font = '14px Orbitron';
        ctx.fillText("Hacia: " + label, 0, -radius - 10);
        
        // Indicador de Zona Segura
        ctx.beginPath();
        ctx.arc(0, 0, 350, 0, Math.PI * 2); 
        ctx.strokeStyle = pColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
        
        ctx.restore();
    });
  }

  // --- EFECTOS AMBIENTALES (NUEVO: TORMENTA / NIEBLA) ---
  if (style === 'mars_storm') {
    // Partículas de tormenta de arena
    ctx.save();
    const time = Date.now() / 1000;
    ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
    ctx.globalCompositeOperation = 'screen';
    for(let i=0; i<100; i++) {
        const px = (i * 777 + time * 1500) % m_width;
        const py = (i * 333 + time * 200) % m_height;
        ctx.fillRect(px, py, 200, 2);
    }
    ctx.restore();
  }

  if (style === 'moon_crystal') {
    const crystalPulse = Math.sin(Date.now() / 800) * 0.3 + 0.6;
    ctx.save();
    ctx.shadowBlur = 50;
    ctx.shadowColor = '#00ffff';
    ctx.globalAlpha = crystalPulse * 0.4;
    ctx.fillStyle = 'white';
    for(let i=0; i<20; i++) {
        const cx = (i * 2345) % m_width;
        const cy = (i * 6789) % m_height;
        ctx.beginPath();
        const sides = 6;
        const size = 150 + Math.sin(Date.now()/500 + i)*30;
        for(let j=0; j<=sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const x = cx + Math.cos(angle) * size;
            const y = cy + Math.sin(angle) * size;
            if(j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.fill();
    }
    ctx.restore();
  }


  if (isPluto && style.includes('ice')) {
    // Partículas de escarcha / hielo
    ctx.save();
    const time = Date.now() / 2000;
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.3;
    for(let i=0; i<100; i++) {
        const px = (i * 1234 + time * 100) % m_width;
        const py = (i * 5678 + time * 50) % m_height;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
  }

  if (style === 'pluto_nebula') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    // Nébula de Cobalto: Capa de color
    const grad = ctx.createRadialGradient(5000, 4000, 0, 5000, 4000, 6000);
    grad.addColorStop(0, 'rgba(0, 50, 200, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 50, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 10000, 8000);
    ctx.restore();
  }

  if (style === 'pluto_vortex') {
    ctx.save();
    ctx.translate(m_width/2, m_height/2); // Centro del mapa: Vórtice Sombrío
    ctx.shadowBlur = 100;
    ctx.shadowColor = '#4400ff';
    const rot = Date.now() / 1500;
    ctx.rotate(rot);
    for(let i=0; i<6; i++) {
        ctx.rotate(Math.PI * 2 / 6);
        const g = ctx.createLinearGradient(0, 0, 3000, 0);
        g.addColorStop(0, 'rgba(100, 0, 255, 0.4)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(3000, -300);
        ctx.lineTo(3000, 300);
        ctx.closePath();
        ctx.fill();
    }
    // Centro del agujero negro
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI*2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();
  }

  // Draw loot boxes
  const margin = 150;
  gameState.loot_boxes?.forEach(box => {
    // Rendereizado solo si está en viewport (Culling)
    if (box.x < camX - margin || box.x > camX + width + margin || 
        box.y < camY - margin || box.y > camY + height + margin) return;

    ctx.save();
    ctx.translate(box.x, box.y);
    
    const isMineral = box.type === "mineral";
    const isSpecial = box.type === "special_coin";
    
    // Dibujar Sombra/Fondo del cofre
    ctx.shadowBlur = isSpecial ? 25 : 15;
    ctx.shadowColor = isSpecial ? '#ff00ff' : (isMineral ? '#00ffff' : '#ffcc00');
    
    if (isSpecial) {
        // --- COFRE DORADO ESPECIAL ---
        const grad = ctx.createLinearGradient(-20, -20, 20, 20);
        grad.addColorStop(0, '#ffd700');
        grad.addColorStop(0.5, '#fff000');
        grad.addColorStop(1, '#ff8c00');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-20, -20, 40, 40);
        ctx.fillRect(-20, -20, 40, 40);
        
        // Detalle de gema en el centro
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Etiqueta flotante
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText("ESPECIAL", 0, -30);
    } else if (box.type === "cargo") {
      // --- CAJA DE CARGA METÁLICA ---
      const grad = ctx.createLinearGradient(-15, -15, 15, 15);
      grad.addColorStop(0, '#4a4a4a');
      grad.addColorStop(0.5, '#6a6a6a');
      grad.addColorStop(1, '#2a2a2a');
      
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#ffcc00';
      ctx.strokeRect(-15, -15, 30, 30);
      ctx.fillRect(-15, -15, 30, 30);
      
      // Remaches y detalles industriales
      ctx.fillStyle = '#ffcc00';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(-12, -12, 4, 4);
      ctx.fillRect(8, -12, 4, 4);
      ctx.fillRect(-12, 8, 4, 4);
      ctx.fillRect(8, 8, 4, 4);
      
      // Indicador de contenido valioso (Barra de progreso ámbar)
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(-10, -2, 20, 4);
      ctx.globalAlpha = 1.0;
    } else if (isMineral) {
      const colors = { titanium: '#00c8ff', plutonium: '#ff3333', silicon: '#00ffcc' };
      ctx.fillStyle = colors[box.mineral_type] || '#fff';
      // Octagon or diamond shape for minerals
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = box.type === 'heal' ? '#00ffcc' : '#ff00aa';
      // Draw pulsing box
      const pulse = Math.sin(Date.now() / 200) * 2;
      ctx.fillRect(-10 - pulse/2, -10 - pulse/2, 20 + pulse, 20 + pulse);
      // Draw cross or lightning
      ctx.fillStyle = '#111';
      if (box.type === 'heal') {
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillRect(-2, -6, 4, 12);
      } else {
        ctx.fillRect(-4, -6, 8, 12);
      }
    }
    ctx.restore();
  });

  // Draw enemies (Aliens)
  gameState.enemies?.forEach(enemy => {
    // Rendereizado solo si está en viewport (Culling)
    if (enemy.x < camX - margin || enemy.x > camX + width + margin || 
        enemy.y < camY - margin || enemy.y > camY + height + margin) return;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
    // --- NUEVO RENDERIZADO DE ALIENS DINÁMICO ---
    ctx.save();
    const name = enemy.name || "";
    const isHard = enemy.is_hard || false;
    const isBoss = enemy.is_boss || false;
    const sMult = enemy.size_mult || 1.0;

    // Aplicar escala si es Boss
    if (sMult !== 1.0) {
        ctx.scale(sMult, sMult);
        
        // Aura de Boss (Brillo pulsante púrpura)
        if (isBoss) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(Date.now()/200) * 0.1;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
            grad.addColorStop(0, '#ff00ff');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Dibujar alien base (usando los nombres sin el prefijo "Boss " para la lógica de dibujo)
    const baseAlienName = name.replace("Boss ", "");
    
    if (baseAlienName === "Gryllos") drawGryllos(ctx, isHard);
    else if (baseAlienName === "Xylos") drawXylos(ctx, isHard);
    else if (baseAlienName === "Nykor") drawNykor(ctx, isHard);
    else if (baseAlienName === "Syrith") drawSyrith(ctx, isHard);
    else if (baseAlienName === "Vexis") drawVexis(ctx, isHard);
    else if (baseAlienName === "Kragos") drawKragos(ctx, isHard);
    else if (baseAlienName === "Zoltan") drawZoltan(ctx, isHard);
    else if (baseAlienName === "Drakon") drawDrakon(ctx, isHard);
    else {
        // Fallback: Alien original mejorado
        ctx.fillStyle = isHard ? '#ff0000' : (isBoss ? '#ff00ff' : '#ff3333');
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Shield bar
    if (enemy.max_shield > 0) {
      ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.fillRect(-15, -31, 30, 4);
      ctx.fillStyle = '#00c8ff';
      ctx.fillRect(-15, -31, 30 * (enemy.shield / enemy.max_shield), 4);
    }
    // HP bar
    ctx.fillStyle = 'red';
    ctx.fillRect(-15, -25, 30, 4);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(-15, -25, 30 * (enemy.hp / enemy.max_hp), 4);

    // Name
    ctx.fillStyle = enemy.is_hard ? '#ffaa00' : '#ff3333';
    ctx.font = 'bold 11px Orbitron';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'black';
    ctx.fillText(enemy.name || "Alien", 0, -38);
    ctx.shadowBlur = 0;

    // Retícula de fijación (Lock-on)
    if (gameState.selectedTargetId === enemy.id) {
        // Calcular distancia y determinar estado de rango
        let dist = 0;
        let inRange = true;
        if (me) {
            dist = Math.hypot(enemy.x - me.x, enemy.y - me.y);
            inRange = dist <= 700;
        }

        // Sistema de colores Dinámico (Semáforo de rango)
        let color = '#00ffff'; // Cian: Óptimo
        if (dist > 700) {
            color = '#ff3333'; // Rojo: Fuera de rango
        } else if (dist > 600) {
            color = '#ffff00'; // Amarillo: Advertencia (cerca del límite)
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Dibujamos brackets
        ctx.moveTo(-20, -20); ctx.lineTo(-10, -20);
        ctx.moveTo(-20, -20); ctx.lineTo(-20, -10);
        
        ctx.moveTo(20, -20); ctx.lineTo(10, -20);
        ctx.moveTo(20, -20); ctx.lineTo(20, -10);
        
        ctx.moveTo(-20, 20); ctx.lineTo(-10, 20);
        ctx.moveTo(-20, 20); ctx.lineTo(-20, 10);
        
        ctx.moveTo(20, 20); ctx.lineTo(10, 20);
        ctx.moveTo(20, 20); ctx.lineTo(20, 10);
        ctx.stroke();
        
        // Indicador de Distancia y Alerta
        if (me) {
            ctx.fillStyle = color;
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.floor(dist)}m`, 0, 35);

            if (dist > 700) {
                ctx.font = 'bold 12px Orbitron';
                // Parpadeo rojo
                if (Math.sin(Date.now() / 100) > 0) {
                    ctx.fillText('⚠️ FUERA DE RANGO', 0, -35);
                }
            } else if (dist > 600) {
                ctx.font = 'bold 10px Orbitron';
                ctx.fillText('⚠️ RANGO CRÍTICO', 0, -35);
            }
        }

        // Animación de pulso
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 25 + Math.sin(Date.now()/100)*5, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();
  });

  // Draw projectiles (Rayo Láser)
  gameState.projectiles?.forEach(proj => {
    // Rendereizado solo si está en viewport (Culling)
    if (proj.x < camX - margin || proj.x > camX + width + margin || 
        proj.y < camY - margin || proj.y > camY + height + margin) return;

    ctx.save();
    ctx.translate(proj.x, proj.y);
    
    // Rotar para que el rayo siga la dirección de la trayectoria
    const angle = Math.atan2(proj.vy, proj.vx);
    ctx.rotate(angle);

    if (proj.is_missile) {
      // --- DIBUJAR MISIL ---
      const mColors = { 'missile_1': '#ffcc00', 'missile_2': '#ff6600', 'missile_3': '#ff0000' };
      const mColor = mColors[proj.m_type] || '#ff0000';
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = mColor;
      
      // Estela / Fuego detrás
      const pulse = Math.sin(Date.now() / 50) * 5;
      const grad = ctx.createLinearGradient(-30, 0, -15, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, mColor);
      ctx.fillStyle = grad;
      ctx.fillRect(-40 - pulse, -6, 25 + pulse, 12);

      // Cuerpo del misil
      ctx.fillStyle = '#333';
      ctx.strokeStyle = mColor;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(-15, -8);
      ctx.lineTo(10, -8);
      ctx.lineTo(25, 0); // Punta
      ctx.lineTo(10, 8);
      ctx.lineTo(-15, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Detalles / Aletas
      ctx.fillStyle = mColor;
      ctx.fillRect(-18, -12, 6, 4);
      ctx.fillRect(-18, 8, 6, 4);
      
    } else {
      // --- DIBUJAR RAYO LÁSER (Existente) ---
      const baseColor = proj.is_player ? '#00ffcc' : '#ff00aa';
      const ammoColors = {
        'standard': '#ffffff',
        'thermal': '#ff6600',
        'plasma': '#ff33ff',
        'siphon': '#33ff33'
      };
      const color = proj.color || (proj.is_player ? (ammoColors[proj.ammo_type] || baseColor) : baseColor);

      ctx.fillStyle = color;
      ctx.shadowBlur = 0;
      ctx.shadowColor = color;
      
      // Cuerpo del rayo
      ctx.beginPath();
      ctx.roundRect(-20, -2.5, 40, 5, 2);
      ctx.fill();
      
      // Núcleo brillante
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.roundRect(-18, -1, 36, 2, 1);
      ctx.fill();
    }
    
    ctx.restore();
  });

  // Draw players
  gameState.players?.forEach(player => {
    if (player.hp <= 0) return; 
    // Rendereizado solo si está en viewport (Culling)
    if (player.x < camX - margin || player.x > camX + width + margin || 
        player.y < camY - margin || player.y > camY + height + margin) return;

    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Stealth Effect
    if (player.is_invisible) {
      if (player.is_self) {
        ctx.globalAlpha = 0.3; // El jugador se ve a sí mismo como "fantasma"
      } else {
        ctx.restore(); // Otros no ven nada (aunque el servidor ya filtra esto)
        return;
      }
    }

    // Base constants
    const baseColor = player.color || '#00b3ff';
    // Aumento de tamaño mayor solicitado (Base 75 -> 95, Tank 85 -> 110)
    const size = player.ship_type === 'tank' ? 110 : 95;
    
    // Fake 3D Banking & Depth
    ctx.save();
    
    // Deep 3D Shadow - Optimización (Reducido de 25 a 0 para rendimiento)
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowOffsetX = 15 - (player.vx * 0.02);
    ctx.shadowOffsetY = 20 - (player.vy * 0.02);
    
    // Calculate banking rotation based on vx
    const maxSpeed = player.spd * 3.5 || 350;
    // We reduced bankAngle a bit so it doesn't look ridiculous combined with free mouse rotation
    const bankAngle = (player.vx / maxSpeed) * 0.15; 
    
    // Rotate to face mouse cursor! (atan2 yields 0 at Right, -PI/2 at Up)
    // Our sprite natively faces UP, so we offset by PI/2.
    const heading = player.heading !== undefined ? player.heading + Math.PI/2 : 0;
    
    ctx.rotate(heading + bankAngle);
    
    // --- NUEVO: SISTEMA DE DIBUJO PROCEDURAL PARA NUEVAS NAVES ---
    const drawProceduralShip = (type, s) => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = player.color || '#fff';
      
      if (type === 'sovereign') {
        // Sovereign: Agresiva, alas dobles, color dorado
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#e6b800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -s/2); // Punta
        ctx.lineTo(s/3, -s/4); ctx.lineTo(s/2, 0); ctx.lineTo(s/3, s/4); // Ala derecha sup
        ctx.lineTo(s/2.5, s/2); ctx.lineTo(0, s/3); // Ala derecha inf
        ctx.lineTo(-s/2.5, s/2); ctx.lineTo(-s/3, s/4); ctx.lineTo(-s/2, 0); ctx.lineTo(-s/3, -s/4); // Lado izq
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Core central
        ctx.fillStyle = '#e6b800';
        ctx.beginPath(); ctx.arc(0, 0, s/8, 0, Math.PI*2); ctx.fill();
      } 
      else if (type === 'harvester') {
        // Harvester: Industrial, ancha, verde
        ctx.fillStyle = '#2c3e50';
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(-s/2.2, -s/3, s/1.1, s/1.5);
        ctx.fillRect(-s/2.2, -s/3, s/1.1, s/1.5);
        // Brazos extractores
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-s/2, -s/2, s/8, s/4);
        ctx.fillRect(s/2 - s/8, -s/2, s/8, s/4);
      }
      else if (type === 'interceptor') {
        // Interceptor: Aguja, ultra rápida, amarilla
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -s/1.5); // Punta extra larga
        ctx.lineTo(s/4, s/2); ctx.lineTo(0, s/3); ctx.lineTo(-s/4, s/2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      else if (type === 'bastion') {
        // Bastion: Bloque masivo, gris oscuro
        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        // Octágono
        ctx.beginPath();
        for(let i=0; i<8; i++) {
          const ang = (i/8)*Math.PI*2 + Math.PI/8;
          const px = Math.cos(ang)*s/2;
          const py = Math.sin(ang)*s/2;
          if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Brillo de energía interna
        ctx.strokeStyle = '#8a2be2';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawEngineFlame = (ctx, x, y, w, h, color, speedRatio) => {
      if (speedRatio < 0.05) return;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const flicker = Math.sin(Date.now() / 50) * 5 * speedRatio;
      const actualHeight = h * speedRatio + flicker;
      
      const grad = ctx.createLinearGradient(x, y, x, y + actualHeight);
      grad.addColorStop(0, color);
      grad.addColorStop(0.4, color + 'aa');
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x - w/2, y);
      ctx.lineTo(x + w/2, y);
      ctx.lineTo(x, y + actualHeight);
      ctx.closePath();
      ctx.fill();
      
      // Núcleo caliente
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.5 * speedRatio;
      ctx.beginPath();
      ctx.arc(x, y, (w/3) * speedRatio, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawPremiumShip = (img, shipType, s, speedRatio) => {
      ctx.save();
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      
      // 1. Efecto de Propulsores Dinámicos
      const engineColor = shipType === 'sovereign' ? '#e6b800' : 
                          (shipType === 'bastion' ? '#ff3333' : 
                          (shipType === 'harvester' ? '#ff8800' : '#00ffff'));
      
      if (shipType === 'sovereign') {
        // Quadruple engines for the dreadnought
        drawEngineFlame(ctx, -s/3, s/3, s/6, s/1.5, engineColor, speedRatio);
        drawEngineFlame(ctx, -s/7, s/3, s/7, s/1.8, engineColor, speedRatio);
        drawEngineFlame(ctx, s/7, s/3, s/7, s/1.8, engineColor, speedRatio);
        drawEngineFlame(ctx, s/3, s/3, s/6, s/1.5, engineColor, speedRatio);
      } else if (shipType === 'bastion') {
        drawEngineFlame(ctx, -s/3, s/3, s/5, s/2, engineColor, speedRatio);
        drawEngineFlame(ctx, 0, s/3, s/5, s/2, engineColor, speedRatio);
        drawEngineFlame(ctx, s/3, s/3, s/5, s/2, engineColor, speedRatio);
      } else {
        drawEngineFlame(ctx, 0, s/3.5, s/4, s/1.2, engineColor, speedRatio);
      }

      // 2. Dibujo de la Imagen con Mezcla 'Screen' (Elimina el fondo negro/cuadrado)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Filtros según tipo de nave (La Bastion necesita mucho más brillo por ser muy oscura)
      if (shipType === 'bastion') {
        ctx.filter = 'contrast(1.4) brightness(2.0) saturate(1.5)'; 
      } else {
        ctx.filter = 'contrast(1.6) brightness(1.2)'; 
      }
      
      ctx.drawImage(img, -s/2, -s/2, s, s);
      ctx.restore(); // Restores #2 (Filters/Composite)
      ctx.restore(); // Restores #1 (Transformation/Shadows)
    };

    // Calcular ratio de velocidad (0 a 1) para los motores
    const currentSpeed = Math.hypot(player.vx || 0, player.vy || 0);
    const maxPossibleSpeed = (player.spd || 100) * 3.5;
    const speedRatio = Math.min(1.0, currentSpeed / 100); // Usamos 100 como base para que el efecto se vea rápido

    // Draw the 3D sprite
    if (player.ship_type === 'tank') {
      // Aegis Vanguard v2: Estilo tanque pesado con triple motor
      const s = size;
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      drawEngineFlame(ctx, -s/3, s/3, s/5, s/1.8, '#00ffff', speedRatio);
      drawEngineFlame(ctx, 0, s/3.2, s/4, s/1.5, '#00ffff', speedRatio);
      drawEngineFlame(ctx, s/3, s/3, s/5, s/1.8, '#00ffff', speedRatio);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'contrast(1.6) brightness(1.2)';
      ctx.drawImage(tankImg, -s/2, -s/2, s, s);
      ctx.restore();
    } else if (player.ship_type === 'fast') {
      // Nova Striker v2: Estilo rápido con triple motor aerodinámico
      const s = size;
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      drawEngineFlame(ctx, -s/4, s/3.2, s/6, s/1.2, '#00ffff', speedRatio);
      drawEngineFlame(ctx, 0, s/3.5, s/5, s/1.1, '#00ffff', speedRatio);
      drawEngineFlame(ctx, s/4, s/3.2, s/6, s/1.2, '#00ffff', speedRatio);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'contrast(1.6) brightness(1.2)';
      ctx.drawImage(fastImg, -s/2, -s/2, s, s);
      ctx.restore();
    } else if (player.ship_type === 'stealth') {
      // Orion Phantom v2: Estilo sigilo con motores púrpuras
      const s = size;
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      // Motores púrpuras/violetas según el nuevo diseño
      drawEngineFlame(ctx, -s/4, s/3.2, s/6, s/1.2, '#9933ff', speedRatio);
      drawEngineFlame(ctx, s/4, s/3.2, s/6, s/1.2, '#9933ff', speedRatio);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'contrast(1.6) brightness(1.2)'; 
      ctx.drawImage(stealthImg, -s/2, -s/2, s, s);
      ctx.restore();
    } else if (player.ship_type === 'heavy') {
      // Titan Hammer v2: Crucero pesado con cuádruple motor y blindaje masivo
      const s = size * 1.1; // Un poco más grande para enfatizar su clase pesada
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      // Cuatro motores potentes (llama naranja/roja)
      drawEngineFlame(ctx, -s/3, s/2.8, s/5, s/1.5, '#ff4400', speedRatio);
      drawEngineFlame(ctx, -s/8, s/2.8, s/6, s/1.8, '#ff6600', speedRatio);
      drawEngineFlame(ctx, s/8, s/2.8, s/6, s/1.8, '#ff6600', speedRatio);
      drawEngineFlame(ctx, s/3, s/2.8, s/5, s/1.5, '#ff4400', speedRatio);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'contrast(1.6) brightness(1.2)'; 
      ctx.drawImage(heavyImg, -s/2, -s/2, s, s);
      ctx.restore();
    } else if (player.ship_type === 'support') {
      // Helix Support v2: Estilo médico modular con motores turquesa
      const s = size;
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      // Motor central turquesa/cian
      drawEngineFlame(ctx, 0, s/3.2, s/4, s/1.1, '#00ffff', speedRatio);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'contrast(1.6) brightness(1.2)'; 
      ctx.drawImage(supportImg, -s/2, -s/2, s, s);
      ctx.restore();
    } else if (player.ship_type === 'sovereign') {
      drawPremiumShip(sovereignImg, 'sovereign', size, speedRatio);
    } else if (player.ship_type === 'harvester') {
      drawPremiumShip(harvesterImg, 'harvester', size, speedRatio);
    } else if (player.ship_type === 'interceptor') {
      drawPremiumShip(interceptorImg, 'interceptor', size, speedRatio);
    } else if (player.ship_type === 'bastion') {
      drawPremiumShip(bastionImg, 'bastion', size, speedRatio);
    } else if (player.ship_type === 'starter') {
      // Nueva Phoenix v3: Renderizado limpio sin sombras ni duplicados
      const s = size;
      
      // 1. Resetear sombras para evitar el efecto de "nave doble"
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 2. Dibujar propulsores (Ajustados a la base de la nave)
      drawEngineFlame(ctx, -s/4.5, s/3.2, s/6, s/1.3, '#00ffff', speedRatio);
      drawEngineFlame(ctx, s/4.5, s/3.2, s/6, s/1.3, '#00ffff', speedRatio);
      
      // 3. Dibujar la nave con mezcla optimizada (Más nítida)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'contrast(1.6) brightness(1.2)'; 
      ctx.drawImage(starterImg, -s/2, -s/2, s, s);
      ctx.restore();
    } else {
      ctx.drawImage(tankImg, -size/2, -size/2, size, size); // fallback
    }
    
    ctx.restore();
    
    // --- DIBUJAR WIPS Y ECO (SISTEMA DE APOYO) ---
    drawWips(ctx, player.wips || [], size, heading);
    drawEco(ctx, player.eco || {}, size, heading, player.x, player.y);
    
    // Name
    ctx.fillStyle = '#fff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    let displayName = player.user_id || player.id.substring(0,6);
    if (player.clan_tag) {
      displayName = `[${player.clan_tag}] ` + displayName;
      ctx.fillStyle = '#00ffcc'; // Resaltar el nombre con clan
    }
    ctx.fillText(displayName, 0, 30);
    
    // Shield Bar
    if (player.max_shld > 0) {
      ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.fillRect(-20, 35, 40, 4);
      ctx.fillStyle = '#00c8ff';
      ctx.fillRect(-20, 35, 40 * Math.max(0, player.shld / player.max_shld), 4);
    }
    
    // HP Bar
    ctx.fillStyle = 'red';
    ctx.fillRect(-20, 41, 40, 4);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(-20, 41, 40 * Math.max(0, player.hp / player.max_hp), 4);
    
    // Retícula de fijación (Lock-on) para jugadores
    if (gameState.selectedTargetId === player.id) {
        let dist = 0;
        let color = '#00ffcc'; // Siempre verde/cian para aliados
        if (me) {
            dist = Math.hypot(player.x - me.x, player.y - me.y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Dibujamos brackets más anchos para naves de jugadores
        ctx.moveTo(-35, -35); ctx.lineTo(-20, -35);
        ctx.moveTo(-35, -35); ctx.lineTo(-35, -20);
        
        ctx.moveTo(35, -35); ctx.lineTo(20, -35);
        ctx.moveTo(35, -35); ctx.lineTo(35, -20);
        
        ctx.moveTo(-35, 35); ctx.lineTo(-20, 35);
        ctx.moveTo(-35, 35); ctx.lineTo(-35, 20);
        
        ctx.moveTo(35, 35); ctx.lineTo(20, 35);
        ctx.moveTo(35, 35); ctx.lineTo(35, 20);
        ctx.stroke();
        
        if (me) {
            ctx.fillStyle = color;
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.floor(dist)}m`, 0, 55);
        }

        ctx.globalAlpha = 0.2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 40 + Math.sin(Date.now()/100)*5, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
  });

  // Draw Kill Rewards (XP/Credits)
  gameState.kill_events?.forEach(event => {
    if (me && event.owner_id === me.id) {
      const now = Date.now() / 1000;
      const elapsed = now - event.time;
      const duration = 2.5;
      
      if (elapsed < duration && elapsed >= 0) {
        const alpha = 1 - (elapsed / duration);
        const y_offset = elapsed * 50;
        
        ctx.save();
        ctx.translate(event.x, event.y - 40 - y_offset);
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.font = 'bold 18px Orbitron';
        ctx.textAlign = 'center';
        
        const gradient = ctx.createLinearGradient(-50, 0, 50, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#ffcc00');
        
        ctx.fillStyle = gradient;
        const palText = event.paladio ? `  /  +${event.paladio} PAL` : "";
        ctx.fillText(`+${event.xp} XP  /  +${event.credits} CR${palText}`, 0, 0);
        ctx.restore();
      }
    }
  });

  // Draw Loot Rewards (Minerals/Heal/Powerups)
  gameState.loot_events?.forEach(event => {
    if (me && event.owner_id === me.id) {
      const now = Date.now() / 1000;
      const elapsed = now - event.time;
      const duration = 2.0;

      if (elapsed < duration && elapsed >= 0) {
        const alpha = 1 - (elapsed / duration);
        const y_offset = elapsed * 60; // Sube un poco más rápido

        ctx.save();
        ctx.translate(event.x, event.y - 30 - y_offset);
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'center';

        let text = "";
        let color = "#fff";

        if (event.type === 'heal') {
          text = `💚 +${event.amount} HP`;
          color = "#00ffcc";
        } else if (event.type === 'mineral') {
          const mIcons = { titanium: '💎', plutonium: '🏮', silicon: '💾', iridium: '☄️' };
          const mColors = { titanium: '#00c8ff', plutonium: '#ff3333', silicon: '#00ffcc', iridium: '#ff4466' };
          text = `📦 +${event.amount} ${mIcons[event.mineral_type] || ''}`;
          color = mColors[event.mineral_type] || "#fff";
        } else if (event.type === 'cargo') {
          const mIcons = { titanium: 'Ti', plutonium: 'Pl', silicon: 'Si', iridium: 'Ir' };
          const parts = [];
          for (const [m_type, amount] of Object.entries(event.minerals || {})) {
            parts.push(`+${amount}${mIcons[m_type] || m_type}`);
          }
          text = `📦 [${parts.join(' / ')}]`;
          color = "#ffcc00"; // Color cargo (Ámbar)
        } else if (event.type === 'credits') {
          text = `💰 +${event.amount} CRÉDITOS`;
          color = "#ffcc00";
        } else if (event.type === 'ammo') {
          const aIcons = { thermal: '🔥', plasma: '🔷', siphon: '🔋' };
          const aName = event.ammo_name || "MUNICIÓN";
          text = `${aIcons[event.ammo_type] || '🚀'} +${event.amount} ${aName}`;
          color = "#00ffcc";
        } else if (event.type === 'missile_loot') {
          const mIcons = { missile_1: '🚀', missile_2: '🚀', missile_3: '☢️' };
          const mName = event.missile_name || "MISILES";
          text = `${mIcons[event.missile_type] || '🚀'} +${event.amount} ${mName.toUpperCase()}`;
          color = "#ff6600";
        } else if (event.type === 'rapid_fire') {
          text = `⚡ CADENCIA MAX!`;
          color = "#ff00aa";
        } else if (event.type === 'speed') {
          text = `🚀 VELOCIDAD MAX!`;
          color = "#00fbff";
        } else if (event.type === 'cargo_full') {
          text = "⚠️ BODEGA LLENA";
          color = "#ff3333";
        } else if (event.type === "special_coin") {
          text = `✨ +${event.amount} PALADIO`;
          color = '#ff00ff';
        }

        ctx.fillStyle = color;
        ctx.fillText(text, 0, 0);
        ctx.restore();

        // --- EFECTO DE ABSORCIÓN (NUEVO) ---
        // Dibujamos una partícula que viaja hacia la nave
        if (event.type !== 'cargo_full') {
          const tPos = Math.min(1, elapsed / 0.8); // Animación de absorción más rápida (0.8s)
          if (tPos < 1) {
            // Curva de aceleración (Quadratic Ease In)
            const easeIn = tPos * tPos;
            const curX = event.x + (me.x - event.x) * easeIn;
            const curY = event.y + (me.y - event.y) * easeIn;
            
            ctx.save();
            ctx.translate(curX, curY);
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            
            // Partícula principal
            ctx.beginPath();
            ctx.arc(0, 0, 4 * (1 - easeIn) + 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Estela corta
            ctx.globalAlpha = 0.5 * (1 - easeIn);
            ctx.beginPath();
            const tailLen = 20;
            const angle = Math.atan2(me.y - event.y, me.x - event.x);
            ctx.rotate(angle + Math.PI); // Dirección opuesta al movimiento
            ctx.moveTo(0, 0);
            ctx.lineTo(tailLen, -5);
            ctx.lineTo(tailLen, 5);
            ctx.fill();
            
            ctx.restore();
          }
        }
      }
    }
  });

  // --- 8. EVENTOS DE DAÑO ---
  if (gameState.damage_events) {
    gameState.damage_events.forEach(evt => {
      const elapsed = (Date.now() - evt.time * 1000) / 1000;
      if (elapsed > 1.0) return;
      
      const opacity = 1 - elapsed;
      const floatY = elapsed * 80; // Sube 80 píxeles
      
      ctx.save();
      ctx.font = `bold ${evt.amount > 300 ? '24px' : '16px'} Orbitron`;
      
      // Aplicar color personalizado si existe, de lo contrario blanco predeterminado
      if (evt.color) {
        ctx.fillStyle = evt.color;
        ctx.globalAlpha = opacity;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      }
      
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      
      // Para eventos de daño RECIBIDO por el jugador (color rojo = alien atacando),
      // usar la posición visual del jugador en vez de la posición del servidor
      // para evitar desync entre posición interpolada y la del servidor.
      let drawX = evt.x;
      let drawY = evt.y;
      if (evt.color === '#ff4444' && me) {
        // Daño recibido: mostrar sobre la nave del jugador (posición visual)
        // Offset determinista basado en el ID del evento para evitar jitter
        const hash = (evt.id || '').toString().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        drawX = me.x + ((hash % 30) - 15);
        drawY = me.y + ((hash * 7 % 30) - 15);
      }
      
      const screenX = drawX;
      const screenY = drawY - floatY;
      
      ctx.strokeText(`-${evt.amount}`, screenX, screenY);
      ctx.fillText(`-${evt.amount}`, screenX, screenY);
      ctx.restore();
    });
  }

  // --- 9. EVENTOS DE DESTRUCCIÓN ---
  if (gameState.destruction_events) {
    gameState.destruction_events.forEach(evt => {
      const elapsed = (Date.now() - evt.time * 1000) / 1000;
      if (elapsed > 2.0) return;

      ctx.save();
      ctx.translate(evt.x, evt.y);

      if (evt.type === 'kamikaze_explosion') {
        // EFECTO KAMIKAZE: Explosión masiva cian/blanca con onda de choque
        const radius = evt.radius || 300;
        const numParticles = 50;
        for (let i = 0; i < numParticles; i++) {
          const angle = (i / numParticles) * Math.PI * 2 + (Math.random() * 0.5);
          const dist = elapsed * (radius * 1.8);
          const pSize = (20 + Math.random() * 30) * (1 - elapsed / 1.5);
          
          if (pSize <= 0) continue;
          
          ctx.fillStyle = i % 3 === 0 ? '#00ffff' : (i % 3 === 1 ? '#ffffff' : '#0099ff');
          ctx.globalAlpha = 0.8 * (1 - elapsed / 1.5);
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00ffff';
          
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Onda de choque expansiva
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 8 * (1 - elapsed / 1.5);
        ctx.globalAlpha = 0.6 * (1 - elapsed / 1.5);
        ctx.beginPath();
        ctx.arc(0, 0, elapsed * radius * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
      } else {
        // Partículas de explosión estándar
        const numParticles = 20;
        for (let i = 0; i < numParticles; i++) {
          const angle = (i / numParticles) * Math.PI * 2;
          const dist = elapsed * (100 + Math.random() * 150);
          const pSize = (10 + Math.random() * 15) * (1 - elapsed / 2.0);
          
          ctx.fillStyle = i % 2 === 0 ? '#ff6600' : '#ff3300';
          ctx.globalAlpha = 1 - elapsed / 2.0;
          
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Destello central
      const flashSize = (1 - elapsed) * 200;
      if (flashSize > 0) {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, flashSize);
        grad.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        grad.addColorStop(0.5, 'rgba(255, 150, 0, 0.4)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, flashSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  ctx.restore(); // FIN DE RENDERIZADO DEL MUNDO

  // 4. DIBUJAR MINIMAPA (Fijo en la UI)
  const drawMinimap = () => {
    const mmW = 200;
    const mmH = 150;
    const margin = 20;
    const mmX = width - mmW - margin;
    const mmY = height - mmH - margin;

    // Fondo del Minimapa
    ctx.fillStyle = 'rgba(13, 13, 26, 0.85)';
    ctx.fillRect(mmX, mmY, mmW, mmH);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Escala del Minimapa (Mundo Dinámico)
    const m_width = gameState.map_width || 10000;
    const m_height = gameState.map_height || 8000;
    const scaleX = mmW / m_width;
    const scaleY = mmH / m_height;

    // --- GRID DEL MINIMAPA ---
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    // Líneas verticales (cada 5000 unidades)
    for (let gx = 5000; gx < m_width; gx += 5000) {
      ctx.moveTo(mmX + gx * scaleX, mmY);
      ctx.lineTo(mmX + gx * scaleX, mmY + mmH);
    }
    // Líneas horizontales (cada 4000 unidades)
    for (let gy = 4000; gy < m_height; gy += 4000) {
      ctx.moveTo(mmX, mmY + gy * scaleY);
      ctx.lineTo(mmX + mmW, mmY + gy * scaleY);
    }
    ctx.stroke();

    // --- COORDENADAS (TEXTO) ---
    if (me) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.font = 'bold 11px Orbitron';
      ctx.textAlign = 'right';
      ctx.fillText(`X: ${Math.round(me.x)}`, mmX + mmW - 8, mmY + 18);
      ctx.fillText(`Y: ${Math.round(me.y)}`, mmX + mmW - 8, mmY + 32);
    }

    // Dibujar Base en Minimapa
    if (gameState.base) {
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(mmX + gameState.base.x * scaleX, mmY + gameState.base.y * scaleY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Anillo de la base
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.strokeRect(
        mmX + (gameState.base.x - gameState.base.radius) * scaleX,
        mmY + (gameState.base.y - gameState.base.radius) * scaleY,
        (gameState.base.radius * 2) * scaleX,
        (gameState.base.radius * 2) * scaleY
      );
    }

    // Dibujar Enemigos (Radar con Rastreador ECO)
    const trackerRange = me?.eco?.tracker_range || 3500;
    gameState.enemies?.forEach(en => {
      if (me) {
        const dist = Math.hypot(me.x - en.x, me.y - en.y);
        
        // 1. Mostrar en Minimapa
        if (dist < trackerRange) {
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(mmX + en.x * scaleX, mmY + en.y * scaleY, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. NUEVO: Indicadores en los bordes de la pantalla (Rastreador Activo)
        if (me.eco?.tracker_range > 0 && dist < me.eco.tracker_range && dist > 1000) {
           // Calcular posición relativa a la cámara
           const relX = en.x - camX;
           const relY = en.y - camY;
           
           // Si está fuera de la pantalla, dibujar indicador
           if (relX < 0 || relX > width || relY < 0 || relY > height) {
              const centerX = width / 2;
              const centerY = height / 2;
              const dx = relX - centerX;
              const dy = relY - centerY;
              const angle = Math.atan2(dy, dx);
              
              const margin = 40;
              const ix = Math.max(margin, Math.min(width - margin, centerX + Math.cos(angle) * (width / 2 - margin)));
              const iy = Math.max(margin, Math.min(height - margin, centerY + Math.sin(angle) * (height / 2 - margin)));
              
              ctx.save();
              ctx.translate(ix, iy);
              ctx.rotate(angle);
              
              // Triángulo indicador
              ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
              ctx.beginPath();
              ctx.moveTo(10, 0);
              ctx.lineTo(-5, -7);
              ctx.lineTo(-5, 7);
              ctx.closePath();
              ctx.fill();
              
              // Texto de distancia
              ctx.rotate(-angle);
              ctx.fillStyle = '#ff3333';
              ctx.font = 'bold 10px Orbitron';
              ctx.textAlign = 'center';
              ctx.fillText(`${Math.floor(dist)}m`, 0, 20);
              ctx.restore();
           }
        }
      }
    });

    // Dibujar Jugadores
    gameState.players?.forEach(p => {
      ctx.fillStyle = p.is_self ? '#00ffff' : '#fff';
      if (p.is_self) {
        ctx.globalAlpha = 0.7 + Math.sin(Date.now()/100) * 0.3;
      }
      ctx.beginPath();
      ctx.arc(mmX + p.x * scaleX, mmY + p.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Dibujar Portales en Minimapa
    if (gameState.portals) {
      gameState.portals.forEach(portal => {
        const isMarsPortal = portal.target.startsWith('mars');
        ctx.strokeStyle = isMarsPortal ? '#ff6600' : '#00ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mmX + portal.x * scaleX, mmY + portal.y * scaleY, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = (isMarsPortal ? '#ff6600' : '#00ffff') + '22';
        ctx.fill();
      });
    }

    // --- NUEVO: DIBUJAR COFRES ESPECIALES EN MINIMAPA (CON RANGO) ---
    if (gameState.loot_boxes && me) {
      gameState.loot_boxes.forEach(box => {
        if (box.type === 'special_coin') {
          const dist = Math.hypot(me.x - box.x, me.y - box.y);
          if (dist < 2500) { // Rango de detección de 2500 unidades
            const bx = mmX + (box.x * scaleX);
            const by = mmY + (box.y * scaleY);
            
            // Efecto de pulso en el minimapa
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            ctx.fillStyle = `rgba(255, 0, 255, ${0.5 + pulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(bx, by, 3 + pulse * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Brillo
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
    }

    // 5. DIBUJAR NOMBRE DEL MAPA SOBRE EL MINIMAPA
    if (gameState.current_map_name) {
      ctx.save();
      ctx.font = 'bold 13px Orbitron';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffff';
      ctx.fillText(gameState.current_map_name.toUpperCase(), mmX + mmW, mmY - 8);
      
      // Subrayado decorativo
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mmX + mmW - 100, mmY - 4);
      ctx.lineTo(mmX + mmW, mmY - 4);
      ctx.stroke();
      ctx.restore();
    }
  };



  drawMinimap();
};
