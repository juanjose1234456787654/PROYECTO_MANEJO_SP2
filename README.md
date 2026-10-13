# PROYECTO_MANEJO_SP2
Repositorio principal del proyecto Manejo SP2

## PROYECTO_MANEJO_SP2: Sistema de Gestión y Venta de Pasajes Interprovinciales

Aplicación web para la gestión y venta de pasajes dirigida a usuarios de transporte interprovincial en Ecuador, centralizando la información de las cooperativas del país y facilitando la compra en línea, gestión de rutas/frecuencias y control operativo.

---

## 📌 Descripción del Proyecto

El sistema busca resolver la problemática actual del transporte interprovincial (falta de registros de abordaje en ruta y procesos manuales) mediante una plataforma integral que permite:
* Comprar boletos desde dispositivos móviles y web.
* Consultar disponibilidad de asientos en tiempo real (Normales y VIP).
* Trazabilidad de pasajeros mediante el historial de compras previo.
* Gestión completa de cooperativas, unidades (buses), frecuencias y paradas intermedias.
* Validación de documentos para descuentos (tercera edad, discapacidad, niños) y comprobantes de pago.
* Integración de pases digitales con billeteras virtuales (*Wallet* en iOS y Android).

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
* **Cliente:** Consulta itinerarios, realiza la compra de boletos, aplica descuentos y gestiona sus pases en la *Wallet*.

---

## 🛠️ Normativas de Desarrollo y Flujo de Trabajo

El proyecto sigue la metodología de trabajo definida en la guía de contribución (`CONTRIBUTING.md`):

* **Estructura de Ramas:**
  * `main`: Versión estable en producción.
  * `develop`: Rama de integración principal.
  * `feature/*`: Desarrollo de nuevas funcionalidades.
  * `fix/*`: Correcciones de errores.
* **Convención de Commits:** Se utiliza el estándar **Conventional Commits** (`feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`). Los commits deben estar escritos en tiempo presente.
* **Control de Cambios:** Implementación de *Pull Requests* vinculados a *Issues* asignadas y clasificadas por etiquetas de severidad.

---

## 📄 Licencia y Seguridad

* **Licencia:** Distribuido bajo la licencia [MIT](LICENSE).
* **Código de Conducta:** Normas de convivencia del equipo detalladas en [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
* **Seguridad:** Reporte de vulnerabilidades según la política descrita en [SECURITY.md](SECURITY.md).
