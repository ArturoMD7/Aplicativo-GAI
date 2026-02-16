import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apliClient';
import type { BajaListado } from '../../types/baja.types';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiDownload, FiAlertCircle, FiFileText } from 'react-icons/fi';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import '../../styles/InvestigacionPage.css'; // Reusing styles

function BajaListPage() {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState<'REGISTRO' | 'SEGUIMIENTO' | 'FINALIZACION' | 'CONCLUIDA'>('REGISTRO');
    const [allBajas, setAllBajas] = useState<BajaListado[]>([]);
    const [bajas, setBajas] = useState<BajaListado[]>([]); // Displayed bajas
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const role = localStorage.getItem('userRole') || '';
        setUserRole(role);
        fetchBajas();
    }, []);

    const fetchBajas = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/bajas/bajas/');
            setAllBajas(response.data);
            setBajas(response.data); // Initialize with all
        } catch (err: any) {
            console.error('Error fetching bajas:', err);
            setError('No se pudo cargar la lista de bajas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!allBajas) return;

        let filtered = allBajas.filter(baja => {
            const status = baja.estatus_baja || 'REGISTRO'; // Default to REGISTRO if undefined
            return status === currentView;
        });

        setBajas(filtered);
        setCurrentPage(1);
    }, [allBajas, currentView]);

    const handleStatusChange = async (id: number, nuevoStatus: string, ficha: string) => {
        const result = await Swal.fire({
            title: `¿Pasar a ${nuevoStatus}?`,
            text: `El registro de la ficha ${ficha} cambiará a etapa de ${nuevoStatus}.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.patch(`/api/bajas/bajas/${id}/`, { estatus_baja: nuevoStatus });

                // Update local state
                setAllBajas(prev => prev.map(item =>
                    item.id === id ? { ...item, estatus_baja: nuevoStatus as any } : item
                ));

                Swal.fire('Actualizado', `El registro pasó a ${nuevoStatus}.`, 'success');
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'No se pudo cambiar el estatus.', 'error');
            }
        }
    };

    const handleDelete = async (id: number, ficha: string) => {
        const result = await Swal.fire({
            title: '¿Eliminar Baja?',
            text: `Se eliminará el registro de la ficha ${ficha}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/api/bajas/bajas/${id}/`);
                setAllBajas(prev => prev.filter(item => item.id !== id));
                Swal.fire('Eliminado', 'El registro ha sido eliminado.', 'success');
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
            }
        }
    };

    const filteredBajas = bajas.filter(baja =>
        baja.ficha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        baja.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBajas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBajas.length / itemsPerPage);

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredBajas);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bajas');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `Bajas_${currentView}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1><FiFileText /> Módulo de Bajas ({currentView})</h1>
                <div className="header-actions">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar ficha, nombre..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <ButtonIcon variant="view" icon={<FiDownload />} text="Exportar" onClick={exportToExcel} size="medium" />
                    {currentView === 'REGISTRO' && (
                        <ButtonIcon variant="add" to="/bajas/nuevo" icon={<FiPlus />} text="Nuevo" size="medium" />
                    )}
                </div>
            </div>

            {/* View Toggles */}
            <div className="view-toggles" style={{ display: 'flex', gap: '8px', marginLeft: '20px', marginBottom: '10px' }}>
                <ButtonIcon
                    variant="custom"
                    color={currentView === 'REGISTRO' ? '#840016' : '#6c757d'}
                    hoverColor={currentView === 'REGISTRO' ? '#640011' : '#5a6268'}
                    onClick={() => setCurrentView('REGISTRO')}
                    icon={<FiFileText />}
                    text="Registro"
                    size="medium"
                />
                <ButtonIcon
                    variant="custom"
                    color={currentView === 'SEGUIMIENTO' ? '#840016' : '#6c757d'}
                    hoverColor={currentView === 'SEGUIMIENTO' ? '#640011' : '#5a6268'}
                    onClick={() => setCurrentView('SEGUIMIENTO')}
                    icon={<FiAlertCircle />}
                    text="Seguimiento"
                    size="medium"
                />
                <ButtonIcon
                    variant="custom"
                    color={currentView === 'FINALIZACION' ? '#840016' : '#6c757d'}
                    hoverColor={currentView === 'FINALIZACION' ? '#640011' : '#5a6268'}
                    onClick={() => setCurrentView('FINALIZACION')}
                    icon={<FiFileText />}
                    text="Por Finalizar"
                    size="medium"
                />
                <ButtonIcon
                    variant="custom"
                    color={currentView === 'CONCLUIDA' ? '#840016' : '#6c757d'}
                    hoverColor={currentView === 'CONCLUIDA' ? '#640011' : '#5a6268'}
                    onClick={() => setCurrentView('CONCLUIDA')}
                    icon={<FiFileText />}
                    text="Concluidas"
                    size="medium"
                />
            </div>

            {loading && <div className="loading-message">Cargando bajas...</div>}
            {error && <div className="error-message"><FiAlertCircle /> {error}</div>}

            {!loading && !error && (
                <div className="table-container">
                    <table className="investigacion-table">
                        <thead>
                            <tr>
                                <th>Ficha</th>
                                <th>Nombre</th>
                                <th>Nivel</th>
                                <th>Nuevo Nivel</th>
                                <th>Región</th>
                                <th>Estatus</th>
                                <th>SAP</th>
                                <th>Fecha Ejecución</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((baja) => (
                                <tr key={baja.id}>
                                    <td>{baja.ficha}</td>
                                    <td>{baja.nombre}</td>
                                    <td>{baja.nivel}</td>
                                    <td>{baja.nuevo_nivel}</td>
                                    <td>{baja.region}</td>
                                    <td>{baja.status}</td>
                                    <td>
                                        <span className={`status-badge ${baja.sap === 'APLICADO' ? 'success' : 'warning'}`}>
                                            {baja.sap}
                                        </span>
                                    </td>
                                    <td>{baja.fecha_ejecucion}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {/* View/Edit Button logic */}
                                            {currentView === 'CONCLUIDA' ? (
                                                <ButtonIcon
                                                    variant="view"
                                                    onClick={() => navigate(`/bajas/editar/${baja.id}`)}
                                                    icon={<FiFileText />}
                                                    title="Ver Detalles"
                                                    size="medium"
                                                />
                                            ) : (
                                                <ButtonIcon
                                                    variant="edit"
                                                    onClick={() => navigate(`/bajas/editar/${baja.id}`)}
                                                    icon={<FiEdit />}
                                                    title="Editar"
                                                    size="medium"
                                                />
                                            )}

                                            {/* Transitions */}
                                            {currentView === 'REGISTRO' && (
                                                <ButtonIcon
                                                    variant="view"
                                                    onClick={() => handleStatusChange(baja.id!, 'SEGUIMIENTO', baja.ficha)}
                                                    icon={<FiAlertCircle />}
                                                    title="Pasar a Seguimiento"
                                                    size="medium"
                                                />
                                            )}
                                            {currentView === 'SEGUIMIENTO' && (
                                                <ButtonIcon
                                                    variant="view"
                                                    onClick={() => handleStatusChange(baja.id!, 'FINALIZACION', baja.ficha)}
                                                    icon={<FiFileText />}
                                                    title="Pasar a Finalización"
                                                    size="medium"
                                                />
                                            )}
                                            {currentView === 'FINALIZACION' && (
                                                <ButtonIcon
                                                    variant="view" // Maybe different icon/variant for conclude
                                                    onClick={() => handleStatusChange(baja.id!, 'CONCLUIDA', baja.ficha)}
                                                    icon={<FiFileText />}
                                                    title="Concluir"
                                                    size="medium"
                                                />
                                            )}

                                            {(['Admin', 'AdminCentral'].includes(userRole) || userRole.startsWith('Supervisor')) && (
                                                <ButtonIcon
                                                    variant="delete"
                                                    onClick={() => handleDelete(baja.id!, baja.ficha)}
                                                    icon={<FiTrash2 />}
                                                    title="Eliminar"
                                                    size="medium"
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredBajas.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={setItemsPerPage}
                            totalItems={filteredBajas.length}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default BajaListPage;
