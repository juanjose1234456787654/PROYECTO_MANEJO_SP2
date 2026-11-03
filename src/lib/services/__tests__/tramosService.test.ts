/**
 * ==============================================================================
 * PRUEBAS UNITARIAS: LÓGICA DE NEGOCIO DE PARADAS INTERMEDIAS Y TRAMOS (ISSUE #14)
 * Proyecto: EcuRutas - Universidad Técnica de Ambato
 * ==============================================================================
 * Verifica las invariantes de negocio:
 * 1. Secuencia y ordenamiento topológico de paradas.
 * 2. Validación estricta de orden (origen < destino).
 * 3. Algoritmo de cálculo tarifario proporcional ANT.
 * 4. Detección precisa de colisiones de asientos por tramo (sin falsos bloqueos).
 * ==============================================================================
 */

import {
  construirSecuenciaParadas,
  validarOrdenParadas,
  calcularTarifaProporcional,
  asientosColisionanEnTramo,
  filtrarAsientosOcupadosEnTramo,
  calcularDisponibilidadAsientosTramo,
} from '../tramosService';
import type {
  FrecuenciaRow,
  ParadaFrecuenciaRow,
  BoletoRow,
} from '@/lib/types';

/**
 * Frecuencia máster de prueba: Ambato -> Quito ($5.00 base, ANT-2026-UTA)
 */
const mockFrecuencia: FrecuenciaRow = {
  id: 'frec-test-01',
  cooperativaId: 'coop-001',
  grupoFrecuenciaId: null,
  resolucionANT: 'ANT-2026-UTA-001',
  origen: 'Ambato',
  destino: 'Quito',
  hora: '08:00',
  tipoViaje: 'Interprovincial Ordinario',
  activa: true,
  duracion: '180 min',
  precioBase: 5.0,
  preciosPorTramo: {
    distanciasKm: {
      Ambato: 0,
      Salcedo: 15,
      Latacunga: 38,
      Machachi: 95,
      Quito: 135,
    },
    tarifaMinima: 0.75,
  },
};

/**
 * Paradas intermedias de la frecuencia
 */
const mockParadasIntermedias: ParadaFrecuenciaRow[] = [
  { id: 'parada-1', frecuenciaId: 'frec-test-01', ciudad: 'Salcedo', orden: 1 },
  { id: 'parada-2', frecuenciaId: 'frec-test-01', ciudad: 'Latacunga', orden: 2 },
  { id: 'parada-3', frecuenciaId: 'frec-test-01', ciudad: 'Machachi', orden: 3 },
];

/**
 * Batería de pruebas de verificación
 */
export function ejecutarPruebasTramos(): { exitosas: number; fallidas: number; detalles: string[] } {
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

  // --------------------------------------------------------------------------
  // TEST 1: Construcción de Secuencia Unificada de Paradas
  // --------------------------------------------------------------------------
  const secuencia = construirSecuenciaParadas(mockFrecuencia, mockParadasIntermedias);

  assert(secuencia.length === 5, 'La secuencia unificada debe contener 5 paradas (1 origen + 3 intermedias + 1 destino)');
  assert(secuencia[0].ciudad === 'Ambato' && secuencia[0].tipo === 'origen' && secuencia[0].orden === 0, 'Origen sintético debe ser Ambato con orden 0');
  assert(secuencia[4].ciudad === 'Quito' && secuencia[4].tipo === 'destino' && secuencia[4].orden === 4, 'Destino sintético debe ser Quito con orden 4');
  assert(secuencia[2].ciudad === 'Latacunga' && secuencia[2].orden === 2, 'Latacunga debe conservar orden 2');

  // --------------------------------------------------------------------------
  // TEST 2: Validación de Orden Origen vs Destino (Bloque 2)
  // --------------------------------------------------------------------------
  const valValida = validarOrdenParadas('Ambato', 'Latacunga', secuencia);
  assert(valValida.valido === true && valValida.tramosIntermedios === 2, 'Tramo Ambato -> Latacunga debe ser válido con 2 tramos');

  const valInversa = validarOrdenParadas('Quito', 'Ambato', secuencia);
  assert(valInversa.valido === false, 'Tramo Quito -> Ambato (retroceso) debe ser rechazado');

  const valIguales = validarOrdenParadas('Salcedo', 'Salcedo', secuencia);
  assert(valIguales.valido === false, 'Tramo con mismo origen y destino debe ser rechazado');

  const valInexistente = validarOrdenParadas('Cuenca', 'Quito', secuencia);
  assert(valInexistente.valido === false, 'Parada que no pertenece a la ruta debe ser rechazada');

  // --------------------------------------------------------------------------
  // TEST 3: Algoritmo de Cálculo Proporcional ANT (Bloque 3)
  // --------------------------------------------------------------------------
  const tarifaCompleta = calcularTarifaProporcional(mockFrecuencia, secuencia[0], secuencia[4], secuencia);
  assert(tarifaCompleta.precioCalculadoTramo === 5.0 && tarifaCompleta.porcentajeRecorrido === 100, 'Tarifa ruta completa debe ser $5.00 (100%)');

  // Ambato (0 km) a Latacunga (38 km) de 135 km totales:
  // Proporción = 38 / 135 = 0.28148 => $5.00 * 0.28148 = $1.41
  const tarifaLatacunga = calcularTarifaProporcional(mockFrecuencia, secuencia[0], secuencia[2], secuencia);
  assert(tarifaLatacunga.precioCalculadoTramo === 1.41, `Tarifa proporcional Ambato -> Latacunga debe ser $1.41 (obtenido: ${tarifaLatacunga.precioCalculadoTramo})`);
  assert(tarifaLatacunga.metodoCalculo === 'proporcional_distancia', 'Debe usar método proporcional_distancia si existen distancias en la matriz');

  // Frecuencia sin distancias (método topológico por orden):
  const frecSinKm: FrecuenciaRow = { ...mockFrecuencia, preciosPorTramo: null };
  const tarifaTopologica = calcularTarifaProporcional(frecSinKm, secuencia[0], secuencia[2], secuencia);
  // 2 tramos de 4 totales = 50% => $5.00 * 0.5 = $2.50
  assert(tarifaTopologica.precioCalculadoTramo === 2.5 && tarifaTopologica.metodoCalculo === 'proporcional_orden', 'Tarifa por escalas debe ser $2.50 (50%)');

  // --------------------------------------------------------------------------
  // TEST 4: Verificación de Colisión de Asientos por Tramo (Bloque 4)
  // --------------------------------------------------------------------------
  // Boleto existente: Pasajero viaja en asiento 12 desde Ambato (orden 0) hasta Latacunga (orden 2)
  // ¿Colisiona si otro pasajero quiere el asiento 12 desde Latacunga (orden 2) hasta Quito (orden 4)?
  const colisionConsecutiva = asientosColisionanEnTramo(0, 2, 2, 4);
  assert(colisionConsecutiva === false, 'Pasajero en [0, 2] NO debe colisionar con pasajero en [2, 4] (reutilización de asiento)');

  // ¿Colisiona si otro pasajero quiere el asiento 12 desde Salcedo (orden 1) hasta Machachi (orden 3)?
  const colisionTraslape = asientosColisionanEnTramo(0, 2, 1, 3);
  assert(colisionTraslape === true, 'Pasajero en [0, 2] DEBE colisionar con solicitud en [1, 3]');

  // --------------------------------------------------------------------------
  // TEST 5: Filtrado de Asientos en Lista de Boletos (Bloque 4 & 5)
  // --------------------------------------------------------------------------
  const mockBoletos: BoletoRow[] = [
    // Asiento 1: Viaja solo Ambato -> Salcedo (orden 0 a 1)
    {
      id: 'bol-01',
      rutaId: 'ruta-01',
      pasajeroId: null,
      asiento: 1,
      precio: 1.0,
      descuento: 0,
      tipoPasajero: 'general',
      metodoPago: 'tarjeta',
      comprobanteUrl: null,
      estado: 'pagado',
      vendidoPor: 'online',
      vendidoPorChoferId: null,
      paradaOrigenId: 'terminal-origen-frec-test-01',
      paradaDestinoId: 'parada-1',
      pasajeroNombre: 'Juan Pérez',
      pasajeroCedula: '1800000001',
      codigoQr: 'QR-01',
      abordadoAt: null,
    },
    // Asiento 2: Viaja ruta completa (orden 0 a 4)
    {
      id: 'bol-02',
      rutaId: 'ruta-01',
      pasajeroId: null,
      asiento: 2,
      precio: 5.0,
      descuento: 0,
      tipoPasajero: 'general',
      metodoPago: 'efectivo',
      comprobanteUrl: null,
      estado: 'pagado',
      vendidoPor: 'taquilla',
      vendidoPorChoferId: null,
      paradaOrigenId: null,
      paradaDestinoId: null,
      pasajeroNombre: 'Ana Gómez',
      pasajeroCedula: '1800000002',
      codigoQr: 'QR-02',
      abordadoAt: null,
    },
    // Asiento 3: Boleto cancelado (no debe ocupar)
    {
      id: 'bol-03',
      rutaId: 'ruta-01',
      pasajeroId: null,
      asiento: 3,
      precio: 5.0,
      descuento: 0,
      tipoPasajero: 'general',
      metodoPago: 'tarjeta',
      comprobanteUrl: null,
      estado: 'cancelado',
      vendidoPor: 'online',
      vendidoPorChoferId: null,
      paradaOrigenId: null,
      paradaDestinoId: null,
      pasajeroNombre: 'Carlos Cancelado',
      pasajeroCedula: '1800000003',
      codigoQr: 'QR-03',
      abordadoAt: null,
    },
  ];

  // Solicitud: Pasajero pide viajar de Latacunga (orden 2) a Quito (orden 4)
  // El asiento 1 quedó libre en Salcedo (orden 1), por lo que NO debe estar ocupado en Latacunga -> Quito.
  // El asiento 2 está ocupado toda la ruta.
  // El asiento 3 fue cancelado.
  const ocupadosEnTramo = filtrarAsientosOcupadosEnTramo(mockBoletos, secuencia, 2, 4);
  assert(ocupadosEnTramo.includes(2), 'Asiento 2 debe estar ocupado en Latacunga -> Quito');
  assert(!ocupadosEnTramo.includes(1), 'Asiento 1 debe estar LIBRE en Latacunga -> Quito');
  assert(!ocupadosEnTramo.includes(3), 'Asiento 3 cancelado debe estar LIBRE');

  const dispBus = calcularDisponibilidadAsientosTramo(40, mockBoletos, secuencia, 2, 4);
  assert(dispBus.asientosDisponibles.includes(1), 'Disponibilidad debe incluir asiento 1 para Latacunga -> Quito');
  assert(!dispBus.asientosDisponibles.includes(2), 'Disponibilidad NO debe incluir asiento 2');

  return { exitosas, fallidas, detalles };
}

