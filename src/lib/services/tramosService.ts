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
  CalculoTarifaTramo,
  MatrizPreciosPorTramo,
  BoletoRow,
  DisponibilidadAsientoTramo,
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

// ==============================================================================
// BLOQUE 3: ALGORITMO DE CÁLCULO DE TARIFA PROPORCIONAL POR TRAMO (ANT)
// ==============================================================================

/**
 * Parsea de manera segura la configuración JSON de precios por tramo.
 * Admite tanto cadenas serializadas JSON como objetos estructurados.
 */
export function parseMatrizPreciosPorTramo(
  preciosPorTramo: unknown
): MatrizPreciosPorTramo | null {
  if (!preciosPorTramo) return null;
  if (typeof preciosPorTramo === 'object') {
    return preciosPorTramo as MatrizPreciosPorTramo;
  }
  if (typeof preciosPorTramo === 'string') {
    try {
      return JSON.parse(preciosPorTramo) as MatrizPreciosPorTramo;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Algoritmo matemático para el cálculo de tarifa proporcional por tramo.
 * 
 * Reglas de negocio y marco regulatorio (Agencia Nacional de Tránsito - ANT):
 * 1. Tarifa máxima: No puede exceder la tarifa total autorizada de la frecuencia (precioBase).
 * 2. Matriz específica ANT: Si existe tarifa fija fijada para el par origen-destino en preciosPorTramo,
 *    se aplica prioritariamente.
 * 3. Proporcionalidad kilométrica: Si se cuenta con distancias en kilómetros, la tarifa se calcula:
 *    Tarifa = PrecioBase * (KmTramo / KmTotal).
 * 4. Proporcionalidad topológica (tramos): En ausencia de kilometraje exacto, se pondera por número
 *    de escalas recorridas respecto al total de la ruta:
 *    Tarifa = PrecioBase * ((ordenDestino - ordenOrigen) / ordenTotal).
 * 5. Tarifa mínima garantizada: Se asegura un piso tarifario legal (por defecto $0.50 USD)
 *    para tramos de corta distancia.
 * 
 * @param frecuencia Frecuencia de la cual se desprende el viaje.
 * @param paradaOrigen Parada de abordaje del pasajero.
 * @param paradaDestino Parada de desembarque del pasajero.
 * @param secuenciaParadas Lista completa ordenada de paradas de la ruta.
 * @returns CalculoTarifaTramo con desglose tarifario y metadatos ANT.
 */
export function calcularTarifaProporcional(
  frecuencia: FrecuenciaRow,
  paradaOrigen: ParadaRuta,
  paradaDestino: ParadaRuta,
  secuenciaParadas: ParadaRuta[]
): CalculoTarifaTramo {
  const precioBaseRutaTotal = Math.max(0, Number(frecuencia.precioBase) || 0);
  const matrizConfig = parseMatrizPreciosPorTramo(frecuencia.preciosPorTramo);

  const TARIFA_MINIMA_DEFAULT = 0.5; // Tarifa mínima reglamentaria interprovincial ($0.50 USD)
  const tarifaMinimaConfig = matrizConfig?.tarifaMinima ?? TARIFA_MINIMA_DEFAULT;

  const normalize = (txt: string) =>
    txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const normOrigen = normalize(paradaOrigen.ciudad);
  const normDestino = normalize(paradaDestino.ciudad);

  // Escenario 1: Ruta completa (de inicio a fin de la secuencia)
  const primerOrden = secuenciaParadas[0]?.orden ?? 0;
  const ultimoOrden = secuenciaParadas[secuenciaParadas.length - 1]?.orden ?? 1;

  if (paradaOrigen.orden === primerOrden && paradaDestino.orden === ultimoOrden) {
    return {
      frecuenciaId: frecuencia.id,
      origen: paradaOrigen.ciudad,
      destino: paradaDestino.ciudad,
      ordenOrigen: paradaOrigen.orden,
      ordenDestino: paradaDestino.orden,
      precioBaseRutaTotal,
      precioCalculadoTramo: Number(precioBaseRutaTotal.toFixed(2)),
      resolucionANT: frecuencia.resolucionANT,
      metodoCalculo: 'matriz_especifica',
      porcentajeRecorrido: 100,
      tarifaMinimaAplicada: false,
    };
  }

  // Escenario 2: Tarifa fija registrada en la matriz JSON ANT
  if (matrizConfig?.tarifasFijas) {
    const keysToCheck = [
      `${paradaOrigen.id}_${paradaDestino.id}`,
      `${paradaOrigen.ciudad}_${paradaDestino.ciudad}`,
      `${normOrigen}_${normDestino}`,
      `${normOrigen}-${normDestino}`,
    ];

    for (const k of keysToCheck) {
      if (typeof matrizConfig.tarifasFijas[k] === 'number') {
        const precioFijo = matrizConfig.tarifasFijas[k];
        const porcentaje =
          precioBaseRutaTotal > 0
            ? Math.min(100, Math.round((precioFijo / precioBaseRutaTotal) * 1000) / 10)
            : 100;

        return {
          frecuenciaId: frecuencia.id,
          origen: paradaOrigen.ciudad,
          destino: paradaDestino.ciudad,
          ordenOrigen: paradaOrigen.orden,
          ordenDestino: paradaDestino.orden,
          precioBaseRutaTotal,
          precioCalculadoTramo: Number(precioFijo.toFixed(2)),
          resolucionANT: frecuencia.resolucionANT,
          metodoCalculo: 'matriz_especifica',
          porcentajeRecorrido: porcentaje,
          tarifaMinimaAplicada: false,
        };
      }
    }
  }

  // Escenario 3: Proporcional por kilometraje si se dispone de distancias en la matriz
  if (matrizConfig?.distanciasKm) {
    const distMap = matrizConfig.distanciasKm;
    const kmOrigen = distMap[paradaOrigen.ciudad] ?? distMap[normOrigen];
    const kmDestino = distMap[paradaDestino.ciudad] ?? distMap[normDestino];
    const ultimaParada = secuenciaParadas[secuenciaParadas.length - 1];
    const kmTotal =
      distMap[ultimaParada.ciudad] ?? distMap[normalize(ultimaParada.ciudad)];

    if (
      typeof kmOrigen === 'number' &&
      typeof kmDestino === 'number' &&
      typeof kmTotal === 'number' &&
      kmTotal > 0 &&
      kmDestino > kmOrigen
    ) {
      const distanciaKmTramo = kmDestino - kmOrigen;
      const proporcionKm = Math.min(1, Math.max(0, distanciaKmTramo / kmTotal));
      let tarifaCalculada = precioBaseRutaTotal * proporcionKm;
      let tarifaMinimaAplicada = false;

      if (tarifaCalculada < tarifaMinimaConfig) {
        tarifaCalculada = tarifaMinimaConfig;
        tarifaMinimaAplicada = true;
      }
      tarifaCalculada = Math.min(tarifaCalculada, precioBaseRutaTotal);

      return {
        frecuenciaId: frecuencia.id,
        origen: paradaOrigen.ciudad,
        destino: paradaDestino.ciudad,
        ordenOrigen: paradaOrigen.orden,
        ordenDestino: paradaDestino.orden,
        precioBaseRutaTotal,
        precioCalculadoTramo: Number(tarifaCalculada.toFixed(2)),
        resolucionANT: frecuencia.resolucionANT,
        metodoCalculo: 'proporcional_distancia',
        porcentajeRecorrido: Number((proporcionKm * 100).toFixed(1)),
        distanciaKmTramo,
        distanciaKmTotal: kmTotal,
        tarifaMinimaAplicada,
      };
    }
  }

  // Escenario 4: Proporcional topológico por orden relativo de escalas
  const deltaTotal = Math.max(1, ultimoOrden - primerOrden);
  const deltaTramo = Math.max(1, paradaDestino.orden - paradaOrigen.orden);
  const proporcionOrden = Math.min(1, deltaTramo / deltaTotal);

  let tarifaCalculada = precioBaseRutaTotal * proporcionOrden;
  let tarifaMinimaAplicada = false;

  if (tarifaCalculada < tarifaMinimaConfig) {
    tarifaCalculada = tarifaMinimaConfig;
    tarifaMinimaAplicada = true;
  }
  tarifaCalculada = Math.min(tarifaCalculada, precioBaseRutaTotal);

  return {
    frecuenciaId: frecuencia.id,
    origen: paradaOrigen.ciudad,
    destino: paradaDestino.ciudad,
    ordenOrigen: paradaOrigen.orden,
    ordenDestino: paradaDestino.orden,
    precioBaseRutaTotal,
    precioCalculadoTramo: Number(tarifaCalculada.toFixed(2)),
    resolucionANT: frecuencia.resolucionANT,
    metodoCalculo: 'proporcional_orden',
    porcentajeRecorrido: Number((proporcionOrden * 100).toFixed(1)),
    tarifaMinimaAplicada,
  };
}

/**
 * Función integral que valida el tramo y ejecuta el cálculo de tarifa proporcional.
 * Lanza un error controlado si el tramo seleccionado no cumple con las reglas de orden.
 */
export function calcularTarifaTramo(
  frecuencia: FrecuenciaRow,
  origenIdentificador: string,
  destinoIdentificador: string,
  secuenciaParadas: ParadaRuta[]
): CalculoTarifaTramo {
  const validacion = validarOrdenParadas(
    origenIdentificador,
    destinoIdentificador,
    secuenciaParadas
  );

  if (!validacion.valido) {
    throw new Error(validacion.mensaje);
  }

  const normalize = (txt: string) =>
    txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const normOrigen = normalize(origenIdentificador);
  const normDestino = normalize(destinoIdentificador);

  const paradaOrigen = secuenciaParadas.find(
    (p) => p.id === origenIdentificador || normalize(p.ciudad) === normOrigen
  )!;
  const paradaDestino = secuenciaParadas.find(
    (p) => p.id === destinoIdentificador || normalize(p.ciudad) === normDestino
  )!;

  return calcularTarifaProporcional(
    frecuencia,
    paradaOrigen,
    paradaDestino,
    secuenciaParadas
  );
}

// ==============================================================================
// BLOQUE 4: VERIFICACIÓN DE DISPONIBILIDAD DE ASIENTOS POR TRAMO
// ==============================================================================

/**
 * Determina si dos intervalos de viaje colisionan en al menos un tramo de la ruta.
 *
 * Teorema de traslape de segmentos 1D continuos/discretos:
 * Dos intervalos [Oe, De] y [Os, Ds] con Oe < De y Os < Ds se traslapan
 * si y solo si:
 *   Oe < Ds  Y  Os < De
 *
 * Demostración de casos borde:
 * 1. Pasajero existente: Ambato (0) ➔ Latacunga (2)
 *    Pasajero entrante:  Latacunga (2) ➔ Quito (4)
 *    Evaluación: 0 < 4 (true) && 2 < 2 (false) => FALSE (NO colisiona, asiento libre).
 * 2. Pasajero existente: Ambato (0) ➔ Latacunga (2)
 *    Pasajero entrante:  Salcedo (1) ➔ Machachi (3)
 *    Evaluación: 0 < 3 (true) && 1 < 2 (true) => TRUE (COLISIONA, asiento ocupado).
 *
 * @param ordenOrigenExistente Orden de abordaje del boleto existente.
 * @param ordenDestinoExistente Orden de desembarque del boleto existente.
 * @param ordenOrigenSolicitado Orden de abordaje solicitado por el cliente.
 * @param ordenDestinoSolicitado Orden de desembarque solicitado por el cliente.
 */
export function asientosColisionanEnTramo(
  ordenOrigenExistente: number,
  ordenDestinoExistente: number,
  ordenOrigenSolicitado: number,
  ordenDestinoSolicitado: number
): boolean {
  return (
    ordenOrigenExistente < ordenDestinoSolicitado &&
    ordenOrigenSolicitado < ordenDestinoExistente
  );
}

/**
 * Filtra los números de asientos que se encuentran realmente ocupados durante
 * el tramo específico solicitado, evitando bloqueos falsos en otros segmentos
 * de la misma frecuencia donde el asiento queda libre.
 *
 * @param boletos Lista de boletos emitidos para la ruta específica.
 * @param secuenciaParadas Secuencia ordenada de paradas de la frecuencia.
 * @param ordenOrigenSolicitado Orden de la parada de subida del nuevo pasajero.
 * @param ordenDestinoSolicitado Orden de la parada de bajada del nuevo pasajero.
 * @returns Array ordenado y sin duplicados de números de asientos ocupados en el tramo.
 */
export function filtrarAsientosOcupadosEnTramo(
  boletos: BoletoRow[],
  secuenciaParadas: ParadaRuta[],
  ordenOrigenSolicitado: number,
  ordenDestinoSolicitado: number
): number[] {
  if (secuenciaParadas.length === 0) return [];

  const primerOrden = secuenciaParadas[0].orden;
  const ultimoOrden = secuenciaParadas[secuenciaParadas.length - 1].orden;

  const normalize = (txt: string) =>
    txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const mapaOrdenPorId = new Map<string, number>();
  const mapaOrdenPorCiudad = new Map<string, number>();

  for (const p of secuenciaParadas) {
    mapaOrdenPorId.set(p.id, p.orden);
    mapaOrdenPorCiudad.set(normalize(p.ciudad), p.orden);
  }

  // Filtrar boletos activos (ignorar cancelados o rechazados)
  const boletosActivos = boletos.filter((b) => {
    const st = (b.estado || '').toLowerCase();
    return st !== 'cancelado' && st !== 'rechazado';
  });

  const asientosOcupadosSet = new Set<number>();

  for (const boleto of boletosActivos) {
    // Resolver orden de origen del boleto existente
    let ordenOrigenBoleto = primerOrden;
    if (boleto.paradaOrigenId) {
      if (mapaOrdenPorId.has(boleto.paradaOrigenId)) {
        ordenOrigenBoleto = mapaOrdenPorId.get(boleto.paradaOrigenId)!;
      } else if (mapaOrdenPorCiudad.has(normalize(boleto.paradaOrigenId))) {
        ordenOrigenBoleto = mapaOrdenPorCiudad.get(normalize(boleto.paradaOrigenId))!;
      }
    }

    // Resolver orden de destino del boleto existente
    let ordenDestinoBoleto = ultimoOrden;
    if (boleto.paradaDestinoId) {
      if (mapaOrdenPorId.has(boleto.paradaDestinoId)) {
        ordenDestinoBoleto = mapaOrdenPorId.get(boleto.paradaDestinoId)!;
      } else if (mapaOrdenPorCiudad.has(normalize(boleto.paradaDestinoId))) {
        ordenDestinoBoleto = mapaOrdenPorCiudad.get(normalize(boleto.paradaDestinoId))!;
      }
    }

    // Comprobar colisión en el segmento requerido
    const colisiona = asientosColisionanEnTramo(
      ordenOrigenBoleto,
      ordenDestinoBoleto,
      ordenOrigenSolicitado,
      ordenDestinoSolicitado
    );

    if (colisiona) {
      asientosOcupadosSet.add(boleto.asiento);
    }
  }

  return Array.from(asientosOcupadosSet).sort((a, b) => a - b);
}

/**
 * Calcula el desglose detallado de asientos disponibles y ocupados para un tramo dado,
 * considerando la capacidad física total del bus asignado a la ruta.
 */
export function calcularDisponibilidadAsientosTramo(
  capacidadTotal: number,
  boletos: BoletoRow[],
  secuenciaParadas: ParadaRuta[],
  ordenOrigenSolicitado: number,
  ordenDestinoSolicitado: number
): {
  asientosOcupados: number[];
  asientosDisponibles: number[];
  detalleAsientos: DisponibilidadAsientoTramo[];
} {
  const asientosOcupados = filtrarAsientosOcupadosEnTramo(
    boletos,
    secuenciaParadas,
    ordenOrigenSolicitado,
    ordenDestinoSolicitado
  );

  const ocupadosSet = new Set(asientosOcupados);
  const asientosDisponibles: number[] = [];
  const detalleAsientos: DisponibilidadAsientoTramo[] = [];

  for (let num = 1; num <= capacidadTotal; num++) {
    const estaOcupado = ocupadosSet.has(num);
    if (!estaOcupado) {
      asientosDisponibles.push(num);
    }
    detalleAsientos.push({
      asiento: num,
      disponible: !estaOcupado,
      motivoBloqueo: estaOcupado
        ? 'Ocupado por otro pasajero en el segmento seleccionado'
        : undefined,
    });
  }

  return {
    asientosOcupados,
    asientosDisponibles,
    detalleAsientos,
  };
}


