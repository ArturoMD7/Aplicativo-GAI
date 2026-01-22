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
  FiChevronDown,
  FiMap,
  FiCompass,
  FiTarget,
  FiGlobe,
  FiArrowLeft,
  FiCalendar,
  FiBarChart2,
  FiPieChart
} from 'react-icons/fi';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import '../styles/WelcomePage.css';
import type { InvestigacionListado } from '../types/investigacion.types';

// --- CONFIGURACIÓN ---

const REGIONES_CONFIG = [
  { key: 'NORTE', label: 'NORTE', icon: <FiCompass /> },
  { key: 'GAI', label: 'GAI', icon: <FiGlobe /> },
  { key: 'ALTIPLANO', label: 'ALTIPLANO', icon: <FiTarget /> },
  { key: 'SUR', label: 'SUR', icon: <FiCompass style={{ transform: 'rotate(180deg)' }} /> },
  { key: 'SURESTE', label: 'SURESTE', icon: <FiMap /> },
];

const GERENCIA_CHOICES = [
  'NORTE', 'SUR', 'SUESTE', 'ALTIPLANO', 'GAI',
];

const CONDUCTAS_POSIBLES = [
  'SUSPENSION DE LABORES', 'SUSTRACCION DE EQUIPO MOBILIARIO', 'FALTA DE PROBIDAD Y HONRADEZ',
  'ALTERACION DEL ORDEN', 'PRESENTACION DE DOCUMENTACION IRREGULAR', 'ACTITUD INDEBIDA', 'FALTAS INJUSTIFICADAS',
  'NEGLIGENCIA EN EL DESARROLLO DE FUNCIONES', 'DISCRIMINACION', 'ACOSO LABORAL O MOBBING', 'ACOSO Y/O HOSTIGAMIENTO SEXUAL',
  'CONCURRIR CON EFECTOS DE ESTUPEFACIENTES Y/O EDO DE EBRIEDAD', 'INCUMPLIMIENTO DE NORMAS DE TRABAJO Y/O PROCEDIMIENTOS DE TRABAJO',
  'USO INDEBIDO DE UTILES Y/O HERRAMIENTAS DE TRABAJO', 'CLAUSULA 253 CCT', 'ACTOS DE CORRUPCION', 'MERCADO ILICITO DE COMBUSTIBLES',
  'OTRAS FALTAS'
];

type SortConfig = {
  key: keyof InvestigacionListado | 'estado_texto' | null;
  direction: 'ascending' | 'descending';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Intentar obtener el nombre completo del payload si existe
    const dataItem = payload[0].payload;
    const displayName = dataItem.fullName || label;

    return (
      <div className="custom-tooltip" style={{
        backgroundColor: '#fff',
        padding: '10px',
        border: '1px solid #ccc',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderRadius: '5px'
      }}>
        <p className="label" style={{ fontWeight: 'bold', color: '#840016', marginBottom: '5px' }}>
          {displayName}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: 0, color: entry.color, fontSize: '0.9em' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function WelcomePage() {
  const [allInvestigaciones, setAllInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [selectedGerencia, setSelectedGerencia] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'recent' | 'expiring'>('recent');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [userRole, setUserRole] = useState<string>('');
  const [activeChart, setActiveChart] = useState<'month' | 'region' | 'conduct'>('region');

  useEffect(() => {
    const initRoleAndRegion = async () => {
      let role = localStorage.getItem('userRole');

      if (!role) {
        try {
          const profileRes = await apiClient.get('/api/user/profile/');
          const groups = profileRes.data.groups;
          if (groups && groups.length > 0) {
            role = groups[0];
            localStorage.setItem('userRole', role || '');
          }
        } catch (error) {
          console.error("Error al obtener rol:", error);
        }
      }

      const currentRole = role || '';
      setUserRole(currentRole);

      if (!['Admin', 'AdminCentral'].includes(currentRole)) {
        let region = '';
        if (currentRole.endsWith('NTE')) region = 'NORTE';
        else if (currentRole.endsWith('SUR')) region = 'SUR';
        else if (currentRole.endsWith('STE')) region = 'SURESTE';
        else if (currentRole.endsWith('ALT')) region = 'ALTIPLANO';
        else if (currentRole.endsWith('GAI')) region = 'GAI';

        if (region) {
          setSelectedGerencia(region);
          setShowMenu(false);
        }
      }
    };

    initRoleAndRegion();
  }, []);

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

  // --- LÓGICA DE DATOS ---

  const getStatusCategory = (status: string | undefined): 'En Proceso' | 'Completado' => {
    if (!status) return 'En Proceso';
    const s = status.toLowerCase();
    if (['abierta', 'seguimiento', 'enviada_a_concluir', 'enviada a concluir', 'enviada_a_finalizar'].includes(s)) {
      return 'En Proceso';
    }
    if (['concluida'].includes(s)) {
      return 'Completado';
    }
    return 'En Proceso';
  };

  const countsByRegion = useMemo(() => {
    const counts: Record<string, number> = {};
    REGIONES_CONFIG.forEach(reg => {
      counts[reg.key] = allInvestigaciones.filter(inv => inv.gerencia_responsable === reg.key).length;
    });
    return counts;
  }, [allInvestigaciones]);

  const handleRegionSelect = (regionKey: string) => {
    setSelectedGerencia(regionKey);
    setShowMenu(false);
  };

  const handleBackToMenu = () => {
    setSelectedGerencia('');
    setShowMenu(true);
  };

  const filteredByGerencia = useMemo(() => {
    if (!selectedGerencia) return allInvestigaciones;
    return allInvestigaciones.filter(inv => inv.gerencia_responsable === selectedGerencia);
  }, [allInvestigaciones, selectedGerencia]);

  const stats = useMemo(() => {
    return {
      total: filteredByGerencia.length,
      active: filteredByGerencia.filter(i => getStatusCategory(i.estatus) === 'En Proceso').length,
      highPriority: filteredByGerencia.filter(i => i.gravedad?.toLowerCase().includes('alta')).length,
      completed: filteredByGerencia.filter(i => getStatusCategory(i.estatus) === 'Completado').length
    };
  }, [filteredByGerencia]);

  const baseDataList = useMemo(() => {
    if (activeTab === 'recent') {
      return [...filteredByGerencia]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
    } else {
      return filteredByGerencia.filter(inv => inv.dias_restantes <= 10 && inv.dias_restantes >= 0);
    }
  }, [filteredByGerencia, activeTab]);

  const sortedData = useMemo(() => {
    let sortableItems = [...baseDataList];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof InvestigacionListado];
        let valB: any = b[sortConfig.key as keyof InvestigacionListado];

        if (sortConfig.key === 'estado_texto') {
          valA = getStatusCategory(a.estatus);
          valB = getStatusCategory(b.estatus);
        }
        if (sortConfig.key === 'created_at') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [baseDataList, sortConfig]);

  // --- PREPARACIÓN DE DATOS PARA GRÁFICAS APILADAS ---

  // 1. Por Mes (YYYY-MM)
  const dataByMonth = useMemo(() => {
    const grouped: Record<string, { name: string, enProceso: number, completed: number }> = {};

    filteredByGerencia.forEach(inv => {
      const date = new Date(inv.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

      const monthName = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });

      if (!grouped[key]) {
        grouped[key] = { name: monthName, enProceso: 0, completed: 0 };
      }

      const status = getStatusCategory(inv.estatus);
      if (status === 'En Proceso') grouped[key].enProceso++;
      else grouped[key].completed++;
    });

    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredByGerencia]);

  // 2. Por Región
  const dataByRegion = useMemo(() => {
    const grouped: Record<string, { name: string, enProceso: number, completed: number }> = {};

    REGIONES_CONFIG.forEach(reg => {
      grouped[reg.key] = { name: reg.label, enProceso: 0, completed: 0 };
    });

    const sourceData = selectedGerencia ? filteredByGerencia : allInvestigaciones;

    sourceData.forEach(inv => {
      const region = inv.gerencia_responsable;
      if (region && grouped[region]) {
        const status = getStatusCategory(inv.estatus);
        if (status === 'En Proceso') grouped[region].enProceso++;
        else grouped[region].completed++;
      }
    });

    return Object.values(grouped);
  }, [allInvestigaciones, filteredByGerencia, selectedGerencia]);

  // 3. Por Conducta
  const dataByConduct = useMemo(() => {
    const grouped: Record<string, { name: string, fullName?: string, enProceso: number, completed: number }> = {};

    filteredByGerencia.forEach(inv => {
      const conducta = inv.conductas || 'Sin Definir';
      // Nombre corto para el eje X
      const shortName = conducta.length > 15 ? conducta.substring(0, 15) + '...' : conducta;

      if (!grouped[conducta]) {
        grouped[conducta] = { name: shortName, fullName: conducta, enProceso: 0, completed: 0 };
      }

      const status = getStatusCategory(inv.estatus);
      if (status === 'En Proceso') grouped[conducta].enProceso++;
      else grouped[conducta].completed++;
    });

    // Top 10 más frecuentes
    return Object.values(grouped)
      .sort((a, b) => (b.enProceso + b.completed) - (a.enProceso + a.completed))
      .slice(0, 10);
  }, [filteredByGerencia]);


  const requestSort = (key: keyof InvestigacionListado | 'estado_texto') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>↕</span>;
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  const thStyle = { cursor: 'pointer', userSelect: 'none' as const };
  const buttonStyle = (isActive: boolean) => ({
    padding: '8px 16px', border: '1px solid #ddd', backgroundColor: isActive ? '#840016' : '#f5f5f5',
    color: isActive ? '#fff' : '#333', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px',
    fontWeight: 600 as const, fontSize: '0.9rem'
  });

  if (loading) return <div className="loading-message">Cargando datos...</div>;

  const anioActual = new Date().getFullYear();
  // --- RENDER ---
  if (showMenu) {
    return (
      <div className="welcome-page">
        <div className="hex-menu-container">
          <h1> <strong>Subdirección de Capital Humano</strong></h1>
          <h2 >Gerencia de Asuntos Internos</h2>
          <h3 >Investigaciones {anioActual}: <strong> {stats.total}</strong> </h3>
          <div className="hex-grid">
            {REGIONES_CONFIG.map((region) => (
              <div key={region.key} className="hex-wrapper" onClick={() => handleRegionSelect(region.key)}>
                <div className="hexagon">
                  <div className="hex-icon">{region.icon}</div>
                  <div className="hex-region-name">{region.label}</div>
                  <div className="hex-stat">{countsByRegion[region.key] || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      {['Admin', 'AdminCentral'].includes(userRole) && (
        <button onClick={handleBackToMenu} className="back-button">
          <FiArrowLeft /> Regresar al Mapa de Regiones
        </button>
      )}

      <div className="dashboard-header">
        <h1>Panel de Control - {selectedGerencia || 'Vista General'}</h1>
        <p>Resumen ejecutivo de investigaciones</p>
      </div>

      <div className="stats-grid">
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
        {/* SECCIÓN 1: TABLA */}
        <div className="dashboard-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2>{activeTab === 'recent' ? <FiClock /> : <FiAlertTriangle />} {activeTab === 'recent' ? 'Actividad Reciente' : 'Próximos a Vencer'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
                <FiFilter style={{ color: '#666', marginRight: '5px' }} />
                <select value={selectedGerencia} onChange={(e) => setSelectedGerencia(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <option value="">Todas las Gerencias</option>
                  {GERENCIA_CHOICES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="toggle-buttons">
              <button style={buttonStyle(activeTab === 'recent')} onClick={() => setActiveTab('recent')}>Recientes (5)</button>
              <button style={buttonStyle(activeTab === 'expiring')} onClick={() => setActiveTab('expiring')}>Por Vencer</button>
            </div>
          </div>

          <table className="recent-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('numero_reporte')} style={thStyle}>Reporte {getSortIcon('numero_reporte')}</th>
                <th onClick={() => requestSort('nombre_corto')} style={thStyle}>Documento {getSortIcon('nombre_corto')}</th>
                <th onClick={() => requestSort('gerencia_responsable')} style={thStyle}>Gerencia {getSortIcon('gerencia_responsable')}</th>
                <th onClick={() => requestSort('created_at')} style={thStyle}>Fecha {getSortIcon('created_at')}</th>
                <th onClick={() => requestSort('dias_restantes')} style={thStyle}>Días Rest. {getSortIcon('dias_restantes')}</th>
                <th onClick={() => requestSort('estado_texto')} style={thStyle}>Estado {getSortIcon('estado_texto')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, color: '#840016' }}>{inv.numero_reporte}</td>
                  <td>{inv.nombre_corto}</td>
                  <td style={{ fontSize: '0.85em', color: '#666' }}>{inv.gerencia_responsable || 'N/A'}</td>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold', color: inv.dias_restantes < 5 ? '#d32f2f' : '#333' }}>{inv.dias_restantes} días</td>
                  <td><span className={`status-badge ${inv.gravedad?.toLowerCase().includes('alta') ? 'alta' : 'baja'}`}>{getStatusCategory(inv.estatus)}</span></td>
                </tr>
              ))}
              {sortedData.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No hay datos disponibles.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* SECCIÓN 2: GRÁFICA DE CONDUCTAS (Estilo solicitado) */}
        {/* SECCIÓN 2: GRÁFICA APILADA DINÁMICA */}
        <div className="dashboard-section chart-section">
          <div className="section-header" style={{ justifyContent: 'space-between' }}>
            <h2>
              {activeChart === 'month' && <FiCalendar />}
              {activeChart === 'region' && <FiMap />}
              {activeChart === 'conduct' && <FiBarChart2 />}
              {activeChart === 'month' ? ' Tendencia Mensual' : activeChart === 'region' ? ' Por Región' : ' Por Conducta'}
              <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                ({selectedGerencia || 'General'})
              </span>
            </h2>

            <div style={{ display: 'flex', gap: '10px' }}>
              <ButtonIcon
                variant={activeChart === 'month' ? 'edit' : 'custom'} // edit para activo (rojo), custom para inactivo (gris)
                icon={<FiCalendar />}
                text="Por Mes"
                size="small"
                onClick={() => setActiveChart('month')}
              />
              {!selectedGerencia && (
                <ButtonIcon
                  variant={activeChart === 'region' ? 'edit' : 'custom'}
                  icon={<FiMap />}
                  text="Por Región"
                  size="small"
                  onClick={() => setActiveChart('region')}
                />
              )}
              <ButtonIcon
                variant={activeChart === 'conduct' ? 'edit' : 'custom'}
                icon={<FiBarChart2 />}
                text="Por Conducta"
                size="small"
                onClick={() => setActiveChart('conduct')}
              />
            </div>
          </div>

          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeChart === 'month' ? dataByMonth : activeChart === 'region' ? dataByRegion : dataByConduct}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="enProceso" name="En Proceso" stackId="a" fill="#f39c12" barSize={50} />
                <Bar dataKey="completed" name="Concluidas" stackId="a" fill="#2ecc71" barSize={50} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

export default WelcomePage;