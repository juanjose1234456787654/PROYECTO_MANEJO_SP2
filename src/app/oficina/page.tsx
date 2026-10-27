'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '@/lib/services/dataService';
import type {
  BoletoRow,
  RutaRow,
  FrecuenciaRow,
  BusRow,
  CooperativaRow,
} from '@/lib/data/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SeatSelector } from '@/components/bus/SeatSelector';

export default function OficinaPage() {
  const [activeTab, setActiveTab] = useState<'ventanilla' | 'validar_pagos'>('ventanilla');
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Ventanilla
  const [selectedRutaId, setSelectedRutaId] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [tipoPasajero, setTipoPasajero] = useState<'general' | 'tercera_edad' | 'discapacidad' | 'menor'>('general');
  const [submitting, setSubmitting] = useState(false);
  const [boletoEmitido, setBoletoEmitido] = useState<BoletoRow | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bolList, rutList, frecList, busList, coopList] = await Promise.all([
          dataService.getBoletos(),
          dataService.getRutas(),
          dataService.getFrecuencias(),
          dataService.getBuses(),
          dataService.getCooperativas(),
        ]);
        setBoletos(bolList);
        setRutas(rutList);
        setFrecuencias(frecList);
        setBuses(busList);
        setCooperativas(coopList);
        if (rutList.length > 0) setSelectedRutaId(rutList[0].id);
      } catch (err) {
        console.error('Error al cargar datos de oficina:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentRuta = rutas.find((r) => r.id === selectedRutaId);
  const currentFrec = frecuencias.find((f) => f.id === currentRuta?.frecuenciaId);
  const currentBus = buses.find((b) => b.id === currentRuta?.busId);
  const currentCoop = cooperativas.find((c) => c.id === currentFrec?.cooperativaId);

  // Asientos ocupados en la ruta actual
  const occupiedSeats = boletos
    .filter((b) => b.rutaId === selectedRutaId && b.estado !== 'cancelado')
    .map((b) => b.asiento);

  // Cálculo de tarifa
  const basePrice = currentFrec?.precioBase || 5.0;
  const isVip = currentBus?.asientosVIPNumeros?.includes(selectedSeat || -1);
  const seatPrice = isVip ? basePrice * 1.25 : basePrice;
  const discountRate = tipoPasajero !== 'general' ? 0.5 : 0;
  const discountValue = seatPrice * discountRate;
  const finalTotal = seatPrice - discountValue;

  // Boletos pendientes de validación por transferencia
  const boletosPendientes = boletos.filter(
    (b) => b.metodoPago === 'transferencia' && b.estado === 'emitido'
  );

  // Emitir boleto físico en taquilla
  const handleVentaVentanilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) {
      alert('Por favor selecciona un asiento del bus.');
      return;
    }
    setSubmitting(true);
    const nuevoBoleto = await dataService.createBoleto({
      rutaId: selectedRutaId,
      pasajeroId: null,
      asiento: selectedSeat,
      precio: Number(finalTotal.toFixed(2)),
      descuento: Number(discountValue.toFixed(2)),
      tipoPasajero,
      metodoPago: 'efectivo',
      comprobanteUrl: null,
      estado: 'pagado',
      vendidoPor: 'taquilla_ventanilla',
      vendidoPorChoferId: null,
      paradaOrigenId: null,
      paradaDestinoId: null,
      pasajeroNombre: nombre.trim(),
      pasajeroCedula: cedula.trim(),
      abordadoAt: null,
    });
    setBoletos((prev) => [nuevoBoleto, ...prev]);
    setBoletoEmitido(nuevoBoleto);
    setSelectedSeat(null);
    setNombre('');
    setCedula('');
    setSubmitting(false);
  };

  // Aprobar pago por transferencia
  const handleAprobarPago = async (boletoId: string) => {
    await dataService.updateBoletoEstado(boletoId, 'pagado');
    setBoletos((prev) =>
      prev.map((b) => (b.id === boletoId ? { ...b, estado: 'pagado' } : b))
    );
  };

  // Rechazar pago
  const handleRechazarPago = async (boletoId: string) => {
    await dataService.updateBoletoEstado(boletoId, 'cancelado');
    setBoletos((prev) =>
      prev.map((b) => (b.id === boletoId ? { ...b, estado: 'cancelado' } : b))
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Punto de Venta y Ventanilla
            </h1>
            <Badge variant="oficinista">OFICINISTA</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Emisión presencial de pasajes en taquilla, aplicación de descuentos de ley y validación de transferencias bancarias.
          </p>
        </div>
      </div>

      {/* Pestañas de Navegación de Oficinista */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ventanilla')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'ventanilla'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          🎟️ Venta en Ventanilla
        </button>
        <button
          onClick={() => setActiveTab('validar_pagos')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'validar_pagos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>💳 Validar Transferencias Bancarias</span>
          {boletosPendientes.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {boletosPendientes.length}
            </span>
          )}
        </button>
      </div>

      {/* PESTAÑA 1: VENTA EN VENTANILLA */}
      {activeTab === 'ventanilla' && (
        <div className="space-y-6">
          {/* Selector de Ruta Activa */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-96">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Selecciona la Ruta a Despachar
              </label>
              <select
                value={selectedRutaId}
                onChange={(e) => {
                  setSelectedRutaId(e.target.value);
                  setSelectedSeat(null);
                }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white font-bold"
              >
                {rutas.map((r) => {
                  const f = frecuencias.find((frec) => frec.id === r.frecuenciaId);
                  const b = buses.find((bus) => bus.id === r.busId);
                  return (
                    <option key={r.id} value={r.id}>
                      {r.fecha} | {f?.origen} ➔ {f?.destino} ({f?.hora}) - Bus #{b?.numero}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="text-xs text-gray-600 flex items-center gap-4">
              <div>
                <strong>Cooperativa:</strong> {currentCoop?.nombre || 'EcuRutas'}
              </div>
              <div>
                <strong>Ocupación:</strong> {occupiedSeats.length} / {currentBus?.capacidad || 40} asientos
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mapa de Asientos */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">
                1. Mapa de Asientos en Vivo
              </h2>
              <SeatSelector
                totalCapacity={currentBus?.capacidad || 40}
                vipSeats={currentBus?.asientosVIPNumeros || [1, 2, 3, 4, 5, 6, 7, 8]}
                occupiedSeats={occupiedSeats}
                selectedSeat={selectedSeat}
                onSelectSeat={(num) => setSelectedSeat(num)}
                precioBase={basePrice}
              />
            </div>

            {/* Formulario de Emisión Presencial */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">
                2. Datos de Emisión y Facturación
              </h2>
              <form onSubmit={handleVentaVentanilla} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Cédula de Identidad Ecuatoriana *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 1803456789"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nombres y Apellidos del Pasajero *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Marcelo Paredes"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Categoría / Descuento Legal Aplicable
                  </label>
                  <select
                    value={tipoPasajero}
                    onChange={(e) =>
                      setTipoPasajero(e.target.value as 'general' | 'tercera_edad' | 'discapacidad' | 'menor')
                    }
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-bold"
                  >
                    <option value="general">Tarifa General (Sin descuento)</option>
                    <option value="tercera_edad">Tercera Edad (50% de Descuento Legal)</option>
                    <option value="discapacidad">Persona con Discapacidad (50% Descuento Legal)</option>
                    <option value="menor">Menor de Edad / Estudiante (50% Descuento)</option>
                  </select>
                </div>

                {/* Resumen de cobro */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Asiento Seleccionado:</span>
                    <strong className="text-sm text-blue-900">
                      {selectedSeat ? `#${selectedSeat} ${isVip ? '(VIP)' : '(Normal)'}` : 'Sin elegir'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal Tarifa:</span>
                    <span>${seatPrice.toFixed(2)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Descuento Ley (50%):</span>
                      <span>-${discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total a Cobrar:</span>
                    <span className="text-emerald-600 text-lg">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !selectedSeat}
                  className="w-full py-3 text-base font-bold"
                >
                  {submitting ? 'Emitiendo...' : `Emitir y Cobrar Boleto Físico ($${finalTotal.toFixed(2)})`}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: VALIDACIÓN DE TRANSFERENCIAS BANCARIAS */}
      {activeTab === 'validar_pagos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Comprobantes por Verificar</h2>
              <p className="text-xs text-gray-500">
                Aprueba o rechaza los comprobantes de transferencia bancaria cargados por los usuarios.
              </p>
            </div>
          </div>

          {boletosPendientes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-gray-600 font-semibold">¡Al día! No hay comprobantes de pago pendientes de verificación.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boletosPendientes.map((bol) => {
                const ruta = rutas.find((r) => r.id === bol.rutaId);
                const frec = frecuencias.find((f) => f.id === ruta?.frecuenciaId);

                return (
                  <Card key={bol.id} className="border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="p-4 bg-amber-500 text-white flex justify-between items-center text-xs font-bold">
                        <span>TRANSFERENCIA PENDIENTE</span>
                        <span>Asiento #{bol.asiento}</span>
                      </div>
                      <CardContent className="pt-4 space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pasajero:</span>
                          <strong>{bol.pasajeroNombre}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cédula:</span>
                          <strong className="font-mono">{bol.pasajeroCedula}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Itinerario:</span>
                          <span>{frec?.origen} ➔ {frec?.destino}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Monto Transferido:</span>
                          <span className="font-black text-sm text-gray-900">${bol.precio.toFixed(2)}</span>
                        </div>

                        {bol.comprobanteUrl && (
                          <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-white">
                            <span className="text-[10px] text-gray-400 block mb-1">Comprobante Cargado:</span>
                            <img
                              src={bol.comprobanteUrl}
                              alt="Comprobante"
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </CardContent>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleAprobarPago(bol.id)}
                      >
                        ✓ Aprobar Pago
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-bold text-red-600 hover:bg-red-50"
                        onClick={() => handleRechazarPago(bol.id)}
                      >
                        ✕ Rechazar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Boleto Emitido Físicamente */}
      {boletoEmitido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setBoletoEmitido(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-black text-gray-900">Boleto Emitido en Taquilla</h3>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-gray-300 flex justify-center">
              <QRCodeSVG
                value={boletoEmitido.codigoQr || boletoEmitido.id}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-left text-xs space-y-1.5 text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex justify-between">
                <span>Pasajero:</span>
                <strong>{boletoEmitido.pasajeroNombre}</strong>
              </div>
              <div className="flex justify-between">
                <span>Cédula:</span>
                <strong>{boletoEmitido.pasajeroCedula}</strong>
              </div>
              <div className="flex justify-between">
                <span>Asiento:</span>
                <strong className="text-blue-700 text-sm">#{boletoEmitido.asiento}</strong>
              </div>
              <div className="flex justify-between">
                <span>Cobrado:</span>
                <strong className="text-emerald-600 font-black">${boletoEmitido.precio.toFixed(2)}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => window.print()}
              >
                🖨️ Imprimir Ticket
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBoletoEmitido(null)}
              >
                Listo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
