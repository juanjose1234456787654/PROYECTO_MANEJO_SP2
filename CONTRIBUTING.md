# Guía para Colaboradores - EcuRutas

Normas de desarrollo y contribución para el equipo del proyecto (Manejo y Configuración de Software - UTA).

---

## 1. Principios Fundamentales

1. **Nunca realizar `push` directo a las ramas `develop` ni `main`**.
2. **Toda contribución se realiza mediante una rama `feature/<modulo>-<tarea>`**.
3. **Todo Pull Request requiere obligatoriamente al menos 2 aprobaciones** antes del merge.
4. **Respetar la modularidad**: Trabaja exclusivamente dentro de tu módulo en `src/modules/<tu-modulo>/`.
5. **No exponer credenciales**: Nunca uses la clave `service_role` en frontend.

---

## 2. Estructura de Ramificación (Gitflow)

| Rama | Propósito | Regla |
|------|-----------|-------|
| `main` | Producción / Versión final evaluable | Solo recibe merges desde `develop` vía PR con 2 aprobaciones |
| `develop` | Integración continua | Rama base para crear y fusionar features |
| `feature/*` | Nuevos requerimientos o módulos | Se crea desde `develop` y se integra con PR |
| `hotfix/*` | Correcciones críticas de producción | Se crea desde `main` y se fusiona a `main` y `develop` |

---

## 3. Estándar de Commits (Conventional Commits)

Formato: `<tipo>(<alcance>): <descripción corta>`

- `feat(modulo)`: Nueva funcionalidad
- `fix(modulo)`: Corrección de error o bug
- `docs(alcance)`: Cambios en documentación
- `style(modulo)`: Cambios de estilos o formato sin alterar lógica
- `refactor(modulo)`: Reestructuración de código
- `chore(config)`: Tareas de mantenimiento o configuración

Ejemplos:
```bash
feat(escaneo): integrar html5-qrcode para lectura de pasajes
fix(middleware): corregir redireccionamiento por rol de usuario inactivo
docs(arquitectura): documentar flujo de storage privado para comprobantes
```

---

## 4. Flujo Diario de Trabajo

```powershell
# 1. Sincronizar rama develop
git checkout develop
git pull origin develop

# 2. Crear rama para tu funcionalidad
git checkout -b feature/buses-interfaz-seleccion

# 3. Desarrollar en tu módulo asignado (src/modules/<modulo>/)
git add .
git commit -m "feat(buses): crear componentes de mapa de asientos"

# 4. Actualizar con develop antes de enviar
git pull --rebase origin develop

# 5. Publicar rama y abrir Pull Request
git push origin feature/buses-interfaz-seleccion
```

---

## 5. Proceso de Pull Request (PR)

1. Abre el PR hacia `develop` utilizando la plantilla predeterminada (`.github/pull_request_template.md`).
2. Vincula el Issue o Petición de Cambio correspondiente (`Closes #ID`).
3. Solicita la revisión a dos compañeros del equipo asignados en `CODEOWNERS`.
4. Tras obtener **2 aprobaciones formales**, el merge será completado mediante `Squash and Merge`.
