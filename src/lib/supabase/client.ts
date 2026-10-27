import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlhfrmrzrkbdbgpkodds.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsaGZybXJ6cmtiZGJncGtvZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjYxMzAsImV4cCI6MjEwODIwMjEzMH0.SIJm0mcKzbM84-xG9RKeKbC5U9vpOFzxGPFoYP3gWRM';

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
