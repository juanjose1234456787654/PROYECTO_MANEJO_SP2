/**
 * Módulo: busqueda
 * Responsable: Celeste Telenchana (@CelesteTelenchanaa) / Andrés Toasa (@The-Fabry)
 * Alcance: Catálogo público, filtros avanzados combinados por:
 * 1. Cooperativa (<select> desde dataService)
 * 2. Tipo de asiento (Normal / VIP basado en asientosVIP de "Bus")
 * 3. Chasis o carrocería (marcas como Hino, Mercedes-Benz, Yutong, etc. de "Bus")
 * 4. Tipo de viaje (Directo / Con paradas intermedias de "Frecuencia")
 * Sincronización reactiva con searchParams en URL, estado vacío y navegación sin recarga.
 */

import { dataService } from '@/lib/services/dataService';
import type { FrecuenciaRow, RutaRow, BusRow, ParadaFrecuenciaRow } from '@/lib/types';

export interface BusquedaModuleConfig {
  name: 'busqueda';
  version: '2.0.0';
  status: 'active';
  responsable: 'Celeste Telenchana';
  modulo: 'C1 - Filtros avanzados en el buscador (Issue #17)';
}

export const busquedaModuleConfig: BusquedaModuleConfig = {
  name: 'busqueda',
  version: '2.0.0',
  status: 'active',
  responsable: 'Celeste Telenchana',
  modulo: 'C1 - Filtros avanzados en el buscador (Issue #17)',
};

export type TipoAsientoFiltro = 'todos' | 'normal' | 'vip';
export type TipoViajeFiltro = 'todos' | 'directo' | 'con_paradas';

export interface FiltrosBusqueda {
  origen?: string;
  destino?: string;
  cooperativaId?: string;
  fecha?: string;
}

export interface FiltrosBusquedaAvanzados extends FiltrosBusqueda {
  tipoAsiento?: TipoAsientoFiltro;
  chasisCarroceria?: string;
  tipoViaje?: TipoViajeFiltro;
}

/**
 * Extrae marcas, modelos de chasis y carrocerías únicos de los buses registrados.
 */
export function obtenerMarcasYCarroceriasDisponibles(buses: BusRow[]): string[] {
  const marcasSet = new Set<string>();

  // Marcas tradicionales del transporte interprovincial ecuatoriano
  const marcasEcuador = ['Hino', 'Mercedes-Benz', 'Scania', 'Yutong', 'Marcopolo', 'Varycca', 'Cepeda'];
  marcasEcuador.forEach((m) => marcasSet.add(m));

  buses.forEach((b) => {
    if (b.marca?.trim()) marcasSet.add(b.marca.trim());
    if (b.chasis?.trim()) {
      // Agregar nombre general de marca si está contenido en el chasis
      const ch = b.chasis.trim();
      marcasSet.add(ch);
      const primeraPalabra = ch.split(' ')[0];
      if (primeraPalabra && primeraPalabra.length > 2) marcasSet.add(primeraPalabra);
    }
    if (b.carroceria?.trim()) {
      const cr = b.carroceria.trim();
      marcasSet.add(cr);
      const primeraPalabra = cr.split(' ')[0];
      if (primeraPalabra && primeraPalabra.length > 2) marcasSet.add(primeraPalabra);
    }
  });

  return Array.from(marcasSet).sort();
}

/**
 * Determina cuántos filtros avanzados están actualmente activos.
 */
export function contarFiltrosActivos(filtros: FiltrosBusquedaAvanzados): number {
  let count = 0;
  if (filtros.cooperativaId && filtros.cooperativaId.trim() !== '') count++;
  if (filtros.tipoAsiento && filtros.tipoAsiento !== 'todos') count++;
  if (filtros.chasisCarroceria && filtros.chasisCarroceria.trim() !== '') count++;
  if (filtros.tipoViaje && filtros.tipoViaje !== 'todos') count++;
  if (filtros.origen && filtros.origen.trim() !== '') count++;
  if (filtros.destino && filtros.destino.trim() !== '') count++;
  return count;
}

/**
 * Función pura de filtrado avanzado combinable para frecuencias, buses y paradas.
 * Aplica los 4 filtros del Issue #17 más origen/destino con lógica AND estricta:
 * 1. Cooperativa: frec.cooperativaId === cooperativaId
 * 2. Tipo de asiento:
 *    - 'vip': al menos un bus asociado tiene asientos VIP (>0)
 *    - 'normal': al menos un bus asociado ofrece asientos estándar/normales
 * 3. Chasis o carrocería:
 *    - busca coincidencia insensible a mayúsculas en marca, chasis o carrocería de los buses de la cooperativa/frecuencia
 * 4. Tipo de viaje:
 *    - 'directo': frec.tipoViaje incluye 'directo' o no tiene paradas intermedias
 *    - 'con_paradas': frec.tipoViaje incluye 'parada' o registra paradas intermedias
 */
export function filtrarFrecuenciasAvanzado(
  frecuencias: FrecuenciaRow[],
  buses: BusRow[],
  paradas: ParadaFrecuenciaRow[],
  filtros: FiltrosBusquedaAvanzados
): FrecuenciaRow[] {
  return frecuencias.filter((frec) => {
    // 1. Filtro por Cooperativa
    if (filtros.cooperativaId && filtros.cooperativaId.trim() !== '') {
      if (frec.cooperativaId !== filtros.cooperativaId) {
        return false;
      }
    }

    // Obtener paradas intermedias de esta frecuencia
    const paradasFrec = paradas.filter((p) => p.frecuenciaId === frec.id);

    // Obtener buses asociados a la cooperativa de la frecuencia
    const busesAsociados = buses.filter((b) => b.cooperativaId === frec.cooperativaId);

    // 2. Filtro por Tipo de Asiento (Normal / VIP)
    if (filtros.tipoAsiento && filtros.tipoAsiento !== 'todos') {
      if (filtros.tipoAsiento === 'vip') {
        const tieneBusVip = busesAsociados.some(
          (b) =>
            (b.asientosVIP !== null && b.asientosVIP > 0) ||
            (Array.isArray(b.asientosVIPNumeros) && b.asientosVIPNumeros.length > 0)
        );
        if (!tieneBusVip) return false;
      } else if (filtros.tipoAsiento === 'normal') {
        const tieneBusNormal = busesAsociados.some(
          (b) =>
            b.capacidad > (b.asientosVIP ?? 0) ||
            b.asientosVIP === null ||
            b.asientosVIP === 0
        );
        if (!tieneBusNormal && busesAsociados.length > 0) return false;
      }
    }

    // 3. Filtro por Chasis o Carrocería
    if (filtros.chasisCarroceria && filtros.chasisCarroceria.trim() !== '') {
      const termino = filtros.chasisCarroceria.toLowerCase().trim();
      const coincideBus = busesAsociados.some((b) => {
        const ch = (b.chasis || '').toLowerCase();
        const cr = (b.carroceria || '').toLowerCase();
        const mr = (b.marca || '').toLowerCase();
        return ch.includes(termino) || cr.includes(termino) || mr.includes(termino);
      });
      if (!coincideBus) return false;
    }

    // 4. Filtro por Tipo de Viaje (Directo / Con paradas intermedias)
    if (filtros.tipoViaje && filtros.tipoViaje !== 'todos') {
      const tipoViajeTexto = (frec.tipoViaje || '').toLowerCase();
      const esConParadas =
        tipoViajeTexto.includes('parada') ||
        tipoViajeTexto.includes('escala') ||
        paradasFrec.length > 0;
      const esDirecto =
        tipoViajeTexto.includes('directo') || (!tipoViajeTexto.includes('parada') && paradasFrec.length === 0);

      if (filtros.tipoViaje === 'directo' && !esDirecto) {
        return false;
      }
      if (filtros.tipoViaje === 'con_paradas' && !esConParadas) {
        return false;
      }
    }

    // Filtros complementarios de Ciudad de Origen y Destino
    if (filtros.origen && filtros.origen.trim() !== '') {
      const origenTerm = filtros.origen.toLowerCase().trim();
      const ciudadesFrec = [frec.origen, ...paradasFrec.map((p) => p.ciudad), frec.destino].map((c) =>
        c.toLowerCase()
      );
      if (!ciudadesFrec.some((c) => c.includes(origenTerm))) {
        return false;
      }
    }

    if (filtros.destino && filtros.destino.trim() !== '') {
      const destinoTerm = filtros.destino.toLowerCase().trim();
      const ciudadesFrec = [frec.origen, ...paradasFrec.map((p) => p.ciudad), frec.destino].map((c) =>
        c.toLowerCase()
      );
      if (!ciudadesFrec.some((c) => c.includes(destinoTerm))) {
        return false;
      }
    }

    return true;
  });
}

export async function ejecutarBusqueda(filtros: FiltrosBusquedaAvanzados): Promise<{
  frecuencias: FrecuenciaRow[];
  rutas: RutaRow[];
}> {
  const [frecuencias, rutas, buses, paradas] = await Promise.all([
    dataService.getFrecuencias(filtros),
    dataService.getRutas({ fecha: filtros.fecha }),
    dataService.getBuses(),
    dataService.getParadas(),
  ]);

  const filtradas = filtrarFrecuenciasAvanzado(frecuencias, buses, paradas, filtros);
  return { frecuencias: filtradas, rutas };
}
