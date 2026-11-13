/**
 * ==============================================================================
 * PRUEBAS UNITARIAS: GESTIÓN DE HOJAS DE RUTA Y DÍAS DE PARADA ANT (ACTIVIDAD 3)
 * Proyecto: EcuRutas - Universidad Técnica de Ambato
 * ==============================================================================
 * Marco de Pruebas:
 * 1. Diagnóstico de balance de flota y requerimiento de días de parada.
 * 2. Cálculo exacto de flota excedente (N - M) según resolución ANT.
 * 3. Rotación determinista, cíclica y equitativa de unidades en descanso obligatorio.
 * 4. Exclusión estricta de unidades en descanso de las asignaciones operativas.
 * 5. Generación íntegra de la Hoja de Trabajo y Despacho Diario.
 * 6. Detección y prevención de infracciones operativas (conflicto bus en parada).
 * ==============================================================================
 */

import {
  calcularControlFlota,
  determinarBusesEnParada,
  asignarFlotaDiariaYParadas,
  generarHojaRutaDiaria,
  obtenerEstadoBusEnFecha,
  verificarConflictoBusEnParada,
  obtenerIndiceDiaEpoch,
  validarDeficitGrupo,
  generarHojaRutaPorGrupo,
  reemplazarBusEnHojaRuta,
  editarDetallesAsignacionHojaRuta,
} from '../hojasRutaService';
import type { BusRow, FrecuenciaRow, UsuarioRow } from '@/lib/types';

export function ejecutarPruebasHojasRuta(): {
  exitosas: number;
  fallidas: number;
  detalles: string[];
} {
  let exitosas = 0;
  let fallidas = 0;
  const detalles: string[] = [];

  function assert(condicion: boolean, descripcion: string) {
    if (condicion) {
      exitosas++;
      detalles.push(`✔ [PASS] ${descripcion}`);
    } else {
      fallidas++;
      detalles.push(`✖ [FAIL] ${descripcion}`);
    }
  }

  // Mocks de prueba
  const cooperativaId = 'coop-ambato-01';
  const fechaPrueba1 = '2026-11-01';
  const fechaPrueba2 = '2026-11-02';

  const mockBuses10: BusRow[] = Array.from({ length: 10 }, (_, i) => ({
    id: `bus-${i + 1}`,
    cooperativaId,
    grupoBusId: null,
    numero: (i + 1) * 10, // 10, 20, 30, ... 100
    placa: `TAA-0${i + 1}0`,
    chasis: null,
    carroceria: null,
    marca: 'Mercedes-Benz',
    fotoUrl: null,
    capacidad: 40,
    asientosVIP: 4,
    asientosVIPNumeros: [1, 2, 3, 4],
    diasParada: null,
    activo: true,
  }));

  const mockFrecuencias7: FrecuenciaRow[] = Array.from({ length: 7 }, (_, i) => ({
    id: `frec-${i + 1}`,
    cooperativaId,
    grupoFrecuenciaId: null,
    resolucionANT: 'ANT-2026-RES-089',
    origen: 'Ambato',
    destino: 'Quito',
    hora: `${8 + i}:00`,
    tipoViaje: 'DIRECTO',
    activa: true,
    duracion: '02:30',
    precioBase: 4.5,
    preciosPorTramo: null,
  }));

  const mockChoferes: UsuarioRow[] = [
    {
      id: 'usr-ch-1',
      cooperativaId,
      nombre: 'Carlos Perez',
      email: 'carlos@coop.com',
      cedula: '1804567897',
      rol: 'chofer',
      activo: true,
    },
    {
      id: 'usr-ch-2',
      cooperativaId,
      nombre: 'Manuel Freire',
      email: 'manuel@coop.com',
      cedula: '1710034065',
      rol: 'chofer',
      activo: true,
    },
  ];

  // --------------------------------------------------------------------------
  // TEST 1: Control de Flota ANT con Exceso de Unidades (10 buses vs 7 frecuencias)
  // --------------------------------------------------------------------------
  const controlExceso = calcularControlFlota(cooperativaId, mockBuses10, mockFrecuencias7, fechaPrueba1);
  assert(controlExceso.totalBusesActivos === 10, 'Total buses activos contabilizados correctamente (10)');
  assert(controlExceso.totalFrecuenciasActivas === 7, 'Total frecuencias activas autorizadas (7)');
  assert(controlExceso.excesoFlota === 3, 'Exceso de flota calculado exactamente en 3 unidades sobrantes');
  assert(controlExceso.requiereDiasParada === true, 'Bandera requiereDiasParada activada ante exceso');
  assert(controlExceso.porcentajeFlotaEnOperacion === 70, 'Porcentaje de flota en operación calculado al 70.0%');
  assert(controlExceso.resolucionANTReferencial === 'ANT-2026-RES-089', 'Mantiene la resolución ANT de la operadora');

  // --------------------------------------------------------------------------
  // TEST 2: Flota Balanceada y Flota Deficitaria (Sin Exceso)
  // --------------------------------------------------------------------------
  const controlBalanceado = calcularControlFlota(
    cooperativaId,
    mockBuses10.slice(0, 7),
    mockFrecuencias7,
    fechaPrueba1
  );
  assert(controlBalanceado.excesoFlota === 0, 'Flota balanceada (7 buses = 7 frecuencias) tiene exceso 0');
  assert(controlBalanceado.requiereDiasParada === false, 'Flota balanceada no requiere días de parada');
  assert(controlBalanceado.porcentajeFlotaEnOperacion === 100, 'Flota balanceada opera al 100% de capacidad');

  const controlDeficitario = calcularControlFlota(
    cooperativaId,
    mockBuses10.slice(0, 5),
    mockFrecuencias7,
    fechaPrueba1
  );
  assert(controlDeficitario.excesoFlota === 0, 'Flota menor a frecuencias no genera exceso negativo');
  assert(controlDeficitario.requiereDiasParada === false, 'Flota deficitaria no requiere días de parada');

  // --------------------------------------------------------------------------
  // TEST 3: Algoritmo de Rotación Equitativa de Días de Parada (determinismo y cambio diario)
  // --------------------------------------------------------------------------
  const rotacionDia1 = determinarBusesEnParada(mockBuses10, 7, fechaPrueba1, cooperativaId);
  const rotacionDia2 = determinarBusesEnParada(mockBuses10, 7, fechaPrueba2, cooperativaId);

  assert(rotacionDia1.busesEnParada.length === 3, 'Día 1: Exactamente 3 buses asignados a parada obligatoria');
  assert(rotacionDia1.busesHabilitados.length === 7, 'Día 1: Exactamente 7 buses habilitados para despachar');

  assert(rotacionDia2.busesEnParada.length === 3, 'Día 2: Exactamente 3 buses asignados a parada obligatoria');
  assert(rotacionDia2.busesHabilitados.length === 7, 'Día 2: Exactamente 7 buses habilitados');

  // Comprobar que los buses en parada en Día 1 son diferentes a Día 2 (rotación activa)
  const idsParadaDia1 = new Set(rotacionDia1.busesEnParada.map((b) => b.busId));
  const idsParadaDia2 = new Set(rotacionDia2.busesEnParada.map((b) => b.busId));
  const sonIdenticos = [...idsParadaDia1].every((id) => idsParadaDia2.has(id));
  assert(!sonIdenticos, 'Rotación equitativa: La lista de buses en parada rota entre días consecutivos');

  // --------------------------------------------------------------------------
  // TEST 4: Generación de Hoja de Ruta Diaria y No-Asignación de Unidades en Parada
  // --------------------------------------------------------------------------
  const hojaRuta = generarHojaRutaDiaria(
    cooperativaId,
    fechaPrueba1,
    mockBuses10,
    mockFrecuencias7,
    mockChoferes
  );

  assert(hojaRuta.id === `hr-${cooperativaId}-${fechaPrueba1}`, 'ID de Hoja de Ruta canónico y correlativo');
  assert(hojaRuta.asignaciones.length === 7, 'Se generaron asignaciones para las 7 frecuencias del día');
  assert(hojaRuta.busesEnParada.length === 3, 'Se listaron los 3 buses en descanso preventivo obligatorio');

  // Verificar que NINGÚN bus asignado a una frecuencia esté en la lista de descanso preventivo
  const busesProgramados = hojaRuta.asignaciones.map((a) => a.busId);
  const conflictoDetectado = busesProgramados.some((busId) => idsParadaDia1.has(busId));
  assert(!conflictoDetectado, 'Regla ANT cumplida: Ningún bus en Día de Parada fue asignado a frecuencias');

  // --------------------------------------------------------------------------
  // TEST 5: Consulta de Estado de Bus y Validación de Conflictos ANT
  // --------------------------------------------------------------------------
  const primerBusEnParada = rotacionDia1.busesEnParada[0];
  const estadoParada = obtenerEstadoBusEnFecha(primerBusEnParada.busId, hojaRuta);
  assert(estadoParada.estado === 'en_parada', 'Estado del bus en descanso reporta "en_parada"');
  assert(estadoParada.detalleParada?.motivo === 'exceso_flota', 'Motivo de parada registrado como "exceso_flota"');

  const primerBusHabilitado = rotacionDia1.busesHabilitados[0];
  const estadoHabilitado = obtenerEstadoBusEnFecha(primerBusHabilitado.id, hojaRuta);
  assert(estadoHabilitado.estado === 'operando', 'Estado de bus en servicio reporta "operando"');
  assert(estadoHabilitado.turnosAsignados.length > 0, 'El bus operativo registra turnos asignados');

  // Conflicto: verificar que la unidad en parada no tenga conflicto en la hoja válida
  const checkValido = verificarConflictoBusEnParada(primerBusEnParada.busId, hojaRuta);
  assert(checkValido.hayConflicto === false, 'Verificación ANT: Unidad en parada sin turnos asignados (conforme)');

  // Simular infracción: Crear una hoja adulterada donde un bus en descanso recibe un turno
  const hojaAdulterada = {
    ...hojaRuta,
    asignaciones: [
      ...hojaRuta.asignaciones,
      {
        frecuenciaId: 'frec-extra',
        origen: 'Ambato',
        destino: 'Guayaquil',
        hora: '19:00',
        resolucionANT: 'ANT-2026-RES-089',
        busId: primerBusEnParada.busId,
        numeroBus: primerBusEnParada.numeroBus,
        placa: primerBusEnParada.placa,
        capacidad: 40,
        choferId: null,
        nombreChofer: 'Por Asignar',
        estadoRuta: 'programada' as const,
        duracionEstimada: '04:00',
      },
    ],
  };

  const checkConflicto = verificarConflictoBusEnParada(primerBusEnParada.busId, hojaAdulterada);
  assert(checkConflicto.hayConflicto === true, 'Verificación ANT: Detecta infracción si bus en parada es asignado');
  assert(checkConflicto.mensaje.includes('ALERTA ANT'), 'Mensaje de alerta ANT describe infracción reglamentaria');

  // --------------------------------------------------------------------------
  // TEST 6: Consistencia del cálculo de época en fechas
  // --------------------------------------------------------------------------
  const epoch1 = obtenerIndiceDiaEpoch('2026-11-01');
  const epoch2 = obtenerIndiceDiaEpoch('2026-11-02');
  assert(epoch2 === epoch1 + 1, 'Índice de día Epoch es correlativo (+1 en días consecutivos)');

  // --------------------------------------------------------------------------
  // TEST 7 (ECU-1): Validación de déficit por grupo (3 frec + 4 buses -> bloquea)
  // --------------------------------------------------------------------------
  const grupoBuses5 = mockBuses10.slice(0, 5);
  const grupoFrecuencias3 = mockFrecuencias7.slice(0, 3);
  const coopBuses4 = grupoBuses5.slice(0, 4);
  const resDeficit = generarHojaRutaPorGrupo({
    grupoId: 'grp-1',
    grupoNombre: 'Grupo Interprovinciales',
    cooperativaId,
    fechaInicio: '2026-11-15',
    dias: 5,
    buses: coopBuses4,
    frecuencias: grupoFrecuencias3,
  });
  assert(resDeficit.validacion.valido === false, 'Grupo con 3 frec y 4 buses falla validación (requiere 5)');
  assert(resDeficit.validacion.deficit === 1, 'Déficit calculado es exactamente 1 bus');
  assert(resDeficit.hoja === null, 'Generación bloqueada cuando hay déficit de buses');

  // --------------------------------------------------------------------------
  // TEST 8 (ECU-1): Rotación válida (3 frec + 5 buses -> >= 2 días de parada)
  // --------------------------------------------------------------------------
  const resValido = generarHojaRutaPorGrupo({
    grupoId: 'grp-1',
    grupoNombre: 'Grupo Interprovinciales',
    cooperativaId,
    fechaInicio: '2026-11-15',
    dias: 5,
    buses: grupoBuses5,
    frecuencias: grupoFrecuencias3,
  });
  assert(resValido.validacion.valido === true, 'Grupo con 3 frec y 5 buses es válido');
  assert(resValido.hoja !== null, 'Se genera hoja de ruta en estado BORRADOR');
  assert(resValido.hoja?.estado === 'BORRADOR', 'Estado inicial es BORRADOR');
  assert(resValido.hoja?.dias.length === 5, 'Genera los 5 días del ciclo');

  const conteoParadaPorBus = new Map<string, number>();
  for (const dia of resValido.hoja?.dias ?? []) {
    for (const p of dia.busesEnParada) {
      conteoParadaPorBus.set(p.busId, (conteoParadaPorBus.get(p.busId) ?? 0) + 1);
    }
  }
  const todosDescansanAlMenos2Dias = grupoBuses5.every(
    (b) => (conteoParadaPorBus.get(b.id) ?? 0) >= 2
  );
  assert(
    todosDescansanAlMenos2Dias,
    'Cada bus del ciclo de 5 días descansa al menos 2 días en parada'
  );

  // --------------------------------------------------------------------------
  // TEST 9 (ECU-1): Bus deshabilitado no entra en rotación
  // --------------------------------------------------------------------------
  const busesConInhabilitado: BusRow[] = [
    ...grupoBuses5.slice(0, 4),
    { ...grupoBuses5[4], activo: false },
  ];
  const valInhab = validarDeficitGrupo(busesConInhabilitado, grupoFrecuencias3);
  assert(
    valInhab.valido === false && valInhab.totalBusesHabilitados === 4,
    'Bus deshabilitado (activo=false) se excluye del conteo de flota habilitada'
  );

  // --------------------------------------------------------------------------
  // TEST 10 (ECU-1): Reemplazo manual vía ComboBox en estado BORRADOR
  // --------------------------------------------------------------------------
  if (resValido.hoja) {
    const dia0 = resValido.hoja.dias[0];
    const busEnParada = grupoBuses5.find((b) => b.id === dia0.busesEnParada[0].busId)!;
    const frecObjetivo = dia0.asignaciones[0].frecuenciaId;
    const busOriginalId = dia0.asignaciones[0].busId;

    const hojaEditada = reemplazarBusEnHojaRuta(
      resValido.hoja,
      dia0.fecha,
      frecObjetivo,
      busEnParada,
      grupoBuses5
    );

    const dia0Editado = hojaEditada.dias[0];
    assert(
      dia0Editado.asignaciones[0].busId === busEnParada.id,
      'Reemplazo manual asigna el nuevo bus desde el ComboBox'
    );
    assert(
      dia0Editado.asignaciones[0].editadoManual === true,
      'Marca la fila como editada manualmente'
    );
    assert(
      dia0Editado.busesEnParada.some((p) => p.busId === busOriginalId),
      'El bus reemplazado pasa automáticamente a la lista de parada del día'
    );

    // ------------------------------------------------------------------------
    // TEST 11 (ECU-1): Edición de lugares, hora y fecha en BORRADOR
    // ------------------------------------------------------------------------
    const hojaDetalles = editarDetallesAsignacionHojaRuta(
      hojaEditada,
      dia0.fecha,
      frecObjetivo,
      {
        origen: 'Riobamba',
        destino: 'Cuenca',
        hora: '09:30',
        fecha: '2026-11-20',
      }
    );
    const asigDetalle = hojaDetalles.dias[0].asignaciones[0];
    assert(
      asigDetalle.origen === 'Riobamba' &&
        asigDetalle.destino === 'Cuenca' &&
        asigDetalle.hora === '09:30' &&
        asigDetalle.fecha === '2026-11-20',
      'Permite modificar origen, destino, hora y fecha en BORRADOR'
    );
  }

  return { exitosas, fallidas, detalles };
}
