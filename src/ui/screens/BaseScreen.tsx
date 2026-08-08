import { lazy, Suspense } from 'react';

import { BALANCE } from '../../config/balance';
import {
  carryCapacity,
  coinsPerMinute,
  formatRate,
  type StructureId,
} from '../../state/economy';
import { useSaveData } from '../../state/store';
import { Btn } from '../primitives';

/**
 * Three.js is most of the bundle and only the Base tab needs it, so it is
 * split out and fetched when this screen first mounts rather than sitting in
 * front of the first paint.
 */
const BaseScene = lazy(() =>
  import('../../three/BaseScene').then((m) => ({ default: m.BaseScene })),
);

/**
 * The home tab: the base itself, running.
 *
 * The 3D deck sits behind the readouts rather than in a panel of its own -
 * the idle layer is the point of the screen, so it gets the room, and the
 * numbers over it say what it is doing rather than restating it.
 */
export function BaseScreen({
  selected,
  onSelect,
  onPlay,
}: {
  selected: StructureId | null;
  onSelect: (id: StructureId) => void;
  onPlay: () => void;
}) {
  const save = useSaveData();
  const rate = coinsPerMinute(save.structures, save.energy);
  const boosted = save.energy > 0;
  const cans = carryCapacity(save.structures.worker);

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div
        className="bloom"
        style={{
          width: '140rem',
          height: '140rem',
          top: '10rem',
          left: '50%',
          marginLeft: '-70rem',
          background:
            'radial-gradient(circle, rgba(76,201,240,.20), rgba(164,107,255,.10) 45%, transparent 68%)',
        }}
      />

      <Suspense fallback={null}>
        <BaseScene selected={selected} onSelect={onSelect} />
      </Suspense>

      <div style={{ flex: 1 }} />

      <div
        style={{
          position: 'relative',
          margin: '0 4rem 2.4rem',
          background: 'var(--card)',
          borderRadius: '3.2rem',
          padding: '2.8rem 3.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 'none',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <span style={{ font: '800 2rem/1 Nunito', letterSpacing: '.18em', color: 'var(--muted)' }}>
            PRODUCTION
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
            <span style={{ font: '900 6.2rem/1 Nunito', color: 'var(--coin)' }}>
              {formatRate(rate)}
            </span>
            <span style={{ font: '900 2.4rem/1 Nunito', letterSpacing: '.12em', color: 'var(--muted)' }}>
              / MIN
            </span>
          </span>
        </span>

        <span style={{ width: '0.3rem', height: '8.8rem', borderRadius: '0.3rem', background: 'var(--rail)' }} />

        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <span style={{ font: '800 2rem/1 Nunito', letterSpacing: '.18em', color: 'var(--muted)' }}>
            SPEED
          </span>
          <span style={{ font: '900 3.4rem/1 Nunito', color: boosted ? 'var(--good)' : 'var(--action)' }}>
            {boosted ? 'BOOSTED' : 'SLEEPING'}
          </span>
        </span>

        <span style={{ width: '0.3rem', height: '8.8rem', borderRadius: '0.3rem', background: 'var(--rail)' }} />

        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <span style={{ font: '800 2rem/1 Nunito', letterSpacing: '.18em', color: 'var(--muted)' }}>
            CANS
          </span>
          <span style={{ display: 'flex', gap: '0.7rem' }}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  width: '2.6rem',
                  height: '2.6rem',
                  borderRadius: '0.9rem',
                  background: i < cans ? 'var(--p1)' : 'var(--rail)',
                }}
              />
            ))}
          </span>
        </span>
      </div>

      {!boosted && (
        <span
          style={{
            position: 'relative',
            display: 'block',
            margin: '0 4rem 2rem',
            flex: 'none',
            font: '800 2.4rem/1 Nunito',
            letterSpacing: '.1em',
            color: 'var(--dim)',
            textAlign: 'center',
          }}
        >
          PLAY A MATCH FOR +{BALANCE.base.energyPerMatch} ENERGY · THE BASE NEVER STOPS
        </span>
      )}

      <div style={{ position: 'relative', padding: '0 4rem 2.4rem', flex: 'none' }}>
        <Btn onClick={onPlay}>PLAY A MATCH</Btn>
      </div>
    </div>
  );
}
