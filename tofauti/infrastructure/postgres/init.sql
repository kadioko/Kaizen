create table if not exists instruments (
  symbol text primary key,
  name text not null,
  asset_class text not null,
  tick_size numeric not null,
  point_value numeric not null,
  exchange text not null,
  enabled boolean not null default true
);
create table if not exists market_ticks (
  timestamp timestamptz not null,
  symbol text not null references instruments(symbol),
  price numeric not null,
  bid numeric not null,
  ask numeric not null,
  volume integer not null,
  buy_volume integer not null,
  sell_volume integer not null,
  primary key (symbol, timestamp)
);
create index if not exists market_ticks_symbol_time_idx on market_ticks (symbol, timestamp desc);
create table if not exists bars (timestamp timestamptz not null, symbol text not null references instruments(symbol), timeframe text not null, open numeric not null, high numeric not null, low numeric not null, close numeric not null, volume integer not null, primary key(symbol, timeframe, timestamp));
create table if not exists orderflow_buckets (timestamp timestamptz not null, symbol text not null references instruments(symbol), timeframe text not null, buy_volume integer not null, sell_volume integer not null, delta integer not null, cumulative_delta integer not null, primary key(symbol, timeframe, timestamp));
create table if not exists levels (id text primary key, symbol text not null references instruments(symbol), level_type text not null, price numeric not null, strength text not null, touches integer not null default 0, last_interaction timestamptz);
create table if not exists liquidity_events (id text primary key, timestamp timestamptz not null, symbol text not null references instruments(symbol), event_type text not null, evidence jsonb not null);
create table if not exists macro_states (id bigserial primary key, timestamp timestamptz not null, symbol text not null references instruments(symbol), score integer not null, direction text not null, factors jsonb not null);
create table if not exists market_snapshots (id bigserial primary key, timestamp timestamptz not null, symbol text not null references instruments(symbol), payload jsonb not null);
create table if not exists war_room_events (id text primary key, timestamp timestamptz not null, symbol text not null references instruments(symbol), category text not null, severity text not null, title text not null, description text not null, evidence jsonb not null, state_before text not null, state_after text not null);
create table if not exists setups (id text primary key, timestamp timestamptz not null, symbol text not null references instruments(symbol), direction text not null, entry_reference numeric not null, invalidation numeric not null, target1 numeric not null, target2 numeric not null, snapshot jsonb not null);
create table if not exists setup_outcomes (id bigserial primary key, setup_id text not null references setups(id), evaluated_at timestamptz not null, horizon_minutes integer not null, mfe numeric not null, mae numeric not null, target_hit boolean not null, invalidation_hit boolean not null, price_at_horizon numeric not null);
create table if not exists users (id uuid primary key, email text unique not null, created_at timestamptz not null default now());
create table if not exists watchlists (id bigserial primary key, user_id uuid references users(id), symbol text not null references instruments(symbol), unique(user_id, symbol));
