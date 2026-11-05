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
): void {
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

  // Simulación de envío registrada en consola
  console.log('--- 📧 CORREO SIMULADO ENVIADO ---');
  console.log(`Para: ${destinatario}`);
  console.log(`Evento: ${evento}`);
  console.log(`Contenido:\n${htmlContent}`);
  console.log('----------------------------------');
}