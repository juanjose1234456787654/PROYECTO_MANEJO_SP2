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

  const socialLinks = [
    { label: 'Facebook', href: getSocialUrl(config?.redesSociales ?? null, 'facebook') || 'https://facebook.com' },
    { label: 'Instagram', href: getSocialUrl(config?.redesSociales ?? null, 'instagram') || 'https://instagram.com' },
    { label: 'X / Twitter', href: getSocialUrl(config?.redesSociales ?? null, 'twitter') || 'https://x.com' },
  ];

  return (
    <footer className="mt-16 bg-neutral-950 text-neutral-300 border-t-4 border-t-brand-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-brand-700">
                    <IconBus size={17} />
                  </div>
                  <span className="font-display font-extrabold text-xl tracking-tight text-white uppercase">
                    {config?.nombreApp || 'ECURUTAS'}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Cooperativa de Transportes y Turismo Interprovincial. Más de 60 años operando frecuencias autorizadas entre Baños de Agua Santa, Ambato, Quito, Guayaquil, Cuenca y la región Amazónica.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-brand-700 hover:bg-brand-700 text-neutral-200 hover:text-white text-xs font-semibold transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Frecuencias Principales
            </h3>
            <ul className="space-y-2 text-xs text-neutral-400">
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

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Normativa ANT
            </h3>
            <ul className="space-y-2 text-xs text-neutral-400">
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
                  Reportes Operativos
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Boletería Central
            </h3>
            <div className="space-y-2.5 text-xs text-neutral-400">
              <div className="flex items-start gap-2">
                <IconMapPin size={15} className="text-neutral-500 mt-0.5" />
                <span>Terminal Terrestre Thomas Halflants (Baños) y Terminal Sur Huachi Grande (Ambato)</span>
              </div>
              <div className="flex items-center gap-2">
                <IconPhone size={15} className="text-neutral-500" />
                <a
                  href={`tel:${(config?.soporteTelefono || '032821234').replace(/[^\d+]/g, '')}`}
                  className="text-neutral-200 font-semibold hover:text-white"
                >
                  {config?.soporteTelefono || '(03) 274-0415 / (03) 282-1234'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <IconMail size={15} className="text-neutral-500" />
                <a
                  href={`mailto:${config?.soporteEmail || 'atencion@ecurutas.ec'}`}
                  className="text-neutral-300 hover:text-white"
                >
                  {config?.soporteEmail || 'atencion@ecurutas.ec'}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            © {new Date().getFullYear()} {config?.nombreApp || 'Cooperativa EcuRutas'} · Sistema de Boletería Interprovincial
          </p>
          <div className="flex items-center gap-4">
            <span>Operación regulada por LOTTTSV / ANT</span>
            <span>•</span>
            <span>Boleto electrónico con código QR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
