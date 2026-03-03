-- Create locations table for Chile branches
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null,
  country text default 'Chile',
  timezone text default 'America/Santiago',
  created_at timestamptz default now()
);

-- Insert Chile branch locations
insert into public.locations (name, region) values
  ('SANTIAGO CASA MATRIZ', 'Región Metropolitana'),
  ('ANTOFAGASTA', 'Región de Antofagasta'),
  ('COQUIMBO', 'Región de Coquimbo'),
  ('CONCEPCIÓN', 'Región del Biobío'),
  ('PUERTO MONTT', 'Región de Los Lagos')
on conflict (name) do nothing;

-- Update door_events table to use proper Chilean locations
update public.door_events
set location = 'SANTIAGO CASA MATRIZ'
where location = 'Main Entrance';

-- Update door_status table to use proper Chilean locations
update public.door_status
set location = 'SANTIAGO CASA MATRIZ'
where location = 'Main Entrance';

-- Create index for location lookups
create index if not exists door_events_location_idx on public.door_events(location);
create index if not exists door_status_location_idx on public.door_status(location);

-- Enable RLS on locations table
alter table public.locations enable row level security;

-- Create policy to allow read access to locations
create policy "Allow read access to locations"
  on public.locations
  for select
  using (true);
