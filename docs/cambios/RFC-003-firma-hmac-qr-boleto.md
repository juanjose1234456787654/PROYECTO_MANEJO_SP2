# Solicitud de Cambio Formal: RFC-003

| Campo | Valor |
|---|---|
| **RFC N°** | RFC-003 |
| **Issue en GitHub** | [#28 – `[RFC-003] Firma HMAC-SHA256 del QR del boleto`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/28) |
| **Autor / Responsable** | Mateo Morales (`@SebastianM-M`) |
| **Tarea Relacionada** | [#33 – `[13/18][Mateo] M1 – QR firmado HMAC`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/33) |
| **Estado del Ciclo de Vida** | `Propuesto` → `En revisión por CCB` → **`Aprobado`** *(listo para implementación en Fase 5)* |

---

## 1. Propuesta Técnica

Sustituir el código QR en texto plano del boleto por un token firmado criptográficamente con `HMAC-SHA256` en formato `boletoId|busId|fecha|hora|asiento|hmac`, generado y verificado exclusivamente en el servidor mediante Route Handlers de Next.js (`src/app/api/boletos/[id]/qr/route.ts` y `src/app/api/boletos/verificar-qr/route.ts`) utilizando la variable de entorno privada `QR_SECRET` y comparación segura contra ataques de tiempo (`crypto.timingSafeEqual`).

---

## 2. Motivación

Un identificador predecible en el QR permite que un tercero altere el número de asiento o el identificador de ruta para generar un código QR apócrifo. La firma HMAC-SHA256 garantiza integridad y autenticidad sin exponer la clave secreta en el navegador del pasajero ni del chofer.

---

## 3. Análisis de Impacto en Elementos de Configuración (CI)

- **Nivel de Impacto:** Medio (Módulos de boletos digitales y escaneo del chofer).
- **Elementos afectados:**
  - `src/app/api/boletos/[id]/qr/route.ts` (nuevo endpoint de firma).
  - `src/app/api/boletos/verificar-qr/route.ts` (nuevo endpoint de verificación).
  - `src/components/boletos/BoletoDigital.tsx` y `src/app/chofer/page.tsx`.
  - `.env.example` (`QR_SECRET` ya documentado en J2).

---

## 4. Resolución y Acta del Comité de Control de Cambios (CCB)

- **Fecha de sesión CCB:** 2026-11-02
- **Decisión:** **APROBADO** (Unanimidad 3/3)
- **Condición técnica de implementación:** Queda prohibido usar `NEXT_PUBLIC_` para el secreto HMAC; toda firma y validación debe ejecutarse del lado del servidor y marcar `abordadoAt` al primer escaneo válido.
- **Firmantes del CCB:**
  - Presidente CCB: `@juanjose1234456787654` (Juan Carvajal) — **Aprobado**
  - Vocal CCB 2: `@SebastianM-M` (Mateo Morales) — **Aprobado**
  - Vocal CCB 3: `@levi06516-ui` (Jeremy Guaman) — **Aprobado**
