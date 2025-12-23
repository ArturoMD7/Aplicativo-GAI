import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiPlus, FiEdit, FiFileText, FiEye, FiSearch, FiDownload, FiAlertCircle, FiTrendingUp, FiFilter, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { MdDeleteForever } from "react-icons/md";
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import '../styles/InvestigacionPage.css';

const GERENCIA_CHOICES = [
  'NORTE', 'SUR', 'SURESTE', 'ALTIPLANO', 'GAI',
];

const SANCIONES_POSIBLES = [
  'SUSPENSION DE LABORES', 'SUSTRACCION DE EQUIPO MOBILIARIO', 'FALTA DE PROBIDAD Y HONRADEZ',
  'ALTERACION DEL ORDEN', 'PRESENTACION DE DOCUMENTACION IRREGULAR', 'ACTITUD INDEBIDA', 'FALTAS INJUSTIFICADAS',
  'NEGLIGENCIA EN EL DESARROLLO DE FUNCIONES', 'DISCRIMINACION', 'ACOSO LABORAL O MOBBING', 'ACOSO Y/O HOSTIGAMIENTO SEXUAL',
  'CONCURRIR CON EFECTOS DE ESTUPEFACIENTES Y/O EDO DE EBRIEDAD', 'INCUMPLIMIENTO DE NORMAS DE TRABAJO Y/O PROCEDIMIENTOS DE TRABAJO',
  'USO INDEBIDO DE UTILES Y/O HERRAMIENTAS DE TRABAJO', 'CLAUSULA 253 CCT', 'ACTOS DE CORRUPCION', 'MERCADO ILICITO DE COMBUSTIBLES',
  'OTRAS FALTAS'
];

type SortConfig = {
  key: keyof InvestigacionListado | null;
  direction: 'ascending' | 'descending';
};

function InvestigacionListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [investigaciones, setInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedGerencia, setSelectedGerencia] = useState('');
  const [selectedSancion, setSelectedSancion] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const checkRole = async () => {
      let role = localStorage.getItem('userRole');

      if (!role) {
        try {
          // Si no hay rol guardado, intentar obtenerlo
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

      setUserRole(role || '');
    };
    checkRole();
  }, []);

  useEffect(() => {
    const fetchInvestigaciones = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/investigaciones/investigaciones/');
        console.log("DATA REAL:", response.data);

        const abiertas = response.data.filter((inv: any) => !inv.estatus || inv.estatus === 'Abierta' || inv.estatus === 'ABIERTA');
        setInvestigaciones(abiertas);

      } catch (err) {
        setError('No se pudo cargar la lista de investigaciones.');
        console.error('Error fetching investigaciones:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigaciones();
  }, []);

  const getSemaforoColor = (semaforo: string) => {
    const colors: Record<string, string> = {
      red: '#e74c3c',
      orange: '#f39c12',
      yellow: '#f1c40f',
      green: '#2ecc71',
      gray: '#95a5a6'
    };
    return colors[semaforo] || colors.gray;
  };

  // --- FUNCIÓN PARA CAMBIAR ESTATUS ---
  const handleSeguimiento = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Pasar a Seguimiento?',
      text: "La investigación pasará a la bandeja de Seguimiento y desaparecerá de esta lista.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar seguimiento',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/api/investigaciones/investigaciones/${id}/`, { estatus: 'SEGUIMIENTO' });
        setInvestigaciones(prev => prev.filter(item => item.id !== id));
        Swal.fire('Listo', 'La investigación se movió a seguimiento.', 'success');
      } catch (err: any) {
        console.error("Error al cambiar estatus:", err.response?.data || err);
        Swal.fire('Error', 'No se pudo cambiar el estatus', 'error');
      }
    }
  };

  const handleRegionSelect = (regionKey: string) => {
    setSelectedGerencia(regionKey);
    setShowMenu(false);
  };

  const handleSancionSelect = (sancionKey: string) => {
    setSelectedGerencia(sancionKey);
    setShowMenu(false);
  };

  const handleDelete = async (id: number, numeroReporte: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el reporte ${numeroReporte}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/api/investigaciones/investigaciones/${id}/`);

        setInvestigaciones(prev => prev.filter(item => item.id !== id));

        Swal.fire(
          '¡Eliminado!',
          'El registro ha sido eliminado correctamente.',
          'success'
        );
      } catch (err) {
        console.error(err);
        Swal.fire(
          'Error',
          'Hubo un problema al intentar eliminar el registro.',
          'error'
        );
      }
    }
  };

  const getGravedadClass = (gravedad: string | null | undefined): string => {
    const normalized = gravedad ? String(gravedad).toLowerCase().trim() : '';

    if (normalized.includes('alta') || normalized.includes('crítica')) {
      return 'gravedad-alta';
    } else if (normalized.includes('media')) {
      return 'gravedad-media';
    } else if (normalized.includes('baja') || normalized.includes('leve')) {
      return 'gravedad-baja';
    } else {
      return 'gravedad-default';
    }
  };

  const filteredInvestigaciones = investigaciones.filter((inv) => {
    const texto = searchTerm.toLowerCase();
    const matchesSearch = Object.values(inv).some(value =>
      String(value).toLowerCase().includes(texto)
    );
    const matchesGerencia = selectedGerencia ? inv.gerencia_responsable === selectedGerencia : true;
    const matchesSancion = selectedSancion ? inv.sanciones === selectedSancion : true;

    return matchesSearch && matchesGerencia && matchesSancion;
  });

  const formatDate = (str: string) => {
    if (!str) return '';
    const [year, month, day] = str.split("-");
    return `${day}/${month}/${year}`;
  };

  const exportToExcel = () => {
    if (filteredInvestigaciones.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const data = filteredInvestigaciones.map(inv => ({
      'No. Reporte': inv.numero_reporte,
      'Documento de Origen': inv.nombre_corto,
      'Gravedad': inv.gravedad,
      'Semáforo': inv.semaforo,
      'Creado Por': inv.created_by_name,
      'Fecha Creación': new Date(inv.created_at).toLocaleDateString(),
      'Fecha Prescripción': new Date(inv.fecha_prescripcion).toLocaleDateString(),
      'Días Restantes': inv.dias_restantes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Investigaciones');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Investigaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderInvestigadores = (investigadores: string[] | string) => {
    if (!investigadores || (Array.isArray(investigadores) && investigadores.length === 0)) {
      return <span className="text-muted" style={{ fontSize: '0.85rem' }}>Sin asignar</span>;
    }

    const lista = Array.isArray(investigadores) ? investigadores : [investigadores];

    return (
      <div className="investigadores-list">
        {lista.map((nombre, index) => (
          <span key={index} className="investigador-badge">
            {nombre}
          </span>
        ))}
      </div>
    );
  };

  const renderInvolucrados = (involucrados: string[] | string) => {
    if (!involucrados || (Array.isArray(involucrados) && involucrados.length === 0)) {
      return <span className="text-muted" style={{ fontSize: '0.85rem' }}>Sin asignar</span>;
    }

    const lista = Array.isArray(involucrados) ? involucrados : [involucrados];

    return (
      <div className="involucrados-list">
        {lista.map((nombre, index) => (
          <span key={index} className="involucrados-badge">
            {nombre}
          </span>
        ))}
      </div>
    );
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };



  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Sorting Logic
  const sortedInvestigaciones = useMemo(() => {
    let sortableItems = [...filteredInvestigaciones];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof InvestigacionListado];
        let valB: any = b[sortConfig.key as keyof InvestigacionListado];

        // Handle specific types if necessary (e.g., dates converted to numbers)
        if (sortConfig.key === 'created_at' || sortConfig.key === 'fecha_reporte' || sortConfig.key === 'fecha_prescripcion') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredInvestigaciones, sortConfig]);

  const requestSort = (key: keyof InvestigacionListado) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: keyof InvestigacionListado) => {
    if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>↕</span>;
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedInvestigaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedInvestigaciones.length / itemsPerPage);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiFileText /> Módulo de Investigaciones (Abiertas)</h1>
        <div className="header-actions">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar reporte, nombre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <ButtonIcon
            variant="view"
            icon={<FiDownload />}
            text="Exportar"
            onClick={exportToExcel}
            size="medium"
          />

          {(['Admin', 'AdminCentral'].includes(userRole) || userRole.startsWith('Supervisor')) && (
            <ButtonIcon
              variant="download"
              to="/investigaciones/nuevo"
              icon={<FiPlus />}
              text="Nuevo"
              size="medium"
            />
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
          <FiFilter style={{ color: '#666', marginRight: '5px' }} />
          <select value={selectedGerencia} onChange={(e) => setSelectedGerencia(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">Todas las Gerencias</option>
            {GERENCIA_CHOICES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
          <FiFilter style={{ color: '#666', marginRight: '5px' }} />
          <select value={selectedSancion} onChange={(e) => setSelectedSancion(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">Todas las Sanciones</option>
            {SANCIONES_POSIBLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>


      {loading && <div className="loading-message">Cargando investigaciones...</div>}
      {error && (
        <div className="error-message">
          <FiAlertCircle style={{ marginRight: 8, fontSize: '1.2rem' }} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="table-container">
          <table className="investigacion-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Semáforo</th>
                <th onClick={() => requestSort('numero_reporte')} style={{ cursor: 'pointer' }}>No. Reporte {getSortIcon('numero_reporte')}</th>
                <th onClick={() => requestSort('nombre_corto')} style={{ cursor: 'pointer' }}>Documento de Origen {getSortIcon('nombre_corto')}</th>
                <th onClick={() => requestSort('direccion')} style={{ cursor: 'pointer' }}>Dirección {getSortIcon('direccion')}</th>
                <th>Investigadores</th>
                <th>Personal Reportado</th>
                <th onClick={() => requestSort('procedencia')} style={{ cursor: 'pointer' }}>Procedencia {getSortIcon('procedencia')}</th>
                <th onClick={() => requestSort('sanciones')} style={{ cursor: 'pointer' }}>Conducta {getSortIcon('sanciones')}</th>
                <th onClick={() => requestSort('gravedad')} style={{ cursor: 'pointer' }}>Gravedad {getSortIcon('gravedad')}</th>
                <th onClick={() => requestSort('gerencia_responsable')} style={{ cursor: 'pointer' }}>Región {getSortIcon('gerencia_responsable')}</th>
                <th onClick={() => requestSort('fecha_reporte')} style={{ cursor: 'pointer' }}>Fecha Reporte {getSortIcon('fecha_reporte')}</th>
                <th onClick={() => requestSort('fecha_prescripcion')} style={{ cursor: 'pointer' }}>Prescripción {getSortIcon('fecha_prescripcion')}</th>
                <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => requestSort('dias_restantes')}>Días Rest. {getSortIcon('dias_restantes')}</th>
                <th onClick={() => requestSort('created_by_name')} style={{ cursor: 'pointer' }}>Creado Por {getSortIcon('created_by_name')}</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span
                      className="semaforo-dot"
                      style={{ backgroundColor: getSemaforoColor(inv.semaforo) }}
                      title={`Estado: ${inv.semaforo}`}
                    ></span>
                  </td>

                  <td className="col-reporte">
                    {inv.numero_reporte || <span className="text-muted">Sin asignar</span>}
                  </td>

                  <td style={{ fontWeight: 500 }}>{inv.nombre_corto}</td>
                  <td className="text-muted">{inv.direccion}</td>
                  <td>
                    {renderInvestigadores(inv.investigadores)}
                  </td>

                  <td>
                    {renderInvolucrados(inv.involucrados)}
                  </td>

                  <td className="text-muted">{inv.procedencia}</td>

                  <td className="text-muted">{inv.sanciones}</td>

                  <td>
                    <span className={`gravedad-badge ${getGravedadClass(inv.gravedad)}`}>
                      {inv.gravedad || 'N/D'}
                    </span>
                  </td>

                  <td className="text-muted">{inv.gerencia_responsable}</td>
                  <td>{formatDate(inv.fecha_reporte)}</td>
                  <td>{formatDate(inv.fecha_prescripcion)}</td>
                  <td className="col-dias" style={{ color: inv.dias_restantes < 10 ? '#e74c3c' : '#333' }}>
                    {inv.dias_restantes}
                  </td>

                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {inv.created_by_name}
                  </td>

                  <td>
                    <div className="action-buttons">




                      <ButtonIcon
                        variant="view"
                        onClick={() => navigate(`/investigaciones/detalles/${inv.id}`, { state: { from: location.pathname } })}
                        icon={<FiEye />}
                        title="Ver detalles"
                        size="medium"
                      />
                      <ButtonIcon
                        variant="edit"
                        to={`/investigaciones/editar/${inv.id}`}
                        icon={<FiEdit />}
                        title="Editar"
                        size="medium"
                      />

                      <ButtonIcon
                        variant="view"
                        onClick={() => handleSeguimiento(inv.id)}
                        icon={<FiTrendingUp />}
                        title="Pasar a Seguimiento"
                        size="medium"
                      />

                      <ButtonIcon
                        variant="delete"
                        onClick={() => handleDelete(inv.id, inv.numero_reporte)}
                        icon={<MdDeleteForever />}
                        title="Eliminar"
                        size="medium"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvestigaciones.length === 0 && (
            <div className="no-results">
              <FiSearch style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', margin: '0 auto' }} />
              No se encontraron coincidencias.
            </div>
          )}

          {filteredInvestigaciones.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalItems={filteredInvestigaciones.length}
            />
          )}
        </div>
      )}
    </div >
  );
}

export default InvestigacionListPage;