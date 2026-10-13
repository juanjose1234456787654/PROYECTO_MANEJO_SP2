# 🏗️ Arquitectura y Estructura del Proyecto

Este documento describe la arquitectura de software, la organización de carpetas y el modelo de datos para el **Sistema de Gestión y Venta de Pasajes Interprovinciales**.

---

## 📂 Estructura de Directorios

* **`.github/`**: Plantillas para Pull Requests, Issues, código de conducta y normativas.
* **`prisma/`**: Configuración del ORM Prisma, esquemas de base de datos y migraciones.
* **`public/`**: Recursos estáticos e imágenes públicas.
* **`scripts/`**: Scripts de automatización y sembrado de datos (*seeds*).
* **`src/`**: Código fuente principal de la aplicación (Backend/Frontend).
* **`docs/`**: Documentación técnica, arquitectura y manuales del sistema.

---

## 🗄️ Modelo de Base de Datos y Entidades

El proyecto utiliza **Prisma ORM** para la gestión de la base de datos relacional. Las entidades principales modeladas son:

1. **Cooperativa:** Administración centralizada de las empresas de transporte.
2. **Bus:** Flota de vehículos (placa, marca, chasis, carrocería, servicio VIP/Normal, cantidad de asientos).
3. **Ruta y Frecuencia:** Definición de orígenes, destinos, horarios e itinerarios base.
4. **Parada (Sub-ruta):** Puntos intermedios dentro de una frecuencia para cálculo de tarifas.
5. **Boleto / Pasaje:** Emisión de boletos, selección de asientos, trazabilidad de pasajeros y validación de descuentos.

---

## 🛠️ Tecnologías y Control de Versiones

* **Metodología de Trabajo:** GitFlow con convención de *Conventional Commits*.
* **Gestión de Base de Datos:** Prisma ORM.
* **Contenedores:** Configuración para entorno aislado mediante `.dockerignore`.