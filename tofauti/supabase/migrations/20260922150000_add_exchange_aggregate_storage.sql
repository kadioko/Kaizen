-- Exchange-derived aggregates are optional. They remain empty until an
-- entitled source sends normalized trade or market-by-price records. Profile
-- rows are sampled no more than once per minute; raw ticks remain the source
-- of truth for rebuilding a profile at a different aggregation interval.

alter table public.tofauti_market_ticks
  add column if not exists depth jsonb not null default '[]'::jsonb;

create table if not exists public.tofauti_volume_profiles (
  symbol text not null references public.tofauti_instruments(symbol),
  timestamp timestamptz not null,
  price numeric not null,
  total_volume integer not null check (total_volume >= 0),
  buy_volume integer not null check (buy_volume >= 0),
  sell_volume integer not null check (sell_volume >= 0),
  unknown_volume integer not null check (unknown_volume >= 0),
  delta integer not null,
  share_of_profile numeric not null check (share_of_profile between 0 and 100),
  primary key (symbol, timestamp, price),
  check (total_volume = buy_volume + sell_volume + unknown_volume)
);
create index if not exists tofauti_volume_profiles_symbol_timestamp_idx
  on public.tofauti_volume_profiles (symbol, timestamp desc);

alter table public.tofauti_volume_profiles enable row level security;

-- Ingestion uses the server-only service role. No browser policy is granted
-- until user-facing market data access is deliberately designed and reviewed.
