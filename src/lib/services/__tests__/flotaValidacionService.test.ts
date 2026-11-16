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
  obtenerEstadoInicialWizardBus,
  normalizarPisosConfiguracion,
  esUltimaFilaVaciaEnTodosLosPisos,
} from '../flotaValidacionService';
import type { ConfiguracionCroquis, BusRow } from '@/lib/types';

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

  // --------------------------------------------------------------------------
  // TEST 6: Resumen de Asientos Derivado Dinámicamente (ECU-3 / Problema 2)
  // --------------------------------------------------------------------------
  // Croquis de 36 asientos (Urbano 36) sin VIP
  const croquis36: ConfiguracionCroquis = {
    tipoBus: 'URBANO',
    pisos: 1,
    capacidadTotal: 0,
    asientosVipCount: 0,
    asientosNormalCount: 0,
    asientosVipNumeros: [],
    plantillaNombre: 'Urbano 36 Asientos',
    plantas: [
      {
        piso: 1,
        filas: 9,
        columnas: 5,
        elementos: Array.from({ length: 36 }, (_, i) => ({
          id: `asiento-${i + 1}`,
          fila: Math.floor(i / 4),
          columna: i % 4,
          tipo: 'asiento_normal' as const,
          numero: i + 1,
          categoria: 'normal' as const,
        })),
      },
    ],
  };

  const resumen36 = derivarAsientosVIPNumeros(croquis36);
  assert(resumen36.capacidadTotal === 36, 'Plantilla de 36 asientos calcula capacidadTotal 36 (sin heredar 40)');
  assert(resumen36.asientosNormalCount === 36, 'Plantilla de 36 asientos calcula 36 asientos normales');
  assert(resumen36.asientosVipCount === 0, 'Plantilla urbana de 36 asientos calcula 0 asientos VIP');
  assert(resumen36.asientosVIPNumeros.length === 0, 'Plantilla urbana no contiene asientos VIP');

  // --------------------------------------------------------------------------
  // TEST 7: Personalización de Croquis sin Mutar Plantilla Base (ECU-3 / Problema 3)
  // --------------------------------------------------------------------------
  const plantillaBaseOriginal: ConfiguracionCroquis = {
    tipoBus: 'INTERPROVINCIAL',
    pisos: 1,
    capacidadTotal: 4,
    asientosVipCount: 0,
    asientosNormalCount: 4,
    asientosVipNumeros: [],
    plantillaNombre: 'Base 4 Asientos',
    plantas: [
      {
        piso: 1,
        filas: 2,
        columnas: 2,
        elementos: [
          { id: '1', fila: 0, columna: 0, tipo: 'asiento_normal', numero: 1, categoria: 'normal' },
          { id: '2', fila: 0, columna: 1, tipo: 'asiento_normal', numero: 2, categoria: 'normal' },
          { id: '3', fila: 1, columna: 0, tipo: 'asiento_normal', numero: 3, categoria: 'normal' },
          { id: '4', fila: 1, columna: 1, tipo: 'asiento_normal', numero: 4, categoria: 'normal' },
        ],
      },
    ],
  };

  // Clon profundo para personalización
  const copiaPersonalizada: ConfiguracionCroquis = JSON.parse(JSON.stringify(plantillaBaseOriginal));
  // Convertir asientos 1 y 2 a VIP en la copia
  copiaPersonalizada.plantas[0].elementos[0] = {
    ...copiaPersonalizada.plantas[0].elementos[0],
    tipo: 'asiento_vip',
    categoria: 'vip',
  };
  copiaPersonalizada.plantas[0].elementos[1] = {
    ...copiaPersonalizada.plantas[0].elementos[1],
    tipo: 'asiento_vip',
    categoria: 'vip',
  };

  const resCopiaDerivada = derivarAsientosVIPNumeros(copiaPersonalizada);

  assert(
    plantillaBaseOriginal.plantas[0].elementos[0].tipo === 'asiento_normal',
    'Clonar y modificar no altera el tipo de asiento de la plantilla original'
  );
  assert(
    plantillaBaseOriginal.asientosVipCount === 0,
    'Plantilla original conserva 0 asientos VIP sin ser mutada'
  );
  assert(
    resCopiaDerivada.asientosVipCount === 2,
    'Croquis personalizado calcula exactamente 2 asientos VIP'
  );
  assert(
    JSON.stringify(resCopiaDerivada.asientosVIPNumeros) === JSON.stringify([1, 2]),
    'Croquis personalizado actualiza lista de asientosVIPNumeros [1, 2]'
  );
  assert(
    resCopiaDerivada.capacidadTotal === 4,
    'Croquis personalizado mantiene capacidad total de 4 asientos'
  );

  // --------------------------------------------------------------------------
  // TEST 8: Aislamiento y Reinicio Completo del Wizard de Buses (ECU-3 / Problema 4)
  // --------------------------------------------------------------------------
  // 1. Apertura inicial para nuevo Bus A
  const estadoNuevoA = obtenerEstadoInicialWizardBus(null);
  assert(estadoNuevoA.paso === 1, 'Nuevo bus inicia en el Paso 1');
  assert(estadoNuevoA.numeroDisco === '', 'Nuevo bus tiene disco vacío');
  assert(estadoNuevoA.placa === '', 'Nuevo bus tiene placa vacía');
  assert(estadoNuevoA.distribucionPersonalizada === null, 'Nuevo bus no tiene croquis personalizado');
  assert(estadoNuevoA.esPersonalizado === false, 'Nuevo bus tiene esPersonalizado = false');
  assert(estadoNuevoA.errorAlerta === null, 'Nuevo bus no arrastra mensajes de error');

  // 2. Apertura en modo edición para un Bus Existente
  const busSimuladoExistente: BusRow = {
    id: 'bus-uuid-123',
    cooperativaId: 'coop-1',
    grupoBusId: null,
    numero: 77,
    placa: 'TBA-0777',
    marca: 'Mercedes-Benz',
    carroceria: 'Marcopolo G8',
    chasis: 'OF-1721',
    fotoUrl: 'https://ejemplo.com/foto.jpg',
    capacidad: 44,
    asientosVIP: 6,
    asientosVIPNumeros: [1, 2, 3, 4, 5, 6],
    diasParada: [2],
    activo: true,
    tipoBus: 'INTERPROVINCIAL',
    plantillaId: 'plantilla-44',
    distribucionAsientos: copiaPersonalizada,
  };

  const estadoEdicion = obtenerEstadoInicialWizardBus(busSimuladoExistente);
  assert(estadoEdicion.paso === 1, 'Modo edición inicia siempre ordenadamente en Paso 1');
  assert(estadoEdicion.numeroDisco === '77', 'Modo edición precarga disco 77');
  assert(estadoEdicion.placa === 'TBA-0777', 'Modo edición precarga placa TBA-0777');
  assert(estadoEdicion.marca === 'Mercedes-Benz', 'Modo edición precarga marca Mercedes-Benz');
  assert(estadoEdicion.carroceria === 'Marcopolo G8', 'Modo edición precarga carrocería Marcopolo G8');
  assert(estadoEdicion.plantillaSeleccionadaId === 'plantilla-44', 'Modo edición precarga plantillaId base');
  assert(estadoEdicion.esPersonalizado === true, 'Modo edición detecta distribución personalizada');
  assert(estadoEdicion.distribucionPersonalizada !== null, 'Modo edición carga croquis personalizado');

  // 3. Apertura para Bus B tras guardar o cerrar Bus A (Garantía de Estado Limpio)
  const estadoNuevoB = obtenerEstadoInicialWizardBus(null);
  assert(estadoNuevoB.paso === 1, 'Bus B tras cerrar Bus A vuelve a Paso 1');
  assert(estadoNuevoB.numeroDisco === '', 'Bus B no conserva el disco del Bus A');
  assert(estadoNuevoB.placa === '', 'Bus B no conserva la placa del Bus A');
  assert(estadoNuevoB.marca === 'Hino', 'Bus B vuelve a la marca por defecto (Hino)');
  assert(estadoNuevoB.carroceria === 'Marcopolo', 'Bus B vuelve a la carrocería por defecto');
  assert(estadoNuevoB.distribucionPersonalizada === null, 'Bus B no arrastra croquis del Bus A');
  assert(estadoNuevoB.esPersonalizado === false, 'Bus B no arrastra flag de personalización');
  assert(estadoNuevoB.errorAlerta === null, 'Bus B no arrastra errores del Bus A');

  // --------------------------------------------------------------------------
  // TEST 9: Grilla Común y Normalización de Pisos (ECU-3 / Tarea A)
  // --------------------------------------------------------------------------
  // 1. Configuración con pisos desiguales: Piso 1 (5 filas), Piso 2 (11 filas)
  const croquisDesigual: ConfiguracionCroquis = {
    tipoBus: 'INTERPROVINCIAL',
    pisos: 2,
    capacidadTotal: 56,
    asientosVipCount: 12,
    asientosNormalCount: 44,
    asientosVipNumeros: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    plantas: [
      {
        piso: 1,
        filas: 5,
        columnas: 5,
        elementos: [
          { id: 'p1-0-0', fila: 0, columna: 0, tipo: 'chofer', etiqueta: 'Chofer' },
          { id: 'p1-1-0', fila: 1, columna: 0, tipo: 'asiento_vip', numero: 1, categoria: 'vip' },
          { id: 'p1-1-1', fila: 1, columna: 1, tipo: 'asiento_vip', numero: 2, categoria: 'vip' },
          { id: 'p1-4-0', fila: 4, columna: 0, tipo: 'bano', etiqueta: 'Baño' },
        ],
      },
      {
        piso: 2,
        filas: 11,
        columnas: 5,
        elementos: [
          { id: 'p2-0-0', fila: 0, columna: 0, tipo: 'asiento_normal', numero: 13, categoria: 'normal' },
          { id: 'p2-10-0', fila: 10, columna: 0, tipo: 'asiento_normal', numero: 56, categoria: 'normal' },
        ],
      },
    ],
  };

  const normalizado = normalizarPisosConfiguracion(croquisDesigual);
  assert(normalizado.plantas[0].filas === 11, 'Piso 1 se expande a 11 filas (igual al máximo)');
  assert(normalizado.plantas[1].filas === 11, 'Piso 2 conserva 11 filas');
  assert(normalizado.plantas[0].columnas === 5, 'Piso 1 tiene 5 columnas');
  assert(normalizado.plantas[1].columnas === 5, 'Piso 2 tiene 5 columnas');

  // Verificar que el asiento VIP y el baño no se perdieron en el Piso 1
  const vipP1 = normalizado.plantas[0].elementos.find((e) => e.fila === 1 && e.columna === 0);
  assert(vipP1?.tipo === 'asiento_vip' && vipP1?.numero === 1, 'Asiento VIP en Piso 1 se preserva intacto');
  const banoP1 = normalizado.plantas[0].elementos.find((e) => e.fila === 4 && e.columna === 0);
  assert(banoP1?.tipo === 'bano', 'Elemento Baño en Piso 1 se preserva intacto');

  // Verificar que las nuevas filas del Piso 1 se rellenaron con 'vacio'
  const celdaNuevaP1 = normalizado.plantas[0].elementos.find((e) => e.fila === 10 && e.columna === 0);
  assert(celdaNuevaP1?.tipo === 'vacio', 'Filas rellenadas en Piso 1 son de tipo vacío');
  assert(normalizado.plantas[0].elementos.length === 11 * 5, 'Piso 1 contiene exactamente 55 celdas (11x5)');
  assert(normalizado.plantas[1].elementos.length === 11 * 5, 'Piso 2 contiene exactamente 55 celdas (11x5)');

  // 2. Configuración con un solo piso
  const croquisUnPiso: ConfiguracionCroquis = {
    tipoBus: 'URBANO',
    pisos: 1,
    capacidadTotal: 40,
    asientosVipCount: 0,
    asientosNormalCount: 40,
    asientosVipNumeros: [],
    plantas: [
      {
        piso: 1,
        filas: 8,
        columnas: 5,
        elementos: [{ id: '1', fila: 0, columna: 0, tipo: 'asiento_normal', numero: 1, categoria: 'normal' }],
      },
    ],
  };
  const normUnPiso = normalizarPisosConfiguracion(croquisUnPiso);
  assert(normUnPiso.plantas.length === 1, 'Un solo piso mantiene 1 planta');
  assert(normUnPiso.plantas[0].filas === 8, 'Un solo piso conserva 8 filas');
  assert(normUnPiso.plantas[0].elementos.length === 8 * 5, 'Rellena las celdas faltantes del piso único');

  // 3. Validación de última fila vacía
  const plantasConAsientoEnUltimaFila = [
    {
      piso: 1 as const,
      filas: 5,
      columnas: 5,
      elementos: [{ id: 'el-4-0', fila: 4, columna: 0, tipo: 'asiento_normal' as const, numero: 5 }],
    },
    {
      piso: 2 as const,
      filas: 5,
      columnas: 5,
      elementos: [{ id: 'el-4-0-p2', fila: 4, columna: 0, tipo: 'vacio' as const }],
    },
  ];
  assert(
    esUltimaFilaVaciaEnTodosLosPisos(plantasConAsientoEnUltimaFila) === false,
    'Rechaza eliminar última fila si contiene asiento en algún piso'
  );

  const plantasConUltimaFilaVacia = [
    {
      piso: 1 as const,
      filas: 5,
      columnas: 5,
      elementos: [
        { id: 'el-3-0', fila: 3, columna: 0, tipo: 'asiento_normal' as const, numero: 5 },
        { id: 'el-4-0', fila: 4, columna: 0, tipo: 'vacio' as const },
        { id: 'el-4-2', fila: 4, columna: 2, tipo: 'pasillo' as const },
      ],
    },
    {
      piso: 2 as const,
      filas: 5,
      columnas: 5,
      elementos: [
        { id: 'el-4-0-p2', fila: 4, columna: 0, tipo: 'vacio' as const },
        { id: 'el-4-2-p2', fila: 4, columna: 2, tipo: 'pasillo' as const },
      ],
    },
  ];
  assert(
    esUltimaFilaVaciaEnTodosLosPisos(plantasConUltimaFilaVacia) === true,
    'Permite eliminar última fila si está vacía en todos los pisos'
  );

  return { exitosas, fallidas, detalles };
}


