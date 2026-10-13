## [feat]: Implementar plantillas profesionales de issues y PR, politicas de seguridad con Supabase y documentacion ITIL

### 📌 Resumen Ejecutivo

Se implementa la infraestructura completa de gobernanza, control de calidad y gestión de configuración para el repositorio `PROYECTO_MANEJO_SP2` (Cooperativa Ambato Express). Esto incluye plantillas técnicas estandarizadas para issues y pull requests, una política de seguridad integral (`SECURITY.md`) adaptada a **Supabase** (PostgreSQL y Row Level Security), documentación completa de gestión de configuración alineada a estándares **ITIL** (`docs/`), y la definición formal de los roles y módulos de los 6 integrantes del equipo de desarrollo.

**Resultado esperado:** Máxima trazabilidad, reducción de ambigüedades en requerimientos técnicos, procesos de Code Review profesionales y cumplimiento riguroso de las buenas prácticas de gestión de repositorios académicos.

---

### 🎯 Objetivo del cambio

- ✅ Estandarizar la estructura y metadatos de issues mediante plantillas especializadas (bugs, features, refactors, consultas y tareas técnicas).
- ✅ Implementar la plantilla profesional definitiva para pull requests (`.github/pull_request_template.md`).
- ✅ Establecer la política de seguridad del software (`SECURITY.md`) adaptada a Supabase (PostgreSQL, RLS, manejo seguro de llaves anon vs service_role y SLA de respuesta).
- ✅ Crear la documentación del sistema en `docs/` bajo estándares ITIL: plan de gestión de configuración (`configuracion.md`), visión general (`index.md`) y portal de auditorías (`reportes.md`).
- ✅ Definir la matriz de responsabilidades (CMDB) de los 6 integrantes del equipo de desarrollo.
- ✅ Implementar el formulario interactivo para reporte de incidencias de usuarios (`public/reportar.html`).
- ✅ Actualizar `README.md`, `CODE_OF_CONDUCT.md` y `CONTRIBUTING.md` eliminando cualquier placeholder genérico.

---

### 🧩 Contexto / Problema detectado

**Problema identificado:**
- Sin plantillas, los issues y PRs carecían de estructura técnica, contexto y listas de verificación.
- Ausencia de un plan formal de gestión de configuración alineado a estándares ITIL (SACM, CMDB, Change Management).
- La política de seguridad no reflejaba la arquitectura real basada en Supabase.
- Faltaba documentar formalmente a los 6 miembros del equipo y sus respectivos módulos asignados.

**Solicitud:** Proyecto académico de segundo parcial (Manejo de Software - SP2) - Requisito de excelencia en buenas prácticas de gestión de repositorios.

---

### 🔧 Tipo de cambio

- [x] ✨ feat (Nueva funcionalidad de infraestructura y gobernanza)
- [ ] 🐞 bug
- [ ] ♻️ refactor
- [x] 🔒 sec (Endurecimiento de políticas de seguridad con Supabase)
- [x] 📝 docs (Documentación técnica y plan ITIL)

---

### 🛠 Cambios realizados

1. **Plantillas Especializadas para Issues (`.github/ISSUE_TEMPLATE/`):**
   - `config.yml`: Desactiva issues en blanco y enlaza a la política de seguridad y discusiones.
   - `issue-profesional.md`: Tareas técnicas completas con dependencias, APIs y checklist.
   - `bug-report.md`: Reporte de fallos con pasos reproducibles, entorno y logs.
   - `feature-request.md`: Solicitudes de funcionalidad con valor de negocio y mockups.
   - `refactor-request.md`: Deuda técnica y reestructuraciones de código sin regresión.
   - `question.md`: Consultas técnicas de arquitectura con investigación previa.

2. **Plantilla Definitiva de Pull Requests (`.github/pull_request_template.md`):**
   - Convención obligatoria de títulos (`[feat]`, `[bug]`, `[refactor]`, `[sec]`).
   - Secciones de resumen ejecutivo, impacto por capas, riesgos, testing, despliegue, rollback y checklist exhaustivo del autor.

3. **Política de Seguridad Profesional (`SECURITY.md`):**
   - Procedimiento de reporte confidencial con SLA de respuesta (24h, 48h, 7d, 14d).
   - Lineamientos por capas basados en **Supabase**: PostgreSQL, Row Level Security (RLS), control de llaves `anon` y `service_role`.
   - Checklist pre-producción y directiva de códigos de error seguros.

4. **Documentación del Proyecto alineada a ITIL (`docs/`):**
   - `docs/index.md`: Portal de documentación del sistema, visión general de módulos y stack con Supabase.
   - `docs/configuracion.md`: Plan de Gestión de Configuración ITIL (SACM, Change Management, Git Flow, CMDB).
   - `docs/reportes.md`: Métricas automáticas, actividad por desarrollador y auditorías de configuración.

5. **Formulario Público de Incidencias (`public/reportar.html`):**
   - Interfaz web interactiva para registrar incidencias de usuarios que canaliza reportes hacia GitHub Issues.

6. **Estructura y Gobernanza del Repositorio:**
   - Reemplazo de `prisma/` por `supabase/` (`supabase/.gitkeep`).
   - Actualización de `README.md` con la presentación de la cooperativa y enlaces a docs.
   - Corrección de usuario líder (`@juanjose1234456787654`) en `CODE_OF_CONDUCT.md`.
   - Corrección y formateo de guías en `CONTRIBUTING.md`.

---

### 👥 Asignación de Módulos del Equipo (CMDB)

| Miembro | Rol en Equipo | Módulo Asignado | GitHub |
|---------|---------------|-----------------|--------|
| **Juan Carvajal** | Líder / Configuration Manager | Backend, Login, Register, Supabase | [@juanjose1234456787654](https://github.com/juanjose1234456787654) |
| **Jeremy Guaman** | Desarrollador / Coord. Configuración | Oficinista (Ventanilla, pagos y boletos) | [@levi06516-ui](https://github.com/levi06516-ui) |
| **Anahí Morales** | Desarrolladora | Admin (Buses, rutas, turnos y usuarios) | [@AnahiM2025](https://github.com/AnahiM2025) |
| **Celeste Telenchana** | Desarrolladora | Chofer (Escaneo QR y control de ruta) | [@CelesteTelenchanaa](https://github.com/CelesteTelenchanaa) |
| **Andrés Toasa** | Desarrollador | Cliente (Búsqueda, asientos y compra) | [@The-Fabry](https://github.com/The-Fabry) |
| **Mateo Morales** | Desarrollador | Reportes y Auditoría ITIL | [@SebastianM-M](https://github.com/SebastianM-M) |

---

### 📂 Áreas / Componentes afectados

- [x] Documentación (`docs/`, `README.md`)
- [x] Infraestructura de repositorio (`.github/`)
- [x] Procesos de desarrollo y gobernanza ITIL
- [x] Seguridad del proyecto (`SECURITY.md`)
- [x] Estructura base de base de datos (`supabase/`)

---

### ⚠ Impacto del cambio

#### Impacto funcional
- Selector interactivo de plantillas al abrir issues en GitHub.
- Formulario de PRs precargado con directrices de calidad.
- Portal público de reporte de incidencias para usuarios en `/reportar.html`.

#### Impacto técnico
- Estandarización de títulos y metadatos que permite automatización CI/CD.
- Base de datos de configuración (CMDB) formalizada en `docs/configuracion.md`.
- Reglas de base de datos y autenticación alineadas a Supabase y RLS.

#### Impacto en rendimiento
No aplica sobrecarga en runtime; agiliza significativamente el tiempo de revisión y desarrollo del equipo.

#### Impacto en seguridad
Alto impacto positivo: canales de reporte confidenciales, pautas estrictas para variables de entorno (`.env.local`) y políticas RLS obligatorias para Supabase.

---

### 🚨 Riesgos identificados

- [x] Sin riesgos relevantes
- [ ] Puede afectar otras funcionalidades

**Justificación:** Cambios centrados en documentación, plantillas y archivos estáticos de configuración.

---

### 🔄 Compatibilidad

- [x] No rompe compatibilidad
- [ ] Breaking Change

---

### 🧪 Validación / Testing

#### Tipos de prueba ejecutados

- [x] Manuales - Validación sintáctica de Markdown y frontmatter YAML
- [x] Enlaces y navegación - Comprobación de links relativos entre documentos y URLs del repo
- [x] Formulario HTML - Validación del script en `public/reportar.html`

#### Resultado obtenido

✅ Todas las plantillas de issues y PRs renderizan sin errores en GitHub.  
✅ El archivo `config.yml` desactiva issues en blanco y enlaza a la política de seguridad.  
✅ Los documentos en `docs/` cuentan con formato homogéneo, tablas claras y enlaces funcionales.

---

### 🧪 Cómo probar localmente

1. Cambiar a la rama de trabajo:
   ```bash
   git checkout feature/estructura-carpetas
   ```
2. Inspeccionar la estructura de plantillas y documentación:
   ```bash
   ls .github/ISSUE_TEMPLATE/
   ls docs/
   ```
3. Abrir `public/reportar.html` en el navegador y verificar la redirección a GitHub Issues.

---

### 📸 Evidencia visual

**Estructura de archivos configurada:**
```
.github/
├── ISSUE_TEMPLATE/
│   ├── config.yml
│   ├── issue-profesional.md
│   ├── bug-report.md
│   ├── feature-request.md
│   ├── refactor-request.md
│   └── question.md
├── pull_request_template.md
└── PULL_REQUEST_BODY.md
docs/
├── configuracion.md
├── index.md
└── reportes.md
public/
└── reportar.html
supabase/
└── .gitkeep
SECURITY.md
CODE_OF_CONDUCT.md
CONTRIBUTING.md
README.md
```

---

### 📋 Issues relacionados

- Requisito del proyecto académico "Segundo Parcial" (Manejo de Software).
- Establece la línea base de gobernanza y control de calidad.

---

### 🚀 Consideraciones para despliegue

- [x] No requiere acciones adicionales
- [ ] Requiere migración BD
- [ ] Requiere variables de entorno
- [ ] Requiere reinicio de servicios

---

### 🔙 Plan de rollback

- [x] Revert simple de Git (`git revert <commit_hash>`)

---

### 👀 Checklist del autor

#### Código y Formato
- [x] Sigue estándares del proyecto
- [x] Markdown limpio y con tablas bien formateadas
- [x] Sin código muerto ni credenciales expuestas

#### Calidad y Contenido
- [x] Probado y validado localmente
- [x] Nombres, roles y usuarios de GitHub de los 6 integrantes verificados
- [x] Supabase configurado como base de datos del proyecto

#### Documentación
- [x] Plan ITIL completo en `docs/configuracion.md`
- [x] `SECURITY.md` robustecido con directrices RLS
- [x] `README.md` actualizado con enlaces a documentación

---

### 🧠 Notas para reviewers

- Verificar que los módulos asignados a cada integrante en `docs/configuracion.md` y `docs/index.md` correspondan con la distribución acordada del sprint.
- Revisar que la convención de títulos (`[feat]`, `[bug]`, `[refactor]`, `[sec]`) sea adoptada por todo el equipo.

---

### ✅ Resultado esperado tras merge

1. ✅ Selector de plantillas activo para nuevos issues en GitHub.
2. ✅ Plantilla precargada obligatoria para nuevos Pull Requests hacia `develop`.
3. ✅ Línea base de configuración y gobernanza ITIL disponible en `docs/`.
4. ✅ Rama `develop` preparada para iniciar el desarrollo de los módulos funcionales.

---

### 🏁 Estado sugerido

- [x] **Ready for Review** - Listo para revisión y aprobación del líder
- [ ] Draft PR
- [ ] Requires Changes

---

**Autor:** Juan Carvajal (@juanjose1234456787654)  
**Fecha de creación:** 2026-10-13  
**Branch:** `feature/estructura-carpetas`
