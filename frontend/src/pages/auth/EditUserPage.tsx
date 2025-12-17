import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apliClient';
import '../../styles/Auth/AdminRegister.css'; 

type Group = { id: number; name: string };
type UserData = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
  ficha: string;
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
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

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

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden');
      return;
    }

    setResetError('');
    setResetSuccess('');
    setResetLoading(true);

    try {
      await apiClient.post(`/api/users/${user?.id}/reset-password/`, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setResetSuccess('Contraseña reestablecida correctamente');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess('');
      }, 1500);
    } catch (err: any) {
      setResetError(
        err.response?.data?.new_password ||
        'Error al reestablecer la contraseña'
      );
    } finally {
      setResetLoading(false);
    }
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
        <div className="admin-form-row">
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

          <div className="admin-form-group">
            <label htmlFor="email">Ficha *</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-envelope"></i>
              <input
                type="number"
                id="ficha"
                value={user.ficha}
                onChange={(e) => setUser({ ...user, ficha: e.target.value })}
                required
              />
            </div>
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
                className={`admin-role-option ${selectedGroups.includes(group.name) ? 'selected' : ''
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

        <button
          type="button"
          className="admin-submit-button danger"
          onClick={() => setShowResetModal(true)}
        >
          <i className="fas fa-key"></i>
          Reestablecer Contraseña
        </button>


        <Link to="/users" className="admin-back-button">
          <i className="fas fa-arrow-left"></i>
          Volver a Usuarios
        </Link>
      </form>


      {showResetModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>Reestablecer contraseña</h2>
            <p>
              Se asignará una nueva contraseña al usuario <b>{user.email}</b>
            </p>

            {resetError && (
              <div className="admin-alert admin-alert-error">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="admin-alert admin-alert-success">
                {resetSuccess}
              </div>
            )}

            <div className="admin-form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="admin-modal-actions">
              <button
                className="admin-submit-button"
                onClick={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? 'Reestableciendo...' : 'Confirmar'}
              </button>

              <button
                className="admin-back-button"
                onClick={() => setShowResetModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditUserPage;
