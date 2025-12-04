import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apliClient';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import type { InvestigacionFormState } from '../types/investigacion.types';
import { FiEdit } from 'react-icons/fi';
import { FaArrowLeft } from "react-icons/fa";
import '../styles/InvestigacionaDetails.css';

function InvestigacionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [investigacion, setInvestigacion] = useState<InvestigacionFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvestigacion = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/investigaciones/investigaciones/${id}/`);
        setInvestigacion(response.data);
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

              {persona.subordinacion !== undefined && (
                <div className="admin-detail-row">
                  <span className="admin-label">Subordinación:</span>
                  <span className={`admin-badge ${persona.subordinacion ? 'admin-badge-warning' : 'admin-badge-secondary'}`}>
                    {persona.subordinacion ? 'Sí' : 'No'}
                  </span>
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

      <div className="admin-register-form-container">

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
            <label>Descripción General</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-file-alt"></i>
              <textarea
                value={investigacion.descripcion_general}
                readOnly
                className="admin-readonly-field admin-textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Gravedad</label>
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

        {/* SECCIÓN 2: UBICACIÓN ORGANIZACIONAL */}
        <section className="admin-form-section">
          <h2 className="admin-section-title">
            <i className="fas fa-building"></i>
            Ubicación Organizacional
          </h2>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Dirección</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-sitemap"></i>
                <input
                  type="text"
                  value={investigacion.direccion}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Centro</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-industry"></i>
                <input
                  type="text"
                  value={investigacion.centro}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Área/Departamento</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-layer-group"></i>
                <input
                  type="text"
                  value={investigacion.area_depto}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Régimen</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-users"></i>
                <input
                  type="text"
                  value={investigacion.regimen}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>
          </div>

          {investigacion.sindicato && (
            <div className="admin-form-group">
              <label>Sindicato</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-handshake"></i>
                <input
                  type="text"
                  value={investigacion.sindicato}
                  readOnly
                  className="admin-readonly-field"
                />
              </div>
            </div>
          )}
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

          <div className="admin-personas-section">
            <h3>Contactos</h3>
            {renderPersonas(investigacion.contactos || [], 'contactos')}
          </div>

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

          <div className="admin-form-group">
            <label>Antecedentes</label>
            <div className="admin-input-with-icon">
              <i className="fas fa-history"></i>
              <textarea
                value={investigacion.antecedentes || 'Sin antecedentes'}
                readOnly
                className="admin-readonly-field admin-textarea"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* SECCIÓN 6: PERSONAS INVOLUCRADAS */}
        <section className="admin-form-section">
          <h2 className="admin-section-title">
            <i className="fas fa-users"></i>
            Personas Involucradas
          </h2>

          <div className="admin-personas-section">
            <h3>Involucrados</h3>
            {renderPersonas(investigacion.involucrados || [], 'involucrados')}
          </div>

          <div className="admin-personas-section">
            <h3>Testigos</h3>
            {renderPersonas(investigacion.testigos || [], 'testigos')}
          </div>
        </section>

        <div className="admin-form-actions">

          <ButtonIcon
            variant="view"
            to="/investigaciones"
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