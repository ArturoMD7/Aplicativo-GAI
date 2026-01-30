
import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiDownload } from 'react-icons/fi';
import { saveAs } from 'file-saver';
import './DocumentosModals.css';
import Watermark from '@uiw/react-watermark';
import apiClient from '../../api/apliClient';

interface Documento {
    id: number;
    tipo: string;
    nombre_archivo: string;
    archivo: string;
    uploaded_at: string;
    descripcion: string;
}

interface UserHeaderProfile {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    profile_picture: string | null;
    ficha: string | null;
}

interface DocumentPreviewModalProps {
    documento: Documento | null;
    onClose: () => void;
}


const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ documento, onClose }) => {
    const [userProfile, setUserProfile] = useState<UserHeaderProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiClient.get('/api/user/profile/');
                setUserProfile(response.data);
            } catch (error) {
                console.error("Error fetching user profile for watermark", error);
            }
        };
        fetchProfile();
    }, []);

    if (!documento) return null;

    const handleDownload = () => {
        saveAs(documento.archivo, documento.nombre_archivo);
    };

    const isPdf = documento.nombre_archivo.toLowerCase().endsWith('.pdf');

    return (
        <div className="doc-modal-overlay" style={{ zIndex: 1100 }}>
            {/* Añadimos onClick al overlay para cerrar si se da clic fuera */}
            <div className="doc-modal-overlay-bg" onClick={onClose} style={{ position: 'absolute', inset: 0 }} />

            <div className="doc-modal-container large" style={{ zIndex: 1101, position: 'relative' }}>
                <div className="doc-modal-header">
                    <h3 className="doc-modal-title">
                        <FiEye style={{ marginRight: '10px' }} />
                        Vista Previa
                        <span className="doc-modal-subtitle">{documento.nombre_archivo}</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleDownload}
                            className="doc-btn-close"
                            title="Descargar"
                            style={{ color: '#198754' }}
                        >
                            <FiDownload />
                        </button>
                        <button onClick={onClose} className="doc-btn-close" title="Cerrar Vista Previa">
                            <FiX />
                        </button>
                    </div>
                </div>

                <div className="doc-modal-body preview-body" style={{ position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        overflow: 'hidden'
                    }}>
                        <Watermark
                            content={[userProfile?.ficha || '']}
                            style={{ background: 'transparent', height: '100%' }}
                            fontColor="rgba(200, 200, 200, 0.5)"
                            rotate={-20}
                            gapX={100}
                            gapY={50}
                            width={120}
                            height={60}
                            fontSize={16}
                        >
                            <div style={{ width: '100%', height: '100%' }}></div>
                        </Watermark>
                    </div>

                    {isPdf ? (
                        <iframe
                            src={documento.archivo}
                            title="Visor PDF"
                            width="100%"
                            height="100%"
                            style={{ border: 'none', background: 'white', borderRadius: '4px', position: 'relative', zIndex: 1 }}
                        />
                    ) : (
                        <img
                            src={documento.archivo}
                            alt="Vista previa"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', position: 'relative', zIndex: 1 }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
