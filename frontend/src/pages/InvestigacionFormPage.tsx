import React, { useState, useEffect } from 'react';
import CompletionProgressBar from '../components/DataDisplay/CompletionProgressBar';

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
import CustomConductaSelect from '../components/Inputs/CustomConductaSelect';
import { FiEdit } from 'react-icons/fi';
import { FaArrowLeft } from "react-icons/fa";
import Swal from 'sweetalert2';
import DocumentPreviewModal from '../components/Modals/DocumentPreviewModal';
import { auditoriaService } from '../api/auditoriaService';

const initialState: InvestigacionFormState = {
  nombre_corto: '',
  montoeconomico: null,
  conductas: '',
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
  reportantes: [],
  investigadores: [],
  involucrados: [],
  testigos: [],
  responsable_ficha: '',
  responsable_nombre: '',
  responsable_categoria: '',
  responsable_puesto: '',
  responsable_extension: '',
  responsable_email: '',
  detalles_conducta: '',
};

interface ContactoForm {
  ficha: string;
  nombre: string;
  categoria: string;
  puesto: string;
  extension: string;
  email: string;
  tipo: 'CONTACTO' | 'RESPONSABLE';
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

interface ReportanteForm {
  ficha: string;
  nombre: string;
  nivel: string;
  categoria: string;
  puesto: string;
  edad: number;
  antiguedad: number;

  direccion: string;
  es_externo?: boolean;
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
  regimen: string;
  jornada: string;
  sindicato: string;
  seccion_sindical: string;
  termino: string;
  fuente: string;
  centro_trabajo: string;
  es_externo?: boolean;
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

type TipoPersona = 'contactos' | 'investigadores' | 'involucrados' | 'testigos' | 'reportantes';

function InvestigacionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

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

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    setUserRole(role);

    // Mapeo de roles a regiones
    const regionMapping: { [key: string]: string } = {
      'NTE': 'NORTE',
      'SUR': 'SUR',
      'STE': 'SURESTE',
      'ALT': 'ALTIPLANO',
      'GAI': 'GAI'
    };

    let regionFound = '';
    const roleUpper = role.toUpperCase();

    // Buscar si el rol coincide con alguna región (ej: SupervisorNTE, OperadorSUR)
    for (const suffix in regionMapping) {
      if (roleUpper.endsWith(suffix)) {
        regionFound = regionMapping[suffix];
        break;
      }
    }

    // Determinar si puede editar
    // Editable solo para: ADMIN, ADMINCENTRAL, SUPERVISORGAI
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'ADMINCENTRAL';
    const isSupervisorGAI = roleUpper === 'SUPERVISORGAI';
    const canEdit = isAdmin || isSupervisorGAI;

    // Establecer estado de deshabilitado
    setIsGerenciaDisabled(!canEdit);

    // Auto-asignar gerencia si se encontró región y NO es una edición existente con valor (opcional, pero buena práctica para "Nuevo")
    if (regionFound && !id) { // Solo auto-asignar en creación
      setFormState(prev => ({ ...prev, gerencia_responsable: regionFound }));
    }
    // Si queremos forzarlo siempre para operadores/supervisores regionales, quitamos el check de !id
    // El requerimiento dice "la pondra sola de acuerdo a su region", lo forzamos si no es admin/supGAI
    if (regionFound && !canEdit) {
      setFormState(prev => ({ ...prev, gerencia_responsable: regionFound }));
    }

  }, [id]);

  const [isGerenciaDisabled, setIsGerenciaDisabled] = useState(false);

  const [formState, setFormState] = useState<InvestigacionFormState>(initialState);
  const [opciones, setOpciones] = useState<OpcionesDropdowns | null>(null);

  const [centrosTrabajo, setCentrosTrabajo] = useState<string[]>([]);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showMontoEconomico, setShowMontoEconomico] = useState(false);
  const [montoText, setMontoText] = useState('');

  const [contactoActual, setContactoActual] = useState<ContactoForm>({
    ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', tipo: 'RESPONSABLE'
  });
  const [investigadorActual, setInvestigadorActual] = useState<InvestigadorForm>({
    ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', no_constancia: ''
  });

  const [reportanteActual, setReportanteActual] = useState<ReportanteForm>({
    ficha: '', nombre: '', nivel: '', categoria: '', puesto: '',
    edad: 0, antiguedad: 0, direccion: '', es_externo: false
  });

  const [involucradoActual, setInvolucradoActual] = useState<InvolucradoForm>({
    ficha: '', nombre: '', nivel: '', categoria: '', puesto: '', fuente: '', termino: '', centro_trabajo: '',
    edad: 0, antiguedad: 0, rfc: '', curp: '', direccion: '', regimen: '', jornada: '', sindicato: '', seccion_sindical: '', es_externo: false
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

  const [mostrarPDF, setMostrarPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');


  useEffect(() => {
    let activeUrl = '';
    const { no_constancia } = investigadorActual;

    if (!no_constancia) {
      setMostrarPDF(false);
      setPdfUrl('');
      setPdfError('');
      return;
    }

    const fetchPreview = async () => {
      const fileName = `${no_constancia}.pdf`;

      try {
        // Primero verificamos si existe
        const checkRes = await apiClient.get(`/api/investigadores/check-constancia/${fileName}/`);

        if (checkRes.data.exists) {
          // Si existe, descargamos el blob para previsualizar
          const response = await apiClient.get(`/api/investigadores/constancias/${fileName}/`, {
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
          activeUrl = url;
          setPdfUrl(url);
          setMostrarPDF(true);
          setPdfError('');
        } else {
          setMostrarPDF(false);
          setPdfUrl('');
          setPdfError(`No se encontró constancia con número ${no_constancia}`);
        }
      } catch (err) {
        console.error('Error buscando PDF:', err);
        setMostrarPDF(false);
        setPdfError('Error al cargar la constancia.');
      }
    };

    const timeoutId = setTimeout(fetchPreview, 500);

    return () => {
      clearTimeout(timeoutId);
      if (activeUrl) {
        window.URL.revokeObjectURL(activeUrl);
      }
    };
  }, [investigadorActual.no_constancia]);

  const handleDescargarPDF = async () => {
    const { no_constancia } = investigadorActual;
    const fileName = no_constancia ? `${no_constancia}.pdf` : '';

    if (fileName) {
      try {
        await auditoriaService.logAction('DOWNLOAD', `Descargó constancia de habilitación ${no_constancia}`);
        const response = await apiClient.get(`/api/investigadores/constancias/${fileName}/`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading constancia:", error);
        alert("Error al descargar la constancia.");
      }
    }
  };
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
  const [listaInvestigadores, setListaInvestigadores] = useState<{ ficha: string; nombre: string }[]>([]);

  // --- Cargar datos ---
  useEffect(() => {
    let isMounted = true;

    const fetchDatosIniciales = async () => {
      try {
        const [opcionesRes, centrosTrabajoRes, investigadoresRes] = await Promise.all([
          apiClient.get('/api/investigaciones/opciones/'),
          apiClient.get('/api/investigaciones/centros-trabajo/'),
          apiClient.get('/api/investigaciones/listar-investigadores/').catch(() => ({ data: [] }))
        ]);

        if (!isMounted) return;

        setOpciones(opcionesRes.data);
        setCentrosTrabajo(centrosTrabajoRes.data);
        setListaInvestigadores(investigadoresRes.data);
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
        setError('No se pudieron cargar los datos iniciales.');
      }
    };

    const fetchInvestigacion = async (investigacionId: string) => {
      try {
        const response = await apiClient.get(`/api/investigaciones/investigaciones/${investigacionId}/`);

        if (!isMounted) return;

        const investigacionData = response.data;
        setFormState(investigacionData);
        setIsEditMode(true);
        if (investigacionData.montoeconomico) {
          setMontoText(investigacionData.montoeconomico.toLocaleString('en-US'));
        }

        // Cargar áreas para el centro si existe

      } catch (err) {
        console.error('Error cargando investigación:', err);
        setError('No se pudo cargar la investigación.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchDatosIniciales();

    if (id) {
      fetchInvestigacion(id);
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);



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
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'fecha_prescripcion') return;

    let processedValue: any = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      processedValue = e.target.checked;
    }

    if (name === 'gerencia_responsable') {
      setFormState(prev => ({ ...prev, gerencia_responsable: value }));
      if (value) {
        try {
          const response = await apiClient.get(`/api/investigaciones/buscar-gerente-responsable/?gerencia=${value}`);
          const gerente = response.data;
          setFormState(prev => ({
            ...prev,
            responsable_ficha: gerente.ficha,
            responsable_nombre: gerente.nombre,
            responsable_categoria: gerente.categoria,
            responsable_puesto: gerente.puesto,
          }));
        } catch (err) {
          console.error("Gerente no encontrado");
        }
      }
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
        fecha_conocimiento_hechos: value,
        fecha_prescripcion: nuevaFechaPrescripcion
      }));
    }
    else if (name === 'economica') {
      setFormState(prev => ({
        ...prev,
        economica: processedValue,
        montoeconomico: !processedValue ? null : prev.montoeconomico
      }));
      if (!processedValue) setMontoText('');
    }


    else if (name === 'conductas') {
      setFormState(prev => ({
        ...prev,
        conductas: value,
        detalles_conducta: value === 'OTRAS CONDUCTAS' ? prev.detalles_conducta : '',
        gravedad: value === 'HOSTIGAMIENTO O ACOSO SEXUAL' ? 'ALTA' : prev.gravedad
      }));
    }
    else {
      setFormState(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleMontoRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, ''); // Solo números y puntos
    const parts = rawValue.split('.');

    // Evitar múltiples puntos
    if (parts.length > 2) return;

    // Formatear parte entera con comas
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;

    setMontoText(formatted);

    const numericValue = rawValue === '' ? null : parseFloat(rawValue);

    setFormState(prev => {
      let nuevaGravedad = prev.gravedad;

      if (numericValue !== null && numericValue >= 100000) {
        nuevaGravedad = 'ALTA';
      }
      return {
        ...prev,
        montoeconomico: numericValue,
        gravedad: nuevaGravedad
      };
    });
  };

  const handleMontoBlur = () => {
    const rawValue = montoText.replace(/[^0-9.]/g, '');
    const value = parseFloat(rawValue);

    if (value > 1) {
      Swal.fire({
        title: 'Confirmar Monto',
        text: `La cantidad ingresada (${montoText}). ¿Es correcta?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, es correcta',
        cancelButtonText: 'No, corregir'
      }).then((result) => {
        if (!result.isConfirmed) {
          setMontoText('');
          setFormState(prev => ({ ...prev, montoeconomico: null }));
        }
      });
    }
  };



  const handleEnterBusqueda = (
    e: React.KeyboardEvent<HTMLInputElement>,
    ficha: string,
    tipo: 'contacto' | 'investigador' | 'involucrado' | 'testigo' | 'reportante'
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      buscarEmpleado(ficha, tipo);
    }
  };


  const buscarEmpleado = async (ficha: string, tipo: 'contacto' | 'investigador' | 'involucrado' | 'testigo' | 'reportante') => {
    if (!ficha.trim()) return;

    setAntecedentesEncontrados([]);

    try {
      let datosInvestigadorAutorizado = null;

      // PASO 1: Si es investigador, validamos PRIMERO en el catálogo especial
      if (tipo === 'investigador') {
        try {
          const validacionRes = await apiClient.get(`/api/investigaciones/validar-investigador/?ficha=${ficha}`);
          datosInvestigadorAutorizado = validacionRes.data;

          if (!datosInvestigadorAutorizado.es_investigador) {
            throw new Error("No autorizado");
          }
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'No autorizado',
            text: 'La ficha ingresada no pertenece a un investigador activo con número de constancia registrado.',
          });
          setInvestigadorActual({
            ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', no_constancia: ''
          });
          setInvestigadorActual({
            ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', no_constancia: ''
          });
          return;
        }
      }

      const response = await apiClient.get(`/api/investigaciones/buscar-empleado/?ficha=${ficha}`);
      const empleado: EmpleadoBuscado = response.data;

      if (tipo === 'involucrado' && empleado.antecedentes && empleado.antecedentes.length > 0) {
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
          if (datosInvestigadorAutorizado) {
            const userRoleUpper = userRole.toUpperCase();
            const isRegionalSupervisor = userRoleUpper.startsWith('SUPERVISOR') &&
              !userRoleUpper.includes('ADMIN');

            if (isRegionalSupervisor) {
              const regionUsuario = userRoleUpper.replace('SUPERVISOR', '');
              const investigadorGroups = (datosInvestigadorAutorizado.groups || []) as string[];

              const perteneceARegion = investigadorGroups.some(g => {
                const gUpper = g.toUpperCase();
                return gUpper.includes(`OPERADOR${regionUsuario}`);
              });

              if (!perteneceARegion) {
                Swal.fire({
                  icon: 'error',
                  title: 'Restricción de Región',
                  text: `No puede asignar investigadores de otra región.`
                });

                setInvestigadorActual({
                  ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', no_constancia: ''
                });
                return;
              }
            }
          }

          setInvestigadorActual(prev => ({
            ...prev,
            nombre: empleado.nombre,
            categoria: empleado.categoria,
            puesto: empleado.puesto,
            email: empleado.email || '',
            no_constancia: datosInvestigadorAutorizado ? datosInvestigadorAutorizado.no_constancia : ''
          }));

          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
          Toast.fire({
            icon: 'success',
            title: `Investigador Validado: Constancia ${datosInvestigadorAutorizado.no_constancia}`
          });
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
            direccion: empleado.direccion,
            regimen: empleado.regimen || '',
            jornada: empleado.jornada || '',
            sindicato: empleado.sindicato || '',
            seccion_sindical: empleado.seccion_sindical || '',
            fuente: empleado.fuente || '',
            centro_trabajo: empleado.centro_trabajo || '',
            termino: empleado.termino || ''
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

        case 'reportante':
          setReportanteActual(prev => ({
            ...prev,
            nombre: empleado.nombre,
            nivel: empleado.nivel,
            categoria: empleado.categoria,
            puesto: empleado.puesto,
            edad: empleado.edad,
            antiguedad: empleado.antiguedad,
            direccion: empleado.direccion
          }));
          break;
      }
    } catch (err: any) {
      alert(`Error al buscar empleado: ${err.response?.data?.error || 'Empleado no encontrado'}`);
    }
  };

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
      ficha: '', nombre: '', categoria: '', puesto: '', extension: '', email: '', tipo: 'CONTACTO'
    });
  };

  const agregarReportante = () => {
    if (reportanteActual.es_externo) {
      if (!reportanteActual.nombre) {
        alert('El nombre es obligatorio para reportantes externos');
        return;
      }
    } else {
      if (!reportanteActual.ficha || !reportanteActual.nombre) {
        alert('Complete la ficha y busque el empleado antes de agregar');
        return;
      }
    }

    setFormState(prev => ({
      ...prev,
      reportantes: [...(prev.reportantes || []), { ...reportanteActual }]
    }));

    setReportanteActual({
      ficha: '', nombre: '', nivel: '', categoria: '', puesto: '',
      edad: 0, antiguedad: 0, direccion: '', es_externo: false
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
    if (involucradoActual.es_externo) {
      if (!involucradoActual.nombre) {
        alert('El nombre es obligatorio para involucrados externos');
        return;
      }
    } else {
      if (!involucradoActual.ficha || !involucradoActual.nombre) {
        alert('Complete la ficha y busque el empleado antes de agregar');
        return;
      }
    }

    const nuevoInvolucrado = {
      ...involucradoActual,
      tiene_antecedentes: antecedentesEncontrados.length > 0,
      antecedentes_detalles: [...antecedentesEncontrados]
    };

    setFormState(prev => {
      const nivelNumero = parseInt(nuevoInvolucrado.nivel, 10);

      const implicaGravedadAlta = !isNaN(nivelNumero) && nivelNumero >= 41;
      const nuevaGravedad = implicaGravedadAlta ? 'ALTA' : prev.gravedad;

      return {
        ...prev,
        involucrados: [...prev.involucrados, nuevoInvolucrado],
        gravedad: nuevaGravedad,
      };
    });

    setInvolucradoActual({
      ficha: '', nombre: '', fuente: '', nivel: '', categoria: '', puesto: '', termino: '', centro_trabajo: '',
      edad: 0, antiguedad: 0, rfc: '', curp: '', direccion: '', regimen: '', jornada: '', sindicato: '', seccion_sindical: '', es_externo: false
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

    if (formState.conductas === 'OTRAS CONDUCTAS') {
      if (!formState.detalles_conducta || formState.detalles_conducta.length < 100) {
        setLoading(false);
        setError('Si selecciona "OTRAS CONDUCTAS", debe detallar la conducta con un mínimo de 100 caracteres.');
        return;
      }
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
        await auditoriaService.logAction('UPDATE', `Actualizó investigación ${formState.numero_reporte || id}`, Number(id));
        await apiClient.put(`/api/investigaciones/investigaciones/${id}/`, dataToSubmit);
        await Swal.fire({
          icon: 'success',
          title: 'Actualizada',
          text: 'Investigación actualizada exitosamente.'
        });
      } else {
        const res = await apiClient.post('/api/investigaciones/investigaciones/', dataToSubmit);
        const nuevoReporte = res.data.numero_reporte || 'Asignado';
        await auditoriaService.logAction('CREATE', `Creó nueva investigación con reporte ${nuevoReporte}`, res.data.id);
        await Swal.fire({
          icon: 'success',
          title: 'Creada',
          text: `Se guardó la investigación. Reporte: ${nuevoReporte}`
        });
      }

      navigate('/investigaciones');

    } catch (err: any) {
      console.error('Error completo:', err.response?.data);

      if (err.response?.status === 400) {
        const errorData = err.response.data;

        // Helper recursivo para formatear errores
        const formatErrorMessage = (data: any): string => {
          if (typeof data === 'string') return data;
          if (Array.isArray(data)) {
            return data.map((item, index) => {
              const msg = formatErrorMessage(item);
              // Si es un objeto dentro de un array (ej. error en un item específico de una lista), indicamos índice si es relevante
              if (typeof item === 'object' && item !== null && Object.keys(item).length > 0) {
                // Si el mensaje formateado no está vacío
                if (msg && msg !== '{}') return `(Ítem ${index + 1}: ${msg})`;
                return '';
              }
              return msg;
            }).filter(msg => msg && msg !== '{}' && msg !== '()').join(', ');
          }
          if (typeof data === 'object' && data !== null) {
            return Object.entries(data)
              .map(([key, value]) => {
                const formattedValue = formatErrorMessage(value);
                if (!formattedValue || formattedValue === '{}') return '';
                const fieldName = key.replace(/_/g, ' ');
                return `${fieldName}: ${formattedValue}`;
              })
              .filter(msg => msg)
              .join(', ');
          }
          return String(data);
        };

        if (typeof errorData === 'object' && errorData !== null) {
          const formattedError = formatErrorMessage(errorData);
          setError(`Errores de validación:\n${formattedError}`);
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

          {isEditMode && (
            <div className="admin-form-section" style={{ width: '100%', gridColumn: '1 / -1' }}>
              <CompletionProgressBar
                percentage={formState.porcentaje_completitud || 0}
              />
            </div>
          )}

          {/* --- SECCIÓN 1: INFORMACIÓN GENERAL --- */}
          <section
            className="admin-form-section"
            style={{ gridColumn: '1 / -1' }}
          >
            <h2 className="admin-section-title">
              <i className="fas fa-info-circle"></i>
              Información del Reporte
            </h2>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Documento de origen *</label>
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
                <label> Presunta conducta *</label>
                <div className="admin-input-with-icon" style={{ padding: 0, border: 'none' }}>
                  <i className="fas" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#666' }}></i>
                  <div style={{ marginLeft: '0' }}>
                    <CustomConductaSelect
                      value={formState.conductas}
                      onChange={(val) => {
                        const fakeEvent = {
                          target: {
                            name: 'conductas',
                            value: val,
                            type: 'select-one'
                          }
                        } as React.ChangeEvent<HTMLSelectElement>;
                        handleChange(fakeEvent);
                      }}
                      options={opciones?.conductas || []}
                      descriptions={conductaDescriptions}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-form-row">

              {formState.conductas === 'OTRAS CONDUCTAS' && (
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Detalles de la conducta *</label>
                  <div className="admin-input-with-icon">
                    <i className="fas fa-align-left"></i>
                    <textarea
                      name="detalles_conducta"
                      value={formState.detalles_conducta || ''}
                      onChange={handleChange}
                      required
                      minLength={100}
                      placeholder="Describa la conducta detalladamente (mínimo 100 caracteres)..."
                      className="admin-textarea"
                      rows={4}
                    />
                  </div>
                  <small className="admin-field-hint">
                    Carácteres actuales: {formState.detalles_conducta?.length || 0} / 100 mínimo
                  </small>
                </div>
              )}
            </div>


            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Relevancia *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                  <select name="gravedad" value={formState.gravedad} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {opciones?.gravedades.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Origen *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-source"></i>
                  <select name="procedencia" value={formState.procedencia} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {opciones?.procedencias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
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

            {
              formState.economica && (
                <div className="admin-form-group">
                  <label>Monto Económico *</label>
                  <div className="admin-input-with-icon">
                    <i className="fas fa-money-bill-wave"></i>
                    <input
                      type="text"
                      name="montoeconomico"
                      value={montoText}
                      onChange={handleMontoRawChange}
                      onBlur={handleMontoBlur}
                      required={formState.economica} // Solo requerido si economica es true
                      placeholder="Ingrese el monto económico"
                    />
                  </div>
                  <small className="admin-field-hint">
                    Ingrese el monto con dos decimales (ej: 1500.00)
                  </small>
                </div>
              )
            }

            <div className="admin-personas-section" style={{ marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '20px' }}>

              <h3 style={{ color: '#2c3e50', fontSize: '1.1rem', marginBottom: '15px' }}>
                <i className="fas fa-bullhorn" style={{ marginRight: '8px' }}></i>
                Personal Reportado
              </h3>
              <div className="admin-checkbox-container" style={{ marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={involucradoActual.es_externo || false}
                  onChange={(e) => setInvolucradoActual(prev => ({
                    ...prev,
                    es_externo: e.target.checked,
                    ficha: e.target.checked ? 'EXTERNO' : '',
                    nombre: '',
                    categoria: 'EXTERNO',
                    puesto: 'EXTERNO'
                  }))}
                  id="involucrado_externo_check_page"
                />
                <label className="admin-checkbox-label" htmlFor="involucrado_externo_check_page">Es Externo</label>
              </div>

              {!involucradoActual.es_externo ? (
                <>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Ficha</label>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <input
                          type="text"
                          className="admin-input"
                          value={involucradoActual.ficha}
                          onChange={(e) => setInvolucradoActual(prev => ({ ...prev, ficha: e.target.value }))}
                          onKeyDown={(e) => handleEnterBusqueda(e, involucradoActual.ficha, 'involucrado')}
                          placeholder="Ingrese ficha y presione Enter o Tab"
                        />
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <label>Fuente</label>
                      <input type="text" value={involucradoActual.fuente} readOnly className="admin-readonly-field" />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Régimen</label>
                      <input type="text" value={involucradoActual.regimen} readOnly className="admin-readonly-field" />
                    </div>

                    <div className="admin-form-group">
                      <label>Fecha de Término</label>
                      {(() => {
                        let isExceeded = false;
                        if (formState.fecha_prescripcion && involucradoActual.termino) {
                          try {
                            const [pYear, pMonth, pDay] = formState.fecha_prescripcion.split('-').map(Number);
                            const fechaPres = new Date(pYear, pMonth - 1, pDay);

                            const [tDay, tMonth, tYear] = involucradoActual.termino.split('/').map(Number);
                            const fechaTerm = new Date(tYear, tMonth - 1, tDay);

                            if (fechaPres > fechaTerm) {
                              isExceeded = true;
                            }
                          } catch (e) {
                            // Ignore parse errors
                          }
                        }

                        return (
                          <>
                            <input
                              type="text"
                              value={involucradoActual.termino}
                              readOnly
                              className="admin-readonly-field"
                              style={isExceeded ? { border: '2px solid #dc3545', color: '#dc3545', fontWeight: 'bold' } : {}}
                            />
                            {isExceeded && (
                              <small style={{ color: '#dc3545', display: 'block', marginTop: '5px', fontWeight: '600' }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: '5px' }}></i>
                                ¡Atención! La prescripción excede el término de contrato
                              </small>
                            )}
                          </>
                        );
                      })()}
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
                    <div className="admin-form-group hidden">
                      {/* <label>RFC</label> */}
                      <input type="text" value={involucradoActual.rfc} hidden className="admin-readonly-field" />
                    </div>
                    <div className="admin-form-group hidden">
                      {/* <label>CURP</label> */}
                      <input type="text" value={involucradoActual.curp} hidden className="admin-readonly-field" />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Dirección</label>
                      <input type="text" value={involucradoActual.direccion} readOnly className="admin-readonly-field" />
                    </div>
                    <div className="admin-form-group">
                      <label>Centro de Trabajo</label>
                      <input type="text" value={involucradoActual.centro_trabajo} readOnly className="admin-readonly-field" />
                    </div>
                  </div>

                  <div className="admin-form-row">

                    <div className="admin-form-group">
                      <label>Jornada</label>
                      <input type="text" value={involucradoActual.jornada} readOnly className="admin-readonly-field" />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Sindicato</label>
                      <input type="text" value={involucradoActual.sindicato} className="admin-input" />
                    </div>
                    <div className="admin-form-group">
                      <label>Sección sindical</label>
                      <input type="text" value={involucradoActual.seccion_sindical} className="admin-input" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Nombre Completo del Personal Externo *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={involucradoActual.nombre}
                      onChange={(e) => setInvolucradoActual(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                      placeholder="Ingrese el nombre"
                    />
                  </div>
                </div>
              )}

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
                      <span>Se encontraron {antecedentesEncontrados.length} antecedente(s)</span>
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
                  <span><i className="fas fa-exclamation-circle"></i> Agregar con Antecedente(s)</span>
                ) : "Agregar Reportado"}
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



            {/* --- SUB-SECCIÓN REPORTANTES (Dentro de Info General) --- */}
            <div className="admin-personas-section" style={{ marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '20px' }}>
              <h3 style={{ color: '#2c3e50', fontSize: '1.1rem', marginBottom: '15px' }}>
                <i className="fas fa-bullhorn" style={{ marginRight: '8px' }}></i>
                Reportantes
              </h3>

              {/* Buscador de Reportante */}
              <div className="admin-checkbox-container" style={{ marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={reportanteActual.es_externo || false}
                  onChange={(e) => setReportanteActual(prev => ({
                    ...prev,
                    es_externo: e.target.checked,
                    ficha: e.target.checked ? 'EXTERNO' : '',
                    nombre: '',
                    categoria: 'EXTERNO',
                    puesto: 'EXTERNO'
                  }))}
                  id="reportante_externo_check_page"
                />
                <label style={{ marginLeft: '5px', fontSize: '0.9rem' }} htmlFor="reportante_externo_check_page">Es Externo</label>
              </div>

              {!reportanteActual.es_externo ? (
                <>
                  <div className="admin-form-group">
                    <label>Ficha</label>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input
                        type="text"
                        className="admin-input"
                        value={reportanteActual.ficha}
                        onChange={(e) => setReportanteActual(prev => ({ ...prev, ficha: e.target.value }))}
                        onKeyDown={(e) => handleEnterBusqueda(e, reportanteActual.ficha, 'reportante')}
                        placeholder="Ingrese ficha y presione Enter o Tab"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Nombre</label>
                      <input type="text" value={reportanteActual.nombre} readOnly className="admin-readonly-field" />
                    </div>
                    <div className="admin-form-group">
                      <label>Nivel</label>
                      <input type="text" value={reportanteActual.nivel} readOnly className="admin-readonly-field" />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Categoría</label>
                      <input type="text" value={reportanteActual.categoria} readOnly className="admin-readonly-field" />
                    </div>
                    <div className="admin-form-group">
                      <label>Puesto</label>
                      <input type="text" value={reportanteActual.puesto} readOnly className="admin-readonly-field" />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Edad</label>
                      <input type="number" value={reportanteActual.edad || ''} readOnly className="admin-readonly-field" />
                    </div>
                    <div className="admin-form-group">
                      <label>Antigüedad</label>
                      <input type="number" value={reportanteActual.antiguedad || ''} readOnly className="admin-readonly-field" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-form-group">
                  <label>Nombre Completo del Reportante Externo *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={reportanteActual.nombre}
                    onChange={(e) => setReportanteActual(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                    placeholder="Ingrese el nombre"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={agregarReportante}
                className="admin-submit-button"
                style={{ maxWidth: '200px', marginBottom: '20px' }}
              >
                Agregar Reportante
              </button>

              {/* Lista de Reportantes Agregados */}
              {formState.reportantes && formState.reportantes.length > 0 && (
                <div style={{ width: '100%' }}>
                  <h4 style={{ marginBottom: '10px', color: '#555', fontSize: '0.9rem' }}>Reportantes Agregados:</h4>

                  <div className="admin-personas-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '15px'
                  }}>
                    {formState.reportantes.map((rep, index) => (
                      <div key={index} className="admin-persona-card" style={{ borderLeft: '4px solid #17a2b8' }}>
                        <div className="admin-persona-header">
                          <h4>{rep.nombre}</h4>
                          <span className="admin-ficha">Ficha: {rep.ficha}</span>
                        </div>
                        <div className="admin-persona-details">
                          <div className="admin-detail-row">
                            <span className="admin-label">Puesto:</span>
                            <span className="admin-value">{rep.puesto}</span>
                          </div>
                          <div className="admin-detail-row">
                            <span className="admin-label">Nivel:</span>
                            <span className="admin-value">{rep.nivel}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPersona('reportantes', index)}
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

          </section >

          {/* --- SECCIÓN 2: FECHAS IMPORTANTES --- */}
          < section
            className="admin-form-section"
            style={{ gridColumn: '1 / -1' }
            }
          >
            <h2 className="admin-section-title">
              <i className="fas fa-calendar-alt"></i>
              Tiempo
            </h2>

            <div className="admin-form-row ">
              {false && (
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
              )}

              <div className="admin-form-group">
                <label>Fecha Conocimiento de Hechos por Parte del Representante Patronal *</label>
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
                <label>Fecha de los hechos *</label>
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
                <label>Fecha de prescripción</label>
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


          </section >

          {/* --- SECCIÓN 5: INFORMACIÓN DEL EVENTO --- */}
          < section className="admin-form-section"
            style={{ gridColumn: '1 / -1' }}
          >
            <h2 className="admin-section-title">
              <i className="fas fa-calendar-check"></i>
              Modo y Lugar
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
                    placeholder="Escriba el centro de trabajo o agrega un involucrado para autocompletar"
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
              <label>Breve relatoría de hechos *</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-sticky-note"></i>
                <input
                  name="observaciones"
                  value={formState.observaciones}
                  onChange={handleChange}
                  maxLength={300}
                  placeholder="Observaciones generales (máximo 300 caracteres)"
                />
              </div>
            </div>

          </section >

          {/* --- SECCIÓN 4: GERENCIA RESPONSABLE --- */}
          {(['Admin', 'AdminCentral'].includes(userRole) || userRole.startsWith('Supervisor')) && (
            < section className="admin-form-section"
              style={{ gridColumn: '1 / -1' }} >
              {/* <h2 className="admin-section-title">
              <i className="fas fa-user-tie"></i>
              Gerencia Responsable
            </h2> */}
              {/*
             Contactos 
            <div className="admin-personas-section">
              <h3>Contactos</h3>
              <div className="admin-form-group">
                <label>Ficha</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="text"
                    className="admin-input"
                    value={contactoActual.ficha}
                    onChange={(e) => setContactoActual(prev => ({ ...prev, ficha: e.target.value }))}
                    onKeyDown={(e) => handleEnterBusqueda(e, contactoActual.ficha, 'contacto')}
                    placeholder="Ingrese ficha y presione Enter o Tab"
                    style={{ flex: 1 }}
                  />
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
                    className="admin-input"
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
                  className="admin-input"
                  value={contactoActual.email}
                  onChange={(e) => setContactoActual(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Correo electrónico"
                />
              </div>

              <div className="admin-form-group">
                <input
                  type="hidden"
                  name="tipo"
                  value="responsable"
                />
              </div>


              <button type="button" onClick={agregarContacto} className="admin-submit-button" style={{ maxWidth: '200px' }}>
                Agregar Contacto
              </button>

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
            </div> */}

              {/* Investigadores - Solo visible para Supervisores y Admin */}
              {
                (['Admin', 'AdminCentral'].includes(userRole) || userRole.startsWith('Supervisor')) && (
                  <div className="admin-personas-section">
                    <h2 className="admin-section-title">
                      <i className="fas fa-magnifying-glass"></i>
                      Investigadores
                    </h2>
                    <h3></h3>
                    <div className="admin-form-group">
                      <label>Gerencia Jurisdiccional SCH *</label>
                      <div className="admin-input-with-icon">
                        <i className="fas fa-briefcase"></i>
                        <select
                          name="gerencia_responsable"
                          value={formState.gerencia_responsable}
                          onChange={handleChange}
                          required
                          disabled={isGerenciaDisabled}
                          className={isGerenciaDisabled ? 'admin-disabled-field' : ''}
                        >
                          <option value="">Seleccione...</option>
                          {opciones?.gerencias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <label>Ficha</label>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexDirection: 'column', width: '100%' }}>

                        <input
                          type="text"
                          className="admin-input"
                          value={investigadorActual.ficha}
                          onChange={(e) => setInvestigadorActual(prev => ({ ...prev, ficha: e.target.value }))}
                          onKeyDown={(e) => handleEnterBusqueda(e, investigadorActual.ficha, 'investigador')}
                          placeholder="Ingrese ficha y presione Enter o Tab"
                        />

                        {/* SELECTOR ADICIONAL DE INVESTIGADORES */}
                        <div style={{ width: '100%' }}>
                          <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px', display: 'block' }}>
                            O seleccionar por nombre:
                          </label>
                          <select
                            className="admin-input"
                            value="" // Siempre vacio para funcionar como "selector de accion"
                            onChange={(e) => {
                              const fichaSeleccionada = e.target.value;
                              if (fichaSeleccionada) {
                                // Actualizamos estado y disparamos búsqueda
                                setInvestigadorActual(prev => ({ ...prev, ficha: fichaSeleccionada }));
                                buscarEmpleado(fichaSeleccionada, 'investigador');
                              }
                            }}
                          >
                            <option value="">-- Seleccionar Investigador --</option>
                            {listaInvestigadores.map((inv) => (
                              <option key={inv.ficha} value={inv.ficha}>
                                {inv.nombre} ({inv.ficha})
                              </option>
                            ))}
                          </select>
                        </div>

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
                          className="admin-input"
                          value={investigadorActual.extension}
                          onChange={(e) => setInvestigadorActual(prev => ({ ...prev, extension: e.target.value }))}
                          placeholder="Extensión"
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label>Número de Constancia de Habilitación</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={investigadorActual.no_constancia}
                        readOnly
                        style={{ backgroundColor: '#f3f6f8ff', cursor: 'not-allowed' }}
                        placeholder="Se cargará automáticamente al validar ficha"
                      />
                      {pdfError && (
                        <small style={{ color: '#e74c3c', marginTop: '5px', display: 'block' }}>
                          <i className="fas fa-exclamation-circle"></i> {pdfError}
                        </small>
                      )}
                    </div>

                    {/* CUADRO SIMPLE PARA DESCARGAR PDF*/}
                    {mostrarPDF && (
                      <>
                        <div className="admin-form-group" style={{
                          marginTop: '15px',
                          marginBottom: '15px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 15px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <i className="fas fa-file-pdf" style={{
                                color: '#e74c3c',
                                fontSize: '20px'
                              }}></i>
                              <div>
                                <div style={{ fontWeight: '600', color: '#333' }}>
                                  Constancia de Habilitación #{investigadorActual.no_constancia}
                                </div>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#6c757d',
                                  marginTop: '2px'
                                }}>
                                  Disponible para visualización y descarga
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                              {/* BOTÓN PREVISUALIZAR */}
                              <button
                                type="button"
                                onClick={() => {
                                  auditoriaService.logAction('VIEW', `Visualizó constancia de habilitación ${investigadorActual.no_constancia}`);
                                  setShowPdfModal(true);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  backgroundColor: '#17a2b8',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#138496'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
                              >
                                <i className="fas fa-eye"></i>
                                Ver
                              </button>

                              {/* BOTÓN DESCARGAR  */}
                              <button
                                type="button"
                                onClick={handleDescargarPDF}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                              >
                                <i className="fas fa-download"></i>
                                Descargar
                              </button>
                            </div>
                          </div>
                        </div>

                        {showPdfModal && (
                          <DocumentPreviewModal
                            documento={{
                              id: 0,
                              tipo: 'Constancia',
                              nombre_archivo: `${investigadorActual.no_constancia}.pdf`,
                              archivo: pdfUrl,
                              uploaded_at: new Date().toISOString(),
                              descripcion: 'Visualización de Constancia'
                            }}
                            onClose={() => setShowPdfModal(false)}
                            investigacionId={id ? Number(id) : undefined}
                          />
                        )}
                      </>
                    )}

                    <div className="admin-form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        className="admin-input"
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
                )
              }
            </section >
          )}

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
        </form >
      </div >
    </div >
  );
}

export default InvestigacionFormPage;