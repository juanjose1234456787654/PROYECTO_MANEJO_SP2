'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RolUsuario } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { dataService } from '@/lib/services/dataService';
import type { ConfiguracionAppRow } from '@/lib/types';
import NotificacionCampana from './NotificacionCampana';

interface NavItem {
  label: string;
  href: string;
  dropdown?: { label: string; href: string; desc?: string }[];
}

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/' },
  {
    label: 'Horarios',
    href: '/busqueda',
    dropdown: [
      { label: 'Buscador de Frecuencias', href: '/busqueda', desc: 'Salidas diarias en tiempo real' },
      { label: 'Rutas hacia Baños de Agua Santa', href: '/#turismo-banos', desc: 'Frecuencias directas cada 30 min' },
      { label: 'Rutas Populares del Ecuador', href: '/#rutas-populares', desc: 'Quito, Ambato, Guayaquil, Cuenca' },
    ],
  },
  {
    label: 'Servicios',
    href: '/#como-comprar',
    dropdown: [
      { label: 'Compra de Pasajes VIP 2D', href: '/busqueda', desc: 'Elige tu asiento exacto en línea' },
      { label: 'Boleto Electrónico con QR', href: '/pasajero', desc: 'Descarga en PDF con firma HMAC' },
      { label: 'Cómo Comprar tu Pasaje', href: '/#como-comprar', desc: 'Guía rápida en 4 pasos' },
    ],
  },
  {
    label: 'Estado de vías',
    href: '/#estado-vias',
    dropdown: [
      { label: 'Semáforo Vial ECU 911 / ANT', href: '/#estado-vias', desc: 'Estado actual de carreteras' },
      { label: 'Vía Ambato – Baños – Puyo', href: '/#estado-vias', desc: 'Reporte climático y tránsito' },
    ],
  },
  {
    label: 'Teléfonos',
    href: '/#contacto-agencias',
    dropdown: [
      { label: 'Directorio de Terminales y Agencias', href: '/#contacto-agencias', desc: 'Ambato, Baños, Quito, Guayaquil' },
      { label: 'Quejas o Sugerencias', href: '/#nosotros-quejas', desc: 'Buzón directo de atención al cliente' },
      { label: 'Preguntas Frecuentes (FAQ)', href: '/#preguntas-frecuentes', desc: 'Equipaje, descuentos ANT y cambios' },
    ],
  },
];

const NAV_ITEMS_BY_ROLE: Record<RolUsuario, NavItem[]> = {
  admin: [
    { label: 'Inicio', href: '/' },
    { label: 'Panel Admin', href: '/admin' },
    { label: 'Cooperativas', href: '/cooperativa' },
    { label: 'Reportes ITIL', href: '/reportes' },
    { label: 'Configuración', href: '/admin/configuracion' },
  ],
  cooperativa: [
    { label: 'Inicio', href: '/' },
    { label: 'Mi Cooperativa', href: '/cooperativa' },
    { label: 'Buscar Frecuencias', href: '/busqueda' },
    { label: 'Reportes', href: '/reportes' },
  ],
  oficinista: [
    { label: 'Inicio', href: '/' },
    { label: 'Oficina y Ventanilla', href: '/oficina' },
    { label: 'Validar Pagos', href: '/pagos' },
    { label: 'Buscador', href: '/busqueda' },
  ],
  chofer: [
    { label: 'Inicio', href: '/' },
    { label: 'Panel de Viaje y QR', href: '/chofer' },
  ],
  usuario: [
    ...PUBLIC_NAV_ITEMS,
    { label: 'Mis Boletos QR', href: '/pasajero' },
    { label: 'Pagos', href: '/pagos' },
  ],
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [email, setEmail] = useState<string | null>(null);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<ConfiguracionAppRow | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setEmail(null);
          setRol(null);
          return;
        }

        setEmail(user.email || null);

        const { data: usuario } = await supabase
          .from('Usuario')
          .select('rol')
          .eq('id', user.id)
          .single();

        const profile = usuario as { rol: RolUsuario } | null;
        if (profile?.rol) {
          setRol(profile.rol);
        }
      } catch (err) {
        console.error('Error al cargar sesión en Navbar:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [supabase, pathname]);

  useEffect(() => {
    let active = true;
    dataService.getConfig().then((config) => {
      if (active) setAppConfig(config);
    });
    const updateConfig = (event: Event) => {
      const detail = (event as CustomEvent<ConfiguracionAppRow>).detail;
      if (detail) setAppConfig(detail);
    };
    window.addEventListener('app-config-updated', updateConfig);
    return () => {
      active = false;
      window.removeEventListener('app-config-updated', updateConfig);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setRol(null);
    router.push('/login');
    router.refresh();
  };

  const navLinks = rol ? NAV_ITEMS_BY_ROLE[rol] || PUBLIC_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  const primaryColor =
    appConfig?.colorPrimaria && appConfig.colorPrimaria !== '#1e3a8a'
      ? appConfig.colorPrimaria
      : '#b91c1c';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-white shadow-sm'
      }`}
    >
      {/* 1. Barra Superior Delgada Institucional */}
      <div
        className={`bg-zinc-100 border-b border-zinc-200/80 text-[11px] sm:text-xs transition-all duration-200 ${
          isScrolled ? 'h-7' : 'h-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <span className="font-semibold tracking-wide truncate" style={{ color: primaryColor }}>
            Bienvenidos a {appConfig?.nombreApp || 'Cooperativa de Transportes y Turismo EcuRutas'}
          </span>
          <div className="hidden md:flex items-center space-x-5 text-zinc-600">
            <Link
              href="/#contacto-agencias"
              className="font-extrabold hover:underline tracking-wide"
              style={{ color: primaryColor }}
            >
              CONSULTA NUESTRAS AGENCIAS AQUÍ
            </Link>
            <Link href="/#como-comprar" className="hover:text-zinc-900 transition-colors">
              Encomiendas y Turismo
            </Link>
            <span className="text-zinc-300">|</span>
            <span className="inline-flex items-center gap-1 font-semibold text-zinc-700">
              <span>Esp</span>
              <span aria-hidden="true">🇪🇨</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cabecera Principal con Logo a la Izquierda y CTA Grande a la Derecha */}
      <div className="bg-white">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-200 ${
            isScrolled ? 'py-2' : 'py-3.5'
          }`}
        >
          <Link href="/" className="flex items-center space-x-3 group focus:outline-none">
            {appConfig?.logoUrl ? (
              <img
                src={appConfig.logoUrl}
                alt={appConfig.nombreApp}
                className="h-11 max-w-44 object-contain"
              />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-red-600 text-lg leading-none select-none">★★</span>
                  <span
                    className="font-black text-2xl sm:text-3xl italic tracking-tight uppercase leading-none group-hover:opacity-90 transition-opacity"
                    style={{ color: primaryColor }}
                  >
                    {appConfig?.nombreApp ? appConfig.nombreApp.split(' ')[0] : 'ECURUTAS'}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-700 text-white uppercase tracking-wider">
                    ECUADOR
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase pl-6">
                  Cooperativa de Transportes y Turismo
                </span>
              </div>
            )}
          </Link>

          <div className="flex items-center space-x-3">
            {/* CTA Grande estilo Cooperativa */}
            <Link
              href="/busqueda"
              className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white rounded shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              COMPRAR PASAJES EN LÍNEA
            </Link>

            {loading ? (
              <div className="h-9 w-28 bg-zinc-200 animate-pulse rounded" />
            ) : rol && email ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-zinc-200">
                <NotificacionCampana />

                <div className="hidden lg:flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                    title={email}
                  >
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-zinc-800 max-w-[140px] truncate">
                      {email}
                    </span>
                    <div>
                      <Badge variant={rol}>{rol.toUpperCase()}</Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs"
                >
                  Salir
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-700 text-red-700 hover:bg-red-50 font-bold text-xs"
                  >
                    🔑 Mi Cuenta / Ingresar
                  </Button>
                </Link>
              </div>
            )}

            {/* Botón Menú Hamburguesa (Móvil) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-zinc-700 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Barra de Navegación Roja con Corte Diagonal a la Izquierda (Inspiración Visual) */}
      <div className="relative w-full bg-white border-t border-zinc-100">
        {/* Franja inferior izquierda delgada que conecta con el corte diagonal */}
        <div
          className="hidden md:block absolute bottom-0 left-0 w-1/3 h-4"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="max-w-7xl mx-auto flex items-stretch justify-end">
          <div
            className="w-full md:w-[78%] lg:w-[74%] text-white relative flex items-center justify-between px-4 sm:px-8 h-11 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {/* Triángulo de corte diagonal a la izquierda en pantallas medianas/grandes */}
            <div
              className="hidden md:block absolute top-0 -left-7 w-0 h-0"
              style={{
                borderBottom: `44px solid ${primaryColor}`,
                borderLeft: '28px solid transparent',
              }}
              aria-hidden="true"
            />

            {/* Navegación Desktop con Dropdowns */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 h-full" aria-label="Menú principal">
              {navLinks.map((item, idx) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const hasDropdown = Boolean(item.dropdown && item.dropdown.length > 0);

                return (
                  <div
                    key={`${item.label}-${idx}`}
                    className="relative h-full flex items-center"
                    onMouseEnter={() => hasDropdown && setOpenDropdown(item.label)}
                    onMouseLeave={() => hasDropdown && setOpenDropdown(null)}
                  >
                    {idx > 0 && (
                      <span className="text-red-300/60 text-xs select-none mr-1 lg:mr-2">•</span>
                    )}
                    <Link
                      href={item.href}
                      className={`relative h-full inline-flex items-center gap-1 px-2.5 lg:px-3 text-xs lg:text-sm font-bold tracking-wide transition-colors whitespace-nowrap ${
                        isActive
                          ? 'text-white border-b-4 border-amber-400'
                          : 'text-red-50 hover:text-white hover:bg-black/10'
                      }`}
                    >
                      <span>{item.label}</span>
                      {hasDropdown && (
                        <span className="text-[10px] opacity-80 transition-transform duration-200">
                          ▾
                        </span>
                      )}
                    </Link>

                    {/* Dropdown Animado */}
                    {hasDropdown && openDropdown === item.label && (
                      <div className="absolute left-0 top-full pt-1 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 py-2 text-zinc-800 overflow-hidden">
                          {item.dropdown!.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-2.5 hover:bg-red-50 transition-colors group"
                            >
                              <div className="text-xs font-extrabold text-zinc-900 group-hover:text-red-700">
                                {sub.label}
                              </div>
                              {sub.desc && (
                                <div className="text-[11px] text-zinc-500 mt-0.5">{sub.desc}</div>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Enlaces rápidos en móvil dentro de la barra roja */}
            <div className="flex md:hidden items-center justify-between w-full text-xs font-bold">
              <Link href="/busqueda" className="text-white flex items-center gap-1.5">
                <span>🚌</span>
                <span>Horarios y Pasajes en Línea</span>
              </Link>
              <a href="tel:032821234" className="text-amber-300 font-extrabold">
                📞 {appConfig?.soporteTelefono || '(03) 282-1234'}
              </a>
            </div>

            <div className="hidden xl:flex items-center space-x-3 text-xs font-bold text-red-100">
              <span>📞 Call Center: {appConfig?.soporteTelefono || '(03) 282-1234'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Drawer de Navegación Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 shadow-2xl px-4 pt-3 pb-5 space-y-3">
          {rol && email && (
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="text-xs font-semibold text-zinc-700 truncate">{email}</div>
              <Badge variant={rol}>{rol.toUpperCase()}</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((item) => (
              <div key={item.label} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-extrabold text-zinc-800 hover:bg-red-50 hover:text-red-700"
                >
                  {item.label}
                </Link>
                {item.dropdown && (
                  <div className="pl-5 space-y-1 border-l-2 border-red-100 ml-3">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1 text-xs font-medium text-zinc-600 hover:text-red-700"
                      >
                        • {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/busqueda"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white rounded-lg shadow"
              style={{ backgroundColor: primaryColor }}
            >
              🚌 Comprar Pasajes en Línea
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
