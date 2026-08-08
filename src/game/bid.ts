import type { Mark } from './types';

export interface BidLogEntry {
  square: number;
  bids: [number, number];
  /** -1 when the square stayed up: a tie, or a double pass. */
  winner: number;
}

/** How a reveal resolved - drives which celebration the view plays. */
export interface BidVerdict {
  /** -1 when nobody took the square. */
  winner: number;
  bothPassed: boolean;
  tied: boolean;
  /** Handed over on the third double pass rather than looping forever. */
  forced: boolean;
  /** A blowout: worth its own burst. */
  decisive: boolean;
  /** Won by a single point. */
  close: boolean;
  difference: number;
}

/**
 * Bid-Tac-Toe, the flagship.
 *
 * 24 points each, take turns naming a square, both seal a bid, highest takes
 * it and BOTH pay what they bid. Bidding 0 banks +1 instead of costing
 * anything.
 *
 * Because an emptied pool can always climb back there is no "both pools are
 * empty" ending - the only endings are a line or a full board. The third
 * double pass in a row on the same square hands it to whoever named it, so
 * nobody can freeze a match by refusing to bid.
 */
export interface BidState {
  pool: number;
  passBank: number;
  passLimit: number;
  balance: [number, number];
  bids: [number | null, number | null];
  log: BidLogEntry[];
  /** -1 when no square is up for bid. */
  square: number;
  /** Who names the next square. */
  chooser: 0 | 1;
  passRun: number;
}

export const newBidState = (
  pool: number,
  passBank: number,
  passLimit: number,
  chooser: 0 | 1,
): BidState => ({
  pool,
  passBank,
  passLimit,
  balance: [pool, pool],
  bids: [null, null],
  log: [],
  square: -1,
  chooser,
  passRun: 0,
});

/** A pass is worth points rather than costing them. */
export const cost = (s: BidState, bid: number): number =>
  bid === 0 ? -s.passBank : bid;

/** Balance a player would be left with after a given bid. */
export const after = (s: BidState, player: 0 | 1, bid: number): number =>
  s.balance[player] - cost(s, bid);

export const bothSealed = (s: BidState): boolean =>
  s.bids[0] !== null && s.bids[1] !== null;

/**
 * Work out who takes the square. Pure - `settle` applies the result.
 *
 * `passRun` has to be carried out of here because the forced hand-over
 * depends on it, so this returns the next run length alongside the verdict.
 */
export function reveal(
  s: BidState,
  b0: number,
  b1: number,
): { verdict: BidVerdict; passRun: number } {
  let w = b0 > b1 ? 0 : b1 > b0 ? 1 : -1;
  const bothPassed = b0 === 0 && b1 === 0;

  let passRun = w < 0 && bothPassed ? s.passRun + 1 : 0;

  const forced = w < 0 && passRun >= s.passLimit;
  if (forced) {
    w = s.chooser;
    passRun = 0;
  }

  const difference = Math.abs(b0 - b1);
  const decisive =
    w >= 0 && !forced && difference >= Math.max(3, Math.round(s.pool * 0.25));
  const close = w >= 0 && !forced && difference <= 1;

  return {
    verdict: {
      winner: w,
      bothPassed,
      tied: w < 0,
      forced,
      decisive,
      close,
      difference,
    },
    passRun,
  };
}

/**
 * Apply a revealed round: both players pay, the log grows, and the square is
 * claimed if somebody took it.
 *
 * The pick alternates only once a square actually settles. A tie settles
 * nothing, so it must not move the turn on either.
 */
export function settle(
  s: BidState,
  verdict: BidVerdict,
  passRun: number,
  b0: number,
  b1: number,
  cells: Mark[],
): { state: BidState; cells: Mark[] } {
  const balance: [number, number] = [
    s.balance[0] - cost(s, b0),
    s.balance[1] - cost(s, b1),
  ];

  const log = [...s.log, { square: s.square, bids: [b0, b1] as [number, number], winner: verdict.winner }];

  let nextCells = cells;
  let chooser = s.chooser;

  if (verdict.winner >= 0) {
    nextCells = cells.slice();
    nextCells[s.square] = verdict.winner as 0 | 1;
    chooser = (1 - s.chooser) as 0 | 1;
  }

  return {
    state: {
      ...s,
      balance,
      log,
      chooser,
      passRun,
      bids: [null, null],
      square: verdict.winner >= 0 ? -1 : s.square,
    },
    cells: nextCells,
  };
}
