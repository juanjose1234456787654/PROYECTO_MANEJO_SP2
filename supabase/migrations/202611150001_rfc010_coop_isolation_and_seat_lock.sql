-- RFC-010: serializa reservas por viaje/asiento y rechaza solapamientos de tramo.
-- Los terminales pueden ser sintéticos; se resuelven respecto a la frecuencia de la ruta.
ALTER TABLE public."Boleto" ADD COLUMN IF NOT EXISTS "paradaOrigenId" text;
ALTER TABLE public."Boleto" ADD COLUMN IF NOT EXISTS "paradaDestinoId" text;
CREATE OR REPLACE FUNCTION public.orden_parada_boleto(p_ruta_id text, p_parada_id text)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_frecuencia_id text;
  v_orden integer;
BEGIN
  SELECT r."frecuenciaId" INTO v_frecuencia_id
  FROM public."Ruta" r WHERE r.id = p_ruta_id;
  IF v_frecuencia_id IS NULL THEN RETURN NULL; END IF;

  SELECT p."orden" INTO v_orden
  FROM public."ParadaFrecuencia" p WHERE p.id = p_parada_id;
  IF v_orden IS NOT NULL THEN RETURN v_orden; END IF;

  IF p_parada_id = 'terminal-origen-' || v_frecuencia_id THEN RETURN 0; END IF;
  IF p_parada_id = 'terminal-destino-' || v_frecuencia_id THEN
    SELECT coalesce(max(p."orden"), 0) + 1 INTO v_orden
    FROM public."ParadaFrecuencia" p WHERE p."frecuenciaId" = v_frecuencia_id;
    RETURN v_orden;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_asiento_boleto_sin_solapamiento()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_inicio integer;
  v_fin integer;
BEGIN
  IF upper(coalesce(NEW."estado", '')) IN ('CANCELADO', 'RECHAZADO') THEN
    RETURN NEW;
  END IF;

  -- Mutex por viaje y asiento: la comprobación y el INSERT quedan serializados.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."rutaId" || ':' || NEW."asiento"::text, 0));

  IF NEW."paradaOrigenId" IS NULL OR NEW."paradaDestinoId" IS NULL THEN
    v_inicio := -2147483648;
    v_fin := 2147483647;
  ELSE
    v_inicio := public.orden_parada_boleto(NEW."rutaId", NEW."paradaOrigenId");
    v_fin := public.orden_parada_boleto(NEW."rutaId", NEW."paradaDestinoId");
    IF v_inicio IS NULL OR v_fin IS NULL OR v_inicio >= v_fin THEN
      RAISE EXCEPTION 'El tramo seleccionado no es válido' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public."Boleto" b
    WHERE b."rutaId" = NEW."rutaId"
      AND b."asiento"::integer = NEW."asiento"::integer
      AND b.id IS DISTINCT FROM NEW.id
      AND upper(coalesce(b."estado", '')) NOT IN ('CANCELADO', 'RECHAZADO')
      AND (
        b."paradaOrigenId" IS NULL OR b."paradaDestinoId" IS NULL
        OR (
          public.orden_parada_boleto(b."rutaId", b."paradaOrigenId") < v_fin
          AND public.orden_parada_boleto(b."rutaId", b."paradaDestinoId") > v_inicio
        )
      )
  ) THEN
    RAISE EXCEPTION 'El asiento % ya está reservado para un tramo que se solapa', NEW."asiento"
      USING ERRCODE = '23505', CONSTRAINT = 'Boleto_asiento_tramo_unico';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS boleto_validar_asiento_sin_solapamiento ON public."Boleto";
CREATE TRIGGER boleto_validar_asiento_sin_solapamiento
BEFORE INSERT OR UPDATE OF "rutaId", "asiento", "estado", "paradaOrigenId", "paradaDestinoId"
ON public."Boleto"
FOR EACH ROW EXECUTE FUNCTION public.validar_asiento_boleto_sin_solapamiento();

CREATE INDEX IF NOT EXISTS "Boleto_ruta_asiento_estado_idx"
  ON public."Boleto" ("rutaId", "asiento", "estado");
CREATE OR REPLACE FUNCTION public.usuario_rol_actual()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT u."rol" FROM public."Usuario" u WHERE u.id = auth.uid()::text LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.usuario_cooperativa_actual()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT u."cooperativaId" FROM public."Usuario" u WHERE u.id = auth.uid()::text LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.usuario_puede_operar_ruta(p_ruta_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.usuario_rol_actual() IN ('admin', 'oficinista')
    OR EXISTS (
      SELECT 1 FROM public."Ruta" r
      JOIN public."Frecuencia" f ON f.id = r."frecuenciaId"
      WHERE r.id = p_ruta_id
        AND ((public.usuario_rol_actual() = 'cooperativa' AND f."cooperativaId" = public.usuario_cooperativa_actual())
          OR (public.usuario_rol_actual() = 'chofer' AND r."choferId" = auth.uid()::text))
    )
$$;

ALTER TABLE public."Usuario" ENABLE ROW LEVEL SECURITY;

-- Elimina políticas previas para que ninguna regla permisiva pueda reabrir
-- el acceso por la regla OR de PostgreSQL.
DO $drop_rfc010_policies$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('Usuario', 'Boleto')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END;
$drop_rfc010_policies$;
DROP POLICY IF EXISTS "Acceso total publico" ON public."Usuario";
DROP POLICY IF EXISTS "usuario_leer_aislado" ON public."Usuario";
DROP POLICY IF EXISTS "usuario_insertar_perfil" ON public."Usuario";
DROP POLICY IF EXISTS "usuario_actualizar_perfil" ON public."Usuario";
DROP POLICY IF EXISTS "usuario_eliminar_admin" ON public."Usuario";
CREATE POLICY "usuario_leer_aislado" ON public."Usuario" FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR public.usuario_rol_actual() = 'admin'
    OR (public.usuario_rol_actual() = 'cooperativa' AND "cooperativaId" = public.usuario_cooperativa_actual()));
CREATE POLICY "usuario_insertar_perfil" ON public."Usuario" FOR INSERT TO authenticated
  WITH CHECK ((id = auth.uid()::text AND rol = 'usuario' AND "cooperativaId" IS NULL)
    OR public.usuario_rol_actual() = 'admin');
CREATE POLICY "usuario_actualizar_perfil" ON public."Usuario" FOR UPDATE TO authenticated
  USING (id = auth.uid()::text OR public.usuario_rol_actual() = 'admin')
  WITH CHECK ((id = auth.uid()::text AND rol = 'usuario' AND "cooperativaId" IS NULL)
    OR public.usuario_rol_actual() = 'admin');
CREATE POLICY "usuario_eliminar_admin" ON public."Usuario" FOR DELETE TO authenticated
  USING (public.usuario_rol_actual() = 'admin');

ALTER TABLE public."Boleto" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total publico" ON public."Boleto";
DROP POLICY IF EXISTS "boleto_leer_por_propietario_o_ruta" ON public."Boleto";
DROP POLICY IF EXISTS "boleto_insertar_autorizado" ON public."Boleto";
DROP POLICY IF EXISTS "boleto_actualizar_autorizado" ON public."Boleto";
DROP POLICY IF EXISTS "boleto_eliminar_admin" ON public."Boleto";
CREATE POLICY "boleto_leer_por_propietario_o_ruta" ON public."Boleto" FOR SELECT TO authenticated
  USING ("pasajeroId" = auth.uid()::text OR public.usuario_puede_operar_ruta("rutaId"));
CREATE POLICY "boleto_insertar_autorizado" ON public."Boleto" FOR INSERT TO authenticated
  WITH CHECK ("pasajeroId" = auth.uid()::text OR public.usuario_puede_operar_ruta("rutaId"));
CREATE POLICY "boleto_actualizar_autorizado" ON public."Boleto" FOR UPDATE TO authenticated
  USING (public.usuario_puede_operar_ruta("rutaId"))
  WITH CHECK (public.usuario_puede_operar_ruta("rutaId"));
CREATE POLICY "boleto_eliminar_admin" ON public."Boleto" FOR DELETE TO authenticated
  USING (public.usuario_rol_actual() = 'admin');

CREATE OR REPLACE FUNCTION public.consultar_asientos_ocupados(p_ruta_id text)
RETURNS TABLE (asiento integer, estado text, "paradaOrigenId" text, "paradaDestinoId" text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT b."asiento"::integer, b."estado", b."paradaOrigenId", b."paradaDestinoId"
  FROM public."Boleto" b
  WHERE b."rutaId" = p_ruta_id
    AND upper(coalesce(b."estado", '')) NOT IN ('CANCELADO', 'RECHAZADO')
$$;
REVOKE ALL ON FUNCTION public.consultar_asientos_ocupados(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consultar_asientos_ocupados(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.usuario_rol_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.usuario_cooperativa_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.usuario_puede_operar_ruta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usuario_rol_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_cooperativa_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_puede_operar_ruta(text) TO authenticated;
