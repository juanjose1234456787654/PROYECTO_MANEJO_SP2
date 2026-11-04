/**
 * Módulo: reportes
 * Responsable: Mateo Morales (@SebastianM-M)
 * Alcance: Métricas financieras, ocupación de flota, estadísticas de abordaje y auditoría ITIL SACM.
 */

import { dataService } from '@/lib/services/dataService';

export interface ReportesModuleConfig {
  name: 'reportes';
  version: '1.0.0';
  status: 'active';
  responsable: 'Mateo Morales';
}

export const reportesModuleConfig: ReportesModuleConfig = {
  name: 'reportes',
  version: '1.0.0',
  status: 'active',
  responsable: 'Mateo Morales',
};

export async function generarMetricasGlobales() {
  const [boletos, buses, cooperativas] = await Promise.all([
    dataService.getBoletos(),
    dataService.getBuses(),
    dataService.getCooperativas(),
  ]);

  const recaudacionTotal = boletos
    .filter((b) => b.estado === 'pagado' || b.estado === 'abordado')
    .reduce((acc, b) => acc + b.precio, 0);

  const boletosAbordados = boletos.filter((b) => b.estado === 'abordado').length;

  return {
    totalBoletos: boletos.length,
    boletosAbordados,
    porcentajeAbordaje: boletos.length > 0 ? Math.round((boletosAbordados / boletos.length) * 100) : 0,
    recaudacionTotal,
    totalBuses: buses.length,
    totalCooperativas: cooperativas.length,
  };
}
