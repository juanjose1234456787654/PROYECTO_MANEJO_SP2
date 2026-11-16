/**
 * ==============================================================================
 * MÓDULO: SERVICIO DE VALIDACIONES DE FLOTA Y BUSES (TICKET ECU-3 / #67)
 * Proyecto: EcuRutas - Sistema de Gestión de Transporte Interprovincial
 * ==============================================================================
 * Funciones puras para validación de datos vehiculares y traducción de
 * excepciones técnicas de PostgreSQL/Supabase a mensajes de usuario en español.
 * ==============================================================================
 */

import type {
  ValidacionDiscoResult,
  ValidacionPlacaResult,
  ConfiguracionCroquis,
  DerivacionAsientosResult,
  BusRow,
  TipoBus,
} from '@/lib/types';

/**
 * Valida que el nombre de una plantilla de asientos sea válido y no use el valor por defecto.
 *
 * @param nombre Cadena con el nombre de la plantilla.
 * @returns Objeto con ok, error si falla y nombreNormalizado si es válido.
 */
export function validarNombrePlantilla(nombre: string | null | undefined): {
  ok: boolean;
  error?: string;
  nombreNormalizado?: string;
} {
  if (!nombre || !nombre.trim()) {
    return {
      ok: false,
      error: 'El nombre de la plantilla es obligatorio.',
    };
  }

  const limpio = nombre.trim();
  const lower = limpio.toLowerCase();

  if (
    lower === 'nueva plantilla' ||
    lower === 'nueva plantilla de asientos' ||
    lower === 'plantilla' ||
    lower === 'plantilla sin nombre'
  ) {
    return {
      ok: false,
      error: 'Debe ingresar un nombre propio para la plantilla (no se permite "Nueva Plantilla").',
    };
  }

  if (limpio.length < 3) {
    return {
      ok: false,
      error: 'El nombre de la plantilla debe tener al menos 3 caracteres.',
    };
  }

  return {
    ok: true,
    nombreNormalizado: limpio,
  };
}

/**
 * Valida que el número de disco asignado al bus sea numérico y tenga entre 1 y 4 dígitos.
 *
 * @param numero Número de disco ingresado (número o cadena).
 * @returns ValidacionDiscoResult con estado booleano, valor numérico o mensaje en español.
 */
export function validarDiscoBus(numero: number | string | null | undefined): ValidacionDiscoResult {
  if (numero === null || numero === undefined) {
    return {
      ok: false,
      error: 'El número de disco es obligatorio.',
    };
  }

  const str = String(numero).trim();
  if (str === '') {
    return {
      ok: false,
      error: 'El número de disco no puede estar vacío.',
    };
  }

  // Validación estricta: solo dígitos (1 a 4)
  if (!/^[0-9]+$/.test(str)) {
    return {
      ok: false,
      error: 'El número de disco solo puede contener dígitos numéricos.',
    };
  }

  if (str.length > 4 || str.length < 1) {
    return {
      ok: false,
      error: 'El número de disco debe tener entre 1 y 4 dígitos (máximo 9999).',
    };
  }

  const numVal = parseInt(str, 10);
  if (numVal <= 0) {
    return {
      ok: false,
      error: 'El número de disco debe ser un número entero positivo mayor a cero.',
    };
  }

  return {
    ok: true,
    valor: numVal,
  };
}

/**
 * Formatea y valida la placa vehicular bajo la norma de tránsito ecuatoriana.
 * Estándar ANT: 3 letras del alfabeto, guion y 4 dígitos numéricos (Ej: ABC-0456).
 * Regla de compatibilidad: Si se ingresan 3 dígitos, antepone automáticamente el cero (ABC-456 -> ABC-0456).
 * Acepta variantes con o sin guion y en minúsculas (ej: abc456, ABC-456, abc-0456, ABC0456).
 *
 * @param placa Cadena con la placa ingresada.
 * @returns ValidacionPlacaResult con la placa normalizada canónicamente o el error.
 */
export function formatearYValidarPlaca(placa: string | null | undefined): ValidacionPlacaResult {
  if (!placa) {
    return {
      ok: false,
      error: 'La placa vehicular es obligatoria.',
    };
  }

  const limpia = placa.trim().toUpperCase();
  if (limpia === '') {
    return {
      ok: false,
      error: 'La placa vehicular no puede estar vacía.',
    };
  }

  // Patrón 1: 3 letras, guion opcional, 3 o 4 números
  // Grupos: (3 letras), (3 o 4 números)
  const regex = /^([A-Z]{3})-?([0-9]{3,4})$/;
  const match = limpia.match(regex);

  if (!match) {
    return {
      ok: false,
      error: 'La placa debe tener 3 letras seguidas de 3 o 4 números (Ej: ABC-0456 o ABC-456).',
    };
  }

  const letras = match[1];
  let digitos = match[2];

  // Si tiene 3 dígitos, anteponer cero (ABC-456 -> ABC-0456)
  if (digitos.length === 3) {
    digitos = `0${digitos}`;
  }

  const placaCanonica = `${letras}-${digitos}`;

  return {
    ok: true,
    valor: placaCanonica,
  };
}

/**
 * Mapea los códigos y restricciones de error de PostgreSQL/Supabase a mensajes amigables en español.
 * Garantiza que nunca se muestren cadenas crudas de SQL o índices técnicos al usuario final.
 *
 * @param error Objeto o mensaje de error capturado.
 * @returns Mensaje claro y comprensible en español indicando el campo en conflicto.
 */
export function mapearErrorPostgresBus(error: unknown): string {
  if (!error) {
    return 'Ocurrió un error inesperado al procesar la información del bus.';
  }

  let errorStr = '';
  let errorCode = '';

  if (typeof error === 'string') {
    errorStr = error;
  } else if (typeof error === 'object') {
    const errObj = error as { code?: string; message?: string; details?: string; hint?: string };
    errorCode = errObj.code || '';
    errorStr = `${errObj.message || ''} ${errObj.details || ''} ${errObj.hint || ''}`;
  }

  const upperStr = errorStr.toUpperCase();

  // 1. Violación de restricción UNIQUE (Código 23505)
  if (errorCode === '23505' || upperStr.includes('23505') || upperStr.includes('UNIQUE CONSTRAINT')) {
    if (upperStr.includes('BUS_COOP_NUMERO_UIDX') || upperStr.includes('BUS_NUMERO_KEY') || upperStr.includes('NUMERO')) {
      return 'El número de disco ya está registrado en tu cooperativa.';
    }
    if (upperStr.includes('BUS_PLACA_KEY') || upperStr.includes('PLACA')) {
      return 'La placa ya pertenece a otra unidad registrada.';
    }
    if (upperStr.includes('PLANTILLABUS') || upperStr.includes('PLANTILLA')) {
      return 'Ya existe una plantilla registrada con el mismo identificador o nombre en esta cooperativa.';
    }
    return 'Ya existe una unidad registrada con los mismos datos clave (disco o placa duplicada).';
  }

  // 2. Violación de restricción CHECK (Código 23514)
  if (errorCode === '23514' || upperStr.includes('23514') || upperStr.includes('CHECK CONSTRAINT')) {
    if (upperStr.includes('BUS_NUMERO_FORMATO')) {
      return 'El número de disco debe contener entre 1 y 4 dígitos numéricos.';
    }
    if (upperStr.includes('BUS_PLACA_FORMATO')) {
      return 'La placa debe tener un formato válido ecuatoriano (Ej: ABC-0456).';
    }
    return 'Uno de los campos no cumple con el formato reglamentario requerido.';
  }

  // 3. Clave foránea no encontrada (Código 23503)
  if (errorCode === '23503' || upperStr.includes('23503') || upperStr.includes('FOREIGN KEY')) {
    if (upperStr.includes('PLANTILLABUS') || upperStr.includes('PLANTILLAID')) {
      return 'La plantilla de asientos seleccionada no existe o no está disponible.';
    }
    if (upperStr.includes('COOPERATIVAID')) {
      return 'La cooperativa asignada no es válida o no existe.';
    }
    return 'Uno de los elementos asociados a la unidad no existe en la base de datos.';
  }

  // 4. Mensaje genérico amigable en español
  return 'No se pudo guardar la información de la unidad. Por favor, verifica los datos e intenta nuevamente.';
}

/**
 * Deriva automáticamente los números de asientos VIP, cantidad VIP, asientos normales y capacidad total
 * a partir de la configuración estructural de la plantilla o croquis del bus.
 *
 * Esta función es crucial para la integración con el ticket ECU-4 (Venta en Línea P1 / #67),
 * garantizando que los asientos VIP configurados visualmente se sincronicen de manera exacta con
 * la columna `Bus.asientosVIPNumeros` consumida por el módulo de búsqueda y selección de asientos.
 *
 * @param configuracion Objeto ConfiguracionCroquis con la distribución por plantas y elementos.
 * @returns DerivacionAsientosResult con los números VIP ordenados y contadores.
 */
export function derivarAsientosVIPNumeros(configuracion: ConfiguracionCroquis): DerivacionAsientosResult {
  const vipSet = new Set<number>();
  let vipCount = 0;
  let normalCount = 0;

  if (Array.isArray(configuracion.plantas)) {
    for (const planta of configuracion.plantas) {
      if (!Array.isArray(planta.elementos)) continue;
      for (const el of planta.elementos) {
        const esVip = el.tipo === 'asiento_vip' || (el.tipo === 'asiento_normal' && el.categoria === 'vip');
        const esNormal = el.tipo === 'asiento_normal' && el.categoria !== 'vip';

        if (esVip) {
          vipCount++;
          if (typeof el.numero === 'number' && el.numero > 0) {
            vipSet.add(el.numero);
          }
        } else if (esNormal) {
          normalCount++;
        }
      }
    }
  }

  const vipNums = Array.from(vipSet).sort((a, b) => a - b);
  const capacidadTotal = vipCount + normalCount;

  // Actualiza las propiedades sincronizadas en la configuración para persistencia coherente
  configuracion.asientosVipNumeros = vipNums;
  configuracion.asientosVipCount = vipCount;
  configuracion.asientosNormalCount = normalCount;
  configuracion.capacidadTotal = capacidadTotal;

  return {
    asientosVIPNumeros: vipNums,
    capacidadTotal,
    asientosVipCount: vipCount,
    asientosNormalCount: normalCount,
  };
}

/**
 * Estructura del estado del formulario del asistente de buses.
 */
export interface EstadoInicialWizardBus {
  paso: 1 | 2 | 3;
  tipoBus: TipoBus;
  grupoBusId: string | null;
  chasis: string;
  numeroDisco: string;
  placa: string;
  marca: string;
  carroceria: string;
  fotoUrl: string;
  plantillaSeleccionadaId: string;
  distribucionPersonalizada: ConfiguracionCroquis | null;
  esPersonalizado: boolean;
  errorAlerta: string | null;
  isSubmitting: boolean;
}

/**
 * Genera el estado limpio o precargado para el Asistente (Wizard) de Buses.
 * Garantiza que al abrir un nuevo registro todos los campos estén vacíos y en el paso 1,
 * o si se recibe una unidad para editar, precargue fielmente sus datos.
 *
 * @param busToEdit Unidad vehicular a editar, o null/undefined para un registro nuevo.
 * @returns EstadoInicialWizardBus limpio o inicializado.
 */
export function obtenerEstadoInicialWizardBus(
  busToEdit?: BusRow | null
): EstadoInicialWizardBus {
  return {
    paso: 1,
    tipoBus: (busToEdit?.tipoBus as TipoBus) || 'INTERPROVINCIAL',
    grupoBusId: busToEdit?.grupoBusId || null,
    chasis: busToEdit?.chasis || '',
    numeroDisco: busToEdit ? String(busToEdit.numero) : '',
    placa: busToEdit?.placa || '',
    marca: busToEdit?.marca || 'Hino',
    carroceria: busToEdit?.carroceria || 'Marcopolo',
    fotoUrl:
      busToEdit?.fotoUrl ||
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    plantillaSeleccionadaId: busToEdit?.plantillaId || '',
    distribucionPersonalizada: busToEdit?.distribucionAsientos
      ? JSON.parse(JSON.stringify(busToEdit.distribucionAsientos))
      : null,
    esPersonalizado: Boolean(busToEdit?.distribucionAsientos),
    errorAlerta: null,
    isSubmitting: false,
  };
}
