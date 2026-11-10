'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PurchaseStepper } from '@/components/ui/PurchaseStepper';
import {
  IconDownload,
  IconQrCode,
  IconTicket,
  IconSearch,
  IconArrowRight,
} from '@/components/ui/Icons';
import BoletoDigital from '@/components/boletos/BoletoDigital';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BoletoJoinRow {
  id: string;
  rutaId: string;
  pasajeroId: string;
  asiento: number;
  precio: number;
  estado: string;
  codigoQr: string | null;
  abordadoAt: string | null;
  Ruta: {
    fecha: string;
    Frecuencia: {
      origen: string;
      destino: string;
      hora: string;
    } | null;
  } | null;
}

export default function PasajeroPage() {
  const [boletos, setBoletos] = useState<BoletoJoinRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [selectedBoleto, setSelectedBoleto] = useState<BoletoJoinRow | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const boletoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistorial() {
      try {
        setLoading(true);
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const pasajeroId = user?.id || '';

        const { data, error } = await supabase
          .from('Boleto')
          .select(`
            id,
            rutaId,
            pasajeroId,
            asiento,
            precio,
            estado,
            codigoQr,
            abordadoAt,
            Ruta (
              fecha,
              Frecuencia (
                origen,
                destino,
                hora
              )
            )
          `)
          .order('id', { ascending: false });

        if (error) {
          console.error('Error al cargar historial de boletos:', error);
          setBoletos([]);
        } else {
          const listaBoletos = (data as unknown as BoletoJoinRow[]) || [];
          const boletosFiltrados = user
            ? listaBoletos.filter((b) => b.pasajeroId === pasajeroId)
            : listaBoletos;

          setBoletos(boletosFiltrados);
        }
      } catch (err) {
        console.error('Error inesperado al obtener boletos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistorial();
  }, []);

  const boletosFiltrados = boletos.filter((b) => {
    if (filtroEstado === 'TODOS') return true;
    return b.estado.toUpperCase() === filtroEstado.toUpperCase();
  });

  const handleDownloadPdf = async (boletoId: string) => {
    if (!boletoRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(boletoRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
      pdf.save(`boleto-${boletoId}.pdf`);
    } catch (err) {
      console.error('Error al generar el PDF del boleto:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      <PurchaseStepper currentStep={5} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
            Portal del Pasajero
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 tracking-tight mt-0.5">
            Historial de Boletos y Códigos QR
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Consulta tus pasajes emitidos, presenta el código QR en el andén o exporta el comprobante en formato PDF.
          </p>
        </div>

        {/* Filtros por Estado */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar boletos por estado">
          {['TODOS', 'COMPLETADO', 'EMBARCADO', 'PENDIENTE', 'RECHAZADO'].map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filtroEstado === est
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Tabla de Historial con Cabecera Fija y Skeleton Loader */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-subtle border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-4">Frecuencia / Ruta</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4 text-center">Asiento</th>
                  <th className="py-3.5 px-4 text-right">Tarifa</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={`skel-${idx}`} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-3.5 w-36 bg-neutral-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-3.5 w-28 bg-neutral-100 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-3.5 w-8 mx-auto bg-neutral-200 rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-3.5 w-14 ml-auto bg-neutral-100 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-20 mx-auto bg-neutral-200 rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-7 w-20 ml-auto bg-neutral-100 rounded" /></td>
                    </tr>
                  ))
                ) : boletosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-6 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
                          <IconTicket size={20} />
                        </div>
                        <div className="text-sm font-bold text-neutral-900">
                          No se registran boletos en esta categoría
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Selecciona otro filtro de estado o consulta nuestras frecuencias interprovinciales para adquirir un nuevo pasaje.
                        </p>
                        <div className="pt-1">
                          <Link href="/busqueda">
                            <Button variant="primary" size="sm">
                              <IconSearch size={14} />
                              <span>Buscar frecuencias disponibles</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  boletosFiltrados.map((bol) => {
                    const origen = bol.Ruta?.Frecuencia?.origen || 'Ambato';
                    const destino = bol.Ruta?.Frecuencia?.destino || 'Baños';
                    const hora = bol.Ruta?.Frecuencia?.hora || '--:--';
                    const fecha = bol.Ruta?.fecha || 'Fecha N/A';
                    const estadoUpper = bol.estado.toUpperCase();
                    const esValidoParaQr =
                      estadoUpper === 'COMPLETADO' ||
                      estadoUpper === 'EMBARCADO' ||
                      estadoUpper === 'CONFIRMADO' ||
                      estadoUpper === 'PAGADO';

                    return (
                      <tr
                        key={bol.id}
                        className={`hover:bg-neutral-50/90 transition-colors cursor-pointer ${
                          selectedBoleto?.id === bol.id ? 'bg-brand-50/60' : ''
                        }`}
                        onClick={() => {
                          if (esValidoParaQr) setSelectedBoleto(bol);
                        }}
                      >
                        <td className="py-3.5 px-4 font-bold text-neutral-900">
                          {origen} <IconArrowRight size={12} className="inline mx-1 text-neutral-400" /> {destino}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">
                          {fecha} · <span className="font-mono">{hora}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-900">
                          #{bol.asiento}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900">
                          ${Number(bol.precio || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={
                              estadoUpper === 'EMBARCADO' || estadoUpper === 'COMPLETADO'
                                ? 'success'
                                : estadoUpper === 'RECHAZADO'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {estadoUpper}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {esValidoParaQr ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[11px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBoleto(bol);
                              }}
                            >
                              <IconQrCode size={13} />
                              <span>Ver QR / PDF</span>
                            </Button>
                          ) : (
                            <Link href="/pagos" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[11px] font-semibold text-brand-700 hover:underline">
                                Subir pago
                              </span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Visualización y Descarga del Boleto Digital */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="bg-neutral-50/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-neutral-900">
                  Boleto Electrónico Oficial
                </CardTitle>
                <IconQrCode size={17} className="text-brand-700" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col items-center">
              {selectedBoleto ? (
                <>
                  <div ref={boletoRef} className="w-full bg-white p-4 rounded-xl border border-neutral-200">
                    <BoletoDigital boletoId={selectedBoleto.id} estado={selectedBoleto.estado} />
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={isGeneratingPdf}
                    isLoading={isGeneratingPdf}
                    onClick={() => handleDownloadPdf(selectedBoleto.id)}
                  >
                    <IconDownload size={16} />
                    <span>
                      {isGeneratingPdf ? 'Generando archivo PDF...' : `Descargar boleto-${selectedBoleto.id}.pdf`}
                    </span>
                  </Button>
                </>
              ) : (
                <div className="py-10 px-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <IconQrCode size={20} />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Selecciona un boleto con estado <strong className="text-neutral-800">COMPLETADO</strong> o{' '}
                    <strong className="text-neutral-800">EMBARCADO</strong> en la tabla para visualizar su código QR y descargarlo en PDF.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
