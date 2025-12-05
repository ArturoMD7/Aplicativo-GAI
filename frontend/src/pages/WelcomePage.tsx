import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apliClient';
import {
  FiActivity,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiChevronUp,    
  FiChevronDown   
} from 'react-icons/fi';
import '../styles/WelcomePage.css';
import type { InvestigacionListado } from '../types/investigacion.types';

const GERENCIA_CHOICES = [
  'Norte', 'Sur', 'Sureste', 'Altiplano', 'Oficinas Centrales', 'GAI',
];

type SortConfig = {
  key: keyof InvestigacionListado | 'estado_texto' | null; 
  direction: 'ascending' | 'descending';
};

function WelcomePage() {
  const [allInvestigaciones, setAllInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [selectedGerencia, setSelectedGerencia] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'recent' | 'expiring'>('recent');
  const [loading, setLoading] = useState(true);

  // ESTADO NUEVO: Configuración del ordenamiento
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/api/investigaciones/investigaciones/');
        setAllInvestigaciones(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // 1. Filtrado por Gerencia
  const filteredByGerencia = useMemo(() => {
    if (!selectedGerencia) return allInvestigaciones;
    return allInvestigaciones.filter(inv => inv.gerencia_responsable === selectedGerencia);
  }, [allInvestigaciones, selectedGerencia]);

  // 2. Cálculo de estadísticas
  const stats = useMemo(() => {
    return {
      total: filteredByGerencia.length,
      active: filteredByGerencia.filter(i => i.semaforo !== 'green' && i.semaforo !== 'gray').length,
      highPriority: filteredByGerencia.filter(i => i.gravedad?.toLowerCase().includes('alta')).length,
      completed: filteredByGerencia.filter(i => i.semaforo === 'green').length
    };
  }, [filteredByGerencia]);

  // 3. Preparación de datos base (Recientes o Por Vencer)
  const baseDataList = useMemo(() => {
    if (activeTab === 'recent') {
      // Por defecto ordenamos por fecha creación descendente si no hay sort manual,
      // pero aquí tomamos los 5 más recientes para mostrarlos.
      return [...filteredByGerencia]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
    } else {
      return filteredByGerencia.filter(inv => inv.dias_restantes <= 10 && inv.dias_restantes >= 0);
    }
  }, [filteredByGerencia, activeTab]);

  // 4. LÓGICA DE ORDENAMIENTO (SORTING)
  const sortedData = useMemo(() => {
    let sortableItems = [...baseDataList];
    
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        // Preparar valores A y B
        let valA: any = a[sortConfig.key as keyof InvestigacionListado];
        let valB: any = b[sortConfig.key as keyof InvestigacionListado];

        // Caso especial: Columna "Estado" (Calculado visualmente)
        if (sortConfig.key === 'estado_texto') {
            valA = a.semaforo === 'green' ? 'Completado' : 'En Proceso';
            valB = b.semaforo === 'green' ? 'Completado' : 'En Proceso';
        }

        // Caso especial: Fechas (si la key es created_at)
        if (sortConfig.key === 'created_at') {
             valA = new Date(valA).getTime();
             valB = new Date(valB).getTime();
        }

        // Comparación Genérica
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [baseDataList, sortConfig]);

  // Función para solicitar el ordenamiento al hacer click
  const requestSort = (key: keyof InvestigacionListado | 'estado_texto') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    // Si ya estamos ordenando por esta columna y es ascendente, cambiamos a descendente
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Función auxiliar para mostrar la flechita
  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return <span style={{opacity: 0.3, marginLeft: '5px'}}>↕</span>; // Icono neutro
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  if (loading) return <div className="loading-message">Cargando...</div>;

  // --- Estilos ---
  const thStyle = { cursor: 'pointer', userSelect: 'none' as const };
  const buttonStyle = (isActive: boolean) => ({
    padding: '8px 16px', border: '1px solid #ddd', backgroundColor: isActive ? '#840016' : '#f5f5f5',
    color: isActive ? '#fff' : '#333', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px',
    fontWeight: 600 as const, fontSize: '0.9rem'
  });

  return (
    <div className="welcome-page">
      <div className="dashboard-header">
        <h1>Panel de Control</h1>
        <p>Bienvenido al Sistema de Gestión de Investigaciones</p>
      </div>

      <div className="stats-grid">
         {/* ... (Las tarjetas de estadísticas se mantienen igual que en la respuesta anterior) ... */}
         <div className="stat-card stat-blue">
          <div className="stat-icon-wrapper"><FiFileText /></div>
          <div className="stat-content"><h3>{stats.total}</h3><p>Total</p></div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon-wrapper"><FiActivity /></div>
          <div className="stat-content"><h3>{stats.active}</h3><p>En Proceso</p></div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon-wrapper"><FiAlertTriangle /></div>
          <div className="stat-content"><h3>{stats.highPriority}</h3><p>Alta Prioridad</p></div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon-wrapper"><FiCheckCircle /></div>
          <div className="stat-content"><h3>{stats.completed}</h3><p>Completadas</p></div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2>
                {activeTab === 'recent' ? <FiClock /> : <FiAlertTriangle />} 
                {' '}
                {activeTab === 'recent' ? 'Actividad Reciente' : 'Próximos a Vencer'}
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
                <FiFilter style={{ color: '#666', marginRight: '5px' }} />
                <select 
                  value={selectedGerencia} 
                  onChange={(e) => setSelectedGerencia(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Todas las Gerencias</option>
                  {GERENCIA_CHOICES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            
            <div className="toggle-buttons">
              <button style={buttonStyle(activeTab === 'recent')} onClick={() => setActiveTab('recent')}>Recientes</button>
              <button style={buttonStyle(activeTab === 'expiring')} onClick={() => setActiveTab('expiring')}>Por Vencer</button>
            </div>
          </div>

          <table className="recent-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('numero_reporte')} style={thStyle}>
                  Reporte {getSortIcon('numero_reporte')}
                </th>
                <th onClick={() => requestSort('nombre_corto')} style={thStyle}>
                  Documento {getSortIcon('nombre_corto')}
                </th>
                <th onClick={() => requestSort('gerencia_responsable')} style={thStyle}>
                  Gerencia {getSortIcon('gerencia')}
                </th>
                <th onClick={() => requestSort('created_at')} style={thStyle}>
                  Fecha {getSortIcon('created_at')}
                </th>
                {/* COLUMNA NUEVA: Días Restantes */}
                <th onClick={() => requestSort('dias_restantes')} style={thStyle}>
                  Días Rest. {getSortIcon('dias_restantes')}
                </th>
                <th onClick={() => requestSort('estado_texto')} style={thStyle}>
                  Estado {getSortIcon('estado_texto')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, color: '#840016' }}>{inv.numero_reporte}</td>
                  <td>{inv.nombre_corto}</td>
                  <td style={{ fontSize: '0.85em', color: '#666' }}>{inv.gerencia_responsable || 'N/A'}</td>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                  
                  {/* Celda Días Restantes con color dinámico */}
                  <td style={{ fontWeight: 'bold', color: inv.dias_restantes < 5 ? '#d32f2f' : '#333' }}>
                    {inv.dias_restantes} días
                  </td>

                  <td>
                    <span className={`status-badge ${inv.gravedad?.toLowerCase().includes('alta') ? 'alta' : 'baja'}`}>
                      {inv.semaforo === 'green' ? 'Completado' : 'En Proceso'}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    No hay datos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;