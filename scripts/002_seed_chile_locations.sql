-- Insertar ubicaciones de Chile si no existen

INSERT INTO locations (id, name, country, region, timezone, created_at)
VALUES 
  (gen_random_uuid(), 'SANTIAGO CASA MATRIZ', 'Chile', 'Metropolitana', 'America/Santiago', NOW()),
  (gen_random_uuid(), 'ANTOFAGASTA', 'Chile', 'Antofagasta', 'America/Santiago', NOW()),
  (gen_random_uuid(), 'COQUIMBO', 'Chile', 'Coquimbo', 'America/Santiago', NOW()),
  (gen_random_uuid(), 'CONCEPCION', 'Chile', 'Biobío', 'America/Santiago', NOW()),
  (gen_random_uuid(), 'PUERTO MONTT', 'Chile', 'Los Lagos', 'America/Santiago', NOW())
ON CONFLICT DO NOTHING;
