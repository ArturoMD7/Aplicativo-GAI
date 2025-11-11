import React, { useState, useEffect } from 'react';
import apiClient from '../api/apliClient';
import type { LogListado } from '../types/log.types';
import { FiPlus, FiEdit, FiFileText, FiEye, FiSearch, FiDownload } from 'react-icons/fi';
import ButtonIcon from '../components/Buttons/ButtonIcon'; 
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/LogsPage.css'; 

function LogListPage() {
  const [investigaciones, setInvestigaciones] = useState<LogListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvestigaciones = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/auditoria/activity-logs/');
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

  
  const filteredInvestigaciones = investigaciones.filter((inv) => {
    const texto = searchTerm.toLowerCase();
    return Object.values(inv).some(value =>
      String(value).toLowerCase().includes(texto)
    );
  });

  const exportToExcel = () => {
    if (filteredInvestigaciones.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const data = filteredInvestigaciones.map(inv => ({
      'No. Log': inv.id,
      'Usuario': inv.user_name,
      'Acción': inv.action_display,
      'Descripción': inv.description,
      'Dirección IP': inv.ip_address,
      'Fecha': new Date(inv.timestamp).toLocaleDateString(),
      'Hora': new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      'Investigacion': inv.investigacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Investigaciones');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiFileText /> Logs del sistema</h1>
        <div className="header-actions">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ButtonIcon
            variant="view"
            icon={<FiDownload />}
            text="Exportar Excel"
            onClick={exportToExcel}
            size="medium"
          />
        </div>
      </div>

      {loading && <div>Cargando...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Log</th>
              <th>Usuario</th>
              <th>Accion</th>
              <th>Descripción</th>
              <th>Direccion IP</th>
              <th>Fecha </th>
              <th>Hora</th>
              <th>Investigación.</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestigaciones.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td>{inv.user_name}</td>
                <td>{inv.action_display}</td>
                <td>{inv.description}</td>
                <td>{inv.ip_address}</td>
                <td>{new Date(inv.timestamp).toLocaleDateString()}</td>
                <td>{new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>{inv.investigacion}</td>
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

export default LogListPage;