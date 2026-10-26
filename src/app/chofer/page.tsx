import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function ChoferPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Chofer / Ayudante</h1>
          <p className="text-sm text-gray-500">Hoja de ruta actual y escaneo de boletos QR para abordaje.</p>
        </div>
        <Badge variant="chofer">CHOFER</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Control de Abordaje y Escaneo</CardTitle>
          <CardDescription>Ruta protegida para rol chofer</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Scaffolding verificado. Conexión y sesión de chofer activas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
