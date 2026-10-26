import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function CooperativaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Cooperativa</h1>
          <p className="text-sm text-gray-500">Gestión de unidades (buses), rutas y frecuencias asignadas.</p>
        </div>
        <Badge variant="cooperativa">COOPERATIVA</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Flota y Turnos</CardTitle>
          <CardDescription>Ruta protegida para roles admin y cooperativa</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Scaffolding verificado. Conexión y sesión de cooperativa activas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
