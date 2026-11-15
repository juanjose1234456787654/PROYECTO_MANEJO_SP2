'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// ==========================================
// TIPOS ESTRICTOS (Cero any)
// ==========================================
type EstadoBoleto = 'PENDIENTE_APROBACION' | 'COMPLETADO' | 'RECHAZADO';
type TabOficina = 'COMPROBANTES' | 'HISTORIAL_TAQUILLA';

interface Boleto {
  id: string;
  rutaId: string;
  pasajeroId: string;
  pasajeroNombre: string;
  pasajeroCedula: string;
  comprobanteUrl: string | null;
  estado: EstadoBoleto;
  codigoQr: string | null;
  createdAt: string;
  precio: number;
  asiento?: number;
  metodoPago?: string | null;
  vendidoPor?: string | null;
  tipoPasajero?: string | null;
  descuento?: number;
}

export default function OficinaPage() {
  const supabase = createClient();

  // Pestañas
  const [tabActiva, setTabActiva] = useState<TabOficina>('COMPROBANTES');

  // Estados de la tabla
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoBoleto | 'TODOS'>('PENDIENTE_APROBACION');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // Modal de Aprobación de Comprobante
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isSigningUrl, setIsSigningUrl] = useState<boolean>(false);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Modal de Reimpresión de Boleto / QR (Taquilla)
  const [boletoParaImprimir, setBoletoParaImprimir] = useState<Boleto | null>(null);

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
  const fetchBoletos = useCallback(async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const { data, error } = await supabase
        .from('Boleto')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw new Error(error.message);

      setBoletos((data as unknown as Boleto[]) || []);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Error al cargar los boletos.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBoletos();
  }, [fetchBoletos]);

  // Cantidad de comprobantes pendientes para la insignia
  const totalPendientes = useMemo(() => {
    return boletos.filter((b) => b.estado === 'PENDIENTE_APROBACION').length;
  }, [boletos]);

  // ==========================================
  // FILTROS
  // ==========================================
  const boletosFiltrados = useMemo(() => {
    return boletos.filter((b) => {
      // Si estamos en la pestaña de comprobantes en línea
      if (tabActiva === 'COMPROBANTES') {
        const matchEstado = filtroEstado === 'TODOS' || b.estado === filtroEstado;
        const matchFecha = filtroFecha === '' || (b.createdAt && b.createdAt.startsWith(filtroFecha));
        const matchTexto =
          busquedaTexto.trim() === '' ||
          (b.pasajeroNombre && b.pasajeroNombre.toLowerCase().includes(busquedaTexto.toLowerCase())) ||
          (b.pasajeroCedula && b.pasajeroCedula.includes(busquedaTexto));
        return matchEstado && matchFecha && matchTexto;
      }

      // Si estamos en la pestaña de historial de taquilla
      const esVendidoTaquilla = b.vendidoPor === 'taquilla_oficinista' || b.metodoPago === 'efectivo' || !b.comprobanteUrl || b.comprobanteUrl.includes('TAQUILLA');
      const matchFecha = filtroFecha === '' || (b.createdAt && b.createdAt.startsWith(filtroFecha));
      const matchTexto =
        busquedaTexto.trim() === '' ||
        (b.pasajeroNombre && b.pasajeroNombre.toLowerCase().includes(busquedaTexto.toLowerCase())) ||
        (b.pasajeroCedula && b.pasajeroCedula.includes(busquedaTexto)) ||
        (b.id && b.id.toLowerCase().includes(busquedaTexto.toLowerCase()));

      return esVendidoTaquilla && matchFecha && matchTexto;
    });
  }, [boletos, tabActiva, filtroEstado, filtroFecha, busquedaTexto]);

  // ==========================================
  // MODAL Y URL FIRMADA
  // ==========================================
  const handleOpenModal = async (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setSignedUrl(null);
    setMotivoRechazo('');
    setModalError(null);
    setModalSuccess(null);

    if (boleto.comprobanteUrl) {
      if (boleto.comprobanteUrl.startsWith('data:') || boleto.comprobanteUrl.startsWith('http')) {
        setSignedUrl(boleto.comprobanteUrl);
      } else if (boleto.comprobanteUrl.includes('/')) {
        setIsSigningUrl(true);
        try {
          const { data, error } = await supabase.storage
            .from('comprobantes_pagos')
            .createSignedUrl(boleto.comprobanteUrl, 3600);

          if (!error && data?.signedUrl) {
            setSignedUrl(data.signedUrl);
          }
        } catch {
          // Si falla la firma en Storage, se muestra la referencia textual
        } finally {
          setIsSigningUrl(false);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedBoleto(null);
    setSignedUrl(null);
  };

  // ==========================================
  // ACCIONES (APROBAR / RECHAZAR)
  // ==========================================
  const procesarAccion = async (accion: 'APROBAR' | 'RECHAZAR') => {
    if (!selectedBoleto) return;

    setModalError(null);
    setModalSuccess(null);

    if (accion === 'RECHAZAR' && !motivoRechazo.trim()) {
      setModalError('Debes ingresar un motivo para rechazar el pago.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: current, error: checkError } = await supabase
        .from('Boleto')
        .select('estado')
        .eq('id', selectedBoleto.id)
        .single();

      if (checkError) throw new Error('Error al verificar el estado del boleto.');

      if ((current as { estado: string })?.estado !== 'PENDIENTE_APROBACION') {
        throw new Error('Este boleto ya fue procesado por otro oficinista.');
      }

      const updateData: { estado: EstadoBoleto; codigoQr?: string } = {
        estado: accion === 'APROBAR' ? 'COMPLETADO' : 'RECHAZADO',
      };

      if (accion === 'APROBAR') {
        updateData.codigoQr = `ECU-${selectedBoleto.id.toUpperCase()}-S${selectedBoleto.asiento ?? 1}`;
      }

      const { error: updateError } = await supabase
        .from('Boleto')
        .update(updateData as never)
        .eq('id', selectedBoleto.id);

      if (updateError) throw new Error(`Error al actualizar: ${updateError.message}`);

      setModalSuccess(`Pago ${accion === 'APROBAR' ? 'aprobado' : 'rechazado'} correctamente.`);

      setBoletos((prev) =>
        prev.map((b) => (b.id === selectedBoleto.id ? { ...b, estado: updateData.estado, codigoQr: updateData.codigoQr || b.codigoQr } : b))
      );

      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mt-4 space-y-6">
      {/* Header con botón directo de Taquilla */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Módulo de Ventanilla y Taquilla
            </h1>
            <Badge variant="cooperativa">Terminal de Pasajeros</Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Revisión de transferencias bancarias en línea y emisión/historial de boletos directos en ventanilla.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/busqueda?modo=taquilla">
            <Button
              variant="primary"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center gap-2 shadow-md shadow-brand-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Venta en Taquilla
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchBoletos} disabled={isLoading} size="sm">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Pestañas de Navegación del Módulo */}
      <div className="flex border-b border-neutral-200 gap-4">
        <button
          type="button"
          onClick={() => {
            setTabActiva('COMPROBANTES');
            setFiltroEstado('PENDIENTE_APROBACION');
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            tabActiva === 'COMPROBANTES'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <span>Aprobación de Comprobantes en Línea</span>
          {totalPendientes > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-warning-100 text-warning-800 font-extrabold border border-warning-200">
              {totalPendientes} pendientes
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setTabActiva('HISTORIAL_TAQUILLA');
            setFiltroEstado('TODOS');
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            tabActiva === 'HISTORIAL_TAQUILLA'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <span>Historial de Boletos Vendidos en Taquilla</span>
          <Badge variant="success">Ventanilla Directa</Badge>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Buscar por Pasajero / Cédula</label>
          <input
            type="text"
            placeholder="Ej: Mateo Morales o 180..."
            value={busquedaTexto}
            onChange={(e) => setBusquedaTexto(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Filtrar por Fecha</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {tabActiva === 'COMPROBANTES' && (
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Filtrar por Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoBoleto | 'TODOS')}
              className="w-full border border-neutral-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-brand-500 font-semibold"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PENDIENTE_APROBACION">Pendiente de Aprobación</option>
              <option value="COMPLETADO">Aprobado / Pagado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        )}
      </div>

      {globalError && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-800 text-sm rounded-xl font-medium">
          {globalError}
        </div>
      )}

      {/* Tabla de Datos */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-neutral-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-xs sm:text-sm">
            <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3 text-left">Pasajero</th>
                <th className="px-6 py-3 text-left">Cédula</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Asiento</th>
                <th className="px-6 py-3 text-left">Monto</th>
                <th className="px-6 py-3 text-left">Origen / Canal</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200 text-neutral-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">
                    Cargando boletos de ventanilla y comprobantes...
                  </td>
                </tr>
              ) : boletosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">
                    No se encontraron registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                boletosFiltrados.map((boleto) => (
                  <tr key={boleto.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-900 whitespace-nowrap">
                      {boleto.pasajeroNombre || 'Venta Taquilla'}
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-600 whitespace-nowrap">
                      {boleto.pasajeroCedula || 'Sin cédula'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {boleto.createdAt ? new Date(boleto.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-brand-700">
                      #{boleto.asiento ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-neutral-900">
                      ${boleto.precio ? boleto.precio.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[11px] font-bold text-neutral-600 uppercase">
                        {boleto.vendidoPor === 'taquilla_oficinista' ? 'Taquilla' : 'Venta en Línea'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-[11px] leading-4 font-extrabold rounded-full ${
                          boleto.estado === 'COMPLETADO'
                            ? 'bg-success-100 text-success-800 border border-success-200'
                            : boleto.estado === 'RECHAZADO'
                            ? 'bg-danger-100 text-danger-800 border border-danger-200'
                            : 'bg-warning-100 text-warning-800 border border-warning-200'
                        }`}
                      >
                        {boleto.estado === 'COMPLETADO' ? 'Aprobado' : boleto.estado === 'RECHAZADO' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {tabActiva === 'COMPROBANTES' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenModal(boleto)}
                          className="text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Revisar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBoletoParaImprimir(boleto)}
                          className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          Ver / Imprimir QR
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REVISIÓN DE COMPROBANTE EN LÍNEA */}
      {selectedBoleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-neutral-200">
            {/* Visor de Comprobante */}
            <div className="md:w-1/2 bg-neutral-100 p-4 flex items-center justify-center border-r border-neutral-200 min-h-[300px]">
              {isSigningUrl ? (
                <p className="text-neutral-500 animate-pulse text-xs font-bold">Cargando comprobante bancario...</p>
              ) : signedUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={signedUrl}
                  alt="Comprobante de depósito o transferencia bancaria"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                />
              ) : selectedBoleto.comprobanteUrl ? (
                <div className="bg-white p-5 rounded-xl border border-neutral-200 text-center space-y-2 max-w-xs shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
                    Referencia de Transacción
                  </span>
                  <p className="text-sm font-mono font-bold text-neutral-900 break-all">
                    {selectedBoleto.comprobanteUrl}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Comprobante registrado por el pasajero en el proceso de compra en línea.
                  </p>
                </div>
              ) : (
                <p className="text-neutral-500 text-xs">No se adjuntó comprobante para este boleto.</p>
              )}
            </div>

            {/* Formulario y Detalles */}
            <div className="md:w-1/2 p-6 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-black text-neutral-900">Validación de Pago</h2>
                  <p className="text-xs text-neutral-500">Verifica la transferencia antes de autorizar el boleto.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-2.5 mb-6 text-xs text-neutral-700 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <p>
                  <strong>Pasajero:</strong> {selectedBoleto.pasajeroNombre}
                </p>
                <p>
                  <strong>Cédula:</strong> {selectedBoleto.pasajeroCedula}
                </p>
                <p>
                  <strong>Monto a Validar:</strong>{' '}
                  <span className="text-sm font-black text-brand-700">
                    ${selectedBoleto.precio ? selectedBoleto.precio.toFixed(2) : '0.00'}
                  </span>
                </p>
                <p>
                  <strong>ID Boleto:</strong> <span className="font-mono">{selectedBoleto.id}</span>
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <Badge variant={selectedBoleto.estado === 'COMPLETADO' ? 'success' : 'cooperativa'}>
                    {selectedBoleto.estado}
                  </Badge>
                </p>
              </div>

              {modalError && (
                <div className="p-3 mb-4 bg-danger-50 border border-danger-200 text-danger-800 text-xs rounded-lg font-semibold">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 mb-4 bg-success-50 border border-success-200 text-success-800 text-xs rounded-lg font-semibold">
                  {modalSuccess}
                </div>
              )}

              {selectedBoleto.estado === 'PENDIENTE_APROBACION' ? (
                <div className="space-y-4 border-t border-neutral-200 pt-4 mt-auto">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Motivo de rechazo (obligatorio solo si rechazas)
                    </label>
                    <textarea
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      placeholder="Ej: Monto incorrecto o comprobante ilegible..."
                      className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => procesarAccion('APROBAR')}
                      disabled={isSubmitting}
                      className="flex-1 bg-success-600 hover:bg-success-700 text-white py-2.5 rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Procesando...' : '✔ Aprobar Pago'}
                    </button>
                    <button
                      type="button"
                      onClick={() => procesarAccion('RECHAZAR')}
                      disabled={isSubmitting}
                      className="flex-1 bg-danger-600 hover:bg-danger-700 text-white py-2.5 rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Procesando...' : '✕ Rechazar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-100 text-center rounded-xl border text-neutral-600 text-xs font-medium mt-auto">
                  Este boleto ya fue procesado ({selectedBoleto.estado}).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VISOR Y REIMPRESIÓN DIRECTA DE BOLETO CON QR */}
      {boletoParaImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-neutral-200">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-black text-neutral-900">Boleto Digital con QR</h3>
                <span className="text-[11px] text-neutral-500">Reimpresión para abordaje en terminal</span>
              </div>
              <button
                type="button"
                onClick={() => setBoletoParaImprimir(null)}
                className="text-neutral-400 hover:text-neutral-600 font-bold text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Contenedor del Boleto para Pantalla e Impresión */}
            <div
              id="boleto-impresion-taquilla"
              className="bg-white border-2 border-dashed border-neutral-300 p-5 rounded-xl text-center space-y-3"
            >
              <div className="text-left border-b border-neutral-200 pb-2">
                <span className="text-[10px] font-bold text-brand-600 uppercase block">Cooperativa de Transportes</span>
                <h4 className="text-sm font-black text-neutral-900">Ambato Express / EcuRutas</h4>
              </div>

              <div className="flex justify-center p-2 bg-white rounded-lg shadow-inner border border-neutral-100">
                <QRCodeSVG
                  value={boletoParaImprimir.codigoQr || boletoParaImprimir.id}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="font-mono text-xs font-bold text-brand-800 bg-brand-50 border border-brand-200 py-1 px-2 rounded">
                {boletoParaImprimir.codigoQr || boletoParaImprimir.id}
              </div>

              <div className="text-left text-xs space-y-1 text-neutral-700 pt-1">
                <div className="flex justify-between">
                  <strong>Pasajero:</strong>
                  <span className="font-bold text-neutral-900">{boletoParaImprimir.pasajeroNombre}</span>
                </div>
                <div className="flex justify-between">
                  <strong>Cédula:</strong>
                  <span>{boletoParaImprimir.pasajeroCedula}</span>
                </div>
                <div className="flex justify-between">
                  <strong>Asiento:</strong>
                  <span className="font-black text-brand-700">#{boletoParaImprimir.asiento ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <strong>Total Pagado:</strong>
                  <span className="font-bold text-neutral-900">${boletoParaImprimir.precio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <strong>Estado:</strong>
                  <span className="font-extrabold text-success-700">{boletoParaImprimir.estado}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Boleto
              </Button>
              <Button variant="outline" onClick={() => setBoletoParaImprimir(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
