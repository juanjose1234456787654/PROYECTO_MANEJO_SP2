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

> **Nota:** Los guiones (`—`) se completan al congelar el tablero final en la pestaña *Insights / Contributors* de GitHub.

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

---

## 6. Guía de Exportación del Gráfico de Red de Ramas

Para exportar la topología visual del gráfico de red de Gitflow desde GitHub:

1. Navegar al repositorio del proyecto en el navegador web: `https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2`.
2. En la barra superior de navegación del repositorio, seleccionar la pestaña **Insights**.
3. En el menú lateral izquierdo, hacer clic en la sección **Network** (`/network`).
4. Esperar a que la representación gráfica de commits y ramas se renderice completamente.
5. Ajustar el zoom del navegador de forma que se visualicen claramente las ramificaciones `feature/*` convergiendo hacia `develop`.
6. Realizar la captura de pantalla y guardar el archivo en la ruta `docs/evidencias/` respetando la convención `YYYY-MM-DD_red-de-ramas-gitflow.png`.

---

## 7. Tabla de Auditoría de Commits Reales (Historial de `develop`)

Trazabilidad de commits extraída del historial real del repositorio aplicando el estándar Conventional Commits:

| Fecha | Integrante | Commit Hash | Tipo | Alcance | Descripción |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `2026-11-01` | Juan Carvajal | `2ebf186` | `fix` | `supabase` | ajustar exports de tipos en src/lib/types/index.ts |
| `2026-11-01` | Juan Carvajal | `bb945af` | `chore` | `supabase` | eliminar mockData.ts tras migrar a consultas reales de Supabase |
| `2026-11-01` | Juan Carvajal | `6482a17` | `refactor` | `supabase` | migrar imports de tipos desde mockData hacia src/lib/types |
| `2026-11-01` | Juan Carvajal | `4e0dcda` | `feat` | `supabase` | reescribir dataService con consultas reales a Supabase y Result\<T\> |
| `2026-11-01` | Juan Carvajal | `00b0b8a` | `feat` | `supabase` | publicar tipos compartidos y Result\<T\> en src/lib/types/index.ts |
| `2026-11-01` | Juan Carvajal | `8f6495b` | `chore` | `supabase` | documentar variables de entorno en .env.example y unificar cliente |
| `2026-11-01` | Juan Carvajal | `7489dd7` | `merge` | `PR #10` | Merge pull request #10 from feature/configuracion-issues |
| `2026-10-29` | Juan Carvajal | `7b3035b` | `chore` | `config` | agregar plantillas tarea_actividad y rfc_change para segundo parcial |
| `2026-10-27` | Juan Carvajal | `c510314` | `merge` | `PR #9` | Merge pull request #9 from feature/sistema-integral-ecurutas |
| `2026-10-27` | Juan Carvajal | `8c39583` | `fix` | `auth` | resuelve constraint NOT NULL en password de Usuario y optimiza flujo de registro/login |
| `2026-10-25` | Juan Carvajal | `1ad93f2` | `feat` | `modules-ci` | activa los 12 modulos de dominio, pipeline CI y documentacion ITIL RFC-001 |
| `2026-10-25` | Juan Carvajal | `48082f6` | `feat` | `reportes-rutas` | agrega panel analitico de reportes, navegacion directa por roles y subrutas completas |
| `2026-10-25` | Juan Carvajal | `8250330` | `feat` | `oficina-chofer` | taquilla de ventanilla con descuentos legales y escaneo QR en tiempo real para chofer |
| `2026-10-25` | Juan Carvajal | `7bee4a2` | `feat` | `cooperativa-admin` | paneles de administracion de flota, frecuencias ANT, rutas y gestion de usuarios por roles |
| `2026-10-25` | Juan Carvajal | `09f47a5` | `feat` | `pasajero` | implementa catalogo interactivo de busqueda, mapa visual de asientos y casillero de boletos con QR |
| `2026-10-25` | Juan Carvajal | `de3cce4` | `feat` | `setup` | inicializa aplicacion Next.js 15, autenticacion Supabase SSR y middleware por roles |
| `2026-10-21` | Andrés Toasa | `a875233` | `merge` | `PR #8` | Merge pull request #8 from feature/database-schema |
| `2026-10-21` | Andrés Toasa | `2734173` | `docs` | `db` | agrega documentacion tecnica de la arquitectura de base de datos |
| `2026-10-21` | Andrés Toasa | `d8c8d4e` | `feat` | `db` | agrega script DDL inicial de Supabase |
| `2026-10-13` | Juan Carvajal | `e7ab0ca` | `merge` | `PR #6` | Merge pull request #6 from feature/estructura-carpetas |
| `2026-10-13` | Juan Carvajal | `9e4feba` | `docs` | `merge` | resuelve conflicto en README.md integrando cambios de develop |
| `2026-10-13` | Juan Carvajal | `f0e79ce` | `docs` | `repo` | actualiza PULL_REQUEST_BODY con documentacion ITIL y equipo completo |
| `2026-10-13` | Juan Carvajal | `8340d9c` | `docs` | `repo` | integra documentacion ITIL, matriz de integrantes y portal de reportes |
| `2026-10-13` | Juan Carvajal | `fc436db` | `feat` | `github` | implementa plantillas para issues y prs y actualiza politicas de seguridad con supabase |
| `2026-10-12` | Mateo Morales | `68520ac` | `merge` | `PR #5` | Merge pull request #5 from feature/documentacion-flujos |
| `2026-10-12` | Mateo Morales | `8114cae` | `docs` | `flujos` | agrega explicacion paso a paso de los flujos de compra y abordaje |
| `2026-10-12` | Anahí Morales | `ad47af1` | `merge` | `PR #3` | Merge pull request #3 from feature/documentacion-arquitectura |
| `2026-10-12` | Anahí Morales | `2514703` | `docs` | `arquitectura` | agrega explicacion de la estructura y modelo de base de datos |
| `2026-10-12` | Andrés Toasa | `03a8745` | `merge` | `PR #2` | Merge pull request #2 from feature/documentacion-readme |
| `2026-10-12` | Andrés Toasa | `efc3e59` | `docs` | `readme` | agrega estructura y documentacion inicial del README.md |
| `2026-10-12` | Juan Carvajal | `0d44d00` | `merge` | `PR #1` | Merge pull request #1 from feature/estructura-carpetas |