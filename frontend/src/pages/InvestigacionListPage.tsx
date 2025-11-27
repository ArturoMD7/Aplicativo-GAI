import React, { useState, useEffect } from 'react';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiPlus, FiEdit, FiFileText, FiEye, FiSearch, FiDownload, FiAlertCircle } from 'react-icons/fi';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/InvestigacionPage.css';

function InvestigacionListPage() {
  const [investigaciones, setInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchInvestigaciones = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/investigaciones/investigaciones/');
        setInvestigaciones(response.data);
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
    return Object.values(inv).some(value =>
      String(value).toLowerCase().includes(texto)
    );
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
      'Nombre Corto': inv.nombre_corto,
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

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvestigaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvestigaciones.length / itemsPerPage);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiFileText /> Módulo de Investigaciones</h1>
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

          <ButtonIcon
            variant="download" // Nota: Asegúrate que tu componente ButtonIcon maneje esta variante, o usa "primary"
            to="/investigaciones/nuevo"
            icon={<FiPlus />}
            text="Nuevo"
            size="medium"
          />
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
          {/* Cambié la clase a "investigacion-table" para aplicar los nuevos estilos */}
          <table className="investigacion-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Semáforo</th>
                <th>No. Reporte</th>
                <th>Nombre Corto</th>
                <th>Procedencia</th>
                <th>Gravedad</th>
                <th>Región</th>
                <th>Fecha Reporte</th>
                <th>Prescripción</th>
                <th style={{ textAlign: 'center' }}>Días Rest.</th>
                <th>Creado Por</th>
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

                  {/* Negritas y color vino para el número de reporte */}
                  <td className="col-reporte">
                    {inv.numero_reporte || <span className="text-muted">Sin asignar</span>}
                  </td>

                  <td style={{ fontWeight: 500 }}>{inv.nombre_corto}</td>
                  <td className="text-muted">{inv.procedencia}</td>

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
                        to={`/investigaciones/detalles/${inv.id}`}
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