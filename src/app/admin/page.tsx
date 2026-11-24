'use client';

import React, { useState, useEffect } from 'react';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { CatalogosFlota } from './CatalogosFlota';
import { dataService } from '@/lib/services/dataService';
import { validarRucCooperativa } from '@/lib/services/rucService';
import type {
  CooperativaRow,
  BusRow,
  UsuarioRow,
  BoletoRow,
  ConfiguracionAppRow,
  PlanMembresiaRow,
  SuscripcionCooperativaRow,
} from '@/lib/types';
import type { RolUsuario } from '@/types/database.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconBuilding, IconBus, IconUsers, IconCreditCard } from '@/components/ui/Icons';

const administradorVacio = { nombreAdmin: '', cedula: '', email: '', password: '' };

const camposAdministrador = [
  { key: 'nombreAdmin', label: 'Nombre completo', type: 'text', autoComplete: 'name' },
  { key: 'cedula', label: 'Cédula', type: 'text', autoComplete: 'off' },
  { key: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'username' },
  { key: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' },
] as const;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'cooperativas' | 'planes' | 'usuarios' | 'config' | 'sync' | 'catalogos'>('cooperativas');
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [config, setConfig] = useState<ConfiguracionAppRow | null>(null);
  const [planes, setPlanes] = useState<PlanMembresiaRow[]>([]);
  const [suscripciones, setSuscripciones] = useState<SuscripcionCooperativaRow[]>([]);
  const [planCoopId, setPlanCoopId] = useState('');
  const [planSelectedId, setPlanSelectedId] = useState('plan-normal');
  const [planObsPago, setPlanObsPago] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planFeedback, setPlanFeedback] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Form nueva cooperativa
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [nombreCoop, setNombreCoop] = useState('');
  const [rucCoop, setRucCoop] = useState('');
  const [telefonoCoop, setTelefonoCoop] = useState('');
  const [direccionCoop, setDireccionCoop] = useState('');
  const [pasoCoop, setPasoCoop] = useState<1 | 2>(1);
  const [errorCoop, setErrorCoop] = useState<string | null>(null);
  const [administradorCoop, setAdministradorCoop] = useState(administradorVacio);
  const [guardandoCoop, setGuardandoCoop] = useState(false);
  const [altaCoopMensaje, setAltaCoopMensaje] = useState<string | null>(null);

  // Form nuevo empleado (exclusivo para Administrador)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [empNombre, setEmpNombre] = useState('');
  const [empCedula, setEmpCedula] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRol, setEmpRol] = useState<RolUsuario>('oficinista');
  const [empCoopId, setEmpCoopId] = useState<string>('');
  const [empCreating, setEmpCreating] = useState(false);
  const [empFeedback, setEmpFeedback] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

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
        const [coopList, usrList, busList, bolList, conf, planesList, subsList] = await Promise.all([
          dataService.getCooperativas(),
          dataService.getUsuarios(),
          dataService.getBuses(),
          dataService.getBoletos(),
          dataService.getConfig(),
          dataService.getPlanesMembresia(),
          dataService.getSuscripcionesCooperativas(),
        ]);
        setCooperativas(coopList);
        if (coopList.length > 0) setPlanCoopId(coopList[0].id);
        setUsuarios(usrList);
        setBuses(busList);
        setBoletos(bolList);
        setConfig(conf);
        setPlanes(planesList);
        if (planesList.length > 0) setPlanSelectedId(planesList[0].id);
        setSuscripciones(subsList);
        setAppName(conf.nombreApp);
        setSoporteEmail(conf.soporteEmail || '');
        setSoporteTel(conf.soporteTelefono || '');
      } catch (err) {
        console.error('Error al cargar datos de admin:', err);
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

  // Crear cuenta de empleado desde el panel de Administrador sin cerrar la sesión actual
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpCreating(true);
    setEmpFeedback(null);
    try {
      const tempAuthClient = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: signUpData, error: signUpError } = await tempAuthClient.auth.signUp({
        email: empEmail.trim(),
        password: empPassword,
        options: {
          data: {
            nombre: empNombre.trim(),
            cedula: empCedula.trim(),
            rol: empRol,
          },
        },
      });

      const newUserId = signUpData?.user?.id || `usr-${Date.now()}`;
      if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
        throw new Error(signUpError.message);
      }

      const nuevoEmpleado = await dataService.createUsuario({
        id: newUserId,
        email: empEmail.trim(),
        nombre: empNombre.trim(),
        cedula: empCedula.trim(),
        rol: empRol,
        cooperativaId: empCoopId || null,
        activo: true,
      });

      setUsuarios((prev) => [nuevoEmpleado, ...prev.filter((u) => u.id !== nuevoEmpleado.id)]);
      setEmpFeedback({
        tipo: 'ok',
        msg: `Cuenta de empleado (${empRol.toUpperCase()}) creada exitosamente para ${empEmail}.`,
      });
      setEmpNombre('');
      setEmpCedula('');
      setEmpEmail('');
      setEmpPassword('');
      setTimeout(() => {
        setShowEmployeeModal(false);
        setEmpFeedback(null);
      }, 1500);
    } catch (err: unknown) {
      setEmpFeedback({
        tipo: 'err',
        msg: err instanceof Error ? err.message : 'No se pudo registrar el empleado.',
      });
    } finally {
      setEmpCreating(false);
    }
  };

  const handleSiguienteCoop = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validarRucCooperativa(rucCoop)) {
      setErrorCoop('Ingresa un RUC ecuatoriano válido de 13 dígitos.');
      return;
    }
    if (!nombreCoop.trim() || !telefonoCoop.trim() || !direccionCoop.trim()) {
      setErrorCoop('Completa la razón social, el teléfono y la dirección.');
      return;
    }

    setErrorCoop(null);
    setPasoCoop(2);
  };

  const cerrarWizardCoop = () => {
    setShowCoopModal(false);
    setPasoCoop(1);
    setErrorCoop(null);
    setNombreCoop('');
    setRucCoop('');
    setTelefonoCoop('');
    setDireccionCoop('');
    setAdministradorCoop(administradorVacio);
  };

  const handleFinalizarCoop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (guardandoCoop) return;
    setGuardandoCoop(true);
    setErrorCoop(null);

    try {
      const respuesta = await fetch('/api/admin/cooperativas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreCoop,
          ruc: rucCoop,
          telefono: telefonoCoop,
          direccion: direccionCoop,
          ...administradorCoop,
        }),
      });
      const resultado = await respuesta.json() as {
        error?: string;
        cooperativa?: CooperativaRow;
        administrador?: UsuarioRow;
      };
      if (!respuesta.ok || !resultado.cooperativa || !resultado.administrador) {
        setErrorCoop(resultado.error || 'No se pudo completar el registro.');
        return;
      }

      const { cooperativa, administrador } = resultado;
      setCooperativas((prev) => [cooperativa, ...prev]);
      setUsuarios((prev) => [administrador, ...prev]);
      setAltaCoopMensaje('Se registró la cooperativa y se vinculó su administrador.');
      cerrarWizardCoop();
    } catch {
      setErrorCoop('No se pudo confirmar el registro. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setGuardandoCoop(false);
    }
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              Panel de Administración General
            </h1>
            <Badge variant="admin">SUPERADMIN</Badge>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Supervisión global de cooperativas, asignación de roles de usuario, parámetros institucionales y base de datos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Cooperativas</div>
            <div className="text-2xl font-black text-brand-900 mt-1">{cooperativas.length} Entidades</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <IconBuilding size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Flota Nacional</div>
            <div className="text-2xl font-black text-brand-900 mt-1">{buses.length} Buses</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <IconBus size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Usuarios Registrados</div>
            <div className="text-2xl font-black text-accent-600 mt-1">{usuarios.length} Cuentas</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center font-bold">
            <IconUsers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-neutral-500">Recaudación Global</div>
            <div className="text-2xl font-black text-success-600 mt-1">${totalRecaudado.toFixed(2)}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center font-bold">
            <IconCreditCard size={22} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('cooperativas')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'cooperativas'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Cooperativas ({cooperativas.length})
        </button>
        <button
          onClick={() => setActiveTab('planes')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'planes'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Planes y Rutas Destacadas
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'usuarios'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Gestión de Usuarios y Roles ({usuarios.length})
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'config'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Parámetros del Sistema
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'sync'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Sincronización de Datos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('catalogos')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'catalogos'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Marcas y carrocerías
        </button>
      </div>

      {activeTab === 'catalogos' && <CatalogosFlota />}

      {/* PESTAÑA 1: COOPERATIVAS */}
      {activeTab === 'cooperativas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-900">Directorio de Cooperativas</h2>
            <Button variant="primary" size="sm" onClick={() => {
              setAltaCoopMensaje(null);
              setShowCoopModal(true);
            }}>
              + Nueva Cooperativa
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Razón Social</th>
                  <th className="py-3 px-4">RUC</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {cooperativas.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/60">
                    <td className="py-3 px-4 font-black text-neutral-900 text-sm">{c.nombre}</td>
                    <td className="py-3 px-4 font-mono font-bold text-neutral-700">{c.ruc}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.telefono || 'Sin teléfono'}</td>
                    <td className="py-3 px-4 text-neutral-500 text-[11px] max-w-xs truncate">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Control de Acceso, Empleados y Roles</h2>
              <p className="text-xs text-neutral-500">
                Crea cuentas para el personal operativo (Chofer, Oficinista, Cooperativa, Admin) y administra sus privilegios.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowEmployeeModal(true)}>
              + Registrar Empleado / Personal
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Usuario / Nombre</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {usuarios.map((usr) => (
                  <tr key={usr.id} className="hover:bg-neutral-50/60">
                    <td className="py-3 px-4 font-black text-neutral-900">{usr.nombre}</td>
                    <td className="py-3 px-4 font-mono text-neutral-700">{usr.email}</td>
                    <td className="py-3 px-4 font-mono">{usr.cedula || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={usr.rol}
                        onChange={(e) => handleChangeRole(usr.id, e.target.value as RolUsuario)}
                        className="text-xs border border-neutral-300 rounded px-2 py-1 font-bold bg-neutral-50 focus:bg-white"
                      >
                        {usr.rol === 'admin' && <option value="admin" disabled>SUPERADMIN</option>}
                        {usr.rol === 'cooperativa' && <option value="cooperativa" disabled>ADMINISTRADOR DE COOPERATIVA</option>}
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
        <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="text-lg font-bold text-neutral-900">
            Parámetros Institucionales (ConfiguracionApp)
          </h2>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            {configSavedMsg && (
              <div className="p-3 bg-success-50 text-success-800 text-xs rounded-xl border border-success-200 font-bold">
                ✓ ¡Configuración institucional actualizada correctamente!
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Nombre Oficial de la Plataforma
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Email de Soporte Técnico
                </label>
                <input
                  type="email"
                  value={soporteEmail}
                  onChange={(e) => setSoporteEmail(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Teléfono / WhatsApp de Soporte
                </label>
                <input
                  type="text"
                  value={soporteTel}
                  onChange={(e) => setSoporteTel(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
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
        <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="text-lg font-bold text-neutral-900">Sincronizador Maestro con Supabase</h2>
          <p className="text-sm text-neutral-600">
            Utiliza esta herramienta para sembrar automáticamente en tu base de datos de Supabase todas las
            cooperativas, flota de buses, frecuencias ANT, paradas intermedias y configuración institucional.
          </p>

          {syncResult && (
            <div className="p-3 bg-brand-50 text-brand-900 text-xs rounded-xl border border-brand-200 font-bold">
              {syncResult}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleSeedDatabase}
            disabled={syncing}
            className="w-full py-3 font-bold"
          >
            {syncing ? 'Sincronizando con Supabase...' : 'Sincronizar Datos en Supabase'}
          </Button>
        </div>
      )}

      {/* PESTAÑA 5: PLANES MENSUALES Y RUTAS DESTACADAS (RFC-005) */}
      {activeTab === 'planes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planes.map((plan) => (
              <Card key={plan.id} className="border border-neutral-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black text-neutral-900">
                      Plan {plan.nombre}
                    </CardTitle>
                    <Badge variant="info">${plan.precioMensual.toFixed(2)}/mes</Badge>
                  </div>
                  <CardDescription className="text-xs">{plan.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs font-bold text-brand-700">
                  Cupo: {plan.cupoRutasDestacadas} ruta(s) destacada(s) · {plan.duracionDias} días
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                Activar o Renovar Membresía por Cooperativa (Pago Externo)
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Solo el SuperAdmin puede activar o suspender planes tras verificar el pago externo.
              </p>
            </div>

            {planFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  planFeedback.tipo === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {planFeedback.msg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Cooperativa
                </label>
                <select
                  value={planCoopId}
                  onChange={(e) => setPlanCoopId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  {cooperativas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Plan Mensual
                </label>
                <select
                  value={planSelectedId}
                  onChange={(e) => setPlanSelectedId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.cupoRutasDestacadas} rutas - ${p.precioMensual.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Referencia de Pago Externo
                </label>
                <input
                  type="text"
                  value={planObsPago}
                  onChange={(e) => setPlanObsPago(e.target.value)}
                  placeholder="Ej: Transferencia #458912"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                disabled={planSaving || !planCoopId || !planSelectedId}
                onClick={async () => {
                  setPlanSaving(true);
                  setPlanFeedback(null);
                  const res = await dataService.activarPlanCooperativa({
                    rolEjecutor: 'admin',
                    cooperativaId: planCoopId,
                    planId: planSelectedId,
                    activadoPor: 'SuperAdmin',
                    observacionPagoExterno: planObsPago,
                  });
                  if (res.error || !res.data) {
                    setPlanFeedback({ tipo: 'err', msg: res.error || 'Error al activar plan.' });
                  } else {
                    const updated = await dataService.getSuscripcionesCooperativas();
                    setSuscripciones(updated);
                    setPlanObsPago('');
                    setPlanFeedback({
                      tipo: 'ok',
                      msg: `Plan activado hasta el ${res.data.fechaVencimiento}.`,
                    });
                  }
                  setPlanSaving(false);
                }}
              >
                {planSaving ? 'Activando...' : 'Activar / Renovar Plan (30 días)'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">
                Historial de Suscripciones por Cooperativa ({suscripciones.length})
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase">
                <tr>
                  <th className="p-3">Cooperativa</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Vigencia</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Pago Externo</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {suscripciones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-neutral-500">
                      No existen suscripciones registradas todavía.
                    </td>
                  </tr>
                ) : (
                  suscripciones.map((sub) => {
                    const coopNombre =
                      cooperativas.find((c) => c.id === sub.cooperativaId)?.nombre ||
                      sub.cooperativaId;
                    const planObj = planes.find((p) => p.id === sub.planId);
                    return (
                      <tr key={sub.id} className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-neutral-900">{coopNombre}</td>
                        <td className="p-3">{planObj ? `${planObj.nombre} (${planObj.cupoRutasDestacadas})` : sub.planId}</td>
                        <td className="p-3 font-mono">
                          {sub.fechaInicio} → {sub.fechaVencimiento}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              sub.estado === 'ACTIVA'
                                ? 'success'
                                : sub.estado === 'VENCIDA'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {sub.estado}
                          </Badge>
                        </td>
                        <td className="p-3 text-neutral-600">
                          {sub.observacionPagoExterno || '-'}
                        </td>
                        <td className="p-3 text-right">
                          {sub.estado === 'ACTIVA' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const res = await dataService.suspenderPlanCooperativa({
                                  rolEjecutor: 'admin',
                                  suscripcionId: sub.id,
                                });
                                if (!res.error) {
                                  setSuscripciones(await dataService.getSuscripcionesCooperativas());
                                }
                              }}
                            >
                              Suspender
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {altaCoopMensaje && (
        <p role="status" className="text-sm text-success-800">{altaCoopMensaje}</p>
      )}

      {/* Modal Nueva Cooperativa */}
      {showCoopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-neutral-900 mb-4">Registrar Cooperativa</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Paso {pasoCoop} de 2 · {pasoCoop === 1 ? 'Datos de la cooperativa' : 'Administrador de la cooperativa'}
            </p>
            {pasoCoop === 1 ? (
              <form onSubmit={handleSiguienteCoop} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Razón Social</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cooperativa Transporte Ambato"
                    value={nombreCoop}
                    onChange={(e) => setNombreCoop(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">RUC Ecuatoriano</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    aria-invalid={errorCoop !== null && !validarRucCooperativa(rucCoop)}
                    aria-describedby={errorCoop ? 'error-cooperativa' : undefined}
                    placeholder="13 dígitos"
                    value={rucCoop}
                    onChange={(e) => {
                      setRucCoop(e.target.value);
                      setErrorCoop(null);
                    }}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 032520890"
                    value={telefonoCoop}
                    onChange={(e) => setTelefonoCoop(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Dirección Principal</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Terminal Terrestre Ingahurco"
                    value={direccionCoop}
                    onChange={(e) => setDireccionCoop(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>

                {errorCoop && (
                  <p id="error-cooperativa" role="alert" className="text-sm text-danger-800">
                    {errorCoop}
                  </p>
                )}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" variant="primary" className="w-full">
                    Siguiente
                  </Button>
                  <Button type="button" variant="outline" onClick={cerrarWizardCoop}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleFinalizarCoop} className="space-y-3">
                <p className="text-sm text-neutral-700">
                  El administrador quedará vinculado a {nombreCoop.trim()}.
                </p>
                <fieldset disabled={guardandoCoop} className="space-y-3">
                  {camposAdministrador.map(({ key, label, type, autoComplete }) => (
                    <div key={key}>
                      <label htmlFor={`coop-admin-${key}`} className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        {label}
                      </label>
                      <input
                        id={`coop-admin-${key}`}
                        type={type}
                        autoComplete={autoComplete}
                        required
                        value={administradorCoop[key]}
                        onChange={(e) => setAdministradorCoop((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  ))}
                </fieldset>
                {errorCoop && (
                  <p role="alert" className="text-sm text-danger-800">{errorCoop}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button type="submit" variant="primary" isLoading={guardandoCoop}>
                    Finalizar
                  </Button>
                  <Button type="button" variant="outline" disabled={guardandoCoop} onClick={() => {
                    setErrorCoop(null);
                    setPasoCoop(1);
                  }}>
                    Atrás
                  </Button>
                  <Button type="button" variant="outline" disabled={guardandoCoop} onClick={cerrarWizardCoop}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Nuevo Empleado / Personal Operativo */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-brand-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-black text-neutral-900">Registrar Cuenta de Empleado</h3>
              <Badge variant="admin">SOLO ADMIN</Badge>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Crea credenciales para el personal operativo. El administrador de cooperativa se registra desde el wizard.
            </p>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Andrade"
                  value={empNombre}
                  onChange={(e) => setEmpNombre(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cédula de Identidad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1802345678"
                  value={empCedula}
                  onChange={(e) => setEmpCedula(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Rol del Empleado *</label>
                <select
                  value={empRol}
                  onChange={(e) => setEmpRol(e.target.value as RolUsuario)}
                  className="w-full text-sm border border-brand-300 bg-brand-50/40 rounded-lg px-3 py-2 font-bold text-brand-900"
                >
                  <option value="oficinista">oficinista (Personal de Ventanilla / Pagos)</option>
                  <option value="chofer">chofer (Conductor / Ayudante de Unidad)</option>
                </select>
              </div>
              {empRol === 'cooperativa' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cooperativa Asignada</label>
                  <select
                    value={empCoopId}
                    onChange={(e) => setEmpCoopId(e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">-- Seleccionar cooperativa --</option>
                    {cooperativas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  placeholder="empleado@ecurutas.ec"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              {empFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-bold ${
                    empFeedback.tipo === 'ok'
                      ? 'bg-success-50 text-success-800 border border-success-200'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}
                >
                  {empFeedback.msg}
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <Button type="submit" variant="primary" className="w-full" isLoading={empCreating}>
                  Crear Cuenta de Empleado
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEmployeeModal(false);
                    setEmpFeedback(null);
                  }}
                >
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
