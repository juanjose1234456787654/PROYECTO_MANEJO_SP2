---
name: "Tarea / Actividad (Segundo Parcial)"
about: "Plantilla estándar para issues de tarea del segundo parcial – PROYECTO_MANEJO_SP2"
title: "[NN/18][Responsable] Código – Nombre de la tarea"
labels: ["tipo:tarea"]
assignees: ""
---

## 📋 Encabezado

| Campo | Valor |
|---|---|
| **Orden** | NN de 18 |
| **Responsable** | @usuario |
| **Fase** | Fase X – Nombre |
| **Rama sugerida** | `feature/<nombre-rama>` |
| **Depende de** | #N (Código) — o "Ninguna – puedes empezar ya" |
| **Bloquea a** | #N (Código) |
| **Prioridad** | Alta / Media / Baja |

> ⚠️ **Antes de cerrar este issue:** confirma que el issue del que dependes ya tiene su PR aprobado y fusionado en `develop`.
>
> 💡 **Trabajo en paralelo:** Puedes empezar usando las interfaces TypeScript y firmas de funciones publicadas por el responsable anterior; integra contra la implementación real cuando se haga merge a `develop`.

---

## 🎯 Objetivo

<!-- 1–2 frases que describan qué se logra al completar esta tarea -->

---

## 🔧 Detalle técnico

<!-- Qué construir, archivos clave y tablas de Supabase involucradas -->

**Archivos a tocar:**
- `src/...`

**Tablas Supabase (PascalCase):**
- `"Tabla1"`, `"Tabla2"`

---

## ✅ Criterios de aceptación

- [ ] Criterio verificable 1
- [ ] Criterio verificable 2
- [ ] Criterio verificable 3

---

## 🏁 Definition of Done

- [ ] Código con tipado estricto TypeScript (sin `any`)
- [ ] Sin imports de `mockData` ni datos hardcodeados
- [ ] Commits con formato `<tipo>(<alcance>): <descripción>`
- [ ] PR hacia `develop` con `Closes #N` y **2 aprobaciones**
- [ ] Capturas o evidencia funcional adjunta
- [ ] Evidencia disponible para el informe técnico UTA

---

## 🌿 Flujo Gitflow

```bash
git checkout develop && git pull origin develop
git checkout -b feature/<nombre-rama>

# … desarrollar …

git add . && git commit -m "feat(<modulo>): <descripción>"
git push origin feature/<nombre-rama>
# Abrir PR hacia develop con: Closes #<número de este issue>
```

---

<details>
<summary>🤖 Prompt para tu IA</summary>

```
<!-- Pega aquí el prompt personalizado para esta tarea -->
```

</details>
