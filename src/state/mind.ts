import { BALANCE } from '../config/balance';

export type Facet = 'pattern' | 'timing' | 'deduction' | 'strategy';

export interface MindState {
  score: number;
  facets: Record<Facet, number>;
  /** Movement over the last seven days, for the `+18` chip in the HUD. */
  week: number;
}

export const newMindState = (): MindState => ({
  score: BALANCE.mind.startingScore,
  facets: { pattern: 300, timing: 300, deduction: 300, strategy: 300 },
  week: 0,
});

const expected = (a: number, b: number): number =>
  1 / (1 + Math.pow(10, (b - a) / 400));

export type MatchOutcome = 'win' | 'loss' | 'draw';

/**
 * Elo underneath, framed as growth on the surface.
 *
 * A win moves the score the full amount. A loss is damped hard, and a loss
 * inside the close band still nudges upward - the number is meant to reward
 * turning up and playing well, not to punish a bad night. It is never
 * described as an IQ, in the app or anywhere else: it measures how you have
 * played here and nothing more.
 */
export function applyResult(
  m: MindState,
  outcome: MatchOutcome,
  facet: Facet,
  opponentScore: number,
): { next: MindState; delta: number } {
  const cfg = BALANCE.mind;
  const e = expected(m.score, opponentScore);
  const actual = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;

  let delta = cfg.kFactor * (actual - e);

  if (delta < 0) {
    // a close loss still counts as progress; anything worse falls slowly
    if (e - actual <= 0.5 + cfg.closeLossBand && outcome === 'loss' && e < 0.5 + cfg.closeLossBand) {
      delta = cfg.closeLossGain;
    } else {
      delta *= cfg.lossDamping;
    }
  }

  const rounded = Math.round(delta);
  const score = Math.max(cfg.floor, m.score + rounded);

  const facets = { ...m.facets };
  facets[facet] = Math.max(0, Math.round(facets[facet] + rounded * 1.2));

  return { next: { score, facets, week: m.week + rounded }, delta: rounded };
}

/** The four sub-scores are shown as ten blocks each, so they need a ceiling. */
export const FACET_MAX = 500;

export const FACET_GAMES: Record<Facet, string> = {
  pattern: 'Tic-Tac-Toe / Connect 4',
  timing: 'Tap the Time / Timer Duel',
  deduction: 'Number Guess / Number Duel',
  strategy: 'Bid-Tac-Toe',
};

export const FACET_ACCENT: Record<Facet, string> = {
  pattern: 'var(--p1)',
  timing: 'var(--good)',
  deduction: 'var(--action)',
  strategy: 'var(--p2)',
};
