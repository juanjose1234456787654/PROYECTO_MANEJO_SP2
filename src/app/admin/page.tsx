'use client';

import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/services/dataService';
import type {
  CooperativaRow,
  BusRow,
  UsuarioRow,
  BoletoRow,
  ConfiguracionAppRow,
} from '@/lib/data/mockData';
import type { RolUsuario } from '@/types/database.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'cooperativas' | 'usuarios' | 'config' | 'sync'>('cooperativas');
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [config, setConfig] = useState<ConfiguracionAppRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Form nueva cooperativa
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [nombreCoop, setNombreCoop] = useState('');
  const [rucCoop, setRucCoop] = useState('');
  const [telefonoCoop, setTelefonoCoop] = useState('');
  const [direccionCoop, setDireccionCoop] = useState('');

  // Form Config
  const [appName, setAppName] = useState('');
  const [soporteEmail, setSoporteEmail] = useState('');
  const [soporteTel, setSoporteTel] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configSavedMsg, setConfigSavedMsg] = useState(false);

  // Sync / Seed Status
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [coopList, usrList, busList, bolList, conf] = await Promise.all([
          dataService.getCooperativas(),
          dataService.getUsuarios(),
          dataService.getBuses(),
          dataService.getBoletos(),
          dataService.getConfig(),
        ]);
        setCooperativas(coopList);
        setUsuarios(usrList);
        setBuses(busList);
        setBoletos(bolList);
        setConfig(conf);
        setAppName(conf.nombreApp);
        setSoporteEmail(conf.soporteEmail || '');
        setSoporteTel(conf.soporteTelefono || '');
      } catch (err) {
        console.error('Error al cargar datos de admin:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalRecaudado = boletos
    .filter((b) => b.estado === 'pagado' || b.estado === 'abordado')
    .reduce((acc, b) => acc + b.precio, 0);

  // Cambiar rol de usuario
  const handleChangeRole = async (userId: string, newRole: RolUsuario) => {
    await dataService.updateUsuario(userId, { rol: newRole });
    setUsuarios((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, rol: newRole } : u))
    );
  };

  // Toggle activo/inactivo usuario
  const handleToggleUserActive = async (user: UsuarioRow) => {
    const updatedStatus = !user.activo;
    await dataService.updateUsuario(user.id, { activo: updatedStatus });
    setUsuarios((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, activo: updatedStatus } : u))
    );
  };

  // Guardar nueva cooperativa
  const handleCreateCoop = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCoop = await dataService.createCooperativa({
      nombre: nombreCoop.trim(),
      ruc: rucCoop.trim(),
      telefono: telefonoCoop.trim(),
      direccion: direccionCoop.trim(),
      logoUrl: null,
      activo: true,
    });
    setCooperativas((prev) => [newCoop, ...prev]);
    setShowCoopModal(false);
    setNombreCoop('');
    setRucCoop('');
  };

  // Toggle estado cooperativa
  const handleToggleCoopStatus = async (coop: CooperativaRow) => {
    const updated = !coop.activo;
    await dataService.updateCooperativa(coop.id, { activo: updated });
    setCooperativas((prev) =>
      prev.map((c) => (c.id === coop.id ? { ...c, activo: updated } : c))
    );
  };

  // Guardar configuración
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    const updated = await dataService.updateConfig({
      nombreApp: appName,
      soporteEmail,
      soporteTelefono: soporteTel,
    });
    setConfig(updated);
    setConfigSaving(false);
    setConfigSavedMsg(true);
    setTimeout(() => setConfigSavedMsg(false), 3000);
  };

  // Ejecutar sembrado de datos en Supabase
  const handleSeedDatabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await dataService.seedSupabase();
    setSyncResult(res.detalle);
    setSyncing(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Panel de Administración General
            </h1>
            <Badge variant="admin">ADMINISTRADOR</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Supervisión global de cooperativas, asignación de roles de usuario, parámetros institucionales y base de datos.
          </p>
        </div>
      </div>

      {/* Tarjetas KPIs Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Cooperativas</div>
            <div className="text-2xl font-black text-blue-900 mt-1">{cooperativas.length} Entidades</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            🏢
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Flota Nacional</div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{buses.length} Buses</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            🚌
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Usuarios Registrados</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{usuarios.length} Cuentas</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            👥
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-500">Recaudación Global</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">${totalRecaudado.toFixed(2)}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            💵
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del Administrador */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('cooperativas')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'cooperativas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          🏢 Cooperativas ({cooperativas.length})
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'usuarios'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          👥 Gestión de Usuarios y Roles ({usuarios.length})
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'config'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          ⚙️ Parámetros del Sistema
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'sync'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          ⚡ Sincronización Supabase
        </button>
      </div>

      {/* PESTAÑA 1: COOPERATIVAS */}
      {activeTab === 'cooperativas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Directorio de Cooperativas</h2>
            <Button variant="primary" size="sm" onClick={() => setShowCoopModal(true)}>
              + Nueva Cooperativa
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Razón Social</th>
                  <th className="py-3 px-4">RUC</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {cooperativas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4 font-black text-gray-900 text-sm">{c.nombre}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">{c.ruc}</td>
                    <td className="py-3 px-4 text-gray-600">{c.telefono || 'Sin teléfono'}</td>
                    <td className="py-3 px-4 text-gray-500 text-[11px] max-w-xs truncate">
                      {c.direccion || 'Terminal Terrestre'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={c.activo ? 'success' : 'danger'}>
                        {c.activo ? 'ACTIVA' : 'INACTIVA'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCoopStatus(c)}
                        className="text-[11px]"
                      >
                        {c.activo ? 'Suspender' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: USUARIOS Y ROLES */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Control de Acceso y Roles</h2>
              <p className="text-xs text-gray-500">
                Asigna o modifica los privilegios de los 5 roles del sistema en tiempo real.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Usuario / Nombre</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {usuarios.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4 font-black text-gray-900">{usr.nombre}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{usr.email}</td>
                    <td className="py-3 px-4 font-mono">{usr.cedula || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={usr.rol}
                        onChange={(e) => handleChangeRole(usr.id, e.target.value as RolUsuario)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 font-bold bg-gray-50 focus:bg-white"
                      >
                        <option value="admin">ADMIN (Administrador)</option>
                        <option value="cooperativa">COOPERATIVA (Gerente)</option>
                        <option value="oficinista">OFICINISTA (Ventanilla)</option>
                        <option value="chofer">CHOFER (Conductor)</option>
                        <option value="usuario">USUARIO (Pasajero)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={usr.activo ? 'success' : 'danger'}>
                        {usr.activo ? 'ACTIVO' : 'BLOQUEADO'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserActive(usr)}
                        className="text-[11px]"
                      >
                        {usr.activo ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CONFIGURACIÓN INSTITUCIONAL */}
      {activeTab === 'config' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            Parámetros Institucionales (ConfiguracionApp)
          </h2>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            {configSavedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-bold">
                ✓ ¡Configuración institucional actualizada correctamente!
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nombre Oficial de la Plataforma
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email de Soporte Técnico
                </label>
                <input
                  type="email"
                  value={soporteEmail}
                  onChange={(e) => setSoporteEmail(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Teléfono / WhatsApp de Soporte
                </label>
                <input
                  type="text"
                  value={soporteTel}
                  onChange={(e) => setSoporteTel(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={configSaving}>
              {configSaving ? 'Guardando...' : 'Guardar Cambios Institucionales'}
            </Button>
          </form>
        </div>
      )}

      {/* PESTAÑA 4: SINCRONIZACIÓN Y SEED SUPABASE */}
      {activeTab === 'sync' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Sincronizador Maestro con Supabase</h2>
          <p className="text-sm text-gray-600">
            Utiliza esta herramienta para sembrar automáticamente en tu base de datos de Supabase todas las
            cooperativas, flota de buses, frecuencias ANT, paradas intermedias y configuración institucional.
          </p>

          {syncResult && (
            <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded-xl border border-blue-200 font-bold">
              {syncResult}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleSeedDatabase}
            disabled={syncing}
            className="w-full py-3 font-bold"
          >
            {syncing ? 'Sincronizando con Supabase...' : '⚡ Sincronizar y Sembrar Supabase Ahora'}
          </Button>
        </div>
      )}

      {/* Modal Nueva Cooperativa */}
      {showCoopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-4">Registrar Cooperativa</h3>
            <form onSubmit={handleCreateCoop} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cooperativa Transporte Ambato"
                  value={nombreCoop}
                  onChange={(e) => setNombreCoop(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">RUC Ecuatoriano</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1890001234001"
                  value={rucCoop}
                  onChange={(e) => setRucCoop(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej: 032520890"
                  value={telefonoCoop}
                  onChange={(e) => setTelefonoCoop(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dirección Principal</label>
                <input
                  type="text"
                  placeholder="Ej: Terminal Terrestre Ingahurco"
                  value={direccionCoop}
                  onChange={(e) => setDireccionCoop(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="w-full">
                  Registrar Cooperativa
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCoopModal(false)}>
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
