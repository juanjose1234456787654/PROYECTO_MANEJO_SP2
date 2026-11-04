# Solicitud de Cambio Formal: RFC-004

| Campo | Valor |
|---|---|
| **RFC N°** | RFC-004 |
| **Issue en GitHub** | [#29 – `[RFC-004] Contenedor único de comprobantes y máquina de estados del pago`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/29) |
| **Autor / Responsable** | Anahí Morales (`@AnahiM2025`) |
| **Tarea Relacionada** | [#30 – `[10/18][Anahí] N1 – Comprobantes en proceso de pago`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/30) |
| **Estado del Ciclo de Vida** | `Propuesto` → `En revisión por CCB` → **`Aprobado`** *(listo para implementación en Fase 4)* |

---

## 1. Propuesta Técnica

Estandarizar el almacenamiento de respaldos de transferencia bancaria en un contenedor privado único de Supabase Storage denominado `comprobantes_pagos` con estructura de ruta `{pasajeroId}/{boletoId}/{timestamp}.{ext}` (archivos PDF/PNG/JPG hasta 5 MB) y formalizar la máquina de estados del campo `"Boleto".estado`:
- `PENDIENTE_APROBACION` → `COMPLETADO` (aprobado por `oficinista` en `/oficina`).
- `PENDIENTE_APROBACION` → `RECHAZADO` (rechazado con motivo obligatorio por `oficinista`).
- `COMPLETADO` → `EMBARCADO` (validado en abordaje por `chofer` en `/chofer`).

---

## 2. Motivación

Evitar discrepancias de nombres de contenedor entre el módulo de subida del pasajero (`/pagos`) y el visor del oficinista (`/oficina`), proteger los documentos financieros mediante URLs firmadas temporales (`createSignedUrl`) y prevenir transiciones de estado inválidas (como aprobar dos veces un mismo boleto o embarcar un boleto rechazado).

---

## 3. Análisis de Impacto en Elementos de Configuración (CI)

- **Nivel de Impacto:** Medio (Módulos de pagos, oficina, notificaciones y escaneo).
- **Elementos afectados:**
  - `src/app/pagos/page.tsx` y `src/app/oficina/page.tsx`.
  - `src/modules/notificaciones/` (eventos `PAGO_RECIBIDO`, `BOLETO_APROBADO`, `PAGO_RECHAZADO`).
  - Políticas RLS de Supabase Storage sobre el contenedor `comprobantes_pagos`.

---

## 4. Resolución y Acta del Comité de Control de Cambios (CCB)

- **Fecha de sesión CCB:** 2026-11-02
- **Decisión:** **APROBADO** (Unanimidad 3/3)
- **Condición técnica de implementación:** El panel del oficinista debe verificar que el estado actual en base de datos sea `PENDIENTE_APROBACION` antes de ejecutar la actualización para impedir condiciones de carrera o doble aprobación.
- **Firmantes del CCB:**
  - Presidente CCB: `@juanjose1234456787654` (Juan Carvajal) — **Aprobado**
  - Vocal CCB 2: `@AnahiM2025` (Anahí Morales) — **Aprobado**
  - Vocal CCB 3: `@The-Fabry` (Andrés Toasa) — **Aprobado**
