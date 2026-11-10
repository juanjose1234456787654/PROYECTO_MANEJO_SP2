# Guía para Colaboradores - EcuRutas

Normas de desarrollo y contribución para el equipo del proyecto (**Manejo y Configuración de Software** – Universidad Técnica de Ambato, Carrera de Software).

---

## 1. Principios Fundamentales

1. **Nunca realizar `push` directo a las ramas `develop` ni `main`**.
2. **Toda contribución se realiza mediante una rama `feature/<modulo>-<tarea>`** creada desde `develop`.
3. **Todo Pull Request requiere obligatoriamente al menos 2 aprobaciones** antes de fusionarse.
4. **Respetar la modularidad y tipado estricto**: Trabaja dentro de tu módulo asignado, con TypeScript estricto (cero `any`) y sin usar `mockData`.
5. **No exponer credenciales**: Nunca uses la clave `service_role` ni `QR_SECRET` en el código cliente.

---

## 2. Estructura de Ramificación (Gitflow)

| Rama | Propósito | Regla |
|------|-----------|-------|
| `main` | Producción / Versión final evaluable | Solo recibe fusiones desde `develop` vía PR con 2 aprobaciones |
| `develop` | Integración continua | Rama base para crear y fusionar todas las ramas `feature/*` |
| `feature/*` | Nuevos requerimientos o módulos | Se crea desde `develop` y se integra hacia `develop` con PR |
| `hotfix/*` | Correcciones críticas de producción | Se crea desde `main` y se fusiona a `main` y `develop` |

---

## 3. Estándar de Commits (Conventional Commits)

Formato obligatorio: `<tipo>(<alcance>): <descripción corta>`

- `feat(modulo)`: Nueva funcionalidad
- `fix(modulo)`: Corrección de error
- `docs(alcance)`: Cambios en documentación o plantillas
- `style(modulo)`: Cambios de estilos o formato sin alterar lógica
- `refactor(modulo)`: Reestructuración de código sin cambiar comportamiento
- `test(modulo)`: Pruebas unitarias o de integración
- `chore(config)`: Tareas de mantenimiento o configuración
- `ci(workflows)`: Configuración de integración continua (GitHub Actions)

Ejemplos:
```bash
feat(pagos): subir comprobante a Supabase Storage con estado PENDIENTE_APROBACION
fix(middleware): corregir redireccionamiento por rol de usuario inactivo
docs(config): completar CITATION.cff y plantillas de issues
```

---

## 4. Cómo Abrir un Issue y Plantillas Oficiales

Las issues en blanco están deshabilitadas (`blank_issues_enabled: false` en [`.github/ISSUE_TEMPLATE/config.yml`](.github/ISSUE_TEMPLATE/config.yml)). Para registrar cualquier actividad, fallo o solicitud de cambio, ve a la pestaña **Issues → New issue** y selecciona una de las 4 plantillas oficiales:

| Plantilla | Archivo | Uso | Etiqueta automática |
|-----------|---------|-----|---------------------|
| **Tarea / Actividad (Segundo Parcial)** | [`.github/ISSUE_TEMPLATE/tarea_actividad.md`](.github/ISSUE_TEMPLATE/tarea_actividad.md) | Actividades planificadas del cronograma con orden, dependencias, criterios de aceptación y prompt IA | `tipo:tarea` |
| **RFC – Propuesta de Cambio (CCB)** | [`.github/ISSUE_TEMPLATE/rfc_change.md`](.github/ISSUE_TEMPLATE/rfc_change.md) | Solicitudes formales de cambio arquitectónico o de alcance evaluadas por el Comité de Control de Cambios (CCB) | `tipo:rfc`, `ccb:propuesto` |
| **Reporte de Error (Bug)** | [`.github/ISSUE_TEMPLATE/bug_report.md`](.github/ISSUE_TEMPLATE/bug_report.md) | Fallos reproducibles indicando módulo afectado, rol, pasos para reproducir y evidencia | `tipo:bug` |
| **Nueva Funcionalidad (Feature)** | [`.github/ISSUE_TEMPLATE/feature_request.md`](.github/ISSUE_TEMPLATE/feature_request.md) | Propuestas de nuevas características indicando rol beneficiario y elementos de configuración afectados | `tipo:tarea` |

---

## 5. Flujo Diario de Trabajo

```powershell
# 1. Sincronizar rama develop
git checkout develop
git pull origin develop

# 2. Crear rama para tu funcionalidad
git checkout -b feature/buses-interfaz-seleccion

# 3. Desarrollar en tu módulo asignado con commits atómicos
git add .
git commit -m "feat(buses): crear componentes de mapa de asientos"

# 4. Actualizar con develop antes de enviar
git pull --rebase origin develop

# 5. Publicar rama y abrir Pull Request hacia develop
git push origin feature/buses-interfaz-seleccion
```

---

## 6. Proceso de Pull Request (PR) y Comité de Control de Cambios (CCB)

1. Abre el PR hacia `develop` utilizando la plantilla predeterminada ([`.github/pull_request_template.md`](.github/pull_request_template.md)).
2. Vincula obligatoriamente el Issue o RFC correspondiente usando `Closes #N`.
3. Marca el tipo de cambio y completa toda la lista de verificación de calidad (`npm run build`, tipado estricto sin `any`, sin código ajeno ni `mockData`).
4. Solicita la revisión a al menos **2 compañeros del equipo** según [`CODEOWNERS`](CODEOWNERS).
5. Tras obtener **2 aprobaciones formales** y pasar las validaciones de CI, el PR se fusiona en `develop` y la tarjeta pasa al estado `Implementado` en el [Tablero de Gestión de Configuración](https://github.com/users/juanjose1234456787654/projects/1).
