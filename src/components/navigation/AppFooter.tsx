'use client';

import { useEffect, useState } from 'react';
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

  const primaryColor = config?.colorPrimaria || '#1e3a8a';
  const socialLinks = [
    { label: 'Facebook', href: getSocialUrl(config?.redesSociales ?? null, 'facebook') },
    { label: 'Instagram', href: getSocialUrl(config?.redesSociales ?? null, 'instagram') },
    { label: 'Twitter / X', href: getSocialUrl(config?.redesSociales ?? null, 'twitter') },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <footer className="mt-auto border-t bg-white" style={{ borderTopColor: primaryColor }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt={config.nombreApp} className="h-10 max-w-36 object-contain" />
          ) : (
            <span className="font-bold" style={{ color: primaryColor }}>{config?.nombreApp || 'EcuRutas'}</span>
          )}
          <span className="text-xs text-slate-500">
            © {new Date().getFullYear()} {config?.nombreApp || 'EcuRutas'} · UTA
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {config?.soporteEmail && (
            <a href={`mailto:${config.soporteEmail}`} className="hover:underline" style={{ color: primaryColor }}>
              {config.soporteEmail}
            </a>
          )}
          {config?.soporteTelefono && (
            <a href={`tel:${config.soporteTelefono.replace(/[^\d+]/g, '')}`} className="hover:underline" style={{ color: primaryColor }}>
              {config.soporteTelefono}
            </a>
          )}
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: primaryColor }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
