import type { CooperativaRow } from '@/lib/types';

export type CooperativaFlotaSlug =
  | 'cita-express'
  | 'ambato-express'
  | 'transportes-ambato'
  | 'transportes-banos'
  | 'flota-pelileo';

export interface ImagenFlotaBus {
  src: string;
  alt: string;
  descripcion: string;
}

export interface GaleriaCooperativaFlota {
  slug: CooperativaFlotaSlug;
  nombreOficial: string;
  carpetaPublica: string;
  aliases: string[];
  imagenes: ImagenFlotaBus[];
}

export const CATALOGO_GALERIA_FLOTA: Record<CooperativaFlotaSlug, GaleriaCooperativaFlota> = {
  'cita-express': {
    slug: 'cita-express',
    nombreOficial: 'CITA Express Interprovincial',
    carpetaPublica: '/buses/cita-express',
    aliases: [
      'coop-003',
      'cita-express',
      'cita express interprovincial',
      'cita express',
      'cooperativa cita express',
    ],
    imagenes: [
      {
        src: '/buses/cita-express/bus-1.jpg',
        alt: 'Bus de CITA Express Interprovincial, vista lateral frontal',
        descripcion: 'Unidad climatizada de servicio interprovincial directo y con escalas',
      },
    ],
  },
  'ambato-express': {
    slug: 'ambato-express',
    nombreOficial: 'Cooperativa Ambato Express',
    carpetaPublica: '/buses/ambato-express',
    aliases: [
      'coop-004',
      'ambato-express',
      'cooperativa ambato express',
      'ambato express',
    ],
    imagenes: [
      {
        src: '/buses/ambato-express/bus-1.jpg',
        alt: 'Bus de Cooperativa Ambato Express en terminal terrestre',
        descripcion: 'Unidad interprovincial equipada con asientos estándar y servicio VIP',
      },
    ],
  },
  'transportes-ambato': {
    slug: 'transportes-ambato',
    nombreOficial: 'Cooperativa de Transportes Ambato',
    carpetaPublica: '/buses/transportes-ambato',
    aliases: [
      'transportes-ambato',
      'cooperativa de transportes ambato',
      'transportes ambato',
      'coop transportes ambato',
    ],
    imagenes: [
      {
        src: '/buses/transportes-ambato/bus-1.jpg',
        alt: 'Bus de Cooperativa de Transportes Ambato en ruta',
        descripcion: 'Unidad climatizada autorizada para rutas interprovinciales de la Sierra y Costa',
      },
    ],
  },
  'transportes-banos': {
    slug: 'transportes-banos',
    nombreOficial: 'Cooperativa de Transportes Baños',
    carpetaPublica: '/buses/transportes-banos',
    aliases: [
      'coop-001',
      'transportes-banos',
      'cooperativa de transportes banos',
      'cooperativa de transportes baños',
      'transportes banos',
      'transportes baños',
    ],
    imagenes: [
      {
        src: '/buses/transportes-banos/bus-1.jpg',
        alt: 'Bus ejecutivo de Cooperativa de Transportes Baños, vista lateral',
        descripcion: 'Unidad ejecutiva para conexión entre Baños, Ambato, Quito y Amazonía',
      },
    ],
  },
  'flota-pelileo': {
    slug: 'flota-pelileo',
    nombreOficial: 'Flota Pelileo',
    carpetaPublica: '/buses/flota-pelileo',
    aliases: [
      'coop-002',
      'flota-pelileo',
      'flota pelileo',
      'flota pelileo c.a.',
      'flota pelileo ca',
      'cooperativa flota pelileo',
    ],
    imagenes: [
      {
        src: '/buses/flota-pelileo/bus-1.jpg',
        alt: 'Bus de Flota Pelileo con compartimento de equipaje abierto',
        descripcion: 'Unidad interprovincial con sistema de climatización Air Fresh y bodega amplia',
      },
    ],
  },
};

function normalizarTexto(valor: string): string {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resuelve el slug de galería a partir del registro de Cooperativa o de un identificador/nombre.
 * Mapea tanto "Flota Pelileo" como "Flota Pelileo C.A." a 'flota-pelileo'.
 */
export function resolverSlugCooperativa(
  cooperativa: Pick<CooperativaRow, 'id' | 'nombre'> | string | null | undefined
): CooperativaFlotaSlug | null {
  if (!cooperativa) return null;

  const idTexto = typeof cooperativa === 'string' ? cooperativa : cooperativa.id;
  const nombreTexto = typeof cooperativa === 'string' ? cooperativa : cooperativa.nombre;

  const idNorm = normalizarTexto(idTexto);
  const nombreNorm = normalizarTexto(nombreTexto);

  for (const entrada of Object.values(CATALOGO_GALERIA_FLOTA)) {
    const coincideAlias = entrada.aliases.some((alias) => {
      const aliasNorm = normalizarTexto(alias);
      return aliasNorm === idNorm || aliasNorm === nombreNorm;
    });
    if (coincideAlias) return entrada.slug;
  }

  if (nombreNorm.includes('cita express')) return 'cita-express';
  if (nombreNorm.includes('ambato express')) return 'ambato-express';
  if (nombreNorm.includes('transportes ambato')) return 'transportes-ambato';
  if (nombreNorm.includes('banos')) return 'transportes-banos';
  if (nombreNorm.includes('pelileo')) return 'flota-pelileo';

  return null;
}

/**
 * Obtiene las imágenes de flota de una cooperativa.
 * Permite inyectar URLs externas (ej. Supabase Storage) si la tabla o el servicio las provee en el futuro.
 */
export function obtenerImagenesFlotaCooperativa(
  cooperativa: Pick<CooperativaRow, 'id' | 'nombre'> | string | null | undefined,
  urlsRemotasOpcionales?: string[] | null
): ImagenFlotaBus[] {
  const nombreCoop =
    typeof cooperativa === 'object' && cooperativa !== null
      ? cooperativa.nombre
      : typeof cooperativa === 'string'
      ? cooperativa
      : 'la cooperativa';

  if (Array.isArray(urlsRemotasOpcionales) && urlsRemotasOpcionales.length > 0) {
    return urlsRemotasOpcionales
      .filter((u) => typeof u === 'string' && u.trim() !== '')
      .slice(0, 2)
      .map((url, idx) => ({
        src: url,
        alt: `Bus ${idx + 1} de ${nombreCoop}`,
        descripcion: `Unidad oficial de ${nombreCoop}`,
      }));
  }

  const slug = resolverSlugCooperativa(cooperativa);
  if (!slug) return [];

  return CATALOGO_GALERIA_FLOTA[slug]?.imagenes ?? [];
}
