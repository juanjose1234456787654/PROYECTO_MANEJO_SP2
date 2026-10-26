import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function BusquedaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Búsqueda de Frecuencias</h1>
          <p className="text-sm text-gray-500">Catálogo público de horarios y rutas interprovinciales en Ecuador.</p>
        </div>
        <Badge variant="success">CATÁLOGO PÚBLICO</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscador de Rutas y Horarios</CardTitle>
          <CardDescription>Disponible públicamente bajo política RLS lectura_publica</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Scaffolding verificado. Módulo de búsqueda preparado para conectar con las tablas &quot;Frecuencia&quot;, &quot;ParadaFrecuencia&quot; y &quot;Cooperativa&quot;.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
