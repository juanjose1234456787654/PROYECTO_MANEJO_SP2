/**
 * Servicio modular de códigos QR para boletos de transporte (RFC-006 / RFC-009).
 * Provee funciones puras y desacopladas para:
 * 1. Parsear tokens QR (tanto formato HMAC de 6 segmentos como identificadores directos).
 * 2. Calcular y verificar firmas HMAC-SHA256.
 * 3. Evaluar el estado del boleto y determinar si procede el abordaje o el motivo exacto de rechazo.
 */

export interface TokenQrData {
  tipo: 'HMAC' | 'DIRECTO';
  boletoId?: string;
  busId?: string;
  fecha?: string;
  hora?: string;
  asiento?: string | number;
  hash?: string;
  rawData?: string;
  rawToken: string;
}

export type TipoEstadoBoletoQr =
  | 'ACCESO_PERMITIDO'
  | 'YA_USADO'
  | 'PENDIENTE_PAGO'
  | 'NO_APROBADO'
  | 'CANCELADO'
  | 'NO_ENCONTRADO'
  | 'INVALIDO';

export interface EvaluacionBoletoResult {
  valido: boolean;
  statusType: TipoEstadoBoletoQr;
  motivo: string;
  puedeAbordar: boolean;
}

export interface BoletoValidable {
  id: string;
  estado?: string | null;
  abordadoAt?: string | null;
  asiento?: string | number | null;
  pasajeroNombre?: string | null;
  pasajeroCedula?: string | null;
  codigoQr?: string | null;
}

/**
 * Parsea el contenido raw de un código QR.
 * Formato HMAC esperado: boletoId|busId|fecha|hora|asiento|hash
 */
export function parsearTokenQr(rawToken: string): TokenQrData {
  const tokenLimpio = (rawToken || '').trim();
  if (!tokenLimpio) {
    return {
      tipo: 'DIRECTO',
      rawToken: '',
    };
  }

  const parts = tokenLimpio.split('|');
  if (parts.length === 6) {
    const [boletoId, busId, fecha, hora, asiento, hash] = parts;
    const rawData = `${boletoId}|${busId}|${fecha}|${hora}|${asiento}`;
    return {
      tipo: 'HMAC',
      boletoId,
      busId,
      fecha,
      hora,
      asiento,
      hash,
      rawData,
      rawToken: tokenLimpio,
    };
  }

  return {
    tipo: 'DIRECTO',
    boletoId: tokenLimpio,
    rawToken: tokenLimpio,
  };
}

/**
 * Genera la firma HMAC SHA-256 para los datos crudos del boleto.
 * Funciona de forma pura usando Node crypto si está en entorno Node o fallback universal.
 */
export function generarFirmaHmac(rawData: string, secret?: string): string {
  const secreto = secret || process.env.QR_SECRET || 'secret_por_defecto';
  // En entorno Node (servidor o pruebas):
  try {
    const crypto = require('node:crypto');
    return crypto.createHmac('sha256', secreto).update(rawData).digest('hex');
  } catch {
    // Fallback ligero o browser simple si fuese necesario
    return '';
  }
}

/**
 * Verifica si el hash recibido coincide con la firma HMAC de los datos crudos.
 */
export function verificarFirmaHmac(rawData: string, hashRecibido: string, secret?: string): boolean {
  if (!rawData || !hashRecibido) return false;
  const hashCalculado = generarFirmaHmac(rawData, secret);
  if (!hashCalculado) return false;

  try {
    const crypto = require('node:crypto');
    const bufRec = Buffer.from(hashRecibido.toLowerCase(), 'hex');
    const bufCalc = Buffer.from(hashCalculado.toLowerCase(), 'hex');
    if (bufRec.length !== bufCalc.length) return false;
    return crypto.timingSafeEqual(bufRec, bufCalc);
  } catch {
    return hashRecibido.toLowerCase() === hashCalculado.toLowerCase();
  }
}

/**
 * Evalúa las reglas de negocio de un boleto frente al abordaje (RFC-006 / RFC-009).
 * - Rechaza si ya fue usado (EMBARCADO o ABORDADO)
 * - Rechaza si está pendiente de aprobación (PENDIENTE_APROBACION)
 * - Rechaza si está pendiente de pago (PENDIENTE)
 * - Rechaza si fue cancelado o rechazado (CANCELADO, RECHAZADO)
 * - Permite acceso si está pagado/confirmado (COMPLETADO, CONFIRMADO, PAGADO)
 */
export function evaluarEstadoBoleto(boleto?: BoletoValidable | null): EvaluacionBoletoResult {
  if (!boleto) {
    return {
      valido: false,
      statusType: 'NO_ENCONTRADO',
      motivo: 'Boleto no encontrado en el sistema',
      puedeAbordar: false,
    };
  }

  const estadoNorm = (boleto.estado || '').trim().toUpperCase();

  // Caso: Ya usado / abordado
  if (estadoNorm === 'EMBARCADO' || estadoNorm === 'ABORDADO' || Boolean(boleto.abordadoAt)) {
    return {
      valido: false,
      statusType: 'YA_USADO',
      motivo: 'ESTE BOLETO YA FUE UTILIZADO PARA ABORDAR',
      puedeAbordar: false,
    };
  }

  // Caso: Pendiente de aprobación (RFC-009)
  if (estadoNorm === 'PENDIENTE_APROBACION') {
    return {
      valido: false,
      statusType: 'PENDIENTE_PAGO',
      motivo: 'PAGO PENDIENTE DE APROBACIÓN: Este boleto no puede abordar hasta ser verificado',
      puedeAbordar: false,
    };
  }

  // Caso: Pendiente regular
  if (estadoNorm === 'PENDIENTE') {
    return {
      valido: false,
      statusType: 'NO_APROBADO',
      motivo: 'BOLETO NO PAGADO: El boleto figura como pendiente de pago',
      puedeAbordar: false,
    };
  }

  // Caso: Cancelado o Rechazado
  if (estadoNorm === 'CANCELADO' || estadoNorm === 'RECHAZADO') {
    return {
      valido: false,
      statusType: 'CANCELADO',
      motivo: 'BOLETO INVÁLIDO: El boleto ha sido cancelado o rechazado',
      puedeAbordar: false,
    };
  }

  // Estados válidos para abordar
  if (['COMPLETADO', 'CONFIRMADO', 'PAGADO'].includes(estadoNorm)) {
    return {
      valido: true,
      statusType: 'ACCESO_PERMITIDO',
      motivo: 'ACCESO PERMITIDO - Boleto válido y aprobado',
      puedeAbordar: true,
    };
  }

  // Estado no reconocido
  return {
    valido: false,
    statusType: 'INVALIDO',
    motivo: `Estado de boleto no autorizado para abordar (${boleto.estado || 'DESCONOCIDO'})`,
    puedeAbordar: false,
  };
}

/**
 * Ensambla un código QR firmado con formato estándar.
 */
export function construirPayloadQr(params: {
  boletoId: string;
  busId: string;
  fecha: string;
  hora: string;
  asiento: string | number;
  secret?: string;
}): string {
  const rawData = `${params.boletoId}|${params.busId}|${params.fecha}|${params.hora}|${params.asiento}`;
  const hash = generarFirmaHmac(rawData, params.secret);
  return `${rawData}|${hash}`;
}
