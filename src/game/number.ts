export type GuessResult = 'higher' | 'lower' | 'hit';

export interface Guess {
  n: number;
  by: 0 | 1;
  res: GuessResult;
  dist: number;
}

/**
 * Number Guess (1-100, alternate, first to 2 rounds) and Number Duel
 * (1-10, three tries each, closest claims the square).
 *
 * The deduction rules are identical; only the range, the try budget and how
 * a spent round resolves differ.
 */
export interface NumberRound {
  hi: number;
  /** Total guesses across both players. */
  cap: number;
  isDuel: boolean;
  secret: number;
  /** Who guesses first this round. */
  first: 0 | 1;
  guesses: Guess[];
}

export function newNumberRound(
  isDuel: boolean,
  first: 0 | 1,
  cfg: { soloHigh: number; soloCap: number; duelHigh: number; duelTries: number },
): NumberRound {
  const hi = isDuel ? cfg.duelHigh : cfg.soloHigh;
  const cap = isDuel ? cfg.duelTries * 2 : cfg.soloCap;
  return {
    hi,
    cap,
    isDuel,
    first,
    secret: 1 + Math.floor(Math.random() * hi),
    guesses: [],
  };
}

/** Strict alternation from whoever led the round. */
export const numberActor = (r: NumberRound): 0 | 1 =>
  r.guesses.length % 2 === 0 ? r.first : ((1 - r.first) as 0 | 1);

export const triesBy = (r: NumberRound, player: 0 | 1): number =>
  r.guesses.filter((g) => g.by === player).length;

/** What the clue history proves so far: the range still in play. */
export function knownRange(r: NumberRound): { lo: number; hi: number } {
  let lo = 1;
  let hi = r.hi;
  for (const g of r.guesses) {
    if (g.res === 'higher') lo = Math.max(lo, g.n + 1);
    else if (g.res === 'lower') hi = Math.min(hi, g.n - 1);
  }
  return { lo, hi };
}

export const alreadyGuessed = (r: NumberRound, n: number): boolean =>
  r.guesses.some((g) => g.n === n);

export function submit(r: NumberRound, n: number, by: 0 | 1): { round: NumberRound; guess: Guess } {
  const res: GuessResult = n === r.secret ? 'hit' : n < r.secret ? 'higher' : 'lower';
  const guess: Guess = { n, by, res, dist: Math.abs(n - r.secret) };
  return { round: { ...r, guesses: [...r.guesses, guess] }, guess };
}

export const spent = (r: NumberRound): boolean => r.guesses.length >= r.cap;

/**
 * Duel rule: the nearest guess takes the square, and a shared distance goes
 * to whoever reached it first - otherwise a 1-to-10 round could run forever.
 */
export function closestWinner(r: NumberRound): 0 | 1 {
  const best = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
  const at = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
  r.guesses.forEach((g, i) => {
    if (g.dist < best[g.by]) {
      best[g.by] = g.dist;
      at[g.by] = i;
    }
  });
  if (best[0] !== best[1]) return best[0] < best[1] ? 0 : 1;
  return at[0] < at[1] ? 0 : 1;
}

export function bestDistanceOf(r: NumberRound, player: 0 | 1): number {
  return r.guesses.reduce(
    (b, g) => (g.by === player && g.dist < b ? g.dist : b),
    Number.MAX_SAFE_INTEGER,
  );
}

/** Numbers a player may still sensibly pick, given the clues. */
export function livePool(r: NumberRound): number[] {
  const { lo, hi } = knownRange(r);
  const pool: number[] = [];
  for (let n = lo; n <= hi; n++) if (!alreadyGuessed(r, n)) pool.push(n);
  if (pool.length) return pool;

  const fallback: number[] = [];
  for (let n = 1; n <= r.hi; n++) if (!alreadyGuessed(r, n)) fallback.push(n);
  return fallback;
}
