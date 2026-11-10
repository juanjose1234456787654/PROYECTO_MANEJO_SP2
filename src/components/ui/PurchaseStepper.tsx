import React from 'react';
import Link from 'next/link';
import { IconCheckCircle } from '@/components/ui/Icons';

export interface PurchaseStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

const STEPS = [
  { step: 1, label: 'Ruta y Horario', href: '/busqueda' },
  { step: 2, label: 'Selección de Asientos', href: '/busqueda' },
  { step: 3, label: 'Datos del Pasajero', href: '/busqueda' },
  { step: 4, label: 'Comprobante de Pago', href: '/pagos' },
  { step: 5, label: 'Boleto QR Emitido', href: '/pasajero' },
];

export function PurchaseStepper({ currentStep }: PurchaseStepperProps) {
  return (
    <div
      aria-label="Progreso de compra de pasaje"
      className="bg-white rounded-xl border border-zinc-200 px-4 py-3.5 shadow-sm"
    >
      <ol className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STEPS.map((item) => {
          const isCompleted = item.step < currentStep;
          const isActive = item.step === currentStep;

          return (
            <li key={item.step} className="flex items-center gap-2.5">
              <Link
                href={item.href}
                className="group flex items-center gap-2.5 focus:outline-none"
              >
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-700 text-white'
                      : isActive
                      ? 'bg-red-700 text-white ring-4 ring-red-100'
                      : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                  }`}
                >
                  {isCompleted ? <IconCheckCircle size={14} /> : item.step}
                </span>
                <span
                  className={`text-xs font-semibold leading-tight transition-colors ${
                    isActive
                      ? 'text-red-700 font-bold'
                      : isCompleted
                      ? 'text-zinc-700 group-hover:text-red-700'
                      : 'text-zinc-400 group-hover:text-zinc-600'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
