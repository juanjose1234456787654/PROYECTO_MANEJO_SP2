import { createClient } from '@/lib/supabase/client';
import {
  construirSecuenciaParadas,
  validarOrdenParadas,
  calcularTarifaProporcional,
  calcularTarifaTramo as calcularTarifaTramoPuro,
  filtrarAsientosOcupadosEnTramo,
  calcularDisponibilidadAsientosTramo,
} from '@/lib/services/tramosService';
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
};

const DEFAULT_CONFIG_APP: ConfiguracionAppRow = {
  id: 'conf-001',
  nombreApp: 'EcuRutas - Sistema Interprovincial',
  logoUrl: null,
  colorPrimaria: '#1e3a8a',
  colorSecundaria: '#f59e0b',
  redesSociales: {
    facebook: 'https://facebook.com/ecurutas',
    twitter: 'https://twitter.com/ecurutas',
    instagram: 'https://instagram.com/ecurutas',
  },
  soporteEmail: 'soporte@ecurutas.uta.edu.ec',
  soporteTelefono: '+593 3 282 1234',
  updatedAt: new Date().toISOString(),
};

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
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
      return { data: data as ConfiguracionAppRow, error: null };
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
    return res.data ?? [];
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
      return { data: (data ?? []) as BusRow[], error: null };
    } catch (err: unknown) {
      return { data: null, error: formatError(err) };
    }
  },

  async getBuses(cooperativaId?: string): Promise<BusRow[]> {
    const res = await this.fetchBuses(cooperativaId);
    return res.data ?? [];
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
      return { data: data as BusRow, error: null };
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
      return { data: data as BusRow, error: null };
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
    return res.data ?? [];
  },

  async fetchFrecuenciaById(id: string): Promise<Result<FrecuenciaRow>> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('Frecuencia')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as FrecuenciaRow, error: null };
    } catch (err: unknown) {
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
    return res.data ?? [];
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
    return res.data ?? [];
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

  async validarBoletoQR(codigoQrOId: string): Promise<{
    exito: boolean;
    mensaje: string;
    boleto?: BoletoRow;
  }> {
    const cleanTerm = codigoQrOId.trim();
    const boletos = await this.getBoletos();
    const boleto = boletos.find(
      (b) =>
        b.codigoQr?.toUpperCase() === cleanTerm.toUpperCase() ||
        b.id.toUpperCase() === cleanTerm.toUpperCase()
    );

    if (!boleto) {
      return { exito: false, mensaje: 'Boleto no encontrado en Supabase o código QR inválido.' };
    }

    if (boleto.estado === 'abordado' || boleto.estado === 'EMBARCADO') {
      return {
        exito: false,
        mensaje: `¡Alerta! Este boleto ya fue abordado el ${new Date(boleto.abordadoAt || '').toLocaleString()}.`,
        boleto,
      };
    }

    if (boleto.estado === 'cancelado' || boleto.estado === 'RECHAZADO') {
      return { exito: false, mensaje: 'Este boleto ha sido cancelado o rechazado.', boleto };
    }

    const nowIso = new Date().toISOString();
    await this.updateBoletoEstado(boleto.id, 'abordado', { abordadoAt: nowIso });

    return {
      exito: true,
      mensaje: `Abordaje confirmado con éxito para asiento #${boleto.asiento} (${boleto.pasajeroNombre || 'Pasajero'}).`,
      boleto: { ...boleto, estado: 'abordado', abordadoAt: nowIso },
    };
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
