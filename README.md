# EcuRutas - Guía de Ejecución Rápida

Instrucciones para clonar, configurar y ejecutar el proyecto localmente.

---

## 1. Requisitos Previos

- **Node.js**: v20.0.0 o superior (Recomendado v24+)
- **Gestor de paquetes**: `npm` (v10+)
- **Git**

---

## 2. Instalación de Dependencias

Clona el repositorio e instala las dependencias de Node:

```powershell
# Clonar el repositorio
git clone https://github.com/juanjose1234456787654/PROYECTO_MANEJO_SP2.git

# Ingresar al directorio
cd PROYECTO_MANEJO_SP2

# Instalar dependencias
npm install
```

---

## 3. Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto tomando como referencia `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

Edita `.env.local` con las claves de tu proyecto en Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wlhfrmrzrkbdbgpkodds.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_publica_aqui
```

> **Importante:** Nunca agregues la clave `service_role` en `.env.local` ni en el código frontend.

---

## 4. Ejecución en Modo Desarrollo

Inicia el servidor local de Next.js:

```powershell
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

- Ruta principal: `/`
- Inicio de sesión y prueba de conexión: `/login`
- Catálogo público de frecuencias: `/busqueda`

---

## 5. Generación de Tipos de Supabase

Para regenerar automáticamente los tipos TypeScript de la base de datos tras cambios en el esquema:

```powershell
npm run types:supabase
```

---

## 6. Compilación para Producción

Para compilar el proyecto y probar la versión optimizada de producción:

```powershell
# Compilar bundle optimizado
npm run build

# Iniciar servidor de producción
npm run start
```
