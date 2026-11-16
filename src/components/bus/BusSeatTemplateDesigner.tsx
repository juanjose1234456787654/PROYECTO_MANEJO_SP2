'use client';

import React, { useState, useMemo } from 'react';
import type {
  ConfiguracionCroquis,
  PisoCroquis,
  ElementoCroquis,
  TipoBus,
  TipoElementoBus,
} from '@/lib/types';
import { derivarAsientosVIPNumeros } from '@/lib/services/flotaValidacionService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PLANTILLAS_POR_DEFECTO } from '@/data/plantillasPorDefecto';

interface BusSeatTemplateDesignerProps {
  initialConfig?: ConfiguracionCroquis;
  initialName?: string;
  initialTipoBus?: TipoBus;
  readOnly?: boolean;
  onSave?: (config: ConfiguracionCroquis, name: string) => void;
  onCancel?: () => void;
}

type HerramientaActiva = TipoElementoBus;

export default function BusSeatTemplateDesigner({
  initialConfig,
  initialName = 'Nueva Plantilla de Asientos',
  initialTipoBus = 'INTERPROVINCIAL',
  readOnly = false,
  onSave,
  onCancel,
}: BusSeatTemplateDesignerProps) {
  // Configuración base
  const defaultConfig: ConfiguracionCroquis = useMemo(() => {
    if (initialConfig) return JSON.parse(JSON.stringify(initialConfig));
    const base = PLANTILLAS_POR_DEFECTO.find((p) => p.tipoBus === initialTipoBus);
    if (base) return JSON.parse(JSON.stringify(base.configuracionJson));
    return JSON.parse(JSON.stringify(PLANTILLAS_POR_DEFECTO[0].configuracionJson));
  }, [initialConfig, initialTipoBus]);

  const [nombre, setNombre] = useState(initialName);
  const [tipoBus, setTipoBus] = useState<TipoBus>(defaultConfig.tipoBus || initialTipoBus);
  const [pisos, setPisos] = useState<1 | 2>(defaultConfig.pisos || 1);
  const [pisoActivo, setPisoActivo] = useState<1 | 2>(1);
  const [plantas, setPlantas] = useState<PisoCroquis[]>(defaultConfig.plantas || []);
  const [herramienta, setHerramienta] = useState<HerramientaActiva>('asiento_normal');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Asegura que existan plantas iniciales
  React.useEffect(() => {
    if (plantas.length === 0) {
      const p1: PisoCroquis = {
        piso: 1,
        filas: 10,
        columnas: 5,
        elementos: [],
      };
      setPlantas([p1]);
    }
  }, [plantas.length]);

  // Planta del piso actualmente seleccionado
  const plantaActual = useMemo(() => {
    let p = plantas.find((pl) => pl.piso === pisoActivo);
    if (!p) {
      p = { piso: pisoActivo, filas: 10, columnas: 5, elementos: [] };
    }
    return p;
  }, [plantas, pisoActivo]);

  // Cálculo derivado en vivo
  const configActual: ConfiguracionCroquis = useMemo(() => {
    return {
      tipoBus,
      pisos,
      capacidadTotal: 0,
      asientosVipCount: 0,
      asientosNormalCount: 0,
      asientosVipNumeros: [],
      plantillaNombre: nombre,
      plantas,
    };
  }, [tipoBus, pisos, nombre, plantas]);

  const derivado = useMemo(() => {
    return derivarAsientosVIPNumeros(configActual);
  }, [configActual]);

  // Conteo de servicios
  const serviciosDetectados = useMemo(() => {
    let banos = 0;
    let cafeterias = 0;
    let puertas = 0;
    for (const pl of plantas) {
      for (const el of pl.elementos) {
        if (el.tipo === 'bano') banos++;
        if (el.tipo === 'cafeteria') cafeterias++;
        if (el.tipo === 'puerta') puertas++;
      }
    }
    return { banos, cafeterias, puertas };
  }, [plantas]);

  // Manejo de cambio de tipo de bus con restricciones
  const handleCambiarTipoBus = (nuevoTipo: TipoBus) => {
    setTipoBus(nuevoTipo);
    if (nuevoTipo === 'URBANO') {
      setPisos(1);
      setPisoActivo(1);
      // Limpiar VIP y servicios no permitidos en buses urbanos
      setPlantas((prev) =>
        prev.slice(0, 1).map((pl) => ({
          ...pl,
          elementos: pl.elementos.map((el) => {
            if (el.tipo === 'asiento_vip') {
              return { ...el, tipo: 'asiento_normal', categoria: 'normal' };
            }
            if (el.tipo === 'bano' || el.tipo === 'cafeteria') {
              return { ...el, tipo: 'vacio', etiqueta: undefined };
            }
            return el;
          }),
        }))
      );
      if (herramienta === 'asiento_vip' || herramienta === 'bano' || herramienta === 'cafeteria') {
        setHerramienta('asiento_normal');
      }
    }
  };

  // Agregar / Quitar segundo piso (Solo Interprovincial)
  const handleToggleSegundoPiso = () => {
    if (tipoBus === 'URBANO') return;
    if (pisos === 1) {
      const nuevoPiso2: PisoCroquis = {
        piso: 2,
        filas: 10,
        columnas: 5,
        elementos: [],
      };
      setPisos(2);
      setPlantas((prev) => [...prev, nuevoPiso2]);
      setPisoActivo(2);
    } else {
      setPisos(1);
      setPisoActivo(1);
      setPlantas((prev) => prev.filter((p) => p.piso === 1));
    }
  };

  // Renumerar asientos automáticamente
  const handleRenumerar = () => {
    let contador = 1;
    const nuevasPlantas = plantas.map((pl) => {
      // Ordenar elementos por fila ascendente, luego columna ascendente
      const mapaEl = new Map<string, ElementoCroquis>();
      for (const el of pl.elementos) {
        mapaEl.set(`${el.fila}-${el.columna}`, el);
      }

      const elementosActualizados: ElementoCroquis[] = [];
      for (let f = 0; f < pl.filas; f++) {
        for (let c = 0; c < pl.columnas; c++) {
          const key = `${f}-${c}`;
          const existente = mapaEl.get(key);
          if (existente) {
            const esAsiento = existente.tipo === 'asiento_normal' || existente.tipo === 'asiento_vip';
            if (esAsiento) {
              elementosActualizados.push({
                ...existente,
                numero: contador++,
              });
            } else {
              elementosActualizados.push(existente);
            }
          }
        }
      }
      return { ...pl, elementos: elementosActualizados };
    });

    setPlantas(nuevasPlantas);
  };

  // Click en una celda de la cuadrícula
  const handleCellClick = (fila: number, columna: number) => {
    if (readOnly) return;

    setPlantas((prevPlantas) => {
      return prevPlantas.map((pl) => {
        if (pl.piso !== pisoActivo) return pl;

        const elId = `p${pl.piso}-${fila}-${columna}`;
        const index = pl.elementos.findIndex((e) => e.fila === fila && e.columna === columna);

        if (herramienta === 'vacio') {
          // Eliminar elemento de la celda
          return {
            ...pl,
            elementos: pl.elementos.filter((_, i) => i !== index),
          };
        }

        const nuevoElemento: ElementoCroquis = {
          id: elId,
          fila,
          columna,
          tipo: herramienta,
          piso: pl.piso,
          categoria: herramienta === 'asiento_vip' ? 'vip' : 'normal',
          etiqueta:
            herramienta === 'chofer'
              ? 'Chofer'
              : herramienta === 'bano'
              ? 'Baño'
              : herramienta === 'cafeteria'
              ? 'Café'
              : herramienta === 'puerta'
              ? fila === 0
                ? 'P. Delantera'
                : 'P. Trasera'
              : undefined,
        };

        let nuevosElementos = [...pl.elementos];
        if (index >= 0) {
          nuevosElementos[index] = nuevoElemento;
        } else {
          nuevosElementos.push(nuevoElemento);
        }

        return {
          ...pl,
          elementos: nuevosElementos,
        };
      });
    });
  };

  // Modificar filas de la planta activa
  const handleAgregarFila = () => {
    if (readOnly) return;
    setPlantas((prev) =>
      prev.map((pl) => (pl.piso === pisoActivo ? { ...pl, filas: Math.min(16, pl.filas + 1) } : pl))
    );
  };

  const handleQuitarFila = () => {
    if (readOnly || plantaActual.filas <= 4) return;
    setPlantas((prev) =>
      prev.map((pl) =>
        pl.piso === pisoActivo
          ? {
              ...pl,
              filas: pl.filas - 1,
              elementos: pl.elementos.filter((e) => e.fila < pl.filas - 1),
            }
          : pl
      )
    );
  };

  // Guardar plantilla
  const handleGuardar = () => {
    if (!nombre.trim()) {
      setErrorMsg('Debe ingresar un nombre identificativo para la plantilla.');
      return;
    }
    if (derivado.capacidadTotal <= 0) {
      setErrorMsg('La plantilla debe contener al menos 1 asiento de pasajero.');
      return;
    }
    setErrorMsg(null);

    // Ejecutar renumeración final para consistencia
    handleRenumerar();

    if (onSave) {
      onSave(configActual, nombre.trim());
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden p-6 space-y-6">
      {/* Cabecera y Selección de Nombre / Tipo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">💺</span>
            <h2 className="text-xl font-black text-neutral-900">Diseñador Visual de Croquis y Asientos</h2>
            <Badge variant={tipoBus === 'URBANO' ? 'neutral' : 'cooperativa'}>
              {tipoBus}
            </Badge>
            {pisos === 2 && <Badge variant="warning">2 Pisos</Badge>}
          </div>
          <p className="text-xs text-neutral-500">
            Configure la distribución espacial de la unidad según la resolución ANT. Los asientos VIP sincronizan
            automáticamente la venta de pasajes.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          {!readOnly && onSave && (
            <Button variant="primary" size="sm" onClick={handleGuardar}>
              Guardar Plantilla
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold ml-2">×</button>
        </div>
      )}

      {/* Controles de Configuración General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-50/70 p-4 rounded-2xl border border-neutral-200/80">
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
            Nombre de la Plantilla
          </label>
          <input
            type="text"
            disabled={readOnly}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full text-sm font-semibold border border-neutral-300 rounded-xl px-3 py-2 bg-white"
            placeholder="Ej: Interprovincial Estándar 40 Asientos"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
            Modalidad de Bus
          </label>
          <div className="flex rounded-xl overflow-hidden border border-neutral-300 bg-white p-0.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => handleCambiarTipoBus('URBANO')}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                tipoBus === 'URBANO'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Urbano
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => handleCambiarTipoBus('INTERPROVINCIAL')}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                tipoBus === 'INTERPROVINCIAL'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Interprovincial
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
            Estructura de Pisos
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-600">
              {pisos === 1 ? '1 Piso (Planta Baja)' : '2 Pisos (Doble Planta)'}
            </span>
            {tipoBus === 'INTERPROVINCIAL' && !readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSegundoPiso}
                className="text-xs py-1 px-3 ml-auto"
              >
                {pisos === 1 ? '+ Agregar Piso 2' : 'Eliminar Piso 2'}
              </Button>
            )}
          </div>
          {tipoBus === 'URBANO' && (
            <span className="text-[10px] text-neutral-400 block mt-1">
              Normativa ANT: Los buses urbanos no permiten configuración de dos pisos.
            </span>
          )}
        </div>
      </div>

      {/* Selector de Piso si es Doble Planta */}
      {pisos === 2 && (
        <div className="flex border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setPisoActivo(1)}
            className={`py-2 px-6 font-black text-xs border-b-2 transition-all ${
              pisoActivo === 1
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            🏢 Primer Piso (Planta Baja)
          </button>
          <button
            type="button"
            onClick={() => setPisoActivo(2)}
            className={`py-2 px-6 font-black text-xs border-b-2 transition-all ${
              pisoActivo === 2
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            🏢 Segundo Piso (Panorámico)
          </button>
        </div>
      )}

      {/* Paleta de Herramientas de Edición */}
      {!readOnly && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-neutral-600 tracking-wider">
              Paleta de Elementos (Haga clic en una herramienta y luego en el croquis):
            </span>
            <Button variant="outline" size="sm" onClick={handleRenumerar} className="text-xs py-1">
              🔢 Renumerar Asientos
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHerramienta('asiento_normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                herramienta === 'asiento_normal'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                  : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span>💺</span> Asiento Normal
            </button>

            <button
              type="button"
              disabled={tipoBus === 'URBANO'}
              onClick={() => setHerramienta('asiento_vip')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                tipoBus === 'URBANO'
                  ? 'opacity-40 cursor-not-allowed bg-neutral-100 border-neutral-200 text-neutral-400'
                  : herramienta === 'asiento_vip'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title={tipoBus === 'URBANO' ? 'No permitido en buses urbanos' : 'Asiento VIP con recargo'}
            >
              <span>⭐</span> Asiento VIP {tipoBus === 'URBANO' && '(No urbano)'}
            </button>

            <button
              type="button"
              onClick={() => setHerramienta('pasillo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                herramienta === 'pasillo'
                  ? 'bg-neutral-700 text-white border-neutral-700 shadow-md'
                  : 'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200'
              }`}
            >
              <span>🚶</span> Pasillo
            </button>

            <button
              type="button"
              onClick={() => setHerramienta('puerta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                herramienta === 'puerta'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>🚪</span> Puerta
            </button>

            <button
              type="button"
              disabled={tipoBus === 'URBANO'}
              onClick={() => setHerramienta('bano')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                tipoBus === 'URBANO'
                  ? 'opacity-40 cursor-not-allowed bg-neutral-100 border-neutral-200 text-neutral-400'
                  : herramienta === 'bano'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
              }`}
            >
              <span>🚻</span> Baño
            </button>

            <button
              type="button"
              disabled={tipoBus === 'URBANO'}
              onClick={() => setHerramienta('cafeteria')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                tipoBus === 'URBANO'
                  ? 'opacity-40 cursor-not-allowed bg-neutral-100 border-neutral-200 text-neutral-400'
                  : herramienta === 'cafeteria'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                  : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span>☕</span> Cafetería
            </button>

            <button
              type="button"
              onClick={() => setHerramienta('chofer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                herramienta === 'chofer'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                  : 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>🧑‍✈️</span> Chofer
            </button>

            <button
              type="button"
              onClick={() => setHerramienta('vacio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ml-auto ${
                herramienta === 'vacio'
                  ? 'bg-red-600 text-white border-red-600 shadow-md'
                  : 'bg-neutral-50 text-red-600 border-red-200 hover:bg-red-50'
              }`}
            >
              <span>🗑️</span> Borrar / Vacío
            </button>
          </div>
        </div>
      )}

      {/* Área del Croquis (Bus Front to Back) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Chasis exterior del Bus */}
        <div className="flex-1 w-full bg-neutral-900/5 rounded-3xl p-6 border-2 border-neutral-300 relative flex flex-col items-center">
          {/* Frente del bus */}
          <div className="w-48 h-8 bg-neutral-800 rounded-t-3xl flex items-center justify-center text-[10px] font-black uppercase text-neutral-300 tracking-widest shadow-inner mb-3">
            ▲ Frente / Parabrisas ▲
          </div>

          {/* Cuadrícula de Asientos */}
          <div className="space-y-1.5 w-full max-w-md">
            {Array.from({ length: plantaActual.filas }).map((_, fIdx) => (
              <div key={fIdx} className="grid grid-cols-5 gap-2 items-center">
                {Array.from({ length: plantaActual.columnas }).map((_, cIdx) => {
                  const el = plantaActual.elementos.find((e) => e.fila === fIdx && e.columna === cIdx);
                  const tipo = el?.tipo || 'vacio';

                  return (
                    <button
                      key={`${fIdx}-${cIdx}`}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(fIdx, cIdx)}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all relative select-none ${
                        tipo === 'asiento_normal'
                          ? 'bg-blue-600 text-white shadow hover:brightness-110 border border-blue-700'
                          : tipo === 'asiento_vip'
                          ? 'bg-amber-500 text-white shadow-md hover:brightness-110 border border-amber-600 ring-1 ring-amber-300'
                          : tipo === 'chofer'
                          ? 'bg-slate-800 text-slate-100 border border-slate-900'
                          : tipo === 'puerta'
                          ? 'bg-emerald-500 text-white border border-emerald-600 text-[9px]'
                          : tipo === 'bano'
                          ? 'bg-cyan-600 text-white border border-cyan-700 text-[9px]'
                          : tipo === 'cafeteria'
                          ? 'bg-purple-600 text-white border border-purple-700 text-[9px]'
                          : tipo === 'pasillo'
                          ? 'bg-neutral-200/60 text-neutral-400 border border-dashed border-neutral-300'
                          : 'bg-white/80 border border-dashed border-neutral-200 hover:border-brand-400 text-neutral-300'
                      }`}
                      title={`Fila ${fIdx + 1}, Columna ${cIdx + 1}: ${tipo}`}
                    >
                      {tipo === 'asiento_normal' && (
                        <>
                          <span className="text-[10px] opacity-80 leading-none">N</span>
                          <span className="text-sm font-black leading-none">{el?.numero || '•'}</span>
                        </>
                      )}
                      {tipo === 'asiento_vip' && (
                        <>
                          <span className="text-[9px] text-amber-200 font-extrabold leading-none">VIP ⭐</span>
                          <span className="text-sm font-black leading-none">{el?.numero || '•'}</span>
                        </>
                      )}
                      {tipo === 'chofer' && (
                        <>
                          <span className="text-sm">🧑‍✈️</span>
                          <span className="text-[8px] uppercase">Chofer</span>
                        </>
                      )}
                      {tipo === 'puerta' && (
                        <>
                          <span className="text-xs">🚪</span>
                          <span className="text-[8px] font-bold">Puerta</span>
                        </>
                      )}
                      {tipo === 'bano' && (
                        <>
                          <span className="text-xs">🚻</span>
                          <span className="text-[8px] font-bold">WC</span>
                        </>
                      )}
                      {tipo === 'cafeteria' && (
                        <>
                          <span className="text-xs">☕</span>
                          <span className="text-[8px] font-bold">Café</span>
                        </>
                      )}
                      {tipo === 'pasillo' && <span className="text-[10px] text-neutral-400 font-mono">║</span>}
                      {tipo === 'vacio' && <span className="text-[9px] text-neutral-300">+</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Parte trasera del bus */}
          <div className="w-48 h-6 bg-neutral-800 rounded-b-2xl flex items-center justify-center text-[9px] font-bold uppercase text-neutral-400 tracking-wider shadow-inner mt-4">
            ▼ Parte Posterior ▼
          </div>

          {/* Botones para agregar o quitar filas */}
          {!readOnly && (
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleAgregarFila} className="text-xs">
                + Agregar Fila Posterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuitarFila}
                disabled={plantaActual.filas <= 4}
                className="text-xs"
              >
                - Quitar Última Fila
              </Button>
            </div>
          )}
        </div>

        {/* Panel Lateral: Resumen Técnico ANT y Leyenda */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-4">
            <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>📊</span> Resumen Operativo ANT
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="text-xs font-bold text-neutral-600">Capacidad Pasajeros:</span>
                <span className="text-base font-black text-brand-900">{derivado.capacidadTotal}</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <span>💺</span> Asientos Normales:
                </span>
                <span className="text-sm font-black text-blue-900">{derivado.asientosNormalCount}</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                  <span>⭐</span> Asientos VIP:
                </span>
                <span className="text-sm font-black text-amber-900">{derivado.asientosVipCount}</span>
              </div>

              {derivado.asientosVIPNumeros.length > 0 && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                  <span className="font-black">Números VIP detectados: </span>
                  <span className="font-mono">{derivado.asientosVIPNumeros.join(', ')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200 space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Puertas de acceso:</span>
                  <span className="font-black text-neutral-900">{serviciosDetectados.puertas}</span>
                </div>
                <div className="flex justify-between">
                  <span>Servicio de Baño:</span>
                  <span className="font-black text-neutral-900">
                    {serviciosDetectados.banos > 0 ? 'Habilitado' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cafetería a bordo:</span>
                  <span className="font-black text-neutral-900">
                    {serviciosDetectados.cafeterias > 0 ? 'Habilitado' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Leyenda de Ayuda */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200 space-y-2 text-xs text-neutral-600">
            <span className="font-black text-neutral-800 text-[11px] uppercase tracking-wider block">
              Reglas de Negocio EcuRutas:
            </span>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside">
              <li>Los asientos marcados como VIP aplican recargo reglamentario en boletería.</li>
              <li>Buses urbanos no admiten categoría VIP por disposición de transporte público.</li>
              <li>Al renumerar, los asientos se numeran correlativamente de frente hacia atrás.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
