# Solicitud de Cambio Formal: RFC-001

| Campo | Valor |
|---|---|
| **RFC N°** | RFC-001 |
| **Issue en GitHub** | [#26 – `[RFC-001] Migrar de mockData a Supabase real`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/26) |
| **Autor / Responsable** | Juan José Carvajal Jaya (`@juanjose1234456787654`) |
| **Tarea Relacionada** | [#11 – `[01/18][Juan] J2 – Integración real de Supabase`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/11) |
| **PR de Implementación** | [#42 – `feat(supabase): integracion real de Supabase y eliminacion de mockData (J2)`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/42) |
| **Estado del Ciclo de Vida** | `Propuesto` → `En revisión por CCB` → `Aprobado` → **`Implementado`** |

---

## 1. Propuesta Técnica

Eliminar por completo el archivo de datos simulados `src/lib/data/mockData.ts` y el uso de `localStorage` como persistencia alternativa en `src/lib/services/dataService.ts`, reemplazándolos por consultas asíncronas reales hacia PostgreSQL en Supabase mediante `@supabase/ssr` y `@supabase/supabase-js`, exportando los tipos compartidos y el tipo uniforme `Result<T>` desde `src/lib/types/index.ts`.

---

## 2. Motivación

El prototipo inicial operaba con arreglos estáticos (`INITIAL_COOPERATIVAS`, `INITIAL_BUSES`, `INITIAL_BOLETOS`) que impedían compartir estado real entre los roles `usuario`, `oficinista`, `chofer`, `cooperativa` y `admin`. Para cumplir los requerimientos del segundo parcial y permitir que los módulos de tramos (Fase 2), filtros/asientos (Fase 3), comprobantes (Fase 4) y escaneo QR (Fase 5) operen sobre datos reales, es indispensable centralizar toda lectura y escritura en las 11 tablas en PascalCase de Supabase.

---

## 3. Análisis de Impacto en Elementos de Configuración (CI)

- **Nivel de Impacto:** Alto (Arquitectura de datos transversal).
- **Archivos creados/modificados:**
  - `.env.example` (documentación de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `QR_SECRET`).
  - `src/lib/supabase/client.ts` y `src/lib/supabase/server.ts`.
  - `src/lib/types/index.ts` (nuevo punto único de exportación de tipos y `Result<T>`).
  - `src/lib/services/dataService.ts` (reescritura total contra Supabase).
  - 16 archivos en `src/app/**` y `src/modules/**` migrados a `@/lib/types`.
  - `src/lib/data/mockData.ts` (eliminado: `-400` líneas).

---

## 4. Resolución y Acta del Comité de Control de Cambios (CCB)

- **Fecha de sesión CCB:** 2026-11-02
- **Decisión:** **APROBADO E IMPLEMENTADO** (Unanimidad 3/3)
- **Justificación técnica:** La migración mantiene compatibilidad total de firmas en `dataService`, incorpora el contrato `Result<T>` sin usar `any`, respeta las políticas RLS usando exclusivamente la clave pública `anon` en el cliente y supera sin errores `npx tsc --noEmit` y `npm run build` (19/19 rutas compiladas).
- **Firmantes del CCB:**
  - Presidente CCB: `@juanjose1234456787654` (Juan Carvajal) — **Aprobado**
  - Vocal CCB 2: `@The-Fabry` (Andrés Toasa) — **Aprobado**
  - Vocal CCB 3: `@CelesteTelenchanaa` (Celeste Telenchana) — **Aprobado**
