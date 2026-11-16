'use client';

import React, { useState, useEffect } from 'react';
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
import { IconBus, IconMapPin, IconClock, IconUsers } from '@/components/ui/Icons';
import BusCreationWizard from '@/components/bus/BusCreationWizard';
import ParadasFrecuenciaModal from '@/components/bus/ParadasFrecuenciaModal';

export default function CooperativaPage() {
  const [activeTab, setActiveTab] = useState<'buses' | 'frecuencias' | 'rutas' | 'hojas_ruta'>('buses');
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState<string>('coop-001');
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [paradas, setParadas] = useState<ParadaFrecuenciaRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [, setLoading] = useState(true);

  const [fechaHojaRuta, setFechaHojaRuta] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hojaRuta, setHojaRuta] = useState<HojaRutaDiaria | null>(null);
  const [loadingHojaRuta, setLoadingHojaRuta] = useState(false);
  const [syncMensaje, setSyncMensaje] = useState<string | null>(null);

  const [showBusModal, setShowBusModal] = useState(false);
  const [showFrecModal, setShowFrecModal] = useState(false);
  const [showRutaModal, setShowRutaModal] = useState(false);

  // Estados de gestión de flota y paradas (ECU-3 / #67)
  const [busToEdit, setBusToEdit] = useState<BusRow | null>(null);
  const [frecuenciaParaParadas, setFrecuenciaParaParadas] = useState<FrecuenciaRow | null>(null);
  const [warningModal, setWarningModal] = useState<{
    titulo: string;
    mensaje: string;
    onConfirm: () => void;
  } | null>(null);

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
    } catch {
      setSyncMensaje('No se pudo conectar con la base de datos.');
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

  const handleNuevoBus = () => {
    setBusToEdit(null);
    setShowBusModal(true);
  };

  const handleEditarBus = (bus: BusRow) => {
    setBusToEdit(bus);
    setShowBusModal(true);
  };

  const handleToggleBusStatus = async (bus: BusRow) => {
    if (bus.activo) {
      // Intentando mandar a taller o deshabilitar: verificar hojas de ruta activas
      const verificacion = await dataService.verificarBusEnHojasRuta(bus.id);
      if (verificacion.enUso) {
        setWarningModal({
          titulo: `Atención: Unidad #${bus.numero} en uso operativo`,
          mensaje: `La unidad #${bus.numero} (${bus.placa}) se encuentra asignada a ${verificacion.rutasActivas} viaje(s) programado(s) o en curso a partir de hoy. Si la pone en taller o la deshabilita, esos despachos quedarán sin unidad asignada. ¿Desea continuar de todas formas?`,
          onConfirm: async () => {
            await dataService.toggleBusStatus(bus.id, false);
            setBuses((prev) =>
              prev.map((b) => (b.id === bus.id ? { ...b, activo: false } : b))
            );
            setWarningModal(null);
          },
        });
        return;
      }
    }

    const updatedStatus = !bus.activo;
    await dataService.toggleBusStatus(bus.id, updatedStatus);
    setBuses((prev) =>
      prev.map((b) => (b.id === bus.id ? { ...b, activo: updatedStatus } : b))
    );
  };

  const handleToggleFrecuencia = async (frec: FrecuenciaRow) => {
    if (frec.activa) {
      // Intentando deshabilitar frecuencia: verificar salidas programadas
      const verificacion = await dataService.verificarFrecuenciaEnHojasRuta(frec.id);
      if (verificacion.enUso) {
        setWarningModal({
          titulo: `Atención: Frecuencia con viajes programados`,
          mensaje: `La frecuencia ${frec.origen} ➔ ${frec.destino} (${frec.hora}) cuenta con ${verificacion.rutasActivas} salida(s) activa(s) o programada(s) a partir de hoy. Si la deshabilita, se suspenderá la asignación de turnos. ¿Desea continuar?`,
          onConfirm: async () => {
            await dataService.toggleFrecuenciaActiva(frec.id, false);
            setFrecuencias((prev) =>
              prev.map((f) => (f.id === frec.id ? { ...f, activa: false } : f))
            );
            setWarningModal(null);
          },
        });
        return;
      }
    }

    const updatedStatus = !frec.activa;
    await dataService.toggleFrecuenciaActiva(frec.id, updatedStatus);
    setFrecuencias((prev) =>
      prev.map((f) => (f.id === frec.id ? { ...f, activa: updatedStatus } : f))
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
      <div className="flex space-x-2 border-b border-neutral-200">
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
          Frecuencias e Itinerarios ({coopFrecuencias.length})
        </button>
        <button
          onClick={() => setActiveTab('rutas')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'rutas'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Programación de Viajes y Choferes ({coopRutas.length})
        </button>
        <button
          onClick={() => setActiveTab('hojas_ruta')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'hojas_ruta'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Hojas de Ruta y Días de Parada ANT
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: BUSES */}
      {activeTab === 'buses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-900">
              Unidades de {currentCoop?.nombre || 'la Cooperativa'}
            </h2>
            <Button variant="primary" size="sm" onClick={handleNuevoBus}>
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
                    <th className="py-3 px-4">Modalidad</th>
                    <th className="py-3 px-4">Marca / Chasis</th>
                    <th className="py-3 px-4">Carrocería</th>
                    <th className="py-3 px-4 text-center">Capacidad</th>
                    <th className="py-3 px-4 text-center">Asientos VIP</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {coopBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-neutral-50/60">
                      <td className="py-3 px-4 font-black text-neutral-900 text-sm">#{bus.numero}</td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-800">{bus.placa}</td>
                      <td className="py-3 px-4">
                        <Badge variant={bus.tipoBus === 'URBANO' ? 'neutral' : 'cooperativa'}>
                          {bus.tipoBus || 'INTERPROVINCIAL'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-neutral-700">{bus.marca} {bus.chasis}</td>
                      <td className="py-3 px-4 text-neutral-600">{bus.carroceria || 'Estándar'}</td>
                      <td className="py-3 px-4 text-center font-bold">{bus.capacidad} asientos</td>
                      <td className="py-3 px-4 text-center">
                        {bus.asientosVIP && bus.asientosVIP > 0 ? (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            ⭐ {bus.asientosVIP} VIP
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-semibold">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={bus.activo ? 'success' : 'danger'}>
                          {bus.activo ? 'OPERATIVO' : 'EN TALLER'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarBus(bus)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleBusStatus(bus)}
                          className={`text-[11px] py-1 px-2.5 ${
                            bus.activo ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
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
                      <Badge variant={frec.activa ? 'success' : 'danger'}>
                        {frec.activa ? 'ACTIVA' : 'INACTIVA'}
                      </Badge>
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

                    <div className="pt-3 flex items-center justify-between border-t border-neutral-100 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFrecuenciaParaParadas(frec)}
                        className="text-xs flex-1 py-1"
                      >
                        🚏 Gestionar Paradas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFrecuencia(frec)}
                        className={`text-xs py-1 ${
                          frec.activa
                            ? 'text-red-600 hover:bg-red-50 hover:border-red-200'
                            : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                        }`}
                      >
                        {frec.activa ? 'Deshabilitar' : 'Habilitar'}
                      </Button>
                    </div>
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
          {/* Barra de Control de Fecha y Sincronización */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                Hoja de Ruta Diaria y Control de Flota ANT
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Supervisión regulatoria de turnos, rotación equitativa y control de sobreoferta en terminales.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
                <label className="text-xs font-bold text-neutral-600 uppercase">Fecha:</label>
                <input
                  type="date"
                  value={fechaHojaRuta}
                  onChange={(e) => setFechaHojaRuta(e.target.value)}
                  className="text-xs font-bold bg-transparent text-neutral-900 border-none outline-none"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => cargarHojaRuta(selectedCoopId, fechaHojaRuta)}
                disabled={loadingHojaRuta}
              >
                Actualizar Hoja
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSincronizarHojaRuta}
                disabled={loadingHojaRuta || !hojaRuta}
                className="bg-success-600 hover:bg-success-700 text-white"
              >
                Sincronizar Despachos en Supabase
              </Button>
            </div>
          </div>

          {/* Notificación de Sincronización */}
          {syncMensaje && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
                syncMensaje.includes('Error')
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

          {/* Tarjetas KPI de Diagnóstico de Flota ANT */}
          {hojaRuta && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                  Flota vs Turnos
                </div>
                <div className="text-xl font-black text-neutral-900 mt-1">
                  {hojaRuta.controlFlota.totalBusesActivos} buses / {hojaRuta.controlFlota.totalFrecuenciasActivas} turnos
                </div>
                <div className="text-xs text-neutral-500 mt-1">Capacidad autorizada ANT</div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                  Exceso de Flota
                </div>
                <div
                  className={`text-xl font-black mt-1 ${
                    hojaRuta.controlFlota.excesoFlota > 0 ? 'text-warning-700' : 'text-success-700'
                  }`}
                >
                  {hojaRuta.controlFlota.excesoFlota} {hojaRuta.controlFlota.excesoFlota === 1 ? 'Unidad' : 'Unidades'}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {hojaRuta.controlFlota.excesoFlota > 0
                    ? 'Requiere día de descanso preventivo'
                    : 'Sin sobreoferta operativa'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
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
                <div className="text-xs text-neutral-500 mt-1 font-mono">
                  {hojaRuta.controlFlota.resolucionANTReferencial || 'Res. ANT Títulos Habilitantes'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                  Régimen de Operación
                </div>
                <div className="text-xl font-black text-brand-700 mt-1">
                  {hojaRuta.controlFlota.porcentajeFlotaEnOperacion}%
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Rotación cíclica equitativa activa
                </div>
              </div>
            </div>
          )}

          {/* TABLA 1: UNIDADES AUTORIZADAS PARA OPERAR */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success-500"></span>
                  Despacho Oficial: Unidades Habilitadas y Turnos Programados ({hojaRuta?.asignaciones.length ?? 0})
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Vehículos que cumplen con la resolución y cuentan con salida autorizada para el día {fechaHojaRuta}.
                </p>
              </div>
              <Badge variant="success">AUTORIZADOS ANT</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
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
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {hojaRuta?.asignaciones && hojaRuta.asignaciones.length > 0 ? (
                    hojaRuta.asignaciones.map((asig, idx) => (
                      <tr key={`${asig.frecuenciaId}-${idx}`} className="hover:bg-neutral-50/60">
                        <td className="py-3 px-4 font-black text-neutral-900 text-sm">{asig.hora}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-neutral-900">{asig.origen}</span>
                          <span className="text-brand-600 font-bold mx-1">➔</span>
                          <span className="font-bold text-neutral-900">{asig.destino}</span>
                          {asig.duracionEstimada && (
                            <span className="text-neutral-400 text-[11px] block">Aprox: {asig.duracionEstimada}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded">
                            Bus #{asig.numeroBus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-800">{asig.placa}</td>
                        <td className="py-3 px-4 text-center">{asig.capacidad} pasj.</td>
                        <td className="py-3 px-4 text-neutral-700 font-medium">
                          {asig.nombreChofer || 'Por Asignar'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-neutral-500">
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
                      <td colSpan={8} className="py-8 text-center text-neutral-500">
                        No hay turnos asignados para esta fecha o la cooperativa no registra frecuencias activas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: UNIDADES EN DÍA DE PARADA (DESCANSO PREVENTIVO OBLIGATORIO ANT) */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-warning-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-warning-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning-500"></span>
                  Descanso Preventivo Obligatorio: Flota en «Día de Parada» ANT ({hojaRuta?.busesEnParada.length ?? 0})
                </h3>
                <p className="text-xs text-warning-800 mt-0.5">
                  Restricción obligatoria de la ANT por exceso de unidades. Estas unidades rotan equitativamente día tras día.
                </p>
              </div>
              <Badge variant="warning">DESCANSO OBLIGATORIO</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Disco #</th>
                    <th className="py-3 px-4">Placa</th>
                    <th className="py-3 px-4">Motivo Normativo</th>
                    <th className="py-3 px-4">Disposición y Observación ANT</th>
                    <th className="py-3 px-4 text-center">Próximo Turno Estimado</th>
                    <th className="py-3 px-4 text-center">Estatus Operativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {hojaRuta?.busesEnParada && hojaRuta.busesEnParada.length > 0 ? (
                    hojaRuta.busesEnParada.map((parada) => (
                      <tr key={parada.busId} className="hover:bg-warning-50/50">
                        <td className="py-3 px-4 font-black text-neutral-900 text-sm">
                          Disco #{parada.numeroBus}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900">{parada.placa}</td>
                        <td className="py-3 px-4">
                          <span className="bg-warning-100 text-warning-900 font-bold px-2 py-0.5 rounded text-[11px] uppercase">
                            {parada.motivo.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-700 max-w-md">{parada.observacion}</td>
                        <td className="py-3 px-4 text-center font-bold text-brand-700 font-mono">
                          {parada.proximoTurnoEstimado || 'Día Siguiente'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="neutral">EN PARADA PREVENTIVA</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-success-700 font-medium bg-success-50/30">
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

      {/* Modal / Wizard de Registro y Edición de Bus (ECU-3 / #67) */}
      <BusCreationWizard
        cooperativaId={selectedCoopId}
        busToEdit={busToEdit}
        isOpen={showBusModal}
        onClose={() => {
          setShowBusModal(false);
          setBusToEdit(null);
        }}
        onSuccess={(savedBus) => {
          setBuses((prev) => {
            const index = prev.findIndex((b) => b.id === savedBus.id);
            if (index >= 0) {
              const copia = [...prev];
              copia[index] = savedBus;
              return copia;
            }
            return [savedBus, ...prev];
          });
          setShowBusModal(false);
          setBusToEdit(null);
        }}
      />

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
                  {coopFrecuencias
                    .filter((f) => f.activa)
                    .map((f) => (
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
                  {coopBuses
                    .filter((b) => b.activo)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        Disco #{b.numero} - {b.placa} ({b.capacidad} asientos - {b.tipoBus || 'INTERPROVINCIAL'})
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

      {/* Modal de Gestión de Paradas Intermedias (ECU-3 / #67) */}
      <ParadasFrecuenciaModal
        frecuencia={frecuenciaParaParadas}
        isOpen={Boolean(frecuenciaParaParadas)}
        onClose={() => setFrecuenciaParaParadas(null)}
        onParadasUpdated={(frecId, nuevasParadas) => {
          setParadas((prev) => [
            ...prev.filter((p) => p.frecuenciaId !== frecId),
            ...nuevasParadas,
          ]);
        }}
      />

      {/* Modal de Advertencia Operativa ANT (ECU-3 / #67) */}
      {warningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="text-3xl">⚠️</span>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                  Impacto Operativo Detectado
                </span>
                <h3 className="text-base font-black text-neutral-900 leading-tight">
                  {warningModal.titulo}
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed bg-amber-50/60 p-3 rounded-2xl border border-amber-200/70">
              {warningModal.mensaje}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setWarningModal(null)}>
                Cancelar Operación
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={warningModal.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Confirmar y Deshabilitar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
