/**
 * ==============================================================================
 * MÓDULO: SERVICIO DE VALIDACIÓN DE CÉDULA ECUATORIANA (MÓDULO 10)
 * Proyecto: EcuRutas - Sistema de Gestión de Transporte Interprovincial
 * Institución: Universidad Técnica de Ambato (UTA)
 * ==============================================================================
 * Descripción:
 * Proporciona el algoritmo canónico de validación de la Cédula de Identidad
 * del Registro Civil de la República del Ecuador bajo el algoritmo Módulo 10.
 *
 * Criterios técnicos de validación:
 * 1. Longitud exacta: 10 dígitos numéricos (0-9).
 * 2. Código de provincia: Primeros dos dígitos entre 01 y 24, o 30 (Exterior).
 * 3. Tercer dígito: Estrictamente menor a 6 (< 6) para personas naturales.
 * 4. Algoritmo Módulo 10: Multiplicadores alternados [2, 1] en los primeros 9 dígitos,
 *    con resta de 9 si el producto >= 10, y residuo respecto a la decena superior.
 * ==============================================================================
 */

import type {
  ResultadoValidacionCedula,
} from '@/lib/types';

/**
 * Catálogo oficial de provincias del Ecuador según codificación del Registro Civil (INEC).
 */
export const PROVINCIAS_ECUADOR: Record<string, string> = {
  '01': 'Azuay',
  '02': 'Bolívar',
  '03': 'Cañar',
  '04': 'Carchi',
  '05': 'Cotopaxi',
  '06': 'Chimborazo',
  '07': 'El Oro',
  '08': 'Esmeraldas',
  '09': 'Guayas',
  '10': 'Imbabura',
  '11': 'Loja',
  '12': 'Los Ríos',
  '13': 'Manabí',
  '14': 'Morona Santiago',
  '15': 'Napo',
  '16': 'Pastaza',
  '17': 'Pichincha',
  '18': 'Tungurahua',
  '19': 'Zamora Chinchipe',
  '20': 'Galápagos',
  '21': 'Sucumbíos',
  '22': 'Orellana',
  '23': 'Santo Domingo de los Tsáchilas',
  '24': 'Santa Elena',
  '30': 'Ecuatorianos en el Exterior',
};

/**
 * Obtiene el nombre de la provincia asociada al código inicial de la cédula.
 * @param codigo Código de dos caracteres o numérico.
 */
export function obtenerProvincia(codigo: string | number): string | null {
  const pad = String(codigo).padStart(2, '0');
  return PROVINCIAS_ECUADOR[pad] || null;
}

/**
 * Valida de forma estricta una cédula de identidad ecuatoriana mediante el algoritmo de Módulo 10.
 *
 * @param cedula Cadena con la cédula a validar.
 * @returns true si la cédula es legítima según el Registro Civil del Ecuador, false en caso contrario.
 */
export function validarCedulaEcuatoriana(cedula: string): boolean {
  if (!cedula || typeof cedula !== 'string') return false;

  // Limpiar espacios en blanco o guiones
  const clean = cedula.trim().replace(/-/g, '');

  // 1. Debe contener exactamente 10 dígitos numéricos
  if (!/^\d{10}$/.test(clean)) return false;

  // 2. Descartar patrones repetitivos obvios (ej: 0000000000, 1111111111)
  if (/^(\d)\1{9}$/.test(clean)) return false;

  // 3. Validación de provincia: Primeros 2 dígitos deben estar en [01-24] o 30
  const provinciaCode = parseInt(clean.substring(0, 2), 10);
  const provinciaValida = (provinciaCode >= 1 && provinciaCode <= 24) || provinciaCode === 30;
  if (!provinciaValida) return false;

  // 4. Validación de tercer dígito: Para personas naturales debe ser menor a 6 (< 6)
  const tercerDigito = parseInt(clean.charAt(2), 10);
  if (tercerDigito >= 6) return false;

  // 5. Algoritmo de Módulo 10 sobre los 9 primeros dígitos
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    const digito = parseInt(clean.charAt(i), 10);
    let producto = digito * coeficientes[i];
    if (producto >= 10) {
      producto -= 9;
    }
    suma += producto;
  }

  // Dígito verificador esperado
  const residuo = suma % 10;
  const digitoVerificadorEsperado = residuo === 0 ? 0 : 10 - residuo;
  const digitoVerificadorReal = parseInt(clean.charAt(9), 10);

  return digitoVerificadorEsperado === digitoVerificadorReal;
}

/**
 * Realiza un análisis exhaustivo de la cédula devolviendo un resultado descriptivo
 * con provincia emisora y causa específica de error en caso de invalidez.
 *
 * @param cedula Cédula de identidad a evaluar.
 * @returns ResultadoValidacionCedula con detalle forense.
 */
export function validarCedulaDetallada(cedula: string): ResultadoValidacionCedula {
  if (!cedula || typeof cedula !== 'string') {
    return {
      valida: false,
      cedula: '',
      mensaje: 'El número de cédula no puede estar vacío.',
    };
  }

  const clean = cedula.trim().replace(/-/g, '');

  if (!/^\d+$/.test(clean)) {
    return {
      valida: false,
      cedula: clean,
      mensaje: 'La cédula contiene caracteres no numéricos.',
    };
  }

  if (clean.length !== 10) {
    return {
      valida: false,
      cedula: clean,
      mensaje: `Longitud incorrecta: se esperan 10 dígitos pero se recibieron ${clean.length}.`,
    };
  }

  if (/^(\d)\1{9}$/.test(clean)) {
    return {
      valida: false,
      cedula: clean,
      mensaje: 'La cédula no puede estar compuesta por un único dígito repetido.',
    };
  }

  const codigoProvincia = clean.substring(0, 2);
  const provinciaNum = parseInt(codigoProvincia, 10);
  const provincia = obtenerProvincia(codigoProvincia);

  if (!((provinciaNum >= 1 && provinciaNum <= 24) || provinciaNum === 30) || !provincia) {
    return {
      valida: false,
      cedula: clean,
      codigoProvincia,
      mensaje: `El código de provincia "${codigoProvincia}" no corresponde a ninguna provincia válida del Ecuador (01-24, 30).`,
    };
  }

  const tercerDigito = parseInt(clean.charAt(2), 10);
  if (tercerDigito >= 6) {
    return {
      valida: false,
      cedula: clean,
      codigoProvincia,
      provincia,
      mensaje: `El tercer dígito (${tercerDigito}) es inválido para persona natural (debe ser menor a 6).`,
    };
  }

  // Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    const digito = parseInt(clean.charAt(i), 10);
    let producto = digito * coeficientes[i];
    if (producto >= 10) {
      producto -= 9;
    }
    suma += producto;
  }

  const residuo = suma % 10;
  const digitoVerificadorEsperado = residuo === 0 ? 0 : 10 - residuo;
  const digitoVerificadorReal = parseInt(clean.charAt(9), 10);

  if (digitoVerificadorEsperado !== digitoVerificadorReal) {
    return {
      valida: false,
      cedula: clean,
      codigoProvincia,
      provincia,
      mensaje: `Dígito verificador incorrecto: se esperaba ${digitoVerificadorEsperado} pero se recibió ${digitoVerificadorReal}.`,
    };
  }

  return {
    valida: true,
    cedula: clean,
    codigoProvincia,
    provincia,
    mensaje: `Cédula legítima expedida en la provincia de ${provincia}.`,
  };
}
