export interface Baja {
    id?: number;
    ficha: string;
    nombre: string;
    nivel: string;
    nuevo_nivel: string;
    grado?: string;
    nuevo_grado?: string;
    costo_plaza: string;
    costo_nueva_plaza: string;
    ahorro?: number;
    direccion: string;
    subdireccion: string;
    fuente: string;
    regional: string;
    region: string;
    tramite: string;
    liquidacion_neta?: number;
    observaciones?: string;
    status: string;
    fecha_ejecucion?: string;
    created_at?: string;
    origen?: string;
    sap?: 'PENDIENTE' | 'APLICADO';
    posicion?: string;
    cambio_plaza?: string;
    antiguedad?: number;
    libre?: boolean;
    confirmacion_descenso?: boolean;
    observaciones_2?: string;
    cancelada?: boolean;
    comentarios?: string;
    estatus_baja?: 'REGISTRO' | 'SEGUIMIENTO' | 'FINALIZACION' | 'CONCLUIDA';
    fecha_registro?: string;
    created_by_name?: string;
    fecha_oficio?: string;
    fecha_ultimo_dia_laboral?: string;
    representante_patronal?: string;
}

export interface BajaListado extends Baja {
    // Extends Baja in case we need list-specific fields later
}
