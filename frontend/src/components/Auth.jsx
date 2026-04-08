import React, { useState } from 'react';

export default function Auth({ onLogin, onRegister, onForgotPassword }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', password: '', confirmPassword: '', email: '' });
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginForm.username) return alert('Ingresa tu nombre de usuario para continuar.');
    if (!loginForm.password) return alert('Ingresa tu contraseña para continuar.');
    onLogin(loginForm.username, loginForm.password);
  };

  const handleRegSubmit = (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      return alert('Las contraseñas no coinciden.');
    }
    if (!regForm.username || !regForm.email) {
      return alert('Completa todos los campos obligatorios para el registro.');
    }
    onRegister(regForm);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return alert('Ingresa tu correo para recuperar la contraseña.');
    onForgotPassword(forgotEmail);
    setView('login');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-page-content">
        <h1 className="game-main-title">ÓRBITA GALÁCTICA</h1>

        {view === 'login' && (
          <>
            <section className="login-section">
              <form className="login-form-horizontal" onSubmit={handleLoginSubmit}>
                <div className="login-inputs">
                  <input 
                    type="text" 
                    placeholder="Nombre de Piloto" 
                    value={loginForm.username}
                    onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                  />
                  <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
                <div className="login-actions">
                  <button type="submit" className="btn-primary">INICIAR SESIÓN</button>
                  <button type="button" className="btn-link" onClick={() => setView('forgot')}>¿Recuperar Contraseña?</button>
                </div>
              </form>
            </section>

            <div className="auth-divider">
              <span>O CREA UNA NUEVA CUENTA DE COMANDANTE</span>
            </div>

            <section className="register-section">
              <form className="register-form-vertical" onSubmit={handleRegSubmit}>
                <div className="reg-input-group">
                  <label>NOMBRE DE PILOTO</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Elige tu Alias"
                    value={regForm.username}
                    onChange={e => setRegForm({...regForm, username: e.target.value})}
                  />
                </div>
                <div className="reg-input-group">
                  <label>CORREO ELECTRÓNICO</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="usuario@sistema.com"
                    value={regForm.email}
                    onChange={e => setRegForm({...regForm, email: e.target.value})}
                  />
                </div>
                <div className="reg-input-group">
                  <label>CLAVE DE ACCESO</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="Contraseña secreta"
                    value={regForm.password}
                    onChange={e => setRegForm({...regForm, password: e.target.value})}
                  />
                </div>
                <div className="reg-input-group">
                  <label>CONFIRMAR CLAVE</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="Repite tu contraseña"
                    value={regForm.confirmPassword}
                    onChange={e => setRegForm({...regForm, confirmPassword: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn-mega-register">INGRESAR A LA BATALLA</button>
              </form>
            </section>
          </>
        )}

        {view === 'forgot' && (
          <section className="forgot-section">
            <h2 style={{ color: '#00ffff', fontFamily: 'Orbitron', marginBottom: '20px' }}>RECUPERAR CUENTA</h2>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
            <form onSubmit={handleForgotSubmit} className="register-form-vertical">
              <div className="reg-input-group">
                <label>CORREO ELECTRÓNICO</label>
                <input 
                  type="email" 
                  required 
                  placeholder="usuario@sistema.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>ENVIAR ENLACE</button>
                <button type="button" className="btn-link" onClick={() => setView('login')} style={{ flex: 1 }}>VOLVER</button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
