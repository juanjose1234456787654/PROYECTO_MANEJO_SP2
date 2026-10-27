/**
 * Módulo: pagos
 * Responsable: Juan Carvajal (@juanjose1234456787654)
 * Alcance: Validación de transacciones electrónicas, depósitos y comprobantes de transferencia.
 */

import { dataService } from '@/lib/services/dataService';
import type { BoletoRow } from '@/lib/data/mockData';

export interface PagosModuleConfig {
  name: 'pagos';
  version: '1.0.0';
  status: 'active';
  responsable: 'Juan Carvajal';
}

export const pagosModuleConfig: PagosModuleConfig = {
  name: 'pagos',
  version: '1.0.0',
  status: 'active',
  responsable: 'Juan Carvajal',
};

export async function listarPagosPendientes(): Promise<BoletoRow[]> {
  const boletos = await dataService.getBoletos();
  return boletos.filter((b) => b.metodoPago === 'transferencia' && b.estado === 'emitido');
}

export async function validarComprobantePago(boletoId: string, aprobado: boolean): Promise<void> {
  const nuevoEstado = aprobado ? 'pagado' : 'cancelado';
  await dataService.updateBoletoEstado(boletoId, nuevoEstado);
}
