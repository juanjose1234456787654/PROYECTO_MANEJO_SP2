---
name: "Nueva Funcionalidad (Feature)"
about: "Propuesta de una nueva característica o requerimiento funcional"
title: "[FEAT] <módulo>: <descripción de la funcionalidad>"
labels: ["enhancement"]
assignees: ""
---

### 1. Módulo del Sistema
- [ ] auth
- [ ] cooperativas
- [ ] buses
- [ ] frecuencias
- [ ] busqueda
- [ ] ventas
- [ ] pagos
- [ ] boletos
- [ ] escaneo
- [ ] notificaciones
- [ ] configuracion
- [ ] reportes

### 2. Rol Beneficiario
- [ ] admin
- [ ] cooperativa
- [ ] oficinista
- [ ] chofer
- [ ] usuario

### 3. Descripción de la Funcionalidad
¿Qué problema o necesidad resuelve esta funcionalidad?

### 4. Criterios de Aceptación
- [ ] Dado que... Cuando... Entonces...
- [ ] Validación de permisos por rol en RLS / middleware.
- [ ] Componente visual responsivo con Tailwind CSS.

### 5. Elementos de Configuración Afectados
- [ ] Interfaz de Usuario (`src/modules/*` o `src/app/*`)
- [ ] Esquema de Base de Datos (`supabase/schema_supabase.sql`)
- [ ] Políticas RLS
- [ ] Supabase Storage
- [ ] Dependencias (`package.json`)
