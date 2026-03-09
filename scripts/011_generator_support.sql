-- ============================================================
-- 011 – Soporte para Generador
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columnas de generador a la tabla assets
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS asset_type              TEXT    NOT NULL DEFAULT 'door'
    CHECK (asset_type IN ('door', 'generator')),
  ADD COLUMN IF NOT EXISTS fuel_capacity_liters    NUMERIC,          -- Capacidad total del estanque (litros)
  ADD COLUMN IF NOT EXISTS fuel_consumption_lph    NUMERIC,          -- Consumo (litros por hora)
  ADD COLUMN IF NOT EXISTS fuel_alert_threshold_pct NUMERIC DEFAULT 20, -- Alerta cuando queda este % o menos
  ADD COLUMN IF NOT EXISTS last_refill_at          TIMESTAMPTZ;      -- Última recarga de combustible

-- Índice para filtrar por tipo de activo
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(asset_type);

-- 2. Ampliar constraint event_type para incluir fuel_refill
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
    'power_down',
    'fuel_refill'
  ));

COMMENT ON COLUMN public.assets.asset_type              IS 'Tipo de activo: door (tablero) o generator (generador)';
COMMENT ON COLUMN public.assets.fuel_capacity_liters    IS 'Capacidad total del estanque en litros';
COMMENT ON COLUMN public.assets.fuel_consumption_lph    IS 'Consumo estimado en litros por hora';
COMMENT ON COLUMN public.assets.fuel_alert_threshold_pct IS 'Porcentaje mínimo antes de enviar alerta de combustible';
COMMENT ON COLUMN public.assets.last_refill_at          IS 'Timestamp de la última recarga de combustible';
