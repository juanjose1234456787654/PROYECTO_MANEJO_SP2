# Especificación de Requisitos del Sistema (SRS)

Requisitos funcionales y no funcionales para la plataforma **EcuRutas** (Manejo y Configuración de Software - UTA).

---

## 1. Requisitos Funcionales por Rol

### 1.1 Administrador General (`admin`)
- **RF-ADM-01**: Gestionar cooperativas de transporte (creación, edición de razón social, RUC, teléfono, estado activo/inactivo).
- **RF-ADM-02**: Administrar usuarios del sistema y asignar roles exactos (`admin`, `cooperativa`, `oficinista`, `usuario`, `chofer`).
- **RF-ADM-03**: Modificar parámetros institucionales en la tabla `"ConfiguracionApp"` (nombre de la app, logotipo, paleta de colores, canales de soporte).
- **RF-ADM-04**: Visualizar métricas globales y reportes de desempeño de todas las cooperativas.

### 1.2 Encargado de Cooperativa (`cooperativa`)
- **RF-COP-01**: Administrar la flota de buses de su cooperativa (placa, chasis, marca, capacidad, asignación de asientos VIP y fotos).
- **RF-COP-02**: Configurar frecuencias de viaje (resolución ANT, ciudad origen, ciudad destino, hora de salida, duración y precio base).
- **RF-COP-03**: Definir la hoja de ruta con paradas intermedias (`"ParadaFrecuencia"`) y tarifas por tramo.
- **RF-COP-04**: Generar rutas con fecha específica asignando unidad (`"Bus"`) y conductor (`"Usuario"` con rol `chofer`).

### 1.3 Personal de Ventanilla (`oficinista`)
- **RF-OFI-01**: Venta y emisión presencial de boletos en taquilla seleccionando asientos disponibles.
- **RF-OFI-02**: Validar o rechazar comprobantes de transferencia bancaria cargados por pasajeros en el bucket `"comprobantes"`.
- **RF-OFI-03**: Aplicar descuentos legalmente autorizados (tercera edad, discapacidad, menores de edad) al emitir pasajes.

### 1.4 Conductor / Ayudante (`chofer`)
- **RF-CHO-01**: Visualizar la hoja de ruta del viaje en curso y la lista de pasajeros esperados.
- **RF-CHO-02**: Escaneo del código QR del boleto mediante la cámara del dispositivo (`html5-qrcode`).
- **RF-CHO-03**: Registrar la confirmación de abordaje actualizando automáticamente el campo `"abordadoAt"` en `"Boleto"`.
- **RF-CHO-04**: Registrar la llegada a paradas intermedias en la tabla `"RegistroParada"`.

### 1.5 Pasajero / Cliente (`usuario`)
- **RF-PAS-01**: Búsqueda pública de rutas y frecuencias filtrando por ciudad de origen, destino y fecha.
- **RF-PAS-02**: Visualización interactiva del mapa de asientos del bus (distinguiendo normales y VIP).
- **RF-PAS-03**: Selección de método de pago y carga de comprobante digital en formato de imagen/PDF.
- **RF-PAS-04**: Acceso a su casillero personal de boletos digitales con generación dinámica del código QR (`qrcode.react`).

---

## 2. Requisitos No Funcionales (RNF)

- **RNF-01 (Seguridad)**: Todas las transacciones en base de datos deben regirse por **Row Level Security (RLS)**. Los pasajeros solo pueden consultar sus propios boletos y perfil.
- **RNF-02 (Rendimiento)**: Respuestas del cliente web y verificación de abordaje por QR menores a 1.5 segundos en redes móviles estándar.
- **RNF-03 (Compatibilidad)**: Interfaz responsiva con diseño optimizado para smartphones (choferes y pasajeros) y computadoras de escritorio (oficinistas y administradores).
- **RNF-04 (Trazabilidad)**: Todo cambio en el estado del boleto (`emitido`, `pagado`, `abordado`, `cancelado`) debe mantener marca de tiempo y autor de la modificación.
- **RNF-05 (Integridad)**: Unicidad estricta de asignación de asiento por ruta (`"Boleto_asiento_unico"`) para evitar sobreventas concurrentes.
