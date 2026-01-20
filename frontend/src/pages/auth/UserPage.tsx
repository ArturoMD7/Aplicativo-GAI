// src/components/Users/UsersPage.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apliClient';
import { FiUsers, FiLoader, FiUserX, FiUser } from 'react-icons/fi';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import '../../styles/Auth/UserPage.css';

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
  ficha?: string;
  profile_picture?: string;
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/api/users/');
        setUsers(response.data);
      } catch (err) {
        setError('No se pudo cargar la lista de usuarios. Verifica que tienes permisos de administrador.');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);


  const handleDelete = async (userId: number, userEmail: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${userEmail}" ? `)) {
      return;
    }

    try {
      await apiClient.delete(`/ api / user / ${userId}/`);
      alert(`Usuario ${userEmail} eliminado correctamente.`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error('Error eliminando usuario:', err.response?.data);
      alert(err.response?.data?.error || 'No se pudo eliminar el usuario.');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <FiLoader className="spinner" />
          <h3>Cargando usuarios...</h3>
          <p>Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="error-message">
          <FiUserX style={{ fontSize: '2rem', marginBottom: '12px' }} />
          <h3>Error al cargar los usuarios</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiUsers /> Gestión de Usuarios</h1>
        <ButtonIcon
          to="/admin/register-user"
          variant="add"
          text="Nuevo Usuario"
        />
      </div>

      <div className="user-list-container">
        {users.length === 0 ? (
          <div className="empty-state">
            <FiUsers className="icon" />
            <h3>No hay usuarios registrados</h3>
            <p>Comienza agregando el primer usuario al sistema</p>
            <div style={{ marginTop: '16px', display: 'inline-flex' }}>
              <ButtonIcon
                to="/admin/register-user"
                variant="add"
                text="Agregar Primer Usuario"
              />
            </div>
          </div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}></th>
                <th>FICHA</th>
                <th>Email</th>
                <th>Nombre Completo</th>
                <th>Roles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8f9fa'
                    }}>
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt="Av"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <FiUser style={{ color: '#adb5bd', fontSize: '1.2rem' }} />
                      )}
                    </div>
                  </td>
                  <td>{user.ficha}</td>
                  <td className="user-email">{user.email}</td>
                  <td className="user-name">
                    {user.first_name || user.last_name
                      ? `${user.first_name} ${user.last_name}`.trim()
                      : 'No especificado'
                    }
                  </td>
                  <td>
                    <div className="user-roles">
                      {user.groups.length > 0 ? (
                        user.groups.map((group, index) => (
                          <span key={index} className="role-badge">
                            {group}
                          </span>
                        ))
                      ) : (
                        <span className="role-badge empty">Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="actions-container">
                      <ButtonIcon
                        to={`/admin/user-info/${user.id}`}
                        variant="info"
                        title="Información detallada"
                        className="btn-info"
                      />
                      <ButtonIcon
                        to={`/admin/edit-user/${user.id}`}
                        variant="edit"
                        title="Editar usuario"
                        className="btn-edit"
                      />
                      <ButtonIcon
                        onClick={() => handleDelete(user.id, user.email)}
                        variant="delete"
                        title="Eliminar usuario"
                        className="btn-delete"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
        Total de usuarios: <strong>{users.length}</strong>
      </div>
    </div>
  );
}

export default UsersPage;