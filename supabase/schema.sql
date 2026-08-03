-- ============================================================
-- Duel Board - complete online schema
--
-- Paste the whole file into the Supabase SQL editor and run it. Safe to run
-- again over a database that already has some of this: every statement either
-- checks first or replaces what is there, so re-running changes nothing.
--
-- The app only ever holds the PUBLISHABLE key, which any player can read out
-- of the page. So the database is what says no: row level security is on for
-- every table and every policy is written against auth.uid(). Nothing is
-- trusted from the client.
-- ============================================================


-- ============================================================
-- profiles - one row per player, created on first sign-in
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text unique not null,
  name        text not null default '',
  colour      text not null default 'flare',
  pattern     text not null default 'solid',
  terrain     text not null default 'default',
  avatar      text,
  wins        int  not null default 0,
  losses      int  not null default 0,
  rounds_won  int  not null default 0,
  coins       int  not null default 0,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz not null default now(),
  constraint handle_shape check (handle ~ '^[a-z0-9_]{3,16}$')
);

alter table public.profiles enable row level security;

-- anyone signed in can look a player up: you cannot invite what you cannot find
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- keeps "find @someone" cheap once there are more than a handful of players
create index if not exists profiles_handle_idx on public.profiles(handle text_pattern_ops);


-- ============================================================
-- queue - who is waiting to be matched
-- ============================================================
create table if not exists public.queue (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  game       text not null,
  board      text,
  joined_at  timestamptz not null default now()
);

alter table public.queue enable row level security;

drop policy if exists queue_read on public.queue;
create policy queue_read on public.queue
  for select to authenticated using (true);

drop policy if exists queue_join on public.queue;
create policy queue_join on public.queue
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists queue_leave on public.queue;
create policy queue_leave on public.queue
  for delete to authenticated using (auth.uid() = user_id);


-- ============================================================
-- matches - a game between two players
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
drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches
  for select to authenticated using (auth.uid() in (p0, p1));

drop policy if exists matches_create on public.matches;
create policy matches_create on public.matches
  for insert to authenticated with check (auth.uid() in (p0, p1));

drop policy if exists matches_update on public.matches;
create policy matches_update on public.matches
  for update to authenticated using (auth.uid() in (p0, p1)) with check (auth.uid() in (p0, p1));

create index if not exists matches_p0_idx on public.matches(p0) where status = 'live';
create index if not exists matches_p1_idx on public.matches(p1) where status = 'live';


-- ============================================================
-- invites - a direct challenge, by handle or by link
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

-- an open link invite is readable by anyone signed in, since whoever follows
-- the link is a stranger until they accept it. Everything else is private to
-- the two people it concerns.
drop policy if exists invites_read on public.invites;
create policy invites_read on public.invites
  for select to authenticated
  using (auth.uid() in (from_user, to_user) or (to_user is null and status = 'open'));

drop policy if exists invites_create on public.invites;
create policy invites_create on public.invites
  for insert to authenticated with check (auth.uid() = from_user);

drop policy if exists invites_respond on public.invites;
create policy invites_respond on public.invites
  for update to authenticated
  using (auth.uid() in (from_user, to_user) or (to_user is null and status = 'open'));


-- ============================================================
-- messages - between two players, in or out of a match
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

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select to authenticated using (auth.uid() in (from_user, to_user));

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages
  for insert to authenticated with check (auth.uid() = from_user);

drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages
  for update to authenticated using (auth.uid() = to_user) with check (auth.uid() = to_user);

create index if not exists messages_pair_idx on public.messages(from_user, to_user, created_at desc);


-- ============================================================
-- friends - players you know
--
-- One row per direction. A request and a mutual link are then the same shape,
-- and there is no status column that can drift out of step with reality: the
-- link is mutual exactly when both rows exist.
-- ============================================================
create table if not exists public.friends (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  friend_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint no_self check (user_id <> friend_id)
);

alter table public.friends enable row level security;

-- you can see a link if you are either end of it: your own list, and anyone
-- who has added you
drop policy if exists friends_read on public.friends;
create policy friends_read on public.friends
  for select to authenticated using (auth.uid() in (user_id, friend_id));

-- you may only ever add or remove from your own side
drop policy if exists friends_add on public.friends;
create policy friends_add on public.friends
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists friends_remove on public.friends;
create policy friends_remove on public.friends
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists friends_of_idx on public.friends(user_id);


-- ============================================================
-- recent_opponents - who you have actually played, humans only
--
-- The bot never gets a row in matches, so anything here is a real person.
-- security_invoker means the view runs as the caller, so the policy on
-- matches already limits it to matches you were in.
-- ============================================================
create or replace view public.recent_opponents as
select
  m.id         as match_id,
  m.created_at,
  m.game,
  case when m.p0 = auth.uid() then m.p1 else m.p0 end as opponent,
  m.winner = auth.uid()                               as i_won
from public.matches m
where auth.uid() in (m.p0, m.p1)
  and m.p1 is not null
  and m.status = 'done';

alter view public.recent_opponents set (security_invoker = on);


-- ============================================================
-- housekeeping
-- ============================================================

-- keep updated_at honest so the client can tell what actually changed
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists matches_touch on public.matches;
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();


-- ============================================================
-- live updates - the client subscribes to these
-- Adding a table twice is an error, so each one is tried and shrugged off.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['matches','invites','messages','queue','friends'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;


-- ============================================================
-- Anonymous accounts pile up: one per person who ever opens the app, and
-- Supabase does not clear them for you. Run this now and then, or put it on a
-- schedule once pg_cron is enabled. It spares anyone who actually played.
--
--   delete from auth.users u
--   where u.is_anonymous
--     and u.created_at < now() - interval '30 days'
--     and not exists (
--       select 1 from public.profiles p
--       where p.id = u.id and p.wins + p.losses > 0
--     );
-- ============================================================
