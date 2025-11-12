export interface BasePersona {
  id?: number;
  ficha: string;
  nombre: string;
  categoria: string;
  puesto: string;
  extension?: string;
  email?: string;
}

export interface Contacto extends BasePersona {
  tipo: 'contacto' | 'responsable';
}

export interface Investigador extends BasePersona {}

export interface Involucrado extends BasePersona {
  nivel: string;
  edad: number;
  antiguedad: number;
  rfc: string;
  curp: string;
  direccion: string;
}

export interface Testigo extends BasePersona {
  nivel: string;
  direccion: string;
  subordinacion: boolean;
}

// El tipo para el formulario de creación/edición
export interface InvestigacionFormState {
  id?: number;
  nombre_corto: string;
  descripcion_general: string;
  
  // Sección 1
  direccion: string;
  procedencia: string;
  regimen: string;
  sindicato: string | null;
  centro: string;
  area_depto: string;
  gravedad: string;
  
  // Sección 2
  numero_reporte: string; // AÑADIR ESTA PROPIEDAD FALTANTE
  fecha_reporte: string;
  fecha_conocimiento_hechos: string;
  fecha_prescripcion: string;
  economica: boolean;
  
  // Sección 3
  gerencia_responsable: string;
  
  // Sección 4
  lugar: string;
  observaciones: string;
  fecha_evento: string;
  centro_trabajo: string;
  antecedentes: string;
  
  // Relaciones
  contactos: Contacto[];
  investigadores: Investigador[];
  involucrados: Involucrado[];
  testigos: Testigo[];
}

export interface OpcionesDropdowns {
  direcciones: string[];
  procedencias: string[];
  regimenes: string[];
  sindicatos: string[];
  gravedades: string[];
  gerencias: string[];
}

export interface InvestigacionListado {
  id: number;
  numero_reporte: string;
  procedencia: string;
  nombre_corto: string;
  descripcion_general: string;
  gravedad: string;
  gerencia_responsable: string;
  fecha_prescripcion: string;
  fecha_reporte: string;
  created_by_name: string;
  dias_restantes: number;
  semaforo: 'red' | 'yellow' | 'green' | 'gray';
  total_involucrados: number;
  total_testigos: number;
  created_at: string;
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
}

