import { useEffect, useRef, useState } from 'react';

import type { BoardSpec } from '../../game/board';
import type { Mark } from '../../game/types';
import type { MatchReward } from '../../state/store';
import { Btn } from '../primitives';
import { BoardView } from './BoardView';

/**
 * The marquee takes the winner's colour and the whole top of the screen, the
 * coin figure ticks up rather than appearing, and the board that decided it
 * stays on screen underneath so the last move is still readable.
 */
export function Result({
  winner,
  names,
  colours,
  score,
  rounds,
  gameName,
  reason,
  reward,
  spec,
  cells,
  line,
  onAgain,
  onHome,
}: {
  winner: 0 | 1 | null;
  names: [string, string];
  colours: [string, string];
  score: [number, number];
  rounds: number;
  gameName: string;
  reason: string;
  reward: MatchReward;
  spec: BoardSpec | null;
  cells: Mark[] | null;
  line: number[] | null;
  onAgain: () => void;
  onHome: () => void;
}) {
  const banner = winner === null ? 'var(--muted)' : colours[winner];
  const coins = useTicker(reward.coins);

  return (
    <div className="screen" style={{ zIndex: 50, animation: 'db-rise 320ms cubic-bezier(.22,1,.36,1) both' }}>
      <div
        style={{
          flex: 'none',
          height: '47rem',
          background: banner,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          padding: '6rem 4rem 0',
          textAlign: 'center',
        }}
      >
        <span style={{ font: '800 3rem/1 Nunito', letterSpacing: '.3em', color: 'rgba(10,12,17,.6)' }}>
          MATCH OVER
        </span>
        <span
          style={{
            font: '900 16.8rem/.94 Nunito',
            letterSpacing: '-.03em',
            color: 'var(--on-fill)',
          }}
        >
          {winner === null ? 'DRAW' : `${names[winner].toUpperCase()} WINS`}
        </span>
        <span style={{ font: '800 3.2rem/1.2 Nunito', color: 'rgba(10,12,17,.68)' }}>
          {gameName} · {reason}
        </span>
      </div>

      <div className="screen-scroll" style={{ paddingTop: '3rem', gap: '2.6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.6rem', flex: 'none' }}>
          <Tile cap={names[0]} value={score[0]} colour={colours[0]} />
          <Tile cap="ROUNDS" value={rounds} colour="var(--muted)" dim />
          <Tile cap={names[1]} value={score[1]} colour={colours[1]} />
        </div>

        <div
          style={{
            flex: 'none',
            height: '18rem',
            background: 'var(--action)',
            borderRadius: '4rem',
            boxShadow: '0 1.4rem 0 var(--action-lip)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4rem',
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span style={{ font: '800 2.4rem/1 Nunito', letterSpacing: '.18em', color: 'rgba(10,12,17,.62)' }}>
              EARNED
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
              <span style={{ width: '5.2rem', height: '5.2rem', borderRadius: '50%', background: 'var(--on-fill)' }} />
              <span style={{ font: '900 7.6rem/1 Nunito', color: 'var(--on-fill)' }}>+{coins}</span>
            </span>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end' }}>
            <span style={{ font: '800 2.4rem/1 Nunito', letterSpacing: '.18em', color: 'rgba(10,12,17,.62)' }}>
              ENERGY
            </span>
            <span style={{ font: '900 6rem/1 Nunito', color: 'var(--on-fill)' }}>+{reward.energy}</span>
          </span>
        </div>

        {reward.mindDelta !== 0 && (
          <span
            style={{
              flex: 'none',
              alignSelf: 'center',
              font: '900 3rem/1 Nunito',
              letterSpacing: '.06em',
              color: 'var(--on-fill)',
              background: reward.mindDelta > 0 ? 'var(--good)' : 'var(--rail)',
              padding: '1.2rem 2.4rem',
              borderRadius: 'var(--r-pill)',
            }}
          >
            MIND SCORE {reward.mindDelta > 0 ? '+' : ''}
            {reward.mindDelta}
          </span>
        )}

        {spec && cells && (
          <div style={{ flex: 'none', width: '64%', alignSelf: 'center' }}>
            <BoardView spec={spec} cells={cells} colours={colours} live={null} line={line} compact />
          </div>
        )}

        <div style={{ flex: 1, minHeight: '2rem' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 'none', paddingBottom: '7rem' }}>
          <Btn tone={winner === 1 ? 'p2' : 'p1'} onClick={onAgain}>
            PLAY AGAIN
          </Btn>
          <Btn tone="ghost" onClick={onHome}>
            BACK TO BASE
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Tile({ cap, value, colour, dim }: { cap: string; value: number; colour: string; dim?: boolean }) {
  return (
    <div
      className="card"
      style={{
        padding: '2.4rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.8rem',
        borderRadius: '3.2rem',
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
        {cap}
      </span>
      <span style={{ font: '900 7.6rem/1 Nunito', color: dim ? 'var(--muted)' : 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}

/** Coins land as a count, not as a number that was simply already there. */
function useTicker(to: number): number {
  const [n, setN] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(to * eased));
      if (t < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);

    // a backgrounded tab does not run animation frames, and a coin figure
    // frozen at zero is worse than one that never animated
    const settle = window.setTimeout(() => setN(to), 1000);

    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(settle);
    };
  }, [to]);

  return n;
}
