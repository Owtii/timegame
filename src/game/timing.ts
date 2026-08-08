export type TimingOutcome =
  /** One player closer - they take the round. */
  | 'win'
  /** Deviations exactly equal - sudden death, replay with a new target. */
  | 'tie'
  /** Both off by more than the void limit - nobody takes it. */
  | 'void';

/**
 * Timing precision matches display precision.
 *
 * Comparing at millisecond resolution would let two visible `4.28`s resolve
 * to a winner, which reads as broken - and it makes exact ties reachable, so
 * sudden death actually fires.
 */
export const quantise = (seconds: number): number =>
  Math.round(seconds * 100) / 100;

export const randomTarget = (min: number, max: number): number =>
  quantise(min + Math.random() * (max - min));

export interface TimingRound {
  target: number;
  voidLimit: number;
  /** Who stops first this round. */
  first: 0 | 1;
  /** 0 = the leader is stopping, 1 = the second player is stopping. */
  turnIndex: 0 | 1;
  times: [number | null, number | null];
  devs: [number | null, number | null];
}

export const newTimingRound = (
  target: number,
  voidLimit: number,
  first: 0 | 1,
): TimingRound => ({
  target,
  voidLimit,
  first,
  turnIndex: 0,
  times: [null, null],
  devs: [null, null],
});

export const timingActor = (r: TimingRound): 0 | 1 =>
  r.turnIndex === 0 ? r.first : ((1 - r.first) as 0 | 1);

export function record(r: TimingRound, player: 0 | 1, elapsed: number): TimingRound {
  const t = quantise(elapsed);
  const times = r.times.slice() as [number | null, number | null];
  const devs = r.devs.slice() as [number | null, number | null];
  times[player] = t;
  devs[player] = quantise(Math.abs(t - r.target));
  return { ...r, times, devs };
}

export function resolveTiming(r: TimingRound): {
  outcome: TimingOutcome;
  winner: 0 | 1 | null;
} {
  const d0 = r.devs[0];
  const d1 = r.devs[1];
  if (d0 === null || d1 === null) return { outcome: 'tie', winner: null };

  if (d0 > r.voidLimit && d1 > r.voidLimit) return { outcome: 'void', winner: null };
  // exact equality is intended: both values are quantised to centiseconds
  if (d0 === d1) return { outcome: 'tie', winner: null };
  return { outcome: 'win', winner: d0 < d1 ? 0 : 1 };
}
