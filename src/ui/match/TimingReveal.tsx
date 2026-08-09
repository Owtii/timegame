import { useCallback, useEffect, useRef, useState } from 'react';

import type { TimingOutcome, TimingRound } from '../../game/timing';
import { AutoAdvance } from './pacing';

/**
 * How the clock games resolve.
 *
 * Both times stay masked, then roll up one after the other, then the cards
 * shiver through a held beat before the verdict lands. The finish line
 * underneath is the part that makes the round make sense: two pins on a
 * -1.50 / target / +1.50 axis say who was early, who was late and by how far,
 * which no pair of numbers on their own does.
 *
 * Tapping anywhere runs the whole sequence to the end - the drama is a default,
 * not a toll.
 */
export function TimingReveal({
  round,
  outcome,
  winner,
  names,
  colours,
  nextLabel,
  onNext,
  paused,
  seconds,
}: {
  round: TimingRound;
  outcome: TimingOutcome;
  winner: 0 | 1 | null;
  names: [string, string];
  colours: [string, string];
  nextLabel: string;
  onNext: () => void;
  paused?: boolean;
  seconds: number;
}) {
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);

  const skip = useCallback(() => setStep(4), []);

  useEffect(() => {
    const at = [300, 1000, 1600, 2300];
    at.forEach((ms, i) => {
      timers.current.push(window.setTimeout(() => setStep((s) => Math.max(s, i + 1)), ms));
    });
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const shown: [boolean, boolean] = [step >= 1, step >= 2];
  const tense = step === 3;
  const settled = step >= 4;

  const headline =
    outcome === 'win'
      ? `${names[winner as 0 | 1]} wins the round`
      : outcome === 'tie'
        ? 'Dead heat'
        : 'Round void';

  const sub =
    outcome === 'win'
      ? `Off by ${round.devs[winner as 0 | 1]?.toFixed(2)}s versus ${round.devs[1 - (winner as 0 | 1)]?.toFixed(2)}s.`
      : outcome === 'tie'
        ? `Both off by exactly ${round.devs[0]?.toFixed(2)}s. Sudden death - a new target, same stakes.`
        : `Both missed by more than ${round.voidLimit.toFixed(2)}s. Nobody takes it.`;

  const tone =
    outcome === 'win' ? colours[winner as 0 | 1] : outcome === 'tie' ? 'var(--text)' : 'var(--muted)';

  return (
    <div
      onClick={skip}
      style={{ display: 'contents' }}
      role="presentation"
    >
      <div
        style={{
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.8rem',
        }}
      >
        <span className="t-label">TARGET WAS</span>
        <span style={{ font: '900 9rem/1 Nunito', letterSpacing: '-.03em', color: 'var(--action)' }}>
          {round.target.toFixed(2)}
          <span style={{ fontSize: '4rem' }}>s</span>
        </span>
      </div>

      <div
        style={{
          flex: 'none',
          marginTop: '3.4rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '1.6rem',
        }}
      >
        <Card
          name={names[0]}
          colour={colours[0]}
          time={round.times[0]}
          dev={round.devs[0]}
          target={round.target}
          voidLimit={round.voidLimit}
          shown={shown[0]}
          hero={settled && (outcome === 'tie' || winner === 0)}
          dim={settled && outcome !== 'tie' && winner !== 0}
          tense={tense}
        />
        <span style={{ font: '900 2.8rem/1 Nunito', letterSpacing: '.14em', color: 'var(--faint)' }}>
          VS
        </span>
        <Card
          name={names[1]}
          colour={colours[1]}
          time={round.times[1]}
          dev={round.devs[1]}
          target={round.target}
          voidLimit={round.voidLimit}
          shown={shown[1]}
          hero={settled && (outcome === 'tie' || winner === 1)}
          dim={settled && outcome !== 'tie' && winner !== 1}
          tense={tense}
        />
      </div>

      <FinishLine
        round={round}
        colours={colours}
        show={[shown[0], shown[1]]}
      />

      <div
        style={{
          flex: 'none',
          marginTop: '3.4rem',
          minHeight: '14rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.4rem',
          textAlign: 'center',
        }}
      >
        {settled ? (
          <>
            <span style={{ font: '900 5.6rem/1.1 Nunito', letterSpacing: '-.01em', color: tone }}>
              {headline}
            </span>
            <span style={{ font: '700 2.8rem/1.35 Nunito', color: 'var(--muted)', maxWidth: '30ch' }}>
              {sub}
            </span>
          </>
        ) : (
          <span style={{ display: 'flex', gap: '1.4rem' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="pulse"
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  background: 'var(--muted)',
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: '2rem' }} />

      <div style={{ flex: 'none', paddingBottom: '5rem' }}>
        {settled ? (
          <AutoAdvance
            seconds={seconds}
            label={nextLabel}
            tone={outcome === 'win' ? colours[winner as 0 | 1] : 'var(--action)'}
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
            TAP TO SKIP AHEAD
          </span>
        )}
      </div>
    </div>
  );
}

function Card({
  name,
  colour,
  time,
  dev,
  target,
  voidLimit,
  shown,
  hero,
  dim,
  tense,
}: {
  name: string;
  colour: string;
  time: number | null;
  dev: number | null;
  target: number;
  voidLimit: number;
  shown: boolean;
  hero: boolean;
  dim: boolean;
  tense: boolean;
}) {
  const rolled = useRoll(time ?? 0, shown);
  const delta = (time ?? 0) - target;
  const voided = (dev ?? 0) > voidLimit;

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '3.6rem',
        padding: '2.6rem 2rem 2.8rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: hero ? `0 1.4rem 0 #0E0C28, 0 0 0 0.7rem ${colour}59` : '0 1.2rem 0 #0E0C28',
        transform: hero ? 'scale(1.04)' : dim ? 'scale(.94)' : 'scale(1)',
        opacity: dim ? 0.55 : 1,
        animation: tense ? 'db-pulse 260ms ease-in-out 2' : undefined,
        transition: 'transform 460ms cubic-bezier(.22,1.5,.36,1), opacity 340ms ease',
      }}
    >
      <span
        style={{
          font: '800 2.2rem/1 Nunito',
          letterSpacing: '.12em',
          color: colour,
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {name}
      </span>

      <span style={{ font: '900 7.4rem/1 Nunito', color: 'var(--text)' }}>
        {shown ? rolled.toFixed(2) : '—.——'}
      </span>

      <span
        style={{
          font: '800 2.4rem/1 Nunito',
          color: !shown ? 'transparent' : voided ? 'var(--p2)' : 'var(--muted)',
          minHeight: '2.4rem',
        }}
      >
        {shown
          ? `${voided ? 'VOID · ' : ''}${delta < 0 ? '−' : '+'}${Math.abs(delta).toFixed(2)}s ${delta < 0 ? 'early' : 'late'}`
          : '—'}
      </span>
    </div>
  );
}

/**
 * The axis. A pin past either bound is clamped to it, because a wild stop
 * should read as "off the end" rather than pushing the whole scale out.
 */
function FinishLine({
  round,
  colours,
  show,
}: {
  round: TimingRound;
  colours: [string, string];
  show: [boolean, boolean];
}) {
  const at = (i: 0 | 1) => {
    const t = round.times[i];
    if (t === null) return 50;
    const d = t - round.target;
    return 50 + (Math.max(-round.voidLimit, Math.min(round.voidLimit, d)) / round.voidLimit) * 50;
  };

  return (
    <div style={{ flex: 'none', marginTop: '3.4rem', position: 'relative', paddingTop: '4.6rem' }}>
      {([0, 1] as const).map((i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: i === 0 ? 0 : '1.8rem',
            left: `calc(${show[i] ? at(i) : 50}% - 0.4rem)`,
            width: '0.8rem',
            height: '4.2rem',
            borderRadius: '0.4rem',
            background: colours[i],
            opacity: show[i] ? 1 : 0.25,
            transition: 'left 520ms cubic-bezier(.22,1.3,.36,1), opacity 260ms ease',
          }}
        />
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ flex: 1, height: '0.8rem', borderRadius: '0.4rem', background: 'var(--sunken)' }} />
        <span style={{ width: '0.8rem', height: '3.4rem', borderRadius: '0.4rem', background: 'var(--action)' }} />
        <span style={{ flex: 1, height: '0.8rem', borderRadius: '0.4rem', background: 'var(--sunken)' }} />
      </div>

      <div
        style={{
          marginTop: '1.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          font: '800 2.2rem/1 Nunito',
          letterSpacing: '.06em',
          color: 'var(--dim)',
        }}
      >
        <span>−{round.voidLimit.toFixed(2)} early</span>
        <span style={{ color: 'var(--action)' }}>TARGET</span>
        <span>+{round.voidLimit.toFixed(2)} late</span>
      </div>
    </div>
  );
}

/** Counts a figure up rather than dropping it on screen already arrived. */
function useRoll(to: number, go: boolean): number {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!go) return;
    const start = performance.now();
    let raf = 0;

    const run = (now: number) => {
      const k = Math.min(1, (now - start) / 420);
      setN(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);

    // frames stop in a backgrounded tab - make sure the figure still lands
    const settle = window.setTimeout(() => setN(to), 500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [go, to]);

  return go ? n : 0;
}
