# Guion de defensa — 28 minutos exactos

**Proyecto:** PROYECTO_MANEJO_SP2 · **Issue:** [#38](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/38)  
**Participantes:** Jeremy, Juan, Celeste, Andrés, Anahí y Mateo  
**Duración planificada:** 28:00 min (10 bloques de la Issue; no incluye una ronda extensa adicional de preguntas).  
**Base:** [presentacion.md](presentacion.md)

## Cronograma minuto a minuto

| Tiempo acumulado | Duración | Responsable | Sección y diapositiva | Qué debe hacer y decir |
|---|---:|---|---|---|
| 00:00–01:00 | 1 min | **Jeremy** | Portada/agenda · 1 | Presentar sistema, equipo, objetivo del recorrido y orden de exposición. |
| 01:00–04:00 | 3 min | **Juan** | Contexto/ANT · 2–3 | Describir necesidad, actores, problema, reglas de negocio y marco regulatorio sin porcentajes no comprobados. |
| 04:00–07:00 | 3 min | **Juan** | Arquitectura · 4 | Explicar Next.js, TypeScript, Tailwind, Supabase, roles y flujo de datos. |
| 07:00–10:00 | 3 min | **Juan** | Gitflow/CCB · 5 | Ramas, PR/revisión, CCB y las cuatro RFC; distinguir estados de tablero y PR. |
| 10:00–13:00 | 3 min | **Celeste** | Búsqueda/asientos · 6 | Ejecutar búsqueda, filtros, elegir frecuencia y asiento de prueba. |
| 13:00–16:00 | 3 min | **Andrés** | Reglas ANT · 7 | Mostrar paradas/tramo, tarifa y validación de descuento de demostración. |
| 16:00–20:00 | 4 min | **Anahí** | Checkout/oficinista · 8–9 | Ejecutar pago de prueba, comprobante y revisión por personal de oficina. |
| 20:00–24:00 | 4 min | **Mateo** | QR/escáner/PDF · 10–11 | Demostrar QR firmado, escaneo de chofer, historial y descarga del PDF. |
| 24:00–26:00 | 2 min | **Jeremy** | Evidencias · 12 | Mostrar Network, Contributors, PR aprobados, Issues y tablero CCB. |
| 26:00–28:00 | 2 min | **Todos** | Cierre/preguntas · 13 | Una conclusión breve por área y una pregunta corta si el tiempo lo permite. |
| **Total** | **28 min** | **6 integrantes** | **13 diapositivas** | **Cumple rango 20–30 min.** |

## Reparto de tiempo por persona

| Integrante | Tiempo principal | Participación final |
|---|---:|---|
| Juan | 9 min | Conclusión rápida |
| Celeste | 3 min | Conclusión rápida |
| Andrés | 3 min | Conclusión rápida |
| Anahí | 4 min | Conclusión rápida |
| Mateo | 4 min | Conclusión rápida |
| Jeremy | 3 min (1 inicial + 2 evidencias) | Moderación y cierre |
| Todos | — | 2 min compartidos |

## Pautas de exposición por responsable

### Jeremy — 00:00–01:00

> “Buenos días. Presentamos el Sistema de Gestión y Venta de Pasajes Interprovinciales. Mostraremos la necesidad que resuelve, su arquitectura, cómo controlamos los cambios y un recorrido práctico desde la búsqueda del viaje hasta el control del embarque. Al finalizar revisaremos la trazabilidad de las evidencias en GitHub.”

**Acción:** pasar la palabra a Juan a los 00:55.

### Juan — 01:00–10:00

**01:00–04:00:** explicar qué se digitaliza, usuarios por rol, relevancia de rutas, paradas, asientos y tarifas; referir los criterios ANT solamente cuando estén respaldados por el informe.  
**04:00–07:00:** señalar cada componente del diagrama y describir qué información circula de la interfaz a la persistencia.  
**07:00–10:00:** abrir la red Gitflow y las cuatro RFC; explicar quién revisa, cómo se integra a `develop` y por qué una RFC aprobada no es necesariamente una Issue cerrada.

**Transición a Celeste:** “Con esta base, recorramos la experiencia del pasajero”.

### Celeste — 10:00–13:00

**10:00–11:00:** buscar una ruta con datos de prueba.  
**11:00–12:00:** utilizar los filtros implementados y elegir una frecuencia.  
**12:00–13:00:** enseñar la selección del asiento y entregar el contexto a Andrés.

**Plan de contingencia:** si no existen frecuencias disponibles, usar una reserva de prueba previamente preparada o la captura equivalente.

### Andrés — 13:00–16:00

**13:00–14:00:** explicar parada o tramo intermedio.  
**14:00–15:00:** mostrar desglose y resultado del cálculo de la tarifa.  
**15:00–16:00:** validar una categoría de descuento y remarcar controles de negocio, sin inventar cifras normativas.

**Transición:** “Con el valor validado, seguimos al checkout”.

### Anahí — 16:00–20:00

**16:00–17:00:** presentar el resumen de compra y precio final.  
**17:00–18:00:** realizar **una transacción de prueba** en el entorno preparado y mostrar su resultado.  
**18:00–19:00:** abrir el comprobante, siempre que el módulo lo permita.  
**19:00–20:00:** cambiar al usuario oficinista y mostrar el estado/gestión disponible.

**Evitar:** transacciones financieras reales y exposición de datos personales.

### Mateo — 20:00–24:00

**20:00–21:00:** presentar boleto digital y QR firmado.  
**21:00–22:00:** entrar como chofer y verificar lectura de QR válido.  
**22:00–23:00:** abrir historial de boletos desde pasajero.  
**23:00–24:00:** descargar y abrir el PDF para comprobar sus datos y QR.

**Dependencias:** PR [#54](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/54) (escáner) y PR [#58](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/pull/58) (historial/PDF) **fusionados a `develop`**. Sus Issues #34/#35 aparecían abiertas en la verificación del 9 de noviembre de 2026.

### Jeremy — 24:00–26:00

**24:00–25:00:** mostrar Network, Contributors y aprobaciones de PR, sin atribuir revisiones inexistentes.  
**25:00–26:00:** mostrar evidencia de Issues y tablero CCB con las RFC #26–#29, y explicar diferencias de estado.

### Todos — 26:00–28:00

Cada integrante expresa una conclusión en **10–15 segundos** (aprox. 75–90 s para el grupo); Jeremy reserva el tiempo restante para una pregunta o cierre. Si hay ronda formal extensa, coordinarla fuera de los 28 minutos.

## Preparación de la demo

- [ ] Actualizar `develop` en el equipo usado para la presentación y comprobar el build o arranque.
- [ ] Confirmar roles de prueba: pasajero, oficinista, chofer y administrador (si se requiere).
- [ ] Tener una frecuencia, asiento libre, pago de prueba y boleto preparados.
- [ ] Comprobar disponibilidad de cámara, HTTPS/permisos y QR legible.
- [ ] Verificar PDF descargable y visor instalado.
- [ ] Comprobar que no se muestran credenciales, datos reales ni secretos (`QR_SECRET`).
- [ ] Abrir previamente pestañas de Network, Contributors, PR y tablero CCB.
- [ ] Ajustar zoom/resolución y silenciar notificaciones.
- [ ] Registrar video completo y capturas para respaldo.

## Plan B operativo

| Fallo | Acción inmediata | Responsable | Máximo para decisión |
|---|---|---|---:|
| Internet/Supabase no responde | Activar video completo del flujo ya grabado | Jeremy y Mateo | 30 s |
| Cámara/lector QR falla | Mostrar clip del escaneo y capturas de estados válidos/inválidos | Mateo | 20 s |
| No hay frecuencia o asiento | Usar datos de prueba preconfigurados o grabación | Celeste | 20 s |
| Pago/checkout no disponible | Mostrar secuencia grabada y comprobante de prueba | Anahí | 20 s |
| GitHub Projects no carga | Mostrar captura auténtica del tablero y el reporte de auditoría | Jeremy | 20 s |
| Aplicación local sin conexión | Usar grabación/capturas; **no** asumir que Supabase funciona offline | Todos | 30 s |

**Video de respaldo:** [PENDIENTE: enlace al video o ruta local]  
**Carpeta de capturas:** `docs/defensa/recursos/` (adjuntar archivos reales, no imágenes simuladas).  
**Copia del informe:** `docs/informe-uta.md` si está integrada en la rama utilizada, o copia PDF local.

## Registro de ensayo — obligatorio antes de cerrar Issue #38

> Este bloque es una **plantilla pendiente de completar**. No se declara que el ensayo ya ocurrió.

| Campo | Registro |
|---|---|
| Fecha y hora del ensayo | **PENDIENTE** |
| Lugar/modalidad | **PENDIENTE** |
| Integrantes presentes | **PENDIENTE** |
| Duración real total | **PENDIENTE** |
| Búsqueda, filtros y asiento | **PENDIENTE: funciona / falla / observación** |
| Paradas, tarifa y descuentos | **PENDIENTE: funciona / falla / observación** |
| Checkout, comprobante y oficinista | **PENDIENTE: funciona / falla / observación** |
| QR, escáner, historial y PDF | **PENDIENTE: funciona / falla / observación** |
| Video y capturas de respaldo | **PENDIENTE: ubicación y validación** |
| Problemas detectados | **PENDIENTE** |
| Acción correctiva / responsable | **PENDIENTE** |
| Segunda comprobación | **PENDIENTE** |

## Criterios de cierre

- [x] Dos archivos Markdown preparados: `presentacion.md` y `guion.md`.
- [x] Agenda planificada de 28:00, con responsables y tiempos exactos.
- [x] Flujo de demo y plan B documentados.
- [x] PR #54 y PR #58 identificados como fusiones en `develop` (9 nov. 2026).
- [ ] Demo completa realmente comprobada mediante ensayo.
- [ ] Video/capturas reales de Plan B adjuntados y comprobados.
- [ ] Registro de ensayo completado con fecha, observaciones y tiempos medidos.
- [ ] PR a `develop` con `Closes #38` y dos revisiones aprobadas.
