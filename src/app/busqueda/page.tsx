'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { dataService } from '@/lib/services/dataService';
import { construirSecuenciaParadas } from '@/lib/services/tramosService';
import {
  validarCedulaDetallada,
  validarCedulaEcuatoriana,
  calcularTarifaFinal,
  calcularEdad,
} from '@/lib/services/cedulaService';
import {
  filtrarFrecuenciasAvanzado,
  contarFiltrosActivos,
  obtenerMarcasYCarroceriasDisponibles,
  type TipoAsientoFiltro,
  type TipoViajeFiltro,
  type FiltrosBusquedaAvanzados,
} from '@/modules/busqueda';
import type {
  FrecuenciaRow,
  CooperativaRow,
  BusRow,
  RutaRow,
  BoletoRow,
  ParadaFrecuenciaRow,
  ParadaRuta,
  CalculoTarifaTramo,
  ResultadoValidacionCedula,
} from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SeatSelector } from '@/components/bus/SeatSelector';
import { IconBus } from '@/components/ui/Icons';
import { obtenerImagenesFlotaCooperativa, resolverSlugCooperativa } from '@/data/buses-galeria';

function fechaLocalActual() {
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  return hoy.toISOString().split('T')[0];
}

function mostrarDuracion(duracion?: string | number | null) {
  const valor = String(duracion ?? '').trim();
  if (!valor) return 'Duración no registrada';
  if (!/^\d+$/.test(valor)) return valor;

  const minutos = Number(valor);
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return [horas > 0 ? `${horas} h` : '', minutosRestantes > 0 ? `${minutosRestantes} min` : '']
    .filter(Boolean)
    .join(' ') || '0 min';
}

function BusquedaContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Datos base cargados asíncronamente desde dataService (sin mockData)
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado del panel colapsable en móvil
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Estados de los 4 filtros avanzados + ruta/fecha inicializados desde searchParams
  const [origenFiltro, setOrigenFiltro] = useState(() => searchParams.get('origen') || '');
  const [destinoFiltro, setDestinoFiltro] = useState(() => searchParams.get('destino') || '');
  const [fechaFiltro, setFechaFiltro] = useState(
    () => searchParams.get('fecha') || fechaLocalActual()
  );
  const [pasajerosFiltro, setPasajerosFiltro] = useState(() => {
    const cantidad = Number(searchParams.get('pasajeros') || 1);
    return Number.isInteger(cantidad) ? Math.min(6, Math.max(1, cantidad)) : 1;
  });
  const [coopFiltro, setCoopFiltro] = useState(() => searchParams.get('cooperativa') || '');
  const [tipoAsientoFiltro, setTipoAsientoFiltro] = useState<TipoAsientoFiltro>(
    () => (searchParams.get('tipoAsiento') as TipoAsientoFiltro) || 'todos'
  );
  const [chasisFiltro, setChasisFiltro] = useState(() => searchParams.get('chasisCarroceria') || '');
  const [tipoViajeFiltro, setTipoViajeFiltro] = useState<TipoViajeFiltro>(
    () => (searchParams.get('tipoViaje') as TipoViajeFiltro) || 'todos'
  );

  // Sincronizar el estado si el usuario usa los botones Atrás / Adelante del navegador
  useEffect(() => {
    const qOrigen = searchParams.get('origen') || '';
    const qDestino = searchParams.get('destino') || '';
    const qFecha = searchParams.get('fecha') || fechaLocalActual();
    const qPasajeros = Number(searchParams.get('pasajeros') || 1);
    const qCoop = searchParams.get('cooperativa') || '';
    const qAsiento = (searchParams.get('tipoAsiento') as TipoAsientoFiltro) || 'todos';
    const qChasis = searchParams.get('chasisCarroceria') || '';
    const qViaje = (searchParams.get('tipoViaje') as TipoViajeFiltro) || 'todos';

    setOrigenFiltro(qOrigen);
    setDestinoFiltro(qDestino);
    setFechaFiltro(qFecha);
    setPasajerosFiltro(Number.isInteger(qPasajeros) ? Math.min(6, Math.max(1, qPasajeros)) : 1);
    setCoopFiltro(qCoop);
    setTipoAsientoFiltro(qAsiento);
    setChasisFiltro(qChasis);
    setTipoViajeFiltro(qViaje);
  }, [searchParams]);

  // Actualización de searchParams en la URL sin recargar la página (useRouter + usePathname)
  const sincronizarFiltrosConUrl = useCallback(
    (nuevosFiltros: FiltrosBusquedaAvanzados) => {
      const params = new URLSearchParams();
      params.set('pasajeros', String(pasajerosFiltro));

      if (nuevosFiltros.cooperativaId && nuevosFiltros.cooperativaId.trim() !== '') {
        params.set('cooperativa', nuevosFiltros.cooperativaId.trim());
      }
      if (nuevosFiltros.tipoAsiento && nuevosFiltros.tipoAsiento !== 'todos') {
        params.set('tipoAsiento', nuevosFiltros.tipoAsiento);
      }
      if (nuevosFiltros.chasisCarroceria && nuevosFiltros.chasisCarroceria.trim() !== '') {
        params.set('chasisCarroceria', nuevosFiltros.chasisCarroceria.trim());
      }
      if (nuevosFiltros.tipoViaje && nuevosFiltros.tipoViaje !== 'todos') {
        params.set('tipoViaje', nuevosFiltros.tipoViaje);
      }
      if (nuevosFiltros.origen && nuevosFiltros.origen.trim() !== '') {
        params.set('origen', nuevosFiltros.origen.trim());
      }
      if (nuevosFiltros.destino && nuevosFiltros.destino.trim() !== '') {
        params.set('destino', nuevosFiltros.destino.trim());
      }
      if (nuevosFiltros.fecha && nuevosFiltros.fecha.trim() !== '') {
        params.set('fecha', nuevosFiltros.fecha.trim());
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router, pasajerosFiltro]
  );

  // Manejadores reactivos individuales con actualización de URL
  const handleCoopChange = (val: string) => {
    setCoopFiltro(val);
    sincronizarFiltrosConUrl({
      cooperativaId: val,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: chasisFiltro,
      tipoViaje: tipoViajeFiltro,
      origen: origenFiltro,
      destino: destinoFiltro,
      fecha: fechaFiltro,
    });
  };

  const handleTipoAsientoChange = (val: TipoAsientoFiltro) => {
    setTipoAsientoFiltro(val);
    sincronizarFiltrosConUrl({
      cooperativaId: coopFiltro,
      tipoAsiento: val,
      chasisCarroceria: chasisFiltro,
      tipoViaje: tipoViajeFiltro,
      origen: origenFiltro,
      destino: destinoFiltro,
      fecha: fechaFiltro,
    });
  };

  const handleChasisChange = (val: string) => {
    setChasisFiltro(val);
    sincronizarFiltrosConUrl({
      cooperativaId: coopFiltro,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: val,
      tipoViaje: tipoViajeFiltro,
      origen: origenFiltro,
      destino: destinoFiltro,
      fecha: fechaFiltro,
    });
  };

  const handleTipoViajeChange = (val: TipoViajeFiltro) => {
    setTipoViajeFiltro(val);
    sincronizarFiltrosConUrl({
      cooperativaId: coopFiltro,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: chasisFiltro,
      tipoViaje: val,
      origen: origenFiltro,
      destino: destinoFiltro,
      fecha: fechaFiltro,
    });
  };

  const handleOrigenChange = (val: string) => {
    setOrigenFiltro(val);
    sincronizarFiltrosConUrl({
      cooperativaId: coopFiltro,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: chasisFiltro,
      tipoViaje: tipoViajeFiltro,
      origen: val,
      destino: destinoFiltro,
      fecha: fechaFiltro,
    });
  };

  const handleDestinoChange = (val: string) => {
    setDestinoFiltro(val);
    sincronizarFiltrosConUrl({
      cooperativaId: coopFiltro,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: chasisFiltro,
      tipoViaje: tipoViajeFiltro,
      origen: origenFiltro,
      destino: val,
      fecha: fechaFiltro,
    });
  };

  const handleFechaChange = (val: string) => {
    setFechaFiltro(val);
    sincronizarFiltrosConUrl({
      cooperativaId: coopFiltro,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: chasisFiltro,
      tipoViaje: tipoViajeFiltro,
      origen: origenFiltro,
      destino: destinoFiltro,
      fecha: val,
    });
  };

  // Botón "Limpiar filtros": resetea todos los estados y limpia los searchParams de la URL
  const handleLimpiarFiltros = () => {
    setOrigenFiltro('');
    setDestinoFiltro('');
    setCoopFiltro('');
    setTipoAsientoFiltro('todos');
    setChasisFiltro('');
    setTipoViajeFiltro('todos');
    router.replace(pathname, { scroll: false });
  };

  // Carga inicial del catálogo desde dataService
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [frecData, coopData, busData, rutaData, paradasData] = await Promise.all([
          dataService.getFrecuencias(),
          dataService.getCooperativas(),
          dataService.getBuses(),
          dataService.getRutas(),
          dataService.getParadas(),
        ]);
        setFrecuencias(frecData);
        setCooperativas(coopData);
        setBuses(busData);
        setRutas(rutaData);
        setParadas(paradasData);

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setAuthUserId(user.id);
          const { data: perfil } = await supabase
            .from('Usuario')
            .select('nombre, cedula, rol')
            .eq('id', user.id)
            .maybeSingle();
          const p = perfil as { nombre?: string; cedula?: string | null; rol?: string | null } | null;
          const rolBruto = p?.rol || (user.user_metadata?.rol as string | undefined) || 'usuario';
          const rolNormalizado = rolBruto === 'cliente' ? 'usuario' : rolBruto === 'personal_bus' ? 'chofer' : rolBruto;
          setRolUsuario(rolNormalizado);
          setMetodoPago(['admin', 'cooperativa', 'oficinista'].includes(rolNormalizado) ? 'taquilla' : 'deposito');
          if (p?.nombre) setNombre(p.nombre);
          if (p?.cedula) {
            setCedula(p.cedula);
            const clean = p.cedula.trim().replace(/-/g, '');
            if (clean.length === 10) setCedulaInfo(validarCedulaDetallada(clean));
          }
        } else {
          setAuthUserId(null);
          setRolUsuario('usuario');
          setMetodoPago('deposito');
        }
      } catch (err) {
        console.error('Error al cargar catálogo de transporte desde dataService:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Si la URL trae un slug de cooperativa (ej. ?cooperativa=transportes-banos), resolver al ID real
  useEffect(() => {
    if (!coopFiltro || cooperativas.length === 0) return;
    const existeExacto = cooperativas.some((c) => c.id === coopFiltro);
    if (existeExacto) return;

    const slugBuscado = resolverSlugCooperativa(coopFiltro);
    if (!slugBuscado) return;

    const candidatas = cooperativas.filter((c) => resolverSlugCooperativa(c) === slugBuscado);
    const conFrecuencia = candidatas.find((c) => frecuencias.some((f) => f.cooperativaId === c.id));
    const elegida = conFrecuencia ?? candidatas[0];
    if (elegida && elegida.id !== coopFiltro) {
      setCoopFiltro(elegida.id);
    }
  }, [coopFiltro, cooperativas, frecuencias]);

  // Lista única de ciudades para autocompletado/selects
  const todasCiudades = useMemo(() => {
    return Array.from(
      new Set([
        ...frecuencias.map((f) => f.origen),
        ...frecuencias.map((f) => f.destino),
        ...paradas.map((p) => p.ciudad),
      ])
    ).sort();
  }, [frecuencias, paradas]);

  // Lista de marcas, modelos y carrocerías disponibles
  const marcasDisponibles = useMemo(() => {
    return obtenerMarcasYCarroceriasDisponibles(buses);
  }, [buses]);

  // Conteo de filtros activos para badges y panel móvil
  const conteoActivos = useMemo(() => {
    return contarFiltrosActivos({
      origen: origenFiltro,
      destino: destinoFiltro,
      cooperativaId: coopFiltro,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: chasisFiltro,
      tipoViaje: tipoViajeFiltro,
    });
  }, [origenFiltro, destinoFiltro, coopFiltro, tipoAsientoFiltro, chasisFiltro, tipoViajeFiltro]);

  // Filtrado reactivo de frecuencias combinando los 4 filtros de forma pura
  const filteredFrecuencias = useMemo(() => {
    return filtrarFrecuenciasAvanzado(frecuencias, buses, paradas, {
      origen: origenFiltro,
      destino: destinoFiltro,
      cooperativaId: coopFiltro,
      tipoAsiento: tipoAsientoFiltro,
      chasisCarroceria: chasisFiltro,
      tipoViaje: tipoViajeFiltro,
    });
  }, [frecuencias, buses, paradas, origenFiltro, destinoFiltro, coopFiltro, tipoAsientoFiltro, chasisFiltro, tipoViajeFiltro]);

  const [disponibilidadPorFrecuencia, setDisponibilidadPorFrecuencia] = useState<Record<string, number>>({});
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [frecuenciaExpandida, setFrecuenciaExpandida] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function cargarDisponibilidad() {
      setLoadingDisponibilidad(true);
      const candidatas = filteredFrecuencias.flatMap((frecuencia) => {
        const ruta = rutas.find((item) => item.frecuenciaId === frecuencia.id &&
          item.fecha.split('T')[0] === fechaFiltro &&
          ['programada', 'aprobada', 'approved'].includes(item.estado.toLowerCase()) && !!item.busId);
        const bus = ruta ? buses.find((item) => item.id === ruta.busId && item.activo) : undefined;
        const secuencia = construirSecuenciaParadas(frecuencia, paradas.filter((p) => p.frecuenciaId === frecuencia.id));
        const origen = (origenFiltro ? secuencia.find((p) => p.ciudad.toLowerCase().includes(origenFiltro.toLowerCase())) : secuencia[0]);
        const destino = (destinoFiltro ? secuencia.find((p) => p.ciudad.toLowerCase().includes(destinoFiltro.toLowerCase())) : secuencia[secuencia.length - 1]);
        if (!ruta || !bus || !origen || !destino || origen.orden >= destino.orden) return [];
        return [{ frecuencia, ruta, bus, origen, destino }];
      });

      const ids = await Promise.all(candidatas.map(async ({ frecuencia, ruta, bus, origen, destino }) => {
        const res = await dataService.fetchAsientosOcupadosEnTramo(ruta.id, origen.id, destino.id);
        const ocupados = res.error
          ? new Set(Array.from({ length: bus.capacidad }, (_, index) => index + 1))
          : new Set((res.data ?? []).filter((numero) => numero >= 1 && numero <= bus.capacidad));
        return { id: frecuencia.id, disponibles: Math.max(0, bus.capacidad - ocupados.size) };
      }));
      if (!cancelado) {
        setDisponibilidadPorFrecuencia(Object.fromEntries(ids.map((item) => [item.id, item.disponibles])));
        setLoadingDisponibilidad(false);
      }
    }
    cargarDisponibilidad();
    return () => { cancelado = true; };
  }, [filteredFrecuencias, rutas, buses, paradas, fechaFiltro, pasajerosFiltro, origenFiltro, destinoFiltro]);

  const resultadosDisponibles = filteredFrecuencias.filter((frecuencia) =>
    (disponibilidadPorFrecuencia[frecuencia.id] ?? 0) >= pasajerosFiltro
  );

  const getCoop = (id: string) => cooperativas.find((c) => c.id === id);

  // ==========================================
  // ESTADO Y LÓGICA DEL MODAL DE RESERVA / COMPRA
  // ==========================================
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaRow | null>(null);
  const [selectedRuta, setSelectedRuta] = useState<RutaRow | null>(null);
  const [selectedBus, setSelectedBus] = useState<BusRow | null>(null);
  const [secuenciaParadas, setSecuenciaParadas] = useState<ParadaRuta[]>([]);
  const [selectedOrigenId, setSelectedOrigenId] = useState<string>('');
  const [selectedDestinoId, setSelectedDestinoId] = useState<string>('');
  const [calculoTramo, setCalculoTramo] = useState<CalculoTarifaTramo | null>(null);
  const [errorTramo, setErrorTramo] = useState<string | null>(null);
  const [loadingTramo, setLoadingTramo] = useState<boolean>(false);

  // Selección de asiento
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);

  // Datos del pasajero y validación de cédula (Issue #15)
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [rolUsuario, setRolUsuario] = useState('usuario');
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [cedulaInfo, setCedulaInfo] = useState<ResultadoValidacionCedula | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [esDiscapacitado, setEsDiscapacitado] = useState(false);
  const [porcentajeDiscapacidad, setPorcentajeDiscapacidad] = useState<number>(40);
  const [carnetConadis, setCarnetConadis] = useState('');

  // Método de pago y emisión
  const [metodoPago, setMetodoPago] = useState<'deposito' | 'transferencia' | 'taquilla'>('deposito');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const esPersonalDeVenta = ['admin', 'cooperativa', 'oficinista'].includes(rolUsuario);
  const opcionesMetodoPago = esPersonalDeVenta
    ? [
        { value: 'taquilla' as const, label: 'En taquilla' },
        { value: 'transferencia' as const, label: 'Transferencia' },
      ]
    : [
        { value: 'deposito' as const, label: 'Depósito' },
        { value: 'transferencia' as const, label: 'Transferencia' },
      ];
  const [submitting, setSubmitting] = useState(false);
  const [boletosGenerados, setBoletosGenerados] = useState<BoletoRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const actualizarTramoYAsientos = useCallback(
    async (
      frec: FrecuenciaRow,
      rutaId: string,
      origenId: string,
      destinoId: string,
      _secuencia: ParadaRuta[]
    ) => {
      if (!origenId || !destinoId) return;
      setLoadingTramo(true);
      setErrorTramo(null);

      const validacion = await dataService.validarTramo(frec.id, origenId, destinoId);
      if (validacion.error || !validacion.data?.valido) {
        setErrorTramo(validacion.error ?? validacion.data?.mensaje ?? 'Tramo seleccionado inválido.');
        setCalculoTramo(null);
        setLoadingTramo(false);
        return;
      }

      const calculoRes = await dataService.calcularTarifaTramo(frec.id, origenId, destinoId);
      if (calculoRes.error || !calculoRes.data) {
        setErrorTramo(calculoRes.error ?? 'No se pudo calcular la tarifa del tramo.');
        setCalculoTramo(null);
      } else {
        setCalculoTramo(calculoRes.data);
      }

      const ocupadosRes = await dataService.fetchAsientosOcupadosEnTramo(rutaId, origenId, destinoId);
      if (ocupadosRes.error) {
        setErrorTramo('No se pudo verificar la disponibilidad de asientos para este tramo. Inténtalo de nuevo.');
        setLoadingTramo(false);
        return;
      }
      const nuevosOcupados = ocupadosRes.data ?? [];
      setOccupiedSeats(nuevosOcupados);

      setSelectedSeats((currentSeats) => currentSeats.filter((seat) => !nuevosOcupados.includes(seat)));

      setLoadingTramo(false);
    },
    []
  );

  const handleOpenBooking = async (frec: FrecuenciaRow) => {
    setSelectedFrecuencia(frec);
    setSelectedSeats([]);
    setBoletosGenerados([]);
    setErrorMsg(null);
    setErrorTramo(null);

    // Build the choices from the frequency already displayed in search. This
    // keeps the origin/destination selects usable even if creating the daily
    // Route row fails because of Supabase permissions or configuration.
    const paradasFrecuencia = await dataService.getParadas(frec.id);
    const secuencia = construirSecuenciaParadas(frec, paradasFrecuencia);
    setSecuenciaParadas(secuencia);

    let defOrigen = secuencia[0]?.id || '';
    if (origenFiltro) {
      const match = secuencia.find((p) =>
        p.ciudad.toLowerCase().includes(origenFiltro.toLowerCase())
      );
      if (match) defOrigen = match.id;
    }

    let defDestino = secuencia[secuencia.length - 1]?.id || '';
    if (destinoFiltro) {
      const match = secuencia.find((p) =>
        p.ciudad.toLowerCase().includes(destinoFiltro.toLowerCase())
      );
      if (match) defDestino = match.id;
    }
    setSelectedOrigenId(defOrigen);
    setSelectedDestinoId(defDestino);

    const ruta = rutas.find((r) => r.frecuenciaId === frec.id && r.fecha.split('T')[0] === fechaFiltro && ['programada', 'aprobada', 'approved'].includes(r.estado.toLowerCase()) && !!r.busId);
    if (!ruta) {
      setSelectedRuta(null);
      setErrorMsg('Esta frecuencia no tiene una hoja de ruta aprobada y un bus asignado para la fecha seleccionada.');
      return;
    }
    setSelectedRuta(ruta);

    const busObj = buses.find((b) => b.id === ruta.busId && b.activo);
    if (!busObj) {
      setSelectedRuta(null);
      setErrorMsg('El bus asignado a esta ruta no está activo.');
      return;
    }
    setSelectedBus(busObj);

    if (defOrigen && defDestino && ruta) {
      await actualizarTramoYAsientos(frec, ruta.id, defOrigen, defDestino, secuencia);
    }
  };

  // Sincronización en tiempo real de asientos ocupados cada 3 segundos mientras el modal está abierto
  useEffect(() => {
    if (!selectedFrecuencia || !selectedRuta || !selectedOrigenId || !selectedDestinoId) return;

    const timer = setInterval(async () => {
      try {
        const ocupadosRes = await dataService.fetchAsientosOcupadosEnTramo(
          selectedRuta.id,
          selectedOrigenId,
          selectedDestinoId
        );
        if (ocupadosRes.data) {
          setOccupiedSeats(ocupadosRes.data);
          setSelectedSeats((curr) => curr.filter((seat) => !ocupadosRes.data?.includes(seat)));
        }
      } catch {
        // Ignorar fallos de red silenciosos en polling
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [selectedFrecuencia, selectedRuta, selectedOrigenId, selectedDestinoId]);

  const handleCambioOrigen = (nuevoOrigenId: string) => {
    setSelectedOrigenId(nuevoOrigenId);
    if (selectedFrecuencia && selectedRuta) {
      actualizarTramoYAsientos(
        selectedFrecuencia,
        selectedRuta.id,
        nuevoOrigenId,
        selectedDestinoId,
        secuenciaParadas
      );
    }
  };

  const handleCambioDestino = (nuevoDestinoId: string) => {
    setSelectedDestinoId(nuevoDestinoId);
    if (selectedFrecuencia && selectedRuta) {
      actualizarTramoYAsientos(
        selectedFrecuencia,
        selectedRuta.id,
        selectedOrigenId,
        nuevoDestinoId,
        secuenciaParadas
      );
    }
  };

  const handleCedulaChange = (valor: string) => {
    setCedula(valor);
    const clean = valor.trim().replace(/-/g, '');
    if (clean.length === 10) {
      const res = validarCedulaDetallada(clean);
      setCedulaInfo(res);
    } else if (clean.length > 0) {
      setCedulaInfo({
        valida: false,
        cedula: clean,
        mensaje: `Cédula incompleta (${clean.length}/10 dígitos).`,
      });
    } else {
      setCedulaInfo(null);
    }
  };

  const handleCloseBooking = () => {
    setSelectedFrecuencia(null);
    setSelectedRuta(null);
    setSelectedSeats([]);
    setBoletosGenerados([]);
    setCalculoTramo(null);
    setErrorTramo(null);
    setCedulaInfo(null);
    setComprobanteFile(null);
    setComprobanteUrl('');
  };

  const paradaOrigenObj = secuenciaParadas.find((p) => p.id === selectedOrigenId);
  const paradaDestinoObj = secuenciaParadas.find((p) => p.id === selectedDestinoId);
  const nombreOrigen = paradaOrigenObj?.ciudad || selectedFrecuencia?.origen || 'Origen';
  const nombreDestino = paradaDestinoObj?.ciudad || selectedFrecuencia?.destino || 'Destino';

  const precioBaseTramo = calculoTramo?.precioCalculadoTramo ?? selectedFrecuencia?.precioBase ?? 0;
  const isVipSeat = selectedBus?.asientosVIPNumeros?.includes(selectedSeats[0] || -1);

  const desgloseTarifa = useMemo(() => {
    return calcularTarifaFinal(
      precioBaseTramo,
      fechaNacimiento || null,
      esDiscapacitado,
      esDiscapacitado ? porcentajeDiscapacidad : undefined,
      isVipSeat
    );
  }, [precioBaseTramo, fechaNacimiento, esDiscapacitado, porcentajeDiscapacidad, isVipSeat]);
  const tarifasSeleccionadas = useMemo(() => selectedSeats.map((asiento) => {
    const vip = selectedBus?.asientosVIPNumeros?.includes(asiento) ?? false;
    return calcularTarifaFinal(
      precioBaseTramo,
      fechaNacimiento || null,
      esDiscapacitado,
      esDiscapacitado ? porcentajeDiscapacidad : undefined,
      vip
    );
  }), [selectedSeats, selectedBus, precioBaseTramo, fechaNacimiento, esDiscapacitado, porcentajeDiscapacidad]);
  const totalCompra = tarifasSeleccionadas.reduce((total, tarifa) => total + tarifa.totalConVip, 0);
  const totalRecargoVip = tarifasSeleccionadas.reduce((total, tarifa) => total + tarifa.recargoVip, 0);
  const totalDescuento = tarifasSeleccionadas.reduce((total, tarifa) => total + tarifa.valorDescuento, 0);

  const edadCalculada = useMemo(() => {
    return fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  }, [fechaNacimiento]);

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorTramo) {
      setErrorMsg('Corrige el tramo de paradas antes de continuar con la compra.');
      return;
    }
    if (selectedSeats.length !== pasajerosFiltro) {
      setErrorMsg(`Selecciona exactamente ${pasajerosFiltro} asiento${pasajerosFiltro === 1 ? '' : 's'} para continuar.`);
      return;
    }
    if (!nombre.trim()) {
      setErrorMsg('Por favor completa tus nombres y apellidos completos.');
      return;
    }

    if (!validarCedulaEcuatoriana(cedula)) {
      const detalle = validarCedulaDetallada(cedula);
      setErrorMsg(`Cédula de identidad ecuatoriana inválida: ${detalle.mensaje}`);
      return;
    }

    if (metodoPago !== 'taquilla' && !comprobanteFile && !comprobanteUrl.trim()) {
      setErrorMsg(`Adjunta el comprobante de ${metodoPago === 'deposito' ? 'depósito' : 'transferencia'} o ingresa el número de referencia.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let finalComprobanteUrl: string | null = comprobanteUrl.trim() || null;

      if (metodoPago !== 'taquilla' && comprobanteFile) {
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!allowedTypes.includes(comprobanteFile.type)) {
          setErrorMsg('Formato de comprobante no admitido. Sube un archivo PDF, PNG o JPG.');
          setSubmitting(false);
          return;
        }
        if (comprobanteFile.size > 5 * 1024 * 1024) {
          setErrorMsg('El archivo del comprobante supera los 5 MB permitidos.');
          setSubmitting(false);
          return;
        }

        const supabase = createClient();
        const ext = comprobanteFile.name.split('.').pop() || 'jpg';
        const tempRef = `bol-${Date.now()}`;
        const storagePath = `${authUserId || 'publico'}/${tempRef}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('comprobantes_pagos')
          .upload(storagePath, comprobanteFile, { cacheControl: '3600', upsert: false });

        if (!uploadErr) {
          finalComprobanteUrl = storagePath;
        } else if (comprobanteFile.type.startsWith('image/') && comprobanteFile.size <= 1500000) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(comprobanteFile);
          });
          finalComprobanteUrl =
            dataUrl ||
            (comprobanteUrl.trim()
              ? `${comprobanteUrl.trim()} (${comprobanteFile.name})`
              : comprobanteFile.name);
        } else {
          finalComprobanteUrl = comprobanteUrl.trim()
            ? `${comprobanteUrl.trim()} (${comprobanteFile.name})`
            : comprobanteFile.name;
        }
      }

      const estadoInicial = metodoPago === 'taquilla' ? 'COMPLETADO' : 'PENDIENTE_APROBACION';

      const payloadBoletos = selectedSeats.map((asiento) => {
        const vip = selectedBus?.asientosVIPNumeros?.includes(asiento) ?? false;
        const tarifa = calcularTarifaFinal(
          precioBaseTramo,
          fechaNacimiento || null,
          esDiscapacitado,
          esDiscapacitado ? porcentajeDiscapacidad : undefined,
          vip
        );
        return {
          rutaId: selectedRuta!.id,
          pasajeroId: authUserId,
          asiento,
          precio: tarifa.totalConVip,
          descuento: tarifa.valorDescuento,
          tipoPasajero: tarifa.tipoBeneficiario,
          metodoPago,
          comprobanteUrl: finalComprobanteUrl,
          estado: estadoInicial,
          vendidoPor: metodoPago === 'taquilla' ? 'taquilla' : 'online_publico',
          vendidoPorChoferId: null,
          paradaOrigenId: selectedOrigenId || null,
          paradaDestinoId: selectedDestinoId || null,
          pasajeroNombre: nombre.trim(),
          pasajeroCedula: cedula.trim().replace(/-/g, ''),
          abordadoAt: null,
        };
      });
      const nuevosBoletos = await dataService.createBoletos(payloadBoletos);

      setBoletosGenerados(nuevosBoletos);
      setOccupiedSeats((prev) => Array.from(new Set([...prev, ...selectedSeats])));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Error al procesar la compra: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Búsqueda de Frecuencias y Paradas Intermedias
            </h1>
            <Badge variant="success">Operación Autorizada ANT</Badge>
            
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Consulta horarios de salida, paradas intermedias en ruta y disponibilidad de asientos por unidad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pasajero">
            <Button variant="outline" size="sm">
              Ver Mis Boletos
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </header>

      {/* Botón de alternancia de filtros en móvil (Responsive Mobile Toggle) */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          aria-expanded={isMobileFiltersOpen}
          aria-controls="panel-filtros-avanzados"
          aria-label="Alternar panel lateral de filtros avanzados"
          className="flex items-center gap-2 text-sm font-bold text-brand-900 hover:text-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-2 py-1"
        >
          
          <span>{isMobileFiltersOpen ? 'Ocultar Filtros' : 'Filtros Avanzados'}</span>
          {conteoActivos > 0 && (
            <span className="bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {conteoActivos} activo{conteoActivos > 1 ? 's' : ''}
            </span>
          )}
        </button>

        {conteoActivos > 0 && (
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside
          id="panel-filtros-avanzados"
          aria-label="Panel lateral de filtros avanzados"
          className={`w-full lg:w-80 xl:w-88 flex-shrink-0 bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-5 lg:sticky lg:top-4 transition-all duration-300 ${
            isMobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              
              <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                Filtros de Búsqueda
              </h2>
            </div>
            {conteoActivos > 0 ? (
              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="text-xs text-brand-700 hover:text-brand-900 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
              >
                Limpiar todo
              </button>
            ) : (
              <span className="text-[11px] text-neutral-600 font-medium">Todos activos</span>
            )}
          </div>

          {/* Sección 1: Ruta y Fecha */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-900 block">
              1. Itinerario y Fecha
            </span>

            <div>
              <label
                htmlFor="filtro-origen"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1"
              >
                Ciudad Origen / Escala
              </label>
              <select
                id="filtro-origen"
                value={origenFiltro}
                onChange={(e) => handleOrigenChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="">Todas las ciudades de origen</option>
                {todasCiudades.map((c) => (
                  <option key={`orig-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-destino"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1"
              >
                Ciudad Destino / Escala
              </label>
              <select
                id="filtro-destino"
                value={destinoFiltro}
                onChange={(e) => handleDestinoChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="">Todas las ciudades de destino</option>
                {todasCiudades.map((c) => (
                  <option key={`dest-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-fecha"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1"
              >
                Fecha de Viaje
              </label>
              <input
                type="date"
                id="filtro-fecha"
                value={fechaFiltro}
                onChange={(e) => handleFechaChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
              </input>
            </div>
          </div>

          {/* Divisor de Filtros Avanzados (Issue #17) */}
          <div className="border-t border-neutral-100 pt-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-900 block">
                2. Filtros Avanzados
              </span>
              <span className="text-[10px] bg-brand-50 text-brand-800 font-bold px-2 py-0.5 rounded border border-brand-200">
                Issue #17
              </span>
            </div>

            {/* 1. Filtro: Cooperativa (<select> desde dataService) */}
            <div>
              <label
                htmlFor="filtro-cooperativa"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1"
              >
                Cooperativa de Transporte
              </label>
              <select
                id="filtro-cooperativa"
                value={coopFiltro}
                onChange={(e) => handleCoopChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="">Todas las cooperativas</option>
                {cooperativas.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Filtro: Tipo de Asiento (Normal / VIP basado en asientosVIP de Bus) */}
            <div>
              <label
                htmlFor="filtro-tipo-asiento"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1"
              >
                Tipo de Asiento (Resolución ANT)
              </label>
              <select
                id="filtro-tipo-asiento"
                value={tipoAsientoFiltro}
                onChange={(e) => handleTipoAsientoChange(e.target.value as TipoAsientoFiltro)}
                className="w-full text-xs sm:text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="todos">Todos los tipos de asiento</option>
                <option value="normal">Normal (Estándar)</option>
                <option value="vip">VIP (+25% resolución ANT)</option>
              </select>
            </div>

            {/* 3. Filtro: Chasis o Carrocería (marcas de Bus: Hino, Mercedes-Benz, Yutong, etc.) */}
            <div>
              <label
                htmlFor="filtro-chasis-carroceria"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1"
              >
                Chasis o Carrocería
              </label>
              <select
                id="filtro-chasis-carroceria"
                value={chasisFiltro}
                onChange={(e) => handleChasisChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="">Todos los chasis / carrocerías</option>
                {marcasDisponibles.map((marca) => (
                  <option key={`m-${marca}`} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>

              {/* Entrada de texto complementaria para búsqueda libre de modelo/carrocería */}
              <input
                type="text"
                value={chasisFiltro}
                onChange={(e) => handleChasisChange(e.target.value)}
                placeholder="O escribe marca (ej: Hino, Yutong...)"
                aria-label="Buscar chasis o carrocería por texto"
                className="mt-1.5 w-full text-xs border border-neutral-200 rounded-lg px-3 py-1.5 bg-white placeholder-neutral-400 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* 4. Filtro: Tipo de Viaje (Directo / Con paradas intermedias de Frecuencia) */}
            <div>
              <label
                htmlFor="filtro-tipo-viaje"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1"
              >
                Tipo de Viaje (Modalidad)
              </label>
              <select
                id="filtro-tipo-viaje"
                value={tipoViajeFiltro}
                onChange={(e) => handleTipoViajeChange(e.target.value as TipoViajeFiltro)}
                className="w-full text-xs sm:text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="todos">Todos los tipos de viaje</option>
                <option value="directo">Directo (Sin escalas)</option>
                <option value="con_paradas">Con paradas intermedias</option>
              </select>
            </div>
          </div>

          {/* Pie del Panel: Acciones */}
          <div className="border-t border-neutral-100 pt-3.5 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimpiarFiltros}
              className="w-full font-bold text-xs"
            >
              Limpiar filtros
            </Button>
            <p className="text-[11px] text-neutral-600 text-center font-medium">
              Mostrando {filteredFrecuencias.length} de {frecuencias.length} frecuencias
            </p>
          </div>
        </aside>
        {/* CATÁLOGO DE RESULTADOS Y FRECUENCIAS */}
        <section className="flex-1 min-w-0 w-full space-y-4">
          {/* Barra de Filtros Activos (Pills / Chips de navegación) */}
          {conteoActivos > 0 && (
            <div className="bg-brand-50/70 border border-brand-200 rounded-2xl p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-brand-950 flex items-center gap-1">
                <span>Filtros activos:</span>
                <span className="bg-brand-200 text-brand-900 px-1.5 py-0.5 rounded-full text-[10px]">
                  {conteoActivos}
                </span>
              </span>

              {coopFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-brand-900 px-2.5 py-1 rounded-full border border-brand-300 font-semibold shadow-xs">
                  <span>Coop: {getCoop(coopFiltro)?.nombre || coopFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleCoopChange('')}
                    className="hover:text-brand-600 font-bold ml-1"
                    aria-label="Quitar filtro de cooperativa"
                  >
                    ✕
                  </button>
                </span>
              )}

              {tipoAsientoFiltro !== 'todos' && (
                <span className="inline-flex items-center gap-1 bg-white text-brand-900 px-2.5 py-1 rounded-full border border-brand-300 font-semibold shadow-xs">
                  <span>Asiento: {tipoAsientoFiltro.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => handleTipoAsientoChange('todos')}
                    className="hover:text-brand-600 font-bold ml-1"
                    aria-label="Quitar filtro de tipo de asiento"
                  >
                    ✕
                  </button>
                </span>
              )}

              {chasisFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-brand-900 px-2.5 py-1 rounded-full border border-brand-300 font-semibold shadow-xs">
                  <span>Chasis: {chasisFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleChasisChange('')}
                    className="hover:text-brand-600 font-bold ml-1"
                    aria-label="Quitar filtro de chasis o carrocería"
                  >
                    ✕
                  </button>
                </span>
              )}

              {tipoViajeFiltro !== 'todos' && (
                <span className="inline-flex items-center gap-1 bg-white text-brand-900 px-2.5 py-1 rounded-full border border-brand-300 font-semibold shadow-xs">
                  <span>Viaje: {tipoViajeFiltro === 'directo' ? 'Directo' : 'Con Paradas'}</span>
                  <button
                    type="button"
                    onClick={() => handleTipoViajeChange('todos')}
                    className="hover:text-brand-600 font-bold ml-1"
                    aria-label="Quitar filtro de tipo de viaje"
                  >
                    ✕
                  </button>
                </span>
              )}

              {origenFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-brand-900 px-2.5 py-1 rounded-full border border-brand-300 font-semibold shadow-xs">
                  <span>Origen: {origenFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleOrigenChange('')}
                    className="hover:text-brand-600 font-bold ml-1"
                    aria-label="Quitar filtro de origen"
                  >
                    ✕
                  </button>
                </span>
              )}

              {destinoFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-brand-900 px-2.5 py-1 rounded-full border border-brand-300 font-semibold shadow-xs">
                  <span>Destino: {destinoFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleDestinoChange('')}
                    className="hover:text-brand-600 font-bold ml-1"
                    aria-label="Quitar filtro de destino"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="text-brand-800 hover:text-brand-950 font-bold underline ml-auto text-xs"
              >
                Limpiar todos
              </button>
            </div>
          )}

          {/* Estado de Carga */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
              <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-500 font-medium">
                Cargando itinerarios y paradas disponibles desde Supabase...
              </p>
            </div>
          ) : (
            <>
              {/* Contador de resultados filtrados */}
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-700">
                  Itinerarios y Horarios Disponibles
                </span>
                <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
                  {loadingDisponibilidad ? 'Comprobando asientos…' : `${resultadosDisponibles.length} de ${frecuencias.length} frecuencia${frecuencias.length === 1 ? '' : 's'}`}
                </span>
              </div>

              {loadingDisponibilidad ? (
                <div role="status" className="rounded-2xl border border-neutral-200 bg-white py-10 text-center text-sm text-neutral-600">
                  Verificando rutas programadas y asientos disponibles para {pasajerosFiltro} pasajero{pasajerosFiltro === 1 ? '' : 's'}…
                </div>
              ) : resultadosDisponibles.length === 0 ? (
            /* ======================================================== */
            /* ESTADO VACÍO ("Sin resultados para este filtro") */
            /* ======================================================== */
            <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-neutral-300 space-y-4">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900">
                  Sin resultados para este filtro
                </h3>
                <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1">
                  No se encontraron itinerarios que coincidan con la combinación de filtros seleccionada. Intenta ajustar la cooperativa, el tipo de asiento, el chasis o el tipo de viaje.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLimpiarFiltros}
                  className="font-bold"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          ) : (
            /* Franjas horizontales de frecuencias */
            <div className="flex flex-col gap-4">
              {resultadosDisponibles.map((frec) => {
                const coop = getCoop(frec.cooperativaId);
                const paradasFrec = paradas.filter((p) => p.frecuenciaId === frec.id);
                const rutaAprobada = rutas.find((r) => r.frecuenciaId === frec.id && r.fecha.split('T')[0] === fechaFiltro && ['programada', 'aprobada', 'approved'].includes(r.estado.toLowerCase()) && !!r.busId);
                const busAsociado = buses.find((b) => b.id === rutaAprobada?.busId && b.activo);
                const fotoBus = busAsociado?.fotoUrl || obtenerImagenesFlotaCooperativa(coop)[0]?.src || null;

                const expandida = frecuenciaExpandida === frec.id;
                const esDirecto = !(frec.tipoViaje || '').toLowerCase().includes('parada') && paradasFrec.length === 0;

                return (
                  <Card key={frec.id} className="overflow-hidden rounded-2xl border-neutral-200 shadow-card transition hover:border-brand-200 hover:shadow-float">
                    <div className="grid grid-cols-1 gap-px bg-neutral-100 lg:grid-cols-2 2xl:grid-cols-[minmax(180px,0.85fr)_minmax(330px,1.8fr)_minmax(150px,0.85fr)_minmax(175px,1fr)]">
                      <div className="flex min-w-0 items-center gap-3 border-b border-neutral-100 bg-neutral-50 p-4 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm ring-1 ring-neutral-200">
                          <IconBus size={25} />
                        </div>
                        <div className="w-full min-w-0">
                          <p className="w-full line-clamp-2 break-words text-sm font-extrabold leading-snug text-neutral-950" title={coop?.nombre || 'Cooperativa'}>{coop?.nombre || 'Cooperativa'}</p>
                          <p className="mt-1 text-xs font-semibold text-neutral-600">Bus #{busAsociado?.numero} · {busAsociado?.placa}</p>
                          <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-600 ring-1 ring-neutral-200">
                            {frec.resolucionANT || 'Ruta autorizada'}
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col justify-center gap-4 bg-white p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600">
                          <span>{fechaFiltro}</span>
                          <span aria-hidden="true" className="text-neutral-300">•</span>
                          <span>{pasajerosFiltro} pasajero{pasajerosFiltro === 1 ? '' : 's'}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${esDirecto ? 'bg-success-50 text-success-800' : 'bg-neutral-100 text-neutral-700'}`}>
                            {esDirecto ? 'Directo' : `${paradasFrec.length} parada${paradasFrec.length === 1 ? '' : 's'}`}
                          </span>
                        </div>
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(82px,0.7fr)_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                          <div className="min-w-0">
                            <p className="text-xl font-black leading-tight text-neutral-950 sm:text-2xl">{frec.hora}</p>
                            <p className="mt-1 truncate text-sm font-bold text-neutral-800" title={frec.origen}>{frec.origen}</p>
                            <p className="text-[11px] text-neutral-500">Salida</p>
                          </div>
                          <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-[10px] font-semibold text-neutral-600">{mostrarDuracion(frec.duracion)}</span>
                            <div className="relative flex w-full items-center">
                              <span className="h-2 w-2 rounded-full border-2 border-brand-600 bg-white" />
                              <span className="h-px flex-1 bg-neutral-300" />
                              <IconBus size={17} className="shrink-0 text-brand-700" />
                              <span className="h-px flex-1 bg-neutral-300" />
                              <span className="h-2 w-2 rounded-full bg-brand-600" />
                            </div>
                            <span className="text-[10px] text-neutral-500">{esDirecto ? 'Sin escalas' : 'Con escalas'}</span>
                          </div>
                          <div className="min-w-0 text-right">
                            <p className="truncate text-lg font-black leading-tight text-neutral-950 sm:text-xl" title={frec.destino}>{frec.destino}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">Destino</p>
                          </div>
                        </div>
                        {paradasFrec.length > 0 && (
                          <p className="truncate border-t border-neutral-100 pt-2 text-[11px] text-neutral-500" title={`Paradas intermedias: ${paradasFrec.map((parada) => parada.ciudad).join(' · ')}`}>
                            <span className="font-bold text-neutral-600">Paradas:</span>{' '}
                            {paradasFrec.map((parada) => parada.ciudad).join(' · ')}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-row items-center justify-between gap-3 border-t border-neutral-100 bg-white px-4 py-3 lg:flex-col lg:items-start lg:justify-center lg:border-l lg:border-t-0 lg:px-5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Tarifa base · ruta completa</p>
                          <p className="text-3xl font-black tracking-tight text-neutral-950">${frec.precioBase.toFixed(2)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-xs font-bold text-success-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-success-600" />
                          {disponibilidadPorFrecuencia[frec.id]} disponibles
                        </span>
                      </div>

                      <div className="flex flex-row gap-2 border-t border-neutral-100 bg-neutral-50 p-3 lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:p-4">
                        <Button type="button" variant="primary" className="min-h-11 flex-1 rounded-xl font-extrabold shadow-sm" onClick={() => handleOpenBooking(frec)}>
                          Seleccionar asientos
                        </Button>
                        <button
                          type="button"
                          aria-expanded={expandida}
                          aria-controls={`detalles-bus-${frec.id}`}
                          onClick={() => setFrecuenciaExpandida((actual) => actual === frec.id ? null : frec.id)}
                          className="min-h-10 rounded-xl px-3 text-xs font-bold text-brand-800 transition hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                        >
                          {expandida ? 'Ver menos' : 'Ver más · Detalles del bus'}
                        </button>
                      </div>
                    </div>

                    {expandida && (
                      <div id={`detalles-bus-${frec.id}`} className="grid gap-5 border-t border-neutral-200 bg-white p-4 sm:p-6 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.6fr)]">
                        <div className="overflow-hidden rounded-2xl bg-neutral-100">
                          {fotoBus ? (
                            <img src={fotoBus} alt={`Bus de ${coop?.nombre || 'la cooperativa'}${busAsociado?.placa ? `, placa ${busAsociado.placa}` : ''}`} className="h-48 w-full object-cover sm:h-56" />
                          ) : (
                            <div className="flex h-48 flex-col items-center justify-center gap-2 text-neutral-500 sm:h-56">
                              <IconBus size={42} />
                              <span className="text-xs font-semibold">Foto del bus no disponible</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-base font-extrabold text-neutral-950">Detalles de la unidad</h3>
                            <p className="mt-1 text-xs text-neutral-600">{coop?.nombre || 'Cooperativa'} · Bus #{busAsociado?.numero} · {busAsociado?.placa}</p>
                          </div>
                          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                              ['Chasis', busAsociado?.chasis || busAsociado?.marca || 'No registrado'],
                              ['Carrocería', busAsociado?.carroceria || 'No registrada'],
                              ['Capacidad', `${busAsociado?.capacidad ?? '—'} asientos`],
                              ['Asientos VIP', String(busAsociado?.asientosVIP ?? 0)],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-100">
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</dt>
                                <dd className="mt-1 text-xs font-bold text-neutral-900">{value}</dd>
                              </div>
                            ))}
                          </dl>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Recorrido y paradas intermedias</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-700">
                              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-brand-800">{frec.origen}</span>
                              {paradasFrec.map((parada) => (
                                <React.Fragment key={parada.id}>
                                  <span aria-hidden="true" className="text-neutral-400">→</span>
                                  <span className="rounded-full bg-neutral-100 px-3 py-1.5">{parada.ciudad}</span>
                                </React.Fragment>
                              ))}
                              <span aria-hidden="true" className="text-neutral-400">→</span>
                              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-brand-800">{frec.destino}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
                            <span>Resolución ANT: <strong className="text-neutral-900">{frec.resolucionANT || 'No registrada'}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>Descuentos legales ANT disponibles para pasajeros que califican.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
              )}
            </>
          )}
        </section>
      </div>
      {/* MODAL DE SELECCIÓN DINÁMICA DE TRAMO Y COMPRA DE BOLETO */}
      {selectedFrecuencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
            {/* Modal Header */}
            <div className="p-6 bg-brand-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                  Reserva y Validación Legal ANT
                </span>
                <h2 className="text-xl font-black">
                  {nombreOrigen} ➔ {nombreDestino}
                </h2>
                <p className="text-xs text-neutral-300">
                  Frecuencia: {selectedFrecuencia.origen} - {selectedFrecuencia.destino} | Salida: {selectedFrecuencia.hora} | Fecha: {fechaFiltro} |{' '}
                  {getCoop(selectedFrecuencia.cooperativaId)?.nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseBooking}
                aria-label="Cerrar modal de reserva"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {boletosGenerados.length > 0 ? (
                /* Pantalla de Éxito con Boleto y Código QR */
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-neutral-900">
                      {boletosGenerados[0].estado === 'PENDIENTE_APROBACION'
                        ? '¡Reserva y Comprobante Registrados!'
                        : '¡Boleto Emitido Exitosamente!'}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {boletosGenerados[0].estado === 'PENDIENTE_APROBACION'
                        ? 'Tu comprobante fue enviado a ventanilla para validación. Una vez aprobado por el oficinista podrás descargar el QR en Mis Boletos.'
                        : 'Presenta este código QR y tu cédula original al abordar la unidad.'}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {boletosGenerados.map((boleto) => (
                      <div key={boleto.id} className="bg-neutral-50 border-2 border-dashed border-neutral-300 p-5 rounded-2xl shadow-sm">
                        {boleto.estado.toUpperCase() === 'COMPLETADO' && boleto.codigoQr ? (
                          <>
                            <div className="mb-3 flex justify-center">
                              <QRCodeSVG value={boleto.codigoQr} size={150} level="H" includeMargin />
                            </div>
                            <div className="mb-3 rounded bg-brand-100 px-2 py-1 text-center font-mono text-xs font-bold text-brand-800">{boleto.codigoQr}</div>
                          </>
                        ) : (
                          <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-4 text-center text-sm font-semibold text-warning-900" role="status">
                            El QR estará disponible cuando ventanilla apruebe tu comprobante.
                          </div>
                        )}
                        <div className="text-left text-xs space-y-1.5 text-neutral-700">
                          <div><strong>Pasajero:</strong> {boleto.pasajeroNombre}</div>
                          <div><strong>Cédula:</strong> {boleto.pasajeroCedula} ({cedulaInfo?.provincia || 'Ecuador'})</div>
                          <div><strong>Asiento:</strong> #{boleto.asiento}</div>
                          <div><strong>Tramo:</strong> {nombreOrigen} ➔ {nombreDestino}</div>
                          <div><strong>Total:</strong> ${boleto.precio.toFixed(2)}</div>
                          <Badge variant="cooperativa">{boleto.tipoPasajero?.toUpperCase() || 'GENERAL'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <Link href="/pasajero">
                      <Button variant="primary">Ir a Mi Casillero de Boletos</Button>
                    </Link>
                    <Button variant="outline" onClick={handleCloseBooking}>
                      Cerrar y Volver
                    </Button>
                  </div>
                </div>
              ) : (
                /* Flujo de Compra: Selección de Tramo + Mapa + Formulario */
                <div className="space-y-6">
                  {/* Selector Dinámico de Paradas Intermedias */}
                  <div className="bg-brand-50/70 p-5 rounded-2xl border border-brand-200">
                    <h3 className="text-sm font-bold text-brand-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>1. Configuración del Tramo de Viaje</span>
                      <Badge variant="cooperativa">Cálculo Proporcional ANT</Badge>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="modal-origen"
                          className="block text-xs font-bold text-neutral-700 uppercase mb-1"
                        >
                          Parada de Abordaje (Origen)
                        </label>
                        <select
                          id="modal-origen"
                          value={selectedOrigenId}
                          onChange={(e) => handleCambioOrigen(e.target.value)}
                          className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 font-semibold"
                        >
                          {secuenciaParadas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.tipo === 'origen'
                                ? `${p.ciudad} (Terminal Origen)`
                                : p.tipo === 'destino'
                                ? `${p.ciudad} (Terminal Destino)`
                                : `${p.ciudad} (Escala #${p.orden})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="modal-destino"
                          className="block text-xs font-bold text-neutral-700 uppercase mb-1"
                        >
                          Parada de Desembarque (Destino)
                        </label>
                        <select
                          id="modal-destino"
                          value={selectedDestinoId}
                          onChange={(e) => handleCambioDestino(e.target.value)}
                          className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 font-semibold"
                        >
                          {secuenciaParadas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.tipo === 'origen'
                                ? `${p.ciudad} (Terminal Origen)`
                                : p.tipo === 'destino'
                                ? `${p.ciudad} (Terminal Destino)`
                                : `${p.ciudad} (Escala #${p.orden})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Alertas de Validación o Resumen de Tarifa Proporcional */}
                    {errorTramo ? (
                      <div className="mt-3 p-3 bg-brand-100 text-brand-800 text-xs rounded-xl border border-brand-300 flex items-center gap-2 font-semibold">
                        
                        <span>{errorTramo}</span>
                      </div>
                    ) : calculoTramo ? (
                      <div className="mt-3 p-3 bg-white/80 rounded-xl border border-brand-200 text-xs text-brand-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <strong>Recorrido válido:</strong> {nombreOrigen} ➔ {nombreDestino} (
                          {calculoTramo.porcentajeRecorrido}% de la ruta).
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500">Tarifa Tramo ANT:</span>
                          <span className="font-extrabold text-brand-700 text-sm">
                            ${calculoTramo.precioCalculadoTramo.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Cuerpo: Mapa de Asientos por Tramo + Formulario con Cédula y Descuento ANT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 mb-3 flex items-center justify-between">
                        <span>2. Elige {pasajerosFiltro} asiento{pasajerosFiltro === 1 ? '' : 's'} para este Tramo</span>
                        <span className="text-xs font-normal text-neutral-500">
                          Bus: {selectedBus?.placa || 'Unidad Asignada'}
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-500 mb-3">
                        Asientos disponibles calculados exclusivamente para el tramo {nombreOrigen} ➔ {nombreDestino}.
                      </p>
                      <SeatSelector
                        capacidad={selectedBus?.capacidad || 40}
                        asientosVIP={selectedBus ? selectedBus.asientosVIP : 8}
                        asientosVIPNumeros={selectedBus?.asientosVIPNumeros ?? null}
                        asientosOcupados={occupiedSeats}
                        maxSeleccionables={pasajerosFiltro}
                        seleccionados={selectedSeats}
                        onChange={setSelectedSeats}
                      />
                    </div>
                    <div className="flex flex-col justify-between">
                      {!authUserId ? (
                        <div className="bg-brand-50/60 border-2 border-brand-200 rounded-2xl p-6 space-y-5 flex flex-col justify-between h-full">
                          <div className="space-y-3">
                            <Badge variant="admin">CUENTA DE PASAJERO REQUERIDA</Badge>
                            <h3 className="text-lg font-black text-neutral-900 leading-snug">
                              Crea una cuenta o inicia sesión para comprar este boleto
                            </h3>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                              Puedes consultar libremente los horarios, escalas intermedias, tarifas oficiales ANT y el croquis de asientos disponibles. Para <strong>comprar el boleto y registrarlo a tu nombre y número de cédula</strong>, es indispensable ingresar con tu cuenta de usuario.
                            </p>

                            <div className="bg-white p-4 rounded-xl border border-brand-100 space-y-1.5 text-xs text-neutral-700">
                              <div className="flex justify-between">
                                <span>Tramo consultado:</span>
                                <span className="font-bold text-neutral-900">
                                  {nombreOrigen} ➔ {nombreDestino}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Asiento previsualizado:</span>
                                <span className="font-bold text-neutral-900">
                                  {selectedSeats.length
                                    ? selectedSeats.map((seat) => `#${seat}${selectedBus?.asientosVIPNumeros?.includes(seat) ? ' (VIP)' : ''}`).join(', ')
                                    : `Selecciona ${pasajerosFiltro} asiento${pasajerosFiltro === 1 ? '' : 's'} en el croquis`}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-black text-neutral-900 border-t border-neutral-100 pt-2 mt-1">
                                <span>Tarifa estimada del tramo:</span>
                                <span className="text-brand-700 text-base">
                                  ${totalCompra.toFixed(2)} USD
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-2">
                            <Link
                              href={`/login?redirectTo=${encodeURIComponent(pathname)}`}
                              className="block w-full"
                            >
                              <Button variant="primary" size="lg" className="w-full font-bold">
                                Iniciar Sesión / Crear Cuenta para Comprar ➔
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCloseBooking}
                              className="w-full"
                            >
                              Seguir consultando horarios
                            </Button>
                          </div>
                        </div>
                      ) : (
                      <form onSubmit={handleConfirmPurchase} className="space-y-4">
                        <h3 className="text-base font-bold text-neutral-900 mb-1">
                          3. Datos del pasajero principal y Validación ANT
                        </h3>
                        {pasajerosFiltro > 1 && <p className="mb-3 text-xs text-neutral-600">Se emitirá un boleto por asiento. El nombre y la cédula ingresados se registrarán en cada boleto.</p>}

                        {errorMsg && (
                          <div className="p-3 bg-brand-50 text-brand-700 text-xs rounded-xl border border-brand-200 font-semibold">
                            {errorMsg}
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor="pasajero-nombre"
                            className="block text-xs font-bold text-neutral-700 uppercase mb-1"
                          >
                            Nombres y Apellidos Completos *
                          </label>
                          <input
                            type="text"
                            id="pasajero-nombre"
                            required
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Andrés Toasa"
                            className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500"
                          />
                        </div>

                        {/* Campo de Cédula con Validación en Tiempo Real (Módulo 10) */}
                        <div>
                          <label
                            htmlFor="pasajero-cedula"
                            className="block text-xs font-bold text-neutral-700 uppercase mb-1"
                          >
                            Cédula Ecuatoriana (Módulo 10 Registro Civil) *
                          </label>
                          <input
                            type="text"
                            id="pasajero-cedula"
                            required
                            maxLength={10}
                            value={cedula}
                            onChange={(e) => handleCedulaChange(e.target.value)}
                            placeholder="Ej: 1804567897"
                            className={`w-full text-sm border rounded-lg px-3 py-2 font-mono tracking-wider focus:ring-2 ${
                              cedulaInfo?.valida
                                ? 'border-success-500 bg-success-50/40 focus:ring-success-500'
                                : cedulaInfo && !cedulaInfo.valida
                                ? 'border-brand-400 bg-brand-50/40 focus:ring-brand-500'
                                : 'border-neutral-300 focus:ring-brand-500'
                            }`}
                          />
                          {cedulaInfo && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              {cedulaInfo.valida ? (
                                <span className="text-success-700 font-semibold flex items-center gap-1">
                                  <span>✔</span>
                                  <span>Cédula legítima de la provincia de {cedulaInfo.provincia}</span>
                                </span>
                              ) : (
                                <span className="text-brand-600 font-medium flex items-center gap-1">
                                  <span>✖</span>
                                  <span>{cedulaInfo.mensaje}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Fecha de Nacimiento para Validación de Edad ANT */}
                        <div>
                          <label
                            htmlFor="pasajero-fecha-nac"
                            className="block text-xs font-bold text-neutral-700 uppercase mb-1"
                          >
                            Fecha de Nacimiento (Para cálculo automático de tarifa preferencial ANT)
                          </label>
                          <input
                            type="date"
                            id="pasajero-fecha-nac"
                            value={fechaNacimiento}
                            onChange={(e) => setFechaNacimiento(e.target.value)}
                            className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                          {edadCalculada !== null && edadCalculada >= 0 && (
                            <div className="mt-1 text-xs">
                              {edadCalculada < 18 ? (
                                <span className="text-brand-700 font-bold bg-brand-100 px-2 py-0.5 rounded">
                                  Menor de Edad ({edadCalculada} años) - 50% de Descuento por Ley ANT
                                </span>
                              ) : edadCalculada >= 65 ? (
                                <span className="text-accent-800 font-bold bg-accent-100 px-2 py-0.5 rounded">
                                  Adulto Mayor ({edadCalculada} años) - 50% de Descuento por Ley ANT
                                </span>
                              ) : (
                                <span className="text-neutral-600">
                                  Adulto ({edadCalculada} años) - Tarifa General
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Opción de Discapacidad */}
                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                            <input
                              type="checkbox"
                              checked={esDiscapacitado}
                              onChange={(e) => setEsDiscapacitado(e.target.checked)}
                              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                            />
                            <span>Persona con Discapacidad (Ley Orgánica de Discapacidades)</span>
                          </label>

                          {esDiscapacitado && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200">
                              <div>
                                <label
                                  htmlFor="pasajero-discapacidad-pct"
                                  className="block text-[11px] font-semibold text-neutral-600"
                                >
                                  % Discapacidad (mínimo 30%)
                                </label>
                                <input
                                  type="number"
                                  id="pasajero-discapacidad-pct"
                                  min={30}
                                  max={100}
                                  value={porcentajeDiscapacidad}
                                  onChange={(e) => setPorcentajeDiscapacidad(Number(e.target.value))}
                                  className="w-full text-xs border border-neutral-300 rounded px-2 py-1 bg-white"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="pasajero-conadis"
                                  className="block text-[11px] font-semibold text-neutral-600"
                                >
                                  N° Carnet CONADIS / MSP
                                </label>
                                <input
                                  type="text"
                                  id="pasajero-conadis"
                                  placeholder="Ej: CONADIS-0456"
                                  value={carnetConadis}
                                  onChange={(e) => setCarnetConadis(e.target.value)}
                                  className="w-full text-xs border border-neutral-300 rounded px-2 py-1 bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Método de Pago */}
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                            Método de Pago
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {opcionesMetodoPago.map((opcion) => (
                              <button
                                key={opcion.value}
                                type="button"
                                onClick={() => {
                                  setMetodoPago(opcion.value);
                                  if (opcion.value === 'taquilla') {
                                    setComprobanteFile(null);
                                    setComprobanteUrl('');
                                  }
                                }}
                                className={`py-2 px-2 text-xs font-bold rounded-lg border capitalize transition-all ${
                                  metodoPago === opcion.value
                                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                                }`}
                              >
                                {opcion.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {metodoPago !== 'taquilla' && (
                          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-900">
                                Comprobante de {metodoPago === 'deposito' ? 'depósito' : 'transferencia'} bancario
                              </span>
                              <span className="text-[10px] font-bold text-warning-800 bg-warning-50 px-2 py-0.5 rounded border border-warning-200">
                                Validación en ventanilla
                              </span>
                            </div>

                            <div className="bg-white p-2.5 rounded-lg border border-neutral-200 space-y-0.5 text-[11px] text-neutral-700">
                              <p>
                                <strong>Banco Pichincha</strong> · Cta. Corriente:{' '}
                                <span className="font-mono font-bold">2100456789</span>
                              </p>
                              <p>
                                <strong>Beneficiario:</strong>{' '}
                                {getCoop(selectedFrecuencia.cooperativaId)?.nombre ||
                                  'Cooperativa de Transportes'}{' '}
                                (RUC: {getCoop(selectedFrecuencia.cooperativaId)?.ruc || '1890001234001'})
                              </p>
                            </div>

                            <div>
                              <label
                                htmlFor="comprobante-file-modal"
                                className="block text-[11px] font-bold text-neutral-800 mb-1"
                              >
                                Subir comprobante de {metodoPago === 'deposito' ? 'depósito' : 'transferencia'} (PDF, PNG o JPG) *
                              </label>
                              <input
                                id="comprobante-file-modal"
                                type="file"
                                accept=".pdf, .png, .jpg, .jpeg"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  setComprobanteFile(f);
                                }}
                                className="block w-full text-xs text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer bg-white border border-neutral-300 rounded-lg p-1"
                              />
                              {comprobanteFile && (
                                <p className="text-[11px] text-success-700 font-semibold mt-1">
                                  ✔ Archivo adjunto: {comprobanteFile.name} (
                                  {(comprobanteFile.size / 1024).toFixed(1)} KB)
                                </p>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor="comprobante-num-modal"
                                className="block text-[11px] font-semibold text-neutral-600 mb-0.5"
                              >
                                Número de comprobante / referencia (opcional si subes el archivo)
                              </label>
                              <input
                                id="comprobante-num-modal"
                                type="text"
                                placeholder="Ej: Comprobante #00458912"
                                value={comprobanteUrl}
                                onChange={(e) => setComprobanteUrl(e.target.value)}
                                className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Desglose de Pago Dinámico por Tramo y Descuentos ANT */}
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1.5 text-xs text-neutral-700">
                          <div className="flex justify-between">
                            <span>Tramo Seleccionado:</span>
                            <span className="font-bold text-neutral-900">
                              {nombreOrigen} ➔ {nombreDestino}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tarifa Base Tramo ANT:</span>
                            <span>${desgloseTarifa.precioBase.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Asiento Seleccionado:</span>
                            <span className="font-bold">
                              {selectedSeats.length
                                ? selectedSeats.map((seat) => `#${seat}${selectedBus?.asientosVIPNumeros?.includes(seat) ? ' (VIP)' : ''}`).join(', ')
                                : `Selecciona ${pasajerosFiltro} asiento${pasajerosFiltro === 1 ? '' : 's'}`}
                            </span>
                          </div>
                          {totalRecargoVip > 0 && (
                            <div className="flex justify-between text-accent-700">
                              <span>Recargo Servicio VIP (25%):</span>
                              <span>+${totalRecargoVip.toFixed(2)}</span>
                            </div>
                          )}
                          {totalDescuento > 0 && (
                            <div className="flex justify-between text-success-700 font-bold bg-success-50 px-2 py-1 rounded border border-success-200">
                              <span>Descuento 50% ANT ({desgloseTarifa.tipoBeneficiario.replace('_', ' ').toUpperCase()}):</span>
                              <span>-${totalDescuento.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-black text-neutral-900 border-t border-neutral-200 pt-1.5 mt-1">
                            <span>Total a Pagar:</span>
                            <span className="text-brand-700 text-base">${totalCompra.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 italic pt-1">
                            {desgloseTarifa.justificacionLegal}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          disabled={
                            submitting ||
                            selectedSeats.length !== pasajerosFiltro ||
                            !!errorTramo ||
                            loadingTramo ||
                            (cedula.length === 10 && !cedulaInfo?.valida)
                          }
                          className="w-full py-3 text-base font-bold shadow-lg shadow-brand-700/20"
                        >
                          {submitting
                            ? 'Emitiendo Boleto...'
                            : `Confirmar ${pasajerosFiltro} boleto${pasajerosFiltro === 1 ? '' : 's'} ($${totalCompra.toFixed(2)})`}
                        </Button>
                      </form>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BusquedaLoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-neutral-500 font-medium">Cargando frecuencias disponibles...</p>
    </div>
  );
}

export default function BusquedaPage() {
  return (
    <Suspense fallback={<BusquedaLoadingFallback />}>
      <BusquedaContent />
    </Suspense>
  );
}
