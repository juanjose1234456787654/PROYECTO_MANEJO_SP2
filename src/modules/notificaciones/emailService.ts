import { 
  EventoNotificacion, 
  DatosCorreo, 
  templatePagoRecibido, 
  templateBoletoAprobado, 
  templatePagoRechazado 
} from './emailTemplates';

export function enviarCorreoSimulado(
  evento: EventoNotificacion,
  destinatario: string,
  datos: DatosCorreo
): string {
  let htmlContent = '';

  switch (evento) {
    case 'PAGO_RECIBIDO':
      htmlContent = templatePagoRecibido(datos);
      break;
    case 'BOLETO_APROBADO':
      htmlContent = templateBoletoAprobado(datos);
      break;
    case 'PAGO_RECHAZADO':
      htmlContent = templatePagoRechazado(datos);
      break;
  }

  return `[${evento}] ${destinatario}: ${htmlContent.trim()}`;
}