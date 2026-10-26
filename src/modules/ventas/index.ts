/**
 * Módulo: ventas
 * Responsable: Jeremy Guaman (@levi06516-ui)
 * Alcance: Venta de boletos en ventanilla, aplicación de subsidios y descuentos de ley.
 */

export interface VentasModuleConfig {
  name: 'ventas';
  version: '1.0.0';
  status: 'active';
  responsable: 'Jeremy Guaman';
}

export const ventasModuleConfig: VentasModuleConfig = {
  name: 'ventas',
  version: '1.0.0',
  status: 'active',
  responsable: 'Jeremy Guaman',
};

export type TipoTarifa = 'general' | 'tercera_edad' | 'discapacidad' | 'menor';

export function calcularDescuentoLey(subtotal: number, tipo: TipoTarifa): {
  descuento: number;
  total: number;
} {
  const tieneDescuento = tipo !== 'general';
  const descuento = tieneDescuento ? subtotal * 0.5 : 0;
  const total = subtotal - descuento;

  return {
    descuento: Number(descuento.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
