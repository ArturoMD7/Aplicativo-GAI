// src/App.tsx
import { useState, useEffect } from 'react';
import LoginPage from './pages/auth/LoginPage.tsx';
import HomePage from './pages/HomePage.tsx';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }


    // comentado temporalmente para poder hacer pruebas
    /*
    // Block right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block Ctrl key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
    */
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <HomePage onLogout={handleLogout} />;
  }

  return (
    <div className="auth-layout">
      <LoginPage
        onSwitchToRegister={() => {
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;