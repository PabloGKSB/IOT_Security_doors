-- Agregar columna para relacionar eventos de cierre con eventos de apertura
alter table public.door_events add column if not exists open_event_id uuid references public.door_events(id);

-- Agregar índice para mejorar búsquedas de eventos abiertos
create index if not exists door_events_open_event_id_idx on public.door_events(open_event_id);
create index if not exists door_events_type_timestamp_idx on public.door_events(event_type, timestamp desc);

-- Agregar columna para identificar si un evento de apertura ya fue cerrado
alter table public.door_events add column if not exists closed boolean default false;
