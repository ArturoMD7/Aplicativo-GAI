// src/components/Register/RegisterPage.tsx
import React, { useEffect, useState, type FormEvent } from 'react';
import apiClient from '../../api/apliClient.ts';
import '../../styles/Auth/AdminRegister.css';
import { useNavigate, Link } from 'react-router-dom';

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
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await apiClient.get('/api/groups/');
        setAvailableGroups(response.data);
      } catch (err) {
        console.error('No se pudieron cargar los roles', err);
        setError('Error al cargar la lista de roles. Verifica que eres admin.');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  const handleRoleToggle = (groupName: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupName)) {
        return prev.filter(name => name !== groupName);
      } else {
        return [...prev, groupName];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === availableGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(availableGroups.map(group => group.name));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (selectedGroups.length === 0) {
      setError('Debe seleccionar al menos un rol para el usuario');
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-register-container">
      <div className="admin-register-header">
        <h1>Panel de Administración</h1>
        <p>Registrar nuevo usuario</p>
      </div>

      <div className="admin-register-form-container">
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {success && <div className="admin-alert admin-alert-success">{success}</div>}

        <form className="admin-register-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="email">Correo electrónico *</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                id="email"
                value={email}
                placeholder="usuario@empresa.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="firstName">Nombre</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  placeholder="Nombre"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="admin-form-note">Opcional</div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="lastName">Apellidos</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-user-tag"></i>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  placeholder="Apellidos"
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="admin-form-note">Opcional</div>
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Contraseña *</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="password"
                value={password}
                placeholder="Mínimo 8 caracteres"
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="password2">Confirmar contraseña *</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-lock-open"></i>
              <input
                type="password"
                id="password2"
                value={password2}
                placeholder="Repite la contraseña"
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>
              Roles del usuario *
              <span style={{fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '8px', color: '#666'}}>
                ({selectedGroups.length} seleccionados)
              </span>
            </label>
            
            {availableGroups.length > 0 && (
              <div style={{marginBottom: '12px'}}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    background: 'none',
                    border: '1px solid #840016',
                    color: '#840016',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {selectedGroups.length === availableGroups.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
            )}

            <div className="admin-roles-container">
              {loadingGroups ? (
                <div className="admin-roles-loading">
                  <i className="fas fa-spinner fa-spin"></i> Cargando roles...
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="admin-roles-error">
                  No hay roles disponibles
                </div>
              ) : (
                <div className="admin-roles-grid">
                  {availableGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`admin-role-option ${
                        selectedGroups.includes(group.name) ? 'selected' : ''
                      }`}
                      onClick={() => handleRoleToggle(group.name)}
                    >
                      <div className="admin-role-checkbox"></div>
                      <span className="admin-role-label">{group.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-form-note">
              Selecciona uno o más roles para el usuario
            </div>
          </div>

          <button 
            type="submit" 
            className="admin-submit-button" 
            disabled={loading || loadingGroups}
          >
            <i className="fas fa-user-plus"></i>
            {loading ? 'Creando Usuario...' : 'Crear Usuario'}
          </button>

          <Link to="/users" className="admin-back-button">
            <i className="fas fa-arrow-left"></i>
            Volver a Gestión de Usuarios
          </Link>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;