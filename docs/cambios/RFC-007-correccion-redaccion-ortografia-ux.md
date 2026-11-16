# 📋 Solicitud de Cambio Formal: RFC-007 (Cambio Estándar ITIL)

| Campo | Valor |
|---|---|
| **RFC N°** | **RFC-007** (RFC-2026-007) |
| **Issue en GitHub** | [#75 – `[RFC-007] Correccion de redaccion, ortografia y UX en pantallas y correos`](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/75) |
| **Tickets en Jira** | [GDCS-3](https://carvajaljayaj85-1792511955739.atlassian.net/browse/GDCS-3) · [ECU-9](https://carvajaljayaj85-1792511955739.atlassian.net/browse/ECU-9) |
| **Responsable / Autor** | Mateo Morales (Dev 6 · `@SebastianM-M`) |
| **Tipo de Cambio (ITIL)** | **Cambio Estándar (Preaprobado)** — Procedimiento estandarizado de catálogo, bajo riesgo e impacto controlado. |
| **Rama de Trabajo** | `feature/RFC-007-redaccion-ortografia-ux` |
| **Estado del Ciclo de Vida** | `Preaprobado por Catálogo` → `En Implementación` → **`Listo para Merge`** |

---

## 1. Justificación y Propuesta Técnica

### 1.1 Motivación del Negocio
La plataforma EcuRutas (Sistema de Gestión y Venta de Pasajes Interprovinciales - Cooperativa Ambato Express) está orientada a usuarios finales, oficinistas de terminal, transportistas y entidades de regulación nacional como la Agencia Nacional de Tránsito (ANT). 

Durante la auditoría de calidad de interfaz y experiencia de usuario (UI/UX), se identificaron inconsistencias ortográficas, ausencia de tildes normativas en español (ej. *autenticación, confirmación, información, términos, políticas, vehículo, categoría, código, resolución*), mensajes de retroalimentación ambiguos y falta de pulido formal en las plantillas de correo electrónico transaccional.

### 1.2 Alcance Técnico del Cambio
1. **Revisión y corrección integral de ortografía y gramática** en todas las vistas de la aplicación (`src/app/`): Landing, Búsqueda, Taquilla, Ventanilla, Chofer, Pasajero, Cooperativa, Admin, Pagos y Login.
2. **Corrección de redacción institucional** en las plantillas HTML/texto de correos electrónicos transaccionales (`src/modules/notificaciones/emailTemplates.ts`).
3. **Consistencia de terminología UX**: Unificación de nombres de botones, estados del boleto, etiquetas de formularios y leyendas normativas ANT.
4. **Cumplimiento del Checklist ITIL**: Procedimiento de cambio estándar documentado, CMDB actualizada, verificación de compilación (`typecheck`/`lint` en 0 errores) y emisión del informe PIR (Post-Implementation Review).

---

## 2. Análisis de Impacto en Elementos de Configuración (CMDB / CI)

| Código CI | Elemento de Configuración | Tipo de Modificación | Nivel de Riesgo |
|---|---|---|:---:|
| **CI-PAG-01** | `src/app/page.tsx` | Corrección ortográfica y redacción en Home, Guía Turística y FAQ | Bajo |
| **CI-PAG-02** | `src/app/busqueda/page.tsx` | Tildes, advertencias de validación ANT y modales de reserva | Bajo |
| **CI-PAG-03** | `src/app/oficina/page.tsx` | Redacción en panel de comprobantes, taquilla e historial | Bajo |
| **CI-PAG-04** | `src/app/chofer/page.tsx` | Mensajes de escáner QR, estados de abordaje y control de flota | Bajo |
| **CI-PAG-05** | `src/app/pasajero/page.tsx` | Casillero digital de boletos, títulos y etiquetas de exportación PDF | Bajo |
| **CI-PAG-06** | `src/app/admin/page.tsx` | Formularios administrativos, gestión de roles y configuración | Bajo |
| **CI-PAG-07** | `src/app/cooperativa/page.tsx` | Gestión de flota, frecuencias y asignación de despachos | Bajo |
| **CI-PAG-08** | `src/app/login/page.tsx` | Mensajes de error, login y recuperación de cuenta | Bajo |
| **CI-NOT-01** | `src/modules/notificaciones/emailTemplates.ts` | Plantillas de confirmación, rechazo y emisión de boletos | Bajo |
| **CI-DOC-01** | `docs/configuracion.md` | Actualización de la CMDB y registro del PIR | Bajo |

---

## 3. Procedimiento Estándar de Implementación (Checklist ITIL)

- [x] **Paso 1:** Creación de rama normalizada `feature/RFC-007-redaccion-ortografia-ux` desde `develop`.
- [x] **Paso 2:** Corrección ortográfica por capas funcionales mediante commits atómicos documentados.
- [x] **Paso 3:** Verificación estricta de compilación TypeScript (`npm run typecheck` con 0 errores).
- [x] **Paso 4:** Verificación de linter oficial Next.js / ESLint (`npm run lint` con 0 errores).
- [x] **Paso 5:** Pruebas visuales de no regresión en interfaces web.
- [x] **Paso 6:** Publicación de rama y solicitud formal de Pull Request hacia `main` / `develop`.
- [x] **Paso 7:** Registro de cierre Post-Implementation Review (PIR) en la CMDB del repositorio.

---

## 4. Plan de Pruebas y Criterios de Aceptación

1. **Cero Faltas Ortográficas:** Ningún texto visible en pantalla ni en correos debe carecer de tildes o puntuación adecuada según las normas de la Real Academia Española (RAE).
2. **Integridad Funcional:** Ningún cambio de texto debe romper identificadores de bases de datos, claves enum de Supabase (`PENDIENTE_APROBACION`, `COMPLETADO`, etc.) ni rutas del framework.
3. **Calidad de Código:** `tsc --noEmit` y `npm run lint` deben finalizar con código de salida `0`.

---

## 5. Plan de Rollback (Reversión)
Al tratarse de un cambio puramente de presentación y redacción sin modificaciones de base de datos ni scripts DDL:
```bash
git revert HEAD~8..HEAD
```
El rollback es inmediato y sin riesgo de pérdida de datos.

---

## 6. Resolución y Acta de Preaprobación ITIL

- **Clasificación ITIL:** Cambio Estándar preautorizado según Catálogo de Servicios SACM (Sección 3.2 de `docs/configuracion.md`).
- **Responsable de Ejecución:** Mateo Morales (`@SebastianM-M`)
- **Aprobador Técnico / Configuration Manager:** Juan Carvajal (`@juanjose1234456787654`)
