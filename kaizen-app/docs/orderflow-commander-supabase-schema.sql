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
  source text not null default 'manual' check (source in ('manual', 'csv')),
  created_at timestamptz not null default now()
);

create table if not exists commander_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_instrument text not null check (selected_instrument in ('MNQ', 'MES', 'GC')),
  session_name text not null,
  bias text not null check (bias in ('Bullish', 'Bearish', 'Neutral')),
  risk_context text not null check (risk_context in ('Risk-On', 'Risk-Off', 'Balanced')),
  manual_price numeric(12, 4),
  news_risk boolean not null default false,
  minimum_score integer not null default 70,
  risk_inputs jsonb not null default '{}'::jsonb,
  score_weights jsonb not null default '{}'::jsonb,
  journal_draft jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
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
  screenshot_annotation text,
  mistake_tags text[] default '{}',
  notes text,
  lessons text,
  created_at timestamptz not null default now()
);

create table if not exists commander_setup_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  instrument text not null,
  session_name text not null,
  bias text not null check (bias in ('Bullish', 'Bearish', 'Neutral')),
  risk_context text not null check (risk_context in ('Risk-On', 'Risk-Off', 'Balanced')),
  news_risk boolean not null default false,
  minimum_score integer not null default 70,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists commander_playbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setup_type text not null,
  name text not null,
  checklist text,
  execution_notes text,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists commander_news_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  event_time timestamptz not null,
  instrument text not null,
  session_name text not null,
  impact text not null check (impact in ('Low', 'Medium', 'High')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists commander_score_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  context_weight integer not null default 20,
  level_weight integer not null default 20,
  delta_weight integer not null default 25,
  alignment_weight integer not null default 15,
  reward_weight integer not null default 10,
  session_weight integer not null default 10,
  minimum_score integer not null default 70,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table commander_levels enable row level security;
alter table commander_orderflow_rows enable row level security;
alter table commander_trade_plans enable row level security;
alter table commander_journal_entries enable row level security;
alter table commander_workspaces enable row level security;
alter table commander_setup_templates enable row level security;
alter table commander_playbooks enable row level security;
alter table commander_news_events enable row level security;
alter table commander_score_profiles enable row level security;

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

create policy "workspaces_manage_own" on commander_workspaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "templates_manage_own" on commander_setup_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "playbooks_manage_own" on commander_playbooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "news_events_manage_own" on commander_news_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "score_profiles_manage_own" on commander_score_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('commander-screenshots', 'commander-screenshots', false)
on conflict (id) do nothing;
