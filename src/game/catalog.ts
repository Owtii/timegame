import type { BoardId, GameId, GameKind } from './types';

export type Accent = 'p1' | 'p2' | 'action' | 'mind' | 'good' | 'coin';

export interface CatalogEntry {
  id: GameId;
  kind: GameKind;
  name: string;
  /** One line, sentence case, no full stop needed in a row. */
  tagline: string;
  accent: Accent;
  /** Which grid the game is played on, if any. */
  board?: BoardId;
  /** Rounds needed to take the match, for the games scored in rounds. */
  winTo?: number;
  /** Which Mind Score sub-score a result moves. */
  facet: 'pattern' | 'timing' | 'deduction' | 'strategy';
  /** The flagship gets the promo block at the top of the shelf. */
  featured?: boolean;
}

/**
 * Every game the app can start. `kind` decides which engine drives it:
 * `board` plays the grid directly, `guess` / `tap` are standalone duels with
 * no grid, `duel` wins a mini-game then claims a square, and `bid` names a
 * square then seals a bid for it.
 */
export const CATALOG: CatalogEntry[] = [
  {
    id: 'bid',
    kind: 'bid',
    board: 'ttt',
    name: 'Bid-Tac-Toe',
    tagline: 'Seal a bid for each square. Highest takes it - both pay.',
    accent: 'p2',
    facet: 'strategy',
    featured: true,
  },
  {
    id: 'ttt',
    kind: 'board',
    board: 'ttt',
    name: 'Tic-Tac-Toe',
    tagline: '3x3, three in a row.',
    accent: 'p1',
    facet: 'pattern',
  },
  {
    id: 'c4',
    kind: 'board',
    board: 'c4',
    name: 'Connect 4',
    tagline: '7x6, drop a piece, four in a row.',
    accent: 'action',
    facet: 'pattern',
  },
  {
    id: 'guess',
    kind: 'guess',
    name: 'Number Guess',
    tagline: 'Secret 1-100. Higher or lower.',
    accent: 'mind',
    winTo: 2,
    facet: 'deduction',
  },
  {
    id: 'tap',
    kind: 'tap',
    name: 'Tap the Time',
    tagline: 'Stop the blind clock on target.',
    accent: 'good',
    winTo: 3,
    facet: 'timing',
  },
  {
    id: 'dtimer',
    kind: 'duel',
    name: 'Timer Duel',
    tagline: 'Closest stop claims a square.',
    accent: 'good',
    facet: 'timing',
  },
  {
    id: 'dnumber',
    kind: 'duel',
    name: 'Number Duel',
    tagline: '1-10, three tries, closest takes it.',
    accent: 'mind',
    facet: 'deduction',
  },
];

const BY_ID = new Map(CATALOG.map((e) => [e.id, e]));

export const gameById = (id: GameId): CatalogEntry => {
  const entry = BY_ID.get(id);
  if (!entry) throw new Error(`unknown game: ${id}`);
  return entry;
};

export const ACCENT_VAR: Record<Accent, string> = {
  p1: 'var(--p1)',
  p2: 'var(--p2)',
  action: 'var(--action)',
  mind: 'var(--mind)',
  good: 'var(--good)',
  coin: 'var(--coin)',
};

export const ACCENT_LIP: Record<Accent, string> = {
  p1: 'var(--p1-lip)',
  p2: 'var(--p2-lip)',
  action: 'var(--action-lip)',
  mind: 'var(--mind-lip)',
  good: 'var(--good-lip)',
  coin: 'var(--coin-lip)',
};
