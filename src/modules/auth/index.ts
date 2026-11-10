/**
 * Módulo: auth
 * Responsable: Juan Carvajal (@juanjose1234456787654)
 * Alcance: Gestión de sesión, autenticación Supabase SSR, registro de usuarios y verificación de roles.
 */

import { createClient } from '@/lib/supabase/client';
import type { RolUsuario } from '@/types/database.types';

export interface AuthModuleConfig {
  name: 'auth';
  version: '1.0.0';
  status: 'active';
  responsable: 'Juan Carvajal';
}

export const authModuleConfig: AuthModuleConfig = {
  name: 'auth',
  version: '1.0.0',
  status: 'active',
  responsable: 'Juan Carvajal',
};

export async function getCurrentUserProfile(): Promise<{
  id: string;
  email: string;
  rol: RolUsuario;
  nombre?: string;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from('Usuario')
    .select('id, email, rol, nombre')
    .eq('id', user.id)
    .single();

  if (usuario) {
    return usuario as { id: string; email: string; rol: RolUsuario; nombre?: string };
  }

  return {
    id: user.id,
    email: user.email || '',
    rol: 'usuario',
  };
}

export async function signOutUser() {
  const supabase = createClient();
  return await supabase.auth.signOut();
}
