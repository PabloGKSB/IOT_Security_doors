-- Crear tabla de usuarios autorizados (tarjetas RFID)
create table if not exists public.authorized_users (
  id uuid primary key default gen_random_uuid(),
  rfid_uid text not null unique,
  nombre text not null,
  apellido text not null,
  cargo text,
  departamento text,
  email text,
  telefono text,
  ubicaciones_autorizadas text[] default '{}',
  activo boolean default true,
  fecha_creacion timestamptz default now(),
  fecha_ultima_modificacion timestamptz default now()
);

-- Crear índices para búsquedas rápidas
create index if not exists authorized_users_rfid_idx on public.authorized_users(rfid_uid);
create index if not exists authorized_users_activo_idx on public.authorized_users(activo);

-- Habilitar RLS en authorized_users
alter table public.authorized_users enable row level security;

-- Política para leer usuarios autorizados
create policy "Permitir lectura de usuarios autorizados"
  on public.authorized_users
  for select
  using (true);

-- Política para insertar usuarios autorizados
create policy "Permitir inserción de usuarios autorizados"
  on public.authorized_users
  for insert
  with check (true);

-- Política para actualizar usuarios autorizados
create policy "Permitir actualización de usuarios autorizados"
  on public.authorized_users
  for update
  using (true);

-- Política para eliminar usuarios autorizados
create policy "Permitir eliminación de usuarios autorizados"
  on public.authorized_users
  for delete
  using (true);

-- Insertar algunos usuarios de ejemplo
insert into public.authorized_users (rfid_uid, nombre, apellido, cargo, departamento, ubicaciones_autorizadas) values
  ('ABC123DEF', 'Juan', 'Pérez', 'Gerente General', 'Administración', ARRAY['SANTIAGO CASA MATRIZ', 'ANTOFAGASTA', 'COQUIMBO', 'CONCEPCIÓN', 'PUERTO MONTT']),
  ('XYZ789GHI', 'María', 'González', 'Supervisora', 'Operaciones', ARRAY['SANTIAGO CASA MATRIZ']),
  ('LMN456OPQ', 'Carlos', 'Silva', 'Técnico', 'Mantención', ARRAY['ANTOFAGASTA', 'COQUIMBO'])
on conflict (rfid_uid) do nothing;

-- Función para actualizar fecha de modificación automáticamente
create or replace function update_modified_timestamp()
returns trigger as $$
begin
  new.fecha_ultima_modificacion = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para actualizar automáticamente la fecha de modificación
drop trigger if exists update_authorized_users_modtime on public.authorized_users;
create trigger update_authorized_users_modtime
  before update on public.authorized_users
  for each row
  execute function update_modified_timestamp();
