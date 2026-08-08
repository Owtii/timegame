import { useCallback, useEffect, useRef, useState } from 'react';

import * as NET from '../../net/supabase';
import { colourById } from '../../state/cosmetics';
import { useSaveData } from '../../state/store';
import { Btn, ScreenHead } from '../primitives';

/**
 * People.
 *
 * One page in the order you actually want it: the people you keep, then the
 * people you just played, then everyone else who turned up recently. A tag is
 * how anyone finds anyone, so the search sits above all three.
 *
 * Nothing here is required to play. With no account, no connection or no
 * project configured, this is the only screen that changes - and it says so
 * rather than pretending to have a list.
 */
export function FriendsScreen({ onProfile }: { onProfile: () => void }) {
  const save = useSaveData();

  const [signedIn, setSignedIn] = useState(NET.isSignedIn());
  const [friends, setFriends] = useState<NET.Person[]>([]);
  const [recent, setRecent] = useState<NET.Person[]>([]);
  const [fresh, setFresh] = useState<NET.Person[]>([]);
  const [known, setKnown] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [down, setDown] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NET.Person[] | null>(null);
  const debounce = useRef(0);

  useEffect(() => NET.onAuthChange(() => setSignedIn(NET.isSignedIn())), []);

  const load = useCallback(async () => {
    if (!save.handle) return;
    setLoading(true);
    try {
      const ids = await NET.friendIds();
      setKnown(ids);

      const [mine, opponentIds, newcomers] = await Promise.all([
        NET.people(ids),
        NET.recentOpponents(),
        NET.newest(),
      ]);

      setFriends(mine);
      setRecent(await NET.people(opponentIds.slice(0, 12)));
      setFresh(newcomers);
      setDown(NET.isDown());
    } catch {
      setDown(true);
    } finally {
      setLoading(false);
    }
  }, [save.handle]);

  useEffect(() => {
    void load();
  }, [load, signedIn]);

  // an invite link is honoured the moment there is a tag to add them from
  useEffect(() => {
    const tag = NET.pendingInvite();
    if (!tag || !save.handle) return;
    void (async () => {
      const person = await NET.findByHandle(tag);
      NET.clearInvite();
      if (person && (await NET.addFriend(person.id))) void load();
    })();
  }, [load, save.handle]);

  const onQuery = (raw: string) => {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setQuery(v);
    window.clearTimeout(debounce.current);

    if (v.length < 2) {
      setResults(null);
      return;
    }
    // a keystroke is not a query: the search waits for you to stop typing
    debounce.current = window.setTimeout(async () => {
      setResults(await NET.search(v));
    }, 260);
  };

  const add = async (id: string) => {
    if (await NET.addFriend(id)) {
      setKnown((k) => [...k, id]);
      void load();
    }
  };

  const drop = async (id: string) => {
    if (await NET.dropFriend(id)) {
      setKnown((k) => k.filter((x) => x !== id));
      void load();
    }
  };

  // ---------- no tag yet ----------

  if (!save.handle) {
    return (
      <div className="screen-scroll" style={{ paddingTop: '3.4rem' }}>
        <ScreenHead title="Friends" />
        <Empty
          title="Pick a tag first"
          body="A tag is how people find you, and how you find them. It takes one tap, and you can carry on playing without one."
        />
        <div style={{ marginTop: '3rem', flex: 'none' }}>
          <Btn onClick={onProfile}>PICK A TAG</Btn>
        </div>
        <OnPhone />
      </div>
    );
  }

  // ---------- the list ----------

  const showing = results ?? null;

  return (
    <div className="screen-scroll" style={{ paddingTop: '3.4rem' }}>
      <ScreenHead
        title="Friends"
        right={
          <span style={{ font: '800 2.4rem/1 Nunito', letterSpacing: '.14em', color: 'var(--muted)' }}>
            @{save.handle}
          </span>
        }
      />

      <div
        style={{
          flex: 'none',
          height: '13rem',
          borderRadius: 'var(--r-pill)',
          background: 'var(--card)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4rem',
          gap: '1.6rem',
          marginBottom: '3rem',
        }}
      >
        <span style={{ font: '900 4rem/1 Nunito', color: 'var(--faint)' }}>@</span>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Add someone by their tag"
          autoCapitalize="none"
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'none',
            border: 0,
            outline: 'none',
            font: '800 3rem/1 Nunito',
            color: 'var(--text)',
          }}
        />
      </div>

      {down && (
        <Empty
          title="Cannot reach the server"
          body="Every game still works, and the base is still running. This list will fill in when the connection comes back."
        />
      )}

      {showing && (
        <Section title="Results" count={showing.length}>
          {showing.length ? (
            showing.map((p) => (
              <Row
                key={p.id}
                person={p}
                known={known.includes(p.id)}
                onAdd={() => add(p.id)}
                onDrop={() => drop(p.id)}
              />
            ))
          ) : (
            <Empty title="Nobody by that tag" body="Tags are exact. Check the spelling, or share yours instead." />
          )}
        </Section>
      )}

      {!showing && (
        <>
          <Section title="Friends" count={friends.length}>
            {friends.length ? (
              friends.map((p) => (
                <Row key={p.id} person={p} known onAdd={() => add(p.id)} onDrop={() => drop(p.id)} />
              ))
            ) : (
              <Empty
                title={loading ? 'Loading' : 'Nobody yet'}
                body="Search a tag above, or add someone you have played."
              />
            )}
          </Section>

          {recent.length > 0 && (
            <Section title="Recently played" count={recent.length}>
              {recent.map((p) => (
                <Row
                  key={p.id}
                  person={p}
                  known={known.includes(p.id)}
                  onAdd={() => add(p.id)}
                  onDrop={() => drop(p.id)}
                />
              ))}
            </Section>
          )}

          {fresh.filter((p) => !known.includes(p.id)).length > 0 && (
            <Section title="New here">
              {fresh
                .filter((p) => !known.includes(p.id))
                .slice(0, 6)
                .map((p) => (
                  <Row
                    key={p.id}
                    person={p}
                    known={false}
                    onAdd={() => add(p.id)}
                    onDrop={() => drop(p.id)}
                  />
                ))}
            </Section>
          )}
        </>
      )}

      <OnPhone />
    </div>
  );
}

/** The two people who can actually play right now, whatever the network says. */
function OnPhone() {
  const save = useSaveData();
  return (
    <>
      <span className="t-label" style={{ display: 'block', margin: '3.4rem 0 1.8rem', flex: 'none' }}>
        ON THIS PHONE
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', flex: 'none' }}>
        {[
          { name: save.name, colour: save.wornColour, sub: save.handle ? `@${save.handle}` : 'no tag yet' },
          { name: save.rival.name, colour: save.rival.colour, sub: 'pass and play' },
        ].map((p) => (
          <div
            key={p.name + p.sub}
            style={{
              height: '13rem',
              background: 'var(--card)',
              borderRadius: '3.4rem',
              display: 'flex',
              alignItems: 'center',
              padding: '0 3rem',
              gap: '2.2rem',
            }}
          >
            <span
              style={{
                width: '8rem',
                height: '8rem',
                borderRadius: '2.6rem',
                background: colourById(p.colour).hex,
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <span
                style={{
                  width: '3.6rem',
                  height: '3.6rem',
                  borderRadius: '50%',
                  border: '1rem solid var(--on-fill)',
                }}
              />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
              <span style={{ font: '900 3.4rem/1 Nunito', color: 'var(--text)' }}>{p.name}</span>
              <span style={{ font: '700 2.4rem/1 Nunito', color: 'var(--dim)' }}>{p.sub}</span>
            </span>
          </div>
        ))}
      </div>

      <span
        style={{
          flex: 'none',
          margin: '3rem 0 4rem',
          font: '700 2.6rem/1.4 Nunito',
          color: 'var(--dim)',
          textAlign: 'center',
        }}
      >
        Friends are for comparing notes and swapping tags. Matches are still played on one phone.
      </span>
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ flex: 'none', marginBottom: '2.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.2rem', marginBottom: '1.6rem' }}>
        <span className="t-label">{title}</span>
        {count !== undefined && (
          <span style={{ font: '900 2.4rem/1 Nunito', color: 'var(--faint)' }}>{count}</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>{children}</div>
    </div>
  );
}

function Row({
  person,
  known,
  onAdd,
  onDrop,
}: {
  person: NET.Person;
  known: boolean;
  onAdd: () => void;
  onDrop: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const colour = colourById(person.colour).hex;

  const act = async () => {
    setBusy(true);
    await (known ? onDrop() : onAdd());
    setBusy(false);
  };

  return (
    <div
      style={{
        minHeight: '14.4rem',
        background: 'var(--card)',
        borderRadius: '3.4rem',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2.8rem',
        gap: '2.2rem',
      }}
    >
      <span
        style={{
          width: '9rem',
          height: '9rem',
          borderRadius: '2.8rem',
          background: colour,
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
        }}
      >
        <span
          style={{ width: '4rem', height: '4rem', borderRadius: '50%', border: '1.2rem solid var(--on-fill)' }}
        />
      </span>

      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
        <span
          style={{
            font: '900 3.4rem/1 Nunito',
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {person.name || person.handle}
        </span>
        <span style={{ font: '700 2.4rem/1 Nunito', color: 'var(--dim)' }}>@{person.handle}</span>
        <span style={{ font: '700 2.2rem/1 Nunito', color: 'var(--faint)' }}>
          {person.wins}W · {person.rounds_won} rounds
        </span>
      </span>

      <button
        onClick={act}
        disabled={busy}
        style={{
          height: '9rem',
          padding: '0 2.8rem',
          borderRadius: 'var(--r-pill)',
          background: known ? 'var(--sunken)' : 'var(--p1)',
          color: known ? 'var(--muted)' : 'var(--on-fill)',
          font: '900 2.6rem/1 Nunito',
          boxShadow: known ? 'none' : '0 0.8rem 0 var(--p1-lip)',
          flex: 'none',
        }}
      >
        {busy ? '...' : known ? 'REMOVE' : 'ADD'}
      </button>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        flex: 'none',
        background: 'var(--card-dim)',
        borderRadius: '3.4rem',
        padding: '3.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
      }}
    >
      <span style={{ font: '900 3.6rem/1 Nunito', color: 'var(--text)' }}>{title}</span>
      <span style={{ font: '700 2.6rem/1.4 Nunito', color: 'var(--muted)' }}>{body}</span>
    </div>
  );
}
