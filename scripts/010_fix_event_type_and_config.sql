-- ============================================================
-- 010 – Fix event_type constraint + config RLS para ESP32
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Ampliar el constraint de event_type para incluir power_up / power_down
ALTER TABLE public.door_events
  DROP CONSTRAINT IF EXISTS door_events_event_type_check;

ALTER TABLE public.door_events
  ADD CONSTRAINT door_events_event_type_check
  CHECK (event_type IN (
    'open',
    'close',
    'forced',
    'authorized',
    'unauthorized',
    'power_up',
    'power_down'
  ));

-- 2. Asegurar que la tabla assets tiene política pública de lectura
--    para que el ESP32 pueda consultar /api/config sin autenticación
DROP POLICY IF EXISTS public_read_assets ON public.assets;

CREATE POLICY public_read_assets ON public.assets
  FOR SELECT
  USING (true);

-- Comentario de auditoría
COMMENT ON CONSTRAINT door_events_event_type_check ON public.door_events
  IS 'Tipos de evento válidos incluyendo telemetría de automático (power_up/power_down)';
