import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    
    console.log('🔐 Token en localStorage:', token); // ← AÑADE ESTO
    console.log('🌐 Request URL:', config.url); // ← AÑADE ESTO
    
    if (token) {
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Token añadido a headers'); // ← AÑADE ESTO
      }
    } else {
      console.log('❌ No hay token disponible'); // ← AÑADE ESTO
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Añade interceptor de respuesta para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ Token inválido o expirado');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Redirigir al login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;