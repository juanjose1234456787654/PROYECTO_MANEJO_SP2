import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const roles = [
    {
      rol: 'admin' as const,
      title: 'Administrador',
      path: '/admin',
      desc: 'Gestión global del sistema, parámetros y supervisión.',
    },
    {
      rol: 'cooperativa' as const,
      title: 'Cooperativa',
      path: '/cooperativa',
      desc: 'Administración de buses, unidades y frecuencias asignadas.',
    },
    {
      rol: 'oficinista' as const,
      title: 'Oficinista',
      path: '/oficina',
      desc: 'Venta presencial de boletos y validación manual de comprobantes.',
    },
    {
      rol: 'chofer' as const,
      title: 'Chofer / Ayudante',
      path: '/chofer',
      desc: 'Escaneo de códigos QR y control de abordaje en ruta.',
    },
    {
      rol: 'usuario' as const,
      title: 'Pasajero / Usuario',
      path: '/pasajero',
      desc: 'Consulta de frecuencias, compra online y visualización de boletos QR.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="cooperativa">Scaffolding Base v0.1</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Sistema de Pasajes Interprovinciales
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Estructura base modular para trabajo colaborativo con Next.js 15, Supabase y RLS.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link href="/login">
            <Button variant="primary">Probar Login / Conexión</Button>
          </Link>
          <Link href="/busqueda">
            <Button variant="outline">Ver Búsqueda (Público)</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {roles.map((item) => (
          <Card key={item.rol} className="hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{item.title}</CardTitle>
                <Badge variant={item.rol}>{item.rol}</Badge>
              </div>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={item.path}>
                <Button variant="outline" size="sm" className="w-full">
                  Acceder a {item.path}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
