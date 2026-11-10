-- ==============================================================================
-- SCRIPT DE CREACIÓN DE USUARIOS DE PRUEBA (SUPABASE AUTH + TABLA "Usuario")
-- Proyecto: EcuRutas (Manejo y Configuración de Software - UTA)
-- ==============================================================================
-- Contraseña para todos los usuarios: Uta2026!
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_uid uuid;
  user_pwd text := crypt('Uta2026!', gen_salt('bf'));
BEGIN

  -- 1. ADMINISTRADOR
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@uta.edu.ec') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated', 
      'admin@uta.edu.ec', user_pwd, 
      now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Administrador General"}', 
      now(), now(), '', ''
    );

    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (new_uid::text, 'admin@uta.edu.ec', 'Administrador Sistema', '1800000001', 'admin', true)
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  -- 2. COOPERATIVA
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cooperativa@uta.edu.ec') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated', 
      'cooperativa@uta.edu.ec', user_pwd, 
      now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Gerente Cooperativa"}', 
      now(), now(), '', ''
    );

    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (new_uid::text, 'cooperativa@uta.edu.ec', 'Gerente Cooperativa Ambato', '1800000002', 'cooperativa', true)
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  -- 3. OFICINISTA
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'oficina@uta.edu.ec') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated', 
      'oficina@uta.edu.ec', user_pwd, 
      now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Oficinista Boletería"}', 
      now(), now(), '', ''
    );

    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (new_uid::text, 'oficina@uta.edu.ec', 'Oficinista Taquilla', '1800000003', 'oficinista', true)
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  -- 4. CHOFER
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'chofer@uta.edu.ec') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated', 
      'chofer@uta.edu.ec', user_pwd, 
      now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Conductor de Unidad"}', 
      now(), now(), '', ''
    );

    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (new_uid::text, 'chofer@uta.edu.ec', 'Chofer Asignado', '1800000004', 'chofer', true)
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  -- 5. PASAJERO / CLIENTE
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pasajero@uta.edu.ec') THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated', 
      'pasajero@uta.edu.ec', user_pwd, 
      now(), '{"provider":"email","providers":["email"]}', '{"nombre":"Pasajero Frecuente"}', 
      now(), now(), '', ''
    );

    INSERT INTO "Usuario" ("id", "email", "nombre", "cedula", "rol", "activo")
    VALUES (new_uid::text, 'pasajero@uta.edu.ec', 'Pasajero Prueba', '1800000005', 'usuario', true)
    ON CONFLICT ("id") DO NOTHING;
  END IF;

END $$;
