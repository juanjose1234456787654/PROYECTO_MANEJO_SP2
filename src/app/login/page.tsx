'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database, RolUsuario } from '@/types/database.types';
import { Button } from '@/components/ui/Button';

const ROL_REGISTRO_PUBLICO: RolUsuario = 'usuario';

const CUENTAS_SISTEMA: Array<{
  rol: RolUsuario;
  etiqueta: string;
  subtitulo: string;
  email: string;
  password: string;
  nombre: string;
  cedula: string;
  ruta: string;
}> = [
  {
    rol: 'admin',
    etiqueta: 'Administrador',
    subtitulo: 'Panel Global & Alta Empleados',
    email: 'admin@uta.edu.ec',
    password: 'Uta2026!',
    nombre: 'Administrador General UTA',
    cedula: '1800000001',
    ruta: '/admin',
  },
  {
    rol: 'oficinista',
    etiqueta: 'Oficinista',
    subtitulo: 'Ventanilla & Boletería',
    email: 'oficina@uta.edu.ec',
    password: 'Uta2026!',
    nombre: 'Oficinista Ventanilla',
    cedula: '1800000003',
    ruta: '/oficina',
  },
  {
    rol: 'cooperativa',
    etiqueta: 'Cooperativa',
    subtitulo: 'Flota, Rutas & Frecuencias',
    email: 'cooperativa@uta.edu.ec',
    password: 'Uta2026!',
    nombre: 'Gerente Cooperativa Ambato',
    cedula: '1800000002',
    ruta: '/cooperativa',
  },
  {
    rol: 'chofer',
    etiqueta: 'Chofer / QR',
    subtitulo: 'Control de Abordaje',
    email: 'chofer@uta.edu.ec',
    password: 'Uta2026!',
    nombre: 'Chofer Conductor',
    cedula: '1800000004',
    ruta: '/chofer',
  },
  {
    rol: 'usuario',
    etiqueta: 'Pasajero',
    subtitulo: 'Compra & Mis Boletos',
    email: 'pasajero@uta.edu.ec',
    password: 'Uta2026!',
    nombre: 'Pasajero Viajero',
    cedula: '1800000005',
    ruta: '/pasajero',
  },
];

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

  const executeLogin = async (loginEmail: string, loginPassword: string, forcedTarget?: string) => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const supabase = createClient();

      // Cerrar cualquier sesión previa para permitir cambio limpio entre roles
      await supabase.auth.signOut();

      const { data: authData, error: initialAuthError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      let authenticatedUser = authData?.user ?? null;
      let authError = initialAuthError;

      // Si es una de las cuentas oficiales del sistema y aún no existe en Auth, auto-aprovisionarla
      const cuentaOficial = CUENTAS_SISTEMA.find(
        (c) => c.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (authError && cuentaOficial) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cuentaOficial.email,
          password: cuentaOficial.password,
          options: {
            data: {
              nombre: cuentaOficial.nombre,
              cedula: cuentaOficial.cedula,
              rol: cuentaOficial.rol,
            },
          },
        });
        if (!signUpError && signUpData.user) {
          authenticatedUser = signUpData.user;
          authError = null;
        }
      }

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setErrorMessage(
            'El correo no está confirmado en Supabase. Desactiva "Confirm email" en Authentication > Providers > Email de Supabase, o ejecuta el script SQL setup_auth_y_usuarios.sql.'
          );
        } else {
          setErrorMessage(`Credenciales incorrectas o cuenta no registrada: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authenticatedUser) {
        setErrorMessage('No se pudo obtener información del usuario.');
        setLoading(false);
        return;
      }

      setStatusMessage('Autenticación exitosa. Verificando perfil de acceso...');

      // Buscar perfil por ID o fallback por correo electrónico
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

      // Si es cuenta oficial del sistema, garantizar que su rol esté sincronizado en "Usuario"
      if (cuentaOficial) {
        await supabase.from('Usuario').upsert({
          id: authenticatedUser.id,
          email: cuentaOficial.email,
          nombre: cuentaOficial.nombre,
          cedula: cuentaOficial.cedula,
          rol: cuentaOficial.rol,
          activo: true,
          password: '[managed_by_supabase_auth]',
        } as unknown as Database['public']['Tables']['Usuario']['Insert']);

        const target = forcedTarget || resolveTargetForRole(cuentaOficial.rol);
        setStatusMessage(
          `¡Bienvenido, ${cuentaOficial.nombre}! Redirigiendo a ${target}...`
        );
        router.push(target);
        router.refresh();
        return;
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
          const target = forcedTarget || resolveTargetForRole(rolRecuperado);
          setStatusMessage(`¡Bienvenido, ${nombreRecuperado}! Redirigiendo a ${target}...`);
          router.push(target);
          router.refresh();
          return;
        }

        setErrorMessage(`Conexión a Auth OK, pero no se encontró registro en "Usuario": ${autoCreateError.message}`);
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

      const target = forcedTarget || resolveTargetForRole(normalizedRol);
      setStatusMessage(`Bienvenido, ${profile.nombre || loginEmail}. Redirigiendo a ${target}...`);

      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
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

      // El registro público crea exclusivamente cuentas con rol 'usuario' (Pasajero / Cliente)
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
            'Límite de correos de Supabase alcanzado. Desactiva "Confirm email" en Authentication > Providers > Email de Supabase para permitir registro inmediato.'
          );
          setLoading(false);
          return;
        } else {
          setErrorMessage(`Error al crear la cuenta: ${authError.message}`);
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
        setErrorMessage('No se pudo obtener la cuenta en Auth.');
        setLoading(false);
        return;
      }

      // Inserción en la tabla "Usuario" siempre con rol 'usuario' (cliente común)
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
        setErrorMessage(`Usuario creado en Auth, pero falló en tabla "Usuario": ${insertError.message}`);
        setLoading(false);
        return;
      }

      if (targetSession) {
        const target = redirectTo || roleHome[ROL_REGISTRO_PUBLICO] || '/pasajero';
        setStatusMessage(`¡Cuenta de pasajero creada con éxito! Redirigiendo a ${target}...`);
        router.push(target);
        router.refresh();
      } else {
        const { data: autoLogin } = await supabase.auth.signInWithPassword({ email, password });
        if (autoLogin?.session) {
          const target = redirectTo || roleHome[ROL_REGISTRO_PUBLICO] || '/pasajero';
          setStatusMessage(`¡Cuenta de pasajero creada con éxito! Redirigiendo a ${target}...`);
          router.push(target);
          router.refresh();
        } else {
          setStatusMessage(
            '¡Cuenta de pasajero registrada con éxito! Ya puedes iniciar sesión con tu correo y contraseña.'
          );
          setMode('login');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Banner Institucional Superior (Inspirado en Cooperativa de Transportes) */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-rose-800 text-white py-8 px-4 sm:px-8 shadow-lg border-b-4 border-amber-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <span className="inline-block bg-white/15 border border-white/25 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              ★ Transporte Interprovincial del Ecuador · ANT
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
              Cooperativa &amp; Red Interprovincial EcuRutas
            </h1>
            <p className="text-red-100 text-xs sm:text-sm mt-1">
              Consulta destinos, horarios, paradas intermedias y adquiere tus boletos digitales con firma criptográfica QR.
            </p>
          </div>
          <Link
            href="/busqueda"
            className="inline-flex items-center gap-2 bg-white text-red-800 hover:bg-red-50 font-black text-xs sm:text-sm uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-transform active:scale-95 shrink-0"
          >
            <span>🗺️ Planear Viajes y Horarios</span>
          </Link>
        </div>
      </div>

      {/* Contenedor Principal en 2 Columnas (Rojo Carmesí y Blanco) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden">
          {/* Columna Izquierda: Panel Visual Rojo Carmesí */}
          <div className="lg:col-span-6 bg-gradient-to-br from-red-700 via-red-800 to-zinc-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-red-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <span className="bg-white text-red-700 font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider">
                  Boletería Oficial
                </span>
                <span className="text-xs text-red-200 font-semibold">
                  Atención 24/7 en Línea
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Viaja seguro por todo el Ecuador con tu Boleto Digital QR
              </h2>

              <p className="text-sm text-red-100 leading-relaxed">
                Accede a tu cuenta para comprar pasajes sin filas, elegir tu asiento en el croquis 2D del bus y descargar tus comprobantes en PDF.
              </p>

              {/* Beneficios destacados */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/15">
                  <span className="text-xl">💺</span>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Selección de Asientos 2D (Normal y VIP)
                    </h3>
                    <p className="text-xs text-red-100 mt-0.5">
                      Elige tu ubicación exacta por piso y tramo intermedio en tiempo real.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/15">
                  <span className="text-xl">🪪</span>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Tarifa Preferencial ANT (50% Descuento)
                    </h3>
                    <p className="text-xs text-red-100 mt-0.5">
                      Validación automática con cédula ecuatoriana para tercera edad, menores y discapacidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/15">
                  <span className="text-xl">📲</span>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Embarque Rápido con Código QR Firmado
                    </h3>
                    <p className="text-xs text-red-100 mt-0.5">
                      Notificaciones en vivo al aprobar tu transferencia y lectura inmediata al abordar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs text-red-100">
              <span>📍 Terminales: Ambato · Baños · Quito · Guayaquil · Cuenca</span>
              <span className="font-bold text-amber-300">100% Verificado</span>
            </div>
          </div>

          {/* Columna Derecha: Formulario Blanco con Acentos Rojos */}
          <div className="lg:col-span-6 p-6 sm:p-10 bg-white flex flex-col justify-center">
            {/* Pestañas Login / Registro de Pasajero */}
            <div className="flex rounded-xl bg-red-50 p-1 border border-red-100 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-red-700 text-white shadow-md'
                    : 'text-red-800 hover:bg-red-100/70'
                }`}
              >
                🔑 Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-red-700 text-white shadow-md'
                    : 'text-red-800 hover:bg-red-100/70'
                }`}
              >
                👤 Crear Cuenta de Pasajero
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {mode === 'login' ? 'Bienvenido de nuevo' : 'Registro de Nuevo Pasajero'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {mode === 'login'
                  ? 'Ingresa tu correo y contraseña para acceder a tu portal correspondiente.'
                  : 'Crea tu cuenta personal de cliente para comprar pasajes y gestionar tus boletos.'}
              </p>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'register' && (
                <>
                  {/* Aviso claro de que el registro público es exclusivo para Pasajeros */}
                  <div className="p-3 rounded-xl bg-red-50/80 border border-red-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎫</span>
                      <div>
                        <span className="block text-xs font-extrabold text-red-900 uppercase">
                          Tipo de Cuenta: Pasajero / Cliente
                        </span>
                        <span className="block text-[11px] text-red-700">
                          Las cuentas de personal y empleados son asignadas únicamente por el Administrador.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Nombres y Apellidos Completos *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Cédula de Identidad / Pasaporte *
                    </label>
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="1801234567"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-none transition-all"
                />
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-red-50 border-l-4 border-red-600 text-red-800 text-xs font-medium rounded-r-xl whitespace-pre-line">
                  {errorMessage}
                </div>
              )}

              {statusMessage && (
                <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs font-bold rounded-r-xl whitespace-pre-line">
                  {statusMessage}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-extrabold uppercase tracking-wider py-3 rounded-xl bg-red-700 hover:bg-red-800 shadow-lg shadow-red-700/25"
                isLoading={loading}
              >
                {mode === 'login' ? 'Ingresar al Sistema ➔' : 'Crear Cuenta de Pasajero ➔'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                ¿Deseas ver las frecuencias antes de registrarte?{' '}
                <Link href="/busqueda" className="font-bold text-red-700 hover:underline">
                  Ir al buscador de rutas
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
    <Suspense fallback={<div className="text-center p-8 text-sm text-gray-500">Cargando formulario...</div>}>
      <AuthForm />
    </Suspense>
  );
}
