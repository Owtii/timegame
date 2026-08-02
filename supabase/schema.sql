-- Duel Board - online schema
-- Paste this whole file into the Supabase SQL editor and run it once.
--
-- Everything here assumes the app only ever holds the PUBLISHABLE key, which
-- any player can read out of the page. So the database itself has to be the
-- thing that says no: every table has row level security on, and every policy
-- is written against auth.uid(). Nothing is trusted from the client.

-- ============================================================
-- profiles: one row per player, created on first sign-in
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text unique not null,
  name        text not null default '',
  colour      text not null default 'flare',
  pattern     text not null default 'solid',
  terrain     text not null default 'default',
  avatar      text,                          -- data URI or storage path, optional
  wins        int  not null default 0,
  losses      int  not null default 0,
  rounds_won  int  not null default 0,
  coins       int  not null default 0,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz not null default now(),
  constraint handle_shape check (handle ~ '^[a-z0-9_]{3,16}$')
);

alter table public.profiles enable row level security;

-- everyone signed in can look players up: you cannot invite what you cannot find
create policy profiles_read on public.profiles
  for select to authenticated using (true);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- queue: who is waiting to be matched
-- ============================================================
create table if not exists public.queue (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  game       text not null,
  board      text,
  joined_at  timestamptz not null default now()
);

alter table public.queue enable row level security;

create policy queue_read on public.queue
  for select to authenticated using (true);
create policy queue_join on public.queue
  for insert to authenticated with check (auth.uid() = user_id);
create policy queue_leave on public.queue
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- matches: a game between two players
-- ============================================================
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  game       text not null,
  board      text,
  p0         uuid not null references public.profiles(id) on delete cascade,
  p1         uuid references public.profiles(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  turn       uuid,
  status     text not null default 'live',   -- live | done | abandoned
  winner     uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;

-- only the two people playing it can see or touch a match
create policy matches_read on public.matches
  for select to authenticated using (auth.uid() in (p0, p1));
create policy matches_create on public.matches
  for insert to authenticated with check (auth.uid() in (p0, p1));
create policy matches_update on public.matches
  for update to authenticated using (auth.uid() in (p0, p1)) with check (auth.uid() in (p0, p1));

create index if not exists matches_p0_idx on public.matches(p0) where status = 'live';
create index if not exists matches_p1_idx on public.matches(p1) where status = 'live';

-- ============================================================
-- invites: a direct challenge, by handle or by link
-- ============================================================
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,           -- what goes in the link and the QR
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid references public.profiles(id) on delete cascade,
  game       text not null,
  board      text,
  status     text not null default 'open',   -- open | accepted | declined | expired
  match_id   uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

alter table public.invites enable row level security;

-- an open link invite is readable by anyone signed in, otherwise only the two
-- people it concerns can see it
create policy invites_read on public.invites
  for select to authenticated
  using (auth.uid() in (from_user, to_user) or (to_user is null and status = 'open'));
create policy invites_create on public.invites
  for insert to authenticated with check (auth.uid() = from_user);
create policy invites_respond on public.invites
  for update to authenticated
  using (auth.uid() in (from_user, to_user) or (to_user is null and status = 'open'));

-- ============================================================
-- messages: between two players, in or out of a match
-- ============================================================
create table if not exists public.messages (
  id         bigserial primary key,
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(body) between 1 and 500),
  match_id   uuid references public.matches(id) on delete set null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy messages_read on public.messages
  for select to authenticated using (auth.uid() in (from_user, to_user));
create policy messages_send on public.messages
  for insert to authenticated with check (auth.uid() = from_user);
create policy messages_mark_read on public.messages
  for update to authenticated using (auth.uid() = to_user) with check (auth.uid() = to_user);

create index if not exists messages_pair_idx on public.messages(from_user, to_user, created_at desc);

-- ============================================================
-- live updates: the client subscribes to these
-- ============================================================
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.invites;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.queue;

-- ============================================================
-- housekeeping
-- ============================================================

-- keep updated_at honest so the client can tell what changed
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists matches_touch on public.matches;
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();

-- Anonymous accounts pile up: one per person who ever opens the app. Supabase
-- does not clear them for you. Run this now and then, or put it on a schedule
-- once pg_cron is enabled:
--
--   delete from auth.users
--   where is_anonymous
--     and created_at < now() - interval '30 days'
--     and id not in (select id from public.profiles where wins + losses > 0);
