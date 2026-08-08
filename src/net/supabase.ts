import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * The online layer.
 *
 * The game must never need the network. Everything here is additive: with no
 * connection, no account or no project configured, the app behaves exactly as
 * it does offline - you can still play every game, the base still runs, and
 * the only thing missing is other people.
 *
 * The key below is the publishable one. It is safe in the page; the database
 * enforces the rules through row-level security, and this client can only ever
 * do what the policies in `supabase/schema.sql` allow.
 */
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://zfustkkzesexmpmgettx.supabase.co';
const KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_j2wn3zzSWoCKiRxTUSx8Yg_WPXHxMuu';

export interface Person {
  id: string;
  handle: string;
  name: string;
  colour: string;
  wins: number;
  losses: number;
  rounds_won: number;
}

let client: SupabaseClient | null = null;
let booting: Promise<SupabaseClient | null> | null = null;
let user: User | null = null;
let failed = false;

/**
 * The client is imported on demand rather than at module load: it is a
 * hundred-odd kilobytes that a player who never opens Friends should not be
 * made to download.
 */
async function boot(): Promise<SupabaseClient | null> {
  if (client || failed) return client;
  if (booting) return booting;

  booting = (async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      client = createClient(URL, KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'duelboard.auth',
        },
      });
      const { data } = await client.auth.getUser();
      user = data.user ?? null;
      client.auth.onAuthStateChange((_e, session) => {
        user = session?.user ?? null;
        listeners.forEach((l) => l());
      });
      return client;
    } catch {
      failed = true;
      return null;
    }
  })();

  return booting;
}

const listeners = new Set<() => void>();
export function onAuthChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isDown = () => failed;
export const currentUser = () => user;
export const isGuest = () => !!user && user.is_anonymous === true;
export const isSignedIn = () => !!user;

/** A guest is a real account with no identity attached, so progress made now survives being upgraded later. */
export async function signInAsGuest(): Promise<boolean> {
  const c = await boot();
  if (!c) return false;
  if (user) return true;
  const { data, error } = await c.auth.signInAnonymously();
  if (error) return false;
  user = data.user;
  listeners.forEach((l) => l());
  return true;
}

export async function signInWithGoogle(): Promise<boolean> {
  const c = await boot();
  if (!c) return false;
  const { error } = await c.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + location.pathname },
  });
  return !error;
}

export async function signOut(): Promise<void> {
  const c = await boot();
  if (!c) return;
  await c.auth.signOut();
  user = null;
  listeners.forEach((l) => l());
}

export const HANDLE_SHAPE = /^[a-z0-9_]{3,16}$/;

export async function handleFree(handle: string): Promise<boolean | null> {
  const c = await boot();
  if (!c) return null;
  const { data, error } = await c.from('profiles').select('id').eq('handle', handle).maybeSingle();
  if (error) return null;
  return !data;
}

/**
 * Pushes the local profile up under a chosen tag.
 *
 * The row is keyed to the signed-in user, so the database refuses anything
 * written on somebody else's behalf whatever this client asks for.
 */
export async function claimHandle(
  handle: string,
  profile: { name: string; colour: string; coins: number; wins: number; roundsWon: number },
): Promise<boolean> {
  const c = await boot();
  if (!c || !user) return false;
  const { error } = await c.from('profiles').upsert({
    id: user.id,
    handle,
    name: profile.name,
    colour: profile.colour,
    coins: profile.coins,
    wins: profile.wins,
    rounds_won: profile.roundsWon,
    seen_at: new Date().toISOString(),
  });
  return !error;
}

export async function myProfile(): Promise<Person | null> {
  const c = await boot();
  if (!c || !user) return null;
  const { data } = await c
    .from('profiles')
    .select('id,handle,name,colour,wins,losses,rounds_won')
    .eq('id', user.id)
    .maybeSingle();
  return (data as Person) ?? null;
}

/**
 * Two queries rather than a join: the relationship name a join needs is
 * generated, and guessing it wrong fails at runtime rather than here.
 */
export async function people(ids: string[]): Promise<Person[]> {
  const c = await boot();
  if (!c || !ids.length) return [];
  const { data } = await c
    .from('profiles')
    .select('id,handle,name,colour,wins,losses,rounds_won')
    .in('id', ids);
  return (data as Person[]) ?? [];
}

export async function search(q: string): Promise<Person[]> {
  const c = await boot();
  if (!c || !q) return [];
  const { data } = await c
    .from('profiles')
    .select('id,handle,name,colour,wins,losses,rounds_won')
    .ilike('handle', `${q}%`)
    .limit(12);
  return ((data as Person[]) ?? []).filter((p) => !user || p.id !== user.id);
}

export async function friendIds(): Promise<string[]> {
  const c = await boot();
  if (!c || !user) return [];
  const { data } = await c.from('friends').select('friend_id').eq('user_id', user.id);
  return (data ?? []).map((r: { friend_id: string }) => r.friend_id);
}

export async function addFriend(id: string): Promise<boolean> {
  const c = await boot();
  if (!c || !user) return false;
  // insert, not upsert: upsert needs an update policy this table has no use
  // for, and adding the same person twice is already a no-op
  const { error } = await c.from('friends').insert({ user_id: user.id, friend_id: id });
  return !error || error.code === '23505';
}

export async function dropFriend(id: string): Promise<boolean> {
  const c = await boot();
  if (!c || !user) return false;
  const { error } = await c
    .from('friends')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', id);
  return !error;
}

/** People who turned up lately - somebody to add when your list is empty. */
export async function newest(): Promise<Person[]> {
  const c = await boot();
  if (!c) return [];
  const { data } = await c
    .from('profiles')
    .select('id,handle,name,colour,wins,losses,rounds_won')
    .order('created_at', { ascending: false })
    .limit(12);
  return ((data as Person[]) ?? []).filter((p) => !user || p.id !== user.id);
}

export async function recentOpponents(): Promise<string[]> {
  const c = await boot();
  if (!c || !user) return [];
  const { data } = await c
    .from('recent_opponents')
    .select('opponent,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const seen = new Set<string>();
  for (const row of (data ?? []) as { opponent: string | null }[]) {
    if (row.opponent) seen.add(row.opponent);
  }
  return [...seen];
}

export function findByHandle(handle: string): Promise<Person | null> {
  return search(handle).then((rows) => rows.find((r) => r.handle === handle) ?? null);
}

/**
 * An invite link always gets you in, account or not - a guest should never be
 * the reason a friend cannot join the game they were invited to. It is parked
 * in session storage and dropped from the address bar, so a refresh does not
 * re-run it.
 */
const INVITE_KEY = 'duelboard.invite';

export function stashInvite(): void {
  const params = new URLSearchParams(location.search);
  const tag = params.get('add') ?? params.get('invite');
  if (!tag) return;
  try {
    sessionStorage.setItem(INVITE_KEY, tag.toLowerCase());
  } catch {
    /* private mode: the invite is simply lost, which is survivable */
  }
  params.delete('add');
  params.delete('invite');
  const rest = params.toString();
  history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
}

export function pendingInvite(): string | null {
  try {
    return sessionStorage.getItem(INVITE_KEY);
  } catch {
    return null;
  }
}

export function clearInvite(): void {
  try {
    sessionStorage.removeItem(INVITE_KEY);
  } catch {
    /* nothing to clear */
  }
}
