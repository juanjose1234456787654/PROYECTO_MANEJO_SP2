import type {
  Database,
  Json,
  RolUsuario,
} from '@/types/database.types';

export type { Database, Json, RolUsuario };

/**
 * Patrón de resultado uniforme para todas las operaciones contra Supabase.
 */
export type Result<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Tipos de filas (Row) de las tablas reales en Supabase (PascalCase).
 */
export type GrupoBusRow = Database['public']['Tables']['GrupoBus']['Row'];
export type GrupoFrecuenciaRow = Database['public']['Tables']['GrupoFrecuencia']['Row'];
export type CooperativaRow = Database['public']['Tables']['Cooperativa']['Row'];
export type UsuarioRow = Database['public']['Tables']['Usuario']['Row'];
export type BusRow = Database['public']['Tables']['Bus']['Row'];
export type FrecuenciaRow = Database['public']['Tables']['Frecuencia']['Row'];
export type ParadaFrecuenciaRow = Database['public']['Tables']['ParadaFrecuencia']['Row'];
export type RutaRow = Database['public']['Tables']['Ruta']['Row'];
export type BoletoRow = Database['public']['Tables']['Boleto']['Row'];
export type RegistroParadaRow = Database['public']['Tables']['RegistroParada']['Row'];
export type ConfiguracionAppRow = Database['public']['Tables']['ConfiguracionApp']['Row'];

/**
 * Tipos de inserción (Insert) de las tablas reales en Supabase.
 */
export type CooperativaInsert = Database['public']['Tables']['Cooperativa']['Insert'];
export type UsuarioInsert = Database['public']['Tables']['Usuario']['Insert'];
export type BusInsert = Database['public']['Tables']['Bus']['Insert'];
export type FrecuenciaInsert = Database['public']['Tables']['Frecuencia']['Insert'];
export type ParadaFrecuenciaInsert = Database['public']['Tables']['ParadaFrecuencia']['Insert'];
export type RutaInsert = Database['public']['Tables']['Ruta']['Insert'];
export type BoletoInsert = Database['public']['Tables']['Boleto']['Insert'];
export type RegistroParadaInsert = Database['public']['Tables']['RegistroParada']['Insert'];
export type ConfiguracionAppInsert = Database['public']['Tables']['ConfiguracionApp']['Insert'];

/**
 * Tipos de actualización (Update) de las tablas reales en Supabase.
 */
export type CooperativaUpdate = Database['public']['Tables']['Cooperativa']['Update'];
export type UsuarioUpdate = Database['public']['Tables']['Usuario']['Update'];
export type BusUpdate = Database['public']['Tables']['Bus']['Update'];
export type FrecuenciaUpdate = Database['public']['Tables']['Frecuencia']['Update'];
export type ParadaFrecuenciaUpdate = Database['public']['Tables']['ParadaFrecuencia']['Update'];
export type RutaUpdate = Database['public']['Tables']['Ruta']['Update'];
export type BoletoUpdate = Database['public']['Tables']['Boleto']['Update'];
export type RegistroParadaUpdate = Database['public']['Tables']['RegistroParada']['Update'];
export type ConfiguracionAppUpdate = Database['public']['Tables']['ConfiguracionApp']['Update'];

// ==============================================================================
// DOMINIO: PARADAS INTERMEDIAS Y CÁLCULO DE TRAMOS (ISSUE #14)
// Sistema Interprovincial EcuRutas - Universidad Técnica de Ambato
// ==============================================================================

/**
 * Clasificación funcional de una escala o parada en el itinerario de una frecuencia.
 */
export type TipoParada = 'origen' | 'intermedia' | 'destino';

/**
 * Representación unificada de una parada en la secuencia de una ruta/frecuencia.
 * Incluye tanto terminales oficiales como paradas intermedias registradas.
 */
export interface ParadaRuta {
  id: string;
  frecuenciaId: string;
  ciudad: string;
  orden: number;
  tipo: TipoParada;
  distanciaKmDesdeOrigen?: number;
  tiempoEstimadoMinutos?: number;
  precioReferencial?: number;
}

/**
 * Estructura de un tramo o segmento de viaje seleccionado por el usuario.
 */
export interface TramoRuta {
  frecuenciaId: string;
  origen: ParadaRuta;
  destino: ParadaRuta;
  distanciaKm: number;
  precioBase: number;
  ordenOrigen: number;
  ordenDestino: number;
}

/**
 * Configuración de precios por tramo almacenada en el campo JSON 'preciosPorTramo'
 * de la tabla 'Frecuencia' según resolución ANT.
 */
export interface MatrizPreciosPorTramo {
  distanciasKm?: Record<string, number>;
  tarifasFijas?: Record<string, number>;
  precioPorKm?: number;
  tarifaMinima?: number;
  resolucionANTReferencial?: string;
}

/**
 * Resultado estructurado de la validación topológica de orden entre paradas.
 */
export interface ValidacionTramoResult {
  valido: boolean;
  mensaje: string;
  ordenOrigen?: number;
  ordenDestino?: number;
  tramosIntermedios?: number;
}

/**
 * Desglose matemático y legal de la tarifa calculada para un tramo intermedio.
 */
export interface CalculoTarifaTramo {
  frecuenciaId: string;
  origen: string;
  destino: string;
  ordenOrigen: number;
  ordenDestino: number;
  precioBaseRutaTotal: number;
  precioCalculadoTramo: number;
  resolucionANT: string | null;
  metodoCalculo: 'matriz_especifica' | 'proporcional_distancia' | 'proporcional_orden';
  porcentajeRecorrido: number;
  distanciaKmTramo?: number;
  distanciaKmTotal?: number;
  tarifaMinimaAplicada: boolean;
}

/**
 * Estado de disponibilidad de un asiento para un tramo específico.
 */
export interface DisponibilidadAsientoTramo {
  asiento: number;
  disponible: boolean;
  motivoBloqueo?: string;
  boletoOcupanteId?: string;
}

/**
 * Respuesta estructurada de consulta de disponibilidad de asientos en un tramo.
 */
export interface ConsultaDisponibilidadTramoResult {
  rutaId: string;
  frecuenciaId: string;
  origenParadaId: string;
  destinoParadaId: string;
  asientosTotales: number;
  asientosOcupados: number[];
  asientosDisponibles: number[];
}

// ==============================================================================
// DOMINIO: VALIDACIÓN DE IDENTIDAD Y DESCUENTOS ANT (ISSUE #15)
// Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial (LOTTTSV)
// ==============================================================================

/**
 * Clasificación de beneficiarios de tarifas según normativa legal ecuatoriana de la ANT.
 * - 'general': Tarifa estándar (100% del valor, sin descuento).
 * - 'tercera_edad': Adultos mayores de 65 años o más (50% de descuento obligatorio).
 * - 'menor_edad': Niños, niñas y adolescentes menores de 18 años (50% de descuento obligatorio).
 * - 'discapacidad': Personas con discapacidad debidamente acreditadas (50% de descuento obligatorio).
 */
export type BeneficiarioDescuento = 'general' | 'tercera_edad' | 'menor_edad' | 'discapacidad';

/**
 * Datos requeridos para la validación de identidad y verificación de elegibilidad de tarifa.
 */
export interface DatosPasajeroValidacion {
  cedula: string;
  nombre: string;
  fechaNacimiento?: string; // Formato YYYY-MM-DD
  esDiscapacitado?: boolean;
  porcentajeDiscapacidad?: number;
  numeroCarnetConadis?: string;
}

/**
 * Resultado formal del análisis algorítmico de la cédula ecuatoriana (Módulo 10).
 */
export interface ResultadoValidacionCedula {
  valida: boolean;
  cedula: string;
  codigoProvincia?: string;
  provincia?: string;
  mensaje: string;
}

/**
 * Desglose detallado del cálculo de tarifa final y aplicación de descuentos por ley ANT.
 */
export interface DesgloseTarifaFinal {
  precioBase: number;
  tipoBeneficiario: BeneficiarioDescuento;
  edad?: number;
  aplicaDescuento: boolean;
  porcentajeDescuento: number; // 0 o 50
  valorDescuento: number;
  tarifaFinal: number;
  recargoVip: number;
  totalConVip: number;
  justificacionLegal: string;
}

// ==============================================================================
// DOMINIO: HOJAS DE RUTA Y CONTROL DE DÍAS DE PARADA ANT (ACTIVIDAD 3)
// Reglamento de Aplicación de la LOTTTSV y Resoluciones Operativas ANT
// ==============================================================================

/**
 * Registro de un vehículo asignado a "Día de Parada" (descanso preventivo obligatorio)
 * debido al exceso de flota respecto al número de frecuencias autorizadas por la ANT.
 */
export interface RegistroDiaParada {
  busId: string;
  numeroBus: number;
  placa: string;
  fecha: string; // Formato YYYY-MM-DD
  motivo: 'exceso_flota' | 'mantenimiento' | 'descanso_obligatorio';
  observacion: string;
  cooperativaId: string;
  proximoTurnoEstimado?: string; // Fecha estimada de reintegro a operación
}

/**
 * Asignación operativa de un bus habilitado y su conductor a una frecuencia autorizada.
 */
export interface AsignacionBusFrecuencia {
  frecuenciaId: string;
  origen: string;
  destino: string;
  hora: string;
  resolucionANT: string | null;
  busId: string;
  numeroBus: number;
  placa: string;
  capacidad: number;
  choferId?: string | null;
  nombreChofer?: string | null;
  estadoRuta: 'programada' | 'en_curso' | 'completada' | 'cancelada';
  rutaId?: string;
  duracionEstimada?: string | null;
}

/**
 * Control y diagnóstico de flota según normativa de la Agencia Nacional de Tránsito.
 * Determina el balance entre unidades registradas y turnos autorizados.
 */
export interface ControlFlotaANT {
  cooperativaId: string;
  fecha: string;
  totalBusesActivos: number;
  totalFrecuenciasActivas: number;
  excesoFlota: number; // max(0, totalBusesActivos - totalFrecuenciasActivas)
  requiereDiasParada: boolean;
  resolucionANTReferencial?: string | null;
  indiceRotacionDia: number;
  porcentajeFlotaEnOperacion: number;
}

/**
 * Documento formal de Hoja de Trabajo y Despacho Diario de una cooperativa de transporte.
 */
export interface HojaRutaDiaria {
  id: string;
  cooperativaId: string;
  fecha: string; // Formato YYYY-MM-DD
  controlFlota: ControlFlotaANT;
  asignaciones: AsignacionBusFrecuencia[];
  busesEnParada: RegistroDiaParada[];
  generadoAt: string;
  generadoPor?: string;
}
