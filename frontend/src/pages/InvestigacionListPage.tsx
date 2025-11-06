import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apliClient';
import type { InvestigacionListado } from '../types/investigacion.types';
import { FiPlus, FiFileText } from 'react-icons/fi';
import '../styles/InvestigacionPage.css'; // (Crearemos este archivo CSS)

function InvestigacionListPage() {
  const [investigaciones, setInvestigaciones] = useState<InvestigacionListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Carga la lista de investigaciones
    const fetchInvestigaciones = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/investigaciones/');
        setInvestigaciones(response.data); 
      } catch (err) {
        setError('No se pudo cargar la lista de investigaciones.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigaciones();
  }, []);

  // Función para obtener el color del semáforo
  const getSemaforoColor = (semaforo: string) => {
    const colors: Record<string, string> = {
      red: '#e74c3c',
      yellow: '#f1c40f',
      green: '#2ecc71',
      gray: '#95a5a6'
    };
    return colors[semaforo] || colors.gray;
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><FiFileText /> Módulo de Investigaciones</h1>
        <Link to="/investigaciones/nuevo" className="btn-add-new">
          <FiPlus /> Nuevo Registro
        </Link>
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
              <th>Días Rest.</th>
              <th>Creado Por</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {investigaciones.map((inv) => (
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
                <td>{inv.dias_restantes}</td>
                <td>{inv.created_by_name}</td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td>
                  {/* Link para editar (lo dejamos listo) */}
                  <Link to={`/investigaciones/editar/${inv.id}`} className="btn-edit">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvestigacionListPage;