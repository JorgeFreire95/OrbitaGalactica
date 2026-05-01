import React, { useState, useEffect } from 'react';
import { getItemById } from '../utils/gameData';
import './Auctions.css';

const Auctions = ({ auctions, resetIn, onBid, userCredits, onBack }) => {
  const [bidAmounts, setBidAmounts] = useState({});
  const [localResetIn, setLocalResetIn] = useState(resetIn);

  useEffect(() => {
    setLocalResetIn(resetIn);
  }, [resetIn]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalResetIn(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (auctionId, value) => {
    setBidAmounts({ ...bidAmounts, [auctionId]: value });
  };

  const handleBid = (auctionId, auction) => {
    const amount = parseInt(bidAmounts[auctionId]);
    const currentBid = auction.highest_bid;
    const hasBidder = auction.highest_bidder_name !== '-';

    if (!amount) {
      alert("Por favor, ingresa un monto válido.");
      return;
    }

    if (hasBidder) {
      if (amount < currentBid + 10000) {
        alert("Debes superar la puja actual por al menos 10.000 créditos.");
        return;
      }
    } else {
      if (amount < currentBid) {
        alert(`La puja mínima inicial es de ${currentBid.toLocaleString()} créditos.`);
        return;
      }
    }

    onBid(auctionId, amount);
  };

  return (
    <div className="auctions-container">
      <div className="auctions-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>&larr; VOLVER</button>
          <h1>SALA DE SUBASTAS</h1>
        </div>
        <div className="timer-badge">
          REINICIO EN: <span>{formatTime(localResetIn)}</span>
        </div>
      </div>

      <div className="auctions-info">
        <p>¡Pujan Créditos por tecnología de élite! Las subastas se cierran cada hora.</p>
        <div className="user-credits">Tus Créditos: <span>{userCredits.toLocaleString()}</span></div>
      </div>

      <div className="auctions-table-container">
        <table className="auctions-table">
          <thead>
            <tr>
              <th>OBJETO</th>
              <th>VALOR ORIGINAL</th>
              <th>MEJOR POSTOR</th>
              <th>MONTO DE LA PUJA</th>
              <th>TU PUJA</th>
              <th>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {auctions.length > 0 ? (
              auctions.map((auc) => (
                <tr key={auc.id} className={auc.your_bid > 0 ? 'active-bid' : ''}>
                  <td className="item-name">
                    <div className="item-icon-wrapper">
                      {getItemDisplay(auc.item_id)}
                    </div>
                    {auc.name}
                  </td>
                  <td className="item-value">{auc.value}</td>
                  <td className="best-bidder">{auc.highest_bidder_name}</td>
                  <td className="bid-amount">
                    {auc.highest_bidder_name === '-' ? '-' : `${auc.highest_bid.toLocaleString()} C`}
                  </td>
                  <td className="your-bid">
                    {auc.your_bid > 0 ? `${auc.your_bid.toLocaleString()} C` : '-'}
                  </td>
                  <td className="bid-controls">
                    <input 
                      type="number" 
                      placeholder="Monto..." 
                      value={bidAmounts[auc.id] || ''} 
                      onFocus={(e) => {
                        if (!bidAmounts[auc.id]) {
                          handleInputChange(auc.id, 10000);
                        }
                      }}
                      onChange={(e) => handleInputChange(auc.id, e.target.value)}
                    />
                    <button onClick={() => handleBid(auc.id, auc)}>PUJAR</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No hay subastas activas en este momento. Sincronizando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getItemDisplay = (id) => {
    const item = getItemById(id);
    if (item) {
        if (item.image) return <img src={item.image} alt={item.name} className="auction-item-img" />;
        return <span className="auction-item-emoji">{item.icon || '📦'}</span>;
    }
    return <span className="auction-item-emoji">📦</span>;
};

export default Auctions;
