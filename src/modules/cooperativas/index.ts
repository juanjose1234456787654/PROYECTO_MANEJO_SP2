/**
 * Módulo: cooperativas
 * Responsable: Anahí Morales (@AnahiM2025)
 * Alcance: Administración de razones sociales, RUC, telefonía, líneas de servicio y estado operativo.
 */

import { dataService } from '@/lib/services/dataService';
import type { CooperativaRow } from '@/lib/data/mockData';

export interface CooperativasModuleConfig {
  name: 'cooperativas';
  version: '1.0.0';
  status: 'active';
  responsable: 'Anahí Morales';
}

export const cooperativasModuleConfig: CooperativasModuleConfig = {
  name: 'cooperativas',
  version: '1.0.0',
  status: 'active',
  responsable: 'Anahí Morales',
};

export async function listarCooperativasActivas(): Promise<CooperativaRow[]> {
  const todas = await dataService.getCooperativas();
  return todas.filter((c) => c.activo);
}
