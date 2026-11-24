export function validarRucCooperativa(valor: string): boolean {
  const ruc = valor.trim();
  if (!/^[0-9]{13}$/.test(ruc)) return false;

  const provincia = Number(ruc.slice(0, 2));
  const establecimiento = ruc.slice(10);
  if (provincia < 1 || provincia > 24 || ruc[2] !== '9' || establecimiento === '000') {
    return false;
  }

  const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = coeficientes.reduce((total, factor, indice) => total + Number(ruc[indice]) * factor, 0);
  const verificador = (11 - (suma % 11)) % 11;

  return verificador === Number(ruc[9]);
}
