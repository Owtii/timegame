import { useEffect, useRef, useState } from 'react';

import { BALANCE } from '../../config/balance';
import { Meter } from '../primitives';

type Stage = 'ready' | 'running';

/**
 * Tap the Time and Timer Duel.
 *
 * The digits hide a second in; from there you are running blind against a
 * tick scale. The hand-off to blind mode is signposted twice - a label
 * before you start and a fuse bar draining under the digits - because
 * without them the transition reads as a glitch rather than a rule.
 */
export function ClockScreen({
  target,
  actorName,
  actorColour,
  onStop,
  botTurn,
}: {
  target: number;
  actorName: string;
  actorColour: string;
  onStop: (elapsed: number) => void;
  /** The bot runs its own clock - there is nothing here to press. */
  botTurn?: boolean;
}) {
  const [stage, setStage] = useState<Stage>('ready');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const raf = useRef(0);

  const blindAt = BALANCE.timing.blindAtSeconds;
  const arm = BALANCE.timing.armDelaySeconds;
  const blind = stage === 'running' && elapsed >= blindAt;

  useEffect(() => {
    if (stage !== 'running') return;
    startedAt.current = performance.now();
    const run = (now: number) => {
      setElapsed((now - startedAt.current) / 1000);
      raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [stage]);

  const press = () => {
    if (stage === 'ready') {
      setElapsed(0);
      setStage('running');
      return;
    }
    // measured from the clock itself, not from the rendered figure: a frame
    // that never arrived must not be able to stop the stopwatch
    const real = (performance.now() - startedAt.current) / 1000;
    // a grace period, so the start tap cannot double as the stop tap
    if (real < arm) return;
    cancelAnimationFrame(raf.current);
    onStop(real);
  };

  const fuse = Math.max(0, Math.min(1, 1 - elapsed / blindAt));
  const blocks = 10;

  return (
    <>
      <div
        className="card"
        style={{
          flex: 'none',
          borderRadius: '4rem',
          padding: '3rem 0 3.4rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <span style={{ font: '800 2.6rem/1 Nunito', letterSpacing: '.24em', color: 'var(--muted)' }}>
          TARGET
        </span>
        <span
          style={{
            font: '900 15.6rem/.86 Nunito',
            letterSpacing: '-.04em',
            color: 'var(--action)',
          }}
        >
          {target.toFixed(2)}
          <span style={{ fontSize: '6.4rem' }}>s</span>
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: '52rem',
          marginTop: '3rem',
          background: 'var(--sunken)',
          borderRadius: '5.2rem',
          boxShadow: 'inset 0 1rem 0 rgba(0,0,0,.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3.4rem',
          padding: '4rem 3rem',
        }}
      >
        <span
          style={{
            font: '900 2.6rem/1 Nunito',
            letterSpacing: '.2em',
            color: actorColour,
            background: 'rgba(255,255,255,.08)',
            padding: '1.4rem 2.4rem',
            borderRadius: 'var(--r-pill)',
            textTransform: 'uppercase',
          }}
        >
          {/* name then state, so it reads the same for every name */}
          {actorName} — {stage === 'ready' ? 'ready' : 'running'}
        </span>

        <span
          style={{
            font: '900 23.6rem/.82 Nunito',
            letterSpacing: '-.05em',
            color: 'var(--text)',
            minHeight: '19rem',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {blind ? <TickScale /> : elapsed.toFixed(2)}
        </span>

        <div style={{ width: '86%', display: 'flex', flexDirection: 'column', gap: '1.6rem', alignItems: 'center' }}>
          <Meter
            filled={Math.ceil(fuse * blocks)}
            total={blocks}
            colour="var(--p2)"
            size="md"
            track="var(--card)"
          />
          <span style={{ font: '900 3rem/1 Nunito', letterSpacing: '.14em', color: 'var(--p2)' }}>
            {stage === 'ready'
              ? 'DIGITS HIDE AFTER 1.00s'
              : blind
                ? 'RUNNING BLIND'
                : `DIGITS HIDE IN ${Math.max(0, blindAt - elapsed).toFixed(2)}s`}
          </span>
        </div>
      </div>

      <button
        onClick={press}
        disabled={botTurn}
        style={{
          flex: 'none',
          marginTop: '3rem',
          height: '32rem',
          borderRadius: '8rem',
          background: botTurn ? 'var(--card)' : stage === 'ready' ? 'var(--action)' : actorColour,
          boxShadow: `0 2.2rem 0 rgba(0,0,0,.42), inset 0 0.8rem 0 rgba(255,255,255,.34)`,
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 90ms cubic-bezier(.34,1.3,.64,1)',
        }}
        onPointerDown={(e) => (e.currentTarget.style.transform = 'translateY(1.2rem)')}
        onPointerUp={(e) => (e.currentTarget.style.transform = '')}
        onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
      >
        <span
          style={{
            font: '900 12rem/1 Nunito',
            letterSpacing: '.06em',
            color: botTurn ? 'var(--faint)' : 'var(--on-fill)',
          }}
        >
          {botTurn ? '...' : stage === 'ready' ? 'START' : 'STOP'}
        </span>
      </button>
    </>
  );
}

/**
 * The blind phase can't be counted: the breathing here is the sum of two
 * sines with an incommensurate frequency ratio, so it never settles into a
 * rhythm you could use as a metronome.
 */
function TickScale() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const run = (now: number) => {
      setT(now / 1000);
      raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, []);

  const breath = 0.5 + 0.25 * Math.sin(t * 2.7) + 0.25 * Math.sin(t * 1.618 * 2.7);

  return (
    <span style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '3.4rem',
            height: '3.4rem',
            borderRadius: '50%',
            background: 'var(--text)',
            opacity: 0.25 + breath * 0.6,
            transform: `scale(${0.8 + breath * 0.35})`,
          }}
        />
      ))}
    </span>
  );
}
