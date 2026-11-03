import { ejecutarPruebasTramos } from './tramosService.test';
import { ejecutarPruebasCedulaYTarifas } from './cedulaService.test';

console.log('================================================================');
console.log('SUITE 1: TRAMOS INTERMEDIOS Y TARIFAS PROPORCIONALES (ISSUE #14)');
console.log('================================================================');
const resTramos = ejecutarPruebasTramos();
for (const d of resTramos.detalles) {
  console.log(d);
}

console.log('================================================================');
console.log('SUITE 2: VALIDACIÓN DE CÉDULA Y DESCUENTOS POR LEY ANT (ISSUE #15)');
console.log('================================================================');
const resCedula = ejecutarPruebasCedulaYTarifas();
for (const d of resCedula.detalles) {
  console.log(d);
}

const totalExitosas = resTramos.exitosas + resCedula.exitosas;
const totalFallidas = resTramos.fallidas + resCedula.fallidas;

console.log('================================================================');
console.log(`TOTAL GENERAL: ${totalExitosas} EXITOSAS | ${totalFallidas} FALLIDAS`);
console.log('================================================================');

if (totalFallidas > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
