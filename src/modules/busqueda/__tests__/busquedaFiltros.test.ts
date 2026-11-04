/**
 * Pruebas Unitarias Automatizadas: Filtros Avanzados en el Buscador (Issue #17)
 * Responsable: Celeste Telenchana (@CelesteTelenchanaa)
 * Criterios evaluados:
 * 1. Panel lateral y filtros combinados (Cooperativa, Asiento VIP/Normal, Chasis/Carrocería, Tipo de Viaje).
 * 2. Estado vacío cuando ningún registro cumple la combinación.
 * 3. Limpieza de filtros y retorno de todos los resultados.
 */

import {
  filtrarFrecuenciasAvanzado,
  contarFiltrosActivos,
  obtenerMarcasYCarroceriasDisponibles,
} from '../index';
import type { FrecuenciaRow, BusRow, ParadaFrecuenciaRow } from '@/lib/types';

export function ejecutarPruebasFiltrosBusqueda(): { exitosas: number; fallidas: number; detalles: string[] } {
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

  // Fixtures de prueba estandarizados
  const mockBuses: BusRow[] = [
    {
      id: 'bus-001',
      cooperativaId: 'coop-banos',
      grupoBusId: null,
      numero: 14,
      placa: 'TAA-1420',
      chasis: 'Hino AK8JRSA',
      carroceria: 'Varycca Doble Piso',
      marca: 'Hino',
      fotoUrl: null,
      capacidad: 40,
      asientosVIP: 8,
      asientosVIPNumeros: [1, 2, 3, 4, 5, 6, 7, 8],
      diasParada: [1],
      activo: true,
    },
    {
      id: 'bus-002',
      cooperativaId: 'coop-pelileo',
      grupoBusId: null,
      numero: 5,
      placa: 'TBA-1005',
      chasis: 'Scania K360',
      carroceria: 'Carrocerías Picosa',
      marca: 'Scania',
      capacidad: 36,
      asientosVIP: 0,
      asientosVIPNumeros: [],
      diasParada: [2],
      fotoUrl: null,
      activo: true,
    },
    {
      id: 'bus-003',
      cooperativaId: 'coop-cita',
      grupoBusId: null,
      numero: 42,
      placa: 'TBA-4299',
      chasis: 'Mercedes-Benz OF-1721',
      carroceria: 'Marcopolo Paradiso G7',
      marca: 'Mercedes-Benz',
      capacidad: 42,
      asientosVIP: 10,
      asientosVIPNumeros: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      diasParada: [4],
      fotoUrl: null,
      activo: true,
    },
  ];

  const mockFrecuencias: FrecuenciaRow[] = [
    {
      id: 'frec-01',
      cooperativaId: 'coop-banos',
      grupoFrecuenciaId: null,
      resolucionANT: 'ANT-2024-EXP-001',
      origen: 'Ambato',
      destino: 'Quito',
      hora: '06:00',
      tipoViaje: 'Directo',
      activa: true,
      duracion: '2h 30m',
      precioBase: 5.0,
      preciosPorTramo: null,
    },
    {
      id: 'frec-02',
      cooperativaId: 'coop-banos',
      grupoFrecuenciaId: null,
      resolucionANT: 'ANT-2024-EXP-002',
      origen: 'Ambato',
      destino: 'Quito',
      hora: '08:30',
      tipoViaje: 'Con paradas intermedias',
      activa: true,
      duracion: '3h 15m',
      precioBase: 5.0,
      preciosPorTramo: null,
    },
    {
      id: 'frec-03',
      cooperativaId: 'coop-pelileo',
      grupoFrecuenciaId: null,
      resolucionANT: 'ANT-2024-EXP-003',
      origen: 'Pelileo',
      destino: 'Baños',
      hora: '10:00',
      tipoViaje: 'Directo',
      activa: true,
      duracion: '45m',
      precioBase: 2.5,
      preciosPorTramo: null,
    },
    {
      id: 'frec-04',
      cooperativaId: 'coop-cita',
      grupoFrecuenciaId: null,
      resolucionANT: 'ANT-2024-EXP-004',
      origen: 'Ambato',
      destino: 'Guayaquil',
      hora: '09:00',
      tipoViaje: 'Con paradas intermedias',
      activa: true,
      duracion: '6h 00m',
      precioBase: 10.0,
      preciosPorTramo: null,
    },
  ];

  const mockParadas: ParadaFrecuenciaRow[] = [
    { id: 'p1', frecuenciaId: 'frec-02', ciudad: 'Salcedo', orden: 1 },
    { id: 'p2', frecuenciaId: 'frec-02', ciudad: 'Latacunga', orden: 2 },
    { id: 'p3', frecuenciaId: 'frec-04', ciudad: 'Riobamba', orden: 1 },
    { id: 'p4', frecuenciaId: 'frec-04', ciudad: 'Pallatanga', orden: 2 },
  ];

  // 1. Prueba de extracción de marcas y carrocerías
  const marcas = obtenerMarcasYCarroceriasDisponibles(mockBuses);
  assert(marcas.includes('Hino'), 'Debe incluir Hino en la lista de marcas disponibles');
  assert(marcas.includes('Mercedes-Benz'), 'Debe incluir Mercedes-Benz en la lista de marcas');
  assert(marcas.includes('Scania'), 'Debe incluir Scania en la lista de marcas');
  assert(marcas.includes('Marcopolo Paradiso G7') || marcas.includes('Marcopolo'), 'Debe incluir carrocería Marcopolo');

  // 2. Filtro 1: Cooperativa
  const resCoop = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    cooperativaId: 'coop-banos',
  });
  assert(resCoop.length === 2, 'Filtrar por cooperativa Baños debe retornar 2 frecuencias');
  assert(resCoop.every((f) => f.cooperativaId === 'coop-banos'), 'Todas las frecuencias deben pertenecer a coop-banos');

  // 3. Filtro 2: Tipo de Asiento VIP
  const resVip = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    tipoAsiento: 'vip',
  });
  assert(
    resVip.some((f) => f.cooperativaId === 'coop-banos') &&
    resVip.some((f) => f.cooperativaId === 'coop-cita'),
    'Filtro VIP debe incluir frecuencias de Baños y CITA Express (con asientos VIP)'
  );
  assert(
    !resVip.some((f) => f.cooperativaId === 'coop-pelileo'),
    'Filtro VIP NO debe incluir cooperativa Pelileo (bus sin asientos VIP)'
  );

  // 4. Filtro 2: Tipo de Asiento Normal
  const resNormal = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    tipoAsiento: 'normal',
  });
  assert(resNormal.length === 4, 'Todas las frecuencias ofrecen asientos normales en flota');

  // 5. Filtro 3: Chasis / Carrocería (Hino)
  const resHino = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    chasisCarroceria: 'Hino',
  });
  assert(resHino.length === 2, 'Filtro por chasis Hino debe retornar 2 frecuencias de Baños');
  assert(resHino.every((f) => f.cooperativaId === 'coop-banos'), 'Solo cooperativas con bus Hino deben coincidir');

  // 6. Filtro 3: Carrocería específica (Marcopolo)
  const resMarcopolo = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    chasisCarroceria: 'Marcopolo',
  });
  assert(resMarcopolo.length === 1 && resMarcopolo[0].id === 'frec-04', 'Filtro Marcopolo debe retornar frec-04 de CITA');

  // 7. Filtro 4: Tipo de Viaje (Directo)
  const resDirecto = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    tipoViaje: 'directo',
  });
  assert(resDirecto.length === 2, 'Filtro viaje Directo debe retornar exactamente 2 frecuencias directas');
  assert(resDirecto.map((f) => f.id).sort().join(',') === 'frec-01,frec-03', 'Las frecuencias directas son frec-01 y frec-03');

  // 8. Filtro 4: Tipo de Viaje (Con paradas intermedias)
  const resParadas = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    tipoViaje: 'con_paradas',
  });
  assert(resParadas.length === 2, 'Filtro con paradas intermedias debe retornar 2 frecuencias con paradas');
  assert(resParadas.map((f) => f.id).sort().join(',') === 'frec-02,frec-04', 'Las frecuencias con escalas son frec-02 y frec-04');

  // 9. Combinación de los 4 Filtros Avanzados simultáneos
  const resCombinado = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    cooperativaId: 'coop-banos',
    tipoAsiento: 'vip',
    chasisCarroceria: 'Hino',
    tipoViaje: 'directo',
  });
  assert(resCombinado.length === 1 && resCombinado[0].id === 'frec-01', 'Combinación de 4 filtros debe retornar unívocamente frec-01');

  // 10. Estado Vacío: Combinación imposible de filtros
  const resVacio = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    cooperativaId: 'coop-pelileo',
    tipoAsiento: 'vip', // Pelileo no tiene VIP
  });
  assert(resVacio.length === 0, 'Combinación sin coincidencia debe retornar array vacío (Estado Vacío)');

  // 11. Limpieza total de filtros (todos los filtros limpios)
  const resTodos = filtrarFrecuenciasAvanzado(mockFrecuencias, mockBuses, mockParadas, {
    cooperativaId: '',
    tipoAsiento: 'todos',
    chasisCarroceria: '',
    tipoViaje: 'todos',
  });
  assert(resTodos.length === 4, 'Al limpiar filtros se deben retornar todas las 4 frecuencias');

  // 12. Contador de filtros activos
  const conteo = contarFiltrosActivos({
    cooperativaId: 'coop-banos',
    tipoAsiento: 'vip',
    chasisCarroceria: 'Hino',
    tipoViaje: 'todos',
    origen: '',
  });
  assert(conteo === 3, `Debe contar exactamente 3 filtros activos (obtenido: ${conteo})`);

  return { exitosas, fallidas, detalles };
}
