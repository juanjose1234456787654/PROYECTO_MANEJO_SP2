'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RolUsuario } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS_BY_ROLE: Record<RolUsuario, NavItem[]> = {
  admin: [
    { label: 'Panel General', href: '/admin' },
    { label: 'Cooperativas', href: '/cooperativa' },
    { label: 'Reportes', href: '/reportes' },
    { label: 'Configuración', href: '/configuracion' },
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setRol(null);
    router.push('/login');
    router.refresh();
  };

  const navLinks = rol ? NAV_ITEMS_BY_ROLE[rol] || [] : [];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-blue-900 tracking-tight">
              EcuRutas
            </span>
            <span className="text-xs bg-amber-500 text-white font-semibold px-2 py-0.5 rounded">
              UTA
            </span>
          </Link>

          {!loading && rol && (
            <nav className="hidden md:flex space-x-4">
              {navLinks.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
          ) : rol && email ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-gray-500">{email}</span>
                <div>
                  <Badge variant={rol}>{rol.toUpperCase()}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
