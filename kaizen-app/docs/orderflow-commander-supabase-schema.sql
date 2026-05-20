-- OrderFlow Commander starter schema
-- Educational planning artifact for the future Next.js + Supabase build

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists commander_levels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instrument text not null check (instrument in ('MNQ', 'MES', 'GC')),
  level_type text not null,
  price numeric(12, 4) not null,
  strength_score integer not null check (strength_score between 1 and 5),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commander_orderflow_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp_utc timestamptz not null,
  instrument text not null check (instrument in ('MNQ', 'MES', 'GC')),
  timeframe text not null check (timeframe in ('M1', 'M3', 'M5')),
  open numeric(12, 4) not null,
  high numeric(12, 4) not null,
  low numeric(12, 4) not null,
  close numeric(12, 4) not null,
  delta numeric(14, 2),
  delta_change numeric(14, 2),
  volume numeric(14, 2),
  cumulative_delta numeric(14, 2),
  aggressive_buyers boolean,
  aggressive_sellers boolean,
  price_continued_after_aggression boolean,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists commander_trade_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instrument text not null check (instrument in ('MNQ', 'MES', 'GC')),
  session_name text not null,
  bias text not null check (bias in ('Bullish', 'Bearish', 'Neutral')),
  status text not null,
  setup_type text not null,
  direction text not null check (direction in ('Long', 'Short', 'No Trade')),
  entry_trigger text,
  stop_loss numeric(12, 4),
  tp1 numeric(12, 4),
  tp2 numeric(12, 4),
  invalidation text,
  valid_reason text,
  skip_reason text,
  risk_size numeric(12, 2),
  trade_score integer not null check (trade_score between 0 and 100),
  news_risk boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists commander_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null,
  instrument text not null check (instrument in ('MNQ', 'MES', 'GC')),
  session_name text not null,
  setup_type text not null,
  direction text not null check (direction in ('Long', 'Short')),
  entry_price numeric(12, 4),
  stop_price numeric(12, 4),
  tp1 numeric(12, 4),
  tp2 numeric(12, 4),
  exit_price numeric(12, 4),
  result_r numeric(10, 2),
  profit_loss numeric(12, 2),
  screenshot_path text,
  mistake_tags text[] default '{}',
  notes text,
  lessons text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table commander_levels enable row level security;
alter table commander_orderflow_rows enable row level security;
alter table commander_trade_plans enable row level security;
alter table commander_journal_entries enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "levels_manage_own" on commander_levels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "orderflow_manage_own" on commander_orderflow_rows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trade_plans_manage_own" on commander_trade_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_manage_own" on commander_journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
