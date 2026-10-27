'use client';

import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '@/lib/services/dataService';
import type {
  RutaRow,
  FrecuenciaRow,
  BusRow,
  BoletoRow,
  ParadaFrecuenciaRow,
  CooperativaRow,
} from '@/lib/data/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ChoferPage() {
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [selectedRutaId, setSelectedRutaId] = useState<string>('');
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Escáner QR
  const [scannerActive, setScannerActive] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    tipo: 'exito' | 'error' | 'advertencia';
    mensaje: string;
    boleto?: BoletoRow;
  } | null>(null);

  // Registro de Parada
  const [paradasVisitadas, setParadasVisitadas] = useState<Record<string, string>>({});

  const html5QrCodeRef = useRef<unknown>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [rutList, frecList, busList, bolList, parList, coopList] = await Promise.all([
          dataService.getRutas(),
          dataService.getFrecuencias(),
          dataService.getBuses(),
          dataService.getBoletos(),
          dataService.getParadas(),
          dataService.getCooperativas(),
        ]);
        setRutas(rutList);
        setFrecuencias(frecList);
        setBuses(busList);
        setBoletos(bolList);
        setParadas(parList);
        setCooperativas(coopList);
        if (rutList.length > 0) setSelectedRutaId(rutList[0].id);
      } catch (err) {
        console.error('Error al cargar datos del chofer:', err);
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
  const rutaParadas = paradas.filter((p) => p.frecuenciaId === currentFrec?.id);

  // Pasajeros de la ruta seleccionada
  const pasajerosRuta = boletos.filter((b) => b.rutaId === selectedRutaId);
  const abordadosCount = pasajerosRuta.filter((b) => b.estado === 'abordado').length;
  const porcentajeAbordaje =
    pasajerosRuta.length > 0 ? Math.round((abordadosCount / pasajerosRuta.length) * 100) : 0;

  // Iniciar / Detener lector de cámara con html5-qrcode
  const toggleCameraScanner = async () => {
    if (scannerActive) {
      if (html5QrCodeRef.current) {
        try {
          const scanner = html5QrCodeRef.current as { stop: () => Promise<void> };
          await scanner.stop();
        } catch (e) {
          console.warn('Error al detener cámara:', e);
        }
      }
      setScannerActive(false);
      return;
    }

    try {
      setScannerActive(true);
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          handleValidateTicket(decodedText);
          try {
            await scanner.stop();
            setScannerActive(false);
          } catch {
            // Ignorar
          }
        },
        () => {}
      );
    } catch (err) {
      console.error('No se pudo acceder a la cámara:', err);
      setScannerActive(false);
      setScanResult({
        tipo: 'error',
        mensaje: 'No se pudo iniciar la cámara del dispositivo. Usa la validación manual por código.',
      });
    }
  };

  // Validar código de boleto
  const handleValidateTicket = async (codigo: string) => {
    if (!codigo.trim()) return;
    const res = await dataService.validarBoletoQR(codigo);

    if (res.exito && res.boleto) {
      setScanResult({
        tipo: 'exito',
        mensaje: res.mensaje,
        boleto: res.boleto,
      });
      // Actualizar estado local de la lista
      setBoletos((prev) =>
        prev.map((b) => (b.id === res.boleto!.id ? res.boleto! : b))
      );
    } else {
      setScanResult({
        tipo: res.boleto ? 'advertencia' : 'error',
        mensaje: res.mensaje,
        boleto: res.boleto,
      });
    }
    setQrInput('');
  };

  // Registrar llegada a parada intermedia
  const handleRegistrarParada = (paradaId: string) => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setParadasVisitadas((prev) => ({
      ...prev,
      [paradaId]: horaActual,
    }));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Control de Abordaje y Hoja de Ruta
            </h1>
            <Badge variant="chofer">CHOFER / AYUDANTE</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Escaneo de códigos QR en tiempo real, validación de pasajes y registro de escalas intermedias.
          </p>
        </div>

        {/* Selector de Ruta Activa del Conductor */}
        <div className="w-full sm:w-80">
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
            Viaje Asignado:
          </label>
          <select
            value={selectedRutaId}
            onChange={(e) => {
              setSelectedRutaId(e.target.value);
              setScanResult(null);
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
          >
            {rutas.map((r) => {
              const f = frecuencias.find((frec) => frec.id === r.frecuenciaId);
              const b = buses.find((bus) => bus.id === r.busId);
              return (
                <option key={r.id} value={r.id}>
                  {f?.origen} ➔ {f?.destino} ({f?.hora}) | Bus #{b?.numero}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Resumen del Viaje Activo y Progreso de Abordaje */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              {currentCoop?.nombre || 'Cooperativa'}
            </div>
            <div className="text-2xl font-black mt-1">
              {currentFrec?.origen} ➔ {currentFrec?.destino}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Hora: <strong>{currentFrec?.hora}</strong> | Fecha: <strong>{currentRuta?.fecha}</strong>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidad Asignada</div>
            <div className="text-xl font-bold mt-1 text-white">
              Bus #{currentBus?.numero} <span className="font-mono text-sm text-amber-400">({currentBus?.placa})</span>
            </div>
            <div className="text-xs text-slate-300">{currentBus?.marca} {currentBus?.carroceria}</div>
          </div>

          <div className="md:col-span-2 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-slate-300">
                Progreso de Abordaje
              </span>
              <span className="text-sm font-black text-emerald-400">
                {abordadosCount} de {pasajerosRuta.length} Pasajeros ({porcentajeAbordaje}%)
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeAbordaje}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zona Central: Escáner QR y Lista de Pasajeros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Escáner QR */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-base font-black text-gray-900">
                Lector de Códigos QR
              </CardTitle>
              <CardDescription className="text-xs">
                Escanea el boleto con la cámara o ingresa el código manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Contenedor de cámara html5-qrcode */}
              <div
                id="qr-reader-container"
                className={`w-full bg-black rounded-xl overflow-hidden transition-all ${
                  scannerActive ? 'h-64' : 'hidden'
                }`}
              />

              <Button
                variant={scannerActive ? 'danger' : 'primary'}
                className="w-full font-bold py-2.5"
                onClick={toggleCameraScanner}
              >
                {scannerActive ? '⏹ Detener Cámara' : '📷 Abrir Escáner de Cámara'}
              </Button>

              {/* Entrada Manual o Lector Láser */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Validación Manual o Pistola Láser
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleValidateTicket(qrInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ej: ECU-BOL-001..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit" variant="primary" size="sm" className="font-bold shrink-0">
                    Validar
                  </Button>
                </form>
              </div>

              {/* Feedback del Resultado del Escaneo */}
              {scanResult && (
                <div
                  className={`p-4 rounded-xl text-xs space-y-1.5 border transition-all ${
                    scanResult.tipo === 'exito'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : scanResult.tipo === 'advertencia'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  <div className="font-black text-sm flex items-center gap-1.5">
                    {scanResult.tipo === 'exito' ? '✅' : scanResult.tipo === 'advertencia' ? '⚠️' : '❌'}
                    <span>{scanResult.mensaje}</span>
                  </div>
                  {scanResult.boleto && (
                    <div className="pt-2 border-t border-current/20 space-y-0.5 text-[11px]">
                      <div>
                        <strong>Pasajero:</strong> {scanResult.boleto.pasajeroNombre}
                      </div>
                      <div>
                        <strong>Asiento Asignado:</strong> #{scanResult.boleto.asiento}
                      </div>
                      <div>
                        <strong>Cédula:</strong> {scanResult.boleto.pasajeroCedula}
                      </div>
                      <div>
                        <strong>Hora de Abordaje:</strong>{' '}
                        {scanResult.boleto.abordadoAt
                          ? new Date(scanResult.boleto.abordadoAt).toLocaleTimeString()
                          : 'En este instante'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Control de Paradas Intermedias */}
          {rutaParadas.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-100">
                <CardTitle className="text-sm font-black text-gray-900">
                  Control de Escalas en Ruta
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {rutaParadas.map((p) => {
                  const visitada = paradasVisitadas[p.id];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div>
                        <span className="font-bold text-gray-800">{p.ciudad}</span>
                        <span className="text-[10px] text-gray-400 block">Escala #{p.orden}</span>
                      </div>
                      {visitada ? (
                        <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-[11px]">
                          ✓ Arribo {visitada}
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegistrarParada(p.id)}
                          className="text-[10px] py-1"
                        >
                          Marcar Llegada
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Manifiesto de Pasajeros de la Unidad */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
              Manifiesto de Pasajeros de la Unidad ({pasajerosRuta.length})
            </h2>
            <div className="flex gap-2">
              <span className="text-xs text-gray-500 self-center">
                Bus #{currentBus?.numero} ({currentBus?.capacidad || 40} asientos)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-center">Asiento</th>
                  <th className="py-3 px-4">Pasajero</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Código Boleto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {pasajerosRuta.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No hay boletos emitidos para este viaje aún.
                    </td>
                  </tr>
                ) : (
                  pasajerosRuta.map((bol) => {
                    const isAbordado = bol.estado === 'abordado';
                    const isVip = currentBus?.asientosVIPNumeros?.includes(bol.asiento);

                    return (
                      <tr
                        key={bol.id}
                        className={`transition-colors ${
                          isAbordado ? 'bg-emerald-50/50' : 'hover:bg-gray-50/60'
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                              isVip
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            #{bol.asiento} {isVip && '⭐'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{bol.pasajeroNombre}</td>
                        <td className="py-3 px-4 font-mono text-gray-600">{bol.pasajeroCedula}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-blue-900 font-bold">
                          {bol.codigoQr || bol.id}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={isAbordado ? 'success' : 'warning'}>
                            {isAbordado ? 'ABORDADO' : 'PENDIENTE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isAbordado ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] text-emerald-700 hover:bg-emerald-50 font-bold"
                              onClick={() => handleValidateTicket(bol.codigoQr || bol.id)}
                            >
                              ✓ Registrar Abordaje
                            </Button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold">
                              {bol.abordadoAt
                                ? new Date(bol.abordadoAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Confirmado'}
                            </span>
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
      </div>
    </div>
  );
}
