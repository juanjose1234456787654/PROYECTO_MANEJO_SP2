export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolUsuario = 'admin' | 'cooperativa' | 'oficinista' | 'usuario' | 'chofer';

export type Database = {
  public: {
    Tables: {
      GrupoBus: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
        };
        Relationships: [];
      };
      GrupoFrecuencia: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
        };
        Relationships: [];
      };
      Cooperativa: {
        Row: {
          id: string;
          nombre: string;
          ruc: string;
          telefono: string | null;
          direccion: string | null;
          logoUrl: string | null;
          activo: boolean;
        };
        Insert: {
          id?: string;
          nombre: string;
          ruc: string;
          telefono?: string | null;
          direccion?: string | null;
          logoUrl?: string | null;
          activo?: boolean;
        };
        Update: {
          id?: string;
          nombre?: string;
          ruc?: string;
          telefono?: string | null;
          direccion?: string | null;
          logoUrl?: string | null;
          activo?: boolean;
        };
        Relationships: [];
      };
      Usuario: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          cedula: string | null;
          rol: RolUsuario;
          activo: boolean;
          cooperativaId: string | null;
        };
        Insert: {
          id: string;
          email: string;
          nombre: string;
          cedula?: string | null;
          rol?: RolUsuario;
          activo?: boolean;
          cooperativaId?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string;
          cedula?: string | null;
          rol?: RolUsuario;
          activo?: boolean;
          cooperativaId?: string | null;
        };
        Relationships: [];
      };
      Bus: {
        Row: {
          id: string;
          cooperativaId: string;
          grupoBusId: string | null;
          numero: number;
          placa: string;
          chasis: string | null;
          carroceria: string | null;
          marca: string | null;
          fotoUrl: string | null;
          capacidad: number;
          asientosVIP: number | null;
          asientosVIPNumeros: number[] | null;
          diasParada: number[] | null;
          activo: boolean;
        };
        Insert: {
          id?: string;
          cooperativaId: string;
          grupoBusId?: string | null;
          numero: number;
          placa: string;
          chasis?: string | null;
          carroceria?: string | null;
          marca?: string | null;
          fotoUrl?: string | null;
          capacidad: number;
          asientosVIP?: number | null;
          asientosVIPNumeros?: number[] | null;
          diasParada?: number[] | null;
          activo?: boolean;
        };
        Update: {
          id?: string;
          cooperativaId?: string;
          grupoBusId?: string | null;
          numero?: number;
          placa?: string;
          chasis?: string | null;
          carroceria?: string | null;
          marca?: string | null;
          fotoUrl?: string | null;
          capacidad?: number;
          asientosVIP?: number | null;
          asientosVIPNumeros?: number[] | null;
          diasParada?: number[] | null;
          activo?: boolean;
        };
        Relationships: [];
      };
      Frecuencia: {
        Row: {
          id: string;
          cooperativaId: string;
          grupoFrecuenciaId: string | null;
          resolucionANT: string | null;
          origen: string;
          destino: string;
          hora: string;
          tipoViaje: string | null;
          activa: boolean;
          duracion: string | null;
          precioBase: number;
          preciosPorTramo: Json | null;
        };
        Insert: {
          id?: string;
          cooperativaId: string;
          grupoFrecuenciaId?: string | null;
          resolucionANT?: string | null;
          origen: string;
          destino: string;
          hora: string;
          tipoViaje?: string | null;
          activa?: boolean;
          duracion?: string | null;
          precioBase: number;
          preciosPorTramo?: Json | null;
        };
        Update: {
          id?: string;
          cooperativaId?: string;
          grupoFrecuenciaId?: string | null;
          resolucionANT?: string | null;
          origen?: string;
          destino?: string;
          hora?: string;
          tipoViaje?: string | null;
          activa?: boolean;
          duracion?: string | null;
          precioBase?: number;
          preciosPorTramo?: Json | null;
        };
        Relationships: [];
      };
      ParadaFrecuencia: {
        Row: {
          id: string;
          frecuenciaId: string;
          ciudad: string;
          orden: number;
        };
        Insert: {
          id?: string;
          frecuenciaId: string;
          ciudad: string;
          orden: number;
        };
        Update: {
          id?: string;
          frecuenciaId?: string;
          ciudad?: string;
          orden?: number;
        };
        Relationships: [];
      };
      Ruta: {
        Row: {
          id: string;
          frecuenciaId: string;
          fecha: string;
          busId: string | null;
          estado: string;
          inicio: string | null;
          completada: string | null;
          precio: number | null;
          choferId: string | null;
        };
        Insert: {
          id?: string;
          frecuenciaId: string;
          fecha: string;
          busId?: string | null;
          estado?: string;
          inicio?: string | null;
          completada?: string | null;
          precio?: number | null;
          choferId?: string | null;
        };
        Update: {
          id?: string;
          frecuenciaId?: string;
          fecha?: string;
          busId?: string | null;
          estado?: string;
          inicio?: string | null;
          completada?: string | null;
          precio?: number | null;
          choferId?: string | null;
        };
        Relationships: [];
      };
      Boleto: {
        Row: {
          id: string;
          rutaId: string;
          pasajeroId: string | null;
          asiento: number;
          precio: number;
          descuento: number | null;
          tipoPasajero: string | null;
          metodoPago: string | null;
          comprobanteUrl: string | null;
          estado: string;
          vendidoPor: string | null;
          vendidoPorChoferId: string | null;
          paradaOrigenId: string | null;
          paradaDestinoId: string | null;
          pasajeroNombre: string | null;
          pasajeroCedula: string | null;
          codigoQr: string | null;
          abordadoAt: string | null;
        };
        Insert: {
          id?: string;
          rutaId: string;
          pasajeroId?: string | null;
          asiento: number;
          precio: number;
          descuento?: number | null;
          tipoPasajero?: string | null;
          metodoPago?: string | null;
          comprobanteUrl?: string | null;
          estado?: string;
          vendidoPor?: string | null;
          vendidoPorChoferId?: string | null;
          paradaOrigenId?: string | null;
          paradaDestinoId?: string | null;
          pasajeroNombre?: string | null;
          pasajeroCedula?: string | null;
          codigoQr?: string | null;
          abordadoAt?: string | null;
        };
        Update: {
          id?: string;
          rutaId?: string;
          pasajeroId?: string | null;
          asiento?: number;
          precio?: number;
          descuento?: number | null;
          tipoPasajero?: string | null;
          metodoPago?: string | null;
          comprobanteUrl?: string | null;
          estado?: string;
          vendidoPor?: string | null;
          vendidoPorChoferId?: string | null;
          paradaOrigenId?: string | null;
          paradaDestinoId?: string | null;
          pasajeroNombre?: string | null;
          pasajeroCedula?: string | null;
          codigoQr?: string | null;
          abordadoAt?: string | null;
        };
        Relationships: [];
      };
      RegistroParada: {
        Row: {
          id: string;
          rutaId: string;
          paradaId: string;
          llegada: string;
        };
        Insert: {
          id?: string;
          rutaId: string;
          paradaId: string;
          llegada?: string;
        };
        Update: {
          id?: string;
          rutaId?: string;
          paradaId?: string;
          llegada?: string;
        };
        Relationships: [];
      };
      ConfiguracionApp: {
        Row: {
          id: string;
          nombreApp: string;
          logoUrl: string | null;
          colorPrimaria: string | null;
          colorSecundaria: string | null;
          redesSociales: Json | null;
          soporteEmail: string | null;
          soporteTelefono: string | null;
          updatedAt: string | null;
        };
        Insert: {
          id?: string;
          nombreApp?: string;
          logoUrl?: string | null;
          colorPrimaria?: string | null;
          colorSecundaria?: string | null;
          redesSociales?: Json | null;
          soporteEmail?: string | null;
          soporteTelefono?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          id?: string;
          nombreApp?: string;
          logoUrl?: string | null;
          colorPrimaria?: string | null;
          colorSecundaria?: string | null;
          redesSociales?: Json | null;
          soporteEmail?: string | null;
          soporteTelefono?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
