'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { IconAlertTriangle, IconHome } from '@/components/ui/Icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error capturado en límite de página:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-neutral-200 p-8 sm:p-10 shadow-card text-left space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
            <IconAlertTriangle size={24} />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
            INTERRUPCIÓN DE SERVICIO · 500
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
            No pudimos procesar esta solicitud
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ocurrió una interrupción temporal al comunicar con el servidor de frecuencias. Tus boletos emitidos y reservas confirmadas no han sido afectados.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Reintentar carga
          </Button>
          <Link href="/">
            <Button variant="outline" size="md">
              <IconHome size={16} />
              <span>Volver al inicio</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

