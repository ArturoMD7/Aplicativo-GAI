import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiDownload,
  FiEye,
  FiFileText,
  FiImage,
  FiFile,
  FiFolder,
  FiPaperclip
} from 'react-icons/fi';
import { saveAs } from 'file-saver';
import apiClient from '../../api/apliClient';
import Swal from 'sweetalert2';
import './DocumentosModals.css';
import DocumentPreviewModal from './DocumentPreviewModal';

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
}

const DocumentosModals: React.FC<Props> = ({ investigacionId, isOpen, onClose, numeroReporte }) => {
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
      const res = await apiClient.get(`/api/investigaciones/documentos/?investigacion_id=${investigacionId}`);
      setDocumentos(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los archivos adjuntos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: Documento) => {
    saveAs(doc.archivo, doc.nombre_archivo);
  };

  const handlePreview = (doc: Documento) => {
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
      {/* --- MODAL PRINCIPAL: LISTA DE ARCHIVOS --- */}
      <div className="doc-modal-overlay">
        <div className="doc-modal-container">

          {/* Header */}
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
                <p>No hay documentos adjuntos en esta investigación.</p>
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
      />
    </>
  );
};

export default DocumentosModals;