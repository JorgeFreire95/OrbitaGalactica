import React from 'react';

/**
 * ShipIcon - Premium Hybrid Rendering Component
 * Displays high-quality PNG images if available, 
 * or falls back to "Holographic" high-detail SVGs for new ships.
 */
export default function ShipIcon({ type, image, color = '#00ffcc', size = 100 }) {
  // If an image is provided, we use it as primary, but with a nice "shield/glow" style
  if (image) {
    return (
      <div className="ship-icon-container" style={{ width: size, height: size, position: 'relative' }}>
        <div className="ship-icon-glow" style={{ backgroundColor: color }}></div>
        <img 
          src={image} 
          alt={type} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            position: 'relative',
            zIndex: 2,
            filter: image.includes('_v2') ? 'contrast(1.6) brightness(1.2)' : `drop-shadow(0 0 10px ${color}66)`,
            mixBlendMode: image.includes('_v2') ? 'screen' : 'normal'
          }} 
        />
      </div>
    );
  }

  // Fallback to Premium SVGs (Holographic Designs)
  const renderPremiumSVG = () => {
    const strokeWidth = 1.5;
    const secondaryColor = '#ffffff44';
    
    switch (type) {
      case 'sovereign':
        return (
          <g filter="url(#glow)">
            {/* Outer Hull */}
            <path d="M50 5 L90 85 L50 70 L10 85 Z" fill="none" stroke={color} strokeWidth={strokeWidth} />
            {/* Core/Cockpit */}
            <path d="M50 15 L65 45 L50 40 L35 45 Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" />
            {/* Internal tech lines */}
            <line x1="50" y1="40" x2="50" y2="70" stroke={secondaryColor} strokeWidth="0.5" />
            <line x1="25" y1="75" x2="75" y2="75" stroke={secondaryColor} strokeWidth="0.5" />
            {/* Side Thrusters */}
            <rect x="15" y="65" width="5" height="10" fill={color} />
            <rect x="80" y="65" width="5" height="10" fill={color} />
          </g>
        );
      case 'harvester':
        return (
          <g filter="url(#glow)">
            {/* Main bulky body */}
            <path d="M20 20 L80 20 L85 80 L15 80 Z" fill="none" stroke={color} strokeWidth={strokeWidth} />
            {/* Cargo modules */}
            <rect x="30" y="30" width="15" height="40" fill="none" stroke={secondaryColor} />
            <rect x="55" y="30" width="15" height="40" fill="none" stroke={secondaryColor} />
            {/* Collector arms */}
            <path d="M15 40 L5 50 L5 70 L15 60" fill="none" stroke={color} strokeWidth="1" />
            <path d="M85 40 L95 50 L95 70 L85 60" fill="none" stroke={color} strokeWidth="1" />
            <circle cx="50" cy="20" r="5" fill={color} />
          </g>
        );
      case 'interceptor': // Solar Wind
        return (
          <g filter="url(#glow)">
            {/* Needle design */}
            <path d="M50 2 L58 40 L50 95 L42 40 Z" fill="none" stroke={color} strokeWidth={strokeWidth} />
            {/* Large wings/fins */}
            <path d="M42 35 L5 85 L42 65 Z" fill="none" stroke={color} strokeWidth="1" />
            <path d="M58 35 L95 85 L58 65 Z" fill="none" stroke={color} strokeWidth="1" />
            {/* Solar veins */}
            <line x1="20" y1="70" x2="40" y2="55" stroke={secondaryColor} strokeWidth="0.5" />
            <line x1="80" y1="70" x2="60" y2="55" stroke={secondaryColor} strokeWidth="0.5" />
          </g>
        );
      case 'bastion': // Obsidian Bastion
        return (
          <g filter="url(#glow)">
            {/* Heavy octagonal hull */}
            <path d="M35 15 L65 15 L85 40 L85 70 L65 95 L35 95 L15 70 L15 40 Z" fill="none" stroke={color} strokeWidth="2.5" />
            {/* Inner plating sections */}
            <path d="M30 40 L70 40 L75 60 L25 60 Z" fill={color} fillOpacity="0.1" stroke={secondaryColor} strokeWidth="1" />
            {/* Front cannons */}
            <line x1="40" y1="15" x2="40" y2="5" stroke={color} strokeWidth="2" />
            <line x1="60" y1="15" x2="60" y2="5" stroke={color} strokeWidth="2" />
            {/* Center core */}
            <circle cx="50" cy="50" r="8" fill="none" stroke={color} />
            <circle cx="50" cy="50" r="3" fill={color} />
          </g>
        );
      default:
        // Default silhouette for any missing one
        return <path d="M50 10 L90 90 L50 70 L10 90 Z" fill="none" stroke={color} strokeWidth={strokeWidth} />;
    }
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      
      {/* Background radial glow */}
      <circle cx="50" cy="50" r="45" fill="url(#grad)" />
      
      {renderPremiumSVG()}
    </svg>
  );
}
