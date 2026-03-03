-- Crear tabla de activos conectados al ESP32
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    door_id TEXT NOT NULL UNIQUE, -- ID único del activo (ej: "ESP32-001")
    custom_name TEXT NOT NULL, -- Nombre personalizado del activo
    location TEXT NOT NULL, -- Ubicación del activo
    board_name TEXT, -- Nombre del tablero ESP32
    description TEXT, -- Descripción opcional
    active BOOLEAN DEFAULT true, -- Si el activo está activo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_assets_door_id ON public.assets(door_id);
CREATE INDEX IF NOT EXISTS idx_assets_location ON public.assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_active ON public.assets(active);

-- Habilitar RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Crear política de acceso público (ajustar según necesidades de seguridad)
DROP POLICY IF EXISTS public_access_assets ON public.assets;
CREATE POLICY public_access_assets ON public.assets
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insertar algunos activos de ejemplo
INSERT INTO public.assets (door_id, custom_name, location, board_name, description)
VALUES 
    ('ESP32-SANTIAGO-01', 'Puerta Principal Santiago', 'Santiago Casa Matriz', 'ESP32-MAIN-01', 'Acceso principal edificio corporativo'),
    ('ESP32-ANTOFAGASTA-01', 'Puerta Entrada Antofagasta', 'Antofagasta', 'ESP32-MAIN-02', 'Puerta de acceso principal'),
    ('ESP32-COQUIMBO-01', 'Puerta Principal Coquimbo', 'Coquimbo', 'ESP32-MAIN-03', 'Acceso sucursal'),
    ('ESP32-CONCEPCION-01', 'Puerta Entrada Concepción', 'Concepción', 'ESP32-MAIN-04', 'Puerta principal'),
    ('ESP32-PMONTT-01', 'Puerta Principal Puerto Montt', 'Puerto Montt', 'ESP32-MAIN-05', 'Acceso principal')
ON CONFLICT (door_id) DO NOTHING;

COMMENT ON TABLE public.assets IS 'Tabla de activos (puertas/sensores) conectados al ESP32';
COMMENT ON COLUMN public.assets.door_id IS 'ID único del activo en el sistema';
COMMENT ON COLUMN public.assets.custom_name IS 'Nombre personalizado asignado por el usuario';
