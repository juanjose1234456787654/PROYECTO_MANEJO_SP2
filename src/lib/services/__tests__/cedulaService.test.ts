/**
 * ==============================================================================
 * PRUEBAS UNITARIAS: VALIDACIÓN DE CÉDULA Y DESCUENTOS ANT (ISSUE #15)
 * Proyecto: EcuRutas - Universidad Técnica de Ambato
 * ==============================================================================
 * Batería de pruebas exhaustivas para:
 * 1. Algoritmo Módulo 10 del Registro Civil en cédulas válidas e inválidas.
 * 2. Validación de provincias de origen (01 a 24 y 30 Exterior).
 * 3. Restricción del tercer dígito para personas naturales (< 6).
 * 4. Cálculo exacto de edad cronológica y verificación de límites.
 * 5. Aplicación obligatoria del 50% de descuento por ley ANT (menores, tercera edad, discapacidad).
 * 6. Tarifa general íntegra y recargo en asientos VIP.
 * ==============================================================================
 */

import {
  validarCedulaEcuatoriana,
  validarCedulaDetallada,
  obtenerProvincia,
  calcularEdad,
  determinarBeneficiario,
  calcularTarifaFinal,
} from '../cedulaService';

export function ejecutarPruebasCedulaYTarifas(): { exitosas: number; fallidas: number; detalles: string[] } {
  let exitosas = 0;
  let fallidas = 0;
  const detalles: string[] = [];

  function assert(condicion: boolean, descripcion: string) {
    if (condicion) {
      exitosas++;
      detalles.push(`✔ [PASS] ${descripcion}`);
    } else {
      fallidas++;
      detalles.push(`✖ [FAIL] ${descripcion}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Cédulas legítimas ecuatorianas de diversas provincias
  // --------------------------------------------------------------------------
  // Tungurahua (18): 1804567897 (Módulo 10 suma=43, verificador=7)
  assert(validarCedulaEcuatoriana('1804567897'), 'Cédula válida de Tungurahua (1804567897)');
  assert(obtenerProvincia('18') === 'Tungurahua', 'Código 18 corresponde a Tungurahua');

  // Pichincha (17): 1710034065 (Módulo 10 suma=25, verificador=5)
  assert(validarCedulaEcuatoriana('1710034065'), 'Cédula válida de Pichincha (1710034065)');
  assert(obtenerProvincia('17') === 'Pichincha', 'Código 17 corresponde a Pichincha');

  // Guayas (09): 0923456784 (Módulo 10 suma=46, verificador=4)
  assert(validarCedulaEcuatoriana('0923456784'), 'Cédula válida de Guayas (0923456784)');
  assert(obtenerProvincia('09') === 'Guayas', 'Código 09 corresponde a Guayas');

  // Azuay (01): 0102030400 (Módulo 10 suma=10, verificador=0)
  assert(validarCedulaEcuatoriana('0102030400'), 'Cédula válida de Azuay con verificador 0 (0102030400)');

  // Exterior (30): 3000000012 (Módulo 10 suma=8, verificador=2)
  assert(validarCedulaEcuatoriana('3000000012'), 'Cédula válida de ecuatorianos en el Exterior (3000000012)');

  // Formato con guión: '180456789-7'
  assert(validarCedulaEcuatoriana('180456789-7'), 'Cédula válida con guion de separación');

  // --------------------------------------------------------------------------
  // TEST 2: Cédulas inválidas y causas forenses detalladas
  // --------------------------------------------------------------------------
  // Dígito verificador erróneo (esperado 7, recibido 8)
  assert(!validarCedulaEcuatoriana('1804567898'), 'Cédula con dígito verificador incorrecto debe ser rechazada');
  const detVerificador = validarCedulaDetallada('1804567898');
  assert(!detVerificador.valida && detVerificador.mensaje.includes('Dígito verificador incorrecto'), 'Detalle indica dígito verificador incorrecto');

  // Longitud errónea (9 u 11 dígitos)
  assert(!validarCedulaEcuatoriana('180456789'), 'Cédula de 9 dígitos debe ser rechazada');
  assert(!validarCedulaEcuatoriana('18045678971'), 'Cédula de 11 dígitos debe ser rechazada');

  // Código de provincia fuera de rango (25 a 29, mayor a 30 o 00)
  assert(!validarCedulaEcuatoriana('2501234567'), 'Provincia 25 debe ser rechazada');
  assert(!validarCedulaEcuatoriana('0012345678'), 'Provincia 00 debe ser rechazada');
  assert(!validarCedulaEcuatoriana('3101234567'), 'Provincia 31 debe ser rechazada');

  // Tercer dígito mayor o igual a 6 (personas jurídicas / RUC público)
  assert(!validarCedulaEcuatoriana('1860000012'), 'Tercer dígito = 6 debe ser rechazado para cédula');
  assert(!validarCedulaEcuatoriana('1790012345'), 'Tercer dígito = 9 debe ser rechazado para cédula');

  // Caracteres alfabéticos
  assert(!validarCedulaEcuatoriana('180456789A'), 'Cédula con letras debe ser rechazada');

  // Dígitos repetitivos
  assert(!validarCedulaEcuatoriana('0000000000'), 'Cédula repetitiva 0000000000 debe ser rechazada');
  assert(!validarCedulaEcuatoriana('1111111111'), 'Cédula repetitiva 1111111111 debe ser rechazada');

  // --------------------------------------------------------------------------
  // TEST 3: Cálculo preciso de edad cronológica
  // --------------------------------------------------------------------------
  const refDate = new Date(2026, 10, 2); // 2 de noviembre de 2026

  // Persona nacida el 2 de noviembre de 2008 (cumple 18 años hoy)
  assert(calcularEdad('2008-11-02', refDate) === 18, 'Nacido el 2008-11-02 cumple exactamente 18 años');

  // Persona nacida el 3 de noviembre de 2008 (todavía tiene 17 años)
  assert(calcularEdad('2008-11-03', refDate) === 17, 'Nacido el 2008-11-03 todavía tiene 17 años');

  // Persona de tercera edad nacida en 1950 (76 años)
  assert(calcularEdad('1950-05-15', refDate) === 76, 'Nacido en 1950 tiene 76 años');

  // Fecha en el futuro debe retornar -1
  assert(calcularEdad('2030-01-01', refDate) === -1, 'Fecha futura debe retornar -1');

  // --------------------------------------------------------------------------
  // TEST 4: Reglas de Negocio de Descuentos ANT (50% por Ley)
  // --------------------------------------------------------------------------
  const tarifaBase = 10.0;

  // CASO A: Menor de Edad (< 18 años)
  const descMenor = calcularTarifaFinal(tarifaBase, '2016-06-15'); // 10 años
  assert(descMenor.tipoBeneficiario === 'menor_edad', 'Beneficiario clasificado como menor_edad');
  assert(descMenor.aplicaDescuento === true, 'Aplica descuento obligatorio del 50%');
  assert(descMenor.porcentajeDescuento === 50, 'Porcentaje de descuento es 50%');
  assert(descMenor.valorDescuento === 5.0, 'Monto de descuento es $5.00');
  assert(descMenor.tarifaFinal === 5.0, 'Tarifa final es $5.00');

  // CASO B: Adulto Mayor (>= 65 años)
  const descAdultoMayor = calcularTarifaFinal(tarifaBase, '1955-03-20'); // 71 años
  assert(descAdultoMayor.tipoBeneficiario === 'tercera_edad', 'Beneficiario clasificado como tercera_edad');
  assert(descAdultoMayor.aplicaDescuento === true, 'Adulto Mayor recibe 50% de descuento');
  assert(descAdultoMayor.tarifaFinal === 5.0, 'Tarifa final para tercera edad es $5.00');

  // CASO C: Persona con Discapacidad (Acreditación CONADIS / MSP)
  const descDiscapacidad = calcularTarifaFinal(tarifaBase, '1995-01-01', true, 45); // 31 años con discapacidad
  assert(descDiscapacidad.tipoBeneficiario === 'discapacidad', 'Prioridad de beneficio para discapacidad');
  assert(descDiscapacidad.aplicaDescuento === true, 'Discapacidad recibe 50% de descuento');
  assert(descDiscapacidad.tarifaFinal === 5.0, 'Tarifa final para persona con discapacidad es $5.00');

  // CASO D: Tarifa General (Adulto 18 a 64 años sin discapacidad)
  const tarifaGeneral = calcularTarifaFinal(tarifaBase, '1998-08-10', false, 0); // 28 años
  assert(tarifaGeneral.tipoBeneficiario === 'general', 'Beneficiario clasificado como general');
  assert(tarifaGeneral.aplicaDescuento === false, 'No aplica descuento para tarifa general');
  assert(tarifaGeneral.valorDescuento === 0.0, 'Descuento es $0.00');
  assert(tarifaGeneral.tarifaFinal === 10.0, 'Tarifa general paga el 100% ($10.00)');

  // CASO E: Asiento VIP con descuento legal aplicado
  // Base $10.00 -> Con 50% descuento = $5.00. Recargo VIP (25% de $10.00) = $2.50. Total = $7.50
  const tarifaVipConDesc = calcularTarifaFinal(tarifaBase, '1950-01-01', false, 0, true);
  assert(tarifaVipConDesc.tarifaFinal === 5.0, 'Subtotal con descuento es $5.00');
  assert(tarifaVipConDesc.recargoVip === 2.5, 'Recargo VIP es $2.50 (25% de la tarifa base)');
  assert(tarifaVipConDesc.totalConVip === 7.5, 'Total a pagar con VIP es $7.50');

  return { exitosas, fallidas, detalles };
}

