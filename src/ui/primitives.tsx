import type { CSSProperties, ReactNode } from 'react';

/** A block of countable segments. Never a smooth bar - you can count these. */
export function Meter({
  filled,
  total,
  colour,
  size = 'md',
  track = 'var(--sunken)',
}: {
  filled: number;
  total: number;
  colour: string;
  size?: 'sm' | 'md' | 'lg' | 'thin';
  track?: string;
}) {
  const cls = size === 'lg' ? 'meter' : `meter ${size}`;
  return (
    <div className={cls}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ background: i < filled ? colour : track }} />
      ))}
    </div>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span className="t-label" style={style}>
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  tone = 'action',
  disabled,
  style,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'action' | 'p1' | 'p2' | 'coin' | 'mind' | 'ghost' | 'sunk';
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <button
      className={`btn ${tone} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  style,
  onClick,
}: {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className="card" style={{ textAlign: 'left', width: '100%', ...style }} onClick={onClick}>
      {children}
    </Tag>
  );
}

/** A row on a shelf: a colour flag, a name, a line of copy, a trailing figure. */
export function ListRow({
  title,
  sub,
  accent,
  trailing,
  onClick,
}: {
  title: string;
  sub: string;
  accent: string;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="list-row" onClick={onClick}>
      <span className="flag" style={{ background: accent }} />
      <span
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.8rem 0 2.4rem',
          minWidth: 0,
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
          <span style={{ font: '900 3.4rem/1 Nunito', color: 'var(--text)' }}>{title}</span>
          <span
            style={{
              font: '600 2.3rem/1 Nunito',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </span>
        </span>
        {trailing}
      </span>
    </button>
  );
}

export function Gap({ h }: { h: number }) {
  return <div style={{ height: `${h / 10}rem`, flex: 'none' }} />;
}

export function Bloom({
  colour,
  size,
  top,
  left = '50%',
}: {
  colour: string;
  size: number;
  top: number;
  left?: string;
}) {
  return (
    <div
      className="bloom"
      style={{
        width: `${size / 10}rem`,
        height: `${size / 10}rem`,
        top: `${top / 10}rem`,
        left,
        marginLeft: `-${size / 20}rem`,
        background: `radial-gradient(circle, ${colour}, transparent 66%)`,
      }}
    />
  );
}

/** The screen title row: a big name on the left, a quiet count on the right. */
export function ScreenHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 'none',
        marginBottom: '2.6rem',
      }}
    >
      <span className="t-title">{title}</span>
      {right}
    </div>
  );
}
