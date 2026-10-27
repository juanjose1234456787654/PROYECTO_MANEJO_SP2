'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { dataService } from '@/lib/services/dataService';
import type {
  BoletoRow,
  FrecuenciaRow,
  RutaRow,
  CooperativaRow,
  BusRow,
} from '@/lib/data/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function PasajeroPage() {
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro de búsqueda por cédula
  const [cedulaFiltro, setCedulaFiltro] = useState('');
  const [selectedBoletoModal, setSelectedBoletoModal] = useState<BoletoRow | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bols, frecs, ruts, coops, busList] = await Promise.all([
          dataService.getBoletos(),
          dataService.getFrecuencias(),
          dataService.getRutas(),
          dataService.getCooperativas(),
          dataService.getBuses(),
        ]);
        setBoletos(bols);
        setFrecuencias(frecs);
        setRutas(ruts);
        setCooperativas(coops);
        setBuses(busList);
      } catch (err) {
        console.error('Error al cargar datos del pasajero:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getRuta = (rutaId: string) => rutas.find(r => r.id === rutaId);
  const getFrecuencia = (frecId?: string) => frecuencias.find(f => f.id === frecId);
  const getCoop = (coopId?: string) => cooperativas.find(c => c.id === coopId);
  const getBus = (busId?: string | null) => buses.find(b => b.id === busId);

  const filteredBoletos = boletos.filter(b => {
    if (!cedulaFiltro) return true;
    return (
      b.pasajeroCedula?.includes(cedulaFiltro) ||
      b.pasajeroNombre?.toLowerCase().includes(cedulaFiltro.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Casillero Digital de Boletos
            </h1>
            <Badge variant="usuario">PASAJERO</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Revisa tus boletos adquiridos, códigos QR para abordaje y estado de viaje.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/busqueda">
            <Button variant="primary" size="sm">
              🔍 Buscar Nuevas Rutas
            </Button>
          </Link>
        </div>
      </div>

      {/* Buscador de Boletos por Cédula / Nombre */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-96">
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
            Filtrar por Cédula o Nombre
          </label>
          <input
            type="text"
            placeholder="Ej: 1804567890 o Carvajal..."
            value={cedulaFiltro}
            onChange={(e) => setCedulaFiltro(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-gray-500 self-end sm:self-center">
          Mostrando <strong>{filteredBoletos.length}</strong> de {boletos.length} boletos registrados
        </div>
      </div>

      {/* Listado de Boletos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando tus boletos...</p>
        </div>
      ) : filteredBoletos.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
          <div className="text-4xl mb-2">🎫</div>
          <p className="text-gray-600 font-semibold">No se encontraron boletos con el filtro actual.</p>
          <p className="text-xs text-gray-400 mt-1">Adquiere tu primer boleto en el buscador público de frecuencias.</p>
          <Link href="/busqueda">
            <Button variant="primary" size="sm" className="mt-4">
              Ir a Comprar Pasajes
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoletos.map((boleto) => {
            const ruta = getRuta(boleto.rutaId);
            const frec = getFrecuencia(ruta?.frecuenciaId);
            const coop = getCoop(frec?.cooperativaId);
            const bus = getBus(ruta?.busId);
            const isVip = bus?.asientosVIPNumeros?.includes(boleto.asiento);

            return (
              <Card
                key={boleto.id}
                className="hover:shadow-xl transition-all border border-gray-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado del boleto */}
                  <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        {coop?.nombre || 'EcuRutas Express'}
                      </span>
                      <span className="text-lg font-black tracking-tight">
                        {frec?.origen || 'Origen'} ➔ {frec?.destino || 'Destino'}
                      </span>
                    </div>
                    <Badge
                      variant={
                        boleto.estado === 'abordado'
                          ? 'success'
                          : boleto.estado === 'pagado'
                          ? 'cooperativa'
                          : 'warning'
                      }
                    >
                      {boleto.estado.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Cuerpo del boleto con QR y detalles */}
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm shrink-0">
                        <QRCodeSVG
                          value={boleto.codigoQr || boleto.id}
                          size={76}
                          level="M"
                        />
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="font-mono font-bold text-blue-900 text-[11px]">
                          {boleto.codigoQr || boleto.id}
                        </div>
                        <div className="text-gray-600">
                          <strong>Pasajero:</strong> {boleto.pasajeroNombre || 'Cliente'}
                        </div>
                        <div className="text-gray-600">
                          <strong>Cédula:</strong> {boleto.pasajeroCedula || 'S/N'}
                        </div>
                        <div className="text-gray-500 text-[10px]">
                          Fecha: {ruta?.fecha || 'Hoy'} | Hora: {frec?.hora || '08:00'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Asiento</span>
                        <span className="text-lg font-black text-blue-900">
                          #{boleto.asiento}{' '}
                          {isVip && <span className="text-xs text-amber-600 font-bold">(VIP)</span>}
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Pagado</span>
                        <span className="text-lg font-black text-emerald-700">
                          ${boleto.precio.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {boleto.abordadoAt && (
                      <div className="p-2 bg-emerald-50 text-emerald-800 text-[11px] rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                        <span>✓ Abordado el {new Date(boleto.abordadoAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Acciones */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => setSelectedBoletoModal(boleto)}
                  >
                    Ver Pase Completo QR
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Pase de Abordaje Completo */}
      {selectedBoletoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedBoletoModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold"
            >
              ✕
            </button>

            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Pase de Abordaje Digital EcuRutas
            </div>
            <h3 className="text-xl font-black text-gray-900">
              {getFrecuencia(getRuta(selectedBoletoModal.rutaId)?.frecuenciaId)?.origen} ➔{' '}
              {getFrecuencia(getRuta(selectedBoletoModal.rutaId)?.frecuenciaId)?.destino}
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-gray-300 flex justify-center">
              <QRCodeSVG
                value={selectedBoletoModal.codigoQr || selectedBoletoModal.id}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="font-mono text-xs font-bold text-blue-900 bg-blue-50 py-1.5 rounded-lg">
              {selectedBoletoModal.codigoQr}
            </div>

            <div className="text-left text-xs space-y-1.5 text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex justify-between">
                <span>Pasajero:</span>
                <strong>{selectedBoletoModal.pasajeroNombre}</strong>
              </div>
              <div className="flex justify-between">
                <span>Cédula:</span>
                <strong>{selectedBoletoModal.pasajeroCedula}</strong>
              </div>
              <div className="flex justify-between">
                <span>Asiento:</span>
                <strong className="text-blue-700">#{selectedBoletoModal.asiento}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tarifa:</span>
                <strong>${selectedBoletoModal.precio.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <Badge variant={selectedBoletoModal.estado === 'abordado' ? 'success' : 'warning'}>
                  {selectedBoletoModal.estado.toUpperCase()}
                </Badge>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => {
                window.print();
              }}
            >
              🖨️ Imprimir / Guardar en PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
