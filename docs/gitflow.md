# Modelo de Ramificación Gitflow y Gobernanza de Código

Políticas de control de versiones y flujo de trabajo para el equipo de desarrollo de EcuRutas (Manejo y Configuración de Software - UTA).

---

## 1. Estructura de Ramas

El repositorio utiliza el modelo **Gitflow adaptado**:

```text
main (Producción estable)
  ↑ (PR con 2 aprobaciones)
develop (Integración y staging)
  ↑ (PR con 2 aprobaciones)
feature/<modulo>-<descripcion-corta>
```

| Rama | Propósito | Reglas de Protección |
|------|-----------|----------------------|
| `main` | Código listo para producción. | Prohibido push directo. Requiere PR desde `develop` con **mínimo 2 aprobaciones** y CI exitoso. |
| `develop` | Rama principal de integración diaria. | Prohibido push directo. Requiere PR desde ramas `feature/*` con **mínimo 2 aprobaciones**. |
| `feature/*` | Desarrollo de nuevos módulos o requerimientos. | Creada a partir de `develop`. Se fusiona a `develop` vía PR. |
| `hotfix/*` | Correcciones críticas urgentes en producción. | Creada desde `main`. Se fusiona tanto a `main` como a `develop`. |

---

## 2. Convención de Mensajes de Commit (Conventional Commits)

Cada commit debe seguir estrictamente el estándar:

```text
<tipo>(<alcance>): <descripción corta en imperativo>
```

### Tipos Permitidos
- `feat`: Nueva funcionalidad.
- `fix`: Corrección de un error (bug).
- `docs`: Modificación exclusiva de documentación.
- `style`: Formateo de código, estilos CSS sin cambio de lógica.
- `refactor`: Reorganización o mejora interna de código sin alterar comportamiento.
- `test`: Adición o corrección de pruebas unitarias/integración.
- `chore`: Mantenimiento de configuración, dependencias o tooling.

### Ejemplos Válidos
```bash
feat(escaneo): integrar lector html5-qrcode para validacion de abordaje
fix(middleware): corregir redireccion infinita en usuario inactivo
docs(supabase): actualizar guia de generacion de tipos typescript
chore(deps): actualizar @supabase/ssr a version estable
```

---

## 3. Flujo Paso a Paso para Desarrolladores

```powershell
# 1. Asegurarse de tener la última versión de develop
git checkout develop
git pull origin develop

# 2. Crear rama de trabajo para tu feature
git checkout -b feature/buses-gestion-asientos

# 3. Realizar cambios y commitear siguiendo la convención
git add .
git commit -m "feat(buses): agregar componente de seleccion de asientos VIP"

# 4. Actualizar con cambios recientes de develop antes de abrir PR
git pull --rebase origin develop

# 5. Subir rama al repositorio remoto
git push origin feature/buses-gestion-asientos

# 6. Abrir Pull Request hacia develop en GitHub
# Asignar a 2 compañeros de equipo como revisores obligatorios.
```

---

## 4. Política de Pull Requests (PR)

1. **Revisión Dual Obligatoria**: Ninguna PR puede ser fusionada a `develop` o `main` sin al menos **2 aprobaciones explícitas** de otros miembros del equipo.
2. **Vinculación de Issues**: Todo PR debe incluir la palabra clave de cierre (`Closes #123`) vinculada al Issue o Petición de Cambio aprobada.
3. **Estrategia de Merge**: Se utiliza `Squash and Merge` o `Rebase and Merge` para mantener un historial lineal y limpio en `develop`.
