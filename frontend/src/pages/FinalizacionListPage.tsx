import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiSearch, FiDownload, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiEye, FiClock, FiFileText } from 'react-icons/fi';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/InvestigacionPage.css';

import DocumentosModals from '../components/Modals/DocumentosModals';
import Swal from 'sweetalert2';
import CustomConductaSelect from '../components/Inputs/CustomConductaSelect';
import { FiX } from 'react-icons/fi';

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

  // Estados para Modal de Conclusión (Reconsideración)
  const [isConcluirModalOpen, setIsConcluirModalOpen] = useState(false);
  const [dataConcluir, setDataConcluir] = useState({
    id: 0,
    reconsideracion: false,
    ficha: '',
    sancion: ''
  });

  const conductaDescriptions: { [key: string]: string } = {
    'INCUMPLIMIENTO DE NORMAS Y PROCEDIMIENTOS': 'Incumplimiento de normas,  Incumplimiento de procedimientos operativos,Incumplimiento de lineamientos internos, Incumplimiento de instrucciones generales, Incumplimiento de cláusulas contractuales',
    'FALTAS INJUSTIFICADAS / ABANDONO DE LABORES': 'Faltas injustificadas, Abandono de labores, Inasistencias reiteradas, Omisión de presentarse al centro de trabajo',
    'NEGLIGENCIA EN EL DESEMPEÑO DE FUNCIONES': 'Omisiones en el desarrollo de funciones, Ejecución deficiente de tareas asignadas, Falta de cuidado o diligencia, Negligencia operativa sin dolo',
    'ACOSO LABORAL (MOBBING)': ' Acoso laboral, Hostigamiento laboral no sexual,Conductas sistemáticas de presión o intimidación',
    'ACTITUD INDEBIDA': ' Actitud indebida, Conducta inapropiada, Faltas al respeto, Comportamiento contrario a la convivencia laboral',
    'DESOBEDIENCIA': ' Desobediencia a instrucciones superiores, Negativa a acatar órdenes directas, Incumplimiento de instrucciones operativas, Resistencia injustificada a la autoridad',
    'ALTERACIÓN DEL ORDEN Y DISCIPLINA': ' Alteración del orden, Riñas o confrontaciones, Escándalos o conductas disruptivas, Afectación a la disciplina del centro de trabajo',
    'SUSTRACCIÓN O ROBO DE BIENES': ' Sustracción, Robo, Sustracción de equipo mobiliario, Pérdida de bienes imputable, Uso indebido con ánimo de apropiación',
    'USO INDEBIDO DE BIENES, HERRAMIENTAS O RECURSOS': ' Uso indebido de útiles y/o herramientas, Uso no autorizado de bienes de la empresa, Uso personal de recursos sin apropiación',
    'HOSTIGAMIENTO O ACOSO SEXUAL': ' Hostigamiento sexual, Acoso sexual, Conductas de connotación sexual, Violencia digital de índole sexual',
    'CONCURRENCIA EN ESTADO INCONVENIENTE': ' Concurrir en estado de ebriedad, Presentarse bajo el influjo de alcohol, Presentarse bajo efectos de sustancias prohibidas',
    'DIVULGACIÓN O USO INDEBIDO DE INFORMACIÓN': ' Divulgación de información confidencial, Uso indebido de información, Acceso no autorizado a información',
    'OCASIONAR DAÑOS O PERJUICIOS': ' Daños a bienes de la empresa, Daños a instalaciones, Perjuicios ocasionados por acción u omisión',
    'SUSPENSIÓN UNILATERAL DE LABORES': ' Suspensión de labores, Paro injustificado, Negativa injustificada a prestar servicios',
    'DISCRIMINACIÓN': ' Discriminación laboral,Trato diferenciado injustificado',
    'ACCIDENTE DE TRABAJO': ' Accidente de trabajo, Incidente con posible responsabilidad laboral',
    'OTRAS CONDUCTAS': '',
    'CLÁUSULA 253 CCT': ''
  };

  const [opciones, setOpciones] = useState<{ conductas: string[] } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      try {
        const [investigacionesRes, opcionesRes] = await Promise.all([
          apiClient.get('/api/investigaciones/investigaciones/'),
          apiClient.get('/api/investigaciones/opciones/')
        ]);

        const filtered = investigacionesRes.data.filter((inv: any) =>
          ['ENVIADA_A_CONCLUIR', 'Enviada a Concluir', 'CONCLUIDA', 'Concluida'].includes(inv.estatus)
        );
        setInvestigaciones(filtered);
        setOpciones(opcionesRes.data);

      } catch (err) {
        setError('No se pudo cargar la lista de seguimiento.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
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

      // 2. Abrir Modal de Conclusión en lugar de Swal directo
      setDataConcluir({
        id: id,
        reconsideracion: false,
        ficha: '',
        sancion: ''
      });
      setIsConcluirModalOpen(true);



    } catch (err: any) {
      console.error("Error en proceso de conclusión:", err);
      Swal.fire('Error', 'Ocurrió un error al procesar la solicitud.', 'error');
    }
  };

  const handleConfirmConcluir = async () => {
    try {
      const payload = {
        estatus: 'CONCLUIDA',
        reconsideracion: dataConcluir.reconsideracion,
        ficha_reconsideracion: dataConcluir.reconsideracion ? dataConcluir.ficha : null,
        sancion_definitiva: dataConcluir.reconsideracion ? dataConcluir.sancion : null
      };

      await apiClient.patch(`/api/investigaciones/investigaciones/${dataConcluir.id}/`, payload);

      setInvestigaciones((prev: InvestigacionListado[]) => prev.map((item: InvestigacionListado) =>
        item.id === dataConcluir.id ? { ...item, estatus: 'CONCLUIDA' } : item
      ));

      setIsConcluirModalOpen(false);
      Swal.fire('¡Concluida!', 'La investigación ha sido concluida exitosamente.', 'success');

    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo concluir la investigación', 'error');
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
                <th>Relevancia</th>
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
                        onClick={() => navigate(`/investigaciones/detalles/${inv.id}`, { state: { from: location.pathname } })}
                        icon={<FiEye />}
                        title="Ver"
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

      {/* MODAL DE CONCLUSIÓN */}
      {isConcluirModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '12px',
            width: '600px', maxWidth: '90%', boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <button
              onClick={() => setIsConcluirModalOpen(false)}
              style={{
                position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '1.2rem', color: '#666'
              }}
            >
              <FiX />
            </button>

            <h2 style={{ margin: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <FiCheckCircle style={{ marginRight: '10px', color: '#28a745' }} />
              Concluir Investigación
            </h2>

            <p style={{ color: '#555', lineHeight: '1.5' }}>
              Al concluir la investigación, esta pasará al estatus <strong>CONCLUIDA</strong> y no se podrán realizar más cambios.
            </p>

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: '500', cursor: 'pointer', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  checked={dataConcluir.reconsideracion}
                  onChange={(e) => setDataConcluir(prev => ({ ...prev, reconsideracion: e.target.checked }))}
                  style={{ width: '20px', height: '20px', accentColor: '#840016' }}
                />
                ¿Se realizó Reconsideración?
              </label>

              {dataConcluir.reconsideracion && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', paddingLeft: '10px', borderLeft: '3px solid #840016' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem', color: '#444' }}>
                      Ficha que autoriza:
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      value={dataConcluir.ficha}
                      onChange={(e) => setDataConcluir(prev => ({ ...prev, ficha: e.target.value }))}
                      placeholder="Ej. 123456"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem', color: '#444' }}>
                      Sanción Definitiva:
                    </label>
                    {/* Usamos el CustomSelect reutilizable */}
                    <CustomConductaSelect
                      value={dataConcluir.sancion}
                      onChange={(val) => setDataConcluir(prev => ({ ...prev, sancion: val }))}
                      options={opciones?.conductas || []}
                      descriptions={conductaDescriptions}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setIsConcluirModalOpen(false)}
                style={{
                  padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc',
                  background: 'white', color: '#555', cursor: 'pointer', fontWeight: '500'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmConcluir}
                style={{
                  padding: '10px 20px', borderRadius: '6px', border: 'none',
                  background: '#28a745', color: 'white', cursor: 'pointer', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                <FiCheckCircle /> Confirmar Conclusión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalizacionListPage;