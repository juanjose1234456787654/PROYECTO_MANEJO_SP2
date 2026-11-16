'use client';

import React, { useState, useEffect } from 'react';
import type { FrecuenciaRow, ParadaFrecuenciaRow } from '@/lib/types';
import { dataService } from '@/lib/services/dataService';
import { Button } from '@/components/ui/Button';

interface ParadasFrecuenciaModalProps {
  frecuencia: FrecuenciaRow | null;
  isOpen: boolean;
  onClose: () => void;
  onParadasUpdated: (frecuenciaId: string, nuevasParadas: ParadaFrecuenciaRow[]) => void;
}

export default function ParadasFrecuenciaModal({
  frecuencia,
  isOpen,
  onClose,
  onParadasUpdated,
}: ParadasFrecuenciaModalProps) {
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevaCiudad, setNuevaCiudad] = useState('');
  const [errorAlerta, setErrorAlerta] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function cargar() {
      if (!frecuencia) return;
      setLoading(true);
      try {
        const data = await dataService.getParadas(frecuencia.id);
        if (isMounted) {
          setParadas(data.sort((a, b) => a.orden - b.orden));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (isOpen && frecuencia) {
      cargar();
    } else {
      setNuevaCiudad('');
      setErrorAlerta(null);
      setParadas([]);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, frecuencia]);

  const handleCerrar = () => {
    setNuevaCiudad('');
    setErrorAlerta(null);
    setParadas([]);
    onClose();
  };

  if (!isOpen || !frecuencia) return null;

  const handleAgregarParada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCiudad.trim()) return;
    setErrorAlerta(null);
    setIsAdding(true);

    const siguienteOrden = paradas.length > 0 ? Math.max(...paradas.map((p) => p.orden)) + 1 : 1;

    try {
      const res = await dataService.insertParadaFrecuencia({
        frecuenciaId: frecuencia.id,
        ciudad: nuevaCiudad.trim(),
        orden: siguienteOrden,
      });

      if (res.data) {
        const actualizadas = [...paradas, res.data].sort((a, b) => a.orden - b.orden);
        setParadas(actualizadas);
        setNuevaCiudad('');
        onParadasUpdated(frecuencia.id, actualizadas);
      } else {
        setErrorAlerta(res.error || 'No se pudo agregar la parada intermedia.');
      }
    } catch (err: unknown) {
      setErrorAlerta(err instanceof Error ? err.message : 'Error al guardar la parada.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEliminarParada = async (id: string) => {
    setErrorAlerta(null);
    try {
      const res = await dataService.deleteParadaFrecuencia(id);
      if (res.data) {
        const actualizadas = paradas.filter((p) => p.id !== id);
        setParadas(actualizadas);
        onParadasUpdated(frecuencia.id, actualizadas);
      } else {
        setErrorAlerta(res.error || 'No se pudo eliminar la parada intermedia.');
      }
    } catch (err: unknown) {
      setErrorAlerta(err instanceof Error ? err.message : 'Error al eliminar la parada.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <span className="text-xs font-black uppercase text-brand-600 tracking-wider">
              Itinerario Intermedio
            </span>
            <h3 className="text-lg font-black text-neutral-900">
              Gestionar Paradas: {frecuencia.origen} ➔ {frecuencia.destino}
            </h3>
            <p className="text-[11px] text-neutral-500 font-mono">
              Resolución ANT: {frecuencia.resolucionANT || 'N/A'} • Salida: {frecuencia.hora}
            </p>
          </div>
          <button
            onClick={handleCerrar}
            className="text-neutral-400 hover:text-neutral-700 text-2xl font-bold p-1 leading-none"
          >
            ×
          </button>
        </div>

        {errorAlerta && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center justify-between">
            <span>⚠️ {errorAlerta}</span>
            <button onClick={() => setErrorAlerta(null)} className="text-red-500 font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* Formulario Agregar Parada */}
        <form onSubmit={handleAgregarParada} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Nombre de ciudad intermedia (Ej: Latacunga)"
            value={nuevaCiudad}
            onChange={(e) => setNuevaCiudad(e.target.value)}
            className="flex-1 text-sm border border-neutral-300 rounded-xl px-3 py-2"
          />
          <Button type="submit" variant="primary" size="sm" isLoading={isAdding}>
            + Agregar Escala
          </Button>
        </form>

        {/* Lista de Paradas */}
        <div className="border border-neutral-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-xs text-neutral-500">Cargando paradas...</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {/* Origen */}
              <div className="px-4 py-2.5 bg-neutral-50/70 flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-black">
                    O
                  </span>
                  {frecuencia.origen} (Origen)
                </span>
                <span className="text-[10px] text-neutral-400 font-semibold">Terminal de Salida</span>
              </div>

              {/* Intermedias */}
              {paradas.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400 italic">
                  Esta frecuencia es directa. No cuenta con paradas intermedias registradas.
                </div>
              ) : (
                paradas.map((p, idx) => (
                  <div
                    key={p.id}
                    className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors"
                  >
                    <span className="font-semibold text-neutral-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                      {p.ciudad}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEliminarParada(p.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}

              {/* Destino */}
              <div className="px-4 py-2.5 bg-neutral-50/70 flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                    D
                  </span>
                  {frecuencia.destino} (Destino)
                </span>
                <span className="text-[10px] text-neutral-400 font-semibold">Terminal de Llegada</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={handleCerrar}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
