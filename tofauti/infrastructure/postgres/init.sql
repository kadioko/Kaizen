-- Local development mirror of the Supabase TOFAUTI schema.
-- Supabase-specific auth foreign keys and RLS policies live in supabase/migrations.

create table if not exists tofauti_instruments (
  symbol text primary key, name text not null, asset_class text not null,
  tick_size numeric not null, point_value numeric not null, exchange text not null,
  enabled boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists tofauti_market_ticks (
  symbol text not null references tofauti_instruments(symbol), timestamp timestamptz not null,
  price numeric not null, bid numeric not null, ask numeric not null, volume integer not null,
  buy_volume integer not null, sell_volume integer not null, aggressive_side text not null,
  primary key (symbol, timestamp)
);
create table if not exists tofauti_bars (
  symbol text not null references tofauti_instruments(symbol), timeframe text not null,
  timestamp timestamptz not null, open numeric not null, high numeric not null, low numeric not null,
  close numeric not null, volume integer not null, primary key (symbol, timeframe, timestamp)
);
create table if not exists tofauti_orderflow_buckets (
  symbol text not null references tofauti_instruments(symbol), timeframe text not null,
  timestamp timestamptz not null, buy_volume integer not null, sell_volume integer not null,
  total_volume integer not null, delta integer not null, delta_change integer not null,
  cumulative_delta integer not null, buy_percentage numeric not null, sell_percentage numeric not null,
  volume_acceleration numeric not null, primary key (symbol, timeframe, timestamp)
);
create table if not exists tofauti_levels (
  id text primary key, symbol text not null references tofauti_instruments(symbol), level_type text not null,
  price numeric not null, strength text not null, touches integer not null default 0,
  last_interaction timestamptz, updated_at timestamptz not null default now()
);
create table if not exists tofauti_liquidity_events (
  id text primary key, symbol text not null references tofauti_instruments(symbol), timestamp timestamptz not null,
  event_type text not null, direction text not null, level numeric not null, evidence jsonb not null default '{}'::jsonb
);
create table if not exists tofauti_macro_states (
  id bigint generated always as identity primary key, symbol text not null references tofauti_instruments(symbol),
  timestamp timestamptz not null, score integer not null, direction text not null, strength text not null, factors jsonb not null
);
create table if not exists tofauti_market_snapshots (
  id bigint generated always as identity primary key, symbol text not null references tofauti_instruments(symbol),
  timestamp timestamptz not null, war_room_state text not null, scenario text not null, payload jsonb not null
);
create table if not exists tofauti_war_room_events (
  id text primary key, symbol text not null references tofauti_instruments(symbol), timestamp timestamptz not null,
  category text not null, severity text not null, title text not null, description text not null,
  evidence jsonb not null default '{}'::jsonb, state_before text not null, state_after text not null
);
create table if not exists tofauti_setups (
  id text primary key, symbol text not null references tofauti_instruments(symbol), timestamp timestamptz not null,
  direction text not null, entry_reference numeric not null, invalidation numeric not null,
  target1 numeric not null, target2 numeric not null, alignment_state text not null,
  macro_score integer not null, structure_score integer not null, orderflow_score integer not null,
  liquidity_score integer not null, status text not null, snapshot jsonb not null
);
create table if not exists tofauti_setup_outcomes (
  id bigint generated always as identity primary key, setup_id text not null references tofauti_setups(id) on delete cascade,
  evaluated_at timestamptz not null, horizon_minutes integer not null, mfe numeric not null, mae numeric not null,
  target_hit boolean not null, invalidation_hit boolean not null, price_at_horizon numeric not null,
  unique (setup_id, horizon_minutes)
);
create table if not exists tofauti_profiles (
  id uuid primary key, display_name text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists tofauti_watchlists (
  id bigint generated always as identity primary key, user_id uuid not null, symbol text not null references tofauti_instruments(symbol),
  created_at timestamptz not null default now(), unique (user_id, symbol)
);

create index if not exists tofauti_ticks_symbol_time_idx on tofauti_market_ticks (symbol, timestamp desc);
create index if not exists tofauti_bars_symbol_time_idx on tofauti_bars (symbol, timestamp desc);
create index if not exists tofauti_buckets_symbol_time_idx on tofauti_orderflow_buckets (symbol, timestamp desc);
create index if not exists tofauti_events_symbol_time_idx on tofauti_war_room_events (symbol, timestamp desc);
create index if not exists tofauti_setups_symbol_time_idx on tofauti_setups (symbol, timestamp desc);
