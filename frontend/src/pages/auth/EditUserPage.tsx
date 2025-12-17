import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import apiClient from '../../api/apliClient';
import '../../styles/Auth/AdminRegister.css';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import { FiSave, FiRepeat } from 'react-icons/fi';
import { FaArrowLeft } from "react-icons/fa";

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
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [user, setUser] = useState<UserData | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, groupsRes] = await Promise.all([
          apiClient.get(`/api/user/${userId}/`),
          apiClient.get('/api/groups/')
        ]);

        setUser(userRes.data);
        setAvailableGroups(groupsRes.data);
        setSelectedGroups(userRes.data.groups);
      } catch {
        setError('Error al cargar el usuario.');
      }
    };
    fetchData();
  }, [userId]);

  const handleRoleToggle = (name: string) => {
    setSelectedGroups(prev =>
      prev.includes(name)
        ? prev.filter(g => g !== name)
        : [...prev, name]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.put(`/api/user/${user.id}/`, {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        groups: selectedGroups
      });

      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => navigate('/users'), 1500);
    } catch {
      setError('No se pudo actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    MySwal.fire({
      title: 'Reestablecer contraseña',
      html: `
        <input id="p1" type="password" class="swal2-input" placeholder="Nueva contraseña">
        <input id="p2" type="password" class="swal2-input" placeholder="Confirmar contraseña">
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      preConfirm: async () => {
        const p1 = (document.getElementById('p1') as HTMLInputElement).value;
        const p2 = (document.getElementById('p2') as HTMLInputElement).value;

        if (!p1 || !p2) {
          Swal.showValidationMessage('Completa ambos campos');
          return false;
        }
        if (p1 !== p2) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return false;
        }

        try {
          await apiClient.post(`/api/users/${user?.id}/reset-password/`, {
            new_password: p1,
            confirm_password: p2
          });
          return true;
        } catch {
          Swal.showValidationMessage('Error al reestablecer contraseña');
          return false;
        }
      }
    }).then(res => {
      if (res.isConfirmed) {
        Swal.fire('Éxito', 'Contraseña reestablecida', 'success');
      }
    });
  };

  if (!user) return <div className="admin-register-container">Cargando...</div>;

  return (
    <div className="admin-register-container">
      <div className="admin-register-header">
        <h1>Editar Usuario</h1>
        <p>Modifica los datos del usuario seleccionado</p>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="admin-layout-grid">
          {/* DATOS */}
          <div className="admin-card">
            <h3 className="admin-section-title">Información del Usuario</h3>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Correo *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-envelope" />
                  <input
                    type="email"
                    value={user.email}
                    onChange={e => setUser({ ...user, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Ficha *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-id-badge" />
                  <input
                    type="number"
                    value={user.ficha}
                    onChange={e => setUser({ ...user, ficha: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Nombre</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-user" />
                  <input
                    value={user.first_name}
                    onChange={e => setUser({ ...user, first_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Apellidos</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-user-tag" />
                  <input
                    value={user.last_name}
                    onChange={e => setUser({ ...user, last_name: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ROLES */}
          <div className="admin-card">
            <h3 className="admin-section-title">
              Roles <span className="selection-count">({selectedGroups.length})</span>
            </h3>

            <div className="admin-roles-grid compact">
              {availableGroups.map(group => (
                <div
                  key={group.id}
                  className={`admin-role-option ${
                    selectedGroups.includes(group.name) ? 'selected' : ''
                  }`}
                  onClick={() => handleRoleToggle(group.name)}
                >
                  <div className="admin-role-checkbox" />
                  <span>{group.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="admin-card admin-actions-card">
          <div className="admin-actions-row">
            <ButtonIcon
              variant="edit"
              type="submit"
              text="Guardar"
              icon={<FiSave />}
              disabled={loading}
              title="Guardar cambios del usuario"
              size="medium"
            />

            <ButtonIcon
              variant="custom"
              text="Reestablecer Contraseña"
              onClick={handleResetPassword}
              color="#c0392b"
              icon={<FiRepeat />}
              hoverColor="#a93226"
              title="Reestablecer contraseña"
              size="medium"
            />

            <ButtonIcon
              variant="view"
              to="/users"
              text="Usuarios"
              icon={<FaArrowLeft />}
              title="Volver a la lista de usuarios"
              size="medium"
            />
          </div>
        </div>

      </form>
    </div>
  );
}

export default EditUserPage;
