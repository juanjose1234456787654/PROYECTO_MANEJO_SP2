begin;

-- Los perfiles anteriores sin vínculo quedan bloqueados en la aplicación.
-- Validar esta restricción tras asignarlos a la cooperativa correcta.
alter table public."Usuario"
  add constraint usuario_cooperativa_requiere_vinculo
  check ("rol" <> 'cooperativa' or nullif(btrim("cooperativaId"), '') is not null)
  not valid;

create function public.es_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol' = 'superadmin', false)
    and exists (
      select 1 from public."Usuario" as u
      where u."id" = auth.uid()::text and u."activo" and u."rol" = 'admin'
    );
$$;

create function public.cooperativa_del_actor()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u."cooperativaId" from public."Usuario" as u
  where u."id" = auth.uid()::text and u."activo"
    and u."rol" in ('cooperativa', 'oficinista', 'chofer', 'personal_bus');
$$;

create function public.actor_tiene_perfil_operativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public."Usuario" as u
    where u."id" = auth.uid()::text
      and u."rol" in ('admin', 'cooperativa', 'oficinista', 'chofer', 'personal_bus')
  );
$$;

revoke all on function public.es_superadmin() from public;
revoke all on function public.cooperativa_del_actor() from public;
revoke all on function public.actor_tiene_perfil_operativo() from public;
grant execute on function public.es_superadmin() to authenticated;
grant execute on function public.cooperativa_del_actor() to authenticated;
grant execute on function public.actor_tiene_perfil_operativo() to authenticated;

alter table public."Usuario" enable row level security;
drop policy if exists "Acceso total publico" on public."Usuario";
create policy usuario_perfil_propio on public."Usuario" for select to authenticated
  using ("id" = (select auth.uid())::text);
create policy usuario_equipo_cooperativa on public."Usuario" for select to authenticated
  using ("cooperativaId" = (select public.cooperativa_del_actor()));
create policy usuario_superadmin on public."Usuario" for all to authenticated
  using ((select public.es_superadmin()))
  with check ((select public.es_superadmin()));
create policy usuario_alta_pasajero on public."Usuario" for insert to authenticated
  with check (
    "id" = (select auth.uid())::text and "rol" = 'usuario'
    and "cooperativaId" is null and "activo"
    and lower("email") = lower((select auth.jwt()) ->> 'email')
  );

alter table public."Cooperativa" enable row level security;
drop policy if exists "Acceso total publico" on public."Cooperativa";
create policy cooperativa_catalogo_anonimo on public."Cooperativa" for select to anon
  using ("activo");
create policy cooperativa_catalogo_pasajeros on public."Cooperativa" for select to authenticated
  using ("activo" and not (select public.actor_tiene_perfil_operativo()));
create policy cooperativa_lectura_propia on public."Cooperativa" for select to authenticated
  using ("id" = (select public.cooperativa_del_actor()));
create policy cooperativa_superadmin on public."Cooperativa" for all to authenticated
  using ((select public.es_superadmin()))
  with check ((select public.es_superadmin()));
create policy cooperativa_edicion_propia on public."Cooperativa" for update to authenticated
  using (
    "id" = (select public.cooperativa_del_actor()) and exists (
      select 1 from public."Usuario" as u
      where u."id" = (select auth.uid())::text and u."rol" = 'cooperativa' and u."activo"
    )
  )
  with check (
    "id" = (select public.cooperativa_del_actor()) and exists (
      select 1 from public."Usuario" as u
      where u."id" = (select auth.uid())::text and u."rol" = 'cooperativa' and u."activo"
    )
  );

create function public.restringir_edicion_perfil_cooperativa()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not public.es_superadmin()
    and (to_jsonb(new) - array['nombre', 'telefono', 'direccion', 'logoUrl', 'colorPrimaria', 'colorSecundaria'])
      is distinct from
        (to_jsonb(old) - array['nombre', 'telefono', 'direccion', 'logoUrl', 'colorPrimaria', 'colorSecundaria'])
  then
    raise exception 'Solo se pueden modificar los campos del perfil de la cooperativa'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger restringir_edicion_perfil_cooperativa
before update on public."Cooperativa"
for each row
execute function public.restringir_edicion_perfil_cooperativa();

commit;
