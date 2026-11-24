'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconBus,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconSearch,
  IconArrowLeftRight,
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconTicket,
  IconClock,
  IconCreditCard,
  IconQrCode,
  IconCheckCircle,
  IconAlertTriangle,
  IconShieldCheck,
  IconBuilding,
  IconUser,
  IconBarChart,
  IconPhone,
} from '@/components/ui/Icons';
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
    badge: 'FRECUENCIA DIRECTA · TUNGURAHUA',
    title: 'CONEXIÓN DIARIA A BAÑOS DE AGUA SANTA',
    subtitle:
      'Salidas cada 30 minutos desde el Terminal Sur de Ambato, Quitumbe en Quito y Terminal Terrestre de Guayaquil hacia el Santuario de Agua Santa y el corredor amazónico.',
    ctaLabel: 'Consultar horarios a Baños',
    ctaHref: '/busqueda?origen=Ambato&destino=Baños',
    secondaryLabel: 'Destino Baños de Agua Santa',
    secondaryHref: '#turismo-banos',
  },
  {
    id: 'cuenca-calderon',
    image: '/images/cuenca-parque-calderon.jpg',
    badge: 'FRECUENCIA DIRECTA · AZUAY',
    title: 'CONEXIÓN DIARIA A CUENCA SANTA ANA',
    subtitle:
      'Salidas diarias y turnos nocturnos desde el Terminal Sur de Ambato y Quitumbe hacia el Parque Calderón, el Centro Histórico y las cúpulas de la Catedral.',
    ctaLabel: 'Consultar horarios a Cuenca',
    ctaHref: '/busqueda?origen=Ambato&destino=Cuenca',
    secondaryLabel: 'Destino Cuenca Patrimonial',
    secondaryHref: '#turismo-cuenca',
  },
  {
    id: 'cuenca-catedral',
    image: '/images/cuenca-catedral-calle.jpg',
    badge: 'CATEDRAL DE LA INMACULADA · CENTRO HISTÓRICO',
    title: 'ARQUITECTURA COLONIAL Y RUTAS AL AUSTRO',
    subtitle:
      'Descubre la majestuosa Catedral de la Inmaculada Concepción y las calles de adoquines de la Atenas del Ecuador con unidades ejecutivas climatizadas.',
    ctaLabel: 'Ver frecuencias a Cuenca',
    ctaHref: '/busqueda?destino=Cuenca',
    secondaryLabel: 'Guía Turística de Cuenca',
    secondaryHref: '#turismo-cuenca',
  },
  {
    id: 'cuenca-panoramica',
    image: '/images/cuenca-panoramica.jpg',
    badge: 'ATARDECERES DEL AUSTRO · PANORÁMICA',
    title: 'PANORÁMICA DE CUENCA Y SUS CUATRO RÍOS',
    subtitle:
      'Admira los atardeceres dorados sobre las cúpulas del Centro Histórico y planifica tu viaje interprovincial con reserva de asientos 2D y boleto QR.',
    ctaLabel: 'Seleccionar asiento a Cuenca',
    ctaHref: '/busqueda?destino=Cuenca',
    secondaryLabel: 'Explorar Atractivos',
    secondaryHref: '#turismo-cuenca',
  },
  {
    id: 'banos-cascada',
    image: '/images/banos-cascada.jpg',
    badge: 'CORREDOR TURÍSTICO · E30',
    title: 'RUTA DE LAS CASCADAS Y CORREDOR ORIENTAL',
    subtitle:
      'Unidades homologadas de uno y dos pisos con selección de asiento en plano 2D, climatización y emisión inmediata de boleto electrónico con firma QR.',
    ctaLabel: 'Seleccionar asiento en línea',
    ctaHref: '/busqueda',
    secondaryLabel: 'Destino Baños de Agua Santa',
    secondaryHref: '#turismo-banos',
  },
  {
    id: 'rutas-ecuador',
    image: '/images/cuenca-panoramica.jpg',
    badge: 'RED INTERPROVINCIAL · 56 BOLETERÍAS',
    title: 'TRANSPORTE INTERPROVINCIAL CON TARIFA OFICIAL ANT',
    subtitle:
      'Aplicación directa del 50% de descuento legal para tercera edad, personas con discapacidad y menores de edad en todas nuestras rutas nacionales.',
    ctaLabel: 'Ver todas las frecuencias',
    ctaHref: '/busqueda',
    secondaryLabel: 'Boletería Nacional',
    secondaryHref: '/busqueda',
  },
];

const POPULAR_ROUTES = [
  {
    origen: 'Ambato',
    destino: 'Baños de Agua Santa',
    precio: 2.5,
    duracion: '45 min',
    frecuencia: 'Cada 20 min · Andén 4',
    tipo: 'Servicio Directo',
    image: '/images/banos-cascada.jpg',
    tag: 'ALTA DEMANDA',
  },
  {
    origen: 'Quito (Quitumbe)',
    destino: 'Baños de Agua Santa',
    precio: 6.5,
    duracion: '3h 15m',
    frecuencia: 'Cada 45 min · Andén 14',
    tipo: 'Ejecutivo 2 Pisos',
    image: '/images/banos-basilica.jpg',
    tag: 'DIRECTO',
  },
  {
    origen: 'Ambato',
    destino: 'Cuenca',
    precio: 10.5,
    duracion: '5h 00m',
    frecuencia: '6 salidas diarias',
    tipo: 'Ejecutivo Climatizado',
    image: '/images/cuenca-parque-calderon.jpg',
    tag: 'AUSTRO',
  },
  {
    origen: 'Quito (Quitumbe)',
    destino: 'Cuenca',
    precio: 15.0,
    duracion: '8h 30m',
    frecuencia: 'Turno Diurno y Nocturno',
    tipo: 'Bus Cama VIP',
    image: '/images/cuenca-panoramica.jpg',
    tag: 'DIRECTO',
  },
  {
    origen: 'Guayaquil',
    destino: 'Ambato / Baños',
    precio: 12.0,
    duracion: '5h 30m',
    frecuencia: '8 salidas diarias',
    tipo: 'Bus Cama VIP',
    image: '/images/banos-cascada.jpg',
    tag: 'NOCTURNO',
  },
  {
    origen: 'Baños de Agua Santa',
    destino: 'Puyo / Tena',
    precio: 3.5,
    duracion: '1h 30m',
    frecuencia: 'Salidas cada hora',
    tipo: 'Vía Amazónica E30',
    image: '/images/banos-basilica.jpg',
    tag: 'ORIENTE',
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
    frecuencia: 'Salidas cada hora',
    tipo: 'Interprovincial',
    image: '/images/banos-basilica.jpg',
    tag: 'SIERRA CENTRO',
  },
];

const ROAD_STATUS_LIST = [
  {
    via: 'Ambato – Pelileo – Baños – Puyo (Eje Vial E30)',
    estado: 'DESPEJADA' as const,
    detalle: 'Paso vehicular habilitado en ambos sentidos. Túneles de Agoyán y Río Blanco operativos.',
    actualizado: 'Reporte ECU 911 · Hace 10 min',
  },
  {
    via: 'Quito – Latacunga – Ambato (Panamericana E35)',
    estado: 'DESPEJADA' as const,
    detalle: 'Circulación fluida en los cuatro carriles. Peajes de Panzaleo y Machachi sin novedad.',
    actualizado: 'Reporte ECU 911 · Hace 15 min',
  },
  {
    via: 'Baños – Penipe – Riobamba – Cuenca',
    estado: 'PRECAUCION' as const,
    detalle: 'Presencia de neblina moderada en el sector de Cotaló. Unidades circulando con velocidad controlada.',
    actualizado: 'Reporte MTOP · Hace 22 min',
  },
  {
    via: 'Ambato – Guaranda – Babahoyo – Guayaquil',
    estado: 'DESPEJADA' as const,
    detalle: 'Ruta habilitada para todas las frecuencias diurnas y nocturnas hacia la Costa.',
    actualizado: 'Reporte CTE · Hace 30 min',
  },
];

const TESTIMONIALS = [
  {
    nombre: 'María Fernanda Paredes',
    ciudad: 'Ruta Quito — Baños de Agua Santa',
    comentario:
      'Compré dos boletos para el segundo piso desde mi teléfono. Al llegar al andén en Quitumbe el controlador escaneó el código QR del PDF y abordamos sin pasar por ventanilla.',
    fecha: 'Viaje verificado',
  },
  {
    nombre: 'Carlos Andrés Villacreses',
    ciudad: 'Ruta Guayaquil — Ambato',
    comentario:
      'Al ingresar el número de cédula de mi padre el sistema calculó automáticamente la tarifa de tercera edad al 50%. Muy claro el desglose antes de pagar.',
    fecha: 'Viaje verificado',
  },
  {
    nombre: 'Gabriela Mantilla',
    ciudad: 'Ruta Ambato — Baños de Agua Santa',
    comentario:
      'Subí el comprobante de transferencia bancaria y recibí la notificación de aprobación en pocos minutos junto con mi boleto electrónico.',
    fecha: 'Viaje verificado',
  },
];

const FAQ_ITEMS = [
  {
    pregunta: '¿Cómo se valida el boleto electrónico con código QR al abordar?',
    respuesta:
      'Cada boleto confirmado incluye un código QR único asociado a tu cédula y asiento. El conductor o ayudante lo escanea con la cámara en el andén de salida, registrando la hora exacta de embarque.',
  },
  {
    pregunta: '¿Cómo se aplica el 50% de descuento de la ANT?',
    respuesta:
      'De acuerdo con la LOTTTSV, los adultos mayores (65 años o más), personas con discapacidad acreditada y menores de edad acceden al 50% de descuento sobre la tarifa oficial seleccionando la categoría en el paso de datos del pasajero.',
  },
  {
    pregunta: '¿Con cuánta anticipación debo presentarme en el andén de salida?',
    respuesta:
      'Se recomienda acudir al terminal terrestre 20 minutos antes de la hora fijada en el boleto, portando la cédula de ciudadanía original y el boleto digital o impreso.',
  },
  {
    pregunta: '¿Dónde llegan las unidades en Baños de Agua Santa?',
    respuesta:
      'Todas las frecuencias arriban al Terminal Terrestre Thomas Halflants de Baños de Agua Santa, ubicado a cuatro cuadras de la Basílica de la Virgen de Agua Santa y del balneario termal.',
  },
];

const AGENCIES_DIRECTORY = [
  {
    ciudad: 'Baños de Agua Santa · Boletería Matriz',
    direccion: 'Terminal Terrestre Thomas Halflants y Rocafuerte, Andén Principal',
    telefono: '(03) 274-0415 / 099-123-4501',
    horario: 'Despachos de 04:00 a 22:30',
  },
  {
    ciudad: 'Ambato · Terminal Terrestre Sur',
    direccion: 'Av. Bolivariana, Terminal Sur Huachi Grande y Agencia Ingahurco',
    telefono: '(03) 282-1234 / 099-123-4502',
    horario: 'Operación continua 24 horas',
  },
  {
    ciudad: 'Quito · Terminal Quitumbe',
    direccion: 'Av. Mariscal Sucre y Cóndor Ñan, Boletería Interprovincial N° 14',
    telefono: '(02) 398-8200 / 099-123-4503',
    horario: 'Atención de 04:30 a 23:00',
  },
  {
    ciudad: 'Guayaquil · Terminal Terrestre',
    direccion: 'Terminal Jaime Roldós Aguilera, Nivel 1 Cooperativas Sierra',
    telefono: '(04) 213-0166 / 099-123-4504',
    horario: 'Atención de 05:00 a 23:30',
  },
  {
    ciudad: 'Cuenca · Terminal Terrestre',
    direccion: 'Av. España y Sebastián de Benalcázar, Boletería 8 Andén Interprovincial',
    telefono: '(07) 286-4100 / 099-123-4505',
    horario: 'Atención de 05:00 a 23:00',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const [origen, setOrigen] = useState('Ambato');
  const [destino, setDestino] = useState('Baños de Agua Santa');
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    return hoy.toISOString().split('T')[0];
  });
  const [pasajeros, setPasajeros] = useState(1);
  const [swapRotation, setSwapRotation] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [quejaNombre, setQuejaNombre] = useState('');
  const [quejaAsunto, setQuejaAsunto] = useState('');
  const [quejaCiudad, setQuejaCiudad] = useState('');
  const [quejaEmail, setQuejaEmail] = useState('');
  const [quejaMensaje, setQuejaMensaje] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [cuencaModalOpen, setCuencaModalOpen] = useState(false);

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

  useEffect(() => {
    if (isHeroPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
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
      setSearchError('Selecciona una ciudad de destino distinta a la ciudad de origen.');
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

  const handleQuejaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quejaNombre.trim() || !quejaAsunto.trim() || !quejaCiudad.trim() || !quejaMensaje.trim()) {
      setToastMsg('Completa todos los campos obligatorios marcados con asterisco (*).');
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }
    setToastMsg(
      `Comunicación registrada. Gracias, ${quejaNombre}; tu requerimiento sobre "${quejaAsunto}" fue enviado a Atención al Pasajero.`
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
      title: 'Administración General',
      path: '/admin',
      desc: 'Control de cooperativas, alta exclusiva de personal operativo, parámetros y auditoría.',
      badge: 'ADMIN',
      Icon: IconShieldCheck,
      accentBorder: 'border-t-4 border-t-brand-700',
      iconStyle: 'bg-brand-50 border-brand-200 text-brand-700',
    },
    {
      rol: 'cooperativa' as const,
      title: 'Gestión de Cooperativa',
      path: '/cooperativa',
      desc: 'Registro de unidades, asignación de frecuencias ANT, paradas en ruta y hojas de despacho.',
      badge: 'COOPERATIVA',
      Icon: IconBuilding,
      accentBorder: 'border-t-4 border-t-brand-600',
      iconStyle: 'bg-brand-50 border-brand-200 text-brand-700',
    },
    {
      rol: 'oficinista' as const,
      title: 'Ventanilla y Boletería',
      path: '/oficina',
      desc: 'Emisión presencial con tarifas preferenciales y revisión de comprobantes bancarios.',
      badge: 'OFICINA',
      Icon: IconTicket,
      accentBorder: 'border-t-4 border-t-accent-500',
      iconStyle: 'bg-accent-50 border-accent-200 text-accent-700',
    },
    {
      rol: 'chofer' as const,
      title: 'Control de Abordaje QR',
      path: '/chofer',
      desc: 'Lectura de códigos QR con cámara en andén, lista de pasajeros y control de escalas.',
      badge: 'CHOFER',
      Icon: IconQrCode,
      accentBorder: 'border-t-4 border-t-neutral-900',
      iconStyle: 'bg-neutral-900 border-neutral-800 text-accent-400',
    },
    {
      rol: 'usuario' as const,
      title: 'Portal del Pasajero',
      path: '/pasajero',
      desc: 'Historial de boletos emitidos, visualización de código QR y descarga de comprobantes PDF.',
      badge: 'PASAJERO',
      Icon: IconUser,
      accentBorder: 'border-t-4 border-t-success-600',
      iconStyle: 'bg-success-50 border-success-200 text-success-700',
    },
  ];

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <div className="space-y-16 pb-8">
      {/* Toast sobrio de confirmación */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 right-5 z-50 max-w-md bg-neutral-900 text-white px-5 py-3.5 rounded-xl shadow-float border-l-4 border-brand-600 text-xs sm:text-sm font-medium flex items-center gap-3"
        >
          <IconCheckCircle size={18} className="text-success-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pt-1 border-b border-neutral-200 pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
              Sistema Oficial de Boletería Interprovincial
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-neutral-900 uppercase mt-0.5">
              Cooperativa de Transportes y Turismo EcuRutas
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 font-medium">
            <span>Consulta destinos y horarios para</span>
            <Link
              href="/busqueda"
              className="text-brand-700 font-bold underline decoration-brand-600/50 hover:text-brand-800"
            >
              viajar por Ecuador
            </Link>
            <Link
              href="/busqueda"
              className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ml-1"
            >
              <IconMapPin size={13} />
              <span>Planear viaje</span>
            </Link>
          </div>
        </div>
        <div
          className="relative rounded-2xl overflow-hidden shadow-float border border-neutral-200 bg-neutral-950 min-h-[410px] sm:min-h-[450px] flex items-center"
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
        >
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-50 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/75 to-neutral-950/30" />

          <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-12 pb-24 sm:pb-28 max-w-3xl space-y-4 text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase text-accent-300">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
              <span>{currentSlide.badge}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-display font-extrabold tracking-tight leading-[1.12] uppercase">
              {currentSlide.title}
            </h2>

            <p className="text-neutral-200 text-sm sm:text-base leading-relaxed">
              {currentSlide.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href={currentSlide.ctaHref}>
                <Button variant="primary" size="lg">
                  <span>{currentSlide.ctaLabel}</span>
                  <IconArrowRight size={16} />
                </Button>
              </Link>
              {currentSlide.secondaryHref?.startsWith('#') ? (
                <a
                  href={currentSlide.secondaryHref}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
                >
                  {currentSlide.secondaryLabel || 'Destino Turístico'}
                </a>
              ) : (
                <Link
                  href={currentSlide.secondaryHref || '#turismo-banos'}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
                >
                  {currentSlide.secondaryLabel || 'Destino Turístico'}
                </Link>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
            }
            aria-label="Diapositiva anterior"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-lg bg-neutral-900/70 hover:bg-brand-700 text-white items-center justify-center border border-white/20 transition-colors"
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            aria-label="Siguiente diapositiva"
            className="flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-lg bg-neutral-900/70 hover:bg-brand-700 text-white items-center justify-center border border-white/20 transition-colors"
          >
            <IconChevronRight size={18} />
          </button>

          <div className="absolute bottom-20 sm:bottom-24 right-6 sm:right-12 z-20 flex items-center gap-1.5">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Mostrar diapositiva ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeSlide ? 'w-7 bg-accent-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="relative z-30 -mt-20 sm:-mt-24 mx-auto max-w-7xl px-2 sm:px-4">
          <div className="rounded-3xl border border-neutral-200 border-t-4 border-t-brand-700 bg-white p-5 shadow-float sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <IconBus size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-700">Boletería interprovincial</p>
                  <h3 className="text-lg font-extrabold tracking-tight text-neutral-950 sm:text-xl">¿A dónde viajamos?</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-success-50 px-3.5 py-2 text-xs font-bold text-success-800 ring-1 ring-success-100">
                <IconCheckCircle size={15} />
                <span>Tarifa preferencial ANT disponible</span>
              </div>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-12 xl:gap-3.5"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-end gap-2 md:col-span-2 xl:col-span-6 xl:gap-3">
              <div>
                <label
                  htmlFor="buscador-origen"
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-neutral-600"
                >
                  <IconMapPin size={13} className="text-brand-700" />
                  <span>Ciudad de origen</span>
                </label>
                <select
                  id="buscador-origen"
                  value={origen}
                  onChange={(e) => {
                    setOrigen(e.target.value);
                    setSearchError(null);
                  }}
                  className="h-[58px] w-full truncate rounded-2xl border border-neutral-300 bg-neutral-50 px-3 text-sm font-bold text-neutral-900 transition focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 sm:px-4 sm:text-base"
                >
                  {CIUDADES_ECUADOR.map((ciudad) => (
                    <option key={`orig-${ciudad}`} value={ciudad}>
                      {ciudad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center pb-0.5">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  title="Intercambiar origen y destino"
                  aria-label="Intercambiar ciudad de origen y destino"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all duration-200 hover:border-brand-600 hover:bg-brand-700 hover:text-white"
                  style={{ transform: `rotate(${swapRotation}deg)` }}
                >
                  <IconArrowLeftRight size={16} />
                </button>
              </div>

              <div>
                <label
                  htmlFor="buscador-destino"
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-neutral-600"
                >
                  <IconMapPin size={13} className="text-neutral-500" />
                  <span>Ciudad de destino</span>
                </label>
                <select
                  id="buscador-destino"
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    setSearchError(null);
                  }}
                  className="h-[58px] w-full truncate rounded-2xl border border-neutral-300 bg-neutral-50 px-3 text-sm font-bold text-neutral-900 transition focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 sm:px-4 sm:text-base"
                >
                  {CIUDADES_ECUADOR.map((ciudad) => (
                    <option key={`dest-${ciudad}`} value={ciudad}>
                      {ciudad}
                    </option>
                  ))}
                </select>
              </div>
              </div>

              <div className="xl:col-span-2">
                <label
                  htmlFor="buscador-fecha"
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-neutral-600"
                >
                  <IconCalendar size={13} className="text-neutral-500" />
                  <span>Fecha de viaje</span>
                </label>
                <input
                  id="buscador-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-[58px] w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 text-sm font-bold text-neutral-900 transition focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 sm:px-4"
                  required
                />
              </div>

              <div className="xl:col-span-1">
                <label
                  htmlFor="buscador-pasajeros"
                  className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-neutral-600"
                >
                  <IconUsers size={13} className="text-neutral-500" />
                  <span>Pasajeros</span>
                </label>
                <select
                  id="buscador-pasajeros"
                  value={pasajeros}
                  onChange={(e) => setPasajeros(Number(e.target.value))}
                  className="h-[58px] w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-3 text-sm font-bold text-neutral-900 transition focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <Button type="submit" variant="primary" size="lg" className="h-[58px] w-full rounded-2xl text-base font-extrabold shadow-lg shadow-brand-700/20">
                  <IconSearch size={16} />
                  <span>Buscar viajes</span>
                </Button>
              </div>
            </form>

            {searchError && (
              <div className="mt-3 p-2.5 rounded-lg bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-800 flex items-center gap-2">
                <IconAlertTriangle size={15} />
                <span>{searchError}</span>
              </div>
            )}
          </div>
        </div>
      </section>
      <section id="turismo-banos" className="scroll-mt-24">
        <div className="relative rounded-2xl overflow-hidden shadow-float border border-neutral-200">
          <img
            src="/images/banos-basilica.jpg"
            alt="Santuario de Nuestra Señora del Rosario de Agua Santa en Baños"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/75 to-neutral-950/80" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <div className="mb-8 text-white max-w-2xl">
              <span className="inline-block bg-brand-700 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md mb-2">
                Destino Principal · Provincia de Tungurahua
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase tracking-tight">
                Baños de Agua Santa: Patrimonio Natural y Termal
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                Frecuencias directas con arribo al Terminal Terrestre Thomas Halflants, en el centro turístico de la ciudad.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="bg-white rounded-xl overflow-hidden shadow-card flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                    <img
                      src="/images/banos-cascada.jpg"
                      alt="Cascada Cabellera de la Virgen en Baños de Agua Santa"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      DESCUBRE LOS ENCANTOS DE BAÑOS DE AGUA SANTA
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium">
                      Por: Coop. Trans EcuRutas
                    </p>
                    <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                      La caída natural de la Cascada Cabellera de la Virgen y los balnearios de aguas minerales sulfurosas se ubican a pocos metros de nuestra agencia central.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 pt-2">
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(true)}
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 uppercase tracking-wide inline-flex items-center gap-1"
                  >
                    <span>Consultar guía de atractivos</span>
                    <IconChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-card flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                    <img
                      src="/images/banos-basilica.jpg"
                      alt="Santuario y Basílica de Baños de Agua Santa"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      SANTUARIO DE AGUA SANTA Y CONEXIONES REGIONALES
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium">
                      Por: Coop. Trans EcuRutas
                    </p>
                    <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                      Arquitectura histórica en piedra volcánica en el centro de Baños y conexión directa con las rutas hacia Ambato, Quito, Riobamba, Ibarra y Puyo.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 pt-2">
                  <Link
                    href="/busqueda?origen=Quito&destino=Baños"
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 uppercase tracking-wide inline-flex items-center gap-1"
                  >
                    <span>Ver salidas hacia Baños</span>
                    <IconChevronRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-5">
                <div className="space-y-5 divide-y divide-neutral-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      BAÑOS DE AGUA SANTA: A NATURAL PARADISE
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">By: Transportes EcuRutas</p>
                    <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                      Corredor ecológico entre el Parque Nacional Sangay y el Parque Nacional Llanganates.
                    </p>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm sm:text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      CONOCE NUEVOS LUGARES TURÍSTICOS DEL ECUADOR ESTE 2026
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Por: Transportes EcuRutas</p>
                    <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                      Itinerarios coordinados desde la Sierra Centro hacia la Costa y la Amazonía ecuatoriana.
                    </p>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm sm:text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      SÍGUENOS EN NUESTROS CANALES OFICIALES
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Por: Transportes EcuRutas</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200">
                  <Link
                    href="/busqueda"
                    className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-brand-700 hover:text-brand-800 group"
                  >
                    <span>HORARIOS Y DESTINOS DESDE TODOS LOS TERMINALES</span>
                    <IconChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Informativo de Baños de Agua Santa */}
        {infoModalOpen && (
          <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-float border border-neutral-200">
              <div className="grid grid-cols-2 h-48 bg-neutral-900">
                <img
                  src="/images/banos-cascada.jpg"
                  alt="Cascada Cabellera de la Virgen"
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
                    <Badge variant="admin">FICHA DE DESTINO</Badge>
                    <h3 className="text-xl font-display font-extrabold text-neutral-900 mt-1">
                      Baños de Agua Santa (1.820 m s. n. m.)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(false)}
                    className="text-neutral-400 hover:text-neutral-800 text-sm font-bold px-2 py-1"
                  >
                    Cerrar
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Ubicada en la provincia de Tungurahua a 45 minutos de Ambato, Baños de Agua Santa articula el tránsito entre la Sierra y la Amazonía por la vía E30. Puntos de referencia cercanos al terminal:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-700">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">Cascada Cabellera de la Virgen</strong>
                    Caída de agua de 70 metros visible desde el casco central junto a las termas municipales.
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">Santuario de Agua Santa</strong>
                    Basílica semigótica levantada entre 1904 y 1944 con lienzos históricos de la ciudad.
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">Corredor de las Cascadas</strong>
                    Hidroeléctrica Agoyán, Manto de la Novia y Pailón del Diablo en la parroquia Río Verde.
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">Miradores de Runtún</strong>
                    Conexión con el sector de Runtún y vista panorámica del volcán Tungurahua.
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setInfoModalOpen(false)}>
                    Cerrar ventana
                  </Button>
                  <Link href="/busqueda?origen=Ambato&destino=Baños">
                    <Button variant="primary" size="sm">
                      <IconTicket size={14} />
                      <span>Reservar pasaje a Baños</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sección Destino Cuenca */}
      <section id="turismo-cuenca" className="scroll-mt-24">
        <div className="relative rounded-2xl overflow-hidden shadow-float border border-neutral-200">
          <img
            src="/images/cuenca-panoramica.jpg"
            alt="Panorámica del Centro Histórico y Catedral de Cuenca al atardecer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/75 to-neutral-950/80" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <div className="mb-8 text-white max-w-2xl">
              <span className="inline-block bg-brand-700 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md mb-2">
                Destino Patrimonial · Provincia del Azuay
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase tracking-tight">
                Cuenca: Patrimonio Cultural y Atenas del Ecuador
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                Frecuencias directas diarias y turnos nocturnos con arribo al Terminal Terrestre de Cuenca (Av. España), con enlace inmediato al Tranvía de los Cuatro Ríos.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Card 1: Parque Calderón */}
              <div className="bg-white rounded-xl overflow-hidden shadow-card flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                    <img
                      src="/images/cuenca-parque-calderon.jpg"
                      alt="Parque Calderón y Letras Cuenca con la Catedral de fondo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      PARQUE CALDERÓN Y LETRAS EMBLEMÁTICAS
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium">
                      Por: Coop. Trans EcuRutas
                    </p>
                    <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                      El corazón cívico y patrimonial de Cuenca. Admira las letras monumentales, sus jardines centenarios y el perfil inconfundible de la Catedral Nueva.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 pt-2">
                  <Link
                    href="/busqueda?origen=Ambato&destino=Cuenca"
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 uppercase tracking-wide inline-flex items-center gap-1"
                  >
                    <span>Ver frecuencias hacia Cuenca</span>
                    <IconChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Card 2: Catedral de la Inmaculada Concepción */}
              <div className="bg-white rounded-xl overflow-hidden shadow-card flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                    <img
                      src="/images/cuenca-catedral-calle.jpg"
                      alt="Catedral de la Inmaculada Concepción y calles coloniales de Cuenca"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      CATEDRAL DE LA INMACULADA CONCEPCIÓN
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium">
                      Por: Coop. Trans EcuRutas
                    </p>
                    <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                      Monumental joya neogótica iniciada en 1885 con cúpulas celestes traídas de Checoslovaquia, mármol italiano y fachadas coloniales de adoquines.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCuencaModalOpen(true)}
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 uppercase tracking-wide inline-flex items-center gap-1"
                  >
                    <span>Consultar ficha y atractivos</span>
                    <IconChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: Información y Guía del Austro */}
              <div className="bg-white rounded-xl p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-5">
                <div className="space-y-5 divide-y divide-neutral-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      CUENCA: CIUDAD PATRIMONIO DE LA HUMANIDAD
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Por: Transportes EcuRutas</p>
                    <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                      Reconocida por la UNESCO por su traza urbana renacentista, iglesias históricas, orfebrería y sombreros de paja toquilla.
                    </p>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm sm:text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      EL BARRANCO DEL TOMEBAMBA Y MIRADOR DE TURI
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Por: Transportes EcuRutas</p>
                    <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                      Paseo natural junto al río con casonas colgantes y la mejor vista panorámica de la llanura andina del Austro.
                    </p>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm sm:text-base font-display font-extrabold text-neutral-900 uppercase leading-snug">
                      UNIDADES EJECUTIVAS Y BUS CAMA
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Por: Transportes EcuRutas</p>
                    <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                      Confort total para viajes diurnos y nocturnos con climatización, tomacorrientes y wifi.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200">
                  <Link
                    href="/busqueda?destino=Cuenca"
                    className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-brand-700 hover:text-brand-800 group"
                  >
                    <span>HORARIOS Y PASAJES A CUENCA</span>
                    <IconChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Informativo de Cuenca */}
        {cuencaModalOpen && (
          <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-float border border-neutral-200">
              <div className="grid grid-cols-2 h-48 bg-neutral-900">
                <img
                  src="/images/cuenca-parque-calderon.jpg"
                  alt="Parque Calderón Cuenca"
                  className="w-full h-full object-cover"
                />
                <img
                  src="/images/cuenca-catedral-calle.jpg"
                  alt="Catedral de Cuenca y calles coloniales"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="admin">FICHA DE DESTINO</Badge>
                    <h3 className="text-xl font-display font-extrabold text-neutral-900 mt-1">
                      Cuenca · Santa Ana de los Cuatro Ríos (2.560 m s. n. m.)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCuencaModalOpen(false)}
                    className="text-neutral-400 hover:text-neutral-800 text-sm font-bold px-2 py-1"
                  >
                    Cerrar
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Capital de la provincia del Azuay y Patrimonio Cultural de la Humanidad por la UNESCO. Destino primordial del Austro ecuatoriano comunicado por la Troncal de la Sierra E35:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-700">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">Parque Abdón Calderón</strong>
                    Plaza central flanqueada por las dos catedrales, con árboles centenarios y las letras rojas emblemáticas.
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">Catedral de la Inmaculada</strong>
                    Monumento neogótico y renacentista con tres cúpulas celestes visibles desde toda la meseta cuencana.
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">El Barranco del Tomebamba</strong>
                    Paseo ribereño adoquinado con arquitectura colonial colgante, puentes de piedra y galerías de arte.
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <strong className="text-neutral-900 block">Mirador de Turi</strong>
                    Terraza panorámica que ofrece la mejor vista de la ciudad andina, iglesias y cordillera circundante.
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setCuencaModalOpen(false)}>
                    Cerrar ventana
                  </Button>
                  <Link href="/busqueda?destino=Cuenca">
                    <Button variant="primary" size="sm">
                      <IconTicket size={14} />
                      <span>Reservar pasaje a Cuenca</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      <section id="rutas-populares" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
              Itinerarios Interprovinciales
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 tracking-tight">
              Frecuencias de Mayor Demanda
            </h2>
          </div>
          <Link href="/busqueda">
            <Button variant="outline" size="sm">
              <span>Catálogo completo ({frecuencias.length || 12} rutas)</span>
              <IconArrowRight size={14} />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_ROUTES.map((ruta, i) => (
            <div
              key={`${ruta.origen}-${ruta.destino}-${i}`}
              className="group bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900">
                  <img
                    src={ruta.image}
                    alt={`${ruta.origen} a ${ruta.destino}`}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/25 to-transparent" />
                  <span className="absolute top-3 left-3 bg-neutral-900/85 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                    {ruta.tag}
                  </span>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-[11px] text-neutral-300 font-medium">{ruta.tipo}</p>
                    <h3 className="text-base font-display font-bold leading-tight">
                      {ruta.origen} — {ruta.destino}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-2.5 text-xs text-neutral-600">
                  <div className="flex items-center justify-between font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <IconClock size={14} className="text-neutral-400" />
                      <span>Tiempo estimado: {ruta.duracion}</span>
                    </span>
                  </div>
                  <div className="text-neutral-500">
                    Frecuencia: <strong className="text-neutral-800 font-semibold">{ruta.frecuencia}</strong>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Tarifa oficial ANT
                  </span>
                  <span className="text-lg font-display font-extrabold text-neutral-900">
                    ${ruta.precio.toFixed(2)} <span className="text-xs font-normal text-neutral-500">USD</span>
                  </span>
                </div>
                <Link
                  href={`/busqueda?origen=${encodeURIComponent(
                    ruta.origen.split(' ')[0]
                  )}&destino=${encodeURIComponent(ruta.destino.split(' ')[0])}`}
                >
                  <Button variant="primary" size="sm">
                    <span>Ver Horarios</span>
                    <IconChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl bg-neutral-900 text-white p-8 sm:p-10 border-l-4 border-brand-700 shadow-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-left divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
          <div className="pt-2 sm:pt-0 sm:pr-6">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-white">5.2M</div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-1">
              Pasajeros movilizados anualmente
            </div>
          </div>
          <div className="pt-4 sm:pt-0 sm:px-6">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-accent-400">56</div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-1">
              Agencias y boleterías en Ecuador
            </div>
          </div>
          <div className="pt-4 lg:pt-0 lg:px-6">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-white">
              {cooperativas.length ? `${cooperativas.length * 25}` : '120'}
            </div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-1">
              Unidades homologadas en operación
            </div>
          </div>
          <div className="pt-4 lg:pt-0 lg:pl-6">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-accent-400">60 años</div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-1">
              Trayectoria interprovincial
            </div>
          </div>
        </div>
      </section>
      <section id="como-comprar" className="space-y-8 scroll-mt-24">
        <div className="border-b border-neutral-200 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
            Flujo de Emisión Digital
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900">
            Adquisición de Boletos en 4 Pasos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              Icon: IconSearch,
              title: 'Selección de Frecuencia',
              desc: 'Filtra por origen, destino, fecha y tipo de unidad para consultar disponibilidad en andén.',
            },
            {
              step: '02',
              Icon: IconTicket,
              title: 'Ubicación en Plano 2D',
              desc: 'Elige tus asientos en el croquis de la unidad y registra los datos de cédula del pasajero.',
            },
            {
              step: '03',
              Icon: IconCreditCard,
              title: 'Registro de Pago',
              desc: 'Adjunta el comprobante de transferencia bancaria o confirma tu pago en ventanilla.',
            },
            {
              step: '04',
              Icon: IconQrCode,
              title: 'Emisión de Boleto QR',
              desc: 'Descarga el boleto en formato PDF con código QR firmado para el control de abordaje.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-xl p-6 border border-neutral-200 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
                    <item.Icon size={18} />
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-400">PASO {item.step}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Aviso informativo de cuenta requerida para compra de boletos */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-subtle flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700">
              <IconShieldCheck size={16} />
              <span>Emisión Nominativa y Registro de Pasajero</span>
            </div>
            <h3 className="text-lg sm:text-xl font-display font-extrabold text-neutral-900">
              Consulta horarios libremente; crea tu cuenta para comprar tus boletos
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Puedes revisar todos nuestros itinerarios, paradas intermedias, tarifas proporcionales y croquis de unidades sin registrarte. Al momento de adquirir tu pasaje, necesitarás iniciar sesión o crear tu cuenta gratuita para que el boleto electrónico QR quede registrado a tu nombre y número de cédula.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/busqueda">
              <Button variant="outline" size="md">
                <IconSearch size={15} />
                <span>Ver Horarios y Frecuencias</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="md">
                <IconUser size={15} />
                <span>Crear Cuenta / Iniciar Sesión</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section id="estado-vias" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
              Información Operativa en Ruta
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900">
              Estado de Carreteras y Ejes Viales
            </h2>
          </div>
          <span className="text-xs font-medium text-neutral-500">
            Datos referenciales sincronizados con reportes públicos ECU 911 / MTOP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROAD_STATUS_LIST.map((item) => {
            const isGreen = item.estado === 'DESPEJADA';
            return (
              <div
                key={item.via}
                className="bg-white rounded-xl p-5 border border-neutral-200 shadow-subtle flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    isGreen
                      ? 'bg-success-50 text-success-700 border-success-200'
                      : 'bg-warning-50 text-warning-700 border-warning-200'
                  }`}
                >
                  {isGreen ? <IconCheckCircle size={18} /> : <IconAlertTriangle size={18} />}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">{item.via}</h3>
                    <Badge variant={isGreen ? 'success' : 'warning'}>
                      {isGreen ? 'HABILITADA' : 'PRECAUCIÓN'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.detalle}</p>
                  <p className="text-[11px] text-neutral-400 font-medium">{item.actualizado}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section id="nosotros-quejas" className="scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-5">
            <div className="border-b border-neutral-200 pb-3">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 uppercase tracking-tight">
                NOSOTROS
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              <strong className="text-neutral-900">
                Viaja por los principales destinos del Ecuador: Quito, Baños de Agua Santa, El Coca, Lago Agrio, Montañita, Ambato, Cuenca y Puyo.
              </strong>{' '}
              La Cooperativa de Transportes y Turismo EcuRutas es una organización ecuatoriana de transporte terrestre interprovincial de pasajeros con más de 60 años de operación continua. Movilizamos a más de 5 millones de pasajeros anualmente y{' '}
              <strong className="text-neutral-900">
                contamos con 56 agencias en todo el territorio nacional
              </strong>
              , integrando control de flota, boletería electrónica QR y cumplimiento estricto de las normas técnicas de la Agencia Nacional de Tránsito.{' '}
              <Link
                href="/busqueda"
                className="inline-flex items-center gap-1 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold px-2.5 py-0.5 rounded ml-1 transition-colors"
              >
                <IconTicket size={12} />
                <span>Pasajes de autobús</span>
              </Link>
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg overflow-hidden border border-neutral-200 h-28 relative">
                <img
                  src="/images/banos-cascada.jpg"
                  alt="Cascada de la Virgen Baños"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1.5 right-1.5 bg-neutral-950/75 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded truncate">
                  Cascada de la Virgen
                </span>
              </div>
              <div className="rounded-lg overflow-hidden border border-neutral-200 h-28 relative">
                <img
                  src="/images/banos-basilica.jpg"
                  alt="Santuario de Baños de Agua Santa"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1.5 right-1.5 bg-neutral-950/75 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded truncate">
                  Santuario de Baños
                </span>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-900 h-28 p-3 text-white flex flex-col justify-between">
                <IconShieldCheck size={20} className="text-accent-400" />
                <div>
                  <div className="text-xs font-bold leading-tight">Homologación ANT</div>
                  <div className="text-[10px] text-neutral-400">Flota interprovincial</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 bg-white rounded-xl shadow-card border border-neutral-200 p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-display font-extrabold text-neutral-900 uppercase tracking-tight mb-1.5">
              QUEJAS O SUGERENCIAS
            </h3>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
              Canal directo de Atención al Usuario para reportar novedades en boleterías, unidades o frecuencias.
            </p>

            <form onSubmit={handleQuejaSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="queja-nombre" className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    id="queja-nombre"
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={quejaNombre}
                    onChange={(e) => setQuejaNombre(e.target.value)}
                    className="w-full h-10 rounded-lg bg-neutral-50 border border-neutral-300 px-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-brand-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="queja-asunto" className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Asunto *
                  </label>
                  <input
                    id="queja-asunto"
                    type="text"
                    placeholder="Ej. Atención en ventanilla / Equipaje"
                    value={quejaAsunto}
                    onChange={(e) => setQuejaAsunto(e.target.value)}
                    className="w-full h-10 rounded-lg bg-neutral-50 border border-neutral-300 px-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-brand-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-3.5">
                  <div>
                    <label htmlFor="queja-ciudad" className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Ciudad / Terminal *
                    </label>
                    <input
                      id="queja-ciudad"
                      type="text"
                      placeholder="Ej. Baños / Ambato"
                      value={quejaCiudad}
                      onChange={(e) => setQuejaCiudad(e.target.value)}
                      className="w-full h-10 rounded-lg bg-neutral-50 border border-neutral-300 px-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-brand-700 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="queja-email" className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      id="queja-email"
                      type="email"
                      placeholder="usuario@correo.com"
                      value={quejaEmail}
                      onChange={(e) => setQuejaEmail(e.target.value)}
                      className="w-full h-10 rounded-lg bg-neutral-50 border border-neutral-300 px-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-brand-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="queja-mensaje" className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Detalle del mensaje *
                  </label>
                  <textarea
                    id="queja-mensaje"
                    placeholder="Indica número de disco, ruta o detalle de tu sugerencia..."
                    rows={4}
                    value={quejaMensaje}
                    onChange={(e) => setQuejaMensaje(e.target.value)}
                    className="w-full min-h-[104px] rounded-lg bg-neutral-50 border border-neutral-300 p-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-brand-700 focus:outline-none resize-y"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="md">
                  Enviar comunicación
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <section id="preguntas-frecuentes" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24">
        <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
              Calidad de Servicio
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-neutral-900 mt-0.5">
              Opiniones de Pasajeros
            </h2>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-3">
            <Badge variant="success">{TESTIMONIALS[activeTestimonial].fecha}</Badge>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              &ldquo;{TESTIMONIALS[activeTestimonial].comentario}&rdquo;
            </p>
            <div className="pt-2 border-t border-neutral-200/80">
              <div className="text-xs font-bold text-neutral-900">
                {TESTIMONIALS[activeTestimonial].nombre}
              </div>
              <div className="text-[11px] text-neutral-500 font-medium">
                {TESTIMONIALS[activeTestimonial].ciudad}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((t, idx) => (
                <button
                  key={t.nombre}
                  type="button"
                  onClick={() => setActiveTestimonial(idx)}
                  aria-label={`Ver opinión ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeTestimonial ? 'w-6 bg-brand-700' : 'w-2 bg-neutral-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setActiveTestimonial(
                    (prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
                  )
                }
                aria-label="Opinión anterior"
                className="w-8 h-8 rounded-lg border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center text-neutral-700"
              >
                <IconChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
                }
                aria-label="Siguiente opinión"
                className="w-8 h-8 rounded-lg border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center text-neutral-700"
              >
                <IconChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
              Información al Viajero
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-neutral-900 mt-0.5">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.pregunta}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-subtle"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-neutral-900">
                      {faq.pregunta}
                    </span>
                    <span className="text-brand-700 font-bold text-base">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                      {faq.respuesta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section id="contacto-agencias" className="space-y-6 scroll-mt-24">
        <div className="border-b border-neutral-200 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
            Puntos de Atención Presencial
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900">
            Boleterías y Terminales Terrestres
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AGENCIES_DIRECTORY.map((ag) => (
            <div
              key={ag.ciudad}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-subtle hover:border-neutral-300 transition-all space-y-2.5"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
                <IconMapPin size={17} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">{ag.ciudad}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">{ag.direccion}</p>
              <p className="text-xs font-bold text-brand-700 inline-flex items-center gap-1.5">
                <IconPhone size={13} />
                <span>{ag.telefono}</span>
              </p>
              <p className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                <IconClock size={12} />
                <span>{ag.horario}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-5 pt-4 border-t border-neutral-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
            Módulos de Gestión Interna
          </span>
          <h2 className="text-2xl font-display font-extrabold text-neutral-900 tracking-tight">
            Portales Operativos por Rol
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Acceso directo a los paneles de administración, flota, ventanilla, control de abordaje QR y auditoría:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((item) => (
            <Card
              key={item.rol}
              className={`hover:shadow-lg transition-all flex flex-col justify-between ${item.accentBorder}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${item.iconStyle}`}>
                    <item.Icon size={19} />
                  </div>
                  <Badge variant={item.rol}>{item.badge}</Badge>
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={item.path} className="w-full block">
                  <Button variant="outline" size="sm" className="w-full font-bold">
                    <span>Acceder al módulo</span>
                    <IconArrowRight size={14} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          <Card className="hover:shadow-lg transition-all flex flex-col justify-between border-t-4 border-t-brand-700">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
                  <IconBarChart size={19} />
                </div>
                <Badge variant="admin">AUDITORÍA</Badge>
              </div>
              <CardTitle>Reportes Financieros e ITIL</CardTitle>
              <CardDescription>
                Indicadores de recaudación, factor de ocupación por unidad y registro de cambios RFC.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/reportes" className="w-full block">
                <Button variant="outline" size="sm" className="w-full font-bold">
                  <span>Consultar reportes</span>
                  <IconArrowRight size={14} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
