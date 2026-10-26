'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database, RolUsuario } from '@/types/database.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
  const [rol, setRol] = useState<RolUsuario>('usuario');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setErrorMessage(
            'El correo no está confirmado en Supabase. Pídele a tu amigo que desactive "Confirm email" en Authentication > Providers > Email de Supabase, o que ejecute el script SQL setup_auth_y_usuarios.sql.'
          );
        } else {
          setErrorMessage(`Error: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setErrorMessage('No se pudo obtener información del usuario.');
        setLoading(false);
        return;
      }

      setStatusMessage('Autenticación exitosa. Consultando tabla "Usuario"...');

      const { data: usuario, error: userError } = await supabase
        .from('Usuario')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      const profile = usuario as { rol: RolUsuario; activo: boolean; nombre: string } | null;

      if (userError || !profile) {
        setErrorMessage(`Conexión a Auth OK, pero no se encontró registro en "Usuario": ${userError?.message || 'Sin perfil'}`);
        setLoading(false);
        return;
      }

      if (!profile.activo) {
        await supabase.auth.signOut();
        setErrorMessage('Esta cuenta se encuentra inactiva.');
        setLoading(false);
        return;
      }

      const userRol = profile.rol;
      const target = redirectTo || roleHome[userRol] || '/';
      setStatusMessage(`Bienvenido, ${profile.nombre || email}. Redirigiendo a ${target}...`);

      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const supabase = createClient();

      // 1. Registro en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, rol, cedula },
        },
      });

      if (authError) {
        setErrorMessage(`Error al crear usuario en Auth: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setErrorMessage('No se pudo crear la cuenta en Auth.');
        setLoading(false);
        return;
      }

      // 2. Inserción en la tabla "Usuario"
      const { error: insertError } = await supabase.from('Usuario').upsert({
        id: authData.user.id,
        email,
        nombre,
        cedula,
        rol,
        activo: true,
      } as Database['public']['Tables']['Usuario']['Insert']);

      if (insertError) {
        setErrorMessage(`Usuario creado en Auth, pero falló en tabla "Usuario": ${insertError.message}`);
        setLoading(false);
        return;
      }

      // 3. Verificar si la sesión inició automáticamente
      if (authData.session) {
        const target = redirectTo || roleHome[rol] || '/';
        setStatusMessage(`¡Cuenta creada con éxito con rol ${rol.toUpperCase()}! Redirigiendo a ${target}...`);
        router.push(target);
        router.refresh();
      } else {
        setStatusMessage(
          `¡Usuario registrado en la base de datos! Si Supabase requiere confirmación de correo, dile a tu amigo que desactive "Confirm email" en Authentication > Providers > Email o que confirme el correo para iniciar sesión.`
        );
        setMode('login');
      }
    } catch (err: unknown) {
      setErrorMessage(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[65vh]">
      <Card className="w-full max-w-md">
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              mode === 'login'
                ? 'border-b-2 border-blue-800 text-blue-900 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              mode === 'register'
                ? 'border-b-2 border-blue-800 text-blue-900 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Crear Cuenta / Rol
          </button>
        </div>

        <CardHeader className="text-center pt-5">
          <CardTitle className="text-xl">
            {mode === 'login' ? 'Acceso al Sistema' : 'Registro de Usuario'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Ingresa tus credenciales registradas en la base de datos'
              : 'Registra un usuario asignándole su rol correspondiente'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Cédula / Identificación
                  </label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="1801234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Rol en el Sistema
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as RolUsuario)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="usuario">usuario (Pasajero / Cliente)</option>
                    <option value="chofer">chofer (Chofer / Ayudante)</option>
                    <option value="oficinista">oficinista (Ventanilla / Pagos)</option>
                    <option value="cooperativa">cooperativa (Gestión de Flota)</option>
                    <option value="admin">admin (Administrador Global)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@uta.edu.ec"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg whitespace-pre-line">
                {errorMessage}
              </div>
            )}

            {statusMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg whitespace-pre-line">
                {statusMessage}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              {mode === 'login' ? 'Ingresar al Sistema' : 'Registrar Cuenta'}
            </Button>
          </form>
        </CardContent>
      </Card>
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
