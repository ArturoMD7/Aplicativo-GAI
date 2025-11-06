import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apliClient';
import '../styles/AdminRegister.css'; // reutilizamos estilos de registro

type Group = { id: number; name: string };
type UserData = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
};

function EditUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, groupsRes] = await Promise.all([
          apiClient.get(`/api/user/${userId}/`),
          apiClient.get('/api/groups/'),
        ]);

        setUser(userRes.data);
        setAvailableGroups(groupsRes.data);
        setSelectedGroups(userRes.data.groups);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar el usuario o los roles.');
      }
    };
    fetchData();
  }, [userId]);

  const handleRoleToggle = (groupName: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiClient.put(`/api/user/${user.id}/`, {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        groups: selectedGroups,
      });

      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => navigate('/users'), 1500);
    } catch (err: any) {
      console.error('Error actualizando usuario:', err.response?.data);
      setError('No se pudo actualizar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="admin-register-container">Cargando usuario...</div>;
  }

  return (
    <div className="admin-register-container">
      <div className="admin-register-header">
        <h1>Editar Usuario</h1>
        <p>Modifica los datos del usuario seleccionado</p>
      </div>

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
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
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
                value={user.first_name}
                onChange={(e) => setUser({ ...user, first_name: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="lastName">Apellidos</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-user-tag"></i>
              <input
                type="text"
                id="lastName"
                value={user.last_name}
                onChange={(e) => setUser({ ...user, last_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="admin-form-group">
          <label>Roles *</label>
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
        </div>

        <button type="submit" className="admin-submit-button" disabled={loading}>
          <i className="fas fa-save"></i>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>

        <Link to="/users" className="admin-back-button">
          <i className="fas fa-arrow-left"></i>
          Volver a Usuarios
        </Link>
      </form>
    </div>
  );
}

export default EditUserPage;
