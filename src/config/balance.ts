/**
 * Every tunable number in the game.
 *
 * Nothing may be hardcoded anywhere else. The economy gets retuned
 * constantly after launch and shipping a build to change one figure is
 * unacceptable, so this object is the single source and `applyRemote`
 * lets a config table run over the top of it at boot.
 */
export const BALANCE = {
  rewards: {
    coinsPerRound: 5,
    coinsSharpStop: 3,
    coinsPerMatch: 25,
    /** Every finished match pays, win lose or draw. */
    coinsPerMatchPlayed: 8,
    sharpWindowSeconds: 0.1,
    /** Bot matches pay this fraction and never touch Mind Score or stats. */
    botCoinMultiplier: 0.55,
  },

  clocks: {
    moveSeconds: 30,
    bidSeconds: 45,
    guessSeconds: 30,
    /** Seconds left when the clock starts counting down in figures. */
    warnAtSeconds: 10,
  },

  timing: {
    duelTargetMin: 3.0,
    duelTargetMax: 8.0,
    tapTargetMin: 2.0,
    tapTargetMax: 10.0,
    /** Both players off by more than this and the round is void. */
    voidLimitSeconds: 1.5,
    /** The digits hide after this long - from here you run blind. */
    blindAtSeconds: 1.0,
    /** Grace period after starting before a stop registers. */
    armDelaySeconds: 0.2,
    tapRoundsToWin: 3,
  },

  numbers: {
    soloHigh: 100,
    /** Total guesses across both players before a solo round is spent. */
    soloCap: 14,
    duelHigh: 10,
    duelTries: 3,
    guessRoundsToWin: 2,
  },

  bidding: {
    pool: 24,
    poolMin: 6,
    poolMax: 60,
    /** Bidding 0 banks this many points instead of costing anything. */
    passBank: 1,
    /** Double passes in a row on one square before it goes to whoever named it. */
    passLimit: 3,
  },

  base: {
    /** Seconds between cans at level 1, divided by the pump's nozzle count. */
    pumpSecondsPerCan: 6,
    workerWalkSpeed: 1.15,
    /** Speed multiplier per gait tier: walk, brisk, jog, sprint. */
    gaitSpeedMultipliers: [1.0, 1.25, 1.6, 2.1],
    pickupSeconds: 0.5,
    dropSeconds: 0.5,
    coinsPerCan: 3,
    /** The base never fully stops - with no energy it idles at a quarter speed. */
    sleepSpeedMultiplier: 0.25,
    boostedSpeedMultiplier: 2.0,
    /** Energy only ever comes from playing. It is never for sale. */
    energyPerMatch: 10,
    energyMax: 80,
    energyDrainPerSecond: 0.1,
    offlineCapHours: 4,
    offlineAlwaysSleepSpeed: true,
  },

  upgrades: {
    firstCost: 120,
    costGrowth: 1.62,
    pumpCostScale: 1.0,
    workerCostScale: 1.15,
    machineCostScale: 1.4,
    maxLevel: 16,
    pumpRatePerLevel: 0.18,
    workerSpeedPerLevel: 0.12,
    /**
     * A level always adds at least one coin regardless of the fraction,
     * because coins are whole numbers and two levels rounding to the same
     * figure means one of them was bought for nothing.
     */
    machineCoinPerLevel: 0.45,
  },

  mind: {
    startingScore: 1000,
    kFactor: 28,
    /** Losses are scaled by this, so the score falls only very slowly. */
    lossDamping: 0.28,
    /** A loss inside this expectation margin still nudges the score up. */
    closeLossBand: 0.12,
    closeLossGain: 3,
    floor: 600,
  },

  shop: {
    caseCost: 220,
    dupeBack: { common: 25, uncommon: 45, rare: 90, epic: 200, legendary: 450 },
  },
};

export type Balance = typeof BALANCE;

/**
 * Applies one remote key/value pair. Keys are dotted paths matching the
 * fields above, e.g. `base.coinsPerCan`. Unknown keys are ignored rather
 * than thrown: a config table that has run ahead of the client must never
 * break the client.
 */
export function applyRemote(key: string, value: string | number): boolean {
  const parts = key.split('.');
  let node: Record<string, unknown> = BALANCE as unknown as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const next = node[parts[i]];
    if (typeof next !== 'object' || next === null) return false;
    node = next as Record<string, unknown>;
  }

  const leaf = parts[parts.length - 1];
  const current = node[leaf];
  if (typeof current !== 'number') return false;

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return false;

  node[leaf] = parsed;
  return true;
}
