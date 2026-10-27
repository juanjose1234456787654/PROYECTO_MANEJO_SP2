'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '@/lib/services/dataService';
import type {
  FrecuenciaRow,
  CooperativaRow,
  BusRow,
  RutaRow,
  BoletoRow,
} from '@/lib/data/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SeatSelector } from '@/components/bus/SeatSelector';

export default function BusquedaPage() {
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [origenFiltro, setOrigenFiltro] = useState('');
  const [destinoFiltro, setDestinoFiltro] = useState('');
  const [coopFiltro, setCoopFiltro] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);

  // Estado del modal de compra
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaRow | null>(null);
  const [selectedRuta, setSelectedRuta] = useState<RutaRow | null>(null);
  const [selectedBus, setSelectedBus] = useState<BusRow | null>(null);
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
        const [frecData, coopData, busData, rutaData] = await Promise.all([
          dataService.getFrecuencias(),
          dataService.getCooperativas(),
          dataService.getBuses(),
          dataService.getRutas(),
        ]);
        setFrecuencias(frecData);
        setCooperativas(coopData);
        setBuses(busData);
        setRutas(rutaData);
      } catch (err) {
        console.error('Error al cargar catálogo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Ciudades únicas para autocompletado
  const ciudadesOrigen = Array.from(new Set(frecuencias.map(f => f.origen)));
  const ciudadesDestino = Array.from(new Set(frecuencias.map(f => f.destino)));

  // Filtrado reactivo
  const filteredFrecuencias = frecuencias.filter(f => {
    if (origenFiltro && !f.origen.toLowerCase().includes(origenFiltro.toLowerCase())) return false;
    if (destinoFiltro && !f.destino.toLowerCase().includes(destinoFiltro.toLowerCase())) return false;
    if (coopFiltro && f.cooperativaId !== coopFiltro) return false;
    return true;
  });

  const getCoop = (id: string) => cooperativas.find(c => c.id === id);

  const handleOpenBooking = async (frec: FrecuenciaRow) => {
    setSelectedFrecuencia(frec);
    setSelectedSeat(null);
    setBoletoGenerado(null);
    setErrorMsg(null);

    // Buscar o asignar ruta para la fecha
    let ruta = rutas.find(r => r.frecuenciaId === frec.id && r.fecha === fechaFiltro);
    if (!ruta) {
      // Asignar primer bus de la cooperativa
      const busDeCoop = buses.find(b => b.cooperativaId === frec.cooperativaId) || buses[0];
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
      setRutas(prev => [...prev, ruta!]);
    }
    setSelectedRuta(ruta);

    // Encontrar el bus asignado
    const busObj = buses.find(b => b.id === ruta?.busId) || buses[0];
    setSelectedBus(busObj);

    // Cargar asientos ocupados de esta ruta
    const boletosRuta = await dataService.getBoletos({ rutaId: ruta.id });
    const ocupados = boletosRuta
      .filter(b => b.estado !== 'cancelado')
      .map(b => b.asiento);
    setOccupiedSeats(ocupados);
  };

  const handleCloseBooking = () => {
    setSelectedFrecuencia(null);
    setSelectedRuta(null);
    setSelectedSeat(null);
    setBoletoGenerado(null);
  };

  // Cálculo de precio con descuento
  const basePrice = selectedFrecuencia?.precioBase || 0;
  const isVipSeat = selectedBus?.asientosVIPNumeros?.includes(selectedSeat || -1);
  const seatPrice = isVipSeat ? basePrice * 1.25 : basePrice;
  const discountRate = tipoPasajero !== 'general' ? 0.5 : 0;
  const finalDiscount = seatPrice * discountRate;
  const finalTotal = seatPrice - finalDiscount;

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) {
      setErrorMsg('Debes seleccionar un asiento en el mapa del bus.');
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
        pasajeroId: null, // Si no está logueado se guarda con su cédula
        asiento: selectedSeat,
        precio: Number(finalTotal.toFixed(2)),
        descuento: Number(finalDiscount.toFixed(2)),
        tipoPasajero,
        metodoPago,
        comprobanteUrl: comprobanteUrl || null,
        estado: metodoPago === 'transferencia' ? 'emitido' : 'pagado',
        vendidoPor: 'online_publico',
        vendidoPorChoferId: null,
        paradaOrigenId: null,
        paradaDestinoId: null,
        pasajeroNombre: nombre.trim(),
        pasajeroCedula: cedula.trim(),
        abordadoAt: null,
      });

      setBoletoGenerado(nuevoBoleto);
      setOccupiedSeats(prev => [...prev, selectedSeat]);
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
              Búsqueda de Frecuencias y Horarios
            </h1>
            <Badge variant="success">CATÁLOGO ACTIVO</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Consulta disponibilidad en tiempo real, compara tarifas y reserva tus asientos VIP o normales.
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

      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
            Origen
          </label>
          <select
            value={origenFiltro}
            onChange={e => setOrigenFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las ciudades origen</option>
            {ciudadesOrigen.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
            Destino
          </label>
          <select
            value={destinoFiltro}
            onChange={e => setDestinoFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las ciudades destino</option>
            {ciudadesDestino.map(c => (
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
            onChange={e => setFechaFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
            Cooperativa
          </label>
          <select
            value={coopFiltro}
            onChange={e => setCoopFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las cooperativas</option>
            {cooperativas.map(co => (
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
          <p className="text-sm text-gray-500">Cargando itinerarios disponibles...</p>
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
          {filteredFrecuencias.map(frec => {
            const coop = getCoop(frec.cooperativaId);
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
                    <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
                      <span className="text-gray-500">Tarifa Normal:</span>
                      <span className="font-extrabold text-blue-600 text-lg">
                        ${frec.precioBase.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200">
                      <span>Asientos VIP disponibles:</span>
                      <span className="font-bold">${(frec.precioBase * 1.25).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <Button
                    variant="primary"
                    className="w-full font-bold"
                    onClick={() => handleOpenBooking(frec)}
                  >
                    Seleccionar Asientos y Viajar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal / Drawer de Selección de Asientos y Compra */}
      {selectedFrecuencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Reserva y Compra Online
                </span>
                <h2 className="text-xl font-black">
                  {selectedFrecuencia.origen} ➔ {selectedFrecuencia.destino}
                </h2>
                <p className="text-xs text-slate-300">
                  Salida: {selectedFrecuencia.hora} | Fecha: {fechaFiltro} |{' '}
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
            <div className="p-6">
              {boletoGenerado ? (
                /* Pantalla de Éxito con Boleto y Código QR */
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">¡Boleto Emitido Exitosamente!</h3>
                    <p className="text-sm text-gray-600">
                      Presenta este código QR al chofer al momento de abordar la unidad.
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
                        <strong>Ruta:</strong> {selectedFrecuencia.origen} - {selectedFrecuencia.destino}
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
                /* Flujo de Compra: Mapa de Asientos + Datos del Pasajero */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Columna Izquierda: Mapa del Bus */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
                      <span>1. Elige tu Asiento</span>
                      <span className="text-xs font-normal text-gray-500">
                        Bus: {selectedBus?.placa || 'Unidad Asignada'}
                      </span>
                    </h3>
                    <SeatSelector
                      totalCapacity={selectedBus?.capacidad || 40}
                      vipSeats={selectedBus?.asientosVIPNumeros || [1, 2, 3, 4, 5, 6, 7, 8]}
                      occupiedSeats={occupiedSeats}
                      selectedSeat={selectedSeat}
                      onSelectSeat={(num) => setSelectedSeat(num)}
                      precioBase={selectedFrecuencia.precioBase}
                    />
                  </div>

                  {/* Columna Derecha: Formulario del Pasajero y Pago */}
                  <div className="flex flex-col justify-between">
                    <form onSubmit={handleConfirmPurchase} className="space-y-4">
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        2. Datos del Pasajero y Pago
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
                          Tipo de Tarifa / Descuento Legal
                        </label>
                        <select
                          value={tipoPasajero}
                          onChange={(e) =>
                            setTipoPasajero(e.target.value as 'general' | 'tercera_edad' | 'discapacidad' | 'menor')
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

                      {/* Desglose de Pago */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1.5 text-xs text-gray-700">
                        <div className="flex justify-between">
                          <span>Asiento Seleccionado:</span>
                          <span className="font-bold">
                            {selectedSeat ? `#${selectedSeat} ${isVipSeat ? '(VIP)' : '(Normal)'}` : 'No elegido'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
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
                        disabled={submitting || !selectedSeat}
                        className="w-full py-3 text-base font-bold shadow-lg shadow-blue-700/20"
                      >
                        {submitting ? 'Emitiendo Boleto...' : `Confirmar y Emitir Boleto ($${finalTotal.toFixed(2)})`}
                      </Button>
                    </form>
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
