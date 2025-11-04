import React, { useState, type FormEvent } from 'react';
import apiClient from '../api/apliClient.ts';
import '../styles/AuthForms.css'; 

type RegisterPageProps = {
  onSwitchToLogin: () => void;
};

function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validación simple en frontend
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await apiClient.post('/api/register/', {
        email: email,
        password: password,
        password2: password2,
        first_name: firstName,
        last_name: lastName
      });
      
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      onSwitchToLogin();

    } catch (err: any) {
      console.error('Error en el registro:', err.response.data);
      // Capturamos errores del backend (ej. email duplicado)
      if (err.response && err.response.data) {
        // Obtenemos el primer error
        const errors = err.response.data;
        const firstErrorKey = Object.keys(errors)[0];
        setError(errors[firstErrorKey][0]);
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Crear Cuenta</h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="error-message" style={{ color: '#4CAF50' }}>{success}</p>}

        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Nombre (Opcional):</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Apellidos (Opcional):</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Contraseña (mín. 8 caracteres):</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Confirmar Contraseña:</label>
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
        </div>
        <button type="submit" className="auth-button">Registrarse</button>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <span onClick={onSwitchToLogin}>Inicia sesión</span>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;