-- Script para corregir políticas RLS (Row Level Security)
-- Ejecutar este script si hay problemas de permisos

-- Agregando DROP para todas las políticas incluyendo las que faltaban
-- Eliminar políticas existentes que puedan causar conflictos
drop policy if exists "Allow public to insert door status" on public.door_status;
drop policy if exists "Allow public to select door status" on public.door_status;
drop policy if exists "Allow public to update door status" on public.door_status;
drop policy if exists "Allow public to delete door status" on public.door_status;
drop policy if exists "Allow public to view authorized users" on public.authorized_users;
drop policy if exists "Allow public to select authorized users" on public.authorized_users;
drop policy if exists "Allow public to insert authorized users" on public.authorized_users;
drop policy if exists "Allow public to update authorized users" on public.authorized_users;
drop policy if exists "Allow public to delete authorized users" on public.authorized_users;
drop policy if exists "Allow public to select alert contacts" on public.alert_contacts;
drop policy if exists "Allow public to insert alert contacts" on public.alert_contacts;
drop policy if exists "Allow public to update alert contacts" on public.alert_contacts;
drop policy if exists "Allow public to delete alert contacts" on public.alert_contacts;

-- Habilitar RLS en las tablas
alter table public.door_status enable row level security;
alter table public.authorized_users enable row level security;
alter table public.alert_contacts enable row level security;

-- Políticas para door_status (permitir todo el acceso público)
create policy "Allow public to insert door status"
  on public.door_status for insert
  with check (true);

create policy "Allow public to select door status"
  on public.door_status for select
  using (true);

create policy "Allow public to update door status"
  on public.door_status for update
  using (true);

-- Políticas para authorized_users
create policy "Allow public to select authorized users"
  on public.authorized_users for select
  using (true);

create policy "Allow public to insert authorized users"
  on public.authorized_users for insert
  with check (true);

create policy "Allow public to update authorized users"
  on public.authorized_users for update
  using (true);

create policy "Allow public to delete authorized users"
  on public.authorized_users for delete
  using (true);

-- Políticas para alert_contacts
create policy "Allow public to select alert contacts"
  on public.alert_contacts for select
  using (true);

create policy "Allow public to insert alert contacts"
  on public.alert_contacts for insert
  with check (true);

create policy "Allow public to update alert contacts"
  on public.alert_contacts for update
  using (true);

create policy "Allow public to delete alert contacts"
  on public.alert_contacts for delete
  using (true);

-- Mensaje de confirmación
do $$
begin
  raise notice 'Políticas RLS actualizadas correctamente';
end $$;
