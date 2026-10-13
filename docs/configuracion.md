# Gestión de Configuración - PROYECTO_MANEJO_SP2 (Cooperativa Ambato Express)

## Propósito y Alcance

Este documento define el proceso de gestión de configuración del software para el proyecto **PROYECTO_MANEJO_SP2 (Cooperativa Ambato Express)**, alineado con las mejores prácticas de **ITIL (Information Technology Infrastructure Library)**. Su alcance incluye el control de versiones de todos los componentes del sistema (código fuente, documentación, scripts de base de datos Supabase, configuraciones), la gestión de solicitudes de cambio (SCR) y la definición de la política de lanzamiento. Se aplica a todo el equipo de desarrollo durante todo el ciclo de vida del proyecto.

## Objetivos (ITIL - SACM)

- Determinar la versión actual de cada componente del software en todo momento (CMDB).
- Establecer el proceso formal para gestionar solicitudes de cambio (ITIL - Gestión de Cambios).
- Definir la política de versionado y lanzamiento (ITIL - Gestión de Versiones).
- Asegurar la trazabilidad entre requisitos, cambios y versiones (ITIL - Gestión de Activos).
- Proveer mecanismos de auditoría para verificar la integridad de la configuración (ITIL - Auditoría de Configuración).
- Mantener una base de datos de gestión de configuración (CMDB) actualizada.

## Equipo de Desarrollo y Módulos

| Miembro | Rol en Equipo | Módulo Responsable | GitHub | Responsabilidades Específicas |
|---------|---------------|-------------------|--------|------------------------------|
| **Juan Carvajal** | Líder del Equipo / Configuration Manager | Backend, Login, Register, Supabase | [@juanjose1234456787654](https://github.com/juanjose1234456787654) | Gestión de configuración, creación de Issues, revisión y aprobación de PRs, arquitectura backend y esquema en Supabase |
| **Jeremy Guaman** | Desarrollador / Coordinador de Configuración | Oficinista | [@levi06516-ui](https://github.com/levi06516-ui) | Módulo de oficinista, gestión de pagos, venta de boletos, soporte en revisión de PRs |
| **Anahí Morales** | Desarrolladora | Admin | [@AnahiM2025](https://github.com/AnahiM2025) | Módulo de administración, gestión de usuarios, buses, rutas y configuraciones generales del sistema |
| **Celeste Telenchana** | Desarrolladora | Chofer | [@CelesteTelenchanaa](https://github.com/CelesteTelenchanaa) | Módulo de chofer, escaneo QR de pasajes, validación de pasajeros y rutas asignadas |
| **Andrés Toasa** | Desarrollador | Cliente | [@The-Fabry](https://github.com/The-Fabry) | Módulo de cliente, búsqueda de rutas, selección interactiva de asientos y compra en línea |
| **Mateo Morales** | Desarrollador | Reportes y Auditoría ITIL | [@SebastianM-M](https://github.com/SebastianM-M) | Automatización de reportes, métricas ITIL, validación de calidad y soporte UI |

## Roles y Responsabilidades (ITIL - SACM)

### Gestor de Configuración (Configuration Manager)
**Asignado a:** Juan Carvajal (Líder del Equipo)

**Responsabilidades:**
- Lidera la planificación, identificación, control, seguimiento y auditoría de todos los elementos de configuración.
- Desarrolla y mantiene el plan de gestión de configuración.
- Promueve el uso efectivo de la base de datos de configuración (CMDB).
- Monitorea y reporta cambios no autorizados sobre elementos de configuración.
- Asegura la consistencia e integridad de los datos de configuración.
- Lidera actividades de evaluación del proceso y aprueba cambios estructurales.
- Crea Issues en GitHub para asignar tareas a los miembros del equipo.
- Realiza revisión y aprobación mandatoria de Pull Requests (PRs) de los compañeros hacia `develop`.

### Coordinador de Configuración (Configuration Coordinator)
**Asignado a:** Jeremy Guaman (Apoyo y coordinación técnica)

**Responsabilidades:**
- Asegura que todos los elementos de configuración estén registrados adecuadamente en GitHub Issues y Projects.
- Verifica la consistencia e integridad de datos y estructura modular del sistema.
- Reporta discrepancias o no conformidades al Gestor de Configuración.
- Participa activamente en la mejora continua del proceso de gestión de configuración.
- Apoya en la revisión de PRs cuando el líder lo designe.

### Responsables de Elementos de Configuración (Configuration Item Owners)
**Asignado a:** Cada desarrollador según su módulo asignado

**Responsabilidades:**
- Aseguran que los elementos de configuración de su módulo estén registrados con estado y datos apropiados.
- Verifican que los cambios en sus componentes sigan rigurosamente el flujo Git Flow y las plantillas oficiales.
- Aseguran la idoneidad, calidad y pruebas de los elementos bajo su responsabilidad.
- Trabajan con el Gestor de Configuración para resolver incidencias y discrepancias.
- Implementan cambios aprobados en su módulo específico sin generar efectos secundarios en otros componentes.

### Gestor de Cambios (Change Manager)
**Asignado a:** Juan Carvajal (Líder del Equipo)

**Responsabilidades:**
- Evalúa el impacto, riesgo y prioridad de las solicitudes de cambio (SCR).
- Asegura que los responsables actualicen los históricos de configuración y notas de versión.
- Aprueba o rechaza solicitudes de cambio formalmente en GitHub Issues.
- Coordina la integración y despliegue de cambios aprobados hacia la línea base (`develop` / `main`).

## Herramientas

- **Control de versiones:** Git + GitHub ([https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2))
- **Base de Datos y Backend:** Supabase (PostgreSQL, Row Level Security - RLS, Supabase Auth y Storage)
- **Gestión de cambios y proyectos:** GitHub Issues con plantillas especializadas + GitHub Projects (ITIL - Change Management)
- **Construcción y despliegue:** GitHub Actions (CI/CD)
- **Documentación:** Markdown + MkDocs en `docs/`
- **Base de datos de configuración (CMDB):** GitHub Issues etiquetados + matriz en la documentación del proyecto
- **Reportes de usuarios:** Formulario en `/reportar.html` que canaliza incidencias hacia GitHub Issues

## Política de Versionado (ITIL - Release Management)

Se aplica Versionado Semántico (SemVer) con formato `vMAYOR.MENOR.PARCHE`:

- **MAYOR (`vX.0.0`):** Cambios incompatibles con versiones anteriores (cambios arquitectónicos mayores, reestructuración global).
- **MENOR (`v0.X.0`):** Funcionalidad nueva compatible hacia atrás (incorporación de nuevos módulos o features).
- **PARCHE (`v0.0.X`):** Correcciones de errores y hotfixes compatibles con la versión actual (bug fixes).

Cada release formal se etiquetará en GitHub con el tag correspondiente.

## Estrategia de Ramas (Git Flow)

### Ramas Principales
- **main:** Versión estable, depurada y lista para producción.
- **develop:** Rama de integración continua de cambios para la próxima entrega.

### Ramas de Soporte
- **feature/nombre:** Nuevas funcionalidades (ej: `feature/modulo-oficinista`, `feature/seleccion-asientos`).
- **release/vX.Y.Z:** Preparación de entregas, pruebas finales y ajustes de documentación.
- **hotfix/vX.Y.Z:** Correcciones críticas inmediatas derivadas de `main`.
- **docs/nombre:** Actualización y mantenimiento exclusivo de documentación.

### Flujo de Trabajo
1. Las ramas **feature** se crean a partir de **develop** (`git checkout -b feature/tu-modulo develop`).
2. El líder del equipo (**Juan Carvajal**) crea los Issues, define requerimientos y asigna responsables.
3. Los desarrolladores implementan sus cambios, realizan commits en presente (`feat(modulo): descripcion`) y abren Pull Requests hacia **develop**.
4. Cada Pull Request debe completar la plantilla obligatoria ([`.github/pull_request_template.md`](file:///c:/PROYECTO_MANEJO_SP2/PROYECTO_MANEJO_SP2/.github/pull_request_template.md)).
5. El líder (**Juan Carvajal**) revisa el código, verifica pruebas y aprueba la integración.
6. Ningún colaborador realiza push directo a `develop` o `main`.

## Proceso de Gestión de Cambios (ITIL - Change Management)

### 1. Solicitud de Cambio (SCR)
- Se crea un Issue en GitHub seleccionando la plantilla correspondiente (`bug-report.md`, `feature-request.md`, `refactor-request.md` o `issue-profesional.md`).
- El Issue incluye: descripción, justificación técnica, impacto estimado, prioridad y módulo afectado.
- Los usuarios externos pueden reportar fallos a través de `/reportar.html`.

### 2. Evaluación de Impacto
- El Gestor de Cambios (**Juan Carvajal**) evalúa la viabilidad técnica, riesgo y dependencias con otros módulos o tablas de Supabase.
- Se analiza si se requieren nuevas políticas de Row Level Security (RLS) o migraciones en `supabase/`.

### 3. Aprobación/Rechazo
- Se aprueba o rechaza la solicitud asignando etiquetas y comentarios técnicos.
- Se asigna al responsable del módulo correspondiente.

### 4. Implementación
- El desarrollador crea la rama `feature/` desde `develop`.
- Desarrolla el cambio respetando convenciones de codificación y seguridad.
- Ejecuta pruebas locales y valida integración con Supabase.

### 5. Revisión y Verificación
- Se abre el Pull Request hacia `develop` vinculando el issue (`Closes #ID`).
- Revisión de código por parte de **Juan Carvajal** (y **Jeremy Guaman** como apoyo).
- Verificación de ausencia de credenciales expuestas y cumplimiento de checklists.

### 6. Fusión y Actualización de Línea Base
- Fusión (Merge) a `develop`.
- Cierre automático del Issue asociado.
- Actualización de notas de versión y documentación de configuración.

## Elementos de Configuración (CMDB)

### Por Módulo y Responsable

**Backend, Login/Register y Supabase (Juan Carvajal):**
- Endpoints de API (`src/app/api/`)
- Autenticación y control de sesiones (`src/lib/auth.ts`)
- Configuración de cliente Supabase y RLS (`src/lib/supabase.ts`)
- Scripts y migraciones de base de datos (`supabase/`)
- Páginas de login y registro (`src/app/login/`, `src/app/registro/`)

**Oficinista (Jeremy Guaman):**
- Dashboard de oficinista (`src/app/oficinista/`)
- Módulo de gestión y validación de transferencias/pagos
- Venta física y digital de boletos en boletería

**Administración (Anahí Morales):**
- Panel de administración (`src/app/admin/`)
- Gestión de usuarios, choferes y personal
- Catálogo de buses, rutas, frecuencias y tarifas
- Configuración general de la cooperativa

**Chofer (Celeste Telenchana):**
- Interfaz del chofer (`src/app/chofer/`)
- Escaneo y validación de códigos QR de pasajes (`src/app/chofer/escanear/`)
- Listado y confirmación de pasajeros a bordo
- Bitácora de ruta en tiempo real

**Cliente (Andrés Toasa):**
- Portal web del cliente (`src/app/cliente/`)
- Buscador y selector de rutas y horarios
- Mapa interactivo de selección de asientos
- Pasarela de compra y generación de boleto digital

**Reportes y Auditoría ITIL (Mateo Morales):**
- Documentación de métricas y auditorías (`docs/reportes.md`)
- Estadísticas del proyecto y reportes de calidad
- Soporte en componentes transversales de UI

### Elementos Generales
- Código fuente (`.ts`, `.tsx`, `.js`, `.css`)
- Scripts y esquemas SQL versionados (`supabase/`)
- Documentación del proyecto (`docs/`)
- Archivos de configuración (`.env.local.example`, `.gitignore`, `tsconfig.json`, `next.config.ts`)
- Plantillas de gobernanza y automatización (`.github/`)
- Formulario de reporte de incidencias (`public/reportar.html`)

## Auditorías (ITIL - Configuration Audit)

### Frecuencia
- Auditorías periódicas semanales de configuración durante los sprints.
- Auditorías mandatorias previas a cada entrega formal de versión.
- Auditorías extraordinarias ante incidentes o discrepancias en la línea base.

### Verificaciones
- Que todo cambio esté respaldado por un Issue formal y un PR revisado.
- Que las versiones y tags de Git coincidan con la documentación.
- Que no existan credenciales sensibles committeadas (`service_role key` o variables privadas).
- Que las políticas RLS en Supabase estén activas y verificadas.
- Que la documentación en `docs/` refleje el estado real de la arquitectura.

## Cumplimiento ITIL

Este proceso de gestión de configuración cumple con las siguientes áreas de ITIL:

- **SACM (Service Asset and Configuration Management):** Gestión completa de activos, dependencias y configuración.
- **Change Management:** Proceso formal y transparente de evaluación, aprobación y despliegue de cambios.
- **Release Management:** Política controlada de versiones SemVer y despliegues ordenados.
- **Configuration Audit:** Auditorías programadas para garantizar integridad y trazabilidad total.
- **CMDB:** Matriz de elementos de configuración viva y actualizada en el repositorio.
