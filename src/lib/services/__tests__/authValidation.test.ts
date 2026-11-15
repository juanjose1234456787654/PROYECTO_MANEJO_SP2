import { validarCelularEcuatoriano, validarContrasenaRegistro, validarCorreo } from '../authValidation';

export function ejecutarPruebasAuth() {
  const casos: [boolean, string][] = [
    [validarCorreo('  persona+prueba@correo.ec  '), 'Acepta un correo válido con espacios exteriores'],
    [!validarCorreo('persona@correo'), 'Rechaza un correo sin dominio completo'],
    [!validarCorreo('persona@@correo.ec'), 'Rechaza un correo con dos arrobas'],
    [validarCelularEcuatoriano('0991234567'), 'Acepta un celular de diez dígitos con prefijo 09'],
    [!validarCelularEcuatoriano('0291234567'), 'Rechaza un número con otro prefijo'],
    [!validarCelularEcuatoriano('099123456'), 'Rechaza un celular de nueve dígitos'],
    [validarContrasenaRegistro('Sol-Luna-Mar'), 'Acepta una contraseña de doce caracteres'],
    [!validarContrasenaRegistro('Sol-Luna-Ma'), 'Rechaza una contraseña demasiado corta'],
    [!validarContrasenaRegistro('            '), 'Rechaza una contraseña formada por espacios'],
  ];
  const exitosas = casos.filter(([pasa]) => pasa).length;

  return {
    exitosas,
    fallidas: casos.length - exitosas,
    detalles: casos.map(([pasa, descripcion]) => (pasa ? 'PASS ' : 'FAIL ') + descripcion),
  };
}
