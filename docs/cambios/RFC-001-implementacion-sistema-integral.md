# Petición de Cambio Formal (RFC / ITIL Change Request)

**Identificador:** RFC-2026-001  
**Título:** Implementación Integral de Módulos Funcionales EcuRutas (v1.0.0)  
**Estado:** Implementado / Pendiente de Aprobación CAB en PR  

---

### 1. Información General de la Solicitud
- **Solicitante:** Juan Carvajal (Líder del Equipo / Configuration Manager)
- **Fecha de Solicitud:** 2026-10-25
- **Rama Asociada:** `feature/sistema-integral-ecurutas`
- **Tipo de Cambio (ITIL):**
  - [x] **Normal** (Nuevas funcionalidades completas, integración de componentes y subrutas con evaluación de riesgo).

---

### 2. Justificación del Cambio
Finalizar la transición desde el scaffolding base hacia una plataforma 100% operativa para el sistema de pasajes interprovinciales EcuRutas (Manejo de Software SP2 - UTA). La solución permite la venta presencial y en línea con cálculo de tarifas VIP y subsidios de ley (50%), emisión y validación de boletos con códigos QR en tiempo real para conductores, administración de flota para cooperativas y gobernanza técnica para administradores.

---

### 3. Elementos de Configuración (CI) Impactados
- [x] **Capa de Dominio**: `src/modules/*` (12 módulos de negocio activados y tipados).
- [x] **Seguridad y Control de Acceso**: `src/middleware.ts` (Autorización de subrutas por rol).
- [x] **Capa de Servicios y Persistencia Híbrida**: `src/lib/services/dataService.ts` y `src/lib/data/mockData.ts`.
- [x] **Vistas de Presentación**: `src/app/` (`/busqueda`, `/pasajero`, `/cooperativa`, `/admin`, `/oficina`, `/chofer`, `/reportes`).
- [x] **Integración Continua (CI)**: `.github/workflows/ci.yml`.
- [x] **Dependencias y Tooling**: `package.json` (adición del script `typecheck`).

---

### 4. Evaluación de Riesgos e Impacto
- **Nivel de Riesgo:** **Bajo a Medio** (Controlado mediante fallback local y tipado estricto en TypeScript).
- **Efectos Secundarios Evaluados:** La capa `dataService` aísla las lecturas de Supabase con fallback local automático, garantizando cero interrupciones por caídas de red o demoras en la ejecución de scripts SQL en la nube.
- **Rendimiento:** Validación de compilación exitosa en Next.js 15 (`19/19` páginas estáticas optimizadas).

---

### 5. Plan de Pruebas y Validación
1. **Verificación de Tipos Estáticos:** Ejecución de `npm run typecheck` (`tsc --noEmit`) sin advertencias ni errores.
2. **Generación del Bundle de Producción:** Ejecución de `npm run build` con todas las rutas y el middleware compilados.
3. **Flujo Pasajero:** Búsqueda en catálogo, selección de asiento VIP, aplicación de descuento del 50% y generación de boleto QR.
4. **Flujo Chofer:** Validación de código QR mediante `dataService.validarBoletoQR` con prevención de abordajes duplicados.
5. **Flujo Oficinista:** Emisión presencial en taquilla y aprobación/rechazo de comprobantes de pago por transferencia.
6. **Flujo Cooperativa y Admin:** Registro de buses, frecuencias, despachos de viaje y asignación de roles de usuario.

---

### 6. Plan de Rollback (Reversión)
En caso de detectarse no conformidades durante la revisión de pares o en la rama `develop`:
1. **Reversión Git:**
   ```powershell
   git revert 48082f6 8250330 7bee4a2 09f47a5 de3cce4
   ```
2. **Persistencia:** Al no haberse alterado destructivamente las tablas de Supabase (todas las modificaciones son aditivas o mediante upsert), no se requiere migración descendente `DOWN`.

---

### 7. Aprobaciones Requeridas (Mínimo 2 aprobaciones para merge)
- [ ] **Revisor 1 (Desarrollador Par / Coordinador):** Jeremy Guaman (@levi06516-ui)
- [ ] **Revisor 2 (Configuration Manager):** Juan Carvajal (@juanjose1234456787654)
