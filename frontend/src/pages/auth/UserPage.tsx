// src/components/Users/UsersPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import apiClient from '../../api/apliClient';
import { FiPlus, FiUsers, FiEdit2, FiTrash2, FiLoader, FiUserX } from 'react-icons/fi';
import '../../styles/Auth/UserPage.css'; 

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[]; 
  ficha?: string;
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

  const handleEdit = (userId: number) => {
    console.log('Editar usuario:', userId);
    alert(`Funcionalidad de edición para usuario ${userId} - Próximamente`);
  };

  const handleDelete = async (userId: number, userEmail: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${userEmail}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/user/${userId}/`);
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
        <Link to="/admin/register-user" className="btn-add-new">
          <FiPlus /> Nuevo Usuario
        </Link>
      </div>

      <div className="user-list-container">
        {users.length === 0 ? (
          <div className="empty-state">
            <FiUsers className="icon" />
            <h3>No hay usuarios registrados</h3>
            <p>Comienza agregando el primer usuario al sistema</p>
            <Link to="/admin/register-user" className="btn-add-new" style={{ marginTop: '16px', display: 'inline-flex' }}>
              <FiPlus /> Agregar Primer Usuario
            </Link>
          </div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
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
                      <Link 
                        to={`/admin/edit-user/${user.id}`} 
                        className="btn-edit" 
                        title="Editar usuario"
                      >
                        <FiEdit2 /> Editar
                      </Link>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(user.id, user.email)}
                        title="Eliminar usuario"
                      >
                        <FiTrash2 /> Eliminar
                      </button>
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