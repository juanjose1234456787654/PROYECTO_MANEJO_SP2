# Guía Técnica de Configuración de Supabase

Referencia operativa para la integración de Supabase en **EcuRutas** (Proyecto: `wlhfrmrzrkbdbgpkodds`).

---

## 1. Parámetros del Proyecto y Credenciales

- **Project Reference ID**: `wlhfrmrzrkbdbgpkodds`
- **URL Base**: `https://wlhfrmrzrkbdbgpkodds.supabase.co`
- **Variables Requeridas en `.env.local`**:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://wlhfrmrzrkbdbgpkodds.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_clave_anon_proporcionada_en_consola>
  ```

> ⚠️ **Regla de Oro de Seguridad**: Nunca incluyas ni expongas la clave `service_role` en variables públicas ni en el código del frontend. Toda interacción se realiza con el cliente SSR (`@supabase/ssr`) utilizando la clave anónima y los permisos evaluados por RLS en la base de datos.

---

## 2. Nomenclatura Estricta de Tablas y Columnas

En PostgreSQL, el esquema utiliza identificadores sensibles a mayúsculas/minúsculas (**PascalCase** para tablas y **camelCase** para columnas foráneas). En el código TypeScript y consultas de Next.js, debes consultar exactamente con estos literales:

```typescript
// Ejemplo correcto en cliente Supabase
const { data, error } = await supabase
  .from('Usuario') // Nombre exacto de la tabla en PascalCase
  .select('id, email, nombre, rol, activo, cooperativaId')
  .eq('id', userId)
  .single();

// Ejemplo de inserción de bus respetando claves foráneas
await supabase
  .from('Bus')
  .insert({
    cooperativaId: 'uuid-de-cooperativa',
    numero: 42,
    placa: 'TBA-1234',
    capacidad: 45,
    activo: true,
  });
```

---

## 3. Políticas de Seguridad (Row Level Security - RLS)

Todas las tablas tienen RLS habilitado. El acceso está configurado de acuerdo al siguiente modelo:

1. **Lectura Pública del Catálogo**:
   - Tablas: `"Cooperativa"`, `"Bus"`, `"GrupoBus"`, `"Frecuencia"`, `"GrupoFrecuencia"`, `"ParadaFrecuencia"`, `"Ruta"`, `"ConfiguracionApp"`.
   - Política: `CREATE POLICY "lectura_publica" ON "<Tabla>" FOR SELECT USING (true);`
2. **Acceso a Datos Propios**:
   - `"Usuario"`: Cada usuario solo puede ver su propia fila (`"id" = auth.uid()::text`).
   - `"Boleto"`: Cada pasajero solo puede ver sus propios boletos (`"pasajeroId" = auth.uid()::text`).
3. **Escrituras por Rol**:
   - Gestionadas mediante migraciones específicas verificando la pertenencia del rol del usuario autenticado en la tabla `"Usuario"`.

---

## 4. Configuración de Buckets de Storage

| Bucket ID | Nivel de Acceso | Tipos MIME Aceptados | Política de Acceso |
|-----------|-----------------|----------------------|--------------------|
| `comprobantes` | **Privado** | `image/jpeg, image/png, application/pdf` | Solo accesible por el pasajero propietario y oficinistas/admins para validación. |
| `buses` | **Público** | `image/jpeg, image/png, image/webp` | Lectura abierta para mostrar la unidad al pasajero en el catálogo. |
| `logos` | **Público** | `image/jpeg, image/png, image/svg+xml` | Lectura abierta para branding institucional de cooperativas. |

---

## 5. Automatización de Tipos TypeScript con Supabase CLI

Para sincronizar los tipos del esquema de Supabase con el archivo `src/types/database.types.ts`:

```powershell
# Iniciar sesión en la CLI de Supabase (requiere token personal de consola)
npx supabase login

# Generar y sobreescribir los tipos TypeScript
npm run types:supabase
```
