-- Script para limpiar completamente la base de datos
-- PRECAUCIÓN: Esto eliminará TODOS los datos

-- Eliminar todas las políticas RLS existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END$$;

-- Eliminar todos los datos de las tablas
TRUNCATE TABLE door_events CASCADE;
TRUNCATE TABLE door_status CASCADE;
TRUNCATE TABLE authorized_users CASCADE;
TRUNCATE TABLE alert_contacts CASCADE;
TRUNCATE TABLE locations CASCADE;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos limpiada exitosamente';
END$$;
