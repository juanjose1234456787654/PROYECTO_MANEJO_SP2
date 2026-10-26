---
name: "Petición de Cambio (RFC / ITIL Change Request)"
about: "Solicitud formal de modificación a elementos de configuración existentes"
title: "[RFC] <alcance>: <motivo del cambio>"
labels: ["change-request", "itil"]
assignees: ""
---

### 1. Información General de la Solicitud
- **Solicitante**: 
- **Fecha de Solicitud**: 
- **Tipo de Cambio (ITIL)**: 
  - [ ] Estándar (Rutinario preaprobado)
  - [ ] Normal (Requiere evaluación y 2 aprobaciones)
  - [ ] Mayor / Crítico (Impacto en esquema BD, RLS o middleware)
  - [ ] Emergencia (Hotfix inmediato)

### 2. Justificación del Cambio
¿Por qué es necesario este cambio y qué impacto tiene si no se implementa?

### 3. Elementos de Configuración (CI) Impactados
- [ ] Esquema SQL / Migración (`supabase/schema_supabase.sql`)
- [ ] Tipos TypeScript (`src/types/database.types.ts`)
- [ ] Middleware / Reglas de Acceso (`src/middleware.ts`)
- [ ] Dependencias (`package.json`)
- [ ] Módulo específico: 

### 4. Evaluación de Riesgos e Impacto
- **Nivel de Riesgo**: [Bajo / Medio / Alto]
- **Posibles efectos secundarios**: 

### 5. Plan de Pruebas
¿Cómo se verificará que el cambio funciona correctamente sin romper otros módulos?

### 6. Plan de Rollback (Reversión)
En caso de fallo en `develop` o `main`, ¿cuál es el procedimiento exacto para revertir el cambio?
- Script SQL inverso (`DOWN`):
- Procedimiento Git (`git revert`):

### 7. Aprobaciones Requeridas (Mínimo 2 aprobadores)
- [ ] Revisor 1 (Desarrollador par): 
- [ ] Revisor 2 (Configuration Manager / Tech Lead): 
