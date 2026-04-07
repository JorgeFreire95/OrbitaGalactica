import React from 'react';

export default function FactionSelect({ onSelectFaction }) {
  const factions = [
    {
      id: 'MARS',
      name: 'M.A.R.S.',
      title: 'Minería Armada de Recursos Secundarios',
      color: '#ff3333',
      description: 'Una corporación forjada en hierro y sangre. Especializados en poder bélico pesado, expansión territorial inquebrantable y monopolio de asteroides ricos en minerales densos.',
      bonuses: '+5% Daño Láser | +10% Resistencia de Nave',
      icon: '⚔️'
    },
    {
      id: 'MOON',
      name: 'M.O.O.N.',
      title: 'Multinacional Orbital de Observación Nova',
      color: '#33ccff',
      description: 'Mentes brillantes enfocadas en el avance tecnológico. Cuentan con los escudos más avanzados del sistema y redes de sensores precisos. Quien tiene la información, tiene el control.',
      bonuses: '+10% Poder de Escudos | +5% Energía de Regeneración',
      icon: '🛡️'
    },
    {
      id: 'PLUTO',
      name: 'P.L.U.T.O.',
      title: 'Pioneros Logísticos Unidos del Territorio Oscuro',
      color: '#cc33ff',
      description: 'Sigilosos, ricos e implacables. Los amos del mercado negro y las rutas de contrabando. Prefieren golpear rápido desde las sombras y escapar con el botín.',
      bonuses: '+10% Velocidad de Motor | +5% Bonificación de Créditos',
      icon: '⚛️'
    }
  ];

  return (
    <div className="faction-select-wrapper">
      <div className="faction-header">
        <h1>ALISTAMIENTO DE COMANDANTE</h1>
        <p>SELECCIONA LA EMPRESA POR LA QUE LUCHARÁS EN ESTA GUERRA GALÁCTICA</p>
      </div>

      <div className="factions-container">
        {factions.map(f => (
          <div 
            key={f.id} 
            className={`faction-card faction-${f.id.toLowerCase()}`}
            onClick={() => onSelectFaction(f.id)}
          >
            <div className="faction-card-inner" style={{ '--faction-color': f.color }}>
              <div className="faction-icon" style={{ textShadow: `0 0 20px ${f.color}` }}>{f.icon}</div>
              <h2 style={{ color: f.color }}>{f.name}</h2>
              <h4 style={{ color: 'white' }}>{f.title}</h4>
              <p>{f.description}</p>
              <div className="faction-bonuses">
                {f.bonuses}
              </div>
              <button className="btn-select-faction" style={{ '--btn-color': f.color }}>
                UNIRSE A {f.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
