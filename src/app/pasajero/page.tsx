import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function PasajeroPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal del Pasajero</h1>
          <p className="text-sm text-gray-500">Historial de compras, boletos vigentes con código QR y perfil.</p>
        </div>
        <Badge variant="usuario">USUARIO</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Boletos y Viajes</CardTitle>
          <CardDescription>Ruta protegida para usuario autenticado</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Scaffolding verificado. Conexión y sesión de pasajero activas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
