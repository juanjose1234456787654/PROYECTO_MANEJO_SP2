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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h1 style="color: #1e3a8a; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Comprobante de Pago Recibido</h1>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">Estimado(a) <strong>${datos.nombrePasajero}</strong>,</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        Hemos recibido satisfactoriamente tu comprobante de pago asociado al boleto con identificador <strong>${datos.idBoleto}</strong>.
      </p>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        Tu pago se encuentra en proceso de validación por el personal de taquilla de la cooperativa. Tan pronto como sea verificado, recibirás un correo con tu boleto electrónico QR listo para abordar.
      </p>
      <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 14px; color: #1f2937;">
        <strong>Monto declarado:</strong> ${datos.monto || 'No especificado'}
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        Cooperativa de Transportes EcuRutas · Sistema Interprovincial del Ecuador
      </p>
    </div>
  `;
}

// 2. Plantilla: Boleto Aprobado
export function templateBoletoAprobado(datos: DatosCorreo): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h1 style="color: #15803d; font-size: 20px; font-weight: bold; margin-bottom: 16px;">¡Tu Boleto ha sido Aprobado con Éxito!</h1>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">Estimado(a) <strong>${datos.nombrePasajero}</strong>,</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        Nos complace informarte que la transferencia para tu boleto <strong>${datos.idBoleto}</strong> ha sido verificada y aprobada correctamente.
      </p>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        Ya puedes acceder a tu boleto digital con código QR desde tu casillero de boletos en la plataforma. Recuerda presentarlo en pantalla o impreso al momento de abordar la unidad.
      </p>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 14px; color: #065f46;">
        ✓ <strong>Estado:</strong> Boleto emitido y listo para embarque directo en andén.
      </div>
      <p style="color: #374151; font-size: 14px; font-weight: bold; margin-top: 16px;">
        ¡Te deseamos un excelente viaje!
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        Cooperativa de Transportes EcuRutas · Frecuencias Autorizadas ANT
      </p>
    </div>
  `;
}

// 3. Plantilla: Pago Rechazado
export function templatePagoRechazado(datos: DatosCorreo): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h1 style="color: #b91c1c; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Novedad con tu Comprobante de Pago</h1>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">Estimado(a) <strong>${datos.nombrePasajero}</strong>,</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        Lamentamos informarte que el comprobante remitido para el boleto <strong>${datos.idBoleto}</strong> no pudo ser validado.
      </p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 14px; color: #991b1b;">
        <strong>Motivo del rechazo:</strong> ${datos.motivo || 'Comprobante ilegible o monto no coincidente'}
      </div>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        Por favor, ingresa a tu casillero de boletos para cargar un comprobante legible o acércate a la ventanilla de la cooperativa en el terminal terrestre.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        Cooperativa de Transportes EcuRutas · Soporte al Pasajero
      </p>
    </div>
  `;
}
