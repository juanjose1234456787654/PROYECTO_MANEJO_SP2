import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { IconBus, IconSearch, IconHome } from '@/components/ui/Icons';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-zinc-200 p-8 sm:p-10 shadow-card text-left space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center">
            <IconBus size={24} />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
            ERROR HTTP 404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Andén o página no encontrada
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            La dirección que intentaste consultar no corresponde a una ruta o módulo activo dentro del sistema de boletería de la cooperativa.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link href="/">
            <Button variant="primary" size="md">
              <IconHome size={16} />
              <span>Ir a Portada Principal</span>
            </Button>
          </Link>
          <Link href="/busqueda">
            <Button variant="outline" size="md">
              <IconSearch size={16} />
              <span>Consultar Frecuencias</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

