import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import HomePage from './pages/HomePage.tsx';
import './App.css'; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

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

  // ------------------------------------------
  // Lógica de Renderizado
  // ------------------------------------------

  if (isAuthenticated) {
    return <HomePage onLogout={handleLogout} />;
  }

  const layoutClass = isAuthenticated ? 'app-layout' : 'auth-layout';

  return (
    <div className={layoutClass}>
      {showLogin ? (
        <LoginPage 
          onSwitchToRegister={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess} // 4. Pasa la nueva prop
        />
      ) : (
        <RegisterPage 
          onSwitchToLogin={() => setShowLogin(true)} 
        />
      )}
    </div>
  );
}

export default App;