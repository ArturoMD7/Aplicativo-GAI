import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apliClient';
import type { Baja } from '../../types/baja.types';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import { FiSave, FiArrowLeft, FiUser, FiFileText, FiInfo, FiSearch, FiTrash2, FiDownload, FiEye, FiUploadCloud } from 'react-icons/fi';
import Swal from 'sweetalert2';
import '../../styles/BajaDetails.css';
import DocumentPreviewModal from '../../components/Modals/DocumentPreviewModal';
import { auditoriaService } from '../../api/auditoriaService';
import CompletionProgressBar from '../../components/DataDisplay/CompletionProgressBar';

interface DocumentoBaja {
    id: number;
    baja: number;
    tipo: string;
    archivo: string;
    descripcion?: string;
    uploaded_at: string;
}

// Interface compatible with DocumentPreviewModal
interface Documento {
    id: number;
    tipo: string;
    nombre_archivo: string;
    archivo: string;
    uploaded_at: string;
    descripcion: string;
}



const DOCUMENT_OBLIGATORY_TYPES = [
    'Estimación de cálculo de terminación',
    'Solicitud',
    'Formato de conformidad y/o Acta Constancia',
    'Comunicación a GIMP'
];

const DOCUMENT_OPTIONAL_TYPES = [
    'INE',
    'Formato de adeudos',
];

const initialState: Baja = {
    ficha: '',
    nombre: '',
    nivel: '',
    nuevo_nivel: '',
    nuevo_grado: '',
    costo_plaza: '',
    costo_nueva_plaza: '',
    ahorro: 0,
    direccion: '',
    subdireccion: '',
    region: 'NORTE',
    tramite: 'LIQUIDACIÓN',
    liquidacion_neta: 0,
    observaciones: '',
    status: 'RECHAZÓ',
    fecha_ejecucion: '',
    origen: '',
    sap: 'PENDIENTE',
    posicion: '',
    cambio_plaza: '',
    antiguedad: 0,
    libre: false,
    confirmacion_descenso: false,
    observaciones_2: '',
    cancelada: false,
    fuente: '',
    regional: '',
    comentarios: '',
};

function BajaFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [formState, setFormState] = useState<Baja>(initialState);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // State for employee metadata to fetch cost
    const [empleadoMeta, setEmpleadoMeta] = useState({ jornada: '', grado: '' });

    // Function to fetch cost from API
    const fetchCostoPlaza = async (nivel: string, jornada: string, grado: string): Promise<string> => {
        if (!nivel || !jornada) return '0.00';
        try {
            // Ensure jornada has 2 digits
            const jornadaFmt = jornada.length === 1 ? `0${jornada}` : jornada;

            // Fixed endpoint to match urls.py
            const response = await apiClient.get(`/api/investigaciones/obtener-costo-plaza/`, {
                params: {
                    nivel,
                    jornada: jornadaFmt,
                    grado
                }
            });

            if (response.data.costo_anual) {
                // Assuming formatNumber is available or we use a simple formatter
                return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(response.data.costo_anual);
            }
            return '0.00';
        } catch (error) {
            console.error("Error obteniendo costo plaza:", error);
            return '0.00';
        }
    };
    const [documentos, setDocumentos] = useState<DocumentoBaja[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<Documento | null>(null);
    const [activeTab, setActiveTab] = useState<'obligatorios' | 'opcionales'>('obligatorios');

    // Progress Calculation
    const uploadedObligatory = documentos.filter(d => DOCUMENT_OBLIGATORY_TYPES.includes(d.tipo));
    const progress = Math.round((uploadedObligatory.length / DOCUMENT_OBLIGATORY_TYPES.length) * 100);
    const missingDocs = DOCUMENT_OBLIGATORY_TYPES.filter(type => !documentos.some(d => d.tipo === type));

    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            fetchBaja(id);
            fetchDocumentos(id);
        }
    }, [id]);

    const handleGenerarOficio = async () => {
        // Validation now justchecks if we have enough data to generate something useful
        if (!formState.ficha || !formState.nombre) {
            Swal.fire('Atención', 'Debe ingresar al menos Ficha y Nombre para generar el oficio', 'warning');
            return;
        }

        try {
            setLoading(true);

            // Use PREVIEW endpoint logic
            // Send current form state as POST data
            const response = await apiClient.post(`/api/bajas/previsualizar-oficio/`, formState, {
                responseType: 'blob',
            });

            // Crear link de descarga
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Conformidad_${formState.ficha || 'Previsualizacion'}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Only show success toast, not a big alert to not interrupt flow
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            Toast.fire({ icon: 'success', title: 'Oficio generado' });

        } catch (error) {
            console.error("Error al generar oficio:", error);
            Swal.fire('Error', 'No se pudo generar el documento', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchBaja = async (bajaId: string) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/bajas/bajas/${bajaId}/`);
            setFormState(response.data);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo cargar la información.', 'error');
            navigate('/bajas');
        } finally {
            setLoading(false);
        }
    };

    const fetchDocumentos = async (bajaId: string) => {
        try {
            const response = await apiClient.get(`/api/bajas/documentos-bajas/?baja_id=${bajaId}`);
            setDocumentos(response.data);
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    };

    const formatNumber = (num: number | string): string => {
        if (!num) return '';
        const parsed = parseFloat(num.toString().replace(/,/g, ''));
        if (isNaN(parsed)) return '';
        const fixed = parsed.toFixed(2);
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const parseNumber = (str: string): string => {
        return str.replace(/,/g, '');
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const cleanValue = value.replace(/[^0-9.]/g, '');
        if ((cleanValue.match(/\./g) || []).length > 1) return;
        if (cleanValue.includes('.')) {
            const [, decimal] = cleanValue.split('.');
            if (decimal.length > 2) return;
        }

        const formatted = formatNumber(cleanValue);
        setFormState(prev => ({ ...prev, [name]: formatted }));
    };

    const handleCurrencyChangeNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Validate input
        const cleanValue = value.replace(/[^0-9.]/g, '');
        if ((cleanValue.match(/\./g) || []).length > 1) return;
        if (cleanValue.includes('.')) {
            const [, decimal] = cleanValue.split('.');
            if (decimal.length > 2) return;
        }

        const numericValue = cleanValue === '' ? 0 : parseFloat(cleanValue);
        setFormState(prev => ({ ...prev, [name]: numericValue }));
    };

    // Calculate Ahorro whenever costs or tramite change
    useEffect(() => {
        const costoPlazaRaw = parseNumber(formState.costo_plaza || '0');
        const costoNuevaPlazaRaw = parseNumber(formState.costo_nueva_plaza || '0');

        const cp = parseFloat(costoPlazaRaw) || 0;
        const cnp = parseFloat(costoNuevaPlazaRaw) || 0;

        let ahorro = 0;
        if (cnp > cp) {
            Swal.fire('Error', 'El costo de la nueva plaza debe ser menor al costo de la plaza actual.', 'error');
            return;
        }
        if (cnp == 0) {
            ahorro = 0;
        } else if (formState.tramite === 'DESCENSO') {
            ahorro = cp - cnp;
        } else {
            ahorro = cp - cnp;
        }

        setFormState(prev => {
            if (prev.ahorro !== ahorro) {
                return { ...prev, ahorro };
            }
            return prev;
        });
    }, [formState.costo_plaza, formState.costo_nueva_plaza, formState.tramite]);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let processedValue: any = value;

        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            processedValue = e.target.checked;
        } else if (type === 'number') {
            processedValue = value === '' ? 0 : parseFloat(value);
        }

        setFormState(prev => ({ ...prev, [name]: processedValue }));

        // Trigger fetch for new level cost
        if (name === 'nuevo_nivel') {
            // For levels that require grade, we wait for grade selection. 
            // For others, we fetch immediately using default/empty grade.
            if (!['44', '45', '46'].includes(value)) {
                const newCosto = await fetchCostoPlaza(value, empleadoMeta.jornada, '');
                setFormState(prev => ({ ...prev, costo_nueva_plaza: newCosto }));
            } else {
                // Reset cost if level requires grade but no grade selected yet (implied by changing level)
                setFormState(prev => ({ ...prev, costo_nueva_plaza: '0.00', nuevo_grado: '' }));
            }
        }
    };

    const handleEnterBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            buscarEmpleado(formState.ficha);
        }
    };

    const buscarEmpleado = async (ficha: string) => {
        if (!ficha.trim()) return;

        try {
            const response = await apiClient.get(`/api/investigaciones/buscar-empleado/?ficha=${ficha}`);
            const empleado = response.data;

            const regionalEmpleado = empleado.regional || '';
            let regionAsignada = 'NORTE';

            if (regionalEmpleado) {
                const regionalUpper = regionalEmpleado.toUpperCase();
                if (['NORTE', 'SUR', 'SURESTE', 'ALTIPLANO', 'GAI'].includes(regionalUpper)) {
                    regionAsignada = regionalUpper;
                }
                else if (regionalUpper.includes('SUR') && !regionalUpper.includes('SURESTE')) {
                    regionAsignada = 'SUR';
                }
                else if (regionalUpper.includes('NORTE')) {
                    regionAsignada = 'NORTE';
                }
                else if (regionalUpper.includes('SURESTE')) {
                    regionAsignada = 'SURESTE';
                }
                else if (regionalUpper.includes('ALTIPLANO')) {
                    regionAsignada = 'ALTIPLANO';
                }
                else if (regionalUpper.includes('GAI')) {
                    regionAsignada = 'GAI';
                }
            }

            const currentJornada = empleado.jornada || '00';
            const currentGrado = empleado.grupo || '';

            setEmpleadoMeta({
                jornada: currentJornada,
                grado: currentGrado
            });

            const costoActual = await fetchCostoPlaza(empleado.nivel, currentJornada, currentGrado);

            setFormState(prev => ({
                ...prev,
                nombre: empleado.nombre || '',
                nivel: empleado.nivel || '',
                antiguedad: empleado.antiguedad || 0,
                posicion: empleado.puesto || '',
                direccion: empleado.direccion || '',
                subdireccion: empleado.subdireccion || '',
                fuente: empleado.fuente || '',
                regional: empleado.regional || '',
                region: regionAsignada,
                costo_plaza: costoActual, // Update cost with fetched value
            }));

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'success',
                title: 'Empleado encontrado'
            });

        } catch (err: any) {
            console.error(err);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'error',
                title: 'Empleado no encontrado'
            });
        }
    };

    const [pendingUploads, setPendingUploads] = useState<{ tipo: string, file: File }[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate basic fields
        if (!formState.ficha || !formState.nombre) {
            Swal.fire('Error', 'Por favor complete los campos obligatorios', 'error');
            return;
        }

        // Validation for Grado
        if (['44', '45', '46'].includes(formState.nivel) && !formState.grado) {
            Swal.fire('Atención', `Debe seleccionar un Grado para el nivel ${formState.nivel}`, 'warning');
            return;
        }

        setLoading(true);

        try {
            let newId = id;

            if (isEditMode && id) {
                await apiClient.put(`/api/bajas/bajas/${id}/`, formState);
                Swal.fire('Actualizado', 'Registro actualizado correctamente', 'success');
            } else {
                const response = await apiClient.post('/api/bajas/bajas/', formState);
                newId = response.data.id;
                // Swal.fire('Guardado', 'Registro creado correctamente', 'success'); // Don't show success yet if uploads pending
            }

            // Process Pending Uploads if creating or editing
            if (pendingUploads.length > 0 && newId) {
                const uploadPromises = pendingUploads.map(async (upload) => {
                    const formData = new FormData();
                    formData.append('baja', newId!);
                    formData.append('tipo', upload.tipo);
                    formData.append('archivo', upload.file);

                    return apiClient.post('/api/bajas/documentos-bajas/', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                });

                await Promise.all(uploadPromises);
            }

            Swal.fire('Listo', 'Registro y documentos guardados correctamente', 'success');
            navigate('/bajas');
        } catch (err: any) {
            console.error(err);
            Swal.fire('Error', 'Error al guardar el registro o documentos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }, tipo: string) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        // If creating (no ID), just queue it
        if (!id) {
            setPendingUploads(prev => {
                // Remove existing if replacing
                const filtered = prev.filter(p => p.tipo !== tipo);
                return [...filtered, { tipo, file }];
            });
            // Reset input value to allow re-selection if needed? 
            // Actually difficult with React styling, but let's assume it works.
            return;
        }

        // Existing logic for immediate upload if editing
        const formData = new FormData();
        formData.append('baja', id);
        formData.append('tipo', tipo);
        formData.append('archivo', file);

        setUploadingDoc(tipo);

        try {
            await apiClient.post('/api/bajas/documentos-bajas/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({ icon: 'success', title: 'Documento subido correctamente' });

            fetchDocumentos(id);
        } catch (error) {
            console.error("Error uploading document:", error);
            Swal.fire('Error', 'Error al subir el documento', 'error');
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/api/bajas/documentos-bajas/${docId}/`);
                Swal.fire('Eliminado', 'El documento ha sido eliminado.', 'success');
                if (id) fetchDocumentos(id);
            } catch (error) {
                console.error("Error deleting document:", error);
                Swal.fire('Error', 'No se pudo eliminar el documento', 'error');
            }
        }
    };

    const handleDownload = async (doc: DocumentoBaja) => {
        try {
            const filename = doc.archivo.split('/').pop() || doc.tipo;
            auditoriaService.logAction('DOWNLOAD', `Descargó documento baja: ${doc.tipo} - ${filename}`, Number(id) || 0);

            const response = await apiClient.get(`/api/bajas/documentos-bajas/${doc.id}/download/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar:", error);
            Swal.fire('Error', 'No se pudo descargar el archivo', 'error');
        }
    };

    const handlePreview = (doc: DocumentoBaja) => {
        const filename = doc.archivo.split('/').pop() || doc.tipo;
        auditoriaService.logAction('VIEW', `Visualizó documento baja: ${doc.tipo} - ${filename}`, Number(id) || 0);

        // Helper for DocumentPreviewModal interface
        const previewDoc: Documento = {
            id: doc.id,
            tipo: doc.tipo,
            nombre_archivo: filename,
            archivo: doc.archivo,
            uploaded_at: doc.uploaded_at,
            descripcion: doc.descripcion || ''
        };

        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
            setPreviewFile(previewDoc);
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Vista previa no disponible',
                text: 'Este formato debe ser descargado para visualizarse.',
                confirmButtonColor: '#840016'
            });
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, tipo: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Mock event object to reuse handleFileUpload logic
            const mockEvent = { target: { files: e.dataTransfer.files } };
            handleFileUpload(mockEvent, tipo);
        }
    };

    const handleDeletePending = (tipo: string) => {
        setPendingUploads(prev => prev.filter(p => p.tipo !== tipo));
    };

    if (loading && isEditMode && !formState.id) return <div className="loading-message">Cargando...</div>;

    // Logic for phases
    const status = formState.estatus_baja || 'REGISTRO';

    // SAAI (inc Personal & Movimiento) - Editable ONLY in REGISTRO
    const isSaaiLocked = status !== 'REGISTRO';

    // GIMP - Visible in SEGUIMIENTO+, Editable in SEGUIMIENTO
    const showGimp = ['SEGUIMIENTO', 'FINALIZACION', 'CONCLUIDA'].includes(status);
    const isGimpLocked = status !== 'SEGUIMIENTO';

    // GOIE - Visible in FINALIZACION+, Editable in FINALIZACION
    const showGoie = ['FINALIZACION', 'CONCLUIDA'].includes(status);
    const isGoieLocked = status !== 'FINALIZACION';

    return (
        <div className="admin-register-container">
            <div className="admin-register-form-container">
                <div className="admin-register-header">
                    <ButtonIcon
                        variant="custom"
                        onClick={() => navigate('/bajas')}
                        icon={<FiArrowLeft />}
                        text="Volver a la lista"
                        className="admin-mb-1"
                    />
                    <h1>{isEditMode ? 'Editar Registro de Baja' : 'Nuevo Registro de Baja'}</h1>
                    <p>Complete la información del formulario a continuación</p>
                </div>

                <CompletionProgressBar
                    percentage={progress}
                    missingFields={missingDocs}
                    showMissingDetails={true}
                />

                <form onSubmit={handleSubmit}>
                    {/* Sección 1: Datos del Empleado */}
                    <section className={`admin-form-section admin-full-width ${isSaaiLocked ? 'readOnly' : ''}`}>
                        <h2 className="admin-section-title">
                            <FiUser /> Datos de SAAI
                        </h2>
                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Origen</label>
                                <input
                                    type="text"
                                    name="origen"
                                    value={formState.origen}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly={isSaaiLocked}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Fecha Ejecución</label>
                                <input
                                    type="date"
                                    name="fecha_ejecucion"
                                    value={formState.fecha_ejecucion || ''}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly={isSaaiLocked}
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Trámite</label>
                                <select
                                    name="tramite"
                                    value={formState.tramite}
                                    onChange={handleChange}
                                    className="admin-select"
                                    disabled={isSaaiLocked}
                                >
                                    <option value="LIQUIDACIÓN">LIQUIDACIÓN</option>
                                    <option value="DESCENSO">DESCENSO</option>
                                    <option value="JUBILACIÓN">JUBILACIÓN</option>
                                    <option value="RESCATADO(A)">RESCATADO(A)</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label>Estatus</label>
                                <select
                                    name="status"
                                    value={formState.status}
                                    onChange={handleChange}
                                    className="admin-select"
                                    disabled={isSaaiLocked}
                                >
                                    <option value="RECHAZÓ">RECHAZÓ</option>
                                    <option value="ACEPTÓ">ACEPTÓ</option>
                                    <option value="AUSENCIA">AUSENCIA</option>
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="RESCATADO(A)">RESCATADO(A)</option>
                                    <option value="SIN CONTRATO VIGENTE">SIN CONTRATO VIGENTE</option>
                                </select>
                            </div>
                        </div>

                        <h3 className="admin-section-subtitle">
                            <i className="fas fa-bullhorn admin-icon-mr"></i>
                            Datos de personal
                        </h3>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Ficha *</label>
                                <div className="admin-input-with-icon">
                                    <input
                                        type="text"
                                        name="ficha"
                                        value={formState.ficha}
                                        onChange={handleChange}
                                        onKeyDown={handleEnterBusqueda}
                                        required
                                        maxLength={15}
                                        className="admin-input"
                                        placeholder="Número de ficha (Presione Enter)"
                                        readOnly={isSaaiLocked}
                                    />
                                    {!isSaaiLocked && (
                                        <FiSearch className="admin-search-icon" onClick={() => buscarEmpleado(formState.ficha)} />
                                    )}
                                </div>
                            </div>
                            <div className="admin-form-group readOnly ">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formState.nombre}
                                    onChange={handleChange}
                                    required
                                    maxLength={40}
                                    className="admin-input"
                                    placeholder="Nombre completo"
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly ">
                                <label>Fuente</label>
                                <input
                                    type="text"
                                    name="fuente"
                                    value={formState.fuente}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group readOnly ">
                                <label>Regional</label>
                                <input
                                    type="text"
                                    name="regional"
                                    value={formState.regional}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly ">
                                <label>Nivel Actual</label>
                                <input
                                    type="text"
                                    name="nivel"
                                    value={formState.nivel}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Nuevo Nivel</label>
                                <input
                                    type="text"
                                    name="nuevo_nivel"
                                    value={formState.nuevo_nivel}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                    readOnly={isSaaiLocked}
                                />
                            </div>
                        </div>

                        {/* Conditional Grado Input for current level 44, 45, 46 */}
                        {['44', '45', '46'].includes(formState.nivel) && (
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Grado (Obligatorio para nivel {formState.nivel})</label>
                                    <select
                                        value={formState.grado || ''}
                                        onChange={async (e) => {
                                            const newGrado = e.target.value;
                                            setFormState(prev => ({ ...prev, grado: newGrado }));
                                            setEmpleadoMeta(prev => ({ ...prev, grado: newGrado }));
                                            const newCosto = await fetchCostoPlaza(formState.nivel, empleadoMeta.jornada, newGrado);
                                            setFormState(prev => ({ ...prev, costo_plaza: newCosto, grado: newGrado }));
                                        }}
                                        className="admin-select"
                                    >
                                        <option value="">Seleccione Grado</option>
                                        {formState.nivel === '44' && ['G1', 'G2', 'G3', 'G4', 'G5'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                        {formState.nivel === '45' && ['S1', 'S2', 'S3', 'S4', 'S5'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                        {formState.nivel === '46' && ['D1', 'D2'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Conditional Nuevo Grado Input for nuevo_nivel 44, 45, 46 */}
                        {['44', '45', '46'].includes(formState.nuevo_nivel) && (
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Nuevo Grado (Obligatorio para nivel {formState.nuevo_nivel})</label>
                                    <select
                                        value={formState.nuevo_grado || ''}
                                        onChange={async (e) => {
                                            const newGrado = e.target.value;
                                            setFormState(prev => ({ ...prev, nuevo_grado: newGrado }));
                                            const newCosto = await fetchCostoPlaza(formState.nuevo_nivel, empleadoMeta.jornada, newGrado);
                                            setFormState(prev => ({ ...prev, costo_nueva_plaza: newCosto }));
                                        }}
                                        className="admin-select"
                                    >
                                        <option value="">Seleccione Grado</option>
                                        {formState.nuevo_nivel === '44' && ['G1', 'G2', 'G3', 'G4', 'G5'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                        {formState.nuevo_nivel === '45' && ['S1', 'S2', 'S3', 'S4', 'S5'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                        {formState.nuevo_nivel === '46' && ['D1', 'D2'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}



                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly ">
                                <label>Antigüedad (Años)</label>
                                <input
                                    type="number"
                                    name="antiguedad"
                                    value={formState.antiguedad}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group readOnly ">
                                <label>Posición</label>
                                <input
                                    type="text"
                                    name="posicion"
                                    value={formState.posicion}
                                    onChange={handleChange}
                                    maxLength={20}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly ">
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formState.direccion}
                                    onChange={handleChange}
                                    maxLength={10}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group readOnly">
                                <label>Subdirección</label>
                                <input
                                    type="text"
                                    name="subdireccion"
                                    value={formState.subdireccion}
                                    onChange={handleChange}
                                    maxLength={10}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                        </div>


                        <h3 className="admin-section-subtitle">
                            <i className="fas fa-bullhorn admin-icon-mr"></i>
                            Datos de Movimiento
                        </h3>

                        <div className="admin-form-row">

                            <div className="admin-form-group">
                                <label>Región</label>
                                <select
                                    name="region"
                                    value={formState.region}
                                    onChange={handleChange}
                                    className="admin-select"
                                    disabled={isSaaiLocked}
                                >
                                    <option value="NORTE">NORTE</option>
                                    <option value="SUR">SUR</option>
                                    <option value="SURESTE">SURESTE</option>
                                    <option value="ALTIPLANO">ALTIPLANO</option>
                                    <option value="GAI">GAI</option>
                                </select>
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly">
                                <label>Costo Plaza</label>
                                <input
                                    type="text"
                                    name="costo_plaza"
                                    value={formState.costo_plaza}
                                    onChange={handleCurrencyChange}
                                    className="admin-input"
                                    placeholder="0.00"
                                    readOnly
                                />
                            </div>
                            {formState.tramite === 'DESCENSO' && (
                                <div className="admin-form-group readOnly">
                                    <label>Costo Nueva Plaza</label>
                                    <input
                                        type="text"
                                        name="costo_nueva_plaza"
                                        value={formState.costo_nueva_plaza}
                                        onChange={handleCurrencyChange}
                                        className="admin-input"
                                        placeholder="0.00"
                                        readOnly
                                    />
                                </div>
                            )}
                        </div>

                        <div className="admin-form-row">
                            {formState.tramite === 'DESCENSO' && (
                                <div className="admin-form-group readOnly">
                                    <label>Ahorro</label>
                                    <input
                                        type="text"
                                        name="ahorro"
                                        value={formatNumber(formState.ahorro || 0)}
                                        readOnly
                                        className="admin-input"
                                        placeholder="0.00"
                                    />
                                </div>
                            )}
                            {formState.tramite === 'LIQUIDACIÓN' && (
                                <div className="admin-form-group">
                                    <label>Liquidación Neta</label>
                                    <input
                                        type="text"
                                        name="liquidacion_neta"
                                        value={formatNumber(formState.liquidacion_neta || 0)}
                                        onChange={handleCurrencyChangeNumber}
                                        className="admin-input"
                                        placeholder="0.00"
                                        readOnly={isSaaiLocked}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="admin-form-group">
                            <label>Observaciones</label>
                            <textarea
                                name="observaciones"
                                value={formState.observaciones}
                                onChange={handleChange}
                                className="admin-textarea"
                                readOnly={isSaaiLocked}
                            />
                        </div>


                    </section>
                    <section className={`admin-form-section admin-full-width ${isSaaiLocked ? 'readOnly' : ''}`}>
                        <h2 className="admin-section-title">
                            <FiUser /> Datos de Notificación
                        </h2>
                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly">
                                <label>Ficha</label>
                                <input
                                    type="text"
                                    name="ficha"
                                    value={formState.ficha}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group readOnly">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formState.nombre}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Fecha Oficio</label>
                                <input
                                    type="date"
                                    name="fecha_oficio"
                                    value={formState.fecha_oficio}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Fecha Ultimo Día Laboral</label>
                                <input
                                    type="date"
                                    name="fecha_ultimo_dia_laboral"
                                    value={formState.fecha_ultimo_dia_laboral}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Representante Patronal</label>
                                <input
                                    type="text"
                                    name="representante_patronal"
                                    value={formState.representante_patronal}
                                    onChange={handleChange}
                                    className="admin-input"

                                />
                            </div>
                            <div className="admin-form-group">
                                <ButtonIcon
                                    variant="download"
                                    text="Generar Oficio"
                                    icon={<FiFileText />}
                                    onClick={handleGenerarOficio}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </section>
                    {/* Sección 3: Trámite y Estatus */}
                    {showGimp && (
                        <section className={`admin-form-section admin-full-width ${isGimpLocked ? 'readOnly' : ''}`}>
                            <h2 className="admin-section-title">
                                <FiFileText /> Datos de GIMP
                            </h2>


                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>SAP Status</label>
                                    <select
                                        name="sap"
                                        value={formState.sap}
                                        onChange={handleChange}
                                        className="admin-select"
                                        disabled={isGimpLocked}
                                    >
                                        <option value="PENDIENTE">PENDIENTE</option>
                                        <option value="APLICADO">APLICADO</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>Cambio Plaza</label>
                                    <input
                                        type="text"
                                        name="cambio_plaza"
                                        value={formState.cambio_plaza}
                                        onChange={handleChange}
                                        maxLength={8}
                                        className="admin-input"
                                        readOnly={isGimpLocked}
                                    />
                                </div>

                            </div>

                            <div className="admin-checkbox-container admin-checkbox-row">
                                <label className="admin-checkbox-container">
                                    <input type="checkbox" name="libre" checked={formState.libre} onChange={handleChange} disabled={isGimpLocked} />
                                    <span>Libre</span>
                                </label>
                                <label className="admin-checkbox-container">
                                    <input type="checkbox" name="confirmacion_descenso" checked={formState.confirmacion_descenso} onChange={handleChange} disabled={isGimpLocked} />
                                    <span>Confirmación Descenso</span>
                                </label>
                            </div>
                        </section>
                    )}

                    {/* Sección 4: Observaciones y Detalles */}
                    {showGoie && (
                        <section className={`admin-form-section admin-full-width ${isGoieLocked ? 'readOnly' : ''}`}>
                            <h2 className="admin-section-title">
                                <FiInfo /> Datos de GOIE
                            </h2>

                            <div className="admin-form-group">
                                <label>Fecha de Registro</label>
                                <input
                                    type="date"
                                    name="fecha_registro"
                                    value={formState.fecha_registro}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly={isGoieLocked}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Observaciones GOIE</label>
                                <textarea
                                    name="observaciones_2"
                                    value={formState.observaciones_2}
                                    onChange={handleChange}
                                    className="admin-textarea"
                                    readOnly={isGoieLocked}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Comentarios</label>
                                <textarea
                                    name="comentarios"
                                    value={formState.comentarios}
                                    onChange={handleChange}
                                    className="admin-textarea"
                                    readOnly={isGoieLocked}
                                />
                            </div>

                            <div className="admin-checkbox-container admin-checkbox-row">

                                <label className="admin-checkbox-container">
                                    <input type="checkbox" name="cancelada" checked={formState.cancelada} onChange={handleChange} disabled={isGoieLocked} />
                                    <span>Cancelada</span>
                                </label>
                            </div>
                        </section>
                    )}


                    <section className="admin-form-section admin-full-width">
                        <h2 className="admin-section-title">
                            <FiFileText /> Documentos de Baja
                        </h2>

                        {/* Toggle Buttons */}
                        <div className="admin-tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <ButtonIcon
                                variant={activeTab === 'obligatorios' ? 'add' : 'custom'}
                                onClick={() => setActiveTab('obligatorios')}
                                text="Obligatorios"
                                icon={<FiFileText />}
                                style={{
                                    backgroundColor: activeTab === 'obligatorios' ? '#1e5b4f' : '#f0f0f0',
                                    color: activeTab === 'obligatorios' ? 'white' : '#333',
                                    border: '1px solid #ccc'
                                }}
                            />
                            <ButtonIcon
                                variant={activeTab === 'opcionales' ? 'add' : 'custom'}
                                onClick={() => setActiveTab('opcionales')}
                                text="Opcionales"
                                icon={<FiFileText />}
                                style={{
                                    backgroundColor: activeTab === 'opcionales' ? '#1e5b4f' : '#f0f0f0',
                                    color: activeTab === 'opcionales' ? 'white' : '#333',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div className="admin-docs-grid">
                            {(activeTab === 'obligatorios' ? DOCUMENT_OBLIGATORY_TYPES : DOCUMENT_OPTIONAL_TYPES).map(tipo => {
                                const doc = documentos.find(d => d.tipo === tipo);
                                const pendingDoc = pendingUploads.find(p => p.tipo === tipo);
                                const isUploaded = !!doc;
                                const isPending = !!pendingDoc;

                                return (
                                    <div
                                        key={tipo}
                                        className={`admin-doc-card ${isUploaded || isPending ? 'uploaded' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, tipo)}
                                    >
                                        {/* Header Title inside the box if doc exists, or just part of layout */}
                                        {isUploaded ? (
                                            <div className="admin-doc-content">
                                                <div className="admin-doc-icon-wrapper">
                                                    <FiFileText className="admin-doc-icon-svg" />
                                                </div>

                                                <h4 className="admin-doc-title">{tipo}</h4>
                                                <p className="admin-doc-date">
                                                    {new Date(doc!.uploaded_at).toLocaleDateString()}
                                                </p>

                                                <div className="admin-doc-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePreview(doc!)}
                                                        className="admin-doc-btn view"
                                                        title="Ver"
                                                    >
                                                        <FiEye />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(doc!)}
                                                        className="admin-doc-btn download"
                                                        title="Descargar"
                                                    >
                                                        <FiDownload />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDocument(doc!.id)}
                                                        className="admin-doc-btn delete"
                                                        title="Eliminar"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isPending ? (
                                            <div className="admin-doc-content">
                                                <div className="admin-doc-icon-wrapper">
                                                    <FiFileText className="admin-doc-icon-svg" style={{ color: '#d35400' }} />
                                                </div>
                                                <h4 className="admin-doc-title">{tipo}</h4>
                                                <p className="admin-doc-date" style={{ color: '#d35400', fontWeight: 'bold' }}>
                                                    Pendiente de guardar
                                                </p>
                                                <p className="admin-upload-subtext">{pendingDoc!.file.name}</p>

                                                <div className="admin-doc-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePending(tipo)}
                                                        className="admin-doc-btn delete"
                                                        title="Quitar"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="admin-upload-wrapper">
                                                <div className="admin-upload-type-label">
                                                    {tipo}
                                                </div>
                                                {uploadingDoc === tipo ? (
                                                    <div className="spinner-border text-secondary admin-spinner" role="status">
                                                        <span className="sr-only">Cargando...</span>
                                                    </div>
                                                ) : (
                                                    <label htmlFor={`file-upload-${tipo}`} className="admin-upload-label">
                                                        <FiUploadCloud className="admin-upload-icon" />
                                                        <p className="admin-upload-text">
                                                            Arrastra tu archivo aquí o <span className="admin-upload-highlight">haz clic para seleccionar</span>
                                                        </p>
                                                        <small className="admin-upload-subtext">Soporta: PDF, Word, Imágenes (Máx. 10MB)</small>
                                                    </label>
                                                )}
                                                <input
                                                    id={`file-upload-${tipo}`}
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileUpload(e, tipo)}
                                                    style={{ display: 'none' }}
                                                    disabled={!!uploadingDoc}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>


                    <div className="admin-form-actions">
                        <ButtonIcon
                            variant="view"
                            type="button"
                            icon={<FiArrowLeft />}
                            onClick={() => navigate('/bajas')}
                            className="admin-back-button"
                            text="Cancelar"
                        />
                        <ButtonIcon
                            variant="custom"
                            type="submit"
                            icon={<FiSave />}
                            text={isEditMode ? "Actualizar" : "Guardar Baja"}
                            disabled={loading}
                            className="admin-submit-button"
                        />
                    </div>
                </form>
            </div>
            {/* Modal de Vista Previa */}
            <DocumentPreviewModal
                documento={previewFile}
                onClose={() => setPreviewFile(null)}
                investigacionId={Number(id) || undefined} // Pasamos el ID aunque no sea una investigación para el log (o podemos manejar lo del id en el modal)
            />
        </div >
    );
}

export default BajaFormPage;
