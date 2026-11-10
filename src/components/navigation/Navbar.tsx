'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RolUsuario } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconBus,
  IconPhone,
  IconUser,
  IconChevronDown,
  IconTicket,
} from '@/components/ui/Icons';
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
      { label: 'Buscador de Frecuencias', href: '/busqueda', desc: 'Salidas diarias y disponibilidad por andén' },
      { label: 'Frecuencias a Baños de Agua Santa', href: '/#turismo-banos', desc: 'Salidas directas cada 30 minutos' },
      { label: 'Rutas Interprovinciales', href: '/#rutas-populares', desc: 'Quito, Ambato, Guayaquil, Cuenca y Puyo' },
    ],
  },
  {
    label: 'Servicios',
    href: '/#como-comprar',
    dropdown: [
      { label: 'Selección de Asientos 2D', href: '/busqueda', desc: 'Unidades ejecutivas de uno y dos pisos' },
      { label: 'Boleto Electrónico QR', href: '/pasajero', desc: 'Comprobante PDF con firma criptográfica' },
      { label: 'Proceso de Compra en Línea', href: '/#como-comprar', desc: 'Emisión en 4 pasos sin filas en terminal' },
    ],
  },
  {
    label: 'Estado de vías',
    href: '/#estado-vias',
    dropdown: [
      { label: 'Reporte Vial ECU 911 / MTOP', href: '/#estado-vias', desc: 'Habilitación actual de ejes viales' },
      { label: 'Corredor Ambato – Baños – Puyo', href: '/#estado-vias', desc: 'Estado de túneles y tránsito en ruta' },
    ],
  },
  {
    label: 'Teléfonos',
    href: '/#contacto-agencias',
    dropdown: [
      { label: 'Boleterías y Terminales', href: '/#contacto-agencias', desc: 'Baños, Ambato, Quito Quitumbe y Guayaquil' },
      { label: 'Atención al Pasajero', href: '/#nosotros-quejas', desc: 'Recepción de sugerencias y reclamos' },
      { label: 'Preguntas Frecuentes', href: '/#preguntas-frecuentes', desc: 'Equipaje, tarifas ANT y abordaje' },
    ],
  },
];

const NAV_ITEMS_BY_ROLE: Record<RolUsuario, NavItem[]> = {
  admin: [
    { label: 'Inicio', href: '/' },
    { label: 'Administración', href: '/admin' },
    { label: 'Cooperativas', href: '/cooperativa' },
    { label: 'Reportes ITIL', href: '/reportes' },
    { label: 'Configuración', href: '/admin/configuracion' },
  ],
  cooperativa: [
    { label: 'Inicio', href: '/' },
    { label: 'Flota y Frecuencias', href: '/cooperativa' },
    { label: 'Buscador', href: '/busqueda' },
    { label: 'Reportes', href: '/reportes' },
  ],
  oficinista: [
    { label: 'Inicio', href: '/' },
    { label: 'Ventanilla y Pagos', href: '/oficina' },
    { label: 'Subir Comprobante', href: '/pagos' },
    { label: 'Boletería', href: '/busqueda' },
  ],
  chofer: [
    { label: 'Inicio', href: '/' },
    { label: 'Hoja de Ruta y Escáner QR', href: '/chofer' },
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
      setIsScrolled(window.scrollY > 20);
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
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-card'
          : 'bg-white border-b border-zinc-200/80'
      }`}
    >
      {/* 1. Barra Superior Institucional */}
      <div className="bg-zinc-100 border-b border-zinc-200/80 text-[11px] text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <span className="font-semibold tracking-wide truncate" style={{ color: primaryColor }}>
            {appConfig?.nombreApp || 'Cooperativa de Transportes y Turismo EcuRutas'} · Servicio Interprovincial Autorizado ANT
          </span>
          <div className="hidden md:flex items-center space-x-5">
            <Link
              href="/#contacto-agencias"
              className="font-bold hover:underline tracking-wide uppercase"
              style={{ color: primaryColor }}
            >
              Consulta nuestras agencias aquí
            </Link>
            <Link href="/#como-comprar" className="hover:text-zinc-900 transition-colors font-medium">
              Encomiendas y Frecuencias
            </Link>
            <span className="text-zinc-300" aria-hidden="true">|</span>
            <span className="font-semibold text-zinc-800 uppercase tracking-wider">EC · USD</span>
          </div>
        </div>
      </div>

      {/* 2. Cabecera Principal */}
      <div className="bg-white">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-200 ${
            isScrolled ? 'py-2.5' : 'py-3.5'
          }`}
        >
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            {appConfig?.logoUrl ? (
              <img
                src={appConfig.logoUrl}
                alt={appConfig.nombreApp}
                className="h-10 max-w-44 object-contain"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-subtle"
                  style={{ backgroundColor: primaryColor }}
                >
                  <IconBus size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-display font-extrabold text-xl sm:text-2xl tracking-tight uppercase leading-none"
                      style={{ color: primaryColor }}
                    >
                      {appConfig?.nombreApp ? appConfig.nombreApp.split(' ')[0] : 'ECURUTAS'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white uppercase tracking-wider">
                      ANT
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium tracking-wide">
                    Cooperativa de Transportes y Turismo
                  </span>
                </div>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/busqueda"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-subtle transition-all duration-150 hover:opacity-95 active:scale-[0.99]"
              style={{ backgroundColor: primaryColor }}
            >
              <IconTicket size={15} />
              <span>Comprar pasajes en línea</span>
            </Link>

            {loading ? (
              <div className="h-9 w-28 bg-zinc-100 animate-pulse rounded-lg" />
            ) : rol && email ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200">
                <NotificacionCampana />

                <div className="hidden lg:flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
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
                      <Badge variant={rol}>{rol}</Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs"
                >
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs">
                  <IconUser size={14} />
                  <span>Ingresar / Registro</span>
                </Button>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-zinc-700 hover:bg-zinc-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Barra de Navegación con Corte Diagonal a la Izquierda */}
      <div className="relative w-full bg-white border-t border-zinc-100">
        <div
          className="hidden md:block absolute bottom-0 left-0 w-1/3 h-3.5"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="max-w-7xl mx-auto flex items-stretch justify-end">
          <div
            className="w-full md:w-[78%] lg:w-[74%] text-white relative flex items-center justify-between px-4 sm:px-8 h-11"
            style={{ backgroundColor: primaryColor }}
          >
            <div
              className="hidden md:block absolute top-0 -left-7 w-0 h-0"
              style={{
                borderBottom: `44px solid ${primaryColor}`,
                borderLeft: '28px solid transparent',
              }}
              aria-hidden="true"
            />

            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 h-full" aria-label="Navegación principal">
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
                      <span className="text-white/35 text-xs select-none mr-1 lg:mr-2" aria-hidden="true">
                        •
                      </span>
                    )}
                    <Link
                      href={item.href}
                      className={`relative h-full inline-flex items-center gap-1 px-2.5 lg:px-3 text-xs lg:text-sm font-semibold tracking-wide transition-colors whitespace-nowrap ${
                        isActive
                          ? 'text-white border-b-2 border-amber-400 bg-black/10'
                          : 'text-red-50 hover:text-white hover:bg-black/10'
                      }`}
                    >
                      <span>{item.label}</span>
                      {hasDropdown && <IconChevronDown size={13} className="opacity-80" />}
                    </Link>

                    {hasDropdown && openDropdown === item.label && (
                      <div className="absolute left-0 top-full pt-1 w-64 z-50">
                        <div className="bg-white rounded-xl shadow-float border border-zinc-200 py-1.5 text-zinc-800 overflow-hidden">
                          {item.dropdown!.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-2.5 hover:bg-zinc-50 transition-colors group"
                            >
                              <div className="text-xs font-bold text-zinc-900 group-hover:text-brand-700">
                                {sub.label}
                              </div>
                              {sub.desc && (
                                <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                                  {sub.desc}
                                </div>
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

            <div className="flex md:hidden items-center justify-between w-full text-xs font-semibold">
              <Link href="/busqueda" className="text-white inline-flex items-center gap-1.5">
                <IconBus size={15} />
                <span>Horarios y Boletería en Línea</span>
              </Link>
              <a href="tel:032821234" className="text-amber-300 font-bold inline-flex items-center gap-1">
                <IconPhone size={13} />
                <span>{appConfig?.soporteTelefono || '(03) 282-1234'}</span>
              </a>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-red-100">
              <IconPhone size={14} />
              <span>Central: {appConfig?.soporteTelefono || '(03) 282-1234'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Menú Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 shadow-float px-4 pt-3 pb-5 space-y-3">
          {rol && email && (
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="text-xs font-semibold text-zinc-700 truncate">{email}</div>
              <Badge variant={rol}>{rol}</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((item) => (
              <div key={item.label} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-zinc-900 hover:bg-zinc-50"
                >
                  {item.label}
                </Link>
                {item.dropdown && (
                  <div className="pl-4 space-y-1 border-l border-zinc-200 ml-3">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1 text-xs font-medium text-zinc-600 hover:text-brand-700"
                      >
                        {sub.label}
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
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <IconTicket size={15} />
              <span>Comprar pasajes en línea</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
