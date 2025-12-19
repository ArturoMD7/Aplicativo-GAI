
import React, { useState, type FormEvent } from 'react';
import apiClient from '../../api/apliClient.ts';
import '../../styles/Auth/AuthForms.css';
import '../../assets/pemexlogo.png';
import pemexLogo from '../../assets/pemexlogo.png';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';

type LoginPageProps = {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
};

function LoginPage({ onSwitchToRegister, onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [year] = useState(new Date().getFullYear());
  const [showHelp, setShowHelp] = useState(false);


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

      navigate('/', { replace: true });

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

            {/* Botón de olvidaste tu contraseña 
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <a href="#" className="auth-link">
                <i className="fas fa-key" aria-hidden="true" style={{ marginRight: 6 }}></i>
                ¿Olvidaste tu contraseña?
              </a>
            </div> */}

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <a
                href="#"
                className="auth-link"
                onClick={(e) => {
                  e.preventDefault();
                  setShowHelp(true);
                }}
              >
                <i className="fas fa-info-circle" aria-hidden="true" style={{ marginRight: 6 }}></i>
                ¿Necesitas Ayuda?
              </a>
            </div>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <a className="auth-subtitle">
                <i aria-hidden="true" style={{ marginRight: 6 }}></i>
                Copyright © {year} Petróleos Mexicanos. Derechos reservados.
              </a>
            </div>

          </form>

          {showHelp && (
            <div className="modal-help-overlay">
              <div className="modal-help">
                <h3><i className="fas fa-info-circle"></i> Contactanos:</h3>

                <h3><i></i> Gerencia de Asuntos Internos</h3>

                <ul>
                  <li><b>Coordinación GAI:</b></li>
                  <p>Alejandra Gayosso Cabello
                    alejandra.gayosso@pemex.com</p>

                  <li><b>Administrador del Sitema:</b></li>
                  <p>Ing. Jaime Morales García
                    jaime.morales@pemex.com</p>

                </ul>

                <button
                  className="modal-help-close"
                  onClick={() => setShowHelp(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

}

export default LoginPage;
