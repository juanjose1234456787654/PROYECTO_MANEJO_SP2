/**
 * ==============================================================================
 * PRUEBAS UNITARIAS: VALIDACIÓN DE FLOTA Y BUSES (TICKET ECU-3 / #67)
 * Proyecto: EcuRutas - Universidad Técnica de Ambato
 * ==============================================================================
 * Batería de pruebas exhaustivas para:
 * 1. Validación de número de disco (1 a 4 dígitos numéricos, no vacío, positivo).
 * 2. Validación y formateo canónico de placa ecuatoriana (anteponer cero en 3 dígitos).
 * 3. Mapeo de errores técnicos de PostgreSQL/Supabase a mensajes en español.
 * ==============================================================================
 */

import {
  validarDiscoBus,
  formatearYValidarPlaca,
  mapearErrorPostgresBus,
  derivarAsientosVIPNumeros,
  validarNombrePlantilla,
} from '../flotaValidacionService';
import type { ConfiguracionCroquis } from '@/lib/types';

export function ejecutarPruebasFlotaValidacion(): {
  exitosas: number;
  fallidas: number;
  detalles: string[];
} {
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
  // TEST 1: Formateo y validación de placa vehicular ecuatoriana
  // --------------------------------------------------------------------------
  // Caso 1: ABC-456 debe autocompletar con cero a ABC-0456
  const res1 = formatearYValidarPlaca('ABC-456');
  assert(res1.ok === true && res1.valor === 'ABC-0456', 'ABC-456 se formatea a ABC-0456');

  // Caso 2: abc456 sin guion y minúsculas debe resultar en ABC-0456
  const res2 = formatearYValidarPlaca('abc456');
  assert(res2.ok === true && res2.valor === 'ABC-0456', 'abc456 sin guion se formatea a ABC-0456');

  // Caso 3: ABC-0456 ya canónico se mantiene igual
  const res3 = formatearYValidarPlaca('ABC-0456');
  assert(res3.ok === true && res3.valor === 'ABC-0456', 'ABC-0456 canónico se conserva intacto');

  // Caso 4: abc-0456 en minúsculas pasa a mayúsculas
  const res4 = formatearYValidarPlaca('abc-0456');
  assert(res4.ok === true && res4.valor === 'ABC-0456', 'abc-0456 se normaliza a ABC-0456');

  // Caso 5: AB-1234 (solo 2 letras) debe fallar
  const res5 = formatearYValidarPlaca('AB-1234');
  assert(res5.ok === false, 'AB-1234 con solo 2 letras es rechazado');

  // Caso 6: ABC-12 (solo 2 números) debe fallar
  const res6 = formatearYValidarPlaca('ABC-12');
  assert(res6.ok === false, 'ABC-12 con solo 2 números es rechazado');

  // Caso 7: Placa vacía o solo espacios
  const res7 = formatearYValidarPlaca('   ');
  assert(res7.ok === false, 'Placa vacía es rechazada');

  // --------------------------------------------------------------------------
  // TEST 2: Validación de número de disco (máximo 4 dígitos numéricos)
  // --------------------------------------------------------------------------
  // Caso 1: Disco 12345 (5 dígitos) debe fallar por exceder 4 dígitos
  const disco1 = validarDiscoBus(12345);
  assert(disco1.ok === false, 'Disco 12345 (5 dígitos) es rechazado por exceder longitud máxima');

  // Caso 2: Disco "abc" (caracteres no numéricos) debe fallar
  const disco2 = validarDiscoBus('abc');
  assert(disco2.ok === false, 'Disco "abc" con letras es rechazado');

  // Caso 3: Disco vacío debe fallar
  const disco3 = validarDiscoBus('');
  assert(disco3.ok === false, 'Disco vacío es rechazado');

  // Caso 4: Disco 0 o negativo debe fallar
  const disco4 = validarDiscoBus(0);
  assert(disco4.ok === false, 'Disco 0 es rechazado por no ser positivo');

  // Caso 5: Discos válidos de 1, 2, 3 y 4 dígitos
  assert(validarDiscoBus(5).ok === true && validarDiscoBus(5).valor === 5, 'Disco 5 es válido');
  assert(validarDiscoBus('45').ok === true && validarDiscoBus('45').valor === 45, 'Disco "45" es válido');
  assert(validarDiscoBus(9999).ok === true && validarDiscoBus(9999).valor === 9999, 'Disco 9999 es válido');

  // --------------------------------------------------------------------------
  // TEST 3: Mapeo de errores técnicos de PostgreSQL a mensajes amigables
  // --------------------------------------------------------------------------
  // Caso 1: Violación UNIQUE en Bus_coop_numero_uidx
  const errDisco = mapearErrorPostgresBus({
    code: '23505',
    message: 'duplicate key value violates unique constraint "Bus_coop_numero_uidx"',
  });
  assert(
    errDisco.includes('número de disco ya está registrado'),
    'Error 23505 de disco genera mensaje claro de disco duplicado'
  );

  // Caso 2: Violación UNIQUE en Bus_placa_key
  const errPlaca = mapearErrorPostgresBus({
    code: '23505',
    message: 'duplicate key value violates unique constraint "Bus_placa_key"',
  });
  assert(
    errPlaca.includes('placa ya pertenece a otra unidad'),
    'Error 23505 de placa genera mensaje claro de placa duplicada'
  );

  // Caso 3: Violación CHECK de formato
  const errCheck = mapearErrorPostgresBus({
    code: '23514',
    message: 'new row for relation "Bus" violates check constraint "Bus_placa_formato"',
  });
  assert(
    errCheck.includes('formato válido ecuatoriano'),
    'Error 23514 de formato genera mensaje explicativo en español'
  );

  // Caso 4: Error genérico no expone cadenas crudas de base de datos
  const errGenerico = mapearErrorPostgresBus('FATAL: connection to server at 10.0.0.1 failed');
  assert(
    !errGenerico.includes('FATAL') && !errGenerico.includes('10.0.0.1') && errGenerico.includes('No se pudo guardar'),
    'Error genérico devuelve mensaje en español sin exponer detalles del servidor'
  );

  // --------------------------------------------------------------------------
  // TEST 4: Derivación automática de asientos VIP y capacidad (ECU-3 / #67)
  // --------------------------------------------------------------------------
  const croquisEjemplo: ConfiguracionCroquis = {
    tipoBus: 'INTERPROVINCIAL',
    pisos: 1,
    capacidadTotal: 0,
    asientosVipCount: 0,
    asientosNormalCount: 0,
    asientosVipNumeros: [],
    plantas: [
      {
        piso: 1,
        filas: 3,
        columnas: 4,
        elementos: [
          { id: 'c1', fila: 0, columna: 0, tipo: 'chofer', etiqueta: 'Conductor' },
          { id: 'v1', fila: 0, columna: 1, tipo: 'asiento_vip', numero: 4 },
          { id: 'p1', fila: 0, columna: 2, tipo: 'pasillo' },
          { id: 'v2', fila: 0, columna: 3, tipo: 'asiento_vip', numero: 2 },
          { id: 'n1', fila: 1, columna: 0, tipo: 'asiento_normal', numero: 5 },
          { id: 'n2', fila: 1, columna: 1, tipo: 'asiento_normal', numero: 6 },
          { id: 'p2', fila: 1, columna: 2, tipo: 'pasillo' },
          { id: 'n3', fila: 1, columna: 3, tipo: 'asiento_normal', numero: 7 },
          { id: 'b1', fila: 2, columna: 0, tipo: 'bano', etiqueta: 'Baño' },
          { id: 'pu', fila: 2, columna: 3, tipo: 'puerta', etiqueta: 'Puerta' },
        ],
      },
    ],
  };

  const resDerivacion = derivarAsientosVIPNumeros(croquisEjemplo);
  assert(resDerivacion.capacidadTotal === 5, 'Capacidad total derivada es 5 (2 VIP + 3 normales)');
  assert(resDerivacion.asientosVipCount === 2, 'Contador de asientos VIP derivado es exactamente 2');
  assert(resDerivacion.asientosNormalCount === 3, 'Contador de asientos normales derivado es exactamente 3');
  assert(
    JSON.stringify(resDerivacion.asientosVIPNumeros) === JSON.stringify([2, 4]),
    'Asientos VIP ordenados numéricamente [2, 4]'
  );
  assert(
    JSON.stringify(croquisEjemplo.asientosVipNumeros) === JSON.stringify([2, 4]),
    'Sincroniza in-place asientosVipNumeros en el objeto croquis'
  );

  // --------------------------------------------------------------------------
  // TEST 5: Validación de Nombres de Plantilla (ECU-3 / Problema 1)
  // --------------------------------------------------------------------------
  const resNomVacio = validarNombrePlantilla('');
  assert(resNomVacio.ok === false, 'Nombre de plantilla vacío es rechazado');

  const resNomEspacios = validarNombrePlantilla('   ');
  assert(resNomEspacios.ok === false, 'Nombre de plantilla con solo espacios es rechazado');

  const resNomDefault1 = validarNombrePlantilla('Nueva Plantilla');
  assert(resNomDefault1.ok === false, 'Nombre por defecto "Nueva Plantilla" es rechazado');

  const resNomDefault2 = validarNombrePlantilla('nueva plantilla de asientos');
  assert(resNomDefault2.ok === false, 'Nombre por defecto en minúsculas es rechazado');

  const resNomCorto = validarNombrePlantilla('ab');
  assert(resNomCorto.ok === false, 'Nombre menor a 3 caracteres es rechazado');

  const resNomValido = validarNombrePlantilla('  Interprovincial VIP 44 Asientos  ');
  assert(
    resNomValido.ok === true && resNomValido.nombreNormalizado === 'Interprovincial VIP 44 Asientos',
    'Nombre personalizado válido es aceptado y limpiado'
  );

  const errorDupPlantilla = mapearErrorPostgresBus({ code: '23505', message: 'duplicate key value violates unique constraint "PlantillaBus_nombre_key"' });
  assert(
    errorDupPlantilla.includes('Ya existe una plantilla'),
    'Error 23505 de nombre de plantilla genera mensaje amigable de duplicado'
  );

  return { exitosas, fallidas, detalles };
}


