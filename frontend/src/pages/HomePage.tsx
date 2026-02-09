// src/pages/HomePage.tsx
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiClient from '../api/apliClient';
import Sidebar from '../components/Sidebar/Sidebar';
import '../styles/HomePage.css';
import { FiUser } from 'react-icons/fi';

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
import FinalizadosEditPage from './FinalizadosEditPage';
import Watermark from '@uiw/react-watermark';
import ResponsivaUploadModal from '../components/Modals/ResponsivaUploadModal';

const style = { width: '100%', maxWidth: '100%', height: 200, display: 'block' };
const text = `React makes it painless to create interactive UIs.`;


type HomePageProps = {
  onLogout: () => void;
};

interface UserHeaderProfile {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_picture: string | null;
  ficha: string | null;
  missing_responsiva?: boolean;
  investigador?: {
    id: number;
  };
}

function HomePage({ onLogout }: HomePageProps) {
  const [userProfile, setUserProfile] = useState<UserHeaderProfile | null>(null);
  const [showResponsivaModal, setShowResponsivaModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/api/user/profile/');
        setUserProfile(response.data);
        if (response.data.missing_responsiva) {
          setShowResponsivaModal(true);
        }
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
    <Watermark
      content={[userProfile?.ficha || '']}
      style={{ background: '#ffffffff' }}
      fontColor="#d3cfcfff"
      rotate={-20}
      gapX={20}
      width={80}
      gapY={60}
      height={1}
      fontSize={15}
    >
      <div className="layout-container">

        <Sidebar onLogout={onLogout} />

        <div className="content-container">
          <header className="home-header">
            <div className="header-spacer"></div>

            <h1 className="app-title"> Sistema de Administración de Asuntos Internos</h1>

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
              <Route path="/investigaciones/finalizadas/editar/:id" element={<FinalizadosEditPage />} />
              <Route path="/investigaciones/seguimiento/:id" element={<SeguimientoPage />} />
              <Route path="/buscar-empleado" element={<BuscarEmpleadoPage />} />


              {/* Ruta de 'no encontrado' (opcional) */}
              <Route path="*" element={<h1>Página no encontrada</h1>} />
            </Routes>
          </main>
        </div>
      </div>

      {userProfile && userProfile.missing_responsiva && userProfile.ficha && (
        <ResponsivaUploadModal
          isOpen={showResponsivaModal}
          onClose={() => setShowResponsivaModal(false)}
          ficha={userProfile.ficha}
          onUploadSuccess={() => {
            setShowResponsivaModal(false);
            if (userProfile) {
              setUserProfile({ ...userProfile, missing_responsiva: false });
            }
          }}
        />
      )}
    </Watermark>
  );
}

export default HomePage;