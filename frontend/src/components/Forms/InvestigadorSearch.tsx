import React, { useState, useEffect } from 'react';
import { FiEye, FiDownload } from 'react-icons/fi';
import apiClient from '../../api/apliClient';
import type { Investigador } from '../../types/investigacion.types';
import DocumentPreviewModal from '../Modals/DocumentPreviewModal';

interface InvestigadorSearchProps {
    investigador: Investigador;
    setInvestigador: (inv: Investigador) => void;
    onSearch: (ficha: string, tipo: 'investigador') => void;
    listaInvestigadores: { ficha: string; nombre: string }[];

    // Optional children (e.g. Buttons)
    children?: React.ReactNode;
}

const InvestigadorSearch: React.FC<InvestigadorSearchProps> = ({
    investigador,
    setInvestigador,
    onSearch,
    listaInvestigadores,
    children
}) => {
    const [mostrarPDF, setMostrarPDF] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [pdfError, setPdfError] = useState<string>('');
    const [showPdfModal, setShowPdfModal] = useState(false);

    // PDF Validation Logic reused from InvestigacionForm
    useEffect(() => {
        const { no_constancia } = investigador;

        // Reset if no constancia
        if (!no_constancia) {
            setMostrarPDF(false);
            setPdfUrl('');
            setPdfError('');
            return;
        }

        const timeoutId = setTimeout(async () => {
            const fileName = `${no_constancia}.pdf`;

            try {
                const response = await apiClient.get(`/api/investigadores/check-constancia/${fileName}/`);

                if (response.data.exists) {
                    setPdfUrl(fileName);
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
                setPdfError('Error al buscar la constancia.');
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [investigador.no_constancia]);

    const handleDescargarPDF = async () => {
        const { no_constancia } = investigador;
        const fileName = no_constancia ? `${no_constancia}.pdf` : '';

        if (fileName) {
            try {
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            onSearch(investigador.ficha, 'investigador');
        }
    };

    return (
        <div className="admin-personas-section">
            <h2 className="admin-section-title">
                <i className="fas fa-magnifying-glass"></i>
                Investigadores
            </h2>
            <div className="admin-form-group">
                <label>Ficha</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexDirection: 'column', width: '100%' }}>

                    <input
                        type="text"
                        className="admin-input"
                        value={investigador.ficha}
                        onChange={(e) => setInvestigador({ ...investigador, ficha: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder="Ingrese ficha y presione Enter o Tab"
                    />

                    {/* SELECTOR ADICIONAL DE INVESTIGADORES */}
                    <div style={{ width: '100%' }}>
                        <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px', display: 'block' }}>
                            O seleccionar por nombre:
                        </label>
                        <select
                            className="admin-input"
                            value=""
                            onChange={(e) => {
                                const fichaSeleccionada = e.target.value;
                                if (fichaSeleccionada) {
                                    // Trigger search with the selected ficha
                                    // We update logic slightly: pass the new ficha to onSearch or update state then search?
                                    // The parent onSearch typically takes (ficha, type).
                                    // But we also need to update the local state to match.
                                    // The original code did: setInvestigadorCurrent(...) AND buscarEmpleado(...)

                                    // Update parent state first (or via prop)
                                    const updatedInv = { ...investigador, ficha: fichaSeleccionada };
                                    setInvestigador(updatedInv);
                                    // Then search
                                    onSearch(fichaSeleccionada, 'investigador');
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
                    <input type="text" value={investigador.nombre} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                    <label>Categoría</label>
                    <input type="text" value={investigador.categoria} readOnly className="admin-readonly-field" />
                </div>
            </div>

            <div className="admin-form-row">
                <div className="admin-form-group">
                    <label>Puesto</label>
                    <input type="text" value={investigador.puesto} readOnly className="admin-readonly-field" />
                </div>
                <div className="admin-form-group">
                    <label>Extensión</label>
                    <input
                        type="text"
                        className="admin-input"
                        value={investigador.extension || ''}
                        onChange={(e) => setInvestigador({ ...investigador, extension: e.target.value })}
                        placeholder="Extensión"
                    />
                </div>
            </div>

            <div className="admin-form-group">
                <label>Número de constancia de habilitación</label>
                <input
                    type="text"
                    className="admin-input"
                    value={investigador.no_constancia}
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
                                        Constancia de Habilitación #{investigador.no_constancia}
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
                                    onClick={() => setShowPdfModal(true)}
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
                                    <FiEye />
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
                                    <FiDownload />
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
                                nombre_archivo: `${investigador.no_constancia}.pdf`,
                                archivo: pdfUrl,
                                uploaded_at: new Date().toISOString(),
                                descripcion: 'Visualización de Constancia'
                            }}
                            onClose={() => setShowPdfModal(false)}
                        />
                    )}
                </>
            )}

            <div className="admin-form-group">
                <label>Email</label>
                <input
                    type="email"
                    className="admin-input"
                    value={investigador.email || ''}
                    onChange={(e) => setInvestigador({ ...investigador, email: e.target.value })}
                    placeholder="Correo electrónico"
                />
            </div>

            {/* Optional Action Button (passed as children) */}
            {children && (
                <div style={{ marginTop: '20px' }}>
                    {children}
                </div>
            )}

        </div>
    );
};

export default InvestigadorSearch;
