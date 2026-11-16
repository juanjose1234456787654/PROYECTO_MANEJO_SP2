'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { dataService } from '@/lib/services/dataService';
import type { PlantillaBusRow, ConfiguracionCroquis, TipoBus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import BusSeatTemplateDesigner from '@/components/bus/BusSeatTemplateDesigner';

export default function DisenoBusesPage() {
  const [plantillas, setPlantillas] = useState<PlantillaBusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoBus>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Estados de modal de diseño
  const [modalAbierto, setModalAbierto] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaBusRow | null>(null);
  const [modoModal, setModoModal] = useState<'crear' | 'editar' | 'ver'>('crear');
  const [alerta, setAlerta] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const cargarPlantillas = async () => {
    setLoading(true);
    try {
      const res = await dataService.fetchPlantillasBus();
      if (res.data) {
        setPlantillas(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlantillas();
  }, []);

  // Filtrado reactivo
  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter((p) => {
      const coincideTipo = filtroTipo === 'TODOS' || p.tipoBus === filtroTipo;
      const coincideTexto =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.tipoBus.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTipo && coincideTexto;
    });
  }, [plantillas, filtroTipo, busqueda]);

  // Contadores
  const contadores = useMemo(() => {
    const total = plantillas.length;
    const urbanas = plantillas.filter((p) => p.tipoBus === 'URBANO').length;
    const inter = plantillas.filter((p) => p.tipoBus === 'INTERPROVINCIAL').length;
    const dosPisos = plantillas.filter((p) => p.pisos === 2).length;
    return { total, urbanas, inter, dosPisos };
  }, [plantillas]);

  // Acciones
  const handleAbrirCrear = () => {
    setPlantillaSeleccionada(null);
    setModoModal('crear');
    setModalAbierto(true);
  };

  const handleAbrirEditar = (p: PlantillaBusRow) => {
    setPlantillaSeleccionada(p);
    setModoModal('editar');
    setModalAbierto(true);
  };

  const handleAbrirVer = (p: PlantillaBusRow) => {
    setPlantillaSeleccionada(p);
    setModoModal('ver');
    setModalAbierto(true);
  };

  const handleDuplicar = (p: PlantillaBusRow) => {
    const copia: PlantillaBusRow = {
      ...p,
      id: '',
      nombre: `${p.nombre} (Copia)`,
      esGlobal: false,
    };
    setPlantillaSeleccionada(copia);
    setModoModal('crear');
    setModalAbierto(true);
  };

  const handleToggleActivo = async (p: PlantillaBusRow) => {
    const nuevoEstado = !p.activo;
    const res = await dataService.togglePlantillaActiva(p.id, nuevoEstado);
    if (res.data) {
      setPlantillas((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, activo: nuevoEstado } : item))
      );
      setAlerta({
        tipo: 'exito',
        mensaje: `Plantilla "${p.nombre}" ${nuevoEstado ? 'habilitada' : 'deshabilitada'} correctamente.`,
      });
    } else {
      setAlerta({
        tipo: 'error',
        mensaje: res.error || 'No se pudo actualizar el estado de la plantilla.',
      });
    }
  };

  const handleGuardarDesdeDisenador = async (config: ConfiguracionCroquis, nombre: string) => {
    if (modoModal === 'crear') {
      const res = await dataService.createPlantillaBus({
        nombre,
        tipoBus: config.tipoBus,
        pisos: config.pisos,
        capacidadTotal: config.capacidadTotal,
        configuracionJson: config,
        esGlobal: false,
        cooperativaId: null,
        activo: true,
      });

      if (res.data) {
        setPlantillas((prev) => [res.data!, ...prev]);
        setModalAbierto(false);
        setAlerta({
          tipo: 'exito',
          mensaje: `Plantilla "${nombre}" registrada exitosamente.`,
        });
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: res.error || 'Error al guardar la nueva plantilla.',
        });
      }
    } else if (modoModal === 'editar' && plantillaSeleccionada) {
      const res = await dataService.updatePlantillaBus(plantillaSeleccionada.id, {
        nombre,
        tipoBus: config.tipoBus,
        pisos: config.pisos,
        capacidadTotal: config.capacidadTotal,
        configuracionJson: config,
      });

      if (res.data) {
        setPlantillas((prev) =>
          prev.map((item) => (item.id === plantillaSeleccionada.id ? res.data! : item))
        );
        setModalAbierto(false);
        setAlerta({
          tipo: 'exito',
          mensaje: `Plantilla "${nombre}" actualizada exitosamente.`,
        });
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: res.error || 'Error al actualizar la plantilla.',
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">💺</span>
            <h1 className="text-2xl font-black text-neutral-900">
              Diseño y Plantillas de Asientos de Flota
            </h1>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Gestione las configuraciones de planta física de las unidades (Urbano e Interprovincial) de acuerdo a
            la normativa ANT y resolución de cooperativa.
          </p>
        </div>

        <Button variant="primary" onClick={handleAbrirCrear} className="shadow-lg shadow-brand-600/20">
          + Crear Nueva Plantilla
        </Button>
      </div>

      {alerta && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between ${
            alerta.tipo === 'exito'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{alerta.mensaje}</span>
          <button onClick={() => setAlerta(null)} className="font-bold text-lg leading-none ml-3">
            ×
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-bold text-neutral-500 uppercase">Plantillas Totales</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">{contadores.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-bold text-blue-600 uppercase">Modalidad Urbana</span>
          <p className="text-2xl font-black text-blue-900 mt-1">{contadores.urbanas}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-bold text-brand-600 uppercase">Interprovincial</span>
          <p className="text-2xl font-black text-brand-900 mt-1">{contadores.inter}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase">Doble Piso (2 Plantas)</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{contadores.dosPisos}</p>
        </div>
      </div>

      {/* Filtros de Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por nombre o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {(['TODOS', 'URBANO', 'INTERPROVINCIAL'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filtroTipo === tipo
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tipo === 'TODOS' ? 'Todos' : tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Plantillas */}
      <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-500 font-medium">Cargando plantillas de flota...</div>
        ) : plantillasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            No se encontraron plantillas de asientos con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Nombre de Plantilla</th>
                  <th className="py-3 px-4">Tipo Bus</th>
                  <th className="py-3 px-4 text-center">Pisos</th>
                  <th className="py-3 px-4 text-center">Capacidad</th>
                  <th className="py-3 px-4 text-center">VIP</th>
                  <th className="py-3 px-4 text-center">Ámbito</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {plantillasFiltradas.map((p) => {
                  const vipCount = p.configuracionJson?.asientosVipCount ?? 0;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        {p.nombre}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.tipoBus === 'URBANO' ? 'neutral' : 'cooperativa'}>
                          {p.tipoBus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {p.pisos === 1 ? '1 Piso' : '2 Pisos 🏢'}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-brand-900">
                        {p.capacidadTotal} asientos
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {vipCount > 0 ? (
                          <span className="text-amber-600 font-black">{vipCount} VIP</span>
                        ) : (
                          <span className="text-neutral-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.esGlobal ? 'success' : 'neutral'}>
                          {p.esGlobal ? 'Estándar Global' : 'Personalizada'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.activo ? 'success' : 'danger'}>
                          {p.activo ? 'ACTIVA' : 'INACTIVA'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrirVer(p)}
                          className="text-xs py-1 px-2.5"
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrirEditar(p)}
                          className="text-xs py-1 px-2.5"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicar(p)}
                          className="text-xs py-1 px-2.5"
                        >
                          Duplicar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActivo(p)}
                          className={`text-xs py-1 px-2.5 ${
                            p.activo ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {p.activo ? 'Deshabilitar' : 'Habilitar'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Diseñador */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto my-auto">
            <BusSeatTemplateDesigner
              initialConfig={plantillaSeleccionada?.configuracionJson}
              initialName={
                modoModal === 'crear' && !plantillaSeleccionada
                  ? 'Nueva Plantilla'
                  : plantillaSeleccionada?.nombre
              }
              initialTipoBus={plantillaSeleccionada?.tipoBus || 'INTERPROVINCIAL'}
              readOnly={modoModal === 'ver'}
              onSave={handleGuardarDesdeDisenador}
              onCancel={() => setModalAbierto(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
