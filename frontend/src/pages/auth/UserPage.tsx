// src/components/Users/UsersPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/apliClient';
import { FiUsers, FiLoader, FiUserX, FiUser, FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import Pagination from '../../components/Pagination';
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

type SortConfig = {
  key: keyof User | 'full_name' | null;
  direction: 'ascending' | 'descending';
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States for table features
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

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
      await apiClient.delete(`/api/user/${userId}/`);
      alert(`Usuario ${userEmail} eliminado correctamente.`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error('Error eliminando usuario:', err.response?.data);
      alert(err.response?.data?.error || 'No se pudo eliminar el usuario.');
    }
  };

  // --- Search & Filter Logic ---
  const filteredUsers = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return (
        user.email.toLowerCase().includes(lowerTerm) ||
        user.username.toLowerCase().includes(lowerTerm) ||
        fullName.includes(lowerTerm) ||
        (user.ficha && user.ficha.toLowerCase().includes(lowerTerm))
      );
    });
  }, [users, searchTerm]);

  // --- Sorting Logic ---
  const sortedUsers = useMemo(() => {
    let sortableItems = [...filteredUsers];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortConfig.key === 'full_name') {
          valA = `${a.first_name} ${a.last_name}`.toLowerCase();
          valB = `${b.first_name} ${b.last_name}`.toLowerCase();
        } else {
          valA = a[sortConfig.key as keyof User];
          valB = b[sortConfig.key as keyof User];
        }

        // Handle nulls/undefined safely
        if (valA == null) valA = '';
        if (valB == null) valB = '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredUsers, sortConfig]);

  const requestSort = (key: keyof User | 'full_name') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: keyof User | 'full_name') => {
    if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>↕</span>;
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
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

        <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-box" style={{ position: 'relative' }}>
            <FiSearch className="search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '35px', paddingRight: '10px', height: '38px', borderRadius: '6px', border: '1px solid #ddd', width: '250px' }}
            />
          </div>

          <ButtonIcon
            to="/admin/register-user"
            variant="add"
            text="Nuevo Usuario"
          />
        </div>
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
          <>
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}></th>
                  <th onClick={() => requestSort('ficha')} style={{ cursor: 'pointer' }}>FICHA {getSortIcon('ficha')}</th>
                  <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email {getSortIcon('email')}</th>
                  <th onClick={() => requestSort('full_name')} style={{ cursor: 'pointer' }}>Nombre Completo {getSortIcon('full_name')}</th>
                  <th>Roles</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((user) => (
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

            {filteredUsers.length === 0 && (
              <div className="no-results" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <FiSearch style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', margin: '0 auto' }} />
                No se encontraron usuarios que coincidan con la búsqueda.
              </div>
            )}

            {filteredUsers.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={filteredUsers.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UsersPage;