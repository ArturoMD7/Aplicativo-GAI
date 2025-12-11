// src/pages/HomePage.tsx
import React from 'react';
// 1. Importa el Router
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar'; 
import '../styles/HomePage.css'; 

// 2. Importa tus nuevas páginas
import WelcomePage from './WelcomePage';
import UsersPage from './auth/UserPage';
import RegisterPage from './auth/RegisterPage'; 
import InvestigacionListPage from './InvestigacionListPage';
import InvestigacionFormPage from './InvestigacionFormPage';
import EditUserPage from './auth/EditUserPage';
import Settings from './auth/Settings';
import InvestigacionDetailsPage from './InvestigacionDetailsPage';
import LogListPage from './LogsListPage';
import SeguimientoListPage from './SeguimientoListPage';
import SeguimientoPage from './SeguimientoPage';


type HomePageProps = {
  onLogout: () => void; 
};

function HomePage({ onLogout }: HomePageProps) {
  return (
    <div className="layout-container">
      
      <Sidebar onLogout={onLogout} />

      <div className="content-container">
        <header className="home-header">
          <h1 className="app-title">GAI - Gerencia de Asuntos Internos</h1>
        </header>
      
        <main className="main-content">
          <Routes>
            {/* Ruta principal (bienvenida) */}
            <Route path="/" element={<WelcomePage />} />
            
            {/* Ruta del Panel de Usuarios */}
            <Route path="/users" element={<UsersPage />} />
            
            {/* Ruta para que el Admin cree usuarios */}
            <Route 
              path="/admin/register-user" 
              element={<RegisterPage onSwitchToLogin={() => {
              }} />} 
            />

            {/* El dashboard/listado de investigaciones */}
            <Route path="/investigaciones" element={<InvestigacionListPage />} />
            <Route path="/logs" element={<LogListPage />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="/admin/edit-user/:userId" element={<EditUserPage />} />
            
            <Route path="/investigaciones/nuevo" element={<InvestigacionFormPage />} />
            
            <Route path="/investigaciones/editar/:id" element={<InvestigacionFormPage />} />
            <Route path="/investigaciones/detalles/:id" element={<InvestigacionDetailsPage />} />
            <Route path="/investigaciones/seguimiento-lista" element={<SeguimientoListPage />} />
            <Route path="/investigaciones/seguimiento/:id" element={<SeguimientoPage />} />
            

            {/* Ruta de 'no encontrado' (opcional) */}
            <Route path="*" element={<h1>Página no encontrada</h1>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default HomePage;