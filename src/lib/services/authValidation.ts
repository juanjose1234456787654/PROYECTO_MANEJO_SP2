export function validarCorreo(correo: string): boolean {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(correo.trim());
}

export function validarCelularEcuatoriano(celular: string): boolean {
  return /^09[0-9]{8}$/.test(celular.trim());
}
