import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUpload, FiFileText } from 'react-icons/fi';
import apiClient from '../../api/apliClient';
import './DocumentosModals.css';

interface InvestigadorModalProps {
    user: any;
    onClose: () => void;
    onSuccess: () => void;
}

const InvestigadorModal: React.FC<InvestigadorModalProps> = ({ user, onClose, onSuccess }) => {
    const [noConstancia, setNoConstancia] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [isInvestigador, setIsInvestigador] = useState(false);
    const [investigadorId, setInvestigadorId] = useState<number | null>(null);
    const [existingFile, setExistingFile] = useState<string | null>(null);

    useEffect(() => {
        if (user.investigador) {
            setIsInvestigador(true);
            setInvestigadorId(user.investigador.id);
            setNoConstancia(user.investigador.no_constancia || '');
            setExistingFile(user.investigador.archivo_constancia);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('user', user.id);
        formData.append('no_constancia', noConstancia);
        if (archivo) {
            formData.append('archivo_constancia', archivo);
        }

        try {
            if (isInvestigador && investigadorId) {
                // Update
                await apiClient.patch(`/api/investigadores/management/${investigadorId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Create
                await apiClient.post('/api/investigadores/management/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            alert('Información de investigador guardada correctamente.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving investigator:', error);
            alert('Error al guardar la información.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="doc-modal-overlay">
            <div className="doc-modal-overlay-bg" onClick={onClose} />
            <div className="doc-modal-container">
                <div className="doc-modal-header">
                    <h3 className="doc-modal-title">
                        <FiFileText style={{ marginRight: '10px' }} />
                        Gestionar Investigador: {user.username}
                    </h3>
                    <button onClick={onClose} className="doc-btn-close">
                        <FiX />
                    </button>
                </div>

                <div className="doc-modal-body">
                    <form onSubmit={handleSubmit} className="doc-upload-form">
                        <div className="form-group">
                            <label>Número de Constancia:</label>
                            <input
                                type="text"
                                value={noConstancia}
                                onChange={(e) => setNoConstancia(e.target.value)}
                                className="form-control"
                                placeholder="Ej: GAI-C-001"
                            />
                        </div>

                        <div className="form-group">
                            <label>Constancia (PDF):</label>
                            <div className="file-input-wrapper">
                                <label htmlFor="constancia-upload" className="file-upload-label">
                                    <FiUpload style={{ marginRight: '8px' }} />
                                    {archivo ? archivo.name : 'Seleccionar archivo...'}
                                </label>
                                <input
                                    id="constancia-upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setArchivo(e.target.files[0]);
                                        }
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            {existingFile && !archivo && (
                                <p style={{ fontSize: '0.9rem', color: '#198754', marginTop: '5px' }}>
                                    Archivo actual: <a href={`http://localhost:8000${existingFile}`} target="_blank" rel="noreferrer">Ver Constancia</a>
                                </p>
                            )}
                        </div>

                        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={onClose} className="btn-cancel" style={{ marginRight: '10px' }}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? 'Guardando...' : <><FiSave style={{ marginRight: '5px' }} /> Guardar</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InvestigadorModal;
