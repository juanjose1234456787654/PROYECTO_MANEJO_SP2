## 📌 Resumen del Cambio
Descripción clara de qué introduce este Pull Request y cuál es su objetivo.

Closes #<!-- Número del Issue o RFC asociado, ej. Closes #12 -->

---

## 🌿 Rama Destino
- [ ] `develop` (Para nuevas funcionalidades o mejoras regulares)
- [ ] `main` (Solo para releases estables o hotfixes de emergencia)

---

## 🛠️ Elementos de Configuración Modificados
- [ ] Módulo en `src/modules/<nombre>`
- [ ] Rutas en `src/app/`
- [ ] Componentes compartidos en `src/components/`
- [ ] Middleware / Autenticación (`src/middleware.ts`)
- [ ] Esquema de Base de Datos o RLS (`supabase/`)
- [ ] Dependencias / Configuración (`package.json`, `.env.example`)

---

## 🧪 Pruebas Realizadas
- [ ] Ejecución local de `npm run build` sin errores de compilación ni TypeScript.
- [ ] Prueba de interfaz responsiva en navegador.
- [ ] Verificación de permisos por rol (RLS y Middleware).
- [ ] Verificación de no exposición de la clave `service_role`.

---

## ✅ Checklist de Control de Calidad
- [ ] El título del PR sigue el formato `<tipo>(<alcance>): <descripción corta>` (ej. `feat(buses): agregar selector de pisos`).
- [ ] El código no contiene `console.log` innecesarios ni datos confidenciales.
- [ ] Se actualizaron los tipos en `src/types/database.types.ts` si hubo cambios en la base de datos.
- [ ] Se documentó el cambio en la carpeta `/docs` si modifica la arquitectura o flujos.

---

## 👥 Aprobaciones Obligatorias (Regla: Mínimo 2 aprobadores)
- [ ] Revisor 1 (@usuario): Aprobado
- [ ] Revisor 2 (@usuario): Aprobado