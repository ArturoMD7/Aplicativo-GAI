import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apliClient';
import {
    FiUser, FiMail, FiBriefcase, FiShield,
    FiFileText, FiAlertTriangle, FiDownload, FiEye
} from 'react-icons/fi';
import ButtonIcon from '../../components/Buttons/ButtonIcon';

import '../../styles/Auth/UserInfoPage.css'; // Asumiendo que crearás este archivo o usarás estilos inline/existentes

interface UserDashboardData {
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        groups: string[];
        ficha: string | null;
        profile_picture: string | null;
    };
    empleado: {
        nombre: string;
        nivel: string;
        categoria: string;
        puesto: string;
        edad: number;
        antiguedad: number;
        direccion: string;
        regimen: string;
        sindicato: string;
    } | null;
    investigador: {
        es_investigador: boolean;
        no_constancia: string | null;
    };
    stats: {
        total: number;
        en_proceso: number;
        concluidas: number;
    };
}

const UserInfoPage = () => {
    const { userId } = useParams<{ userId: string }>();
    const [data, setData] = useState<UserDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [myInvestigaciones, setMyInvestigaciones] = useState<any[]>([]);
    const [showMyList, setShowMyList] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get(`/api/investigaciones/user-dashboard/${userId}/`);
                setData(response.data);
            } catch (err: any) {
                console.error(err);
                setError('Error al cargar la información del usuario.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    const handleDownloadConstancia = async () => {
        if (data?.investigador.no_constancia) {
            const fileName = `${data.investigador.no_constancia}.pdf`;
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
                alert("Error al descargar la constancia. Verifique que el archivo exista.");
            }
        }
    };

    const handleToggleList = async () => {
        if (!showMyList && myInvestigaciones.length === 0) {
            try {
                const response = await apiClient.get(`/api/investigaciones/user-dashboard/${userId}/list/`);
                setMyInvestigaciones(response.data);
            } catch (e) {
                console.error("Error fetching investigations list:", e);
            }
        }
        setShowMyList(!showMyList);
    };

    if (loading) return <div className="p-8 text-center">Cargando información del usuario...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!data) return <div className="p-8 text-center">No se encontraron datos.</div>;

    const { user, empleado, investigador, stats } = data;

    return (
        <div className="user-info-page">
            <div className="page-header">
                <h1><FiUser /> Detalles del Usuario</h1>
                <ButtonIcon to="/users" variant="view" text="Volver a Usuarios" />
            </div>

            <div className="user-dashboard-grid">
                {/* Columna Izquierda: Perfil Básico */}
                <div className="dashboard-card profile-card">
                    <div className="profile-header">
                        <div className="profile-image-large">
                            {user.profile_picture ? (
                                <img src={user.profile_picture} alt="Profile" />
                            ) : (
                                <FiUser className="default-avatar" />
                            )}
                        </div>
                        <h2>{user.first_name} {user.last_name || user.username}</h2>
                        <span className="user-ficha">Ficha: {user.ficha || 'N/A'}</span>
                    </div>

                    <div className="profile-details">
                        <div className="detail-row">
                            <FiMail /> <span>{user.email}</span>
                        </div>

                        <div className="roles-section">
                            <h4>Roles Asignados</h4>
                            <div className="roles-tags">
                                {user.groups.length > 0 ? (
                                    user.groups.map(g => <span key={g} className="role-tag">{g}</span>)
                                ) : (
                                    <span className="text-gray-500">Sin roles</span>
                                )}
                            </div>
                        </div>

                        {investigador.es_investigador && (
                            <div className="investigador-status active">
                                <FiShield /> Investigador Autorizado
                                {investigador.no_constancia && (
                                    <div className="constancia-block">
                                        <small>Constancia: {investigador.no_constancia}</small>
                                        <button onClick={handleDownloadConstancia} className="btn-download-mini">
                                            <FiDownload /> Descargar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {!investigador.es_investigador && user.ficha && (
                            <div className="investigador-status inactive">
                                <FiAlertTriangle /> No registrado como Investigador
                            </div>
                        )}
                    </div>

                </div>

                {/* Columna Derecha: Detalle Empleado y Stats */}
                <div className="right-column">

                    {/* Información de Empleado (Tablero) */}
                    {empleado ? (
                        <div className="dashboard-card employee-info-card" style={{ marginBottom: '2rem' }}>
                            <h3><FiBriefcase /> Información Laboral (Tablero)</h3>
                            <div className="employee-details-grid">
                                <div className="emp-item">
                                    <label>Puesto</label>
                                    <strong>{empleado.puesto}</strong>
                                </div>
                                <div className="emp-item">
                                    <label>Categoría</label>
                                    <strong>{empleado.categoria}</strong>
                                </div>
                                <div className="emp-item">
                                    <label>Nivel</label>
                                    <strong>{empleado.nivel}</strong>
                                </div>
                                <div className="emp-item">
                                    <label>Antigüedad</label>
                                    <strong>{empleado.antiguedad} años</strong>
                                </div>
                                <div className="emp-item">
                                    <label>Edad</label>
                                    <strong>{empleado.edad} años</strong>
                                </div>
                                <div className="emp-item">
                                    <label>Régimen</label>
                                    <strong>{empleado.regimen}</strong>
                                </div>
                                <div className="emp-item">
                                    <label>Dirección</label>
                                    <strong>{empleado.direccion}</strong>
                                </div>
                                <div className="emp-item">
                                    <label>Sindicato</label>
                                    <strong>{empleado.sindicato || 'N/A'}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-card employee-info-card" style={{ marginBottom: '2rem' }}>
                            <div className="empty-employee-state">
                                <FiAlertTriangle size={30} />
                                <p>No se encontró información laboral vinculada a la ficha {user.ficha}.</p>
                                <small>Verifique que la ficha sea correcta o que el empleado exista en el Tablero de Control.</small>
                            </div>
                        </div>
                    )}

                    {/* Productividad (Anteriormente Resumen de Investigaciones) */}
                    <div className="dashboard-card productivity-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}><FiFileText /> Productividad</h3>
                            <button
                                onClick={handleToggleList}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem',
                                    color: '#555', padding: '5px', display: 'flex', alignItems: 'center'
                                }}
                                title={showMyList ? "Ocultar lista" : "Ver lista de investigaciones"}
                            >
                                <FiEye />
                            </button>
                        </div>

                        <div className="productivity-summary">
                            <div className="prod-row">
                                <span className="prod-row-label">En Proceso</span>
                                <span className="prod-row-value highlight-process">{stats.en_proceso}</span>
                            </div>
                            <div className="prod-row">
                                <span className="prod-row-label">Concluidas</span>
                                <span className="prod-row-value highlight-done">{stats.concluidas}</span>
                            </div>
                            <div className="prod-row total-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #efefef' }}>
                                <span className="prod-row-label" style={{ fontWeight: 700 }}>Total Investigaciones</span>
                                <span className="prod-row-value">{stats.total}</span>
                            </div>
                        </div>

                        {showMyList && (
                            <div className="mini-investigaciones-list" style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                {myInvestigaciones.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {myInvestigaciones.map((inv: any) => (
                                            <li key={inv.id} style={{ padding: '8px 0', borderBottom: '1px solid #f9f9f9', fontSize: '0.9em', display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 600 }}>{inv.numero_reporte}</span>
                                                <span className={`status-badge status-${inv.estatus?.toLowerCase().replace(' ', '-') || 'active'}`} style={{ fontSize: '0.8em', padding: '2px 6px', borderRadius: '4px', background: '#eee' }}>
                                                    {inv.estatus}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9em', textAlign: 'center' }}>
                                        No se encontraron resultados.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserInfoPage;
