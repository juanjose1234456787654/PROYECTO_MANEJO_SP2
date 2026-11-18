import { randomUUID } from 'node:crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validarCedulaEcuatoriana } from '@/lib/services/cedulaService';
import { validarRucCooperativa } from '@/lib/services/rucService';
import { getSupabaseEnv } from '@/lib/supabase/client';
import { createClient } from '@/lib/supabase/server';

function leerCampos(valor: unknown) {
  if (typeof valor !== 'object' || valor === null) return null;
  const datos = valor as Record<string, unknown>;
  const { nombre, ruc, telefono, direccion, nombreAdmin, cedula, email, password } = datos;
  if (
    typeof nombre !== 'string' || typeof ruc !== 'string' ||
    typeof telefono !== 'string' || typeof direccion !== 'string' ||
    typeof nombreAdmin !== 'string' || typeof cedula !== 'string' ||
    typeof email !== 'string' || typeof password !== 'string'
  ) return null;

  return {
    nombre: nombre.trim(),
    ruc: ruc.trim(),
    telefono: telefono.trim(),
    direccion: direccion.trim(),
    nombreAdmin: nombreAdmin.trim(),
    cedula: cedula.trim().replace(/-/g, ''),
    email: email.trim(),
    password,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 });
  }

  // El permiso global se asigna en Auth, en metadatos que el usuario no puede editar.
  if (user.app_metadata.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No tienes permiso para registrar cooperativas.' }, { status: 403 });
  }

  const { data: perfil } = await supabase.from('Usuario').select('activo, rol').eq('id', user.id).maybeSingle();
  if (!perfil?.activo || perfil.rol !== 'admin') {
    return NextResponse.json({ error: 'Tu cuenta no está habilitada para esta operacion.' }, { status: 403 });
  }

  const campos = leerCampos(await request.json().catch(() => null));
  if (!campos || !validarRucCooperativa(campos.ruc)) {
    return NextResponse.json({ error: 'Ingresa un RUC ecuatoriano válido de 13 dígitos.' }, { status: 400 });
  }
  if (!campos.nombre || !campos.telefono || !campos.direccion || !campos.nombreAdmin) {
    return NextResponse.json({ error: 'Completa los datos de la cooperativa y del administrador.' }, { status: 400 });
  }
  if (!validarCedulaEcuatoriana(campos.cedula) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email)) {
    return NextResponse.json({ error: 'Ingresa una cédula y un correo válidos para el administrador.' }, { status: 400 });
  }
  if (Array.from(campos.password).length < 12 || !campos.password.trim()) {
    return NextResponse.json({ error: 'Usa una contraseña de al menos 12 caracteres.' }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'El registro de cooperativas aún no está configurado.' }, { status: 503 });
  }
  const admin = createSupabaseClient(getSupabaseEnv().url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: habilitada, error: errorMigracion } = await admin.rpc('alta_cooperativa_habilitada');
  if (errorMigracion || habilitada !== true) {
    return NextResponse.json({ error: 'El registro conjunto de cooperativas aún no está habilitado.' }, { status: 503 });
  }

  const { nombre, ruc, telefono, direccion, nombreAdmin, cedula, email, password } = campos;
  const cooperativa = { id: randomUUID(), nombre, ruc, telefono, direccion };
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre: nombreAdmin, cedula },
    app_metadata: { alta_cooperativa: cooperativa },
  });
  if (error || !data.user) {
    return NextResponse.json({
      error: 'No se pudo completar el alta. Verifica si el RUC, la razón social, el correo o la cédula ya están registrados.',
    }, { status: error?.status === 422 ? 409 : 400 });
  }

  return NextResponse.json({
    cooperativa: { ...cooperativa, logoUrl: null, colorPrimaria: null, colorSecundaria: null, activo: true },
    administrador: {
      id: data.user.id, email, nombre: nombreAdmin, cedula, rol: 'cooperativa',
      cooperativaId: cooperativa.id, activo: true,
    },
  }, { status: 201 });
}
