import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiDownload,
  FiEye,
  FiFileText,
  FiImage,
  FiFile,
  FiFolder
} from 'react-icons/fi';
import { saveAs } from 'file-saver';
import apiClient from '../../api/apliClient';
import Swal from 'sweetalert2';
import './DocumentosModals.css';
import DocumentPreviewModal from './DocumentPreviewModal';
import { auditoriaService } from '../../api/auditoriaService';

interface Documento {
  id: number;
  tipo: string;
  nombre_archivo: string;
  archivo: string;
  uploaded_at: string;
  descripcion: string;
}

interface Props {
  investigacionId: number | null;
  isOpen: boolean;
  onClose: () => void;
  numeroReporte: string;
  sourceType?: 'investigacion' | 'baja'; // New prop to determine source
}

const DocumentosModals: React.FC<Props> = ({ investigacionId, isOpen, onClose, numeroReporte, sourceType = 'investigacion' }) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<Documento | null>(null);

  useEffect(() => {
    if (isOpen && investigacionId) {
      fetchDocumentos();
    } else {
      setDocumentos([]);
      setPreviewFile(null); // Resetear preview
    }
  }, [isOpen, investigacionId]);

  const fetchDocumentos = async () => {
    setLoading(true);
    try {
      let url = '';
      if (sourceType === 'baja') {
        url = `/api/bajas/documentos-bajas/?baja_id=${investigacionId}`;
      } else {
        url = `/api/investigaciones/documentos/?investigacion_id=${investigacionId}`;
      }

      const res = await apiClient.get(url);

      // Map response to Documento interface if needed
      // Bajas might return 'archivo' as full URL and not have 'nombre_archivo'
      const mappedDocs = res.data.map((doc: any) => ({
        ...doc,
        nombre_archivo: doc.nombre_archivo || doc.archivo.split('/').pop() || 'documento'
      }));

      setDocumentos(mappedDocs);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los archivos adjuntos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Documento) => {
    if (sourceType === 'baja') {
      try {
        const response = await apiClient.get(`/api/bajas/documentos-bajas/${doc.id}/download/`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.nombre_archivo);
        document.body.appendChild(link);
        link.click();
        link.remove();
        auditoriaService.logAction('DOWNLOAD', `Descargó documento baja: ${doc.tipo}`, investigacionId || 0);
      } catch (error) {
        console.error("Error al descargar:", error);
        Swal.fire('Error', 'No se pudo descargar el archivo', 'error');
      }
    } else {
      auditoriaService.logAction('DOWNLOAD', `Descargó documento: ${doc.tipo} - ${doc.nombre_archivo}`, investigacionId || 0);
      saveAs(doc.archivo, doc.nombre_archivo);
    }
  };

  const handlePreview = (doc: Documento) => {
    const ext = doc.nombre_archivo.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      auditoriaService.logAction('VIEW', `Visualizó documento: ${doc.tipo} - ${doc.nombre_archivo}`, investigacionId || 0);
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

  // Helper para elegir icono según extensión
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FiFileText className="doc-type-icon doc-pdf-icon" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <FiImage className="doc-type-icon doc-img-icon" />;
    return <FiFile className="doc-type-icon" />;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="doc-modal-overlay">
        <div className="doc-modal-container">

          <div className="doc-modal-header">
            <h3 className="doc-modal-title">
              <FiFolder style={{ marginRight: '10px', color: '#840016' }} />
              Expediente Digital
              <span className="doc-modal-subtitle">Ref: {numeroReporte}</span>
            </h3>
            <button onClick={onClose} className="doc-btn-close" title="Cerrar">
              <FiX />
            </button>
          </div>

          {/* Body */}
          <div className="doc-modal-body">
            {loading ? (
              <div className="doc-loading">
                <div className="spinner-border" style={{ marginBottom: 10 }}></div>
                <span>Cargando documentación...</span>
              </div>
            ) : documentos.length === 0 ? (
              <div className="doc-empty">
                <FiFolder className="doc-empty-icon" />
                <p>No hay documentos adjuntos en este registro.</p>
              </div>
            ) : (
              <ul className="doc-list">
                {documentos.map((doc) => (
                  <li key={doc.id} className="doc-item">
                    <div className="doc-file-info">
                      {getFileIcon(doc.nombre_archivo)}
                      <div className="doc-details">
                        <span className="doc-filename" title={doc.nombre_archivo}>
                          {doc.nombre_archivo}
                        </span>
                        <span className="doc-meta">
                          {doc.tipo} • {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                        {doc.descripcion && (
                          <span className="doc-meta" style={{ fontStyle: 'italic' }}>
                            "{doc.descripcion}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="doc-actions">
                      <button
                        onClick={() => handlePreview(doc)}
                        className="doc-btn-action primary"
                        title="Visualizar"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="doc-btn-action download"
                        title="Descargar"
                      >
                        <FiDownload />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL SECUNDARIO: VISTA PREVIA --- */}
      <DocumentPreviewModal
        documento={previewFile}
        onClose={() => setPreviewFile(null)}
        investigacionId={investigacionId || undefined}
      />
    </>
  );
};

export default DocumentosModals;