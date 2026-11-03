import { ejecutarPruebasTramos } from './tramosService.test';

console.log('================================================================');
console.log('EJECUTANDO PRUEBAS DE TRAMOS INTERMEDIOS Y TARIFAS (ISSUE #14)');
console.log('================================================================');

const resultado = ejecutarPruebasTramos();

for (const d of resultado.detalles) {
  console.log(d);
}

console.log('================================================================');
console.log(`TOTAL EXITOSAS: ${resultado.exitosas} | FALLIDAS: ${resultado.fallidas}`);
console.log('================================================================');

if (resultado.fallidas > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

