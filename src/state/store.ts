import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { BALANCE } from '../config/balance';
import type { GameId } from '../game/types';
import {
  cansPerMinute,
  coinsPerCan,
  isMaxed,
  offlineEarnings,
  speedMultiplier,
  upgradeCost,
  type OfflineReport,
  type StructureId,
  type Structures,
} from './economy';
import { applyResult, newMindState, type Facet, type MatchOutcome, type MindState } from './mind';

export interface GameTally {
  played: number;
  won: number;
}

export interface MatchRow {
  id: string;
  at: number;
  game: GameId;
  vsBot: boolean;
  outcome: MatchOutcome;
  rounds: number;
  coins: number;
  mindDelta: number;
}

export interface Save {
  version: number;
  name: string;
  coins: number;
  energy: number;
  mind: MindState;
  structures: Structures;
  stats: Partial<Record<GameId, GameTally>>;
  matches: number;
  wornColour: string;
  ownedColours: string[];
  boardStyle: string;
  ownedStyles: string[];
  cupsNotify: boolean;
  /** Wall clock at the last write, so offline earnings can be worked out. */
  lastSeen: number;
  /** Rows waiting to go up to Supabase. Offline-first: play never blocks on it. */
  outbox: MatchRow[];
  /** Coins earned but under one whole coin, carried between ticks. */
  fraction: number;
}

const freshSave = (): Save => ({
  version: 3,
  name: 'You',
  coins: 250,
  energy: 0,
  mind: newMindState(),
  structures: { pump: 1, worker: 1, machine: 1 },
  stats: {},
  matches: 0,
  wornColour: 'ice',
  ownedColours: ['ice', 'rose'],
  boardStyle: 'night',
  ownedStyles: ['night'],
  cupsNotify: false,
  lastSeen: Date.now(),
  outbox: [],
  fraction: 0,
});

export interface MatchReward {
  coins: number;
  energy: number;
  mindDelta: number;
}

interface SaveStore {
  save: Save;
  /** Set once at boot when the base earned something while the app was shut. */
  offline: OfflineReport | null;

  tick: (deltaSeconds: number) => void;
  bootOffline: () => void;
  claimOffline: () => void;

  upgrade: (id: StructureId) => boolean;
  finishMatch: (input: {
    game: GameId;
    vsBot: boolean;
    outcome: MatchOutcome;
    facet: Facet;
    rounds: number;
    roundsWon: number;
    sharpStops: number;
  }) => MatchReward;

  wearColour: (id: string) => void;
  buyColour: (id: string, price: number) => boolean;
  wearStyle: (id: string) => void;
  buyStyle: (id: string, price: number) => boolean;
  setCupsNotify: (on: boolean) => void;
  rename: (name: string) => void;
  reset: () => void;
}

export const useSave = create<SaveStore>()(
  persist(
    (set, get) => ({
      save: freshSave(),
      offline: null,

      /**
       * The base runs whether or not you are looking at it. Coins accrue as a
       * float and only cross into the balance a whole coin at a time, so a
       * slow line still pays rather than rounding to nothing every frame.
       */
      tick: (dt) =>
        set((s) => {
          const save = s.save;
          const perSecond =
            (cansPerMinute(save.structures) *
              coinsPerCan(save.structures.machine) *
              speedMultiplier(save.energy)) /
            60;

          const gained = save.fraction + perSecond * dt;
          const whole = Math.floor(gained);

          const energy = Math.max(
            0,
            save.energy - (save.energy > 0 ? BALANCE.base.energyDrainPerSecond * dt : 0),
          );

          return {
            save: {
              ...save,
              coins: save.coins + whole,
              fraction: gained - whole,
              energy,
              lastSeen: Date.now(),
            },
          };
        }),

      bootOffline: () => {
        const save = get().save;
        const away = Math.max(0, (Date.now() - save.lastSeen) / 1000);
        // under a minute is a page refresh, not a session
        if (away < 60) {
          set({ save: { ...save, lastSeen: Date.now() } });
          return;
        }
        const report = offlineEarnings(save.structures, away);
        if (report.coins <= 0) {
          set({ save: { ...save, lastSeen: Date.now() } });
          return;
        }
        set({ offline: report });
      },

      claimOffline: () =>
        set((s) => {
          const report = s.offline;
          if (!report) return s;
          return {
            offline: null,
            save: { ...s.save, coins: s.save.coins + report.coins, lastSeen: Date.now() },
          };
        }),

      upgrade: (id) => {
        const save = get().save;
        const level = save.structures[id];
        if (isMaxed(level)) return false;
        const cost = upgradeCost(id, level);
        if (save.coins < cost) return false;

        set({
          save: {
            ...save,
            coins: save.coins - cost,
            structures: { ...save.structures, [id]: level + 1 },
          },
        });
        return true;
      },

      /**
       * Every finished match pays coins and energy, win lose or draw - the
       * base must never stall because you had a bad run. Bot matches pay a
       * fraction and leave Mind Score and the win record alone, so grinding
       * the bot cannot inflate either.
       */
      finishMatch: ({ game, vsBot, outcome, facet, rounds, roundsWon, sharpStops }) => {
        const save = get().save;
        const r = BALANCE.rewards;

        let coins =
          r.coinsPerMatchPlayed +
          roundsWon * r.coinsPerRound +
          sharpStops * r.coinsSharpStop +
          (outcome === 'win' ? r.coinsPerMatch : 0);

        if (vsBot) coins = Math.round(coins * r.botCoinMultiplier);

        const energy = BALANCE.base.energyPerMatch;

        let mind = save.mind;
        let mindDelta = 0;
        if (!vsBot) {
          const applied = applyResult(mind, outcome, facet, mind.score);
          mind = applied.next;
          mindDelta = applied.delta;
        }

        const tally = save.stats[game] ?? { played: 0, won: 0 };
        const stats = vsBot
          ? save.stats
          : {
              ...save.stats,
              [game]: {
                played: tally.played + 1,
                won: tally.won + (outcome === 'win' ? 1 : 0),
              },
            };

        const row: MatchRow = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          at: Date.now(),
          game,
          vsBot,
          outcome,
          rounds,
          coins,
          mindDelta,
        };

        set({
          save: {
            ...save,
            coins: save.coins + coins,
            energy: Math.min(BALANCE.base.energyMax, save.energy + energy),
            mind,
            stats,
            matches: save.matches + (vsBot ? 0 : 1),
            // the outbox is a ring: an unsynced backlog must never grow without bound
            outbox: [...save.outbox, row].slice(-400),
            lastSeen: Date.now(),
          },
        });

        return { coins, energy, mindDelta };
      },

      wearColour: (id) => set((s) => ({ save: { ...s.save, wornColour: id } })),

      buyColour: (id, price) => {
        const save = get().save;
        if (save.ownedColours.includes(id)) return false;
        if (save.coins < price) return false;
        set({
          save: {
            ...save,
            coins: save.coins - price,
            ownedColours: [...save.ownedColours, id],
            wornColour: id,
          },
        });
        return true;
      },

      wearStyle: (id) => set((s) => ({ save: { ...s.save, boardStyle: id } })),

      buyStyle: (id, price) => {
        const save = get().save;
        if (save.ownedStyles.includes(id)) return false;
        if (save.coins < price) return false;
        set({
          save: {
            ...save,
            coins: save.coins - price,
            ownedStyles: [...save.ownedStyles, id],
            boardStyle: id,
          },
        });
        return true;
      },

      setCupsNotify: (on) => set((s) => ({ save: { ...s.save, cupsNotify: on } })),
      rename: (name) => set((s) => ({ save: { ...s.save, name: name.slice(0, 14) || 'You' } })),
      reset: () => set({ save: freshSave(), offline: null }),
    }),
    {
      name: 'duelboard.save.v3',
      // only the save travels; `offline` is worked out fresh every boot
      partialize: (s) => ({ save: s.save }),
    },
  ),
);

export const useSaveData = () => useSave((s) => s.save);
