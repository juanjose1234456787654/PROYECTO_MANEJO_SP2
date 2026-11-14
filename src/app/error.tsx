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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/55 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="error-title" aria-describedby="error-description">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-2xl sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
            <IconAlertTriangle size={24} />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
            AVISO
          </span>
        </div>

        <div className="space-y-2">
          <h1 id="error-title" className="text-2xl font-extrabold text-neutral-900 tracking-tight">
            No pudimos cargar esta página
          </h1>
          <p id="error-description" className="text-sm leading-relaxed text-neutral-600">
            Ocurrió un problema inesperado. Puedes intentar cargarla de nuevo o volver al inicio. Si el problema continúa, inténtalo más tarde.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Intentar de nuevo
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

