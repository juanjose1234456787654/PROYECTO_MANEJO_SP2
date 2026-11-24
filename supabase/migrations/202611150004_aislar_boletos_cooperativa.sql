begin;

alter table public."Boleto" enable row level security;
drop policy if exists "Acceso total publico" on public."Boleto";

create policy boleto_superadmin on public."Boleto" for all to authenticated
  using ((select public.es_superadmin()))
  with check ((select public.es_superadmin()));

create policy boleto_pasajero_lectura on public."Boleto" for select to authenticated
  using (
    "pasajeroId" = (select auth.uid())::text
    and not (select public.actor_tiene_perfil_operativo())
  );

create policy boleto_pasajero_compra on public."Boleto" for insert to authenticated
  with check (
    "pasajeroId" = (select auth.uid())::text
    and not (select public.actor_tiene_perfil_operativo())
    and exists (
      select 1 from public."Ruta" as r where r."id" = "Boleto"."rutaId"
    )
  );

create policy boleto_cooperativa_lectura on public."Boleto" for select to authenticated
  using (exists (
    select 1 from public."Ruta" as r
    join public."Frecuencia" as f on f."id" = r."frecuenciaId"
    where r."id" = "Boleto"."rutaId"
      and f."cooperativaId" = (select public.cooperativa_del_actor())
  ));

create policy boleto_cooperativa_edicion on public."Boleto" for update to authenticated
  using (exists (
    select 1 from public."Ruta" as r
    join public."Frecuencia" as f on f."id" = r."frecuenciaId"
    where r."id" = "Boleto"."rutaId"
      and f."cooperativaId" = (select public.cooperativa_del_actor())
  ))
  with check (exists (
    select 1 from public."Ruta" as r
    join public."Frecuencia" as f on f."id" = r."frecuenciaId"
    where r."id" = "Boleto"."rutaId"
      and f."cooperativaId" = (select public.cooperativa_del_actor())
      and ("Boleto"."vendidoPorChoferId" is null or exists (
        select 1 from public."Usuario" as u
        where u."id" = "Boleto"."vendidoPorChoferId"
          and u."cooperativaId" = f."cooperativaId"
          and u."rol" in ('chofer', 'personal_bus')
      ))
  ));

-- El mapa público de asientos solo necesita los tramos y el número de asiento.
create function public.consultar_ocupacion_ruta(id_ruta text)
returns table (asiento integer, "paradaOrigenId" text, "paradaDestinoId" text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when b."asiento"::text ~ '^[0-9]{1,5}$' then b."asiento"::integer end,
    to_jsonb(b) ->> 'paradaOrigenId',
    to_jsonb(b) ->> 'paradaDestinoId'
  from public."Boleto" as b
  join public."Ruta" as r on r."id" = b."rutaId"
  join public."Frecuencia" as f on f."id" = r."frecuenciaId"
  join public."Bus" as bus on bus."id" = r."busId" and bus."cooperativaId" = f."cooperativaId"
  where r."id" = id_ruta
    and b."asiento"::text ~ '^[0-9]{1,5}$'
    and lower(b."estado") not in ('cancelado', 'rechazado')
    and (
      public.es_superadmin()
      or f."cooperativaId" = public.cooperativa_del_actor()
      or (f."activa" and bus."activo" and not public.actor_tiene_perfil_operativo())
    );
$$;

revoke all on function public.consultar_ocupacion_ruta(text) from public;
grant execute on function public.consultar_ocupacion_ruta(text) to anon, authenticated;

commit;
