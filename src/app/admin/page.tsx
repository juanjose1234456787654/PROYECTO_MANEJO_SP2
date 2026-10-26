import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Gestión global de la plataforma, roles y parámetros.</p>
        </div>
        <Badge variant="admin">ADMIN</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo de Control Central</CardTitle>
          <CardDescription>Ruta protegida exclusiva para el rol admin</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Scaffolding verificado. Conexión y sesión de administrador activas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
