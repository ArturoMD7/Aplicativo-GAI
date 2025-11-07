import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiPlus, FiFileText, FiSearch, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/InvestigacionPage.css'; 

function InvestigacionListPage() {
  const [investigaciones, setInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvestigaciones = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/investigaciones/investigaciones/');
        setInvestigaciones(response.data);
      } catch (err) {
        setError('No se pudo cargar la lista de investigaciones.');
        console.error('Error fetching investigaciones:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigaciones();
  }, []);

  const getSemaforoColor = (semaforo: string) => {
    const colors: Record<string, string> = {
      red: '#e74c3c',
      orange: '#f17c0fff',
      yellow: '#f1c40f',
      green: '#2ecc71',
      gray: '#95a5a6'
    };
    return colors[semaforo] || colors.gray;
  };

  // 🔍 Filtrado universal
  const filteredInvestigaciones = investigaciones.filter((inv) => {
    const texto = searchTerm.toLowerCase();
    return Object.values(inv).some(value =>
      String(value).toLowerCase().includes(texto)
    );
  });

  // 📤 Exportar a Excel (respeta el filtro)
  const exportToExcel = () => {
    if (filteredInvestigaciones.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    // Estructura limpia para Excel
    const data = filteredInvestigaciones.map(inv => ({
      'No. Reporte': inv.numero_reporte,
      'Nombre Corto': inv.nombre_corto,
      'Gravedad': inv.gravedad,
      'Semáforo': inv.semaforo,
      'Creado Por': inv.created_by_name,
      'Fecha Creación': new Date(inv.created_at).toLocaleDateString(),
      'Fecha Prescripción': new Date(inv.fecha_prescripcion).toLocaleDateString(),
      'Días Restantes': inv.dias_restantes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Investigaciones');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Investigaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiFileText /> Módulo de Investigaciones</h1>
        <div className="header-actions">
          {/* 🔍 Buscador */}
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 📤 Botón Excel */}
          <button className="btn-export" onClick={exportToExcel}>
            <FiDownload /> Exportar Excel
          </button>

          {/* ➕ Nuevo registro */}
          <Link to="/investigaciones/nuevo" className="btn-add-new">
            <FiPlus /> Nuevo Registro
          </Link>
        </div>
      </div>

      {loading && <div>Cargando...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Semáforo</th>
              <th>No. Reporte</th>
              <th>Nombre Corto</th>
              <th>Gravedad</th>
              <th>Creado Por</th>
              <th>Fecha Creación</th>
              <th>Fecha Prescripción</th>
              <th>Días Rest.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestigaciones.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <span 
                    className="semaforo-dot" 
                    style={{ backgroundColor: getSemaforoColor(inv.semaforo) }}
                    title={`Días restantes: ${inv.dias_restantes}`}
                  ></span>
                </td>
                <td>{inv.numero_reporte}</td>
                <td>{inv.nombre_corto}</td>
                <td>{inv.gravedad}</td>
                <td>{inv.created_by_name}</td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td>{new Date(inv.fecha_prescripcion).toLocaleDateString()}</td>
                <td>{inv.dias_restantes}</td>
                <td>
                  <Link to={`/investigaciones/editar/${inv.id}`} className="btn-edit">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filteredInvestigaciones.length === 0 && (
          <div className="no-results">No se encontraron coincidencias.</div>
        )}
      </div>
    </div>
  );
}

export default InvestigacionListPage;
