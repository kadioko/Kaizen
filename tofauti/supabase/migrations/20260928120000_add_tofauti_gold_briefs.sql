-- Personal spot-market briefs and their review notes share Kaizen Auth.
-- Provider snapshots are captured by the signed-in user; this is not exchange ingestion.
insert into public.tofauti_instruments (symbol, name, asset_class, tick_size, point_value, exchange, enabled)
values
  ('GC', 'Gold Futures', 'futures', 0.10, 100, 'COMEX', true),
  ('MGC', 'Micro Gold Futures', 'futures', 0.10, 10, 'COMEX', true)
on conflict (symbol) do nothing;

create table if not exists public.tofauti_gold_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  source_as_of timestamptz not null,
  snapshot jsonb not null,
  scenario text not null check (char_length(scenario) between 1 and 2000),
  invalidation_price numeric check (invalidation_price > 0),
  post_session_note text check (post_session_note is null or char_length(post_session_note) <= 5000),
  review_outcome text check (review_outcome in ('FOLLOWED_PLAN', 'CHANGED_PLAN', 'NO_ACTION')),
  reviewed_at timestamptz,
  constraint tofauti_gold_brief_complete_review check (
    (post_session_note is null and review_outcome is null)
    or (nullif(btrim(post_session_note), '') is not null and review_outcome is not null)
  )
);
create index if not exists tofauti_gold_briefs_owner_created_idx
  on public.tofauti_gold_briefs (user_id, created_at desc);

alter table public.tofauti_gold_briefs enable row level security;
grant select, insert, update, delete on public.tofauti_gold_briefs to authenticated;
create policy "tofauti gold briefs owner read" on public.tofauti_gold_briefs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tofauti gold briefs owner insert" on public.tofauti_gold_briefs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tofauti gold briefs owner update" on public.tofauti_gold_briefs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tofauti gold briefs owner delete" on public.tofauti_gold_briefs
  for delete to authenticated using (user_id = (select auth.uid()));

create function public.tofauti_gold_brief_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.post_session_note := null;
    new.review_outcome := null;
    new.reviewed_at := null;
  elsif row(new.user_id, new.created_at, new.source_as_of, new.snapshot, new.scenario, new.invalidation_price)
      is distinct from row(old.user_id, old.created_at, old.source_as_of, old.snapshot, old.scenario, old.invalidation_price) then
    raise exception 'Gold Brief source context and plan are immutable after capture';
  elsif new.post_session_note is distinct from old.post_session_note
      or new.review_outcome is distinct from old.review_outcome then
    new.reviewed_at := case when new.review_outcome is null then null else now() end;
  else
    new.reviewed_at := old.reviewed_at;
  end if;
  return new;
end;
$$;
create trigger tofauti_gold_brief_guard_trigger
  before insert or update on public.tofauti_gold_briefs
  for each row execute function public.tofauti_gold_brief_guard();

-- Only the owner's authorized row changes are delivered through Realtime.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tofauti_gold_briefs'
  ) then
    alter publication supabase_realtime add table public.tofauti_gold_briefs;
  end if;
end $$;
