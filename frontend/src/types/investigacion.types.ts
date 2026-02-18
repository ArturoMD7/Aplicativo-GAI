export interface BasePersona {
  id?: number;
  ficha: string;
  nombre: string;
  categoria: string;
  puesto: string;
  extension?: string;
  email?: string;
}

export interface DocumentoInvestigacion {
  id: number;
  tipo: string;
  archivo: string;
  descripcion: string;
  uploaded_at: string;
  nombre_archivo: string;
}

export interface Contacto extends BasePersona {
  tipo: 'CONTACTO' | 'RESPONSABLE';
}

export interface Investigador extends BasePersona {
  no_constancia: string;
}

export interface Reportante extends BasePersona {
  edad: number;
  antiguedad: number;
  nivel: string;

  direccion: string;
  es_externo?: boolean;
}

export interface Involucrado extends BasePersona {
  nivel: string;
  edad: number;
  antiguedad: number;
  rfc: string;
  curp: string;
  direccion: string;
  tiene_antecedentes: boolean;
  antecedentes_detalles?: Antecedente[];
  regimen: string;
  jornada: string;
  sindicato: string;
  seccion_sindical: string;
  fuente?: string;
  centro_trabajo: string;

  termino?: string;
  es_externo?: boolean;
}

export interface Testigo extends Partial<BasePersona> {
  nombre: string;
  nivel?: string;
  direccion?: string;
  subordinacion?: boolean;
  es_externo?: boolean;
}

// El tipo para el formulario de creación/edición
export interface InvestigacionFormState {
  montoeconomico: number | null;
  conductas: string;
  id?: number;
  nombre_corto: string;

  // Sección 1
  direccion: string;
  procedencia: string;
  regimen: string;
  sindicato: string | null;
  centro: string;
  area_depto: string;
  gravedad: string;

  // Sección 2
  numero_reporte: string;
  fecha_reporte: string;
  fecha_conocimiento_hechos: string;
  fecha_prescripcion: string;
  economica: boolean;

  // Sección 3
  gerencia_responsable: string;
  responsable_ficha: string;
  responsable_nombre: string;
  responsable_categoria: string;
  responsable_puesto: string;
  responsable_extension: string;
  responsable_email: string;

  // Sección 4
  lugar: string;
  observaciones: string;
  fecha_evento: string;
  centro_trabajo: string;
  antecedentes: string;

  // Relaciones
  contactos: Contacto[];
  investigadores: Investigador[];
  reportantes: Reportante[];
  involucrados: Involucrado[];
  testigos: Testigo[];
  detalles_conducta?: string;
  porcentaje_completitud?: number;
  sin_elementos?: boolean;
}

export interface OpcionesDropdowns {
  direcciones: string[];
  procedencias: string[];
  conductas: string[];
  regimenes: string[];
  sindicatos: string[];
  gravedades: string[];
  gerencias: string[];
  sancion: string[];
}

export interface InvestigacionListado {
  direccion: string;
  id: number;
  numero_reporte: string;
  procedencia: string;
  nombre_corto: string;
  gravedad: string;
  gerencia_responsable: string;
  tipo_investigacion: string;
  fecha_prescripcion: string;
  fecha_reporte: string;
  created_by_name: string;
  dias_restantes: number;
  semaforo: 'red' | 'yellow' | 'green' | 'gray';
  total_involucrados: number;
  total_testigos: number;
  created_at: string;
  fecha_conocimiento_hechos: string;
  investigadores: string[];
  reportantes: string[];
  involucrados: string[];
  estatus: 'Abierta' | 'Seguimiento' | 'Concluida' | 'ABIERTA' | 'SEGUIMIENTO' | 'CONCLUIDA' | 'ENVIADA_A_CONCLUIR';
  conductas: string;
  detalles_conducta?: string;
  sancion?: string;
  conducta_definitiva?: string;
  dias_suspension?: number;
  observaciones_reconsideracion?: string;
  reconsideracion?: boolean;
  sin_elementos?: boolean;
  economica?: boolean;
}

export interface Antecedente {
  procedencia: string;
  fecha: string;
  descripcion: string;
  referencia: string;
}

export interface EmpleadoBuscado {
  ficha: string;
  nombre: string;
  nivel: string;
  categoria: string;
  puesto: string;
  edad: number;
  antiguedad: number;
  rfc: string;
  curp: string;
  direccion: string;
  antecedentes?: Antecedente[];
  regimen: string;
  jornada: string;
  sindicato: string;
  seccion_sindical: string;
  fuente?: string;
  centro_trabajo: string;
  termino?: string;
  email?: string;
}

export interface InvolucradoForm {
  ficha: string;
  nombre: string;
  fuente: string;
  centro_trabajo: string;
  termino: string;
  nivel: string;
  categoria: string;
  puesto: string;
  edad: number;
  antiguedad: number;
  rfc: string;
  curp: string;
  direccion: string;
  tiene_antecedentes?: boolean;

  antecedentes_detalles?: Antecedente[];
  es_externo?: boolean;
}

export interface InvestigacionDetalle extends InvestigacionFormState {
  sancion?: string;
  dias_suspension?: number;
  estatus?: string;
  reconsideracion?: boolean;
  observaciones_reconsideracion?: string;
  conducta_definitiva?: string;
  sin_elementos?: boolean;
}