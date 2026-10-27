/**
 * Módulo: frecuencias
 * Responsable: Andrés Toasa (@The-Fabry)
 * Alcance: Itinerarios de viaje, resolución ANT, horarios, paradas intermedias y tarifas por tramo.
 */

import { dataService } from '@/lib/services/dataService';
import type { FrecuenciaRow, ParadaFrecuenciaRow } from '@/lib/data/mockData';

export interface FrecuenciasModuleConfig {
  name: 'frecuencias';
  version: '1.0.0';
  status: 'active';
  responsable: 'Andrés Toasa';
}

export const frecuenciasModuleConfig: FrecuenciasModuleConfig = {
  name: 'frecuencias',
  version: '1.0.0',
  status: 'active',
  responsable: 'Andrés Toasa',
};

export async function buscarFrecuenciasDisponibles(origen?: string, destino?: string): Promise<FrecuenciaRow[]> {
  return await dataService.getFrecuencias({ origen, destino });
}

export async function obtenerParadasDeFrecuencia(frecuenciaId: string): Promise<ParadaFrecuenciaRow[]> {
  return await dataService.getParadas(frecuenciaId);
}
