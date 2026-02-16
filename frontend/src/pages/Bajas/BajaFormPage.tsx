import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apliClient';
import type { Baja } from '../../types/baja.types';
import ButtonIcon from '../../components/Buttons/ButtonIcon';
import { FiSave, FiArrowLeft, FiUser, FiFileText, FiInfo, FiSearch } from 'react-icons/fi';
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
    region: 'NORTE',
    tramite: 'LIQUIDACIÓN',
    liquidacion_neta: 0,
    observaciones: '',
    status: 'RECHAZÓ',
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
    regional: '',
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

    const formatNumber = (num: number | string): string => {
        if (!num) return '';
        const parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const parseNumber = (str: string): string => {
        return str.replace(/,/g, '');
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const cleanValue = value.replace(/[^0-9.]/g, '');
        if ((cleanValue.match(/\./g) || []).length > 1) return;
        if (cleanValue.includes('.')) {
            const [, decimal] = cleanValue.split('.');
            if (decimal.length > 2) return;
        }

        const formatted = formatNumber(cleanValue);
        setFormState(prev => ({ ...prev, [name]: formatted }));
    };

    const handleCurrencyChangeNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Validate input
        const cleanValue = value.replace(/[^0-9.]/g, '');
        if ((cleanValue.match(/\./g) || []).length > 1) return;
        if (cleanValue.includes('.')) {
            const [, decimal] = cleanValue.split('.');
            if (decimal.length > 2) return;
        }

        const numericValue = cleanValue === '' ? 0 : parseFloat(cleanValue);
        setFormState(prev => ({ ...prev, [name]: numericValue }));
    };

    // Calculate Ahorro whenever costs or tramite change
    useEffect(() => {
        const costoPlazaRaw = parseNumber(formState.costo_plaza || '0');
        const costoNuevaPlazaRaw = parseNumber(formState.costo_nueva_plaza || '0');

        const cp = parseFloat(costoPlazaRaw) || 0;
        const cnp = parseFloat(costoNuevaPlazaRaw) || 0;

        let ahorro = 0;
        if (formState.tramite === 'DESCENSO') {
            ahorro = cp - cnp;
        } else {
            ahorro = cp - cnp;
        }

        setFormState(prev => {
            if (prev.ahorro !== ahorro) {
                return { ...prev, ahorro };
            }
            return prev;
        });
    }, [formState.costo_plaza, formState.costo_nueva_plaza, formState.tramite]);

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

            const regionalEmpleado = empleado.regional || '';
            let regionAsignada = 'NORTE';

            if (regionalEmpleado) {
                const regionalUpper = regionalEmpleado.toUpperCase();
                if (['NORTE', 'SUR', 'SURESTE', 'ALTIPLANO', 'GAI'].includes(regionalUpper)) {
                    regionAsignada = regionalUpper;
                }
                else if (regionalUpper.includes('SUR') && !regionalUpper.includes('SURESTE')) {
                    regionAsignada = 'SUR';
                }
                else if (regionalUpper.includes('NORTE')) {
                    regionAsignada = 'NORTE';
                }
                else if (regionalUpper.includes('SURESTE')) {
                    regionAsignada = 'SURESTE';
                }
                else if (regionalUpper.includes('ALTIPLANO')) {
                    regionAsignada = 'ALTIPLANO';
                }
                else if (regionalUpper.includes('GAI')) {
                    regionAsignada = 'GAI';
                }
            }

            setFormState(prev => ({
                ...prev,
                nombre: empleado.nombre || '',
                nivel: empleado.nivel || '',
                antiguedad: empleado.antiguedad || 0,
                posicion: empleado.puesto || '',
                direccion: empleado.direccion || '',
                subdireccion: empleado.subdireccion || '',
                fuente: empleado.fuente || '',
                regional: empleado.regional || '',
                region: regionAsignada,
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

    // Logic for phases
    const status = formState.estatus_baja || 'REGISTRO';

    // SAAI (inc Personal & Movimiento) - Editable ONLY in REGISTRO
    const isSaaiLocked = status !== 'REGISTRO';

    // GIMP - Visible in SEGUIMIENTO+, Editable in SEGUIMIENTO
    const showGimp = ['SEGUIMIENTO', 'FINALIZACION', 'CONCLUIDA'].includes(status);
    const isGimpLocked = status !== 'SEGUIMIENTO';

    // GOIE - Visible in FINALIZACION+, Editable in FINALIZACION
    const showGoie = ['FINALIZACION', 'CONCLUIDA'].includes(status);
    const isGoieLocked = status !== 'FINALIZACION';

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
                    <section className={`admin-form-section ${isSaaiLocked ? 'readOnly' : ''}`}
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
                                    readOnly={isSaaiLocked}
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
                                    readOnly={isSaaiLocked}
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
                                    disabled={isSaaiLocked}
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
                                    disabled={isSaaiLocked}
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
                                        readOnly={isSaaiLocked}
                                    />
                                    {!isSaaiLocked && (
                                        <FiSearch style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#666',
                                            cursor: 'pointer'
                                        }} onClick={() => buscarEmpleado(formState.ficha)} />
                                    )}
                                </div>
                            </div>
                            <div className="admin-form-group readOnly ">
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
                            <div className="admin-form-group readOnly ">
                                <label>Fuente</label>
                                <input
                                    type="text"
                                    name="fuente"
                                    value={formState.fuente}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group readOnly ">
                                <label>Regional</label>
                                <input
                                    type="text"
                                    name="regional"
                                    value={formState.regional}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly ">
                                <label>Nivel Actual</label>
                                <input
                                    type="text"
                                    name="nivel"
                                    value={formState.nivel}
                                    onChange={handleChange}
                                    maxLength={2}
                                    className="admin-input"
                                    readOnly
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
                                    readOnly={isSaaiLocked}
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly ">
                                <label>Antigüedad (Años)</label>
                                <input
                                    type="number"
                                    name="antiguedad"
                                    value={formState.antiguedad}
                                    onChange={handleChange}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group readOnly ">
                                <label>Posición</label>
                                <input
                                    type="text"
                                    name="posicion"
                                    value={formState.posicion}
                                    onChange={handleChange}
                                    maxLength={20}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group readOnly ">
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formState.direccion}
                                    onChange={handleChange}
                                    maxLength={10}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                            <div className="admin-form-group readOnly">
                                <label>Subdirección</label>
                                <input
                                    type="text"
                                    name="subdireccion"
                                    value={formState.subdireccion}
                                    onChange={handleChange}
                                    maxLength={10}
                                    className="admin-input"
                                    readOnly
                                />
                            </div>
                        </div>


                        <h3 style={{ color: '#2c3e50', fontSize: '1.1rem', marginBottom: '15px' }}>
                            <i className="fas fa-bullhorn" style={{ marginRight: '8px' }}></i>
                            Datos de Movimiento
                        </h3>

                        <div className="admin-form-row">

                            <div className="admin-form-group">
                                <label>Región</label>
                                <select
                                    name="region"
                                    value={formState.region}
                                    onChange={handleChange}
                                    className="admin-select"
                                    disabled={isSaaiLocked}
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
                                    onChange={handleCurrencyChange}
                                    className="admin-input"
                                    placeholder="0.00"
                                    readOnly={isSaaiLocked}
                                />
                            </div>
                            {formState.tramite === 'DESCENSO' && (
                                <div className="admin-form-group">
                                    <label>Costo Nueva Plaza</label>
                                    <input
                                        type="text"
                                        name="costo_nueva_plaza"
                                        value={formState.costo_nueva_plaza}
                                        onChange={handleCurrencyChange}
                                        className="admin-input"
                                        placeholder="0.00"
                                        readOnly={isSaaiLocked}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Ahorro</label>
                                <input
                                    type="text"
                                    name="ahorro"
                                    value={formatNumber(formState.ahorro || 0)}
                                    readOnly
                                    className="admin-input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Liquidación Neta</label>
                                <input
                                    type="text"
                                    name="liquidacion_neta"
                                    value={formatNumber(formState.liquidacion_neta || 0)}
                                    onChange={handleCurrencyChangeNumber}
                                    className="admin-input"
                                    placeholder="0.00"
                                    readOnly={isSaaiLocked}
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
                                readOnly={isSaaiLocked}
                            />
                        </div>


                    </section>

                    {/* Sección 3: Trámite y Estatus */}
                    {showGimp && (
                        <section className={`admin-form-section ${isGimpLocked ? 'readOnly' : ''}`}
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
                                        disabled={isGimpLocked}
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
                                        readOnly={isGimpLocked}
                                    />
                                </div>

                            </div>

                            <div className="admin-checkbox-container" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '2rem' }}>
                                <label className="admin-checkbox-container">
                                    <input type="checkbox" name="libre" checked={formState.libre} onChange={handleChange} disabled={isGimpLocked} />
                                    <span>Libre</span>
                                </label>
                                <label className="admin-checkbox-container">
                                    <input type="checkbox" name="confirmacion_descenso" checked={formState.confirmacion_descenso} onChange={handleChange} disabled={isGimpLocked} />
                                    <span>Confirmación Descenso</span>
                                </label>
                            </div>
                        </section>
                    )}

                    {/* Sección 4: Observaciones y Detalles */}
                    {showGoie && (
                        <section className={`admin-form-section ${isGoieLocked ? 'readOnly' : ''}`}
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
                                    readOnly={isGoieLocked}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Observaciones GOIE</label>
                                <textarea
                                    name="observaciones_2"
                                    value={formState.observaciones_2}
                                    onChange={handleChange}
                                    className="admin-textarea"
                                    readOnly={isGoieLocked}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Comentarios</label>
                                <textarea
                                    name="comentarios"
                                    value={formState.comentarios}
                                    onChange={handleChange}
                                    className="admin-textarea"
                                    readOnly={isGoieLocked}
                                />
                            </div>

                            <div className="admin-checkbox-container" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '2rem' }}>

                                <label className="admin-checkbox-container">
                                    <input type="checkbox" name="cancelada" checked={formState.cancelada} onChange={handleChange} disabled={isGoieLocked} />
                                    <span>Cancelada</span>
                                </label>
                            </div>
                        </section>
                    )}

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
