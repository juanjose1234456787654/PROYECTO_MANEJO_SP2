# Solicitud de Cambio Formal: RFC-002

| Campo | Valor |
|---|---|
| **RFC N°** | RFC-002 |
| **Issue en GitHub** | [#27 – `[RFC-002] Tarifa proporcional por tramos en paradas intermedias`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/27) |
| **Autor / Responsable** | Andrés Toasa (`@The-Fabry`) |
| **Tarea Relacionada** | [#14 – `[04/18][Andrés] A1 – Paradas intermedias y cálculo de tramo`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/14) |
| **Estado del Ciclo de Vida** | `Propuesto` → `En revisión por CCB` → **`Aprobado`** *(listo para implementación en Fase 2)* |

---

## 1. Propuesta Técnica

Implementar en `src/lib/services/paradaService.ts` el algoritmo de validación y cálculo tarifario proporcional por tramos intermedios (`calcularTramoYPrecio`), utilizando el campo `orden` de la tabla `"ParadaFrecuencia"` y el objeto JSON `preciosPorTramo` (o proporción sobre `precioBase`) de la tabla `"Frecuencia"`, registrando en `"Boleto"` los identificadores `paradaOrigenId` y `paradaDestinoId`.

---

## 2. Motivación

La normativa de la Agencia Nacional de Tránsito (ANT) del Ecuador establece que las frecuencias interprovinciales con paradas autorizadas deben cobrar una tarifa proporcional al segmento recorrido por el pasajero y liberar el asiento para los tramos posteriores o anteriores no solapados.

---

## 3. Análisis de Impacto en Elementos de Configuración (CI)

- **Nivel de Impacto:** Medio (Módulo de lógica de negocio y búsqueda).
- **Elementos afectados:**
  - Nuevo servicio `src/lib/services/paradaService.ts`.
  - Tablas Supabase consultadas: `"Frecuencia"`, `"ParadaFrecuencia"`, `"Boleto"`.
  - Integración en `src/app/busqueda/page.tsx` para selección de tramo.

---

## 4. Resolución y Acta del Comité de Control de Cambios (CCB)

- **Fecha de sesión CCB:** 2026-11-02
- **Decisión:** **APROBADO** (Unanimidad 3/3)
- **Condición técnica de implementación:** El servicio debe validar que `paradaOrigen.orden < paradaDestino.orden` y aplicar cálculo proporcional por número de paradas cuando `preciosPorTramo` sea `null` en `"Frecuencia"`.
- **Firmantes del CCB:**
  - Presidente CCB: `@juanjose1234456787654` (Juan Carvajal) — **Aprobado**
  - Vocal CCB 2: `@The-Fabry` (Andrés Toasa) — **Aprobado**
  - Vocal CCB 3: `@AnahiM2025` (Anahí Morales) — **Aprobado**
