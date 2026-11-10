'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database, RolUsuario } from '@/types/database.types';
import { Button } from '@/components/ui/Button';
import {
  IconBus,
  IconShieldCheck,
  IconQrCode,
  IconMapPin,
  IconUser,
  IconTicket,
  IconArrowRight,
} from '@/components/ui/Icons';

const ROL_REGISTRO_PUBLICO: RolUsuario = 'usuario';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const errorParam = searchParams.get('error');

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'cuenta_inactiva' ? 'Tu cuenta se encuentra desactivada.' : null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const roleHome: Record<RolUsuario, string> = {
    admin: '/admin',
    cooperativa: '/cooperativa',
    oficinista: '/oficina',
    chofer: '/chofer',
    usuario: '/pasajero',
  };

  const rolePermissions: Record<string, RolUsuario[]> = {
    '/admin': ['admin'],
    '/configuracion': ['admin'],
    '/cooperativa': ['admin', 'cooperativa'],
    '/buses': ['admin', 'cooperativa'],
    '/frecuencias': ['admin', 'cooperativa'],
    '/reportes': ['admin', 'cooperativa'],
    '/oficina': ['admin', 'cooperativa', 'oficinista'],
    '/ventas': ['admin', 'cooperativa', 'oficinista'],
    '/pagos': ['admin', 'cooperativa', 'oficinista'],
    '/chofer': ['chofer', 'admin'],
    '/escaneo': ['chofer', 'admin'],
    '/pasajero': ['usuario', 'admin'],
    '/boletos': ['usuario', 'admin'],
  };

  const resolveTargetForRole = (rol: RolUsuario): string => {
    if (redirectTo) {
      const matchedPrefix = Object.keys(rolePermissions).find(
        (prefix) => redirectTo === prefix || redirectTo.startsWith(`${prefix}/`)
      );
      if (!matchedPrefix || rolePermissions[matchedPrefix].includes(rol)) {
        return redirectTo;
      }
    }
    return roleHome[rol] || '/';
  };

  const executeLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const supabase = createClient();

      await supabase.auth.signOut();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setErrorMessage(
            'El correo electrónico aún no está confirmado en el servidor de autenticación.'
          );
        } else {
          setErrorMessage('El correo o la contraseña ingresados no coinciden con una cuenta activa.');
        }
        setLoading(false);
        return;
      }

      const authenticatedUser = authData?.user ?? null;
      if (!authenticatedUser) {
        setErrorMessage('No se pudo verificar la sesión del usuario.');
        setLoading(false);
        return;
      }

      setStatusMessage('Verificando permisos de acceso...');

      let { data: usuario } = await supabase
        .from('Usuario')
        .select('*')
        .eq('id', authenticatedUser.id)
        .maybeSingle();

      if (!usuario) {
        const byEmail = await supabase
          .from('Usuario')
          .select('*')
          .eq('email', loginEmail.trim())
          .maybeSingle();
        usuario = byEmail.data;
      }

      const profile = usuario as { rol: string; activo: boolean; nombre: string } | null;

      if (!profile) {
        const metadata = (authenticatedUser.user_metadata || {}) as Record<string, string>;
        const rolRecuperado = (metadata.rol as RolUsuario) || 'usuario';
        const nombreRecuperado = metadata.nombre || loginEmail.split('@')[0];
        const cedulaRecuperada = metadata.cedula || ('SN-' + authenticatedUser.id.substring(0, 8));

        const { error: autoCreateError } = await supabase.from('Usuario').upsert({
          id: authenticatedUser.id,
          email: authenticatedUser.email || loginEmail,
          nombre: nombreRecuperado,
          cedula: cedulaRecuperada,
          rol: rolRecuperado,
          activo: true,
          password: '[managed_by_supabase_auth]',
        } as unknown as Database['public']['Tables']['Usuario']['Insert']);

        if (!autoCreateError) {
          const target = resolveTargetForRole(rolRecuperado);
          setStatusMessage(`Acceso confirmado para ${nombreRecuperado}. Redirigiendo a ${target}...`);
          router.push(target);
          router.refresh();
          return;
        }

        setErrorMessage(`No se encontró el perfil del usuario en el padrón: ${autoCreateError.message}`);
        setLoading(false);
        return;
      }

      if (profile.activo === false) {
        await supabase.auth.signOut();
        setErrorMessage('Esta cuenta se encuentra suspendida o inactiva.');
        setLoading(false);
        return;
      }

      const normalizedRol: RolUsuario =
        profile.rol === 'personal_bus'
          ? 'chofer'
          : profile.rol === 'cliente'
            ? 'usuario'
            : (profile.rol as RolUsuario);

      const target = resolveTargetForRole(normalizedRol);
      setStatusMessage(`Acceso confirmado para ${profile.nombre || loginEmail}. Redirigiendo a ${target}...`);

      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        `No se pudo completar el inicio de sesión: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const supabase = createClient();

      let targetUser = null;
      let targetSession = null;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, rol: ROL_REGISTRO_PUBLICO, cedula },
        },
      });

      if (authError) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInError && signInData.user) {
          targetUser = signInData.user;
          targetSession = signInData.session;
        } else if (authError.message.toLowerCase().includes('rate limit')) {
          setErrorMessage(
            'Se alcanzó el límite temporal de envíos de correo. Intenta nuevamente en unos minutos.'
          );
          setLoading(false);
          return;
        } else {
          setErrorMessage(`No se pudo registrar la cuenta: ${authError.message}`);
          setLoading(false);
          return;
        }
      } else {
        targetUser = authData.user;
        targetSession = authData.session;

        if (targetUser && targetUser.identities && targetUser.identities.length === 0) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInData?.user) {
            targetUser = signInData.user;
            targetSession = signInData.session;
          }
        }
      }

      if (!targetUser) {
        setErrorMessage('No se pudo registrar la cuenta de usuario.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('Usuario').upsert({
        id: targetUser.id,
        email,
        nombre,
        cedula,
        rol: ROL_REGISTRO_PUBLICO,
        activo: true,
        password: '[managed_by_supabase_auth]',
      } as unknown as Database['public']['Tables']['Usuario']['Insert']);

      if (insertError) {
        setErrorMessage(`No se pudo guardar el registro del pasajero: ${insertError.message}`);
        setLoading(false);
        return;
      }

      if (targetSession) {
        const target = resolveTargetForRole(ROL_REGISTRO_PUBLICO);
        setStatusMessage(`Cuenta de pasajero creada. Redirigiendo a ${target}...`);
        router.push(target);
        router.refresh();
      } else {
        const { data: autoLogin } = await supabase.auth.signInWithPassword({ email, password });
        if (autoLogin?.session) {
          const target = resolveTargetForRole(ROL_REGISTRO_PUBLICO);
          setStatusMessage(`Cuenta de pasajero creada. Redirigiendo a ${target}...`);
          router.push(target);
          router.refresh();
        } else {
          setStatusMessage(
            'Cuenta de pasajero registrada. Ya puedes iniciar sesión con tu correo y contraseña.'
          );
          setMode('login');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(
        `No se pudo completar el registro: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-brand-800 text-white py-8 px-4 sm:px-8 shadow-card border-b-4 border-accent-500 rounded-2xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <span className="inline-block bg-white/15 border border-white/25 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-md mb-2">
              Transporte Interprovincial del Ecuador · ANT
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
              Cooperativa de Transportes EcuRutas
            </h1>
            <p className="text-brand-100 text-xs sm:text-sm mt-1">
              Consulta destinos, horarios y paradas intermedias, y adquiere tus boletos en línea con código QR.
            </p>
          </div>
          <Link
            href="/busqueda"
            className="inline-flex items-center gap-2 bg-white text-brand-800 hover:bg-brand-50 font-black text-xs sm:text-sm uppercase tracking-wider px-5 py-3 rounded-xl shadow-subtle transition-transform active:scale-95 shrink-0"
          >
            <IconBus size={16} />
            <span>Consultar horarios y rutas</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-card border border-neutral-200 overflow-hidden">
          <div className="lg:col-span-6 bg-brand-700 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <span className="bg-white text-brand-700 font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider">
                  Boletería Oficial
                </span>
                <span className="text-xs text-brand-100 font-semibold">
                  Emisión directa en línea
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Viaja por todo el Ecuador con tu boleto electrónico QR
              </h2>

              <p className="text-sm text-brand-100 leading-relaxed">
                Accede a tu cuenta para comprar pasajes sin filas en terminal, elegir tu asiento en el croquis 2D de la unidad y descargar tus comprobantes en PDF.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-white/10 p-3.5 rounded-xl border border-white/15">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <IconBus size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Selección de Asientos 2D (Normal y VIP)
                    </h3>
                    <p className="text-xs text-brand-100 mt-0.5">
                      Elige tu ubicación exacta por piso y tramo intermedio en tiempo real.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 p-3.5 rounded-xl border border-white/15">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <IconShieldCheck size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Tarifa Preferencial ANT (50% de Descuento)
                    </h3>
                    <p className="text-xs text-brand-100 mt-0.5">
                      Cálculo automático con cédula ecuatoriana para tercera edad, menores de edad y personas con discapacidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 p-3.5 rounded-xl border border-white/15">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <IconQrCode size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Embarque Directo en Andén con Código QR
                    </h3>
                    <p className="text-xs text-brand-100 mt-0.5">
                      Notificación al aprobar tu transferencia bancaria y lectura inmediata al abordar la unidad.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs text-brand-100">
              <span className="inline-flex items-center gap-1.5">
                <IconMapPin size={14} />
                <span>Terminales: Ambato · Baños · Quito · Guayaquil · Cuenca</span>
              </span>
              <span className="font-bold text-accent-300">Frecuencias Autorizadas ANT</span>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-10 bg-white flex flex-col justify-center">
            <div className="flex rounded-xl bg-brand-50 p-1 border border-brand-100 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-brand-700 text-white shadow-subtle'
                    : 'text-brand-800 hover:bg-brand-100/70'
                }`}
              >
                <IconUser size={14} />
                <span>Iniciar Sesión</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-brand-700 text-white shadow-subtle'
                    : 'text-brand-800 hover:bg-brand-100/70'
                }`}
              >
                <IconTicket size={14} />
                <span>Crear Cuenta de Pasajero</span>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
                {mode === 'login' ? 'Ingresa a tu cuenta' : 'Registro de Nuevo Pasajero'}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                {mode === 'login'
                  ? 'Ingresa tu correo electrónico y contraseña para acceder a tu módulo.'
                  : 'Crea tu cuenta personal de pasajero para comprar boletos y consultar tu historial de viajes.'}
              </p>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="p-3 rounded-xl bg-brand-50/80 border border-brand-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <IconTicket size={16} className="text-brand-700 shrink-0" />
                      <div>
                        <span className="block text-xs font-extrabold text-brand-900 uppercase">
                          Tipo de Cuenta: Pasajero / Cliente
                        </span>
                        <span className="block text-[11px] text-brand-700">
                          Las cuentas de personal operativo y boletería son asignadas por la administración.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                      Nombres y Apellidos Completos *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Carlos Gavilanes"
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                      Cédula de Identidad / Pasaporte *
                    </label>
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="1801234567"
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-600 focus:border-brand-600 focus:outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@correo.ec"
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600 focus:outline-none transition-all"
                />
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-danger-50 border-l-4 border-danger-600 text-danger-800 text-xs font-medium rounded-r-xl whitespace-pre-line">
                  {errorMessage}
                </div>
              )}

              {statusMessage && (
                <div className="p-3.5 bg-success-50 border-l-4 border-success-600 text-success-800 text-xs font-bold rounded-r-xl whitespace-pre-line">
                  {statusMessage}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-extrabold uppercase tracking-wider py-3 rounded-xl bg-brand-700 hover:bg-brand-800 shadow-subtle"
                isLoading={loading}
              >
                <span>{mode === 'login' ? 'Ingresar al Sistema' : 'Crear Cuenta de Pasajero'}</span>
                <IconArrowRight size={15} />
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
              <p className="text-xs text-neutral-500">
                ¿Deseas consultar horarios antes de registrarte?{' '}
                <Link href="/busqueda" className="font-bold text-brand-700 hover:underline">
                  Ir al buscador de frecuencias
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm text-neutral-500">Cargando acceso...</div>}>
      <AuthForm />
    </Suspense>
  );
}
