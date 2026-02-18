import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiPlus, FiEdit, FiFileText, FiEye, FiSearch, FiDownload, FiAlertCircle, FiTrendingUp, FiChevronUp, FiChevronDown, FiCheckCircle, FiClock } from 'react-icons/fi';
import { MdDeleteForever } from "react-icons/md";
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import DocumentosModals from '../components/Modals/DocumentosModals';
import InvestigacionFilters from '../components/Filters/InvestigacionFilters';
import { auditoriaService } from '../api/auditoriaService';

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
  const [selectedConducta, setSelectedConducta] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [userRole, setUserRole] = useState<string>('');
  const [allData, setAllData] = useState<InvestigacionListado[]>([]);
  const [currentView, setCurrentView] = useState<'ABIERTA' | 'SEGUIMIENTO' | 'ENVIADA_A_CONCLUIR' | 'CONCLUIDA'>('ABIERTA');

  // Document Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedInvestigacionId, setSelectedInvestigacionId] = useState<number | null>(null);
  const [selectedReporteNum, setSelectedReporteNum] = useState('');

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
        setAllData(response.data);
      } catch (err) {
        setError('No se pudo cargar la lista de investigaciones.');
        console.error('Error fetching investigaciones:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigaciones();
  }, []);

  useEffect(() => {
    if (!allData) return;

    let filtered: InvestigacionListado[] = [];
    if (currentView === 'ABIERTA') {
      filtered = allData.filter((inv: any) => !inv.estatus || inv.estatus === 'Abierta' || inv.estatus === 'ABIERTA');
    } else if (currentView === 'SEGUIMIENTO') {
      filtered = allData.filter((inv: any) => inv.estatus === 'Seguimiento' || inv.estatus === 'SEGUIMIENTO');
    } else if (currentView === 'ENVIADA_A_CONCLUIR') {
      filtered = allData.filter((inv: any) => ['ENVIADA_A_CONCLUIR', 'Enviada a Concluir'].includes(inv.estatus));
    } else if (currentView === 'CONCLUIDA') {
      filtered = allData.filter((inv: any) => ['CONCLUIDA', 'Concluida'].includes(inv.estatus));
    }
    setInvestigaciones(filtered);
    setCurrentPage(1); // Reset pagination on view switch
  }, [allData, currentView]);

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
    // Buscar la investigación para obtener el número de reporte si es posible, o loguear solo ID
    const inv = investigaciones.find(i => i.id === id);
    const numero = inv ? inv.numero_reporte : 'Desconocido';

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
        await auditoriaService.logAction('UPDATE', `Cambio de estatus a SEGUIMIENTO del reporte ${numero}`, id);
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

  const handleOpenDocs = (id: number, numeroReporte: string) => {
    auditoriaService.logAction('VIEW', 'Abrió documentos desde lista', id);
    setSelectedInvestigacionId(id);
    setSelectedReporteNum(numeroReporte);
    setIsDocModalOpen(true);
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
        await auditoriaService.logAction('DELETE', `Eliminó el reporte ${numeroReporte}`, id);
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

  const handleEditClick = async (inv: InvestigacionListado) => {
    await auditoriaService.logAction(
      'UPDATE',
      'Abrió formulario de edición',
      inv.id,
      `/investigaciones/editar/${inv.id}`
    );
    navigate(`/investigaciones/editar/${inv.id}`);
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
    const matchesSancion = selectedConducta ? inv.conductas === selectedConducta : true;

    return matchesSearch && matchesGerencia && matchesSancion;
  });

  const formatDate = (str: string) => {
    if (!str) return '';
    const [year, month, day] = str.split("-");
    return `${day}/${month}/${year}`;
  };

  const exportToExcel = () => {
    if (filteredInvestigaciones.length === 0) {
      Swal.fire('Info', 'No hay datos para exportar', 'info');
      return;
    }

    const data = filteredInvestigaciones.map(inv => {
      if (currentView === 'ABIERTA') {
        return {
          'Semáforo': inv.semaforo,
          'No. Reporte': inv.numero_reporte,
          'Documento de Origen': inv.nombre_corto,
          'Investigadores': Array.isArray(inv.investigadores) ? inv.investigadores.join(', ') : inv.investigadores,
          'Personal Reportado': Array.isArray(inv.involucrados) ? inv.involucrados.join(', ') : inv.involucrados,
          'Procedencia': inv.procedencia,
          'Conducta': inv.conductas,
          'Gravedad': inv.gravedad,
          'Región': inv.gerencia_responsable,
          'Fecha de Registro': new Date(inv.fecha_reporte).toLocaleDateString(),
          'Prescripción': new Date(inv.fecha_prescripcion).toLocaleDateString(),
          'Días Restantes': inv.dias_restantes,
          'Creado Por': inv.created_by_name
        };
      } else if (currentView === 'SEGUIMIENTO') {
        return {
          'Tipo': inv.tipo_investigacion,
          'No. Reporte': inv.numero_reporte,
          'Documento de Origen': inv.nombre_corto,
          'Investigadores': Array.isArray(inv.investigadores) ? inv.investigadores.join(', ') : inv.investigadores,
          'Personal Reportado': Array.isArray(inv.involucrados) ? inv.involucrados.join(', ') : inv.involucrados,
          'Procedencia': inv.procedencia,
          'Conducta': inv.conductas,
          'Gravedad': inv.gravedad,
          'Región': inv.gerencia_responsable,
          'Fecha de Registro': new Date(inv.fecha_reporte).toLocaleDateString(),
          'Prescripción': new Date(inv.fecha_prescripcion).toLocaleDateString(),
          'Días Restantes': inv.dias_restantes,
          'Creado Por': inv.created_by_name
        };
      } else {
        // ENVIADA_A_CONCLUIR or CONCLUIDA
        return {
          'Tipo': inv.tipo_investigacion,
          'No. Reporte': inv.numero_reporte,
          'Documento': inv.nombre_corto,
          'Conducta': inv.conductas,
          'Relevancia': inv.gravedad,
          'Fecha de Registro': new Date(inv.fecha_reporte).toLocaleDateString(),
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Investigaciones');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Investigaciones_${currentView}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
              variant="add"
              to="/investigaciones/nuevo"
              icon={<FiPlus />}
              text="Nuevo"
              size="medium"
            />
          )}
        </div>
      </div>

      {/* View Toggles for Admin/Supervisor */}
      {(['Admin', 'AdminCentral'].includes(userRole) || userRole.startsWith('Supervisor')) && (
        <div className="view-toggles" style={{ display: 'flex', gap: '8px', marginLeft: '20px', marginBottom: '10px' }}>
          <ButtonIcon
            variant="custom"
            color={currentView === 'ABIERTA' ? '#840016' : '#6c757d'}
            hoverColor={currentView === 'ABIERTA' ? '#640011' : '#5a6268'}
            onClick={() => setCurrentView('ABIERTA')}
            icon={<FiFileText />}
            text="Abiertas"
            size="medium"
          />
          <ButtonIcon
            variant="custom"
            color={currentView === 'SEGUIMIENTO' ? '#840016' : '#6c757d'}
            hoverColor={currentView === 'SEGUIMIENTO' ? '#640011' : '#5a6268'}
            onClick={() => setCurrentView('SEGUIMIENTO')}
            icon={<FiTrendingUp />}
            text="Seguimiento"
            size="medium"
          />
          <ButtonIcon
            variant="custom"
            color={currentView === 'ENVIADA_A_CONCLUIR' ? '#840016' : '#6c757d'}
            hoverColor={currentView === 'ENVIADA_A_CONCLUIR' ? '#640011' : '#5a6268'}
            onClick={() => setCurrentView('ENVIADA_A_CONCLUIR')}
            icon={<FiClock />}
            text="Por Finalizar"
            size="medium"
          />
          <ButtonIcon
            variant="custom"
            color={currentView === 'CONCLUIDA' ? '#840016' : '#6c757d'}
            hoverColor={currentView === 'CONCLUIDA' ? '#640011' : '#5a6268'}
            onClick={() => setCurrentView('CONCLUIDA')}
            icon={<FiCheckCircle />}
            text="Concluidas"
            size="medium"
          />
        </div>
      )}
      <InvestigacionFilters
        selectedGerencia={selectedGerencia}
        onGerenciaChange={setSelectedGerencia}
        selectedConducta={selectedConducta}
        onConductaChange={setSelectedConducta}
      />


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
                {/* Columns specific to views */}
                {(currentView === 'SEGUIMIENTO' || currentView === 'ENVIADA_A_CONCLUIR' || currentView === 'CONCLUIDA') && (
                  <th style={{ width: '60px', textAlign: 'center' }}>Docs</th>
                )}

                {(currentView === 'SEGUIMIENTO' || currentView === 'ENVIADA_A_CONCLUIR' || currentView === 'CONCLUIDA') && (
                  <th onClick={() => requestSort('tipo_investigacion')} style={{ cursor: 'pointer' }}>Tipo {getSortIcon('tipo_investigacion')}</th>
                )}

                {currentView === 'ABIERTA' && (
                  <th style={{ textAlign: 'center' }}>Semáforo</th>
                )}

                <th onClick={() => requestSort('numero_reporte')} style={{ cursor: 'pointer' }}>No. Reporte {getSortIcon('numero_reporte')}</th>
                <th onClick={() => requestSort('nombre_corto')} style={{ cursor: 'pointer' }}>{['ENVIADA_A_CONCLUIR', 'CONCLUIDA'].includes(currentView) ? 'Documento' : 'Documento de Origen'} {getSortIcon('nombre_corto')}</th>

                {(currentView === 'ABIERTA' || currentView === 'SEGUIMIENTO') && (
                  <>
                    <th>Investigadores</th>
                    <th>Personal Reportado</th>
                    <th onClick={() => requestSort('procedencia')} style={{ cursor: 'pointer' }}>Procedencia {getSortIcon('procedencia')}</th>
                  </>
                )}

                <th onClick={() => requestSort('conductas')} style={{ cursor: 'pointer' }}>Conducta {getSortIcon('conductas')}</th>
                <th onClick={() => requestSort('gravedad')} style={{ cursor: 'pointer' }}>{['ENVIADA_A_CONCLUIR', 'CONCLUIDA'].includes(currentView) ? 'Relevancia' : 'Gravedad'} {getSortIcon('gravedad')}</th>

                {(currentView === 'ABIERTA' || currentView === 'SEGUIMIENTO') && (
                  <th onClick={() => requestSort('gerencia_responsable')} style={{ cursor: 'pointer' }}>Región {getSortIcon('gerencia_responsable')}</th>
                )}

                <th onClick={() => requestSort('fecha_reporte')} style={{ cursor: 'pointer' }}>Fecha de Registro {getSortIcon('fecha_reporte')}</th>

                {(currentView === 'ABIERTA' || currentView === 'SEGUIMIENTO') && (
                  <>
                    <th onClick={() => requestSort('fecha_prescripcion')} style={{ cursor: 'pointer' }}>Prescripción {getSortIcon('fecha_prescripcion')}</th>
                    <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => requestSort('dias_restantes')}>Días Rest. {getSortIcon('dias_restantes')}</th>
                    <th onClick={() => requestSort('created_by_name')} style={{ cursor: 'pointer' }}>Creado Por {getSortIcon('created_by_name')}</th>
                  </>
                )}

                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((inv) => (
                <tr key={inv.id}>
                  {/* DOCS COLUMN */}
                  {(currentView === 'SEGUIMIENTO' || currentView === 'ENVIADA_A_CONCLUIR' || currentView === 'CONCLUIDA') && (
                    <td style={{ textAlign: 'center', borderLeft: '4px solid #17a2b8' }}>
                      <button
                        onClick={() => handleOpenDocs(inv.id, inv.numero_reporte)}
                        className="btn-icon-only"
                        title="Ver archivos adjuntos"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#840016',
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '5px'
                        }}
                      >
                        <FiFileText />
                      </button>
                    </td>
                  )}

                  {/* TIPO COLUMN */}
                  {(currentView === 'SEGUIMIENTO' || currentView === 'ENVIADA_A_CONCLUIR' || currentView === 'CONCLUIDA') && (
                    <td className="text-muted">{inv.tipo_investigacion}</td>
                  )}

                  {/* SEMAFORO COLUMN */}
                  {currentView === 'ABIERTA' && (
                    <td>
                      <span
                        className="semaforo-dot"
                        style={{ backgroundColor: getSemaforoColor(inv.semaforo) }}
                        title={`Estado: ${inv.semaforo}`}
                      ></span>
                    </td>
                  )}

                  <td className="col-reporte">
                    {inv.numero_reporte || <span className="text-muted">Sin asignar</span>}
                  </td>

                  <td style={{ fontWeight: 500 }}>{inv.nombre_corto}</td>

                  {(currentView === 'ABIERTA' || currentView === 'SEGUIMIENTO') && (
                    <>
                      <td>
                        {renderInvestigadores(inv.investigadores)}
                      </td>

                      <td>
                        {renderInvolucrados(inv.involucrados)}
                      </td>

                      <td className="text-muted">{inv.procedencia}</td>
                    </>
                  )}

                  <td className="text-muted">{inv.conductas}</td>

                  <td>
                    <span className={`gravedad-badge ${getGravedadClass(inv.gravedad)}`}>
                      {inv.gravedad || 'N/D'}
                    </span>
                  </td>

                  {(currentView === 'ABIERTA' || currentView === 'SEGUIMIENTO') && (
                    <td className="text-muted">{inv.gerencia_responsable}</td>
                  )}

                  <td>{formatDate(inv.fecha_reporte)}</td>

                  {(currentView === 'ABIERTA' || currentView === 'SEGUIMIENTO') && (
                    <>
                      <td>{formatDate(inv.fecha_prescripcion)}</td>
                      <td className="col-dias" style={{ color: inv.dias_restantes < 10 ? '#e74c3c' : '#333' }}>
                        {inv.dias_restantes}
                      </td>

                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {inv.created_by_name}
                      </td>
                    </>
                  )}

                  <td>
                    <div className="action-buttons">




                      <ButtonIcon
                        variant="view"
                        onClick={async () => {
                          await auditoriaService.logAction(
                            'VIEW',
                            'Abrió detalles de investigación',
                            inv.id,
                            `/investigaciones/detalles/${inv.id}`
                          );
                          navigate(`/investigaciones/detalles/${inv.id}`, { state: { from: location.pathname } });
                        }}
                        icon={<FiEye />}
                        title="Ver detalles"
                        size="medium"
                      />

                      {currentView === 'ABIERTA' && (
                        <>
                          <ButtonIcon
                            variant="edit"
                            onClick={() => handleEditClick(inv)}
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

                          {(['Admin', 'AdminCentral'].includes(userRole) || userRole.startsWith('Supervisor')) && (
                            <ButtonIcon
                              variant="delete"
                              onClick={() => handleDelete(inv.id, inv.numero_reporte)}
                              icon={<MdDeleteForever />}
                              title="Eliminar"
                              size="medium"
                            />
                          )}
                        </>
                      )}
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
      <DocumentosModals
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        investigacionId={selectedInvestigacionId}
        numeroReporte={selectedReporteNum}
      />
    </div >
  );
}

export default InvestigacionListPage;