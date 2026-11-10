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
} from '@/lib/types';
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
  const [, setLoading] = useState(true);

  // Escáner QR y cámaras de PC
  const [scannerActive, setScannerActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    tipo: 'exito' | 'error' | 'advertencia';
    mensaje: string;
    boleto?: BoletoRow;
  } | null>(null);

  // Registro de Parada
  const [paradasVisitadas, setParadasVisitadas] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (rutList.length > 0) {
          const rutaConBoletos = rutList.find((r) => bolList.some((b) => b.rutaId === r.id));
          setSelectedRutaId(rutaConBoletos ? rutaConBoletos.id : rutList[0].id);
        }
      } catch (err) {
        console.error('Error al cargar datos del chofer:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Polling ligero cada 4 segundos para actualizar boletos en tiempo real si otro dispositivo emite o aborda
    const poller = setInterval(async () => {
      try {
        const bolActualizados = await dataService.getBoletos();
        if (bolActualizados && bolActualizados.length > 0) {
          setBoletos(bolActualizados);
        }
      } catch {
        // Ignorar errores transitorios de polling
      }
    }, 4000);

    return () => clearInterval(poller);
  }, []);

  const currentRuta = rutas.find((r) => r.id === selectedRutaId) || rutas[0];
  const currentFrec = frecuencias.find((f) => f.id === currentRuta?.frecuenciaId);
  const currentBus = buses.find((b) => b.id === currentRuta?.busId);
  const currentCoop = cooperativas.find((c) => c.id === currentFrec?.cooperativaId);
  const rutaParadas = paradas.filter((p) => p.frecuenciaId === currentFrec?.id);

  // Pasajeros de la ruta seleccionada (o todos si se elige "TODAS")
  const pasajerosRuta =
    selectedRutaId === 'TODAS'
      ? boletos
      : boletos.filter((b) => b.rutaId === selectedRutaId);

  // Pasajeros que ya fueron escaneados y validados para abordar
  const pasajerosAbordados = pasajerosRuta.filter((b) => {
    const est = (b.estado || '').toUpperCase();
    return est === 'ABORDADO' || est === 'EMBARCADO';
  });

  const abordadosCount = pasajerosAbordados.length;
  const porcentajeAbordaje =
    pasajerosRuta.length > 0 ? Math.round((abordadosCount / pasajerosRuta.length) * 100) : 0;

  const stopCameraStream = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startWebcamWithId = async (deviceId?: string) => {
    try {
      stopCameraStream();
      setScanResult(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('El navegador no permite acceso a dispositivos de video.');
      }

      // 1. Abrir directamente la webcam de la PC sin pedir cámara trasera de celular
      const videoConstraints: MediaTrackConstraints | boolean = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 } };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch {
        // Fallback universal: cualquier cámara conectada a la PC
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setScannerActive(true);

      // 2. Listar las cámaras de la PC para que el usuario pueda cambiar si tiene varias
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({
          id: d.deviceId,
          label: d.label || `Cámara de PC #${idx + 1}`,
        }));
      setAvailableCameras(videoDevices);

      const activeTrack = stream.getVideoTracks()[0];
      const activeDeviceId = activeTrack?.getSettings()?.deviceId;
      if (activeDeviceId) {
        setSelectedCameraId(activeDeviceId);
      } else if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].id);
      }

      // 3. Conectar el stream al elemento <video>
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      }, 50);

      // 4. Bucle de lectura de QR desde los fotogramas de la webcam de la PC
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const { Html5Qrcode } = await import('html5-qrcode');

      // Detector nativo BarcodeDetector (Chrome/Edge en Windows) si está disponible
      const NativeBarcodeDetector = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (source: HTMLVideoElement | HTMLCanvasElement) => Promise<Array<{ rawValue: string }>>;
          };
        }
      ).BarcodeDetector;
      const nativeDetector = NativeBarcodeDetector
        ? new NativeBarcodeDetector({ formats: ['qr_code'] })
        : null;

      let processingFrame = false;
      scanIntervalRef.current = setInterval(async () => {
        if (processingFrame || !videoRef.current || videoRef.current.readyState < 2) return;
        processingFrame = true;

        try {
          const videoEl = videoRef.current;

          // Intento A: BarcodeDetector nativo del navegador de PC
          if (nativeDetector) {
            const barcodes = await nativeDetector.detect(videoEl);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              const code = barcodes[0].rawValue;
              stopCameraStream();
              await handleValidateTicket(code);
              processingFrame = false;
              return;
            }
          }

          // Intento B: Decodificación por frame con html5-qrcode
          if (ctx && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, 'image/jpeg', 0.85)
            );
            if (blob) {
              const frameFile = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
              const tempScanner = new Html5Qrcode('qr-reader-file-temp');
              try {
                const decoded = await tempScanner.scanFile(frameFile, false);
                tempScanner.clear();
                if (decoded) {
                  stopCameraStream();
                  await handleValidateTicket(decoded);
                  processingFrame = false;
                  return;
                }
              } catch {
                tempScanner.clear();
              }
            }
          }
        } catch {
          // Seguir intentando en el siguiente fotograma
        } finally {
          processingFrame = false;
        }
      }, 450);
    } catch (err) {
      console.error('No se pudo acceder a la webcam de la PC:', err);
      stopCameraStream();
      setScanResult({
        tipo: 'error',
        mensaje:
          'No se pudo abrir la cámara de tu PC. Verifica que el navegador tenga permiso de Cámara activado (ícono de candado junto a localhost:3000) o sube la imagen del QR.',
      });
    }
  };

  const toggleCameraScanner = async () => {
    if (scannerActive) {
      stopCameraStream();
    } else {
      await startWebcamWithId(selectedCameraId || undefined);
    }
  };

  // Escanear QR desde archivo de imagen (ideal en PC si se tiene captura del QR)
  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanResult(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader-file-temp');
      const decodedText = await scanner.scanFile(file, false);
      scanner.clear();
      await handleValidateTicket(decodedText);
    } catch {
      setScanResult({
        tipo: 'error',
        mensaje: 'No se detectó un código QR válido en la imagen seleccionada.',
      });
    } finally {
      e.target.value = '';
    }
  };

  // Validar código de boleto
  const handleValidateTicket = async (codigo: string) => {
    if (!codigo.trim()) return;
    const res = await dataService.validarBoletoQR(codigo);

    if (res.exito && res.boleto) {
      const boletoValidado = res.boleto;
      setScanResult({
        tipo: 'exito',
        mensaje: res.mensaje,
        boleto: boletoValidado,
      });

      // 1. Actualizar estado local inmediatamente
      setBoletos((prev) => {
        const existe = prev.some((b) => b.id === boletoValidado.id);
        if (existe) {
          return prev.map((b) => (b.id === boletoValidado.id ? { ...b, ...boletoValidado } : b));
        }
        return [boletoValidado, ...prev];
      });

      // 2. Si el viaje seleccionado no coincidía con el boleto, cambiar automáticamente al viaje del boleto
      if (boletoValidado.rutaId && selectedRutaId !== 'TODAS' && selectedRutaId !== boletoValidado.rutaId) {
        setSelectedRutaId(boletoValidado.rutaId);
      }

      // 3. Re-sincronizar en segundo plano con la base de datos
      try {
        const bolActualizados = await dataService.getBoletos();
        if (bolActualizados && bolActualizados.length > 0) {
          setBoletos(bolActualizados);
        }
      } catch (e) {
        console.warn('Error al re-sincronizar boletos:', e);
      }
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              Control de Abordaje y Hoja de Ruta
            </h1>
            <Badge variant="chofer">CHOFER / AYUDANTE</Badge>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Escaneo de códigos QR en tiempo real, validación de pasajes y registro de escalas intermedias.
          </p>
        </div>

        {/* Selector de Ruta Activa del Conductor */}
        <div className="w-full sm:w-80">
          <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">
            Viaje Asignado:
          </label>
          <select
            value={selectedRutaId}
            onChange={(e) => {
              setSelectedRutaId(e.target.value);
              setScanResult(null);
            }}
            className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white font-bold text-brand-900 focus:ring-2 focus:ring-brand-500"
          >
            <option value="TODAS">Todos los viajes con boletos ({boletos.length} boletos)</option>
            {rutas.map((r) => {
              const f = frecuencias.find((frec) => frec.id === r.frecuenciaId);
              const b = buses.find((bus) => bus.id === r.busId);
              const count = boletos.filter((bol) => bol.rutaId === r.id).length;
              return (
                <option key={r.id} value={r.id}>
                  {f?.origen} ➔ {f?.destino} ({f?.hora}) | Bus #{b?.numero} ({count} pasaj.)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Resumen del Viaje Activo y Progreso de Abordaje */}
      <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <div className="text-xs font-bold text-brand-400 uppercase tracking-wider">
              {currentCoop?.nombre || 'Cooperativa'}
            </div>
            <div className="text-2xl font-black mt-1">
              {currentFrec?.origen} ➔ {currentFrec?.destino}
            </div>
            <div className="text-xs text-neutral-300 mt-0.5">
              Hora: <strong>{currentFrec?.hora}</strong> | Fecha: <strong>{currentRuta?.fecha}</strong>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Unidad Asignada</div>
            <div className="text-xl font-bold mt-1 text-white">
              Bus #{currentBus?.numero} <span className="font-mono text-sm text-accent-400">({currentBus?.placa})</span>
            </div>
            <div className="text-xs text-neutral-300">{currentBus?.marca} {currentBus?.carroceria}</div>
          </div>

          <div className="md:col-span-2 bg-neutral-800/80 p-4 rounded-2xl border border-neutral-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-neutral-300">
                Progreso de Abordaje
              </span>
              <span className="text-sm font-black text-success-400">
                {abordadosCount} de {pasajerosRuta.length} Pasajeros ({porcentajeAbordaje}%)
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-neutral-700 h-3 rounded-full overflow-hidden">
              <div
                className="bg-success-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeAbordaje}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zona Central: Escáner QR y Lista de Pasajeros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-neutral-50 border-b border-neutral-100">
              <CardTitle className="text-base font-black text-neutral-900">
                Lector de Códigos QR
              </CardTitle>
              <CardDescription className="text-xs">
                Escanea el boleto con la cámara o ingresa el código manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Visor directo de Webcam de la PC */}
              <div
                className={`relative w-full bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 transition-all ${
                  scannerActive ? 'aspect-video block' : 'hidden'
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-44 h-44 border-2 border-brand-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="inline-block bg-neutral-900/85 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                    Acerca el código QR a la cámara de tu PC
                  </span>
                </div>
              </div>

              {scannerActive && availableCameras.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                    Seleccionar Cámara de la PC:
                  </label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startWebcamWithId(e.target.value);
                    }}
                    className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold"
                  >
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div id="qr-reader-file-temp" className="hidden" />

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={scannerActive ? 'danger' : 'primary'}
                  className="w-full font-bold py-2.5"
                  onClick={toggleCameraScanner}
                >
                  {scannerActive ? 'Detener Cámara de mi PC' : 'Abrir Cámara de mi PC'}
                </Button>

                <label
                  htmlFor="qr-file-upload"
                  className="w-full text-center text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg py-2 px-3 cursor-pointer transition-colors block"
                >
                  Subir captura o imagen del QR desde mi PC
                  <input
                    id="qr-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleScanImageFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Entrada Manual o Lector Láser */}
              <div className="border-t border-neutral-100 pt-3">
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">
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
                    className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-brand-500"
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
                      ? 'bg-success-50 border-success-300 text-success-900'
                      : scanResult.tipo === 'advertencia'
                      ? 'bg-warning-50 border-warning-300 text-warning-900'
                      : 'bg-danger-50 border-danger-300 text-danger-900'
                  }`}
                >
                  <div className="font-black text-sm flex items-center gap-1.5">
                    {scanResult.tipo === 'exito' ? 'VÁLIDO' : scanResult.tipo === 'advertencia' ? 'AVISO' : 'ERROR'}
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
            <Card className="border border-neutral-200 shadow-sm">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                <CardTitle className="text-sm font-black text-neutral-900">
                  Control de Escalas en Ruta
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {rutaParadas.map((p) => {
                  const visitada = paradasVisitadas[p.id];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 border border-neutral-100"
                    >
                      <div>
                        <span className="font-bold text-neutral-800">{p.ciudad}</span>
                        <span className="text-[10px] text-neutral-400 block">Escala #{p.orden}</span>
                      </div>
                      {visitada ? (
                        <span className="text-success-700 bg-success-100 font-bold px-2 py-0.5 rounded text-[11px]">
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
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                Pasajeros Abordados por QR ({pasajerosAbordados.length} de {pasajerosRuta.length})
              </h2>
              <p className="text-xs text-neutral-500">
                Lista de boletos verificados y confirmados en la puerta de la unidad
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-neutral-500 self-center">
                Bus #{currentBus?.numero} ({currentBus?.capacidad || 40} asientos)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4 text-center">Asiento</th>
                  <th className="py-3 px-4">Pasajero</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Código Boleto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Hora Abordaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {pasajerosAbordados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="max-w-sm mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto text-lg">
                          🎟️
                        </div>
                        <p className="font-bold text-neutral-700">Aún no hay pasajeros abordados</p>
                        <p className="text-xs text-neutral-500">
                          Usa la cámara o ingresa el código manual para escanear el boleto QR. Los pasajeros validados aparecerán aquí automáticamente.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pasajerosAbordados.map((bol) => {
                    const isVip = currentBus?.asientosVIPNumeros?.includes(bol.asiento);

                    return (
                      <tr
                        key={bol.id}
                        className="bg-success-50/40 hover:bg-success-50/70 transition-colors"
                      >
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                              isVip
                                ? 'bg-accent-100 text-accent-800 border border-accent-300'
                                : 'bg-neutral-100 text-neutral-900'
                            }`}
                          >
                            #{bol.asiento} {isVip && 'VIP'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{bol.pasajeroNombre}</td>
                        <td className="py-3 px-4 font-mono text-neutral-600">{bol.pasajeroCedula}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-brand-900 font-bold">
                          {bol.codigoQr || bol.id}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="success">
                            ABORDADO
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-success-800 font-bold">
                          {bol.abordadoAt
                            ? new Date(bol.abordadoAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : 'Registrado'}
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
