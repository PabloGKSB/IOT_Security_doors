-- Script de limpieza completa y recreación de políticas RLS
-- Versión 2 - Solución al error de políticas duplicadas

-- Primero, deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS public.door_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.authorized_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alert_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.door_events DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de door_status
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'door_status'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.door_status', pol.policyname);
    END LOOP;
END $$;

-- Eliminar TODAS las políticas existentes de authorized_users
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'authorized_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.authorized_users', pol.policyname);
    END LOOP;
END $$;

-- Eliminar TODAS las políticas existentes de alert_contacts
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'alert_contacts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.alert_contacts', pol.policyname);
    END LOOP;
END $$;

-- Eliminar TODAS las políticas existentes de door_events
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'door_events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.door_events', pol.policyname);
    END LOOP;
END $$;

-- Ahora crear las nuevas políticas

-- door_events (acceso completo público)
ALTER TABLE public.door_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_door_events"
  ON public.door_events FOR SELECT
  USING (true);

CREATE POLICY "public_insert_door_events"
  ON public.door_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public_update_door_events"
  ON public.door_events FOR UPDATE
  USING (true);

CREATE POLICY "public_delete_door_events"
  ON public.door_events FOR DELETE
  USING (true);

-- door_status (acceso completo público)
ALTER TABLE public.door_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_door_status"
  ON public.door_status FOR SELECT
  USING (true);

CREATE POLICY "public_insert_door_status"
  ON public.door_status FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public_update_door_status"
  ON public.door_status FOR UPDATE
  USING (true);

CREATE POLICY "public_delete_door_status"
  ON public.door_status FOR DELETE
  USING (true);

-- authorized_users (acceso completo público)
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_authorized_users"
  ON public.authorized_users FOR SELECT
  USING (true);

CREATE POLICY "public_insert_authorized_users"
  ON public.authorized_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public_update_authorized_users"
  ON public.authorized_users FOR UPDATE
  USING (true);

CREATE POLICY "public_delete_authorized_users"
  ON public.authorized_users FOR DELETE
  USING (true);

-- alert_contacts (acceso completo público)
ALTER TABLE public.alert_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_alert_contacts"
  ON public.alert_contacts FOR SELECT
  USING (true);

CREATE POLICY "public_insert_alert_contacts"
  ON public.alert_contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public_update_alert_contacts"
  ON public.alert_contacts FOR UPDATE
  USING (true);

CREATE POLICY "public_delete_alert_contacts"
  ON public.alert_contacts FOR DELETE
  USING (true);

-- Confirmar que todo está bien
DO $$
BEGIN
  RAISE NOTICE '✓ Políticas RLS limpiadas y recreadas exitosamente';
  RAISE NOTICE '✓ Todas las tablas tienen acceso público completo';
END $$;
