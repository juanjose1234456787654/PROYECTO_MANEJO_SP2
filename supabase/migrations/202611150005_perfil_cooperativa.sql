begin;

alter table public."Cooperativa"
  add column "colorPrimaria" text,
  add column "colorSecundaria" text,
  add constraint cooperativa_color_primario_hex
    check ("colorPrimaria" is null or "colorPrimaria" ~ '^#[0-9a-fA-F]{6}$'),
  add constraint cooperativa_color_secundario_hex
    check ("colorSecundaria" is null or "colorSecundaria" ~ '^#[0-9a-fA-F]{6}$');

commit;
