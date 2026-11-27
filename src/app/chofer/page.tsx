'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dataService } from '@/lib/services/dataService';
import { createClient } from '@/lib/supabase/client';
import type {
  RutaRow,
  FrecuenciaRow,
  BusRow,
  BoletoRow,
  ParadaFrecuenciaRow,
  CooperativaRow,
  BitacoraViajeRow,
} from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SeatSelector } from '@/components/bus/SeatSelector';

// Constantes de trazabilidad obligatorias (RFC-006 / ECU-8 / GDCS-2)
const TRAZABILIDAD_RFC = 'RFC-006';
const TRAZABILIDAD_TAG = 'v1.4.0-rfc006';
const TRAZABILIDAD_TICKET = 'GDCS-2 / ECU-8 (Issue #74)';

export default function ChoferPage() {
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [selectedRutaId, setSelectedRutaId] = useState<string>('');
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [bitacora, setBitacora] = useState<BitacoraViajeRow[]>([]);
  const [currentChoferId, setCurrentChoferId] = useState<string | null>(null);
  const [choferNombre, setChoferNombre] = useState<string>('Chofer Asignado');
  const [, setLoading] = useState(true);

  // Escáner QR y cámaras
  const [scannerActive, setScannerActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    tipo: 'exito' | 'error' | 'advertencia';
    mensaje: string;
    boleto?: BoletoRow;
    timestamp?: string;
  } | null>(null);

  // Control de viaje y modales
  const [viajeOperando, setViajeOperando] = useState(false);
  const [modalVentaOpen, setModalVentaOpen] = useState(false);
  const [modalFinOpen, setModalFinOpen] = useState(false);
  const [observacionFin, setObservacionFin] = useState('');

  // Venta a bordo
  const [asientoVenta, setAsientoVenta] = useState<number | null>(null);
  const [pasajeroNombreVenta, setPasajeroNombreVenta] = useState('');
  const [pasajeroCedulaVenta, setPasajeroCedulaVenta] = useState('');
  const [precioVenta, setPrecioVenta] = useState<number>(10.0);
  const [ventaError, setVentaError] = useState<string | null>(null);
  const [ventaLoading, setVentaLoading] = useState(false);

  // Registro de Parada
  const [paradasVisitadas, setParadasVisitadas] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reproductor de sonido sintético para feedback auditivo de QR
  const playAudioFeedback = useCallback((exito: boolean) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (exito) {
        // Tono agudo y agradable (doble beep verde)
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Tono grave disonante (alerta roja)
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Ignorar restricciones de audio context
    }
  }, []);

  // Carga inicial de sesión y datos
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Detectar chofer actual si hay sesión iniciada
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        let choferId: string | null = null;

        if (session?.user) {
          choferId = session.user.id;
          setCurrentChoferId(choferId);
          const { data: profile } = await supabase
            .from('Usuario')
            .select('nombre, rol')
            .eq('id', choferId)
            .maybeSingle();

          if (profile?.nombre) {
            setChoferNombre(profile.nombre);
          }
        }

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

        // Selección por defecto: ruta asignada al chofer o primera ruta disponible
        if (rutList.length > 0) {
          const rutaDelChofer = choferId ? rutList.find((r) => r.choferId === choferId) : null;
          const rutaConBoletos = rutList.find((r) => bolList.some((b) => b.rutaId === r.id));
          const inicial = rutaDelChofer ? rutaDelChofer.id : (rutaConBoletos ? rutaConBoletos.id : rutList[0].id);
          setSelectedRutaId(inicial);
        }
      } catch (err) {
        console.error('Error al cargar datos del chofer:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Polling ligero para sincronizar boletos
    const poller = setInterval(async () => {
      try {
        const bolActualizados = await dataService.getBoletos();
        if (bolActualizados && bolActualizados.length > 0) {
          setBoletos(bolActualizados);
        }
      } catch {
        // Ignorar errores transitorios
      }
    }, 4000);

    return () => clearInterval(poller);
  }, []);

  // Cargar bitácora cada vez que cambia la ruta seleccionada
  useEffect(() => {
    async function cargarBitacoraRuta() {
      if (!selectedRutaId || selectedRutaId === 'TODAS') {
        setBitacora([]);
        return;
      }
      const eventos = await dataService.getBitacoraViaje(selectedRutaId);
      setBitacora(eventos);
    }
    cargarBitacoraRuta();
  }, [selectedRutaId]);

  const currentRuta = rutas.find((r) => r.id === selectedRutaId) || rutas[0];
  const currentFrec = frecuencias.find((f) => f.id === currentRuta?.frecuenciaId);
  const currentBus = buses.find((b) => b.id === currentRuta?.busId);
  const currentCoop = cooperativas.find((c) => c.id === currentFrec?.cooperativaId);
  const rutaParadas = paradas.filter((p) => p.frecuenciaId === currentFrec?.id);

  // Pasajeros de la ruta seleccionada
  const pasajerosRuta =
    selectedRutaId === 'TODAS'
      ? boletos
      : boletos.filter((b) => b.rutaId === selectedRutaId);

  const pasajerosAbordados = pasajerosRuta.filter((b) => {
    const estado = (b.estado || '').toUpperCase();
    return estado === 'EMBARCADO' || estado === 'ABORDADO' || Boolean(b.abordadoAt);
  });

  const abordadosCount = pasajerosAbordados.length;
  const porcentajeAbordaje =
    pasajerosRuta.length > 0 ? Math.round((abordadosCount / pasajerosRuta.length) * 100) : 0;

  // Asientos ocupados en la ruta activa
  const asientosOcupados = pasajerosRuta.map((b) => Number(b.asiento)).filter((n) => !isNaN(n));

  // Actualizar precio sugerido para venta a bordo al cambiar de ruta
  useEffect(() => {
    if (currentRuta?.precio) {
      setPrecioVenta(Number(currentRuta.precio));
    } else if (currentFrec?.precioBase) {
      setPrecioVenta(Number(currentFrec.precioBase));
    }
  }, [currentRuta, currentFrec]);

  // Manejadores de cámara y escaneo
  const stopCameraStream = useCallback(() => {
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
  }, []);

  const startWebcamWithId = async (deviceId?: string) => {
    try {
      stopCameraStream();
      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: { ideal: 'environment' } };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setScannerActive(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({
          id: d.deviceId,
          label: d.label || `Cámara de PC #${idx + 1}`,
        }));
      setAvailableCameras(videoDevices);

      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      }, 50);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const { Html5Qrcode } = await import('html5-qrcode');

      let processingFrame = false;
      scanIntervalRef.current = setInterval(async () => {
        if (processingFrame || !videoRef.current || videoRef.current.readyState < 2) return;
        processingFrame = true;

        try {
          const videoEl = videoRef.current;
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
          // Seguir intentando en el siguiente frame
        } finally {
          processingFrame = false;
        }
      }, 450);
    } catch (err) {
      console.error('No se pudo acceder a la webcam:', err);
      stopCameraStream();
      playAudioFeedback(false);
      setScanResult({
        tipo: 'error',
        mensaje: 'No se pudo abrir la cámara. Verifica los permisos del navegador o usa el ingreso manual.',
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
      playAudioFeedback(false);
      setScanResult({
        tipo: 'error',
        mensaje: 'No se detectó un código QR válido en la imagen seleccionada.',
      });
    } finally {
      e.target.value = '';
    }
  };

  // Validación de Boleto QR
  const handleValidateTicket = async (codigo: string) => {
    if (!codigo.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const res = await dataService.validarBoletoQR(codigo);

    if (res.exito && res.boleto) {
      playAudioFeedback(true);
      const boletoValidado = res.boleto;
      setScanResult({
        tipo: 'exito',
        mensaje: res.mensaje,
        boleto: boletoValidado,
        timestamp: now,
      });

      setBoletos((prev) => {
        const existe = prev.some((b) => b.id === boletoValidado.id);
        if (existe) {
          return prev.map((b) => (b.id === boletoValidado.id ? { ...b, ...boletoValidado } : b));
        }
        return [boletoValidado, ...prev];
      });

      if (boletoValidado.rutaId && selectedRutaId !== 'TODAS' && selectedRutaId !== boletoValidado.rutaId) {
        setSelectedRutaId(boletoValidado.rutaId);
      }
    } else {
      playAudioFeedback(false);
      setScanResult({
        tipo: res.boleto ? 'advertencia' : 'error',
        mensaje: res.mensaje,
        boleto: res.boleto,
        timestamp: now,
      });
    }
    setQrInput('');
  };

  // Iniciar viaje
  const handleIniciarViaje = async () => {
    if (!selectedRutaId || selectedRutaId === 'TODAS') return;
    try {
      setViajeOperando(true);
      const res = await dataService.iniciarViaje(selectedRutaId, currentChoferId || undefined);
      if (res.error) {
        alert(`No se pudo iniciar el viaje: ${res.error}`);
        return;
      }
      setRutas((prev) =>
        prev.map((r) => (r.id === selectedRutaId ? { ...r, estado: 'en_curso', inicio: new Date().toISOString() } : r))
      );
      const nuevaBitacora = await dataService.getBitacoraViaje(selectedRutaId);
      setBitacora(nuevaBitacora);
    } catch (e) {
      console.error(e);
    } finally {
      setViajeOperando(false);
    }
  };

  // Finalizar viaje
  const handleFinalizarViaje = async () => {
    if (!selectedRutaId || selectedRutaId === 'TODAS') return;
    try {
      setViajeOperando(true);
      const res = await dataService.finalizarViaje(
        selectedRutaId,
        currentChoferId || undefined,
        observacionFin.trim() || undefined
      );
      if (res.error) {
        alert(`No se pudo finalizar el viaje: ${res.error}`);
        return;
      }
      setRutas((prev) =>
        prev.map((r) =>
          r.id === selectedRutaId ? { ...r, estado: 'completada', completada: true, fin: new Date().toISOString() } : r
        )
      );
      const nuevaBitacora = await dataService.getBitacoraViaje(selectedRutaId);
      setBitacora(nuevaBitacora);
      setModalFinOpen(false);
      setObservacionFin('');
    } catch (e) {
      console.error(e);
    } finally {
      setViajeOperando(false);
    }
  };

  // Venta a bordo
  const handleEmitirVentaABordo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVentaError(null);

    if (!selectedRutaId || selectedRutaId === 'TODAS') {
      setVentaError('Selecciona una ruta específica para emitir boletos a bordo.');
      return;
    }
    if (!asientoVenta) {
      setVentaError('Debes seleccionar un asiento disponible en el croquis.');
      return;
    }
    if (!pasajeroNombreVenta.trim() || !pasajeroCedulaVenta.trim()) {
      setVentaError('Nombre y Cédula del pasajero son requeridos.');
      return;
    }

    try {
      setVentaLoading(true);
      const res = await dataService.venderBoletoABordo({
        rutaId: selectedRutaId,
        asiento: asientoVenta,
        pasajeroNombre: pasajeroNombreVenta.trim(),
        pasajeroCedula: pasajeroCedulaVenta.trim(),
        precio: precioVenta,
        choferId: currentChoferId || undefined,
      });

      if (res.error || !res.data) {
        setVentaError(res.error || 'No se pudo emitir el boleto a bordo.');
        return;
      }

      // Actualizar estado local
      const nuevoBoleto = res.data;
      setBoletos((prev) => [nuevoBoleto, ...prev]);
      const nuevaBitacora = await dataService.getBitacoraViaje(selectedRutaId);
      setBitacora(nuevaBitacora);

      // Limpiar y cerrar modal
      setAsientoVenta(null);
      setPasajeroNombreVenta('');
      setPasajeroCedulaVenta('');
      setModalVentaOpen(false);
      playAudioFeedback(true);
    } catch (err) {
      setVentaError(`Error inesperado: ${String(err)}`);
    } finally {
      setVentaLoading(false);
    }
  };

  // Registrar escala en parada intermedia
  const handleRegistrarParada = async (paradaId: string) => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setParadasVisitadas((prev) => ({
      ...prev,
      [paradaId]: horaActual,
    }));

    if (selectedRutaId && selectedRutaId !== 'TODAS') {
      const paradaObj = paradas.find((p) => p.id === paradaId);
      await dataService.registrarEventoBitacora({
        rutaId: selectedRutaId,
        choferId: currentChoferId || null,
        tipoEvento: 'ESCALA_PARADA',
        paradaId,
        descripcion: `Escala en parada: ${paradaObj?.ciudad || 'Parada intermedia'} a las ${horaActual}`,
      });
      const nuevaBitacora = await dataService.getBitacoraViaje(selectedRutaId);
      setBitacora(nuevaBitacora);
    }
  };

  const estadoViajeActual = (currentRuta?.estado || 'programada').toLowerCase();
  const viajeEnCurso = estadoViajeActual === 'en_curso';
  const viajeCompletado = estadoViajeActual === 'completada' || Boolean(currentRuta?.completada);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Contenedor oculto para html5-qrcode */}
      <div id="qr-reader-file-temp" className="hidden" />

      {/* Encabezado y Selector de Chofer */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              Sección de Chofer: QR, Viaje y Venta a Bordo
            </h1>
            <Badge variant="chofer">ROL CHOFER</Badge>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Operador activo: <strong className="text-neutral-900">{choferNombre}</strong> | Validación de boletos en tiempo real, registro en bitácora y emisión directa.
          </p>
        </div>

        {/* Selector de Ruta Asignada */}
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
              const asignadoChofer = currentChoferId && r.choferId === currentChoferId;
              return (
                <option key={r.id} value={r.id}>
                  {asignadoChofer ? '★ ' : ''}{f?.origen} ➔ {f?.destino} ({f?.hora}) | Bus #{b?.numero} ({count} pasaj.)
                </option>
              );
            })}
          </select>
          {selectedRutaId !== 'TODAS' && currentRuta?.choferId && currentChoferId && currentRuta.choferId !== currentChoferId && (
            <span className="text-[11px] text-amber-600 font-medium mt-1 block">
              ℹ Ruta compartida o sin asignación exclusiva a tu perfil.
            </span>
          )}
        </div>
      </div>

      {/* Resumen del Viaje Activo y Controles de Inicio / Fin */}
      <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                {currentCoop?.nombre || 'Cooperativa'}
              </span>
              {viajeEnCurso && <Badge variant="warning">EN CURSO</Badge>}
              {viajeCompletado && <Badge variant="neutral">FINALIZADO</Badge>}
              {!viajeEnCurso && !viajeCompletado && <Badge variant="info">PROGRAMADO</Badge>}
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

          <div className="bg-neutral-800/80 p-4 rounded-2xl border border-neutral-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-neutral-300">
                Progreso de Abordaje
              </span>
              <span className="text-sm font-black text-success-400">
                {abordadosCount} de {pasajerosRuta.length} Pasajeros ({porcentajeAbordaje}%)
              </span>
            </div>
            <div className="w-full bg-neutral-700 h-3 rounded-full overflow-hidden">
              <div
                className="bg-success-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeAbordaje}%` }}
              />
            </div>
          </div>

          {/* Botones de acción del viaje y venta a bordo */}
          <div className="flex flex-col gap-2">
            {!viajeEnCurso && !viajeCompletado && (
              <Button
                variant="primary"
                onClick={handleIniciarViaje}
                disabled={viajeOperando || selectedRutaId === 'TODAS'}
                className="w-full font-bold shadow-md"
              >
                ▶ Iniciar Viaje
              </Button>
            )}
            {viajeEnCurso && (
              <Button
                variant="danger"
                onClick={() => setModalFinOpen(true)}
                disabled={viajeOperando}
                className="w-full font-bold shadow-md"
              >
                ⏹ Finalizar Viaje
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setVentaError(null);
                setModalVentaOpen(true);
              }}
              disabled={selectedRutaId === 'TODAS'}
              className="w-full font-bold bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-600"
            >
              🏷 Venta a Bordo
            </Button>
          </div>
        </div>
      </div>

      {/* Zona Central: Escáner QR y Lista de Pasajeros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-neutral-50 border-b border-neutral-100">
              <CardTitle className="text-base font-black text-neutral-900">
                Lector y Validador de QR
              </CardTitle>
              <CardDescription className="text-xs">
                Escanea el código con la cámara, sube un archivo o ingresa el código manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Visualización de Cámara */}
              <div className="relative aspect-video bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-800">
                {scannerActive ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto text-xl">
                      📷
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">
                      Cámara desactivada
                    </p>
                  </div>
                )}
                {scannerActive && (
                  <div className="absolute inset-0 border-2 border-brand-500/50 pointer-events-none animate-pulse" />
                )}
              </div>

              {/* Botón de Cámara y Selector de Dispositivo */}
              <div className="space-y-2">
                <Button
                  variant={scannerActive ? 'danger' : 'primary'}
                  className="w-full font-bold"
                  onClick={toggleCameraScanner}
                >
                  {scannerActive ? 'Detener Cámara' : 'Abrir Cámara para Escanear'}
                </Button>

                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (scannerActive) startWebcamWithId(e.target.value);
                    }}
                    className="w-full text-xs border border-neutral-300 rounded-md p-1.5"
                  >
                    {availableCameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Carga por Archivo */}
              <div className="text-center pt-2 border-t border-neutral-100">
                <label className="text-xs font-bold text-brand-600 hover:text-brand-800 cursor-pointer">
                  📁 Cargar imagen de QR desde archivo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleScanImageFile}
                  />
                </label>
              </div>

              {/* Ingreso Manual */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Ingreso Manual de Token / Código:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateTicket(qrInput)}
                    placeholder="ECU-BOL-... o firma HMAC"
                    className="flex-1 text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidateTicket(qrInput)}
                  >
                    Validar
                  </Button>
                </div>
              </div>

              {/* Feedback Visual del Escaneo */}
              {scanResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium space-y-1 ${
                    scanResult.tipo === 'exito'
                      ? 'bg-success-50 border-success-300 text-success-900'
                      : scanResult.tipo === 'advertencia'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {scanResult.tipo === 'exito' && '✅ ABORDAJE APROBADO'}
                      {scanResult.tipo === 'advertencia' && '⚠️ RECHAZADO (YA USADO / ADVERTENCIA)'}
                      {scanResult.tipo === 'error' && '❌ RECHAZADO'}
                    </span>
                    {scanResult.timestamp && (
                      <span className="font-mono text-[10px] opacity-75">{scanResult.timestamp}</span>
                    )}
                  </div>
                  <p>{scanResult.mensaje}</p>
                  {scanResult.boleto && (
                    <div className="mt-2 pt-2 border-t border-current/20 text-[11px] space-y-0.5">
                      <div>Pasajero: <strong>{scanResult.boleto.pasajeroNombre || 'N/A'}</strong></div>
                      <div>Cédula: <strong>{scanResult.boleto.pasajeroCedula || 'N/A'}</strong></div>
                      <div>Asiento: <strong>#{scanResult.boleto.asiento}</strong></div>
                      {scanResult.boleto.abordadoAt && (
                        <div>Hora abordaje: <strong>{new Date(scanResult.boleto.abordadoAt).toLocaleTimeString()}</strong></div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paradas Intermedias */}
          {rutaParadas.length > 0 && (
            <Card className="border border-neutral-200 shadow-sm">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100 py-3">
                <CardTitle className="text-sm font-black text-neutral-900">
                  Escalas Intermedias del Viaje
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {rutaParadas.map((p) => {
                    const horaRegistrada = paradasVisitadas[p.id];
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                      >
                        <div>
                          <div className="font-bold text-neutral-900">{p.ciudad}</div>
                          <div className="text-[10px] text-neutral-500">Orden de escala: #{p.orden}</div>
                        </div>
                        {horaRegistrada ? (
                          <Badge variant="success">Llegada: {horaRegistrada}</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegistrarParada(p.id)}
                            className="text-[10px] h-7 px-2"
                          >
                            Registrar Llegada
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Bitácora de Viaje y Lista de Pasajeros */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bitácora de Eventos del Viaje */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-neutral-900 text-base">Bitácora de Viaje en Vivo</h3>
                <p className="text-xs text-neutral-500">Eventos auditables registrados para este viaje (RFC-006).</p>
              </div>
              <Badge variant="neutral">{bitacora.length} eventos</Badge>
            </div>
            <div className="p-4 max-h-56 overflow-y-auto divide-y divide-neutral-100">
              {bitacora.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  No hay eventos registrados en la bitácora aún. Inicia el viaje o realiza una venta a bordo para generar registros.
                </p>
              ) : (
                bitacora.map((ev) => (
                  <div key={ev.id} className="py-2.5 flex items-start justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-brand-900">{ev.tipoEvento}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(ev.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-neutral-700">{ev.descripcion}</p>
                    </div>
                    <Badge variant={ev.tipoEvento === 'INICIO_VIAJE' ? 'success' : ev.tipoEvento === 'FIN_VIAJE' ? 'danger' : 'neutral'}>
                      {ev.tipoEvento}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tabla de Pasajeros Abordados */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-neutral-900 text-base">Pasajeros Abordados en Unidad</h3>
                <p className="text-xs text-neutral-500">Pasajeros con boleto confirmado o embarcado a bordo.</p>
              </div>
              <Badge variant="success">{pasajerosAbordados.length} en bus</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/70 text-neutral-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4 text-center">Asiento</th>
                    <th className="py-3 px-4">Pasajero</th>
                    <th className="py-3 px-4">Cédula</th>
                    <th className="py-3 px-4">Código / Origen</th>
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
                            Escanea el código QR del boleto o emite una venta a bordo para agregarlos automáticamente a la unidad.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pasajerosAbordados.map((bol) => {
                      const isVip = currentBus?.asientosVIPNumeros?.includes(bol.asiento);
                      const esVentaABordo = bol.vendidoPor === 'a_bordo';

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
                          <td className="py-3 px-4 font-bold text-neutral-900">
                            {bol.pasajeroNombre}
                            {esVentaABordo && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                                A BORDO
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-600">{bol.pasajeroCedula}</td>
                          <td className="py-3 px-4 font-mono text-[10px] text-brand-900 font-bold">
                            {bol.codigoQr || bol.id}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="success">ABORDADO</Badge>
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

      {/* MODAL: Venta a Bordo con Croquis de Asientos */}
      {modalVentaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-neutral-900">Venta de Boleto a Bordo</h3>
                <p className="text-xs text-neutral-500">
                  Selecciona un asiento libre en el croquis e ingresa los datos del pasajero.
                </p>
              </div>
              <button
                onClick={() => setModalVentaOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {ventaError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium">
                {ventaError}
              </div>
            )}

            <form onSubmit={handleEmitirVentaABordo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Nombre del Pasajero:
                  </label>
                  <input
                    type="text"
                    required
                    value={pasajeroNombreVenta}
                    onChange={(e) => setPasajeroNombreVenta(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Cédula / Identificación:
                  </label>
                  <input
                    type="text"
                    required
                    value={pasajeroCedulaVenta}
                    onChange={(e) => setPasajeroCedulaVenta(e.target.value)}
                    placeholder="Ej. 1712345678"
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Tarifa a Cobrar ($ USD):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Asiento Seleccionado:
                  </label>
                  <div className="p-2.5 bg-neutral-100 rounded-lg text-xs font-black text-brand-900">
                    {asientoVenta ? `Asiento #${asientoVenta}` : 'Ningún asiento seleccionado'}
                  </div>
                </div>
              </div>

              {/* Croquis de Asientos Reutilizable */}
              <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50">
                <div className="text-xs font-bold text-neutral-700 uppercase mb-2">
                  Croquis del Bus #{currentBus?.numero || '1'} (Elige asiento):
                </div>
                <SeatSelector
                  capacidad={currentBus?.capacidad || 40}
                  asientosVIP={currentBus?.asientosVIP || 0}
                  asientosVIPNumeros={currentBus?.asientosVIPNumeros || []}
                  asientosOcupados={asientosOcupados}
                  maxSeleccionables={1}
                  seleccionados={asientoVenta ? [asientoVenta] : []}
                  onChange={(sel) => setAsientoVenta(sel[0] || null)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalVentaOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={ventaLoading || !asientoVenta}
                  className="font-bold"
                >
                  {ventaLoading ? 'Emitiendo...' : 'Cobrar en Efectivo y Abordar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Finalizar Viaje con Observaciones */}
      {modalFinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-neutral-900">Confirmar Fin de Viaje</h3>
            <p className="text-xs text-neutral-600">
              ¿Estás seguro de finalizar el viaje para la ruta {currentFrec?.origen} ➔ {currentFrec?.destino}? Se registrará en la bitácora y la ruta quedará completada.
            </p>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Observaciones del Viaje (Opcional):
              </label>
              <textarea
                value={observacionFin}
                onChange={(e) => setObservacionFin(e.target.value)}
                placeholder="Novedades en ruta, retrasos o estado de la unidad..."
                rows={3}
                className="w-full text-xs border border-neutral-300 rounded-xl p-2.5"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setModalFinOpen(false)}
                disabled={viajeOperando}
              >
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={handleFinalizarViaje}
                disabled={viajeOperando}
                className="font-bold"
              >
                {viajeOperando ? 'Finalizando...' : 'Sí, Finalizar Viaje'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BLOQUE DE TRAZABILIDAD VISIBLE OBLIGATORIO (RFC-006 / ECU-8 / GDCS-2) */}
      <footer className="mt-12 pt-6 border-t border-neutral-200">
        <div className="bg-neutral-100 rounded-2xl p-4 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-neutral-900">Trazabilidad Técnica:</span>
            <Badge variant="neutral">{TRAZABILIDAD_RFC}</Badge>
            <Badge variant="info">{TRAZABILIDAD_TAG}</Badge>
            <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-neutral-300">
              Commit: <strong>59956fd</strong>
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Ticket: <span className="font-bold text-neutral-700">{TRAZABILIDAD_TICKET}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
