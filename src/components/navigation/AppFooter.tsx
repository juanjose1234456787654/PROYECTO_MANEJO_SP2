'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/services/dataService';
import type { ConfiguracionAppRow, Json } from '@/lib/types';

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

  const primaryColor =
    config?.colorPrimaria && config.colorPrimaria !== '#1e3a8a'
      ? config.colorPrimaria
      : '#b91c1c';

  const socialLinks = [
    { label: 'Facebook', href: getSocialUrl(config?.redesSociales ?? null, 'facebook') || 'https://facebook.com' },
    { label: 'Instagram', href: getSocialUrl(config?.redesSociales ?? null, 'instagram') || 'https://instagram.com' },
    { label: 'Twitter / X', href: getSocialUrl(config?.redesSociales ?? null, 'twitter') || 'https://x.com' },
  ];

  return (
    <footer className="mt-16 bg-zinc-900 text-zinc-300 border-t-4" style={{ borderTopColor: primaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columna 1: Identidad de la Cooperativa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {config?.logoUrl ? (
                <img src={config.logoUrl} alt={config.nombreApp} className="h-10 max-w-36 object-contain bg-white p-1 rounded" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-red-500 text-lg">★</span>
                  <span className="font-black text-2xl italic tracking-tight text-white uppercase">
                    {config?.nombreApp || 'ECURUTAS'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cooperativa de Transportes y Turismo Interprovincial del Ecuador. Más de 60 años conectando Baños de Agua Santa, Ambato, Quito, Guayaquil, Cuenca y la Amazonía con seguridad, puntualidad y tecnología QR.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Columna 2: Destinos y Servicios */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Rutas y Servicios
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/busqueda?origen=Ambato&destino=Baños" className="hover:text-white transition-colors">
                  • Ambato ➔ Baños de Agua Santa
                </Link>
              </li>
              <li>
                <Link href="/busqueda?origen=Quito&destino=Baños" className="hover:text-white transition-colors">
                  • Quito (Quitumbe) ➔ Baños de Agua Santa
                </Link>
              </li>
              <li>
                <Link href="/busqueda?origen=Guayaquil&destino=Ambato" className="hover:text-white transition-colors">
                  • Guayaquil ➔ Ambato / Baños
                </Link>
              </li>
              <li>
                <Link href="/#estado-vias" className="hover:text-white transition-colors">
                  • Estado de Vías ECU 911 en Vivo
                </Link>
              </li>
              <li>
                <Link href="/pasajero" className="hover:text-white transition-colors">
                  • Descarga de Boleto Electrónico QR
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Portales y Normativa ANT */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Normativa y Portales
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  • Acceso Clientes y Personal Autorizado
                </Link>
              </li>
              <li>
                <Link href="/#preguntas-frecuentes" className="hover:text-white transition-colors">
                  • Tarifas Preferenciales ANT (50% Tercera Edad / Discapacidad)
                </Link>
              </li>
              <li>
                <Link href="/#nosotros-quejas" className="hover:text-white transition-colors">
                  • Buzón de Quejas y Sugerencias
                </Link>
              </li>
              <li>
                <Link href="/reportes" className="hover:text-white transition-colors">
                  • Transparencia y Auditoría ITIL
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto y Matrices */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Atención al Pasajero
            </h3>
            <div className="space-y-2 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">📍 Matriz Baños / Ambato:</p>
              <p>Terminal Terrestre Sur Huachi Grande / Agencia Central Thomas Halflants</p>
              <p className="pt-1">
                📞 Central Telefónica:{' '}
                <a
                  href={`tel:${(config?.soporteTelefono || '032821234').replace(/[^\d+]/g, '')}`}
                  className="text-amber-400 font-bold hover:underline"
                >
                  {config?.soporteTelefono || '(03) 274-0415 / (03) 282-1234'}
                </a>
              </p>
              <p>
                ✉️ Correo:{' '}
                <a
                  href={`mailto:${config?.soporteEmail || 'atencion@ecurutas.ec'}`}
                  className="text-red-400 hover:underline"
                >
                  {config?.soporteEmail || 'atencion@ecurutas.ec'}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Barra Inferior Legal */}
        <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} {config?.nombreApp || 'Cooperativa EcuRutas'} · Todos los derechos reservados · UTA Manejo y Configuración de Software
          </p>
          <div className="flex items-center gap-4">
            <span>Términos de Transporte ANT</span>
            <span>•</span>
            <span>Privacidad de Datos</span>
            <span>•</span>
            <span>Pagos Seguros</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
