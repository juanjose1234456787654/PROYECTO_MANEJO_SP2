## Pull Request ITIL 4 hacia `main`

- **ID de RFC:** `RFC-XXX`
- **Issue de GitHub:** Closes #
- **Ticket de Jira:** `GDCS-X`
- **Tipo de Cambio ITIL:** [ ] Normal (CAB) | [ ] Estándar (Preaprobado) | [ ] Emergencia (ECAB)

### Resumen del Cambio
Describe brevemente qué implementa o corrige este PR y qué CIs fueron modificados.

### Checklist ITIL 4 (Obligatorio antes del Merge a `main`)
- [ ] El título y los commits incluyen el ID de la RFC (`RFC-XXX: ...`).
- [ ] Autorización registrada (Acta CAB / Procedimiento Estándar / Acta ECAB).
- [ ] Plan de pruebas ejecutado y evidenciado (capturas o salida de pruebas).
- [ ] Plan de rollback documentado en la RFC.
- [ ] `npm run typecheck` y `npm run lint` pasan sin errores.
- [ ] Aprobación explícita del Change Manager (Dev 1 — Juan José Carvajal Jaya).

### Post-Merge (Release Manager)
- [ ] Etiqueta de versión (`vX.Y.Z-rfcXXX`) creada sobre `main`.
- [ ] Verificación en `main` con `git log --oneline --graph` y `git show <tag>`.
- [ ] PIR registrado y CMDB actualizada.
