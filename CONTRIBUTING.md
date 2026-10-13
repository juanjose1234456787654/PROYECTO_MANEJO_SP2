# Guía para Colaboradores - PROYECTO_MANEJO_SP2

## 📌 Reglas generales
1. **Nunca trabajar directamente en la rama `develop` o `main`**.
2. **Siempre crear ramas `feature/` para nuevas funcionalidades**.
3. **Los commits deben estar en PRESENTE y ser descriptivos**.

## 🌿 Estructura de ramas
| Rama | Propósito |
|------|-----------|
| `main` | Versión estable del proyecto |
| `develop` | Integración de cambios |
| `feature/*` | Nuevas funcionalidades |
| `fix/*` | Correcciones de errores |

## 📝 Formato de commits
### Tipos permitidos
- `feat`: Nueva funcionalidad
- `fix`: Corrección de error
- `style`: Cambios visuales (CSS, diseño)
- `refactor`: Mejora interna
- `docs`: Documentación
- `chore`: Tareas de configuración

### Ejemplos correctos
bash
feat(admin): agrega listado de buses
fix(login): corrige error de autenticación
style(cliente): diseña buscador de rutas
## 🔀 Pull Requests
1. Subir la rama a GitHub.
2. Crear Pull Request hacia `develop`.
3. En la descripción incluir `Closes #N` (N = número del issue).
4. El líder (Juan Carvajal) revisa y aprueba.

## 📋 Issues
- Usar etiquetas: `tipo: normal`, `tipo: estandar`, `tipo: emergencia`.
- Asignar a un integrante.
- Cerrar automáticamente con `Closes #N` en el PR.

## ✅ Flujo diario
bash
git checkout develop
git pull origin develop
git checkout -b feature/tu-tarea

Trabajar en tus archivos...
git add .
git commit -m "feat(modulo): descripcion"
git push origin feature/tu-tarea

Luego crear Pull Request en GitHub
## 🆘 ¿Ayuda?
Preguntar en el grupo antes de quedarse atascado más de 30 minutos.
