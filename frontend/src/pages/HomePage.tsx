// src/pages/HomePage.tsx
import React from 'react';
// 1. Importa el Router
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar'; 
import '../styles/HomePage.css'; 

// 2. Importa tus nuevas páginas
import WelcomePage from './WelcomePage';
import UsersPage from './UserPage';
import RegisterPage from './RegisterPage'; // ¡La reusamos aquí!

type HomePageProps = {
  onLogout: () => void; 
};

function HomePage({ onLogout }: HomePageProps) {
  return (
    <div className="layout-container">
      {/* El Sidebar siempre es visible */}
      <Sidebar onLogout={onLogout} />
      
      {/* El contenido principal cambia según la ruta */}
      <main className="main-content">
        <Routes>
          {/* Ruta principal (bienvenida) */}
          <Route path="/" element={<WelcomePage />} />
          
          {/* Ruta del Panel de Usuarios */}
          <Route path="/users" element={<UsersPage />} />
          
          {/* Ruta para que el Admin cree usuarios */}
          {/* Reutilizamos tu RegisterPage, pero ahora solo el admin la ve */}
          <Route 
            path="/admin/register-user" 
            element={<RegisterPage onSwitchToLogin={() => {
              // Ya no necesita "switch to login",
              // quizás debería navegar a /users
              // navigate('/users');
            }} />} 
          />
          
          {/* Rutas de ejemplo para el futuro */}
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          <Route path="/projects" element={<h1>Projects</h1>} />
          <Route path="/tasks" element={<h1>Tasks</h1>} />
          <Route path="/settings" element={<h1>Settings</h1>} />

          {/* Ruta de 'no encontrado' (opcional) */}
          <Route path="*" element={<h1>Página no encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
}

export default HomePage;