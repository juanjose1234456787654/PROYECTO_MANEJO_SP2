'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { dataService } from '@/lib/services/dataService';
import type { FrecuenciaRow, CooperativaRow } from '@/lib/data/mockData';

export default function HomePage() {
  const [frecuencias, setFrecuencias] = useState<FrecuenciaRow[]>([]);
  const [cooperativas, setCooperativas] = useState<CooperativaRow[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [frecList, coopList] = await Promise.all([
          dataService.getFrecuencias(),
          dataService.getCooperativas(),
        ]);
        setFrecuencias(frecList);
        setCooperativas(coopList);
      } catch {
        // Fallback
      }
    }
    loadStats();
  }, []);

  const roles = [
    {
      rol: 'admin' as const,
      title: 'Administrador General',
      path: '/admin',
      desc: 'Gestión de cooperativas, usuarios/roles, parámetros del sistema y auditoría de cambios.',
      badge: 'ADMIN',
      icon: '🛡️',
      color: 'border-red-200 bg-red-50/20',
    },
    {
      rol: 'cooperativa' as const,
      title: 'Encargado de Cooperativa',
      path: '/cooperativa',
      desc: 'Administración de flota de buses, frecuencias ANT, paradas intermedias y hojas de ruta.',
      badge: 'COOPERATIVA',
      icon: '🏢',
      color: 'border-purple-200 bg-purple-50/20',
    },
    {
      rol: 'oficinista' as const,
      title: 'Personal de Ventanilla',
      path: '/oficina',
      desc: 'Venta presencial de boletos con descuentos de ley y validación de transferencias bancarias.',
      badge: 'OFICINA',
      icon: '🎟️',
      color: 'border-emerald-200 bg-emerald-50/20',
    },
    {
      rol: 'chofer' as const,
      title: 'Conductor / Ayudante',
      path: '/chofer',
      desc: 'Escáner QR con cámara en tiempo real, control de abordaje y registro de escalas.',
      badge: 'CHOFER',
      icon: '👨‍✈️',
      color: 'border-amber-200 bg-amber-50/20',
    },
    {
      rol: 'usuario' as const,
      title: 'Pasajero / Cliente',
      path: '/pasajero',
      desc: 'Búsqueda pública, mapa interactivo de asientos VIP/Normal y casillero digital con código QR.',
      badge: 'PASAJERO',
      icon: '🎫',
      color: 'border-blue-200 bg-blue-50/20',
    },
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-200">
            <span>✨ Versión Operativa Integral v1.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Manejo de Software UTA</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            EcuRutas: Plataforma Nacional de Transporte Interprovincial
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            Sistema integral con arquitectura modular: búsqueda pública de frecuencias, selección interactiva de asientos VIP, validación de pasajes con código QR dinámico y gobernanza de código bajo ITIL.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link href="/busqueda">
              <Button variant="primary" size="lg" className="font-extrabold shadow-lg shadow-blue-600/30">
                🔍 Buscar Frecuencias y Reservar
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-white border-white/40 hover:bg-white/10 font-bold">
                🔑 Iniciar Sesión por Rol
              </Button>
            </Link>
            <Link href="/reportes">
              <Button variant="ghost" size="lg" className="text-blue-300 hover:text-white font-semibold">
                📊 Métricas y Auditoría ITIL
              </Button>
            </Link>
          </div>
        </div>

        {/* Barra de Estadísticas en el Hero */}
        <div className="relative z-10 mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-black text-amber-400">100%</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Utilidad y Funcionalidad</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400">{cooperativas.length || 3}</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Cooperativas Aliadas</div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-400">{frecuencias.length || 5}</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Frecuencias Interprovinciales</div>
          </div>
          <div>
            <div className="text-3xl font-black text-purple-400">5 Roles</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Seguridad RLS y Middleware</div>
          </div>
        </div>
      </div>

      {/* Acceso Directo a los 5 Portales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Portales del Sistema por Rol
            </h2>
            <p className="text-sm text-gray-500">
              Selecciona cualquier módulo para explorar y operar sus funcionalidades:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((item) => (
            <Card
              key={item.rol}
              className={`hover:shadow-xl transition-all border ${item.color} flex flex-col justify-between`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{item.icon}</div>
                  <Badge variant={item.rol}>{item.badge}</Badge>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">{item.title}</CardTitle>
                <CardDescription className="text-xs text-gray-600 leading-relaxed">
                  {item.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Link href={item.path} className="w-full block">
                  <Button variant="outline" size="sm" className="w-full font-bold">
                    Entrar al Portal ➔
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* Tarjeta Extra: Reportes e ITIL */}
          <Card className="hover:shadow-xl transition-all border border-indigo-200 bg-indigo-50/20 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl">📊</div>
                <Badge variant="admin">AUDITORÍA</Badge>
              </div>
              <CardTitle className="text-lg font-bold text-gray-900">Reportes e ITIL</CardTitle>
              <CardDescription className="text-xs text-gray-600 leading-relaxed">
                Métricas financieras, tasa de ocupación de buses y trazabilidad de cambios en producción.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/reportes" className="w-full block">
                <Button variant="outline" size="sm" className="w-full font-bold">
                  Ver Métricas Ejecutivas ➔
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
