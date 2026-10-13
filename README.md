# PROYECTO_MANEJO_SP2: Sistema de Gestión y Venta de Pasajes Interprovinciales (Cooperativa Ambato Express)

Aplicación web integral para la gestión y venta de pasajes dirigida a usuarios de transporte interprovincial en Ecuador, centralizando la información de las cooperativas del país, facilitando la compra en línea, gestión de rutas/frecuencias y control operativo bajo estándares de calidad y gestión de configuración alineados a **ITIL**.

---

## 👥 Equipo de Desarrollo y Módulos

| Miembro | Rol en Equipo | Módulo Asignado | GitHub |
|---------|---------------|-----------------|--------|
| **Juan Carvajal** | Líder del Equipo / Configuration Manager | Backend, Login, Register, Supabase | [@juanjose1234456787654](https://github.com/juanjose1234456787654) |
| **Jeremy Guaman** | Desarrollador / Coordinador de Configuración | Oficinista (Ventanilla, pagos y boletos) | [@levi06516-ui](https://github.com/levi06516-ui) |
| **Anahí Morales** | Desarrolladora | Admin (Buses, rutas, turnos y usuarios) | [@AnahiM2025](https://github.com/AnahiM2025) |
| **Celeste Telenchana** | Desarrolladora | Chofer (Escaneo QR y control de ruta) | [@CelesteTelenchanaa](https://github.com/CelesteTelenchanaa) |
| **Andrés Toasa** | Desarrollador | Cliente (Búsqueda, asientos y compra) | [@The-Fabry](https://github.com/The-Fabry) |
| **Mateo Morales** | Desarrollador | Reportes y Auditoría ITIL | [@SebastianM-M](https://github.com/SebastianM-M) |

---

## 📌 Descripción del Proyecto

El sistema busca resolver la problemática actual del transporte interprovincial (falta de registros de abordaje en ruta y procesos manuales) mediante una plataforma integral que permite:
* Comprar boletos desde dispositivos móviles y web.
* Consultar disponibilidad de asientos en tiempo real (Normales y VIP).
* Trazabilidad de pasajeros mediante el historial de compras previo.
* Gestión completa de cooperativas, unidades (buses), frecuencias y paradas intermedias.
* Validación de documentos para descuentos (tercera edad, discapacidad, niños) y comprobantes de pago.
* Integración de pases digitales con códigos QR y billeteras virtuales (*Wallet* en iOS y Android).

---

## 🚌 Módulos y Entidades Principales

1. **Cooperativas:** Administración centralizada de las cooperativas del país.
2. **Buses:** Registro de unidades con placa, cooperativa, servicio (VIP/Normal), número de pisos, marcas de chasis y carrocería, capacidad de asientos y plantillas de estructura de bus aprobadas.
3. **Frecuencias y Rutas:**
   * Configuración de origen, destino, horario e itinerario base.
   * Gestión de frecuencias directas y con paradas intermedias (sub-rutas) con cálculo proporcional de tarifas.
   * Conversión dinámica de frecuencias a rutas asignadas con fecha específica para la venta.
4. **Reserva y Trazabilidad:** Proceso de compra con verificación automática de pasajeros frecuentes, carga de datos básicos y selección interactiva de asientos.

---

## 👥 Roles del Sistema

* **Administrador (Admin):** Registra las cooperativas en el sistema y otorga permisos a los encargados.
* **Encargado de Cooperativa (Gerente):** Administra la flota de buses, rutas, frecuencias y tarifas de la cooperativa.
* **Oficinista:** Valida pagos (transferencias/depósitos), verifica documentos y emite o autoriza boletos.
* **Chofer:** Encargado de la unidad, recepción y validación de boletos presentados por los pasajeros al abordar.
* **Cliente:** Consulta itinerarios, realiza la compra de boletos, aplica descuentos y gestiona sus pases digitales.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js (App Router), React, TypeScript, CSS Moderno
- **Backend & APIs:** Next.js Server Components / API Routes
- **Base de Datos y Autenticación:** **Supabase** (PostgreSQL con Row Level Security - RLS)
- **Control de Versiones y Gestión:** Git + GitHub (Git Flow), GitHub Issues con plantillas especializadas
- **Metodología y Gobernanza:** ITIL (SACM, Change Management, Release Management)

---

## 📚 Documentación del Proyecto

Toda la documentación técnica y de gestión se encuentra organizada en el directorio [`docs/`](docs/):

- 📘 [**Plan de Gestión de Configuración ITIL**](docs/configuracion.md): Control de versiones, CMDB, Git Flow y gestión de cambios (SCR).
- 📊 [**Reportes Automáticos y Auditoría**](docs/reportes.md): Métricas de calidad, trazabilidad de issues y estado de releases.
- 📖 [**Portal de Documentación Principal**](docs/index.md): Visión general del sistema y detalles de cada módulo.
- 🏗️ [**Arquitectura y Modelo de Datos**](docs/architecture.md): Estructura del sistema y modelo de datos relacional.
- 🔄 [**Flujos del Sistema**](docs/workflows.md): Explicación paso a paso de los flujos de compra, abordaje y operación.
- 🔒 [**Política de Seguridad**](SECURITY.md): Prácticas de seguridad, RLS en Supabase y canales de reporte confidenciales.
- 🤝 [**Guía para Colaboradores**](CONTRIBUTING.md): Flujo de trabajo con ramas, convención de commits y Pull Requests.
- 📜 [**Código de Conducta**](CODE_OF_CONDUCT.md): Estándares de convivencia y colaboración del equipo.

---

## 🌿 Flujo de Trabajo (Git Flow)

El proyecto sigue la metodología de trabajo definida en la guía de contribución ([`CONTRIBUTING.md`](CONTRIBUTING.md)):

* **Estructura de Ramas:**
  * `main`: Versión estable en producción.
  * `develop`: Rama de integración principal.
  * `feature/*`: Desarrollo de nuevas funcionalidades.
  * `fix/*`: Correcciones de errores.
* **Convención de Commits:** Se utiliza el estándar **Conventional Commits** (`feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`). Los commits deben estar escritos en tiempo presente.
* **Control de Cambios:** Implementación de *Pull Requests* obligatorios vinculados a *Issues* y clasificados por tipo.

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

Los usuarios y colaboradores pueden registrar incidencias técnicas mediante el formulario interactivo en [`public/reportar.html`](public/reportar.html) o directamente a través de [GitHub Issues](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues).

---

## 📄 Licencia y Seguridad

* **Licencia:** Distribuido bajo la licencia [MIT](LICENSE).
* **Código de Conducta:** Normas de convivencia del equipo detalladas en [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
* **Seguridad:** Reporte de vulnerabilidades según la política descrita en [SECURITY.md](SECURITY.md).

---

**Gestión de Software - Segundo Parcial (SP2)**  
Líder del Proyecto: Juan Carvajal ([@juanjose1234456787654](https://github.com/juanjose1234456787654))
