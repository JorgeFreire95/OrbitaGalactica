import React from 'react';

export const SlotDisplay = ({ label, count, icon, color, equipped = [], onUnequip, isBlocked = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
      <span>{icon} {label}</span>
      <span style={{ color }}>{equipped.length} / {count}</span>
    </div>
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, i) => {
        const item = equipped[i];
        const slotKey = `slot-${label.toLowerCase()}-${i}`;
        return (
          <div 
            key={slotKey} 
            onClick={() => !isBlocked && item && onUnequip && onUnequip(item.instanceId)}
            title={isBlocked ? 'Bloqueado: No estás en zona segura' : (item ? `${item.name} (Clic para desequipar)` : 'Vacío')}
            style={{ 
              width: '22px', 
              height: '22px', 
              backgroundColor: item ? (isBlocked ? '#444' : color) : 'rgba(255,255,255,0.05)', 
              borderRadius: '4px',
              border: item ? 'none' : '1px dashed #444',
              boxShadow: (item && !isBlocked) ? `0 0 10px ${color}88` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              cursor: (item && !isBlocked) ? 'pointer' : (isBlocked && item ? 'not-allowed' : 'default'),
              transition: 'all 0.2s',
              opacity: isBlocked && item ? 0.6 : 1
            }} 
            onMouseOver={(e) => { if(item && !isBlocked) e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={(e) => { if(item && !isBlocked) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {item && '✅'}
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
