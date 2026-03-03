-- Add columns for location and board information to door_events
alter table public.door_events 
  add column if not exists board_name text default 'ESP32-Main',
  add column if not exists location text default 'Main Entrance',
  add column if not exists duration_seconds integer,
  add column if not exists end_timestamp timestamptz;

-- Add columns for location and board information to door_status
alter table public.door_status
  add column if not exists board_name text default 'ESP32-Main',
  add column if not exists location text default 'Main Entrance',
  add column if not exists event_start_time timestamptz;

-- Create index for board_name lookups
create index if not exists door_events_board_name_idx on public.door_events(board_name);

-- Update existing records with default values
update public.door_events 
set 
  board_name = 'ESP32-Main',
  location = 'Main Entrance'
where board_name is null or location is null;

update public.door_status
set 
  board_name = 'ESP32-Main',
  location = 'Main Entrance'
where board_name is null or location is null;
