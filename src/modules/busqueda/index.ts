/**
 * Módulo: busqueda
 * Responsable: Andrés Toasa (@The-Fabry)
 * Alcance: Catálogo público, filtros combinados por origen, destino, cooperativa y fecha de viaje.
 */

import { dataService } from '@/lib/services/dataService';
import type { FrecuenciaRow, RutaRow } from '@/lib/data/mockData';

export interface BusquedaModuleConfig {
  name: 'busqueda';
  version: '1.0.0';
  status: 'active';
  responsable: 'Andrés Toasa';
}

export const busquedaModuleConfig: BusquedaModuleConfig = {
  name: 'busqueda',
  version: '1.0.0',
  status: 'active',
  responsable: 'Andrés Toasa',
};

export interface FiltrosBusqueda {
  origen?: string;
  destino?: string;
  cooperativaId?: string;
  fecha?: string;
}

export async function ejecutarBusqueda(filtros: FiltrosBusqueda): Promise<{
  frecuencias: FrecuenciaRow[];
  rutas: RutaRow[];
}> {
  const [frecuencias, rutas] = await Promise.all([
    dataService.getFrecuencias(filtros),
    dataService.getRutas({ fecha: filtros.fecha }),
  ]);
  return { frecuencias, rutas };
}
