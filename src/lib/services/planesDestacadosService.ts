import type {
  EstadoSuscripcion,
  PlanMembresiaRow,
  ResumenSuscripcionCoop,
  RolUsuario,
  RutaDestacadaRow,
  SuscripcionCooperativaRow,
} from '@/lib/types';

/**
 * Planes mensuales predeterminados del sistema EcuRutas (RFC-005 / ECU-7).
 */
export const DEFAULT_PLANES_MEMBRESIA: PlanMembresiaRow[] = [
  {
    id: 'plan-normal',
    nombre: 'Normal',
    cupoRutasDestacadas: 1,
    precioMensual: 15,
    duracionDias: 30,
    descripcion: 'Incluye hasta 1 ruta destacada prioritaria en búsquedas por 30 días.',
    activo: true,
    createdAt: null,
  },
  {
    id: 'plan-plus',
    nombre: 'Plus',
    cupoRutasDestacadas: 3,
    precioMensual: 35,
    duracionDias: 30,
    descripcion: 'Incluye hasta 3 rutas destacadas prioritarias en búsquedas por 30 días.',
    activo: true,
    createdAt: null,
  },
  {
    id: 'plan-premium',
    nombre: 'Premium',
    cupoRutasDestacadas: 8,
    precioMensual: 70,
    duracionDias: 30,
    descripcion: 'Incluye hasta 8 rutas destacadas prioritarias en búsquedas por 30 días.',
    activo: true,
    createdAt: null,
  },
];

/**
 * Retorna la fecha actual en formato ISO YYYY-MM-DD (UTC).
 */
export function obtenerFechaHoyISO(fechaReferencia: Date = new Date()): string {
  return fechaReferencia.toISOString().slice(0, 10);
}

/**
 * Calcula la fecha de vencimiento sumando `duracionDias` a `fechaInicio` (YYYY-MM-DD).
 */
export function calcularFechaVencimiento(fechaInicio: string, duracionDias = 30): string {
  const base = new Date(`${fechaInicio.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) {
    throw new Error(`Fecha de inicio inválida: ${fechaInicio}`);
  }
  base.setUTCDate(base.getUTCDate() + Math.max(1, duracionDias));
  return base.toISOString().slice(0, 10);
}

/**
 * Determina el estado efectivo de una suscripción aplicando expiración automática
 * cuando `fechaVencimiento < fechaReferencia`.
 */
export function resolverEstadoSuscripcion(
  suscripcion: Pick<SuscripcionCooperativaRow, 'estado' | 'fechaVencimiento'> | null,
  fechaReferencia: string = obtenerFechaHoyISO()
): EstadoSuscripcion | 'SIN_PLAN' {
  if (!suscripcion) return 'SIN_PLAN';
  const estadoNormalizado = (suscripcion.estado || '').toUpperCase();
  if (estadoNormalizado === 'SUSPENDIDA') return 'SUSPENDIDA';
  if (estadoNormalizado === 'VENCIDA') return 'VENCIDA';
  if (suscripcion.fechaVencimiento.slice(0, 10) < fechaReferencia.slice(0, 10)) {
    return 'VENCIDA';
  }
  return 'ACTIVA';
}

/**
 * Indica si una suscripción se encuentra actualmente activa y no vencida.
 */
export function estaSuscripcionVigente(
  suscripcion: Pick<SuscripcionCooperativaRow, 'estado' | 'fechaVencimiento'> | null,
  fechaReferencia: string = obtenerFechaHoyISO()
): boolean {
  return resolverEstadoSuscripcion(suscripcion, fechaReferencia) === 'ACTIVA';
}

/**
 * Valida que solo un SuperAdmin (`admin`) pueda activar, renovar o suspender planes.
 */
export function validarActivacionPlanPorSuperAdmin(
  rolEjecutor: RolUsuario | string | null | undefined
): { permitido: boolean; motivo?: string } {
  if (rolEjecutor !== 'admin') {
    return {
      permitido: false,
      motivo: 'Solo el SuperAdmin puede activar, renovar o suspender planes de membresía.',
    };
  }
  return { permitido: true };
}

export interface ValidacionDestacarRutaInput {
  rolEjecutor: RolUsuario | string | null | undefined;
  cooperativaUsuarioId?: string | null;
  cooperativaRutaId: string;
  frecuenciaId: string;
  suscripcion: SuscripcionCooperativaRow | null;
  plan: PlanMembresiaRow | null;
  rutasDestacadasActivasCoop: RutaDestacadaRow[];
  fechaReferencia?: string;
}

/**
 * Evalúa si un usuario puede destacar o quitar destacado a una frecuencia según
 * su rol, propiedad de la cooperativa, vigencia del plan y cupo disponible.
 */
export function puedeDestacarRuta(input: ValidacionDestacarRutaInput): {
  permitido: boolean;
  accion: 'activar' | 'desactivar';
  motivo?: string;
} {
  const {
    rolEjecutor,
    cooperativaUsuarioId,
    cooperativaRutaId,
    frecuenciaId,
    suscripcion,
    plan,
    rutasDestacadasActivasCoop,
    fechaReferencia = obtenerFechaHoyISO(),
  } = input;

  if (rolEjecutor !== 'cooperativa' && rolEjecutor !== 'admin') {
    return {
      permitido: false,
      accion: 'activar',
      motivo: 'Tu rol no tiene permisos para gestionar rutas destacadas.',
    };
  }

  if (rolEjecutor === 'cooperativa' && cooperativaUsuarioId !== cooperativaRutaId) {
    return {
      permitido: false,
      accion: 'activar',
      motivo: 'Solo puedes destacar rutas pertenecientes a tu propia cooperativa.',
    };
  }

  const yaDestacada = rutasDestacadasActivasCoop.some(
    (r) => r.frecuenciaId === frecuenciaId && r.activa
  );
  if (yaDestacada) {
    return { permitido: true, accion: 'desactivar' };
  }

  const estadoEfectivo = resolverEstadoSuscripcion(suscripcion, fechaReferencia);
  if (estadoEfectivo !== 'ACTIVA' || !plan) {
    const motivo =
      estadoEfectivo === 'VENCIDA'
        ? 'Tu plan mensual está vencido. Solicita la renovación al SuperAdmin.'
        : estadoEfectivo === 'SUSPENDIDA'
          ? 'Tu plan mensual se encuentra suspendido. Contacta al SuperAdmin.'
          : 'Tu cooperativa no cuenta con un plan mensual activo para destacar rutas.';
    return { permitido: false, accion: 'activar', motivo };
  }

  const usadas = rutasDestacadasActivasCoop.filter((r) => r.activa).length;
  if (usadas >= plan.cupoRutasDestacadas) {
    return {
      permitido: false,
      accion: 'activar',
      motivo: `Has alcanzado el cupo máximo de ${plan.cupoRutasDestacadas} ruta(s) destacada(s) del plan ${plan.nombre}.`,
    };
  }

  return { permitido: true, accion: 'activar' };
}

/**
 * Construye el resumen consolidado del estado de suscripción y cupo de una cooperativa.
 */
export function construirResumenSuscripcion(
  suscripcion: SuscripcionCooperativaRow | null,
  plan: PlanMembresiaRow | null,
  rutasDestacadasCoop: RutaDestacadaRow[],
  fechaReferencia: string = obtenerFechaHoyISO()
): ResumenSuscripcionCoop {
  const estadoEfectivo = resolverEstadoSuscripcion(suscripcion, fechaReferencia);
  const vigente = estadoEfectivo === 'ACTIVA' && plan !== null;
  const activas = rutasDestacadasCoop.filter((r) => r.activa);
  const cupoMaximo = vigente && plan ? plan.cupoRutasDestacadas : 0;

  return {
    suscripcion,
    plan,
    estadoEfectivo,
    vigente,
    cupoMaximo,
    rutasDestacadasUsadas: activas.length,
    cupoDisponible: Math.max(0, cupoMaximo - activas.length),
    frecuenciaIdsDestacadas: vigente ? activas.map((r) => r.frecuenciaId) : [],
  };
}

/**
 * Ordena resultados de búsqueda colocando primero las rutas destacadas vigentes
 * y conservando el orden por hora de salida dentro de cada grupo.
 */
export function ordenarResultadosConDestacadas<T extends { id: string; hora?: string | null }>(
  resultados: T[],
  frecuenciaIdsDestacadas: Set<string> | string[]
): T[] {
  const destacadasSet =
    frecuenciaIdsDestacadas instanceof Set
      ? frecuenciaIdsDestacadas
      : new Set(frecuenciaIdsDestacadas);

  return [...resultados].sort((a, b) => {
    const aDest = destacadasSet.has(a.id) ? 1 : 0;
    const bDest = destacadasSet.has(b.id) ? 1 : 0;
    if (aDest !== bDest) return bDest - aDest;
    return (a.hora || '').localeCompare(b.hora || '');
  });
}
