/**
 * ==============================================================================
 * MÓDULO: SERVICIO DE TRAMOS Y PARADAS INTERMEDIAS (ISSUE #14)
 * Proyecto: EcuRutas - Sistema de Gestión de Transporte Interprovincial
 * Institución: Universidad Técnica de Ambato (UTA)
 * ==============================================================================
 * Descripción:
 * Proporciona la lógica de negocio para:
 * 1. Unificación y ordenamiento de paradas (terminales + intermedias).
 * 2. Validación topológica de orden de viaje (origen estrictamente menor a destino).
 * 3. Algoritmo proporcional de tarifas conforme a la normativa de la ANT.
 * 4. Verificación de colisiones de asientos por tramo para optimizar el aforo del bus.
 * ==============================================================================
 */

import type {
  FrecuenciaRow,
  ParadaFrecuenciaRow,
  ParadaRuta,
  ValidacionTramoResult,
} from '@/lib/types';

/**
 * Construye la secuencia unificada y ordenada de paradas de una frecuencia.
 * 
 * Si las paradas intermedias registradas en la base de datos no contienen
 * los terminales oficiales de la frecuencia (origen y destino), estos se
 * inyectan de manera sintética en las posiciones 0 (origen) y N+1 (destino).
 * 
 * @param frecuencia Registro de la frecuencia base con origen y destino máster.
 * @param paradasIntermedias Lista de paradas intermedias registradas para la frecuencia.
 * @returns Lista ordenada de ParadaRuta con índices secuenciales (0, 1, 2, ..., N).
 */
export function construirSecuenciaParadas(
  frecuencia: FrecuenciaRow,
  paradasIntermedias: ParadaFrecuenciaRow[] = []
): ParadaRuta[] {
  const lista: ParadaRuta[] = [];

  // Normalización para comparaciones insensibles a mayúsculas y acentos
  const normalize = (txt: string) =>
    txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const normOrigen = normalize(frecuencia.origen);
  const normDestino = normalize(frecuencia.destino);

  // Ordenar paradas intermedias existentes por su campo 'orden'
  const intermediasOrdenadas = [...paradasIntermedias].sort((a, b) => a.orden - b.orden);

  const existeOrigen = intermediasOrdenadas.some((p) => normalize(p.ciudad) === normOrigen);
  const existeDestino = intermediasOrdenadas.some((p) => normalize(p.ciudad) === normDestino);

  // 1. Inyectar terminal origen si no está explícito en la tabla
  if (!existeOrigen) {
    lista.push({
      id: `terminal-origen-${frecuencia.id}`,
      frecuenciaId: frecuencia.id,
      ciudad: frecuencia.origen,
      orden: 0,
      tipo: 'origen',
      distanciaKmDesdeOrigen: 0,
    });
  }

  // 2. Agregar paradas intermedias
  for (const p of intermediasOrdenadas) {
    const normCiudad = normalize(p.ciudad);
    let tipo: 'origen' | 'intermedia' | 'destino' = 'intermedia';
    if (normCiudad === normOrigen) tipo = 'origen';
    else if (normCiudad === normDestino) tipo = 'destino';

    lista.push({
      id: p.id,
      frecuenciaId: p.frecuenciaId,
      ciudad: p.ciudad,
      orden: p.orden,
      tipo,
    });
  }

  // 3. Inyectar terminal destino si no está explícito en la tabla
  if (!existeDestino) {
    const maxOrden = lista.length > 0 ? Math.max(...lista.map((x) => x.orden)) : 0;
    lista.push({
      id: `terminal-destino-${frecuencia.id}`,
      frecuenciaId: frecuencia.id,
      ciudad: frecuencia.destino,
      orden: maxOrden + 1,
      tipo: 'destino',
    });
  }

  // 4. Reindexar secuencialmente (0, 1, 2, ..., N-1) garantizando invariante de orden
  lista.sort((a, b) => a.orden - b.orden);
  return lista.map((p, idx) => ({
    ...p,
    orden: idx,
  }));
}

/**
 * Valida de forma estricta que la parada de origen preceda a la parada de destino
 * en la secuencia de paradas de la frecuencia (ordenOrigen < ordenDestino).
 *
 * @param origenIdentificador ID de parada o nombre de la ciudad de origen.
 * @param destinoIdentificador ID de parada o nombre de la ciudad de destino.
 * @param secuenciaParadas Secuencia ordenada de paradas de la frecuencia.
 * @returns ValidacionTramoResult indicando si el tramo es válido y los órdenes involucrados.
 */
export function validarOrdenParadas(
  origenIdentificador: string,
  destinoIdentificador: string,
  secuenciaParadas: ParadaRuta[]
): ValidacionTramoResult {
  if (!origenIdentificador || !destinoIdentificador) {
    return {
      valido: false,
      mensaje: 'Debes especificar tanto la parada de origen como la de destino.',
    };
  }

  const normalize = (txt: string) =>
    txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const normOrigen = normalize(origenIdentificador);
  const normDestino = normalize(destinoIdentificador);

  if (normOrigen === normDestino) {
    return {
      valido: false,
      mensaje: 'La parada de origen no puede ser idéntica a la parada de destino.',
    };
  }

  // Buscar parada origen por ID exacto o por nombre de ciudad
  const paradaOrigen = secuenciaParadas.find(
    (p) => p.id === origenIdentificador || normalize(p.ciudad) === normOrigen
  );

  if (!paradaOrigen) {
    return {
      valido: false,
      mensaje: `La parada de origen "${origenIdentificador}" no pertenece al itinerario de esta frecuencia.`,
    };
  }

  // Buscar parada destino por ID exacto o por nombre de ciudad
  const paradaDestino = secuenciaParadas.find(
    (p) => p.id === destinoIdentificador || normalize(p.ciudad) === normDestino
  );

  if (!paradaDestino) {
    return {
      valido: false,
      mensaje: `La parada de destino "${destinoIdentificador}" no pertenece al itinerario de esta frecuencia.`,
    };
  }

  // Invariante topológico de viaje: el orden de origen debe ser menor al de destino
  if (paradaOrigen.orden >= paradaDestino.orden) {
    return {
      valido: false,
      mensaje: `El itinerario no permite retroceder: "${paradaOrigen.ciudad}" (escala #${paradaOrigen.orden}) está después o en el mismo punto que "${paradaDestino.ciudad}" (escala #${paradaDestino.orden}).`,
      ordenOrigen: paradaOrigen.orden,
      ordenDestino: paradaDestino.orden,
    };
  }

  const tramosIntermedios = paradaDestino.orden - paradaOrigen.orden;

  return {
    valido: true,
    mensaje: `Tramo válido: ${paradaOrigen.ciudad} ➔ ${paradaDestino.ciudad} (${tramosIntermedios} tramo(s) intermedio(s)).`,
    ordenOrigen: paradaOrigen.orden,
    ordenDestino: paradaDestino.orden,
    tramosIntermedios,
  };
}
