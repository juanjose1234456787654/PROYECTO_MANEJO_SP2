import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database, RolUsuario } from '@/types/database.types';

// Mapeo de rutas protegidas y roles autorizados
const ROLE_PERMISSIONS: Record<string, RolUsuario[]> = {
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

// Rutas base por cada rol
const ROLE_HOME: Record<RolUsuario, string> = {
  admin: '/admin',
  cooperativa: '/cooperativa',
  oficinista: '/oficina',
  chofer: '/chofer',
  usuario: '/pasajero',
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlhfrmrzrkbdbgpkodds.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsaGZybXJ6cmtiZGJncGtvZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjYxMzAsImV4cCI6MjEwODIwMjEzMH0.SIJm0mcKzbM84-xG9RKeKbC5U9vpOFzxGPFoYP3gWRM';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Permitir siempre el acceso directo a /login para poder iniciar sesión o cambiar de rol/cuenta
  if (pathname === '/login') {
    return supabaseResponse;
  }

  // 2. Verificar si la ruta actual es una ruta protegida
  const protectedPrefix = Object.keys(ROLE_PERMISSIONS).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 3. Si no hay usuario autenticado y la ruta requiere permisos -> Redirigir a login
  if (!user && protectedPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // 4. Si hay usuario autenticado
  if (user && protectedPrefix) {
    // Consultar el rol y estado activo en la tabla "Usuario" (por id o fallback por email)
    let { data: usuario } = await supabase
      .from('Usuario')
      .select('rol, activo')
      .eq('id', user.id)
      .maybeSingle();

    if (!usuario && user.email) {
      const byEmail = await supabase
        .from('Usuario')
        .select('rol, activo')
        .eq('email', user.email)
        .maybeSingle();
      usuario = byEmail.data;
    }

    if (usuario && (usuario as { activo?: boolean }).activo === false) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'cuenta_inactiva');
      return NextResponse.redirect(url);
    }

    const rawRol =
      (usuario as { rol?: string } | null)?.rol ||
      (user.user_metadata?.rol as string | undefined) ||
      'usuario';

    const rol: RolUsuario =
      rawRol === 'personal_bus'
        ? 'chofer'
        : rawRol === 'cliente'
          ? 'usuario'
          : (rawRol as RolUsuario);

    // Si está intentando acceder a una ruta protegida que requiere otro rol, llevarlo a /login con redirectTo para que pueda cambiar de cuenta
    const allowedRoles = ROLE_PERMISSIONS[protectedPrefix];
    if (!allowedRoles.includes(rol)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
