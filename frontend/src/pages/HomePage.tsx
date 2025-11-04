import React from 'react';
import Sidebar from '../components/Sidebar/Sidebar'; 
import '../styles/HomePage.css'; 

type HomePageProps = {
  onLogout: () => void; 
};

function HomePage({ onLogout }: HomePageProps) {
  return (
    <div className="layout-container">
      <Sidebar onLogout={onLogout} />
      
      <main className="main-content">
        <h1>Bienvenido a GAI</h1>
        <p>Este es el contenido principal de tu aplicación.</p>
        <p>Selecciona una opción del menú lateral para navegar.</p>
      </main>
    </div>
  );
}

export default HomePage;