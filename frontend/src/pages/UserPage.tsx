import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import apiClient from '../api/apliClient';
import { FiPlus, FiUsers } from 'react-icons/fi';
import '../styles/HomePage.css'; 

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[]; 
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pedimos la lista de usuarios al backend
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/api/users/');
        setUsers(response.data);
      } catch (err) {
        setError('No se pudo cargar la lista de usuarios.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Cargando usuarios...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiUsers /> Panel de Administración de Usuarios</h1>
        {/* Este botón nos llevará a tu RegisterPage (que ahora es 'admin-only') */}
        <Link to="/admin/register-user" className="btn-add-new">
          <FiPlus /> Añadir Nuevo Usuario
        </Link>
      </div>

      <div className="user-list-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email (Username)</th>
              <th>Nombre</th>
              <th>Roles (Grupos)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>
                  {user.groups.length > 0 ? user.groups.join(', ') : 'N/A'}
                </td>
                <td>
                  {/* Aquí irían botones de "Editar" o "Eliminar" */}
                  <button className="btn-edit">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersPage;