import React, { useEffect, useState, type FormEvent } from 'react';
import apiClient from '../api/apliClient.ts';
import '../styles/AuthForms.css';
import pemexLogo from '../assets/pemexlogo.png';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';

type Group = {
  id: number;
  name: string;
};

type RegisterPageProps = {
  onSwitchToLogin: () => void;
};

function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await apiClient.get('/api/groups/');
        setAvailableGroups(response.data);
      } catch (err) {
        console.error('No se pudieron cargar los roles', err);
        setError('Error al cargar la lista de roles. Verifica que eres admin.');
      }
    };
    fetchGroups();
  }, []);

  const handleGroupsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedGroups(selected);
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await apiClient.post('/api/register/', {
        email,
        password,
        password2,
        first_name: firstName,
        last_name: lastName,
        groups: selectedGroups
      });
      setSuccess('¡Usuario creado exitosamente! Redirigiendo...');
      setTimeout(() => navigate('/users'), 1500);

    } catch (err: any) {
      console.error('Error en el registro:', err.response?.data);
      if (err.response?.data) {
        const errors = err.response.data;
        const firstErrorKey = Object.keys(errors)[0];
        setError(errors[firstErrorKey][0]);
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-body">
          <div className="auth-brand">
            <img src={pemexLogo} alt="Pemex" />
            <h3 className="titulo-pemex">Crear Cuenta</h3>
            <p className="auth-subtitle">Registra tus datos para continuar</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

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
              <i className="fas fa-user" aria-hidden="true"></i>
              <input
                type="text"
                value={firstName}
                placeholder="Nombre (opcional)"
                onChange={(e) => setFirstName(e.target.value)}
                aria-label="Nombre"
              />
            </div>

            <div className="form-group input-icon">
              <i className="fas fa-user-tag" aria-hidden="true"></i>
              <input
                type="text"
                value={lastName}
                placeholder="Apellidos (opcional)"
                onChange={(e) => setLastName(e.target.value)}
                aria-label="Apellidos"
              />
            </div>

            <div className="form-group input-icon">
              <i className="fas fa-lock" aria-hidden="true"></i>
              <input
                type="password"
                value={password}
                placeholder="Contraseña (mín. 8 caracteres)"
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Contraseña"
              />
            </div>

            <div className="form-group input-icon">
              <i className="fas fa-lock-open" aria-hidden="true"></i>
              <input
                type="password"
                value={password2}
                placeholder="Confirmar contraseña"
                onChange={(e) => setPassword2(e.target.value)}
                required
                aria-label="Confirmar contraseña"
              />
            </div>

            <div className="form-group input-icon">
              <i className="fas fa-shield-alt" aria-hidden="true"></i>
              <select
                multiple={true}
                value={selectedGroups}
                onChange={handleGroupsChange}
                className="role-select" 
              >
                {availableGroups.length === 0 ? (
                  <option disabled>Cargando roles...</option>
                ) : (
                  availableGroups.map(group => (
                    <option key={group.id} value={group.name}>
                      {group.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button type="submit" className="btn-pemex">
              <i className="fas fa-user-plus" aria-hidden="true"></i>
              Registrarse
            </button>

            <div className="divider">Opciones adicionales</div>

            <p className="auth-switch">
              ¿Ya tienes cuenta? <span onClick={onSwitchToLogin}>Inicia sesión</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
