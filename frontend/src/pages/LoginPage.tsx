
import React, { useState, type FormEvent } from 'react';
import apiClient from '../api/apliClient.ts';
import '../styles/AuthForms.css'; 

// Una 'prop' para que podamos cambiar a la vista de registro
type LoginPageProps = {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void; // La nueva prop
};

// 2. Aplica las props a la función
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
      
      // 3. Llama a la función del padre (App.tsx)
      onLoginSuccess();
      
      // Ya no necesitas el 'alert'
      // alert('¡Login exitoso!');
      
    } catch (err) {
      console.error('Error en el login:', err);
      setError('Error: Email o contraseña incorrectos');
    }
  };

  // ... el resto de tu JSX (return) no cambia ...
  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        
        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Contraseña:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="auth-button">Entrar</button>

        <p className="auth-switch">
          ¿No tienes cuenta? <span onClick={onSwitchToRegister}>Regístrate aquí</span>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
