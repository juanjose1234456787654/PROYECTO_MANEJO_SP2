# Arquitectura de Flota, Validaciones y Plantillas de Asientos (ECU-3 / Issue #67)

**Sistema:** EcuRutas - Sistema de Gestión de Transporte Terrestre Interprovincial y Urbano  
**Universidad:** Universidad Técnica de Ambato (UTA)  
**Módulo:** Flota de Buses, Validaciones y Plantillas de Asientos  
**Responsable:** Andrés Toasa (`@The-Fabry`, Dev 3)  
**Ticket:** ECU-3 / Issue #67  

---

## 1. Resumen Ejecutivo

Este módulo implementa la gestión integral de la flota vehicular bajo normativa de la Agencia Nacional de Tránsito (ANT) del Ecuador. Se superan las limitaciones de campos planos y texto libre anteriores, introduciendo:

1. **Diseñador Visual de Croquis y Asientos:** Capacidad para modelar plantas de 1 y 2 pisos con elementos interactivos (asientos normales, asientos VIP, puertas, baños, cafetería, pasillo y chofer).
2. **Derivación Automática de Asientos VIP:** Eliminación del campo manual ambiguo de asientos VIP. El sistema calcula en vivo la capacidad total y la lista ordenada de números VIP (`asientosVIPNumeros`), persistiendo la retrocompatibilidad total con el módulo de venta de boletos (Dev 4 / ECU-4).
3. **Validación Canónica y Manejo de Errores PostgreSQL:** Validación estricta de número de disco (1 a 4 dígitos numéricos) y formateo canónico automático de placas ecuatorianas (`ABC-456` a `ABC-0456`). Los errores de llaves duplicadas (23505) y formato (23514) son traducidos a mensajes en español sin exponer errores de base de datos.
4. **Protección Operativa en Hojas de Ruta:** Bloqueo y advertencia confirmable antes de deshabilitar o enviar a taller cualquier bus o frecuencia con viajes programados activos.
5. **Gestión de Paradas Intermedias:** Modal para administrar escalas intermedias en frecuencias.

---

## 2. Estructura JSON de la Distribución de Asientos (`ConfiguracionCroquis`)

La distribución se almacena como JSONB en la columna `Bus.distribucionAsientos` y `PlantillaBus.configuracionJson`:

```typescript
export interface ConfiguracionCroquis {
  tipoBus: 'URBANO' | 'INTERPROVINCIAL';
  pisos: 1 | 2;
  capacidadTotal: number;
  asientosVipCount: number;
  asientosNormalCount: number;
  asientosVipNumeros: number[]; // Ej: [1, 2, 3, 4]
  plantillaBaseId?: string | null;
  plantillaNombre?: string | null;
  plantas: PisoCroquis[];
}

export interface PisoCroquis {
  piso: 1 | 2;
  filas: number;
  columnas: number;
  elementos: ElementoCroquis[];
}

export interface ElementoCroquis {
  id: string; // Ej: "p1-0-1"
  fila: number;
  columna: number;
  tipo: TipoElementoBus;
  numero?: number; // Número de asiento visible para pasajeros
  categoria?: 'normal' | 'vip';
  piso?: 1 | 2;
  etiqueta?: string;
}

export type TipoElementoBus =
  | 'asiento_normal'
  | 'asiento_vip'
  | 'puerta'
  | 'bano'
  | 'cafeteria'
  | 'chofer'
  | 'pasillo'
  | 'vacio';
```

---

## 3. Reglas de Negocio ANT

1. **Modalidad Urbana:**
   - 1 solo piso permitido.
   - Sin categoría VIP (tarifa única reglamentaria de transporte público).
   - Sin baños ni cafetería a bordo.
   - 2 puertas obligatorias (delantera para ascenso, trasera para descenso).
2. **Modalidad Interprovincial:**
   - 1 o 2 pisos permitidos.
   - Admite asientos VIP con recargo porcentual legal en boletería.
   - Admite servicios de confort a bordo (baños higiénicos y cafetería).
3. **Numeración Canónica de Asientos:**
   - Los asientos se renumeran correlativamente de adelante hacia atrás, de izquierda a derecha.
   - Elementos no-pasajero (chofer, puerta, baño, cafetería, pasillo) no computan en la capacidad neta de pasajeros.
4. **Formato de Placas Vehiculares:**
   - Ecuatoriano canónico: 3 letras mayúsculas, guion, 4 dígitos numéricos (`^[A-Z]{3}-[0-9]{4}$`).
   - Placas de 3 números reciben un cero a la izquierda automáticamente (`ABC-456` -> `ABC-0456`).

---

## 4. Trazabilidad de Migraciones SQL

Para aplicar en la base de datos Supabase:
1. `supabase/migrations/202611160001_plantillas_bus_y_tipos.sql`: Crea tabla `PlantillaBus`, añade columnas `tipoBus`, `plantillaId`, `distribucionAsientos` a `Bus`, y crea constraints e índice UNIQUE `Bus_coop_numero_uidx`.
2. `supabase/migrations/202611160002_plantillas_bus_seed.sql`: Inserta plantillas iniciales globales (Urbano 40 pasajeros e Interprovincial Ejecutivo con Baño y Cafetería).
