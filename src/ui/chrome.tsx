import { BALANCE } from '../config/balance';
import { useSaveData } from '../state/store';
import { Meter } from './primitives';

export type Tab = 'base' | 'play' | 'friends' | 'cups' | 'shop';

/**
 * Coins, energy, Mind Score. Present on every hub screen and gone entirely
 * inside a match, where nothing but the board should be competing for the eye.
 */
export function Hud({ onMind }: { onMind: () => void }) {
  const save = useSaveData();
  const boosted = save.energy > 0;
  const blocks = 8;
  const filled = Math.round((save.energy / BALANCE.base.energyMax) * blocks);

  return (
    <div className="hud" style={{ paddingTop: '10.4rem' }}>
      <div className="hud-tile">
        <span className="hud-cap">COINS</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <span className="coin-dot" />
          <span className="hud-val" style={{ color: 'var(--coin)' }}>
            {save.coins.toLocaleString('en-GB')}
          </span>
        </span>
      </div>

      <div className="hud-tile" style={{ gap: '0.9rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="hud-cap">ENERGY</span>
          <span
            className="pill"
            style={{ background: boosted ? 'var(--good)' : 'var(--rail)', color: boosted ? 'var(--on-fill)' : 'var(--muted)' }}
          >
            {boosted ? 'BOOSTED x2' : 'SLEEP x0.25'}
          </span>
        </span>
        <span className="hud-val" style={{ color: 'var(--good)' }}>
          {Math.floor(save.energy)}
        </span>
        <Meter filled={filled} total={blocks} colour="var(--good)" size="sm" track="var(--rail)" />
      </div>

      <button className="hud-tile" onClick={onMind}>
        <span className="hud-cap">MIND SCORE</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <span className="hud-val" style={{ color: 'var(--mind)' }}>
            {save.mind.score.toLocaleString('en-GB')}
          </span>
          {save.mind.week !== 0 && (
            <span
              style={{
                font: '900 2.2rem/1 Nunito',
                color: save.mind.week > 0 ? 'var(--good)' : 'var(--dim)',
              }}
            >
              {save.mind.week > 0 ? '+' : ''}
              {save.mind.week}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'base', label: 'BASE' },
  { id: 'play', label: 'PLAY' },
  { id: 'friends', label: 'FRIENDS' },
  { id: 'cups', label: 'CUPS' },
  { id: 'shop', label: 'SHOP' },
];

export function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="rail">
      {TABS.map((t) => {
        const on = t.id === tab;
        return (
          <button key={t.id} data-on={on} onClick={() => onTab(t.id)}>
            <TabIcon id={t.id} on={on} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Flat glyphs built from boxes - no icon font, nothing to load. */
function TabIcon({ id, on }: { id: Tab; on: boolean }) {
  const c = on ? 'var(--on-fill)' : 'var(--muted)';

  if (id === 'base')
    return (
      <span
        style={{
          width: '4.2rem',
          height: '4.2rem',
          background: c,
          borderRadius: '1.2rem',
          transform: 'rotate(45deg) scaleY(.62)',
        }}
      />
    );

  if (id === 'play')
    return (
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: `2.6rem solid ${c}`,
          borderTop: '1.8rem solid transparent',
          borderBottom: '1.8rem solid transparent',
        }}
      />
    );

  if (id === 'friends')
    return (
      <span style={{ display: 'flex' }}>
        <span style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: c }} />
        <span
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            background: c,
            marginLeft: '-1.2rem',
            opacity: 0.55,
          }}
        />
      </span>
    );

  if (id === 'cups')
    return (
      <span
        style={{
          width: '3.4rem',
          height: '3.4rem',
          background: c,
          borderRadius: '1rem 1rem 1.8rem 1.8rem',
        }}
      />
    );

  return (
    <span
      style={{
        width: '3.6rem',
        height: '3rem',
        background: c,
        borderRadius: '0.8rem 0.8rem 1.2rem 1.2rem',
      }}
    />
  );
}
