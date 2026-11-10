'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

// ==========================================
// TIPOS ESTRICTOS (Cero any)
// ==========================================
type EstadoBoleto = 'PENDIENTE_APROBACION' | 'COMPLETADO' | 'RECHAZADO';

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
}

export default function OficinaPage() {
  const supabase = createClient();

  // Estados de la tabla
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoBoleto | 'TODOS'>('PENDIENTE_APROBACION');
  const [filtroFecha, setFiltroFecha] = useState<string>('');

  // Modal
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isSigningUrl, setIsSigningUrl] = useState<boolean>(false);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
  const fetchBoletos = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const { data, error } = await supabase
        .from('Boleto')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw new Error(error.message);

      // Casteo seguro para evitar problemas con los tipos generados
      setBoletos((data as unknown as Boleto[]) || []);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Error al cargar los boletos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoletos();
  }, []);

  // ==========================================
  // FILTROS
  // ==========================================
  const boletosFiltrados = useMemo(() => {
    return boletos.filter((b) => {
      const matchEstado = filtroEstado === 'TODOS' || b.estado === filtroEstado;
      const matchFecha = filtroFecha === '' || (b.createdAt && b.createdAt.startsWith(filtroFecha));
      return matchEstado && matchFecha;
    });
  }, [boletos, filtroEstado, filtroFecha]);

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
          // URL firmada válida por 60 minutos (3600 segundos)
          const { data, error } = await supabase.storage
            .from('comprobantes_pagos')
            .createSignedUrl(boleto.comprobanteUrl, 3600);

          if (!error && data?.signedUrl) {
            setSignedUrl(data.signedUrl);
          }
        } catch {
          // Si falla la firma en Storage, se muestra la referencia textual en el panel
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
      // 1. Verificación de doble aprobación
      const { data: current, error: checkError } = await supabase
        .from('Boleto')
        .select('estado')
        .eq('id', selectedBoleto.id)
        .single();

      if (checkError) throw new Error('Error al verificar el estado del boleto.');

      // Si alguien más ya lo cambió, lanzamos error
      if ((current as { estado: string })?.estado !== 'PENDIENTE_APROBACION') {
        throw new Error('Este boleto ya fue procesado por otro oficinista.');
      }

      // 2. Preparar datos de actualización
      const updateData: { estado: EstadoBoleto; codigoQr?: string } = {
        estado: accion === 'APROBAR' ? 'COMPLETADO' : 'RECHAZADO',
      };

      if (accion === 'APROBAR') {
        updateData.codigoQr = crypto.randomUUID();
      }

      // 3. Actualización en Supabase
      const { error: updateError } = await supabase
        .from('Boleto')
        .update(updateData as never)
        .eq('id', selectedBoleto.id);

      if (updateError) throw new Error(`Error al actualizar: ${updateError.message}`);

      // 4. Éxito
      setModalSuccess(`Pago ${accion === 'APROBAR' ? 'aprobado' : 'rechazado'} correctamente.`);

      // Actualizamos la tabla local
      setBoletos((prev) =>
        prev.map((b) => b.id === selectedBoleto.id ? { ...b, estado: updateData.estado } : b)
      );

      setTimeout(() => {
        handleCloseModal();
      }, 1500);

    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">Validación de Pagos</h1>
        <p className="text-neutral-500 mt-2">Revisa y aprueba los comprobantes de transferencia enviados por los pasajeros.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-neutral-100">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar por Fecha</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full border border-neutral-300 rounded-md p-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar por Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoBoleto | 'TODOS')}
            className="w-full border border-neutral-300 rounded-md p-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="TODOS">Todos</option>
            <option value="PENDIENTE_APROBACION">Pendiente</option>
            <option value="COMPLETADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>
      </div>

      {globalError && <div className="p-4 mb-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-md">{globalError}</div>}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-neutral-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Pasajero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">Cargando datos...</td>
                </tr>
              ) : boletosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No hay boletos que coincidan con los filtros.</td>
                </tr>
              ) : (
                boletosFiltrados.map((boleto) => (
                  <tr key={boleto.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium">
                      {boleto.pasajeroNombre || 'Sin nombre'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{boleto.pasajeroCedula}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {boleto.createdAt ? new Date(boleto.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium">
                      ${boleto.precio ? boleto.precio.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${boleto.estado === 'COMPLETADO' ? 'bg-success-100 text-success-800' :
                          boleto.estado === 'RECHAZADO' ? 'bg-danger-100 text-danger-800' :
                            'bg-warning-100 text-warning-800'}`}>
                        {boleto.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(boleto)}
                        className="text-brand-600 hover:text-brand-900 bg-brand-50 px-3 py-1 rounded-md"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {selectedBoleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

            {/* Visor de Imagen / Comprobante */}
            <div className="md:w-1/2 bg-neutral-100 p-4 flex items-center justify-center border-r border-neutral-200 min-h-[300px]">
              {isSigningUrl ? (
                <p className="text-neutral-500 animate-pulse">Cargando comprobante...</p>
              ) : signedUrl ? (
                <img src={signedUrl} alt="Comprobante" className="max-w-full max-h-[70vh] object-contain rounded shadow-sm" />
              ) : selectedBoleto.comprobanteUrl ? (
                <div className="bg-white p-5 rounded-xl border border-neutral-200 text-center space-y-2 max-w-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
                    Referencia de Comprobante / Orden de Pago
                  </span>
                  <p className="text-sm font-mono font-bold text-neutral-900 break-all">
                    {selectedBoleto.comprobanteUrl}
                  </p>
                </div>
              ) : (
                <p className="text-neutral-500">No hay comprobante disponible.</p>
              )}
            </div>

            {/* Detalles y Acciones */}
            <div className="md:w-1/2 p-6 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-neutral-800">Revisión de Pago</h2>
                <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none">&times;</button>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <p className="text-sm text-neutral-600"><strong>Pasajero:</strong> {selectedBoleto.pasajeroNombre}</p>
                <p className="text-sm text-neutral-600"><strong>Cédula:</strong> {selectedBoleto.pasajeroCedula}</p>
                <p className="text-sm text-neutral-600"><strong>ID Boleto:</strong> {selectedBoleto.id}</p>
                <p className="text-sm text-neutral-600"><strong>Estado Actual:</strong> {selectedBoleto.estado}</p>
              </div>

              {modalError && <div className="p-3 mb-4 bg-danger-50 border border-danger-200 text-danger-800 text-sm rounded-md">{modalError}</div>}
              {modalSuccess && <div className="p-3 mb-4 bg-success-100 text-success-700 text-sm rounded-md">{modalSuccess}</div>}

              {selectedBoleto.estado === 'PENDIENTE_APROBACION' ? (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Motivo de rechazo (obligatorio si rechaza)</label>
                    <textarea
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      placeholder="Ej: El monto transferido no coincide..."
                      className="w-full border border-neutral-300 rounded-md p-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => procesarAccion('APROBAR')}
                      disabled={isSubmitting}
                      className="flex-1 bg-success-600 text-white py-2 rounded-md hover:bg-success-700 disabled:bg-neutral-400 font-medium"
                    >
                      {isSubmitting ? 'Procesando...' : 'Aprobar Pago'}
                    </button>
                    <button
                      onClick={() => procesarAccion('RECHAZAR')}
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700 disabled:bg-neutral-400 font-medium"
                    >
                      {isSubmitting ? 'Procesando...' : 'Rechazar Pago'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 text-center rounded-md border text-neutral-600 text-sm mt-4">
                  Este boleto ya ha sido procesado ({selectedBoleto.estado}).
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
