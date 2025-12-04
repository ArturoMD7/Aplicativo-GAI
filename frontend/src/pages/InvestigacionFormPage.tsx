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
import '../styles/InvestigacionaDetails.css';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import { FiEdit } from 'react-icons/fi';
import { FaArrowLeft } from "react-icons/fa";

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
  no_constancia: string;
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
    ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', no_constancia: ''
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

  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (!isEditMode) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 0) {
            clearInterval(timer);
            handleTimeout();
            return 0;
          }

          // Mostrar advertencia cuando queden 2 minutos
          if (prevTime === 2 * 60) {
            setShowTimeoutWarning(true);
          }

          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isEditMode]);

  // Función para manejar el timeout
  const handleTimeout = () => {
    setShowTimeoutWarning(false);
    setIsTimeUp(true);
    setError('El tiempo para completar el formulario ha expirado. No puedes guardar esta investigación.');
  };

  // Función para formatear el tiempo (mm:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const [antecedentesEncontrados, setAntecedentesEncontrados] = useState<any[]>([]);

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

  useEffect(() => {
    if (isEditMode && formState.centro) {
      cargarAreasPorCentro(formState.centro);
    }
  }, [isEditMode, formState.centro]);

  /*
  useEffect(() => {
    if (formState.fecha_conocimiento_hechos) {
      const calcularFechaPrescripcion = () => {
        const fechaConocimiento = new Date(formState.fecha_conocimiento_hechos);
        const fechaPrescripcion = new Date(fechaConocimiento);
        fechaPrescripcion.setDate(fechaPrescripcion.getDate() + 30);

        setFormState(prev => ({
          ...prev,
          fecha_prescripcion: fechaPrescripcion.toISOString().split('T')[0]
        }));
      };

      calcularFechaPrescripcion();
    }
  }, [formState.fecha_conocimiento_hechos]);
 */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Prevenir edición manual de fecha_prescripcion
    if (name === 'fecha_prescripcion') {
      return;
    }

    let processedValue: any = value;

    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      processedValue = e.target.checked;
    }

    // LÓGICA MODIFICADA
    if (name === 'regimen') {
      setFormState(prev => ({
        ...prev,
        regimen: value,
        sindicato: (value === 'Sindicalizado' || value === 'Ambos') ? prev.sindicato : null
      }));
    }
    else if (name === 'centro') {
      setFormState(prev => ({ ...prev, centro: value, area_depto: '' }));
      cargarAreasPorCentro(value);
    }
    else if (name === 'fecha_conocimiento_hechos') {
      let nuevaFechaPrescripcion = formState.fecha_prescripcion;

      if (value) {
        const fechaConocimiento = new Date(value + 'T12:00:00');
        const fechaCalc = new Date(fechaConocimiento);

        fechaCalc.setDate(fechaCalc.getDate() + 30);

        nuevaFechaPrescripcion = fechaCalc.toISOString().split('T')[0];
      }

      setFormState(prev => ({
        ...prev,
        [name]: processedValue,
        fecha_prescripcion: nuevaFechaPrescripcion
      }));
    }
    else {
      setFormState(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const cargarAreasPorCentro = async (centro: string) => {
    if (!centro) {
      setAreasCoduni([]);
      return;
    }

    try {
      const response = await apiClient.get(`/api/investigaciones/areas-por-centro/?centro=${encodeURIComponent(centro)}`);
      setAreasCoduni(response.data);
    } catch (err) {
      console.error('Error al cargar áreas:', err);
      setAreasCoduni([]);
    }
  };

  // --- Handlers para búsqueda de empleados ---
  const buscarEmpleado = async (ficha: string, tipo: 'contacto' | 'investigador' | 'involucrado' | 'testigo') => {
    if (!ficha.trim()) return;

    setAntecedentesEncontrados([]);

    try {
      const response = await apiClient.get(`/api/investigaciones/buscar-empleado/?ficha=${ficha}`);
      const empleado: EmpleadoBuscado = response.data;

      if (empleado.antecedentes && empleado.antecedentes.length > 0) {
        setAntecedentesEncontrados(empleado.antecedentes);
      }

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
      ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', no_constancia: ''
    });
  };

  const agregarInvolucrado = () => {
    if (!involucradoActual.ficha || !involucradoActual.nombre) {
      alert('Complete la ficha y busque el empleado antes de agregar');
      return;
    }

    setFormState(prev => ({
      ...prev,
      involucrados: [...prev.involucrados, {
        ...involucradoActual,
        tiene_antecedentes: antecedentesEncontrados.length > 0,
        antecedentes_detalles: [...antecedentesEncontrados]
      }]
    }));

    setInvolucradoActual({
      ficha: '', nombre: '', nivel: '', categoria: '', puesto: '',
      edad: 0, antiguedad: 0, rfc: '', curp: '', direccion: '',
    });
    setAntecedentesEncontrados([]);
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

    if (isTimeUp && !isEditMode) {
      setError('El tiempo para completar el formulario ha expirado. No puedes guardar esta investigación.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const hoy = new Date().toISOString().split('T')[0];
    if (formState.fecha_conocimiento_hechos > hoy) {
      setLoading(false);
      setError('La fecha de conocimiento de hechos no puede ser posterior a la fecha actual.');
      return;
    }

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

  if (!opciones && !isEditMode) return <div className="admin-register-container">Cargando formulario...</div>;
  if (loading) return <div className="admin-register-container">Guardando...</div>;

  return (
    <div className="admin-register-container">
      <div className="admin-register-header">
        <h1>{isEditMode ? 'Editar' : 'Crear'} Registro de Investigación</h1>
        <p>Complete la información requerida para {isEditMode ? 'actualizar' : 'crear'} el registro</p>

        {!isEditMode && (
          <div className={`time-counter ${timeLeft <= 5 * 60 ? 'time-warning' : ''} ${showTimeoutWarning ? 'time-critical' : ''}`}>
            <div className="time-counter-header">
              <i className="fas fa-clock"></i>
              <span>Tiempo restante: {formatTime(timeLeft)}</span>
            </div>
            {showTimeoutWarning && (
              <div className="timeout-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>¡Atención! Solo quedan 2 minutos para completar el formulario</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="admin-register-form-container">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="admin-alert admin-alert-error">
              <strong>Errores encontrados:</strong>
              <pre>{error}</pre>
            </div>
          )}
          {success && <div className="admin-alert admin-alert-success">{success}</div>}

          {/* --- SECCIÓN 1: INFORMACIÓN GENERAL --- */}
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <i className="fas fa-info-circle"></i>
              Información General
            </h2>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Documento de Origen *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-heading"></i>
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
              </div>

              <div className="admin-form-group">
                <label>Número de Reporte</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-hashtag"></i>
                  <input
                    type="text"
                    value={formState.numero_reporte || 'No asignado'}
                    readOnly
                    className="admin-readonly-field"
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label>Descripción General *</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-heading"></i>
                <input
                  name="descripcion_general"
                  value={formState.descripcion_general}
                  onChange={handleChange}
                  required
                  maxLength={140}
                  placeholder="Máximo 140 caracteres"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Gravedad *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                  <select name="gravedad" value={formState.gravedad} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {opciones?.gravedades.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Procedencia *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-source"></i>
                  <select name="procedencia" value={formState.procedencia} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {opciones?.procedencias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* --- SECCIÓN 2: FECHAS IMPORTANTES --- */}
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <i className="fas fa-calendar-alt"></i>
              Fechas Importantes
            </h2>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Fecha de Reporte *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-file-upload"></i>
                  <input
                    type="date"
                    name="fecha_reporte"
                    value={formState.fecha_reporte}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Fecha Conocimiento de Hechos *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-eye"></i>
                  <input
                    type="date"
                    name="fecha_conocimiento_hechos"
                    value={formState.fecha_conocimiento_hechos}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Fecha del Evento *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-calendar-day"></i>
                  <input
                    type="date"
                    name="fecha_evento"
                    value={formState.fecha_evento}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Fecha de Prescripción</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-clock"></i>
                  <input
                    type="date"
                    name="fecha_prescripcion"
                    value={formState.fecha_prescripcion}
                    readOnly
                    className="admin-readonly-field"
                  />
                </div>
                <small>Calculada automáticamente (30 días después del conocimiento)</small>
              </div>
            </div>

            <div className="admin-form-group">
              <div className="admin-checkbox-container">
                <input
                  type="checkbox"
                  name="economica"
                  checked={formState.economica}
                  onChange={handleChange}
                  id="economica_check"
                />
                <label htmlFor="economica_check">¿Implica repercusión económica?</label>
              </div>
            </div>
          </section>

          {/* --- SECCIÓN 5: INFORMACIÓN DEL EVENTO --- */}
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <i className="fas fa-calendar-check"></i>
              Información del Evento
            </h2>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Lugar de los hechos *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-map-marker-alt"></i>
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
              </div>

              <div className="admin-form-group">
                <label>Centro de Trabajo *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-hard-hat"></i>
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
              </div>
            </div>

            <div className="admin-form-group">
              <label>Observaciones</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-sticky-note"></i>
                <input
                  name="observaciones"
                  value={formState.observaciones}
                  onChange={handleChange}
                  maxLength={140}
                  placeholder="Observaciones generales (máximo 140 caracteres)"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Antecedentes</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-history"></i>
                <input
                  name="antecedentes"
                  value={formState.antecedentes}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="Antecedentes del evento (máximo 150 caracteres)"
                />
              </div>
            </div>
          </section>

          {/* --- SECCIÓN 3: UBICACIÓN ORGANIZACIONAL --- */}
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <i className="fas fa-building"></i>
              Ubicación Organizacional
            </h2>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Dirección *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-sitemap"></i>
                  <select name="direccion" value={formState.direccion} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {opciones?.direcciones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Centro *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-industry"></i>
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
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Área/Departamento *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-layer-group"></i>
                  <select name="area_depto" value={formState.area_depto} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {areasCoduni.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Régimen *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-users"></i>
                  <select name="regimen" value={formState.regimen} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {opciones?.regimenes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {(formState.regimen === 'Sindicalizado' || formState.regimen === 'Ambos') && (
              <div className="admin-form-group">
                <label>Sindicato *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-handshake"></i>
                  <select name="sindicato" value={formState.sindicato || ''} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {opciones?.sindicatos.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="admin-form-group">
              <label>Gerencia Responsable *</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-briefcase"></i>
                <select name="gerencia_responsable" value={formState.gerencia_responsable} onChange={handleChange} required>
                  <option value="">Seleccione...</option>
                  {opciones?.gerencias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </section>



          {/* --- SECCIÓN 4: GERENCIA RESPONSABLE --- */}
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <i className="fas fa-user-tie"></i>
              Gerencia Responsable
            </h2>



            {/* Contactos */}
            <div className="admin-personas-section">
              <h3>Contactos</h3>
              <div className="admin-form-group">
                <label>Ficha</label>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="text"
                    value={contactoActual.ficha}
                    onChange={(e) => setContactoActual(prev => ({ ...prev, ficha: e.target.value }))}
                    placeholder="Ingrese ficha"
                    style={{ flex: 1 }}
                  />

                  <button
                    type="button"
                    onClick={() => buscarEmpleado(contactoActual.ficha, 'contacto')}
                    className="admin-submit-button"
                    style={{
                      marginTop: '3px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      height: '40px',
                      minWidth: '100px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Nombre</label>
                  <input type="text" value={contactoActual.nombre} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Categoría</label>
                  <input type="text" value={contactoActual.categoria} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Puesto</label>
                  <input type="text" value={contactoActual.puesto} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Extensión</label>
                  <input
                    type="text"
                    value={contactoActual.extension}
                    onChange={(e) => setContactoActual(prev => ({ ...prev, extension: e.target.value }))}
                    placeholder="Extensión"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={contactoActual.email}
                  onChange={(e) => setContactoActual(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Correo electrónico"
                />
              </div>

              <div className="admin-form-group">
                <label>Tipo</label>
                <select
                  value={contactoActual.tipo}
                  onChange={(e) => setContactoActual(prev => ({ ...prev, tipo: e.target.value as 'contacto' | 'responsable' }))}
                >
                  <option value="contacto">Contacto</option>
                  <option value="responsable">Responsable</option>
                </select>
              </div>

              <button type="button" onClick={agregarContacto} className="admin-submit-button" style={{ maxWidth: '200px' }}>
                Agregar Contacto
              </button>

              {/* Lista de contactos agregados */}
              {formState.contactos.length > 0 && (
                <div style={{ marginTop: '20px', width: '100%' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333' }}>Contactos Agregados:</h4>

                  <div className="admin-personas-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    {formState.contactos.map((contacto, index) => (
                      <div key={index} className="admin-persona-card">
                        {/* Mantén el contenido actual de cada tarjeta */}
                        <div className="admin-persona-header">
                          <h4>{contacto.nombre}</h4>
                          <span className="admin-ficha">Ficha: {contacto.ficha}</span>
                        </div>
                        <div className="admin-persona-details">
                          <div className="admin-detail-row">
                            <span className="admin-label">Tipo:</span>
                            <span className="admin-badge admin-badge-primary">{contacto.tipo}</span>
                          </div>
                          <div className="admin-detail-row">
                            <span className="admin-label">Email:</span>
                            <span className="admin-value">{contacto.email}</span>
                          </div>
                          <div className="admin-detail-row">
                            <span className="admin-label">Extensión:</span>
                            <span className="admin-value">{contacto.extension}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPersona('contactos', index)}
                          className="admin-back-button"
                          style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Investigadores */}
            <div className="admin-personas-section">
              <h3>Investigadores</h3>
              <div className="admin-form-group">
                <label>Ficha</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>

                  <input
                    type="text"
                    value={investigadorActual.ficha}
                    onChange={(e) => setInvestigadorActual(prev => ({ ...prev, ficha: e.target.value }))}
                    placeholder="Ingrese ficha"
                  />
                  <button
                    type="button"
                    onClick={() => buscarEmpleado(investigadorActual.ficha, 'investigador')}
                    className="admin-submit-button"
                    style={{
                      marginTop: '3px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      height: '40px',
                      minWidth: '100px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Buscar
                  </button>
                </div>

              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Nombre</label>
                  <input type="text" value={investigadorActual.nombre} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Categoría</label>
                  <input type="text" value={investigadorActual.categoria} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Puesto</label>
                  <input type="text" value={investigadorActual.puesto} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Extensión</label>
                  <input
                    type="text"
                    value={investigadorActual.extension}
                    onChange={(e) => setInvestigadorActual(prev => ({ ...prev, extension: e.target.value }))}
                    placeholder="Extensión"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Numero de Constancia de Habilitación</label>
                <input
                  type="text"
                  value={investigadorActual.no_constancia}
                  onChange={(e) => setInvestigadorActual(prev => ({ ...prev, no_constancia: e.target.value }))}
                  placeholder="Numero de Constancia de Habilitación"
                />
              </div>

              <div className="admin-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={investigadorActual.email}
                  onChange={(e) => setInvestigadorActual(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Correo electrónico"
                />
              </div>

              <button type="button" onClick={agregarInvestigador} className="admin-submit-button" style={{ maxWidth: '200px' }}>
                Agregar Investigador
              </button>

              {/* Lista de investigadores agregados */}
              {formState.investigadores.length > 0 && (
                <div style={{ marginTop: '20px', width: '100%' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333' }}>Investigadores Agregados:</h4>

                  <div className="admin-personas-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>

                    {formState.investigadores.map((investigador, index) => (
                      <div key={index} className="admin-persona-card">
                        <div className="admin-persona-header">
                          <h4>{investigador.nombre}</h4>
                          <span className="admin-ficha">Ficha: {investigador.ficha}</span>
                        </div>
                        <div className="admin-persona-details">
                          <div className="admin-detail-row">
                            <span className="admin-label">Email:</span>
                            <span className="admin-value">{investigador.email}</span>
                          </div>
                          <div className="admin-detail-row">
                            <span className="admin-label">Extensión:</span>
                            <span className="admin-value">{investigador.extension}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPersona('investigadores', index)}
                          className="admin-back-button"
                          style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>



          {/* --- SECCIÓN 6: PERSONAS INVOLUCRADAS --- */}
          <section className="admin-form-section">
            <h2 className="admin-section-title">
              <i className="fas fa-users"></i>
              Personas Involucradas
            </h2>

            {/* Involucrados */}
            <div className="admin-personas-section">
              <h3>Involucrados</h3>
              <div className="admin-form-group">
                <label>Ficha</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>

                  <input
                    type="text"
                    value={involucradoActual.ficha}
                    onChange={(e) => setInvolucradoActual(prev => ({ ...prev, ficha: e.target.value }))}
                    placeholder="Ingrese ficha"
                  />
                  <button
                    type="button"
                    onClick={() => buscarEmpleado(involucradoActual.ficha, 'involucrado')}
                    className="admin-submit-button"
                    style={{
                      marginTop: '3px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      height: '40px',
                      minWidth: '100px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Buscar
                  </button>
                </div>

              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Nombre</label>
                  <input type="text" value={involucradoActual.nombre} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Nivel</label>
                  <input type="text" value={involucradoActual.nivel} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Categoría</label>
                  <input type="text" value={involucradoActual.categoria} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Puesto</label>
                  <input type="text" value={involucradoActual.puesto} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Edad</label>
                  <input type="number" value={involucradoActual.edad} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Antigüedad</label>
                  <input type="number" value={involucradoActual.antiguedad} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>RFC</label>
                  <input type="text" value={involucradoActual.rfc} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>CURP</label>
                  <input type="text" value={involucradoActual.curp} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Dirección</label>
                <input type="text" value={involucradoActual.direccion} readOnly className="admin-readonly-field" />
              </div>

              {antecedentesEncontrados.length > 0 && involucradoActual.ficha && (
                <div style={{
                  gridColumn: '1 / -1',
                  marginTop: '15px',
                  marginBottom: '15px',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                  {/* Encabezado de Alerta */}
                  <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '10px 15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #f5c6cb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                      <i className="fas fa-exclamation-triangle"></i>
                      <span>Se encontraron {antecedentesEncontrados.length} antecedentes</span>
                    </div>
                    <small>Esta persona quedará marcada con historial.</small>
                  </div>

                  {/* Tabla de Detalles */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#fdfdfe', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Fecha</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Origen</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Referencia</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {antecedentesEncontrados.map((ant, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <td style={{ padding: '8px', color: '#666' }}>{ant.fecha}</td>
                            <td style={{ padding: '8px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                backgroundColor: ant.origen.includes('Histórico') ? '#e2e3e5' : '#cce5ff',
                                color: ant.origen.includes('Histórico') ? '#383d41' : '#004085'
                              }}>
                                {ant.origen}
                              </span>
                            </td>
                            <td style={{ padding: '8px', fontWeight: '600' }}>{ant.referencia}</td>
                            <td style={{ padding: '8px' }}>{ant.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={agregarInvolucrado}
                className="admin-submit-button"
                style={{
                  maxWidth: '250px',
                  backgroundColor: antecedentesEncontrados.length > 0 ? '#dc3545' : undefined, // Botón rojo si hay alerta
                  borderColor: antecedentesEncontrados.length > 0 ? '#dc3545' : undefined
                }}
              >
                {antecedentesEncontrados.length > 0 ? (
                  <span><i className="fas fa-exclamation-circle"></i> Agregar con Antecedentes</span>
                ) : "Agregar Involucrado"}
              </button>

              {/* Lista de involucrados agregados */}
              {formState.involucrados.length > 0 && (
                <div style={{ marginTop: '20px', width: '100%' }}>

                  <h4 style={{ marginBottom: '15px', color: '#333' }}>Involucrados Agregados:</h4>

                  <div className="admin-personas-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
                    gap: '20px'
                  }}>
                    {formState.involucrados.map((involucrado, index) => (
                      <div
                        key={index}
                        className="admin-persona-card"
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          padding: '15px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                          border: involucrado.tiene_antecedentes ? '1px solid #f5c6cb' : '1px solid #e0e0e0',
                          borderLeft: involucrado.tiene_antecedentes ? '5px solid #dc3545' : '5px solid #007bff'
                        }}
                      >
                        {/* ENCABEZADO */}
                        <div className="admin-persona-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <h4 style={{ margin: '0', fontSize: '1rem', color: '#2c3e50', flex: 1 }}>{involucrado.nombre}</h4>
                          <span className="admin-ficha" style={{ backgroundColor: '#343a40', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', height: 'fit-content' }}>
                            {involucrado.ficha}
                          </span>
                        </div>

                        {involucrado.tiene_antecedentes && (
                          <div style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeeba',
                            borderRadius: '6px',
                            marginBottom: '15px',
                            overflow: 'hidden'
                          }}>
                            {/* Título de la alerta */}
                            <div style={{
                              padding: '8px 12px',
                              backgroundColor: '#ffeeba',
                              color: '#856404',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <i className="fas fa-history"></i>
                              Historial Encontrado:
                            </div>

                            {/* Mini Tabla de Detalles */}
                            <div style={{ padding: '0', maxHeight: '150px', overflowY: 'auto' }}>
                              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                                <tbody>
                                  {involucrado.antecedentes_detalles?.map((ant, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #fae3b3' }}>
                                      <td style={{ padding: '6px 10px', color: '#555', whiteSpace: 'nowrap' }}>
                                        {ant.fecha}
                                      </td>
                                      <td style={{ padding: '6px 10px' }}>
                                        <strong>{ant.referencia}</strong>
                                        <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '2px' }}>
                                          {ant.descripcion}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* DETALLES TÉCNICOS */}
                        <div className="admin-persona-details" style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                          fontSize: '0.85rem',
                          color: '#666',
                          borderTop: '1px solid #f0f0f0',
                          paddingTop: '10px'
                        }}>
                          <div><span style={{ display: 'block', fontWeight: 'bold', fontSize: '0.7rem', color: '#999' }}>NIVEL</span>{involucrado.nivel}</div>
                          <div><span style={{ display: 'block', fontWeight: 'bold', fontSize: '0.7rem', color: '#999' }}>EDAD</span>{involucrado.edad} años</div>
                          <div><span style={{ display: 'block', fontWeight: 'bold', fontSize: '0.7rem', color: '#999' }}>ANTIGÜEDAD</span>{involucrado.antiguedad} años</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => eliminarPersona('involucrados', index)}
                          style={{
                            marginTop: '15px', width: '100%', padding: '8px', fontSize: '0.85rem',
                            backgroundColor: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Testigos */}
            <div className="admin-personas-section">
              <h3>Testigos</h3>
              <div className="admin-form-group">
                <label>Ficha</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="text"
                    value={testigoActual.ficha}
                    onChange={(e) => setTestigoActual(prev => ({ ...prev, ficha: e.target.value }))}
                    placeholder="Ingrese ficha"
                    style={{ flex: 1 }}
                  />

                  <button
                    type="button"
                    onClick={() => buscarEmpleado(testigoActual.ficha, 'testigo')}
                    className="admin-submit-button"
                    style={{
                      marginTop: '3px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      height: '40px',
                      minWidth: '100px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Nombre</label>
                  <input type="text" value={testigoActual.nombre} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Nivel</label>
                  <input type="text" value={testigoActual.nivel} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Categoría</label>
                  <input type="text" value={testigoActual.categoria} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                  <label>Puesto</label>
                  <input type="text" value={testigoActual.puesto} readOnly className="admin-readonly-field" />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Dirección</label>
                <input type="text" value={testigoActual.direccion} readOnly className="admin-readonly-field" />
              </div>

              <div className="admin-form-group">
                <div className="admin-checkbox-container">
                  <input
                    type="checkbox"
                    checked={testigoActual.subordinacion}
                    onChange={(e) => setTestigoActual(prev => ({ ...prev, subordinacion: e.target.checked }))}
                    id="subordinacion_check"
                  />
                  <label htmlFor="subordinacion_check">Subordinación</label>
                </div>
              </div>

              <button type="button" onClick={agregarTestigo} className="admin-submit-button" style={{ maxWidth: '200px' }}>
                Agregar Testigo
              </button>

              {/* Lista de testigos agregados */}
              {formState.testigos.length > 0 && (
                <div style={{ marginTop: '20px', width: '100%' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333' }}>Testigos Agregados:</h4>

                  <div className="admin-personas-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    {formState.testigos.map((testigo, index) => (
                      <div key={index} className="admin-persona-card">
                        <div className="admin-persona-header">
                          <h4>{testigo.nombre}</h4>
                          <span className="admin-ficha">Ficha: {testigo.ficha}</span>
                        </div>
                        <div className="admin-persona-details">
                          <div className="admin-detail-row">
                            <span className="admin-label">Nivel:</span>
                            <span className="admin-value">{testigo.nivel}</span>
                          </div>
                          <div className="admin-detail-row">
                            <span className="admin-label">Subordinación:</span>
                            <span className={`admin-badge ${testigo.subordinacion ? 'admin-badge-warning' : 'admin-badge-secondary'}`}>
                              {testigo.subordinacion ? 'Sí' : 'No'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPersona('testigos', index)}
                          className="admin-back-button"
                          style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="admin-form-actions">
            <button
              type="button"
              onClick={() => navigate('/investigaciones')}
              className="admin-back-button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-submit-button"
              disabled={loading || (isTimeUp && !isEditMode)}
              title={isTimeUp && !isEditMode ? 'El tiempo para guardar ha expirado' : ''}
            >
              {isEditMode ? 'Actualizar' : 'Guardar'} Investigación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvestigacionFormPage;