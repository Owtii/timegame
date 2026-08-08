import { useEffect, useRef, useState } from 'react';

import type { BoardSpec } from '../../game/board';
import { dropRow } from '../../game/board';
import type { Mark } from '../../game/types';
import { styleById } from '../../state/cosmetics';
import { useSaveData } from '../../state/store';

export interface DropAnimation {
  col: number;
  row: number;
  mark: 0 | 1;
  /** Bumped per move so the same column twice still restarts the fall. */
  key: number;
}

interface Props {
  spec: BoardSpec;
  cells: Mark[];
  colours: [string, string];
  /** Whose turn it is, or `null` when the board is display-only. */
  live: 0 | 1 | null;
  onPlay?: (where: number) => void;
  line?: number[] | null;
  falling?: DropAnimation | null;
  /** Bid-Tac-Toe lights the square currently up for bid. */
  highlight?: number | null;
  compact?: boolean;
}

/**
 * One grid renderer for both boards.
 *
 * Tic-Tac-Toe and Connect 4 differ only in size, `need` and whether pieces
 * drop, so they share a component the same way they share a detector.
 */
export function BoardView({
  spec,
  cells,
  colours,
  live,
  onPlay,
  line,
  falling,
  highlight,
  compact,
}: Props) {
  const style = styleById(useSaveData().boardStyle);
  const [fallRow, setFallRow] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  /**
   * A dropping piece is drawn in the holes it passes through, one row at a
   * time. A piece animated inside its final cell is invisible until it
   * arrives, and one animated over the board slides across the front of the
   * frame instead of falling into it - stepping through the holes is the
   * only version that reads as a drop. The steps are spaced on the square
   * root of the row, which is what constant acceleration looks like.
   */
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!falling) {
      setFallRow(null);
      return;
    }

    const span = 340;
    for (let r = 0; r <= falling.row; r++) {
      const at = (Math.sqrt(r) / Math.sqrt(Math.max(1, falling.row))) * span;
      timers.current.push(window.setTimeout(() => setFallRow(r), at));
    }
    timers.current.push(window.setTimeout(() => setFallRow(null), span + 90));

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [falling]);

  const cellFor = (i: number): Mark => {
    if (falling && fallRow !== null) {
      const r = Math.floor(i / spec.cols);
      const c = i % spec.cols;
      if (c === falling.col && r === fallRow && cells[i] === null) return falling.mark;
    }
    return cells[i];
  };

  const clickable = live !== null && !!onPlay;

  const tap = (i: number) => {
    if (!clickable) return;
    if (spec.drop) {
      const col = i % spec.cols;
      if (dropRow(cells, spec, col) < 0) return;
      onPlay!(col);
    } else {
      if (cells[i] !== null) return;
      onPlay!(i);
    }
  };

  return (
    <div
      className="board-frame"
      style={{
        background: spec.drop ? style.frame : 'transparent',
        boxShadow: spec.drop ? `0 1.8rem 0 ${style.hole}` : 'none',
        padding: spec.drop ? '1.8rem' : 0,
        position: 'relative',
        aspectRatio: `${spec.cols} / ${spec.rows}`,
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${spec.cols}, 1fr)`,
          // rows have to be set too: with `auto` a row holding a mark sizes to
          // its content and grows, and the squares come out visibly unequal
          gridTemplateRows: `repeat(${spec.rows}, 1fr)`,
          gap: spec.drop ? '0.8rem' : compact ? '1rem' : '1.6rem',
        }}
      >
        {cells.map((_, i) => {
          const v = cellFor(i);
          const inLine = !!line?.includes(i);
          const lit = highlight === i;

          if (spec.drop) {
            return (
              <button key={i} onClick={() => tap(i)} style={{ display: 'grid', placeItems: 'stretch' }}>
                <span
                  className="hole"
                  style={{
                    background: v === null ? style.hole : colours[v],
                    boxShadow: v === null ? 'none' : 'inset 0 -1rem 0 rgba(0,0,0,.22)',
                    transform: v !== null && fallRow === null ? 'scale(1)' : undefined,
                    transition: 'background-color 90ms linear',
                    outline: inLine ? '0.5rem solid var(--coin)' : 'none',
                    outlineOffset: '-0.3rem',
                  }}
                />
              </button>
            );
          }

          return (
            <button
              key={i}
              onClick={() => tap(i)}
              className="ttt-cell"
              style={{
                background: v === null ? 'var(--card)' : colours[v],
                boxShadow: lit
                  ? '0 0 0 0.8rem rgba(255,176,32,.35)'
                  : inLine
                    ? '0 0 0 0.8rem var(--coin)'
                    : v !== null
                      ? 'inset 0 -1.2rem 0 rgba(0,0,0,.18)'
                      : 'none',
                animation: v !== null ? 'db-rise 260ms cubic-bezier(.22,1.6,.36,1) both' : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** The column arrows above a Connect 4 board - the pointer for the live one. */
export function ColumnArrows({
  spec,
  colour,
  active,
  onPick,
  cells,
}: {
  spec: BoardSpec;
  colour: string;
  active: number | null;
  onPick: (col: number) => void;
  cells: Mark[];
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${spec.cols}, 1fr)`,
        height: '7.4rem',
        flex: 'none',
      }}
    >
      {Array.from({ length: spec.cols }, (_, c) => {
        const open = dropRow(cells, spec, c) >= 0;
        const on = active === c;
        return (
          <button
            key={c}
            onClick={() => open && onPick(c)}
            style={{ display: 'grid', placeItems: 'end center' }}
          >
            <span
              style={{
                width: 0,
                height: 0,
                borderTop: `${on ? 3.4 : 2.6}rem solid ${colour}`,
                borderLeft: `${on ? 2.6 : 2}rem solid transparent`,
                borderRight: `${on ? 2.6 : 2}rem solid transparent`,
                opacity: open ? (on ? 1 : 0.25) : 0.06,
                transition: 'opacity 160ms ease, border-width 160ms ease',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
