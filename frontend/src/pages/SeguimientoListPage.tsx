import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiEdit, FiSearch, FiDownload, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/InvestigacionPage.css'; // Usamos los mismos estilos

function SeguimientoListPage() {
  const [investigaciones, setInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const navigate = useNavigate();

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

  const getGravedadClass = (gravedad: string | null | undefined): string => {
    const normalized = gravedad ? String(gravedad).toLowerCase().trim() : '';
    if (normalized.includes('alta')) return 'gravedad-alta';
    if (normalized.includes('media')) return 'gravedad-media';
    if (normalized.includes('baja')) return 'gravedad-baja';
    return 'gravedad-default';
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
      'Documento': inv.nombre_corto,
      'Dirección': inv.direccion,
      'Fecha Reporte': new Date(inv.fecha_reporte).toLocaleDateString(),
      'Estatus': inv.estatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seguimiento');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Seguimiento_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvestigaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvestigaciones.length / itemsPerPage);

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
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <ButtonIcon variant="view" icon={<FiDownload />} text="Exportar" onClick={exportToExcel} size="medium" />
        </div>
      </div>

      {loading && <div className="loading-message">Cargando...</div>}
      {error && <div className="error-message"><FiAlertCircle style={{marginRight:8}}/> {error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table className="investigacion-table">
            <thead>
              <tr>
                <th>No. Reporte</th>
                <th>Documento</th>
                <th>Dirección</th>
                <th>Gravedad</th>
                <th>Fecha Reporte</th>
                <th style={{textAlign: 'center'}}>Días en Proceso</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((inv) => (
                <tr key={inv.id}>
                  {/* Decoración visual para diferenciar la tabla */}
                  <td className="col-reporte" style={{borderLeft: '4px solid #17a2b8'}}>
                    {inv.numero_reporte}
                  </td>
                  
                  <td style={{ fontWeight: 500 }}>{inv.nombre_corto}</td>
                  <td className="text-muted">{inv.direccion}</td>
                  
                  <td>
                    <span className={`gravedad-badge ${getGravedadClass(inv.gravedad)}`}>
                      {inv.gravedad}
                    </span>
                  </td>
                  
                  <td>{formatDate(inv.fecha_reporte)}</td>
                  
                  {/* Cálculo simple de días transcurridos desde creación */}
                  <td style={{ textAlign: 'center', color: '#666' }}>
                     {Math.floor((new Date().getTime() - new Date(inv.created_at).getTime()) / (1000 * 3600 * 24))} días
                  </td>

                  <td>
                    <div className="action-buttons" style={{justifyContent: 'center'}}>
                      
                      {/* BOTÓN EDITAR / GESTIONAR EXPEDIENTE */}
                      {/* Redirige a la página de SeguimientoPage */}
                      <ButtonIcon
                        variant="edit"
                        onClick={() => navigate(`/investigaciones/seguimiento/${inv.id}`)}
                        icon={<FiEdit />}
                        title="Gestionar Expediente"
                        size="medium"
                        text="Gestionar" // Opcional: poner texto para que destaque
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
    </div>
  );
}

export default SeguimientoListPage;