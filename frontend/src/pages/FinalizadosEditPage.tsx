import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import apiClient from '../api/apliClient';
import ExpedienteView from '../components/Investigaciones/ExpedienteView';
import { FiArrowLeft, FiHash, FiFileText, FiCalendar, FiMapPin, FiBriefcase, FiInfo } from 'react-icons/fi';
import CompletionProgressBar from '../components/DataDisplay/CompletionProgressBar';
import '../styles/InvestigacionPage.css'; // Ensure we use the same CSS

const FinalizadosEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [investigacion, setInvestigacion] = useState<any>(null);
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'documentos'>('documentos'); // Solo tab documentos activo visualmente

    const fetchData = async () => {
        try {
            setLoading(true);
            const resInv = await apiClient.get(`/api/investigaciones/investigaciones/${id}/`);
            setInvestigacion(resInv.data);

            const resDocs = await apiClient.get(`/api/investigaciones/documentos/?investigacion_id=${id}`);
            setDocumentos(resDocs.data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
            navigate('/investigaciones/finalizadas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const handleBack = () => {
        navigate('/investigaciones/finalizacion-lista');
    };

    // Formato de fecha
    const formatDate = (str: string) => {
        if (!str) return 'N/A';
        const [year, month, day] = str.split("-");
        return `${day}/${month}/${year}`;
    };

    if (loading) {
        return <div className="admin-register-container">Cargando investigación...</div>;
    }

    if (!investigacion) {
        return <div className="admin-register-container">Investigación no encontrada</div>;
    }

    return (
        <div className="admin-register-container">
            {/* HEADER Y NAVEGACIÓN */}
            <div className="admin-register-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={handleBack}
                        className="admin-back-button"
                    >
                        <FiArrowLeft /> Volver a la lista
                    </button>
                    <div style={{
                        backgroundColor: '#28a745', // Concluida always green
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}>
                        Concluida
                    </div>
                </div>

                <div className='admin-form-section' style={{ marginBottom: '20px' }}>
                    <CompletionProgressBar
                        percentage={investigacion.progreso || 100}
                        missingFields={[]}
                        showMissingDetails={false}
                    />
                </div>

                {/* RESUMEN PRINCIPAL */}
                <div className='admin-form-section' style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '-30px',
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

            </div>

            {/* CONTENIDO (ExpedienteView) */}
            <div className="admin-register-form-container">
                <ExpedienteView
                    investigacion={investigacion}
                    documentos={documentos}
                    onUploadSuccess={fetchData}
                    onDeleteSuccess={fetchData}
                />
            </div>
        </div>
    );
};

export default FinalizadosEditPage;
