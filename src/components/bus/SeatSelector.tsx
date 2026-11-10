'use client';

import { useMemo, useState } from 'react';

type Piso = 1 | 2;

interface SeatSelectorProps {
  capacidad: number;
  asientosVIP: number | null;
  asientosVIPNumeros: number[] | null;
  asientosOcupados: number[];
  maxSeleccionables?: number;
  onChange: (seleccionados: number[]) => void;
  pisos?: Piso;
  /** Permite sincronizar la selección con el formulario que contiene el selector. */
  seleccionados?: number[];
}

interface FilaAsientos {
  tipo: 'normal' | 'vip';
  izquierda: number[];
  derecha: number[];
}

function crearFilas(numeros: number[], vip: Set<number>): FilaAsientos[] {
  const asientosVip = numeros.filter((numero) => vip.has(numero));
  const asientosNormales = numeros.filter((numero) => !vip.has(numero));
  const filasVip = asientosVip.map((numero): FilaAsientos => ({
    tipo: 'vip',
    izquierda: [],
    derecha: [numero],
  }));
  const filasNormales: FilaAsientos[] = [];

  for (let index = 0; index < asientosNormales.length; index += 4) {
    const fila = asientosNormales.slice(index, index + 4);
    filasNormales.push({
      tipo: 'normal',
      izquierda: fila.slice(0, 2),
      derecha: fila.slice(2, 4),
    });
  }

  return [...filasVip, ...filasNormales];
}

export function SeatSelector({
  capacidad,
  asientosVIP,
  asientosVIPNumeros,
  asientosOcupados,
  maxSeleccionables = 1,
  onChange,
  pisos = 1,
  seleccionados,
}: SeatSelectorProps) {
  const [seleccionInterna, setSeleccionInterna] = useState<number[]>([]);
  const [pisoActivo, setPisoActivo] = useState<Piso>(1);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);

  const totalAsientos = Number.isFinite(capacidad) ? Math.max(0, Math.floor(capacidad)) : 0;
  const maximo = Number.isFinite(maxSeleccionables)
    ? Math.max(1, Math.floor(maxSeleccionables))
    : 1;
  const seleccionActual = seleccionados ?? seleccionInterna;
  const asientosOcupadosSet = useMemo(() => new Set(asientosOcupados), [asientosOcupados]);

  const numerosVip = useMemo(() => {
    const validos = !Array.isArray(asientosVIPNumeros)
      ? Array.from({ length: Math.min(totalAsientos, Math.max(0, asientosVIP ?? 0)) }, (_, i) => i + 1)
      : asientosVIPNumeros;
    return new Set(validos.filter((numero) => Number.isInteger(numero) && numero >= 1 && numero <= totalAsientos));
  }, [asientosVIPNumeros, asientosVIP, totalAsientos]);

  const inicioPisoDos = Math.ceil(totalAsientos / 2);
  const numerosPiso = useMemo(() => {
    const inicio = pisos === 2 && pisoActivo === 2 ? inicioPisoDos + 1 : 1;
    const fin = pisos === 2 && pisoActivo === 1 ? inicioPisoDos : totalAsientos;
    return Array.from({ length: Math.max(0, fin - inicio + 1) }, (_, index) => inicio + index);
  }, [inicioPisoDos, pisoActivo, pisos, totalAsientos]);

  const filas = useMemo(() => crearFilas(numerosPiso, numerosVip), [numerosPiso, numerosVip]);
  const seleccionValida = seleccionActual.filter(
    (numero) => numero >= 1 && numero <= totalAsientos && !asientosOcupadosSet.has(numero)
  );

  const cambiarSeleccion = (nuevaSeleccion: number[]) => {
    setLimiteAlcanzado(false);
    if (seleccionados === undefined) setSeleccionInterna(nuevaSeleccion);
    onChange(nuevaSeleccion);
  };

  const alternarAsiento = (numero: number) => {
    if (asientosOcupadosSet.has(numero)) return;

    if (seleccionValida.includes(numero)) {
      cambiarSeleccion(seleccionValida.filter((seleccionado) => seleccionado !== numero));
      return;
    }

    if (maximo === 1) {
      cambiarSeleccion([numero]);
      return;
    }

    if (seleccionValida.length >= maximo) {
      setLimiteAlcanzado(true);
      return;
    }

    cambiarSeleccion([...seleccionValida, numero]);
  };

  const renderAsiento = (numero: number) => {
    const ocupado = asientosOcupadosSet.has(numero);
    const seleccionado = seleccionValida.includes(numero);
    const vip = numerosVip.has(numero);
    const estado = ocupado ? 'ocupado' : seleccionado ? 'seleccionado' : 'libre';
    const tipo = vip ? 'VIP' : 'normal';
    const clases = ocupado
      ? 'border-brand-300 bg-brand-100 text-brand-800 cursor-not-allowed'
      : seleccionado
        ? 'border-success-700 bg-success-600 text-white shadow-md ring-2 ring-success-300'
        : vip
          ? 'border-accent-400 bg-accent-100 text-accent-950 hover:bg-accent-200'
          : 'border-neutral-300 bg-white text-neutral-800 hover:border-success-500 hover:bg-success-50';

    return (
      <button
        key={numero}
        type="button"
        disabled={ocupado}
        aria-pressed={seleccionado}
        aria-label={`Asiento ${numero}, ${tipo}, ${estado}`}
        title={`Asiento ${numero} · ${tipo} · ${estado}`}
        onClick={() => alternarAsiento(numero)}
        className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${clases}`}
      >
        <span>{numero}</span>
        {vip && <span className="text-[9px] leading-3">VIP</span>}
        {seleccionado && <span aria-hidden="true" className="text-[9px] leading-3">✓</span>}
      </button>
    );
  };

  return (
    <section aria-label="Selector interactivo de asientos" className="mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Frente del bus</p>
          <h3 className="font-bold text-neutral-900">Cabina del conductor</h3>
        </div>
        <span aria-hidden="true" className="text-2xl">🚌</span>
      </div>

      {pisos === 2 && (
        <div role="tablist" aria-label="Pisos del bus" className="mb-4 flex gap-2">
          {([1, 2] as const).map((piso) => (
            <button
              key={piso}
              type="button"
              role="tab"
              aria-selected={pisoActivo === piso}
              onClick={() => setPisoActivo(piso)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${pisoActivo === piso ? 'bg-brand-700 text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100'}`}
            >
              Piso {piso}
            </button>
          ))}
        </div>
      )}

      <ul aria-label="Leyenda de asientos" className="mb-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-4 w-4 rounded border border-neutral-300 bg-white" />Libre</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-4 w-4 rounded bg-neutral-300" />Ocupado</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-4 w-4 rounded bg-success-600" />Seleccionado</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-4 w-4 rounded bg-accent-300" />VIP</li>
      </ul>

      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
        {filas.map((fila, index) => (
          <div key={`${fila.tipo}-${fila.izquierda[0] ?? fila.derecha[0] ?? index}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex justify-end gap-2">{fila.izquierda.map(renderAsiento)}</div>
            <span aria-hidden="true" className="w-8 text-center text-[10px] font-mono text-neutral-400">{index + 1}</span>
            <div className="flex justify-start gap-2">{fila.derecha.map(renderAsiento)}</div>
          </div>
        ))}
        {filas.length === 0 && <p className="py-4 text-center text-sm text-neutral-500">Este piso no tiene asientos configurados.</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
        <p className="text-neutral-700">
          Seleccionados: {seleccionValida.length ? seleccionValida.map((numero) => `#${numero}`).join(', ') : 'ninguno'}
        </p>
        <p className="text-neutral-500">Máximo: {maximo}</p>
      </div>
      {limiteAlcanzado && <p role="status" className="mt-2 text-sm font-medium text-brand-700">Puedes seleccionar hasta {maximo} asiento{maximo === 1 ? '' : 's'}.</p>}
    </section>
  );
}
