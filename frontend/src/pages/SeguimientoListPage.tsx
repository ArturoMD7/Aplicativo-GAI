import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiEdit, FiSearch, FiDownload, FiAlertCircle, FiCheckCircle, FiFileText, FiTrendingUp, FiFilter, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/InvestigacionPage.css';
import DocumentosModals from '../components/Modals/DocumentosModals';
import Swal from 'sweetalert2';
import { GERENCIA_CHOICES, CONDUCTAS_POSIBLES } from '../data/investigacionConstants';

type SortConfig = {
  key: keyof InvestigacionListado | null;
  direction: 'ascending' | 'descending';
};

function SeguimientoListPage() {
  const [investigaciones, setInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [selectedGerencia, setSelectedGerencia] = useState('');
  const [selectedConducta, setSelectedConducta] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  // Estados para el Modal de Documentos
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedInvestigacionId, setSelectedInvestigacionId] = useState<number | null>(null);
  const [selectedReporteNum, setSelectedReporteNum] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchInvestigaciones = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/investigaciones/investigaciones/');
        const filtered = response.data.filter((inv: any) => inv.estatus === 'Seguimiento' || inv.estatus === 'SEGUIMIENTO');
        setInvestigaciones(filtered);
      } catch (err) {
        setError('No se pudo cargar la lista de seguimiento.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigaciones();
  }, []);

  const handleFinalizacion = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Pasar a Finalización?',
      text: "La investigación pasará a la bandeja de Finalización y desaparecerá de esta lista.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar finalización',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/api/investigaciones/investigaciones/${id}/`, { estatus: 'ENVIADA_A_CONCLUIR' });
        setInvestigaciones(prev => prev.filter(item => item.id !== id));
        Swal.fire('Listo', 'La investigación se movió a finalización.', 'success');
      } catch (err: any) {
        console.error("Error al cambiar estatus:", err.response?.data || err);
        Swal.fire('Error', 'No se pudo cambiar el estatus', 'error');
      }
    }
  };

  const handleEditClick = async (inv: InvestigacionListado) => {
    try {
      await apiClient.post('/api/auditoria/create-log/', {
        action: 'UPDATE',
        description: `Abrió expediente de seguimiento`,
        investigacion_id: inv.id,
        endpoint: `/investigaciones/seguimiento/${inv.id}`
      });
    } catch (e) {
      console.error("No se pudo registrar log de seguimiento", e);
    }
    navigate(`/investigaciones/seguimiento/${inv.id}`, { state: { from: location.pathname } });
  };

  const getGravedadClass = (gravedad: string | null | undefined): string => {
    const normalized = gravedad ? String(gravedad).toLowerCase().trim() : '';
    if (normalized.includes('alta')) return 'gravedad-alta';
    if (normalized.includes('media')) return 'gravedad-media';
    if (normalized.includes('baja')) return 'gravedad-baja';
    return 'gravedad-default';
  };


  const filteredInvestigaciones = investigaciones.filter((inv) => {
    const texto = searchTerm.toLowerCase();
    const searchMatch = Object.values(inv).some(value =>
      String(value).toLowerCase().includes(texto)
    );
    const matchesGerencia = selectedGerencia ? inv.gerencia_responsable === selectedGerencia : true;
    const matchesConducta = selectedConducta ? inv.conductas === selectedConducta : true;

    return searchMatch && matchesGerencia && matchesConducta;
  });

  // Sorting Logic
  const sortedInvestigaciones = useMemo(() => {
    let sortableItems = [...filteredInvestigaciones];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof InvestigacionListado];
        let valB: any = b[sortConfig.key as keyof InvestigacionListado];

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
      'Creado Por': inv.created_by_name,
      'Fecha Creación': new Date(inv.created_at).toLocaleDateString(),
      'Fecha Prescripción': new Date(inv.fecha_prescripcion).toLocaleDateString(),
      'Días Restantes': inv.dias_restantes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seguimiento');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Seguimiento_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Función para abrir el modal de documentos
  const handleOpenDocs = (id: number, numeroReporte: string) => {
    setSelectedInvestigacionId(id);
    setSelectedReporteNum(numeroReporte);
    setIsDocModalOpen(true);
  };

  const renderInvestigadores = (investigadores: string[] | string) => {
    if (!investigadores || (Array.isArray(investigadores) && investigadores.length === 0)) {
      return <span className="text-muted" style={{ fontSize: '0.85rem' }}>Sin asignar</span>;
    }
    const lista = Array.isArray(investigadores) ? investigadores : [investigadores];
    return (
      <div className="investigadores-list">
        {lista.map((nombre, index) => (
          <span key={index} className="investigador-badge">{nombre}</span>
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
          <span key={index} className="involucrados-badge">{nombre}</span>
        ))}
      </div>
    );
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedInvestigaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedInvestigaciones.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);
  const handleItemsPerPageChange = (items: number) => { setItemsPerPage(items); setCurrentPage(1); };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiCheckCircle /> Bandeja de Seguimiento</h1>
        <div className="header-actions">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar reporte, nombre..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <ButtonIcon variant="view" icon={<FiDownload />} text="Exportar" onClick={exportToExcel} size="medium" />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FiFilter style={{ color: '#666', marginRight: '5px' }} />
          <select value={selectedGerencia} onChange={(e) => setSelectedGerencia(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">Todas las Gerencias</option>
            {GERENCIA_CHOICES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FiFilter style={{ color: '#666', marginRight: '5px' }} />
          <select value={selectedConducta} onChange={(e) => setSelectedConducta(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">Todas las Conductas</option>
            {CONDUCTAS_POSIBLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

      </div>

      {loading && <div className="loading-message">Cargando...</div>}
      {error && <div className="error-message"><FiAlertCircle style={{ marginRight: 8 }} /> {error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table className="investigacion-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Docs</th>
                <th onClick={() => requestSort('numero_reporte')} style={{ cursor: 'pointer' }}>No. Reporte {getSortIcon('numero_reporte')}</th>
                <th onClick={() => requestSort('nombre_corto')} style={{ cursor: 'pointer' }}>Documento de Origen {getSortIcon('nombre_corto')}</th>
                <th>Investigadores</th>
                <th>Personal Reportado</th>
                <th onClick={() => requestSort('procedencia')} style={{ cursor: 'pointer' }}>Procedencia {getSortIcon('procedencia')}</th>
                <th onClick={() => requestSort('conductas')} style={{ cursor: 'pointer' }}>Conducta {getSortIcon('conductas')}</th>
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

                  <td className="col-reporte">
                    {inv.numero_reporte || <span className="text-muted">Sin asignar</span>}
                  </td>

                  <td style={{ fontWeight: 500 }}>{inv.nombre_corto}</td>

                  <td>{renderInvestigadores(inv.investigadores)}</td>
                  <td>{renderInvolucrados(inv.involucrados)}</td>
                  <td className="text-muted">{inv.procedencia}</td>
                  <td className="text-muted">{inv.conductas}</td>

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
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <ButtonIcon
                        variant="edit"
                        onClick={() => handleEditClick(inv)}
                        icon={<FiEdit />}
                        title="Gestionar Expediente"
                        size="medium"
                      />

                      <ButtonIcon
                        variant="view"
                        onClick={() => handleFinalizacion(inv.id)}
                        icon={<FiTrendingUp />}
                        title="Pasar a Finalizar"
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
              <FiCheckCircle style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', margin: '0 auto', color: '#28a745' }} />
              No hay investigaciones en etapa de seguimiento.
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
    </div>
  );
}

export default SeguimientoListPage;