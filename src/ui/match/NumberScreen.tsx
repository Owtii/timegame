import { useState } from 'react';

import { alreadyGuessed, knownRange, type Guess, type NumberRound } from '../../game/number';

type LastGuess = Guess | undefined;

/**
 * Number Guess and Number Duel.
 *
 * The number games never hand the phone over: both players see the same
 * clues, so the Higher/Lower reply flashes in place and the turn just moves
 * on. The live range is the whole point of the screen, so it gets the top.
 */
export function NumberScreen({
  round,
  names,
  colours,
  actor,
  onGuess,
  locked,
}: {
  round: NumberRound;
  names: [string, string];
  colours: [string, string];
  actor: 0 | 1;
  onGuess: (n: number) => void;
  locked: boolean;
}) {
  const [entry, setEntry] = useState('');
  const { lo, hi } = knownRange(round);

  const last: [LastGuess, LastGuess] = [
    [...round.guesses].reverse().find((g) => g.by === 0),
    [...round.guesses].reverse().find((g) => g.by === 1),
  ];

  const n = Number.parseInt(entry, 10);
  const valid =
    entry.length > 0 && Number.isFinite(n) && n >= 1 && n <= round.hi && !alreadyGuessed(round, n);

  const send = () => {
    if (!valid || locked) return;
    onGuess(n);
    setEntry('');
  };

  const key = (k: string) => {
    if (locked) return;
    if (k === 'c') {
      setEntry('');
      return;
    }
    if (k === 'go') {
      send();
      return;
    }
    const next = (entry + k).replace(/^0+/, '');
    if (next.length > String(round.hi).length) return;
    setEntry(next);
  };

  return (
    <>
      <div
        className="card"
        style={{
          flex: 'none',
          borderRadius: '4rem',
          padding: '3rem 3.4rem 3.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="t-label">STILL POSSIBLE</span>
          <span style={{ font: '900 4.4rem/1 Nunito', color: 'var(--mind)' }}>
            {lo} - {hi}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <span
            style={{
              flex: Math.max(0.001, lo - 1),
              height: '4.4rem',
              borderRadius: '1.2rem 0.6rem 0.6rem 1.2rem',
              background: 'var(--sunken)',
            }}
          />
          <span
            style={{
              flex: Math.max(0.001, hi - lo + 1),
              height: '4.4rem',
              borderRadius: '0.6rem',
              background: 'var(--mind)',
              boxShadow: 'inset 0 -0.8rem 0 rgba(0,0,0,.18)',
              transition: 'flex-grow 320ms cubic-bezier(.22,1,.36,1)',
            }}
          />
          <span
            style={{
              flex: Math.max(0.001, round.hi - hi),
              height: '4.4rem',
              borderRadius: '0.6rem 1.2rem 1.2rem 0.6rem',
              background: 'var(--sunken)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            font: '800 2.4rem/1 Nunito',
            letterSpacing: '.1em',
            color: 'var(--dim)',
          }}
        >
          <span>1</span>
          <span>{Math.round(round.hi / 2)}</span>
          <span>{round.hi}</span>
        </div>
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: '2.4rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.8rem',
        }}
      >
        {[0, 1].map((p) => (
          <GuessCard
            key={p}
            name={names[p]}
            colour={colours[p]}
            guess={last[p]}
            live={actor === p}
          />
        ))}
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: '2.4rem',
          height: '13rem',
          background: 'var(--sunken)',
          borderRadius: '3.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 3.6rem',
        }}
      >
        <span style={{ font: '800 2.6rem/1 Nunito', letterSpacing: '.18em', color: 'var(--muted)' }}>
          ENTER A NUMBER
        </span>
        <span style={{ font: '900 8.8rem/1 Nunito', color: colours[actor] }}>
          {entry || <span style={{ color: 'var(--stroke)' }}>_</span>}
        </span>
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: '2.4rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.6rem',
          paddingBottom: '2rem',
        }}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'c', '0', 'go'].map((k) => (
          <button
            key={k}
            onClick={() => key(k)}
            disabled={locked || (k === 'go' && !valid)}
            style={{
              height: '11.8rem',
              borderRadius: '2.8rem',
              display: 'grid',
              placeItems: 'center',
              background:
                k === 'go' ? (valid ? colours[actor] : 'var(--card-dim)') : k === 'c' ? 'var(--card-dim)' : 'var(--card)',
              boxShadow: k === 'go' && valid ? `0 1rem 0 rgba(0,0,0,.35)` : 'none',
              color: k === 'go' && valid ? 'var(--on-fill)' : k === 'c' ? 'var(--faint)' : 'var(--text)',
              font:
                k === 'go' || k === 'c' ? '900 3.4rem/1 Nunito' : '900 5.2rem/1 Nunito',
              letterSpacing: k === 'go' || k === 'c' ? '.08em' : 0,
              transition: 'transform 90ms cubic-bezier(.34,1.4,.64,1)',
            }}
            onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(.94)')}
            onPointerUp={(e) => (e.currentTarget.style.transform = '')}
            onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
          >
            {k === 'c' ? 'CLEAR' : k === 'go' ? 'GUESS' : k}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: '1rem' }} />

      {round.guesses.length > 0 && (
        <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: '1.6rem', paddingBottom: '4rem' }}>
          <span className="t-label">RULED OUT</span>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            {round.guesses.map((g, i) => (
              <span
                key={i}
                style={{
                  padding: '1.4rem 2.4rem',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--card-dim)',
                  font: '900 3rem/1 Nunito',
                  color: 'var(--stroke)',
                  textDecoration: 'line-through',
                }}
              >
                {g.n}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function GuessCard({
  name,
  colour,
  guess,
  live,
}: {
  name: string;
  colour: string;
  guess: LastGuess;
  live: boolean;
}) {
  const verdict =
    guess?.res === 'higher'
      ? { text: 'GO HIGHER', bg: 'var(--good)' }
      : guess?.res === 'lower'
        ? { text: 'GO LOWER', bg: 'var(--action)' }
        : guess?.res === 'hit'
          ? { text: 'EXACT', bg: 'var(--coin)' }
          : null;

  return (
    <div
      className="card"
      style={{
        borderRadius: '3.6rem',
        padding: '2.6rem 2.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        outline: live ? `0.5rem solid ${colour}` : 'none',
        outlineOffset: '-0.5rem',
        transition: 'outline-color 200ms ease',
      }}
    >
      <span
        style={{
          font: '800 2.2rem/1 Nunito',
          letterSpacing: '.16em',
          color: colour,
          textTransform: 'uppercase',
        }}
      >
        {name} {guess ? 'GUESSED' : 'TO PLAY'}
      </span>
      <span
        style={{
          font: '900 10.8rem/.9 Nunito',
          color: guess ? 'var(--text)' : 'var(--stroke)',
        }}
      >
        {guess ? guess.n : '00'}
      </span>
      <span
        style={{
          font: '900 3rem/1 Nunito',
          letterSpacing: '.08em',
          color: verdict ? 'var(--on-fill)' : 'var(--dim)',
          background: verdict ? verdict.bg : 'var(--sunken)',
          padding: '1.4rem 0',
          borderRadius: 'var(--r-pill)',
          textAlign: 'center',
          transition: 'background-color 220ms ease',
        }}
      >
        {verdict ? verdict.text : 'WAITING'}
      </span>
    </div>
  );
}
