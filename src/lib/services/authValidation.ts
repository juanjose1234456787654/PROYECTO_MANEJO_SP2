import { validarCedulaEcuatoriana, validarFechaNacimientoRegistro } from './cedulaService';

export function validarCorreo(correo: string): boolean {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(correo.trim());
}

export function validarCelularEcuatoriano(celular: string): boolean {
  return /^09[0-9]{8}$/.test(celular.trim());
}

export const LONGITUD_MINIMA_CONTRASENA = 12;

export function validarContrasenaRegistro(contrasena: string): boolean {
  return Array.from(contrasena).length >= LONGITUD_MINIMA_CONTRASENA && contrasena.trim().length > 0;
}

export function validarIngreso(correo: string, contrasena: string): string | null {
  if (!validarCorreo(correo)) return 'Ingresa un correo electrónico válido.';
  if (!contrasena) return 'Ingresa tu contraseña.';
  return null;
}

interface DatosRegistro {
  cedula: string;
  fechaNacimiento: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

export function validarRegistro(datos: DatosRegistro, hoy?: Date): string | null {
  if (!validarCedulaEcuatoriana(datos.cedula)) {
    return 'Ingresa una cédula ecuatoriana válida de 10 dígitos.';
  }

  const errorFecha = validarFechaNacimientoRegistro(datos.fechaNacimiento, hoy);
  if (errorFecha) return errorFecha;

  if (!validarCorreo(datos.correo)) return 'Ingresa un correo electrónico válido.';
  if (!validarCelularEcuatoriano(datos.telefono)) {
    return 'Ingresa un celular ecuatoriano de 10 dígitos que empiece por 09.';
  }
  if (!validarContrasenaRegistro(datos.contrasena)) {
    return `Usa una contraseña de al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`;
  }
  return null;
}
