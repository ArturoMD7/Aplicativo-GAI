import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apliClient';
import {
  FiActivity,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiList,
  FiClock
} from 'react-icons/fi';
import '../styles/WelcomePage.css';
import type { InvestigacionListado } from '../types/investigacion.types';

function WelcomePage() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    highPriority: 0,
    completed: 0
  });
  const [recentInvestigaciones, setRecentInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/api/investigaciones/investigaciones/');
        const data: InvestigacionListado[] = response.data;

        // Calculate stats
        const total = data.length;
        const active = data.filter(i => i.semaforo !== 'green' && i.semaforo !== 'gray').length; // Assuming green/gray means done/inactive
        const highPriority = data.filter(i => i.gravedad?.toLowerCase().includes('alta')).length;
        const completed = data.filter(i => i.semaforo === 'green').length;

        setStats({ total, active, highPriority, completed });

        // Get 5 most recent
        const sorted = [...data].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentInvestigaciones(sorted.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-message">Cargando panel de control...</div>;
  }

  return (
    <div className="welcome-page">
      <div className="dashboard-header">
        <h1>Panel de Control</h1>
        <p>Bienvenido al Sistema de Gestión de Investigaciones</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrapper">
            <FiFileText />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Investigaciones</p>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon-wrapper">
            <FiActivity />
          </div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>En Proceso</p>
          </div>
        </div>

        <div className="stat-card stat-red">
          <div className="stat-icon-wrapper">
            <FiAlertTriangle />
          </div>
          <div className="stat-content">
            <h3>{stats.highPriority}</h3>
            <p>Alta Prioridad</p>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon-wrapper">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completadas</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2><FiClock /> Actividad Reciente</h2>
          </div>
          <table className="recent-table">
            <thead>
              <tr>
                <th>Reporte</th>
                <th>Nombre Corto</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentInvestigaciones.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, color: '#840016' }}>{inv.numero_reporte}</td>
                  <td>{inv.nombre_corto}</td>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${inv.gravedad?.toLowerCase().includes('alta') ? 'alta' : 'baja'}`}>
                      {inv.semaforo === 'green' ? 'Completado' : 'En Proceso'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentInvestigaciones.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                    No hay actividad reciente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Accesos Rápidos</h2>
          </div>
          <div className="quick-actions-grid">
            <Link to="/investigaciones/nuevo" className="action-button">
              <FiPlus className="action-icon" />
              <div className="action-info">
                <h4>Nueva Investigación</h4>
                <p>Registrar un nuevo reporte</p>
              </div>
            </Link>

            <Link to="/investigaciones" className="action-button">
              <FiList className="action-icon" />
              <div className="action-info">
                <h4>Ver Listado</h4>
                <p>Consultar todas las investigaciones</p>
              </div>
            </Link>

            <Link to="/logs" className="action-button">
              <FiActivity className="action-icon" />
              <div className="action-info">
                <h4>Auditoría</h4>
                <p>Ver logs del sistema</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;