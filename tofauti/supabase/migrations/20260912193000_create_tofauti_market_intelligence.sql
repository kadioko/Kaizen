-- TOFAUTI owns prefixed tables so it can safely share the Kaizen Supabase project.
-- Market ingestion uses the service role on the server; personal watchlists are RLS-scoped.

create table if not exists public.tofauti_instruments (
  symbol text primary key,
  name text not null,
  asset_class text not null,
  tick_size numeric not null check (tick_size > 0),
  point_value numeric not null check (point_value > 0),
  exchange text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tofauti_market_ticks (
  symbol text not null references public.tofauti_instruments(symbol),
  timestamp timestamptz not null,
  price numeric not null,
  bid numeric not null,
  ask numeric not null,
  volume integer not null check (volume >= 0),
  buy_volume integer not null check (buy_volume >= 0),
  sell_volume integer not null check (sell_volume >= 0),
  aggressive_side text not null check (aggressive_side in ('BULLISH', 'BEARISH', 'NEUTRAL')),
  primary key (symbol, timestamp)
);
create index if not exists tofauti_market_ticks_symbol_timestamp_idx on public.tofauti_market_ticks (symbol, timestamp desc);

create table if not exists public.tofauti_bars (
  symbol text not null references public.tofauti_instruments(symbol),
  timeframe text not null,
  timestamp timestamptz not null,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume integer not null check (volume >= 0),
  primary key (symbol, timeframe, timestamp)
);
create index if not exists tofauti_bars_symbol_timestamp_idx on public.tofauti_bars (symbol, timestamp desc);

create table if not exists public.tofauti_orderflow_buckets (
  symbol text not null references public.tofauti_instruments(symbol),
  timeframe text not null,
  timestamp timestamptz not null,
  buy_volume integer not null check (buy_volume >= 0),
  sell_volume integer not null check (sell_volume >= 0),
  total_volume integer not null check (total_volume >= 0),
  delta integer not null,
  delta_change integer not null,
  cumulative_delta integer not null,
  buy_percentage numeric not null,
  sell_percentage numeric not null,
  volume_acceleration numeric not null,
  primary key (symbol, timeframe, timestamp)
);
create index if not exists tofauti_orderflow_symbol_timestamp_idx on public.tofauti_orderflow_buckets (symbol, timestamp desc);

create table if not exists public.tofauti_levels (
  id text primary key,
  symbol text not null references public.tofauti_instruments(symbol),
  level_type text not null,
  price numeric not null,
  strength text not null check (strength in ('WEAK', 'MODERATE', 'STRONG')),
  touches integer not null default 0 check (touches >= 0),
  last_interaction timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.tofauti_liquidity_events (
  id text primary key,
  symbol text not null references public.tofauti_instruments(symbol),
  timestamp timestamptz not null,
  event_type text not null,
  direction text not null check (direction in ('BULLISH', 'BEARISH', 'NEUTRAL')),
  level numeric not null,
  evidence jsonb not null default '{}'::jsonb
);
create index if not exists tofauti_liquidity_symbol_timestamp_idx on public.tofauti_liquidity_events (symbol, timestamp desc);

create table if not exists public.tofauti_macro_states (
  id bigint generated always as identity primary key,
  symbol text not null references public.tofauti_instruments(symbol),
  timestamp timestamptz not null,
  score integer not null check (score between -100 and 100),
  direction text not null check (direction in ('BULLISH', 'BEARISH', 'NEUTRAL')),
  strength text not null check (strength in ('WEAK', 'MODERATE', 'STRONG')),
  factors jsonb not null
);
create index if not exists tofauti_macro_symbol_timestamp_idx on public.tofauti_macro_states (symbol, timestamp desc);

create table if not exists public.tofauti_market_snapshots (
  id bigint generated always as identity primary key,
  symbol text not null references public.tofauti_instruments(symbol),
  timestamp timestamptz not null,
  war_room_state text not null,
  scenario text not null,
  payload jsonb not null
);
create index if not exists tofauti_snapshots_symbol_timestamp_idx on public.tofauti_market_snapshots (symbol, timestamp desc);

create table if not exists public.tofauti_war_room_events (
  id text primary key,
  symbol text not null references public.tofauti_instruments(symbol),
  timestamp timestamptz not null,
  category text not null,
  severity text not null,
  title text not null,
  description text not null,
  evidence jsonb not null default '{}'::jsonb,
  state_before text not null,
  state_after text not null
);
create index if not exists tofauti_events_symbol_timestamp_idx on public.tofauti_war_room_events (symbol, timestamp desc);

create table if not exists public.tofauti_setups (
  id text primary key,
  symbol text not null references public.tofauti_instruments(symbol),
  timestamp timestamptz not null,
  direction text not null check (direction in ('BULLISH', 'BEARISH')),
  entry_reference numeric not null,
  invalidation numeric not null,
  target1 numeric not null,
  target2 numeric not null,
  alignment_state text not null,
  macro_score integer not null check (macro_score between -100 and 100),
  structure_score integer not null check (structure_score between -100 and 100),
  orderflow_score integer not null check (orderflow_score between -100 and 100),
  liquidity_score integer not null check (liquidity_score between -100 and 100),
  status text not null,
  snapshot jsonb not null
);
create index if not exists tofauti_setups_symbol_timestamp_idx on public.tofauti_setups (symbol, timestamp desc);

create table if not exists public.tofauti_setup_outcomes (
  id bigint generated always as identity primary key,
  setup_id text not null references public.tofauti_setups(id) on delete cascade,
  evaluated_at timestamptz not null,
  horizon_minutes integer not null check (horizon_minutes in (5, 15, 30, 60)),
  mfe numeric not null,
  mae numeric not null,
  target_hit boolean not null,
  invalidation_hit boolean not null,
  price_at_horizon numeric not null,
  unique (setup_id, horizon_minutes)
);

create table if not exists public.tofauti_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tofauti_watchlists (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null references public.tofauti_instruments(symbol),
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

alter table public.tofauti_instruments enable row level security;
alter table public.tofauti_market_ticks enable row level security;
alter table public.tofauti_bars enable row level security;
alter table public.tofauti_orderflow_buckets enable row level security;
alter table public.tofauti_levels enable row level security;
alter table public.tofauti_liquidity_events enable row level security;
alter table public.tofauti_macro_states enable row level security;
alter table public.tofauti_market_snapshots enable row level security;
alter table public.tofauti_war_room_events enable row level security;
alter table public.tofauti_setups enable row level security;
alter table public.tofauti_setup_outcomes enable row level security;
alter table public.tofauti_profiles enable row level security;
alter table public.tofauti_watchlists enable row level security;

-- The API uses a Supabase service-role key for ingestion, which bypasses RLS.
-- Browser clients may only access their own profile and watchlist records.
create policy "tofauti profile owner read" on public.tofauti_profiles for select to authenticated using (id = auth.uid());
create policy "tofauti profile owner insert" on public.tofauti_profiles for insert to authenticated with check (id = auth.uid());
create policy "tofauti profile owner update" on public.tofauti_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "tofauti watchlist owner read" on public.tofauti_watchlists for select to authenticated using (user_id = auth.uid());
create policy "tofauti watchlist owner insert" on public.tofauti_watchlists for insert to authenticated with check (user_id = auth.uid());
create policy "tofauti watchlist owner delete" on public.tofauti_watchlists for delete to authenticated using (user_id = auth.uid());
