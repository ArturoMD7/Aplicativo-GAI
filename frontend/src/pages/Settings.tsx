// src/components/Settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apliClient';
import '../styles/Settings.css';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  groups: string[];
}

function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Estados para el formulario de perfil
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Estados para el formulario de contraseña
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/api/user/profile/');
      setProfile(response.data);
      setEmail(response.data.email);
      setFirstName(response.data.first_name);
      setLastName(response.data.last_name);
    } catch (err) {
      setError('Error al cargar el perfil');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await apiClient.put('/api/user/profile/', {
        email,
        first_name: firstName,
        last_name: lastName,
      });
      
      setProfile(response.data);
      setMessage('Perfil actualizado correctamente');
    } catch (err: any) {
      const errorMsg = err.response?.data?.email?.[0] || 'Error al actualizar el perfil';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden');
      setSaving(false);
      return;
    }

    try {
      await apiClient.post('/api/user/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      setMessage('Contraseña cambiada correctamente');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.old_password?.[0] || 
                      err.response?.data?.new_password?.[0] || 
                      'Error al cambiar la contraseña';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Cargando...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Configuración de Cuenta</h1>
        <p>Gestiona tu información personal y seguridad</p>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i>
            Perfil
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <i className="fas fa-lock"></i>
            Contraseña
          </button>
        </div>

        <div className="settings-form-container">
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {activeTab === 'profile' && (
            <form className="settings-form" onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nombre</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Apellidos</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Información del Sistema</label>
                <div className="system-info">
                  <div className="info-item">
                    <span className="info-label">Usuario:</span>
                    <span className="info-value">{profile?.username}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Roles:</span>
                    <span className="info-value">{profile?.groups?.join(', ') || 'Ninguno'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Staff:</span>
                    <span className="info-value">{profile?.is_staff ? 'Sí' : 'No'}</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-button" disabled={saving}>
                {saving ? 'Guardando...' : 'Actualizar Perfil'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form className="settings-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="oldPassword">Contraseña Actual *</label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Nueva Contraseña *</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-button" disabled={saving}>
                {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;