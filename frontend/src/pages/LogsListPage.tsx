import React, { useState, useEffect } from 'react';
import apiClient from '../api/apliClient';
import type { LogListado } from '../types/log.types';
import { FiPlus, FiEdit, FiFileText, FiEye, FiSearch, FiDownload, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import ButtonIcon from '../components/Buttons/ButtonIcon';
import Pagination from '../components/Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/LogsPage.css';

type SortKey = keyof LogListado | 'fecha_hora';
type SortDirection = 'asc' | 'desc';

function LogListPage() {
  const [investigaciones, setInvestigaciones] = useState<LogListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'timestamp',
    direction: 'desc'
  });

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

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data: LogListado[]) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof LogListado];
      let bValue: any = b[sortConfig.key as keyof LogListado];

      // Handle special cases if needed
      if (sortConfig.key === 'timestamp') {
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredInvestigaciones = investigaciones.filter((inv) => {
    const texto = searchTerm.toLowerCase();
    return Object.values(inv).some(value =>
      String(value).toLowerCase().includes(texto)
    );
  });

  const sortedInvestigaciones = getSortedData(filteredInvestigaciones);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedInvestigaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedInvestigaciones.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

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

  const renderSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) return <span className="sort-icon-placeholder"></span>;
    return sortConfig.direction === 'asc' ? <FiArrowUp className="sort-icon" /> : <FiArrowDown className="sort-icon" />;
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
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
              <th onClick={() => handleSort('id')} className="sortable-header">
                No. Log {renderSortIcon('id')}
              </th>
              <th onClick={() => handleSort('user_name')} className="sortable-header">
                Usuario {renderSortIcon('user_name')}
              </th>
              <th onClick={() => handleSort('action_display')} className="sortable-header">
                Accion {renderSortIcon('action_display')}
              </th>
              <th onClick={() => handleSort('description')} className="sortable-header">
                Descripción {renderSortIcon('description')}
              </th>
              <th onClick={() => handleSort('ip_address')} className="sortable-header">
                Direccion IP {renderSortIcon('ip_address')}
              </th>
              <th onClick={() => handleSort('timestamp')} className="sortable-header">
                Fecha y Hora {renderSortIcon('timestamp')}
              </th>
              <th onClick={() => handleSort('investigacion')} className="sortable-header">
                Investigación {renderSortIcon('investigacion')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td>{inv.user_name}</td>
                <td>{inv.action_display}</td>
                <td>{inv.description}</td>
                <td>{inv.ip_address}</td>
                <td>
                  {new Date(inv.timestamp).toLocaleDateString()} {' '}
                  {new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>{inv.investigacion}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filteredInvestigaciones.length === 0 && (
          <div className="no-results">No se encontraron coincidencias.</div>
        )}

        {!loading && filteredInvestigaciones.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={filteredInvestigaciones.length}
          />
        )}
      </div>
    </div>
  );
}

export default LogListPage;