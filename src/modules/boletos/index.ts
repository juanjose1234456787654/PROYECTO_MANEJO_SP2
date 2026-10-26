/**
 * Módulo: boletos
 * Responsable: Jeremy Guaman (@levi06516-ui)
 * Alcance: Gestión del ciclo de vida del pasaje (emitido, pagado, abordado, cancelado) y generación de identificadores QR.
 */

import { dataService } from '@/lib/services/dataService';
import type { BoletoRow } from '@/lib/data/mockData';

export interface BoletosModuleConfig {
  name: 'boletos';
  version: '1.0.0';
  status: 'active';
  responsable: 'Jeremy Guaman';
}

export const boletosModuleConfig: BoletosModuleConfig = {
  name: 'boletos',
  version: '1.0.0',
  status: 'active',
  responsable: 'Jeremy Guaman',
};

export function generarIdentificadorQR(rutaId: string, asiento: number): string {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ECU-${rutaId.toUpperCase()}-S${asiento}-${token}`;
}

export async function consultarBoletosDePasajero(pasajeroId?: string, cedula?: string): Promise<BoletoRow[]> {
  const todos = await dataService.getBoletos({ pasajeroId });
  if (cedula) {
    return todos.filter((b) => b.pasajeroCedula === cedula);
  }
  return todos;
}
