import { CATALOG } from '../../game/catalog';
import { useSave, useSaveData } from '../../state/store';
import { Btn } from '../primitives';

/**
 * Tournaments, not built yet.
 *
 * A coming-soon tab is still a tab somebody will open, so it says what is
 * coming, what it will cost (nothing), and takes a flag for when it lands -
 * rather than being a locked door with a padlock on it.
 */
export function CupsScreen() {
  const save = useSaveData();
  const setNotify = useSave((s) => s.setCupsNotify);

  return (
    <div className="screen-scroll" style={{ paddingTop: '3.4rem' }}>
      <div
        className="bloom"
        style={{
          width: '110rem',
          height: '110rem',
          top: '6rem',
          left: '50%',
          marginLeft: '-55rem',
          background: 'radial-gradient(circle, rgba(255,201,60,.14), transparent 64%)',
        }}
      />

      <div
        style={{
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          marginTop: '4rem',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            style={{
              width: '28rem',
              height: '18rem',
              background: 'var(--coin)',
              borderRadius: '4rem 4rem 13rem 13rem',
              boxShadow: 'inset 0 -1.8rem 0 rgba(0,0,0,.14)',
            }}
          />
          <span style={{ width: '9rem', height: '5.2rem', background: 'var(--coin-lip)', borderRadius: '0 0 1.8rem 1.8rem' }} />
          <span
            style={{
              width: '22rem',
              height: '4.4rem',
              background: 'var(--coin)',
              borderRadius: '1.8rem',
              boxShadow: 'inset 0 -1rem 0 rgba(0,0,0,.14)',
            }}
          />
        </span>

        <span style={{ font: '900 12rem/1 Nunito', letterSpacing: '-.03em', color: 'var(--text)', marginTop: '4.4rem' }}>
          Cups
        </span>
        <span
          style={{
            font: '900 3.4rem/1 Nunito',
            letterSpacing: '.14em',
            color: 'var(--on-fill)',
            background: 'var(--coin)',
            padding: '1.6rem 3rem',
            borderRadius: 'var(--r-pill)',
            marginTop: '2.2rem',
          }}
        >
          COMING SOON
        </span>
        <span
          style={{
            font: '700 3.2rem/1.45 Nunito',
            color: 'var(--muted)',
            textAlign: 'center',
            marginTop: '3.4rem',
            maxWidth: '24ch',
          }}
        >
          Weekend tournaments across all {CATALOG.length} games. One bracket, one champion, real coin
          prizes.
        </span>
      </div>

      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: '1.6rem', marginTop: '5rem' }}>
        <Bullet colour="var(--p1)" text="Seeded by your Mind Score" />
        <Bullet colour="var(--p2)" text="Best-of-three, every round" />
        <Bullet colour="var(--good)" text="Free to enter, always" />
      </div>

      <div style={{ flex: 1, minHeight: '3rem' }} />

      <div style={{ flex: 'none', paddingBottom: '4rem' }}>
        <Btn tone="coin" onClick={() => setNotify(!save.cupsNotify)}>
          {save.cupsNotify ? "WE'LL TELL YOU" : 'NOTIFY ME'}
        </Btn>
      </div>
    </div>
  );
}

function Bullet({ colour, text }: { colour: string; text: string }) {
  return (
    <div
      style={{
        height: '11.8rem',
        background: 'var(--card)',
        borderRadius: '3.4rem',
        display: 'flex',
        alignItems: 'center',
        padding: '0 3.6rem',
        gap: '2.6rem',
        flex: 'none',
      }}
    >
      <span style={{ width: '6.2rem', height: '6.2rem', borderRadius: '2rem', background: colour, flex: 'none' }} />
      <span style={{ font: '800 3.2rem/1 Nunito', color: 'var(--muted)' }}>{text}</span>
    </div>
  );
}
