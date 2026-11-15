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
    const { data: usuario } = await supabase
      .from('Usuario')
      .select('rol, activo, cooperativaId')
      .eq('id', user.id)
      .maybeSingle();

    if (!usuario?.activo || (usuario.rol === 'cooperativa' && !usuario.cooperativaId)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', usuario?.activo ? 'cooperativa_no_asignada' : 'cuenta_inactiva');
      return NextResponse.redirect(url);
    }

    if (usuario.rol === 'admin' && user.app_metadata.rol !== 'superadmin') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'sin_permisos');
      return NextResponse.redirect(url);
    }

    const rawRol: string = usuario.rol;
    const rol: RolUsuario =
      rawRol === 'personal_bus' ? 'chofer' : rawRol === 'cliente' ? 'usuario' : usuario.rol;

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
