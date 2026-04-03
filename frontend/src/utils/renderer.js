const tankImg = new Image();
tankImg.src = '/aegis_vanguard.png';

const fastImg = new Image();
fastImg.src = '/nova_striker.png';

const stealthImg = new Image();
stealthImg.src = '/orion_phantom.png';

const heavyImg = new Image();
heavyImg.src = '/titan_hammer.png';

const supportImg = new Image();
supportImg.src = '/helix_support.png';

export const drawGame = (ctx, gameState, camX = 0, camY = 0) => {
  const { width, height } = ctx.canvas;
  
  // 1. Limpiar canvas (Fondo fijo)
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, width, height);

  // 2. Dibujar cuadrícula Galáctica (Efecto Parallax Infinito)
  // Dibujamos la cuadrícula desplazada por el módulo para que parezca infinita
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  const gridSize = 100;
  const offsetX = -camX % gridSize;
  const offsetY = -camY % gridSize;

  ctx.beginPath();
  for (let x = offsetX; x < width; x += gridSize) {
    ctx.moveTo(x, 0); ctx.lineTo(x, height);
  }
  for (let y = offsetY; y < height; y += gridSize) {
    ctx.moveTo(0, y); ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 3. Dibujar Bordes del Mundo (2000x1500)
  ctx.save();
  ctx.translate(-camX, -camY);
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 10000, 8000);
  
  // Resplandor en los bordes
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'cyan';
  ctx.strokeRect(0, 0, 10000, 8000);
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

    // 2. Estructura de la Estación
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Date.now() / 2000); // Rotación lenta
    
    // Núcleo
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Brazos / Estructura
    for(let i=0; i<4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#16213e';
        ctx.fillRect(40, -10, 60, 20);
        ctx.strokeStyle = '#00ffff';
        ctx.strokeRect(40, -10, 60, 20);
        // Luces de hangar
        ctx.fillStyle = (Math.sin(Date.now()/200) > 0) ? '#00ff00' : '#003300';
        ctx.beginPath(); ctx.arc(90, 0, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
    
    // Etiqueta de la Base
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText("ESTACIÓN CENTRAL", x, y - radius - 20);
  }

  // Draw loot boxes
  gameState.loot_boxes?.forEach(box => {
    ctx.save();
    ctx.translate(box.x, box.y);
    
    if (box.type === 'mineral') {
      const colors = { titanium: '#00c8ff', plutonium: '#ff3333', silicon: '#00ffcc' };
      ctx.fillStyle = colors[box.mineral_type] || '#fff';
      // Octagon or diamond shape for minerals
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      // Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
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
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    // Alien shape
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff'; // eyes
    ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI * 2); ctx.fill();
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

    // Retícula de fijación (Lock-on)
    if (gameState.selectedTargetId === enemy.id) {
        // Calcular distancia y determinar estado de rango
        const me = gameState.players?.find(p => p.is_self);
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
    ctx.save();
    ctx.translate(proj.x, proj.y);
    
    // Rotar para que el rayo siga la dirección de la trayectoria
    const angle = Math.atan2(proj.vy, proj.vx);
    ctx.rotate(angle);

    const baseColor = proj.is_player ? '#00ffcc' : '#ff00aa';
    const ammoColors = {
      'standard': '#ffffff',
      'thermal': '#ff6600',
      'plasma': '#ff33ff',
      'siphon': '#33ff33'
    };
    const color = proj.is_player ? (ammoColors[proj.ammo_type] || baseColor) : baseColor;

    ctx.fillStyle = color;
    ctx.shadowBlur = 20;
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
    
    ctx.restore();
  });

  // Draw players
  gameState.players?.forEach(player => {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Base constants
    const baseColor = player.color || '#00b3ff';
    const size = player.ship_type === 'tank' ? 70 : 60;
    
    // Fake 3D Banking & Depth
    ctx.save();
    
    // Deep 3D Shadow
    ctx.shadowBlur = 25;
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
    
    // Draw the 3D sprite
    if (player.ship_type === 'tank') {
      ctx.drawImage(tankImg, -size/2, -size/2, size, size);
    } else if (player.ship_type === 'fast') {
      ctx.drawImage(fastImg, -size/2, -size/2, size, size);
    } else if (player.ship_type === 'stealth') {
      ctx.drawImage(stealthImg, -size/2, -size/2, size, size);
    } else if (player.ship_type === 'heavy') {
      ctx.drawImage(heavyImg, -size/2, -size/2, size, size);
    } else if (player.ship_type === 'support') {
      ctx.drawImage(supportImg, -size/2, -size/2, size, size);
    } else {
      ctx.drawImage(tankImg, -size/2, -size/2, size, size); // fallback
    }
    
    // Add colored engine glow to the base (thrusters)
    ctx.shadowBlur = 15;
    ctx.shadowColor = baseColor;
    ctx.shadowOffsetY = 0;
    ctx.shadowOffsetX = 0;
    ctx.globalCompositeOperation = 'screen';
    // Draw faint thruster glow bubble at bottom
    ctx.beginPath();
    ctx.arc(0, size/2.5, 8, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.restore();
    
    // Name
    ctx.fillStyle = '#fff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(player.id.substring(0,6), 0, 30);
    
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
    
    ctx.restore();
  });

  // Draw Kill Rewards (XP/Credits)
  gameState.kill_events?.forEach(event => {
    const me = gameState.players?.find(p => p.is_self);
    // Solo mostrar recompensas propias para no saturar
    if (me && event.owner_id === me.id) {
      const now = Date.now() / 1000;
      const elapsed = now - event.time;
      const duration = 2.5;
      
      if (elapsed < duration && elapsed >= 0) {
        const alpha = 1 - (elapsed / duration);
        const y_offset = elapsed * 50; // Se eleva 50px por segundo
        
        ctx.save();
        ctx.translate(event.x, event.y - 40 - y_offset);
        ctx.globalAlpha = alpha;
        
        // Sombra para legibilidad
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        
        // Texto con degradado premium
        ctx.font = 'bold 18px Orbitron';
        ctx.textAlign = 'center';
        
        const gradient = ctx.createLinearGradient(-50, 0, 50, 0);
        gradient.addColorStop(0, '#00ffff'); // XP en Cian
        gradient.addColorStop(1, '#ffcc00'); // CR en Dorado/Amarillo
        
        ctx.fillStyle = gradient;
        ctx.fillText(`+${event.xp} XP  /  +${event.credits} CR`, 0, 0);
        
        ctx.restore();
      }
    }
  });

  ctx.restore(); // FIN DE RENDERIZADO DEL MUNDO

  // 4. DIBUJAR MINIMAPA (Fijo en la UI)
  const drawMinimap = () => {
    const mmW = 200;
    const mmH = 150;
    const margin = 20;
    const mmX = width - mmW - margin;
    const mmY = height - mmH - margin;

    // Fondo del Minimapa
    ctx.fillStyle = 'rgba(13, 13, 26, 0.8)';
    ctx.fillRect(mmX, mmY, mmW, mmH);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Escala del Minimapa (Mundo 10000x8000 -> Mini 200x150)
    const scaleX = mmW / 10000;
    const scaleY = mmH / 8000;

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

    // Dibujar Enemigos
    gameState.enemies?.forEach(en => {
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(mmX + en.x * scaleX, mmY + en.y * scaleY, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dibujar Jugadores
    gameState.players?.forEach(p => {
      ctx.fillStyle = p.is_self ? '#00ffff' : '#fff';
      if (p.is_self) {
        // Tu nave parpadea ligeramente en el radar
        ctx.globalAlpha = 0.7 + Math.sin(Date.now()/100) * 0.3;
      }
      ctx.beginPath();
      ctx.arc(mmX + p.x * scaleX, mmY + p.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  drawMinimap();
};
