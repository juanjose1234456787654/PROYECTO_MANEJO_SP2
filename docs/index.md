# Bienvenido al Sistema de Gestión de Proyectos

## PROYECTO_MANEJO_SP2 - Cooperativa Ambato Express

Este sitio contiene la documentación oficial del proyecto **PROYECTO_MANEJO_SP2 (Cooperativa Ambato Express)**, un sistema integral de gestión de transporte cooperativo que permite la venta de boletos, asignación de rutas y frecuencias, control de pasajeros y administración centralizada del servicio.

La documentación y metodología están rigurosamente alineadas con las mejores prácticas de **ITIL (Information Technology Infrastructure Library)** para asegurar una gestión profesional de configuración, control de cambios y aseguramiento de la calidad del software.

---

## 📋 Índice de Contenidos

### 🚀 Documentación Principal
- [Gestión de Configuración](configuracion.md) - Plan integral de gestión de configuración ITIL (SACM, CMDB, Git Flow)
- [Reportes Automáticos](reportes.md) - Métricas, estado de issues, auditorías y trazabilidad del equipo

---

## 👥 Equipo de Desarrollo

| Miembro | Rol en Equipo | Módulo Responsable | GitHub |
|---------|---------------|-------------------|--------|
| **Juan Carvajal** | Líder del Equipo / Configuration Manager | Backend, Login, Register, Supabase | [@juanjose1234456787654](https://github.com/juanjose1234456787654) |
| **Jeremy Guaman** | Desarrollador / Coordinador de Configuración | Oficinista | [@levi06516-ui](https://github.com/levi06516-ui) |
| **Anahí Morales** | Desarrolladora | Admin | [@AnahiM2025](https://github.com/AnahiM2025) |
| **Celeste Telenchana** | Desarrolladora | Chofer | [@CelesteTelenchanaa](https://github.com/CelesteTelenchanaa) |
| **Andrés Toasa** | Desarrollador | Cliente | [@The-Fabry](https://github.com/The-Fabry) |
| **Mateo Morales** | Desarrollador | Reportes y Auditoría ITIL | [@SebastianM-M](https://github.com/SebastianM-M) |

---

## 📦 Módulos del Sistema

#### Backend, Login/Register y Base de Datos (Juan Carvajal)
- Endpoints de API RESTful en Next.js
- Autenticación, control de sesiones y tokens seguros
- Arquitectura y esquemas de base de datos en **Supabase** (PostgreSQL)
- Políticas de seguridad a nivel de fila (**Row Level Security - RLS**)
- Validaciones de negocio compartidas y control de roles (RBAC)

#### Módulo de Oficinista (Jeremy Guaman)
- Dashboard interactivo para personal de boletería y ventanilla
- Gestión y verificación de transferencias y pagos pendientes
- Emisión y venta presencial de pasajes
- Asignación rápida de boletos en terminal

#### Módulo de Administración (Anahí Morales)
- Panel general de control administrativo
- Gestión de usuarios, roles y personal operativo
- Catálogo maestro de unidades de transporte (buses), rutas, frecuencias y turnos
- Parámetros generales y tarifas del sistema

#### Módulo de Chofer (Celeste Telenchana)
- Interfaz optimizada para conductores y operarios de ruta
- Escaneo y validación en tiempo real de boletos mediante códigos QR
- Control de abordaje y lista de pasajeros confirmados
- Seguimiento de estado de turnos asignados

#### Módulo de Cliente (Andrés Toasa)
- Aplicación web responsive para usuarios finales
- Búsqueda interactiva de rutas, horarios y frecuencias
- Selección visual e intuitiva de asientos en el bus
- Proceso de compra, checkout y descarga de comprobante/boleto con código QR

#### Módulo de Reportes y Auditoría ITIL (Mateo Morales)
- Generación y seguimiento de reportes automatizados de calidad
- Control de métricas ITIL, actividad de desarrollo y trazabilidad
- Verificación y pruebas de consistencia en interfaces de usuario

---

## 🔧 Herramientas y Tecnologías

### Stack Tecnológico
- **Frontend:** Next.js (App Router), React, TypeScript, CSS Moderno
- **Backend & APIs:** Next.js Server Components / API Routes
- **Base de Datos y Autenticación:** **Supabase** (PostgreSQL con Row Level Security - RLS)
- **Control de Versiones:** Git + GitHub ([juanjose1234456787654/PROYECTO_MANEJO_SP2](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2))
- **CI/CD:** GitHub Actions
- **Documentación:** Markdown técnico en `docs/`

### Herramientas de Gestión
- **Gestión de Configuración:** Git Flow (`main`, `develop`, `feature/*`), GitHub Issues estructurados
- **Gestión de Cambios:** Solicitudes formales de cambio (SCR), PR Templates obligatorios
- **Reportes de Usuarios:** Formulario público `/reportar.html` conectado a GitHub Issues
- **Auditorías:** Revisiones continuas y auditorías de configuración semanales

---

## 📊 Flujo de Trabajo (Git Flow)

### Ramas Principales
- **main:** Rama de producción, versiones estables y liberadas mediante tags.
- **develop:** Rama de desarrollo e integración activa del sprint.

### Ramas de Soporte
- **feature/nombre-modulo:** Nuevas funcionalidades desarrolladas de forma aislada.
- **hotfix/nombre-fix:** Correcciones de emergencia derivadas de `main`.
- **release/vX.Y.Z:** Preparación de paquetes de entrega.

### Reglas de Contribución
1. El líder (**Juan Carvajal**) crea los Issues y asigna tareas a los desarrolladores.
2. Cada desarrollador crea su rama `feature/` desde `develop`.
3. Todo commit se redacta en presente y de forma descriptiva (`feat(modulo): descripcion`).
4. Se abre un Pull Request hacia `develop` completando rigurosamente la plantilla oficial.
5. El líder revisa el código, verifica el cumplimiento de estándares y realiza el merge.

---

## 🎯 Cumplimiento ITIL

El proyecto implementa y hace cumplir los principios fundamentales de ITIL v3/v4:

- **SACM (Service Asset and Configuration Management):** Control integral de cada elemento de configuración (CMDB) y trazabilidad de cambios.
- **Change Management:** Proceso formal de evaluación de impacto, mitigación de riesgos y aprobación de solicitudes de cambio.
- **Release Management:** Versionado semántico estandarizado (`SemVer`) y control de despliegues.
- **Configuration Audit:** Auditorías de integridad para asegurar que el código, la base de datos y la documentación estén perfectamente alineados.

---

## 🐛 Reportar Problemas e Incidencias

Los usuarios y colaboradores pueden reportar incidencias técnicas a través de:

- **Formulario web de incidencias:** [Formulario de Reportes (`public/reportar.html`)](https://juanjose1234456787654.github.io/PROYECTO_MANEJO_SP2/reportar.html)
- **GitHub Issues:** Seleccionando la plantilla adecuada en [GitHub Issues](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues)

---

## 📞 Contacto y Gobernanza

Para consultas técnicas, aprobaciones de arquitectura o temas de seguridad:

- **Juan Carvajal** - Líder del Equipo & Configuration Manager
- **GitHub:** [@juanjose1234456787654](https://github.com/juanjose1234456787654)
- **Email:** carvajaljayaj85@gmail.com

---

**Última actualización:** Octubre 2026  
**Versión de documentación:** 1.0.0  
_Proyecto Académico de Gestión de Software - Segundo Parcial (SP2)_
