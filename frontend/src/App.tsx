import { useState } from 'react';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import './App.css'; // Estilos globales

function App() {
  // Estado para saber qué página mostrar
  const [showLogin, setShowLogin] = useState(true);

  // NOTA: En un futuro, aquí es donde usarías React Router
  
  return (
    <div className="App">
      {showLogin ? (
        <LoginPage onSwitchToRegister={() => setShowLogin(false)} />
      ) : (
        <RegisterPage onSwitchToLogin={() => setShowLogin(true)} />
      )}
    </div>
  );
}

export default App;