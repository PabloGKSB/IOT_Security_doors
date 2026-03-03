-- Script para limpiar eventos y datos de prueba
-- ADVERTENCIA: Este script borrará TODOS los eventos y contactos de alerta

-- Eliminar todas las referencias en door_status primero
UPDATE public.door_status
SET last_event_id = NULL;

-- Eliminar todos los eventos
DELETE FROM public.door_events;

-- Eliminar todos los contactos de alerta
DELETE FROM public.alert_contacts;

-- Eliminar todos los usuarios autorizados (si existe la tabla)
DELETE FROM public.authorized_users;

-- Reiniciar el estado de las puertas
UPDATE public.door_status
SET is_open = false,
    last_updated = now(),
    last_event_id = NULL;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente. Todos los eventos y contactos han sido eliminados.' as mensaje;
