// Tipos estrictos para los eventos
export type EventoNotificacion = 'PAGO_RECIBIDO' | 'BOLETO_APROBADO' | 'PAGO_RECHAZADO';

export interface DatosCorreo {
  nombrePasajero: string;
  idBoleto: string;
  monto?: string;
  motivo?: string;
}

// 1. Plantilla: Pago Recibido
export function templatePagoRecibido(datos: DatosCorreo): string {
  return `
    <h1>Pago Recibido</h1>
    <p>Hola ${datos.nombrePasajero},</p>
    <p>Hemos recibido tu comprobante de pago para el boleto <strong>${datos.idBoleto}</strong>.</p>
    <p>Tu pago está siendo verificado por un oficinista. Te notificaremos pronto.</p>
    <p>Monto declarado: ${datos.monto || 'N/A'}</p>
  `;
}

// 2. Plantilla: Boleto Aprobado
export function templateBoletoAprobado(datos: DatosCorreo): string {
  return `
    <h1>¡Tu Boleto ha sido Aprobado!</h1>
    <p>Hola ${datos.nombrePasajero},</p>
    <p>Nos complace informarte que tu pago para el boleto <strong>${datos.idBoleto}</strong> ha sido aprobado.</p>
    <p>Ya puedes acceder a tu boleto con código QR desde tu portal de pasajero.</p>
    <p>¡Buen viaje!</p>
  `;
}

// 3. Plantilla: Pago Rechazado
export function templatePagoRechazado(datos: DatosCorreo): string {
  return `
    <h1>Problema con tu Pago</h1>
    <p>Hola ${datos.nombrePasajero},</p>
    <p>Lamentamos informarte que tu comprobante para el boleto <strong>${datos.idBoleto}</strong> ha sido rechazado.</p>
    <p><strong>Motivo:</strong> ${datos.motivo || 'No especificado'}</p>
    <p>Por favor, contacta a la oficina o sube un nuevo comprobante válido.</p>
  `;
}