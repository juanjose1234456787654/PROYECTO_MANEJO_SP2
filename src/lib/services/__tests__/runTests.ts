import { ejecutarPruebasAuth } from './authValidation.test';
import { ejecutarPruebasTramos } from './tramosService.test';
import { ejecutarPruebasCedulaYTarifas } from './cedulaService.test';
import { ejecutarPruebasHojasRuta } from './hojasRutaService.test';
import { ejecutarPruebasFiltrosBusqueda } from '@/modules/busqueda/__tests__/busquedaFiltros.test';
import { ejecutarPruebasFlotaValidacion } from './flotaValidacionService.test';

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

console.log('================================================================');
console.log('SUITE 3: GESTIÓN DE HOJAS DE RUTA Y DÍAS DE PARADA ANT (ACTIVIDAD 3)');
console.log('================================================================');
const resHojasRuta = ejecutarPruebasHojasRuta();
for (const d of resHojasRuta.detalles) {
  console.log(d);
}

console.log('================================================================');
console.log('SUITE 4: FILTROS AVANZADOS EN EL BUSCADOR (ISSUE #17)');
console.log('================================================================');
const resFiltros = ejecutarPruebasFiltrosBusqueda();
for (const d of resFiltros.detalles) {
  console.log(d);
}

console.log('================================================================');
console.log('SUITE 5: VALIDACIÓN DE DISCO, PLACA Y ERRORES POSTGRES (ECU-3 / #67)');
console.log('================================================================');
const resFlota = ejecutarPruebasFlotaValidacion();
for (const d of resFlota.detalles) {
  console.log(d);
}

console.log('================================================================');
console.log('SUITE 6: VALIDACIONES DE INGRESO Y REGISTRO (RFC-008)');
console.log('================================================================');
const resAuth = ejecutarPruebasAuth();
for (const detalle of resAuth.detalles) {
  console.log(detalle);
}

const totalExitosas =
  resTramos.exitosas +
  resCedula.exitosas +
  resHojasRuta.exitosas +
  resFiltros.exitosas +
  resFlota.exitosas +
  resAuth.exitosas;
const totalFallidas =
  resTramos.fallidas +
  resCedula.fallidas +
  resHojasRuta.fallidas +
  resFiltros.fallidas +
  resFlota.fallidas +
  resAuth.fallidas;

console.log('================================================================');
console.log(`TOTAL GENERAL: ${totalExitosas} EXITOSAS | ${totalFallidas} FALLIDAS`);
console.log('================================================================');

if (totalFallidas > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
