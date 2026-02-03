import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiSearch, FiDownload, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiEye, FiClock, FiFileText, FiUpload, FiFile } from 'react-icons/fi';
import { MdDeleteForever } from "react-icons/md";
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
  const [userRole, setUserRole] = useState<string>('');

  // Estados para Modal de Conclusión (Reconsideración)
  const [isConcluirModalOpen, setIsConcluirModalOpen] = useState(false);
  const [dataConcluir, setDataConcluir] = useState({
    id: 0,
    reconsideracion: false,
    ficha: '',
    sancion: '',
    conducta: '',
    dias_suspension: '', // New state for suspension days
    sancion_actual: '',
    conducta_actual: ''
  });

  // Estado para controlar si ya existe el documento de notificación y el archivo seleccionado
  const [hasNotificacion, setHasNotificacion] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const conductaDescriptions: { [key: string]: string } = {
    'INCUMPLIMIENTO DE NORMAS Y PROCEDIMIENTOS': 'Incumplimiento de normas de trabajo,  Incumplimiento de procedimientos operativos, Conflicto de intereses, Actos de Corrupción',
    'FALTAS INJUSTIFICADAS': 'Faltas injustificadas, Inasistencias reiteradas, Omisión de presentarse al centro de trabajo',
    'NEGLIGENCIA EN EL DESEMPEÑO DE FUNCIONES': 'Omisiones en el desarrollo de funciones, Ejecución deficiente de tareas asignadas, Falta de cuidado o diligencia, Negligencia operativa',
    'ACOSO LABORAL (MOBBING)': ' Acoso laboral, Hostigamiento laboral no sexual, Conductas sistemáticas de presión o intimidación',
    'DESOBEDIENCIA': ' Desobediencia a instrucciones superiores, Desacato,  Incumplimiento de instrucciones operativas,  Resistencia injustificada a la autoridad',
    'ALTERACIÓN DEL ORDEN Y DISCIPLINA': ' Alteración del orden, Riñas o confrontaciones, Actitud y/o conducta indebida, Faltas al respeto,  Comportamiento contrario a la convivencia laboral',
    'SUSTRACCIÓN, PÉRDIDA O ROBO DE BIENES': ' Sustracción, Robo, Sustracción de equipo mobiliario, Pérdida de bienes imputable, Uso indebido con ánimo de apropiación, Mercado ilícito de combustible (MIC)',
    'USO INDEBIDO DE BIENES, HERRAMIENTAS O RECURSOS': ' Uso indebido de útiles y/o herramientas, Uso no autorizado de bienes de la empresa, Uso personal de recursos sin apropiación',
    'PRESENTACIÓN DE DOCUMENTACIÓN ALTERADA Y/O APÓCRIFA': 'Uso indebido de documentación, Ejercicio indebido de funciones, Usurpación de funciones',
    'HOSTIGAMIENTO O ACOSO SEXUAL': ' Hostigamiento sexual, Acoso sexual, Conductas de connotación sexual, Violencia digital de índole sexual',
    'ENCONTRARSE EN ESTADO INCONVENIENTE': ' Concurrir en estado de ebriedad, Presentarse bajo el influjo de alcohol, Presentarse bajo efectos de sustancias prohibidas, Consumo de sustancias prohibidas dentro de las instalaciones',
    'DIVULGACIÓN O USO INDEBIDO DE INFORMACIÓN': ' Divulgación de información confidencial, Uso indebido de información, Acceso no autorizado a información',
    'OCASIONAR DAÑOS O PERJUICIOS': ' Daños a bienes de la empresa, Daños a instalaciones, Perjuicios ocasionados por acción u omisión',
    'SUSPENSIÓN Y/O ABANDONO DE LABORES': ' Suspensión de labores, Paro injustificado',
    'DISCRIMINACIÓN': '',
    'COBRO/PAGO(S) EN DEMASÍA INDEBIDOS': '',
    'OTRAS CONDUCTAS': '',
  };

  const [opciones, setOpciones] = useState<{ conductas: string[]; sancion: string[] } | null>(null);

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

  useEffect(() => {
    const checkRole = async () => {
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
      setUserRole(role || '');
    };
    checkRole();
  }, []);

  const handleFinalizar = async (id: number) => {
    try {
      const docsRes = await apiClient.get(`/api/investigaciones/documentos/?investigacion_id=${id}`);
      const docs = docsRes.data;
      const notificacion = docs.find((d: any) => d.tipo === 'NotificacionConclusion');

      setHasNotificacion(!!notificacion);
      setSelectedFile(null); // Resetear archivo seleccionado

      const investigacion = investigaciones.find(inv => inv.id === id);

      // Abrir Modal de Conclusión DIRECTAMENTE
      setDataConcluir({
        id: id,
        reconsideracion: false,
        ficha: '',
        sancion: '',
        conducta: investigacion?.conductas || '',
        dias_suspension: '',
        sancion_actual: '',
        conducta_actual: investigacion?.conductas || 'No registrada'
      });
      setIsConcluirModalOpen(true);

    } catch (err: any) {
      console.error("Error en proceso de conclusión:", err);
      Swal.fire('Error', 'Ocurrió un error al procesar la solicitud.', 'error');
    }
  };

  const handleConfirmConcluir = async () => {
    // 1. Validar el archivo si no existe previamente
    if (!hasNotificacion && !selectedFile) {
      Swal.fire('Atención', 'Debes adjuntar la Notificación de Conclusión para continuar.', 'warning');
      return;
    }

    try {
      // 2. Subir archivo si fue seleccionado
      if (selectedFile && !hasNotificacion) {
        const formData = new FormData();
        formData.append('archivo', selectedFile);
        formData.append('tipo', 'NotificacionConclusion');
        formData.append('investigacion_id', dataConcluir.id.toString());
        formData.append('descripcion', 'Notificación adjuntada al concluir');

        await apiClient.post('/api/investigaciones/documentos/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 3. Proceder con la conclusión
      const payload = {
        estatus: 'CONCLUIDA',
        reconsideracion: dataConcluir.reconsideracion,
        ficha_reconsideracion: dataConcluir.reconsideracion ? dataConcluir.ficha : null,
        sancion: dataConcluir.sancion,
        conducta_definitiva: dataConcluir.reconsideracion ? dataConcluir.conducta : dataConcluir.conducta_actual,
        dias_suspension: (dataConcluir.sancion === 'SUSPENSIÓN DE LABORES') ? dataConcluir.dias_suspension : null
      };

      await apiClient.patch(`/api/investigaciones/investigaciones/${dataConcluir.id}/concluir/`, payload);

      setInvestigaciones((prev: InvestigacionListado[]) => prev.map((item: InvestigacionListado) =>
        item.id === dataConcluir.id ? { ...item, estatus: 'CONCLUIDA' } : item
      ));

      setIsConcluirModalOpen(false);
      Swal.fire('¡Concluida!', 'La investigación ha sido concluida exitosamente.', 'success');

    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo concluir la investigación (verifica el archivo o la conexión)', 'error');
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
        Swal.fire('¡Eliminado!', 'El registro ha sido eliminado correctamente.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Hubo un problema al intentar eliminar el registro.', 'error');
      }
    }
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
      {/* (Keeping existing JSX for table...) */}
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

                      {(['Admin', 'AdminCentral'].includes(userRole) || userRole.startsWith('Supervisor')) && (
                        <ButtonIcon
                          variant="delete"
                          onClick={() => handleDelete(inv.id, inv.numero_reporte)}
                          icon={<MdDeleteForever />}
                          title="Eliminar"
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
            width: '900px', maxWidth: '95%', boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px',
            maxHeight: '90vh', overflowY: 'auto'
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>Conducta Reportada:</label>
                <p style={{ margin: '5px 0', fontSize: '0.95rem' }}>{dataConcluir.conducta_actual}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>Sanción Determinada:</label>
                <p style={{ margin: '5px 0', fontSize: '0.95rem' }}>{dataConcluir.sancion_actual}</p>
              </div>
            </div>

            <p style={{ color: '#555', lineHeight: '1.5' }}>
              Al concluir la investigación, esta pasará al estatus <strong>CONCLUIDA</strong>.
            </p>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              {!hasNotificacion && (
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#840016', fontSize: '0.95rem' }}>
                    <FiAlertCircle style={{ marginBottom: '-2px', marginRight: '5px' }} />
                    Notificación de Conclusión Requerida
                  </label>
                  <div style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      id="file-upload"
                      accept="application/pdf"
                      onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />

                    {!selectedFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#666' }}>
                        <FiUpload style={{ fontSize: '2rem', color: '#840016' }} />
                        <div>
                          <span style={{ fontWeight: '600', color: '#333' }}>Haz clic para subir el archivo</span>
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>Solo formato PDF</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#28a745' }}>
                        <FiFile style={{ fontSize: '2rem' }} />
                        <div>
                          <span style={{ fontWeight: '600' }}>{selectedFile.name}</span>
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB - Listo para subir
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 1. SELECCIÓN DE SANCIÓN (SIEMPRE DISPONIBLE) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.95rem', color: '#444' }}>
                  Sanción a aplicar:
                </label>
                <select
                  className="admin-input"
                  value={dataConcluir.sancion}
                  onChange={(e) => setDataConcluir(prev => ({ ...prev, sancion: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                  <option value="">Seleccione...</option>
                  {opciones?.sancion?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {dataConcluir.sancion === 'SUSPENSIÓN DE LABORES' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.95rem', color: '#444' }}>
                    Días de Suspensión:
                  </label>
                  <input
                    type="number"
                    className="admin-input"
                    value={dataConcluir.dias_suspension}
                    onChange={(e) => setDataConcluir(prev => ({ ...prev, dias_suspension: e.target.value }))}
                    placeholder="Ej. 3"
                    min="1"
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                  />
                </div>
              )}


              {/* 2. RECONSIDERACIÓN DE CONDUCTA */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', color: '#840016' }}>
                <input
                  type="checkbox"
                  checked={dataConcluir.reconsideracion}
                  onChange={(e) => setDataConcluir(prev => ({ ...prev, reconsideracion: e.target.checked }))}
                  style={{ width: '20px', height: '20px', accentColor: '#840016' }}
                />
                ¿Reconsideración de Conducta?
              </label>

              {dataConcluir.reconsideracion && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingLeft: '10px', borderLeft: '3px solid #840016' }}>

                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem', color: '#444' }}>
                      Conducta Definitiva (Nueva):
                    </label>
                    <CustomConductaSelect
                      value={dataConcluir.conducta}
                      onChange={(val) => setDataConcluir(prev => ({ ...prev, conducta: val }))}
                      options={opciones?.conductas || []}
                      descriptions={conductaDescriptions}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem', color: '#444' }}>
                      Ficha que autoriza Reconsideración:
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      value={dataConcluir.ficha}
                      onChange={(e) => setDataConcluir(prev => ({ ...prev, ficha: e.target.value }))}
                      placeholder="Ej. 123456"
                      style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
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