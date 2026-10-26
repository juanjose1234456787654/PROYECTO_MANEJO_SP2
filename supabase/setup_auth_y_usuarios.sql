-- ==============================================================================
-- SCRIPT DE INICIALIZACIÓN DE AUTENTICACIÓN Y USUARIOS (EJECUTAR EN SUPABASE)
-- ==============================================================================

-- 1. Quitar NOT NULL de la columna password en Usuario (ya que la clave va en auth.users)
ALTER TABLE IF EXISTS "Usuario" ALTER COLUMN "password" DROP NOT NULL;

-- 2. Confirmar cualquier usuario que esté pendiente de verificación de email
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- 3. Habilitar extensión de cifrado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Crear los 5 usuarios de prueba (Contraseña para todos: Uta2026!)
DO $$
DECLARE
  pwd text := crypt('Uta2026!', gen_salt('bf'));
  uid_admin uuid := gen_random_uuid();
  uid_coop uuid := gen_random_uuid();
  uid_ofi uuid := gen_random_uuid();
  uid_chof uuid := gen_random_uuid();
  uid_pas uuid := gen_random_uuid();
BEGIN

  -- A) ADMIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@uta.edu.ec') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid_admin, 'authenticated', 'authenticated', 
      'admin@uta.edu.ec', pwd, now(), 
      '{"provider":"email","providers":["email"]}', '{"nombre":"Administrador General"}', 
      now(), now(), '', ''
    );
    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (uid_admin::text, 'admin@uta.edu.ec', 'Administrador General UTA', '1800000001', 'admin', true)
    ON CONFLICT ("id") DO UPDATE SET "rol" = 'admin', "activo" = true;
  ELSE
    UPDATE auth.users SET encrypted_password = pwd, email_confirmed_at = now() WHERE email = 'admin@uta.edu.ec';
    UPDATE "Usuario" SET "rol" = 'admin', "activo" = true WHERE email = 'admin@uta.edu.ec';
  END IF;

  -- B) COOPERATIVA
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cooperativa@uta.edu.ec') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid_coop, 'authenticated', 'authenticated', 
      'cooperativa@uta.edu.ec', pwd, now(), 
      '{"provider":"email","providers":["email"]}', '{"nombre":"Gerente Cooperativa Ambato"}', 
      now(), now(), '', ''
    );
    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (uid_coop::text, 'cooperativa@uta.edu.ec', 'Gerente Cooperativa Ambato', '1800000002', 'cooperativa', true)
    ON CONFLICT ("id") DO UPDATE SET "rol" = 'cooperativa', "activo" = true;
  ELSE
    UPDATE auth.users SET encrypted_password = pwd, email_confirmed_at = now() WHERE email = 'cooperativa@uta.edu.ec';
    UPDATE "Usuario" SET "rol" = 'cooperativa', "activo" = true WHERE email = 'cooperativa@uta.edu.ec';
  END IF;

  -- C) OFICINISTA
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'oficina@uta.edu.ec') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid_ofi, 'authenticated', 'authenticated', 
      'oficina@uta.edu.ec', pwd, now(), 
      '{"provider":"email","providers":["email"]}', '{"nombre":"Oficinista Boletería"}', 
      now(), now(), '', ''
    );
    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (uid_ofi::text, 'oficina@uta.edu.ec', 'Oficinista Ventanilla', '1800000003', 'oficinista', true)
    ON CONFLICT ("id") DO UPDATE SET "rol" = 'oficinista', "activo" = true;
  ELSE
    UPDATE auth.users SET encrypted_password = pwd, email_confirmed_at = now() WHERE email = 'oficina@uta.edu.ec';
    UPDATE "Usuario" SET "rol" = 'oficinista', "activo" = true WHERE email = 'oficina@uta.edu.ec';
  END IF;

  -- D) CHOFER
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'chofer@uta.edu.ec') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid_chof, 'authenticated', 'authenticated', 
      'chofer@uta.edu.ec', pwd, now(), 
      '{"provider":"email","providers":["email"]}', '{"nombre":"Chofer Conductor"}', 
      now(), now(), '', ''
    );
    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (uid_chof::text, 'chofer@uta.edu.ec', 'Chofer Conductor', '1800000004', 'chofer', true)
    ON CONFLICT ("id") DO UPDATE SET "rol" = 'chofer', "activo" = true;
  ELSE
    UPDATE auth.users SET encrypted_password = pwd, email_confirmed_at = now() WHERE email = 'chofer@uta.edu.ec';
    UPDATE "Usuario" SET "rol" = 'chofer', "activo" = true WHERE email = 'chofer@uta.edu.ec';
  END IF;

  -- E) PASAJERO / CLIENTE
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pasajero@uta.edu.ec') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid_pas, 'authenticated', 'authenticated', 
      'pasajero@uta.edu.ec', pwd, now(), 
      '{"provider":"email","providers":["email"]}', '{"nombre":"Pasajero Viajero"}', 
      now(), now(), '', ''
    );
    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (uid_pas::text, 'pasajero@uta.edu.ec', 'Pasajero Viajero', '1800000005', 'usuario', true)
    ON CONFLICT ("id") DO UPDATE SET "rol" = 'usuario', "activo" = true;
  ELSE
    UPDATE auth.users SET encrypted_password = pwd, email_confirmed_at = now() WHERE email = 'pasajero@uta.edu.ec';
    UPDATE "Usuario" SET "rol" = 'usuario', "activo" = true WHERE email = 'pasajero@uta.edu.ec';
  END IF;

END $$;
