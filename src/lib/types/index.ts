import type {
  Database,
  Json,
  RolUsuario,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database.types';

export type { Database, Json, RolUsuario, Tables, TablesInsert, TablesUpdate };

/**
 * Patrón de resultado uniforme para todas las operaciones contra Supabase.
 */
export type Result<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Tipos de filas (Row) de las tablas reales en Supabase (PascalCase).
 */
export type GrupoBusRow = Database['public']['Tables']['GrupoBus']['Row'];
export type GrupoFrecuenciaRow = Database['public']['Tables']['GrupoFrecuencia']['Row'];
export type CooperativaRow = Database['public']['Tables']['Cooperativa']['Row'];
export type UsuarioRow = Database['public']['Tables']['Usuario']['Row'];
export type BusRow = Database['public']['Tables']['Bus']['Row'];
export type FrecuenciaRow = Database['public']['Tables']['Frecuencia']['Row'];
export type ParadaFrecuenciaRow = Database['public']['Tables']['ParadaFrecuencia']['Row'];
export type RutaRow = Database['public']['Tables']['Ruta']['Row'];
export type BoletoRow = Database['public']['Tables']['Boleto']['Row'];
export type RegistroParadaRow = Database['public']['Tables']['RegistroParada']['Row'];
export type ConfiguracionAppRow = Database['public']['Tables']['ConfiguracionApp']['Row'];

/**
 * Tipos de inserción (Insert) de las tablas reales en Supabase.
 */
export type CooperativaInsert = Database['public']['Tables']['Cooperativa']['Insert'];
export type UsuarioInsert = Database['public']['Tables']['Usuario']['Insert'];
export type BusInsert = Database['public']['Tables']['Bus']['Insert'];
export type FrecuenciaInsert = Database['public']['Tables']['Frecuencia']['Insert'];
export type ParadaFrecuenciaInsert = Database['public']['Tables']['ParadaFrecuencia']['Insert'];
export type RutaInsert = Database['public']['Tables']['Ruta']['Insert'];
export type BoletoInsert = Database['public']['Tables']['Boleto']['Insert'];
export type RegistroParadaInsert = Database['public']['Tables']['RegistroParada']['Insert'];
export type ConfiguracionAppInsert = Database['public']['Tables']['ConfiguracionApp']['Insert'];

/**
 * Tipos de actualización (Update) de las tablas reales en Supabase.
 */
export type CooperativaUpdate = Database['public']['Tables']['Cooperativa']['Update'];
export type UsuarioUpdate = Database['public']['Tables']['Usuario']['Update'];
export type BusUpdate = Database['public']['Tables']['Bus']['Update'];
export type FrecuenciaUpdate = Database['public']['Tables']['Frecuencia']['Update'];
export type ParadaFrecuenciaUpdate = Database['public']['Tables']['ParadaFrecuencia']['Update'];
export type RutaUpdate = Database['public']['Tables']['Ruta']['Update'];
export type BoletoUpdate = Database['public']['Tables']['Boleto']['Update'];
export type RegistroParadaUpdate = Database['public']['Tables']['RegistroParada']['Update'];
export type ConfiguracionAppUpdate = Database['public']['Tables']['ConfiguracionApp']['Update'];
