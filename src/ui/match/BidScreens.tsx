import { useEffect, useRef, useState } from 'react';

import { SQUARE_NAMES } from '../../game/board';
import type { BidVerdict } from '../../game/bid';
import type { Mark } from '../../game/types';
import { Btn } from '../primitives';
import { AutoAdvance } from './pacing';

/**
 * A bid is a dial, not a typed number.
 *
 * Bidding is a judgement about a fraction of your pool, so dragging the
 * block meter gets you there in one gesture and the +/- keys settle the
 * exact figure. It also costs half the height of a keypad, which the rest of
 * the screen takes instead.
 */
export function BidPlace({
  square,
  cells,
  colours,
  names,
  me,
  balance,
  value,
  setValue,
  onSeal,
  secondsLeft,
  totalSeconds,
}: {
  square: number;
  cells: Mark[];
  colours: [string, string];
  names: [string, string];
  me: 0 | 1;
  balance: [number, number];
  value: number;
  setValue: (n: number) => void;
  onSeal: () => void;
  secondsLeft: number;
  totalSeconds: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const max = balance[me];
  const them = (1 - me) as 0 | 1;

  const dragTo = (clientX: number) => {
    const el = track.current;
    if (!el || max <= 0) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setValue(Math.round(f * max));
  };

  const blocks = Math.max(1, Math.min(24, max));
  const filled = max > 0 ? Math.round((value / max) * blocks) : 0;
  const fuseBlocks = 12;

  return (
    <>
      <div
        style={{
          flex: 'none',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.8rem',
        }}
      >
        <PoolCard cap="YOUR POOL" name={names[me]} value={balance[me]} colour={colours[me]} mine />
        <PoolCard cap="THEIR POOL" name={names[them]} value={balance[them]} colour={colours[them]} />
      </div>

      <div
        className="card"
        style={{
          flex: 'none',
          marginTop: '2.6rem',
          borderRadius: '3.6rem',
          padding: '2.4rem 3.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <span className="t-label">UP FOR BID</span>
          <span
            style={{
              font: '900 7.6rem/1 Nunito',
              letterSpacing: '-.02em',
              color: 'var(--action)',
              textTransform: 'uppercase',
            }}
          >
            {SQUARE_NAMES[square]}
          </span>
        </span>
        <MiniBoard cells={cells} colours={colours} highlight={square} />
      </div>

      <div
        className="card"
        style={{
          flex: 'none',
          marginTop: '2.6rem',
          borderRadius: '4.4rem',
          padding: '3.2rem 3.2rem 3.6rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2.4rem',
        }}
      >
        <span className="t-label">YOUR BID</span>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Step onClick={() => setValue(Math.max(0, value - 1))} colour="var(--sunken)" glyph="minus" />
          <span
            style={{
              font: '900 19rem/.82 Nunito',
              letterSpacing: '-.05em',
              color: 'var(--text)',
            }}
          >
            {value}
          </span>
          <Step onClick={() => setValue(Math.min(max, value + 1))} colour={colours[me]} glyph="plus" />
        </div>

        <div
          ref={track}
          className="meter"
          style={{ touchAction: 'none', cursor: 'ew-resize' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragTo(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons) dragTo(e.clientX);
          }}
        >
          {Array.from({ length: blocks }, (_, i) => (
            <span
              key={i}
              style={{
                height: '3.8rem',
                background: i < filled ? colours[me] : 'var(--sunken)',
              }}
            />
          ))}
        </div>

        <span style={{ font: '800 2.7rem/1 Nunito', letterSpacing: '.08em', color: 'var(--muted)' }}>
          {value === 0
            ? 'PASSING BANKS YOU +1'
            : `${Math.round((value / Math.max(1, max)) * 100)}% OF YOUR ${max} POINTS`}
        </span>
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: '2.6rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.6rem',
        }}
      >
        <Preset label="PASS +1" colour="var(--good)" onClick={() => setValue(0)} />
        <Preset label="HALF" colour="var(--on-fill)" fill={colours[me]} onClick={() => setValue(Math.floor(max / 2))} />
        <Preset label="ALL IN" colour="var(--action)" onClick={() => setValue(max)} />
      </div>

      <div style={{ flex: 'none', marginTop: '2.6rem' }}>
        <Btn onClick={onSeal} style={{ height: '15.2rem', fontSize: '5.4rem', letterSpacing: '.1em' }}>
          SEAL
        </Btn>
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: 'auto',
          paddingTop: '3rem',
          paddingBottom: '4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.4rem',
          alignItems: 'center',
        }}
      >
        <div className="meter thin">
          {Array.from({ length: fuseBlocks }, (_, i) => (
            <span
              key={i}
              style={{
                background:
                  i < Math.ceil((secondsLeft / totalSeconds) * fuseBlocks)
                    ? 'var(--action)'
                    : 'var(--sunken)',
              }}
            />
          ))}
        </div>
        <span style={{ font: '800 2.6rem/1 Nunito', letterSpacing: '.1em', color: 'var(--dim)' }}>
          {Math.ceil(secondsLeft)}s TO SEAL · BOTH PLAYERS PAY WHAT THEY BID
        </span>
      </div>
    </>
  );
}

function PoolCard({
  cap,
  name,
  value,
  colour,
  mine,
}: {
  cap: string;
  name: string;
  value: number;
  colour: string;
  mine?: boolean;
}) {
  return (
    <div
      style={{
        background: mine ? colour : 'var(--card)',
        borderRadius: '3.2rem',
        padding: '2rem 2.6rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: mine ? '0 1rem 0 rgba(0,0,0,.35)' : 'none',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
        <span
          style={{
            font: '800 2.1rem/1 Nunito',
            letterSpacing: '.16em',
            color: mine ? 'rgba(10,12,17,.62)' : 'var(--dim)',
          }}
        >
          {cap}
        </span>
        <span
          style={{
            font: '900 3.4rem/1 Nunito',
            color: mine ? 'var(--on-fill)' : colour,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
      </span>
      <span style={{ font: '900 6.8rem/1 Nunito', color: mine ? 'var(--on-fill)' : colour }}>
        {value}
      </span>
    </div>
  );
}

function Step({ onClick, colour, glyph }: { onClick: () => void; colour: string; glyph: 'plus' | 'minus' }) {
  const bar = {
    background: colour === 'var(--sunken)' ? 'var(--text)' : 'var(--on-fill)',
    borderRadius: '0.6rem',
    position: 'absolute' as const,
  };
  return (
    <button
      onClick={onClick}
      style={{
        width: '13.2rem',
        height: '13.2rem',
        borderRadius: '50%',
        background: colour,
        boxShadow: '0 1rem 0 rgba(0,0,0,.42)',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        flex: 'none',
        transition: 'transform 90ms cubic-bezier(.34,1.3,.64,1)',
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = 'translateY(0.6rem)')}
      onPointerUp={(e) => (e.currentTarget.style.transform = '')}
      onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      <span style={{ ...bar, width: '5.4rem', height: '1.2rem' }} />
      {glyph === 'plus' && <span style={{ ...bar, width: '1.2rem', height: '5.4rem' }} />}
    </button>
  );
}

function Preset({
  label,
  colour,
  fill,
  onClick,
}: {
  label: string;
  colour: string;
  fill?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '11rem',
        borderRadius: 'var(--r-pill)',
        background: fill ?? 'var(--sunken)',
        color: colour,
        font: '900 3rem/1 Nunito',
        boxShadow: '0 0.8rem 0 rgba(0,0,0,.4)',
        transition: 'transform 90ms cubic-bezier(.34,1.3,.64,1)',
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = 'translateY(0.5rem)')}
      onPointerUp={(e) => (e.currentTarget.style.transform = '')}
      onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      {label}
    </button>
  );
}

export function MiniBoard({
  cells,
  colours,
  highlight,
  size = 4.4,
}: {
  cells: Mark[];
  colours: [string, string];
  highlight?: number;
  size?: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(3, ${size}rem)`,
        gridTemplateRows: `repeat(3, ${size}rem)`,
        gap: '0.8rem',
        flex: 'none',
      }}
    >
      {cells.map((v, i) => (
        <span
          key={i}
          style={{
            borderRadius: '1.2rem',
            background:
              v !== null ? colours[v] : i === highlight ? 'var(--action)' : 'var(--sunken)',
            boxShadow: i === highlight ? '0 0 0 0.6rem rgba(255,176,32,.28)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

/**
 * The reveal is the beat the round is built around.
 *
 * Both numbers stay masked through a held pause, then flip up together
 * rather than one after the other - reading one before the other would leak
 * the result early. The winner scales up and the loser crumples, so the two
 * outcomes worth reacting to look different from an ordinary win.
 */
export function BidReveal({
  square,
  bids,
  verdict,
  names,
  colours,
  cells,
  balance,
  onNext,
  paused,
  seconds,
}: {
  square: number;
  bids: [number, number];
  verdict: BidVerdict;
  names: [string, string];
  colours: [string, string];
  cells: Mark[];
  balance: [number, number];
  onNext: () => void;
  paused?: boolean;
  seconds: number;
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFlipped(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const headline = verdict.forced
    ? `${names[verdict.winner as 0 | 1].toUpperCase()} TAKES IT`
    : verdict.tied
      ? verdict.bothPassed
        ? 'BOTH PASSED'
        : 'TIED'
      : `${names[verdict.winner as 0 | 1].toUpperCase()} TAKES IT`;

  const sub = verdict.forced
    ? 'Third double pass - the square goes to whoever named it.'
    : verdict.bothPassed
      ? 'Both banked a point. The square comes straight back.'
      : verdict.tied
        ? 'Nobody takes it, and both still pay. Same square, same pick.'
        : verdict.close
          ? `Won by one - and both pools paid.`
          : verdict.decisive
            ? `Blown away by ${verdict.difference} - and both pools paid.`
            : `Ahead by ${verdict.difference} - and both pools paid.`;

  return (
    <>
      {verdict.winner >= 0 && (
        <div
          className="bloom"
          style={{
            width: '90rem',
            height: '90rem',
            top: '8rem',
            left: '50%',
            marginLeft: '-45rem',
            background: `radial-gradient(circle, ${colours[verdict.winner as 0 | 1]}4D, transparent 66%)`,
            opacity: flipped ? 1 : 0,
            transition: 'opacity 500ms ease',
          }}
        />
      )}

      <div
        style={{
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 1,
        }}
      >
        <span style={{ font: '800 2.4rem/1 Nunito', letterSpacing: '.24em', color: 'var(--muted)' }}>
          SEALED BIDS FOR
        </span>
        <span style={{ font: '900 6rem/1 Nunito', color: 'var(--action)', textTransform: 'uppercase' }}>
          {SQUARE_NAMES[square]}
        </span>
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: '5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2.4rem',
          zIndex: 1,
        }}
      >
        {[0, 1].map((p) => {
          const won = flipped && verdict.winner === p;
          const lost = flipped && verdict.winner >= 0 && verdict.winner !== p;
          return (
            <div
              key={p}
              style={{
                flex: 1,
                background: 'var(--card)',
                borderRadius: '4.4rem',
                overflow: 'hidden',
                boxShadow: won
                  ? `0 1.8rem 0 #0E0C28, 0 0 0 0.8rem ${colours[p]}59`
                  : '0 1.4rem 0 #0E0C28',
                transform: won ? 'scale(1.06)' : lost ? 'rotate(-7deg) scale(.82)' : 'scale(1)',
                opacity: lost ? 0.5 : 1,
                transition: 'transform 520ms cubic-bezier(.22,1.5,.36,1), opacity 400ms ease',
              }}
            >
              <div style={{ height: '11rem', background: colours[p], display: 'grid', placeItems: 'center' }}>
                <span
                  style={{
                    font: '900 3.8rem/1 Nunito',
                    letterSpacing: '.1em',
                    color: 'var(--on-fill)',
                    textTransform: 'uppercase',
                  }}
                >
                  {names[p]}
                </span>
              </div>
              <div
                style={{
                  padding: '3.6rem 0 4.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2.6rem',
                }}
              >
                <span
                  style={{
                    font: '900 17rem/1 Nunito',
                    color: won ? colours[p] : 'var(--text)',
                    minHeight: '17rem',
                  }}
                >
                  {flipped ? bids[p] : '?'}
                </span>
                <span
                  style={{
                    font: '800 2.6rem/1 Nunito',
                    letterSpacing: '.12em',
                    color: 'var(--muted)',
                  }}
                >
                  POOL NOW {balance[p]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: '4.4rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.4rem',
          textAlign: 'center',
          opacity: flipped ? 1 : 0,
          transition: 'opacity 320ms ease 120ms',
          zIndex: 1,
        }}
      >
        <span style={{ font: '900 6.6rem/1 Nunito', letterSpacing: '-.01em', color: 'var(--text)' }}>
          {headline}
        </span>
        <span style={{ font: '700 3.2rem/1.25 Nunito', color: 'var(--muted)' }}>{sub}</span>
      </div>

      <div style={{ flex: 'none', marginTop: '4rem', display: 'grid', placeItems: 'center', zIndex: 1 }}>
        <MiniBoard cells={cells} colours={colours} size={13} />
      </div>

      <div style={{ flex: 1, minHeight: '2rem' }} />

      <div style={{ flex: 'none', paddingTop: '3rem', paddingBottom: '5rem', zIndex: 1 }}>
        {flipped ? (
          <AutoAdvance
            seconds={seconds}
            label={verdict.winner >= 0 ? 'Next square' : 'Bid again'}
            tone={verdict.winner >= 0 ? colours[verdict.winner as 0 | 1] : 'var(--action)'}
            onDone={onNext}
            paused={paused}
          />
        ) : (
          <span
            style={{
              display: 'block',
              font: '800 2.4rem/1 Nunito',
              letterSpacing: '.14em',
              color: 'var(--faint)',
              textAlign: 'center',
            }}
          >
            HOLDING...
          </span>
        )}
      </div>
    </>
  );
}
