import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import apiClient from '../../api/apliClient';
import '../../styles/Auth/AdminRegister.css';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import { FiSave, FiRepeat } from 'react-icons/fi';
import { FaArrowLeft } from "react-icons/fa";

type Group = { id: number; name: string };

type UserData = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
  ficha: string;
};

function EditUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [user, setUser] = useState<UserData | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, groupsRes] = await Promise.all([
          apiClient.get(`/api/user/${userId}/`),
          apiClient.get('/api/groups/')
        ]);

        setUser(userRes.data);
        setAvailableGroups(groupsRes.data);
        setSelectedGroups(userRes.data.groups);
      } catch {
        setError('Error al cargar el usuario.');
      }
    };
    fetchData();
  }, [userId]);

  const handleRoleToggle = (name: string) => {
    setSelectedGroups(prev =>
      prev.includes(name)
        ? prev.filter(g => g !== name)
        : [...prev, name]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.put(`/api/user/${user.id}/`, {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        groups: selectedGroups,
        ficha: user.ficha
      });

      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => navigate('/users'), 1500);
    } catch {
      setError('No se pudo actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    MySwal.fire({
      title: 'Reestablecer contraseña',
      html: `
        <input id="p1" type="password" class="swal2-input" placeholder="Nueva contraseña">
        <input id="p2" type="password" class="swal2-input" placeholder="Confirmar contraseña">
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      preConfirm: async () => {
        const p1 = (document.getElementById('p1') as HTMLInputElement).value;
        const p2 = (document.getElementById('p2') as HTMLInputElement).value;

        if (!p1 || !p2) {
          Swal.showValidationMessage('Completa ambos campos');
          return false;
        }
        if (p1 !== p2) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return false;
        }

        try {
          await apiClient.post(`/api/users/${user?.id}/reset-password/`, {
            new_password: p1,
            confirm_password: p2
          });
          return true;
        } catch {
          Swal.showValidationMessage('Error al reestablecer contraseña');
          return false;
        }
      }
    }).then(res => {
      if (res.isConfirmed) {
        Swal.fire('Éxito', 'Contraseña reestablecida', 'success');
      }
    });
  };

  if (!user) return <div className="admin-register-container">Cargando...</div>;

  return (
    <div className="admin-register-container">
      <div className="admin-register-header">
        <h1>Editar Usuario</h1>
        <p>Modifica los datos del usuario seleccionado</p>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="admin-layout-grid">
          {/* DATOS */}
          <div className="admin-card">
            <h3 className="admin-section-title">Información del Usuario</h3>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Correo *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-envelope" />
                  <input
                    type="email"
                    value={user.email}
                    onChange={e => setUser({ ...user, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Ficha *</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-id-badge" />
                  <input
                    type="number"
                    value={user.ficha}
                    onChange={e => setUser({ ...user, ficha: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Nombre</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-user" />
                  <input
                    value={user.first_name}
                    onChange={e => setUser({ ...user, first_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Apellidos</label>
                <div className="admin-input-with-icon">
                  <i className="fas fa-user-tag" />
                  <input
                    value={user.last_name}
                    onChange={e => setUser({ ...user, last_name: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ROLES */}
          <div className="admin-card">
            <h3 className="admin-section-title">
              Roles <span className="selection-count">({selectedGroups.length})</span>
            </h3>

            <div className="admin-roles-grid compact">
              {availableGroups.map(group => (
                <div
                  key={group.id}
                  className={`admin-role-option ${selectedGroups.includes(group.name) ? 'selected' : ''
                    }`}
                  onClick={() => handleRoleToggle(group.name)}
                >
                  <div className="admin-role-checkbox" />
                  <span>{group.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="admin-card admin-actions-card">
          <div className="admin-actions-row">
            <ButtonIcon
              variant="edit"
              type="submit"
              text="Guardar"
              icon={<FiSave />}
              disabled={loading}
              title="Guardar cambios del usuario"
              size="medium"
            />

            <ButtonIcon
              variant="custom"
              text="Reestablecer Contraseña"
              onClick={handleResetPassword}
              color="#c0392b"
              icon={<FiRepeat />}
              hoverColor="#a93226"
              title="Reestablecer contraseña"
              size="medium"
            />

            <ButtonIcon
              variant="view"
              to="/users"
              text="Usuarios"
              icon={<FaArrowLeft />}
              title="Volver a la lista de usuarios"
              size="medium"
            />
          </div>
        </div>

      </form>

      {/* INVESTIGADOR SECTION */}
      <div className="admin-register-header" style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h2><FiFileText style={{ marginRight: '10px' }} /> Datos de Investigador</h2>
        <p>Gestión de constancia y número de investigador (Vinculado por Ficha)</p>
      </div>

      <InvestigadorSection ficha={user.ficha} />

    </div>
  );
}

// Subcomponent for cleaner code
import { FiUpload, FiFileText } from 'react-icons/fi';
import DocumentPreviewModal from '../../components/Modals/DocumentPreviewModal';

const InvestigadorSection = ({ ficha }: { ficha: string }) => {
  const [loading, setLoading] = useState(false);
  const [investigador, setInvestigador] = useState<any>(null);
  const [noConstancia, setNoConstancia] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showPreview, setShowPreview] = useState(false);

  // New states for file checking
  const [constanciaExists, setConstanciaExists] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (!ficha) return;
    fetchInvestigador();
  }, [ficha]);

  // Clean up object URL when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchInvestigador = async () => {
    try {
      const res = await apiClient.get(`/api/investigadores/management/${ficha}/`);
      setInvestigador(res.data);
      if (res.data.no_constancia) {
        setNoConstancia(res.data.no_constancia);
        checkFileExistence(res.data.no_constancia);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setInvestigador(null);
      }
    }
  };

  const checkFileExistence = async (constanciaNumber: string) => {
    if (!constanciaNumber) {
      setConstanciaExists(false);
      return;
    }
    try {
      const fileName = `${constanciaNumber}.pdf`;
      const response = await apiClient.get(`/api/investigadores/check-constancia/${fileName}/`);
      setConstanciaExists(response.data.exists);
    } catch (error) {
      console.error("Error checking constancia file:", error);
      setConstanciaExists(false);
    }
  };

  const handlePreviewOpen = async () => {
    const fileName = `${noConstancia}.pdf`;
    try {
      // Fetch as blob to handle authentication
      const response = await apiClient.get(`/api/investigadores/constancias/${fileName}/`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error("Error fetching PDF for preview:", error);
      setMsg({ type: 'error', text: 'Error al cargar la previsualización del documento.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('ficha', ficha);
    formData.append('no_constancia', noConstancia);
    if (archivo) {
      formData.append('archivo_constancia', archivo);
    }

    try {
      if (investigador) {
        await apiClient.patch(`/api/investigadores/management/${ficha}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMsg({ type: 'success', text: 'Datos de investigador actualizados.' });
      } else {
        setMsg({ type: 'error', text: 'No se encontró investigador con esta ficha en el catálogo.' });
      }
      // Re-fetch to update state
      await fetchInvestigador();
      setArchivo(null); // Clear file selection on success
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Error al eliminar/guardar.' });
    } finally {
      setLoading(false);
    }
  };

  if (!ficha) return <div className="admin-alert">El usuario no tiene Ficha asignada.</div>;

  // Determine if we can show a file: either from DB field or physical check
  const hasFile = investigador?.archivo_constancia || constanciaExists;

  return (
    <div className="admin-card">
      {msg.text && <div className={`admin-alert admin-alert-${msg.type}`}>{msg.text}</div>}

      {investigador ? (
        <form onSubmit={handleSave}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Nombre en Catálogo</label>
              <input value={investigador.nombre} disabled className="disabled-input" />
            </div>
            <div className="admin-form-group">
              <label>Número de Constancia</label>
              <div className="admin-input-with-icon">
                <i className="fas fa-hashtag" />
                <input
                  value={noConstancia}
                  onChange={(e) => {
                    setNoConstancia(e.target.value);
                    // Optional: debounce checkFileExistence here if we want live checking on edit
                  }}
                  placeholder="Ej. GAI-001"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <label style={{ marginBottom: '10px', display: 'block', fontWeight: '500' }}>Archivo de Constancia (PDF)</label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

              {/* CURRENT FILE PREVIEW */}
              {hasFile ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dde', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#ffebeel', color: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginRight: '10px' }}>
                    <FiFileText size={18} />
                  </div>
                  <div style={{ marginRight: '15px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Constancia Disponible</div>
                    <div style={{ fontSize: '0.75rem', color: '#777' }}>{noConstancia}.pdf</div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePreviewOpen}
                    className="btn-simple-view"
                    style={{ color: '#0d6efd', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}
                  >
                    Ver Documento
                  </button>
                </div>
              ) : (
                <span style={{ color: '#999', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin constancia asignada o archivo no encontrado</span>
              )}

              {/* FILE UPLOAD INPUT */}
              <div className="file-input-wrapper" style={{ margin: 0 }}>
                <input
                  id="file-upload-inv"
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && setArchivo(e.target.files[0])}
                />
                <label
                  htmlFor="file-upload-inv"
                  className="file-upload-label"
                  style={{
                    border: archivo ? '1px solid #198754' : '1px dashed #ccc',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: archivo ? '#f0fdf4' : 'white',
                    color: archivo ? '#157347' : '#555',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiUpload />
                  {archivo ? (
                    <span>Archivo seleccionado: <strong>{archivo.name}</strong></span>
                  ) : (
                    <span>Cargar / Reemplazar PDF</span>
                  )}
                </label>
              </div>

            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <ButtonIcon
              variant="edit"
              type="submit"
              text="Guardar Cambios Investigador"
              icon={<FiSave />}
              disabled={loading}
              size="medium"
            />
          </div>
        </form>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>No se encontró un registro en el Catálogo de Investigadores para la ficha <strong>{ficha}</strong>.</p>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {showPreview && (
        <DocumentPreviewModal
          documento={{
            id: investigador?.id || 0,
            tipo: 'Constancia',
            nombre_archivo: `${noConstancia || 'Constancia'}.pdf`,
            archivo: previewUrl,
            uploaded_at: '',
            descripcion: 'Constancia de Investigador'
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default EditUserPage;
