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
