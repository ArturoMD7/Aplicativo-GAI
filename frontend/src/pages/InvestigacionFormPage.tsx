import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { 
  InvestigacionFormState, 
  OpcionesDropdowns, 
  Contacto, 
  Investigador, 
  Involucrado, 
  Testigo,
  EmpleadoBuscado 
} from '../types/investigacion.types';
import '../styles/InvestigacionForm.css';

// Estado inicial actualizado
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
  numero_reporte: '', 
  fecha_reporte: new Date().toISOString().split('T')[0],
  fecha_conocimiento_hechos: '',
  fecha_prescripcion: '',
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

// Interfaces para formularios temporales
interface ContactoForm {
  ficha: string;
  nombre: string;
  categoria: string;
  puesto: string;
  extension: string;
  email: string;
  tipo: 'contacto' | 'responsable';
}

interface InvestigadorForm {
  ficha: string;
  nombre: string;
  categoria: string;
  puesto: string;
  extension: string;
  email: string;
}

interface InvolucradoForm {
  ficha: string;
  nombre: string;
  nivel: string;
  categoria: string;
  puesto: string;
  edad: number;
  antiguedad: number;
  rfc: string;
  curp: string;
  direccion: string;
}

interface TestigoForm {
  ficha: string;
  nombre: string;
  nivel: string;
  categoria: string;
  puesto: string;
  direccion: string;
  subordinacion: boolean;
}

// Tipo para los arrays de personas en el estado
type TipoPersona = 'contactos' | 'investigadores' | 'involucrados' | 'testigos';

function InvestigacionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  const [formState, setFormState] = useState<InvestigacionFormState>(initialState);
  const [opciones, setOpciones] = useState<OpcionesDropdowns | null>(null);
  const [centrosTrabajo, setCentrosTrabajo] = useState<string[]>([]);
  const [centrosCoduni, setCentrosCoduni] = useState<string[]>([]);
  const [areasCoduni, setAreasCoduni] = useState<string[]>([]);
  
  // Estados para las secciones de personas
  const [contactoActual, setContactoActual] = useState<ContactoForm>({
    ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', tipo: 'contacto'
  });
  const [investigadorActual, setInvestigadorActual] = useState<InvestigadorForm>({
    ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: ''
  });
  const [involucradoActual, setInvolucradoActual] = useState<InvolucradoForm>({
    ficha: '', nombre: '', nivel: '', categoria: '', puesto: '', 
    edad: 0, antiguedad: 0, rfc: '', curp: '', direccion: ''
  });
  const [testigoActual, setTestigoActual] = useState<TestigoForm>({
    ficha: '', nombre: '', nivel: '', categoria: '', puesto: '', 
    direccion: '', subordinacion: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Cargar datos ---
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        const [opcionesRes, centrosTrabajoRes, centrosCoduniRes] = await Promise.all([
          apiClient.get('/api/investigaciones/opciones/'),
          apiClient.get('/api/investigaciones/centros-trabajo/'),
          apiClient.get('/api/investigaciones/centros-coduni/')
        ]);
        
        setOpciones(opcionesRes.data);
        setCentrosTrabajo(centrosTrabajoRes.data);
        setCentrosCoduni(centrosCoduniRes.data);
      } catch (err) {
        setError('No se pudieron cargar los datos iniciales.');
      }
    };

    const fetchInvestigacion = async (investigacionId: string) => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/investigaciones/investigaciones/${investigacionId}/`);
        setFormState(response.data);
      } catch (err) {
        setError('No se pudo cargar la investigación.');
      } finally {
        setLoading(false);
      }
    };

    fetchDatosIniciales();
    if (id) {
      setIsEditMode(true);
      fetchInvestigacion(id);
    }
  }, [id]);

  // --- Handlers para el formulario principal ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      processedValue = e.target.checked;
    }
    
    if (name === 'regimen') {
      setFormState(prev => ({
        ...prev,
        regimen: value,
        sindicato: (value === 'Sindicalizado' || value === 'Ambos') ? prev.sindicato : null
      }));
    } else if (name === 'centro') {
      // Cuando cambia el centro, cargar las áreas correspondientes
      setFormState(prev => ({ ...prev, centro: value, area_depto: '' }));
      cargarAreasPorCentro(value);
    } else {
      setFormState(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const cargarAreasPorCentro = async (centro: string) => {
    if (!centro) return;
    try {
      const response = await apiClient.get(`/api/investigaciones/areas-por-centro/?centro=${encodeURIComponent(centro)}`);
      setAreasCoduni(response.data);
    } catch (err) {
      console.error('Error al cargar áreas:', err);
    }
  };

  // --- Handlers para búsqueda de empleados ---
  const buscarEmpleado = async (ficha: string, tipo: 'contacto' | 'investigador' | 'involucrado' | 'testigo') => {
    if (!ficha.trim()) return;

    try {
      const response = await apiClient.get(`/api/investigaciones/buscar-empleado/?ficha=${ficha}`);
      const empleado: EmpleadoBuscado = response.data;

      switch (tipo) {
        case 'contacto':
          setContactoActual(prev => ({
            ...prev,
            nombre: empleado.nombre,
            categoria: empleado.categoria,
            puesto: empleado.puesto
          }));
          break;
        case 'investigador':
          setInvestigadorActual(prev => ({
            ...prev,
            nombre: empleado.nombre,
            categoria: empleado.categoria,
            puesto: empleado.puesto
          }));
          break;
        case 'involucrado':
          setInvolucradoActual(prev => ({
            ...prev,
            nombre: empleado.nombre,
            nivel: empleado.nivel,
            categoria: empleado.categoria,
            puesto: empleado.puesto,
            edad: empleado.edad,
            antiguedad: empleado.antiguedad,
            rfc: empleado.rfc,
            curp: empleado.curp,
            direccion: empleado.direccion
          }));
          break;
        case 'testigo':
          setTestigoActual(prev => ({
            ...prev,
            nombre: empleado.nombre,
            nivel: empleado.nivel,
            categoria: empleado.categoria,
            puesto: empleado.puesto,
            direccion: empleado.direccion
          }));
          break;
      }
    } catch (err: any) {
      alert(`Error al buscar empleado: ${err.response?.data?.error || 'Empleado no encontrado'}`);
    }
  };

  // --- Handlers para agregar personas ---
  const agregarContacto = () => {
    if (!contactoActual.ficha || !contactoActual.nombre) {
      alert('Complete la ficha y busque el empleado antes de agregar');
      return;
    }

    setFormState(prev => ({
      ...prev,
      contactos: [...prev.contactos, { ...contactoActual }]
    }));

    setContactoActual({
      ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', tipo: 'contacto'
    });
  };

  const agregarInvestigador = () => {
    if (!investigadorActual.ficha || !investigadorActual.nombre) {
      alert('Complete la ficha y busque el empleado antes de agregar');
      return;
    }

    setFormState(prev => ({
      ...prev,
      investigadores: [...prev.investigadores, { ...investigadorActual }]
    }));

    setInvestigadorActual({
      ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: ''
    });
  };

  const agregarInvolucrado = () => {
    if (!involucradoActual.ficha || !involucradoActual.nombre) {
      alert('Complete la ficha y busque el empleado antes de agregar');
      return;
    }

    setFormState(prev => ({
      ...prev,
      involucrados: [...prev.involucrados, { ...involucradoActual }]
    }));

    setInvolucradoActual({
      ficha: '', nombre: '', nivel: '', categoria: '', puesto: '', 
      edad: 0, antiguedad: 0, rfc: '', curp: '', direccion: ''
    });
  };

  const agregarTestigo = () => {
    if (!testigoActual.ficha || !testigoActual.nombre) {
      alert('Complete la ficha y busque el empleado antes de agregar');
      return;
    }

    setFormState(prev => ({
      ...prev,
      testigos: [...prev.testigos, { ...testigoActual }]
    }));

    setTestigoActual({
      ficha: '', nombre: '', nivel: '', categoria: '', puesto: '', 
      direccion: '', subordinacion: false
    });
  };

  // --- Handler para eliminar personas ---
  const eliminarPersona = (tipo: TipoPersona, index: number) => {
    setFormState(prev => ({
      ...prev,
      [tipo]: prev[tipo].filter((_: any, i: number) => i !== index)
    }));
  };

  // --- Handler para enviar formulario ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...formState,
        lugar: formState.lugar || 'Por definir',
        centro_trabajo: formState.centro_trabajo || 'Por definir',
        fecha_evento: formState.fecha_evento || formState.fecha_conocimiento_hechos,
        observaciones: formState.observaciones || 'Sin observaciones',
        antecedentes: formState.antecedentes || 'Sin antecedentes',
      };

      if (isEditMode) {
      await apiClient.put(`/api/investigaciones/investigaciones/${id}/`, dataToSubmit);
      setSuccess('Investigación actualizada exitosamente.');
    } else {
      await apiClient.post('/api/investigaciones/investigaciones/', dataToSubmit);
      setSuccess('Investigación creada exitosamente. Redirigiendo...');
    }
      
      setTimeout(() => navigate('/investigaciones'), 1500);

    } catch (err: any) {
      console.error('Error completo:', err.response?.data);
      
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
              <label>Centro de Trabajo *</label>
              <input 
                type="text"
                name="centro"
                value={formState.centro}
                onChange={handleChange}
                list="centros-coduni"
                required
                maxLength={100}
                placeholder="Escriba o seleccione el centro (CODUNI)"
              />
              <datalist id="centros-coduni">
                {centrosCoduni.map(centro => (
                  <option key={centro} value={centro} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>Área/Departamento*</label>
              <select name="area_depto" value={formState.area_depto} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {areasCoduni.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
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
            
            <div className="form-group">
              <label>Fecha Prescripción</label>
              <input 
                type="date" 
                name="fecha_prescripcion" 
                value={formState.fecha_prescripcion} 
                readOnly
                className="readonly-field"
              />
              <small>Calculada automáticamente (30 días después del conocimiento)</small>
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

          {/* Contacto */}
          <div className="persona-section">
            <h4>Contacto</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Ficha</label>
                <input 
                  type="text" 
                  value={contactoActual.ficha}
                  onChange={(e) => setContactoActual(prev => ({ ...prev, ficha: e.target.value }))}
                  placeholder="Ingrese ficha"
                />
              </div>
              <button 
                type="button" 
                onClick={() => buscarEmpleado(contactoActual.ficha, 'contacto')}
                className="btn-buscar"
              >
                Buscar
              </button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={contactoActual.nombre} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input type="text" value={contactoActual.categoria} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Puesto</label>
                <input type="text" value={contactoActual.puesto} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Extensión</label>
                <input 
                  type="text" 
                  value={contactoActual.extension}
                  onChange={(e) => setContactoActual(prev => ({ ...prev, extension: e.target.value }))}
                  placeholder="Extensión"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={contactoActual.email}
                onChange={(e) => setContactoActual(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Correo electrónico"
              />
            </div>
            
            <div className="form-group">
              <label>Tipo</label>
              <select 
                value={contactoActual.tipo}
                onChange={(e) => setContactoActual(prev => ({ ...prev, tipo: e.target.value as 'contacto' | 'responsable' }))}
              >
                <option value="contacto">Contacto</option>
                <option value="responsable">Responsable</option>
              </select>
            </div>
            
            <button type="button" onClick={agregarContacto} className="btn-agregar">
              Agregar Contacto
            </button>

            {/* Lista de contactos agregados */}
            {formState.contactos.length > 0 && (
              <div className="lista-personas">
                <h5>Contactos Agregados:</h5>
                {formState.contactos.map((contacto, index) => (
                  <div key={index} className="persona-item">
                    <span>{contacto.nombre} ({contacto.ficha}) - {contacto.tipo}</span>
                    <button 
                      type="button" 
                      onClick={() => eliminarPersona('contactos', index)}
                      className="btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investigadores */}
          <div className="persona-section">
            <h4>Investigadores</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Ficha</label>
                <input 
                  type="text" 
                  value={investigadorActual.ficha}
                  onChange={(e) => setInvestigadorActual(prev => ({ ...prev, ficha: e.target.value }))}
                  placeholder="Ingrese ficha"
                />
              </div>
              <button 
                type="button" 
                onClick={() => buscarEmpleado(investigadorActual.ficha, 'investigador')}
                className="btn-buscar"
              >
                Buscar
              </button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={investigadorActual.nombre} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input type="text" value={investigadorActual.categoria} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Puesto</label>
                <input type="text" value={investigadorActual.puesto} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Extensión</label>
                <input 
                  type="text" 
                  value={investigadorActual.extension}
                  onChange={(e) => setInvestigadorActual(prev => ({ ...prev, extension: e.target.value }))}
                  placeholder="Extensión"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={investigadorActual.email}
                onChange={(e) => setInvestigadorActual(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Correo electrónico"
              />
            </div>
            
            <button type="button" onClick={agregarInvestigador} className="btn-agregar">
              Agregar Investigador
            </button>

            {/* Lista de investigadores agregados */}
            {formState.investigadores.length > 0 && (
              <div className="lista-personas">
                <h5>Investigadores Agregados:</h5>
                {formState.investigadores.map((investigador, index) => (
                  <div key={index} className="persona-item">
                    <span>{investigador.nombre} ({investigador.ficha})</span>
                    <button 
                      type="button" 
                      onClick={() => eliminarPersona('investigadores', index)}
                      className="btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              list="centros-trabajo"
              required
              maxLength={100}
              placeholder="Escriba o seleccione el centro de trabajo"
            />
            <datalist id="centros-trabajo">
              {centrosTrabajo.map(centro => (
                <option key={centro} value={centro} />
              ))}
            </datalist>
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

          {/* Involucrados */}
          <div className="persona-section">
            <h4>Involucrados</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Ficha</label>
                <input 
                  type="text" 
                  value={involucradoActual.ficha}
                  onChange={(e) => setInvolucradoActual(prev => ({ ...prev, ficha: e.target.value }))}
                  placeholder="Ingrese ficha"
                />
              </div>
              <button 
                type="button" 
                onClick={() => buscarEmpleado(involucradoActual.ficha, 'involucrado')}
                className="btn-buscar"
              >
                Buscar
              </button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={involucradoActual.nombre} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Nivel</label>
                <input type="text" value={involucradoActual.nivel} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <input type="text" value={involucradoActual.categoria} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Puesto</label>
                <input type="text" value={involucradoActual.puesto} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Edad</label>
                <input type="number" value={involucradoActual.edad} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Antigüedad</label>
                <input type="number" value={involucradoActual.antiguedad} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>RFC</label>
                <input type="text" value={involucradoActual.rfc} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>CURP</label>
                <input type="text" value={involucradoActual.curp} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Dirección</label>
              <input type="text" value={involucradoActual.direccion} readOnly className="readonly-field" />
            </div>
            
            <button type="button" onClick={agregarInvolucrado} className="btn-agregar">
              Agregar Involucrado
            </button>

            {/* Lista de involucrados agregados */}
            {formState.involucrados.length > 0 && (
              <div className="lista-personas">
                <h5>Involucrados Agregados:</h5>
                {formState.involucrados.map((involucrado, index) => (
                  <div key={index} className="persona-item">
                    <span>{involucrado.nombre} ({involucrado.ficha})</span>
                    <button 
                      type="button" 
                      onClick={() => eliminarPersona('involucrados', index)}
                      className="btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testigos */}
          <div className="persona-section">
            <h4>Testigos</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Ficha</label>
                <input 
                  type="text" 
                  value={testigoActual.ficha}
                  onChange={(e) => setTestigoActual(prev => ({ ...prev, ficha: e.target.value }))}
                  placeholder="Ingrese ficha"
                />
              </div>
              <button 
                type="button" 
                onClick={() => buscarEmpleado(testigoActual.ficha, 'testigo')}
                className="btn-buscar"
              >
                Buscar
              </button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={testigoActual.nombre} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Nivel</label>
                <input type="text" value={testigoActual.nivel} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <input type="text" value={testigoActual.categoria} readOnly className="readonly-field" />
              </div>
              <div className="form-group">
                <label>Puesto</label>
                <input type="text" value={testigoActual.puesto} readOnly className="readonly-field" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Dirección</label>
              <input type="text" value={testigoActual.direccion} readOnly className="readonly-field" />
            </div>
            
            <div className="form-group form-check">
              <input 
                type="checkbox" 
                checked={testigoActual.subordinacion}
                onChange={(e) => setTestigoActual(prev => ({ ...prev, subordinacion: e.target.checked }))}
                id="subordinacion_check" 
              />
              <label htmlFor="subordinacion_check">Subordinación</label>
            </div>
            
            <button type="button" onClick={agregarTestigo} className="btn-agregar">
              Agregar Testigo
            </button>

            {/* Lista de testigos agregados */}
            {formState.testigos.length > 0 && (
              <div className="lista-personas">
                <h5>Testigos Agregados:</h5>
                {formState.testigos.map((testigo, index) => (
                  <div key={index} className="persona-item">
                    <span>{testigo.nombre} ({testigo.ficha}) {testigo.subordinacion ? '(Subordinación)' : ''}</span>
                    <button 
                      type="button" 
                      onClick={() => eliminarPersona('testigos', index)}
                      className="btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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