begin;

create function public.crear_cooperativa_con_administrador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alta jsonb := new.raw_app_meta_data -> 'alta_cooperativa';
begin
  if alta is null then
    return new;
  end if;

  insert into public."Cooperativa" ("id", "nombre", "ruc", "telefono", "direccion")
  values (alta ->> 'id', alta ->> 'nombre', alta ->> 'ruc', alta ->> 'telefono', alta ->> 'direccion');

  insert into public."Usuario" ("id", "email", "password", "nombre", "cedula", "rol", "cooperativaId")
  values (
    new.id::text, new.email, '[managed_by_supabase_auth]', new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'cedula', 'cooperativa', alta ->> 'id'
  );

  return new;
end;
$$;

revoke all on function public.crear_cooperativa_con_administrador() from public, anon, authenticated;

create trigger alta_cooperativa_en_auth
after insert on auth.users
for each row
execute function public.crear_cooperativa_con_administrador();

create function public.alta_cooperativa_habilitada()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'alta_cooperativa_en_auth'
      and tgenabled in ('O', 'A')
  );
$$;

revoke all on function public.alta_cooperativa_habilitada() from public, anon, authenticated;
grant execute on function public.alta_cooperativa_habilitada() to service_role;

commit;
