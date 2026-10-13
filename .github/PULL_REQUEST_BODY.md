## [feat]: Agregar plantillas profesionales para issues y pull requests y robustecer seguridad con Supabase

### 📌 Resumen Ejecutivo

Se implementan plantillas estandarizadas y profesionales para issues y pull requests, además de una política de seguridad integral (`SECURITY.md`) adaptada a la infraestructura del proyecto con **Supabase** (PostgreSQL y Row Level Security) para el repositorio `PROYECTO_MANEJO_SP2`. Estas plantillas guían a los colaboradores a proporcionar información estructurada, consistente y de alta calidad técnica que optimiza la revisión de código, el seguimiento de tareas del sprint y la gobernanza del proyecto.

**Resultado esperado:** Mayor trazabilidad, reducción de ambigüedades en requerimientos técnicos, mitigación de riesgos de seguridad y procesos de revisión (Code Review) ordenados y eficientes.

---

### 🎯 Objetivo del cambio

- ✅ Estandarizar la estructura y contenido técnico de issues en el repositorio
- ✅ Implementar plantillas para diferentes tipos de issues (bugs, features, refactors, preguntas y tareas profesionales)
- ✅ Crear una plantilla profesional y completa para pull requests (`.github/pull_request_template.md`)
- ✅ Definir y robustecer la política de seguridad (`SECURITY.md`) adaptada a Supabase (PostgreSQL, RLS, anon vs service_role keys)
- ✅ Corregir inconsistencias y enlaces en archivos de gobernanza (`config.yml`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`)
- ✅ Facilitar la automatización futura y el cumplimiento de las buenas prácticas de gestión de repositorios

---

### 🧩 Contexto / Problema detectado

**Problema identificado:**
- Sin plantillas, los issues y PRs carecían de estructura, contexto y consistencia técnica.
- Ausencia de checklists por capas (código, calidad, seguridad, base de datos).
- La política de seguridad no reflejaba las directrices específicas de base de datos en la nube (Supabase / RLS).
- Presencia de placeholders genéricos no configurados (`@TU_USUARIO_GITHUB`).

**Solicitud:** Proyecto académico de segundo parcial - Requisito de buenas prácticas en gestión de repositorios de software.

---

### 🔧 Tipo de cambio

- [x] ✨ feat (Nueva funcionalidad de infraestructura y gobernanza)
- [ ] 🐞 bug
- [ ] ♻️ refactor
- [x] 🔒 sec (Mejora y endurecimiento de políticas de seguridad)
- [x] 📝 docs (Estandarización de documentación del repositorio)

---

### 🛠 Cambios realizados

1. **Plantilla para Issue Profesional** (`.github/ISSUE_TEMPLATE/issue-profesional.md`)
   - Estructura completa con convención de títulos por rol
   - Secciones: resumen ejecutivo, objetivo, contexto, criterios de aceptación
   - Incluye dependencias, APIs, testing y checklist para desarrolladores

2. **Plantilla para Reporte de Error** (`.github/ISSUE_TEMPLATE/bug-report.md`)
   - Pasos para reproducir
   - Comportamiento actual vs esperado
   - Información del entorno
   - Adjuntos para evidencia visual

3. **Plantilla para Solicitud de Característica** (`.github/ISSUE_TEMPLATE/feature-request.md`)
   - Descripción del problema que resuelve
   - Solución propuesta y alternativas
   - Mockups y ejemplos
   - Impacto esperado

4. **Plantilla para Refactor/Deuda Técnica** (`.github/ISSUE_TEMPLATE/refactor-request.md`)
   - Ubicación del código
   - Problemas actuales y mejoras esperadas
   - Estrategia de validación
   - Impacto en usuarios

5. **Plantilla para Preguntas** (`.github/ISSUE_TEMPLATE/question.md`)
   - Formulación clara de la pregunta
   - Contexto de investigación previa
   - Links y documentación relacionada

6. **Plantilla Profesional para Pull Requests** (`.github/pull_request_template.md`)
   - Convención de títulos: `[tipo]: descripción`
   - Resumen ejecutivo del cambio
   - Detalles técnicos completos
   - Checklists para código, calidad, seguridad y base de datos
   - Consideraciones de despliegue y rollback
   - Notas para reviewers

7. **Archivo de Configuración** (`.github/ISSUE_TEMPLATE/config.yml`)
   - Desactiva issues en blanco (`blank_issues_enabled: false`)
   - Añade links útiles a la política de seguridad y discusiones del proyecto

8. **Archivo de Referencia** (`.github/PULL_REQUEST_BODY.md`)
   - Documentación completa del formato de PRs para referencia del equipo

9. **Robustecimiento de Política de Seguridad** (`SECURITY.md`)
   - Procedimiento de reporte confidencial con tiempos de respuesta SLA (24h, 48h, 7d, 14d)
   - Prácticas de seguridad con **Supabase** (PostgreSQL, Row Level Security, API Keys anon vs service_role)
   - Checklist de seguridad pre-producción y códigos de error seguros

10. **Alineación de Gobernanza** (`CODE_OF_CONDUCT.md` & `CONTRIBUTING.md`)
    - Corrección de usuario líder a `@juanjose1234456787654`
    - Formateo adecuado de bloques bash y etiquetas de issues

---

### 📂 Áreas / Componentes afectados

- [x] Documentación
- [x] Infraestructura de repositorio (`.github`)
- [x] Procesos de desarrollo
- [x] Seguridad del proyecto

---

### ⚠ Impacto del cambio

#### Impacto funcional
- Los colaboradores verán un selector de plantillas al crear issues/PRs
- Mejor experiencia de contribución con guías claras
- Reducción de issues incompletos o mal documentados

#### Impacto técnico
- Se establece estructura estándar para metadata de issues/PRs
- Facilita automatización futura (bots, scripts de análisis)
- Mejora en la organización de información técnica y control de esquemas Supabase

#### Impacto en rendimiento
No aplica

#### Impacto en seguridad
Positivo - Canales formales de reporte, checklists de seguridad (validación de inputs, no exposición de secrets / service_role key) y políticas RLS documentadas.

---

### 🚨 Riesgos identificados

- [x] Sin riesgos relevantes
- [ ] Puede afectar otras funcionalidades

**Justificación:** Solo se agregan archivos de configuración y documentación, sin cambios al código productivo.

---

### 🧪 Validación / Testing

#### Tipos de prueba ejecutados

- [x] Manuales - Se crearon y testearon localmente todas las plantillas y archivos Markdown
- [x] Validación sintáctica - Verificación de formato YAML frontmatter y renderizado en GitHub

#### Resultado obtenido

✅ Todas las plantillas se renderizan correctamente con formato estándar de GitHub  
✅ Los selectores muestran todas las opciones disponibles  
✅ El archivo `config.yml` desactiva correctamente los issues en blanco  
✅ Los enlaces apuntan a las rutas válidas del repositorio  

---

### 🧪 Cómo probar localmente

1. Cambiar a la rama de trabajo:
   ```bash
   git checkout feature/estructura-carpetas
   ```
2. Verificar que los archivos existan en `.github/ISSUE_TEMPLATE/` y `.github/pull_request_template.md`
3. En GitHub.com, ir a "New Issue" - debería mostrar selector de plantillas
4. En GitHub.com, ir a crear un PR - debería precargarse con la plantilla

---

### 📸 Evidencia visual

**Estructura de archivos creada:**
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
```

---

### 📋 Issues relacionados

- No hay issues específicos vinculados
- Requisito del proyecto académico "Segundo Parcial"

---

### 🚀 Consideraciones para despliegue

- [x] No requiere acciones adicionales
- [ ] Requiere migración BD
- [ ] Requiere variables de entorno
- [ ] Requiere reinicio de servicios

**Detalles:** Los cambios son inmediatos en GitHub. No requieren ninguna acción adicional.

---

### 🔙 Plan de rollback

- [x] Revert simple

**Procedimiento:** Un simple revert del commit eliminaría todas las plantillas. Los issues y PRs existentes no se verían afectados.

---

### 👀 Checklist del autor

#### Código
- [x] Sigue estándares del proyecto
- [x] Código limpio y mantenible (Markdown bien formateado)
- [x] Sin código muerto
- [x] Sin conflictos de merge

#### Calidad
- [x] Probado localmente
- [x] Revisado manualmente
- [x] Sin errores visibles
- [x] Plantillas completas y coherentes

#### Documentación
- [x] Plantillas incluyen guías claras
- [x] Archivo `PULL_REQUEST_BODY.md` como referencia
- [x] Política de seguridad adaptada a Supabase

---

### 🧠 Notas para reviewers

#### Revisar especialmente:
- Las convenciones de títulos en cada plantilla (`[bug]`, `[feat]`, `[refactor]`, `[sec]`)
- Si las secciones del PR template son completas y aplicables al flujo con Supabase
- Si los emojis y formato son consistentes con la identidad del proyecto

#### Preguntas abiertas:
- ¿Se requerirán políticas RLS adicionales en Supabase para perfiles específicos en próximos sprints?

---

### ✅ Resultado esperado tras merge

Inmediatamente después de hacer merge a `develop` o `main`:

1. ✅ GitHub mostrará selector de plantillas al hacer "New Issue"
2. ✅ La plantilla de PR aparecerá precargada en nuevos PRs
3. ✅ Los issues vacíos serán bloqueados por la configuración
4. ✅ El equipo tendrá acceso a guías estructuradas y política de seguridad actualizada

---

### 🏁 Estado sugerido

- [x] **Ready for Review** - Listo para que team members revisen
- [ ] Draft PR
- [ ] Requires Changes

---

**Autor:** Juan Carvajal (@juanjose1234456787654)  
**Fecha de creación:** 2026-10-13  
**Branch:** `feature/estructura-carpetas`
