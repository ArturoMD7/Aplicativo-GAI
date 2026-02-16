import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import apiClient from '../../api/apliClient';
import DocumentPreviewModal from '../Modals/DocumentPreviewModal';
import { FiUploadCloud, FiFileText, FiX, FiEye, FiDownload } from 'react-icons/fi';

// Tipos básicos copiados o importados si existen
interface Documento {
    id: number;
    tipo: string;
    nombre_archivo: string;
    archivo: string;
    uploaded_at: string;
    descripcion: string;
}

interface ExpedienteViewProps {
    investigacion: any;
    documentos: Documento[];
    onUploadSuccess: () => void;
    onDeleteSuccess: () => void;
    readOnly?: boolean;
}

const TIPOS_COMPLEMENTARIOS = [
    'Citatorio',
    'Actas',
    'Pruebas',
    'Notificación LN o reportante y aplicación sistema',
    'Documento Paraprocesal',
    'Documento del Jurídico al Tribunal'
];

const SUBTIPOS_DOCUMENTOS = {
    'Citatorio': ['Persona reportante', 'Testigo de la persona reportante', 'Testigo de la persona reportada'],
    'Actas': ['Persona reportante', 'Testigo de la persona reportante', 'Testigo de la persona reportada']
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

const DOCUMENT_MAPPING: { [key: string]: string } = {
    'Citatorio': 'Citatorio', // Fallback, though usually handled by subtype
    'Actas': 'Actas',         // Fallback
    'Pruebas': 'Pruebas',
    'Notificación LN o reportante y aplicación sistema': 'Notificacion_LN_Reportante',
    'Documento Paraprocesal': 'Resicion_Paraprocesal',
    'Documento del Jurídico al Tribunal': 'Resicion_Juridico_a_tribunal'
};

const ExpedienteView: React.FC<ExpedienteViewProps> = ({
    investigacion,
    documentos,
    onUploadSuccess,
    onDeleteSuccess,
    readOnly = false
}) => {
    // Estados locales para carga de archivos
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tipoDoc, setTipoDoc] = useState('Pruebas'); // Default valid type
    const [subTipoDoc, setSubTipoDoc] = useState('');
    const [descripcionDoc, setDescripcionDoc] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewFile, setPreviewFile] = useState<Documento | null>(null);

    // Formato de fecha
    const formatDate = (str: string) => {
        if (!str) return 'N/A';
        const [year, month, day] = str.split("-");
        return `${day}/${month}/${year}`;
    };

    // Drag & Drop handlers
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
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    // Upload Logic
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !investigacion?.id) return;

        let tipoFinal = '';

        if (tipoDoc === 'Citatorio' || tipoDoc === 'Actas') {
            if (subTipoDoc && SUBTYPE_KEY_MAPPING[tipoDoc]) {
                tipoFinal = SUBTYPE_KEY_MAPPING[tipoDoc][subTipoDoc] || '';
            }
        } else {
            tipoFinal = DOCUMENT_MAPPING[tipoDoc] || tipoDoc;
        }

        if (!tipoFinal) {
            Swal.fire('Error', 'Seleccione un tipo y subtipo de documento válido', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('investigacion_id', investigacion.id.toString());
        formData.append('tipo', tipoFinal);
        formData.append('archivo', selectedFile);
        formData.append('descripcion', descripcionDoc);

        try {
            setUploading(true);
            await apiClient.post('/api/investigaciones/documentos/', formData, {
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

            removeSelectedFile();
            setDescripcionDoc('');
            setSubTipoDoc(''); // Reset subtype
            onUploadSuccess(); // Callback to refresh parent
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al subir el archivo', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: Documento) => {
        try {
            const response = await apiClient.get(`/api/investigaciones/documentos/${doc.id}/download/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.nombre_archivo); // o extraer del header
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar:", error);
            Swal.fire('Error', 'No se pudo descargar el archivo', 'error');
        }
    };

    const handlePreview = (doc: Documento) => {
        setPreviewFile(doc);
    };

    return (
        <div className="admin-register-form-container">


            {/* 2. EXPEDIENTE - SOLO COMPLEMENTARIOS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) 1fr',
                gap: '30px',
                alignItems: 'start'
            }}>

                {/* COLUMNA IZQUIERDA: Formulario de Subida */}
                <div className="admin-form-section">
                    <div style={{ width: '100%', padding: '10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', textAlign: 'center', color: '#0369a1', fontWeight: '600', marginBottom: '20px' }}>
                        Solo Documentos Complementarios Permitidos
                    </div>

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
                                {TIPOS_COMPLEMENTARIOS.map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selector Subtipo Dinámico */}
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

                        <div className="admin-form-group">
                            <label>Descripción (Opcional)</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={descripcionDoc}
                                onChange={(e) => setDescripcionDoc(e.target.value)}
                                placeholder="Ej. Firmado por gerente, versión final..."
                                style={{ padding: '12px' }}
                            />
                        </div>

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
                                        Arrastra archivo o <span style={{ color: '#840016', fontWeight: '600' }}>clic aquí</span>
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '15px', padding: '10px',
                                    background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0'
                                }}>
                                    <FiFileText size={24} color="#840016" />
                                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {selectedFile.name}
                                    </div>
                                    <FiX color="red" onClick={(e) => { e.stopPropagation(); removeSelectedFile(); }} />
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="admin-submit-button"
                            disabled={uploading || !selectedFile}
                            style={{ width: '100%' }}
                        >
                            {uploading ? 'Subiendo...' : 'Subir Documento'}
                        </button>
                    </form>
                </div>

                {/* COLUMNA DERECHA: Lista style matching SeguimientoPage */}
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


                    <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                        {documentos.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>Sin documentos.</p>}
                    </div>
                </div>
            </div>

            <DocumentPreviewModal
                documento={previewFile}
                onClose={() => setPreviewFile(null)}
                investigacionId={investigacion?.id}
            />
        </div>
    );
};

export default ExpedienteView;
