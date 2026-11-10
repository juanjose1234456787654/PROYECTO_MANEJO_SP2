'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/services/dataService';
import type {
  CooperativaRow,
  BusRow,
  FrecuenciaRow,
  RutaRow,
  ParadaFrecuenciaRow,
  UsuarioRow,
  HojaRutaDiaria,
} from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function CooperativaPage() {
  const [activeTab, setActiveTab] = useState<'buses' | 'frecuencias' | 'rutas' | 'hojas_ruta'>('buses');
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState<string>('coop-001');
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado Hoja de Ruta ANT (Actividad 3)
  const [fechaHojaRuta, setFechaHojaRuta] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hojaRuta, setHojaRuta] = useState<HojaRutaDiaria | null>(null);
  const [loadingHojaRuta, setLoadingHojaRuta] = useState(false);
  const [syncMensaje, setSyncMensaje] = useState<string | null>(null);

  // Modales
  const [showBusModal, setShowBusModal] = useState(false);
  const [showFrecModal, setShowFrecModal] = useState(false);
  const [showRutaModal, setShowRutaModal] = useState(false);

  // Form Bus
  const [busNumero, setBusNumero] = useState(10);
  const [busPlaca, setBusPlaca] = useState('');
  const [busMarca, setBusMarca] = useState('Hino');
  const [busCarroceria, setBusCarroceria] = useState('Varycca');
  const [busCapacidad, setBusCapacidad] = useState(40);
  const [busVipCount, setBusVipCount] = useState(8);

  // Form Frecuencia
  const [frecOrigen, setFrecOrigen] = useState('');
  const [frecDestino, setFrecDestino] = useState('');
  const [frecHora, setFrecHora] = useState('07:00');
  const [frecResolucion, setFrecResolucion] = useState('');
  const [frecDuracion, setFrecDuracion] = useState('2h 30m');
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
        const [coops, busList, frecList, parList, rutList, usrList] = await Promise.all([
          dataService.getCooperativas(),
          dataService.getBuses(),
          dataService.getFrecuencias(),
          dataService.getParadas(),
          dataService.getRutas(),
          dataService.getUsuarios(),
        ]);
        setCooperativas(coops);
        if (coops.length > 0) setSelectedCoopId(coops[0].id);
        setBuses(busList);
        setFrecuencias(frecList);
        setParadas(parList);
        setRutas(rutList);
        setUsuarios(usrList);
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

  // Cargar Hoja de Ruta ANT al cambiar cooperativa, fecha o pestaña
  const cargarHojaRuta = async (coopId: string, fecha: string) => {
    try {
      setLoadingHojaRuta(true);
      setSyncMensaje(null);
      const res = await dataService.fetchHojaRutaDiaria(coopId, fecha);
      if (res.data) {
        setHojaRuta(res.data);
      }
    } catch (err) {
      console.error('Error al generar hoja de ruta:', err);
    } finally {
      setLoadingHojaRuta(false);
    }
  };

  useEffect(() => {
    if (selectedCoopId && (activeTab === 'hojas_ruta' || activeTab === 'rutas')) {
      cargarHojaRuta(selectedCoopId, fechaHojaRuta);
    }
  }, [selectedCoopId, fechaHojaRuta, activeTab]);

  const handleSincronizarHojaRuta = async () => {
    if (!hojaRuta) return;
    try {
      setLoadingHojaRuta(true);
      const res = await dataService.sincronizarRutasConHojaDiaria(hojaRuta);
      if (res.data) {
        setSyncMensaje(
          `¡Sincronización exitosa con Supabase! Se programaron ${res.data.creadas} ruta(s) operativas (${res.data.omitidas} omitidas por Día de Parada o preexistencia).`
        );
        const rutList = await dataService.getRutas();
        setRutas(rutList);
      } else {
        setSyncMensaje(`Error en la sincronización: ${res.error}`);
      }
    } catch (err) {
      setSyncMensaje('Error inesperado al conectar con Supabase.');
    } finally {
      setLoadingHojaRuta(false);
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Gestión Operativa de Cooperativa
            </h1>
            <Badge variant="cooperativa">COOPERATIVA</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Administración centralizada de flota de buses, frecuencias ANT, hojas de ruta y choferes asignados.
          </p>
        </div>

        {/* Selector de Cooperativa */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Cooperativa:</label>
          <select
            value={selectedCoopId}
            onChange={(e) => setSelectedCoopId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white font-semibold text-red-900 focus:ring-2 focus:ring-red-500"
          >
            {cooperativas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de Métricas de la Cooperativa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Flota Registrada</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{coopBuses.length} Unidades</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
            🚌
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Frecuencias Activas</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{coopFrecuencias.length} Rutas</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            🗺️
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Viajes Programados</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{coopRutas.length} Despachos</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
            ⏰
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Choferes en Plantilla</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{choferes.length} Choferes</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            👨‍✈️
          </div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('buses')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'buses'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          🚌 Flota de Buses ({coopBuses.length})
        </button>
        <button
          onClick={() => setActiveTab('frecuencias')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'frecuencias'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          🗺️ Frecuencias e Itinerarios ({coopFrecuencias.length})
        </button>
        <button
          onClick={() => setActiveTab('rutas')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'rutas'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📅 Programación de Viajes y Choferes ({coopRutas.length})
        </button>
        <button
          onClick={() => setActiveTab('hojas_ruta')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'hojas_ruta'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📋 Hojas de Ruta y Días de Parada ANT
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: BUSES */}
      {activeTab === 'buses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
              Unidades de {currentCoop?.nombre || 'la Cooperativa'}
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowBusModal(true)}>
              + Agregar Nueva Unidad
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
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
                <tbody className="divide-y divide-gray-100 font-medium">
                  {coopBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 font-black text-gray-900 text-sm">#{bus.numero}</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-800">{bus.placa}</td>
                      <td className="py-3 px-4 text-gray-700">{bus.marca} {bus.chasis}</td>
                      <td className="py-3 px-4 text-gray-600">{bus.carroceria || 'Estándar'}</td>
                      <td className="py-3 px-4 text-center font-bold">{bus.capacidad} asientos</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
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
            <h2 className="text-lg font-bold text-gray-900">
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
                <Card key={frec.id} className="border border-gray-200 shadow-sm flex flex-col justify-between">
                  <CardHeader className="bg-gray-50 border-b border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-500">{frec.resolucionANT}</span>
                      <Badge variant="success">ACTIVA</Badge>
                    </div>
                    <CardTitle className="text-base font-black text-gray-900 mt-1">
                      {frec.origen} ➔ {frec.destino}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Salida diaria: <strong className="text-gray-900">{frec.hora}</strong> (Duración: {frec.duracion})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-semibold">Tarifa Base:</span>
                      <span className="text-base font-black text-red-700">${frec.precioBase.toFixed(2)}</span>
                    </div>

                    {paradasFrec.length > 0 && (
                      <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-100 text-xs text-red-900">
                        <div className="font-bold mb-1">Paradas Intermedias ({paradasFrec.length}):</div>
                        <div className="space-y-0.5 text-[11px] text-gray-700">
                          {paradasFrec.map((p) => (
                            <div key={p.id} className="flex justify-between">
                              <span>• {p.ciudad}</span>
                              <span className="text-gray-400">Escala #{p.orden}</span>
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
            <h2 className="text-lg font-bold text-gray-900">
              Despachos Programados y Hojas de Ruta
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowRutaModal(true)}>
              + Programar Nuevo Despacho
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Ruta / Frecuencia</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Bus Asignado</th>
                  <th className="py-3 px-4">Conductor</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {coopRutas.map((ruta) => {
                  const frec = frecuencias.find((f) => f.id === ruta.frecuenciaId);
                  const bus = buses.find((b) => b.id === ruta.busId);
                  const chofer = usuarios.find((u) => u.id === ruta.choferId);

                  return (
                    <tr key={ruta.id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 font-bold text-gray-900">{ruta.fecha}</td>
                      <td className="py-3 px-4 font-semibold text-red-900">
                        {frec?.origen} ➔ {frec?.destino}
                      </td>
                      <td className="py-3 px-4 font-bold">{frec?.hora || '08:00'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {bus ? `Bus #${bus.numero} (${bus.placa})` : 'Sin asignar'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
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
          {/* Barra de Control de Fecha y Sincronización */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>📋</span> Hoja de Ruta Diaria y Control de Flota ANT
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Supervisión regulatoria de turnos, rotación equitativa y control de sobreoferta en terminales.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-600 uppercase">Fecha:</label>
                <input
                  type="date"
                  value={fechaHojaRuta}
                  onChange={(e) => setFechaHojaRuta(e.target.value)}
                  className="text-xs font-bold bg-transparent text-gray-900 border-none outline-none"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => cargarHojaRuta(selectedCoopId, fechaHojaRuta)}
                disabled={loadingHojaRuta}
              >
                🔄 Actualizar Hoja
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSincronizarHojaRuta}
                disabled={loadingHojaRuta || !hojaRuta}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                ⚡ Sincronizar Despachos en Supabase
              </Button>
            </div>
          </div>

          {/* Notificación de Sincronización */}
          {syncMensaje && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
                syncMensaje.includes('Error')
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span>{syncMensaje}</span>
              <button onClick={() => setSyncMensaje(null)} className="text-sm font-black ml-4">
                ✕
              </button>
            </div>
          )}

          {/* Tarjetas KPI de Diagnóstico de Flota ANT */}
          {hojaRuta && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Flota vs Turnos
                </div>
                <div className="text-xl font-black text-gray-900 mt-1">
                  {hojaRuta.controlFlota.totalBusesActivos} buses / {hojaRuta.controlFlota.totalFrecuenciasActivas} turnos
                </div>
                <div className="text-xs text-gray-500 mt-1">Capacidad autorizada ANT</div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Exceso de Flota
                </div>
                <div
                  className={`text-xl font-black mt-1 ${
                    hojaRuta.controlFlota.excesoFlota > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {hojaRuta.controlFlota.excesoFlota} {hojaRuta.controlFlota.excesoFlota === 1 ? 'Unidad' : 'Unidades'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {hojaRuta.controlFlota.excesoFlota > 0
                    ? 'Requiere día de descanso preventivo'
                    : 'Sin sobreoferta operativa'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Estatus Normativo ANT
                </div>
                <div className="mt-1">
                  <Badge
                    variant={hojaRuta.controlFlota.requiereDiasParada ? 'warning' : 'success'}
                  >
                    {hojaRuta.controlFlota.requiereDiasParada
                      ? 'ROTACIÓN DE PARADA ACTIVA'
                      : 'OPERACIÓN AL 100%'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1 font-mono">
                  {hojaRuta.controlFlota.resolucionANTReferencial || 'Res. ANT Títulos Habilitantes'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Régimen de Operación
                </div>
                <div className="text-xl font-black text-red-700 mt-1">
                  {hojaRuta.controlFlota.porcentajeFlotaEnOperacion}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Rotación cíclica equitativa activa
                </div>
              </div>
            </div>
          )}

          {/* TABLA 1: UNIDADES AUTORIZADAS PARA OPERAR */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Despacho Oficial: Unidades Habilitadas y Turnos Programados ({hojaRuta?.asignaciones.length ?? 0})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vehículos que cumplen con la resolución y cuentan con salida autorizada para el día {fechaHojaRuta}.
                </p>
              </div>
              <Badge variant="success">AUTORIZADOS ANT</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Hora</th>
                    <th className="py-3 px-4">Frecuencia / Trayecto</th>
                    <th className="py-3 px-4">Bus Asignado</th>
                    <th className="py-3 px-4">Placa</th>
                    <th className="py-3 px-4 text-center">Capacidad</th>
                    <th className="py-3 px-4">Conductor Designado</th>
                    <th className="py-3 px-4 text-center">Resolución ANT</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {hojaRuta?.asignaciones && hojaRuta.asignaciones.length > 0 ? (
                    hojaRuta.asignaciones.map((asig, idx) => (
                      <tr key={`${asig.frecuenciaId}-${idx}`} className="hover:bg-gray-50/60">
                        <td className="py-3 px-4 font-black text-gray-900 text-sm">{asig.hora}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900">{asig.origen}</span>
                          <span className="text-red-600 font-bold mx-1">➔</span>
                          <span className="font-bold text-gray-900">{asig.destino}</span>
                          {asig.duracionEstimada && (
                            <span className="text-gray-400 text-[11px] block">Aprox: {asig.duracionEstimada}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded">
                            Bus #{asig.numeroBus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-800">{asig.placa}</td>
                        <td className="py-3 px-4 text-center">{asig.capacidad} pasj.</td>
                        <td className="py-3 px-4 text-gray-700 font-medium">
                          👨‍✈️ {asig.nombreChofer || 'Por Asignar'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-gray-500">
                          {asig.resolucionANT || 'ANT-RES-ESTANDAR'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="cooperativa">
                            {asig.estadoRuta.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        No hay turnos asignados para esta fecha o la cooperativa no registra frecuencias activas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: UNIDADES EN DÍA DE PARADA (DESCANSO PREVENTIVO OBLIGATORIO ANT) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-amber-50/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Descanso Preventivo Obligatorio: Flota en "Día de Parada" ANT ({hojaRuta?.busesEnParada.length ?? 0})
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Restricción obligatoria de la ANT por exceso de unidades. Estas unidades rotan equitativamente día tras día.
                </p>
              </div>
              <Badge variant="warning">DESCANSO OBLIGATORIO</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Disco #</th>
                    <th className="py-3 px-4">Placa</th>
                    <th className="py-3 px-4">Motivo Normativo</th>
                    <th className="py-3 px-4">Disposición y Observación ANT</th>
                    <th className="py-3 px-4 text-center">Próximo Turno Estimado</th>
                    <th className="py-3 px-4 text-center">Estatus Operativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {hojaRuta?.busesEnParada && hojaRuta.busesEnParada.length > 0 ? (
                    hojaRuta.busesEnParada.map((parada) => (
                      <tr key={parada.busId} className="hover:bg-amber-50/20">
                        <td className="py-3 px-4 font-black text-gray-900 text-sm">
                          Disco #{parada.numeroBus}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-900">{parada.placa}</td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] uppercase">
                            {parada.motivo.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-md">{parada.observacion}</td>
                        <td className="py-3 px-4 text-center font-bold text-red-700 font-mono">
                          {parada.proximoTurnoEstimado || 'Día Siguiente'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="neutral">EN PARADA PREVENTIVA</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-emerald-700 font-medium bg-emerald-50/30">
                        ✔ No hay unidades en Día de Parada. La flota se encuentra en equilibrio con las frecuencias autorizadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Bus */}
      {showBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-4">Registrar Nueva Unidad</h3>
            <form onSubmit={handleCreateBus} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Disco #</label>
                <input
                  type="number"
                  required
                  value={busNumero}
                  onChange={(e) => setBusNumero(Number(e.target.value))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Placa Oficial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TBA-4500"
                  value={busPlaca}
                  onChange={(e) => setBusPlaca(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    value={busMarca}
                    onChange={(e) => setBusMarca(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Carrocería</label>
                  <input
                    type="text"
                    value={busCarroceria}
                    onChange={(e) => setBusCarroceria(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Capacidad Total</label>
                  <input
                    type="number"
                    value={busCapacidad}
                    onChange={(e) => setBusCapacidad(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Asientos VIP</label>
                  <input
                    type="number"
                    value={busVipCount}
                    onChange={(e) => setBusVipCount(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
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
            <h3 className="text-xl font-black text-gray-900 mb-4">Nueva Frecuencia ANT</h3>
            <form onSubmit={handleCreateFrecuencia} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Origen</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ambato"
                    value={frecOrigen}
                    onChange={(e) => setFrecOrigen(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Destino</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Quito"
                    value={frecDestino}
                    onChange={(e) => setFrecDestino(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hora Salida</label>
                  <input
                    type="time"
                    required
                    value={frecHora}
                    onChange={(e) => setFrecHora(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Precio Base ($)</label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={frecPrecio}
                    onChange={(e) => setFrecPrecio(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Resolución ANT</label>
                <input
                  type="text"
                  placeholder="Ej: ANT-2026-EXP-1140"
                  value={frecResolucion}
                  onChange={(e) => setFrecResolucion(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono"
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
            <h3 className="text-xl font-black text-gray-900 mb-4">Programar Viaje</h3>
            <form onSubmit={handleCreateRuta} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fecha de Salida</label>
                <input
                  type="date"
                  required
                  value={rutaFecha}
                  onChange={(e) => setRutaFecha(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Frecuencia</label>
                <select
                  required
                  value={rutaFrecId}
                  onChange={(e) => setRutaFrecId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bus Asignado</label>
                <select
                  required
                  value={rutaBusId}
                  onChange={(e) => setRutaBusId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Chofer Designado</label>
                <select
                  value={rutaChoferId}
                  onChange={(e) => setRutaChoferId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
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
