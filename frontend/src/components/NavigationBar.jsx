import React from 'react';

const NavigationBar = ({ currentView, onNavigate }) => {
  const tabs = [
    { id: 'menu', label: 'Inicio' },
    { id: 'hangar', label: 'Hangar' },
    { id: 'shop', label: 'Tienda' },
    { id: 'lab', label: 'Laboratorio' },
    { id: 'clan', label: 'Clan' },
    { id: 'missions', label: 'Misiones' },
    { id: 'friends', label: 'Amigos' },
    { id: 'messages', label: 'Correos' },
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
        >
          {tab.label}
        </div>
      ))}
    </nav>
  );
};

export default NavigationBar;
