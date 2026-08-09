/**
 * The hand-over screen, kept deliberately blank.
 *
 * It exists so a blind stop or a sealed bid stays secret while the phone
 * changes hands, so there is nothing on it worth reading - a name, and a
 * prompt that waits for a deliberate tap rather than timing out.
 */
export function HandOver({
  name,
  colour,
  reason,
  onReady,
}: {
  name: string;
  colour: string;
  /** Why the phone is moving: a fresh round, a replay, or simply their turn. */
  reason: string;
  onReady: () => void;
}) {
  return (
    <button
      onClick={onReady}
      style={{
        position: 'absolute',
        inset: 0,
        background: colour,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        animation: 'db-rise 260ms cubic-bezier(.22,1,.36,1) both',
      }}
    >
      <span
        style={{
          width: '40rem',
          height: '40rem',
          borderRadius: '12rem',
          background: 'rgba(10,12,17,.14)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: '6.4rem',
        }}
      >
        <span
          style={{
            width: '24rem',
            height: '24rem',
            borderRadius: '50%',
            border: '4.4rem solid var(--on-fill)',
          }}
        />
      </span>

      <span style={{ font: '900 13.2rem/1 Nunito', letterSpacing: '-.03em', color: 'var(--on-fill)' }}>
        {name}
      </span>
      <span
        style={{
          font: '900 4.4rem/1.25 Nunito',
          color: 'rgba(10,12,17,.62)',
          marginTop: '1.8rem',
          padding: '0 6rem',
          textAlign: 'center',
        }}
      >
        {reason}
      </span>
      <span
        className="pulse"
        style={{
          marginTop: '12rem',
          font: '900 3.4rem/1 Nunito',
          letterSpacing: '.22em',
          color: 'rgba(10,12,17,.6)',
        }}
      >
        TAP ANYWHERE WHEN READY
      </span>
    </button>
  );
}
