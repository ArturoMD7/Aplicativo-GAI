import React, { useState } from 'react';
import apiClient from '../api/apliClient';
import '../styles/BuscarEmpleadoPage.css';
import { FiSearch, FiUser, FiInfo, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import type { EmpleadoBuscado } from '../types/investigacion.types';

const BuscarEmpleadoPage = () => {
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<any[]>([]);
    const [empleado, setEmpleado] = useState<EmpleadoBuscado | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setEmpleado(null);
        setResultados([]);
        setSearched(true);

        try {
            // Usar el nuevo endpoint de búsqueda general
            const response = await apiClient.get(`/api/investigaciones/buscar-personal/?query=${query}`);
            const data = response.data;

            if (data.length === 0) {
                setError('No se encontraron coincidencias.');
            } else if (data.length === 1) {
                // Si solo hay uno, cargar detalle directamente
                fetchDetalleEmpleado(data[0].ficha);
            } else {
                // Si hay varios, mostrar lista
                setResultados(data);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al realizar la búsqueda.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDetalleEmpleado = async (ficha: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get(`/api/investigaciones/buscar-empleado/?ficha=${ficha}`);
            setEmpleado(response.data);
            setResultados([]); // Limpiar lista de resultados
        } catch (err: any) {
            console.error(err);
            setError('No se pudo cargar el detalle del empleado seleccionado.');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setQuery('');
        setEmpleado(null);
        setResultados([]);
        setError('');
        setSearched(false);
    };

    return (
        <div className="buscar-empleado-container">
            <div className="buscar-empleado-header">
                <h1>Búsqueda de Personal</h1>
                <p>Busca por Ficha o Nombre del empleado</p>
            </div>

            <div className="search-section">
                <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', justifyContent: 'center', gap: '1rem' }}>
                    <div className="search-input-group">
                        <FiSearch className="search-icon-input" />
                        <input
                            type="text"
                            placeholder="Ingrese Ficha o Nombre..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="search-button" disabled={loading || !query.trim()}>
                        {loading ? 'Buscando...' : 'Consultar'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="error-message">
                    <FiAlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* LISTA DE RESULTADOS */}
            {resultados.length > 0 && !empleado && (
                <div className="resultados-lista-container">
                    <h3>Resultados ({resultados.length}):</h3>
                    <div className="resultados-grid">
                        {resultados.map((res) => (
                            <div key={res.ficha} className="resultado-card">
                                <div className="resultado-info">
                                    <strong>{res.nombre}</strong>
                                    <span>Ficha: {res.ficha}</span>
                                    <span className="resultado-meta">{res.categoria} - {res.status}</span>
                                </div>
                                <button
                                    className="ver-detalle-btn"
                                    onClick={() => fetchDetalleEmpleado(res.ficha)}
                                >
                                    Ver Detalle
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DETALLE DEL EMPLEADO */}
            {empleado && (
                <div className="empleado-result-card">
                    <div className="result-header">
                        <h2><FiUser /> {empleado.nombre}</h2>
                        <button onClick={handleClear} className="clear-button">
                            <FiRefreshCw style={{ marginRight: 5 }} /> Nueva Consulta
                        </button>
                    </div>

                    <div className="empleado-details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Ficha</span>
                            <span className="detail-value highlight">{empleado.ficha}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Categoría</span>
                            <span className="detail-value">{empleado.categoria}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Puesto</span>
                            <span className="detail-value">{empleado.puesto}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Nivel</span>
                            <span className="detail-value">{empleado.nivel}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Antigüedad</span>
                            <span className="detail-value">{empleado.antiguedad} años</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Edad</span>
                            <span className="detail-value">{empleado.edad} años</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">RFC</span>
                            <span className="detail-value">{empleado.rfc}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">CURP</span>
                            <span className="detail-value">{empleado.curp}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Régimen</span>
                            <span className="detail-value">{empleado.regimen || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Sindicato</span>
                            <span className="detail-value">{empleado.sindicato || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="detail-item" style={{ padding: '0 2rem 1rem 2rem' }}>
                        <span className="detail-label">Dirección</span>
                        <span className="detail-value">{empleado.direccion}</span>
                    </div>

                    <div className="antecedentes-section">
                        <h3><FiInfo style={{ marginRight: 8 }} /> Antecedentes e Investigaciones Previas</h3>
                        {empleado.antecedentes && empleado.antecedentes.length > 0 ? (
                            <table className="antecedentes-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Descripción</th>
                                        <th>Referencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empleado.antecedentes.map((ant, index) => (
                                        <tr key={index}>
                                            <td>{ant.fecha}</td>
                                            <td>{ant.descripcion}</td>
                                            <td>{ant.referencia}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-antecedentes">
                                No se encontraron antecedentes registrados para este empleado.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuscarEmpleadoPage;
