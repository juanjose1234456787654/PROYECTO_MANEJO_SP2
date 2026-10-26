import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlhfrmrzrkbdbgpkodds.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsaGZybXJ6cmtiZGJncGtvZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjYxMzAsImV4cCI6MjEwODIwMjEzMH0.SIJm0mcKzbM84-xG9RKeKbC5U9vpOFzxGPFoYP3gWRM';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorado si se ejecuta en Server Components y el middleware refresca la sesión
          }
        },
      },
    }
  );
}
