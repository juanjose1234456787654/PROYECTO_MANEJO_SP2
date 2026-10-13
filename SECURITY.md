# Política de Seguridad - PROYECTO_MANEJO_SP2

## Reportar Vulnerabilidades de Seguridad

Si descubres una vulnerabilidad de seguridad en PROYECTO_MANEJO_SP2, **por favor NO la publiques en issues públicos**. En su lugar:

### 📧 Contacto de Seguridad

1. **Envía un correo a**: carvajaljayaj85@gmail.com
2. **Asunto**: `[SECURITY] Vulnerabilidad en PROYECTO_MANEJO_SP2`
3. **Incluye**:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de solución (si las tienes)

### ⏱️ Tiempo de Respuesta

Nos comprometemos a:

- **24 horas**: Reconocer el reporte
- **48 horas**: Evaluación inicial
- **7 días**: Plan de remediación
- **14 días**: Parche o corrección (cuando sea posible)

### 🔒 Confidencialidad

- El reporte será tratado de forma confidencial
- Solo lo conocerán los miembros del equipo de seguridad
- No se publicará hasta que se haya aplicado la corrección
- Se te acreditará en el aviso de seguridad (si lo deseas)

---

## Prácticas de Seguridad del Proyecto

### 🔐 Autenticación y Autorización

- **NextAuth.js**: Implementación segura de autenticación
- **Contraseñas**: Almacenadas con hash seguro (bcrypt)
- **Sesiones**: Tokens JWT con expiración controlada
- **Roles**: Control de acceso basado en roles (RBAC)
  - `ADMIN`: Acceso total al sistema
  - `OFICINISTA`: Gestión de rutas, asignaciones y ventas
  - `CHOFER`: Operación y seguimiento de rutas
  - `CLIENTE`: Consulta y compra de pasajes

### 📊 Base de Datos y Backend (Supabase)

- **PostgreSQL + Supabase**: Base de datos relacional robusta y escalable administrada con Supabase
- **Row Level Security (RLS)**: Políticas estrictas a nivel de fila activas en todas las tablas para control de acceso por rol
- **Manejo Seguro de API Keys**: Llave anónima (`anon key`) restringida mediante RLS; llave de servicio (`service_role key`) nunca expuesta en cliente ni committeada
- **Variables de Entorno**: Credenciales y URLs de conexión almacenadas exclusivamente en `.env.local` y excluidas en `.gitignore`
- **Migrations**: Control de versiones de esquemas y scripts SQL versionados mediante Supabase CLI
- **Backups**: Respaldos automáticos gestionados directamente en Supabase

### 🔗 APIs

- **Validación de Entrada**: Todos los endpoints validan datos mediante esquemas
- **Rate Limiting**: Protección contra ataques de fuerza bruta y saturación
- **CORS**: Configurado restrictivamente para el origen permitido
- **HTTPS**: Obligatorio en entornos de despliegue y producción
- **Headers de Seguridad**: Implementación de encabezados seguros (CSP, HSTS, X-Content-Type)

### 🖼️ Archivos y Media

- **Cloudinary / Storage Seguro**: Almacenamiento seguro de comprobantes y archivos
- **Validación de Tipo**: Solo extensiones e imágenes permitidas (MIME-type check)
- **Límite de Tamaño**: Máximo 2 MB por archivo
- **Sanitización de Nombres**: Prevención de rutas maliciosas (path traversal)

### 💳 Pagos y Transacciones

- **No Almacenar PCI**: No guardar números completos ni CVV de tarjetas
- **Validación de Transacciones**: Verificación rigurosa de comprobantes de pago
- **Logs Seguros**: Enmascaramiento de datos sensibles en bitácoras

### 🚀 Deployment

- **Variables de Entorno**: `.env.local` y `.env` excluidos en `.gitignore`
- **Secretos**: Gestión segura mediante GitHub Secrets y variables del servidor
- **Actualizaciones**: Mantener dependencias y runtime actualizados
- **Monitoreo**: Auditoría y registro de accesos y errores anómalos

---

## Dependencias y Vulnerabilidades

### Verificación Regular

```bash
# Auditar dependencias
npm audit

# Actualizar dependencias de forma segura
npm update
```

### Políticas de Actualización

- **Patches de Seguridad (X.Y.Z)**: Actualizar inmediatamente tras notificación
- **Minor Updates (X.Y)**: Actualizar y probar dentro de 1 semana
- **Major Updates (X)**: Evaluar impacto, probar en rama independiente y planificar

---

## Checklist de Seguridad Pre-Producción

Antes de desplegar a producción:

- [ ] Todas las variables sensibles configuradas en variables de entorno seguras
- [ ] `console.log` y funciones de debug removidas del código fuente
- [ ] Dependencias auditadas sin vulnerabilidades críticas (`npm audit`)
- [ ] HTTPS forzado y certificado TLS válido
- [ ] CORS configurado restrictivamente
- [ ] Rate limiting implementado en rutas críticas (login, auth, APIs públicas)
- [ ] Logs de seguridad y auditoría configurados sin datos sensibles
- [ ] Backup de base de datos planificado y verificado
- [ ] Plan de respuesta ante incidentes documentado y compartido con el equipo

---

## Códigos de Error Seguros

**No exponer información sensible, trazas de pila o detalles internos en mensajes de error:**

❌ **Incorrecto**:
```
Error: Usuario no encontrado. Usuario ID: 123 en BD: production_db (SQL Query failed at line 42)
```

✅ **Correcto**:
```
Error: No se pudo procesar su solicitud. Por favor verifique los datos o intente más tarde.
```

---

## Contactos de Seguridad del Equipo

| Rol | Nombre | GitHub | Email |
|-----|--------|--------|-------|
| Líder del Proyecto / Backend | Juan Carvajal | @juanjose1234456787654 | carvajaljayaj85@gmail.com |
| Responsable de Seguridad | Juan Carvajal | @juanjose1234456787654 | carvajaljayaj85@gmail.com |

---

## Referencias de Seguridad

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/security)
- [PostgreSQL Security Documentation](https://www.postgresql.org/docs/current/security.html)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)

---

## Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 12-10-2026 | Versión inicial básica |
| 1.1 | 13-10-2026 | Estructuración completa profesional, prácticas por capas, checklist y contactos |

---

**Última actualización**: 13 de octubre de 2026  
**Vigencia**: A partir del 13 de octubre de 2026