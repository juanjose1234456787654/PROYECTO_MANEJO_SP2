-- 1. Tabla de Grupos de Buses
CREATE TABLE "GrupoBus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT
);

-- 2. Tabla de Grupos de Frecuencias
CREATE TABLE "GrupoFrecuencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT
);

-- 3. Tabla de Cooperativas
CREATE TABLE "Cooperativa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "ruc" TEXT NOT NULL UNIQUE,
    "telefono" TEXT,
    "direccion" TEXT,
    "logoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Usuarios
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL UNIQUE,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "cooperativaId" TEXT,
    CONSTRAINT "Usuario_cooperativaId_fkey" FOREIGN KEY ("cooperativaId") REFERENCES "Cooperativa"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Tabla de Buses
CREATE TABLE "Bus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cooperativaId" TEXT NOT NULL,
    "grupoBusId" TEXT,
    "numero" TEXT NOT NULL UNIQUE,
    "placa" TEXT NOT NULL UNIQUE,
    "chasis" TEXT NOT NULL,
    "carroceria" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "capacidad" INTEGER NOT NULL,
    "asientosVIP" INTEGER NOT NULL DEFAULT 0,
    "asientosVIPNumeros" TEXT NOT NULL DEFAULT '',
    "diasParada" TEXT NOT NULL DEFAULT '',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Bus_cooperativaId_fkey" FOREIGN KEY ("cooperativaId") REFERENCES "Cooperativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bus_grupoBusId_fkey" FOREIGN KEY ("grupoBusId") REFERENCES "GrupoBus"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 6. Tabla de Frecuencias
CREATE TABLE "Frecuencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cooperativaId" TEXT NOT NULL,
    "grupoFrecuenciaId" TEXT,
    "resolucionANT" TEXT,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "tipoViaje" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duracion" INTEGER,
    "precioBase" DOUBLE PRECISION,
    "preciosPorTramo" TEXT,
    CONSTRAINT "Frecuencia_cooperativaId_fkey" FOREIGN KEY ("cooperativaId") REFERENCES "Cooperativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Frecuencia_grupoFrecuenciaId_fkey" FOREIGN KEY ("grupoFrecuenciaId") REFERENCES "GrupoFrecuencia"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 7. Tabla de Paradas de Frecuencia
CREATE TABLE "ParadaFrecuencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "frecuenciaId" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    CONSTRAINT "ParadaFrecuencia_frecuenciaId_fkey" FOREIGN KEY ("frecuenciaId") REFERENCES "Frecuencia"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8. Tabla de Rutas
CREATE TABLE "Ruta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "frecuenciaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "busId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "inicio" TIMESTAMP(3),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "precio" DOUBLE PRECISION,
    "choferId" TEXT,
    CONSTRAINT "Ruta_frecuenciaId_fkey" FOREIGN KEY ("frecuenciaId") REFERENCES "Frecuencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ruta_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ruta_choferId_fkey" FOREIGN KEY ("choferId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 9. Tabla de Boletos
CREATE TABLE "Boleto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rutaId" TEXT NOT NULL,
    "pasajeroId" TEXT NOT NULL,
    "asiento" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipoPasajero" TEXT NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "comprobanteUrl" TEXT,
    "estado" TEXT NOT NULL,
    "qrUrl" TEXT,
    "vendidoPor" TEXT,
    "vendidoPorChoferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Boleto_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Boleto_pasajeroId_fkey" FOREIGN KEY ("pasajeroId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Boleto_vendidoPorChoferId_fkey" FOREIGN KEY ("vendidoPorChoferId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 10. Tabla de Registros de Parada
CREATE TABLE "RegistroParada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rutaId" TEXT NOT NULL,
    "paradaId" TEXT NOT NULL,
    "llegada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroParada_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroParada_paradaId_fkey" FOREIGN KEY ("paradaId") REFERENCES "ParadaFrecuencia"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 11. Tabla de Configuración de la App
CREATE TABLE "ConfiguracionApp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreApp" TEXT NOT NULL DEFAULT 'Sistema de Pasajes Interprovinciales',
    "logoUrl" TEXT,
    "colorPrimaria" TEXT NOT NULL DEFAULT '#1E3A8A',
    "colorSecundaria" TEXT NOT NULL DEFAULT '#3B82F6',
    "redesSociales" TEXT,
    "soporteEmail" TEXT,
    "soporteTelefono" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Índices de rendimiento
CREATE INDEX "Ruta_choferId_idx" ON "Ruta"("choferId");

-- Políticas de acceso público RLS para desarrollo
CREATE POLICY "Acceso total publico" ON "Usuario" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "Cooperativa" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "Bus" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "GrupoBus" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "Frecuencia" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "GrupoFrecuencia" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "ParadaFrecuencia" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "Ruta" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "Boleto" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "RegistroParada" FOR ALL USING (true);
CREATE POLICY "Acceso total publico" ON "ConfiguracionApp" FOR ALL USING (true);