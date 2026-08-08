import {
  BOARDS,
  dropRow,
  judge,
  openCells,
  openColumns,
  type BoardSpec,
} from './board';
import type { BoardId, Mark } from './types';

/**
 * The bot, ported move for move from the original single-file build.
 *
 * It always plays as player 2 and never touches a real profile: bot matches
 * pay 55% coins and leave Mind Score and stats alone. That gating lives in
 * the store - this module only decides moves.
 */

/** Slip rate on tic-tac-toe: about one move in seven, so it stays beatable. */
const TTT_SLIP = 0.14;

const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

export function botMove(cells: Mark[], board: BoardId, me: 0 | 1): number {
  return board === 'c4' ? connectFour(cells, me) : ticTacToe(cells, me);
}

// ---------- tic-tac-toe: full minimax, with a deliberate slip ----------

export function ticTacToe(cells: Mark[], me: 0 | 1): number {
  const open = openCells(cells);
  if (!open.length) return -1;
  if (Math.random() < TTT_SLIP) return pick(open);

  const b = BOARDS.ttt;
  let best = -Infinity;
  let choice = open[0];

  for (const i of open) {
    const next = cells.slice();
    next[i] = me;
    const s = minimax(next, b, me, false, 0);
    if (s > best) {
      best = s;
      choice = i;
    }
  }
  return choice;
}

function minimax(
  cells: Mark[],
  b: BoardSpec,
  me: 0 | 1,
  maxing: boolean,
  depth: number,
): number {
  const r = judge(cells, b);
  if (r) {
    if (r.winner === null) return 0;
    return r.winner === me ? 10 - depth : depth - 10;
  }

  const turn = maxing ? me : ((1 - me) as 0 | 1);
  let best = maxing ? -Infinity : Infinity;
  let any = false;

  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null) continue;
    any = true;
    cells[i] = turn;
    const s = minimax(cells, b, me, !maxing, depth + 1);
    cells[i] = null;
    best = maxing ? Math.max(best, s) : Math.min(best, s);
  }
  return any ? best : 0;
}

// ---------- connect 4: alpha-beta to depth four ----------

export function connectFour(cells: Mark[], me: 0 | 1): number {
  const b = BOARDS.c4;
  const cols = openColumns(cells, b);
  if (!cols.length) return -1;

  // centre-out ordering makes the pruning bite
  cols.sort((a, z) => Math.abs(a - 3) - Math.abs(z - 3));

  let best = -Infinity;
  let choice = cols[0];

  for (const c of cols) {
    const next = drop(cells, b, c, me);
    const s = alphaBeta(next, b, me, 4, -Infinity, Infinity, false) + Math.random() * 0.6;
    if (s > best) {
      best = s;
      choice = c;
    }
  }
  return choice;
}

function drop(cells: Mark[], b: BoardSpec, col: number, mark: 0 | 1): Mark[] {
  const next = cells.slice();
  const r = dropRow(next, b, col);
  if (r >= 0) next[r * b.cols + col] = mark;
  return next;
}

function alphaBeta(
  cells: Mark[],
  b: BoardSpec,
  me: 0 | 1,
  depth: number,
  a: number,
  bb: number,
  maxing: boolean,
): number {
  const r = judge(cells, b);
  if (r) {
    if (r.winner === null) return 0;
    return r.winner === me ? 9000 + depth : -9000 - depth;
  }
  if (depth === 0) return score(cells, b, me);

  const turn = maxing ? me : ((1 - me) as 0 | 1);
  let best = maxing ? -Infinity : Infinity;
  let any = false;

  for (let c = 0; c < b.cols; c++) {
    if (dropRow(cells, b, c) < 0) continue;
    any = true;
    const s = alphaBeta(drop(cells, b, c, turn), b, me, depth - 1, a, bb, !maxing);
    if (maxing) {
      best = Math.max(best, s);
      a = Math.max(a, s);
    } else {
      best = Math.min(best, s);
      bb = Math.min(bb, s);
    }
    if (bb <= a) break;
  }
  return any ? best : 0;
}

/** Window count over every 4-cell run, plus a centre-column bonus. */
function score(cells: Mark[], b: BoardSpec, me: 0 | 1): number {
  const them = (1 - me) as 0 | 1;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;
  let total = 0;

  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      if (c === 3) {
        const mid = cells[r * b.cols + c];
        if (mid === me) total += 3;
        else if (mid === them) total -= 3;
      }

      for (const [dr, dc] of dirs) {
        let mine = 0;
        let theirs = 0;
        let ok = true;
        for (let k = 0; k < b.need; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= b.rows || cc < 0 || cc >= b.cols) {
            ok = false;
            break;
          }
          const v = cells[rr * b.cols + cc];
          if (v === me) mine++;
          else if (v === them) theirs++;
        }
        if (!ok || (mine > 0 && theirs > 0)) continue;

        if (mine === 3) total += 60;
        else if (mine === 2) total += 9;
        else if (mine === 1) total += 1;

        if (theirs === 3) total -= 75;
        else if (theirs === 2) total -= 11;
      }
    }
  }
  return total;
}

// ---------- clock ----------

/** A human-ish miss: usually inside a quarter second, sometimes much worse. */
export function botStopTime(target: number): number {
  let e = ((Math.random() + Math.random() + Math.random() - 1.5) / 1.5) * 0.3;
  if (Math.random() < 0.12) e *= 2.6;
  return Math.round(Math.max(0.15, target + e) * 100) / 100;
}

// ---------- numbers ----------

/** Halve the range, but not with machine precision. */
export function botGuess(lo: number, hi: number, taken: number[]): number {
  const pool: number[] = [];
  for (let n = lo; n <= hi; n++) if (!taken.includes(n)) pool.push(n);
  if (!pool.length) return lo;
  if (Math.random() < 0.25) return pick(pool);
  return pool[Math.floor(pool.length / 2)];
}

// ---------- bid-tac-toe ----------

/** Take the win, else deny it, else the centre, else a corner. */
export function botPickSquare(cells: Mark[], me: 0 | 1): number {
  const b = BOARDS.ttt;
  const them = (1 - me) as 0 | 1;
  const open = openCells(cells);
  if (!open.length) return -1;

  const makes = (i: number, m: 0 | 1): boolean => {
    const t = cells.slice();
    t[i] = m;
    const r = judge(t, b);
    return !!r?.line;
  };

  for (const i of open) if (makes(i, me)) return i;
  for (const i of open) if (makes(i, them)) return i;
  if (open.includes(4)) return 4;

  const corners = open.filter((i) => i === 0 || i === 2 || i === 6 || i === 8);
  return pick(corners.length ? corners : open);
}

/** What the square currently up for bid is worth to the bot. */
export function botBid(
  cells: Mark[],
  square: number,
  me: 0 | 1,
  myBalance: number,
  theirBalance: number,
): number {
  if (myBalance <= 0) return 0;

  const b = BOARDS.ttt;
  const them = (1 - me) as 0 | 1;

  const t = cells.slice();
  t[square] = me;
  const win = judge(t, b)?.winner === me;

  t[square] = them;
  const block = judge(t, b)?.winner === them;

  // a square it does not need is worth more as a banked point when it is short
  if (!win && !block && square !== 4 && myBalance < theirBalance * 0.6 && Math.random() < 0.55) {
    return 0;
  }

  const weight = win ? 1 : block ? 0.9 : square === 4 ? 0.45 : square % 2 === 0 ? 0.32 : 0.22;

  let bid = Math.round(myBalance * weight * (0.55 + Math.random() * 0.5));
  if (win || block) bid = Math.max(bid, Math.ceil(myBalance * (win ? 0.7 : 0.5)));

  return Math.min(myBalance, Math.max(0, bid));
}
