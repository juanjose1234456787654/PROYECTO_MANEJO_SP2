begin;

create function public.normalizar_nombre_catalogo(valor text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select btrim(regexp_replace(valor, '[[:space:]]+', ' ', 'g'));
$$;

create table public."MarcaBus" (
  "nombre" text primary key,
  constraint marca_bus_nombre_canonico check (
    "nombre" = public.normalizar_nombre_catalogo("nombre")
    and char_length("nombre") > 0
    and lower("nombre") <> 'hinos'
  )
);
create unique index marca_bus_nombre_unico on public."MarcaBus" (lower("nombre"));

create table public."CarroceriaBus" (
  "nombre" text primary key,
  constraint carroceria_bus_nombre_canonico check (
    "nombre" = public.normalizar_nombre_catalogo("nombre")
    and char_length("nombre") > 0
  )
);
create unique index carroceria_bus_nombre_unico on public."CarroceriaBus" (lower("nombre"));

-- Las opciones conocidas tienen prioridad sobre sus variantes históricas.
insert into public."MarcaBus" ("nombre")
values ('Hino'), ('Mercedes-Benz'), ('Scania'), ('Yutong'), ('Sin especificar');
insert into public."CarroceriaBus" ("nombre")
values ('Varycca Doble Piso'), ('Marcopolo Paradiso G7'), ('Carrocerías Picosa'),
       ('Yutong Bus'), ('Cepeda Interprovincial'), ('Sin especificar');

-- Conservar etiquetas históricas y unificar variantes de espacios y mayúsculas.
insert into public."MarcaBus" ("nombre")
select distinct on (lower(nombre)) nombre
from (
  select case
    when lower(public.normalizar_nombre_catalogo("marca")) in ('hino', 'hinos') then 'Hino'
    else coalesce(nullif(public.normalizar_nombre_catalogo("marca"), ''), 'Sin especificar')
  end as nombre from public."Bus"
) as marcas
order by lower(nombre), nombre
on conflict do nothing;

insert into public."CarroceriaBus" ("nombre")
select distinct on (lower(nombre)) nombre
from (
  select coalesce(nullif(public.normalizar_nombre_catalogo("carroceria"), ''), 'Sin especificar') as nombre
  from public."Bus"
) as carrocerias
order by lower(nombre), nombre
on conflict do nothing;

update public."Bus" as b set "marca" = m."nombre"
from public."MarcaBus" as m
where lower(m."nombre") = case
  when lower(public.normalizar_nombre_catalogo(b."marca")) = 'hinos' then 'hino'
  else lower(coalesce(nullif(public.normalizar_nombre_catalogo(b."marca"), ''), 'Sin especificar'))
end and b."marca" is distinct from m."nombre";

update public."Bus" as b set "carroceria" = c."nombre"
from public."CarroceriaBus" as c
where lower(c."nombre") = lower(coalesce(nullif(public.normalizar_nombre_catalogo(b."carroceria"), ''), 'Sin especificar'))
  and b."carroceria" is distinct from c."nombre";

alter table public."Bus"
  alter column "marca" set not null,
  alter column "carroceria" set not null,
  add constraint bus_marca_catalogo_fk foreign key ("marca")
    references public."MarcaBus" ("nombre") on update cascade on delete restrict,
  add constraint bus_carroceria_catalogo_fk foreign key ("carroceria")
    references public."CarroceriaBus" ("nombre") on update cascade on delete restrict;

create index bus_marca_catalogo_idx on public."Bus" ("marca");
create index bus_carroceria_catalogo_idx on public."Bus" ("carroceria");

do $$
declare tabla text;
begin
  foreach tabla in array array['MarcaBus', 'CarroceriaBus']
  loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tabla);
    execute format('create policy catalogo_lectura on public.%I for select to authenticated using (true)', tabla);
    execute format(
      'create policy catalogo_gestion on public.%I for all to authenticated
        using ((select public.es_superadmin()))
        with check ((select public.es_superadmin()))', tabla
    );
  end loop;
end;
$$;

commit;
