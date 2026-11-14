---
name: Solicitud de Cambio (RFC - ITIL 4)
about: Plantilla oficial para registrar Cambios Normales, Estándar o de Emergencia hacia MAIN
title: "[RFC-XXX] Título breve del cambio"
labels: ["tipo:rfc"]
assignees: []
---

## 1. Identificación de la RFC
- **ID de RFC:** `RFC-XXX`
- **Ticket Jira vinculado:** `GDCS-X` (pegar URL de Jira)
- **Tipo ITIL:** [ ] Cambio Normal (CAB) | [ ] Cambio Estándar (Preaprobado) | [ ] Cambio de Emergencia (ECAB)
- **Solicitante:** 
- **Responsable de Implementación:** 
- **Prioridad:** [ ] Crítica | [ ] Alta | [ ] Media | [ ] Baja
- **Elementos de Configuración (CIs) afectados:** (rutas de archivos, tablas BD, servicios)

## 2. Descripción y Justificación de Negocio
- ¿Qué cambia y por qué es necesario?

## 3. Evaluación de Impacto y Riesgo
- **Probabilidad:** Baja / Media / Alta
- **Impacto:** Bajo / Medio / Alto / Crítico
- **Dependencias con otras RFC:** 

## 4. Plan de Implementación, Pruebas y Rollback
- **Rama:** `feature/RFC-XXX-descripcion` (o `hotfix/RFC-XXX-descripcion`)
- **Plan de pruebas:**
- **Plan de rollback:** (pasos exactos para revertir si falla en `main`)

## 5. Criterios de Aceptación (Dado / Cuando / Entonces)
- **Dado** ..., **cuando** ..., **entonces** ...

## 6. Checklist ITIL 4 (Obligatorio antes de cerrar)
- [ ] Autorizado por CAB / Catálogo Estándar / ECAB
- [ ] Commits con prefijo `RFC-XXX: ...`
- [ ] `npm run typecheck` y `npm run lint` en 0 errores
- [ ] Pull Request aprobado por el Change Manager (Dev 1) hacia `main`
- [ ] Tag de release generado y verificado con `git log` / `git show`
- [ ] PIR completado y CMDB actualizada
