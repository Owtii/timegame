import { describe, expect, it } from 'vitest';

import { BALANCE } from '../config/balance';
import { BOARDS, dropRow, judge, newBoard, play } from './board';
import { cost, newBidState, reveal, settle } from './bid';
import { botPickSquare, ticTacToe } from './bot';
import {
  closestWinner,
  knownRange,
  newNumberRound,
  numberActor,
  submit,
} from './number';
import { newTimingRound, quantise, record, resolveTiming } from './timing';
import type { Mark } from './types';

const board = (s: string): Mark[] =>
  s
    .replace(/\s/g, '')
    .split('')
    .map((c) => (c === 'x' ? 0 : c === 'o' ? 1 : null));

describe('n-in-a-row', () => {
  it('finds a row, a column and both diagonals on 3x3', () => {
    expect(judge(board('xxx......'), BOARDS.ttt)?.winner).toBe(0);
    expect(judge(board('o..o..o..'), BOARDS.ttt)?.winner).toBe(1);
    expect(judge(board('x...x...x'), BOARDS.ttt)?.winner).toBe(0);
    expect(judge(board('..o.o.o..'), BOARDS.ttt)?.winner).toBe(1);
  });

  it('leaves a live board undecided', () => {
    expect(judge(board('xo.......'), BOARDS.ttt)).toBeNull();
  });

  it('calls a full board with no line a draw', () => {
    const v = judge(board('xxoooxxxo'), BOARDS.ttt);
    expect(v).not.toBeNull();
    expect(v?.winner).toBeNull();
  });

  it('needs four in a row on Connect 4, not three', () => {
    const c4 = newBoard(BOARDS.c4);
    for (let i = 0; i < 3; i++) c4[35 + i] = 0;
    expect(judge(c4, BOARDS.c4)).toBeNull();
    c4[38] = 0;
    expect(judge(c4, BOARDS.c4)?.winner).toBe(0);
  });

  it('returns the winning run, so the line can be drawn', () => {
    expect(judge(board('xxx......'), BOARDS.ttt)?.line).toEqual([0, 1, 2]);
  });
});

describe('dropping a piece', () => {
  it('lands on the lowest open row and stacks upward', () => {
    let cells = newBoard(BOARDS.c4);
    expect(dropRow(cells, BOARDS.c4, 3)).toBe(5);
    cells = play(cells, BOARDS.c4, 3, 0)!.cells;
    expect(dropRow(cells, BOARDS.c4, 3)).toBe(4);
  });

  it('refuses a full column', () => {
    let cells = newBoard(BOARDS.c4);
    for (let i = 0; i < 6; i++) cells = play(cells, BOARDS.c4, 0, 0)!.cells;
    expect(dropRow(cells, BOARDS.c4, 0)).toBe(-1);
    expect(play(cells, BOARDS.c4, 0, 1)).toBeNull();
  });
});

describe('the clock', () => {
  it('quantises to centiseconds, so two visible 4.28s tie', () => {
    expect(quantise(4.2843)).toBe(4.28);
    expect(quantise(4.2812)).toBe(4.28);
  });

  it('gives the round to the closer stop', () => {
    let r = newTimingRound(4.0, 1.5, 0);
    r = record(r, 0, 4.1);
    r = record(r, 1, 3.6);
    expect(resolveTiming(r)).toEqual({ outcome: 'win', winner: 0 });
  });

  it('calls sudden death on equal deviations', () => {
    let r = newTimingRound(4.0, 1.5, 0);
    r = record(r, 0, 4.2);
    r = record(r, 1, 3.8);
    expect(resolveTiming(r).outcome).toBe('tie');
  });

  it('voids a round both players missed by more than the limit', () => {
    let r = newTimingRound(4.0, 1.5, 0);
    r = record(r, 0, 6.0);
    r = record(r, 1, 1.5);
    expect(resolveTiming(r).outcome).toBe('void');
  });
});

describe('deduction', () => {
  it('narrows the live range from the clues alone', () => {
    let r = newNumberRound(false, 0, BALANCE.numbers);
    r = { ...r, secret: 50 };
    r = submit(r, 30, 0).round;
    r = submit(r, 70, 1).round;
    expect(knownRange(r)).toEqual({ lo: 31, hi: 69 });
  });

  it('alternates strictly from whoever led the round', () => {
    let r = newNumberRound(false, 1, BALANCE.numbers);
    expect(numberActor(r)).toBe(1);
    r = submit(r, 10, 1).round;
    expect(numberActor(r)).toBe(0);
  });

  it('gives a shared distance to whoever reached it first', () => {
    let r = newNumberRound(true, 0, BALANCE.numbers);
    r = { ...r, secret: 5 };
    r = submit(r, 3, 0).round; // distance 2, first
    r = submit(r, 7, 1).round; // distance 2, second
    expect(closestWinner(r)).toBe(0);
  });
});

describe('bid-tac-toe', () => {
  it('banks a point for a pass instead of charging for it', () => {
    const s = newBidState(24, 1, 3, 0);
    expect(cost(s, 0)).toBe(-1);
    expect(cost(s, 7)).toBe(7);
  });

  it('charges both players, not only the winner', () => {
    const s = { ...newBidState(24, 1, 3, 0), square: 4 };
    const { verdict, passRun } = reveal(s, 10, 6);
    const after = settle(s, verdict, passRun, 10, 6, newBoard(BOARDS.ttt));
    expect(after.state.balance).toEqual([14, 18]);
    expect(after.cells[4]).toBe(0);
  });

  it('leaves the square up and the pick unmoved on a tie', () => {
    const s = { ...newBidState(24, 1, 3, 0), square: 4 };
    const { verdict, passRun } = reveal(s, 8, 8);
    const after = settle(s, verdict, passRun, 8, 8, newBoard(BOARDS.ttt));
    expect(verdict.tied).toBe(true);
    expect(after.cells[4]).toBeNull();
    expect(after.state.chooser).toBe(0);
    expect(after.state.square).toBe(4);
    expect(after.state.balance).toEqual([16, 16]);
  });

  it('hands the square to whoever named it on the third double pass', () => {
    let s = { ...newBidState(24, 1, 3, 0), square: 4 };
    for (let i = 0; i < 2; i++) {
      const step = reveal(s, 0, 0);
      expect(step.verdict.forced).toBe(false);
      s = settle(s, step.verdict, step.passRun, 0, 0, newBoard(BOARDS.ttt)).state;
    }
    const third = reveal(s, 0, 0);
    expect(third.verdict.forced).toBe(true);
    expect(third.verdict.winner).toBe(0);
  });

  it('marks a blowout and a one-point win differently', () => {
    const s = { ...newBidState(24, 1, 3, 0), square: 4 };
    expect(reveal(s, 20, 2).verdict.decisive).toBe(true);
    expect(reveal(s, 9, 8).verdict.close).toBe(true);
  });
});

describe('the bot', () => {
  it('takes a win when one is on offer', () => {
    // o o . / x x . / . . .  - o to move takes index 2
    expect(ticTacToe(board('oo.xx....'), 1)).toBe(2);
  });

  it('names the square that completes its own line first', () => {
    expect(botPickSquare(board('oo.xx....'), 1)).toBe(2);
  });

  it('blocks when it cannot win', () => {
    // x x . / o . . / . . .  - o must take index 2
    expect(botPickSquare(board('xx.o.....'), 1)).toBe(2);
  });
});
