-- Configurar políticas RLS para todas las tablas
-- Estas políticas permiten acceso público para el sistema IoT

-- DOOR_EVENTS: Permitir todas las operaciones
DROP POLICY IF EXISTS "public_access_door_events" ON door_events;
CREATE POLICY "public_access_door_events" ON door_events FOR ALL USING (true) WITH CHECK (true);

-- DOOR_STATUS: Permitir todas las operaciones
DROP POLICY IF EXISTS "public_access_door_status" ON door_status;
CREATE POLICY "public_access_door_status" ON door_status FOR ALL USING (true) WITH CHECK (true);

-- AUTHORIZED_USERS: Permitir todas las operaciones
DROP POLICY IF EXISTS "public_access_authorized_users" ON authorized_users;
CREATE POLICY "public_access_authorized_users" ON authorized_users FOR ALL USING (true) WITH CHECK (true);

-- ALERT_CONTACTS: Permitir todas las operaciones
DROP POLICY IF EXISTS "public_access_alert_contacts" ON alert_contacts;
CREATE POLICY "public_access_alert_contacts" ON alert_contacts FOR ALL USING (true) WITH CHECK (true);

-- LOCATIONS: Solo lectura pública
DROP POLICY IF EXISTS "public_read_locations" ON locations;
CREATE POLICY "public_read_locations" ON locations FOR SELECT USING (true);

-- Asegurar que RLS está habilitado
ALTER TABLE door_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE door_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
