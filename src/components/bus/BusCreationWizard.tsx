'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ComboBox } from '@/components/ui/ComboBox';
import type {
  BusRow,
  TipoBus,
  ConfiguracionCroquis,
  PlantillaBusRow,
} from '@/lib/types';
import {
  validarDiscoBus,
  formatearYValidarPlaca,
  derivarAsientosVIPNumeros,
} from '@/lib/services/flotaValidacionService';
import { dataService } from '@/lib/services/dataService';
import {
  obtenerCatalogoMarcas,
  obtenerCatalogoCarrocerias,
} from '@/data/catalogosFlota';
import BusSeatTemplateDesigner from './BusSeatTemplateDesigner';

export interface BusCreationWizardProps {
  cooperativaId: string;
  gruposBuses?: Array<{ id: string; nombre: string }>;
  busToEdit?: BusRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bus: BusRow) => void;
}

export default function BusCreationWizard({
  cooperativaId,
  gruposBuses = [],
  busToEdit = null,
  isOpen,
  onClose,
  onSuccess,
}: BusCreationWizardProps) {
  const isEditing = Boolean(busToEdit);
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1: Tipo y Modalidad
  const [tipoBus, setTipoBus] = useState<TipoBus>(
    (busToEdit?.tipoBus as TipoBus) || 'INTERPROVINCIAL'
  );
  const [grupoBusId, setGrupoBusId] = useState<string | null>(
    busToEdit?.grupoBusId || null
  );
  const [chasis, setChasis] = useState(busToEdit?.chasis || '');

  // Paso 2: Identificación Oficial
  const [numeroDisco, setNumeroDisco] = useState<string>(
    busToEdit ? String(busToEdit.numero) : ''
  );
  const [placa, setPlaca] = useState<string>(busToEdit?.placa || '');
  const [marca, setMarca] = useState<string>(busToEdit?.marca || 'Hino');
  const [carroceria, setCarroceria] = useState<string>(
    busToEdit?.carroceria || 'Marcopolo'
  );
  const [fotoUrl, setFotoUrl] = useState<string>(
    busToEdit?.fotoUrl ||
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
  );

  // Paso 3: Plantilla y Distribución
  const [plantillas, setPlantillas] = useState<PlantillaBusRow[]>([]);
  const [plantillaSeleccionadaId, setPlantillaSeleccionadaId] = useState<string>(
    busToEdit?.plantillaId || ''
  );
  const [distribucionPersonalizada, setDistribucionPersonalizada] =
    useState<ConfiguracionCroquis | null>(
      busToEdit?.distribucionAsientos || null
    );
  const [mostrandoEditorAsientos, setMostrandoEditorAsientos] = useState(false);
  const [mostrarTodasPlantillas, setMostrarTodasPlantillas] = useState(false);

  // Errores y estado de guardado
  const [errorAlerta, setErrorAlerta] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar plantillas de flota
  useEffect(() => {
    let isMounted = true;
    async function cargar() {
      const res = await dataService.fetchPlantillasBus(cooperativaId);
      if (isMounted && res.data) {
        setPlantillas(res.data);
        if (!plantillaSeleccionadaId && res.data.length > 0) {
          const compatible =
            res.data.find((p) => p.tipoBus === tipoBus) || res.data[0];
          setPlantillaSeleccionadaId(compatible.id);
        }
      }
    }
    if (isOpen) {
      cargar();
    }
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cooperativaId, tipoBus]);

  // Si cambia el tipo de bus, sincronizar plantilla por defecto compatible
  const handleCambiarTipoBus = (nuevoTipo: TipoBus) => {
    setTipoBus(nuevoTipo);
    const compatible = plantillas.find((p) => p.tipoBus === nuevoTipo);
    if (compatible) {
      setPlantillaSeleccionadaId(compatible.id);
      setDistribucionPersonalizada(null);
    }
  };

  // Plantillas visibles según filtro de modalidad o ver todas
  const plantillasVisibles = useMemo(() => {
    if (mostrarTodasPlantillas) return plantillas;
    const compatibles = plantillas.filter((p) => p.tipoBus === tipoBus);
    return compatibles.length > 0 ? compatibles : plantillas;
  }, [plantillas, tipoBus, mostrarTodasPlantillas]);

  // Plantilla maestra seleccionada
  const plantillaSeleccionada = useMemo(() => {
    return plantillas.find((p) => p.id === plantillaSeleccionadaId) || null;
  }, [plantillas, plantillaSeleccionadaId]);

  // Manejo de cambio de plantilla en paso 3: recalcula siempre desde la nueva plantilla elegida
  const handleSeleccionarPlantilla = (id: string) => {
    setPlantillaSeleccionadaId(id);
    // Limpiar cualquier personalización previa para que el resumen se derive limpiamente de la nueva plantilla seleccionada
    setDistribucionPersonalizada(null);
  };

  // Distribución activa calculada (prioriza personalización si existe, de lo contrario la plantilla seleccionada)
  const croquisActivo: ConfiguracionCroquis | null = useMemo(() => {
    if (distribucionPersonalizada) return distribucionPersonalizada;
    if (plantillaSeleccionada?.configuracionJson) return plantillaSeleccionada.configuracionJson;
    return null;
  }, [distribucionPersonalizada, plantillaSeleccionada]);

  // Derivados automáticos de asientos VIP y capacidad: SIEMPRE calculados dinámicamente desde el croquis activo
  const resumenAsientos = useMemo(() => {
    if (croquisActivo && croquisActivo.plantas && croquisActivo.plantas.length > 0) {
      return derivarAsientosVIPNumeros(croquisActivo);
    }
    if (plantillaSeleccionada) {
      if (plantillaSeleccionada.configuracionJson) {
        return derivarAsientosVIPNumeros(plantillaSeleccionada.configuracionJson);
      }
      return {
        capacidadTotal: plantillaSeleccionada.capacidadTotal,
        asientosVipCount: 0,
        asientosNormalCount: plantillaSeleccionada.capacidadTotal,
        asientosVIPNumeros: [],
      };
    }
    return {
      capacidadTotal: 0,
      asientosVipCount: 0,
      asientosNormalCount: 0,
      asientosVIPNumeros: [],
    };
  }, [croquisActivo, plantillaSeleccionada]);

  // Validaciones en vivo
  const validacionDisco = useMemo(() => validarDiscoBus(numeroDisco), [numeroDisco]);
  const validacionPlaca = useMemo(() => formatearYValidarPlaca(placa), [placa]);

  // Formatear placa al desenfocar o escribir
  const handlePlacaBlur = () => {
    if (placa.trim()) {
      const res = formatearYValidarPlaca(placa);
      if (res.ok && res.valor) {
        setPlaca(res.valor);
      }
    }
  };

  // Opciones de ComboBox
  const opcionesMarcas = useMemo(() => {
    return obtenerCatalogoMarcas().map((m) => ({
      label: m.nombre,
      value: m.nombre,
      description: m.descripcion,
    }));
  }, []);

  const opcionesCarrocerias = useMemo(() => {
    return obtenerCatalogoCarrocerias().map((c) => ({
      label: c.nombre,
      value: c.nombre,
      description: c.descripcion,
    }));
  }, []);

  // Navegación de pasos
  const handleSiguiente = () => {
    setErrorAlerta(null);
    if (paso === 1) {
      setPaso(2);
      return;
    }
    if (paso === 2) {
      if (!validacionDisco.ok) {
        setErrorAlerta(validacionDisco.error || 'Número de disco inválido.');
        return;
      }
      if (!validacionPlaca.ok) {
        setErrorAlerta(
          validacionPlaca.error ||
            'Formato de placa inválido. Ejemplo: ABC-0456 o ABC-456.'
        );
        return;
      }
      if (!marca.trim()) {
        setErrorAlerta('Debe indicar la marca o chasis de la unidad.');
        return;
      }
      if (!carroceria.trim()) {
        setErrorAlerta('Debe indicar la carrocería de la unidad.');
        return;
      }
      setPaso(3);
    }
  };

  const handleAtras = () => {
    setErrorAlerta(null);
    if (paso > 1) {
      setPaso((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // Guardar Bus Final
  const handleGuardar = async () => {
    setErrorAlerta(null);
    setIsSubmitting(true);

    const placaFinal = validacionPlaca.valor || placa.toUpperCase().trim();
    const discoFinal = validacionDisco.valor || Number(numeroDisco);

    const busPayload: Omit<BusRow, 'id'> = {
      cooperativaId,
      grupoBusId: grupoBusId || null,
      numero: discoFinal,
      placa: placaFinal,
      chasis: chasis || `${marca} Modelo 2026`,
      carroceria: carroceria.trim(),
      marca: marca.trim(),
      fotoUrl:
        fotoUrl.trim() ||
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      capacidad: resumenAsientos.capacidadTotal,
      asientosVIP: resumenAsientos.asientosVipCount,
      asientosVIPNumeros: resumenAsientos.asientosVIPNumeros,
      diasParada: busToEdit?.diasParada || [1],
      activo: busToEdit ? busToEdit.activo : true,
      tipoBus,
      plantillaId: plantillaSeleccionadaId || null,
      distribucionAsientos: croquisActivo,
    };

    try {
      if (isEditing && busToEdit) {
        const res = await dataService.patchBus(busToEdit.id, busPayload);
        if (res.error) {
          setErrorAlerta(res.error);
          setIsSubmitting(false);
          return;
        }
        if (res.data) {
          onSuccess(res.data);
          onClose();
        }
      } else {
        const res = await dataService.insertBus(busPayload);
        if (res.error) {
          setErrorAlerta(res.error);
          setIsSubmitting(false);
          return;
        }
        if (res.data) {
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      setErrorAlerta(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al registrar el bus.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto">
        {/* Encabezado y Pasos */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <span className="text-xs font-black uppercase text-brand-600 tracking-wider">
              {isEditing ? 'Edición de Unidad' : 'Asistente de Registro'}
            </span>
            <h2 className="text-xl font-black text-neutral-900">
              {isEditing ? `Modificar Unidad #${busToEdit?.numero}` : 'Registrar Nueva Unidad'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-2xl font-bold p-1 leading-none"
          >
            ×
          </button>
        </div>

        {/* Indicador de Pasos */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                paso === 1
                  ? 'bg-brand-600 text-white'
                  : 'bg-brand-100 text-brand-800'
              }`}
            >
              1
            </span>
            <span className="text-xs font-bold text-neutral-700">Modalidad</span>
          </div>
          <div className="flex-1 h-0.5 mx-3 bg-neutral-200" />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                paso === 2
                  ? 'bg-brand-600 text-white'
                  : paso > 2
                  ? 'bg-brand-100 text-brand-800'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              2
            </span>
            <span className="text-xs font-bold text-neutral-700">Identificación</span>
          </div>
          <div className="flex-1 h-0.5 mx-3 bg-neutral-200" />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                paso === 3
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              3
            </span>
            <span className="text-xs font-bold text-neutral-700">Asientos</span>
          </div>
        </div>

        {/* Alerta de Error */}
        {errorAlerta && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-semibold flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorAlerta}</span>
            </div>
            <button
              onClick={() => setErrorAlerta(null)}
              className="text-red-500 font-bold ml-2 text-sm leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* PASO 1: MODALIDAD Y GRUPO */}
        {paso === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">
                Tipo y Modalidad de Transporte
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleCambiarTipoBus('INTERPROVINCIAL')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    tipoBus === 'INTERPROVINCIAL'
                      ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-200'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">🛣️</span>
                    <Badge variant={tipoBus === 'INTERPROVINCIAL' ? 'cooperativa' : 'neutral'}>
                      Interprovincial
                    </Badge>
                  </div>
                  <h4 className="font-black text-sm text-neutral-900">Servicio Interprovincial</h4>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Permite asientos VIP, 1 o 2 pisos, baño y servicios a bordo.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleCambiarTipoBus('URBANO')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    tipoBus === 'URBANO'
                      ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-200'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">🚌</span>
                    <Badge variant={tipoBus === 'URBANO' ? 'cooperativa' : 'neutral'}>
                      Urbano
                    </Badge>
                  </div>
                  <h4 className="font-black text-sm text-neutral-900">Servicio Urbano</h4>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    1 piso, 2 puertas, tarifa estándar única, sin categoría VIP.
                  </p>
                </button>
              </div>
            </div>

            {gruposBuses.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Grupo Operativo (Resolución de Frecuencias)
                </label>
                <select
                  value={grupoBusId || ''}
                  onChange={(e) => setGrupoBusId(e.target.value || null)}
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="">Sin grupo asignado (Flota general)</option>
                  {gruposBuses.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Chasis o Descripción del Modelo
              </label>
              <input
                type="text"
                value={chasis}
                onChange={(e) => setChasis(e.target.value)}
                placeholder="Ej: Hino AK Serie 2026 - Turbo Intercooler"
                className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* PASO 2: DATOS TÉCNICOS Y COMBOBOX */}
        {paso === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Disco Oficial # <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 5 o 45"
                  value={numeroDisco}
                  onChange={(e) => setNumeroDisco(e.target.value)}
                  className={`w-full text-sm font-black border rounded-xl px-3 py-2 font-mono ${
                    !validacionDisco.ok && numeroDisco
                      ? 'border-red-400 bg-red-50 text-red-900'
                      : 'border-neutral-300'
                  }`}
                />
                {!validacionDisco.ok && numeroDisco ? (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {validacionDisco.error}
                  </p>
                ) : (
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Número único de 1 a 4 dígitos en la cooperativa.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Placa Canónica ANT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TBA-0456 o TBA-456"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  onBlur={handlePlacaBlur}
                  className={`w-full text-sm font-mono font-bold uppercase border rounded-xl px-3 py-2 ${
                    !validacionPlaca.ok && placa
                      ? 'border-red-400 bg-red-50 text-red-900'
                      : 'border-neutral-300'
                  }`}
                />
                {validacionPlaca.ok && validacionPlaca.valor ? (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    ✔ Formato válido: {validacionPlaca.valor}
                  </p>
                ) : placa ? (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {validacionPlaca.error}
                  </p>
                ) : (
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Se autocompleta con cero si tiene 3 números.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ComboBox
                label="Marca del Chasis"
                required
                placeholder="Seleccione o escriba..."
                options={opcionesMarcas}
                value={marca}
                onChange={setMarca}
              />

              <ComboBox
                label="Carrocería Vehicular"
                required
                placeholder="Seleccione o escriba..."
                options={opcionesCarrocerias}
                value={carroceria}
                onChange={setCarroceria}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Foto o Imagen de la Unidad (URL)
              </label>
              <input
                type="text"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs font-mono border border-neutral-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* PASO 3: PLANTILLA DE ASIENTOS Y DERIVADOS */}
        {paso === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-neutral-700 uppercase">
                  Plantilla Maestra de Asientos
                </label>
                <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMostrarTodasPlantillas(false)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      !mostrarTodasPlantillas
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Modalidad {tipoBus === 'URBANO' ? 'Urbana' : 'Interprovincial'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarTodasPlantillas(true)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      mostrarTodasPlantillas
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Ver Todas ({plantillas.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-52 overflow-y-auto p-1">
                {plantillasVisibles.map((p) => {
                  const isSelected = plantillaSeleccionadaId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSeleccionarPlantilla(p.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-300 shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-black text-xs text-neutral-900 line-clamp-1">{p.nombre}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="neutral">{p.pisos === 1 ? '1 Piso' : '2 Pisos'}</Badge>
                          {isSelected && <Badge variant="success">✓ Activa</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-600 font-semibold">
                        <span>{p.capacidadTotal} asientos</span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-700">{p.tipoBus}</span>
                        {p.configuracionJson?.asientosVipCount ? (
                          <>
                            <span className="text-neutral-400">•</span>
                            <span className="text-amber-600 font-bold">
                              ⭐ {p.configuracionJson.asientosVipCount} VIP
                            </span>
                          </>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumen Derivado de Asientos */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-neutral-700 tracking-wider">
                  Distribución Calculada Automáticamente:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrandoEditorAsientos(true)}
                  className="text-xs py-1 px-3"
                >
                  ✏️ Personalizar Croquis de Unidad
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Capacidad Total</span>
                  <p className="text-lg font-black text-brand-900">{resumenAsientos.capacidadTotal}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Asientos Normales</span>
                  <p className="text-lg font-black text-blue-900">{resumenAsientos.asientosNormalCount}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-amber-600">Asientos VIP</span>
                  <p className="text-lg font-black text-amber-900">{resumenAsientos.asientosVipCount}</p>
                </div>
              </div>

              {resumenAsientos.asientosVIPNumeros.length > 0 && (
                <p className="text-[11px] text-amber-800 font-semibold">
                  ⭐ Asientos con tarifa preferencial VIP: {resumenAsientos.asientosVIPNumeros.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botones de Navegación del Wizard */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
          {paso > 1 ? (
            <Button variant="outline" size="sm" onClick={handleAtras} disabled={isSubmitting}>
              ← Atrás
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>

            {paso < 3 ? (
              <Button variant="primary" size="sm" onClick={handleSiguiente}>
                Siguiente →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGuardar}
                isLoading={isSubmitting}
                className="bg-brand-700 hover:bg-brand-800 font-black px-6"
              >
                {isEditing ? 'Actualizar Unidad' : 'Registrar Bus Oficial'}
              </Button>
            )}
          </div>
        </div>

        {/* Modal Diseñador Integrado */}
        {mostrandoEditorAsientos && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
            <div className="max-w-4xl w-full my-auto max-h-[92vh] overflow-y-auto">
              <BusSeatTemplateDesigner
                initialConfig={croquisActivo || undefined}
                initialName={`Distribución Bus #${numeroDisco || '0'}`}
                initialTipoBus={tipoBus}
                onSave={(nuevaConfig) => {
                  setDistribucionPersonalizada(nuevaConfig);
                  setMostrandoEditorAsientos(false);
                }}
                onCancel={() => setMostrandoEditorAsientos(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
