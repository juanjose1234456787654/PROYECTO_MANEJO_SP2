# PROYECTO_MANEJO_SP2 - Cooperativa Ambato Express

Sistema integral de gestión de transporte cooperativo para la venta de boletos, asignación de rutas y turnos, escaneo de pasajes QR y administración general, desarrollado bajo estándares profesionales de gestión de configuración y calidad alineados a **ITIL**.

---

## 👥 Equipo de Desarrollo y Módulos

| Miembro | Rol en Equipo | Módulo Asignado | GitHub |
|---------|---------------|-----------------|--------|
| **Juan Carvajal** | Líder del Equipo / Configuration Manager | Backend, Login, Register, Supabase | [@juanjose1234456787654](https://github.com/juanjose1234456787654) |
| **Jeremy Guaman** | Desarrollador / Coordinador de Configuración | Oficinista | [@levi06516-ui](https://github.com/levi06516-ui) |
| **Anahí Morales** | Desarrolladora | Admin | [@AnahiM2025](https://github.com/AnahiM2025) |
| **Celeste Telenchana** | Desarrolladora | Chofer | [@CelesteTelenchanaa](https://github.com/CelesteTelenchanaa) |
| **Andrés Toasa** | Desarrollador | Cliente | [@The-Fabry](https://github.com/The-Fabry) |
| **Mateo Morales** | Desarrollador | Reportes y Auditoría ITIL | [@SebastianM-M](https://github.com/SebastianM-M) |

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js (App Router), React, TypeScript
- **Base de Datos y Autenticación:** **Supabase** (PostgreSQL con Row Level Security - RLS)
- **Control de Versiones y Gestión:** Git + GitHub (Git Flow), GitHub Issues con plantillas especializadas
- **Metodología y Gobernanza:** ITIL (SACM, Change Management, Release Management)

---

## 📚 Documentación del Proyecto

Toda la documentación técnica y de gestión se encuentra organizada en el directorio [`docs/`](docs/):

- 📘 [**Plan de Gestión de Configuración ITIL**](docs/configuracion.md): Control de versiones, CMDB, Git Flow y gestión de cambios (SCR).
- 📊 [**Reportes Automáticos y Auditoría**](docs/reportes.md): Métricas de calidad, trazabilidad de issues y estado de releases.
- 📖 [**Portal de Documentación Principal**](docs/index.md): Visión general del sistema y detalles de cada módulo.
- 🔒 [**Política de Seguridad**](SECURITY.md): Prácticas de seguridad, RLS en Supabase y canales de reporte confidenciales.
- 🤝 [**Guía para Colaboradores**](CONTRIBUTING.md): Flujo de trabajo con ramas, convención de commits y Pull Requests.
- 📜 [**Código de Conducta**](CODE_OF_CONDUCT.md): Estándares de convivencia y colaboración del equipo.

---

## 🌿 Flujo de Trabajo (Git Flow)

- `main`: Versión estable y liberada en producción.
- `develop`: Rama de integración activa del sprint.
- `feature/*`: Ramas de trabajo para cada funcionalidad específica.

```bash
# Iniciar trabajo en una funcionalidad
git checkout develop
git pull origin develop
git checkout -b feature/tu-modulo

# Commits descriptivos en tiempo presente
git commit -m "feat(modulo): implementa interfaz de usuario"
```

---

## 🚨 Reporte de Incidencias

Los usuarios y colaboradores pueden registrar incidencias mediante el formulario interactivo en [`public/reportar.html`](public/reportar.html) o directamente a través de [GitHub Issues](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues).

---

**Gestión de Software - Segundo Parcial (SP2)**  
Líder del Proyecto: Juan Carvajal ([@juanjose1234456787654](https://github.com/juanjose1234456787654))
