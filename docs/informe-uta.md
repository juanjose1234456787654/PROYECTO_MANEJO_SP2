# INFORME TÉCNICO OFICIAL

## Sistema de Gestión y Venta de Pasajes Interprovinciales -- EcuRutas / Cooperativa Ambato Express

**Universidad:** Universidad Técnica de Ambato (UTA)\
**Facultad:** Ingeniería en Sistemas, Electrónica e Industrial\
**Carrera:** Ingeniería en Software\
**Asignatura:** Gestión de Software -- Segundo Parcial (SP2)\
**Docente:** Ing. \[Ing. Jara Moya Santiago David\]\
**Fecha de actualización:** 9 de noviembre de 2026\
**Repositorio:**
[juanjose1234456787654/PROYECTO_MANEJO_SP2](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2)\
**Rama de integración revisada:** `develop`

> **Nota sobre el alcance de la revisión:** El código fuente, los tipos
> de base de datos y los scripts de Supabase se encuentran en la rama
> `develop`. La rama `main` contiene actualmente la estructura inicial
> del repositorio; por ello, este informe toma `develop` como línea de
> integración para describir la implementación. La información se
> contrastó con los archivos y Pull Requests visibles en GitHub al 9 de
> noviembre de 2026.

------------------------------------------------------------------------

# 1. Portada

## 1.1 Datos del proyecto

-   **Título:** Sistema de Gestión y Venta de Pasajes Interprovinciales.
-   **Nombre del sistema:** EcuRutas -- Cooperativa Ambato Express.
-   **Área:** Transporte interprovincial ecuatoriano.
-   **Propósito:** Digitalizar la consulta de frecuencias, la venta de
    boletos, la administración operativa y el control de abordaje de
    pasajeros.

## 1.2 Equipo de desarrollo

La documentación del repositorio registra los siguientes nombres y
usuarios:

  --------------------------------------------------------------------------
  Integrante registrado   Usuario de GitHub          Responsabilidad
                                                     principal
  ----------------------- -------------------------- -----------------------
  **Juan José Carvajal    `@juanjose1234456787654`   Líder del equipo,
  Jaya**                                             Configuration Manager,
                                                     infraestructura,
                                                     autenticación y
                                                     Supabase

  **Jeremy Guaman**       `@levi06516-ui`            Coordinación de
                                                     configuración, módulo
                                                     de oficinista y
                                                     documentación

  **Andrés Toasa**        `@The-Fabry`               Lógica de negocio,
                                                     paradas intermedias,
                                                     descuentos y hojas de
                                                     ruta

  **Celeste Telenchana**  `@CelesteTelenchanaa`      Interfaz de usuario,
                                                     buscador, filtros y
                                                     selector de asientos

  **Anahí Morales**       `@AnahiM2025`              Administración,
                                                     comprobantes de pago,
                                                     validación de pagos y
                                                     notificaciones

  **Mateo Morales**       `@SebastianM-M`            QR firmado, escaneo,
                                                     historial de pasajeros,
                                                     PDF y apoyo en
                                                     auditoría
  --------------------------------------------------------------------------

**Aclaración de nombres:** el repositorio consigna el nombre completo de
Juan José Carvajal Jaya. Para los otros cinco integrantes, los
documentos consultados registran únicamente los nombres y apellidos
mostrados en la tabla. Antes de entregar la versión institucional, se
deben completar los nombres legales completos que no consten en GitHub,
sin inventar apellidos.

------------------------------------------------------------------------

# 2. Objetivos

## 2.1 Objetivo general

Desarrollar y documentar una plataforma web para la gestión y venta de
pasajes interprovinciales que integre la administración de cooperativas,
buses, frecuencias, rutas, paradas intermedias, pagos y boletos
digitales, aplicando prácticas de gestión de configuración basadas en
Gitflow e ITIL para mantener la trazabilidad de los cambios realizados
durante el segundo parcial.

## 2.2 Objetivos específicos

1.  Integrar Supabase como servicio de base de datos, autenticación y
    almacenamiento, sustituyendo los datos simulados por operaciones
    persistentes.
2.  Implementar la lógica de negocio para organizar paradas intermedias,
    validar el orden de los tramos y calcular tarifas proporcionales.
3.  Incorporar la validación de cédulas ecuatorianas y la aplicación de
    descuentos para los grupos de pasajeros contemplados por las reglas
    del sistema.
4.  Desarrollar interfaces para la búsqueda de frecuencias, filtros,
    selección de asientos y configuración administrativa.
5.  Implementar el flujo de comprobantes de pago, validación por parte
    del oficinista y notificaciones relacionadas con el estado de los
    boletos.
6.  Generar y verificar códigos QR firmados para el control de abordaje,
    además de ofrecer historial de boletos y exportación de comprobantes
    en PDF.
7.  Aplicar Gitflow, solicitudes formales de cambio (RFC), revisión de
    Pull Requests y auditoría de configuración para documentar la
    evolución del proyecto.

------------------------------------------------------------------------

# 3. Arquitectura del sistema

## 3.1 Descripción arquitectónica

El proyecto utiliza una arquitectura web basada en **Next.js 15 (App
Router)** y un modelo **Backend as a Service (BaaS)** mediante Supabase.
Next.js gestiona la interfaz, el renderizado y las rutas de aplicación;
Supabase proporciona PostgreSQL, autenticación, políticas de seguridad
por fila (RLS) y almacenamiento de archivos.

Las operaciones sensibles de firma y verificación de QR se realizan
mediante rutas del servidor de Next.js. El middleware verifica la sesión
y el rol del usuario antes de permitir el acceso a los módulos
correspondientes.

## 3.2 Stack tecnológico verificado

  -----------------------------------------------------------------------
  Tecnología                          Uso en el proyecto
  ----------------------------------- -----------------------------------
  **Next.js 15**                      Framework web y App Router

  **React 19**                        Construcción de componentes e
                                      interfaces

  **TypeScript 5.7**                  Tipado estático del proyecto

  **Tailwind CSS 3.4**                Estilos y diseño de interfaces

  **Supabase / PostgreSQL**           Persistencia de datos y consultas
                                      relacionales

  **Supabase Auth**                   Autenticación y sesiones

  **Supabase Storage**                Almacenamiento de comprobantes,
                                      logos e imágenes

  **Row Level Security (RLS)**        Control de acceso a los registros
                                      de la base de datos

  **Git y GitHub**                    Control de versiones, ramas, Issues
                                      y Pull Requests

  **GitHub Projects**                 Tablero de gestión de configuración
                                      y seguimiento

  **GitHub Actions**                  Flujo de integración continua
                                      documentado

  **html5-qrcode**                    Lectura de códigos QR

  **qrcode.react**                    Representación de códigos QR

  **HMAC-SHA256**                     Firma y verificación de integridad
                                      del QR

  **jsPDF y html2canvas**             Generación y descarga de boletos en
                                      PDF
  -----------------------------------------------------------------------

## 3.3 Diagrama de arquitectura

``` mermaid
flowchart TD
    U[Usuario: navegador web o móvil] --> N[Next.js 15 - App Router]
    N --> MW[Middleware: sesión y autorización por rol]
    MW --> UI[Interfaces y módulos de la aplicación]
    UI --> AUTH[Supabase Auth]
    UI --> DB[(Supabase PostgreSQL)]
    UI --> ST[Supabase Storage]
    UI --> API[Rutas API del servidor]
    API --> QR[Firma y verificación HMAC-SHA256]
    QR --> DB
    UI --> PDF[Generación de boleto PDF]
    UI --> SCAN[Escaneo QR con html5-qrcode]
    DB --> RLS[Políticas Row Level Security]
```

## 3.4 Organización funcional

El repositorio en `develop` contiene, entre otras, las siguientes áreas:

-   `src/app/`: páginas y rutas de la aplicación.
-   `src/app/api/`: rutas de servidor para operaciones de boletos y QR.
-   `src/components/`: componentes reutilizables, como el boleto digital
    y el selector de asientos.
-   `src/lib/services/`: servicios de negocio para datos, cédulas,
    tramos y hojas de ruta.
-   `src/lib/supabase/`: clientes de Supabase para navegador y servidor.
-   `src/modules/`: módulos funcionales del sistema.
-   `src/types/database.types.ts`: tipos TypeScript de las tablas.
-   `supabase/schema_supabase.sql`: definición SQL del esquema de base
    de datos.
-   `docs/`: documentación técnica, de arquitectura y gestión de
    configuración.

------------------------------------------------------------------------

# 4. Módulos implementados

La siguiente distribución corresponde a las seis fases funcionales y de
trabajo definidas para el segundo parcial. Se diferencia de los roles
generales de la aplicación: por ejemplo, el responsable de una fase de
pagos no necesariamente es el único usuario que participa en el flujo de
oficinista.

  ---------------------------------------------------------------------------------------------------------------------------------------
  Módulo            Responsable       Pull Requests fusionados en `develop`                                          Funcionalidad
                                                                                                                     documentada
  ----------------- ----------------- ------------------------------------------------------------------------------ --------------------
  **M1:             Juan Carvajal     [#42](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/42),   Integración de
  Infraestructura y                   [#44](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/44)    Supabase real,
  Supabase**                                                                                                         eliminación de datos
                                                                                                                     simulados,
                                                                                                                     configuración de
                                                                                                                     tipos, archivos
                                                                                                                     formales del
                                                                                                                     repositorio y
                                                                                                                     documentación de
                                                                                                                     configuración.

  **M2: Lógica de   Andrés Toasa      [#46](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/46),   Secuencia y
  negocio ANT**                       [#47](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/47),   validación de
                                      [#48](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/48)    paradas intermedias,
                                                                                                                     cálculo proporcional
                                                                                                                     de tarifas,
                                                                                                                     validación de
                                                                                                                     cédulas, descuentos
                                                                                                                     y hojas de ruta con
                                                                                                                     días de parada.

  **M3: UI y        Celeste           [#50](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/50),   Filtros avanzados de
  configuración**   Telenchana        [#52](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/52),   búsqueda, panel de
                                      [#53](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/53)    configuración global
                                                                                                                     y selector
                                                                                                                     interactivo de
                                                                                                                     asientos.

  **M4: Checkout y  Anahí Morales     [#55](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/55),   Carga de
  pagos**                             [#56](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/56),   comprobantes en
                                      [#57](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/57)    Supabase Storage,
                                                                                                                     validación de pagos
                                                                                                                     por el oficinista y
                                                                                                                     notificaciones de
                                                                                                                     cambios de estado.

  **M5: QR y        Mateo Morales     [#51](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/51),   QR firmado mediante
  escaneo**                           [#54](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/54),   HMAC-SHA256, escaneo
                                      [#58](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/58)    y verificación para
                                                                                                                     el abordaje,
                                                                                                                     historial de
                                                                                                                     pasajeros y descarga
                                                                                                                     de boletos en PDF.

  **M6:             Jeremy Guaman     [#43](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/43) y  Informe técnico UTA
  Documentación y                     [#49](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/49),   y evidencias de
  calidad**                           ambos abiertos al corte de revisión                                            Gitflow/auditoría.
                                                                                                                     Los dos PR
                                                                                                                     documentales todavía
                                                                                                                     no constan como
                                                                                                                     fusionados en GitHub
                                                                                                                     al 9 de noviembre de
                                                                                                                     2026.
  ---------------------------------------------------------------------------------------------------------------------------------------

## 4.1 Cambio transversal de gobernanza

Además de los módulos anteriores, el **PR #45**, realizado por Juan
Carvajal y fusionado en `develop`, formalizó la política del Comité de
Control de Cambios, el tablero CCB y el registro de las cuatro RFC. Este
cambio es transversal a la gestión de configuración y no se atribuye
como una funcionalidad exclusiva de los módulos de negocio.

[Consultar PR #45 -- Configuración del tablero
CCB](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/45)

## 4.2 Estado de integración de Pull Requests

La consulta de GitHub realizada el 9 de noviembre de 2026 muestra el
siguiente estado para el conjunto de PRs numerados del 42 al 58:

-   **15 Pull Requests fusionados** en `develop`.
-   **2 Pull Requests abiertos:** #43 y #49.
-   Los PR #43 y #49 corresponden a entregables de documentación y
    evidencias; no deben contabilizarse como cambios fusionados.

Por tanto, la cifra de 11 PRs que aparece en versiones anteriores del
informe está desactualizada. La trazabilidad actual de las fases M1 a M5
incluye 14 PRs funcionales fusionados, más el PR #45 de gobernanza y
configuración, para un total de 15 PRs fusionados en ese rango.

------------------------------------------------------------------------

# 5. Diagrama entidad-relación

## 5.1 Fuente y alcance

El modelo se elaboró tomando los nombres de las 11 tablas y sus campos
`Row` definidos en `src/types/database.types.ts`, en la rama `develop`.
Las relaciones se contrastaron con las claves foráneas descritas en
`supabase/schema_supabase.sql`.

Las 11 tablas son:

1.  `GrupoBus`
2.  `GrupoFrecuencia`
3.  `Cooperativa`
4.  `Usuario`
5.  `Bus`
6.  `Frecuencia`
7.  `ParadaFrecuencia`
8.  `Ruta`
9.  `Boleto`
10. `RegistroParada`
11. `ConfiguracionApp`

## 5.2 Diagrama Mermaid

``` mermaid
erDiagram
    GrupoBus ||--o{ Bus : agrupa
    GrupoFrecuencia ||--o{ Frecuencia : agrupa
    Cooperativa ||--o{ Usuario : registra
    Cooperativa ||--o{ Bus : posee
    Cooperativa ||--o{ Frecuencia : administra
    Frecuencia ||--o{ ParadaFrecuencia : contiene
    Frecuencia ||--o{ Ruta : programa
    Bus ||--o{ Ruta : asignado
    Usuario ||--o{ Ruta : conduce
    Ruta ||--o{ Boleto : genera
    Usuario ||--o{ Boleto : compra
    Ruta ||--o{ RegistroParada : registra
    ParadaFrecuencia ||--o{ RegistroParada : identifica

    GrupoBus {
        string id PK
        string nombre
        string descripcion
    }

    GrupoFrecuencia {
        string id PK
        string nombre
        string descripcion
    }

    Cooperativa {
        string id PK
        string nombre
        string ruc
        string telefono
        string direccion
        string logoUrl
        boolean activo
    }

    Usuario {
        string id PK
        string email
        string nombre
        string cedula
        string rol
        boolean activo
        string cooperativaId FK
    }

    Bus {
        string id PK
        string cooperativaId FK
        string grupoBusId FK
        int numero
        string placa
        string chasis
        string carroceria
        string marca
        string fotoUrl
        int capacidad
        int asientosVIP
        int asientosVIPNumeros
        int diasParada
        boolean activo
    }

    Frecuencia {
        string id PK
        string cooperativaId FK
        string grupoFrecuenciaId FK
        string resolucionANT
        string origen
        string destino
        string hora
        string tipoViaje
        boolean activa
        string duracion
        decimal precioBase
        json preciosPorTramo
    }

    ParadaFrecuencia {
        string id PK
        string frecuenciaId FK
        string ciudad
        int orden
    }

    Ruta {
        string id PK
        string frecuenciaId FK
        string fecha
        string busId FK
        string estado
        string inicio
        boolean completada
        decimal precio
        string choferId FK
    }

    Boleto {
        string id PK
        string rutaId FK
        string pasajeroId FK
        int asiento
        decimal precio
        decimal descuento
        string tipoPasajero
        string metodoPago
        string comprobanteUrl
        string estado
        string vendidoPor
        string vendidoPorChoferId
        string paradaOrigenId
        string paradaDestinoId
        string pasajeroNombre
        string pasajeroCedula
        string codigoQr
        string abordadoAt
    }

    RegistroParada {
        string id PK
        string rutaId FK
        string paradaId FK
        string llegada
    }

    ConfiguracionApp {
        string id PK
        string nombreApp
        string logoUrl
        string colorPrimaria
        string colorSecundaria
        json redesSociales
        string soporteEmail
        string soporteTelefono
        string updatedAt
    }
```

## 5.3 Descripción de las entidades

  -----------------------------------------------------------------------
  Tabla                               Función
  ----------------------------------- -----------------------------------
  `GrupoBus`                          Clasifica las unidades de
                                      transporte por grupos.

  `GrupoFrecuencia`                   Organiza las frecuencias en grupos
                                      operativos.

  `Cooperativa`                       Almacena la información
                                      institucional de las cooperativas.

  `Usuario`                           Registra los datos de usuarios y
                                      sus roles dentro del sistema.

  `Bus`                               Almacena la flota, capacidad,
                                      asientos VIP y días de parada de
                                      cada unidad.

  `Frecuencia`                        Define origen, destino, horario,
                                      resolución ANT y tarifas de los
                                      recorridos.

  `ParadaFrecuencia`                  Registra las ciudades intermedias y
                                      su orden dentro de una frecuencia.

  `Ruta`                              Representa la ejecución de una
                                      frecuencia en una fecha, con bus y
                                      chofer asignados.

  `Boleto`                            Registra pasajero, asiento, precio,
                                      descuento, pago, estado y datos de
                                      QR.

  `RegistroParada`                    Registra la llegada de una unidad a
                                      una parada de su recorrido.

  `ConfiguracionApp`                  Guarda parámetros generales de
                                      identidad visual y soporte de la
                                      aplicación.
  -----------------------------------------------------------------------

## 5.4 Observación de consistencia del esquema

Durante la comparación se identificaron diferencias entre
`src/types/database.types.ts` y `supabase/schema_supabase.sql`. Por
ejemplo:

-   En TypeScript, `Bus.diasParada` y `Bus.asientosVIPNumeros` son
    arreglos numéricos; en el DDL consultado aparecen como columnas de
    texto.
-   En TypeScript, `Frecuencia.duracion` es texto y `preciosPorTramo` es
    JSON; en el DDL aparecen tipos SQL diferentes.
-   En TypeScript, `Boleto` incluye `codigoQr`, `paradaOrigenId` y
    `paradaDestinoId`; el DDL consultado presenta una estructura
    distinta para algunos de esos datos.
-   El archivo de tipos declara `Relationships: []` en las tablas,
    aunque el script SQL sí contiene restricciones de claves foráneas.

**Recomendación técnica:** sincronizar el archivo generado de tipos con
el esquema SQL real de Supabase y revisar las migraciones antes de
considerar el modelo completamente consistente. El diagrama representa
los campos de `database.types.ts` y las relaciones documentadas en el
DDL; no oculta las diferencias encontradas.

------------------------------------------------------------------------

# 6. Reglas de negocio ANT

Las reglas siguientes se describen según la implementación localizada en
los servicios del proyecto, especialmente
`src/lib/services/cedulaService.ts`, `src/lib/services/tramosService.ts`
y `src/lib/services/hojasRutaService.ts`.

## 6.1 Paradas intermedias y cálculo de tramos

-   Cada frecuencia puede contener una secuencia de paradas con un campo
    `orden`.
-   El sistema construye una secuencia que incluye origen, paradas
    intermedias y destino.
-   La parada de origen debe estar antes que la parada de destino:
    `ordenOrigen < ordenDestino`.
-   No se permite seleccionar la misma parada como origen y destino ni
    viajar hacia atrás en la secuencia.
-   El precio del tramo se calcula utilizando los precios configurados
    por tramo cuando están disponibles.
-   Si no hay información de distancia, el servicio puede aplicar una
    distribución proporcional según el número de tramos.
-   El servicio contempla una tarifa mínima técnica predeterminada de
    USD 0,50; su aplicación debe contrastarse con el cuadro tarifario
    autorizado que corresponda a cada ruta.

## 6.2 Descuentos para pasajeros

La función `determinarBeneficiarioDescuento` y el cálculo de tarifa de
`cedulaService.ts` contemplan las siguientes condiciones:

  ------------------------------------------------------------------------
  Tipo de pasajero      Condición                    Descuento del sistema
                        implementada          
  --------------------- --------------------- ----------------------------
  Persona adulta mayor  65 años o más                                  50%

  Persona con           Acreditación de                                50%
  discapacidad          discapacidad o        
                        porcentaje registrado 
                        igual o superior al   
                        30%                   

  Menor de edad         Menor de 18 años                               50%

  Pasajero general      Entre 18 y 64 años,                             0%
                        sin condición de      
                        discapacidad          
  ------------------------------------------------------------------------

El sistema calcula la edad en años cumplidos a partir de la fecha de
nacimiento. Para la discapacidad, contempla la condición acreditada o un
porcentaje de discapacidad igual o superior al 30%.

**Importante:** el código consultado considera menor de edad a toda
persona menor de 18 años. Por tanto, no corresponde describir la regla
como un descuento limitado a niños de hasta 12 años.

## 6.3 Validación de cédula ecuatoriana

El servicio `cedulaService.ts` implementa una validación de cédula
ecuatoriana que incluye:

-   Comprobación de longitud y estructura numérica.
-   Validación del código provincial.
-   Validación del tercer dígito para personas naturales.
-   Aplicación del algoritmo de Módulo 10.
-   Devolución de un resultado de validación para impedir el uso de
    identificaciones inválidas en el flujo correspondiente.

## 6.4 Días de parada y control de flota

El sistema contempla el control de días de parada de los buses:

1.  El modelo de `Bus` contempla el campo `diasParada`.
2.  El servicio de hojas de ruta analiza la flota disponible y el número
    de unidades que exceden la capacidad operativa autorizada para las
    frecuencias.
3.  Cuando existe exceso de flota, determina las unidades que deben
    permanecer en descanso preventivo.
4.  La selección se realiza mediante una rotación diaria determinista.
5.  Los buses en día de parada deben quedar excluidos de las
    asignaciones de turnos y salidas.
6.  La hoja de ruta diaria permite identificar unidades operativas,
    unidades en parada y posibles conflictos de asignación.

La implementación se encuentra en `src/lib/services/hojasRutaService.ts`
y se integra desde `dataService.ts`.

## 6.5 Pagos y estados del boleto

La documentación de RFC-004 establece el flujo de estados:

-   `PENDIENTE_APROBACION`: el comprobante está a la espera de revisión.
-   `COMPLETADO`: el pago fue aprobado por el oficinista.
-   `RECHAZADO`: el pago fue rechazado y debe registrarse el motivo.
-   `EMBARCADO`: el boleto fue validado durante el abordaje.

El sistema debe impedir transiciones inválidas, como aprobar dos veces
un mismo boleto o embarcar un boleto rechazado.

------------------------------------------------------------------------

# 7. Gestión de la configuración y trazabilidad

## 7.1 Metodología Gitflow

El repositorio utiliza una adaptación de Gitflow con las siguientes
ramas:

  -----------------------------------------------------------------------
  Rama                                Propósito
  ----------------------------------- -----------------------------------
  `main`                              Línea estable destinada a
                                      producción.

  `develop`                           Rama de integración de las
                                      funcionalidades del equipo.

  `feature/*`                         Desarrollo de nuevas
                                      funcionalidades a partir de
                                      `develop`.

  `hotfix/*`                          Correcciones urgentes derivadas de
                                      `main`.

  `release/*`                         Preparación de versiones, pruebas y
                                      ajustes finales, según la política
                                      de configuración.
  -----------------------------------------------------------------------

El flujo documentado establece que las funcionalidades se desarrollan en
ramas `feature/*`, se integran mediante Pull Requests hacia `develop` y,
después de su validación, pueden formar parte de una versión estable en
`main`.

## 7.2 Convención de commits

Se utiliza Conventional Commits con el formato:

``` text
<tipo>(<alcance>): <descripción>
```

Tipos documentados:

-   `feat`: nueva funcionalidad.
-   `fix`: corrección de errores.
-   `docs`: cambios de documentación.
-   `style`: cambios de formato o presentación.
-   `refactor`: mejora interna sin modificar el comportamiento esperado.
-   `test`: pruebas.
-   `chore`: mantenimiento y configuración.

## 7.3 Comité de Control de Cambios (CCB)

La política oficial está descrita en `docs/ccb.md`. El comité se
organiza de la siguiente manera:

  -----------------------------------------------------------------------
  Cargo                   Integrante              Responsabilidad
  ----------------------- ----------------------- -----------------------
  Presidente del CCB /    Juan José Carvajal Jaya Dirige la gestión de
  Configuration Manager                           configuración y evalúa
                                                  los cambios.

  Vocal técnico 1         Andrés Toasa            Evalúa lógica de
                                                  negocio, datos, tramos
                                                  y reglas ANT.

  Vocal técnico 2         Rotativo según la fase: Evalúa el impacto del
                          Celeste, Anahí, Mateo o cambio en el módulo
                          Jeremy                  correspondiente.
  -----------------------------------------------------------------------

La política establece una mayoría mínima de **2 votos favorables de 3**
para aprobar una RFC. Cuando el autor de la solicitud forma parte del
comité, se aplica la regla de independencia documentada para mantener
revisiones cruzadas.

## 7.4 Ciclo de vida de una RFC

El ciclo de cambio documentado comprende:

1.  **Propuesto:** el responsable registra la solicitud mediante una
    plantilla RFC en GitHub Issues.
2.  **En revisión por CCB:** el comité analiza la necesidad, el impacto,
    los riesgos y las dependencias.
3.  **Aprobado:** se registra el dictamen favorable del comité.
4.  **Implementado:** el cambio se desarrolla, verifica y fusiona en
    `develop`.
5.  **Rechazado:** la solicitud se cierra con una justificación técnica
    y no modifica la línea base.

### Tiempos y criterios de control

  ------------------------------------------------------------------------
  Etapa                    Tiempo máximo documentado Criterio
  --------------------- ---------------------------- ---------------------
  Admisión de la RFC                        12 horas Verificar que la
                                                     solicitud esté
                                                     completa.

  Evaluación y votación                24 a 48 horas Mínimo 2 votos
                                                     favorables de 3 y sin
                                                     bloqueos críticos de
                                                     seguridad.

  Verificación del PR     24 horas desde su apertura 2 aprobaciones
                                                     formales y
                                                     compilación
                                                     `npm run build`
                                                     exitosa.
  ------------------------------------------------------------------------

## 7.5 RFC registradas en el proyecto

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  RFC            Issue                                                                           Cambio         Responsable    Implementación relacionada
                                                                                                 solicitado                    
  -------------- ------------------------------------------------------------------------------- -------------- -------------- ----------------------------------------------------------------------------
  RFC-001        [#26](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/26)   Migración de   Juan Carvajal  [PR
                                                                                                 datos                         #42](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/42)
                                                                                                 simulados a                   
                                                                                                 Supabase real                 

  RFC-002        [#27](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/27)   Tarifa         Andrés Toasa   [PR
                                                                                                 proporcional                  #46](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/46)
                                                                                                 por tramos                    
                                                                                                 intermedios                   

  RFC-003        [#28](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/28)   Firma          Mateo Morales  [PR
                                                                                                 HMAC-SHA256                   #51](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/51)
                                                                                                 del QR                        

  RFC-004        [#29](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/29)   Contenedor de  Anahí Morales  [PR
                                                                                                 comprobantes y                #55](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/55)
                                                                                                 máquina de                    
                                                                                                 estados de                    
                                                                                                 pago                          
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 7.6 Tablero de auditoría

El tablero de gestión de configuración se encuentra en:

[GitHub Projects -- Tablero de Gestión de
Configuración](https://github.com/users/juanjose1234456787654/projects/1)

El documento `docs/evidencias/auditoria-tablero-ccb.md` registra una
auditoría con fecha de corte 2 de noviembre de 2026 y describe:

-   Campos personalizados de estado, responsable, fase, tipo y orden.
-   Las cuatro RFC y sus estados documentados.
-   La trazabilidad de 31 ítems entre tareas, épicas y RFC.
-   La relación entre Issues, responsables, fases y cambios.
-   La evidencia de uso de Gitflow y el registro de auditoría.

## 7.7 Resumen de Pull Requests del segundo parcial

Los siguientes PRs del rango #42--#58 aparecen fusionados en la rama
`develop`:

  --------------------------------------------------------------------------------------------------------------------------------
                                                                             PR Descripción      Autor            Estado
                                                                                resumida                          
  ----------------------------------------------------------------------------- ---------------- ---------------- ----------------
    [#42](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/42) Integración real Juan Carvajal    Fusionado
                                                                                de Supabase                       

    [#44](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/44) Archivos         Juan Carvajal    Fusionado
                                                                                formales y                        
                                                                                configuración                     
                                                                                del repositorio                   

    [#45](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/45) Tablero CCB,     Juan Carvajal    Fusionado
                                                                                política y ciclo                  
                                                                                RFC                               

    [#46](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/46) Paradas          Andrés Toasa     Fusionado
                                                                                intermedias y                     
                                                                                tarifa                            
                                                                                proporcional                      

    [#47](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/47) Validación de    Andrés Toasa     Fusionado
                                                                                cédula y                          
                                                                                descuentos ANT                    

    [#48](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/48) Hojas de ruta y  Andrés Toasa     Fusionado
                                                                                días de parada                    

    [#50](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/50) Filtros          Celeste          Fusionado
                                                                                avanzados de     Telenchana       
                                                                                búsqueda                          

    [#51](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/51) QR firmado       Mateo Morales    Fusionado
                                                                                HMAC-SHA256                       

    [#52](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/52) Panel de         Celeste          Fusionado
                                                                                configuración    Telenchana       
                                                                                global                            

    [#53](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/53) Selector         Celeste          Fusionado
                                                                                interactivo de   Telenchana       
                                                                                asientos                          

    [#54](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/54) Escáner del      Mateo Morales    Fusionado
                                                                                chofer y                          
                                                                                verificación                      
                                                                                HMAC                              

    [#55](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/55) Carga de         Anahí Morales    Fusionado
                                                                                comprobantes de                   
                                                                                pago                              

    [#56](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/56) Panel de         Anahí Morales    Fusionado
                                                                                validación de                     
                                                                                pagos                             

    [#57](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/57) Notificaciones   Anahí Morales    Fusionado
                                                                                en la aplicación                  

    [#58](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/58) Historial de     Mateo Morales    Fusionado
                                                                                pasajeros y                       
                                                                                descarga PDF                      
  --------------------------------------------------------------------------------------------------------------------------------

Los PRs
[#43](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/43)
y
[#49](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/49)
permanecían abiertos al momento de la consulta y, por tanto, no se
contabilizan como integraciones realizadas.

------------------------------------------------------------------------

# 8. Conclusiones

## 8.1 Conclusiones por módulo

-   **M1 -- Infraestructura y Supabase:** La integración con Supabase
    permite utilizar persistencia centralizada y servicios de
    autenticación y almacenamiento. La generación de tipos facilita el
    uso de TypeScript en las operaciones de datos. Es necesario mantener
    sincronizados los tipos y el esquema SQL.
-   **M2 -- Lógica de negocio ANT:** La organización de paradas, la
    validación del orden de los tramos, el cálculo de tarifas y la
    gestión de días de parada permiten representar reglas operativas del
    transporte interprovincial. La validación de cédulas y el cálculo de
    descuentos incorporan controles adicionales al proceso de compra.
-   **M3 -- UI y configuración:** Los filtros de búsqueda, el selector
    de asientos y el panel de configuración facilitan la interacción de
    los usuarios y la administración de parámetros generales.
-   **M4 -- Checkout y pagos:** La carga de comprobantes, el panel de
    revisión y las notificaciones estructuran el proceso de aprobación o
    rechazo de pagos y mejoran la trazabilidad del estado de los
    boletos.
-   **M5 -- QR y escaneo:** La firma HMAC-SHA256 permite comprobar la
    integridad del contenido del QR. El escaneo, el historial de
    pasajeros y la exportación PDF complementan el control de abordaje y
    la consulta de comprobantes.
-   **M6 -- Documentación y calidad:** La documentación técnica y las
    evidencias de auditoría son necesarias para justificar las
    decisiones de arquitectura y configuración. Los PR #43 y #49 deben
    completar su revisión y fusión para cerrar los entregables
    documentales.

## 8.2 Conclusión general del equipo

El desarrollo del segundo parcial permitió integrar los componentes
principales de una plataforma de gestión y venta de pasajes
interprovinciales, combinando servicios de Supabase, interfaces
desarrolladas con Next.js y reglas de negocio relacionadas con rutas,
paradas, pagos y abordaje. La aplicación de Gitflow, el registro de RFC
y la política del CCB proporcionan un proceso de control de cambios y
trazabilidad de las contribuciones. Como actividades de cierre, el
equipo debe completar la documentación pendiente, confirmar los nombres
legales de todos los integrantes y corregir las diferencias detectadas
entre los tipos TypeScript y el esquema SQL de Supabase.

------------------------------------------------------------------------

# 9. Bibliografía

## 9.1 Referencias normativas

1.  Agencia Nacional de Tránsito del Ecuador (ANT). Portal institucional
    y normativa aplicable al transporte terrestre.
    https://www.ant.gob.ec/
2.  Asamblea Nacional del Ecuador. **Ley Orgánica de Transporte
    Terrestre, Tránsito y Seguridad Vial (LOTTTSV)**. Consultar el texto
    vigente y sus reformas en las fuentes oficiales del Estado
    ecuatoriano.
3.  República del Ecuador. **Constitución de la República del Ecuador**,
    artículo 47, relacionado con los derechos de las personas con
    discapacidad.
4.  República del Ecuador. Normativa vigente sobre derechos y beneficios
    de personas adultas mayores y personas con discapacidad.

> Las reglas porcentuales y rangos de edad descritos en este informe
> corresponden a la lógica identificada en el código del proyecto. Antes
> de presentar el informe como interpretación jurídica, se recomienda
> contrastar cada porcentaje, artículo y condición con la versión
> vigente de la normativa oficial y con el cuadro tarifario autorizado
> para cada ruta.

## 9.2 Referencias técnicas

5.  Vercel. **Next.js Documentation -- App Router**.
    https://nextjs.org/docs/app
6.  Supabase. **Supabase Documentation -- PostgreSQL, Authentication,
    Storage y Row Level Security**. https://supabase.com/docs
7.  Microsoft. **TypeScript Documentation**.
    https://www.typescriptlang.org/docs/
8.  Tailwind Labs. **Tailwind CSS Documentation**.
    https://tailwindcss.com/docs
9.  Git. **Git Documentation**. https://git-scm.com/doc
10. GitHub. **GitHub Docs -- Pull Requests, Issues y Projects**.
    https://docs.github.com/
11. AXELOS. (2019). **ITIL Foundation: ITIL 4 Edition**. TSO (The
    Stationery Office).

## 9.3 Fuentes internas del repositorio

-   [README.md](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/blob/develop/README.md)
-   [Arquitectura del
    sistema](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/blob/develop/docs/arquitectura.md)
-   [Tipos de base de
    datos](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/blob/develop/src/types/database.types.ts)
-   [Esquema SQL de
    Supabase](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/blob/develop/supabase/schema_supabase.sql)
-   [Política del
    CCB](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/blob/develop/docs/ccb.md)
-   [Modelo
    Gitflow](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/blob/develop/docs/gitflow.md)
-   [Auditoría del tablero
    CCB](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/blob/develop/docs/evidencias/auditoria-tablero-ccb.md)
-   [Registro de
    RFC](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/tree/develop/docs/cambios)
