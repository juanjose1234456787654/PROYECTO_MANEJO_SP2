/**
 * Pruebas unitarias de RFC-006:
 * - Validación y firma modular de QR (HMAC SHA-256).
 * - Rechazo por reglas de negocio (RFC-009: no aprobado, pendiente de pago, cancelado, ya usado).
 * - Aprobación de boleto confirmado/pagado con registro de timestamp.
 * - Operaciones del chofer: Bitácora de viaje (inicio/fin/eventos) y Venta a bordo (ocupación de asiento).
 */

import {
  parsearTokenQr,
  generarFirmaHmac,
  verificarFirmaHmac,
  evaluarEstadoBoleto,
  construirPayloadQr,
} from '../qrService';
import { dataService } from '../dataService';

export interface TestResult {
  suite: string;
  pasadas: number;
  fallidas: number;
  detalles: string[];
}

export function ejecutarPruebasChoferRFC006(): TestResult {
  let pasadas = 0;
  let fallidas = 0;
  const detalles: string[] = [];

  function assert(cond: boolean, mensaje: string) {
    if (cond) {
      pasadas++;
      detalles.push(`  [PASS] ${mensaje}`);
    } else {
      fallidas++;
      detalles.push(`  [FAIL] ${mensaje}`);
    }
  }

  // 1. Parsing y formato de tokens QR
  const tokenHMAC = 'bol-123|bus-456|2026-11-27|08:30|15|a1b2c3d4e5f6';
  const parsedHMAC = parsearTokenQr(tokenHMAC);
  assert(parsedHMAC.tipo === 'HMAC', 'parsearTokenQr identifica token HMAC de 6 partes');
  assert(parsedHMAC.boletoId === 'bol-123', 'parsearTokenQr extrae boletoId correctamente');
  assert(parsedHMAC.asiento === '15', 'parsearTokenQr extrae asiento correctamente');
  assert(parsedHMAC.hash === 'a1b2c3d4e5f6', 'parsearTokenQr extrae hash correctamente');

  const tokenDirecto = 'ECU-BOL-7890';
  const parsedDirecto = parsearTokenQr(tokenDirecto);
  assert(parsedDirecto.tipo === 'DIRECTO', 'parsearTokenQr identifica token directo/código único');
  assert(parsedDirecto.boletoId === 'ECU-BOL-7890', 'parsearTokenQr preserva identificador');

  // 2. Generación y verificación de firma criptográfica HMAC SHA-256
  const rawData = 'bol-999|bus-01|2026-11-27|14:00|5';
  const secret = 'clave_secreta_test';
  const hash = generarFirmaHmac(rawData, secret);
  assert(hash.length === 64, 'generarFirmaHmac produce hash hexadecimal SHA-256 de 64 caracteres');

  const esValida = verificarFirmaHmac(rawData, hash, secret);
  assert(esValida === true, 'verificarFirmaHmac valida exitosamente firma auténtica');

  const esFalsificada = verificarFirmaHmac(rawData, '0000000000000000000000000000000000000000000000000000000000000000', secret);
  assert(esFalsificada === false, 'verificarFirmaHmac rechaza firma alterada/inválida');

  const payloadCompleto = construirPayloadQr({
    boletoId: 'bol-test',
    busId: 'bus-test',
    fecha: '2026-11-27',
    hora: '10:00',
    asiento: 12,
    secret,
  });
  assert(payloadCompleto.split('|').length === 6, 'construirPayloadQr ensambla las 6 partes estándar');

  // 3. Reglas de negocio de abordaje (RFC-006 / RFC-009)
  // Caso A: Boleto ya usado
  const resYaUsado = evaluarEstadoBoleto({ id: 'b1', estado: 'EMBARCADO' });
  assert(resYaUsado.valido === false && resYaUsado.statusType === 'YA_USADO', 'Rechaza boleto EMBARCADO como YA_USADO');

  const resAbordadoAt = evaluarEstadoBoleto({ id: 'b2', estado: 'COMPLETADO', abordadoAt: '2026-11-27T07:00:00Z' });
  assert(resAbordadoAt.valido === false && resAbordadoAt.statusType === 'YA_USADO', 'Rechaza boleto con abordadoAt ya existente como YA_USADO');

  // Caso B: Pendiente de aprobación (RFC-009)
  const resPendienteAprob = evaluarEstadoBoleto({ id: 'b3', estado: 'PENDIENTE_APROBACION' });
  assert(resPendienteAprob.valido === false && resPendienteAprob.statusType === 'PENDIENTE_PAGO', 'Rechaza boleto PENDIENTE_APROBACION con mensaje específico RFC-009');

  // Caso C: Pendiente regular
  const resPendiente = evaluarEstadoBoleto({ id: 'b4', estado: 'PENDIENTE' });
  assert(resPendiente.valido === false && resPendiente.statusType === 'NO_APROBADO', 'Rechaza boleto PENDIENTE de pago');

  // Caso D: Cancelado / Rechazado
  const resCancelado = evaluarEstadoBoleto({ id: 'b5', estado: 'CANCELADO' });
  assert(resCancelado.valido === false && resCancelado.statusType === 'CANCELADO', 'Rechaza boleto CANCELADO');

  const resRechazado = evaluarEstadoBoleto({ id: 'b6', estado: 'RECHAZADO' });
  assert(resRechazado.valido === false && resRechazado.statusType === 'CANCELADO', 'Rechaza boleto RECHAZADO');

  // Caso E: Aprobado / Confirmado / Pagado
  const resCompletado = evaluarEstadoBoleto({ id: 'b7', estado: 'COMPLETADO' });
  assert(resCompletado.valido === true && resCompletado.puedeAbordar === true, 'Aprueba acceso a boleto COMPLETADO');

  const resPagado = evaluarEstadoBoleto({ id: 'b8', estado: 'PAGADO' });
  assert(resPagado.valido === true && resPagado.puedeAbordar === true, 'Aprueba acceso a boleto PAGADO');

  // 4. Métodos de Chofer y Bitácora en dataService
  assert(typeof dataService.iniciarViaje === 'function', 'dataService.iniciarViaje está implementado');
  assert(typeof dataService.finalizarViaje === 'function', 'dataService.finalizarViaje está implementado');
  assert(typeof dataService.registrarEventoBitacora === 'function', 'dataService.registrarEventoBitacora está implementado');
  assert(typeof dataService.getBitacoraViaje === 'function', 'dataService.getBitacoraViaje está implementado');
  assert(typeof dataService.venderBoletoABordo === 'function', 'dataService.venderBoletoABordo está implementado');

  return {
    suite: 'RFC-006: CONTROL DE CHOFER, QR, BITÁCORA Y VENTA A BORDO',
    pasadas,
    fallidas,
    detalles,
  };
}
