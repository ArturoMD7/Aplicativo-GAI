import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../api/apliClient';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import type { InvestigacionFormState } from '../types/investigacion.types';
import { FiEdit, FiFileText, FiDownload, FiEye, FiPaperclip, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import { FaArrowLeft } from "react-icons/fa";
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import '../styles/InvestigacionaDetails.css';

function InvestigacionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as any)?.from || '/investigaciones';
  const [investigacion, setInvestigacion] = useState<InvestigacionFormState | null>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvestigacion = async () => {
      try {
        setLoading(true);
        const [invRes, docsRes] = await Promise.all([
          apiClient.get(`/api/investigaciones/investigaciones/${id}/`),
          apiClient.get(`/api/investigaciones/documentos/?investigacion_id=${id}`)
        ]);
        setInvestigacion(invRes.data);
        setDocumentos(docsRes.data);
      } catch (err) {
        setError('No se pudo cargar la investigación.');
        console.error('Error al cargar investigación:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvestigacion();
    }
  }, [id]);

  const formatDate = (str: string) => {
    if (!str) return '';
    const [year, month, day] = str.split("-");
    return `${day}/${month}/${year}`;
  };

  const handlePreview = (doc: any) => {
    const ext = doc.nombre_archivo.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {

      window.open(doc.archivo, '_blank');
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Vista previa no disponible',
        text: 'Este formato debe ser descargado para visualizarse.',
        confirmButtonColor: '#840016'
      });
    }
  };

  const handleDownload = (doc: any) => {
    saveAs(doc.archivo, doc.nombre_archivo);
  };

  const renderPersonas = (personas: any[], tipo: string) => {
    if (!personas || personas.length === 0) {
      return <div className="admin-no-data">No hay {tipo} registrados</div>;
    }

    return (
      <div className="admin-personas-grid">
        {personas.map((persona, index) => (
          <div key={index} className="admin-persona-card">
            <div className="admin-persona-header">
              <h4>{persona.nombre}</h4>
              <span className="admin-ficha">Ficha: {persona.ficha}</span>
            </div>

            <div className="admin-persona-details">
              <div className="admin-detail-row">
                <span className="admin-label">Categoría:</span>
                <span className="admin-value">{persona.categoria || 'No especificada'}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-label">Puesto:</span>
                <span className="admin-value">{persona.puesto || 'No especificado'}</span>
              </div>

              {persona.nivel && (
                <div className="admin-detail-row">
                  <span className="admin-label">Nivel:</span>
                  <span className="admin-value">{persona.nivel}</span>
                </div>
              )}

              {persona.extension && (
                <div className="admin-detail-row">
                  <span className="admin-label">Extensión:</span>
                  <span className="admin-value">{persona.extension}</span>
                </div>
              )}

              {persona.email && (
                <div className="admin-detail-row">
                  <span className="admin-label">Email:</span>
                  <span className="admin-value">{persona.email}</span>
                </div>
              )}

              {persona.tipo && (
                <div className="admin-detail-row">
                  <span className="admin-label">Tipo:</span>
                  <span className="admin-badge admin-badge-primary">{persona.tipo}</span>
                </div>
              )}

              {persona.edad !== undefined && (
                <div className="admin-detail-row">
                  <span className="admin-label">Edad:</span>
                  <span className="admin-value">{persona.edad} años</span>
                </div>
              )}

              {persona.antiguedad !== undefined && (
                <div className="admin-detail-row">
                  <span className="admin-label">Antigüedad:</span>
                  <span className="admin-value">{persona.antiguedad} años</span>
                </div>
              )}

              {persona.rfc && (
                <div className="admin-detail-row">
                  <span className="admin-label">RFC:</span>
                  <span className="admin-value">{persona.rfc}</span>
                </div>
              )}

              {persona.curp && (
                <div className="admin-detail-row">
                  <span className="admin-label">CURP:</span>
                  <span className="admin-value">{persona.curp}</span>
                </div>
              )}

              {persona.direccion && (
                <div className="admin-detail-row">
                  <span className="admin-label">Dirección:</span>
                  <span className="admin-value">{persona.direccion}</span>
                </div>
              )}

              <div className="admin-detail-row">
                <span className="admin-label">Subordinación:</span>
                <span className={`admin-badge ${persona.subordinacion ? 'admin-badge-warning' : 'admin-badge-secondary'}`}>
                  {persona.subordinacion ? 'Sí' : 'No'}
                </span>
              </div>


              {tipo === 'investigadores' && persona.no_constancia && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #eee' }}>
                  <div className="admin-detail-row">
                    <span className="admin-label">No. Constancia:</span>
                    <span className="admin-value" style={{ fontWeight: '600' }}>{persona.no_constancia}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `/constancias/${persona.no_constancia}.pdf`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    className="hover-opacity"
                  >
                    <i className="fas fa-file-pdf"></i>
                    Ver Constancia
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="admin-register-container">Cargando investigación...</div>;
  if (error) return <div className="admin-register-container"><div className="admin-alert admin-alert-error">{error}</div></div>;
  if (!investigacion) return <div className="admin-register-container"><div className="admin-alert admin-alert-error">No se encontró la investigación</div></div>;

  return (
    <div className="admin-register-container">
      <div className="admin-register-header">
        <h1>Detalles de Investigación</h1>
        <p>Información completa del registro de investigación</p>
      </div>

      <div className="admin-register-form-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

        {/* SECCIÓN 3: FECHAS IMPORTANTES */}
        <section className="admin-form-section">
          <h2 className="admin-section-title">
            <i className="fas fa-calendar-alt"></i>
            Fechas Importantes
          </h2>

          <div className="admin-dates-grid">
            <div className="admin-date-card">
              <i className="fas fa-file-upload"></i>
              <div>
                <h4>Fecha de Reporte</h4>
                <p>{formatDate(investigacion.fecha_reporte)}</p>
              </div>
            </div>

            <div className="admin-date-card">
              <i className="fas fa-eye"></i>
              <div>
                <h4>Conocimiento de Hechos</h4>
                <p>{formatDate(investigacion.fecha_conocimiento_hechos)}</p>
              </div>
            </div>

            <div className="admin-date-card">
              <i className="fas fa-calendar-day"></i>
              <div>
                <h4>Fecha del Evento</h4>
                <p>{formatDate(investigacion.fecha_evento)}</p>
              </div>
            </div>

            <div className="admin-date-card">
              <i className="fas fa-clock"></i>
              <div>
                <h4>Fecha de Prescripción</h4>
                <p>{formatDate(investigacion.fecha_prescripcion)}</p>
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <div className="admin-checkbox-container">
              <input
                type="checkbox"
                checked={investigacion.economica}
                readOnly
                className="admin-readonly-checkbox"
              />
              <label>¿Implica repercusión económica?</label>
            </div>
            {investigacion.economica && investigacion.montoeconomico && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', color: '#856404', background: '#fff3cd', padding: '8px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
                <FiDollarSign style={{ marginRight: '5px' }} />
                Monto: ${investigacion.montoeconomico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </section>

        {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
        <section className="admin-form-section">
          <h2 className="admin-section-title">
            <i className="fas fa-info-circle"></i>
            Información General
          </h2>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Documento de origen *</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-heading"></i>
                <input
                  type="text"
                  value={investigacion.nombre_corto}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Número de Reporte</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-hashtag"></i>
                <input
                  type="text"
                  value={investigacion.numero_reporte || 'No asignado'}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label>Conducta / Sanción Posible</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-exclamation-circle"></i>
              <input
                type="text"
                value={investigacion.conductas || 'No especificada'}
                readOnly
                className="admin-readonly-field"
              />
            </div>
          </div>


          <div className="admin-form-group">
            <label>Detalles de la Conducta</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-align-left"></i>
              <textarea
                value={investigacion.detalles_conducta || 'Sin detalles adicionales'}
                readOnly
                className="admin-readonly-field admin-textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Relevancia</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-exclamation-triangle"></i>
                <input
                  type="text"
                  value={investigacion.gravedad}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Procedencia</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-source"></i>
                <input
                  type="text"
                  value={investigacion.procedencia}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: GERENCIA RESPONSABLE */}
        <section className="admin-form-section">
          <h2 className="admin-section-title">
            <i className="fas fa-user-tie"></i>
            Gerencia Responsable
          </h2>

          <div className="admin-form-group">
            <label>Gerencia Responsable</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-briefcase"></i>
              <input
                type="text"
                value={investigacion.gerencia_responsable}
                readOnly
                className="admin-readonly-field"
              />
            </div>
          </div>

          {investigacion.responsable_nombre && (
            <div className="admin-personas-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h3>Gerente / Responsable</h3>
              <div className="admin-persona-card">
                <div className="admin-persona-header">
                  <h4>{investigacion.responsable_nombre}</h4>
                  <span className="admin-ficha">Ficha: {investigacion.responsable_ficha}</span>
                </div>
                <div className="admin-persona-details">
                  <div className="admin-detail-row">
                    <span className="admin-label">Categoría:</span>
                    <span className="admin-value">{investigacion.responsable_categoria}</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-label">Puesto:</span>
                    <span className="admin-value">{investigacion.responsable_puesto}</span>
                  </div>
                  {investigacion.responsable_extension && (
                    <div className="admin-detail-row">
                      <span className="admin-label">Extensión:</span>
                      <span className="admin-value">{investigacion.responsable_extension}</span>
                    </div>
                  )}
                  {investigacion.responsable_email && (
                    <div className="admin-detail-row">
                      <span className="admin-label">Email:</span>
                      <span className="admin-value">{investigacion.responsable_email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="admin-personas-section">
            <h3>Investigadores</h3>
            {renderPersonas(investigacion.investigadores || [], 'investigadores')}
          </div>
        </section>

        {/* SECCIÓN 5: INFORMACIÓN DEL EVENTO */}
        <section className="admin-form-section">
          <h2 className="admin-section-title">
            <i className="fas fa-calendar-check"></i>
            Información del Evento
          </h2>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Lugar de los hechos</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-map-marker-alt"></i>
                <input
                  type="text"
                  value={investigacion.lugar || 'No especificado'}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Centro de Trabajo</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-hard-hat"></i>
                <input
                  type="text"
                  value={investigacion.centro_trabajo || 'No especificado'}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label>Observaciones</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-sticky-note"></i>
              <textarea
                value={investigacion.observaciones || 'Sin observaciones'}
                readOnly
                className="admin-readonly-field admin-textarea"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* SECCIÓN CONDICIONAL: ANTECEDENTES (Seguimiento o posterior) */}
        {['SEGUIMIENTO', 'ENVIADA_A_CONCLUIR', 'CONCLUIDA'].includes((investigacion as any).estatus?.toUpperCase() || '') && (
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <FiClock style={{ marginRight: '10px' }} />
              Antecedentes
            </h2>
            <div className="admin-form-group">
              <div className="admin-input-with-icon">
                <i className="fas fa-history" style={{ top: '15px' }}></i>
                <textarea
                  value={investigacion.antecedentes || 'Sin antecedentes registrados.'}
                  readOnly
                  className="admin-readonly-field admin-textarea"
                  rows={4}
                />
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 6: PERSONAS INVOLUCRADAS */}
        <section className="admin-form-section">
          <h2 className="admin-section-title">
            <i className="fas fa-users"></i>
            Personas Involucradas
          </h2>

          <div className="admin-personas-section">
            <h3>Reportantes</h3>
            {renderPersonas(investigacion.reportantes || [], 'reportantes')}
          </div>

          <div className="admin-personas-section">
            <h3>Personal Reportado</h3>
            {renderPersonas(investigacion.involucrados || [], 'involucrados')}
          </div>

        </section>

        {/* SECCIÓN CONDICIONAL: RESOLUCIÓN FINAL (Solo concluidas) */}
        {(investigacion as any).estatus?.toUpperCase() === 'CONCLUIDA' && (
          <section className="admin-form-section" style={{ borderLeft: '5px solid #28a745' }}>
            <h2 className="admin-section-title" style={{ color: '#28a745' }}>
              <FiCheckCircle style={{ marginRight: '10px' }} />
              Resolución Final
            </h2>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Conducta Definitiva</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-gavel"></i>
                  <input
                    type="text"
                    value={(investigacion as any).conducta_definitiva || 'No registrada'}
                    readOnly
                    className="admin-readonly-field"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Sanción Definitiva</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-balance-scale"></i>
                  <input
                    type="text"
                    value={(investigacion as any).sancion_definitiva || 'No registrada'}
                    readOnly
                    className="admin-readonly-field"
                  />
                </div>
              </div>
            </div>

            {(investigacion as any).dias_suspension && (
              <div className="admin-form-group">
                <label>Días de Suspensión</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-calendar-times"></i>
                  <input
                    type="text"
                    value={(investigacion as any).dias_suspension}
                    readOnly
                    className="admin-readonly-field"
                  />
                </div>
              </div>
            )}

            <div className="admin-form-group" style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <strong style={{ minWidth: '150px' }}>¿Reconsideración?</strong>
                <span className={`admin-badge ${(investigacion as any).reconsideracion ? 'admin-badge-warning' : 'admin-badge-secondary'}`}>
                  {(investigacion as any).reconsideracion ? 'SÍ' : 'NO'}
                </span>
              </div>
              {(investigacion as any).reconsideracion && (investigacion as any).ficha_reconsideracion && (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px' }}>
                  <strong style={{ minWidth: '150px' }}>Autorizó (Ficha):</strong>
                  <span>{(investigacion as any).ficha_reconsideracion}</span>
                </div>
              )}
            </div>

          </section>
        )}

        {/* SECCIÓN 7: EXPEDIENTE DIGITAL */}
        {documentos.length > 0 && (
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <FiPaperclip />
              Expediente Digital
            </h2>
            {/* ... (Existing Documents Code) ... */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '600px',
              overflowY: 'auto',
              paddingRight: '10px'
            }}>
              {documentos.map(doc => (
                <div key={doc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  background: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  gap: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '80px'
                  }}>
                    <FiFileText style={{
                      fontSize: '24px',
                      color: doc.tipo === 'Reporte' ? '#3b82f6' :
                        doc.tipo === 'Citatorio' ? '#8b5cf6' :
                          doc.tipo === 'Acta' ? '#10b981' :
                            doc.tipo === 'Dictamen' ? '#f59e0b' : '#666'
                    }} />
                    <span style={{
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {doc.tipo}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '5px'
                    }}>
                      <h4 style={{ margin: '0', color: '#333', fontSize: '15px', fontWeight: '600' }}>
                        {doc.descripcion || doc.tipo}
                      </h4>
                      <span style={{ color: '#666', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {formatDate(doc.uploaded_at?.split('T')[0])}
                      </span>
                    </div>
                    <p style={{
                      margin: '0',
                      color: '#666',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {doc.nombre_archivo}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                      }}
                      title="Ver"
                    >
                      <FiEye />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                      }}
                      title="Descargar"
                    >
                      <FiDownload />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="admin-form-actions">

          <ButtonIcon
            variant="view"
            to={backPath}
            icon={<FaArrowLeft />}
            text="Volver a la lista"
            size="medium"
          />

          <ButtonIcon
            variant="edit"
            to={`/investigaciones/editar/${id}`}
            icon={<FiEdit />}
            title="Editar"
            text="Editar Investigación"
            size="medium"
          />

        </div>
      </div>

    </div>
  );
}

export default InvestigacionDetailsPage;