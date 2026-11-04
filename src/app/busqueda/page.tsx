'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '@/lib/services/dataService';
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
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SeatSelector } from '@/components/bus/SeatSelector';

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
    () => searchParams.get('fecha') || new Date().toISOString().split('T')[0]
  );
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
    const qFecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const qCoop = searchParams.get('cooperativa') || '';
    const qAsiento = (searchParams.get('tipoAsiento') as TipoAsientoFiltro) || 'todos';
    const qChasis = searchParams.get('chasisCarroceria') || '';
    const qViaje = (searchParams.get('tipoViaje') as TipoViajeFiltro) || 'todos';

    setOrigenFiltro(qOrigen);
    setDestinoFiltro(qDestino);
    setFechaFiltro(qFecha);
    setCoopFiltro(qCoop);
    setTipoAsientoFiltro(qAsiento);
    setChasisFiltro(qChasis);
    setTipoViajeFiltro(qViaje);
  }, [searchParams]);

  // Actualización de searchParams en la URL sin recargar la página (useRouter + usePathname)
  const sincronizarFiltrosConUrl = useCallback(
    (nuevosFiltros: FiltrosBusquedaAvanzados) => {
      const params = new URLSearchParams();

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
    [pathname, router]
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
      } catch (err) {
        console.error('Error al cargar catálogo de transporte desde dataService:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);

  // Datos del pasajero y validación de cédula (Issue #15)
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [cedulaInfo, setCedulaInfo] = useState<ResultadoValidacionCedula | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [esDiscapacitado, setEsDiscapacitado] = useState(false);
  const [porcentajeDiscapacidad, setPorcentajeDiscapacidad] = useState<number>(40);
  const [carnetConadis, setCarnetConadis] = useState('');

  // Método de pago y emisión
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'transferencia' | 'efectivo'>('tarjeta');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [boletoGenerado, setBoletoGenerado] = useState<BoletoRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const actualizarTramoYAsientos = useCallback(
    async (
      frec: FrecuenciaRow,
      rutaId: string,
      origenId: string,
      destinoId: string,
      secuencia: ParadaRuta[]
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
      const nuevosOcupados = ocupadosRes.data ?? [];
      setOccupiedSeats(nuevosOcupados);

      setSelectedSeat((currentSeat) =>
        currentSeat && nuevosOcupados.includes(currentSeat) ? null : currentSeat
      );

      setLoadingTramo(false);
    },
    []
  );

  const handleOpenBooking = async (frec: FrecuenciaRow) => {
    setSelectedFrecuencia(frec);
    setSelectedSeat(null);
    setBoletoGenerado(null);
    setErrorMsg(null);
    setErrorTramo(null);

    let ruta = rutas.find((r) => r.frecuenciaId === frec.id && r.fecha === fechaFiltro);
    if (!ruta) {
      const busDeCoop = buses.find((b) => b.cooperativaId === frec.cooperativaId) || buses[0];
      ruta = await dataService.createRuta({
        frecuenciaId: frec.id,
        fecha: fechaFiltro,
        busId: busDeCoop ? busDeCoop.id : null,
        estado: 'programada',
        inicio: null,
        completada: null,
        precio: frec.precioBase,
        choferId: null,
      });
      setRutas((prev) => [...prev, ruta!]);
    }
    setSelectedRuta(ruta);

    const busObj = buses.find((b) => b.id === ruta?.busId) || buses.find((b) => b.cooperativaId === frec.cooperativaId) || buses[0];
    setSelectedBus(busObj);

    const secuencia = await dataService.getParadasCompletas(frec.id);
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

    if (defOrigen && defDestino && ruta) {
      await actualizarTramoYAsientos(frec, ruta.id, defOrigen, defDestino, secuencia);
    }
  };

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
    setSelectedSeat(null);
    setBoletoGenerado(null);
    setCalculoTramo(null);
    setErrorTramo(null);
    setCedulaInfo(null);
  };

  const paradaOrigenObj = secuenciaParadas.find((p) => p.id === selectedOrigenId);
  const paradaDestinoObj = secuenciaParadas.find((p) => p.id === selectedDestinoId);
  const nombreOrigen = paradaOrigenObj?.ciudad || selectedFrecuencia?.origen || 'Origen';
  const nombreDestino = paradaDestinoObj?.ciudad || selectedFrecuencia?.destino || 'Destino';

  const precioBaseTramo = calculoTramo?.precioCalculadoTramo ?? selectedFrecuencia?.precioBase ?? 0;
  const isVipSeat = selectedBus?.asientosVIPNumeros?.includes(selectedSeat || -1);

  const desgloseTarifa = useMemo(() => {
    return calcularTarifaFinal(
      precioBaseTramo,
      fechaNacimiento || null,
      esDiscapacitado,
      porcentajeDiscapacidad,
      isVipSeat
    );
  }, [precioBaseTramo, fechaNacimiento, esDiscapacitado, porcentajeDiscapacidad, isVipSeat]);

  const edadCalculada = useMemo(() => {
    return fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  }, [fechaNacimiento]);

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorTramo) {
      setErrorMsg('Corrige el tramo de paradas antes de continuar con la compra.');
      return;
    }
    if (!selectedSeat) {
      setErrorMsg('Debes seleccionar un asiento disponible en el mapa del bus.');
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

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const nuevoBoleto = await dataService.createBoleto({
        rutaId: selectedRuta!.id,
        pasajeroId: null,
        asiento: selectedSeat,
        precio: desgloseTarifa.totalConVip,
        descuento: desgloseTarifa.valorDescuento,
        tipoPasajero: desgloseTarifa.tipoBeneficiario,
        metodoPago,
        comprobanteUrl: comprobanteUrl || null,
        estado: metodoPago === 'transferencia' ? 'emitido' : 'pagado',
        vendidoPor: 'online_publico',
        vendidoPorChoferId: null,
        paradaOrigenId: selectedOrigenId || null,
        paradaDestinoId: selectedDestinoId || null,
        pasajeroNombre: nombre.trim(),
        pasajeroCedula: cedula.trim().replace(/-/g, ''),
        abordadoAt: null,
      });

      setBoletoGenerado(nuevoBoleto);
      setOccupiedSeats((prev) => [...prev, selectedSeat]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Error al procesar la compra: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado Principal */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Búsqueda de Frecuencias y Paradas Intermedias
            </h1>
            <Badge variant="success">ANT CERTIFICADO</Badge>
            <Badge variant="cooperativa">FILTROS AVANZADOS C1</Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Itinerarios interprovinciales con paradas intermedias, validación de cédula Módulo 10 y panel lateral de filtros combinados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pasajero">
            <Button variant="outline" size="sm">
              🎫 Ver Mis Boletos
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
      <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          aria-expanded={isMobileFiltersOpen}
          aria-controls="panel-filtros-avanzados"
          aria-label="Alternar panel lateral de filtros avanzados"
          className="flex items-center gap-2 text-sm font-bold text-blue-900 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
        >
          <span className="text-lg">⚙️</span>
          <span>{isMobileFiltersOpen ? 'Ocultar Filtros' : 'Filtros Avanzados'}</span>
          {conteoActivos > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {conteoActivos} activo{conteoActivos > 1 ? 's' : ''}
            </span>
          )}
        </button>

        {conteoActivos > 0 && (
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="text-xs text-red-600 hover:text-red-800 font-semibold underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Estructura Principal: Panel Lateral (Sidebar) + Catálogo de Resultados */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ======================================================== */}
        {/* PANEL LATERAL DE FILTROS AVANZADOS (DESKTOP + RESPONSIVE) */}
        {/* ======================================================== */}
        <aside
          id="panel-filtros-avanzados"
          aria-label="Panel lateral de filtros avanzados"
          className={`w-full lg:w-80 xl:w-88 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5 lg:sticky lg:top-4 transition-all duration-300 ${
            isMobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Cabecera del Panel */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                Filtros de Búsqueda
              </h2>
            </div>
            {conteoActivos > 0 ? (
              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Limpiar todo
              </button>
            ) : (
              <span className="text-[11px] text-gray-600 font-medium">Todos activos</span>
            )}
          </div>

          {/* Sección 1: Ruta y Fecha */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 block">
              1. Itinerario y Fecha
            </span>

            <div>
              <label
                htmlFor="filtro-origen"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1"
              >
                Ciudad Origen / Escala
              </label>
              <select
                id="filtro-origen"
                value={origenFiltro}
                onChange={(e) => handleOrigenChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1"
              >
                Ciudad Destino / Escala
              </label>
              <select
                id="filtro-destino"
                value={destinoFiltro}
                onChange={(e) => handleDestinoChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1"
              >
                Fecha de Viaje
              </label>
              <input
                type="date"
                id="filtro-fecha"
                value={fechaFiltro}
                onChange={(e) => handleFechaChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
              </input>
            </div>
          </div>

          {/* Divisor de Filtros Avanzados (Issue #17) */}
          <div className="border-t border-gray-100 pt-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 block">
                2. Filtros Avanzados
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                Issue #17
              </span>
            </div>

            {/* 1. Filtro: Cooperativa (<select> desde dataService) */}
            <div>
              <label
                htmlFor="filtro-cooperativa"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1"
              >
                Cooperativa de Transporte
              </label>
              <select
                id="filtro-cooperativa"
                value={coopFiltro}
                onChange={(e) => handleCoopChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1"
              >
                Tipo de Asiento (Resolución ANT)
              </label>
              <select
                id="filtro-tipo-asiento"
                value={tipoAsientoFiltro}
                onChange={(e) => handleTipoAsientoChange(e.target.value as TipoAsientoFiltro)}
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1"
              >
                Chasis o Carrocería
              </label>
              <select
                id="filtro-chasis-carroceria"
                value={chasisFiltro}
                onChange={(e) => handleChasisChange(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 4. Filtro: Tipo de Viaje (Directo / Con paradas intermedias de Frecuencia) */}
            <div>
              <label
                htmlFor="filtro-tipo-viaje"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1"
              >
                Tipo de Viaje (Modalidad)
              </label>
              <select
                id="filtro-tipo-viaje"
                value={tipoViajeFiltro}
                onChange={(e) => handleTipoViajeChange(e.target.value as TipoViajeFiltro)}
                className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="todos">Todos los tipos de viaje</option>
                <option value="directo">Directo (Sin escalas)</option>
                <option value="con_paradas">Con paradas intermedias</option>
              </select>
            </div>
          </div>

          {/* Pie del Panel: Acciones */}
          <div className="border-t border-gray-100 pt-3.5 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimpiarFiltros}
              className="w-full font-bold text-xs"
            >
              🔄 Limpiar filtros
            </Button>
            <p className="text-[11px] text-gray-600 text-center font-medium">
              Mostrando {filteredFrecuencias.length} de {frecuencias.length} frecuencias
            </p>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* CATÁLOGO DE RESULTADOS Y FRECUENCIAS */}
        {/* ======================================================== */}
        <section className="flex-1 min-w-0 w-full space-y-4">
          {/* Barra de Filtros Activos (Pills / Chips de navegación) */}
          {conteoActivos > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-blue-950 flex items-center gap-1">
                <span>Filtros activos:</span>
                <span className="bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-full text-[10px]">
                  {conteoActivos}
                </span>
              </span>

              {coopFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-blue-900 px-2.5 py-1 rounded-full border border-blue-300 font-semibold shadow-xs">
                  <span>Coop: {getCoop(coopFiltro)?.nombre || coopFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleCoopChange('')}
                    className="hover:text-red-600 font-bold ml-1"
                    aria-label="Quitar filtro de cooperativa"
                  >
                    ✕
                  </button>
                </span>
              )}

              {tipoAsientoFiltro !== 'todos' && (
                <span className="inline-flex items-center gap-1 bg-white text-blue-900 px-2.5 py-1 rounded-full border border-blue-300 font-semibold shadow-xs">
                  <span>Asiento: {tipoAsientoFiltro.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => handleTipoAsientoChange('todos')}
                    className="hover:text-red-600 font-bold ml-1"
                    aria-label="Quitar filtro de tipo de asiento"
                  >
                    ✕
                  </button>
                </span>
              )}

              {chasisFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-blue-900 px-2.5 py-1 rounded-full border border-blue-300 font-semibold shadow-xs">
                  <span>Chasis: {chasisFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleChasisChange('')}
                    className="hover:text-red-600 font-bold ml-1"
                    aria-label="Quitar filtro de chasis o carrocería"
                  >
                    ✕
                  </button>
                </span>
              )}

              {tipoViajeFiltro !== 'todos' && (
                <span className="inline-flex items-center gap-1 bg-white text-blue-900 px-2.5 py-1 rounded-full border border-blue-300 font-semibold shadow-xs">
                  <span>Viaje: {tipoViajeFiltro === 'directo' ? 'Directo' : 'Con Paradas'}</span>
                  <button
                    type="button"
                    onClick={() => handleTipoViajeChange('todos')}
                    className="hover:text-red-600 font-bold ml-1"
                    aria-label="Quitar filtro de tipo de viaje"
                  >
                    ✕
                  </button>
                </span>
              )}

              {origenFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-blue-900 px-2.5 py-1 rounded-full border border-blue-300 font-semibold shadow-xs">
                  <span>Origen: {origenFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleOrigenChange('')}
                    className="hover:text-red-600 font-bold ml-1"
                    aria-label="Quitar filtro de origen"
                  >
                    ✕
                  </button>
                </span>
              )}

              {destinoFiltro && (
                <span className="inline-flex items-center gap-1 bg-white text-blue-900 px-2.5 py-1 rounded-full border border-blue-300 font-semibold shadow-xs">
                  <span>Destino: {destinoFiltro}</span>
                  <button
                    type="button"
                    onClick={() => handleDestinoChange('')}
                    className="hover:text-red-600 font-bold ml-1"
                    aria-label="Quitar filtro de destino"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="text-blue-800 hover:text-blue-950 font-bold underline ml-auto text-xs"
              >
                Limpiar todos
              </button>
            </div>
          )}

          {/* Estado de Carga */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">
                Cargando itinerarios y paradas disponibles desde Supabase...
              </p>
            </div>
          ) : filteredFrecuencias.length === 0 ? (
            /* ======================================================== */
            /* ESTADO VACÍO ("Sin resultados para este filtro") */
            /* ======================================================== */
            <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-gray-300 space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                🔎
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Sin resultados para este filtro
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
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
            /* Cuadrícula de Tarjetas de Frecuencias */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFrecuencias.map((frec) => {
                const coop = getCoop(frec.cooperativaId);
                const paradasFrec = paradas.filter((p) => p.frecuenciaId === frec.id);
                const busAsociado =
                  buses.find((b) => b.cooperativaId === frec.cooperativaId) || buses[0];

                return (
                  <Card
                    key={frec.id}
                    className="hover:shadow-lg transition-all border border-gray-200 overflow-hidden flex flex-col justify-between rounded-2xl"
                  >
                    <div>
                      {/* Cabecera de la Tarjeta */}
                      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white">
                        <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
                          <span className="font-bold">{coop?.nombre || 'Cooperativa'}</span>
                          <span className="font-mono bg-blue-800/80 px-2 py-0.5 rounded text-[10px]">
                            {frec.resolucionANT || 'ANT-CERT'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-lg font-black">{frec.origen}</div>
                          <div className="text-xs text-blue-300 px-2 flex items-center">
                            <span className="h-px w-5 bg-blue-400 mr-1" />
                            <span>{frec.duracion || 'En ruta'}</span>
                            <span className="h-px w-5 bg-blue-400 ml-1" />
                          </div>
                          <div className="text-lg font-black">{frec.destino}</div>
                        </div>
                      </div>

                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Hora de salida:</span>
                          <span className="font-bold text-gray-900 text-base">⏰ {frec.hora}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Modalidad de Viaje:</span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              (frec.tipoViaje || '').toLowerCase().includes('directo')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {frec.tipoViaje || (paradasFrec.length > 0 ? 'Con paradas' : 'Directo')}
                          </span>
                        </div>

                        {/* Detalles del Bus Asociado (Chasis, Carrocería, Asientos VIP) */}
                        {busAsociado && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between font-medium text-slate-700">
                              <span>Bus / Chasis:</span>
                              <span className="font-bold text-slate-900">
                                {busAsociado.marca || busAsociado.chasis || 'Unidad Autorizada'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Carrocería:</span>
                              <span>{busAsociado.carroceria || 'Estándar ANT'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span>Servicio VIP:</span>
                              {(busAsociado.asientosVIP ?? 0) > 0 ? (
                                <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  ★ {busAsociado.asientosVIP} asientos VIP
                                </span>
                              ) : (
                                <span className="text-gray-500">Solo Normal</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Escalas intermedias registradas */}
                        {paradasFrec.length > 0 && (
                          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-xs">
                            <span className="font-bold text-blue-900 block mb-1">
                              📍 {paradasFrec.length} Parada(s) Intermedia(s):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {paradasFrec.map((p) => (
                                <span
                                  key={p.id}
                                  className="bg-white text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200"
                                >
                                  #{p.orden} {p.ciudad}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
                          <span className="text-gray-500">Tarifa Ruta Completa:</span>
                          <span className="font-extrabold text-blue-600 text-lg">
                            ${frec.precioBase.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200">
                          <span>Tarifas por tramos y 50% de descuento ANT disponibles</span>
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <Button
                        variant="primary"
                        className="w-full font-bold shadow-sm"
                        onClick={() => handleOpenBooking(frec)}
                      >
                        Seleccionar Tramo y Asientos
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE SELECCIÓN DINÁMICA DE TRAMO Y COMPRA DE BOLETO */}
      {/* ======================================================== */}
      {selectedFrecuencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Reserva y Validación Legal ANT
                </span>
                <h2 className="text-xl font-black">
                  {nombreOrigen} ➔ {nombreDestino}
                </h2>
                <p className="text-xs text-slate-300">
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
              {boletoGenerado ? (
                /* Pantalla de Éxito con Boleto y Código QR */
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">¡Boleto Emitido Exitosamente!</h3>
                    <p className="text-sm text-gray-600">
                      Presenta este código QR y tu cédula original al abordar la unidad.
                    </p>
                  </div>

                  <div className="bg-slate-50 border-2 border-dashed border-gray-300 p-6 rounded-2xl max-w-sm mx-auto shadow-sm">
                    <div className="flex justify-center mb-4">
                      <QRCodeSVG
                        value={boletoGenerado.codigoQr || boletoGenerado.id}
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="font-mono text-xs font-bold text-blue-800 bg-blue-100 py-1 px-2 rounded mb-3">
                      {boletoGenerado.codigoQr}
                    </div>
                    <div className="text-left text-xs space-y-1.5 text-gray-700">
                      <div>
                        <strong>Pasajero:</strong> {boletoGenerado.pasajeroNombre}
                      </div>
                      <div>
                        <strong>Cédula:</strong> {boletoGenerado.pasajeroCedula} ({cedulaInfo?.provincia || 'Ecuador'})
                      </div>
                      <div>
                        <strong>Tarifa / Beneficio:</strong>{' '}
                        <Badge variant="cooperativa">
                          {boletoGenerado.tipoPasajero?.toUpperCase() || 'GENERAL'}
                        </Badge>
                      </div>
                      <div>
                        <strong>Asiento:</strong> #{boletoGenerado.asiento}
                      </div>
                      <div>
                        <strong>Tramo:</strong> {nombreOrigen} ➔ {nombreDestino}
                      </div>
                      <div>
                        <strong>Descuento Legal:</strong> -${(boletoGenerado.descuento || 0).toFixed(2)}
                      </div>
                      <div>
                        <strong>Total Pagado:</strong> ${boletoGenerado.precio.toFixed(2)}
                      </div>
                      <div>
                        <strong>Resolución ANT:</strong> {selectedFrecuencia.resolucionANT || 'ANT-CERT'}
                      </div>
                    </div>
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
                  <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200">
                    <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>📍 1. Configuración del Tramo de Viaje</span>
                      <Badge variant="cooperativa">Cálculo Proporcional ANT</Badge>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="modal-origen"
                          className="block text-xs font-bold text-gray-700 uppercase mb-1"
                        >
                          Parada de Abordaje (Origen)
                        </label>
                        <select
                          id="modal-origen"
                          value={selectedOrigenId}
                          onChange={(e) => handleCambioOrigen(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          {secuenciaParadas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.tipo === 'origen'
                                ? `🚩 ${p.ciudad} (Terminal Origen)`
                                : p.tipo === 'destino'
                                ? `🏁 ${p.ciudad} (Terminal Destino)`
                                : `📍 ${p.ciudad} (Escala #${p.orden})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="modal-destino"
                          className="block text-xs font-bold text-gray-700 uppercase mb-1"
                        >
                          Parada de Desembarque (Destino)
                        </label>
                        <select
                          id="modal-destino"
                          value={selectedDestinoId}
                          onChange={(e) => handleCambioDestino(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          {secuenciaParadas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.tipo === 'origen'
                                ? `🚩 ${p.ciudad} (Terminal Origen)`
                                : p.tipo === 'destino'
                                ? `🏁 ${p.ciudad} (Terminal Destino)`
                                : `📍 ${p.ciudad} (Escala #${p.orden})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Alertas de Validación o Resumen de Tarifa Proporcional */}
                    {errorTramo ? (
                      <div className="mt-3 p-3 bg-red-100 text-red-800 text-xs rounded-xl border border-red-300 flex items-center gap-2 font-semibold">
                        <span>⚠️</span>
                        <span>{errorTramo}</span>
                      </div>
                    ) : calculoTramo ? (
                      <div className="mt-3 p-3 bg-white/80 rounded-xl border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <strong>Recorrido válido:</strong> {nombreOrigen} ➔ {nombreDestino} (
                          {calculoTramo.porcentajeRecorrido}% de la ruta).
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Tarifa Tramo ANT:</span>
                          <span className="font-extrabold text-blue-700 text-sm">
                            ${calculoTramo.precioCalculadoTramo.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Cuerpo: Mapa de Asientos por Tramo + Formulario con Cédula y Descuento ANT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Mapa de Asientos */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
                        <span>2. Elige tu Asiento para este Tramo</span>
                        <span className="text-xs font-normal text-gray-500">
                          Bus: {selectedBus?.placa || 'Unidad Asignada'}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Asientos disponibles calculados exclusivamente para el tramo {nombreOrigen} ➔ {nombreDestino}.
                      </p>
                      <SeatSelector
                        totalCapacity={selectedBus?.capacidad || 40}
                        vipSeats={selectedBus?.asientosVIPNumeros || [1, 2, 3, 4, 5, 6, 7, 8]}
                        occupiedSeats={occupiedSeats}
                        selectedSeat={selectedSeat}
                        onSelectSeat={(num) => setSelectedSeat(num)}
                        precioBase={precioBaseTramo}
                      />
                    </div>

                    {/* Columna Derecha: Formulario con Validación de Cédula y Descuento ANT */}
                    <div className="flex flex-col justify-between">
                      <form onSubmit={handleConfirmPurchase} className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          3. Datos del Pasajero y Validación ANT
                        </h3>

                        {errorMsg && (
                          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
                            {errorMsg}
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor="pasajero-nombre"
                            className="block text-xs font-bold text-gray-700 uppercase mb-1"
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
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Campo de Cédula con Validación en Tiempo Real (Módulo 10) */}
                        <div>
                          <label
                            htmlFor="pasajero-cedula"
                            className="block text-xs font-bold text-gray-700 uppercase mb-1"
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
                                ? 'border-green-500 bg-green-50/40 focus:ring-green-500'
                                : cedulaInfo && !cedulaInfo.valida
                                ? 'border-red-400 bg-red-50/40 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                          />
                          {cedulaInfo && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              {cedulaInfo.valida ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <span>✔</span>
                                  <span>Cédula legítima de la provincia de {cedulaInfo.provincia}</span>
                                </span>
                              ) : (
                                <span className="text-red-600 font-medium flex items-center gap-1">
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
                            className="block text-xs font-bold text-gray-700 uppercase mb-1"
                          >
                            Fecha de Nacimiento (Para cálculo automático de tarifa preferencial ANT)
                          </label>
                          <input
                            type="date"
                            id="pasajero-fecha-nac"
                            value={fechaNacimiento}
                            onChange={(e) => setFechaNacimiento(e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                          />
                          {edadCalculada !== null && edadCalculada >= 0 && (
                            <div className="mt-1 text-xs">
                              {edadCalculada < 18 ? (
                                <span className="text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                                  👦 Menor de Edad ({edadCalculada} años) - 50% de Descuento por Ley ANT
                                </span>
                              ) : edadCalculada >= 65 ? (
                                <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                                  🧓 Adulto Mayor ({edadCalculada} años) - 50% de Descuento por Ley ANT
                                </span>
                              ) : (
                                <span className="text-gray-600">
                                  🧑 Adulto ({edadCalculada} años) - Tarifa General
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Opción de Discapacidad */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                            <input
                              type="checkbox"
                              checked={esDiscapacitado}
                              onChange={(e) => setEsDiscapacitado(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span>Persona con Discapacidad (Ley Orgánica de Discapacidades)</span>
                          </label>

                          {esDiscapacitado && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                              <div>
                                <label
                                  htmlFor="pasajero-discapacidad-pct"
                                  className="block text-[11px] font-semibold text-gray-600"
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
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="pasajero-conadis"
                                  className="block text-[11px] font-semibold text-gray-600"
                                >
                                  N° Carnet CONADIS / MSP
                                </label>
                                <input
                                  type="text"
                                  id="pasajero-conadis"
                                  placeholder="Ej: CONADIS-0456"
                                  value={carnetConadis}
                                  onChange={(e) => setCarnetConadis(e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Método de Pago */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Método de Pago
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['tarjeta', 'transferencia', 'efectivo'] as const).map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setMetodoPago(method)}
                                className={`py-2 px-2 text-xs font-bold rounded-lg border capitalize transition-all ${
                                  metodoPago === method
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {method === 'tarjeta'
                                  ? '💳 Tarjeta'
                                  : method === 'transferencia'
                                  ? '🏦 Transferencia'
                                  : '💵 En Taquilla'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {metodoPago === 'transferencia' && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                            <p className="font-bold">Datos Bancarios para Transferencia:</p>
                            <p>Banco Pichincha - Cta. Corriente: 2100456789</p>
                            <p>Beneficiario: EcuRutas Interprovincial UTA (RUC: 1890001234001)</p>
                            <input
                              type="text"
                              placeholder="URL o número de comprobante..."
                              value={comprobanteUrl}
                              onChange={(e) => setComprobanteUrl(e.target.value)}
                              className="mt-1 w-full text-xs border border-amber-300 rounded px-2 py-1 bg-white"
                            />
                          </div>
                        )}

                        {/* Desglose de Pago Dinámico por Tramo y Descuentos ANT */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1.5 text-xs text-gray-700">
                          <div className="flex justify-between">
                            <span>Tramo Seleccionado:</span>
                            <span className="font-bold text-gray-900">
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
                              {selectedSeat
                                ? `#${selectedSeat} ${isVipSeat ? '(VIP +25%)' : '(Normal)'}`
                                : 'No elegido'}
                            </span>
                          </div>
                          {desgloseTarifa.recargoVip > 0 && (
                            <div className="flex justify-between text-amber-700">
                              <span>Recargo Servicio VIP (25%):</span>
                              <span>+${desgloseTarifa.recargoVip.toFixed(2)}</span>
                            </div>
                          )}
                          {desgloseTarifa.aplicaDescuento && (
                            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              <span>Descuento 50% ANT ({desgloseTarifa.tipoBeneficiario.replace('_', ' ').toUpperCase()}):</span>
                              <span>-${desgloseTarifa.valorDescuento.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
                            <span>Total a Pagar:</span>
                            <span className="text-blue-700 text-base">${desgloseTarifa.totalConVip.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 italic pt-1">
                            {desgloseTarifa.justificacionLegal}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          disabled={
                            submitting ||
                            !selectedSeat ||
                            !!errorTramo ||
                            loadingTramo ||
                            (cedula.length === 10 && !cedulaInfo?.valida)
                          }
                          className="w-full py-3 text-base font-bold shadow-lg shadow-blue-700/20"
                        >
                          {submitting
                            ? 'Emitiendo Boleto...'
                            : `Confirmar y Emitir Boleto ($${desgloseTarifa.totalConVip.toFixed(2)})`}
                        </Button>
                      </form>
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
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-500 font-medium">Inicializando buscador con filtros avanzados...</p>
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
