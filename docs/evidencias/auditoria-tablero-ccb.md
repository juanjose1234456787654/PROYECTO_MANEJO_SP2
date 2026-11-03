# Evidencia de Auditoría del Tablero de Gestión de Configuración, Gitflow y Simulación CCB

**Fecha de corte de auditoría:** 2026-11-03  
**Responsable de Gestión de Configuración:** Juan José Carvajal Jaya (`@juanjose1234456787654`)  
**Coordinador de Auditoría y Evidencias:** Jeremy Guaman (`@levi06516-ui`)  
**Enlace oficial al tablero activo:** [PROYECTO_MANEJO_SP2 – Tablero de Gestión de Configuración (Project #1)](https://github.com/users/juanjose1234456787654/projects/1)

---

## 1. Estrategia Gitflow del Equipo

El proyecto adopta la metodología **Gitflow** para garantizar un ciclo de vida de desarrollo aislado, ordenado y trazable:

*   **`main`:** Rama de producción. Almacena la versión estable y desplegada del software. Solo recibe integraciones provenientes de `develop` mediante liberaciones (*Releases*) aprobadas.
*   **`develop`:** Rama principal de integración. Concentra todas las funcionalidades finalizadas y probadas por el equipo antes de pasar a producción.
*   **`feature/*`:** Ramas temporales de desarrollo de funcionalidades (ej. `feature/docs-evidencias-gitflow`). Nacen a partir de `develop` y se fusionan mediante *Pull Requests* (PR) tras cumplir los criterios de aceptación y contar con 2 aprobaciones de revisión de código.

---

## 2. Estructura del Tablero en GitHub Projects v2

El tablero cuenta con los siguientes campos personalizados auditables (`gh project field-list 1 --owner juanjose1234456787654`):

| Campo | Identificador GraphQL | Tipo | Opciones Configuradas |
|-------|-----------------------|------|-----------------------|
| **Status** | `PVTSSF_lAHODQCk084Bpgspzhn8BbI` | `SINGLE_SELECT` | `Propuesto`, `En revisión por CCB`, `Aprobado`, `Implementado`, `Rechazado` |
| **Responsable** | `PVTSSF_lAHODQCk084Bpgspzhn8Bew` | `SINGLE_SELECT` | `Juan`, `Andrés`, `Celeste`, `Anahí`, `Mateo`, `Jeremy` |
| **Fase** | `PVTSSF_lAHODQCk084Bpgspzhn8Be0` | `SINGLE_SELECT` | `Fase 1 – Infraestructura`, `Fase 2 – Negocio`, `Fase 3 – UI`, `Fase 4 – Pagos`, `Fase 5 – QR`, `Fase 6 – Cierre` |
| **Tipo** | `PVTSSF_lAHODQCk084Bpgspzhn8Be4` | `SINGLE_SELECT` | `Tarea`, `Epic`, `RFC` |
| **Orden** | `PVTF_lAHODQCk084Bpgspzhn8BfA` | `NUMBER` | `1` a `21` |

---

## 3. Tabla Resumen por Integrante

Métricas cuantitativas de contribución extraídas del repositorio al finalizar el desarrollo:

| Integrante | GitHub | Commits | PR mergeados | Issues cerrados |
| :--- | :--- | :---: | :---: | :---: |
| **Juan Carvajal** | `@juanjose1234456787654` | — | — | — |
| **Andrés Toasa** | `@The-Fabry` | — | — | — |
| **Celeste Telenchana** | `@CelesteTelenchanaa` | — | — | — |
| **Anahí Morales** | `@AnahiM2025` | — | — | — |
| **Mateo Morales** | `@SebastianM-M` | — | — | — |
| **Jeremy Guaman** | `@levi06516-ui` | — | — | — |

---

## 4. Trazabilidad del Ciclo de Vida de las 4 RFC en el CCB

Cada Solicitud de Cambio (RFC) fue evaluada por el Comité de Control de Cambios (CCB) dejando constancia de los comentarios formales de admisión y dictamen en su respectivo issue:

| RFC | Issue | Título | Autor | Ciclo Recorrido (`ccb:*`) | Estado Actual en Tablero | Acta Documentada |
|-----|-------|--------|-------|---------------------------|--------------------------|------------------|
| **RFC-001** | [#26](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/26) | Migrar de `mockData` a Supabase real | `@juanjose1234456787654` | `Propuesto` → `En revisión por CCB` → `Aprobado` → `Implementado` | **Implementado** (`ccb:implementado`, PR #42 fusionado) | [`docs/cambios/RFC-001-migracion-supabase-real.md`](../cambios/RFC-001-migracion-supabase-real.md) |
| **RFC-002** | [#27](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/27) | Tarifa proporcional por tramos en paradas intermedias | `@The-Fabry` | `Propuesto` → `En revisión por CCB` → `Aprobado` | **Aprobado** (`ccb:aprobado`, habilita #14) | [`docs/cambios/RFC-002-tarifa-proporcional-tramos.md`](../cambios/RFC-002-tarifa-proporcional-tramos.md) |
| **RFC-003** | [#28](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/28) | Firma HMAC-SHA256 del QR del boleto | `@SebastianM-M` | `Propuesto` → `En revisión por CCB` → `Aprobado` | **Aprobado** (`ccb:aprobado`, habilita #33) | [`docs/cambios/RFC-003-firma-hmac-qr-boleto.md`](../cambios/RFC-003-firma-hmac-qr-boleto.md) |
| **RFC-004** | [#29](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/29) | Contenedor único de comprobantes y máquina de estados del pago | `@AnahiM2025` | `Propuesto` → `En revisión por CCB` → `Aprobado` | **Aprobado** (`ccb:aprobado`, habilita #30) | [`docs/cambios/RFC-004-contenedor-unico-comprobantes.md`](../cambios/RFC-004-contenedor-unico-comprobantes.md) |

---

## 5. Estado Completo de los 31 Ítems en el Tablero

| # Issue | Orden | Tipo | Fase | Responsable | Título | Estado en Tablero |
|:-------:|:-----:|:----:|------|-------------|--------|:-----------------:|
| **#11** | 01 | Tarea | Fase 1 – Infraestructura | Juan | `[01/18][Juan] J2 – Integración real de Supabase` | `Implementado` |
| **#12** | 02 | Tarea | Fase 1 – Infraestructura | Juan | `[02/18][Juan] J1 – Archivos formales de configuración y plantillas` | `En revisión por CCB` |
| **#13** | 03 | Tarea | Fase 1 – Infraestructura | Juan | `[03/18][Juan] J3 – Tablero de auditoría de cambios y simulación CCB` | `En revisión por CCB` |
| **#14** | 04 | Tarea | Fase 2 – Negocio | Andrés | `[04/18][Andrés] A1 – Paradas intermedias y cálculo de tramo` | `Propuesto` |
| **#15** | 05 | Tarea | Fase 2 – Negocio | Andrés | `[05/18][Andrés] A2 – Validación de cédula y descuentos ANT` | `Propuesto` |
| **#16** | 06 | Tarea | Fase 2 – Negocio | Andrés | `[06/18][Andrés] A3 – Hojas de ruta y días de parada` | `Propuesto` |
| **#17** | 07 | Tarea | Fase 3 – UI | Celeste | `[07/18][Celeste] C1 – Filtros avanzados en el buscador` | `Propuesto` |
| **#18** | 08 | Tarea | Fase 3 – UI | Celeste | `[08/18][Celeste] C2 – Panel de configuración global` | `Propuesto` |
| **#19** | 09 | Tarea | Fase 3 – UI | Celeste | `[09/18][Celeste] C3 – Selector interactivo de asientos` | `Propuesto` |
| **#30** | 10 | Tarea | Fase 4 – Pagos | Anahí | `[10/18][Anahí] N1 – Comprobantes en proceso de pago` | `Propuesto` |
| **#31** | 11 | Tarea | Fase 4 – Pagos | Anahí | `[11/18][Anahí] N2 – Panel del oficinista` | `Propuesto` |
| **#32** | 12 | Tarea | Fase 4 – Pagos | Anahí | `[12/18][Anahí] N3 – Notificaciones en la aplicación y por correo` | `Propuesto` |
| **#33** | 13 | Tarea | Fase 5 – QR | Mateo | `[13/18][Mateo] M1 – QR firmado HMAC` | `Propuesto` |
| **#34** | 14 | Tarea | Fase 5 – QR | Mateo | `[14/18][Mateo] M2 – Escáner del chofer` | `Propuesto` |
| **#35** | 15 | Tarea | Fase 5 – QR | Mateo | `[15/18][Mateo] M3 – Historial y descarga PDF` | `Propuesto` |
| **#36** | 16 | Tarea | Fase 6 – Cierre | Jeremy | `[16/18][Jeremy] D1 – Informe técnico UTA` | `Propuesto` |
| **#37** | 17 | Tarea | Fase 6 – Cierre | Jeremy | `[17/18][Jeremy] D2 – Evidencias Gitflow` | `Propuesto` |
| **#38** | 18 | Tarea | Fase 6 – Cierre | Jeremy | `[18/18][Jeremy] D3 – Diapositivas y defensa` | `Propuesto` |
| **#39** | 19 | Tarea | Fase 1 – Infraestructura | Juan | `[CI] Integración continua: validación de código, tipado y compilación en cada PR` | `Propuesto` |
| **#40** | 20 | Tarea | Fase 1 – Infraestructura | Juan | `[GITFLOW] Verificar reglas de protección de main y develop` | `Propuesto` |
| **#41** | 21 | Tarea | Fase 6 – Cierre | Juan | `[QA] Pruebas de integración final y demostración en develop` | `Propuesto` |
| **#20–#25** | — | Epic | Fases 1 a 6 | Todos | Épicas de las 6 fases del proyecto | `Propuesto` |
| **#26** | — | RFC | Fase 1 – Infraestructura | Juan | `[RFC-001] Migrar de mockData a Supabase real` | `Implementado` |
| **#27** | — | RFC | Fase 2 – Negocio | Andrés | `[RFC-002] Tarifa proporcional por tramos en paradas intermedias` | `Aprobado` |
| **#28** | — | RFC | Fase 5 – QR | Mateo | `[RFC-003] Firma HMAC-SHA256 del QR del boleto` | `Aprobado` |
| **#29** | — | RFC | Fase 4 – Pagos | Anahí | `[RFC-004] Contenedor único de comprobantes y máquina de estados del pago` | `Aprobado` |