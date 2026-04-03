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

export const drawGame = (ctx, gameState) => {
  const { width, height } = ctx.canvas;
  
  // Clear canvas
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, width, height);

  // Draw background grid (optional space effect)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
  }
  for (let i = 0; i < height; i += 50) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
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
    ctx.restore();
  });

  // Draw projectiles
  gameState.projectiles?.forEach(proj => {
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.fillStyle = proj.is_player ? '#00ffcc' : '#ff00aa';
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
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
};
