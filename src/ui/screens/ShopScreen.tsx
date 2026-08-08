import { BALANCE } from '../../config/balance';
import { BOARD_STYLES, MARK_COLOURS } from '../../state/cosmetics';
import { useSave, useSaveData } from '../../state/store';
import { ScreenHead } from '../primitives';

/**
 * Cosmetics only.
 *
 * Nothing here changes how a match plays, and energy is never for sale at
 * any price - it is a boost you earn by playing, and putting it behind a
 * till would turn the whole idle layer into a paywall.
 */
export function ShopScreen() {
  const save = useSaveData();
  const { wearColour, buyColour, wearStyle, buyStyle } = useSave();

  const open = () => {
    const locked = MARK_COLOURS.filter((c) => !save.ownedColours.includes(c.id));
    if (!locked.length || save.coins < BALANCE.shop.caseCost) return;
    const won = locked[Math.floor(Math.random() * locked.length)];
    buyColour(won.id, BALANCE.shop.caseCost);
  };

  const caseAffordable =
    save.coins >= BALANCE.shop.caseCost &&
    MARK_COLOURS.some((c) => !save.ownedColours.includes(c.id));

  return (
    <div className="screen-scroll" style={{ paddingTop: '3.4rem' }}>
      <ScreenHead title="Shop" />
      <span className="t-body" style={{ flex: 'none', marginBottom: '3.4rem' }}>
        Looks only. Nothing here changes how a match plays - and energy is never for sale.
      </span>

      <span className="t-label" style={{ flex: 'none', marginBottom: '1.8rem' }}>
        YOUR MARK
      </span>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.8rem',
          flex: 'none',
          marginBottom: '3.4rem',
        }}
      >
        {MARK_COLOURS.map((c) => {
          const owned = save.ownedColours.includes(c.id);
          const worn = save.wornColour === c.id;
          return (
            <button
              key={c.id}
              onClick={() => (owned ? wearColour(c.id) : buyColour(c.id, c.price))}
              disabled={!owned && save.coins < c.price}
              style={{
                background: worn ? c.hex : 'var(--card)',
                borderRadius: '4rem',
                padding: '2.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                boxShadow: worn ? `0 1.2rem 0 rgba(0,0,0,.4)` : 'none',
                transition: 'transform 120ms cubic-bezier(.34,1.3,.64,1)',
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(.96)')}
              onPointerUp={(e) => (e.currentTarget.style.transform = '')}
              onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              <span
                style={{
                  width: '11.8rem',
                  height: '11.8rem',
                  borderRadius: '50%',
                  background: worn ? 'var(--on-fill)' : c.hex,
                  alignSelf: 'center',
                  opacity: owned ? 1 : 0.4,
                  boxShadow: 'inset 0 -1.4rem 0 rgba(0,0,0,.18)',
                }}
              />
              {owned ? (
                <span
                  style={{
                    font: '900 3rem/1 Nunito',
                    letterSpacing: '.06em',
                    color: worn ? 'var(--on-fill)' : 'var(--muted)',
                    textAlign: 'center',
                  }}
                >
                  {worn ? 'WORN' : 'TAP TO WEAR'}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
                  <span className="coin-dot" style={{ width: '3rem', height: '3rem' }} />
                  <span style={{ font: '900 3.4rem/1 Nunito', color: 'var(--coin)' }}>{c.price}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <span className="t-label" style={{ flex: 'none', marginBottom: '1.8rem' }}>
        BOARD STYLE
      </span>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.6rem',
          flex: 'none',
          marginBottom: '3.4rem',
        }}
      >
        {BOARD_STYLES.map((s) => {
          const owned = save.ownedStyles.includes(s.id);
          const worn = save.boardStyle === s.id;
          return (
            <button
              key={s.id}
              onClick={() => (owned ? wearStyle(s.id) : buyStyle(s.id, s.price))}
              disabled={!owned && save.coins < s.price}
              className="card"
              style={{
                borderRadius: '3.2rem',
                padding: '2.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.4rem',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  width: '100%',
                  height: '9.6rem',
                  borderRadius: '2rem',
                  background: s.frame,
                  boxShadow: worn ? `inset 0 0 0 0.6rem var(--good)` : 'none',
                }}
              />
              {owned ? (
                <span style={{ font: '900 2.6rem/1 Nunito', color: worn ? 'var(--good)' : 'var(--muted)' }}>
                  {worn ? 'WORN' : 'WEAR'}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="coin-dot" style={{ width: '2.4rem', height: '2.4rem' }} />
                  <span style={{ font: '900 2.6rem/1 Nunito', color: 'var(--coin)' }}>{s.price}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          flex: 'none',
          minHeight: '19rem',
          borderRadius: '4.4rem',
          background: 'var(--sunken)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2.6rem 4rem',
          gap: '2rem',
          marginBottom: '4rem',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
          <span style={{ font: '800 2.2rem/1 Nunito', letterSpacing: '.18em', color: 'var(--mind)' }}>
            CASE
          </span>
          <span style={{ font: '900 4.4rem/1 Nunito', color: 'var(--text)' }}>
            {MARK_COLOURS.filter((c) => !save.ownedColours.includes(c.id)).length} left to find
          </span>
          <span style={{ font: '700 2.4rem/1 Nunito', color: 'var(--muted)' }}>
            One you do not own yet, every time.
          </span>
        </span>
        <button
          onClick={open}
          disabled={!caseAffordable}
          style={{
            height: '11rem',
            padding: '0 4rem',
            borderRadius: 'var(--r-pill)',
            background: caseAffordable ? 'var(--mind)' : 'var(--card)',
            color: caseAffordable ? 'var(--on-fill)' : 'var(--faint)',
            font: '900 3.4rem/1 Nunito',
            boxShadow: caseAffordable ? '0 1rem 0 var(--mind-lip)' : 'none',
            flex: 'none',
          }}
        >
          OPEN · {BALANCE.shop.caseCost}
        </button>
      </div>
    </div>
  );
}
