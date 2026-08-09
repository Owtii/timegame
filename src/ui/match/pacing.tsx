import { useEffect, useRef, useState } from 'react';

/**
 * A result advances on its own, with a bar showing when.
 *
 * A tap is only asked for where it means something, and "I have finished
 * reading" is not one of those places. The button next to the bar is a skip,
 * not a requirement, and it is labelled with whatever happens next so you
 * never press it to find out.
 *
 * The countdown holds while `paused` is true, which is how the chat can be
 * open without the match walking off underneath it.
 */
export function AutoAdvance({
  seconds,
  label,
  tone,
  onDone,
  paused,
}: {
  seconds: number;
  label: string;
  tone: string;
  onDone: () => void;
  paused?: boolean;
}) {
  const [left, setLeft] = useState(seconds);
  const fired = useRef(false);
  const remaining = useRef(seconds);

  useEffect(() => {
    if (paused) return;

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      remaining.current -= (now - last) / 1000;
      last = now;
      setLeft(Math.max(0, remaining.current));

      if (remaining.current <= 0) {
        if (!fired.current) {
          fired.current = true;
          onDone();
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // a backgrounded tab runs no frames, so the match would sit here forever
    const settle = window.setTimeout(
      () => {
        if (!fired.current) {
          fired.current = true;
          onDone();
        }
      },
      Math.max(0, remaining.current * 1000) + 400,
    );

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [onDone, paused]);

  const skip = () => {
    if (fired.current) return;
    fired.current = true;
    onDone();
  };

  const k = Math.max(0, Math.min(1, left / seconds));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', flex: 'none', width: '100%' }}>
      <button
        onClick={skip}
        style={{
          height: '13.2rem',
          borderRadius: 'var(--r-pill)',
          background: tone,
          color: 'var(--on-fill)',
          font: '900 4rem/1 Nunito',
          letterSpacing: '.04em',
          boxShadow: '0 1.4rem 0 rgba(0,0,0,.4), inset 0 0.6rem 0 rgba(255,255,255,.3)',
          transition: 'transform 90ms cubic-bezier(.34,1.3,.64,1)',
        }}
        onPointerDown={(e) => (e.currentTarget.style.transform = 'translateY(0.8rem)')}
        onPointerUp={(e) => (e.currentTarget.style.transform = '')}
        onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
      >
        {label.toUpperCase()}
      </button>

      <div
        style={{
          height: '1rem',
          borderRadius: '0.5rem',
          background: 'var(--sunken)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${k * 100}%`,
            borderRadius: '0.5rem',
            background: paused ? 'var(--stroke)' : tone,
          }}
        />
      </div>

      <span
        style={{
          font: '800 2.4rem/1 Nunito',
          letterSpacing: '.1em',
          color: 'var(--dim)',
          textAlign: 'center',
        }}
      >
        {paused ? 'HELD WHILE THE CHAT IS OPEN' : `MOVES ON IN ${Math.ceil(left)}s`}
      </span>
    </div>
  );
}

/**
 * The turn clock under the active player.
 *
 * It only runs while somebody has to act, never in the clock games where the
 * timing *is* the game, and the last ten seconds count down in figures so the
 * pressure is legible rather than a surprise.
 */
export function useTurnClock({
  seconds,
  active,
  paused,
  onExpire,
}: {
  seconds: number;
  active: boolean;
  paused?: boolean;
  onExpire: () => void;
}): { left: number; warn: boolean } {
  const [left, setLeft] = useState(seconds);
  const remaining = useRef(seconds);
  const fired = useRef(false);

  // a fresh turn is a fresh clock
  useEffect(() => {
    remaining.current = seconds;
    fired.current = false;
    setLeft(seconds);
  }, [seconds, active]);

  useEffect(() => {
    if (!active || paused) return;

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      remaining.current -= (now - last) / 1000;
      last = now;
      setLeft(Math.max(0, remaining.current));

      if (remaining.current <= 0) {
        if (!fired.current) {
          fired.current = true;
          onExpire();
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, paused, onExpire]);

  return { left, warn: left <= 10 };
}
