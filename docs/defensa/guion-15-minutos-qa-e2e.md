# ⏱️ Guión Cronometrado de 15 Minutos y Matriz de Pruebas E2E (ECU-6)

**Jira Ticket:** [ECU-6](https://carvajaljayaj85-1792511955739.atlassian.net/browse/ECU-6) · **GitHub Issue:** [#70](https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2/issues/70)  
**Responsable de QA y Taquilla:** Mateo Morales (Dev 6 · [@SebastianM-M](https://github.com/SebastianM-M))  
**Proyecto:** Sistema de Gestión y Venta de Pasajes Interprovinciales (EcuRutas / Ambato Express)  
**Duración Total Planificada:** 15:00 minutos exactos sin margen de error.

---

## 🕒 1. Cronograma Minuto a Minuto de la Demostración (15:00 min)

| Intervalo | Duración | Módulo / Sección | Rol en Vivo | Acciones Demostrativas Clave |
|---|---:|---|---|---|
| **00:00 – 02:00** | 2:00 min | **Apertura y Arquitectura** | Coordinador / Mateo | Introducción del problema resuelto, gobernanza ITIL, stack técnico (Next.js 15, Supabase, TypeScript estricto) y flujo Gitflow. |
| **02:00 – 04:30** | 2:30 min | **Buscador y Selección 2D** | Cliente / Pasajero | Filtros dinámicos por cooperativa, tramos intermedios proporcionales ANT y selección interactiva de asientos VIP/Normal. |
| **04:30 – 07:30** | 3:00 min | **Venta Directa en Taquilla** | Oficinista (Ventanilla) | Apertura de `/busqueda?modo=taquilla`, validación de formulario vacío, ingreso de cédula, pago en efectivo/transferencia sin comprobante, aprobación inmediata y visor con QR nítido e impresión directa. |
| **07:30 – 10:00** | 2:30 min | **Panel de Ventanilla y Gestión** | Oficinista (`/oficina`) | Revisión de pestaña *Aprobación de Comprobantes* (con URL firmada y doble validación) y pestaña *Historial de Taquilla* con reimpresión de QR. |
| **10:00 – 12:30** | 2:30 min | **Abordaje y Control en Ruta** | Chofer (`/chofer`) | Escaneo de código QR en andén mediante cámara/lector, validación de firma criptográfica y actualización del estado a *EMBARCADO*. |
| **12:30 – 14:00** | 1:30 min | **Casillero y Descarga PDF** | Pasajero (`/pasajero`) | Navegación a *Mi Casillero de Boletos*, visualización del pase de abordar actualizado y exportación limpia a PDF con QR de alta definición. |
| **14:00 – 15:00** | 1:00 min | **Auditoría ITIL y Cierre** | Administrador (`/reportes`) | Métricas SACM en tiempo real, trazabilidad de cambios (RFCs y PRs) y conclusiones finales. |

---

## 🎬 2. Pautas de Exposición y Guión del Presentador

### Bloque 1: Apertura y Gobernanza (00:00 – 02:00)
> *"Buenos días, estimado docente y compañeros. Presentamos la versión definitiva del Sistema EcuRutas. Nuestro objetivo fue erradicar los procesos manuales y la falta de trazabilidad en el transporte interprovincial ecuatoriano. Todo el desarrollo se gestionó bajo lineamientos ITIL, GitFlow y TypeScript con cero errores de compilación y cero advertencias de dev mode."*

### Bloque 2: Búsqueda y Reglas ANT (02:00 – 04:30)
> *"Iniciamos con el pasajero. El sistema calcula tarifas proporcionales por tramos de paradas intermedias conforme a las normativas de la Agencia Nacional de Tránsito (ANT). Al seleccionar la frecuencia, el mapa interactivo bloquea en tiempo real los asientos ocupados para evitar sobreventas."*

### Bloque 3: Flujo de Taquilla Directa Oficinista (04:30 – 07:30)
> *"Pasamos al módulo de Taquilla asignado a Mateo Morales (Dev 6, Issue #70). El oficinista atiende en ventanilla: el formulario de pasajero inicia siempre VACÍO (sin mezclar los datos del usuario logueado). Si el cliente paga por transferencia o efectivo, el oficinista verifica en el instante, por lo que NO se exige subir archivos ni comprobantes. Al confirmar, el boleto pasa directamente a estado Aprobado y se genera el pase de abordar con QR nítido listo para impresión térmica o estándar."*

### Bloque 4: Ventanilla e Historial (07:30 – 10:00)
> *"En el panel `/oficina`, el oficinista dispone de dos vistas: Aprobación de transferencias hechas en línea por clientes web, y el Historial completo de ventas en taquilla, donde puede reimprimir cualquier boleto en caso de pérdida por parte del usuario."*

### Bloque 5: Abordaje y Verificación Chofer (10:00 – 12:30)
> *"Al llegar la hora de salida, el chofer escanea el código QR desde la unidad. El sistema valida el hash de seguridad y cambia el estado del pasajero a EMBARCADO, impidiendo que el mismo boleto sea utilizado dos veces."*

### Bloque 6: Cierre y Auditoría ITIL (12:30 – 15:00)
> *"Finalmente, el pasajero puede consultar su Casillero de Boletos Digitales y descargar su PDF, mientras que el Administrador supervisa los reportes de calidad ITIL y métricas de despacho."*

---

## 🧪 3. Matriz de Pruebas de Regresión End-to-End (E2E)

| ID | Módulo Probado | Caso de Prueba | Entrada / Acción | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|:---:|
| **CP-01** | **Taquilla** | Formulario vacío por defecto en ventanilla | Ingreso a `/busqueda?modo=taquilla` logueado como oficinista | Los campos de nombres y cédula inician completamente vacíos | Campos vacíos listos para digitar | **APROBADO** |
| **CP-02** | **Taquilla** | Pago por transferencia sin comprobante | Selección de asiento y método *Transferencia* en ventanilla | No exige subir archivo, referencia es opcional y aprueba inmediatamente | Boleto pasa a `COMPLETADO` al instante | **APROBADO** |
| **CP-03** | **Taquilla** | Impresión directa y botón para siguiente boleto | Clic en confirmar compra en ventanilla | Muestra visor con QR nítido, botón de imprimir (`window.print`) y botón *+ Vender Siguiente Boleto* | Impresión y reseteo sin salir ni login | **APROBADO** |
| **CP-04** | **Oficina** | Pestañas de Comprobantes e Historial | Navegación a `/oficina` | Permite alternar entre comprobantes pendientes e historial de taquilla con buscador | Pestañas operativas y fluidas | **APROBADO** |
| **CP-05** | **Búsqueda** | Cálculo de tarifas intermedias ANT | Selección de tramo intermedio (ej. Ambato - Baños) | Tarifa proporcional según distancia y paradas legales | Cálculo exacto según matriz ANT | **APROBADO** |
| **CP-06** | **Navegación** | Casillero de boletos sin enlaces 404 | Clic en *Mi Casillero de Boletos* | Redirección exitosa a `/pasajero` mostrando el listado de pases | Cero errores 404 ni rutas rotas | **APROBADO** |
| **CP-07** | **Calidad QA** | Cero errores issues en dev mode | Ejecución de `npm run typecheck` y `npm run lint` | Cero errores de TypeScript y advertencias de hidratación resueltas | Build y tipado 100% limpio | **APROBADO** |

---

## 📋 4. Plan de Contingencia para la Presentación
- **Si falla la conexión a internet en el aula:** Supabase cuenta con soporte en cache y modo local con datos sembrados mediante `dataService.seedSupabase()`.
- **Si no hay cámara en la laptop del chofer:** Se utiliza la entrada manual del código del boleto (`ECU-...`) en el módulo `/chofer`.
- **Tiempo de reserva:** 1 minuto de holgura final reservado para preguntas del jurado calificador.
