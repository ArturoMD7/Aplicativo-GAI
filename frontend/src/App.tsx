// src/App.tsx
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.tsx';
import HomePage from './pages/HomePage.tsx';
import './App.css'; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 2. 'showLogin' ya no es necesario, siempre es Login
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
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

  // 3. Si no está autenticado, solo muestra el Login
  return (
    <div className="auth-layout">
      <LoginPage 
        onSwitchToRegister={() => {
          // Esta prop ya no hace nada,
          // podrías quitarla de LoginPage
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;