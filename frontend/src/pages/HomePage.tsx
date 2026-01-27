// src/pages/HomePage.tsx
import React from 'react';
// 1. Importa el Router
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiClient from '../api/apliClient';
import Sidebar from '../components/Sidebar/Sidebar';
import '../styles/HomePage.css';
import { FiUser } from 'react-icons/fi';


// 2. Importa tus nuevas páginas
import ProtectedRoute from '../components/ProtectedRoute';
import WelcomePage from './WelcomePage';
import UsersPage from './auth/UserPage';
import RegisterPage from './auth/RegisterPage';
import InvestigacionListPage from './InvestigacionListPage';
import InvestigacionFormPage from './InvestigacionFormPage';
import EditUserPage from './auth/EditUserPage';
import UserInfoPage from './auth/UserInfoPage';
import Settings from './auth/Settings';
import InvestigacionDetailsPage from './InvestigacionDetailsPage';
import LogListPage from './LogsListPage';
import SeguimientoListPage from './SeguimientoListPage';
import SeguimientoPage from './SeguimientoPage';
import BuscarEmpleadoPage from './BuscarEmpleadoPage';
import FinalizacionListPage from './FinalizacionListPage';


type HomePageProps = {
  onLogout: () => void;
};

interface UserHeaderProfile {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_picture: string | null;
}

function HomePage({ onLogout }: HomePageProps) {
  const [userProfile, setUserProfile] = useState<UserHeaderProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/api/user/profile/');
        setUserProfile(response.data);
      } catch (error) {
        console.error("Error fetching user profile for header", error);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileClick = () => {
    if (userProfile) {
      navigate(`/admin/user-info/${userProfile.id}`);
    }
  };

  return (
    <div className="layout-container">

      <Sidebar onLogout={onLogout} />

      <div className="content-container">
        <header className="home-header">
          <h1 className="app-title"> </h1>

          {userProfile && (
            <div className="user-header-profile" onClick={handleProfileClick} title="Ver mi información">
              <span className="user-header-name"> <strong>
                {userProfile.first_name} {userProfile.last_name || userProfile.username}
              </strong></span>
              <div className="user-header-avatar">
                {userProfile.profile_picture ? (
                  <img src={userProfile.profile_picture} alt="Avatar" />
                ) : (
                  <FiUser />
                )}
              </div>
            </div>
          )}
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<WelcomePage />} />

            <Route element={<ProtectedRoute allowedRoles={['admin', 'admincentral']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/logs" element={<LogListPage />} />
              <Route
                path="/admin/register-user"
                element={<RegisterPage onSwitchToLogin={() => { }} />}
              />
              <Route path="/admin/edit-user/:userId" element={<EditUserPage />} />
            </Route>

            <Route path="/investigaciones" element={<InvestigacionListPage />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="/admin/user-info/:userId" element={<UserInfoPage />} />

            <Route path="/investigaciones/nuevo" element={<InvestigacionFormPage />} />

            <Route path="/investigaciones/editar/:id" element={<InvestigacionFormPage />} />
            <Route path="/investigaciones/detalles/:id" element={<InvestigacionDetailsPage />} />
            <Route path="/investigaciones/seguimiento-lista" element={<SeguimientoListPage />} />
            <Route path="/investigaciones/finalizacion-lista" element={<FinalizacionListPage />} />
            <Route path="/investigaciones/seguimiento/:id" element={<SeguimientoPage />} />
            <Route path="/buscar-empleado" element={<BuscarEmpleadoPage />} />


            {/* Ruta de 'no encontrado' (opcional) */}
            <Route path="*" element={<h1>Página no encontrada</h1>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default HomePage;