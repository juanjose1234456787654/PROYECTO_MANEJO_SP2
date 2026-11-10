'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconChevronRight, IconHome } from '@/components/ui/Icons';

const ROUTE_NAMES: Record<string, string> = {
  busqueda: 'Frecuencias y Reserva de Asientos',
  pasajero: 'Historial de Boletos y QR',
  pagos: 'Registro de Comprobante de Pago',
  oficina: 'Ventanilla y Validación de Transferencias',
  chofer: 'Control de Abordaje y Escáner QR',
  cooperativa: 'Gestión de Flota y Frecuencias ANT',
  admin: 'Administración General',
  configuracion: 'Parámetros Institucionales',
  reportes: 'Métricas Financieras y Auditoría ITIL',
  login: 'Acceso al Sistema',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav
      aria-label="Ruta de navegación"
      className="bg-zinc-100/80 border-b border-zinc-200/80 text-xs text-zinc-600"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-medium text-zinc-600 hover:text-brand-700 transition-colors"
        >
          <IconHome size={14} />
          <span>Inicio</span>
        </Link>

        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/');
          const isLast = index === segments.length - 1;
          const label = ROUTE_NAMES[segment] || segment;

          return (
            <React.Fragment key={href}>
              <IconChevronRight size={14} className="text-zinc-400" />
              {isLast ? (
                <span className="font-semibold text-zinc-900" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="font-medium text-zinc-600 hover:text-brand-700 transition-colors"
                >
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
