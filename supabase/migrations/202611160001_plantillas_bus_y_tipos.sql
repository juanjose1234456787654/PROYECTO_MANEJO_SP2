-- ==============================================================================
-- MIGRACIÓN: Tabla PlantillaBus y extensiones para Bus (Ticket ECU-3 / #67)
-- Sistema: EcuRutas - Universidad Técnica de Ambato
-- Responsable: Andrés Toasa (@The-Fabry, Dev 3)
-- ==============================================================================

-- 1. Crear tabla PlantillaBus si no existe
CREATE TABLE IF NOT EXISTS public."PlantillaBus" (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    "tipoBus" TEXT NOT NULL CHECK ("tipoBus" IN ('URBANO', 'INTERPROVINCIAL')),
    pisos INTEGER NOT NULL DEFAULT 1 CHECK (pisos IN (1, 2)),
    "capacidadTotal" INTEGER NOT NULL CHECK ("capacidadTotal" > 0),
    "configuracionJson" JSONB NOT NULL,
    "esGlobal" BOOLEAN NOT NULL DEFAULT true,
    "cooperativaId" TEXT REFERENCES public."Cooperativa"(id) ON DELETE CASCADE,
    activo BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para búsqueda eficiente de plantillas
CREATE INDEX IF NOT EXISTS "idx_plantillabus_coop" ON public."PlantillaBus"("cooperativaId");
CREATE INDEX IF NOT EXISTS "idx_plantillabus_activo" ON public."PlantillaBus"(activo);
CREATE INDEX IF NOT EXISTS "idx_plantillabus_tipobus" ON public."PlantillaBus"("tipoBus");

-- RLS en PlantillaBus
ALTER TABLE public."PlantillaBus" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PlantillaBus' AND policyname = 'Plantillas visibles para todos'
    ) THEN
        CREATE POLICY "Plantillas visibles para todos" 
        ON public."PlantillaBus" FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PlantillaBus' AND policyname = 'Gestion de plantillas autenticados'
    ) THEN
        CREATE POLICY "Gestion de plantillas autenticados" 
        ON public."PlantillaBus" FOR ALL 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. Extender tabla Bus con nuevas columnas para plantillas y tipo
ALTER TABLE public."Bus" 
    ADD COLUMN IF NOT EXISTS "tipoBus" TEXT DEFAULT 'INTERPROVINCIAL' CHECK ("tipoBus" IN ('URBANO', 'INTERPROVINCIAL')),
    ADD COLUMN IF NOT EXISTS "plantillaId" TEXT REFERENCES public."PlantillaBus"(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "distribucionAsientos" JSONB;

-- 3. Crear índice UNIQUE para disco por cooperativa (si no existe)
-- Evita números de disco duplicados dentro de la misma operadora
CREATE UNIQUE INDEX IF NOT EXISTS "Bus_coop_numero_uidx" 
ON public."Bus"("cooperativaId", "numero");

-- 4. Constraint CHECK en numero de disco (1 a 9999) y formato placa (3 letras + 4 dígitos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Bus_numero_rango_check'
    ) THEN
        ALTER TABLE public."Bus" 
        ADD CONSTRAINT "Bus_numero_rango_check" 
        CHECK (numero >= 1 AND numero <= 9999);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Bus_placa_formato_check'
    ) THEN
        ALTER TABLE public."Bus" 
        ADD CONSTRAINT "Bus_placa_formato_check" 
        CHECK (placa ~ '^[A-Z]{3}-[0-9]{4}$');
    END IF;
END $$;
