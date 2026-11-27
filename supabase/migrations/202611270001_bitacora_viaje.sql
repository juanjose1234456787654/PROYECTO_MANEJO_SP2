-- ==============================================================================
-- MIGRACIÓN RFC-006: Bitácora de Viaje y Campos de Abordaje/QR
-- Ticket Jira: GDCS-2 / ECU-8 (Issue #74)
-- Responsable: Andrés Toasa (@The-Fabry - Dev 3)
-- ==============================================================================

-- 1. Asegurar campos canónicos de abordaje y venta a bordo en "Boleto"
ALTER TABLE public."Boleto"
  ADD COLUMN IF NOT EXISTS "codigoQr" TEXT,
  ADD COLUMN IF NOT EXISTS "abordadoAt" TIMESTAMP(3) WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "paradaOrigenId" TEXT,
  ADD COLUMN IF NOT EXISTS "paradaDestinoId" TEXT,
  ADD COLUMN IF NOT EXISTS "pasajeroNombre" TEXT,
  ADD COLUMN IF NOT EXISTS "pasajeroCedula" TEXT;

-- 2. Asegurar campos de control de viaje en "Ruta"
ALTER TABLE public."Ruta"
  ADD COLUMN IF NOT EXISTS "inicio" TIMESTAMP(3) WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "fin" TIMESTAMP(3) WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "completada" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "choferId" TEXT REFERENCES public."Usuario"("id") ON DELETE SET NULL;

-- 3. Tabla "BitacoraViaje" para auditoría operativa y trazabilidad en ruta
CREATE TABLE IF NOT EXISTS public."BitacoraViaje" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rutaId" TEXT NOT NULL,
    "choferId" TEXT,
    "evento" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "paradaId" TEXT,
    "kilometraje" DOUBLE PRECISION,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "BitacoraViaje_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES public."Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BitacoraViaje_choferId_fkey" FOREIGN KEY ("choferId") REFERENCES public."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BitacoraViaje_paradaId_fkey" FOREIGN KEY ("paradaId") REFERENCES public."ParadaFrecuencia"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BitacoraViaje_evento_check" CHECK ("evento" IN ('INICIO_VIAJE', 'ESCALA_PARADA', 'VENTA_A_BORDO', 'INCIDENCIA', 'FIN_VIAJE', 'REVISION_TECNICA'))
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS "idx_bitacora_rutaId" ON public."BitacoraViaje"("rutaId");
CREATE INDEX IF NOT EXISTS "idx_bitacora_choferId" ON public."BitacoraViaje"("choferId");
CREATE INDEX IF NOT EXISTS "idx_bitacora_fechaHora" ON public."BitacoraViaje"("fechaHora" DESC);

-- 4. Políticas de Seguridad RLS en "BitacoraViaje"
ALTER TABLE public."BitacoraViaje" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bitacora_leer_autorizados" ON public."BitacoraViaje";
DROP POLICY IF EXISTS "bitacora_insertar_autorizados" ON public."BitacoraViaje";
DROP POLICY IF EXISTS "bitacora_actualizar_admin" ON public."BitacoraViaje";
DROP POLICY IF EXISTS "bitacora_eliminar_admin" ON public."BitacoraViaje";

CREATE POLICY "bitacora_leer_autorizados" ON public."BitacoraViaje"
  FOR SELECT TO authenticated
  USING (
    "choferId" = auth.uid()::text
    OR public.usuario_rol_actual() IN ('admin', 'cooperativa')
    OR public.usuario_puede_operar_ruta("rutaId")
  );

CREATE POLICY "bitacora_insertar_autorizados" ON public."BitacoraViaje"
  FOR INSERT TO authenticated
  WITH CHECK (
    "choferId" = auth.uid()::text
    OR public.usuario_rol_actual() IN ('admin', 'cooperativa')
    OR public.usuario_puede_operar_ruta("rutaId")
  );

CREATE POLICY "bitacora_actualizar_admin" ON public."BitacoraViaje"
  FOR UPDATE TO authenticated
  USING (public.usuario_rol_actual() = 'admin');

CREATE POLICY "bitacora_eliminar_admin" ON public."BitacoraViaje"
  FOR DELETE TO authenticated
  USING (public.usuario_rol_actual() = 'admin');

-- 5. Concesión de Permisos a Roles Públicos y Autenticados
GRANT SELECT, INSERT ON TABLE public."BitacoraViaje" TO authenticated;
GRANT SELECT ON TABLE public."BitacoraViaje" TO anon;
