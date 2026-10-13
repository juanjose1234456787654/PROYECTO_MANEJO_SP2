# 🔄 Flujos de Proceso del Sistema

Este documento describe las secuencias operativas principales del **Sistema de Gestión y Venta de Pasajes Interprovinciales**.

---

## 🎟️ Flujo 1: Compra y Emisión de Boleto Digital

1. **Búsqueda:** El cliente ingresa ciudad de origen, destino y fecha de viaje.
2. **Selección:** El sistema consulta las frecuencias disponibles y despliega el mapa de asientos en tiempo real.
3. **Reserva Temporal:** Se bloquea el asiento seleccionado durante 5 minutos para evitar compras simultáneas.
4. **Validación y Pago:** 
   - Si aplica descuento (tercera edad / discapacidad), el usuario adjunta el soporte requerido.
   - Se valida la transacción de pago.
5. **Emisión:** El sistema genera el boleto digital con código QR de verificación.

---

## 🚌 Flujo 2: Abordaje y Verificación en Unidad de Bus

1. El pasajero presenta el código QR desde su dispositivo o boleto impreso al abordar.
2. El chofer o asistente escanea el código QR desde la aplicación móvil/web.
3. El sistema valida el estado del boleto (*VÁLIDO / YA UTILIZADO / CANCELADO*).
4. Se actualiza la lista de pasajeros a bordo (*Trazabilidad en tiempo real*).