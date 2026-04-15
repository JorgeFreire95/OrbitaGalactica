import React, { useState } from 'react';

export default function Packages({ user, paladio, setPaladio, onBack }) {
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSection, setSelectedSection] = useState('premium');
  const [selectedPaladioPackage, setSelectedPaladioPackage] = useState('p2');

  const sidebarItems = [
    { id: 'premium', label: 'Paquete Premium', icon: '💎' },
    { id: 'paladio', label: 'Paquetes de Paladio', icon: '💰' }
  ];

  const paladioPackages = [
    { id: 'p1', amount: 50, price: 0.99, label: 'Paquete Básico' },
    { id: 'p2', amount: 120, price: 1.99, label: 'Paquete Estelar' },
    { id: 'p3', amount: 280, price: 4.49, label: 'Paquete Galactic' },
    { id: 'p4', amount: 600, price: 9.99, label: 'Paquete Supremo' }
  ];

  const triggerSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBuyPremium = async () => {
    if (!user) return alert('Usuario no autenticado');

    const checkoutWindow = window.open('about:blank', 'mercadopagoPopup', 'width=900,height=720,toolbar=no,menubar=no,scrollbars=yes');
    if (!checkoutWindow) {
      return alert('No se pudo abrir la ventana de pago. Verifica el bloqueo de pop-ups.');
    }
    checkoutWindow.document.write('<p>Abriendo ventana de pago...</p>');
    checkoutWindow.focus();

    try {
      const response = await fetch('http://localhost:8000/api/payment/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, email: user.email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (!redirectUrl) {
        throw new Error(`No se recibió URL de pago en la preferencia: ${JSON.stringify(data)}`);
      }
      checkoutWindow.location.href = redirectUrl;
    } catch (error) {
      checkoutWindow.close();
      console.error('Pago premium error:', error);
      alert(`Error al procesar el pago: ${error.message}`);
    }
  };

  const handleBuyPaladio = async (amount) => {
    if (!user) return alert('Usuario no autenticado');

    const checkoutWindow = window.open('about:blank', 'mercadopagoPopup', 'width=900,height=720,toolbar=no,menubar=no,scrollbars=yes');
    if (!checkoutWindow) {
      return alert('No se pudo abrir la ventana de pago. Verifica el bloqueo de pop-ups.');
    }
    checkoutWindow.document.write('<p>Abriendo ventana de pago...</p>');
    checkoutWindow.focus();

    try {
      const response = await fetch('http://localhost:8000/api/payment/paladio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, email: user.email, amount })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (!redirectUrl) {
        throw new Error(`No se recibió URL de pago en la preferencia: ${JSON.stringify(data)}`);
      }
      checkoutWindow.location.href = redirectUrl;
    } catch (error) {
      checkoutWindow.close();
      console.error('Pago paladio error:', error);
      alert(`Error al procesar el pago: ${error.message}`);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-body" style={{ gridTemplateColumns: '240px 1fr', gap: '12px' }}>
        
        <aside className="shop-sidebar" style={{ gridColumn: 1, padding: '12px 8px' }}>
          {sidebarItems.map(item => (
            <div
              key={item.id}
              className={`shop-tab ${selectedSection === item.id ? 'active' : ''}`}
              onClick={() => setSelectedSection(item.id)}
            >
              <span>{item.label}</span>
              <span>{item.icon}</span>
            </div>
          ))}
        </aside>

        <div className="dashboard-panel" style={{ gridColumn: 2 }}>
          <div className="panel-header">
            <span>{selectedSection === 'premium' ? 'Detalle Paquete Premium' : 'Paquetes de Paladio'}</span>
            <span style={{ fontSize: '1.2rem' }}>{selectedSection === 'premium' ? '💎' : '💰'}</span>
          </div>
          <div className="panel-content">
            {selectedSection === 'premium' ? (
              <div className="pack-detail-card">
                <div className="pack-detail-header">
                  <span className="pack-detail-icon">🚀</span>
                  <span className="pack-detail-price">$9.99 USD</span>
                </div>
                <div className="pack-detail-body">
                  <h3>BENEFICIOS:</h3>
                  <ul>
                    <li><span>🔧</span> Reparación gratuita</li>
                    <li><span>💰</span> 10% de descuento en todas las compras de paladio</li>
                    <li><span>⚡</span> Acceso VIP a eventos especiales</li>
                  </ul>
                </div>
                <button className="btn-primary pack-cta" onClick={handleBuyPremium}>
                  COMPRAR PAQUETE PREMIUM
                </button>
              </div>
            ) : (
              <div className="packages-grid">
                {paladioPackages.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`pack-card ${selectedPaladioPackage === pkg.id ? 'active' : ''}`}
                    onClick={() => setSelectedPaladioPackage(pkg.id)}
                  >
                    <div className="pack-card-header">
                      <div>{pkg.label}</div>
                      <div>⚛️</div>
                    </div>
                    <div className="pack-card-amount">{pkg.amount} PAL</div>
                    <div className="pack-card-price">${pkg.price.toFixed(2)} USD</div>
                    <div className="pack-card-caption">Mejor opción para compras recurrentes</div>
                    <button
                      className="btn-primary pack-cta"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyPaladio(pkg.amount);
                      }}
                    >
                      COMPRAR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#00ff00',
          color: 'black',
          padding: '15px 20px',
          borderRadius: '5px',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          {successMessage}
        </div>
      )}
    </div>
  );
}