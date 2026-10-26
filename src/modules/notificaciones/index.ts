/**
 * Módulo: notificaciones
 * Responsable: Andrés Toasa (@The-Fabry) / Mateo Morales (@SebastianM-M)
 * Alcance: Mensajería al usuario, alertas de confirmación de compra y estado del viaje.
 */

export interface NotificacionesModuleConfig {
  name: 'notificaciones';
  version: '1.0.0';
  status: 'active';
  responsable: 'Andrés Toasa';
}

export const notificacionesModuleConfig: NotificacionesModuleConfig = {
  name: 'notificaciones',
  version: '1.0.0',
  status: 'active',
  responsable: 'Andrés Toasa',
};

export type TipoNotificacion = 'info' | 'success' | 'warning' | 'error';

export interface NotificacionItem {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  fecha: string;
}

export function crearMensajeAbordaje(asiento: number, pasajero: string): NotificacionItem {
  return {
    id: `notif-${Date.now()}`,
    tipo: 'success',
    titulo: 'Abordaje Confirmado',
    mensaje: `El pasajero ${pasajero} ha registrado su ingreso en el asiento #${asiento}.`,
    fecha: new Date().toISOString(),
  };
}
