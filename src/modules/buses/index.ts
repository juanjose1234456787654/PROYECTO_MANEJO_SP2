/**
 * Módulo: buses
 * Responsable: Anahí Morales (@AnahiM2025)
 * Alcance: Gestión de unidades (buses), asignación de flota, capacidades, asientos VIP y mantenimiento.
 */

import { dataService } from '@/lib/services/dataService';
import type { BusRow } from '@/lib/data/mockData';

export interface BusesModuleConfig {
  name: 'buses';
  version: '1.0.0';
  status: 'active';
  responsable: 'Anahí Morales';
}

export const busesModuleConfig: BusesModuleConfig = {
  name: 'buses',
  version: '1.0.0',
  status: 'active',
  responsable: 'Anahí Morales',
};

export async function getFlotaCooperativa(cooperativaId?: string): Promise<BusRow[]> {
  return await dataService.getBuses(cooperativaId);
}

export function isAsientoVIP(bus: BusRow, asientoNumero: number): boolean {
  if (!bus.asientosVIPNumeros) return false;
  return bus.asientosVIPNumeros.includes(asientoNumero);
}

export function calcularPrecioAsiento(precioBase: number, esVip: boolean): number {
  return Number((esVip ? precioBase * 1.25 : precioBase).toFixed(2));
}
