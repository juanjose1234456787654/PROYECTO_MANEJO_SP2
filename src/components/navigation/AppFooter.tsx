'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/services/dataService';
import type { ConfiguracionAppRow, Json } from '@/lib/types';
import { IconBus, IconMapPin, IconPhone, IconMail } from '@/components/ui/Icons';

function getSocialUrl(value: Json | null, key: string): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const url = (value as Record<string, Json>)[key];
  return typeof url === 'string' && url ? url : null;
}

export function AppFooter() {
  const [config, setConfig] = useState<ConfiguracionAppRow | null>(null);

  useEffect(() => {
    let active = true;
    dataService.getConfig().then((loaded) => {
      if (active) setConfig(loaded);
    });

    const updateConfig = (event: Event) => {
      const detail = (event as CustomEvent<ConfiguracionAppRow>).detail;
      if (detail) setConfig(detail);
    };

    window.addEventListener('app-config-updated', updateConfig);
    return () => {
      active = false;
      window.removeEventListener('app-config-updated', updateConfig);
    };
  }, []);

  const legacyBlues = ['#1e3a8a', '#2563eb', '#1d4ed8', '#3b82f6', '#1e40af', '#0f172a'];
  const primaryColor =
    config?.colorPrimaria && !legacyBlues.includes(config.colorPrimaria.toLowerCase())
      ? config.colorPrimaria
      : '#b91c1c';

  const socialLinks = [
    { label: 'Facebook', href: getSocialUrl(config?.redesSociales ?? null, 'facebook') || 'https://facebook.com' },
    { label: 'Instagram', href: getSocialUrl(config?.redesSociales ?? null, 'instagram') || 'https://instagram.com' },
    { label: 'X / Twitter', href: getSocialUrl(config?.redesSociales ?? null, 'twitter') || 'https://x.com' },
  ];

  return (
    <footer className="mt-16 bg-zinc-950 text-zinc-300 border-t-4" style={{ borderTopColor: primaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Columna 1: Identidad (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              {config?.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt={config.nombreApp}
                  className="h-9 max-w-36 object-contain bg-white p-1 rounded"
                />
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <IconBus size={17} />
                  </div>
                  <span className="font-display font-extrabold text-xl tracking-tight text-white uppercase">
                    {config?.nombreApp || 'ECURUTAS'}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cooperativa de Transportes y Turismo Interprovincial. Más de 60 años operando frecuencias autorizadas entre Baños de Agua Santa, Ambato, Quito, Guayaquil, Cuenca y la región Amazónica.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 hover:border-red-700 hover:bg-red-700 text-zinc-200 hover:text-white text-xs font-semibold transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Columna 2: Frecuencias Directas (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Frecuencias Principales
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/busqueda?origen=Ambato&destino=Baños" className="hover:text-white transition-colors">
                  Ambato — Baños de Agua Santa
                </Link>
              </li>
              <li>
                <Link href="/busqueda?origen=Quito&destino=Baños" className="hover:text-white transition-colors">
                  Quito (Quitumbe) — Baños de Agua Santa
                </Link>
              </li>
              <li>
                <Link href="/busqueda?origen=Guayaquil&destino=Ambato" className="hover:text-white transition-colors">
                  Guayaquil — Ambato / Baños
                </Link>
              </li>
              <li>
                <Link href="/#estado-vias" className="hover:text-white transition-colors">
                  Reporte Vial ECU 911 en Tiempo Real
                </Link>
              </li>
              <li>
                <Link href="/pasajero" className="hover:text-white transition-colors">
                  Consulta y Descarga de Boleto QR
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Gestión y Normativa (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Normativa ANT
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Acceso de Usuarios
                </Link>
              </li>
              <li>
                <Link href="/#preguntas-frecuentes" className="hover:text-white transition-colors">
                  Tarifas Preferenciales (50%)
                </Link>
              </li>
              <li>
                <Link href="/#nosotros-quejas" className="hover:text-white transition-colors">
                  Atención al Pasajero
                </Link>
              </li>
              <li>
                <Link href="/reportes" className="hover:text-white transition-colors">
                  Auditoría Operativa ITIL
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Matrices y Boleterías (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Boletería Central
            </h3>
            <div className="space-y-2.5 text-xs text-zinc-400">
              <div className="flex items-start gap-2">
                <IconMapPin size={15} className="text-zinc-500 mt-0.5" />
                <span>Terminal Terrestre Thomas Halflants (Baños) y Terminal Sur Huachi Grande (Ambato)</span>
              </div>
              <div className="flex items-center gap-2">
                <IconPhone size={15} className="text-zinc-500" />
                <a
                  href={`tel:${(config?.soporteTelefono || '032821234').replace(/[^\d+]/g, '')}`}
                  className="text-zinc-200 font-semibold hover:text-white"
                >
                  {config?.soporteTelefono || '(03) 274-0415 / (03) 282-1234'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <IconMail size={15} className="text-zinc-500" />
                <a
                  href={`mailto:${config?.soporteEmail || 'atencion@ecurutas.ec'}`}
                  className="text-zinc-300 hover:text-white"
                >
                  {config?.soporteEmail || 'atencion@ecurutas.ec'}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} {config?.nombreApp || 'Cooperativa EcuRutas'} · Sistema de Boletería Interprovincial · UTA
          </p>
          <div className="flex items-center gap-4">
            <span>Regulación LOTTTSV / ANT</span>
            <span>•</span>
            <span>Firma QR HMAC-SHA256</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
