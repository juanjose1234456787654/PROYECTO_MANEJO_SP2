import {
  DEFAULT_PLANES_MEMBRESIA,
  calcularFechaVencimiento,
  resolverEstadoSuscripcion,
  estaSuscripcionVigente,
  validarActivacionPlanPorSuperAdmin,
  puedeDestacarRuta,
  construirResumenSuscripcion,
  ordenarResultadosConDestacadas,
} from '../planesDestacadosService';
import type { RutaDestacadaRow, SuscripcionCooperativaRow } from '../../types';

export function ejecutarPruebasPlanesDestacados(): {
  exitosas: number;
  fallidas: number;
  detalles: string[];
} {
  let exitosas = 0;
  let fallidas = 0;
  const detalles: string[] = [];

  const assert = (nombre: string, condicion: boolean, detalleError?: string) => {
    if (condicion) {
      exitosas += 1;
      detalles.push(`PASS: ${nombre}`);
    } else {
      fallidas += 1;
      detalles.push(`FAIL: ${nombre}${detalleError ? ` -> ${detalleError}` : ''}`);
    }
  };

  // 1. Planes predeterminados Normal, Plus, Premium
  const normal = DEFAULT_PLANES_MEMBRESIA.find((p) => p.nombre === 'Normal');
  const plus = DEFAULT_PLANES_MEMBRESIA.find((p) => p.nombre === 'Plus');
  const premium = DEFAULT_PLANES_MEMBRESIA.find((p) => p.nombre === 'Premium');
  assert(
    'Planes predeterminados tienen cupos 1, 3 y 8',
    normal?.cupoRutasDestacadas === 1 &&
      plus?.cupoRutasDestacadas === 3 &&
      premium?.cupoRutasDestacadas === 8
  );

  // 2. Cálculo de vencimiento a 30 días
  assert(
    'calcularFechaVencimiento suma 30 días correctamente',
    calcularFechaVencimiento('2026-11-01', 30) === '2026-12-01'
  );

  // 3. Expiración automática por fechaVencimiento < hoy
  const subVencida: SuscripcionCooperativaRow = {
    id: 'sub-1',
    cooperativaId: 'coop-1',
    planId: 'plan-plus',
    fechaInicio: '2026-10-01',
    fechaVencimiento: '2026-10-31',
    estado: 'ACTIVA',
    activadoPor: 'SuperAdmin',
    observacionPagoExterno: 'Ref 100',
    createdAt: null,
    updatedAt: null,
  };
  assert(
    'Expiración automática marca ACTIVA vencida como VENCIDA',
    resolverEstadoSuscripcion(subVencida, '2026-11-14') === 'VENCIDA' &&
      !estaSuscripcionVigente(subVencida, '2026-11-14')
  );

  const subVigente: SuscripcionCooperativaRow = {
    ...subVencida,
    id: 'sub-2',
    fechaInicio: '2026-11-01',
    fechaVencimiento: '2026-12-01',
    estado: 'ACTIVA',
  };
  assert(
    'Suscripción dentro de plazo permanece ACTIVA y vigente',
    resolverEstadoSuscripcion(subVigente, '2026-11-14') === 'ACTIVA' &&
      estaSuscripcionVigente(subVigente, '2026-11-14')
  );

  // 4. Permisos exclusivos de SuperAdmin para activar planes
  assert(
    'Solo SuperAdmin (admin) puede activar o suspender planes',
    validarActivacionPlanPorSuperAdmin('admin').permitido === true &&
      validarActivacionPlanPorSuperAdmin('cooperativa').permitido === false &&
      validarActivacionPlanPorSuperAdmin('usuario').permitido === false
  );

  // 5. Bloqueo si cooperativa intenta destacar ruta de otra cooperativa
  const evalOtraCoop = puedeDestacarRuta({
    rolEjecutor: 'cooperativa',
    cooperativaUsuarioId: 'coop-1',
    cooperativaRutaId: 'coop-2',
    frecuenciaId: 'frec-99',
    suscripcion: subVigente,
    plan: plus || null,
    rutasDestacadasActivasCoop: [],
    fechaReferencia: '2026-11-14',
  });
  assert(
    'Impide destacar ruta de otra cooperativa',
    evalOtraCoop.permitido === false
  );

  // 6. Bloqueo por plan vencido
  const evalVencido = puedeDestacarRuta({
    rolEjecutor: 'cooperativa',
    cooperativaUsuarioId: 'coop-1',
    cooperativaRutaId: 'coop-1',
    frecuenciaId: 'frec-1',
    suscripcion: subVencida,
    plan: plus || null,
    rutasDestacadasActivasCoop: [],
    fechaReferencia: '2026-11-14',
  });
  assert(
    'Impide destacar ruta cuando el plan está vencido',
    evalVencido.permitido === false
  );

  // 7. Cupo máximo por plan (Normal = 1) y permitir desactivar cuando está lleno
  const rutasNormal: RutaDestacadaRow[] = [
    {
      id: 'dest-1',
      cooperativaId: 'coop-1',
      frecuenciaId: 'frec-1',
      activa: true,
      createdAt: null,
    },
  ];
  const evalCupoLleno = puedeDestacarRuta({
    rolEjecutor: 'cooperativa',
    cooperativaUsuarioId: 'coop-1',
    cooperativaRutaId: 'coop-1',
    frecuenciaId: 'frec-2',
    suscripcion: { ...subVigente, planId: 'plan-normal' },
    plan: normal || null,
    rutasDestacadasActivasCoop: rutasNormal,
    fechaReferencia: '2026-11-14',
  });
  const evalDesactivar = puedeDestacarRuta({
    rolEjecutor: 'cooperativa',
    cooperativaUsuarioId: 'coop-1',
    cooperativaRutaId: 'coop-1',
    frecuenciaId: 'frec-1',
    suscripcion: { ...subVigente, planId: 'plan-normal' },
    plan: normal || null,
    rutasDestacadasActivasCoop: rutasNormal,
    fechaReferencia: '2026-11-14',
  });
  assert(
    'Respeta cupo máximo del plan Normal y permite quitar destacado',
    evalCupoLleno.permitido === false &&
      evalDesactivar.permitido === true &&
      evalDesactivar.accion === 'desactivar'
  );

  // 8. Resumen consolidado cuando expira: deja de exponer IDs destacadas
  const resumenExpirado = construirResumenSuscripcion(
    subVencida,
    plus || null,
    rutasNormal,
    '2026-11-14'
  );
  assert(
    'Resumen de suscripción vencida limpia frecuenciaIdsDestacadas',
    resumenExpirado.vigente === false &&
      resumenExpirado.estadoEfectivo === 'VENCIDA' &&
      resumenExpirado.frecuenciaIdsDestacadas.length === 0
  );

  // 9. Ordenamiento prioritario en resultados de búsqueda
  const catalogo = [
    { id: 'frec-a', hora: '06:00' },
    { id: 'frec-b', hora: '09:30' },
    { id: 'frec-c', hora: '07:15' },
    { id: 'frec-d', hora: '11:00' },
  ];
  const ordenados = ordenarResultadosConDestacadas(catalogo, ['frec-d', 'frec-b']);
  assert(
    'Ordena rutas destacadas primero y conserva orden horario dentro de cada bloque',
    ordenados.map((r) => r.id).join(',') === 'frec-b,frec-d,frec-a,frec-c',
    `Obtenido: ${ordenados.map((r) => r.id).join(',')}`
  );

  return { exitosas, fallidas, detalles };
}
