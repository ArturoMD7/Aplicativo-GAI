import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionFormState, OpcionesDropdowns } from '../types/investigacion.types';
import '../styles/InvestigacionForm.css';

// Estado inicial para un formulario vacío
const initialState: InvestigacionFormState = {
  nombre_corto: '',
  descripcion_general: '',
  direccion: '',
  procedencia: '',
  regimen: '',
  sindicato: null,
  centro: '',
  area_depto: '',
  gravedad: '',
  fecha_reporte: new Date().toISOString().split('T')[0], // Hoy
  fecha_conocimiento_hechos: '',
  economica: false,
  gerencia_responsable: '',
  lugar: '',
  observaciones: '',
  fecha_evento: '',
  centro_trabajo: '',
  antecedentes: '',
  contactos: [],
  investigadores: [],
  involucrados: [],
  testigos: [],
};

function InvestigacionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  const [formState, setFormState] = useState<InvestigacionFormState>(initialState);
  const [opciones, setOpciones] = useState<OpcionesDropdowns | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Cargar datos ---
  useEffect(() => {
    const fetchOpciones = async () => {
      try {
        const response = await apiClient.get('/api/investigaciones/opciones/');
        setOpciones(response.data);
      } catch (err) {
        setError('No se pudieron cargar las opciones del formulario.');
      }
    };

    const fetchInvestigacion = async (investigacionId: string) => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/investigaciones/${investigacionId}/`);
        setFormState(response.data); 
      } catch (err) {
        setError('No se pudo cargar la investigación.');
      } finally {
        setLoading(false);
      }
    };

    fetchOpciones();
    if (id) {
      setIsEditMode(true);
      fetchInvestigacion(id);
    }
  }, [id]);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // Convertir a boolean si es checkbox
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      processedValue = e.target.checked;
    }
    
    // Manejar Sindicato (se esconde/muestra)
    if (name === 'regimen') {
      setFormState(prev => ({
        ...prev,
        regimen: value,
        sindicato: (value === 'Sindicalizado' || value === 'Ambos') ? prev.sindicato : null
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar datos antes de enviar
      const dataToSubmit = {
        ...formState,
        // Asegurar que los campos requeridos tengan valores
        lugar: formState.lugar || 'Por definir',
        centro_trabajo: formState.centro_trabajo || 'Por definir',
        fecha_evento: formState.fecha_evento || formState.fecha_conocimiento_hechos,
        observaciones: formState.observaciones || 'Sin observaciones',
        antecedentes: formState.antecedentes || 'Sin antecedentes',
      };

      if (isEditMode) {
        await apiClient.put(`/api/investigaciones/${id}/`, dataToSubmit);
        setSuccess('Investigación actualizada exitosamente.');
      } else {
        await apiClient.post('/api/investigaciones/', dataToSubmit);
        setSuccess('Investigación creada exitosamente. Redirigiendo...');
      }
      
      setTimeout(() => navigate('/investigaciones'), 1500);

    } catch (err: any) {
      console.error('Error completo:', err.response?.data);
      
      // Mostrar errores específicos de validación
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              const fieldName = field.replace(/_/g, ' ');
              return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            })
            .join('\n');
          setError(`Errores de validación:\n${errorMessages}`);
        } else {
          setError(`Error: ${errorData || 'Datos inválidos'}`);
        }
      } else {
        setError('Error al guardar: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!opciones && !isEditMode) return <div>Cargando formulario...</div>;
  if (loading) return <div>Guardando...</div>;

  return (
    <div className="form-page">
      <h2>{isEditMode ? 'Editar' : 'Crear'} Registro de Investigación</h2>
      <form onSubmit={handleSubmit} className="investigacion-form">
        
        {error && (
          <div className="form-error">
            <strong>Errores encontrados:</strong>
            <pre>{error}</pre>
          </div>
        )}
        {success && <div className="form-success">{success}</div>}

        {/* --- SECCIÓN 1: REGISTRO DE INVESTIGACIÓN --- */}
        <fieldset>
          <legend>Sección 1: Registro de Investigación</legend>
          
          <div className="form-group">
            <label>Nombre Corto *</label>
            <input 
              type="text" 
              name="nombre_corto" 
              value={formState.nombre_corto} 
              onChange={handleChange} 
              required 
              maxLength={50}
              placeholder="Máximo 50 caracteres"
            />
          </div>
          
          <div className="form-group">
            <label>Descripción General *</label>
            <textarea 
              name="descripcion_general" 
              value={formState.descripcion_general} 
              onChange={handleChange} 
              required
              maxLength={140}
              placeholder="Máximo 140 caracteres"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dirección *</label>
              <select name="direccion" value={formState.direccion} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {opciones?.direcciones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Procedencia *</label>
              <select name="procedencia" value={formState.procedencia} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {opciones?.procedencias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Régimen *</label>
              <select name="regimen" value={formState.regimen} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {opciones?.regimenes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            
            {(formState.regimen === 'Sindicalizado' || formState.regimen === 'Ambos') && (
              <div className="form-group">
                <label>Sindicato *</label>
                <select name="sindicato" value={formState.sindicato || ''} onChange={handleChange} required>
                  <option value="">Seleccione...</option>
                  {opciones?.sindicatos.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Centro (CODUNI)</label>
              <input 
                type="text" 
                name="centro" 
                value={formState.centro} 
                onChange={handleChange} 
                placeholder="Centro de trabajo"
              />
            </div>
            <div className="form-group">
              <label>Área/Depto (CODUNI)</label>
              <input 
                type="text" 
                name="area_depto" 
                value={formState.area_depto} 
                onChange={handleChange} 
                placeholder="Área o departamento"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Gravedad *</label>
            <select name="gravedad" value={formState.gravedad} onChange={handleChange} required>
              <option value="">Seleccione...</option>
              {opciones?.gravedades.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </fieldset>

        {/* --- SECCIÓN 2: CONOCIMIENTO DE HECHOS --- */}
        <fieldset>
          <legend>Sección 2: Conocimiento de Hechos</legend>
          
          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Reporte *</label>
              <input 
                type="date" 
                name="fecha_reporte" 
                value={formState.fecha_reporte} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Fecha Conocimiento de Hechos *</label>
              <input 
                type="date" 
                name="fecha_conocimiento_hechos" 
                value={formState.fecha_conocimiento_hechos} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="form-group form-check">
            <input 
              type="checkbox" 
              name="economica" 
              checked={formState.economica} 
              onChange={handleChange} 
              id="economica_check" 
            />
            <label htmlFor="economica_check">¿Implica repercusión económica?</label>
          </div>
        </fieldset>
        
        {/* --- SECCIÓN 3: GERENCIA RESPONSABLE --- */}
        <fieldset>
          <legend>Sección 3: Gerencia Responsable</legend>
          <div className="form-group">
            <label>Gerencia Responsable *</label>
            <select name="gerencia_responsable" value={formState.gerencia_responsable} onChange={handleChange} required>
              <option value="">Seleccione...</option>
              {opciones?.gerencias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </fieldset>

        {/* --- SECCIÓN 4: EVENTO --- */}
        <fieldset>
          <legend>Sección 4: Evento</legend>
          
          <div className="form-row">
            <div className="form-group">
              <label>Lugar del Evento *</label>
              <input 
                type="text" 
                name="lugar" 
                value={formState.lugar} 
                onChange={handleChange} 
                required
                maxLength={50}
                placeholder="Lugar donde ocurrió el evento"
              />
            </div>
            
            <div className="form-group">
              <label>Fecha del Evento *</label>
              <input 
                type="date" 
                name="fecha_evento" 
                value={formState.fecha_evento} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Centro de Trabajo *</label>
            <input 
              type="text" 
              name="centro_trabajo" 
              value={formState.centro_trabajo} 
              onChange={handleChange} 
              required
              maxLength={100}
              placeholder="Centro de trabajo donde ocurrió el evento"
            />
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea 
              name="observaciones" 
              value={formState.observaciones} 
              onChange={handleChange} 
              maxLength={140}
              placeholder="Observaciones generales (máximo 140 caracteres)"
            />
          </div>

          <div className="form-group">
            <label>Antecedentes</label>
            <textarea 
              name="antecedentes" 
              value={formState.antecedentes} 
              onChange={handleChange} 
              maxLength={150}
              placeholder="Antecedentes del evento (máximo 150 caracteres)"
            />
          </div>
        </fieldset>

        {/* --- SECCIÓN DE RELACIONES (Para futura implementación) --- */}
        <fieldset className="relations-section">
          <legend>Información de Personas Involucradas</legend>
          
        </fieldset>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/investigaciones')} className="btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="btn-submit-form" disabled={loading}>
            {isEditMode ? 'Actualizar' : 'Guardar'} Investigación
          </button>
        </div>
      </form>
    </div>
  );
}

export default InvestigacionFormPage;