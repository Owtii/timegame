import { useEffect, useMemo, useState } from 'react';

import {
  alreadyGuessed,
  knownRange,
  triesBy,
  type Guess,
  type NumberRound,
} from '../../game/number';

/**
 * Number Guess and Number Duel.
 *
 * Two pads, because two ranges want different things. Over a small range
 * every number fits on screen, so one tap is the whole guess - no typing and
 * nothing to confirm - and anything the clues have already ruled out is dead
 * to the touch. Over 1 to 100 that grid would be unreadable, so it is a
 * keypad, and the note under the entry says why a number will not be accepted
 * before you commit to it.
 *
 * Neither pad hands the phone over: both players see the same clues, so the
 * Higher/Lower reply lands in place and the turn moves on.
 */
export function NumberScreen({
  round,
  names,
  colours,
  actor,
  onGuess,
  botThinking,
  duel,
  tries,
  secondsLeft,
  warn,
}: {
  round: NumberRound;
  names: [string, string];
  colours: [string, string];
  actor: 0 | 1;
  onGuess: (n: number) => void;
  botThinking: boolean;
  duel: boolean;
  tries: number;
  secondsLeft: number;
  warn: boolean;
}) {
  const [entry, setEntry] = useState('');
  const { lo, hi } = knownRange(round);
  const small = round.hi <= 12;

  // a new guess resets the entry: the old digits belonged to the last turn
  useEffect(() => setEntry(''), [round.guesses.length]);

  // the last two are what you actually reason from; the rest is reference
  const recent = round.guesses.slice(-2);
  const older = round.guesses.slice(0, Math.max(0, round.guesses.length - 2));

  const check = useMemo(() => {
    if (!entry) {
      return {
        ok: false,
        note: round.guesses.length ? `Still in play: ${lo} to ${hi}` : `Between 1 and ${round.hi}`,
        bad: false,
      };
    }
    const n = Number.parseInt(entry, 10);
    if (!(n >= 1 && n <= round.hi)) return { ok: false, note: 'Out of range', bad: true };
    if (alreadyGuessed(round, n)) return { ok: false, note: 'Already guessed', bad: true };
    if (n < lo) return { ok: false, note: `Ruled out - it is above ${lo - 1}`, bad: true };
    if (n > hi) return { ok: false, note: `Ruled out - it is below ${hi + 1}`, bad: true };
    return { ok: true, note: '', bad: false };
  }, [entry, hi, lo, round]);

  const send = () => {
    if (!check.ok) return;
    onGuess(Number.parseInt(entry, 10));
  };

  const key = (k: string) => {
    if (k === 'del') {
      setEntry((s) => s.slice(0, -1));
      return;
    }
    if (k === 'go') {
      send();
      return;
    }
    setEntry((s) => {
      if (s.length >= String(round.hi).length) return s;
      if (s === '' && k === '0') return s;
      return s + k;
    });
  };

  return (
    <>
      <span
        style={{
          flex: 'none',
          font: '800 2.4rem/1 Nunito',
          letterSpacing: '.2em',
          color: 'var(--muted)',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {duel
          ? 'Closest guess takes the square'
          : `Guess ${round.guesses.length + 1} of ${round.cap}`}
      </span>

      <Scale round={round} lo={lo} hi={hi} colours={colours} />

      {round.guesses.length > 0 && (
        <div
          style={{
            flex: 'none',
            marginTop: '2rem',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: '1.2rem',
          }}
        >
          <span className="t-micro">STILL IN PLAY</span>
          <span style={{ font: '900 4rem/1 Nunito', color: 'var(--mind)' }}>
            {lo === hi ? `only ${lo}` : `${lo} - ${hi}`}
          </span>
        </div>
      )}

      {/*
        The clue history owns the middle of the screen and centres in it, so an
        empty round reads as a screen waiting for a guess rather than a screen
        with a hole in it.
      */}
      <div
        style={{
          flex: 1,
          minHeight: '18rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.8rem',
          padding: '2.6rem 0',
        }}
      >
        {recent.length === 0 ? (
          <span
            style={{
              font: '700 3rem/1.4 Nunito',
              color: 'var(--dim)',
              textAlign: 'center',
              maxWidth: '24ch',
              alignSelf: 'center',
            }}
          >
            No guesses yet. Every answer narrows the band above.
          </span>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: recent.length === 2 ? '1fr 1fr' : '1fr',
              gap: '1.6rem',
            }}
          >
            {recent.map((g, i) => (
              <Big
                key={`${g.n}-${i}`}
                guess={g}
                name={names[g.by]}
                colour={colours[g.by]}
                faded={recent.length === 2 && i === 0}
              />
            ))}
          </div>
        )}

        {older.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {older.map((g, i) => (
              <span
                key={`${g.n}-${i}`}
                style={{
                  padding: '1rem 1.8rem',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--card-dim)',
                  font: '900 2.6rem/1 Nunito',
                  color: colours[g.by],
                  display: 'inline-flex',
                  gap: '0.6rem',
                  alignItems: 'center',
                }}
              >
                {g.n}
                <span style={{ color: 'var(--faint)' }}>
                  {g.res === 'higher' ? '↑' : g.res === 'lower' ? '↓' : '✓'}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {duel && (
        <span
          style={{
            flex: 'none',
            font: '800 2.4rem/1 Nunito',
            letterSpacing: '.14em',
            color: 'var(--muted)',
            textAlign: 'center',
            marginBottom: '1.8rem',
          }}
        >
          {names[actor].toUpperCase()} · TRY {triesBy(round, actor) + 1} OF {tries}
        </span>
      )}

      {botThinking ? (
        <Thinking name={names[actor]} colour={colours[actor]} />
      ) : small ? (
        <TenKey round={round} lo={lo} hi={hi} colour={colours[actor]} onPick={onGuess} />
      ) : (
        <Keypad
          entry={entry}
          note={check.note}
          bad={check.bad}
          ok={check.ok}
          colour={colours[actor]}
          onKey={key}
        />
      )}

      <span
        style={{
          flex: 'none',
          marginTop: '1.8rem',
          paddingBottom: '4rem',
          font: '800 2.4rem/1 Nunito',
          letterSpacing: '.1em',
          color: warn ? 'var(--p2)' : 'var(--dim)',
          textAlign: 'center',
        }}
      >
        {warn ? `${Math.ceil(secondsLeft)}s LEFT` : 'TAKE YOUR TIME'}
      </span>
    </>
  );
}

/**
 * The whole range at a glance: a lit band for what is still possible and a pin
 * for every number either player has spent.
 */
function Scale({
  round,
  lo,
  hi,
  colours,
}: {
  round: NumberRound;
  lo: number;
  hi: number;
  colours: [string, string];
}) {
  const at = (n: number) => ((n - 1) / Math.max(1, round.hi - 1)) * 100;

  return (
    <div style={{ flex: 'none', marginTop: '2.4rem', position: 'relative', paddingBottom: '3.4rem' }}>
      <div
        style={{
          height: '3.4rem',
          borderRadius: '1.2rem',
          background: 'var(--sunken)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${at(lo)}%`,
            right: `${100 - at(hi)}%`,
            background: 'var(--mind)',
            boxShadow: 'inset 0 -0.8rem 0 rgba(0,0,0,.2)',
            transition: 'left 320ms cubic-bezier(.22,1,.36,1), right 320ms cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>

      {round.guesses.map((g, i) => (
        <span
          key={`${g.n}-${i}`}
          style={{
            position: 'absolute',
            top: '-0.6rem',
            left: `calc(${at(g.n)}% - 0.3rem)`,
            width: '0.6rem',
            height: '4.6rem',
            borderRadius: '0.3rem',
            background: colours[g.by],
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          font: '800 2.2rem/1 Nunito',
          letterSpacing: '.1em',
          color: 'var(--dim)',
        }}
      >
        <span>1</span>
        <span>{round.hi}</span>
      </div>
    </div>
  );
}

function Big({
  guess,
  name,
  colour,
  faded,
}: {
  guess: Guess;
  name: string;
  colour: string;
  faded: boolean;
}) {
  const word =
    guess.res === 'higher' ? 'Go higher' : guess.res === 'lower' ? 'Go lower' : 'Correct';
  const tone =
    guess.res === 'higher' ? 'var(--good)' : guess.res === 'lower' ? 'var(--action)' : 'var(--coin)';

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '3.4rem',
        padding: '2.4rem 2.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        opacity: faded ? 0.55 : 1,
        animation: faded ? undefined : 'db-rise 260ms cubic-bezier(.22,1.4,.36,1) both',
      }}
    >
      <span
        style={{
          font: '800 2.2rem/1 Nunito',
          letterSpacing: '.14em',
          color: colour,
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
      <span style={{ font: '900 9rem/.9 Nunito', color: 'var(--text)' }}>{guess.n}</span>
      <span style={{ font: '900 2.8rem/1 Nunito', color: tone }}>{word}</span>
    </div>
  );
}

/**
 * A ten-key grid: one tap is the whole guess.
 *
 * Numbers already spent, and numbers the clues have excluded, are dead to the
 * touch and look it - the point of the pad is that you cannot waste a try on
 * something the board has already told you is wrong.
 */
function TenKey({
  round,
  lo,
  hi,
  colour,
  onPick,
}: {
  round: NumberRound;
  lo: number;
  hi: number;
  colour: string;
  onPick: (n: number) => void;
}) {
  const cols = round.hi <= 10 ? 5 : 6;

  return (
    <div
      style={{
        flex: 'none',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '1.4rem',
      }}
    >
      {Array.from({ length: round.hi }, (_, i) => i + 1).map((n) => {
        const used = alreadyGuessed(round, n);
        const ruled = !used && (n < lo || n > hi);
        const off = used || ruled;
        return (
          <button
            key={n}
            disabled={off}
            onClick={() => onPick(n)}
            aria-label={
              used ? `${n}, already guessed` : ruled ? `${n}, ruled out` : String(n)
            }
            style={{
              height: '15rem',
              borderRadius: '3rem',
              background: off ? 'var(--card-dim)' : colour,
              color: off ? 'var(--stroke)' : 'var(--on-fill)',
              font: '900 5.4rem/1 Nunito',
              boxShadow: off ? 'none' : '0 1rem 0 rgba(0,0,0,.4)',
              textDecoration: used ? 'line-through' : 'none',
              transition: 'transform 90ms cubic-bezier(.34,1.4,.64,1)',
            }}
            onPointerDown={(e) => {
              if (!off) e.currentTarget.style.transform = 'translateY(0.6rem)';
            }}
            onPointerUp={(e) => (e.currentTarget.style.transform = '')}
            onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function Keypad({
  entry,
  note,
  bad,
  ok,
  colour,
  onKey,
}: {
  entry: string;
  note: string;
  bad: boolean;
  ok: boolean;
  colour: string;
  onKey: (k: string) => void;
}) {
  return (
    <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      <div
        style={{
          height: '13rem',
          background: 'var(--sunken)',
          borderRadius: '3.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 3.4rem',
          gap: '2rem',
        }}
      >
        <span
          style={{
            font: '900 7.6rem/1 Nunito',
            color: entry ? colour : 'var(--stroke)',
            minWidth: '5ch',
          }}
        >
          {entry || '——'}
        </span>
        <span
          style={{
            font: '800 2.4rem/1.2 Nunito',
            color: bad ? 'var(--p2)' : 'var(--muted)',
            textAlign: 'right',
            flex: 1,
          }}
        >
          {note}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.4rem' }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'go'].map((k) => {
          const isGo = k === 'go';
          const live = isGo ? ok : true;
          return (
            <button
              key={k}
              onClick={() => onKey(k)}
              disabled={isGo && !ok}
              style={{
                height: '12.4rem',
                borderRadius: '2.8rem',
                display: 'grid',
                placeItems: 'center',
                background: isGo ? (ok ? colour : 'var(--card-dim)') : k === 'del' ? 'var(--card-dim)' : 'var(--card)',
                color: isGo ? (ok ? 'var(--on-fill)' : 'var(--faint)') : k === 'del' ? 'var(--muted)' : 'var(--text)',
                font: isGo || k === 'del' ? '900 3.2rem/1 Nunito' : '900 5.2rem/1 Nunito',
                letterSpacing: isGo || k === 'del' ? '.08em' : 0,
                boxShadow: isGo && ok ? '0 1rem 0 rgba(0,0,0,.4)' : 'none',
                transition: 'transform 90ms cubic-bezier(.34,1.4,.64,1)',
              }}
              onPointerDown={(e) => {
                if (live) e.currentTarget.style.transform = 'scale(.94)';
              }}
              onPointerUp={(e) => (e.currentTarget.style.transform = '')}
              onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              {k === 'del' ? 'DEL' : isGo ? 'GUESS' : k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Thinking({ name, colour }: { name: string; colour: string }) {
  return (
    <div
      style={{
        flex: 'none',
        height: '20rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.4rem',
      }}
    >
      <span style={{ font: '800 2.8rem/1 Nunito', letterSpacing: '.12em', color: 'var(--muted)' }}>
        {name.toUpperCase()} IS WORKING IT OUT
      </span>
      <span style={{ display: 'flex', gap: '1.4rem' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="pulse"
            style={{
              width: '2.4rem',
              height: '2.4rem',
              borderRadius: '50%',
              background: colour,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </span>
    </div>
  );
}
