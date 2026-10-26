/**
 * Módulo: pagos
 * Responsable sugerido: Estudiante 1
 * Alcance: Carga de comprobantes a bucket privado "comprobantes" y validación manual por oficinista.
 */

export interface PagosModuleConfig {
  name: 'pagos';
  version: '0.1.0';
  status: 'scaffolded';
  bucket: 'comprobantes';
}

export const pagosModuleConfig: PagosModuleConfig = {
  name: 'pagos',
  version: '0.1.0',
  status: 'scaffolded',
  bucket: 'comprobantes',
};

export function PagosPlaceholder() {
  return null;
}
