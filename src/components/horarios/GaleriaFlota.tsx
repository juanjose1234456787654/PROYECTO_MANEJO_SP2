'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import type { CooperativaRow, BusRow, FrecuenciaRow } from '@/lib/types';
import {
  obtenerImagenesFlotaCooperativa,
  resolverSlugCooperativa,
  type ImagenFlotaBus,
} from '@/data/buses-galeria';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface GaleriaFlotaProps {
  cooperativas: CooperativaRow[];
  buses: BusRow[];
  frecuencias: FrecuenciaRow[];
  cooperativaSeleccionadaId: string;
  onSelectCooperativa: (cooperativaId: string) => void;
  urlsRemotasPorCooperativa?: Record<string, string[]>;
}

interface TarjetaFlotaExtendida {
  imagen: ImagenFlotaBus;
  resumenBus: string;
  esVip: boolean;
  asientosVip: number;
}

function construirResumenBus(bus: BusRow | undefined, nombreCooperativa: string): {
  texto: string;
  esVip: boolean;
  asientosVip: number;
} {
  if (!bus) {
    return {
      texto: nombreCooperativa,
      esVip: false,
      asientosVip: 0,
    };
  }

  const partes: string[] = [];
  if (bus.chasis?.trim()) {
    partes.push(`Chasis ${bus.chasis.trim()}`);
  } else if (bus.marca?.trim()) {
    partes.push(`Marca ${bus.marca.trim()}`);
  }

  if (bus.carroceria?.trim()) {
    partes.push(`Carrocería ${bus.carroceria.trim()}`);
  }

  const vipCount = bus.asientosVIP ?? 0;
  if (vipCount > 0) {
    partes.push(`Servicio VIP (${vipCount} asientos)`);
  } else {
    partes.push('Servicio Normal');
  }

  return {
    texto: partes.length > 0 ? partes.join(' · ') : nombreCooperativa,
    esVip: vipCount > 0,
    asientosVip: vipCount,
  };
}

export function GaleriaFlota({
  cooperativas,
  buses,
  frecuencias,
  cooperativaSeleccionadaId,
  onSelectCooperativa,
  urlsRemotasPorCooperativa,
}: GaleriaFlotaProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Animación suave de 250ms al cambiar de cooperativa, respetando prefers-reduced-motion
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30);
    return () => clearTimeout(timer);
  }, [cooperativaSeleccionadaId]);

  const cooperativaActiva = useMemo(() => {
    if (!cooperativaSeleccionadaId) return null;
    return (
      cooperativas.find((c) => c.id === cooperativaSeleccionadaId) ||
      cooperativas.find(
        (c) => resolverSlugCooperativa(c) === resolverSlugCooperativa(cooperativaSeleccionadaId)
      ) ||
      null
    );
  }, [cooperativas, cooperativaSeleccionadaId]);

  // Agrupar cooperativas para la vista "Todas las cooperativas" evitando duplicar tarjetas idénticas
  // (ej. "Flota Pelileo" y "Flota Pelileo C.A."), priorizando el registro que tenga frecuencias activas.
  const cooperativasPortada = useMemo(() => {
    const porSlug = new Map<
      string,
      {
        cooperativa: CooperativaRow;
        portada: ImagenFlotaBus | null;
        resumenBus: string;
        frecuenciasCount: number;
      }
    >();

    for (const coop of cooperativas) {
      const slug = resolverSlugCooperativa(coop) ?? coop.id;
      const frecCount = frecuencias.filter((f) => f.cooperativaId === coop.id).length;
      const existente = porSlug.get(slug);

      if (!existente || (frecCount > 0 && existente.frecuenciasCount === 0)) {
        const urlsRemotas = urlsRemotasPorCooperativa?.[coop.id] ?? null;
        const fotos = obtenerImagenesFlotaCooperativa(coop, urlsRemotas);
        const busCoop = buses.find((b) => b.cooperativaId === coop.id);
        const infoBus = construirResumenBus(busCoop, coop.nombre);

        porSlug.set(slug, {
          cooperativa: coop,
          portada: fotos[0] ?? null,
          resumenBus: infoBus.texto,
          frecuenciasCount: frecCount,
        });
      }
    }

    return Array.from(porSlug.values());
  }, [cooperativas, frecuencias, buses, urlsRemotasPorCooperativa]);

  // Fotos y datos de buses para la cooperativa seleccionada
  const tarjetasActivas: TarjetaFlotaExtendida[] = useMemo(() => {
    if (!cooperativaActiva) return [];

    const urlsRemotas = urlsRemotasPorCooperativa?.[cooperativaActiva.id] ?? null;
    const imagenes = obtenerImagenesFlotaCooperativa(cooperativaActiva, urlsRemotas);

    const slugActivo = resolverSlugCooperativa(cooperativaActiva);
    const idsHermanos = cooperativas
      .filter((c) => resolverSlugCooperativa(c) === slugActivo)
      .map((c) => c.id);

    const busesCoop = buses.filter(
      (b) => b.cooperativaId === cooperativaActiva.id || idsHermanos.includes(b.cooperativaId)
    );

    return imagenes.map((img, idx) => {
      const bus = busesCoop[idx] ?? busesCoop[0];
      const info = construirResumenBus(bus, cooperativaActiva.nombre);
      return {
        imagen: img,
        resumenBus: info.texto,
        esVip: info.esVip,
        asientosVip: info.asientosVip,
      };
    });
  }, [cooperativaActiva, cooperativas, buses, urlsRemotasPorCooperativa]);

  // Manejo de teclado y trampa de foco en el visor ampliado (Lightbox)
  useEffect(() => {
    if (lightboxIndex === null) return;

    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && tarjetasActivas.length > 1) {
        e.preventDefault();
        setLightboxIndex((prev) => (prev === null ? 0 : (prev + 1) % tarjetasActivas.length));
      } else if (e.key === 'ArrowLeft' && tarjetasActivas.length > 1) {
        e.preventDefault();
        setLightboxIndex((prev) =>
          prev === null ? 0 : (prev - 1 + tarjetasActivas.length) % tarjetasActivas.length
        );
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, tarjetasActivas.length]);

  const marcarImagenCargada = (src: string) => {
    setLoadedImages((prev) => ({ ...prev, [src]: true }));
  };

  return (
    <div
      className={`transition-opacity duration-300 motion-reduce:transition-none ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {!cooperativaActiva ? (
        /* VISTA 1: "Todas las cooperativas" -> Franja de tarjetas por cooperativa */
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 block">
                Unidades homologadas ANT
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 tracking-tight">
                Flota por Cooperativa de Transporte
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Selecciona una cooperativa para filtrar sus horarios y ver su flota en detalle
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {cooperativasPortada.map(({ cooperativa, portada, resumenBus }) => (
              <button
                key={cooperativa.id}
                type="button"
                onClick={() => onSelectCooperativa(cooperativa.id)}
                aria-label={`Ver flota y horarios de ${cooperativa.nombre}`}
                className="group text-left bg-neutral-50 hover:bg-white rounded-xl border border-neutral-200 hover:border-brand-400 overflow-hidden transition-all shadow-2xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 flex flex-col justify-between"
              >
                <div className="relative w-full aspect-video bg-neutral-200 overflow-hidden">
                  {portada ? (
                    <>
                      {!loadedImages[portada.src] && (
                        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
                      )}
                      <Image
                        src={portada.src}
                        alt={portada.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        onLoad={() => marcarImagenCargada(portada.src)}
                        className={`object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105 ${
                          loadedImages[portada.src] ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-[11px] text-neutral-500 font-medium">
                      Pronto verás aquí la flota de {cooperativa.nombre}
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <div className="text-xs font-extrabold text-neutral-900 group-hover:text-brand-700 transition-colors line-clamp-1">
                    {cooperativa.nombre}
                  </div>
                  <p className="text-[11px] text-neutral-600 line-clamp-1">{resumenBus}</p>
                  <span className="inline-block text-[11px] font-bold text-brand-700 pt-0.5">
                    Filtrar frecuencias ➔
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* VISTA 2: Una cooperativa seleccionada -> Bloque "Flota de {nombre}" */
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-700">
                   Cooperativa Seleccionada
                </span>
                <Badge variant="cooperativa">Flota Autorizada</Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight mt-0.5">
                Flota de {cooperativaActiva.nombre}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectCooperativa('')}
                className="text-xs font-bold"
              >
                Ver todas las cooperativas
              </Button>
            </div>
          </div>

          {tarjetasActivas.length === 0 ? (
            <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-xl p-8 text-center">
              <p className="text-sm font-bold text-neutral-700">
                Pronto verás aquí la flota de {cooperativaActiva.nombre}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Los horarios y frecuencias de esta cooperativa están disponibles a continuación.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 ${
                tarjetasActivas.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-2'
              } gap-4 items-stretch`}
            >
              {tarjetasActivas.map((item, idx) => (
                <div
                  key={item.imagen.src}
                  className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    aria-label={`Ampliar fotografía de ${item.imagen.alt}`}
                    className="group relative w-full aspect-video bg-neutral-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500 text-left"
                  >
                    {!loadedImages[item.imagen.src] && (
                      <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
                    )}
                    <Image
                      src={item.imagen.src}
                      alt={item.imagen.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={idx === 0}
                      onLoad={() => marcarImagenCargada(item.imagen.src)}
                      className={`object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105 ${
                        loadedImages[item.imagen.src] ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div className="absolute bottom-2.5 right-2.5 bg-neutral-900/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs opacity-90 group-hover:bg-brand-700 transition-colors">
                      Ampliar foto
                    </div>
                  </button>

                  <div className="p-3.5 space-y-1 bg-white border-t border-neutral-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-neutral-900">
                        {item.resumenBus}
                      </span>
                      {item.esVip && (
                        <span className="text-[11px] font-bold text-accent-800 bg-accent-100 px-2 py-0.5 rounded shrink-0">
                          VIP ({item.asientosVip})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600">{item.imagen.descripcion}</p>
                  </div>
                </div>
              ))}

              {/* Cuando hay 1 foto subida, mostramos junto a ella la ficha operativa de la cooperativa en escritorio */}
              {tarjetasActivas.length === 1 && (
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-brand-800 block">
                      Especificaciones de Operación
                    </span>
                    <h3 className="text-base font-extrabold text-neutral-900">
                      {cooperativaActiva.nombre}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {tarjetasActivas[0].imagen.descripcion}. Todas las unidades cumplen con la revisión técnica vehicular y tarifas reguladas por la Agencia Nacional de Tránsito.
                    </p>

                    <div className="pt-2 space-y-1.5 text-xs text-neutral-700 border-t border-neutral-200">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Configuración de flota:</span>
                        <span className="font-bold text-neutral-900">
                          {tarjetasActivas[0].resumenBus}
                        </span>
                      </div>
                      {cooperativaActiva.direccion && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Oficina / Terminal:</span>
                          <span className="font-semibold text-neutral-800 text-right">
                            {cooperativaActiva.direccion}
                          </span>
                        </div>
                      )}
                      {cooperativaActiva.telefono && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Contacto de boletería:</span>
                          <span className="font-mono font-semibold text-neutral-800">
                            {cooperativaActiva.telefono}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-xs">
                    <span className="text-neutral-500">
                      Haz clic en la fotografía para abrir el visor ampliado
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(0)}
                      className="font-bold text-brand-700 hover:text-brand-900 underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
                    >
                      Ver en pantalla completa
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VISOR AMPLIADO (LIGHTBOX ACCESIBLE) */}
      {lightboxIndex !== null && tarjetasActivas[lightboxIndex] && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Visor de flota de ${cooperativaActiva?.nombre ?? 'cooperativa'}`}
          className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
        >
          <div className="relative bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold">
                  {cooperativaActiva?.nombre}
                </h3>
                <p className="text-xs text-neutral-300">
                  {tarjetasActivas[lightboxIndex].resumenBus}
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Cerrar visor de imágenes"
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-brand-600 text-white font-bold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full aspect-video bg-neutral-950">
              <Image
                src={tarjetasActivas[lightboxIndex].imagen.src}
                alt={tarjetasActivas[lightboxIndex].imagen.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />

              {tarjetasActivas.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + tarjetasActivas.length) % tarjetasActivas.length
                      )
                    }
                    aria-label="Fotografía anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-brand-600 text-white font-bold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((lightboxIndex + 1) % tarjetasActivas.length)
                    }
                    aria-label="Fotografía siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-brand-600 text-white font-bold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="px-4 py-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600 border-t border-neutral-200">
              <span>{tarjetasActivas[lightboxIndex].imagen.descripcion}</span>
              <span className="font-mono text-neutral-500">
                Foto {lightboxIndex + 1} de {tarjetasActivas.length} · Presiona Esc para cerrar
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
