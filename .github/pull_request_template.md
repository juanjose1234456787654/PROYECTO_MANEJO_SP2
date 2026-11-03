## 🔗 Issue o RFC que Cierra
Closes #<!-- Número del Issue o RFC asociado, ej. Closes #12 -->

---

## 📌 Resumen del Cambio
Descripción clara y concisa de qué introduce este Pull Request y cuál es su objetivo.

---

## 🏷️ Tipo de Cambio
- [ ] `feat`: Nueva funcionalidad
- [ ] `fix`: Corrección de error
- [ ] `docs`: Documentación o plantillas de configuración
- [ ] `style`: Formato o estilos visuales (sin cambio de lógica)
- [ ] `refactor`: Refactorización de código (sin cambio funcional)
- [ ] `test`: Pruebas unitarias o de integración
- [ ] `chore`: Mantenimiento o dependencias
- [ ] `ci`: Integración continua / GitHub Actions

---

## 🌿 Rama Destino
- [ ] `develop` (Para todas las ramas `feature/*`, `docs/*` o `chore/*`)
- [ ] `main` (Exclusivo para liberaciones estables desde `develop` o `hotfix/*`)

---

## 🛠️ Elementos de Configuración Modificados
- [ ] Módulo en `src/modules/<nombre>`
- [ ] Páginas / Rutas en `src/app/`
- [ ] Componentes compartidos en `src/components/`
- [ ] Servicios / Cliente Supabase (`src/lib/`)
- [ ] Middleware / Autenticación (`src/middleware.ts`)
- [ ] Esquema de Base de Datos o RLS (`supabase/`)
- [ ] Documentación / Gobernanza (`docs/`, `.github/`, `CONTRIBUTING.md`, `CITATION.cff`)

---

## ✅ Lista de Verificación (Definición de Terminado)
- [ ] La rama fue creada desde `develop` actualizada (`git checkout -b feature/...`).
- [ ] Los commits siguen el formato obligatorio `<tipo>(<alcance>): <descripción>`.
- [ ] No se modificó código ajeno al módulo asignado ni se incluye `mockData`.
- [ ] Tipado estricto TypeScript verificado (`npx tsc --noEmit` sin errores y cero `any`).
- [ ] Ejecución local de `npm run build` completada con éxito.
- [ ] Se verificado que no se exponen credenciales (`service_role` ni `QR_SECRET`).
- [ ] Se adjuntan capturas de pantalla o evidencia funcional para el informe técnico UTA.

---

## 📸 Capturas o Evidencia Funcional
<!-- Adjunta aquí capturas de pantalla o salida de terminal que demuestren el funcionamiento -->

---

## 👥 Recordatorio de Revisión (Regla Gitflow: Mínimo 2 Aprobaciones)
> ⚠️ **Importante:** Este Pull Request requiere obligatoriamente **al menos 2 aprobaciones** de integrantes del equipo antes de fusionarse en `develop` o `main`.

- [ ] Revisor 1 (@usuario): Aprobado
- [ ] Revisor 2 (@usuario): Aprobado
