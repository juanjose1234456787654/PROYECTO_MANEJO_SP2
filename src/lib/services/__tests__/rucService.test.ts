import { validarRucCooperativa } from '../rucService';

export function ejecutarPruebasRucCooperativa() {
  const casos: [string, boolean, string][] = [
    ['1791234561001', true, 'RUC de sociedad con modulo 11 valido'],
    ['1791234562001', false, 'Digito verificador incorrecto'],
    ['179123456100', false, 'Longitud menor a 13 digitos'],
    ['1791234561A01', false, 'Caracter no numerico'],
    ['0091234564001', false, 'Provincia fuera de rango'],
    ['1781234563001', false, 'Tipo de contribuyente distinto de sociedad privada'],
    ['1791234561000', false, 'Codigo de establecimiento 000'],
  ];
  const resultados = casos.map(([ruc, esperado, detalle]) => ({
    pasa: validarRucCooperativa(ruc) === esperado,
    detalle,
  }));
  const exitosas = resultados.filter(({ pasa }) => pasa).length;

  return {
    exitosas,
    fallidas: resultados.length - exitosas,
    detalles: resultados.map(({ pasa, detalle }) => (pasa ? 'PASS ' : 'FAIL ') + detalle),
  };
}
