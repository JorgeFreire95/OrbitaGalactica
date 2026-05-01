import React from 'react';

const NavigationBar = ({ currentView, onNavigate, unreadCount = 0 }) => {
  const tabs = [
    { id: 'menu', label: 'Inicio' },
    { id: 'hangar', label: 'Hangar' },
    { id: 'shop', label: 'Tienda' },
    { id: 'lab', label: 'Laboratorio' },
    { id: 'clan', label: 'Clan' },
    { id: 'missions', label: 'Misiones' },
    { id: 'friends', label: 'Amigos' },
    { id: 'messages', label: 'Correos', badge: unreadCount },
    { id: 'packages', label: 'Paquetes' },
    { id: 'subasta', label: 'Subasta' },
  ];

  const handleNavigate = (tab) => {
    if (tab.wip) {
      alert(`La sección de "${tab.label}" está actualmente encriptada. Completa misiones para desbloquearla.`);
      return;
    }
    onNavigate(tab.id);
  };

  return (
    <nav className="dashboard-nav">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`nav-tab ${currentView === tab.id ? 'active' : ''}`}
          onClick={() => handleNavigate(tab)}
          style={{ position: 'relative' }}
        >
          {tab.label}
          {tab.badge > 0 && (
            <span style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: '#ff3333',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              minWidth: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              boxShadow: '0 0 5px rgba(255,51,51,0.5)',
              border: '1px solid #fff'
            }}>
              {tab.badge > 9 ? '9+' : tab.badge}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default NavigationBar;
