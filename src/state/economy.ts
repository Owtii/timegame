import { BALANCE } from '../config/balance';

export type StructureId = 'pump' | 'worker' | 'machine';

export interface Structures {
  pump: number;
  worker: number;
  machine: number;
}

export const STRUCTURE_NAMES: Record<StructureId, string> = {
  pump: 'Oil Pump',
  worker: 'Worker',
  machine: 'Machine',
};

export const STRUCTURE_BLURB: Record<StructureId, string> = {
  pump: 'Fills the cans. More nozzles, more oil.',
  worker: 'Hauls the cans across. The whole line waits on their legs.',
  machine: 'Burns oil into coins. Worth the most per level.',
};

/** The distance the worker covers one way, in platform units. */
const HAUL_DISTANCE = 6.2;

const scaleOf = (id: StructureId): number =>
  id === 'pump'
    ? BALANCE.upgrades.pumpCostScale
    : id === 'worker'
      ? BALANCE.upgrades.workerCostScale
      : BALANCE.upgrades.machineCostScale;

/** What the next level costs. Level is 1-based and caps at `maxLevel`. */
export function upgradeCost(id: StructureId, level: number): number {
  const u = BALANCE.upgrades;
  const raw = u.firstCost * Math.pow(u.costGrowth, level - 1) * scaleOf(id);
  return Math.round(raw / 10) * 10;
}

export const isMaxed = (level: number): boolean => level >= BALANCE.upgrades.maxLevel;

/** Nozzles on the pump: one now, one more every four levels. */
export const nozzles = (level: number): number => 1 + Math.floor((level - 1) / 4);

/** Cans the worker carries per trip: one now, one more every four levels. */
export const carryCapacity = (level: number): number =>
  1 + Math.floor((level - 1) / 4);

export const pumpCansPerMinute = (level: number): number =>
  (60 / BALANCE.base.pumpSecondsPerCan) *
  nozzles(level) *
  (1 + BALANCE.upgrades.pumpRatePerLevel * (level - 1));

export const workerSpeed = (level: number): number =>
  BALANCE.base.workerWalkSpeed * (1 + BALANCE.upgrades.workerSpeedPerLevel * (level - 1));

/** Seconds for one full loop: walk loaded, drop, walk back empty, pick up. */
export const workerLoopSeconds = (level: number): number =>
  (HAUL_DISTANCE * 2) / workerSpeed(level) +
  BALANCE.base.pickupSeconds +
  BALANCE.base.dropSeconds;

export const workerCansPerMinute = (level: number): number =>
  (60 / workerLoopSeconds(level)) * carryCapacity(level);

/**
 * Coins a delivered can is worth.
 *
 * A level always adds at least one coin regardless of the fraction, because
 * coins are whole numbers and two levels rounding to the same figure means
 * one of them was bought for nothing.
 */
export const coinsPerCan = (level: number): number =>
  Math.max(
    BALANCE.base.coinsPerCan + (level - 1),
    Math.round(BALANCE.base.coinsPerCan * (1 + BALANCE.upgrades.machineCoinPerLevel * (level - 1))),
  );

/** The line runs at the speed of its slowest part. */
export const cansPerMinute = (s: Structures): number =>
  Math.min(pumpCansPerMinute(s.pump), workerCansPerMinute(s.worker));

export const speedMultiplier = (energy: number): number =>
  energy > 0 ? BALANCE.base.boostedSpeedMultiplier : BALANCE.base.sleepSpeedMultiplier;

/** Coins per minute at the current speed. This is the headline figure. */
export const coinsPerMinute = (s: Structures, energy: number): number =>
  cansPerMinute(s) * coinsPerCan(s.machine) * speedMultiplier(energy);

/**
 * A rate small enough that rounding would swallow a whole level keeps a
 * decimal.
 *
 * At sleep speed an early upgrade moves the figure by well under a coin, and
 * a popup that reads "4 /MIN -> 4 /MIN" is asking to be paid for nothing.
 */
export const formatRate = (n: number): string => (n >= 20 ? String(Math.round(n)) : n.toFixed(1));

/** What a level would buy, for the before/after row in the upgrade popup. */
export function projected(s: Structures, id: StructureId, energy: number): number {
  const next: Structures = { ...s, [id]: s[id] + 1 };
  return coinsPerMinute(next, energy);
}

/**
 * Which structure the line is currently waiting on.
 *
 * The machine is never the answer: it converts whatever arrives, so it
 * cannot starve the line - it only changes what a can is worth.
 */
export const bottleneck = (s: Structures): 'pump' | 'worker' =>
  pumpCansPerMinute(s.pump) <= workerCansPerMinute(s.worker) ? 'pump' : 'worker';

export interface OfflineReport {
  coins: number;
  seconds: number;
  capped: boolean;
}

/**
 * What the base made while the app was shut.
 *
 * Offline production runs at sleep speed whatever energy is banked - the
 * boost is a reward for playing, and it should not tick down unattended -
 * and it stops at the cap so a week away is not a jackpot.
 */
export function offlineEarnings(s: Structures, awaySeconds: number): OfflineReport {
  const capSeconds = BALANCE.base.offlineCapHours * 3600;
  const capped = awaySeconds > capSeconds;
  const seconds = Math.min(awaySeconds, capSeconds);

  const perMinute =
    cansPerMinute(s) * coinsPerCan(s.machine) * BALANCE.base.sleepSpeedMultiplier;

  return { coins: Math.floor((perMinute * seconds) / 60), seconds, capped };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
