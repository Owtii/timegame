import { useEffect, useRef, useState } from 'react';

import { BALANCE } from '../../config/balance';
import { botStopTime } from '../../game/bot';

type Stage = 'ready' | 'running' | 'locked';

/**
 * Tap the Time and Timer Duel.
 *
 * One button does the whole game: start it, then stop it. The digits hide a
 * second in and from there you are running blind against a tick scale, and
 * the hand-off is signposted twice - a label before you start and a fuse bar
 * draining under the figures - because without them it reads as a glitch
 * rather than a rule.
 *
 * The stop is confirmed on screen before the round moves on. Watching your
 * own time vanish the instant you commit it is the fastest way to make a
 * player distrust a stopwatch.
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
  /** The bot runs its own clock; there is nothing here to press. */
  botTurn?: boolean;
}) {
  const [stage, setStage] = useState<Stage>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(0);
  const startedAt = useRef(0);
  const raf = useRef(0);
  const done = useRef(false);

  const blindAt = BALANCE.timing.blindAtSeconds;
  const arm = BALANCE.timing.armDelaySeconds;
  const blind = stage === 'running' && elapsed >= blindAt;

  const end = (value: number) => {
    if (done.current) return;
    done.current = true;
    cancelAnimationFrame(raf.current);
    setLocked(Math.round(value * 100) / 100);
    setStage('locked');
    // the figure is shown as recorded before the round moves on
    window.setTimeout(() => onStop(value), botTurn ? 620 : 820);
  };

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

  // the bot lines its own stop up, so the clock is seen to run for it too
  useEffect(() => {
    if (!botTurn) return;
    const at = botStopTime(target);
    const begin = window.setTimeout(() => setStage('running'), 700);
    const stop = window.setTimeout(() => end(at), 700 + at * 1000);
    return () => {
      clearTimeout(begin);
      clearTimeout(stop);
    };
    // one shot per mount: a re-run would give the bot two stops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botTurn]);

  const press = () => {
    if (botTurn || stage === 'locked') return;
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
    end(real);
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
          padding: '2.6rem 0 3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.8rem',
        }}
      >
        <span style={{ font: '800 2.6rem/1 Nunito', letterSpacing: '.24em', color: 'var(--muted)' }}>
          TARGET
        </span>
        <span style={{ font: '900 13rem/.9 Nunito', letterSpacing: '-.04em', color: 'var(--action)' }}>
          {target.toFixed(2)}
          <span style={{ fontSize: '5.4rem' }}>s</span>
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: '44rem',
          marginTop: '2.6rem',
          background: 'var(--sunken)',
          borderRadius: '5.2rem',
          boxShadow: 'inset 0 1rem 0 rgba(0,0,0,.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3rem',
          padding: '4rem 3rem',
        }}
      >
        {stage === 'locked' ? (
          <>
            <span
              style={{
                width: '11rem',
                height: '11rem',
                borderRadius: '50%',
                background: actorColour,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <span
                style={{
                  width: '4.4rem',
                  height: '2.2rem',
                  borderLeft: '1rem solid var(--on-fill)',
                  borderBottom: '1rem solid var(--on-fill)',
                  transform: 'rotate(-45deg) translate(0.3rem, -0.5rem)',
                  borderRadius: '0.2rem',
                }}
              />
            </span>
            <span style={{ font: '900 12rem/.9 Nunito', letterSpacing: '-.04em', color: 'var(--text)' }}>
              {locked.toFixed(2)}
            </span>
            <span style={{ font: '900 3rem/1 Nunito', letterSpacing: '.16em', color: 'var(--muted)' }}>
              TIME RECORDED
            </span>
          </>
        ) : (
          <>
            <span
              style={{
                font: '900 2.6rem/1 Nunito',
                letterSpacing: '.18em',
                color: actorColour,
                background: 'rgba(255,255,255,.08)',
                padding: '1.4rem 2.4rem',
                borderRadius: 'var(--r-pill)',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              {actorName} — {stage === 'ready' ? (botTurn ? 'lining up its stop' : 'ready') : 'running'}
            </span>

            <span
              style={{
                font: '900 20rem/.82 Nunito',
                letterSpacing: '-.05em',
                color: 'var(--text)',
                minHeight: '17rem',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {blind ? <TickScale /> : elapsed.toFixed(2)}
            </span>

            <div style={{ width: '86%', display: 'flex', flexDirection: 'column', gap: '1.4rem', alignItems: 'center' }}>
              <div className="meter md" style={{ width: '100%' }}>
                {Array.from({ length: blocks }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      background: i < Math.ceil(fuse * blocks) ? 'var(--p2)' : 'var(--card)',
                    }}
                  />
                ))}
              </div>
              <span style={{ font: '900 2.8rem/1 Nunito', letterSpacing: '.12em', color: 'var(--p2)' }}>
                {stage === 'ready'
                  ? 'CLOCK HIDES AFTER 1.00s'
                  : blind
                    ? 'RUNNING BLIND'
                    : `HIDES IN ${Math.max(0, blindAt - elapsed).toFixed(2)}s`}
              </span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={press}
        disabled={botTurn || stage === 'locked'}
        style={{
          flex: 'none',
          marginTop: '2.6rem',
          marginBottom: '4rem',
          height: '28rem',
          borderRadius: '7rem',
          background:
            botTurn || stage === 'locked'
              ? 'var(--card)'
              : stage === 'ready'
                ? 'var(--action)'
                : actorColour,
          boxShadow:
            botTurn || stage === 'locked'
              ? 'none'
              : '0 2.2rem 0 rgba(0,0,0,.42), inset 0 0.8rem 0 rgba(255,255,255,.34)',
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 90ms cubic-bezier(.34,1.3,.64,1), background-color 200ms ease',
        }}
        onPointerDown={(e) => {
          if (!botTurn && stage !== 'locked') e.currentTarget.style.transform = 'translateY(1.2rem)';
        }}
        onPointerUp={(e) => (e.currentTarget.style.transform = '')}
        onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
      >
        <span
          style={{
            font: '900 10rem/1 Nunito',
            letterSpacing: '.06em',
            color: botTurn || stage === 'locked' ? 'var(--faint)' : 'var(--on-fill)',
          }}
        >
          {stage === 'locked' ? 'LOCKED' : botTurn ? '···' : stage === 'ready' ? 'START' : 'STOP'}
        </span>
      </button>
    </>
  );
}

/**
 * The blind phase can't be counted: the breathing here is the sum of two sines
 * with an incommensurate frequency ratio, so it never settles into a rhythm
 * you could use as a metronome.
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
    <span style={{ display: 'flex', gap: '1.4rem', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '3.4rem',
            height: '3.4rem',
            borderRadius: '50%',
            background: 'var(--text)',
            opacity: 0.22 + breath * 0.6,
            transform: `scale(${0.78 + breath * 0.38})`,
          }}
        />
      ))}
    </span>
  );
}
