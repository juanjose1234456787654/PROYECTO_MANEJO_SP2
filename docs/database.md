# Documentación Técnica de la Base de Datos - Supabase (PostgreSQL)

## 1. Resumen Ejecutivo y Arquitectura
La base de datos del proyecto **PROYECTO_MANEJO_SP2** está desplegada sobre la infraestructura Cloud de **Supabase**, utilizando el motor relacional **PostgreSQL**. 

El diseño del modelo de datos ha sido estructurado siguiendo estrictamente las reglas de **Normalización de Bases de Datos hasta la Tercera Forma Normal (3FN)**. Esto garantiza la eliminación de redundancias de información, asegura la integridad referencial de las entidades y optimiza el rendimiento en las operaciones CRUD del sistema de gestión de transporte interprovincial.

---

## 2. Descripción Detallada del Esquema Relacional (11 Tablas)

El modelo relacional está compuesto por 11 tablas interconectadas mediante claves primarias (PK) y foráneas (FK):

### A. Catálogos y Entidades Principales
1. **`GrupoBus`**: Catálogo que permite clasificar y agrupar lógicamente las unidades de transporte según su nivel de servicio o características.
2. **`GrupoFrecuencia`**: Catálogo destinado a categorizar los tipos de frecuencias u horarios operativos.
3. **`Cooperativa`**: Almacena la información institucional y legal de las cooperativas de transporte (RUC único, razón social, contactos, dirección y estado operativo).

### B. Actores y Flujo Vehicular
4. **`Usuario`**: Gestiona las credenciales de acceso, datos personales y control de acceso basado en roles (`Administrador`, `Chofer`, `Pasajero`), integrando tokens para recuperación de contraseña.
5. **`Bus`**: Registra los vehículos pertenecientes a cada cooperativa, almacenando especificaciones técnicas (placa, chasis, carrocería, capacidad de pasajeros, asignación de asientos VIP y días de parada).

### C. Operación y Planificación de Rutas
6. **`Frecuencia`**: Define los itinerarios base legalizados por la ANT, orígenes, destinos, horarios de salida, duraciones estimadas y esquemas tarifarios.
7. **`ParadaFrecuencia`**: Contiene el desglose secuencial de ciudades/puntos intermedios que componen el trayecto de cada frecuencia.
8. **`Ruta`**: Asignación operativa en tiempo real que vincula un despacho programado en una fecha específica con un bus y un chofer asignado.

### D. Transacciones y Control
9. **`Boleto`**: Gestiona la venta de pasajes, registro del pasajero, número de asiento asignado, tarifas con descuento, métodos de pago, comprobantes y generación de código QR para validación.
10. **`RegistroParada`**: Registra la trazabilidad y marcas de tiempo (`timestamps`) exactas del paso de un bus por cada parada intermedia del recorrido.
11. **`ConfiguracionApp`**: Almacena parámetros globales de personalización de la interfaz de usuario (colores corporativos, logos y contactos de soporte).

---

## 3. Modelo de Seguridad y Políticas RLS (Row Level Security)

PostgreSQL en Supabase implementa por defecto **Row Level Security (RLS)** para controlar el acceso a nivel de fila:

* **Configuración en Desarrollo:** Para permitir una integración ágil entre el frontend/backend y la API cliente de Supabase sin bloqueos de autenticación, se establecieron políticas permisivas (`Acceso total publico`) utilizando expresiones `FOR ALL USING (true)` en las 11 tablas.
* **Escalabilidad a Producción:** Este esquema permite que en fases posteriores se puedan ajustar las políticas RLS para restringir escrituras únicamente a usuarios autenticados o con roles específicos sin necesidad de alterar la estructura DDL de las tablas.

---

## 4. Trazabilidad y Archivo Fuente DDL

El script SQL ejecutable que contiene todas las sentencias DDL de creación de tablas, restricciones de clave foránea (`FOREIGN KEY`), índices de rendimiento (`INDEX`) y políticas de seguridad se encuentra versión en el repositorio en:

- **Ruta del Script:** `supabase/schema_supabase.sql`