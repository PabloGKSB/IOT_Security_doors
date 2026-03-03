-- Create door_events table to log all door activity
create table if not exists public.door_events (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  event_type text not null check (event_type in ('open', 'close', 'forced', 'authorized', 'unauthorized')),
  authorized boolean not null default false,
  door_id text not null default 'main_door',
  details jsonb,
  created_at timestamptz not null default now()
);

-- Create door_status table to track current door state
create table if not exists public.door_status (
  id uuid primary key default gen_random_uuid(),
  door_id text unique not null,
  is_open boolean not null default false,
  last_updated timestamptz not null default now(),
  last_event_id uuid references public.door_events(id)
);

-- Create alert_contacts table for SMS notifications
create table if not exists public.alert_contacts (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Create indexes for better query performance
create index if not exists door_events_timestamp_idx on public.door_events(timestamp desc);
create index if not exists door_events_door_id_idx on public.door_events(door_id);
create index if not exists door_status_door_id_idx on public.door_status(door_id);

-- Insert default door status
insert into public.door_status (door_id, is_open)
values ('main_door', false)
on conflict (door_id) do nothing;

-- Insert default alert contact (update with your phone number)
insert into public.alert_contacts (phone_number, name, active)
values ('+1234567890', 'Admin', true)
on conflict do nothing;

-- Enable RLS on all tables
alter table public.door_events enable row level security;
alter table public.door_status enable row level security;
alter table public.alert_contacts enable row level security;

-- Create policies for public access (since ESP32 will access without auth)
-- In production, you'd want to use API keys or service role
create policy "Allow public to insert door events"
  on public.door_events for insert
  with check (true);

create policy "Allow public to view door events"
  on public.door_events for select
  using (true);

create policy "Allow public to view door status"
  on public.door_status for select
  using (true);

create policy "Allow public to update door status"
  on public.door_status for update
  using (true);

create policy "Allow public to view alert contacts"
  on public.alert_contacts for select
  using (true);
