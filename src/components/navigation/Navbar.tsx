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
// IMPORTAMOS LA CAMPANA
import NotificacionCampana from './NotificacionCampana';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS_BY_ROLE: Record<RolUsuario, NavItem[]> = {
  admin: [
    { label: 'Panel General', href: '/admin' },
    { label: 'Cooperativas', href: '/cooperativa' },
    { label: 'Reportes', href: '/reportes' },
    { label: 'Configuración', href: '/admin/configuracion' },
  ],
  cooperativa: [
    { label: 'Mi Cooperativa', href: '/cooperativa' },
    { label: 'Buses', href: '/buses' },
    { label: 'Frecuencias', href: '/frecuencias' },
    { label: 'Reportes', href: '/reportes' },
  ],
  oficinista: [
    { label: 'Oficina Central', href: '/oficina' },
    { label: 'Venta Boletos', href: '/ventas' },
    { label: 'Validar Pagos', href: '/pagos' },
  ],
  chofer: [
    { label: 'Panel de Viaje', href: '/chofer' },
    { label: 'Escanear QR', href: '/escaneo' },
  ],
  usuario: [
    { label: 'Buscar Rutas', href: '/busqueda' },
    { label: 'Mis Boletos', href: '/boletos' },
    { label: 'Mi Perfil', href: '/pasajero' },
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
    dataService.getConfig().then((config) => { if (active) setAppConfig(config); });
    const updateConfig = (event: Event) => {
      const detail = (event as CustomEvent<ConfiguracionAppRow>).detail;
      if (detail) setAppConfig(detail);
    };
    window.addEventListener('app-config-updated', updateConfig);
    return () => { active = false; window.removeEventListener('app-config-updated', updateConfig); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setRol(null);
    router.push('/login');
    router.refresh();
  };

  const navLinks = rol ? NAV_ITEMS_BY_ROLE[rol] || [] : [
    { label: 'Inicio', href: '/' },
    { label: 'Horarios y Destinos', href: '/busqueda' },
    { label: 'Consultar Boletos', href: '/pasajero' },
    { label: 'Acceso Clientes', href: '/login' },
  ];

  const primaryColor = appConfig?.colorPrimaria && appConfig.colorPrimaria !== '#1e3a8a'
    ? appConfig.colorPrimaria
    : '#b91c1c';

  return (
    <header className="sticky top-0 z-50 shadow-md bg-white">
      {/* Franja Superior Informativa (Estilo Cooperativa) */}
      <div className="bg-zinc-100 border-b border-zinc-200 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <span className="font-semibold tracking-wide" style={{ color: primaryColor }}>
            Bienvenidos a {appConfig?.nombreApp || 'EcuRutas · Transporte Interprovincial'}
          </span>
          <div className="hidden sm:flex items-center space-x-5 text-zinc-600">
            <Link href="/busqueda" className="font-bold hover:underline" style={{ color: primaryColor }}>
              CONSULTA NUESTRAS AGENCIAS Y RUTAS AQUÍ
            </Link>
            <span className="text-zinc-300">|</span>
            <span>Descuentos Oficiales ANT</span>
            <span className="text-zinc-300">|</span>
            <span className="font-semibold text-zinc-700">EC 🇪🇨</span>
          </div>
        </div>
      </div>

      {/* Cabecera Principal Blanca con Marca Roja y Botón Destacado */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center space-x-3 group">
            {appConfig?.logoUrl ? (
              <img src={appConfig.logoUrl} alt={appConfig.nombreApp} className="h-11 max-w-44 object-contain" />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-red-600 text-lg leading-none">★</span>
                  <span
                    className="font-black text-2xl sm:text-3xl italic tracking-tight uppercase leading-none"
                    style={{ color: primaryColor }}
                  >
                    {appConfig?.nombreApp ? appConfig.nombreApp.split(' ')[0] : 'ECURUTAS'}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-700 text-white uppercase tracking-wider">
                    UTA
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase pl-5">
                  Cooperativa de Transportes y Turismo
                </span>
              </div>
            )}
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              href="/busqueda"
              className="hidden md:inline-flex items-center justify-center px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white rounded shadow-sm transition-transform active:scale-95 hover:opacity-95"
              style={{ backgroundColor: primaryColor }}
            >
              🚌 Comprar Pasajes en Línea
            </Link>

            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            ) : rol && email ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-gray-200">
                {/* CAMPANA DE NOTIFICACIONES */}
                <NotificacionCampana />

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-gray-700">{email}</span>
                  <div>
                    <Badge variant={rol}>{rol.toUpperCase()}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-200 text-red-700 hover:bg-red-50 font-bold">
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-red-700 text-red-700 hover:bg-red-50 font-bold">
                    🔑 Iniciar Sesión / Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Navegación Roja Carmesí con Corte Diagonal */}
      <div className="w-full text-white" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-11 overflow-x-auto">
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((item, idx) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <React.Fragment key={item.href}>
                  {idx > 0 && <span className="text-red-300/60 text-xs select-none">•</span>}
                  <Link
                    href={item.href}
                    className={`relative px-3 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-white bg-black/15 border-b-4 border-amber-400'
                        : 'text-red-50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center space-x-4 text-xs font-semibold text-red-100">
            <span>📞 Atención: {appConfig?.soporteTelefono || '(03) 282-1234'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
