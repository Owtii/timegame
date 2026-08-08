/** Which piece sits in a cell. `null` is an open square. */
export type Mark = 0 | 1 | null;

export type GameId =
  | 'ttt'
  | 'c4'
  | 'guess'
  | 'tap'
  | 'dtimer'
  | 'dnumber'
  | 'bid';

/**
 * How a game is driven.
 * - `board` plays the grid directly
 * - `guess` / `tap` are standalone duels with no grid
 * - `duel` wins the mini-game, then claims a square
 * - `bid` names a square, then both seal a bid for it
 */
export type GameKind = 'board' | 'guess' | 'tap' | 'duel' | 'bid';

export type BoardId = 'ttt' | 'c4';

export interface MatchRequest {
  game: GameId;
  vsBot: boolean;
  /** Which grid a duel is fought over. Ignored by the other kinds. */
  board?: BoardId;
  /** Tap the Time lets you name your own target instead of rolling one. */
  ownTarget?: number | null;
}

export const other = (p: 0 | 1): 0 | 1 => (p === 0 ? 1 : 0);
