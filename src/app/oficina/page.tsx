import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function OficinaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Oficinista / Ventanilla</h1>
          <p className="text-sm text-gray-500">Venta presencial de boletos y validación de transferencias bancarias.</p>
        </div>
        <Badge variant="oficinista">OFICINISTA</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventanilla y Comprobantes</CardTitle>
          <CardDescription>Ruta protegida para roles oficinista, cooperativa y admin</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Scaffolding verificado. Conexión y sesión de oficinista activas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
