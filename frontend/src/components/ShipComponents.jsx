import React from 'react';

export const SlotDisplay = ({ label, count, icon, color, equipped = [], onUnequip, isBlocked = false, unlockedCount = 999, onUnlock }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'Orbitron', letterSpacing: '1px' }}>
      <span style={{ color: '#88aaff' }}>{icon} {label.toUpperCase()}</span>
      <span style={{ color }}>{equipped.length} / {Math.min(count, unlockedCount)} {unlockedCount < count && <span style={{ color: '#666', fontSize: '0.7rem' }}>({count} max)</span>}</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '6px' }}>
      {Array.from({ length: count }).map((_, i) => {
        const isLocked = i >= unlockedCount;
        const item = !isLocked ? equipped[i] : null;
        const slotKey = `slot-${label.toLowerCase()}-${i}`;
        
        return (
          <div 
            key={slotKey} 
            onClick={() => {
              if (isLocked) {
                if (onUnlock) onUnlock();
                return;
              }
              if (!isBlocked && item && onUnequip) onUnequip(item.instanceId);
            }}
            title={isLocked ? 'Ranura Bloqueada - Clic para desbloquear' : (isBlocked ? 'Bloqueado: No estás en zona segura' : (item ? `${item.name} (Clic para desequipar)` : 'Vacío'))}
            style={{ 
              minHeight: '48px', 
              backgroundColor: isLocked ? '#0a0a0a' : (item ? (isBlocked ? '#222' : 'rgba(0,0,0,0.4)') : 'rgba(255,255,255,0.02)'), 
              borderRadius: '4px',
              border: isLocked ? '1px solid #222' : (item ? `1px solid ${color}44` : '1px dashed #333'),
              boxShadow: (item && !isBlocked) ? `inset 0 0 10px ${color}11` : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              cursor: (isLocked || (item && !isBlocked)) ? 'pointer' : (isBlocked && item ? 'not-allowed' : 'default'),
              transition: 'all 0.2s',
              opacity: isBlocked && item ? 0.6 : 1,
              position: 'relative'
            }} 
            className="slot-item-container"
            onMouseOver={(e) => { if((item || isLocked) && !isBlocked) e.currentTarget.style.borderColor = color; }}
            onMouseOut={(e) => { if((item || isLocked) && !isBlocked) e.currentTarget.style.borderColor = isLocked ? '#222' : (item ? `${color}44` : '#333'); }}
          >
            {isLocked ? (
              <span style={{ fontSize: '1rem', opacity: 0.5 }}>🔒</span>
            ) : item ? (
              <>
                <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
                  {item.image ? 
                    <img src={item.image} alt={item.name} style={{ height: '100%', objectFit: 'contain' }} /> 
                    : <span style={{ fontSize: '14px' }}>{item.icon}</span>
                  }
                </div>
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: '#fff', 
                  textAlign: 'center', 
                  width: '100%', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  fontFamily: 'Orbitron',
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  {item.name}
                </div>
                {!isBlocked && <div style={{ position: 'absolute', top: '2px', right: '4px', fontSize: '0.5rem', color: '#ff3366', opacity: 0.4 }}>✕</div>}
              </>
            ) : (
              <span style={{ fontSize: '0.5rem', color: '#444', textTransform: 'uppercase', letterSpacing: '1px' }}>vacio</span>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export const StatRow = ({ label, color, value, bonus, permanent = 0 }) => {
  const total = value + bonus + permanent;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ width: '80px', fontSize: '0.8rem', fontWeight: 'bold', color }}>{label}:</span>
      <div style={{ flex: 1, background: '#333', height: '10px', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ 
          width: `${Math.min(100, (total / 350) * 100)}%`, 
          background: color, 
          height: '100%', 
          transition: 'width 0.3s' 
        }}>
           {/* Representación visual del bono permanente y módulos si quisieras separarlos, pero por ahora mostramos total */}
        </div>
      </div>
      <span style={{ width: '80px', fontSize: '0.8rem', textAlign: 'right' }}>
        {value}
        {bonus > 0 && <span style={{ color: '#33ff33', fontSize: '0.7rem' }}> +{bonus}</span>}
        {permanent > 0 && <span style={{ color: '#00ffcc', fontSize: '0.7rem' }}> +{permanent}★</span>}
      </span>
    </div>
  );
};
