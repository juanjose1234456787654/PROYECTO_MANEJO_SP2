import { createClient } from '@/lib/supabase/client';
import {
  construirSecuenciaParadas,
  validarOrdenParadas,
  calcularTarifaProporcional,
  calcularTarifaTramo as calcularTarifaTramoPuro,
  filtrarAsientosOcupadosEnTramo,
  calcularDisponibilidadAsientosTramo,
} from '@/lib/services/tramosService';
import {
  validarCedulaEcuatoriana,
  validarCedulaDetallada,
  calcularTarifaFinal,
  calcularEdad,
  determinarBeneficiario,
} from '@/lib/services/cedulaService';
import {
  calcularControlFlota,
  determinarBusesEnParada,
  asignarFlotaDiariaYParadas,
  generarHojaRutaDiaria,
  obtenerEstadoBusEnFecha,
  verificarConflictoBusEnParada,
} from '@/lib/services/hojasRutaService';
import type {
  Result,
  CooperativaRow,
  BusRow,
  FrecuenciaRow,
  ParadaFrecuenciaRow,
  RutaRow,
  BoletoRow,
  ConfiguracionAppRow,
  UsuarioRow,
  ParadaRuta,
  ValidacionTramoResult,
  CalculoTarifaTramo,
  ConsultaDisponibilidadTramoResult,
  BeneficiarioDescuento,
  DatosPasajeroValidacion,
  ResultadoValidacionCedula,
  DesgloseTarifaFinal,
  RegistroDiaParada,
  AsignacionBusFrecuencia,
  ControlFlotaANT,
  HojaRutaDiaria,
} from '@/lib/types';

export type {
  Result,
  CooperativaRow,
  BusRow,
  FrecuenciaRow,
  ParadaFrecuenciaRow,
  RutaRow,
  BoletoRow,
  ConfiguracionAppRow,
  UsuarioRow,
  ParadaRuta,
  ValidacionTramoResult,
  CalculoTarifaTramo,
  ConsultaDisponibilidadTramoResult,
  BeneficiarioDescuento,
  DatosPasajeroValidacion,
  ResultadoValidacionCedula,
  DesgloseTarifaFinal,
  RegistroDiaParada,
  AsignacionBusFrecuencia,
  ControlFlotaANT,
  HojaRutaDiaria,
};

export {
  calcularControlFlota,
  determinarBusesEnParada,
  asignarFlotaDiariaYParadas,
  generarHojaRutaDiaria,
  obtenerEstadoBusEnFecha,
  verificarConflictoBusEnParada,
};

const DEFAULT_CONFIG_APP: ConfiguracionAppRow = {
  id: 'conf-001',
  nombreApp: 'EcuRutas - Sistema Interprovincial',
  logoUrl: null,
  colorPrimaria: '#b91c1c',
  colorSecundaria: '#dc2626',
  redesSociales: {
    facebook: 'https://facebook.com/ecurutas',
    twitter: 'https://twitter.com/ecurutas',
    instagram: 'https://instagram.com/ecurutas',
  },
  soporteEmail: 'soporte@ecurutas.uta.edu.ec',
  soporteTelefono: '+593 3 282 1234',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_COOPERATIVAS: CooperativaRow[] = [
  {
    id: 'coop-001',
    nombre: 'Cooperativa de Transportes Baños',
    ruc: '1890001234001',
    telefono: '032740123',
    direccion: 'Av. Amazonas y Terminal Terrestre, Baños',
    logoUrl: null,
    activo: true,
  },
  {
    id: 'coop-002',
    nombre: 'Flota Pelileo C.A.',
    ruc: '1890004567001',
    telefono: '032871045',
    direccion: 'Calle Confraternidad y García Moreno, Pelileo',
    logoUrl: null,
    activo: true,
  },
  {
    id: 'coop-003',
    nombre: 'CITA Express Interprovincial',
    ruc: '1890009876001',
    telefono: '032520890',
    direccion: 'Terminal Terrestre Ingahurco, Ambato',
    logoUrl: null,
    activo: true,
  },
  {
    id: 'coop-004',
    nombre: 'Cooperativa Ambato Express',
    ruc: '1890003322001',
    telefono: '032821234',
    direccion: 'Av. Las Américas y González Suárez, Ambato',
    logoUrl: null,
    activo: true,
  },
];

const DEFAULT_BUSES: BusRow[] = [
  {
    id: 'bus-001',
    cooperativaId: 'coop-001',
    grupoBusId: null,
    numero: 14,
    placa: 'TAA-1420',
    chasis: 'Hino AK8JRSA',
    carroceria: 'Varycca Doble Piso',
    marca: 'Hino',
    fotoUrl: null,
    capacidad: 40,
    asientosVIP: 8,
    asientosVIPNumeros: [1, 2, 3, 4, 5, 6, 7, 8],
    diasParada: [1],
    activo: true,
  },
  {
    id: 'bus-002',
    cooperativaId: 'coop-001',
    grupoBusId: null,
    numero: 28,
    placa: 'TAA-2890',
    chasis: 'Mercedes-Benz OF-1721',
    carroceria: 'Marcopolo Paradiso G7',
    marca: 'Mercedes-Benz',
    fotoUrl: null,
    capacidad: 40,
    asientosVIP: 8,
    asientosVIPNumeros: [1, 2, 3, 4, 5, 6, 7, 8],
    diasParada: [3],
    activo: true,
  },
  {
    id: 'bus-003',
    cooperativaId: 'coop-002',
    grupoBusId: null,
    numero: 5,
    placa: 'TBA-1005',
    chasis: 'Scania K360',
    carroceria: 'Carrocerías Picosa',
    marca: 'Scania',
    fotoUrl: null,
    capacidad: 36,
    asientosVIP: 0,
    asientosVIPNumeros: [],
    diasParada: [2],
    activo: true,
  },
  {
    id: 'bus-004',
    cooperativaId: 'coop-003',
    grupoBusId: null,
    numero: 42,
    placa: 'TBA-4299',
    chasis: 'Yutong ZK6122H9',
    carroceria: 'Yutong Bus',
    marca: 'Yutong',
    fotoUrl: null,
    capacidad: 44,
    asientosVIP: 10,
    asientosVIPNumeros: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    diasParada: [4],
    activo: true,
  },
  {
    id: 'bus-005',
    cooperativaId: 'coop-004',
    grupoBusId: null,
    numero: 10,
    placa: 'TAA-5520',
    chasis: 'Hino RN8J',
    carroceria: 'Cepeda Interprovincial',
    marca: 'Hino',
    fotoUrl: null,
    capacidad: 42,
    asientosVIP: 6,
    asientosVIPNumeros: [1, 2, 3, 4, 5, 6],
    diasParada: [5],
    activo: true,
  },
];

const DEFAULT_FRECUENCIAS: FrecuenciaRow[] = [
  {
    id: 'frec-001',
    cooperativaId: 'coop-001',
    grupoFrecuenciaId: null,
    resolucionANT: 'ANT-2024-EXP-0891',
    origen: 'Ambato',
    destino: 'Quito',
    hora: '06:00',
    tipoViaje: 'Directo',
    activa: true,
    duracion: '2h 30m',
    precioBase: 5.0,
    preciosPorTramo: { Ambato: 0, Salcedo: 1.0, Latacunga: 1.5, Machachi: 3.5, Quito: 5.0 },
  },
  {
    id: 'frec-002',
    cooperativaId: 'coop-001',
    grupoFrecuenciaId: null,
    resolucionANT: 'ANT-2024-EXP-0892',
    origen: 'Ambato',
    destino: 'Quito',
    hora: '08:30',
    tipoViaje: 'Con paradas intermedias',
    activa: true,
    duracion: '3h 15m',
    precioBase: 5.0,
    preciosPorTramo: { Ambato: 0, Salcedo: 1.0, Latacunga: 1.5, Machachi: 3.5, Quito: 5.0 },
  },
  {
    id: 'frec-003',
    cooperativaId: 'coop-002',
    grupoFrecuenciaId: null,
    resolucionANT: 'ANT-2024-EXP-0893',
    origen: 'Pelileo',
    destino: 'Baños',
    hora: '10:00',
    tipoViaje: 'Directo',
    activa: true,
    duracion: '45m',
    precioBase: 2.5,
    preciosPorTramo: null,
  },
  {
    id: 'frec-004',
    cooperativaId: 'coop-003',
    grupoFrecuenciaId: null,
    resolucionANT: 'ANT-2024-EXP-0894',
    origen: 'Ambato',
    destino: 'Guayaquil',
    hora: '09:00',
    tipoViaje: 'Con paradas intermedias',
    activa: true,
    duracion: '6h 00m',
    precioBase: 10.0,
    preciosPorTramo: { Ambato: 0, Riobamba: 2.5, Pallatanga: 5.0, Bucay: 7.5, Guayaquil: 10.0 },
  },
  {
    id: 'frec-005',
    cooperativaId: 'coop-004',
    grupoFrecuenciaId: null,
    resolucionANT: 'ANT-2024-EXP-0895',
    origen: 'Ambato',
    destino: 'Cuenca',
    hora: '13:00',
    tipoViaje: 'Con paradas intermedias',
    activa: true,
    duracion: '7h 30m',
    precioBase: 12.0,
    preciosPorTramo: null,
  },
];

const DEFAULT_PARADAS: ParadaFrecuenciaRow[] = [
  { id: 'par-001', frecuenciaId: 'frec-002', ciudad: 'Salcedo', orden: 1 },
  { id: 'par-002', frecuenciaId: 'frec-002', ciudad: 'Latacunga', orden: 2 },
  { id: 'par-003', frecuenciaId: 'frec-002', ciudad: 'Machachi', orden: 3 },
  { id: 'par-004', frecuenciaId: 'frec-004', ciudad: 'Riobamba', orden: 1 },
  { id: 'par-005', frecuenciaId: 'frec-004', ciudad: 'Pallatanga', orden: 2 },
  { id: 'par-006', frecuenciaId: 'frec-004', ciudad: 'Bucay', orden: 3 },
];

const DEFAULT_RUTAS: RutaRow[] = [
  {
    id: 'ruta-001',
    frecuenciaId: 'frec-001',
    fecha: new Date().toISOString().split('T')[0],
    busId: 'bus-001',
    estado: 'programada',
    inicio: null,
    completada: false,
    precio: 5.0,
    choferId: null,
  },
  {
    id: 'ruta-002',
    frecuenciaId: 'frec-002',
    fecha: new Date().toISOString().split('T')[0],
    busId: 'bus-002',
    estado: 'programada',
    inicio: null,
    completada: false,
    precio: 5.0,
    choferId: null,
  },
  {
    id: 'ruta-003',
    frecuenciaId: 'frec-003',
    fecha: new Date().toISOString().split('T')[0],
    busId: 'bus-003',
    estado: 'programada',
    inicio: null,
    completada: false,
    precio: 2.5,
    choferId: null,
  },
  {
    id: 'ruta-004',
    frecuenciaId: 'frec-004',
    fecha: new Date().toISOString().split('T')[0],
    busId: 'bus-004',
    estado: 'programada',
    inicio: null,
    completada: false,
    precio: 10.0,
    choferId: null,
  },
  {
    id: 'ruta-005',
    frecuenciaId: 'frec-005',
    fecha: new Date().toISOString().split('T')[0],
    busId: 'bus-005',
    estado: 'programada',
    inicio: null,
    completada: false,
    precio: 12.0,
    choferId: null,
  },
];


function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function parsearNumerosAsiento(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const numeros = value.map(Number).filter((numero) => Number.isInteger(numero) && numero > 0);
    return numeros.length > 0 ? numeros : null;
  }
  if (typeof value !== 'string' || value.trim() === '') return null;

  const texto = value.trim();
  try {
    const parsed: unknown = JSON.parse(texto);
    if (Array.isArray(parsed)) return parsearNumerosAsiento(parsed);
  } catch {
    // También aceptamos listas guardadas como "1,2" o "{1,2}".
  }

  const numeros = texto
    .replace(/^\{|\}$/g, '')
    .split(/[;,\s]+/)
    .map(Number)
    .filter((numero) => Number.isInteger(numero) && numero > 0);
  return numeros.length > 0 ? numeros : null;
}

function normalizarBus(row: BusRow): BusRow {
  const raw = row as BusRow & { asientosVIPNumeros: unknown };
  return { ...row, asientosVIPNumeros: parsearNumerosAsiento(raw.asientosVIPNumeros) };
}

/**
 * Servicio centralizado de acceso a datos conectado directamente a Supabase (PostgreSQL)
 * con tipado estricto y patrón uniforme Result<T>.
 */
export const dataService = {
  // ==========================================
  // CONFIGURACIÓN APP ("ConfiguracionApp")
  // ==========================================
  async fetchConfig(): Promise<Result<ConfiguracionAppRow>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('ConfiguracionApp')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) return { data: null, error: error.message };
      if (!data) return { data: DEFAULT_CONFIG_APP, error: null };
      const rawConfig = data as ConfiguracionAppRow;
      const legacyBlues = ['#1e3a8a', '#2563eb', '#1d4ed8', '#3b82f6', '#1e40af', '#0f172a'];
      const normalizedPrimary =
        !rawConfig.colorPrimaria || legacyBlues.includes(rawConfig.colorPrimaria.toLowerCase())
          ? '#b91c1c'
          : rawConfig.colorPrimaria;
      const normalizedSecondary =
        !rawConfig.colorSecundaria || legacyBlues.includes(rawConfig.colorSecundaria.toLowerCase())
          ? '#dc2626'
          : rawConfig.colorSecundaria;
      return {
        data: {
          ...rawConfig,
          colorPrimaria: normalizedPrimary,
          colorSecundaria: normalizedSecondary,
        },
        error: null,
      };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getConfig(): Promise<ConfiguracionAppRow> {
    const res = await this.fetchConfig();
    return res.data ?? DEFAULT_CONFIG_APP;
  },

  async saveConfig(changes: Partial<ConfiguracionAppRow>): Promise<Result<ConfiguracionAppRow>> {
    const supabase = createClient();
    try {
      const current = await this.getConfig();
      const updated: ConfiguracionAppRow = {
        ...current,
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('ConfiguracionApp')
        .upsert(updated)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: (data as ConfiguracionAppRow) ?? updated, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async updateConfig(changes: Partial<ConfiguracionAppRow>): Promise<ConfiguracionAppRow> {
    const res = await this.saveConfig(changes);
    if (res.data) return res.data;
    const current = await this.getConfig();
    return { ...current, ...changes, updatedAt: new Date().toISOString() };
  },

  // ==========================================
  // COOPERATIVAS ("Cooperativa")
  // ==========================================
  async fetchCooperativas(): Promise<Result<CooperativaRow[]>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Cooperativa')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) return { data: null, error: error.message };
      return { data: (data ?? []) as CooperativaRow[], error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getCooperativas(): Promise<CooperativaRow[]> {
    const res = await this.fetchCooperativas();
    return res.data && res.data.length > 0 ? res.data : DEFAULT_COOPERATIVAS;
  },

  async insertCooperativa(coop: Omit<CooperativaRow, 'id'>): Promise<Result<CooperativaRow>> {
    const supabase = createClient();
    const newCoop: CooperativaRow = {
      ...coop,
      id: `coop-${Date.now()}`,
    };
    try {
      const { data, error } = await supabase
        .from('Cooperativa')
        .insert(newCoop)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as CooperativaRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async createCooperativa(coop: Omit<CooperativaRow, 'id'>): Promise<CooperativaRow> {
    const res = await this.insertCooperativa(coop);
    if (res.data) return res.data;
    throw new Error(res.error ?? 'No se pudo crear la cooperativa en Supabase');
  },

  async patchCooperativa(id: string, changes: Partial<CooperativaRow>): Promise<Result<CooperativaRow>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Cooperativa')
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as CooperativaRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async updateCooperativa(id: string, changes: Partial<CooperativaRow>): Promise<void> {
    await this.patchCooperativa(id, changes);
  },

  // ==========================================
  // BUSES ("Bus")
  // ==========================================
  async fetchBuses(cooperativaId?: string): Promise<Result<BusRow[]>> {
    const supabase = createClient();
    try {
      let query = supabase.from('Bus').select('*').order('numero', { ascending: true });
      if (cooperativaId) {
        query = query.eq('cooperativaId', cooperativaId);
      }
      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: ((data ?? []) as BusRow[]).map(normalizarBus), error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getBuses(cooperativaId?: string): Promise<BusRow[]> {
    const res = await this.fetchBuses(cooperativaId);
    const list = res.data && res.data.length > 0 ? res.data : DEFAULT_BUSES;
    return cooperativaId ? list.filter((b) => b.cooperativaId === cooperativaId) : list;
  },

  async insertBus(bus: Omit<BusRow, 'id'>): Promise<Result<BusRow>> {
    const supabase = createClient();
    const newBus: BusRow = {
      ...bus,
      id: `bus-${Date.now()}`,
    };
    try {
      const { data, error } = await supabase.from('Bus').insert(newBus).select().single();
      if (error) return { data: null, error: error.message };
      return { data: normalizarBus(data as BusRow), error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async createBus(bus: Omit<BusRow, 'id'>): Promise<BusRow> {
    const res = await this.insertBus(bus);
    if (res.data) return res.data;
    throw new Error(res.error ?? 'No se pudo registrar el bus en Supabase');
  },

  async patchBus(id: string, changes: Partial<BusRow>): Promise<Result<BusRow>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Bus')
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: normalizarBus(data as BusRow), error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async updateBus(id: string, changes: Partial<BusRow>): Promise<void> {
    await this.patchBus(id, changes);
  },

  // ==========================================
  // FRECUENCIAS ("Frecuencia") Y PARADAS ("ParadaFrecuencia")
  // ==========================================
  async fetchFrecuencias(filtros?: {
    origen?: string;
    destino?: string;
    cooperativaId?: string;
    soloActivas?: boolean;
  }): Promise<Result<FrecuenciaRow[]>> {
    const supabase = createClient();
    try {
      let query = supabase.from('Frecuencia').select('*').order('hora', { ascending: true });
      if (filtros?.origen) query = query.ilike('origen', `%${filtros.origen}%`);
      if (filtros?.destino) query = query.ilike('destino', `%${filtros.destino}%`);
      if (filtros?.cooperativaId) query = query.eq('cooperativaId', filtros.cooperativaId);
      if (filtros?.soloActivas) query = query.eq('activa', true);

      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: (data ?? []) as FrecuenciaRow[], error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getFrecuencias(filtros?: {
    origen?: string;
    destino?: string;
    cooperativaId?: string;
  }): Promise<FrecuenciaRow[]> {
    const res = await this.fetchFrecuencias(filtros);
    if (res.data && res.data.length > 0) return res.data;
    let list = DEFAULT_FRECUENCIAS;
    if (filtros?.cooperativaId) list = list.filter((f) => f.cooperativaId === filtros.cooperativaId);
    if (filtros?.origen) list = list.filter((f) => f.origen.toLowerCase().includes(filtros.origen!.toLowerCase()));
    if (filtros?.destino) list = list.filter((f) => f.destino.toLowerCase().includes(filtros.destino!.toLowerCase()));
    return list;
  },

  async fetchFrecuenciaById(id: string): Promise<Result<FrecuenciaRow>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Frecuencia')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        const fallback = DEFAULT_FRECUENCIAS.find((f) => f.id === id);
        if (fallback) return { data: fallback, error: null };
        return { data: null, error: error.message };
      }
      return { data: data as FrecuenciaRow, error: null };
    } catch (err: unknown) {
      const fallback = DEFAULT_FRECUENCIAS.find((f) => f.id === id);
      if (fallback) return { data: fallback, error: null };
      return { data: null, error: formatError(err) };
    }
  },

  async getFrecuenciaById(id: string): Promise<FrecuenciaRow | null> {
    const res = await this.fetchFrecuenciaById(id);
    return res.data;
  },

  async insertFrecuencia(frec: Omit<FrecuenciaRow, 'id'>): Promise<Result<FrecuenciaRow>> {
    const supabase = createClient();
    const newFrec: FrecuenciaRow = {
      ...frec,
      id: `frec-${Date.now()}`,
    };
    try {
      const { data, error } = await supabase
        .from('Frecuencia')
        .insert(newFrec)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as FrecuenciaRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async createFrecuencia(frec: Omit<FrecuenciaRow, 'id'>): Promise<FrecuenciaRow> {
    const res = await this.insertFrecuencia(frec);
    if (res.data) return res.data;
    throw new Error(res.error ?? 'No se pudo crear la frecuencia en Supabase');
  },

  async fetchParadas(frecuenciaId?: string): Promise<Result<ParadaFrecuenciaRow[]>> {
    const supabase = createClient();
    try {
      let query = supabase
        .from('ParadaFrecuencia')
        .select('*')
        .order('orden', { ascending: true });

      if (frecuenciaId) query = query.eq('frecuenciaId', frecuenciaId);
      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: (data ?? []) as ParadaFrecuenciaRow[], error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getParadas(frecuenciaId?: string): Promise<ParadaFrecuenciaRow[]> {
    const res = await this.fetchParadas(frecuenciaId);
    const list = res.data && res.data.length > 0 ? res.data : DEFAULT_PARADAS;
    return frecuenciaId ? list.filter((p) => p.frecuenciaId === frecuenciaId) : list;
  },

  // ============================================================================
  // INTEGRACIÓN ASÍNCRONA: PARADAS INTERMEDIAS Y TRAMOS (ISSUE #14)
  // ============================================================================

  /**
   * Obtiene la secuencia completa y unificada de paradas (origen, intermedias y destino)
   * para una frecuencia desde la base de datos Supabase.
   */
  async fetchParadasCompletas(frecuenciaId: string): Promise<Result<ParadaRuta[]>> {
    try {
      const [frecRes, paradasRes] = await Promise.all([
        this.fetchFrecuenciaById(frecuenciaId),
        this.fetchParadas(frecuenciaId),
      ]);

      if (frecRes.error) return { data: null, error: frecRes.error };
      if (!frecRes.data) return { data: null, error: 'Frecuencia no encontrada en Supabase' };
      if (paradasRes.error) return { data: null, error: paradasRes.error };

      const secuencia = construirSecuenciaParadas(frecRes.data, paradasRes.data ?? []);
      return { data: secuencia, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getParadasCompletas(frecuenciaId: string): Promise<ParadaRuta[]> {
    const res = await this.fetchParadasCompletas(frecuenciaId);
    return res.data ?? [];
  },

  /**
   * Valida asíncronamente que el origen preceda estrictamente al destino
   * en el itinerario de la frecuencia seleccionada.
   */
  async validarTramo(
    frecuenciaId: string,
    origenIdentificador: string,
    destinoIdentificador: string
  ): Promise<Result<ValidacionTramoResult>> {
    try {
      const paradasRes = await this.fetchParadasCompletas(frecuenciaId);
      if (paradasRes.error || !paradasRes.data) {
        return { data: null, error: paradasRes.error ?? 'No se pudo cargar el itinerario de paradas' };
      }

      const validacion = validarOrdenParadas(
        origenIdentificador,
        destinoIdentificador,
        paradasRes.data
      );
      return { data: validacion, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  /**
   * Calcula asíncronamente la tarifa proporcional de un tramo consultando
   * las tarifas oficiales de la frecuencia en Supabase.
   */
  async calcularTarifaTramo(
    frecuenciaId: string,
    origenIdentificador: string,
    destinoIdentificador: string
  ): Promise<Result<CalculoTarifaTramo>> {
    try {
      const [frecRes, paradasRes] = await Promise.all([
        this.fetchFrecuenciaById(frecuenciaId),
        this.fetchParadasCompletas(frecuenciaId),
      ]);

      if (frecRes.error || !frecRes.data) {
        return { data: null, error: frecRes.error ?? 'Frecuencia no encontrada' };
      }
      if (paradasRes.error || !paradasRes.data) {
        return { data: null, error: paradasRes.error ?? 'Paradas no encontradas' };
      }

      const calculo = calcularTarifaTramoPuro(
        frecRes.data,
        origenIdentificador,
        destinoIdentificador,
        paradasRes.data
      );
      return { data: calculo, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  // ============================================================================
  // INTEGRACIÓN ASÍNCRONA: VALIDACIÓN DE CÉDULA Y DESCUENTOS ANT (ISSUE #15)
  // ============================================================================

  /**
   * Valida asíncronamente una cédula ecuatoriana según el algoritmo Módulo 10 del Registro Civil.
   */
  async validarCedula(cedula: string): Promise<Result<ResultadoValidacionCedula>> {
    try {
      const resultado = validarCedulaDetallada(cedula);
      return { data: resultado, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  /**
   * Calcula asíncronamente el desglose de tarifa y aplicación de descuento de ley (50%)
   * para un pasajero según su fecha de nacimiento o condición de discapacidad.
   */
  async calcularTarifaPasajero(
    precioBase: number,
    datosPasajero: Partial<DatosPasajeroValidacion>,
    esVip?: boolean
  ): Promise<Result<DesgloseTarifaFinal>> {
    try {
      const desglose = calcularTarifaFinal(
        precioBase,
        datosPasajero.fechaNacimiento,
        datosPasajero.esDiscapacitado,
        datosPasajero.porcentajeDiscapacidad,
        esVip
      );
      return { data: desglose, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  /**
   * Realiza una validación combinada de identidad y cálculo tarifario antes de emitir un boleto.
   */
  async validarPasajeroYTarifa(
    precioBase: number,
    datosPasajero: DatosPasajeroValidacion,
    esVip?: boolean
  ): Promise<Result<{ cedulaInfo: ResultadoValidacionCedula; tarifaInfo: DesgloseTarifaFinal }>> {
    try {
      const cedulaInfo = validarCedulaDetallada(datosPasajero.cedula);
      if (!cedulaInfo.valida) {
        return { data: null, error: `Cédula de identidad inválida: ${cedulaInfo.mensaje}` };
      }

      const tarifaInfo = calcularTarifaFinal(
        precioBase,
        datosPasajero.fechaNacimiento,
        datosPasajero.esDiscapacitado,
        datosPasajero.porcentajeDiscapacidad,
        esVip
      );

      return { data: { cedulaInfo, tarifaInfo }, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  // ============================================================================
  // INTEGRACIÓN ASÍNCRONA: HOJAS DE RUTA Y DÍAS DE PARADA ANT (ACTIVIDAD 3)
  // ============================================================================

  /**
   * Obtiene el diagnóstico y control de flota para una cooperativa en una fecha dada.
   * Evalúa si existe exceso de buses respecto a frecuencias y requiere Días de Parada.
   */
  async fetchControlFlota(cooperativaId: string, fecha?: string): Promise<Result<ControlFlotaANT>> {
    try {
      const fechaOperacion = fecha || new Date().toISOString().split('T')[0];
      const [busesRes, frecRes] = await Promise.all([
        this.fetchBuses(cooperativaId),
        this.fetchFrecuencias({ cooperativaId, soloActivas: true }),
      ]);

      if (busesRes.error) return { data: null, error: busesRes.error };
      if (frecRes.error) return { data: null, error: frecRes.error };

      const control = calcularControlFlota(
        cooperativaId,
        busesRes.data ?? [],
        frecRes.data ?? [],
        fechaOperacion
      );
      return { data: control, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  /**
   * Genera y retorna asíncronamente la Hoja de Ruta Diaria con control de flota y
   * asignación de unidades / días de parada según la normativa de la ANT.
   */
  async fetchHojaRutaDiaria(
    cooperativaId: string,
    fecha?: string
  ): Promise<Result<HojaRutaDiaria>> {
    try {
      const fechaOperacion = fecha || new Date().toISOString().split('T')[0];
      const [busesRes, frecRes, usuariosRes] = await Promise.all([
        this.fetchBuses(cooperativaId),
        this.fetchFrecuencias({ cooperativaId, soloActivas: true }),
        this.fetchUsuarios(),
      ]);

      if (busesRes.error) return { data: null, error: busesRes.error };
      if (frecRes.error) return { data: null, error: frecRes.error };

      const choferes = (usuariosRes.data ?? []).filter(
        (u) => u.cooperativaId === cooperativaId && u.rol === 'chofer'
      );

      const hojaRuta = generarHojaRutaDiaria(
        cooperativaId,
        fechaOperacion,
        busesRes.data ?? [],
        frecRes.data ?? [],
        choferes
      );

      return { data: hojaRuta, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  /**
   * Retorna la Hoja de Ruta Diaria directamente (método de conveniencia).
   */
  async getHojaRutaDiaria(cooperativaId: string, fecha?: string): Promise<HojaRutaDiaria | null> {
    const res = await this.fetchHojaRutaDiaria(cooperativaId, fecha);
    return res.data;
  },

  /**
   * Sincroniza las asignaciones de la Hoja de Ruta Diaria con la tabla `Ruta` en Supabase.
   * Crea o actualiza las rutas programadas del día, garantizando que los buses
   * en Día de Parada queden estrictamente excluidos de la asignación en vía pública.
   */
  async sincronizarRutasConHojaDiaria(
    hojaRuta: HojaRutaDiaria
  ): Promise<Result<{ creadas: number; omitidas: number }>> {
    const supabase = createClient();
    try {
      const { fecha, asignaciones, busesEnParada } = hojaRuta;
      const busesEnParadaIds = new Set(busesEnParada.map((p) => p.busId));

      const { data: rutasExistentes, error: errorConsulta } = await supabase
        .from('Ruta')
        .select('id, frecuenciaId, busId')
        .eq('fecha', fecha);

      if (errorConsulta) {
        return { data: null, error: errorConsulta.message };
      }

      const rutasYaCreadas = new Set(
        (rutasExistentes ?? []).map((r) => `${r.frecuenciaId}_${r.busId}`)
      );

      let creadas = 0;
      let omitidas = 0;

      for (const asignacion of asignaciones) {
        if (!asignacion.busId || busesEnParadaIds.has(asignacion.busId)) {
          omitidas++;
          continue;
        }

        const clave = `${asignacion.frecuenciaId}_${asignacion.busId}`;
        if (rutasYaCreadas.has(clave)) {
          omitidas++;
          continue;
        }

        const nuevaRuta: Omit<RutaRow, 'id'> = {
          frecuenciaId: asignacion.frecuenciaId,
          fecha,
          busId: asignacion.busId,
          estado: 'programada',
          inicio: null,
          completada: false,
          precio: null,
          choferId: asignacion.choferId || null,
        };

        const resInsert = await this.insertRuta(nuevaRuta);
        if (resInsert.data) {
          creadas++;
        }
      }

      return { data: { creadas, omitidas }, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  /**
   * Valida si un bus específico está habilitado para circular en una fecha o si debe
   * permanecer en reposo por Día de Parada según la rotación obligatoria de la ANT.
   */
  async verificarDisponibilidadBusParaFecha(
    busId: string,
    cooperativaId: string,
    fecha: string
  ): Promise<Result<{ habilitado: boolean; motivo?: string; turnoEstimado?: string }>> {
    try {
      const hojaRes = await this.fetchHojaRutaDiaria(cooperativaId, fecha);
      if (hojaRes.error || !hojaRes.data) {
        return { data: null, error: hojaRes.error ?? 'No se pudo obtener la hoja de ruta' };
      }

      const estado = obtenerEstadoBusEnFecha(busId, hojaRes.data);
      if (estado.estado === 'en_parada') {
        return {
          data: {
            habilitado: false,
            motivo: estado.detalleParada?.observacion || 'Descanso preventivo obligatorio ANT',
            turnoEstimado: estado.detalleParada?.proximoTurnoEstimado,
          },
          error: null,
        };
      }

      return {
        data: {
          habilitado: true,
        },
        error: null,
      };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  // ==========================================
  // RUTAS ("Ruta") Y ASIENTOS OCUPADOS POR TRAMO
  // ==========================================
  async fetchRutas(filtros?: { fecha?: string; frecuenciaId?: string }): Promise<Result<RutaRow[]>> {
    const supabase = createClient();
    try {
      let query = supabase.from('Ruta').select('*').order('fecha', { ascending: false });
      if (filtros?.fecha) query = query.eq('fecha', filtros.fecha);
      if (filtros?.frecuenciaId) query = query.eq('frecuenciaId', filtros.frecuenciaId);
      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: (data ?? []) as RutaRow[], error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getRutas(filtros?: { fecha?: string; frecuenciaId?: string }): Promise<RutaRow[]> {
    const res = await this.fetchRutas(filtros);
    if (res.data && res.data.length > 0) return res.data;
    let list = DEFAULT_RUTAS;
    if (filtros?.frecuenciaId) list = list.filter((r) => r.frecuenciaId === filtros.frecuenciaId);
    if (filtros?.fecha) list = list.filter((r) => r.fecha === filtros.fecha);
    return list;
  },

  async insertRuta(ruta: Omit<RutaRow, 'id'>): Promise<Result<RutaRow>> {
    const supabase = createClient();
    const newRuta: RutaRow = {
      ...ruta,
      id: `ruta-${Date.now()}`,
    };
    try {
      const { data, error } = await supabase.from('Ruta').insert(newRuta).select().single();
      if (error) return { data: null, error: error.message };
      return { data: data as RutaRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async createRuta(ruta: Omit<RutaRow, 'id'>): Promise<RutaRow> {
    const res = await this.insertRuta(ruta);
    if (res.data) return res.data;
    throw new Error(res.error ?? 'No se pudo crear la ruta en Supabase');
  },

  async fetchAsientosOcupados(rutaId: string): Promise<Result<number[]>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Boleto')
        .select('asiento, estado')
        .eq('rutaId', rutaId)
        .neq('estado', 'cancelado')
        .neq('estado', 'RECHAZADO');

      if (error) return { data: null, error: error.message };
      const asientos = (data ?? []).map((b) => b.asiento);
      return { data: asientos, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  /**
   * Consulta en Supabase qué asientos están ocupados en una ruta específicamente
   * durante el tramo [origen, destino], evitando bloqueos falsos en otros segmentos
   * de la misma frecuencia.
   */
  async fetchAsientosOcupadosEnTramo(
    rutaId: string,
    origenIdentificador?: string | null,
    destinoIdentificador?: string | null
  ): Promise<Result<number[]>> {
    const supabase = createClient();
    try {
      // Si no se especifican paradas intermedias, se asume la ruta completa
      if (!origenIdentificador || !destinoIdentificador) {
        return await this.fetchAsientosOcupados(rutaId);
      }

      // Obtener la ruta para conocer su frecuenciaId
      const { data: ruta, error: rutaError } = await supabase
        .from('Ruta')
        .select('*')
        .eq('id', rutaId)
        .single();

      if (rutaError || !ruta) {
        return { data: null, error: rutaError ? rutaError.message : 'Ruta no encontrada' };
      }

      // Consultar boletos activos de la ruta y la secuencia de paradas en paralelo
      const [boletosRes, paradasRes] = await Promise.all([
        this.fetchBoletos({ rutaId }),
        this.fetchParadasCompletas(ruta.frecuenciaId),
      ]);

      if (boletosRes.error) return { data: null, error: boletosRes.error };
      if (paradasRes.error || !paradasRes.data) {
        return { data: null, error: paradasRes.error ?? 'Error cargando paradas de la frecuencia' };
      }

      const secuencia = paradasRes.data;
      const validacion = validarOrdenParadas(
        origenIdentificador,
        destinoIdentificador,
        secuencia
      );

      if (!validacion.valido || validacion.ordenOrigen === undefined || validacion.ordenDestino === undefined) {
        return { data: null, error: validacion.mensaje };
      }

      const ocupados = filtrarAsientosOcupadosEnTramo(
        boletosRes.data ?? [],
        secuencia,
        validacion.ordenOrigen,
        validacion.ordenDestino
      );

      return { data: ocupados, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getAsientosOcupadosEnTramo(
    rutaId: string,
    origenIdentificador?: string | null,
    destinoIdentificador?: string | null
  ): Promise<number[]> {
    const res = await this.fetchAsientosOcupadosEnTramo(
      rutaId,
      origenIdentificador,
      destinoIdentificador
    );
    return res.data ?? [];
  },

  /**
   * Consulta integral de disponibilidad de asientos para un tramo con respecto
   * a la capacidad física del bus asignado a la ruta.
   */
  async fetchDisponibilidadTramo(
    rutaId: string,
    origenIdentificador: string,
    destinoIdentificador: string
  ): Promise<Result<ConsultaDisponibilidadTramoResult>> {
    const supabase = createClient();
    try {
      const { data: ruta, error: rutaError } = await supabase
        .from('Ruta')
        .select('*')
        .eq('id', rutaId)
        .single();

      if (rutaError || !ruta) {
        return { data: null, error: rutaError ? rutaError.message : 'Ruta no encontrada' };
      }

      let capacidad = 40;
      if (ruta.busId) {
        const { data: bus } = await supabase
          .from('Bus')
          .select('capacidad')
          .eq('id', ruta.busId)
          .single();
        if (bus?.capacidad) capacidad = bus.capacidad;
      }

      const ocupadosRes = await this.fetchAsientosOcupadosEnTramo(
        rutaId,
        origenIdentificador,
        destinoIdentificador
      );

      if (ocupadosRes.error) return { data: null, error: ocupadosRes.error };

      const ocupados = ocupadosRes.data ?? [];
      const disponibles = Array.from({ length: capacidad }, (_, i) => i + 1).filter(
        (num) => !ocupados.includes(num)
      );

      return {
        data: {
          rutaId,
          frecuenciaId: ruta.frecuenciaId,
          origenParadaId: origenIdentificador,
          destinoParadaId: destinoIdentificador,
          asientosTotales: capacidad,
          asientosOcupados: ocupados,
          asientosDisponibles: disponibles,
        },
        error: null,
      };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  // ==========================================
  // BOLETOS ("Boleto")
  // ==========================================
  async fetchBoletos(filtros?: {
    pasajeroId?: string;
    rutaId?: string;
    estado?: string;
  }): Promise<Result<BoletoRow[]>> {
    const supabase = createClient();
    try {
      let query = supabase.from('Boleto').select('*');
      if (filtros?.pasajeroId) query = query.eq('pasajeroId', filtros.pasajeroId);
      if (filtros?.rutaId) query = query.eq('rutaId', filtros.rutaId);
      if (filtros?.estado) query = query.eq('estado', filtros.estado);

      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: (data ?? []) as BoletoRow[], error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getBoletos(filtros?: {
    pasajeroId?: string;
    rutaId?: string;
    estado?: string;
  }): Promise<BoletoRow[]> {
    const res = await this.fetchBoletos(filtros);
    return res.data ?? [];
  },

  async insertBoleto(boletoData: Omit<BoletoRow, 'id' | 'codigoQr'>): Promise<Result<BoletoRow>> {
    const supabase = createClient();
    const id = `bol-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const codigoQr = `ECU-${id.toUpperCase()}-S${boletoData.asiento}`;
    const newBoleto: BoletoRow = {
      ...boletoData,
      id,
      codigoQr,
    };

    try {
      const { data, error } = await supabase.from('Boleto').insert(newBoleto).select().single();
      if (error) return { data: null, error: error.message };
      return { data: data as BoletoRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async createBoleto(boletoData: Omit<BoletoRow, 'id' | 'codigoQr'>): Promise<BoletoRow> {
    const res = await this.insertBoleto(boletoData);
    if (res.data) return res.data;
    throw new Error(res.error ?? 'No se pudo emitir el boleto en Supabase');
  },

  async patchBoletoEstado(
    id: string,
    nuevoEstado: string,
    extra?: Partial<BoletoRow>
  ): Promise<Result<BoletoRow>> {
    const supabase = createClient();
    const updatePayload = { estado: nuevoEstado, ...extra };
    try {
      const { data, error } = await supabase
        .from('Boleto')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as BoletoRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async updateBoletoEstado(
    id: string,
    nuevoEstado: string,
    extra?: Partial<BoletoRow>
  ): Promise<void> {
    await this.patchBoletoEstado(id, nuevoEstado, extra);
  },

  async validarBoletoQR(tokenQr: string): Promise<{
    exito: boolean;
    mensaje: string;
    boleto?: BoletoRow;
  }> {
    const cleanToken = tokenQr.trim();
    if (!cleanToken) {
      return { exito: false, mensaje: 'Token QR vacío o inválido.' };
    }

    try {
      const response = await fetch('/api/boletos/verificar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          exito: false,
          mensaje: data.message || 'BOLETO INVÁLIDO',
        };
      }

      // Construir el objeto adaptado a BoletoRow usando casteo seguro
      const boletoActualizado = {
        id: data.boleto.id,
        rutaId: data.boleto.rutaId || '',
        pasajeroId: data.boleto.pasajeroId || '',
        asiento: data.boleto.asiento,
        estado: 'abordado',
        abordadoAt: data.boleto.abordadoAt,
        pasajeroNombre: data.boleto.pasajeroNombre || 'Pasajero',
        pasajeroCedula: data.boleto.pasajeroCedula || 'N/A',
        codigoQr: cleanToken,
      } as unknown as BoletoRow;

      return {
        exito: true,
        mensaje: data.message || 'ACCESO PERMITIDO – EMBARCADO',
        boleto: boletoActualizado,
      };
    } catch (err: unknown) {
      return {
        exito: false,
        mensaje: `Error de conexión en la validación: ${formatError(err)}`,
      };
    }
  },

  // ==========================================
  // USUARIOS ("Usuario")
  // ==========================================
  async fetchUsuarios(): Promise<Result<UsuarioRow[]>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Usuario')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) return { data: null, error: error.message };
      return { data: (data ?? []) as UsuarioRow[], error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getUsuarios(): Promise<UsuarioRow[]> {
    const res = await this.fetchUsuarios();
    return res.data ?? [];
  },

  async insertUsuario(usuario: Partial<UsuarioRow> & { id: string; email: string; nombre: string }): Promise<Result<UsuarioRow>> {
    const supabase = createClient();
    const row: UsuarioRow = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      cedula: usuario.cedula ?? null,
      rol: usuario.rol ?? 'usuario',
      cooperativaId: usuario.cooperativaId ?? null,
      activo: usuario.activo ?? true,
    };
    try {
      const { data, error } = await supabase
        .from('Usuario')
        .upsert(row)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as UsuarioRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async createUsuario(usuario: Partial<UsuarioRow> & { id: string; email: string; nombre: string }): Promise<UsuarioRow> {
    const res = await this.insertUsuario(usuario);
    if (res.data) return res.data;
    throw new Error(res.error ?? 'No se pudo registrar el usuario en Supabase');
  },

  async patchUsuario(id: string, changes: Partial<UsuarioRow>): Promise<Result<UsuarioRow>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Usuario')
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as UsuarioRow, error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async updateUsuario(id: string, changes: Partial<UsuarioRow>): Promise<void> {
    await this.patchUsuario(id, changes);
  },

  // ==========================================
  // VERIFICACIÓN DE CONEXIÓN SUPABASE
  // ==========================================
  async seedSupabase(): Promise<{ exito: boolean; detalle: string }> {
    const supabase = createClient();
    try {
      const { count, error } = await supabase
        .from('Cooperativa')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return { exito: false, detalle: `Error de conexión con Supabase: ${error.message}` };
      }

      await supabase.from('ConfiguracionApp').upsert(DEFAULT_CONFIG_APP);
      return {
        exito: true,
        detalle: `Conectado a Supabase correctamente (${count ?? 0} cooperativas activas en base de datos).`,
      };
    } catch (err: unknown) {
      return { exito: false, detalle: `Error al sincronizar con Supabase: ${formatError(err)}` };
    }
  },
};
