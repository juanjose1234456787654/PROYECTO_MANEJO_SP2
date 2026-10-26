import { createClient } from '@/lib/supabase/client';
import type {
  CooperativaRow,
  BusRow,
  FrecuenciaRow,
  ParadaFrecuenciaRow,
  RutaRow,
  BoletoRow,
  ConfiguracionAppRow,
  UsuarioRow,
} from '@/lib/data/mockData';
import {
  INITIAL_CONFIG_APP,
  INITIAL_COOPERATIVAS,
  INITIAL_BUSES,
  INITIAL_FRECUENCIAS,
  INITIAL_PARADAS,
  INITIAL_RUTAS,
  INITIAL_BOLETOS,
  INITIAL_USUARIOS,
} from '@/lib/data/mockData';

// Claves de almacenamiento local para persistencia offline / fallback
const STORAGE_KEYS = {
  cooperativas: 'ecurutas_cooperativas',
  buses: 'ecurutas_buses',
  frecuencias: 'ecurutas_frecuencias',
  paradas: 'ecurutas_paradas',
  rutas: 'ecurutas_rutas',
  boletos: 'ecurutas_boletos',
  usuarios: 'ecurutas_usuarios',
  config: 'ecurutas_config',
};

function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error al guardar en ${key}:`, err);
  }
}

export const dataService = {
  // ==========================================
  // CONFIGURACIÓN APP
  // ==========================================
  async getConfig(): Promise<ConfiguracionAppRow> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('ConfiguracionApp')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setLocal(STORAGE_KEYS.config, data);
        return data as ConfiguracionAppRow;
      }
    } catch (e) {
      console.warn('Fallback a almacenamiento local para ConfiguracionApp:', e);
    }
    return getLocal<ConfiguracionAppRow>(STORAGE_KEYS.config, INITIAL_CONFIG_APP);
  },

  async updateConfig(changes: Partial<ConfiguracionAppRow>): Promise<ConfiguracionAppRow> {
    const supabase = createClient();
    const current = await this.getConfig();
    const updated = { ...current, ...changes, updatedAt: new Date().toISOString() };

    try {
      await supabase.from('ConfiguracionApp').upsert(updated);
    } catch (e) {
      console.warn('Error al actualizar ConfiguracionApp en Supabase:', e);
    }

    setLocal(STORAGE_KEYS.config, updated);
    return updated;
  },

  // ==========================================
  // COOPERATIVAS
  // ==========================================
  async getCooperativas(): Promise<CooperativaRow[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from('Cooperativa').select('*');
      if (!error && data && data.length > 0) {
        setLocal(STORAGE_KEYS.cooperativas, data);
        return data as CooperativaRow[];
      }
    } catch (e) {
      console.warn('Fallback a cooperativas locales:', e);
    }
    return getLocal<CooperativaRow[]>(STORAGE_KEYS.cooperativas, INITIAL_COOPERATIVAS);
  },

  async createCooperativa(coop: Omit<CooperativaRow, 'id'>): Promise<CooperativaRow> {
    const supabase = createClient();
    const newCoop: CooperativaRow = {
      ...coop,
      id: `coop-${Date.now()}`,
    };

    try {
      const { data, error } = await supabase.from('Cooperativa').insert(newCoop).select().single();
      if (!error && data) {
        const list = await this.getCooperativas();
        setLocal(STORAGE_KEYS.cooperativas, [data as CooperativaRow, ...list.filter(c => c.id !== data.id)]);
        return data as CooperativaRow;
      }
    } catch (e) {
      console.warn('Error en insert Supabase Cooperativa:', e);
    }

    const currentList = getLocal<CooperativaRow[]>(STORAGE_KEYS.cooperativas, INITIAL_COOPERATIVAS);
    const updated = [newCoop, ...currentList];
    setLocal(STORAGE_KEYS.cooperativas, updated);
    return newCoop;
  },

  async updateCooperativa(id: string, changes: Partial<CooperativaRow>): Promise<void> {
    const supabase = createClient();
    try {
      await supabase.from('Cooperativa').update(changes).eq('id', id);
    } catch (e) {
      console.warn('Error en update Supabase Cooperativa:', e);
    }

    const currentList = getLocal<CooperativaRow[]>(STORAGE_KEYS.cooperativas, INITIAL_COOPERATIVAS);
    const updated = currentList.map(c => (c.id === id ? { ...c, ...changes } : c));
    setLocal(STORAGE_KEYS.cooperativas, updated);
  },

  // ==========================================
  // BUSES
  // ==========================================
  async getBuses(cooperativaId?: string): Promise<BusRow[]> {
    const supabase = createClient();
    try {
      let query = supabase.from('Bus').select('*');
      if (cooperativaId) {
        query = query.eq('cooperativaId', cooperativaId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const allLocal = getLocal<BusRow[]>(STORAGE_KEYS.buses, INITIAL_BUSES);
        const merged = [
          ...(data as BusRow[]),
          ...allLocal.filter(l => !data.some(d => d.id === l.id)),
        ];
        setLocal(STORAGE_KEYS.buses, merged);
        return data as BusRow[];
      }
    } catch (e) {
      console.warn('Fallback a buses locales:', e);
    }
    const local = getLocal<BusRow[]>(STORAGE_KEYS.buses, INITIAL_BUSES);
    return cooperativaId ? local.filter(b => b.cooperativaId === cooperativaId) : local;
  },

  async createBus(bus: Omit<BusRow, 'id'>): Promise<BusRow> {
    const supabase = createClient();
    const newBus: BusRow = {
      ...bus,
      id: `bus-${Date.now()}`,
    };

    try {
      const { data, error } = await supabase.from('Bus').insert(newBus).select().single();
      if (!error && data) {
        const current = getLocal<BusRow[]>(STORAGE_KEYS.buses, INITIAL_BUSES);
        setLocal(STORAGE_KEYS.buses, [data as BusRow, ...current.filter(b => b.id !== data.id)]);
        return data as BusRow;
      }
    } catch (e) {
      console.warn('Error al insertar Bus en Supabase:', e);
    }

    const current = getLocal<BusRow[]>(STORAGE_KEYS.buses, INITIAL_BUSES);
    setLocal(STORAGE_KEYS.buses, [newBus, ...current]);
    return newBus;
  },

  async updateBus(id: string, changes: Partial<BusRow>): Promise<void> {
    const supabase = createClient();
    try {
      await supabase.from('Bus').update(changes).eq('id', id);
    } catch (e) {
      console.warn('Error al actualizar Bus en Supabase:', e);
    }

    const current = getLocal<BusRow[]>(STORAGE_KEYS.buses, INITIAL_BUSES);
    setLocal(STORAGE_KEYS.buses, current.map(b => (b.id === id ? { ...b, ...changes } : b)));
  },

  // ==========================================
  // FRECUENCIAS Y PARADAS
  // ==========================================
  async getFrecuencias(filtros?: { origen?: string; destino?: string; cooperativaId?: string }): Promise<FrecuenciaRow[]> {
    const supabase = createClient();
    try {
      let query = supabase.from('Frecuencia').select('*');
      if (filtros?.origen) query = query.ilike('origen', `%${filtros.origen}%`);
      if (filtros?.destino) query = query.ilike('destino', `%${filtros.destino}%`);
      if (filtros?.cooperativaId) query = query.eq('cooperativaId', filtros.cooperativaId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as FrecuenciaRow[];
      }
    } catch (e) {
      console.warn('Fallback a frecuencias locales:', e);
    }

    let local = getLocal<FrecuenciaRow[]>(STORAGE_KEYS.frecuencias, INITIAL_FRECUENCIAS);
    if (filtros?.origen) {
      local = local.filter(f => f.origen.toLowerCase().includes(filtros.origen!.toLowerCase()));
    }
    if (filtros?.destino) {
      local = local.filter(f => f.destino.toLowerCase().includes(filtros.destino!.toLowerCase()));
    }
    if (filtros?.cooperativaId) {
      local = local.filter(f => f.cooperativaId === filtros.cooperativaId);
    }
    return local;
  },

  async createFrecuencia(frec: Omit<FrecuenciaRow, 'id'>): Promise<FrecuenciaRow> {
    const supabase = createClient();
    const newFrec: FrecuenciaRow = {
      ...frec,
      id: `frec-${Date.now()}`,
    };

    try {
      const { data, error } = await supabase.from('Frecuencia').insert(newFrec).select().single();
      if (!error && data) {
        const current = getLocal<FrecuenciaRow[]>(STORAGE_KEYS.frecuencias, INITIAL_FRECUENCIAS);
        setLocal(STORAGE_KEYS.frecuencias, [data as FrecuenciaRow, ...current.filter(f => f.id !== data.id)]);
        return data as FrecuenciaRow;
      }
    } catch (e) {
      console.warn('Error al insertar Frecuencia en Supabase:', e);
    }

    const current = getLocal<FrecuenciaRow[]>(STORAGE_KEYS.frecuencias, INITIAL_FRECUENCIAS);
    setLocal(STORAGE_KEYS.frecuencias, [newFrec, ...current]);
    return newFrec;
  },

  async getParadas(frecuenciaId?: string): Promise<ParadaFrecuenciaRow[]> {
    const supabase = createClient();
    try {
      let query = supabase.from('ParadaFrecuencia').select('*').order('orden', { ascending: true });
      if (frecuenciaId) query = query.eq('frecuenciaId', frecuenciaId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as ParadaFrecuenciaRow[];
    } catch (e) {
      console.warn('Fallback a paradas locales:', e);
    }

    const local = getLocal<ParadaFrecuenciaRow[]>(STORAGE_KEYS.paradas, INITIAL_PARADAS);
    return frecuenciaId ? local.filter(p => p.frecuenciaId === frecuenciaId) : local;
  },

  // ==========================================
  // RUTAS (VIAJES PROGRAMADOS)
  // ==========================================
  async getRutas(filtros?: { fecha?: string; frecuenciaId?: string }): Promise<RutaRow[]> {
    const supabase = createClient();
    try {
      let query = supabase.from('Ruta').select('*');
      if (filtros?.fecha) query = query.eq('fecha', filtros.fecha);
      if (filtros?.frecuenciaId) query = query.eq('frecuenciaId', filtros.frecuenciaId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as RutaRow[];
    } catch (e) {
      console.warn('Fallback a rutas locales:', e);
    }

    let local = getLocal<RutaRow[]>(STORAGE_KEYS.rutas, INITIAL_RUTAS);
    if (filtros?.fecha) local = local.filter(r => r.fecha === filtros.fecha);
    if (filtros?.frecuenciaId) local = local.filter(r => r.frecuenciaId === filtros.frecuenciaId);
    return local;
  },

  async createRuta(ruta: Omit<RutaRow, 'id'>): Promise<RutaRow> {
    const supabase = createClient();
    const newRuta: RutaRow = {
      ...ruta,
      id: `ruta-${Date.now()}`,
    };

    try {
      const { data, error } = await supabase.from('Ruta').insert(newRuta).select().single();
      if (!error && data) {
        const current = getLocal<RutaRow[]>(STORAGE_KEYS.rutas, INITIAL_RUTAS);
        setLocal(STORAGE_KEYS.rutas, [data as RutaRow, ...current.filter(r => r.id !== data.id)]);
        return data as RutaRow;
      }
    } catch (e) {
      console.warn('Error al insertar Ruta en Supabase:', e);
    }

    const current = getLocal<RutaRow[]>(STORAGE_KEYS.rutas, INITIAL_RUTAS);
    setLocal(STORAGE_KEYS.rutas, [newRuta, ...current]);
    return newRuta;
  },

  // ==========================================
  // BOLETOS
  // ==========================================
  async getBoletos(filtros?: { pasajeroId?: string; rutaId?: string; estado?: string }): Promise<BoletoRow[]> {
    const supabase = createClient();
    try {
      let query = supabase.from('Boleto').select('*');
      if (filtros?.pasajeroId) query = query.eq('pasajeroId', filtros.pasajeroId);
      if (filtros?.rutaId) query = query.eq('rutaId', filtros.rutaId);
      if (filtros?.estado) query = query.eq('estado', filtros.estado);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const local = getLocal<BoletoRow[]>(STORAGE_KEYS.boletos, INITIAL_BOLETOS);
        const merged = [...(data as BoletoRow[]), ...local.filter(l => !data.some(d => d.id === l.id))];
        setLocal(STORAGE_KEYS.boletos, merged);
        return data as BoletoRow[];
      }
    } catch (e) {
      console.warn('Fallback a boletos locales:', e);
    }

    let local = getLocal<BoletoRow[]>(STORAGE_KEYS.boletos, INITIAL_BOLETOS);
    if (filtros?.pasajeroId) local = local.filter(b => b.pasajeroId === filtros.pasajeroId);
    if (filtros?.rutaId) local = local.filter(b => b.rutaId === filtros.rutaId);
    if (filtros?.estado) local = local.filter(b => b.estado === filtros.estado);
    return local;
  },

  async createBoleto(boletoData: Omit<BoletoRow, 'id' | 'codigoQr'>): Promise<BoletoRow> {
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
      if (!error && data) {
        const current = getLocal<BoletoRow[]>(STORAGE_KEYS.boletos, INITIAL_BOLETOS);
        setLocal(STORAGE_KEYS.boletos, [data as BoletoRow, ...current.filter(b => b.id !== data.id)]);
        return data as BoletoRow;
      }
    } catch (e) {
      console.warn('Error al guardar Boleto en Supabase:', e);
    }

    const current = getLocal<BoletoRow[]>(STORAGE_KEYS.boletos, INITIAL_BOLETOS);
    setLocal(STORAGE_KEYS.boletos, [newBoleto, ...current]);
    return newBoleto;
  },

  async updateBoletoEstado(id: string, nuevoEstado: string, extra?: Partial<BoletoRow>): Promise<void> {
    const supabase = createClient();
    const updatePayload = { estado: nuevoEstado, ...extra };

    try {
      await supabase.from('Boleto').update(updatePayload).eq('id', id);
    } catch (e) {
      console.warn('Error al actualizar Boleto en Supabase:', e);
    }

    const current = getLocal<BoletoRow[]>(STORAGE_KEYS.boletos, INITIAL_BOLETOS);
    setLocal(
      STORAGE_KEYS.boletos,
      current.map(b => (b.id === id ? { ...b, ...updatePayload } : b))
    );
  },

  async validarBoletoQR(codigoQrOId: string): Promise<{
    exito: boolean;
    mensaje: string;
    boleto?: BoletoRow;
  }> {
    const cleanTerm = codigoQrOId.trim();
    const boletos = await this.getBoletos();
    const boleto = boletos.find(
      b => b.codigoQr?.toUpperCase() === cleanTerm.toUpperCase() || b.id.toUpperCase() === cleanTerm.toUpperCase()
    );

    if (!boleto) {
      return { exito: false, mensaje: 'Boleto no encontrado en el sistema o código QR inválido.' };
    }

    if (boleto.estado === 'abordado') {
      return {
        exito: false,
        mensaje: `¡Alerta! Este boleto ya fue abordado el ${new Date(boleto.abordadoAt || '').toLocaleString()}.`,
        boleto,
      };
    }

    if (boleto.estado === 'cancelado') {
      return { exito: false, mensaje: 'Este boleto ha sido cancelado.', boleto };
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
  // USUARIOS
  // ==========================================
  async getUsuarios(): Promise<UsuarioRow[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from('Usuario').select('*');
      if (!error && data && data.length > 0) {
        setLocal(STORAGE_KEYS.usuarios, data);
        return data as UsuarioRow[];
      }
    } catch (e) {
      console.warn('Fallback a usuarios locales:', e);
    }
    return getLocal<UsuarioRow[]>(STORAGE_KEYS.usuarios, INITIAL_USUARIOS);
  },

  async updateUsuario(id: string, changes: Partial<UsuarioRow>): Promise<void> {
    const supabase = createClient();
    try {
      await supabase.from('Usuario').update(changes).eq('id', id);
    } catch (e) {
      console.warn('Error al actualizar Usuario en Supabase:', e);
    }

    const current = getLocal<UsuarioRow[]>(STORAGE_KEYS.usuarios, INITIAL_USUARIOS);
    setLocal(
      STORAGE_KEYS.usuarios,
      current.map(u => (u.id === id ? { ...u, ...changes } : u))
    );
  },

  // ==========================================
  // POBLADO AUTOMÁTICO EN SUPABASE (SEED)
  // ==========================================
  async seedSupabase(): Promise<{ exito: boolean; detalle: string }> {
    const supabase = createClient();
    try {
      await supabase.from('ConfiguracionApp').upsert(INITIAL_CONFIG_APP);
      for (const coop of INITIAL_COOPERATIVAS) {
        await supabase.from('Cooperativa').upsert(coop);
      }
      for (const bus of INITIAL_BUSES) {
        await supabase.from('Bus').upsert(bus);
      }
      for (const frec of INITIAL_FRECUENCIAS) {
        await supabase.from('Frecuencia').upsert(frec);
      }
      for (const par of INITIAL_PARADAS) {
        await supabase.from('ParadaFrecuencia').upsert(par);
      }
      for (const ruta of INITIAL_RUTAS) {
        await supabase.from('Ruta').upsert(ruta);
      }
      return { exito: true, detalle: 'Base de datos de Supabase sincronizada con datos maestros.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { exito: false, detalle: `Error al sincronizar: ${message}` };
    }
  },
};
