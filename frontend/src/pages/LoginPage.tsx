
import React, { useState, type FormEvent } from 'react';
import apiClient from '../api/apliClient.ts';
import '../styles/AuthForms.css';
import '../assets/pemexlogo.png';
import pemexLogo from '../assets/pemexlogo.png'; 
import '@fortawesome/fontawesome-free/css/all.min.css';

type LoginPageProps = {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void; 
};

function LoginPage({ onSwitchToRegister, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); 

    try {
      const response = await apiClient.post('/api/token/', {
        username: email,
        password: password
      });
      
      console.log('Login exitoso:', response.data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      onLoginSuccess();
      
    } catch (err) {
      console.error('Error en el login:', err);
      setError('Error: Email o contraseña incorrectos');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-body">
          <div className="auth-brand">
            <img src={pemexLogo} alt="Pemex" />
            <h3 className="titulo-pemex">Iniciar Sesión</h3>
            <p className="auth-subtitle">Ingrese sus credenciales para continuar</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group input-icon">
              <i className="fas fa-envelope" aria-hidden="true"></i>
              <input
                type="email"
                value={email}
                placeholder="Correo electrónico"
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Correo electrónico"
              />
            </div>

            <div className="form-group input-icon">
              <i className="fas fa-lock" aria-hidden="true"></i>
              <input
                type="password"
                value={password}
                placeholder="Contraseña"
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Contraseña"
              />
            </div>

            <button type="submit" className="btn-pemex">
              <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
              Acceder
            </button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <a href="#" className="auth-link">
                <i className="fas fa-key" aria-hidden="true" style={{ marginRight: 6 }}></i>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

          </form>
        </div>
      </div>
    </div>
  );

}

export default LoginPage;
