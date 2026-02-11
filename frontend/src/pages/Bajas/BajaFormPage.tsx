import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apliClient';
import type { Baja } from '../../types/baja.types';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import { FiSave, FiArrowLeft, FiUser, FiDollarSign, FiFileText, FiInfo, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';
import '../../styles/BajaDetails.css';

const initialState: Baja = {
    ficha: '',
    nombre: '',
    nivel: '',
    nuevo_nivel: '',
    costo_plaza: '',
    costo_nueva_plaza: '',
    ahorro: 0,
    direccion: '',
    subdireccion: '',
    region: 'NORTE', // Default per choices
    tramite: 'LIQUIDACIÓN', // Default
    liquidacion_neta: 0,
    observaciones: '',
    status: 'RECHAZÓ', // Default
    fecha_ejecucion: '',
    origen: '',
    sap: 'PENDIENTE',
    posicion: '',
    cambio_plaza: '',
    antiguedad: 0,
    libre: false,
    confirmacion_descenso: false,
    observaciones_2: '',
    cancelada: false,
    fuente: '',
    comentarios: '',
};

function BajaFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [formState, setFormState] = useState<Baja>(initialState);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            fetchBaja(id);
        }
    }, [id]);

    const fetchBaja = async (bajaId: string) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/bajas/bajas/${bajaId}/`);
            setFormState(response.data);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo cargar la información.', 'error');
            navigate('/bajas');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let processedValue: any = value;

        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            processedValue = e.target.checked;
        } else if (type === 'number') {
            processedValue = value === '' ? 0 : parseFloat(value);
        }

        setFormState(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleEnterBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            buscarEmpleado(formState.ficha);
        }
    };

    const buscarEmpleado = async (ficha: string) => {
        if (!ficha.trim()) return;

        try {
            const response = await apiClient.get(`/api/investigaciones/buscar-empleado/?ficha=${ficha}`);
            const empleado = response.data;

            setFormState(prev => ({
                ...prev,
                nombre: empleado.nombre || '',
                nivel: empleado.nivel || '',
                antiguedad: empleado.antiguedad || 0,
                posicion: empleado.puesto || '',
                direccion: empleado.direccion || '',
                subdireccion: empleado.subdireccion || '',
                fuente: empleado.fuente || '',

            }));

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'success',
                title: 'Empleado encontrado'
            });

        } catch (err: any) {
            console.error(err);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'error',
                title: 'Empleado no encontrado'
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode && id) {
                await apiClient.put(`/api/bajas/bajas/${id}/`, formState);
                Swal.fire('Actualizado', 'Registro actualizado correctamente', 'success');
            } else {
                await apiClient.post('/api/bajas/bajas/', formState);
                Swal.fire('Guardado', 'Registro creado correctamente', 'success');
            }
            navigate('/bajas');
        } catch (err: any) {
            console.error(err);
            Swal.fire('Error', 'Error al guardar el registro.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formState.id) return <div className="loading-message">Cargando...</div>;

    return (
        <div className="admin-register-container">
            <div className="admin-register-form-container">
                <div className="admin-register-header">
                    <ButtonIcon
                        variant="custom"
                        onClick={() => navigate('/bajas')}
                        icon={<FiArrowLeft />}
                        text="Volver a la lista"
                        style={{ marginBottom: '1rem', display: 'inline-flex' }}
                    />
                    <h1>{isEditMode ? 'Editar Registro de Baja' : 'Nuevo Registro de Baja'}</h1>
                    <p>Complete la información del formulario a continuación</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Sección 1: Datos del Empleado */}
                    <section className="admin-form-section "
                        style={{ gridColumn: '1 / -1' }}>
                        <h2 className="admin-section-title">
                            <FiUser /> Datos de SAAI
                        </h2>
                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Origen</label>
                                <input
                                    type="text"
                                    name="origen"
                                    value={formState.origen}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Fecha Ejecución</label>
                                <input
                                    type="date"
                                    name="fecha_ejecucion"
                                    value={formState.fecha_ejecucion || ''}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Trámite</label>
                                <select
                                    name="tramite"
                                    value={formState.tramite}
                                    onChange={handleChange}
                                    className="admin-select"
                                >
                                    <option value="LIQUIDACIÓN">LIQUIDACIÓN</option>
                                    <option value="DESCENSO">DESCENSO</option>
                                    <option value="JUBILACIÓN">JUBILACIÓN</option>
                                    <option value="RESCATADO(A)">RESCATADO(A)</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label>Estatus</label>
                                <select
                                    name="status"
                                    value={formState.status}
                                    onChange={handleChange}
                                    className="admin-select"
                                >
                                    <option value="RECHAZÓ">RECHAZÓ</option>
                                    <option value="ACEPTÓ">ACEPTÓ</option>
                                    <option value="AUSENCIA">AUSENCIA</option>
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="RESCATADO(A)">RESCATADO(A)</option>
                                    <option value="SIN CONTRATO VIGENTE">SIN CONTRATO VIGENTE</option>
                                </select>
                            </div>
                        </div>

                        <h3 style={{ color: '#2c3e50', fontSize: '1.1rem', marginBottom: '15px' }}>
                            <i className="fas fa-bullhorn" style={{ marginRight: '8px' }}></i>
                            Datos de personal
                        </h3>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Ficha *</label>
                                <div className="admin-input-with-icon">
                                    <input
                                        type="text"
                                        name="ficha"
                                        value={formState.ficha}
                                        onChange={handleChange}
                                        onKeyDown={handleEnterBusqueda}
                                        required
                                        maxLength={15}
                                        className="admin-input"
                                        placeholder="Número de ficha (Presione Enter)"
                                    />
                                    <FiSearch style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#666',
                                        cursor: 'pointer'
                                    }} onClick={() => buscarEmpleado(formState.ficha)} />
                                </div>
                            </div>
                            <div className="admin-form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formState.nombre}
                                    onChange={handleChange}
                                    required
                                    maxLength={40}
                                    className="admin-input"
                                    placeholder="Nombre completo"
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Fuente</label>
                                <input
                                    type="text"
                                    name="fuente"
                                    value={formState.fuente}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Nivel Actual</label>
                                <input
                                    type="text"
                                    name="nivel"
                                    value={formState.nivel}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Nuevo Nivel</label>
                                <input
                                    type="text"
                                    name="nuevo_nivel"
                                    value={formState.nuevo_nivel}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Antigüedad (Años)</label>
                                <input
                                    type="number"
                                    name="antiguedad"
                                    value={formState.antiguedad}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Posición</label>
                                <input
                                    type="text"
                                    name="posicion"
                                    value={formState.posicion}
                                    onChange={handleChange}
                                    maxLength={20}
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formState.direccion}
                                    onChange={handleChange}
                                    maxLength={10}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Subdirección</label>
                                <input
                                    type="text"
                                    name="subdireccion"
                                    value={formState.subdireccion}
                                    onChange={handleChange}
                                    maxLength={10}
                                    className="admin-input"
                                />
                            </div>
                        </div>


                        <h3 style={{ color: '#2c3e50', fontSize: '1.1rem', marginBottom: '15px' }}>
                            <i className="fas fa-bullhorn" style={{ marginRight: '8px' }}></i>
                            Datos de ....
                        </h3>

                        <div className="admin-form-row">

                            <div className="admin-form-group">
                                <label>Región</label>
                                <select
                                    name="region"
                                    value={formState.region}
                                    onChange={handleChange}
                                    className="admin-select"
                                >
                                    <option value="NORTE">NORTE</option>
                                    <option value="SUR">SUR</option>
                                    <option value="SURESTE">SURESTE</option>
                                    <option value="ALTIPLANO">ALTIPLANO</option>
                                    <option value="GAI">GAI</option>
                                </select>
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Costo Plaza</label>
                                <input
                                    type="text"
                                    name="costo_plaza"
                                    value={formState.costo_plaza}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Costo Nueva Plaza</label>
                                <input
                                    type="text"
                                    name="costo_nueva_plaza"
                                    value={formState.costo_nueva_plaza}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Ahorro</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="ahorro"
                                    value={formState.ahorro}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Liquidación Neta</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="liquidacion_neta"
                                    value={formState.liquidacion_neta}
                                    onChange={handleChange}
                                    className="admin-input"
                                />
                            </div>
                        </div>
                        <div className="admin-form-group">
                            <label>Observaciones</label>
                            <textarea
                                name="observaciones"
                                value={formState.observaciones}
                                onChange={handleChange}
                                className="admin-textarea"
                            />
                        </div>


                    </section>

                    {/* Sección 3: Trámite y Estatus */}
                    <section className="admin-form-section "
                        style={{ gridColumn: '1 / -1' }}>
                        <h2 className="admin-section-title">
                            <FiFileText /> Datos de GIMP
                        </h2>


                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>SAP Status</label>
                                <select
                                    name="sap"
                                    value={formState.sap}
                                    onChange={handleChange}
                                    className="admin-select"
                                >
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="APLICADO">APLICADO</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label>Cambio Plaza</label>
                                <input
                                    type="text"
                                    name="cambio_plaza"
                                    value={formState.cambio_plaza}
                                    onChange={handleChange}
                                    maxLength={8}
                                    className="admin-input"
                                />
                            </div>

                        </div>

                        <div className="admin-checkbox-container" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '2rem' }}>
                            <label className="admin-checkbox-container">
                                <input type="checkbox" name="libre" checked={formState.libre} onChange={handleChange} />
                                <span>Libre</span>
                            </label>
                            <label className="admin-checkbox-container">
                                <input type="checkbox" name="confirmacion_descenso" checked={formState.confirmacion_descenso} onChange={handleChange} />
                                <span>Confirmación Descenso</span>
                            </label>
                        </div>
                    </section>

                    {/* Sección 4: Observaciones y Detalles */}
                    <section className="admin-form-section "
                        style={{ gridColumn: '1 / -1' }}>
                        <h2 className="admin-section-title">
                            <FiInfo /> Datos de GOIE
                        </h2>

                        <div className="admin-form-group">
                            <label>Fecha de Registro</label>
                            <input
                                type="date"
                                name="fecha_registro"
                                value={formState.fecha_registro}
                                onChange={handleChange}
                                className="admin-input"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label>Observaciones GOIE</label>
                            <textarea
                                name="observaciones_2"
                                value={formState.observaciones_2}
                                onChange={handleChange}
                                className="admin-textarea"
                            />
                        </div>
                        <div className="admin-form-group">
                            <label>Comentarios</label>
                            <textarea
                                name="comentarios"
                                value={formState.comentarios}
                                onChange={handleChange}
                                className="admin-textarea"
                            />
                        </div>

                        <div className="admin-checkbox-container" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '2rem' }}>

                            <label className="admin-checkbox-container">
                                <input type="checkbox" name="cancelada" checked={formState.cancelada} onChange={handleChange} />
                                <span>Cancelada</span>
                            </label>
                        </div>
                    </section>

                    <div className="admin-form-actions">
                        <ButtonIcon
                            variant="custom"
                            type="button"
                            onClick={() => navigate('/bajas')}
                            className="admin-back-button"
                            text="Cancelar"
                        />
                        <ButtonIcon
                            variant="custom"
                            type="submit"
                            icon={<FiSave />}
                            text="Guardar Baja"
                            disabled={loading}
                            className="admin-submit-button"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BajaFormPage;
