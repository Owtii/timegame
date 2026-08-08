import { useState } from 'react';

import { useSaveData } from '../../state/store';
import { ScreenHead } from '../primitives';

interface Friend {
  name: string;
  handle: string;
  score: number;
  colour: string;
}

/**
 * Friends are for comparing notes; matches are still played on one phone.
 *
 * The list is local until the Supabase tables are wired up - a stub that
 * pretends to be online would be worse than one that says what it is.
 */
export function FriendsScreen() {
  const save = useSaveData();
  const [handle, setHandle] = useState('');
  const [friends, setFriends] = useState<Friend[]>([
    { name: 'Max', handle: '@maxwell', score: 1402, colour: 'var(--p2)' },
    { name: 'Priya', handle: '@priyab', score: 1190, colour: 'var(--good)' },
    { name: 'Jonah', handle: '@jonah_k', score: 964, colour: 'var(--action)' },
    { name: 'Sam', handle: '@samsam', score: 877, colour: 'var(--mind)' },
  ]);

  const add = () => {
    const trimmed = handle.trim().replace(/^@+/, '');
    if (!trimmed) return;
    setFriends((f) => [
      ...f,
      {
        name: trimmed.slice(0, 12),
        handle: `@${trimmed}`,
        score: 1000,
        colour: 'var(--p1)',
      },
    ]);
    setHandle('');
  };

  return (
    <div className="screen-scroll" style={{ paddingTop: '3.4rem' }}>
      <ScreenHead title="Friends" />

      <div style={{ display: 'flex', gap: '1.6rem', flex: 'none', marginBottom: '3.6rem' }}>
        <div
          style={{
            flex: 1,
            height: '13rem',
            borderRadius: 'var(--r-pill)',
            background: 'var(--card)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 4rem',
            gap: '1.6rem',
            minWidth: 0,
          }}
        >
          <span style={{ font: '900 4.4rem/1 Nunito', color: 'var(--faint)' }}>@</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="username"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'none',
              border: 0,
              outline: 'none',
              font: '800 3.6rem/1 Nunito',
              color: 'var(--text)',
            }}
          />
        </div>
        <button
          onClick={add}
          style={{
            width: '23rem',
            height: '13rem',
            borderRadius: 'var(--r-pill)',
            background: 'var(--p1)',
            display: 'grid',
            placeItems: 'center',
            font: '900 3.8rem/1 Nunito',
            letterSpacing: '.06em',
            color: 'var(--on-fill)',
            boxShadow: '0 1.2rem 0 var(--p1-lip)',
            flex: 'none',
          }}
        >
          ADD
        </button>
      </div>

      <span className="t-label" style={{ flex: 'none', marginBottom: '1.8rem' }}>
        {friends.length} FRIENDS
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', flex: 'none' }}>
        <Row name={save.name} handle="you" score={save.mind.score} colour="var(--coin)" me />
        {friends.map((f) => (
          <Row key={f.handle} {...f} />
        ))}
      </div>

      <span
        style={{
          flex: 'none',
          margin: '3.4rem 0 4rem',
          font: '700 2.6rem/1.4 Nunito',
          color: 'var(--dim)',
          textAlign: 'center',
        }}
      >
        Friends are for comparing notes. Matches are still played on one phone.
      </span>
    </div>
  );
}

function Row({
  name,
  handle,
  score,
  colour,
  me,
}: {
  name: string;
  handle: string;
  score: number;
  colour: string;
  me?: boolean;
}) {
  return (
    <div
      style={{
        height: '16.8rem',
        background: 'var(--card)',
        borderRadius: '4rem',
        display: 'flex',
        alignItems: 'center',
        padding: '0 3.4rem',
        gap: '2.6rem',
        outline: me ? '0.5rem solid var(--coin)' : 'none',
        outlineOffset: '-0.5rem',
      }}
    >
      <span
        style={{
          width: '10.4rem',
          height: '10.4rem',
          borderRadius: '3.2rem',
          background: colour,
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
        }}
      >
        <span
          style={{
            width: '5.2rem',
            height: '5.2rem',
            borderRadius: '50%',
            border: '1.4rem solid var(--on-fill)',
          }}
        />
      </span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 0 }}>
        <span
          style={{
            font: '900 4rem/1 Nunito',
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        <span style={{ font: '700 2.6rem/1 Nunito', color: 'var(--dim)' }}>{handle}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem', flex: 'none' }}>
        <span style={{ font: '800 2rem/1 Nunito', letterSpacing: '.16em', color: 'var(--muted)' }}>
          MIND SCORE
        </span>
        <span style={{ font: '900 4.6rem/1 Nunito', color: 'var(--mind)' }}>
          {score.toLocaleString('en-GB')}
        </span>
      </span>
    </div>
  );
}
