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
  antiguedad: number; // Asumo que se envía como número
  rfc: string;
  curp: string;
  direccion: string;
}

export interface Testigo extends BasePersona {
  nivel: string; // Testigo no tenía 'nivel' en tu modelo, pero Involucrado sí. Lo añado por si acaso.
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
  fecha_reporte: string; // Usamos string para <input type="date">
  fecha_conocimiento_hechos: string;
  economica: boolean;
  
  // Sección 3
  gerencia_responsable: string;
  
  // Sección 4
  lugar: string;
  observaciones: string;
  fecha_evento: string;
  centro_trabajo: string;
  antecedentes: string;
  
  // Relaciones (los arrays anidados)
  contactos: Contacto[];
  investigadores: Investigador[];
  involucrados: Involucrado[];
  testigos: Testigo[];
}

// Tipo para las opciones de los Dropdowns
export interface OpcionesDropdowns {
  direcciones: string[];
  procedencias: string[];
  regimenes: string[];
  sindicatos: string[];
  gravedades: string[];
  gerencias: string[];
}

// Tipo para el listado (ListSerializer)
export interface InvestigacionListado {
  id: number;
  numero_reporte: string;
  nombre_corto: string;
  descripcion_general: string;
  gravedad: string;
  fecha_prescripcion: string;
  created_by_name: string;
  dias_restantes: number;
  semaforo: 'red' | 'yellow' | 'green' | 'gray';
  total_involucrados: number;
  total_testigos: number;
  created_at: string;
}