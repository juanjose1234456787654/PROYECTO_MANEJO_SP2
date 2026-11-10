'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { dataService } from '@/lib/services/dataService';
import type { FrecuenciaRow, CooperativaRow } from '@/lib/types';

const CIUDADES_ECUADOR = [
  'Ambato',
  'Baños de Agua Santa',
  'Quito',
  'Guayaquil',
  'Cuenca',
  'Riobamba',
  'Puyo',
  'Ibarra',
  'Latacunga',
  'Tena',
];

const HERO_SLIDES = [
  {
    id: 'banos-basilica',
    image: '/images/banos-basilica.jpg',
    badge: 'DESTINO ESTRELLA · TUNGURAHUA',
    title: 'VIAJA AL CORAZÓN DE BAÑOS DE AGUA SANTA',
    subtitle:
      'Santuario de Nuestra Señora del Rosario de Agua Santa, aguas termales volcánicas y salidas directas cada 30 minutos desde Ambato, Quito y Guayaquil.',
    ctaLabel: 'Ver Horarios a Baños',
    ctaHref: '/busqueda?origen=Ambato&destino=Baños',
  },
  {
    id: 'banos-cascada',
    image: '/images/banos-cascada.jpg',
    badge: 'RUTA DE LAS CASCADAS · NATURALEZA VIVA',
    title: 'DESCUBRE EL MANTO DE LA NOVIA Y EL PAILÓN DEL DIABLO',
    subtitle:
      'Unidades ejecutivas de dos pisos con asientos reclinables VIP, aire acondicionado, Wi-Fi a bordo y boleto electrónico con código QR firmado.',
    ctaLabel: 'Reservar Asiento VIP',
    ctaHref: '/busqueda',
  },
  {
    id: 'rutas-ecuador',
    image: '/images/banos-basilica.jpg',
    badge: 'COBERTURA NACIONAL · 56 AGENCIAS',
    title: 'CONECTAMOS LA SIERRA, COSTA Y AMAZONÍA ECUATORIANA',
    subtitle:
      'Más de 60 años brindando seguridad vial, tarifas preferenciales oficiales ANT (50% tercera edad y discapacidad) y atención 24/7.',
    ctaLabel: 'Explorar Todos los Destinos',
    ctaHref: '/busqueda',
  },
];

const POPULAR_ROUTES = [
  {
    origen: 'Ambato',
    destino: 'Baños de Agua Santa',
    precio: 2.5,
    duracion: '45 min',
    frecuencia: 'Cada 20 min',
    tipo: 'Ejecutivo / Directo',
    image: '/images/banos-cascada.jpg',
    tag: 'MÁS VENDIDA',
  },
  {
    origen: 'Quito (Quitumbe)',
    destino: 'Baños de Agua Santa',
    precio: 6.5,
    duracion: '3h 15m',
    frecuencia: 'Cada 45 min',
    tipo: 'Bus VIP 2 Pisos',
    image: '/images/banos-basilica.jpg',
    tag: 'TURISMO',
  },
  {
    origen: 'Guayaquil',
    destino: 'Ambato / Baños',
    precio: 12.0,
    duracion: '5h 30m',
    frecuencia: '8 salidas diarias',
    tipo: 'Bus Cama VIP',
    image: '/images/banos-cascada.jpg',
    tag: 'NOCTURNO VIP',
  },
  {
    origen: 'Baños de Agua Santa',
    destino: 'Puyo / Tena',
    precio: 3.5,
    duracion: '1h 30m',
    frecuencia: 'Cada hora',
    tipo: 'Ruta Amazónica',
    image: '/images/banos-basilica.jpg',
    tag: 'AMAZONÍA',
  },
  {
    origen: 'Ambato',
    destino: 'Cuenca',
    precio: 10.5,
    duracion: '5h 00m',
    frecuencia: '6 salidas diarias',
    tipo: 'Ejecutivo Climatizado',
    image: '/images/banos-cascada.jpg',
    tag: 'AUSTRO',
  },
  {
    origen: 'Riobamba',
    destino: 'Baños de Agua Santa',
    precio: 3.25,
    duracion: '1h 20m',
    frecuencia: 'Cada hora',
    tipo: 'Servicio Directo',
    image: '/images/banos-basilica.jpg',
    tag: 'SIERRA CENTRO',
  },
];

const ROAD_STATUS_LIST = [
  {
    via: 'Ambato – Pelileo – Baños – Puyo (E30)',
    estado: 'DESPEJADA' as const,
    detalle: 'Tránsito fluido en ambos sentidos. Túneles de Agoyán y Río Blanco 100% habilitados.',
    actualizado: 'Hace 10 min · ECU 911',
  },
  {
    via: 'Quito – Latacunga – Ambato (Panamericana E35)',
    estado: 'DESPEJADA' as const,
    detalle: 'Circulación normal en los 4 carriles. Peajes operativos sin congestión.',
    actualizado: 'Hace 15 min · ECU 911',
  },
  {
    via: 'Baños – Penipe – Riobamba – Cuenca',
    estado: 'PRECAUCION' as const,
    detalle: 'Conducir con precaución por neblina ligera en el sector de Cotaló. Paso habilitado.',
    actualizado: 'Hace 22 min · MTOP',
  },
  {
    via: 'Ambato – Guaranda – Babahoyo – Guayaquil',
    estado: 'DESPEJADA' as const,
    detalle: 'Vía habilitada para todas nuestras frecuencias diurnas y nocturnas.',
    actualizado: 'Hace 30 min · CTE',
  },
];

const TESTIMONIALS = [
  {
    nombre: 'María Fernanda Paredes',
    ciudad: 'Quito ➔ Baños de Agua Santa',
    comentario:
      'Excelente servicio. Compré mis pasajes en línea, elegí los asientos panorámicos del segundo piso y al subir solo mostré el código QR desde mi celular.',
    estrellas: 5,
  },
  {
    nombre: 'Carlos Andrés Villacreses',
    ciudad: 'Guayaquil ➔ Ambato',
    comentario:
      'El sistema aplica automáticamente el 50% de descuento para mis abuelitos según la normativa de la ANT. Unidades muy limpias y puntuales.',
    estrellas: 5,
  },
  {
    nombre: ' Gabriela Mantilla',
    ciudad: 'Ambato ➔ Baños de Agua Santa',
    comentario:
      'Viajar a Baños el fin de semana ahora es rapidísimo. Subí el comprobante de transferencia y en minutos la oficina validó mi boleto en PDF.',
    estrellas: 5,
  },
];

const FAQ_ITEMS = [
  {
    pregunta: '¿Cómo funciona el boleto electrónico con código QR?',
    respuesta:
      'Al confirmar tu compra o validarse tu transferencia bancaria, se genera un boleto en PDF con un código QR firmado criptográficamente (HMAC-SHA256). El chofer o ayudante lo escanea al abordar sin necesidad de imprimirlo.',
  },
  {
    pregunta: '¿Qué descuentos oficiales de la ANT se aplican?',
    respuesta:
      'Cumplimos estrictamente con la Ley Orgánica de Transporte Terrestre del Ecuador: 50% de descuento en tarifas para adultos mayores (tercera edad), personas con discapacidad con carnet CONADIS/MSP y menores de edad.',
  },
  {
    pregunta: '¿Con cuánto tiempo de anticipación debo estar en el terminal?',
    respuesta:
      'Te recomendamos presentarte en el andén de salida al menos 20 minutos antes de la hora programada llevando tu cédula de identidad y tu boleto digital QR.',
  },
  {
    pregunta: '¿Qué atractivos puedo visitar en Baños de Agua Santa?',
    respuesta:
      'Nuestras frecuencias te dejan a pocos minutos del Santuario de la Virgen de Agua Santa, las piscinas de aguas termales de la Virgen, la Cascada Cabellera de la Virgen, el Pailón del Diablo y la Casa del Árbol.',
  },
];

const AGENCIES_DIRECTORY = [
  {
    ciudad: 'Baños de Agua Santa (Matriz Turística)',
    direccion: 'Terminal Terrestre Thomas Halflants y Rocafuerte, Andén Principal',
    telefono: '(03) 274-0415 / 099-123-4501',
    horario: 'Atención y salidas: 04:00 a 22:30',
  },
  {
    ciudad: 'Ambato (Agencia Central Sur)',
    direccion: 'Terminal Terrestre Sur (Huachi Grande) y Agencia Ingahurco',
    telefono: '(03) 282-1234 / 099-123-4502',
    horario: 'Atención 24 horas',
  },
  {
    ciudad: 'Quito (Quitumbe & Carcelén)',
    direccion: 'Terminal Terrestre Quitumbe, Boletería Interprovincial N° 14',
    telefono: '(02) 398-8200 / 099-123-4503',
    horario: 'Atención: 04:30 a 23:00',
  },
  {
    ciudad: 'Guayaquil (Terminal Terrestre)',
    direccion: 'Terminal Jaime Roldós Aguilera, Nivel 1 Cooperativas Sierra',
    telefono: '(04) 213-0166 / 099-123-4504',
    horario: 'Atención: 05:00 a 23:30',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);

  // Estado del Carrusel Hero
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // Estado del Buscador Flotante de Viajes
  const [origen, setOrigen] = useState('Ambato');
  const [destino, setDestino] = useState('Baños de Agua Santa');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [pasajeros, setPasajeros] = useState(1);
  const [swapRotation, setSwapRotation] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Estado de Previsualización Interactiva de Asientos
  const [demoSelectedSeats, setDemoSelectedSeats] = useState<number[]>([7, 8]);

  // Estado del Formulario "Quejas o Sugerencias"
  const [quejaNombre, setQuejaNombre] = useState('');
  const [quejaAsunto, setQuejaAsunto] = useState('');
  const [quejaCiudad, setQuejaCiudad] = useState('');
  const [quejaEmail, setQuejaEmail] = useState('');
  const [quejaMensaje, setQuejaMensaje] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estado de FAQ y Testimonios
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Modal informativo de Baños de Agua Santa
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [frecList, coopList] = await Promise.all([
          dataService.getFrecuencias(),
          dataService.getCooperativas(),
        ]);
        setFrecuencias(frecList);
        setCooperativas(coopList);
      } catch {
        // Fallback silencioso
      }
    }
    loadStats();
  }, []);

  // Autoplay del Hero Carrusel
  useEffect(() => {
    if (isHeroPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHeroPaused]);

  const handleSwapCities = () => {
    setSwapRotation((prev) => prev + 180);
    const temp = origen;
    setOrigen(destino);
    setDestino(temp);
    setSearchError(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (origen.trim().toLowerCase() === destino.trim().toLowerCase()) {
      setSearchError('La ciudad de origen y destino no pueden ser iguales.');
      return;
    }
    setSearchError(null);
    const params = new URLSearchParams({
      origen: origen.includes('Baños') ? 'Baños' : origen,
      destino: destino.includes('Baños') ? 'Baños' : destino,
      fecha,
      pasajeros: String(pasajeros),
    });
    router.push(`/busqueda?${params.toString()}`);
  };

  const toggleDemoSeat = (seatNum: number, occupied: boolean) => {
    if (occupied) return;
    setDemoSelectedSeats((prev) =>
      prev.includes(seatNum) ? prev.filter((s) => s !== seatNum) : [...prev, seatNum]
    );
  };

  const handleQuejaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quejaNombre.trim() || !quejaAsunto.trim() || !quejaCiudad.trim() || !quejaMensaje.trim()) {
      setToastMsg('⚠️ Por favor completa los campos obligatorios marcados con (*).');
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }
    setToastMsg(
      `✅ ¡Gracias, ${quejaNombre}! Tu mensaje sobre "${quejaAsunto}" desde ${quejaCiudad} ha sido registrado en Atención al Pasajero.`
    );
    setQuejaNombre('');
    setQuejaAsunto('');
    setQuejaCiudad('');
    setQuejaEmail('');
    setQuejaMensaje('');
    setTimeout(() => setToastMsg(null), 5000);
  };

  const roles = [
    {
      rol: 'admin' as const,
      title: 'Administrador General',
      path: '/admin',
      desc: 'Gestión de cooperativas, creación exclusiva de empleados, parámetros del sistema y auditoría.',
      badge: 'ADMIN',
      icon: '🛡️',
      color: 'border-red-200 bg-red-50/30',
    },
    {
      rol: 'cooperativa' as const,
      title: 'Encargado de Cooperativa',
      path: '/cooperativa',
      desc: 'Administración de flota de buses, frecuencias ANT, paradas intermedias y hojas de ruta.',
      badge: 'COOPERATIVA',
      icon: '🏢',
      color: 'border-purple-200 bg-purple-50/30',
    },
    {
      rol: 'oficinista' as const,
      title: 'Personal de Ventanilla',
      path: '/oficina',
      desc: 'Venta presencial de boletos con descuentos de ley y validación de transferencias bancarias.',
      badge: 'OFICINA',
      icon: '🎟️',
      color: 'border-emerald-200 bg-emerald-50/30',
    },
    {
      rol: 'chofer' as const,
      title: 'Conductor / Ayudante',
      path: '/chofer',
      desc: 'Escáner QR con cámara en tiempo real, control de abordaje y registro de escalas.',
      badge: 'CHOFER',
      icon: '👨‍✈️',
      color: 'border-amber-200 bg-amber-50/30',
    },
    {
      rol: 'usuario' as const,
      title: 'Pasajero / Cliente',
      path: '/pasajero',
      desc: 'Búsqueda pública, mapa interactivo de asientos VIP/Normal y casillero digital con código QR.',
      badge: 'PASAJERO',
      icon: '🎫',
      color: 'border-blue-200 bg-blue-50/30',
    },
  ];

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <div className="space-y-16 pb-8">
      {/* Notificación Toast Flotante */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 right-5 z-50 max-w-md bg-zinc-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border-l-4 border-red-600 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2"
        >
          {toastMsg}
        </div>
      )}

      {/* =====================================================================
          1. CABECERA DE TÍTULO EN MAYÚSCULAS + HERO DINÁMICO CON CARRUSEL
         ===================================================================== */}
      <section className="space-y-6">
        {/* Bloque de título centrado inspirado en la estructura de referencia */}
        <div className="text-center space-y-2 pt-2">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 uppercase">
            COOPERATIVA DE TRANSPORTES Y TURISMO ECURUTAS
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-zinc-600 font-medium">
            <span>Consulta destinos y horarios para</span>
            <Link
              href="/busqueda"
              className="text-red-700 font-extrabold underline decoration-red-600/60 hover:text-red-800"
            >
              🚌 viajar
            </Link>
            <span>por Ecuador</span>
            <Link
              href="/busqueda"
              className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm transition-colors"
            >
              <span>🗺️ Planear viajes</span>
            </Link>
          </div>
        </div>

        {/* Hero Banner con Bordes Redondeados, Sombra, Flechas y Fotos de Baños */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 bg-zinc-900 min-h-[420px] sm:min-h-[470px] flex items-center"
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
        >
          {/* Imagen de fondo activa con zoom suave */}
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-55 transition-all duration-700 scale-105"
          />

          {/* Overlay degradado rojizo/oscuro para contraste AA */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-red-950/75 to-zinc-900/40" />

          {/* Contenido del Slide */}
          <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-12 pb-24 sm:pb-28 max-w-4xl space-y-4 text-white">
            <div className="inline-flex items-center gap-2 bg-red-700/90 border border-red-400/40 px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{currentSlide.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight uppercase drop-shadow">
              {currentSlide.title}
            </h2>

            <p className="text-zinc-100 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed font-medium">
              {currentSlide.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href={currentSlide.ctaHref}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-red-700 hover:bg-red-800 text-white font-extrabold shadow-lg border border-red-500/40"
                >
                  🎟️ {currentSlide.ctaLabel} ➔
                </Button>
              </Link>
              <a
                href="#turismo-banos"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white border border-white/40 hover:bg-white/15 transition-colors"
              >
                📸 Ver Encantos de Baños de Agua Santa
              </a>
            </div>
          </div>

          {/* Botones de Anterior y Siguiente en el Hero */}
          <button
            type="button"
            onClick={() =>
              setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
            }
            aria-label="Diapositiva anterior"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-red-700 text-white items-center justify-center border border-white/25 transition-all shadow-lg"
          >
            ❮
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            aria-label="Siguiente diapositiva"
            className="flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-red-700 text-white items-center justify-center border border-white/25 transition-all shadow-lg"
          >
            ❯
          </button>

          {/* Indicadores de diapositivas */}
          <div className="absolute bottom-20 sm:bottom-24 right-6 sm:right-12 z-20 flex items-center gap-2">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Ir a diapositiva ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  idx === activeSlide ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </div>

        {/* =====================================================================
            2. BUSCADOR DE VIAJES FLOTANTE (EL COMPONENTE ESTRELLA)
           ===================================================================== */}
        <div className="relative z-30 -mt-16 sm:-mt-20 mx-auto max-w-6xl px-2 sm:px-4">
          <div className="bg-white rounded-2xl shadow-2xl border-t-4 border-red-700 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-700 text-white text-sm font-bold">
                  🚌
                </span>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 uppercase tracking-wide">
                  Buscador de Pasajes e Itinerarios en Tiempo Real
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ✓ Descuento 50% ANT Tercera Edad / Discapacidad disponible
              </span>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end"
            >
              {/* Ciudad de Origen */}
              <div className="md:col-span-3">
                <label
                  htmlFor="buscador-origen"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 mb-1"
                >
                  📍 Origen
                </label>
                <select
                  id="buscador-origen"
                  value={origen}
                  onChange={(e) => {
                    setOrigen(e.target.value);
                    setSearchError(null);
                  }}
                  className="w-full h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-900 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                >
                  {CIUDADES_ECUADOR.map((ciudad) => (
                    <option key={`orig-${ciudad}`} value={ciudad}>
                      {ciudad}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón de Intercambio Animado */}
              <div className="md:col-span-1 flex justify-center pb-0.5">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  title="Intercambiar Origen y Destino"
                  aria-label="Intercambiar ciudad de origen y destino"
                  className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-700 text-red-700 hover:text-white border border-red-200 flex items-center justify-center font-extrabold shadow-sm transition-all duration-300 active:scale-90"
                  style={{ transform: `rotate(${swapRotation}deg)` }}
                >
                  ⇄
                </button>
              </div>

              {/* Ciudad de Destino */}
              <div className="md:col-span-3">
                <label
                  htmlFor="buscador-destino"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 mb-1"
                >
                  🏁 Destino
                </label>
                <select
                  id="buscador-destino"
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    setSearchError(null);
                  }}
                  className="w-full h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-900 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                >
                  {CIUDADES_ECUADOR.map((ciudad) => (
                    <option key={`dest-${ciudad}`} value={ciudad}>
                      {ciudad}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha de Salida */}
              <div className="md:col-span-2">
                <label
                  htmlFor="buscador-fecha"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 mb-1"
                >
                  📅 Fecha de Salida
                </label>
                <input
                  id="buscador-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-900 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  required
                />
              </div>

              {/* Número de Pasajeros */}
              <div className="md:col-span-1">
                <label
                  htmlFor="buscador-pasajeros"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 mb-1"
                >
                  👥 Pasaj.
                </label>
                <select
                  id="buscador-pasajeros"
                  value={pasajeros}
                  onChange={(e) => setPasajeros(Number(e.target.value))}
                  className="w-full h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-2.5 text-sm font-bold text-zinc-900 focus:bg-white focus:border-red-600 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Buscar Pasajes */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-700/25 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>🔍</span>
                  <span>Buscar Pasajes</span>
                </button>
              </div>
            </form>

            {searchError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                ⚠️ {searchError}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SECCIÓN INFORMATIVA Y TURÍSTICA DE BAÑOS DE AGUA SANTA
             (Implementando las fotos subidas y el diseño de referencia)
         ===================================================================== */}
      <section id="turismo-banos" className="scroll-mt-24">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200">
          {/* Imagen nocturna del Santuario de Baños de Agua Santa como fondo atmosférico */}
          <img
            src="/images/banos-basilica.jpg"
            alt="Santuario de Nuestra Señora del Rosario de Agua Santa en Baños"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/65 to-zinc-950/75" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-14">
            <div className="mb-8 text-white max-w-2xl">
              <span className="inline-block bg-red-700 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                Guía Turística y Destinos Destacados
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Baños de Agua Santa: Pedacito de Cielo y Aventura
              </h2>
              <p className="text-xs sm:text-sm text-zinc-200 mt-1">
                Viaja con nuestras frecuencias directas al principal destino turístico y ecológico del centro del Ecuador.
              </p>
            </div>

            {/* Grid de 3 Columnas inspirado en la captura de referencia */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Tarjeta 1: Cascada de la Virgen (Foto subida 1) */}
              <div className="bg-white rounded-xl overflow-hidden shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
                <div>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src="/images/banos-cascada.jpg"
                      alt="Cascada Cabellera de la Virgen en Baños de Agua Santa"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-red-700 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded shadow">
                      Cascada de la Virgen
                    </span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-zinc-800 uppercase leading-snug">
                      DESCUBRE LOS ENCANTOS DE BAÑOS DE AGUA SANTA
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold">
                      Por: Coop. Trans EcuRutas
                    </p>
                    <p className="text-xs text-zinc-600 leading-relaxed pt-1">
                      Ubicada en pleno corazón de la ciudad junto a las termas minerales, la Cascada Cabellera de la Virgen da la bienvenida a la famosa Ruta de las Cascadas hacia Puyo.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 pt-2">
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(true)}
                    className="text-xs font-extrabold text-red-700 hover:text-red-800 uppercase tracking-wide inline-flex items-center gap-1"
                  >
                    <span>Leer guía turística completa</span>
                    <span>▸</span>
                  </button>
                </div>
              </div>

              {/* Tarjeta 2: Santuario / Basílica de Baños (Foto subida 2) */}
              <div className="bg-white rounded-xl overflow-hidden shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
                <div>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src="/images/banos-basilica.jpg"
                      alt="Basílica y Santuario de Baños de Agua Santa de noche"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-amber-500 text-zinc-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded shadow">
                      Patrimonio Cultural
                    </span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-zinc-800 uppercase leading-snug">
                      SANTUARIO DE AGUA SANTA Y NUEVAS FRECUENCIAS DIRECTAS
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold">
                      Por: Coop. Trans EcuRutas
                    </p>
                    <p className="text-xs text-zinc-600 leading-relaxed pt-1">
                      Admira la arquitectura gótica en piedra volcánica del Santuario de Nuestra Señora del Rosario de Agua Santa y viaja con salidas continuas desde Quito, Ambato, Ibarra y Riobamba.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 pt-2">
                  <Link
                    href="/busqueda?origen=Quito&destino=Baños"
                    className="text-xs font-extrabold text-red-700 hover:text-red-800 uppercase tracking-wide inline-flex items-center gap-1"
                  >
                    <span>Consultar horarios hacia Baños</span>
                    <span>▸</span>
                  </Link>
                </div>
              </div>

              {/* Tarjeta 3: Panel Informativo Lateral Blanco (Fiel a la captura) */}
              <div className="bg-white rounded-xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-5">
                <div className="space-y-5 divide-y divide-zinc-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-zinc-800 uppercase leading-snug">
                      BAÑOS DE AGUA SANTA: A NATURAL PARADISE
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">By: Transportes EcuRutas</p>
                    <p className="text-xs text-zinc-600 mt-1.5">
                      Capital de los deportes de aventura: canopy, rafting, canyoning, mirador de la Casa del Árbol y aguas termales curativas.
                    </p>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm sm:text-base font-black text-zinc-800 uppercase leading-snug">
                      CONOCE NUEVOS LUGARES TURÍSTICOS DEL ECUADOR ESTE 2026
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Por: Transportes EcuRutas</p>
                    <p className="text-xs text-zinc-600 mt-1.5">
                      Rutas integradas entre la Avenida de los Volcanes y el Corredor Amazónico con reserva de asientos en línea.
                    </p>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm sm:text-base font-black text-zinc-800 uppercase leading-snug">
                      ATENCIÓN DIGITAL Y BOLETO QR
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Por: Transportes EcuRutas</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200">
                  <Link
                    href="/busqueda"
                    className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-red-700 hover:text-red-800 group"
                  >
                    <span>HORARIOS Y DESTINOS DESDE TODOS LOS TERMINALES</span>
                    <span className="text-base transform group-hover:translate-x-1 transition-transform">
                      ▸
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Informativo de Baños de Agua Santa */}
        {infoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 h-48">
                <img
                  src="/images/banos-cascada.jpg"
                  alt="Cascada de la Virgen"
                  className="w-full h-full object-cover"
                />
                <img
                  src="/images/banos-basilica.jpg"
                  alt="Basílica de Baños de Agua Santa"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="admin">DESTINO TURÍSTICO OFICIAL</Badge>
                    <h3 className="text-xl font-black text-zinc-900 mt-1">
                      Guía del Viajero: Baños de Agua Santa (Tungurahua)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Situada a 1.820 metros sobre el nivel del mar en las faldas del volcán Tungurahua, <strong>Baños de Agua Santa</strong> es conocida como la &ldquo;Puerta de El Dorado&rdquo;. Nuestras unidades te acercan directamente al Terminal Terrestre Thomas Halflants, a pocos pasos de:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700 font-medium">
                  <li className="bg-red-50/70 p-2.5 rounded-lg border border-red-100">
                    🌊 <strong>Cascada Cabellera de la Virgen:</strong> Caída de agua natural frente a las piscinas termales.
                  </li>
                  <li className="bg-red-50/70 p-2.5 rounded-lg border border-red-100">
                    ⛪ <strong>Basílica de Agua Santa:</strong> Santuario histórico construido en piedra volcánica con museos y murales.
                  </li>
                  <li className="bg-red-50/70 p-2.5 rounded-lg border border-red-100">
                    🚠 <strong>Ruta de las Cascadas:</strong> Agoyán, Manto de la Novia y Pailón del Diablo en Río Verde.
                  </li>
                  <li className="bg-red-50/70 p-2.5 rounded-lg border border-red-100">
                    🌋 <strong>Miradores y Termas:</strong> Casa del Árbol, Manos de Dios y Balneario de Santa Ana.
                  </li>
                </ul>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setInfoModalOpen(false)}>
                    Cerrar
                  </Button>
                  <Link href="/busqueda?origen=Ambato&destino=Baños">
                    <Button variant="primary" size="sm">
                      🚌 Comprar Pasaje a Baños
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          4. RUTAS POPULARES DEL ECUADOR (TARJETAS CON ZOOM Y PRECIO DESDE)
         ===================================================================== */}
      <section id="rutas-populares" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
              Frecuencias Diarias Autorizadas ANT
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Rutas Populares y Destinos Frecuentes
            </h2>
          </div>
          <Link href="/busqueda">
            <Button variant="outline" size="sm" className="border-red-700 text-red-700 hover:bg-red-50 font-bold">
              Ver Todas las Frecuencias ({frecuencias.length || 12}) ➔
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_ROUTES.map((ruta, i) => (
            <div
              key={`${ruta.origen}-${ruta.destino}-${i}`}
              className="group bg-white rounded-2xl overflow-hidden border border-zinc-200/80 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-zinc-900">
                  <img
                    src={ruta.image}
                    alt={`${ruta.origen} a ${ruta.destino}`}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-900/20 to-transparent" />
                  <span className="absolute top-3 left-3 bg-red-700 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                    {ruta.tag}
                  </span>
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[11px] text-zinc-300 font-semibold">Ruta Directa</p>
                      <h3 className="text-base font-black leading-tight">
                        {ruta.origen} ➔ {ruta.destino}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold">
                    <span>⏱️ Duración: {ruta.duracion}</span>
                    <span>🚌 {ruta.tipo}</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Salidas: <strong className="text-zinc-800">{ruta.frecuencia}</strong>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Tarifa Normal desde
                  </span>
                  <span className="text-xl font-black text-red-700">
                    ${ruta.precio.toFixed(2)}
                  </span>
                </div>
                <Link
                  href={`/busqueda?origen=${encodeURIComponent(
                    ruta.origen.split(' ')[0]
                  )}&destino=${encodeURIComponent(ruta.destino.split(' ')[0])}`}
                >
                  <Button variant="primary" size="sm" className="font-bold">
                    Reservar ➔
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          5. CONTADORES ANIMADOS DE LA COOPERATIVA
         ===================================================================== */}
      <section className="rounded-3xl bg-gradient-to-r from-red-800 via-red-700 to-zinc-900 text-white p-8 sm:p-10 shadow-xl border-b-4 border-amber-400">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/15">
          <div className="pt-2 sm:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-amber-300">+5.2M</div>
            <div className="text-xs sm:text-sm font-bold text-red-100 uppercase tracking-wide mt-1">
              Pasajeros Transportados / Año
            </div>
          </div>
          <div className="pt-4 sm:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-white">56</div>
            <div className="text-xs sm:text-sm font-bold text-red-100 uppercase tracking-wide mt-1">
              Agencias en Todo el Ecuador
            </div>
          </div>
          <div className="pt-4 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-amber-300">
              {cooperativas.length ? `${cooperativas.length * 25}+` : '120+'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-red-100 uppercase tracking-wide mt-1">
              Unidades Modernas y Homologadas
            </div>
          </div>
          <div className="pt-4 lg:pt-0">
            <div className="text-3xl sm:text-4xl font-black text-white">+60 Años</div>
            <div className="text-xs sm:text-sm font-bold text-red-100 uppercase tracking-wide mt-1">
              De Experiencia y Seguridad Vial
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. CÓMO COMPRAR TU PASAJE (4 PASOS) + DEMO INTERACTIVA DE ASIENTOS
         ===================================================================== */}
      <section id="como-comprar" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
            Compra Rápida y Sin Filas
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900">
            ¿Cómo Comprar tu Pasaje en Línea?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600">
            En solo 4 pasos obtienes tu boleto electrónico con código QR listo para abordar.
          </p>
        </div>

        {/* 4 Pasos con línea conectora */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              icon: '🔍',
              title: 'Elige tu Ruta y Fecha',
              desc: 'Selecciona tu ciudad de origen, destino (ej. Ambato a Baños) y el horario de tu preferencia.',
            },
            {
              step: '02',
              icon: '💺',
              title: 'Selecciona tu Asiento 2D',
              desc: 'Escoge en el mapa interactivo del bus tu asiento Normal o VIP Panorámico con descuento ANT.',
            },
            {
              step: '03',
              icon: '💳',
              title: 'Sube tu Comprobante',
              desc: 'Realiza tu pago por transferencia bancaria o en ventanilla y adjunta el comprobante en línea.',
            },
            {
              step: '04',
              icon: '📲',
              title: 'Viaja con tu Código QR',
              desc: 'Descarga tu boleto en PDF con firma criptográfica QR y preséntalo al abordar el bus.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl">
                  {item.icon}
                </span>
                <span className="text-2xl font-black text-red-700/25">{item.step}</span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 mb-1">{item.title}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Previsualizador Interactivo de Selección de Asientos en Tiempo Real */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  Mapa Visual del Bus (Prueba Interactiva)
                </h3>
                <p className="text-xs text-zinc-500">
                  Haz clic en los asientos libres para simular tu reserva en tiempo real:
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-500 inline-block" />
                  Libre
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-700 inline-block" />
                  Seleccionado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-zinc-200 border border-zinc-300 inline-block" />
                  Ocupado
                </span>
              </div>
            </div>

            {/* Esquema horizontal compacto de 16 asientos */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {Array.from({ length: 16 }, (_, idx) => {
                  const seatNum = idx + 1;
                  const occupied = [2, 3, 11, 14].includes(seatNum);
                  const selected = demoSelectedSeats.includes(seatNum);
                  const isVip = seatNum <= 4;

                  return (
                    <button
                      key={seatNum}
                      type="button"
                      disabled={occupied}
                      onClick={() => toggleDemoSeat(seatNum, occupied)}
                      className={`h-11 rounded-lg text-xs font-extrabold border transition-all flex flex-col items-center justify-center ${
                        occupied
                          ? 'bg-zinc-200 border-zinc-300 text-zinc-400 cursor-not-allowed'
                          : selected
                          ? 'bg-red-700 border-red-800 text-white shadow scale-105'
                          : 'bg-emerald-50 border-emerald-400 text-emerald-900 hover:bg-emerald-100'
                      }`}
                    >
                      <span>#{seatNum}</span>
                      {isVip && <span className="text-[9px] text-amber-500 font-black">VIP</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resumen de Compra en Tiempo Real */}
          <div className="lg:col-span-5 bg-zinc-900 text-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold">
                  Resumen en Tiempo Real
                </span>
                <h4 className="text-base font-black">Ambato ➔ Baños de Agua Santa</h4>
              </div>
              <span className="text-xs bg-red-700 px-2.5 py-1 rounded font-bold">
                $2.50 c/u
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Asientos seleccionados:</span>
                <span className="font-bold text-white">
                  {demoSelectedSeats.length > 0
                    ? demoSelectedSeats.map((s) => `#${s}`).join(', ')
                    : 'Ninguno'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Cantidad de pasajeros:</span>
                <span className="font-bold text-white">{demoSelectedSeats.length}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-zinc-800">
                <span>Total Estimado:</span>
                <span className="text-amber-400 text-lg">
                  ${(demoSelectedSeats.length * 2.5).toFixed(2)} USD
                </span>
              </div>
            </div>

            <Link href="/busqueda?origen=Ambato&destino=Baños" className="block pt-1">
              <Button variant="primary" size="md" className="w-full font-extrabold">
                Ir al Mapa Completo y Comprar ➔
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. ESTADO DE VÍAS Y AVISOS EN TIEMPO REAL (SEMÁFORO VIAL)
         ===================================================================== */}
      <section id="estado-vias" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
              Monitoreo Vial ECU 911 / ANT
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900">
              Estado de Vías y Avisos Operativos
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            🔄 Reporte actualizado hoy · Operación normal en terminales
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROAD_STATUS_LIST.map((item) => {
            const isGreen = item.estado === 'DESPEJADA';
            const isYellow = item.estado === 'PRECAUCION';
            return (
              <div
                key={item.via}
                className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex items-start gap-4"
              >
                {/* Semáforo */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                    isGreen
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : isYellow
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}
                >
                  {isGreen ? '🟢' : isYellow ? '🟡' : '🔴'}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-zinc-900">{item.via}</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        isGreen
                          ? 'bg-emerald-100 text-emerald-800'
                          : isYellow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.estado === 'PRECAUCION' ? 'PRECAUCIÓN' : item.estado}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{item.detalle}</p>
                  <p className="text-[11px] text-zinc-400 font-medium">{item.actualizado}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          8. SECCIÓN "NOSOTROS" + "QUEJAS O SUGERENCIAS"
             (Fiel a la segunda captura adjunta por el usuario)
         ===================================================================== */}
      <section id="nosotros-quejas" className="scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: NOSOTROS */}
          <div className="lg:col-span-6 space-y-5">
            <div className="border-b border-zinc-200 pb-3">
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight">
                NOSOTROS
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed text-justify">
              <strong className="text-zinc-800">
                Viaja por los mejores destinos turísticos del Ecuador: Quito, Baños de Agua Santa, El Coca, Lago Agrio, Montañita, Ambato, Cuenca y Puyo entre otros.
              </strong>{' '}
              La Cooperativa de Transportes y Turismo EcuRutas es una organización ecuatoriana de transporte terrestre interprovincial de pasajeros con más de 60 años de experiencia. Movilizamos a más de 5 millones de personas anualmente;{' '}
              <strong className="text-zinc-800">
                contamos con 56 agencias en todo el Ecuador
              </strong>
              , ofrecemos atención con altos estándares de calidad, servicio y tecnología QR, y un moderno parque automotor homologado por la ANT, lo que demuestra nuestra gran capacidad operativa además del compromiso que tenemos con el país y la colectividad; somos orgullo de{' '}
              <strong className="text-zinc-800">Baños y Tungurahua para el Ecuador.</strong>{' '}
              <Link
                href="/busqueda"
                className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full ml-1 transition-colors"
              >
                🚌 Pasajes de autobús
              </Link>
            </p>

            {/* Galería Informativa Inferior con las fotos reales de Baños de Agua Santa */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl overflow-hidden border border-zinc-200 h-28 relative group">
                <img
                  src="/images/banos-cascada.jpg"
                  alt="Cascada de la Virgen Baños"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <span className="absolute bottom-1 left-1.5 right-1.5 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded truncate">
                  Cascada de la Virgen
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-zinc-200 h-28 relative group">
                <img
                  src="/images/banos-basilica.jpg"
                  alt="Santuario de Baños de Agua Santa"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <span className="absolute bottom-1 left-1.5 right-1.5 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded truncate">
                  Basílica de Baños
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-red-200 bg-gradient-to-br from-red-700 to-zinc-900 h-28 p-3 text-white flex flex-col justify-between">
                <span className="text-lg">🛡️</span>
                <div>
                  <div className="text-xs font-black leading-tight">Calidad ISO &amp; ANT</div>
                  <div className="text-[10px] text-red-100">Flota Monitoreada GPS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: QUEJAS O SUGERENCIAS (Tarjeta blanca como en la referencia) */}
          <div className="lg:col-span-6 bg-white rounded-2xl shadow-xl border border-zinc-200/80 p-6 sm:p-8">
            <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight mb-2">
              QUEJAS O SUGERENCIAS
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              Queremos mejorar día a día para ofrecerte el mejor servicio de transporte del país. Si tienes algo que quieras decirnos, este es el lugar.
            </p>

            <form onSubmit={handleQuejaSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <input
                  type="text"
                  placeholder="Nombre y Apellido *"
                  value={quejaNombre}
                  onChange={(e) => setQuejaNombre(e.target.value)}
                  className="w-full h-11 rounded-lg bg-zinc-100 border border-zinc-200 px-3.5 text-xs sm:text-sm text-zinc-800 placeholder-zinc-500 focus:bg-white focus:border-red-600 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Asunto *"
                  value={quejaAsunto}
                  onChange={(e) => setQuejaAsunto(e.target.value)}
                  className="w-full h-11 rounded-lg bg-zinc-100 border border-zinc-200 px-3.5 text-xs sm:text-sm text-zinc-800 placeholder-zinc-500 focus:bg-white focus:border-red-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-3.5">
                  <input
                    type="text"
                    placeholder="Ciudad *"
                    value={quejaCiudad}
                    onChange={(e) => setQuejaCiudad(e.target.value)}
                    className="w-full h-11 rounded-lg bg-zinc-100 border border-zinc-200 px-3.5 text-xs sm:text-sm text-zinc-800 placeholder-zinc-500 focus:bg-white focus:border-red-600 focus:outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Su e-mail"
                    value={quejaEmail}
                    onChange={(e) => setQuejaEmail(e.target.value)}
                    className="w-full h-11 rounded-lg bg-zinc-100 border border-zinc-200 px-3.5 text-xs sm:text-sm text-zinc-800 placeholder-zinc-500 focus:bg-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Mensaje *"
                    rows={4}
                    value={quejaMensaje}
                    onChange={(e) => setQuejaMensaje(e.target.value)}
                    className="w-full h-full min-h-[102px] rounded-lg bg-zinc-100 border border-zinc-200 p-3.5 text-xs sm:text-sm text-zinc-800 placeholder-zinc-500 focus:bg-white focus:border-red-600 focus:outline-none resize-y"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow transition-colors"
                >
                  ENVIAR
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. TESTIMONIOS DE PASAJEROS + PREGUNTAS FRECUENTES (FAQ ACORDEÓN)
         ===================================================================== */}
      <section id="preguntas-frecuentes" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24">
        {/* Columna Testimonios en Carrusel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
              Experiencias Reales
            </span>
            <h2 className="text-2xl font-black text-zinc-900">
              Lo que Dicen Nuestros Pasajeros
            </h2>
          </div>

          <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 space-y-3">
            <div className="text-amber-500 text-sm">
              {'★'.repeat(TESTIMONIALS[activeTestimonial].estrellas)}
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 italic leading-relaxed">
              &ldquo;{TESTIMONIALS[activeTestimonial].comentario}&rdquo;
            </p>
            <div className="pt-2">
              <div className="text-xs font-black text-zinc-900">
                {TESTIMONIALS[activeTestimonial].nombre}
              </div>
              <div className="text-[11px] text-red-700 font-semibold">
                Ruta: {TESTIMONIALS[activeTestimonial].ciudad}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {TESTIMONIALS.map((t, idx) => (
                <button
                  key={t.nombre}
                  type="button"
                  onClick={() => setActiveTestimonial(idx)}
                  aria-label={`Ver testimonio ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeTestimonial ? 'w-6 bg-red-700' : 'w-2 bg-zinc-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveTestimonial(
                    (prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
                  )
                }
                className="w-8 h-8 rounded-lg border border-zinc-200 hover:bg-red-50 text-xs font-bold"
              >
                ❮
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
                }
                className="w-8 h-8 rounded-lg border border-zinc-200 hover:bg-red-50 text-xs font-bold"
              >
                ❯
              </button>
            </div>
          </div>
        </div>

        {/* Columna FAQ Acordeón */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
              Centro de Ayuda
            </span>
            <h2 className="text-2xl font-black text-zinc-900">
              Preguntas Frecuentes (FAQ)
            </h2>
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.pregunta}
                  className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900">
                      {faq.pregunta}
                    </span>
                    <span className="text-red-700 font-black text-base">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                      {faq.respuesta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          10. DIRECTORIO DE AGENCIAS Y TELÉFONOS DE CONTACTO
         ===================================================================== */}
      <section id="contacto-agencias" className="space-y-6 scroll-mt-24">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
            Atención en Terminales Terrestres
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900">
            Directorio de Agencias y Teléfonos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AGENCIES_DIRECTORY.map((ag) => (
            <div
              key={ag.ciudad}
              className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm hover:border-red-300 transition-all space-y-2.5"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center text-lg">
                📍
              </div>
              <h3 className="text-sm font-black text-zinc-900">{ag.ciudad}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{ag.direccion}</p>
              <p className="text-xs font-extrabold text-red-700">📞 {ag.telefono}</p>
              <p className="text-[11px] text-zinc-400 font-medium">🕒 {ag.horario}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          11. PORTALES INTERNOS DEL SISTEMA POR ROL (MÓDULOS OPERATIVOS)
         ===================================================================== */}
      <section className="space-y-5 pt-4 border-t border-zinc-200">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-red-700">
            Arquitectura de Roles del Proyecto
          </span>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
            Portales Operativos del Sistema por Rol
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Acceso directo a los paneles internos de gestión (Administrador, Cooperativa, Oficinista, Personal del Bus y Pasajero):
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((item) => (
            <Card
              key={item.rol}
              className={`hover:shadow-xl transition-all border ${item.color} flex flex-col justify-between`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{item.icon}</div>
                  <Badge variant={item.rol}>{item.badge}</Badge>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">{item.title}</CardTitle>
                <CardDescription className="text-xs text-gray-600 leading-relaxed">
                  {item.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Link href={item.path} className="w-full block">
                  <Button variant="outline" size="sm" className="w-full font-bold">
                    Entrar al Portal ➔
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* Tarjeta Extra: Reportes e ITIL */}
          <Card className="hover:shadow-xl transition-all border border-indigo-200 bg-indigo-50/30 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl">📊</div>
                <Badge variant="admin">AUDITORÍA</Badge>
              </div>
              <CardTitle className="text-lg font-bold text-gray-900">Reportes e ITIL</CardTitle>
              <CardDescription className="text-xs text-gray-600 leading-relaxed">
                Métricas financieras, tasa de ocupación de buses y trazabilidad de cambios en producción.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/reportes" className="w-full block">
                <Button variant="outline" size="sm" className="w-full font-bold">
                  Ver Métricas Ejecutivas ➔
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
