'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/services/dataService';
import type {
  BoletoRow,
  CooperativaRow,
  BusRow,
  RutaRow,
  FrecuenciaRow,
} from '@/lib/data/mockData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ReportesPage() {
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [rutas, setRutas] = useState<RutaRow[]>([]);
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bolList, coopList, busList, rutList, frecList] = await Promise.all([
          dataService.getBoletos(),
          dataService.getCooperativas(),
          dataService.getBuses(),
          dataService.getRutas(),
          dataService.getFrecuencias(),
        ]);
        setBoletos(bolList);
        setCooperativas(coopList);
        setBuses(busList);
        setRutas(rutList);
        setFrecuencias(frecList);
      } catch (err) {
        console.error('Error al cargar métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalRecaudado = boletos
    .filter((b) => b.estado === 'pagado' || b.estado === 'abordado')
    .reduce((acc, b) => acc + b.precio, 0);

  const boletosAbordados = boletos.filter((b) => b.estado === 'abordado').length;
  const porcentajeEfectividad =
    boletos.length > 0 ? Math.round((boletosAbordados / boletos.length) * 100) : 0;

  const totalDescuentosOtorgados = boletos.reduce((acc, b) => acc + (b.descuento || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Reportes Ejecutivos y Auditoría ITIL
            </h1>
            <Badge variant="admin">ANALÍTICA GLOBAL</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Métricas de recaudación, ocupación de flota, subsidios legales y trazabilidad de cambios del sistema EcuRutas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            🖨️ Exportar Informe
          </Button>
        </div>
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Recaudación Total</div>
          <div className="text-3xl font-black text-emerald-600 mt-2">${totalRecaudado.toFixed(2)}</div>
          <p className="text-[11px] text-gray-400 mt-1">Boletos liquidados y abordados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Boletos Emitidos</div>
          <div className="text-3xl font-black text-blue-900 mt-2">{boletos.length} Pasajes</div>
          <p className="text-[11px] text-gray-400 mt-1">
            {boletosAbordados} ya abordados con QR ({porcentajeEfectividad}%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Subsidios Legales (50%)</div>
          <div className="text-3xl font-black text-amber-600 mt-2">${totalDescuentosOtorgados.toFixed(2)}</div>
          <p className="text-[11px] text-gray-400 mt-1">Tercera edad, discapacidad y menores</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="text-xs font-bold uppercase text-gray-500">Flota Operativa</div>
          <div className="text-3xl font-black text-indigo-900 mt-2">{buses.length} Unidades</div>
          <p className="text-[11px] text-gray-400 mt-1">{cooperativas.length} Cooperativas activas</p>
        </div>
      </div>

      {/* Desglose por Cooperativa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">
              Desempeño Financiero por Cooperativa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="divide-y divide-gray-100">
              {cooperativas.map((coop) => {
                const coopFrecIds = frecuencias
                  .filter((f) => f.cooperativaId === coop.id)
                  .map((f) => f.id);
                const coopRutaIds = rutas
                  .filter((r) => coopFrecIds.includes(r.frecuenciaId))
                  .map((r) => r.id);
                const coopBoletos = boletos.filter((b) => coopRutaIds.includes(b.rutaId));
                const recaudado = coopBoletos
                  .filter((b) => b.estado === 'pagado' || b.estado === 'abordado')
                  .reduce((acc, b) => acc + b.precio, 0);

                return (
                  <div key={coop.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{coop.nombre}</div>
                      <div className="text-gray-500 text-[11px]">
                        RUC: {coop.ruc} | {coopBoletos.length} boletos emitidos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-600">
                        ${recaudado.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-gray-400">Total ingresos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Auditoría y Gobernanza ITIL */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">
              Gobernanza y Control de Cambios (ITIL SACM)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs text-gray-700">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
              <div className="font-bold text-blue-900">Elemento de Configuración (CI): Versión v0.2.0</div>
              <p className="text-[11px] text-blue-800">
                Línea base autorizada con soporte para 5 roles (Admin, Cooperativa, Oficinista, Chofer, Pasajero).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span>Esquema SQL Supabase & RLS:</span>
                <span className="font-bold text-emerald-700">✓ Auditado y Aprobado</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span>Middleware de Control de Acceso:</span>
                <span className="font-bold text-emerald-700">✓ Activo (5 Rutas)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span>Lector de Abordaje QR (html5-qrcode):</span>
                <span className="font-bold text-emerald-700">✓ Verificado en Dispositivos</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span>Unicidad de Asientos (`asiento_unico`):</span>
                <span className="font-bold text-emerald-700">✓ Previene Sobreventa</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
