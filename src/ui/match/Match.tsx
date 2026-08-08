import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BALANCE } from '../../config/balance';
import {
  BOARDS,
  isFull,
  judge,
  marksOn,
  openCells,
  play,
  type BoardSpec,
  type BoardVerdict,
} from '../../game/board';
import { newBidState, reveal, settle, type BidState, type BidVerdict } from '../../game/bid';
import { botBid, botGuess, botMove, botPickSquare, botStopTime } from '../../game/bot';
import { gameById } from '../../game/catalog';
import {
  closestWinner,
  knownRange,
  newNumberRound,
  numberActor,
  spent,
  submit,
  type NumberRound,
} from '../../game/number';
import {
  newTimingRound,
  randomTarget,
  record,
  resolveTiming,
  timingActor,
  type TimingRound,
} from '../../game/timing';
import type { MatchRequest, Mark } from '../../game/types';
import { colourById } from '../../state/cosmetics';
import type { MatchOutcome } from '../../state/mind';
import { useSave, useSaveData, type MatchReward } from '../../state/store';
import { Meter } from '../primitives';
import { BidPlace, BidReveal } from './BidScreens';
import { BoardView, ColumnArrows, type DropAnimation } from './BoardView';
import { ClockScreen } from './ClockScreen';
import { HandOver } from './HandOver';
import { NumberScreen } from './NumberScreen';
import { Result } from './Result';

type Phase =
  | { k: 'toss' }
  | { k: 'play' }
  | { k: 'pick' }
  | { k: 'seal'; player: 0 | 1 }
  | { k: 'reveal'; bids: [number, number]; verdict: BidVerdict; run: number }
  | { k: 'clock' }
  | { k: 'number' }
  | { k: 'claim'; winner: 0 | 1 }
  | { k: 'round'; title: string; sub: string; tone: string }
  | { k: 'handover'; to: 0 | 1; next: Phase }
  | { k: 'over'; winner: 0 | 1 | null; reason: string };

export function Match({ request, onExit }: { request: MatchRequest; onExit: () => void }) {
  const save = useSaveData();
  const finishMatch = useSave((s) => s.finishMatch);

  const entry = useMemo(() => gameById(request.game), [request.game]);
  const spec: BoardSpec | null = useMemo(() => {
    const id = request.board ?? entry.board;
    return id ? BOARDS[id] : null;
  }, [request.board, entry.board]);

  const names = useMemo<[string, string]>(
    () => [save.name, request.vsBot ? 'Bot' : save.rival.name],
    [save.name, save.rival.name, request.vsBot],
  );

  /**
   * The bot borrows the other seat's colour but never its name or its
   * progress. Two players may not wear the same mark, so a clash falls back
   * to the other end of the palette rather than putting two identical pieces
   * on one board.
   */
  const colours = useMemo<[string, string]>(() => {
    const mine = colourById(save.wornColour).hex;
    let theirs = colourById(save.rival.colour).hex;
    if (theirs.toUpperCase() === mine.toUpperCase()) {
      theirs = mine.toUpperCase() === '#FF5FA2' ? '#4CC9F0' : '#FF5FA2';
    }
    return [mine, theirs];
  }, [save.wornColour, save.rival.colour]);

  // ---------- shared match state ----------

  const [cells, setCells] = useState<Mark[]>(() =>
    spec ? new Array<Mark>(spec.cols * spec.rows).fill(null) : [],
  );
  const [phase, setPhase] = useState<Phase>(() =>
    entry.kind === 'bid' ? { k: 'toss' } : entry.kind === 'board' ? { k: 'play' } : { k: 'round', title: 'Round 1', sub: '', tone: 'var(--action)' },
  );
  const [turn, setTurn] = useState<0 | 1>(0);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [round, setRound] = useState(1);
  const [line, setLine] = useState<number[] | null>(null);
  const [falling, setFalling] = useState<DropAnimation | null>(null);
  const [reward, setReward] = useState<MatchReward | null>(null);
  const [sharpStops, setSharpStops] = useState(0);

  const [bid, setBid] = useState<BidState>(() =>
    newBidState(BALANCE.bidding.pool, BALANCE.bidding.passBank, BALANCE.bidding.passLimit, 0),
  );
  const [bidValue, setBidValue] = useState(0);
  const [timing, setTiming] = useState<TimingRound | null>(null);
  const [numbers, setNumbers] = useState<NumberRound | null>(null);

  const settled = useRef(false);
  const dropKey = useRef(0);

  /**
   * Which player the bid screen is for.
   *
   * Against the bot the human always seals - the bot's number is worked out
   * at the reveal - so a bot chooser must not be handed the dial.
   */
  const sealFor = useCallback(
    (player: 0 | 1): Phase => ({ k: 'seal', player: request.vsBot ? 0 : player }),
    [request.vsBot],
  );

  /** Pass and play hands the phone over; against the bot it runs straight through. */
  const handOver = useCallback(
    (to: 0 | 1, next: Phase): Phase =>
      request.vsBot || to === 1 ? next : { k: 'handover', to, next },
    [request.vsBot],
  );

  // ---------- ending a match ----------

  const finish = useCallback(
    (winner: 0 | 1 | null, reason: string, roundsWon: number) => {
      if (settled.current) return;
      settled.current = true;
      const outcome: MatchOutcome = winner === null ? 'draw' : winner === 0 ? 'win' : 'loss';
      const paid = finishMatch({
        game: request.game,
        vsBot: request.vsBot,
        outcome,
        facet: entry.facet,
        rounds: round,
        roundsWon,
        sharpStops,
      });
      setReward(paid);
      setPhase({ k: 'over', winner, reason });
    },
    [entry.facet, finishMatch, request.game, request.vsBot, round, sharpStops],
  );

  /** A board that has produced a line or filled up ends the match there. */
  const judgeBoard = useCallback(
    (next: Mark[]): BoardVerdict | null => {
      if (!spec) return null;
      const v = judge(next, spec);
      if (!v) return null;
      setLine(v.line);
      const reason =
        v.winner === null
          ? 'Board full, no line'
          : `${spec.need} in a row`;
      window.setTimeout(
        () => finish(v.winner, reason, v.winner === 0 ? 1 : 0),
        v.line ? 900 : 400,
      );
      return v;
    },
    [finish, spec],
  );

  // ---------- board games ----------

  const playBoard = useCallback(
    (where: number, by: 0 | 1) => {
      if (!spec) return;
      const done = play(cells, spec, where, by);
      if (!done) return;

      if (spec.drop) {
        dropKey.current += 1;
        setFalling({ col: done.col, row: done.row, mark: by, key: dropKey.current });
        window.setTimeout(() => setFalling(null), 420);
      }

      setCells(done.cells);
      if (judgeBoard(done.cells)) return;
      setTurn((t) => (1 - t) as 0 | 1);
    },
    [cells, judgeBoard, spec],
  );

  // ---------- rounds ----------

  const startRound = useCallback(
    (n: number) => {
      const first = ((n - 1) % 2) as 0 | 1; // who acts first alternates every round
      setRound(n);
      setLine(null);

      if (entry.kind === 'tap' || (entry.kind === 'duel' && entry.id === 'dtimer')) {
        const t = BALANCE.timing;
        const target =
          entry.kind === 'tap'
            ? (request.ownTarget ?? randomTarget(t.tapTargetMin, t.tapTargetMax))
            : randomTarget(t.duelTargetMin, t.duelTargetMax);
        setTiming(newTimingRound(target, t.voidLimitSeconds, first));
        setTurn(first);
        setPhase(handOver(first, { k: 'clock' }));
        return;
      }

      if (entry.kind === 'guess' || (entry.kind === 'duel' && entry.id === 'dnumber')) {
        const isDuel = entry.kind === 'duel';
        setNumbers(newNumberRound(isDuel, first, BALANCE.numbers));
        setTurn(first);
        setPhase({ k: 'number' });
        return;
      }

      setPhase({ k: 'play' });
    },
    [entry, handOver, request.ownTarget],
  );

  /** Round summary, then either the next round or the end of the match. */
  const closeRound = useCallback(
    (winner: 0 | 1 | null, title: string, sub: string) => {
      const next: [number, number] = [...score] as [number, number];
      if (winner !== null) next[winner] += 1;
      setScore(next);

      const tone = winner === null ? 'var(--muted)' : colours[winner];
      setPhase({ k: 'round', title, sub, tone });

      const winTo = entry.winTo ?? 0;
      if (winTo && (next[0] >= winTo || next[1] >= winTo)) {
        const champ = next[0] >= winTo ? 0 : 1;
        window.setTimeout(() => finish(champ, `First to ${winTo} rounds`, next[0]), 1900);
        return;
      }

      if (entry.kind === 'duel' && winner !== null) {
        window.setTimeout(() => setPhase({ k: 'claim', winner }), 1600);
        return;
      }

      window.setTimeout(() => startRound(round + 1), 1900);
    },
    [colours, entry, finish, round, score, startRound],
  );

  // ---------- timing ----------

  const stopClock = useCallback(
    (elapsed: number) => {
      if (!timing) return;
      const actor = timingActor(timing);
      const next = record(timing, actor, elapsed);

      const dev = next.devs[actor] ?? 99;
      if (dev <= BALANCE.rewards.sharpWindowSeconds && actor === 0) {
        setSharpStops((n) => n + 1);
      }

      if (next.turnIndex === 0) {
        const advanced: TimingRound = { ...next, turnIndex: 1 };
        setTiming(advanced);
        const other = timingActor(advanced);
        setTurn(other);
        setPhase(handOver(other, { k: 'clock' }));
        return;
      }

      setTiming(next);
      const { outcome, winner } = resolveTiming(next);
      const shown = `${names[0]} ${next.times[0]?.toFixed(2)}s · ${names[1]} ${next.times[1]?.toFixed(2)}s`;

      if (outcome === 'void') {
        closeRound(null, 'Round void', `Both more than ${next.voidLimit.toFixed(2)}s out. ${shown}`);
        return;
      }
      if (outcome === 'tie') {
        // sudden death: same round number, a fresh target
        setPhase({ k: 'round', title: 'Sudden death', sub: `Dead level. ${shown}`, tone: 'var(--action)' });
        window.setTimeout(() => startRound(round), 1900);
        return;
      }
      closeRound(winner, `${names[winner!]} takes it`, shown);
    },
    [closeRound, handOver, names, round, startRound, timing],
  );

  // ---------- numbers ----------

  const guess = useCallback(
    (n: number) => {
      if (!numbers) return;
      const actor = numberActor(numbers);
      const { round: next, guess: g } = submit(numbers, n, actor);
      setNumbers(next);

      if (g.res === 'hit') {
        closeRound(actor, `${names[actor]} landed it`, `The number was ${next.secret}.`);
        return;
      }

      if (spent(next)) {
        if (next.isDuel) {
          const w = closestWinner(next);
          closeRound(w, `${names[w]} was closest`, `The number was ${next.secret}.`);
        } else {
          closeRound(null, 'Nobody found it', `The number was ${next.secret}.`);
        }
        return;
      }

      setTurn(numberActor(next));
    },
    [closeRound, names, numbers],
  );

  // ---------- bid-tac-toe ----------

  const openReveal = useCallback(
    (b0: number, b1: number) => {
      const { verdict, passRun } = reveal(bid, b0, b1);
      setPhase({ k: 'reveal', bids: [b0, b1], verdict, run: passRun });
    },
    [bid],
  );

  const seal = useCallback(
    (value: number, by: 0 | 1) => {
      const bids: [number | null, number | null] = [...bid.bids] as [number | null, number | null];
      bids[by] = value;
      setBid({ ...bid, bids });
      setBidValue(0);

      const them = (1 - by) as 0 | 1;
      if (bids[them] !== null) {
        openReveal(bids[0]!, bids[1]!);
        return;
      }

      if (request.vsBot && them === 1) {
        const theirs = botBid(cells, bid.square, 1, bid.balance[1], bid.balance[0]);
        openReveal(by === 0 ? value : theirs, by === 0 ? theirs : value);
        return;
      }

      setTurn(them);
      setPhase(handOver(them, { k: 'seal', player: them }));
    },
    [bid, cells, handOver, openReveal, request.vsBot],
  );

  const nextSquare = useCallback(
    (bids: [number, number], verdict: BidVerdict, run: number) => {
      const applied = settle(bid, verdict, run, bids[0], bids[1], cells);
      setBid(applied.state);
      setCells(applied.cells);

      if (verdict.winner >= 0) {
        const v = judge(applied.cells, BOARDS.ttt);
        if (v) {
          setLine(v.line);
          window.setTimeout(
            () => finish(v.winner, v.winner === null ? 'Board full, no line' : 'Three in a row', v.winner === 0 ? 1 : 0),
            900,
          );
          return;
        }
      }

      setTurn(applied.state.chooser);
      // a tie settles nothing: the same square comes straight back up with the
      // same player still holding the pick
      setPhase(verdict.winner >= 0 ? { k: 'pick' } : sealFor(applied.state.chooser));
    },
    [bid, cells, finish, sealFor],
  );

  const pickSquare = useCallback(
    (i: number) => {
      if (cells[i] !== null) return;
      setBid((s) => ({ ...s, square: i, bids: [null, null] }));
      setBidValue(0);
      setPhase(sealFor(bid.chooser));
      setTurn(bid.chooser);
    },
    [bid.chooser, cells, sealFor],
  );

  const claimSquare = useCallback(
    (where: number, by: 0 | 1) => {
      if (!spec) return;
      const done = play(cells, spec, where, by);
      if (!done) return;
      setCells(done.cells);

      if (spec.drop) {
        dropKey.current += 1;
        setFalling({ col: done.col, row: done.row, mark: by, key: dropKey.current });
        window.setTimeout(() => setFalling(null), 420);
      }

      const v = judge(done.cells, spec);
      if (v) {
        setLine(v.line);
        window.setTimeout(
          () => finish(v.winner, v.winner === null ? 'Board full, no line' : `${spec.need} in a row`, score[0]),
          900,
        );
        return;
      }
      window.setTimeout(() => startRound(round + 1), 500);
    },
    [cells, finish, round, score, spec, startRound],
  );

  // ---------- the toss, and the first round ----------

  useEffect(() => {
    if (phase.k !== 'toss') return;
    const first = Math.random() < 0.5 ? 0 : 1;
    const t = window.setTimeout(() => {
      setBid((s) => ({ ...s, chooser: first as 0 | 1 }));
      setTurn(first as 0 | 1);
      setPhase({ k: 'pick' });
    }, 1600);
    return () => clearTimeout(t);
  }, [phase.k]);

  useEffect(() => {
    if (entry.kind === 'bid' || entry.kind === 'board') return;
    startRound(1);
    // one shot: the round machine drives itself from here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- the bot ----------

  useEffect(() => {
    if (!request.vsBot) return;
    let timer = 0;

    if (phase.k === 'play' && turn === 1 && spec) {
      timer = window.setTimeout(() => playBoard(botMove(cells, spec.id, 1), 1), 620);
    } else if (phase.k === 'claim' && phase.winner === 1 && spec) {
      const where = spec.drop ? botMove(cells, spec.id, 1) : botPickSquare(cells, 1);
      timer = window.setTimeout(() => claimSquare(where, 1), 720);
    } else if (phase.k === 'pick' && bid.chooser === 1) {
      timer = window.setTimeout(() => pickSquare(botPickSquare(cells, 1)), 760);
    } else if (phase.k === 'clock' && timing && timingActor(timing) === 1) {
      timer = window.setTimeout(() => stopClock(botStopTime(timing.target)), 1200);
    } else if (phase.k === 'number' && numbers && numberActor(numbers) === 1) {
      const { lo, hi } = knownRange(numbers);
      timer = window.setTimeout(
        () => guess(botGuess(lo, hi, numbers.guesses.map((g) => g.n))),
        900,
      );
    }

    return () => clearTimeout(timer);
  }, [
    bid.chooser,
    cells,
    claimSquare,
    guess,
    numbers,
    phase,
    pickSquare,
    playBoard,
    request.vsBot,
    spec,
    stopClock,
    timing,
    turn,
  ]);

  // ---------- the seal clock ----------

  const sealSeconds = BALANCE.clocks.bidSeconds;
  const [sealLeft, setSealLeft] = useState(sealSeconds);

  useEffect(() => {
    if (phase.k !== 'seal') {
      setSealLeft(sealSeconds);
      return;
    }
    const started = performance.now();
    const id = window.setInterval(() => {
      const left = sealSeconds - (performance.now() - started) / 1000;
      setSealLeft(Math.max(0, left));
      // run the clock out and the app seals for you rather than stalling
      if (left <= 0) seal(0, phase.player);
    }, 100);
    return () => clearInterval(id);
  }, [phase, seal, sealSeconds]);

  // ---------- render ----------

  if (phase.k === 'handover') {
    return (
      <HandOver
        name={names[phase.to]}
        colour={colours[phase.to]}
        onReady={() => setPhase(phase.next)}
      />
    );
  }

  if (phase.k === 'over' && reward) {
    return (
      <Result
        winner={phase.winner}
        names={names}
        colours={colours}
        score={score}
        rounds={round}
        gameName={entry.name}
        reason={phase.reason}
        reward={reward}
        spec={spec}
        cells={spec ? cells : null}
        line={line}
        onAgain={() => window.location.reload()}
        onHome={onExit}
      />
    );
  }

  /**
   * Who the screen is waiting on.
   *
   * `turn` alone is not it: claiming a square and naming one are their own
   * phases with their own actor, and a header that says the wrong name is
   * worse than no header at all.
   */
  const acting: 0 | 1 =
    phase.k === 'claim' ? phase.winner : phase.k === 'pick' ? bid.chooser : turn;

  const tag =
    entry.kind === 'bid'
      ? // squares settled, not bids placed: a tie or a double pass puts the
        // same square straight back up, and the count must not move for it
        `SQUARE ${marksOn(cells) + 1} OF 9`
      : entry.winTo
        ? `ROUND ${round} · ${score[0]}-${score[1]}`
        : `${names[acting].toUpperCase()} TO PLAY`;

  return (
    <div className="screen">
      <div className="topbar">
        <span className="tag">{tag}</span>
        <span style={{ font: '900 3.4rem/1 Nunito', color: 'var(--text)' }}>{entry.name}</span>
        <button
          onClick={onExit}
          aria-label="Leave the match"
          style={{
            width: '7.6rem',
            height: '7.6rem',
            borderRadius: '2.6rem',
            background: 'var(--card)',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '3.4rem',
              height: '0.8rem',
              borderRadius: '0.4rem',
              background: 'var(--muted)',
              transform: 'rotate(45deg)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              width: '3.4rem',
              height: '0.8rem',
              borderRadius: '0.4rem',
              background: 'var(--muted)',
              transform: 'rotate(-45deg)',
            }}
          />
        </button>
      </div>

      {phase.k !== 'seal' && phase.k !== 'reveal' && (
        <div style={{ padding: '0 4rem', marginTop: '3.2rem', flex: 'none' }}>
          <PlayerBars
            names={names}
            colours={colours}
            turn={acting}
            score={score}
            showScore={!!entry.winTo}
          />
        </div>
      )}

      <div className="screen-scroll" style={{ paddingTop: '3rem' }}>
        {phase.k === 'toss' && <Toss names={names} colours={colours} />}

        {(phase.k === 'play' || phase.k === 'claim') && spec && (
          <>
            {/* everything gives way to the board: it is centred in whatever
                room the header and the prompt leave it */}
            <div style={{ flex: 1, minHeight: '2rem' }} />
            {spec.drop && (
              <ColumnArrows
                spec={spec}
                cells={cells}
                colour={colours[phase.k === 'claim' ? phase.winner : turn]}
                active={null}
                onPick={(c) =>
                  phase.k === 'claim' ? claimSquare(c, phase.winner) : playBoard(c, turn)
                }
              />
            )}
            <BoardView
              spec={spec}
              cells={cells}
              colours={colours}
              live={phase.k === 'claim' ? phase.winner : turn}
              onPlay={(w) => (phase.k === 'claim' ? claimSquare(w, phase.winner) : playBoard(w, turn))}
              line={line}
              falling={falling}
            />
            <div style={{ flex: 1, minHeight: '4rem' }} />
            <div
              style={{
                flex: 'none',
                paddingBottom: '7rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.6rem',
                textAlign: 'center',
              }}
            >
              <span style={{ font: '900 4.4rem/1.15 Nunito', color: 'var(--text)' }}>
                {phase.k === 'claim' ? 'Claim a square, ' : spec.drop ? 'Drop a piece, ' : 'Take a square, '}
                <span style={{ color: colours[phase.k === 'claim' ? phase.winner : turn] }}>
                  {names[phase.k === 'claim' ? phase.winner : turn]}
                </span>
              </span>
              <span style={{ font: '700 2.8rem/1 Nunito', color: 'var(--muted)' }}>
                {spec.need} in a row takes the match
              </span>
            </div>
          </>
        )}

        {phase.k === 'pick' && (
          <>
            <div
              style={{
                flex: 'none',
                textAlign: 'center',
                marginBottom: '3.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
              }}
            >
              <span style={{ font: '900 5.4rem/1.1 Nunito', color: 'var(--text)' }}>
                <span style={{ color: colours[bid.chooser] }}>{names[bid.chooser]}</span> names the
                square
              </span>
              <span style={{ font: '700 2.8rem/1.3 Nunito', color: 'var(--muted)' }}>
                Naming is public - there is nothing to hide yet.
              </span>
            </div>
            <BoardView
              spec={BOARDS.ttt}
              cells={cells}
              colours={colours}
              live={bid.chooser}
              onPlay={pickSquare}
            />
            <div style={{ flex: 1, minHeight: '3.4rem' }} />
            <div
              style={{
                flex: 'none',
                paddingBottom: '7rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.8rem',
              }}
            >
              <PoolStrip name={names[0]} value={bid.balance[0]} colour={colours[0]} />
              <PoolStrip name={names[1]} value={bid.balance[1]} colour={colours[1]} />
            </div>
          </>
        )}

        {phase.k === 'seal' && (
          <BidPlace
            square={bid.square}
            cells={cells}
            colours={colours}
            names={names}
            me={phase.player}
            balance={bid.balance}
            value={Math.min(bidValue, bid.balance[phase.player])}
            setValue={setBidValue}
            onSeal={() => seal(Math.min(bidValue, bid.balance[phase.player]), phase.player)}
            secondsLeft={sealLeft}
            totalSeconds={sealSeconds}
          />
        )}

        {phase.k === 'reveal' && (
          <BidReveal
            square={bid.square}
            bids={phase.bids}
            verdict={phase.verdict}
            names={names}
            colours={colours}
            cells={cells}
            balance={[
              bid.balance[0] - (phase.bids[0] === 0 ? -bid.passBank : phase.bids[0]),
              bid.balance[1] - (phase.bids[1] === 0 ? -bid.passBank : phase.bids[1]),
            ]}
            onNext={() => nextSquare(phase.bids, phase.verdict, phase.run)}
          />
        )}

        {phase.k === 'clock' && timing && (
          <ClockScreen
            target={timing.target}
            actorName={names[timingActor(timing)]}
            actorColour={colours[timingActor(timing)]}
            onStop={stopClock}
            botTurn={request.vsBot && timingActor(timing) === 1}
          />
        )}

        {phase.k === 'number' && numbers && (
          <NumberScreen
            round={numbers}
            names={names}
            colours={colours}
            actor={numberActor(numbers)}
            onGuess={guess}
            locked={request.vsBot && numberActor(numbers) === 1}
          />
        )}

        {phase.k === 'round' && <RoundCard title={phase.title} sub={phase.sub} tone={phase.tone} />}
      </div>
    </div>
  );
}

// ============================================================
// chrome
// ============================================================

function PlayerBars({
  names,
  colours,
  turn,
  score,
  showScore,
}: {
  names: [string, string];
  colours: [string, string];
  turn: 0 | 1;
  score: [number, number];
  showScore: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem' }}>
      {[0, 1].map((p) => {
        const on = turn === p;
        return (
          <div
            key={p}
            className="player-card"
            style={{
              background: on ? colours[p] : 'var(--card)',
              boxShadow: on ? `0 1.2rem 0 rgba(0,0,0,.38)` : 'none',
              transform: on ? 'translateY(-0.4rem)' : 'none',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', minWidth: 0 }}>
              <span
                style={{
                  width: '7.4rem',
                  height: '7.4rem',
                  borderRadius: '2.4rem',
                  background: on ? 'rgba(10,12,17,.16)' : 'var(--sunken)',
                  display: 'grid',
                  placeItems: 'center',
                  flex: 'none',
                }}
              >
                <span
                  style={{
                    width: '4.4rem',
                    height: '4.4rem',
                    borderRadius: '50%',
                    background: on ? 'var(--on-fill)' : colours[p],
                  }}
                />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
                <span
                  style={{
                    font: '900 3.8rem/1 Nunito',
                    color: on ? 'var(--on-fill)' : colours[p],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {names[p]}
                </span>
                <span
                  style={{
                    font: '800 2.2rem/1 Nunito',
                    letterSpacing: '.14em',
                    color: on ? 'rgba(10,12,17,.62)' : 'var(--dim)',
                  }}
                >
                  {on ? 'YOUR TURN' : 'WAITING'}
                </span>
              </span>
            </span>

            {showScore && (
              <Meter
                filled={score[p]}
                total={Math.max(3, score[0] + score[1] + 1)}
                colour={on ? 'var(--on-fill)' : colours[p]}
                size="thin"
                track={on ? 'rgba(10,12,17,.22)' : 'var(--sunken)'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PoolStrip({ name, value, colour }: { name: string; value: number; colour: string }) {
  return (
    <div
      className="card"
      style={{
        borderRadius: '3rem',
        padding: '2rem 2.6rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          font: '900 3rem/1 Nunito',
          color: colour,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </span>
      <span style={{ font: '900 5.4rem/1 Nunito', color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

/** The toss: the two names flick past each other, slowing until one lands. */
function Toss({ names, colours }: { names: [string, string]; colours: [string, string] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    let stop = false;
    let delay = 60;
    const step = () => {
      if (stop) return;
      setI((n) => n + 1);
      delay *= 1.16;
      window.setTimeout(step, delay);
    };
    window.setTimeout(step, delay);
    return () => {
      stop = true;
    };
  }, []);

  const at = (i % 2) as 0 | 1;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3rem',
      }}
    >
      <span className="t-label">WHO NAMES THE FIRST SQUARE</span>
      <span
        style={{
          font: '900 11rem/1 Nunito',
          letterSpacing: '-.03em',
          color: colours[at],
          transition: 'color 60ms linear',
        }}
      >
        {names[at]}
      </span>
    </div>
  );
}

/**
 * A result advances on its own with a depleting bar showing when; the button
 * next to it only skips ahead. A tap is asked for where it means something.
 */
function RoundCard({ title, sub, tone }: { title: string; sub: string; tone: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.4rem',
        textAlign: 'center',
        animation: 'db-rise 320ms cubic-bezier(.22,1,.36,1) both',
      }}
    >
      <span style={{ font: '900 8rem/1.05 Nunito', letterSpacing: '-.02em', color: tone }}>
        {title}
      </span>
      {sub && <span style={{ font: '700 3rem/1.35 Nunito', color: 'var(--muted)', maxWidth: '24ch' }}>{sub}</span>}
    </div>
  );
}

/** Kept for the duel claim step, which needs to know if the grid has room. */
export const boardHasRoom = (cells: Mark[]) => !isFull(cells) && openCells(cells).length > 0;
