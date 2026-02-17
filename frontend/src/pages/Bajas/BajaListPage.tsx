import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apliClient';
import type { BajaListado } from '../../types/baja.types';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiDownload, FiAlertCircle, FiFileText, FiChevronUp, FiChevronDown, FiCheckCircle } from 'react-icons/fi';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import '../../styles/InvestigacionPage.css'; // Reusing styles
import DocumentosModals from '../../components/Modals/DocumentosModals';
import { auditoriaService } from '../../api/auditoriaService';

type SortConfig = {
    key: keyof BajaListado | null;
    direction: 'ascending' | 'descending';
};

function BajaListPage() {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState<'REGISTRO' | 'SEGUIMIENTO' | 'FINALIZACION' | 'CONCLUIDA'>('REGISTRO');
    const [allBajas, setAllBajas] = useState<BajaListado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [userRole, setUserRole] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

    // Document Modal State
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [selectedBajaId, setSelectedBajaId] = useState<number | null>(null);
    const [selectedFicha, setSelectedFicha] = useState('');

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
        } catch (err: any) {
            console.error('Error fetching bajas:', err);
            setError('No se pudo cargar la lista de bajas.');
        } finally {
            setLoading(false);
        }
    };

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

    const handleOpenDocs = (id: number, ficha: string) => {
        auditoriaService.logAction('VIEW', 'Abrió documentos de baja', id);
        setSelectedBajaId(id);
        setSelectedFicha(ficha);
        setIsDocModalOpen(true);
    };

    // Filter Logic
    const filteredBajas = useMemo(() => {
        return allBajas.filter(baja => {
            const status = baja.estatus_baja || 'REGISTRO';
            const matchesView = status === currentView;
            const matchesSearch =
                baja.ficha.toLowerCase().includes(searchTerm.toLowerCase()) ||
                baja.nombre.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesView && matchesSearch;
        });
    }, [allBajas, currentView, searchTerm]);

    // Sorting Logic
    const sortedBajas = useMemo(() => {
        let sortableItems = [...filteredBajas];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let valA: any = a[sortConfig.key as keyof BajaListado];
                let valB: any = b[sortConfig.key as keyof BajaListado];

                if (sortConfig.key === 'created_at' || sortConfig.key === 'fecha_ejecucion') {
                    valA = new Date(valA).getTime();
                    valB = new Date(valB).getTime();
                }

                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredBajas, sortConfig]);

    const requestSort = (key: keyof BajaListado) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey: keyof BajaListado) => {
        if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>↕</span>;
        return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedBajas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedBajas.length / itemsPerPage);

    const exportToExcel = () => {
        if (sortedBajas.length === 0) {
            Swal.fire('Info', 'No hay datos para exportar', 'info');
            return;
        }

        const data = sortedBajas.map(baja => ({
            'Ficha': baja.ficha,
            'Nombre': baja.nombre,
            'Nivel': baja.nivel,
            'Nuevo Nivel': baja.nuevo_nivel,
            'Región': baja.region,
            'Estatus': baja.status,
            'SAP': baja.sap,
            'Fecha Ejecución': baja.fecha_ejecucion,
            'Creado Por': baja.created_by_name
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bajas');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `Bajas_${currentView}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [currentView, searchTerm]);


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
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                <th style={{ width: '60px', textAlign: 'center' }}>Docs</th>
                                <th onClick={() => requestSort('ficha')} style={{ cursor: 'pointer' }}>Ficha {getSortIcon('ficha')}</th>
                                <th onClick={() => requestSort('nombre')} style={{ cursor: 'pointer' }}>Nombre {getSortIcon('nombre')}</th>
                                <th onClick={() => requestSort('nivel')} style={{ cursor: 'pointer' }}>Nivel {getSortIcon('nivel')}</th>
                                <th onClick={() => requestSort('nuevo_nivel')} style={{ cursor: 'pointer' }}>Nuevo Nivel {getSortIcon('nuevo_nivel')}</th>
                                <th onClick={() => requestSort('region')} style={{ cursor: 'pointer' }}>Región {getSortIcon('region')}</th>
                                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Estatus {getSortIcon('status')}</th>
                                <th onClick={() => requestSort('sap')} style={{ cursor: 'pointer' }}>SAP {getSortIcon('sap')}</th>
                                <th onClick={() => requestSort('fecha_ejecucion')} style={{ cursor: 'pointer' }}>Fecha Ejecución {getSortIcon('fecha_ejecucion')}</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((baja) => (
                                <tr key={baja.id}>
                                    <td style={{ textAlign: 'center', borderLeft: '4px solid #17a2b8' }}>
                                        <button
                                            onClick={() => handleOpenDocs(baja.id!, baja.ficha)}
                                            className="btn-icon-only"
                                            title="Ver archivos adjuntos"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#840016',
                                                fontSize: '1.2rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '5px'
                                            }}
                                        >
                                            <FiFileText />
                                        </button>
                                    </td>
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

                    {filteredBajas.length === 0 && (
                        <div className="no-results">
                            <FiCheckCircle style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', margin: '0 auto', color: '#28a745' }} />
                            No hay bajas en esta etapa.
                        </div>
                    )}

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

            <DocumentosModals
                isOpen={isDocModalOpen}
                onClose={() => setIsDocModalOpen(false)}
                investigacionId={selectedBajaId}
                numeroReporte={`Ficha: ${selectedFicha}`}
                sourceType="baja"
            />
        </div>
    );
}

export default BajaListPage;
