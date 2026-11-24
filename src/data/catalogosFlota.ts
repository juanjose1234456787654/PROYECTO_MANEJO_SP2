/**
 * Catálogo inicial de Marcas y Carrocerías de Flota vehicular en Ecuador.
 * Ticket: ECU-3 / Issue #67
 *
 * TODO (Dev 2 / PR #84 - feature/cooperativas-wizard-permisos):
 * Cuando el PR #84 de Dev 2 sea integrado en develop, conectar estas funciones para consultar
 * dinámicamente las tablas "MarcaBus" y "CarroceriaBus" en Supabase con este catálogo estático
 * como fallback seguro si no hay conexión.
 */

export interface ItemCatalogoFlota {
  id: string;
  nombre: string;
  descripcion?: string;
  paisOrigen?: string;
}

export const CATALOGO_MARCAS_BUSES: ItemCatalogoFlota[] = [
  { id: 'marca-hino', nombre: 'Hino', descripcion: 'Chasis Hino AK / RK serie japonesa', paisOrigen: 'Japón' },
  { id: 'marca-mercedes', nombre: 'Mercedes-Benz', descripcion: 'Chasis OF 1721 / OH 1621 / O 500', paisOrigen: 'Alemania / Brasil' },
  { id: 'marca-scania', nombre: 'Scania', descripcion: 'Chasis K360 / K410 Euro 5', paisOrigen: 'Suecia' },
  { id: 'marca-volvo', nombre: 'Volvo', descripcion: 'Chasis B430R / B380R Euro 6', paisOrigen: 'Suecia' },
  { id: 'marca-chevrolet', nombre: 'Chevrolet / Isuzu', descripcion: 'Chasis MT 134 / FTR', paisOrigen: 'Japón / Ecuador' },
  { id: 'marca-volkswagen', nombre: 'Volkswagen', descripcion: 'Chasis 17.230 OD / 18.310 OT', paisOrigen: 'Alemania / Brasil' },
  { id: 'marca-yutong', nombre: 'Yutong', descripcion: 'Unidades interprovinciales y urbanas ZK', paisOrigen: 'China' },
  { id: 'marca-hyundai', nombre: 'Hyundai', descripcion: 'Chasis Universe / Aero Town', paisOrigen: 'Corea del Sur' },
];

export const CATALOGO_CARROCERIAS_BUSES: ItemCatalogoFlota[] = [
  { id: 'carroceria-marcopolo', nombre: 'Marcopolo', descripcion: 'Modelos Paradiso G7 / G8 / Torino', paisOrigen: 'Brasil' },
  { id: 'carroceria-varycca', nombre: 'Varycca', descripcion: 'Industria carrochera ambateña de alta calidad', paisOrigen: 'Ecuador (Ambato)' },
  { id: 'carroceria-cepeda', nombre: 'Carrocerías Cepeda', descripcion: 'Modelos Interprovinciales Silver / Celta', paisOrigen: 'Ecuador (Ambato)' },
  { id: 'carroceria-patricio-cepeda', nombre: 'Patricio Cepeda', descripcion: 'Carrocerías ejecutivas interprovinciales', paisOrigen: 'Ecuador (Ambato)' },
  { id: 'carroceria-miracle', nombre: 'Miracle', descripcion: 'Diseños aerodinámicos de un piso y doble piso', paisOrigen: 'Ecuador (Ambato)' },
  { id: 'carroceria-olimpia', nombre: 'Olimpia', descripcion: 'Carrocerías interprovinciales reforzadas', paisOrigen: 'Ecuador' },
  { id: 'carroceria-irizar', nombre: 'Irizar', descripcion: 'Modelos i6 / i8 de lujo interprovincial', paisOrigen: 'España / Brasil' },
  { id: 'carroceria-comil', nombre: 'Comil', descripcion: 'Modelos Campione / Invictus', paisOrigen: 'Brasil' },
];

/**
 * Obtiene la lista de marcas de buses disponibles.
 */
export function obtenerCatalogoMarcas(): ItemCatalogoFlota[] {
  return CATALOGO_MARCAS_BUSES;
}

/**
 * Obtiene la lista de carrocerías de buses disponibles.
 */
export function obtenerCatalogoCarrocerias(): ItemCatalogoFlota[] {
  return CATALOGO_CARROCERIAS_BUSES;
}
