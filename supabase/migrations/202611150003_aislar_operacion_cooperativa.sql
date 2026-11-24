begin;

create function public.administra_cooperativa(id_cooperativa text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.es_superadmin() or exists (
    select 1 from public."Usuario" as u
    where u."id" = auth.uid()::text and u."activo" and u."rol" = 'cooperativa'
      and u."cooperativaId" = id_cooperativa
  );
$$;

revoke all on function public.administra_cooperativa(text) from public;
grant execute on function public.administra_cooperativa(text) to authenticated;

-- Buses y frecuencias tienen un propietario directo. La lectura pública solo
-- incluye registros activos para el catálogo, y la sesión operativa ve su flota.
do $$
declare
  tabla text;
  campo_activo text;
begin
  for tabla, campo_activo in
    select * from (values ('Bus', 'activo'), ('Frecuencia', 'activa')) as recursos(nombre, activo)
  loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('drop policy if exists "Acceso total publico" on public.%I', tabla);
    execute format('create policy catalogo_anonimo on public.%I for select to anon using (%I)', tabla, campo_activo);
    execute format(
      'create policy catalogo_pasajeros on public.%I for select to authenticated
        using (%I and not (select public.actor_tiene_perfil_operativo()))', tabla, campo_activo
    );
    execute format(
      'create policy lectura_cooperativa on public.%I for select to authenticated
        using ("cooperativaId" = (select public.cooperativa_del_actor()))', tabla
    );
    execute format(
      'create policy gestion_cooperativa on public.%I for all to authenticated
        using (public.administra_cooperativa("cooperativaId"))
        with check (public.administra_cooperativa("cooperativaId"))', tabla
    );
  end loop;
end;
$$;

alter table public."ParadaFrecuencia" enable row level security;
drop policy if exists "Acceso total publico" on public."ParadaFrecuencia";
create policy paradas_frecuencia_visible on public."ParadaFrecuencia" for select to anon, authenticated
  using (exists (
    select 1 from public."Frecuencia" as f where f."id" = "ParadaFrecuencia"."frecuenciaId"
  ));
create policy paradas_gestion_frecuencia on public."ParadaFrecuencia" for all to authenticated
  using (exists (
    select 1 from public."Frecuencia" as f
    where f."id" = "ParadaFrecuencia"."frecuenciaId" and public.administra_cooperativa(f."cooperativaId")
  ))
  with check (exists (
    select 1 from public."Frecuencia" as f
    where f."id" = "ParadaFrecuencia"."frecuenciaId" and public.administra_cooperativa(f."cooperativaId")
  ));

alter table public."Ruta" enable row level security;
drop policy if exists "Acceso total publico" on public."Ruta";
create policy rutas_frecuencia_visible on public."Ruta" for select to anon, authenticated
  using (exists (
    select 1 from public."Frecuencia" as f
    join public."Bus" as b on b."id" = "Ruta"."busId" and b."cooperativaId" = f."cooperativaId"
    where f."id" = "Ruta"."frecuenciaId"
  ));
create policy rutas_gestion_frecuencia on public."Ruta" for all to authenticated
  using (exists (
    select 1 from public."Frecuencia" as f
    where f."id" = "Ruta"."frecuenciaId" and public.administra_cooperativa(f."cooperativaId")
  ))
  with check (exists (
    select 1 from public."Frecuencia" as f
    join public."Bus" as b on b."id" = "Ruta"."busId" and b."cooperativaId" = f."cooperativaId"
    where f."id" = "Ruta"."frecuenciaId" and public.administra_cooperativa(f."cooperativaId")
      and ("Ruta"."choferId" is null or exists (
        select 1 from public."Usuario" as u
        where u."id" = "Ruta"."choferId" and u."cooperativaId" = f."cooperativaId"
          and u."rol" in ('chofer', 'personal_bus') and u."activo"
      ))
  ));

alter table public."RegistroParada" enable row level security;
drop policy if exists "Acceso total publico" on public."RegistroParada";
create policy registros_parada_lectura on public."RegistroParada" for select to authenticated
  using (exists (
    select 1 from public."Ruta" as r
    join public."Frecuencia" as f on f."id" = r."frecuenciaId"
    where r."id" = "RegistroParada"."rutaId" and (
      f."cooperativaId" = (select public.cooperativa_del_actor()) or (select public.es_superadmin())
    )
  ));
create policy registros_parada_gestion on public."RegistroParada" for all to authenticated
  using (exists (
    select 1 from public."Ruta" as r
    join public."Frecuencia" as f on f."id" = r."frecuenciaId"
    where r."id" = "RegistroParada"."rutaId" and public.administra_cooperativa(f."cooperativaId")
  ))
  with check (exists (
    select 1 from public."Ruta" as r
    join public."Frecuencia" as f on f."id" = r."frecuenciaId"
    join public."ParadaFrecuencia" as p on p."frecuenciaId" = f."id"
    where r."id" = "RegistroParada"."rutaId" and p."id" = "RegistroParada"."paradaId"
      and public.administra_cooperativa(f."cooperativaId")
  ));

commit;
