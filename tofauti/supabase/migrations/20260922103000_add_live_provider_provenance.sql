-- Live provider provenance and calendar payloads are stored separately from
-- derived state so users can audit exactly what the engine received.

alter table public.tofauti_market_ticks
  add column if not exists unknown_volume integer not null default 0 check (unknown_volume >= 0),
  add column if not exists source text not null default 'unknown',
  add column if not exists raw_symbol text,
  add column if not exists aggressor_side_source text not null default 'unknown';

alter table public.tofauti_orderflow_buckets
  add column if not exists unknown_volume integer not null default 0 check (unknown_volume >= 0);

alter table public.tofauti_macro_states
  add column if not exists availability text not null default 'AVAILABLE'
    check (availability in ('AVAILABLE', 'SCHEDULE_ONLY', 'UNAVAILABLE'));

alter table public.tofauti_market_snapshots
  alter column scenario drop not null;

create table if not exists public.tofauti_calendar_events (
  id text primary key,
  scheduled_at timestamptz not null,
  country text,
  currency text,
  title text not null,
  importance integer not null check (importance between 1 and 3),
  actual text,
  forecast text,
  previous text,
  revised text,
  source text not null,
  source_url text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists tofauti_calendar_events_scheduled_at_idx
  on public.tofauti_calendar_events (scheduled_at);

alter table public.tofauti_calendar_events enable row level security;
