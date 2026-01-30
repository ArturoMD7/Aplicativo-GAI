import React, { useState } from 'react';
import apiClient from '../../api/apliClient';
import Swal from 'sweetalert2';
import { FiUpload, FiCheck, FiSave, FiXCircle } from 'react-icons/fi';
import ButtonIcon from '../Buttons/ButtonIcon';
import './ResponsivaUploadModal.css';

interface ResponsivaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    ficha: string;
    onUploadSuccess: () => void;
}

const ResponsivaUploadModal: React.FC<ResponsivaUploadModalProps> = ({ isOpen, onClose, ficha, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                Swal.fire('Error', 'Solo se permiten archivos PDF', 'error');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('archivo_responsiva', file);

        try {
            // Using 'management' viewset which looks up by ficha
            await apiClient.patch(`/api/investigadores/management/${ficha}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Swal.fire({
                title: '¡Éxito!',
                text: 'La responsiva se ha subido correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
            });
            onUploadSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Ocurrió un error al subir el archivo.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="responsiva-modal-overlay">
            <div className="responsiva-modal-content" style={{ maxWidth: '450px', padding: '2rem' }}>
                <h2 style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1rem' }}>
                    Atención Requerida
                </h2>

                <p style={{ color: '#555', marginBottom: '1.5rem' }}>
                    Hemos detectado que aún no has subido tu <strong>Carta Responsiva</strong>.
                    Es necesario que cargues este documento para completar tu perfil.
                </p>

                <div className={`upload-area ${file ? 'has-file' : ''}`} style={{ marginBottom: '1.5rem', borderColor: file ? '#198754' : '#ccc' }}>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="file-input-hidden"
                    />

                    {file ? (
                        <div className="file-selected-info">
                            <FiCheck size={24} />
                            <span>{file.name}</span>
                        </div>
                    ) : (
                        <div className="upload-placeholder">
                            <FiUpload />
                            <span>Haz clic o arrastra tu PDF aquí</span>
                            <small>Máximo 5MB</small>
                        </div>
                    )}
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <ButtonIcon
                        variant="custom"
                        color="#6c757d"
                        hoverColor="#5a6268"
                        text="Hacerlo más tarde"
                        icon={<FiXCircle />}
                        onClick={onClose}
                        disabled={uploading}
                    />
                    <ButtonIcon
                        variant="edit"
                        text={uploading ? 'Subiendo...' : 'Guardar y Subir'}
                        icon={<FiSave />}
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    />
                </div>
            </div>
        </div>
    );
};

export default ResponsivaUploadModal;
