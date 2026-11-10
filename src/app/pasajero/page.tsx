'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
        
        // Obtener usuario autenticado actual
        const { data: { user } } = await supabase.auth.getUser();
        const pasajeroId = user?.id || '';

        // Fetch de boletos con join a Ruta y Frecuencia aplicando RLS
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
          // Si hay usuario autenticado, filtramos por su ID; si no, mostramos todos para pruebas locales
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

  // Filtrado de boletos por estado
  const boletosFiltrados = boletos.filter((b) => {
    if (filtroEstado === 'TODOS') return true;
    return b.estado.toUpperCase() === filtroEstado.toUpperCase();
  });

  // Función de descarga en PDF utilizando html2canvas y jspdf
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Historial de Pasajero</h1>
          <p className="text-sm text-gray-600">Consulta tus pasajes adquiridos, visualiza códigos QR y descarga tus comprobantes en PDF.</p>
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Filtrar:</span>
          {['TODOS', 'COMPLETADO', 'EMBARCADO', 'PENDIENTE', 'RECHAZADO'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                filtroEstado === est ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabla de Historial */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase border-b">
              <tr>
                <th className="py-3 px-4">Ruta</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4 text-center">Asiento</th>
                <th className="py-3 px-4 text-right">Precio</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">Cargando historial de boletos...</td>
                </tr>
              ) : boletosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No se encontraron boletos registrados.</td>
                </tr>
              ) : (
                boletosFiltrados.map((bol) => {
                  const origen = bol.Ruta?.Frecuencia?.origen || 'Origen';
                  const destino = bol.Ruta?.Frecuencia?.destino || 'Destino';
                  const hora = bol.Ruta?.Frecuencia?.hora || '--:--';
                  const fecha = bol.Ruta?.fecha || 'Fecha N/A';
                  const esValidoParaQr = bol.estado.toUpperCase() === 'COMPLETADO' || bol.estado.toUpperCase() === 'EMBARCADO';

                  return (
                    <tr 
                      key={bol.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedBoleto?.id === bol.id ? 'bg-blue-50/60' : ''}`}
                      onClick={() => {
                        if (esValidoParaQr) setSelectedBoleto(bol);
                      }}
                    >
                      <td className="py-3 px-4 font-bold text-gray-900">{origen} ➔ {destino}</td>
                      <td className="py-3 px-4 text-gray-600">{fecha} ({hora})</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">#{bol.asiento}</td>
                      <td className="py-3 px-4 text-right font-mono">${Number(bol.precio || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={bol.estado.toUpperCase() === 'EMBARCADO' ? 'success' : 'warning'}>
                          {bol.estado.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {esValidoParaQr && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-[10px] font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBoleto(bol);
                            }}
                          >
                            Ver QR / PDF
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Panel de Visualización y Descarga del Boleto Digital */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-base font-black text-gray-900">Boleto Digital Oficial</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 flex flex-col items-center">
              {selectedBoleto ? (
                <>
                  {/* Contenedor referenciado para el html2canvas */}
                  <div ref={boletoRef} className="w-full bg-white p-4 rounded-xl border shadow-inner">
                    <BoletoDigital boletoId={selectedBoleto.id} estado={selectedBoleto.estado} />
                  </div>

                  <Button
                    variant="primary"
                    className="w-full font-bold py-2.5"
                    disabled={isGeneratingPdf}
                    onClick={() => handleDownloadPdf(selectedBoleto.id)}
                  >
                    {isGeneratingPdf ? 'Generando PDF...' : `📥 Descargar boleto-${selectedBoleto.id}.pdf`}
                  </Button>
                </>
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Selecciona un boleto con estado <strong className="text-gray-600">COMPLETADO</strong> o <strong className="text-gray-600">EMBARCADO</strong> de la tabla para visualizar su código QR y exportarlo a PDF.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}