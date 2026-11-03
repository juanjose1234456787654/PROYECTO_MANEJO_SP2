/**
 * ==============================================================================
 * MÓDULO: SERVICIO DE HOJAS DE RUTA Y DÍAS DE PARADA ANT (ACTIVIDAD 3)
 * Proyecto: EcuRutas - Sistema de Gestión de Transporte Interprovincial
 * Institución: Universidad Técnica de Ambato (UTA)
 * ==============================================================================
 * Marco Regulatorio:
 * - Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial (LOTTTSV).
 * - Reglamento de Títulos Habilitantes de la Agencia Nacional de Tránsito (ANT).
 *
 * Regla Operativa Fundamental (Restricción de Flota Sobrante):
 * Cuando una operadora/cooperativa posee más buses activos registrados que el número
 * de frecuencias autorizadas en su resolución (Nbuses > Nfrecuencias), la ANT prohíbe
 * la sobreoferta de unidades en vía pública. El sistema debe asignar equitativa y
 * rotativamente "Días de Parada" (descanso operativo preventivo) a la flota excedente.
 * ==============================================================================
 */

import type {
  BusRow,
  FrecuenciaRow,
  UsuarioRow,
  RegistroDiaParada,
  AsignacionBusFrecuencia,
  ControlFlotaANT,
  HojaRutaDiaria,
} from '@/lib/types';

/**
 * Calcula el número de días desde una época estándar (UTC) para garantizar que
 * la rotación de la flota sea determinista y reproducible independientemente del huso horario.
 */
export function obtenerIndiceDiaEpoch(fechaStr: string): number {
  const cleanDate = fechaStr.split('T')[0];
  const timestamp = Date.parse(`${cleanDate}T12:00:00Z`);
  return Math.floor(timestamp / (1000 * 60 * 60 * 24));
}

/**
 * Calcula el diagnóstico de flota según la capacidad autorizada en la Resolución ANT.
 *
 * @param cooperativaId Identificador de la cooperativa.
 * @param buses Lista de buses activos pertenecientes a la cooperativa.
 * @param frecuencias Lista de frecuencias activas autorizadas por la ANT.
 * @param fecha Fecha de operación en formato YYYY-MM-DD.
 * @returns ControlFlotaANT con balance y requerimiento de días de parada.
 */
export function calcularControlFlota(
  cooperativaId: string,
  buses: BusRow[],
  frecuencias: FrecuenciaRow[],
  fecha: string
): ControlFlotaANT {
  const busesActivos = buses.filter((b) => b.activo !== false);
  const frecuenciasActivas = frecuencias.filter((f) => f.activa !== false);

  const totalBusesActivos = busesActivos.length;
  const totalFrecuenciasActivas = frecuenciasActivas.length;

  const excesoFlota = Math.max(0, totalBusesActivos - totalFrecuenciasActivas);
  const requiereDiasParada = excesoFlota > 0;
  const indiceRotacionDia = obtenerIndiceDiaEpoch(fecha);

  const porcentajeFlotaEnOperacion =
    totalBusesActivos > 0
      ? Number((((totalBusesActivos - excesoFlota) / totalBusesActivos) * 100).toFixed(1))
      : 0;

  const resolucionANTReferencial = frecuenciasActivas[0]?.resolucionANT || null;

  return {
    cooperativaId,
    fecha: fecha.split('T')[0],
    totalBusesActivos,
    totalFrecuenciasActivas,
    excesoFlota,
    requiereDiasParada,
    resolucionANTReferencial,
    indiceRotacionDia,
    porcentajeFlotaEnOperacion,
  };
}

/**
 * Algoritmo determinista y equitativo para identificar qué unidades deben descansar
 * en "Día de Parada" en la fecha especificada debido a la restricción de sobreoferta de la ANT.
 *
 * Algoritmo de Rotación Equitativa Cíclica:
 * - Se ordenan las unidades activas de forma ascendente por su número de disco.
 * - Con N buses y K = N - M unidades sobrantes:
 *   inicioParada = (diaEpoch * K) mod N.
 * - Los K buses seleccionados rotan uniformemente día tras día garantizando que
 *   todos los socios gocen de idéntico tiempo de descanso y días de operación al mes.
 *
 * @param busesActivos Lista ordenada de buses activos de la cooperativa.
 * @param totalFrecuencias Número de turnos autorizados en el día.
 * @param fecha Fecha de operación (YYYY-MM-DD).
 * @param cooperativaId ID de la cooperativa.
 * @returns Array de RegistroDiaParada para las unidades en descanso obligatorio.
 */
export function determinarBusesEnParada(
  busesActivos: BusRow[],
  totalFrecuencias: number,
  fecha: string,
  cooperativaId: string
): { busesEnParada: RegistroDiaParada[]; busesHabilitados: BusRow[] } {
  const N = busesActivos.length;
  const M = totalFrecuencias;
  const K = Math.max(0, N - M);

  // Si no hay exceso de flota, todos los buses están habilitados para operar
  if (K === 0 || N === 0) {
    return {
      busesEnParada: [],
      busesHabilitados: [...busesActivos],
    };
  }

  // Ordenamiento determinista por número de disco
  const busesOrdenados = [...busesActivos].sort((a, b) => a.numero - b.numero);
  const diaEpoch = Math.abs(obtenerIndiceDiaEpoch(fecha));

  // Índice inicial de parada cíclica
  const inicioParada = (diaEpoch * K) % N;

  const indicesParada = new Set<number>();
  for (let i = 0; i < K; i++) {
    indicesParada.add((inicioParada + i) % N);
  }

  const busesEnParada: RegistroDiaParada[] = [];
  const busesHabilitados: BusRow[] = [];

  busesOrdenados.forEach((bus, idx) => {
    if (indicesParada.has(idx)) {
      // Calcular fecha aproximada de reintegro (día siguiente)
      const fechaObj = new Date(`${fecha.split('T')[0]}T12:00:00Z`);
      fechaObj.setDate(fechaObj.getDate() + 1);
      const proximoTurnoEstimado = fechaObj.toISOString().split('T')[0];

      busesEnParada.push({
        busId: bus.id,
        numeroBus: bus.numero,
        placa: bus.placa,
        fecha: fecha.split('T')[0],
        motivo: 'exceso_flota',
        observacion: `Descanso preventivo obligatorio ANT por exceso de flota (${K} unidad(es) en rotación diaria).`,
        cooperativaId,
        proximoTurnoEstimado,
      });
    } else {
      busesHabilitados.push(bus);
    }
  });

  return { busesEnParada, busesHabilitados };
}
