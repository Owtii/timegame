import { BALANCE } from '../../config/balance';
import { ACCENT_LIP, ACCENT_VAR, CATALOG } from '../../game/catalog';
import type { GameId } from '../../game/types';
import { useSaveData } from '../../state/store';
import { ListRow, ScreenHead } from '../primitives';

/**
 * The shelf. Bid-Tac-Toe gets the promo block because it has the most
 * strategic depth in it; everything else is a full-width ticket row, so the
 * whole catalogue is legible in one glance without a carousel.
 */
export function PlayScreen({ onPick }: { onPick: (id: GameId) => void }) {
  const save = useSaveData();
  const flagship = CATALOG.find((e) => e.featured)!;
  const rest = CATALOG.filter((e) => !e.featured);
  const tally = save.stats[flagship.id] ?? { played: 0, won: 0 };

  return (
    <div className="screen-scroll" style={{ paddingTop: '3.4rem' }}>
      <ScreenHead
        title="Play"
        right={
          <span style={{ font: '800 2.4rem/1 Nunito', letterSpacing: '.14em', color: 'var(--muted)' }}>
            {CATALOG.length} GAMES
          </span>
        }
      />

      <button
        onClick={() => onPick(flagship.id)}
        style={{
          flex: 'none',
          textAlign: 'left',
          background: ACCENT_VAR[flagship.accent],
          borderRadius: '4rem',
          padding: '3.4rem 3.6rem 3.6rem',
          boxShadow: `0 1.6rem 0 ${ACCENT_LIP[flagship.accent]}`,
          transition: 'transform 120ms cubic-bezier(.34,1.3,.64,1)',
        }}
        onPointerDown={(e) => (e.currentTarget.style.transform = 'translateY(0.8rem)')}
        onPointerUp={(e) => (e.currentTarget.style.transform = '')}
        onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
            <span style={{ font: '900 2rem/1 Nunito', letterSpacing: '.2em', color: 'rgba(10,12,17,.62)' }}>
              FLAGSHIP
            </span>
            <span
              style={{
                font: '900 6.2rem/1 Nunito',
                letterSpacing: '-.02em',
                color: 'var(--on-fill)',
              }}
            >
              {flagship.name}
            </span>
            <span
              style={{
                font: '700 2.7rem/1.35 Nunito',
                color: 'rgba(10,12,17,.72)',
                maxWidth: '22ch',
              }}
            >
              {flagship.tagline}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 4.4rem)',
              gridTemplateRows: 'repeat(3, 4.4rem)',
              gap: '0.7rem',
              flex: 'none',
              marginTop: '0.6rem',
            }}
          >
            {[0.16, 1, 0.16, 0.16, 2, 0.16, 1, 0.16, 0.16].map((v, i) => (
              <span
                key={i}
                style={{
                  borderRadius: '1.2rem',
                  background:
                    v === 1 ? 'var(--on-fill)' : v === 2 ? 'var(--coin)' : 'rgba(10,12,17,.16)',
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.4rem',
            marginTop: '2.8rem',
          }}
        >
          <Punch cap="RECORD" value={`${tally.won} / ${tally.played}`} />
          <Punch cap="PASS BANKS" value={`+${BALANCE.bidding.passBank}`} />
          <Punch cap="POOL" value={`${BALANCE.bidding.pool} pts`} />
        </div>

        <div
          style={{
            marginTop: '2.6rem',
            height: '12.4rem',
            borderRadius: 'var(--r-pill)',
            background: 'var(--on-fill)',
            boxShadow: '0 1rem 0 rgba(0,0,0,.35), inset 0 0.5rem 0 rgba(255,255,255,.13)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <span
            style={{
              font: '900 4.2rem/1 Nunito',
              letterSpacing: '.06em',
              color: ACCENT_VAR[flagship.accent],
            }}
          >
            NEW MATCH
          </span>
        </div>
      </button>

      <span className="t-label" style={{ margin: '3.4rem 0 1.8rem', flex: 'none' }}>
        EVERYTHING ELSE
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 'none', paddingBottom: '4rem' }}>
        {rest.map((e) => {
          const t = save.stats[e.id] ?? { played: 0, won: 0 };
          return (
            <ListRow
              key={e.id}
              title={e.name}
              sub={e.tagline}
              accent={ACCENT_VAR[e.accent]}
              onClick={() => onPick(e.id)}
              trailing={
                <span style={{ font: '900 3rem/1 Nunito', color: 'var(--muted)', flex: 'none' }}>
                  {t.played > 0 ? (
                    <>
                      {t.won}
                      <span style={{ color: 'var(--faint)' }}> / {t.played}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--faint)' }}>New</span>
                  )}
                </span>
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function Punch({ cap, value }: { cap: string; value: string }) {
  return (
    <div
      style={{
        background: 'rgba(10,12,17,.14)',
        borderRadius: '2.4rem',
        padding: '1.8rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        minWidth: 0,
      }}
    >
      <span style={{ font: '800 1.9rem/1 Nunito', letterSpacing: '.16em', color: 'rgba(10,12,17,.6)' }}>
        {cap}
      </span>
      <span style={{ font: '900 3.4rem/1 Nunito', color: 'var(--on-fill)' }}>{value}</span>
    </div>
  );
}
