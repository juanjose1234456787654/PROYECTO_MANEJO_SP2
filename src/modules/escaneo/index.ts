/**
 * Módulo: escaneo
 * Responsable: Celeste Telenchana (@CelesteTelenchanaa)
 * Alcance: Lectura de códigos QR con cámara o pistola láser, verificación de vigencia y control de abordaje en ruta.
 */

import { dataService } from '@/lib/services/dataService';
import type { BoletoRow } from '@/lib/data/mockData';

export interface EscaneoModuleConfig {
  name: 'escaneo';
  version: '1.0.0';
  status: 'active';
  responsable: 'Celeste Telenchana';
}

export const escaneoModuleConfig: EscaneoModuleConfig = {
  name: 'escaneo',
  version: '1.0.0',
  status: 'active',
  responsable: 'Celeste Telenchana',
};

export async function validarBoletoAbordaje(codigoQR: string): Promise<{
  exito: boolean;
  mensaje: string;
  boleto?: BoletoRow;
}> {
  return await dataService.validarBoletoQR(codigoQR);
}
