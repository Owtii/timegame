-- Duel Board - players you know
-- Run this after schema.sql. It is the last thing the Players tab needs from
-- the database; everything else it wants is already in profiles and matches.

-- ============================================================
-- friends: one row per direction, so a link is only mutual once
-- both sides exist. That keeps "requested" and "accepted" the same
-- shape and avoids a status column nobody can keep honest.
-- ============================================================
create table if not exists public.friends (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  friend_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint no_self check (user_id <> friend_id)
);

alter table public.friends enable row level security;

-- you can see a link if you are either end of it: your own list, and who has
-- added you back
create policy friends_read on public.friends
  for select to authenticated using (auth.uid() in (user_id, friend_id));

-- you may only ever add from your own side
create policy friends_add on public.friends
  for insert to authenticated with check (auth.uid() = user_id);
create policy friends_remove on public.friends
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists friends_of_idx on public.friends(user_id);

-- ============================================================
-- searching by handle
-- profiles is already readable by anyone signed in, which is what makes
-- "find @someone" possible at all. This index keeps the prefix search cheap
-- once there are more than a handful of players.
-- ============================================================
create index if not exists profiles_handle_idx on public.profiles(handle text_pattern_ops);

-- ============================================================
-- who you have actually played, humans only
-- The bot never gets a row in matches, so anything here is a real person.
-- ============================================================
create or replace view public.recent_opponents as
select
  m.id            as match_id,
  m.created_at,
  m.game,
  case when m.p0 = auth.uid() then m.p1 else m.p0 end as opponent,
  m.winner = auth.uid()                               as i_won
from public.matches m
where auth.uid() in (m.p0, m.p1)
  and m.p1 is not null
  and m.status = 'done'
order by m.created_at desc;

-- a view runs as the caller, so the row level security on matches already
-- limits this to matches you were in
alter view public.recent_opponents set (security_invoker = on);

alter publication supabase_realtime add table public.friends;
