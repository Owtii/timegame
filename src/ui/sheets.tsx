import type { ReactNode } from 'react';

import { BALANCE } from '../config/balance';
import type { BoardId } from '../game/types';
import {
  bottleneck,
  coinsPerMinute,
  formatDuration,
  formatRate,
  isMaxed,
  projected,
  STRUCTURE_BLURB,
  STRUCTURE_NAMES,
  upgradeCost,
  type StructureId,
} from '../state/economy';
import { FACET_ACCENT, FACET_GAMES, FACET_MAX, type Facet } from '../state/mind';
import { useSave, useSaveData } from '../state/store';
import { Btn, Meter } from './primitives';

function Scrim({ onClose }: { onClose: () => void }) {
  return <button className="scrim" onClick={onClose} aria-label="Close" />;
}

// ============================================================
// Opponent picker
// ============================================================

/**
 * Starting a match is a wizard, one question per screen: pick a game, then
 * pick an opponent. Two taps and you are playing; the duels ask a third,
 * which board they are fought over.
 */
export function OpponentSheet({
  gameName,
  onPick,
  onClose,
}: {
  gameName: string;
  onPick: (vsBot: boolean) => void;
  onClose: () => void;
}) {
  return (
    <>
      <Scrim onClose={onClose} />
      <div className="sheet" style={{ animation: 'db-rise 320ms cubic-bezier(.22,1,.36,1) both' }}>
        <span className="grabber" />
        <span
          style={{
            font: '900 6.6rem/1.08 Nunito',
            letterSpacing: '-.02em',
            color: 'var(--text)',
            marginTop: '3.6rem',
            flex: 'none',
          }}
        >
          Who are you
          <br />
          playing?
        </span>
        <span className="t-label" style={{ marginTop: '1.4rem', flex: 'none' }}>
          {gameName}
        </span>

        <Option
          colour="var(--p2)"
          lip="var(--p2-lip)"
          title="vs Bot"
          sub={`Pays ${Math.round(BALANCE.rewards.botCoinMultiplier * 100)}% coins. Doesn't move your Mind Score.`}
          onClick={() => onPick(true)}
        />
        <Option
          colour="var(--p1)"
          lip="var(--p1-lip)"
          title="Pass and play"
          sub="Two players, one phone. Full coins, full Mind Score."
          onClick={() => onPick(false)}
        />

        <span
          style={{
            marginTop: 'auto',
            paddingTop: '3rem',
            font: '700 2.5rem/1.4 Nunito',
            color: 'var(--muted)',
            textAlign: 'center',
            flex: 'none',
          }}
        >
          Every match pays coins and{' '}
          <span style={{ color: 'var(--good)' }}>+{BALANCE.base.energyPerMatch} energy</span>, win or
          lose.
        </span>
      </div>
    </>
  );
}

export function BoardSheet({
  onPick,
  onClose,
}: {
  onPick: (b: BoardId) => void;
  onClose: () => void;
}) {
  return (
    <>
      <Scrim onClose={onClose} />
      <div className="sheet" style={{ animation: 'db-rise 320ms cubic-bezier(.22,1,.36,1) both' }}>
        <span className="grabber" />
        <span
          style={{
            font: '900 6.6rem/1.08 Nunito',
            letterSpacing: '-.02em',
            color: 'var(--text)',
            marginTop: '3.6rem',
            flex: 'none',
          }}
        >
          Which board
          <br />
          are you fighting for?
        </span>

        <Option
          colour="var(--p1)"
          lip="var(--p1-lip)"
          title="Tic-Tac-Toe"
          sub="3x3. Three in a row. Short matches."
          onClick={() => onPick('ttt')}
        />
        <Option
          colour="var(--action)"
          lip="var(--action-lip)"
          title="Connect 4"
          sub="7x6. Four in a row. Longer matches."
          onClick={() => onPick('c4')}
        />
        <div style={{ flex: 1, minHeight: '2rem' }} />
      </div>
    </>
  );
}

function Option({
  colour,
  lip,
  title,
  sub,
  onClick,
}: {
  colour: string;
  lip: string;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: '2.6rem',
        background: colour,
        borderRadius: '4rem',
        boxShadow: `0 1.4rem 0 ${lip}`,
        padding: '3.4rem 3.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        textAlign: 'left',
        flex: 'none',
        transition: 'transform 120ms cubic-bezier(.34,1.3,.64,1)',
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = 'translateY(0.8rem)')}
      onPointerUp={(e) => (e.currentTarget.style.transform = '')}
      onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      <span style={{ font: '900 5.6rem/1 Nunito', color: 'var(--on-fill)' }}>{title}</span>
      <span style={{ font: '700 2.7rem/1.3 Nunito', color: 'rgba(10,12,17,.7)' }}>{sub}</span>
    </button>
  );
}

// ============================================================
// Upgrade
// ============================================================

/**
 * Tapping a structure on the deck opens this.
 *
 * It states what the level buys before it asks for coins - a level that only
 * changes a silhouette is a payment for nothing, so the before-and-after
 * figure is the middle of the sheet.
 */
export function UpgradePopup({ id, onClose }: { id: StructureId; onClose: () => void }) {
  const save = useSaveData();
  const upgrade = useSave((s) => s.upgrade);

  const level = save.structures[id];
  const maxed = isMaxed(level);
  const cost = upgradeCost(id, level);
  const now = coinsPerMinute(save.structures, save.energy);
  const after = projected(save.structures, id, save.energy);
  const affordable = save.coins >= cost;

  // buying a level that changes nothing is a payment for nothing, so when
  // another structure is holding the line up the sheet says which one
  const limiter = bottleneck(save.structures);
  const stalled = !maxed && formatRate(after) === formatRate(now);

  return (
    <>
      <Scrim onClose={onClose} />
      <div className="popup" style={{ animation: 'db-rise 300ms cubic-bezier(.22,1.3,.36,1) both' }}>
        <StructureArt id={id} />

        <span
          style={{
            font: '900 6.6rem/1 Nunito',
            letterSpacing: '-.02em',
            color: 'var(--text)',
            marginTop: '3rem',
          }}
        >
          {STRUCTURE_NAMES[id]}
        </span>
        <span
          style={{
            font: '800 2.8rem/1 Nunito',
            letterSpacing: '.18em',
            color: 'var(--muted)',
            marginTop: '1.2rem',
          }}
        >
          LEVEL {level} OF {BALANCE.upgrades.maxLevel}
        </span>

        <div style={{ width: '100%', marginTop: '3rem' }}>
          <Meter
            filled={level}
            total={BALANCE.upgrades.maxLevel}
            colour="var(--p1)"
            size="lg"
          />
        </div>

        <span
          style={{
            font: '700 2.6rem/1.35 Nunito',
            color: stalled ? 'var(--action)' : 'var(--dim)',
            marginTop: '2rem',
            textAlign: 'center',
          }}
        >
          {stalled
            ? `The line is waiting on the ${STRUCTURE_NAMES[limiter].toLowerCase()}. Level that up and this pays.`
            : STRUCTURE_BLURB[id]}
        </span>

        <div
          style={{
            width: '100%',
            marginTop: '3rem',
            background: 'var(--sunken)',
            borderRadius: '3.6rem',
            padding: '3rem 3.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <span style={{ font: '800 2.2rem/1 Nunito', letterSpacing: '.16em', color: 'var(--muted)' }}>
              NOW
            </span>
            <span style={{ font: '900 5.6rem/1 Nunito', color: 'var(--muted)' }}>
              {formatRate(now)}
              <span style={{ fontSize: '2.6rem', letterSpacing: '.1em' }}> /MIN</span>
            </span>
          </span>

          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: '3.8rem solid var(--action)',
              borderTop: '2.6rem solid transparent',
              borderBottom: '2.6rem solid transparent',
            }}
          />

          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-end' }}>
            <span style={{ font: '800 2.2rem/1 Nunito', letterSpacing: '.16em', color: 'var(--action)' }}>
              AFTER
            </span>
            <span style={{ font: '900 5.6rem/1 Nunito', color: 'var(--action)' }}>
              {formatRate(maxed ? now : after)}
              <span style={{ fontSize: '2.6rem', letterSpacing: '.1em' }}> /MIN</span>
            </span>
          </span>
        </div>

        <div style={{ width: '100%', marginTop: '3.4rem' }}>
          <Btn
            disabled={maxed || !affordable}
            onClick={() => {
              if (upgrade(id)) onClose();
            }}
            style={{ height: '15rem', fontSize: '5.2rem', letterSpacing: '.04em' }}
          >
            {maxed ? 'FULLY BUILT' : `UPGRADE · ${cost.toLocaleString('en-GB')}`}
          </Btn>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '2.8rem',
            font: '900 3.4rem/1 Nunito',
            letterSpacing: '.14em',
            color: 'var(--dim)',
          }}
        >
          CLOSE
        </button>
      </div>
    </>
  );
}

/** A flat portrait of the structure, so the sheet is not a wall of numbers. */
function StructureArt({ id }: { id: StructureId }) {
  const shell = (children: ReactNode) => (
    <div
      style={{
        width: '26rem',
        height: '26rem',
        borderRadius: '6.4rem',
        background: 'var(--sunken)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: '3.4rem',
        boxShadow: 'inset 0 -1rem 0 rgba(0,0,0,.2)',
        flex: 'none',
      }}
    >
      {children}
    </div>
  );

  if (id === 'pump')
    return shell(
      <>
        <span
          style={{
            width: '4.4rem',
            height: '12rem',
            borderRadius: '2rem',
            background: 'var(--action)',
            transform: 'rotate(-22deg)',
            marginBottom: '-2.2rem',
            boxShadow: 'inset -0.8rem 0 0 rgba(0,0,0,.16)',
          }}
        />
        <span
          style={{
            width: '13.2rem',
            height: '11rem',
            borderRadius: '3rem',
            background: 'var(--p1)',
            boxShadow: 'inset 0 -1.4rem 0 rgba(0,0,0,.2)',
          }}
        />
      </>,
    );

  if (id === 'machine')
    return shell(
      <>
        <span
          style={{
            width: '15rem',
            height: '11.8rem',
            borderRadius: '3rem',
            background: 'var(--p2)',
            boxShadow: 'inset 0 -1.6rem 0 rgba(0,0,0,.2)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <span
            style={{
              width: '5.6rem',
              height: '5.6rem',
              borderRadius: '50%',
              background: 'var(--coin)',
              boxShadow: 'inset 0 -0.8rem 0 rgba(0,0,0,.16)',
            }}
          />
        </span>
        <span style={{ width: '17rem', height: '2.4rem', borderRadius: '1.1rem', background: 'var(--p2-lip)' }} />
      </>,
    );

  return shell(
    <>
      <span
        style={{
          width: '5.2rem',
          height: '5.2rem',
          borderRadius: '50%',
          background: 'var(--text)',
          boxShadow: 'inset 0 -0.8rem 0 rgba(0,0,0,.14)',
          marginBottom: '0.8rem',
        }}
      />
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: '0.8rem' }}>
        <span
          style={{
            width: '6.6rem',
            height: '8.4rem',
            borderRadius: '2.6rem',
            background: 'var(--action)',
            boxShadow: 'inset 0 -1.2rem 0 rgba(0,0,0,.18)',
          }}
        />
        <span
          style={{
            width: '4rem',
            height: '4.4rem',
            borderRadius: '1.2rem',
            background: 'var(--p1)',
            boxShadow: 'inset 0 -0.8rem 0 rgba(0,0,0,.2)',
          }}
        />
      </span>
    </>,
  );
}

// ============================================================
// Mind Score
// ============================================================

const FACETS: Facet[] = ['pattern', 'timing', 'deduction', 'strategy'];

/**
 * Growth, never rank.
 *
 * It is an Elo underneath, but nothing on this screen says so and nothing
 * calls it an IQ - it measures how you have played here, and that is the
 * whole claim it is allowed to make.
 */
export function MindSheet({ onClose }: { onClose: () => void }) {
  const save = useSaveData();

  return (
    <>
      <Scrim onClose={onClose} />
      <div
        className="sheet"
        style={{ height: '176rem', animation: 'db-rise 320ms cubic-bezier(.22,1,.36,1) both' }}
      >
        <span className="grabber" />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', marginTop: '3.4rem', flex: 'none' }}>
          <span style={{ font: '800 2.6rem/1 Nunito', letterSpacing: '.24em', color: 'var(--muted)' }}>
            MIND SCORE
          </span>
          <span
            style={{
              font: '900 20rem/.92 Nunito',
              letterSpacing: '-.045em',
              color: 'var(--mind)',
            }}
          >
            {save.mind.score}
          </span>
          <span
            style={{
              font: '900 3rem/1 Nunito',
              letterSpacing: '.06em',
              color: 'var(--on-fill)',
              background: save.mind.week >= 0 ? 'var(--good)' : 'var(--rail)',
              padding: '1.2rem 2.4rem',
              borderRadius: 'var(--r-pill)',
            }}
          >
            {save.mind.week >= 0 ? '+' : ''}
            {save.mind.week} THIS WEEK
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.2rem', marginTop: '4.4rem', flex: 'none' }}>
          {FACETS.map((f) => {
            const value = save.mind.facets[f];
            const filled = Math.max(0, Math.min(10, Math.round((value / FACET_MAX) * 10)));
            return (
              <div key={f} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ font: '900 3.8rem/1 Nunito', color: 'var(--text)', textTransform: 'capitalize' }}>
                    {f}
                  </span>
                  <span style={{ font: '900 3.8rem/1 Nunito', color: FACET_ACCENT[f] }}>{value}</span>
                </div>
                <Meter filled={filled} total={10} colour={FACET_ACCENT[f]} size="md" />
                <span style={{ font: '700 2.4rem/1 Nunito', color: 'var(--dim)' }}>{FACET_GAMES[f]}</span>
              </div>
            );
          })}
        </div>

        <span
          style={{
            marginTop: 'auto',
            paddingTop: '3rem',
            font: '700 2.6rem/1.4 Nunito',
            color: 'var(--muted)',
            textAlign: 'center',
            flex: 'none',
          }}
        >
          It only measures how you have played here, and it only goes up with practice. It is not a
          test of anything else.
        </span>
      </div>
    </>
  );
}

// ============================================================
// Welcome back
// ============================================================

/**
 * Offline earnings cap at four hours, and the popup says so.
 *
 * A player who leaves for a week and comes back to a jackpot stops caring
 * about the loop; one who is told where the ceiling is comes back sooner.
 */
export function WelcomeBack() {
  const offline = useSave((s) => s.offline);
  const claim = useSave((s) => s.claimOffline);
  if (!offline) return null;

  const capSeconds = BALANCE.base.offlineCapHours * 3600;
  const blocks = 10;
  const filled = Math.max(1, Math.round((offline.seconds / capSeconds) * blocks));

  return (
    <>
      <div className="scrim" style={{ background: 'rgba(5,4,16,.78)' }} />
      <div className="popup" style={{ animation: 'db-rise 340ms cubic-bezier(.22,1.3,.36,1) both' }}>
        <span style={{ font: '800 3rem/1 Nunito', letterSpacing: '.26em', color: 'var(--muted)' }}>
          WHILE YOU WERE AWAY
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2.4rem', marginTop: '3.4rem' }}>
          <span
            style={{
              width: '11rem',
              height: '11rem',
              borderRadius: '50%',
              background: 'var(--coin)',
              boxShadow: 'inset 0 -1.4rem 0 rgba(0,0,0,.18)',
            }}
          />
          <span
            style={{
              font: '900 17.6rem/.9 Nunito',
              letterSpacing: '-.04em',
              color: 'var(--coin)',
            }}
          >
            {offline.coins.toLocaleString('en-GB')}
          </span>
        </div>

        <span
          style={{
            font: '900 4.4rem/1.3 Nunito',
            color: 'var(--text)',
            marginTop: '2.6rem',
            textAlign: 'center',
          }}
        >
          The base ran for
          <br />
          {formatDuration(offline.seconds)} at x{BALANCE.base.sleepSpeedMultiplier}
        </span>

        <div style={{ width: '100%', marginTop: '3.4rem' }}>
          <Meter filled={filled} total={blocks} colour="var(--good)" size="md" />
        </div>

        <span
          style={{
            font: '800 2.5rem/1 Nunito',
            letterSpacing: '.1em',
            color: 'var(--dim)',
            marginTop: '1.6rem',
          }}
        >
          {offline.capped
            ? `CAPPED AT ${BALANCE.base.offlineCapHours} HOURS`
            : `OFFLINE EARNINGS CAP AT ${BALANCE.base.offlineCapHours} HOURS`}
        </span>

        <div style={{ width: '100%', marginTop: '4.4rem' }}>
          <Btn tone="coin" onClick={claim} style={{ height: '15.8rem', fontSize: '6rem' }}>
            COLLECT
          </Btn>
        </div>
      </div>
    </>
  );
}
