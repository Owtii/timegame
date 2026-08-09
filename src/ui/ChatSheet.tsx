import { useEffect, useRef, useState } from 'react';

import { colourById } from '../state/cosmetics';
import { useSave, useSaveData } from '../state/store';

/**
 * Chat, on this phone, between moves.
 *
 * One phone means one keyboard, so the sender is whoever the sheet was opened
 * as - which during a match is whoever is up. Messages are appended rather
 * than re-rendered: rebuilding the list closed the keyboard mid-sentence.
 */
export function ChatSheet({ as, onClose }: { as: 0 | 1; onClose: () => void }) {
  const save = useSaveData();
  const say = useSave((s) => s.say);

  const [draft, setDraft] = useState('');
  const [sender, setSender] = useState<0 | 1>(as);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const names: [string, string] = [save.name, save.rival.name];
  const colours: [string, string] = [
    colourById(save.wornColour).hex,
    colourById(save.rival.colour).hex,
  ];

  useEffect(() => {
    const el = scroll.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [save.chat.length]);

  const post = () => {
    if (!draft.trim()) return;
    say(sender, draft);
    setDraft('');
    input.current?.focus();
  };

  return (
    <>
      <button className="scrim" onClick={onClose} aria-label="Close the chat" />
      <div
        className="sheet"
        style={{ height: '150rem', animation: 'db-rise 300ms cubic-bezier(.22,1,.36,1) both' }}
      >
        <span className="grabber" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '3rem',
            flex: 'none',
            gap: '1.6rem',
          }}
        >
          <span className="t-title" style={{ fontSize: '5.6rem' }}>
            Chat
          </span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {([0, 1] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSender(p)}
                style={{
                  height: '8.6rem',
                  padding: '0 2.4rem',
                  borderRadius: 'var(--r-pill)',
                  background: sender === p ? colours[p] : 'var(--sunken)',
                  color: sender === p ? 'var(--on-fill)' : 'var(--muted)',
                  font: '900 2.6rem/1 Nunito',
                  maxWidth: '22rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {names[p]}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={scroll}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            marginTop: '2.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
          }}
        >
          {save.chat.length === 0 ? (
            <div
              style={{
                background: 'var(--card-dim)',
                borderRadius: '3.4rem',
                padding: '3.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
              }}
            >
              <span style={{ font: '900 3.6rem/1 Nunito', color: 'var(--text)' }}>
                Nothing said yet
              </span>
              <span style={{ font: '700 2.6rem/1.4 Nunito', color: 'var(--muted)' }}>
                Say something between moves. Nothing here is timed, and a result on screen waits
                while this is open.
              </span>
            </div>
          ) : (
            save.chat.map((m, i) => {
              const mine = m.from === sender;
              return (
                <div
                  key={`${m.at}-${i}`}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    background: mine ? colours[m.from] : 'var(--card-dim)',
                    color: mine ? 'var(--on-fill)' : 'var(--text)',
                    borderRadius: mine ? '3rem 3rem 1rem 3rem' : '3rem 3rem 3rem 1rem',
                    padding: '2rem 2.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  {!mine && (
                    <span
                      style={{
                        font: '800 2.2rem/1 Nunito',
                        letterSpacing: '.1em',
                        color: colours[m.from],
                        textTransform: 'uppercase',
                      }}
                    >
                      {names[m.from]}
                    </span>
                  )}
                  <span style={{ font: '700 2.8rem/1.3 Nunito' }}>{m.text}</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.4rem', marginTop: '2.6rem', flex: 'none' }}>
          <input
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                post();
              }
            }}
            maxLength={240}
            placeholder={`Message as ${names[sender]}`}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'var(--card-dim)',
              border: 0,
              outline: 'none',
              borderRadius: 'var(--r-pill)',
              padding: '0 3rem',
              height: '12rem',
              font: '700 2.8rem/1 Nunito',
              color: 'var(--text)',
            }}
          />
          <button
            onClick={post}
            disabled={!draft.trim()}
            style={{
              width: '12rem',
              height: '12rem',
              borderRadius: '50%',
              background: draft.trim() ? colours[sender] : 'var(--card-dim)',
              display: 'grid',
              placeItems: 'center',
              flex: 'none',
              boxShadow: draft.trim() ? '0 1rem 0 rgba(0,0,0,.4)' : 'none',
            }}
            aria-label="Send"
          >
            <span
              style={{
                width: 0,
                height: 0,
                borderLeft: `3.4rem solid ${draft.trim() ? 'var(--on-fill)' : 'var(--faint)'}`,
                borderTop: '2.2rem solid transparent',
                borderBottom: '2.2rem solid transparent',
                marginLeft: '0.8rem',
              }}
            />
          </button>
        </div>
      </div>
    </>
  );
}
