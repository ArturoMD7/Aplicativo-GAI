import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiEdit, FiSearch, FiDownload, FiAlertCircle, FiCheckCircle, FiFileText, FiTrendingUp, FiClock } from 'react-icons/fi'; // Importar FiFileText y FiClock
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/InvestigacionPage.css';

import DocumentosModals from '../components/Modals/DocumentosModals';
import Swal from 'sweetalert2';

function FinalizacionListPage() {
  const [investigaciones, setInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para el Modal de Documentos
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedInvestigacionId, setSelectedInvestigacionId] = useState<number | null>(null);
  const [selectedReporteNum, setSelectedReporteNum] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvestigaciones = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/investigaciones/investigaciones/');
        const filtered = response.data.filter((inv: any) =>
          ['ENVIADA_A_CONCLUIR', 'Enviada a Concluir', 'CONCLUIDA', 'Concluida'].includes(inv.estatus)
        );
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

  const handleFinalizar = async (id: number) => {
    // 1. Obtener detalles para tener numero_reporte y docs (o hacer fetch de docs)
    // Para simplificar, asumimos que debemos verificar los docs.
    // Como la tabla no tiene docs cargados, haremos una consulta rápida.
    try {
      const docsRes = await apiClient.get(`/api/investigaciones/documentos/?investigacion_id=${id}`);
      const docs = docsRes.data;
      const notificacion = docs.find((d: any) => d.tipo === 'NotificacionConclusion');

      if (!notificacion) {
        // Si no existe, pedir adjuntarlo
        const { value: file } = await Swal.fire({
          title: 'Notificación Requerida',
          text: 'Para concluir la investigación, debes adjuntar el archivo de Notificación de Conclusión.',
          input: 'file',
          inputAttributes: {
            'accept': 'application/pdf',
            'aria-label': 'Sube la Notificación de Conclusión'
          },
          showCancelButton: true,
          confirmButtonText: 'Subir y Concluir',
          cancelButtonText: 'Cancelar',
          inputValidator: (result) => {
            return !result && 'Debes seleccionar un archivo PDF'
          }
        });

        if (file) {
          // Subir archivo
          const formData = new FormData();
          formData.append('archivo', file);
          formData.append('tipo', 'NotificacionConclusion');
          formData.append('investigacion_id', id.toString());
          formData.append('descripcion', 'Notificación adjuntada al concluir');

          try {
            await apiClient.post('/api/investigaciones/documentos/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Si funciona, proceder a concluir
          } catch (uploadError) {
            console.error("Error subiendo archivo:", uploadError);
            Swal.fire('Error', 'No se pudo subir el archivo. La investigación no se concluyó.', 'error');
            return;
          }
        } else {
          // Canceló la subida
          return;
        }
      }

      // 2. Proceder a concluir (Si existía o si se acaba de subir)
      const result = await Swal.fire({
        title: '¿Concluir investigación?',
        text: "La investigación se marcará como CONCLUIDA.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, concluir',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await apiClient.patch(`/api/investigaciones/investigaciones/${id}/`, { estatus: 'CONCLUIDA' });

        setInvestigaciones(prev => prev.map(item =>
          item.id === id ? { ...item, estatus: 'CONCLUIDA' } : item
        ));

        Swal.fire('¡Concluida!', 'La investigación ha sido concluida exitosamente.', 'success');
      }

    } catch (err: any) {
      console.error("Error en proceso de conclusión:", err);
      Swal.fire('Error', 'Ocurrió un error al procesar la solicitud.', 'error');
    }
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

    let statusMatch = false;
    if (statusFilter === 'PENDING') {
      statusMatch = ['ENVIADA_A_CONCLUIR', 'Enviada a Concluir'].includes(inv.estatus);
    } else {
      statusMatch = ['CONCLUIDA', 'Concluida'].includes(inv.estatus);
    }

    return searchMatch && statusMatch;
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

  // Función para abrir el modal de documentos
  const handleOpenDocs = (id: number, numeroReporte: string) => {
    setSelectedInvestigacionId(id);
    setSelectedReporteNum(numeroReporte);
    setIsDocModalOpen(true);
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
        <h1><FiCheckCircle /> Bandeja de Finalización</h1>
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

      <div style={{ display: 'flex', gap: '15px', margin: '20px 0 10px 0', paddingLeft: '20px' }}>
        <ButtonIcon
          variant={statusFilter === 'PENDING' ? 'view' : 'custom'}
          icon={<FiClock />}
          text="Por Concluir"
          onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
          title="Ver investigaciones enviadas a concluir"
          size="medium"
        />
        <ButtonIcon
          variant={statusFilter === 'COMPLETED' ? 'view' : 'custom'}
          icon={<FiCheckCircle />}
          text="Concluidas"
          onClick={() => { setStatusFilter('COMPLETED'); setCurrentPage(1); }}
          title="Ver investigaciones concluidas"
          size="medium"
        />
      </div>

      {loading && <div className="loading-message">Cargando...</div>}
      {error && <div className="error-message"><FiAlertCircle style={{ marginRight: 8 }} /> {error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table className="investigacion-table">
            <thead>
              <tr>
                {/* 1. Nueva columna al inicio para el botón de documentos */}
                <th style={{ width: '60px', textAlign: 'center' }}>Docs</th>
                <th>No. Reporte</th>
                <th>Documento</th>
                <th>Dirección</th>
                <th>Gravedad</th>
                <th>Fecha Reporte</th>
                <th style={{ textAlign: 'center' }}>Días en Proceso</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((inv) => (
                <tr key={inv.id}>
                  {/* 2. Botón en la primera columna */}
                  <td style={{ textAlign: 'center', borderLeft: '4px solid #17a2b8' }}>
                    <button
                      onClick={() => handleOpenDocs(inv.id, inv.numero_reporte)}
                      className="btn-icon-only"
                      title="Ver archivos adjuntos"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#840016', // Color guinda PEMEX
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

                  <td style={{ textAlign: 'center', color: '#666' }}>
                    {Math.floor((new Date().getTime() - new Date(inv.created_at).getTime()) / (1000 * 3600 * 24))} días
                  </td>

                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <ButtonIcon
                        variant="edit"
                        onClick={() => navigate(`/investigaciones/seguimiento/${inv.id}`)}
                        icon={<FiEdit />}
                        title="Gestionar Expediente"
                        size="medium"
                      />

                      {statusFilter === 'PENDING' && (
                        <ButtonIcon
                          variant="view"
                          onClick={() => handleFinalizar(inv.id)}
                          icon={<FiTrendingUp />}
                          title="Concluir investigación"
                          size="medium"
                        />
                      )}
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

      {/* 3. Renderizar el componente de Modals */}
      <DocumentosModals
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        investigacionId={selectedInvestigacionId}
        numeroReporte={selectedReporteNum}
      />
    </div>
  );
}

export default FinalizacionListPage;