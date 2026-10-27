/**
 * Módulo: configuracion
 * Responsable: Juan Carvajal (@juanjose1234456787654)
 * Alcance: Parámetros del sistema, logotipo, canales de contacto y datos institucionales.
 */

import { dataService } from '@/lib/services/dataService';
import type { ConfiguracionAppRow } from '@/lib/data/mockData';

export interface ConfiguracionModuleConfig {
  name: 'configuracion';
  version: '1.0.0';
  status: 'active';
  responsable: 'Juan Carvajal';
}

export const configuracionModuleConfig: ConfiguracionModuleConfig = {
  name: 'configuracion',
  version: '1.0.0',
  status: 'active',
  responsable: 'Juan Carvajal',
};

export async function obtenerConfiguracionInstitucional(): Promise<ConfiguracionAppRow> {
  return await dataService.getConfig();
}

export async function actualizarConfiguracionInstitucional(
  cambios: Partial<ConfiguracionAppRow>
): Promise<ConfiguracionAppRow> {
  return await dataService.updateConfig(cambios);
}
