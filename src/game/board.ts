import type { BoardId, Mark } from './types';

/**
 * Grid shape. Tic-Tac-Toe and Connect 4 differ only in size, `need` and
 * whether pieces drop, so one detector serves both.
 */
export interface BoardSpec {
  id: BoardId;
  name: string;
  cols: number;
  rows: number;
  need: number;
  drop: boolean;
  desc: string;
  pick: string;
}

export const BOARDS: Record<BoardId, BoardSpec> = {
  ttt: {
    id: 'ttt',
    name: 'Tic-Tac-Toe',
    cols: 3,
    rows: 3,
    need: 3,
    drop: false,
    desc: '3x3. Three in a row. Short matches.',
    pick: 'Tap any open square.',
  },
  c4: {
    id: 'c4',
    name: 'Connect 4',
    cols: 7,
    rows: 6,
    need: 4,
    drop: true,
    desc: '7x6. Four in a row. Longer matches.',
    pick: 'Tap a column - your piece drops.',
  },
};

export interface BoardVerdict {
  /** `null` on a draw. */
  winner: 0 | 1 | null;
  /** The winning run of cell indices, `null` on a draw. */
  line: number[] | null;
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

export const newBoard = (b: BoardSpec): Mark[] =>
  new Array<Mark>(b.cols * b.rows).fill(null);

/**
 * Generic n-in-a-row over the whole grid: horizontals, verticals and both
 * diagonals. Serves 3-in-a-row and 4-in-a-row alike.
 *
 * Returns `null` while the board is still playable.
 */
export function judge(cells: Mark[], b: BoardSpec): BoardVerdict | null {
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const v = cells[r * b.cols + c];
      if (v === null) continue;

      for (const [dr, dc] of DIRS) {
        const line = [r * b.cols + c];
        let ok = true;
        for (let k = 1; k < b.need; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (
            rr < 0 ||
            rr >= b.rows ||
            cc < 0 ||
            cc >= b.cols ||
            cells[rr * b.cols + cc] !== v
          ) {
            ok = false;
            break;
          }
          line.push(rr * b.cols + cc);
        }
        if (ok) return { winner: v, line };
      }
    }
  }

  if (isFull(cells)) return { winner: null, line: null };
  return null;
}

export const isFull = (cells: Mark[]): boolean => cells.every((c) => c !== null);

export const marksOn = (cells: Mark[]): number =>
  cells.reduce<number>((n, c) => n + (c === null ? 0 : 1), 0);

/** Lowest open row in a column, or -1 when the column is full. */
export function dropRow(cells: Mark[], b: BoardSpec, col: number): number {
  for (let r = b.rows - 1; r >= 0; r--) {
    if (cells[r * b.cols + col] === null) return r;
  }
  return -1;
}

export function openCells(cells: Mark[]): number[] {
  const open: number[] = [];
  cells.forEach((c, i) => {
    if (c === null) open.push(i);
  });
  return open;
}

export function openColumns(cells: Mark[], b: BoardSpec): number[] {
  const open: number[] = [];
  for (let c = 0; c < b.cols; c++) if (dropRow(cells, b, c) >= 0) open.push(c);
  return open;
}

export function play(
  cells: Mark[],
  b: BoardSpec,
  where: number,
  mark: 0 | 1,
): { cells: Mark[]; index: number; row: number; col: number } | null {
  if (b.drop) {
    const row = dropRow(cells, b, where);
    if (row < 0) return null;
    const index = row * b.cols + where;
    const next = cells.slice();
    next[index] = mark;
    return { cells: next, index, row, col: where };
  }

  if (cells[where] !== null) return null;
  const next = cells.slice();
  next[where] = mark;
  return {
    cells: next,
    index: where,
    row: Math.floor(where / b.cols),
    col: where % b.cols,
  };
}

/** Where a Bid-Tac-Toe square sits, in words - the reveal names it out loud. */
export const SQUARE_NAMES = [
  'Top left',
  'Top middle',
  'Top right',
  'Middle left',
  'Centre',
  'Middle right',
  'Bottom left',
  'Bottom middle',
  'Bottom right',
];
