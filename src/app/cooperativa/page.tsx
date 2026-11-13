'use client';

import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/services/dataService';
import {
  generarHojaRutaPorGrupo,
  reemplazarBusEnHojaRuta,
  editarDetallesAsignacionHojaRuta,
  validarDeficitGrupo,
} from '@/lib/services/hojasRutaService';
import type {
  CooperativaRow,
  BusRow,
  FrecuenciaRow,
  RutaRow,
  ParadaFrecuenciaRow,
  UsuarioRow,
  GrupoBusRow,
  HojaRutaGrupo,
  ValidacionDeficitGrupo,
} from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconBus, IconMapPin, IconClock, IconUsers } from '@/components/ui/Icons';

export default function CooperativaPage() {
  const [activeTab, setActiveTab] = useState<'grupos' | 'buses' | 'frecuencias' | 'rutas' | 'hojas_ruta'>('buses');
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState<string>('coop-001');
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [, setLoading] = useState(true);

  // ECU-1: Grupos de Buses y Hojas de Ruta controladas
  const [grupos, setGrupos] = useState<GrupoBusRow[]>([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('');
  const [grupoNombre, setGrupoNombre] = useState('');
  const [grupoDescripcion, setGrupoDescripcion] = useState('');
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [grupoMensaje, setGrupoMensaje] = useState<string | null>(null);

  const [fechaInicioGrupo, setFechaInicioGrupo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [diasCicloGrupo, setDiasCicloGrupo] = useState<number>(5);
  const [vistaHoja, setVistaHoja] = useState<'tablero' | 'tabla'>('tablero');
  const [hojaGrupo, setHojaGrupo] = useState<HojaRutaGrupo | null>(null);
  const [validacionGrupo, setValidacionGrupo] = useState<ValidacionDeficitGrupo | null>(null);
  const [aprobandoHoja, setAprobandoHoja] = useState(false);
  const [syncMensaje, setSyncMensaje] = useState<string | null>(null);

  const [showBusModal, setShowBusModal] = useState(false);
  const [showFrecModal, setShowFrecModal] = useState(false);
  const [showRutaModal, setShowRutaModal] = useState(false);

  const [busNumero, setBusNumero] = useState(10);
  const [busPlaca, setBusPlaca] = useState('');
  const [busMarca, setBusMarca] = useState('Hino');
  const [busCarroceria, setBusCarroceria] = useState('Varycca');
  const [busCapacidad, setBusCapacidad] = useState(40);
  const [busVipCount, setBusVipCount] = useState(8);

  const [frecOrigen, setFrecOrigen] = useState('');
  const [frecDestino, setFrecDestino] = useState('');
  const [frecHora, setFrecHora] = useState('07:00');
  const [frecResolucion, setFrecResolucion] = useState('');
  const [frecDuracion] = useState('2h 30m');
  const [frecPrecio, setFrecPrecio] = useState(5.0);

  // Form Ruta
  const [rutaFecha, setRutaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [rutaFrecId, setRutaFrecId] = useState('');
  const [rutaBusId, setRutaBusId] = useState('');
  const [rutaChoferId, setRutaChoferId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [coops, busList, frecList, parList, rutList, usrList, grpList] = await Promise.all([
          dataService.getCooperativas(),
          dataService.getBuses(),
          dataService.getFrecuencias(),
          dataService.getParadas(),
          dataService.getRutas(),
          dataService.getUsuarios(),
          dataService.getGruposBus(),
        ]);
        setCooperativas(coops);
        if (coops.length > 0) setSelectedCoopId(coops[0].id);
        setBuses(busList);
        setFrecuencias(frecList);
        setParadas(parList);
        setRutas(rutList);
        setUsuarios(usrList);
        setGrupos(grpList);
        if (grpList.length > 0) setSelectedGrupoId(grpList[0].id);
      } catch (err) {
        console.error('Error al cargar datos de cooperativa:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentCoop = cooperativas.find((c) => c.id === selectedCoopId);
  const coopBuses = buses.filter((b) => b.cooperativaId === selectedCoopId);
  const coopFrecuencias = frecuencias.filter((f) => f.cooperativaId === selectedCoopId);
  const coopRutas = rutas.filter((r) =>
    coopFrecuencias.some((f) => f.id === r.frecuenciaId)
  );
  const choferes = usuarios.filter((u) => u.rol === 'chofer');

  // ECU-1: Derivados del grupo seleccionado
  const selectedGrupo = grupos.find((g) => g.id === selectedGrupoId) ?? null;
  const busesDelGrupo = coopBuses.filter((b) => b.grupoBusId === selectedGrupoId);
  const frecuenciasDelGrupo = coopFrecuencias.filter((f) => f.grupoFrecuenciaId === selectedGrupoId);
  const estadoDeficitActual = selectedGrupoId
    ? validarDeficitGrupo(busesDelGrupo, frecuenciasDelGrupo)
    : null;

  const handleSaveGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrupoMensaje(null);
    if (editingGrupoId) {
      const res = await dataService.updateGrupoBus(editingGrupoId, {
        nombre: grupoNombre,
        descripcion: grupoDescripcion,
      });
      if (res.data) {
        setGrupos((prev) => prev.map((g) => (g.id === editingGrupoId ? res.data! : g)));
        setEditingGrupoId(null);
        setGrupoNombre('');
        setGrupoDescripcion('');
        setGrupoMensaje(`Grupo "${res.data.nombre}" actualizado correctamente.`);
      } else {
        setGrupoMensaje(`Error: ${res.error}`);
      }
      return;
    }

    const res = await dataService.createGrupoBus({
      nombre: grupoNombre,
      descripcion: grupoDescripcion,
    });
    if (res.data) {
      setGrupos((prev) => [...prev, res.data!]);
      setSelectedGrupoId(res.data.id);
      setGrupoNombre('');
      setGrupoDescripcion('');
      setGrupoMensaje(`Grupo "${res.data.nombre}" creado correctamente.`);
    } else {
      setGrupoMensaje(`Error: ${res.error}`);
    }
  };

  const handleDeleteGrupo = async (grupo: GrupoBusRow) => {
    const res = await dataService.deleteGrupoBus(grupo.id);
    if (!res.error) {
      setGrupos((prev) => prev.filter((g) => g.id !== grupo.id));
      setBuses((prev) => prev.map((b) => (b.grupoBusId === grupo.id ? { ...b, grupoBusId: null } : b)));
      setFrecuencias((prev) =>
        prev.map((f) => (f.grupoFrecuenciaId === grupo.id ? { ...f, grupoFrecuenciaId: null } : f))
      );
      if (selectedGrupoId === grupo.id) {
        setSelectedGrupoId('');
        setHojaGrupo(null);
      }
      setGrupoMensaje(`Grupo "${grupo.nombre}" eliminado.`);
    } else {
      setGrupoMensaje(`Error: ${res.error}`);
    }
  };

  const handleToggleBusGrupo = async (bus: BusRow) => {
    if (!selectedGrupoId) return;
    const nuevoGrupoId = bus.grupoBusId === selectedGrupoId ? null : selectedGrupoId;
    const res = await dataService.asignarBusAGrupo(bus.id, nuevoGrupoId);
    if (res.data) {
      setBuses((prev) => prev.map((b) => (b.id === bus.id ? res.data! : b)));
    }
  };

  const handleToggleFrecuenciaGrupo = async (frec: FrecuenciaRow) => {
    if (!selectedGrupoId) return;
    const nuevoGrupoId = frec.grupoFrecuenciaId === selectedGrupoId ? null : selectedGrupoId;
    const res = await dataService.asignarFrecuenciaAGrupo(frec.id, nuevoGrupoId);
    if (res.data) {
      setFrecuencias((prev) => prev.map((f) => (f.id === frec.id ? res.data! : f)));
    }
  };

  const handleGenerarHojaGrupo = () => {
    setSyncMensaje(null);
    if (!selectedGrupo) {
      setSyncMensaje('Error: Seleccione primero un Grupo de Buses.');
      return;
    }

    const resultado = generarHojaRutaPorGrupo({
      grupoId: selectedGrupo.id,
      grupoNombre: selectedGrupo.nombre,
      cooperativaId: selectedCoopId,
      fechaInicio: fechaInicioGrupo,
      dias: diasCicloGrupo,
      buses: busesDelGrupo,
      frecuencias: frecuenciasDelGrupo,
      choferes,
    });

    setValidacionGrupo(resultado.validacion);
    setHojaGrupo(resultado.hoja);
    if (!resultado.hoja) {
      setSyncMensaje(`Error: ${resultado.validacion.mensaje}`);
    }
  };

  const handleCambiarBusHoja = (diaFecha: string, frecuenciaId: string, nuevoBusId: string) => {
    if (!hojaGrupo) return;
    const busesHabilitadosCoop = coopBuses.filter((b) => b.activo);
    const nuevoBus = busesHabilitadosCoop.find((b) => b.id === nuevoBusId);
    if (!nuevoBus) return;
    setHojaGrupo(
      reemplazarBusEnHojaRuta(hojaGrupo, diaFecha, frecuenciaId, nuevoBus, busesHabilitadosCoop)
    );
  };

  const handleEditarDetalleHoja = (
    diaFecha: string,
    frecuenciaId: string,
    cambios: { origen?: string; destino?: string; hora?: string; fecha?: string }
  ) => {
    if (!hojaGrupo) return;
    setHojaGrupo(editarDetallesAsignacionHojaRuta(hojaGrupo, diaFecha, frecuenciaId, cambios));
  };

  const handleAprobarHojaGrupo = async () => {
    if (!hojaGrupo || hojaGrupo.estado === 'APROBADA') return;
    try {
      setAprobandoHoja(true);
      setSyncMensaje(null);
      const res = await dataService.aprobarHojaRutaGrupo(hojaGrupo);
      if (res.data) {
        setHojaGrupo(res.data.hojaAprobada);
        setSyncMensaje(
          `Hoja de Ruta APROBADA. Se publicaron ${res.data.rutasPublicadas} ruta(s) para la venta (${res.data.rutasOmitidas} ya existían para esa fecha).`
        );
        const rutList = await dataService.getRutas();
        setRutas(rutList);
      } else {
        setSyncMensaje(`Error al aprobar la hoja de ruta: ${res.error}`);
      }
    } catch {
      setSyncMensaje('Error al conectar con la base de datos.');
    } finally {
      setAprobandoHoja(false);
    }
  };

  // Guardar nuevo bus
  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    const vipNums = Array.from({ length: busVipCount }, (_, i) => i + 1);
    const newBus = await dataService.createBus({
      cooperativaId: selectedCoopId,
      grupoBusId: null,
      numero: Number(busNumero),
      placa: busPlaca.toUpperCase().trim(),
      chasis: `${busMarca} Modelo 2025`,
      carroceria: busCarroceria,
      marca: busMarca,
      fotoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      capacidad: Number(busCapacidad),
      asientosVIP: Number(busVipCount),
      asientosVIPNumeros: vipNums,
      diasParada: [1],
      activo: true,
    });
    setBuses((prev) => [newBus, ...prev]);
    setShowBusModal(false);
    setBusPlaca('');
  };

  // Guardar nueva frecuencia
  const handleCreateFrecuencia = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFrec = await dataService.createFrecuencia({
      cooperativaId: selectedCoopId,
      grupoFrecuenciaId: null,
      resolucionANT: frecResolucion || `ANT-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      origen: frecOrigen.trim(),
      destino: frecDestino.trim(),
      hora: frecHora,
      tipoViaje: 'Directo Interprovincial',
      activa: true,
      duracion: frecDuracion,
      precioBase: Number(frecPrecio),
      preciosPorTramo: null,
    });
    setFrecuencias((prev) => [newFrec, ...prev]);
    setShowFrecModal(false);
    setFrecOrigen('');
    setFrecDestino('');
  };

  // Programar ruta
  const handleCreateRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    const frecObj = frecuencias.find((f) => f.id === rutaFrecId);
    const newRuta = await dataService.createRuta({
      frecuenciaId: rutaFrecId,
      fecha: rutaFecha,
      busId: rutaBusId || null,
      estado: 'programada',
      inicio: null,
      completada: false,
      precio: frecObj ? frecObj.precioBase : 5.0,
      choferId: rutaChoferId || null,
    });
    setRutas((prev) => [newRuta, ...prev]);
    setShowRutaModal(false);
  };

  const toggleBusStatus = async (bus: BusRow) => {
    const updatedStatus = !bus.activo;
    await dataService.updateBus(bus.id, { activo: updatedStatus });
    setBuses((prev) =>
      prev.map((b) => (b.id === bus.id ? { ...b, activo: updatedStatus } : b))
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              Gestión Operativa de Cooperativa
            </h1>
            <Badge variant="cooperativa">COOPERATIVA</Badge>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Administración centralizada de flota de buses, frecuencias ANT, hojas de ruta y choferes asignados.
          </p>
        </div>

        {/* Selector de Cooperativa */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-neutral-600 uppercase">Cooperativa:</label>
          <select
            value={selectedCoopId}
            onChange={(e) => setSelectedCoopId(e.target.value)}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
          >
            {cooperativas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Flota Registrada</div>
            <div className="text-2xl font-black text-neutral-900 mt-1">{coopBuses.length} Unidades</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <IconBus size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Frecuencias Activas</div>
            <div className="text-2xl font-black text-success-600 mt-1">{coopFrecuencias.length} Rutas</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center font-bold">
            <IconMapPin size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Viajes Programados</div>
            <div className="text-2xl font-black text-brand-600 mt-1">{coopRutas.length} Despachos</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <IconClock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Choferes en Plantilla</div>
            <div className="text-2xl font-black text-accent-600 mt-1">{choferes.length} Choferes</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center font-bold">
            <IconUsers size={22} />
          </div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('grupos')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'grupos'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Grupos de Buses ({grupos.length})
        </button>
        <button
          onClick={() => setActiveTab('buses')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'buses'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Flota de Buses ({coopBuses.length})
        </button>
        <button
          onClick={() => setActiveTab('frecuencias')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'frecuencias'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Frecuencias ({coopFrecuencias.length})
        </button>
        <button
          onClick={() => setActiveTab('rutas')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'rutas'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Viajes Programados ({coopRutas.length})
        </button>
        <button
          onClick={() => setActiveTab('hojas_ruta')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'hojas_ruta'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Hojas de Ruta
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 0: GRUPOS DE BUSES (ECU-1) */}
      {activeTab === 'grupos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario CRUD de Grupo */}
            <Card className="border border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black text-neutral-900">
                  {editingGrupoId ? 'Editar Grupo de Buses' : 'Nuevo Grupo de Buses'}
                </CardTitle>
                <CardDescription className="text-xs">
                  Agrupa unidades y frecuencias (ej. Urbanos, Interprovinciales).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGrupo} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                      Nombre del Grupo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Grupo Interprovinciales"
                      value={grupoNombre}
                      onChange={(e) => setGrupoNombre(e.target.value)}
                      className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Rutas Quito - Ambato - Cuenca"
                      value={grupoDescripcion}
                      onChange={(e) => setGrupoDescripcion(e.target.value)}
                      className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" variant="primary" size="sm" className="w-full">
                      {editingGrupoId ? 'Guardar Cambios' : 'Crear Grupo'}
                    </Button>
                    {editingGrupoId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingGrupoId(null);
                          setGrupoNombre('');
                          setGrupoDescripcion('');
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>

                {grupoMensaje && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg text-xs font-bold ${
                      grupoMensaje.startsWith('Error')
                        ? 'bg-brand-50 text-brand-800 border border-brand-200'
                        : 'bg-success-50 text-success-800 border border-success-200'
                    }`}
                  >
                    {grupoMensaje}
                  </div>
                )}

                <div className="mt-5 space-y-2">
                  <div className="text-xs font-bold uppercase text-neutral-500">
                    Grupos Registrados ({grupos.length})
                  </div>
                  {grupos.length === 0 ? (
                    <p className="text-xs text-neutral-500">No hay grupos creados aún.</p>
                  ) : (
                    grupos.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGrupoId(g.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          selectedGrupoId === g.id
                            ? 'border-brand-600 bg-brand-50/60'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{g.nombre}</div>
                          {g.descripcion && (
                            <div className="text-xs text-neutral-500">{g.descripcion}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setEditingGrupoId(g.id);
                              setGrupoNombre(g.nombre);
                              setGrupoDescripcion(g.descripcion ?? '');
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleDeleteGrupo(g);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asignación de Buses y Frecuencias al Grupo */}
            <div className="lg:col-span-2 space-y-4">
              {selectedGrupo ? (
                <>
                  {estadoDeficitActual && (
                    <div
                      className={`p-4 rounded-2xl border text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        estadoDeficitActual.valido
                          ? 'bg-success-50 text-success-900 border-success-200'
                          : 'bg-warning-50 text-warning-900 border-warning-200'
                      }`}
                    >
                      <span>{estadoDeficitActual.mensaje}</span>
                      <Badge variant={estadoDeficitActual.valido ? 'success' : 'warning'}>
                        {estadoDeficitActual.totalBusesHabilitados} buses /{' '}
                        {estadoDeficitActual.totalFrecuencias} frec. (mín.{' '}
                        {estadoDeficitActual.minimoRequerido})
                      </Badge>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border border-neutral-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-black text-neutral-900">
                          Buses en «{selectedGrupo.nombre}» ({busesDelGrupo.length})
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Marca los buses que operan en este grupo.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                        {coopBuses.map((bus) => {
                          const asignado = bus.grupoBusId === selectedGrupo.id;
                          return (
                            <label
                              key={bus.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs ${
                                asignado
                                  ? 'border-brand-500 bg-brand-50/50'
                                  : 'border-neutral-200 hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={asignado}
                                  onChange={() => handleToggleBusGrupo(bus)}
                                  className="rounded border-neutral-300"
                                />
                                <span className="font-bold text-neutral-900">
                                  Disco #{bus.numero} ({bus.placa})
                                </span>
                              </div>
                              <Badge variant={bus.activo ? 'success' : 'neutral'}>
                                {bus.activo ? 'Habilitado' : 'Inhabilitado'}
                              </Badge>
                            </label>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <Card className="border border-neutral-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-black text-neutral-900">
                          Frecuencias en «{selectedGrupo.nombre}» ({frecuenciasDelGrupo.length})
                        </CardTitle>
                        <CardDescription className="text-xs">
                          1 frecuencia por día por ruta. Selecciona las del grupo.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                        {coopFrecuencias.map((frec) => {
                          const asignada = frec.grupoFrecuenciaId === selectedGrupo.id;
                          return (
                            <label
                              key={frec.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs ${
                                asignada
                                  ? 'border-brand-500 bg-brand-50/50'
                                  : 'border-neutral-200 hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={asignada}
                                  onChange={() => handleToggleFrecuenciaGrupo(frec)}
                                  className="rounded border-neutral-300"
                                />
                                <div>
                                  <div className="font-bold text-neutral-900">
                                    {frec.origen} ➔ {frec.destino}
                                  </div>
                                  <div className="text-neutral-500">Salida diaria: {frec.hora}</div>
                                </div>
                              </div>
                              <Badge variant={frec.activa ? 'success' : 'neutral'}>
                                {frec.activa ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </label>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="border border-neutral-200 shadow-sm p-8 text-center text-sm text-neutral-500">
                  Crea o selecciona un grupo a la izquierda para asignar buses y frecuencias.
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 1: BUSES */}
      {activeTab === 'buses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-900">
              Unidades de {currentCoop?.nombre || 'la Cooperativa'}
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowBusModal(true)}>
              + Agregar Nueva Unidad
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Disco #</th>
                    <th className="py-3 px-4">Placa</th>
                    <th className="py-3 px-4">Marca / Chasis</th>
                    <th className="py-3 px-4">Carrocería</th>
                    <th className="py-3 px-4 text-center">Capacidad</th>
                    <th className="py-3 px-4 text-center">Asientos VIP</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {coopBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-neutral-50/60">
                      <td className="py-3 px-4 font-black text-neutral-900 text-sm">#{bus.numero}</td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-800">{bus.placa}</td>
                      <td className="py-3 px-4 text-neutral-700">{bus.marca} {bus.chasis}</td>
                      <td className="py-3 px-4 text-neutral-600">{bus.carroceria || 'Estándar'}</td>
                      <td className="py-3 px-4 text-center font-bold">{bus.capacidad} asientos</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-accent-100 text-accent-800 px-2 py-0.5 rounded-full font-bold">
                          ⭐ {bus.asientosVIP || 0} VIP
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={bus.activo ? 'success' : 'danger'}>
                          {bus.activo ? 'OPERATIVO' : 'EN MANTENIMIENTO'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBusStatus(bus)}
                          className="text-[11px]"
                        >
                          {bus.activo ? 'Poner en Taller' : 'Habilitar Unidad'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: FRECUENCIAS */}
      {activeTab === 'frecuencias' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-900">
              Itinerarios y Frecuencias Autorizadas
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowFrecModal(true)}>
              + Nueva Frecuencia
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coopFrecuencias.map((frec) => {
              const paradasFrec = paradas.filter((p) => p.frecuenciaId === frec.id);
              return (
                <Card key={frec.id} className="border border-neutral-200 shadow-sm flex flex-col justify-between">
                  <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-neutral-500">{frec.resolucionANT}</span>
                      <Badge variant="success">ACTIVA</Badge>
                    </div>
                    <CardTitle className="text-base font-black text-neutral-900 mt-1">
                      {frec.origen} ➔ {frec.destino}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Salida diaria: <strong className="text-neutral-900">{frec.hora}</strong> (Duración: {frec.duracion})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600 font-semibold">Tarifa Base:</span>
                      <span className="text-base font-black text-brand-700">${frec.precioBase.toFixed(2)}</span>
                    </div>

                    {paradasFrec.length > 0 && (
                      <div className="bg-brand-50/70 p-2.5 rounded-xl border border-brand-100 text-xs text-brand-900">
                        <div className="font-bold mb-1">Paradas Intermedias ({paradasFrec.length}):</div>
                        <div className="space-y-0.5 text-[11px] text-neutral-700">
                          {paradasFrec.map((p) => (
                            <div key={p.id} className="flex justify-between">
                              <span>• {p.ciudad}</span>
                              <span className="text-neutral-400">Escala #{p.orden}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: RUTAS Y DESPACHOS */}
      {activeTab === 'rutas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-900">
              Despachos Programados y Hojas de Ruta
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowRutaModal(true)}>
              + Programar Nuevo Despacho
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Ruta / Frecuencia</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Bus Asignado</th>
                  <th className="py-3 px-4">Conductor</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {coopRutas.map((ruta) => {
                  const frec = frecuencias.find((f) => f.id === ruta.frecuenciaId);
                  const bus = buses.find((b) => b.id === ruta.busId);
                  const chofer = usuarios.find((u) => u.id === ruta.choferId);

                  return (
                    <tr key={ruta.id} className="hover:bg-neutral-50/60">
                      <td className="py-3 px-4 font-bold text-neutral-900">{ruta.fecha}</td>
                      <td className="py-3 px-4 font-semibold text-brand-900">
                        {frec?.origen} ➔ {frec?.destino}
                      </td>
                      <td className="py-3 px-4 font-bold">{frec?.hora || '08:00'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-800">
                        {bus ? `Bus #${bus.numero} (${bus.placa})` : 'Sin asignar'}
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        {chofer?.nombre || 'Chofer de Turno'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            ruta.estado === 'en_curso'
                              ? 'warning'
                              : ruta.estado === 'completada'
                              ? 'success'
                              : 'cooperativa'
                          }
                        >
                          {ruta.estado.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 4: HOJAS DE RUTA Y DÍAS DE PARADA ANT (ACTIVIDAD 3) */}
      {activeTab === 'hojas_ruta' && (
        <div className="space-y-6">
          {/* Flujo: Grupo de Buses -> Fecha de Inicio -> Generar */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-neutral-900">
                  Generación de Hojas de Ruta por Grupo
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Selecciona un grupo de buses y la fecha de inicio. El sistema rota los buses garantizando mínimo 2 días de parada por ciclo.
                </p>
              </div>
              {hojaGrupo && (
                <Badge variant={hojaGrupo.estado === 'APROBADA' ? 'success' : 'warning'}>
                  ESTADO: {hojaGrupo.estado}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Grupo de Buses
                </label>
                <select
                  value={selectedGrupoId}
                  onChange={(e) => {
                    setSelectedGrupoId(e.target.value);
                    setHojaGrupo(null);
                    setValidacionGrupo(null);
                  }}
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="">-- Seleccionar grupo --</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicioGrupo}
                  onChange={(e) => setFechaInicioGrupo(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Días a Programar
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={diasCicloGrupo}
                  onChange={(e) => setDiasCicloGrupo(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerarHojaGrupo}
                  className="w-full"
                >
                  Generar Hoja de Ruta
                </Button>
                {hojaGrupo && hojaGrupo.estado === 'BORRADOR' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAprobarHojaGrupo}
                    disabled={aprobandoHoja}
                    className="w-full bg-success-600 hover:bg-success-700 text-white"
                  >
                    {aprobandoHoja ? 'Aprobando...' : 'Aprobar'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {syncMensaje && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
                syncMensaje.includes('Error') || syncMensaje.includes('Déficit')
                  ? 'bg-brand-50 text-brand-800 border border-brand-200'
                  : 'bg-success-50 text-success-800 border border-success-200'
              }`}
            >
              <span>{syncMensaje}</span>
              <button onClick={() => setSyncMensaje(null)} className="text-sm font-black ml-4">
                ✕
              </button>
            </div>
          )}

          {validacionGrupo && !validacionGrupo.valido && (
            <div className="bg-warning-50 border border-warning-300 rounded-2xl p-5 text-sm text-warning-900">
              <div className="font-black mb-1">No se pudo generar la hoja de ruta</div>
              <p className="text-xs">{validacionGrupo.mensaje}</p>
            </div>
          )}

          {hojaGrupo && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200">
                <div className="text-xs font-bold text-neutral-600">
                  {hojaGrupo.estado === 'BORRADOR'
                    ? 'Modo Borrador: puedes modificar origen, destino, hora, fecha y bus antes de aprobar.'
                    : 'Hoja de Ruta APROBADA y publicada para la venta.'}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={vistaHoja === 'tablero' ? 'primary' : 'outline'}
                    onClick={() => setVistaHoja('tablero')}
                  >
                    Vista Tablero de Buses
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={vistaHoja === 'tabla' ? 'primary' : 'outline'}
                    onClick={() => setVistaHoja('tabla')}
                  >
                    Vista Tabla
                  </Button>
                </div>
              </div>

              {vistaHoja === 'tablero' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {hojaGrupo.dias.map((dia) => (
                    <div
                      key={dia.fecha}
                      className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col"
                    >
                      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                        <div className="text-sm font-black text-neutral-900">
                          Día {dia.diaNumero} — {dia.fecha}
                        </div>
                        <Badge variant="neutral">{dia.asignaciones.length} turnos</Badge>
                      </div>

                      <div className="p-3 space-y-3 flex-1">
                        {dia.asignaciones.map((asig) => (
                          <div
                            key={`${dia.fecha}-${asig.frecuenciaId}`}
                            className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="date"
                                value={asig.fecha || dia.fecha}
                                disabled={hojaGrupo.estado === 'APROBADA'}
                                onChange={(e) =>
                                  handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                    fecha: e.target.value,
                                  })
                                }
                                className="text-[11px] font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100"
                              />
                              <input
                                type="time"
                                value={asig.hora}
                                disabled={hojaGrupo.estado === 'APROBADA'}
                                onChange={(e) =>
                                  handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                    hora: e.target.value,
                                  })
                                }
                                className="text-[11px] font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                value={asig.origen}
                                disabled={hojaGrupo.estado === 'APROBADA'}
                                onChange={(e) =>
                                  handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                    origen: e.target.value,
                                  })
                                }
                                placeholder="Origen"
                                className="text-xs font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100"
                              />
                              <input
                                type="text"
                                value={asig.destino}
                                disabled={hojaGrupo.estado === 'APROBADA'}
                                onChange={(e) =>
                                  handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                    destino: e.target.value,
                                  })
                                }
                                placeholder="Destino"
                                className="text-xs font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100"
                              />
                            </div>

                            <div>
                              <select
                                value={asig.busId}
                                disabled={hojaGrupo.estado === 'APROBADA'}
                                onChange={(e) =>
                                  handleCambiarBusHoja(dia.fecha, asig.frecuenciaId, e.target.value)
                                }
                                className="w-full text-xs font-bold border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white disabled:bg-neutral-100"
                              >
                                {coopBuses
                                  .filter((b) => b.activo)
                                  .map((b) => {
                                    const enParada = dia.busesEnParada.some((p) => p.busId === b.id);
                                    return (
                                      <option key={b.id} value={b.id}>
                                        Disco #{b.numero} - {b.placa}
                                        {enParada ? ' (En parada)' : ''}
                                      </option>
                                    );
                                  })}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-4 py-2.5 border-t border-neutral-200 bg-warning-50/70 text-[11px] text-warning-900 font-semibold">
                        En parada:{' '}
                        {dia.busesEnParada.length > 0
                          ? dia.busesEnParada.map((b) => `#${b.numeroBus} (${b.placa})`).join(', ')
                          : 'Ninguno'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                hojaGrupo.dias.map((dia) => (
                  <div
                    key={dia.fecha}
                    className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden"
                  >
                    <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-sm font-black text-neutral-900">
                        Día {dia.diaNumero} — {dia.fecha}
                      </div>
                      <div className="text-xs text-neutral-600">
                        En parada:{' '}
                        {dia.busesEnParada.length > 0
                          ? dia.busesEnParada.map((b) => `Disco #${b.numeroBus} (${b.placa})`).join(', ')
                          : 'Ninguno'}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                          <tr>
                            <th className="py-3 px-4">Fecha</th>
                            <th className="py-3 px-4">Hora</th>
                            <th className="py-3 px-4">Origen</th>
                            <th className="py-3 px-4">Destino</th>
                            <th className="py-3 px-4">Bus Asignado (ComboBox)</th>
                            <th className="py-3 px-4 text-center">Capacidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-medium">
                          {dia.asignaciones.map((asig) => (
                            <tr key={`${dia.fecha}-${asig.frecuenciaId}`} className="hover:bg-neutral-50/60">
                              <td className="py-2.5 px-4">
                                <input
                                  type="date"
                                  value={asig.fecha || dia.fecha}
                                  disabled={hojaGrupo.estado === 'APROBADA'}
                                  onChange={(e) =>
                                    handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                      fecha: e.target.value,
                                    })
                                  }
                                  className="text-xs font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="time"
                                  value={asig.hora}
                                  disabled={hojaGrupo.estado === 'APROBADA'}
                                  onChange={(e) =>
                                    handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                      hora: e.target.value,
                                    })
                                  }
                                  className="text-xs font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  value={asig.origen}
                                  disabled={hojaGrupo.estado === 'APROBADA'}
                                  onChange={(e) =>
                                    handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                      origen: e.target.value,
                                    })
                                  }
                                  className="text-xs font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100 w-28"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  value={asig.destino}
                                  disabled={hojaGrupo.estado === 'APROBADA'}
                                  onChange={(e) =>
                                    handleEditarDetalleHoja(dia.fecha, asig.frecuenciaId, {
                                      destino: e.target.value,
                                    })
                                  }
                                  className="text-xs font-bold border border-neutral-300 rounded px-2 py-1 bg-white disabled:bg-neutral-100 w-28"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <select
                                  value={asig.busId}
                                  disabled={hojaGrupo.estado === 'APROBADA'}
                                  onChange={(e) =>
                                    handleCambiarBusHoja(dia.fecha, asig.frecuenciaId, e.target.value)
                                  }
                                  className="text-xs font-bold border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white disabled:bg-neutral-100"
                                >
                                  {coopBuses
                                    .filter((b) => b.activo)
                                    .map((b) => {
                                      const enParada = dia.busesEnParada.some((p) => p.busId === b.id);
                                      return (
                                        <option key={b.id} value={b.id}>
                                          Disco #{b.numero} - {b.placa}
                                          {enParada ? ' (En parada)' : ''}
                                        </option>
                                      );
                                    })}
                                </select>
                                {asig.editadoManual && (
                                  <span className="ml-2 text-[11px] font-bold text-brand-700">
                                    Editado
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">{asig.capacidad} pasj.</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Registrar Bus */}
      {showBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-neutral-900 mb-4">Registrar Nueva Unidad</h3>
            <form onSubmit={handleCreateBus} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Disco #</label>
                <input
                  type="number"
                  required
                  value={busNumero}
                  onChange={(e) => setBusNumero(Number(e.target.value))}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Placa Oficial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TBA-4500"
                  value={busPlaca}
                  onChange={(e) => setBusPlaca(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    value={busMarca}
                    onChange={(e) => setBusMarca(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Carrocería</label>
                  <input
                    type="text"
                    value={busCarroceria}
                    onChange={(e) => setBusCarroceria(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Capacidad Total</label>
                  <input
                    type="number"
                    value={busCapacidad}
                    onChange={(e) => setBusCapacidad(Number(e.target.value))}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Asientos VIP</label>
                  <input
                    type="number"
                    value={busVipCount}
                    onChange={(e) => setBusVipCount(Number(e.target.value))}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="w-full">
                  Guardar Bus
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowBusModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Frecuencia */}
      {showFrecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-neutral-900 mb-4">Nueva Frecuencia ANT</h3>
            <form onSubmit={handleCreateFrecuencia} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Origen</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ambato"
                    value={frecOrigen}
                    onChange={(e) => setFrecOrigen(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Destino</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Quito"
                    value={frecDestino}
                    onChange={(e) => setFrecDestino(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Hora Salida</label>
                  <input
                    type="time"
                    required
                    value={frecHora}
                    onChange={(e) => setFrecHora(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Precio Base ($)</label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={frecPrecio}
                    onChange={(e) => setFrecPrecio(Number(e.target.value))}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Resolución ANT</label>
                <input
                  type="text"
                  placeholder="Ej: ANT-2026-EXP-1140"
                  value={frecResolucion}
                  onChange={(e) => setFrecResolucion(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="w-full">
                  Crear Frecuencia
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowFrecModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Programar Despacho */}
      {showRutaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-neutral-900 mb-4">Programar Viaje</h3>
            <form onSubmit={handleCreateRuta} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Fecha de Salida</label>
                <input
                  type="date"
                  required
                  value={rutaFecha}
                  onChange={(e) => setRutaFecha(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Frecuencia</label>
                <select
                  required
                  value={rutaFrecId}
                  onChange={(e) => setRutaFrecId(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Selecciona Frecuencia</option>
                  {coopFrecuencias.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.origen} ➔ {f.destino} ({f.hora})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Bus Asignado</label>
                <select
                  required
                  value={rutaBusId}
                  onChange={(e) => setRutaBusId(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Selecciona Bus</option>
                  {coopBuses.map((b) => (
                    <option key={b.id} value={b.id}>
                      Disco #{b.numero} - {b.placa} ({b.capacidad} asientos)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Chofer Designado</label>
                <select
                  value={rutaChoferId}
                  onChange={(e) => setRutaChoferId(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Selecciona Chofer</option>
                  {choferes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (CI: {c.cedula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="w-full">
                  Confirmar Despacho
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowRutaModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
