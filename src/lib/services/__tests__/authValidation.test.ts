import { validarCelularEcuatoriano, validarContrasenaRegistro, validarCorreo, validarIngreso, validarRegistro } from '../authValidation';

export function ejecutarPruebasAuth() {
  const hoy = new Date(2026, 10, 15);
  const registro = {
    cedula: '1804567897',
    fechaNacimiento: '2000-01-01',
    correo: 'persona@correo.ec',
    telefono: '0991234567',
    contrasena: 'Sol-Luna-Mar',
  };
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
    [validarRegistro(registro, hoy) === null, 'Permite enviar un registro válido'],
    [validarRegistro({ ...registro, cedula: '1804567898' }, hoy)?.includes('cédula') === true, 'Bloquea el registro con una cédula inválida'],
    [validarRegistro({ ...registro, fechaNacimiento: '2026-11-16' }, hoy)?.includes('futura') === true, 'Bloquea el registro con una fecha futura'],
    [validarRegistro({ ...registro, telefono: '0291234567' }, hoy)?.includes('celular') === true, 'Bloquea el registro con un teléfono inválido'],
    [validarRegistro({ ...registro, contrasena: 'anterior' }, hoy)?.includes('12 caracteres') === true, 'Bloquea el registro con contraseña corta'],
    [validarIngreso(registro.correo, 'anterior') === null, 'Permite ingresar con una contraseña existente más corta'],
    [validarIngreso('persona@', 'anterior') !== null, 'Bloquea el ingreso con correo inválido'],
    [validarIngreso(registro.correo, '') !== null, 'Bloquea el ingreso sin contraseña'],
  ];
  const exitosas = casos.filter(([pasa]) => pasa).length;

  return {
    exitosas,
    fallidas: casos.length - exitosas,
    detalles: casos.map(([pasa, descripcion]) => (pasa ? 'PASS ' : 'FAIL ') + descripcion),
  };
}
