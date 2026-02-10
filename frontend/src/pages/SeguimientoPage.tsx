import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apliClient';
import { saveAs } from 'file-saver';
import {
  FiArrowLeft, FiUploadCloud, FiFileText, FiTrash2,
  FiCheckCircle, FiDownload, FiX, FiCalendar,
  FiMapPin, FiHash, FiBriefcase,
  FiAlertTriangle, FiInfo, FiEye,
  FiClock
} from 'react-icons/fi';
import type { OpcionesDropdowns, Investigador } from '../types/investigacion.types';
import InvestigadorSearch from '../components/Forms/InvestigadorSearch';
import Swal from 'sweetalert2';
import '../styles/InvestigacionPage.css';
import DocumentPreviewModal from '../components/Modals/DocumentPreviewModal';
import { InvestigacionForm } from '../components/Forms/InvestigacionForm';
import CompletionProgressBar from '../components/DataDisplay/CompletionProgressBar';
import { auditoriaService } from '../api/auditoriaService';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import { getMissingDocuments } from '../utils/validationUtils';
import { IoRadioButtonOff } from 'react-icons/io5';

const TIPOS_OBLIGATORIOS = [
  'Reporte',
  'Citatorio a persona reportada',
  'Acta Audiencia a persona reportada',
  'Dictamen',
  'Notificación a persona reportada',
  'Evidencia de medidas preventivas',
  'Convenio de pago'
];

const TIPOS_COMPLEMENTARIOS = [
  'Citatorio',
  'Actas',
  'Pruebas',
  'Notificación LN o reportante y aplicación sistema',
  'Resición Paraprocesal',
  'Resición Jurídico a Tribunal'
];

const SUBTIPOS_DOCUMENTOS = {
  'Citatorio': ['Persona reportante', 'Testigo de la persona reportante', 'Testigo de la persona reportada'],
  'Actas': ['Persona reportante', 'Testigo de la persona reportante', 'Testigo de la persona reportada']
};

const DOCUMENT_MAPPING: { [key: string]: string } = {
  'Reporte': 'Reporte',
  'Citatorio a persona reportada': 'Citatorio_Reportado',
  'Acta Audiencia a persona reportada': 'Acta_Audiencia_Reportado',
  'Dictamen': 'Dictamen',
  'Notificación a persona reportada': 'Notificacion_a_reportado',
  'Evidencia de medidas preventivas': 'Evidencia de medidas preventivas',
  'Convenio de pago': 'Convenio de pago',
  'Pruebas': 'Pruebas',
  'Notificación LN o reportante y aplicación sistema': 'Notificacion_LN_Reportante',
  'Resición Paraprocesal': 'Resicion_Paraprocesal',
  'Resición Jurídico a Tribunal': 'Resicion_Juridico_a_tribunal'
};

const SUBTYPE_KEY_MAPPING: { [key: string]: { [key: string]: string } } = {
  'Citatorio': {
    'Persona reportante': 'Citatorio_Reportante',
    'Testigo de la persona reportante': 'Citatorio_Testigo',
    'Testigo de la persona reportada': 'Citatorio_Reportado_Testigo'
  },
  'Actas': {
    'Persona reportante': 'Acta_Persona_Reportante',
    'Testigo de la persona reportante': 'Acta_Testigo',
    'Testigo de la persona reportada': 'Acta_Reportado_Testigo'
  }
};


interface Documento {
  id: number;
  tipo: string;
  nombre_archivo: string;
  archivo: string;
  uploaded_at: string;
  descripcion: string;
}

function SeguimientoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [previewFile, setPreviewFile] = useState<Documento | null>(null);

  const [investigacion, setInvestigacion] = useState<any>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'documentos' | 'detalles'>('documentos');
  const [opciones, setOpciones] = useState<OpcionesDropdowns | null>(null);

  // Estado para subida de archivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDoc, setTipoDoc] = useState('Reporte');
  const [subTipoDoc, setSubTipoDoc] = useState('');
  const [descripcionDoc, setDescripcionDoc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [docCategory, setDocCategory] = useState<'obligatorios' | 'complementarios'>('obligatorios');
  const inputRef = useRef<HTMLInputElement>(null);

  const [userRole, setUserRole] = useState<string>('');

  // States for Coadyuvancia/Atraccion
  const [assignmentType, setAssignmentType] = useState<'coadyuvancia' | 'atraccion' | ''>('');
  const [listaInvestigadores, setListaInvestigadores] = useState<{ ficha: string; nombre: string }[]>([]);
  const [newInvestigator, setNewInvestigator] = useState<Investigador>({
    ficha: '',
    nombre: '',
    categoria: '',
    puesto: '',
    extension: '',
    email: '',
    no_constancia: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      let role = localStorage.getItem('userRole');

      if (!role) {
        try {
          // Si no hay rol guardado, intentar obtenerlo
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

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resInv = await apiClient.get(`/api/investigaciones/investigaciones/${id}/`);
      setInvestigacion(resInv.data);
      if (resInv.data.es_coadyuvancia) setAssignmentType('coadyuvancia');
      else if (resInv.data.es_atracción) setAssignmentType('atraccion');

      const opcionesRes = await apiClient.get('/api/investigaciones/opciones/');
      setOpciones(opcionesRes.data);

      const resDocs = await apiClient.get(`/api/investigaciones/documentos/?investigacion_id=${id}`);
      setDocumentos(resDocs.data);

      const resInvestigadores = await apiClient.get('/api/investigaciones/listar-investigadores/').catch(() => ({ data: [] }));
      setListaInvestigadores(resInvestigadores.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (str: string) => {
    if (!str) return 'N/A';
    const [year, month, day] = str.split("-");
    return `${day}/${month}/${year}`;
  };

  // DRAG & DROP
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !id) return;

    let tipoFinal = '';

    if (tipoDoc === 'Citatorio' || tipoDoc === 'Actas') {
      if (subTipoDoc && SUBTYPE_KEY_MAPPING[tipoDoc]) {
        tipoFinal = SUBTYPE_KEY_MAPPING[tipoDoc][subTipoDoc] || '';
      }
    } else {
      tipoFinal = DOCUMENT_MAPPING[tipoDoc] || '';
    }

    if (!tipoFinal) {
      console.error("Tipo de documento no mapeado:", tipoDoc, subTipoDoc);
      Swal.fire('Error', 'Error interno: Tipo de documento no válido para envío.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('investigacion_id', id);
    formData.append('tipo', tipoFinal);
    formData.append('archivo', selectedFile);
    formData.append('descripcion', descripcionDoc);

    try {
      setUploading(true);

      await apiClient.post('/api/investigaciones/documentos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({ icon: 'success', title: 'Documento subido correctamente' });

      removeSelectedFile();
      setDescripcionDoc('');
      setSubTipoDoc('');
      const resDocs = await apiClient.get(`/api/investigaciones/documentos/?investigacion_id=${id}`);
      setDocumentos(resDocs.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (doc: Documento) => {
    auditoriaService.logAction('VIEW', `Visualizó documento: ${doc.tipo} - ${doc.nombre_archivo}`, Number(id));
    const ext = doc.nombre_archivo.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      setPreviewFile(doc);
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Vista previa no disponible',
        text: 'Este formato debe ser descargado para visualizarse.',
        confirmButtonColor: '#840016'
      });
    }
  };

  const handleDownload = (doc: Documento) => {
    auditoriaService.logAction('DOWNLOAD', `Descargó documento: ${doc.tipo} - ${doc.nombre_archivo}`, Number(id));
    saveAs(doc.archivo, doc.nombre_archivo);
  };

  const handleDeleteDoc = async (docId: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar documento?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/api/investigaciones/documentos/${docId}/`);
        setDocumentos(prev => prev.filter(d => d.id !== docId));
        Swal.fire('Eliminado', 'El documento ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  const finalitzarInvestigacion = async () => {
    // Validar documentos obligatorios usando la utilidad centralizada
    const faltantes = getMissingDocuments(investigacion, documentos);

    if (faltantes.length > 0) {
      const listaHtml = faltantes.map(doc => `<li>${doc}</li>`).join('');

      Swal.fire({
        title: 'Documentación Incompleta',
        html: `
          <p>Para concluir la investigación, es obligatorio adjuntar los siguientes documentos:</p>
          <ul style="text-align: left; margin-top: 10px; margin-bottom: 20px; font-weight: bold; color: #840016;">
            ${listaHtml}
          </ul>
        `,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#840016'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Concluir Investigación?',
      text: "El estatus cambiará a Concluida y no podrás subir más archivos.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, concluir',
      confirmButtonColor: '#840016'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/api/investigaciones/investigaciones/${id}/`, { estatus: 'Concluida' });
        setInvestigacion({ ...investigacion, estatus: 'Concluida' });
        Swal.fire('Concluida', 'Investigación cerrada.', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo actualizar el estatus', 'error');
      }
    }
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
              {persona.categoria && (
                <div className="admin-detail-row">
                  <span className="admin-label">Categoría:</span>
                  <span className="admin-value">{persona.categoria}</span>
                </div>
              )}

              {persona.puesto && (
                <div className="admin-detail-row">
                  <span className="admin-label">Puesto:</span>
                  <span className="admin-value">{persona.puesto}</span>
                </div>
              )}

              {persona.email && (
                <div className="admin-detail-row">
                  <span className="admin-label">Email:</span>
                  <span className="admin-value">{persona.email}</span>
                </div>
              )}

              {persona.extension && (
                <div className="admin-detail-row">
                  <span className="admin-label">Extensión:</span>
                  <span className="admin-value">{persona.extension}</span>
                </div>
              )}

              {persona.tipo && (
                <div className="admin-detail-row">
                  <span className="admin-label">Tipo:</span>
                  <span className="admin-badge admin-badge-primary">{persona.tipo}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };


  const handleSearchInvestigator = async (ficha: string) => {
    if (!ficha.trim()) return;

    try {
      // 1. Validar si es investigador autorizado
      try {
        const validacionRes = await apiClient.get(`/api/investigaciones/validar-investigador/?ficha=${ficha}`);
        const datosInvestigadorAutorizado = validacionRes.data;

        if (!datosInvestigadorAutorizado.es_investigador) {
          throw new Error("No autorizado");
        }

        // 2. Buscar datos del empleado
        const response = await apiClient.get(`/api/investigaciones/buscar-empleado/?ficha=${ficha}`);
        const empleado = response.data;

        setNewInvestigator({
          ficha: empleado.ficha,
          nombre: empleado.nombre,
          categoria: empleado.categoria,
          puesto: empleado.puesto,
          email: empleado.email || '',
          extension: empleado.extension || '',
          no_constancia: datosInvestigadorAutorizado.no_constancia
        });

      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'No autorizado',
          text: 'La ficha ingresada no pertenece a un investigador activo con número de constancia registrado.',
        });
        setNewInvestigator(prev => ({ ...prev, ficha: '', nombre: '', no_constancia: '' }));
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al buscar investigador', 'error');
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentType) return;

    try {
      const payload: any = {
        es_coadyuvancia: assignmentType === 'coadyuvancia',
        es_atracción: assignmentType === 'atraccion'
      };

      if (assignmentType === 'atraccion') {
        if (!newInvestigator.ficha) {
          Swal.fire('Error', 'Debe buscar y seleccionar un nuevo investigador para Atracción', 'warning');
          return;
        }
        // Replace investigators list with new one
        // Important: The backend serializer expects 'investigadores' as a list of objects to create relations
        payload.investigadores = [newInvestigator];
        payload.gerencia_responsable = 'GAI';
      } else if (assignmentType === 'coadyuvancia') {
        if (!newInvestigator.ficha) {
          Swal.fire('Error', 'Debe buscar y seleccionar un investigador para agregar como Coadyuvante', 'warning');
          return;
        }
        const existingInvestigators = investigacion.investigadores || [];

        // Check for duplicates
        if (existingInvestigators.some((inv: any) => inv.ficha === newInvestigator.ficha)) {
          Swal.fire('Error', 'El investigador ya está asignado a esta investigación', 'warning');
          return;
        }

        // Add new one marked as coadyuvante
        const nuevoCoadyuvante = { ...newInvestigator, es_coadyuvante: true };

        payload.investigadores = [...existingInvestigators, nuevoCoadyuvante];
      }

      setIsAssigning(true);
      await apiClient.patch(`/api/investigaciones/investigaciones/${id}/`, payload);

      if (assignmentType === 'atraccion') {
        setInvestigacion((prev: any) => ({ ...prev, gerencia_responsable: 'GAI' }));
      }

      Swal.fire('Éxito', 'Asignación actualizada correctamente.', 'success');

      setNewInvestigator({
        ficha: '',
        nombre: '',
        categoria: '',
        puesto: '',
        extension: '',
        email: '',
        no_constancia: ''
      });

      // Refresh data
      fetchData();

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar la asignación', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleToggleSinElementos = async (checked: boolean) => {
    try {
      // 1. Update backend
      await apiClient.patch(`/api/investigaciones/investigaciones/${id}/`, { sin_elementos: checked });

      // 2. Update local state optimistic
      setInvestigacion((prev: any) => ({ ...prev, sin_elementos: checked }));

      // 3. Refresh data to calculate new progress percentage
      fetchData();

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'success',
        title: checked ? 'Marcado como "Sin Elementos"' : 'Desmarcado "Sin Elementos"'
      });

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el estado de la investigación', 'error');
    }
  };

  if (loading) return <div className="admin-register-container">Cargando investigación...</div>;

  return (
    <div className="admin-register-container">
      {/* HEADER Y NAVEGACIÓN */}
      <div className="admin-register-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => navigate('/investigaciones/seguimiento-lista')} className="admin-back-button">
            <FiArrowLeft /> Volver a la lista
          </button>
          <div style={{
            backgroundColor: investigacion?.estatus === 'Concluida' ? '#28a745' :
              investigacion?.estatus === 'Seguimiento' ? '#ffc107' : '#17a2b8',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {investigacion?.estatus}
          </div>
        </div>
        <div className='admin-form-section' style={{ marginBottom: '20px' }}>
          <CompletionProgressBar percentage={investigacion?.porcentaje_completitud || 0} />
        </div>

        {/* RESUMEN PRINCIPAL */}
        <div className='admin-form-section' style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #ecf0f1'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#840016', fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>
              <FiHash /> No. Reporte
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
              {investigacion?.numero_reporte || 'No asignado'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#840016', fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>
              <FiFileText /> Documento Origen
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {investigacion?.nombre_corto}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#840016', fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>
              <FiCalendar /> Fecha de Registro
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {formatDate(investigacion?.fecha_reporte)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#840016', fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>
              <FiMapPin /> Conducta
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {investigacion?.conductas}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#840016', fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>
              <FiBriefcase /> Regional
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {investigacion?.gerencia_responsable}
            </div>
          </div>
        </div>

        {/* PESTAÑAS */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '10px'
        }}>
          <button
            style={{
              padding: '12px 24px',
              background: activeTab === 'documentos' ? '#840016' : 'transparent',
              color: activeTab === 'documentos' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setActiveTab('documentos')}
          >
            <FiFileText /> Expediente Digital
          </button>
          <button
            style={{
              padding: '12px 24px',
              background: activeTab === 'detalles' ? '#840016' : 'transparent',
              color: activeTab === 'detalles' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setActiveTab('detalles')}
          >
            <FiInfo /> Detalles Completos
          </button>
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      {activeTab === 'documentos' ? (
        <div className="admin-register-form-container">

          {/* SECCION PARA DETERMINAR COADYUVANCIA O ATRACCION solo ADMIN, ADMINCENTRAL Y SUPERVISORGAI */}
          {['Admin', 'AdminCentral', 'SupervisorGAI'].includes(userRole) && (
            <div className="admin-form-section" style={{ marginBottom: '10px' }}>
              <h2 className="admin-section-title">
                Coadyuvancia o Atracción
              </h2>
              {investigacion?.es_atracción ? (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  borderRadius: '8px',
                  border: '1px solid #c3e6cb',
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FiCheckCircle size={24} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>Atracción Realizada</h4>
                    <p style={{ margin: '5px 0 0', fontSize: '14px' }}>
                      Esta investigación ya ha sido marcada como atracción.
                    </p>
                  </div>
                </div>
              ) : investigacion?.es_coadyuvancia ? (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#cce5ff',
                  color: '#004085',
                  borderRadius: '8px',
                  border: '1px solid #b8daff',
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FiCheckCircle size={24} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>Coadyuvancia Activa</h4>
                    <p style={{ margin: '5px 0 0', fontSize: '14px' }}>
                      Esta investigación ya tiene asignada una coadyuvancia.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginTop: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      color: '#334155'
                    }}>
                      <input
                        type="radio"
                        name="coadyuvancia_atraccion"
                        value="coadyuvancia"
                        checked={assignmentType === 'coadyuvancia'}
                        onChange={() => setAssignmentType('coadyuvancia')}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#840016'
                        }}
                      />
                      Coadyuvancia
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      color: '#334155'
                    }}>
                      <input
                        type="radio"
                        name="coadyuvancia_atraccion"
                        value="atraccion"
                        checked={assignmentType === 'atraccion'}
                        onChange={() => setAssignmentType('atraccion')}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#840016'
                        }}
                      />
                      Atracción
                    </label>
                  </div>

                  {(assignmentType === 'atraccion' || assignmentType === 'coadyuvancia') && (
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        {assignmentType === 'atraccion' ? 'Nuevo Investigador (para Atracción):' : 'Agregar Coadyuvante:'}
                      </label>
                      <InvestigadorSearch
                        investigador={newInvestigator}
                        setInvestigador={setNewInvestigator}
                        onSearch={(ficha) => handleSearchInvestigator(ficha)}
                        listaInvestigadores={listaInvestigadores}
                      />
                    </div>
                  )}

                  <div style={{ marginTop: '20px' }}>
                    <button
                      onClick={handleSaveAssignment}
                      disabled={isAssigning}
                      style={{
                        background: '#840016',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        opacity: isAssigning ? 0.7 : 1
                      }}
                    >
                      {isAssigning ? 'Guardando...' : 'Guardar y Asignar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SECCION "SIN ELEMENTOS" (Solo Admins/Supervisores si se requiere restricción, por ahora abierto o según rol) */}
          <div className="admin-form-section" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#2d3748' }}>Investigación Sin Elementos</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#718096' }}>
                Marque esta casilla si la investigación no cuenta con elementos suficientes. Esto ajustará los documentos obligatorios a solo <b>Reporte</b> y <b>Dictamen</b>.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: '#2d3748' }}>
              <input
                type="checkbox"
                checked={!!investigacion?.sin_elementos}
                onChange={(e) => handleToggleSinElementos(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#840016', cursor: 'pointer' }}
              />
              Sin Elementos
            </label>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr',
            gap: '30px'
          }}>
            <div className="admin-form-section">
              <h2 className="admin-section-title">
                <FiUploadCloud /> Subir Documento
              </h2>


              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <ButtonIcon
                  text="Obligatorios"
                  onClick={() => { setDocCategory('obligatorios'); setTipoDoc(''); }}
                  icon={<span />}
                  color={docCategory === 'obligatorios' ? '#840016' : '#e2e8f0'}
                  hoverColor={docCategory === 'obligatorios' ? '#a50121' : '#cbd5e1'}
                  style={{
                    flex: 1,
                    color: docCategory === 'obligatorios' ? 'white' : '#64748b',
                    justifyContent: 'center'
                  }}
                />
                <ButtonIcon
                  text="Complementarios"
                  onClick={() => { setDocCategory('complementarios'); setTipoDoc(''); }}
                  icon={<span />}
                  color={docCategory === 'complementarios' ? '#840016' : '#e2e8f0'}
                  hoverColor={docCategory === 'complementarios' ? '#a50121' : '#cbd5e1'}
                  style={{
                    flex: 1,
                    color: docCategory === 'complementarios' ? 'white' : '#64748b',
                    justifyContent: 'center'
                  }}
                />
              </div>

              {investigacion?.conductas?.toLowerCase().includes('acoso sexual') &&
                !documentos.some(d => d.tipo === 'Evidencia de medidas preventivas' || d.nombre_archivo.toLowerCase().includes('evidencia')) && (
                  <div style={{
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #ffeeba',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                  }}>
                    <FiAlertTriangle style={{ fontSize: '24px' }} />
                    <div>
                      <strong>¡Atención!</strong>
                      <p style={{ margin: '5px 0 0' }}>
                        Al ser un caso de <strong>Hostigamiento o Acoso Sexual</strong>, es obligatorio adjuntar el archivo:
                        <br />
                        <em>"Evidencia de medidas preventivas"</em>.
                      </p>
                    </div>
                  </div>
                )}

              {investigacion?.economica &&
                !documentos.some(d => d.tipo === 'Convenio de pago' || d.nombre_archivo.toLowerCase().includes('convenio')) && (
                  <div style={{
                    background: '#cce5ff',
                    color: '#004085',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #b8daff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                  }}>
                    <FiAlertTriangle style={{ fontSize: '24px' }} />
                    <div>
                      <strong>¡Atención!</strong>
                      <p style={{ margin: '5px 0 0' }}>
                        Al implicar <strong>Repercusión Económica</strong>, es obligatorio adjuntar el archivo:
                        <br />
                        <em>"Convenio de pago"</em>.
                      </p>
                    </div>
                  </div>
                )}

              {investigacion?.estatus === 'Concluida' ? (
                <div style={{
                  background: '#d4edda',
                  color: '#155724',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #c3e6cb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px'
                }}>
                  <FiCheckCircle /> Esta investigación está concluida. No se pueden subir más archivos.
                </div>
              ) : (
                <>
                  <form onSubmit={handleUpload}>
                    <div className="admin-form-group">
                      <label>Tipo de Documento</label>
                      <select
                        className="admin-input"
                        value={tipoDoc}
                        onChange={(e) => {
                          setTipoDoc(e.target.value);
                          setSubTipoDoc('');
                        }}
                        style={{ padding: '12px', background: 'white' }}
                      >
                        {(docCategory === 'obligatorios' ? TIPOS_OBLIGATORIOS : TIPOS_COMPLEMENTARIOS).filter(tipo => {
                          if (tipo === 'Evidencia de medidas preventivas') {
                            return investigacion?.conductas?.toLowerCase().includes('acoso sexual') ||
                              investigacion?.conductas?.toLowerCase().includes('hostigamiento');
                          }
                          if (tipo === 'Convenio de pago') {
                            return investigacion?.economica;
                          }
                          return true;
                        }).map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                      {(tipoDoc === 'Citatorio' || tipoDoc === 'Actas') && (
                        <div className="admin-form-group">
                          <label>Subtipo de {tipoDoc}</label>
                          <select
                            className="admin-input"
                            value={subTipoDoc}
                            onChange={(e) => setSubTipoDoc(e.target.value)}
                            style={{ padding: '12px', background: 'white' }}
                            required
                          >
                            <option value="">Seleccione una opción</option>
                            {SUBTIPOS_DOCUMENTOS[tipoDoc as keyof typeof SUBTIPOS_DOCUMENTOS].map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      )}


                    </div>



                    <div className="admin-form-group">
                      <label>Descripción (Opcional)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={descripcionDoc}
                        onChange={(e) => setDescripcionDoc(e.target.value)}
                        placeholder="Ej. Firmado por gerente, versión final, etc."
                        style={{ padding: '12px' }}
                      />
                    </div>

                    {/* ZONA DRAG & DROP */}
                    <div
                      style={{
                        border: `2px dashed ${dragActive ? '#840016' : '#cbd5e1'}`,
                        borderRadius: '12px',
                        padding: '30px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: dragActive ? '#f8f0f0' : '#f8f9fa',
                        marginBottom: '20px'
                      }}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />

                      {!selectedFile ? (
                        <div>
                          <FiUploadCloud style={{ fontSize: '48px', color: '#840016', marginBottom: '10px' }} />
                          <p style={{ color: '#333', marginBottom: '5px' }}>
                            Arrastra tu archivo aquí o <span style={{ color: '#840016', fontWeight: '600' }}>haz clic para seleccionar</span>
                          </p>
                          <small style={{ color: '#666' }}>Soporta: PDF, Word, Imágenes (Máx. 10MB)</small>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          padding: '15px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <FiFileText style={{ fontSize: '32px', color: '#840016' }} />
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ color: '#333', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {selectedFile.name}
                            </div>
                            <div style={{ color: '#666', fontSize: '14px' }}>
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeSelectedFile(); }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc3545',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FiX />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="admin-submit-button"
                      disabled={uploading || !selectedFile}
                      style={{ width: '100%', marginTop: '10px' }}
                    >
                      {uploading ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '50%',
                            borderTopColor: 'white',
                            animation: 'spin 1s linear infinite',
                            marginRight: '8px'
                          }}></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <FiUploadCloud />
                          Subir Documento
                        </>
                      )}
                    </button>
                  </form>

                  {investigacion?.estatus === 'Seguimiento' && (
                    <div style={{
                      marginTop: '30px',
                      paddingTop: '20px',
                      borderTop: '1px solid #ecf0f1',
                      textAlign: 'center'
                    }}>
                      <button
                        type="button"
                        onClick={finalitzarInvestigacion}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <FiCheckCircle /> Concluir Investigación
                      </button>
                      <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                        Al concluir, no se podrán subir más documentos.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* COLUMNA DERECHA: Lista de Documentos */}
            <div className="admin-form-section">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 className="admin-section-title">
                  <FiFileText /> Documentos del Expediente
                </h2>
                <span style={{
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {documentos.length} archivos
                </span>
              </div>

              {documentos.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666',
                  border: '2px dashed #dcdfe4',
                  borderRadius: '12px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <FiFileText style={{ fontSize: '48px', color: '#bbb', marginBottom: '15px' }} />
                  <h3 style={{ color: '#555', marginBottom: '10px' }}>No hay documentos cargados</h3>
                  <p>Comienza subiendo el primer documento usando el formulario de la izquierda.</p>
                </div>
              ) : (
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
                        {investigacion?.estatus !== 'Concluida' && (
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
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
                              color: '#dc3545'
                            }}
                            title="Eliminar"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <InvestigacionForm
          id={id}
          isEmbedded={true}
          onSuccess={() => {
            fetchData();
            Swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: 'La información de la investigación ha sido actualizada correctamente',
              timer: 2000,
              showConfirmButton: false
            });
          }}
          onCancel={() => setActiveTab('documentos')}
        />
      )
      }

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <DocumentPreviewModal
        documento={previewFile}
        onClose={() => setPreviewFile(null)}
        investigacionId={id ? Number(id) : undefined}
      />
    </div >
  );
}

export default SeguimientoPage;