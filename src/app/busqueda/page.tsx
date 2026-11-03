'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '@/lib/services/dataService';
import type {
  FrecuenciaRow,
  CooperativaRow,
  BusRow,
  RutaRow,
  BoletoRow,
  ParadaFrecuenciaRow,
  ParadaRuta,
  CalculoTarifaTramo,
} from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SeatSelector } from '@/components/bus/SeatSelector';

export default function BusquedaPage() {
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda
  const [origenFiltro, setOrigenFiltro] = useState('');
  const [destinoFiltro, setDestinoFiltro] = useState('');
  const [coopFiltro, setCoopFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);

  // Estado del modal de compra y selección de tramo
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

  // Datos del pasajero
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [tipoPasajero, setTipoPasajero] = useState<'general' | 'tercera_edad' | 'discapacidad' | 'menor'>('general');
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'transferencia' | 'efectivo'>('tarjeta');
  const [comprobanteUrl, setComprobanteUrl] = useState('');

  // Proceso de compra
  const [submitting, setSubmitting] = useState(false);
  const [boletoGenerado, setBoletoGenerado] = useState<BoletoRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        console.error('Error al cargar catálogo de transporte:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Ciudades únicas para autocompletado en filtros (incluye terminales y paradas intermedias)
  const todasCiudades = Array.from(
    new Set([
      ...frecuencias.map((f) => f.origen),
      ...frecuencias.map((f) => f.destino),
      ...paradas.map((p) => p.ciudad),
    ])
  ).sort();

  // Filtrado reactivo de frecuencias (permite coincidencia con paradas intermedias)
  const filteredFrecuencias = frecuencias.filter((f) => {
    const paradasFrec = paradas.filter((p) => p.frecuenciaId === f.id);
    const ciudadesFrec = [f.origen, ...paradasFrec.map((p) => p.ciudad), f.destino].map((c) =>
      c.toLowerCase()
    );

    if (origenFiltro && !ciudadesFrec.some((c) => c.includes(origenFiltro.toLowerCase()))) {
      return false;
    }
    if (destinoFiltro && !ciudadesFrec.some((c) => c.includes(destinoFiltro.toLowerCase()))) {
      return false;
    }
    if (coopFiltro && f.cooperativaId !== coopFiltro) {
      return false;
    }
    return true;
  });

  const getCoop = (id: string) => cooperativas.find((c) => c.id === id);

  /**
   * Recalcula la tarifa proporcional y la disponibilidad de asientos
   * en función de las paradas de origen y destino seleccionadas.
   */
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

      // Validar orden topológico
      const validacion = await dataService.validarTramo(frec.id, origenId, destinoId);
      if (validacion.error || !validacion.data?.valido) {
        setErrorTramo(validacion.error ?? validacion.data?.mensaje ?? 'Tramo seleccionado inválido.');
        setCalculoTramo(null);
        setLoadingTramo(false);
        return;
      }

      // Calcular tarifa proporcional ANT
      const calculoRes = await dataService.calcularTarifaTramo(frec.id, origenId, destinoId);
      if (calculoRes.error || !calculoRes.data) {
        setErrorTramo(calculoRes.error ?? 'No se pudo calcular la tarifa del tramo.');
        setCalculoTramo(null);
      } else {
        setCalculoTramo(calculoRes.data);
      }

      // Consultar asientos ocupados específicamente para este segmento intermedio
      const ocupadosRes = await dataService.fetchAsientosOcupadosEnTramo(rutaId, origenId, destinoId);
      const nuevosOcupados = ocupadosRes.data ?? [];
      setOccupiedSeats(nuevosOcupados);

      // Deseleccionar asiento si quedó bloqueado en el nuevo segmento
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

    // 1. Buscar o asignar ruta para la fecha
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

    // 2. Encontrar el bus asignado
    const busObj = buses.find((b) => b.id === ruta?.busId) || buses[0];
    setSelectedBus(busObj);

    // 3. Cargar secuencia completa de paradas de la frecuencia
    const secuencia = await dataService.getParadasCompletas(frec.id);
    setSecuenciaParadas(secuencia);

    // 4. Determinar parada origen por defecto (si coincide con filtro de usuario, usarla)
    let defOrigen = secuencia[0]?.id || '';
    if (origenFiltro) {
      const match = secuencia.find((p) =>
        p.ciudad.toLowerCase().includes(origenFiltro.toLowerCase())
      );
      if (match) defOrigen = match.id;
    }

    // 5. Determinar parada destino por defecto (si coincide con filtro de usuario, usarla)
    let defDestino = secuencia[secuencia.length - 1]?.id || '';
    if (destinoFiltro) {
      const match = secuencia.find((p) =>
        p.ciudad.toLowerCase().includes(destinoFiltro.toLowerCase())
      );
      if (match) defDestino = match.id;
    }

    setSelectedOrigenId(defOrigen);
    setSelectedDestinoId(defDestino);

    // 6. Calcular tarifas y asientos ocupados iniciales del tramo
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

  const handleCloseBooking = () => {
    setSelectedFrecuencia(null);
    setSelectedRuta(null);
    setSelectedSeat(null);
    setBoletoGenerado(null);
    setCalculoTramo(null);
    setErrorTramo(null);
  };

  // Nombres descriptivos de las paradas seleccionadas
  const paradaOrigenObj = secuenciaParadas.find((p) => p.id === selectedOrigenId);
  const paradaDestinoObj = secuenciaParadas.find((p) => p.id === selectedDestinoId);
  const nombreOrigen = paradaOrigenObj?.ciudad || selectedFrecuencia?.origen || 'Origen';
  const nombreDestino = paradaDestinoObj?.ciudad || selectedFrecuencia?.destino || 'Destino';

  // Cálculo matemático de tarifa proporcional y descuentos por ley
  const precioBaseTramo = calculoTramo?.precioCalculadoTramo ?? selectedFrecuencia?.precioBase ?? 0;
  const isVipSeat = selectedBus?.asientosVIPNumeros?.includes(selectedSeat || -1);
  const seatPrice = isVipSeat ? precioBaseTramo * 1.25 : precioBaseTramo;
  const discountRate = tipoPasajero !== 'general' ? 0.5 : 0;
  const finalDiscount = seatPrice * discountRate;
  const finalTotal = seatPrice - finalDiscount;

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
    if (!nombre.trim() || !cedula.trim()) {
      setErrorMsg('Por favor completa tu nombre completo y número de cédula.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const nuevoBoleto = await dataService.createBoleto({
        rutaId: selectedRuta!.id,
        pasajeroId: null,
        asiento: selectedSeat,
        precio: Number(finalTotal.toFixed(2)),
        descuento: Number(finalDiscount.toFixed(2)),
        tipoPasajero,
        metodoPago,
        comprobanteUrl: comprobanteUrl || null,
        estado: metodoPago === 'transferencia' ? 'emitido' : 'pagado',
        vendidoPor: 'online_publico',
        vendidoPorChoferId: null,
        paradaOrigenId: selectedOrigenId || null,
        paradaDestinoId: selectedDestinoId || null,
        pasajeroNombre: nombre.trim(),
        pasajeroCedula: cedula.trim(),
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
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Búsqueda de Frecuencias y Paradas Intermedias
            </h1>
            <Badge variant="success">ANT CERTIFICADO</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Consulta itinerarios con paradas intermedias, cálculo proporcional de tarifas ANT y disponibilidad de asientos en tiempo real.
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
      </div>

      {/* Barra de Filtros con soporte para escalas intermedias */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
            Ciudad Origen / Escala
          </label>
          <select
            value={origenFiltro}
            onChange={(e) => setOrigenFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las ciudades de origen</option>
            {todasCiudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
            Ciudad Destino / Escala
          </label>
          <select
            value={destinoFiltro}
            onChange={(e) => setDestinoFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las ciudades de destino</option>
            {todasCiudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
            Fecha de Viaje
          </label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
            Cooperativa
          </label>
          <select
            value={coopFiltro}
            onChange={(e) => setCoopFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las cooperativas</option>
            {cooperativas.map((co) => (
              <option key={co.id} value={co.id}>
                {co.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultados de Frecuencias */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando itinerarios y paradas disponibles...</p>
        </div>
      ) : filteredFrecuencias.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-base">
            No se encontraron frecuencias para los filtros seleccionados.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setOrigenFiltro('');
              setDestinoFiltro('');
              setCoopFiltro('');
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFrecuencias.map((frec) => {
            const coop = getCoop(frec.cooperativaId);
            const paradasFrec = paradas.filter((p) => p.frecuenciaId === frec.id);

            return (
              <Card
                key={frec.id}
                className="hover:shadow-lg transition-all border border-gray-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white">
                    <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
                      <span>{coop?.nombre || 'Cooperativa'}</span>
                      <span className="font-mono bg-blue-800/80 px-2 py-0.5 rounded text-[10px]">
                        {frec.resolucionANT || 'ANT-CERT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-lg font-black">{frec.origen}</div>
                      <div className="text-xs text-blue-300 px-2 flex items-center">
                        <span className="h-px w-6 bg-blue-400 mr-1" />
                        <span>{frec.duracion || 'En ruta'}</span>
                        <span className="h-px w-6 bg-blue-400 ml-1" />
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
                      <span className="text-gray-500">Modalidad:</span>
                      <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full">
                        {frec.tipoViaje || 'Directo'}
                      </span>
                    </div>

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
                      <span>Tarifas por tramos proporcionales disponibles</span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <Button
                    variant="primary"
                    className="w-full font-bold"
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

      {/* Modal de Selección Dinámica de Tramo y Compra */}
      {selectedFrecuencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Reserva de Boleto por Tramos Intermedios (ANT)
                </span>
                <h2 className="text-xl font-black">
                  {nombreOrigen} ➔ {nombreDestino}
                </h2>
                <p className="text-xs text-slate-300">
                  Frecuencia Base: {selectedFrecuencia.origen} - {selectedFrecuencia.destino} | Salida: {selectedFrecuencia.hora} | Fecha: {fechaFiltro} |{' '}
                  {getCoop(selectedFrecuencia.cooperativaId)?.nombre}
                </p>
              </div>
              <button
                onClick={handleCloseBooking}
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
                      Presenta este código QR al chofer al momento de abordar la unidad en tu parada.
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
                        <strong>Cédula:</strong> {boletoGenerado.pasajeroCedula}
                      </div>
                      <div>
                        <strong>Asiento:</strong> #{boletoGenerado.asiento}
                      </div>
                      <div>
                        <strong>Tramo Recorrido:</strong> {nombreOrigen} ➔ {nombreDestino}
                      </div>
                      <div>
                        <strong>Resolución ANT:</strong> {selectedFrecuencia.resolucionANT || 'ANT-CERT'}
                      </div>
                      <div>
                        <strong>Total Pagado:</strong> ${boletoGenerado.precio.toFixed(2)}
                      </div>
                      <div>
                        <strong>Estado:</strong>{' '}
                        <Badge variant={boletoGenerado.estado === 'pagado' ? 'success' : 'warning'}>
                          {boletoGenerado.estado.toUpperCase()}
                        </Badge>
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
                /* Flujo de Selección de Tramo + Mapa de Asientos + Pago */
                <div className="space-y-6">
                  {/* Selector Dinámico de Paradas Intermedias */}
                  <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200">
                    <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>📍 1. Configuración del Tramo de Viaje</span>
                      <Badge variant="cooperativa">Cálculo Proporcional ANT</Badge>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Parada de Abordaje (Origen)
                        </label>
                        <select
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
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Parada de Desembarque (Destino)
                        </label>
                        <select
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
                          {calculoTramo.distanciaKmTramo && (
                            <span className="text-gray-500 ml-1">
                              ({calculoTramo.distanciaKmTramo} km / {calculoTramo.distanciaKmTotal} km)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Tarifa Tramo ANT:</span>
                          <span className="font-extrabold text-blue-700 text-sm">
                            ${calculoTramo.precioCalculadoTramo.toFixed(2)}
                          </span>
                          {calculoTramo.tarifaMinimaAplicada && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                              Tarifa Mínima Legal
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Cuerpo: Mapa de Asientos por Tramo + Formulario de Pasajero */}
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
                        Los asientos libres se calculan en base a los pasajeros que viajan en el segmento {nombreOrigen} ➔ {nombreDestino}.
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

                    {/* Columna Derecha: Formulario del Pasajero y Pago */}
                    <div className="flex flex-col justify-between">
                      <form onSubmit={handleConfirmPurchase} className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900 mb-3">
                          3. Datos del Pasajero y Pago
                        </h3>

                        {errorMsg && (
                          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                            {errorMsg}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Nombres y Apellidos *
                          </label>
                          <input
                            type="text"
                            required
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Juan José Carvajal"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Cédula / Documento de Identidad *
                          </label>
                          <input
                            type="text"
                            required
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            placeholder="Ej: 1804567890"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Tipo de Tarifa / Descuento Legal (Ley de Tránsito)
                          </label>
                          <select
                            value={tipoPasajero}
                            onChange={(e) =>
                              setTipoPasajero(
                                e.target.value as 'general' | 'tercera_edad' | 'discapacidad' | 'menor'
                              )
                            }
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white"
                          >
                            <option value="general">Tarifa General (100%)</option>
                            <option value="tercera_edad">Tercera Edad (50% de Descuento)</option>
                            <option value="discapacidad">Persona con Discapacidad (50% Descuento)</option>
                            <option value="menor">Menor de Edad (50% Descuento)</option>
                          </select>
                        </div>

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

                        {/* Desglose de Pago Dinámico por Tramo */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1.5 text-xs text-gray-700">
                          <div className="flex justify-between">
                            <span>Tramo Seleccionado:</span>
                            <span className="font-bold text-gray-900">
                              {nombreOrigen} ➔ {nombreDestino}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tarifa Base Tramo ANT:</span>
                            <span>${precioBaseTramo.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Asiento Seleccionado:</span>
                            <span className="font-bold">
                              {selectedSeat
                                ? `#${selectedSeat} ${isVipSeat ? '(VIP +25%)' : '(Normal)'}`
                                : 'No elegido'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Subtotal Asiento:</span>
                            <span>${seatPrice.toFixed(2)}</span>
                          </div>
                          {finalDiscount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-semibold">
                              <span>Descuento Legal (50%):</span>
                              <span>-${finalDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
                            <span>Total a Pagar:</span>
                            <span className="text-blue-700 text-base">${finalTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          disabled={submitting || !selectedSeat || !!errorTramo || loadingTramo}
                          className="w-full py-3 text-base font-bold shadow-lg shadow-blue-700/20"
                        >
                          {submitting
                            ? 'Emitiendo Boleto...'
                            : `Confirmar y Emitir Boleto ($${finalTotal.toFixed(2)})`}
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
