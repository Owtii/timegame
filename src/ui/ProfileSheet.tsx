import { useEffect, useState } from 'react';

import { CATALOG } from '../game/catalog';
import * as NET from '../net/supabase';
import { colourById, MARK_COLOURS } from '../state/cosmetics';
import { useSave, useSaveData } from '../state/store';
import { Btn } from './primitives';

/**
 * You, and the person sitting next to you.
 *
 * Both live here rather than in a settings menu: a pass-and-play game where
 * the other player is permanently called "Player 2" is a game that has
 * forgotten who is holding the phone.
 */
export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const save = useSaveData();
  const { rename, renameRival, dressRival, wearColour, reset } = useSave();

  const [tab, setTab] = useState<'you' | 'rival'>('you');

  const played = Object.values(save.stats).reduce((n, t) => n + (t?.played ?? 0), 0);
  const won = Object.values(save.stats).reduce((n, t) => n + (t?.won ?? 0), 0);

  return (
    <>
      <button className="scrim" onClick={onClose} aria-label="Close" />
      <div
        className="sheet"
        style={{ height: '190rem', animation: 'db-rise 320ms cubic-bezier(.22,1,.36,1) both' }}
      >
        <span className="grabber" />

        <div style={{ display: 'flex', gap: '1.2rem', marginTop: '3rem', flex: 'none' }}>
          <Switch label="You" on={tab === 'you'} onClick={() => setTab('you')} colour={colourById(save.wornColour).hex} />
          <Switch
            label="On this phone"
            on={tab === 'rival'}
            onClick={() => setTab('rival')}
            colour={colourById(save.rival.colour).hex}
          />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: '3rem' }}>
          {tab === 'you' ? (
            <>
              <Identity
                name={save.name}
                colour={colourById(save.wornColour).hex}
                onName={rename}
              />
              <Tag />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.6rem', marginTop: '3rem' }}>
                <Stat cap="COINS" value={save.coins.toLocaleString('en-GB')} colour="var(--coin)" />
                <Stat cap="PLAYED" value={String(played)} colour="var(--text)" />
                <Stat cap="WON" value={String(won)} colour="var(--good)" />
              </div>

              <span className="t-label" style={{ display: 'block', margin: '3.4rem 0 1.8rem' }}>
                RECORD BY GAME
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                {CATALOG.map((e) => {
                  const t = save.stats[e.id] ?? { played: 0, won: 0 };
                  return (
                    <div
                      key={e.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--card-dim)',
                        borderRadius: '2.4rem',
                        padding: '2rem 2.6rem',
                      }}
                    >
                      <span style={{ font: '800 2.8rem/1 Nunito', color: 'var(--text)' }}>{e.name}</span>
                      <span style={{ font: '900 2.8rem/1 Nunito', color: 'var(--muted)' }}>
                        {t.played ? (
                          <>
                            {t.won}
                            <span style={{ color: 'var(--faint)' }}> / {t.played}</span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--faint)' }}>-</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <span className="t-label" style={{ display: 'block', margin: '3.4rem 0 1.8rem' }}>
                YOUR MARK
              </span>
              <Swatches
                owned={save.ownedColours}
                worn={save.wornColour}
                taken={save.rival.colour}
                onWear={wearColour}
              />

              <div style={{ marginTop: '4rem', paddingBottom: '4rem' }}>
                <Btn
                  tone="ghost"
                  onClick={() => {
                    if (confirm('Start again? Coins, levels and every record go with it.')) {
                      reset();
                      onClose();
                    }
                  }}
                >
                  START AGAIN
                </Btn>
              </div>
            </>
          ) : (
            <>
              <Identity
                name={save.rival.name}
                colour={colourById(save.rival.colour).hex}
                onName={renameRival}
              />
              <span
                style={{
                  display: 'block',
                  font: '700 2.6rem/1.4 Nunito',
                  color: 'var(--muted)',
                  marginTop: '2.4rem',
                }}
              >
                Whoever you hand the phone to in a pass-and-play match. They keep a name and a
                mark, and nothing else - the base, the coins and the Mind Score are yours.
              </span>

              <span className="t-label" style={{ display: 'block', margin: '3.4rem 0 1.8rem' }}>
                THEIR MARK
              </span>
              <Swatches
                owned={MARK_COLOURS.map((c) => c.id)}
                worn={save.rival.colour}
                taken={save.wornColour}
                onWear={dressRival}
              />
              <div style={{ height: '6rem' }} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Switch({
  label,
  on,
  onClick,
  colour,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  colour: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: '11rem',
        borderRadius: 'var(--r-pill)',
        background: on ? colour : 'var(--sunken)',
        color: on ? 'var(--on-fill)' : 'var(--muted)',
        font: '900 2.8rem/1 Nunito',
        letterSpacing: '.06em',
        boxShadow: on ? '0 0.8rem 0 rgba(0,0,0,.4)' : 'none',
        transition: 'background-color 200ms ease',
      }}
    >
      {label.toUpperCase()}
    </button>
  );
}

function Identity({
  name,
  colour,
  onName,
}: {
  name: string;
  colour: string;
  onName: (n: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2.6rem' }}>
      <span
        style={{
          width: '13rem',
          height: '13rem',
          borderRadius: '4rem',
          background: colour,
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
          boxShadow: 'inset 0 -1.4rem 0 rgba(0,0,0,.18)',
        }}
      >
        <span
          style={{
            width: '6rem',
            height: '6rem',
            borderRadius: '50%',
            border: '1.6rem solid var(--on-fill)',
          }}
        />
      </span>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        maxLength={14}
        aria-label="Your name"
        style={{
          flex: 1,
          minWidth: 0,
          background: 'var(--card-dim)',
          border: 0,
          outline: 'none',
          borderRadius: '2.8rem',
          padding: '2.4rem 2.8rem',
          font: '900 4.4rem/1 Nunito',
          color: 'var(--text)',
        }}
      />
    </div>
  );
}

/**
 * The tag.
 *
 * It is the only part of a profile that has to be unique, so it is the only
 * part that needs an account behind it - and it is the whole reason the
 * Friends tab has anything to search.
 */
function Tag() {
  const save = useSaveData();
  const setHandle = useSave((s) => s.setHandle);

  const [draft, setDraft] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'taken' | 'saving' | 'offline'>('idle');
  const [signedIn, setSignedIn] = useState(NET.isSignedIn());

  useEffect(() => NET.onAuthChange(() => setSignedIn(NET.isSignedIn())), []);

  if (save.handle) {
    return (
      <div
        style={{
          marginTop: '2.4rem',
          background: 'var(--sunken)',
          borderRadius: '2.8rem',
          padding: '2.4rem 2.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.6rem',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 0 }}>
          <span className="t-micro">YOUR TAG</span>
          <span style={{ font: '900 4rem/1 Nunito', color: 'var(--p1)' }}>@{save.handle}</span>
        </span>
        <button
          onClick={() => {
            const url = `${location.origin}${location.pathname}?add=${save.handle}`;
            if (navigator.share) {
              navigator.share({ title: 'Add me on Duel Board', text: `@${save.handle}`, url }).catch(() => {});
              return;
            }
            navigator.clipboard?.writeText(url).catch(() => {});
          }}
          style={{
            height: '9rem',
            padding: '0 3rem',
            borderRadius: 'var(--r-pill)',
            background: 'var(--p1)',
            color: 'var(--on-fill)',
            font: '900 2.8rem/1 Nunito',
            boxShadow: '0 0.8rem 0 var(--p1-lip)',
            flex: 'none',
          }}
        >
          SHARE
        </button>
      </div>
    );
  }

  const clean = draft.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const valid = NET.HANDLE_SHAPE.test(clean);

  const claim = async () => {
    if (!valid) return;
    setState('checking');

    if (!signedIn && !(await NET.signInAsGuest())) {
      setState('offline');
      return;
    }

    const free = await NET.handleFree(clean);
    if (free === null) {
      setState('offline');
      return;
    }
    if (!free) {
      setState('taken');
      return;
    }

    setState('saving');
    const played = Object.values(save.stats).reduce((n, t) => n + (t?.played ?? 0), 0);
    const wins = Object.values(save.stats).reduce((n, t) => n + (t?.won ?? 0), 0);
    const ok = await NET.claimHandle(clean, {
      name: save.name,
      colour: save.wornColour,
      coins: save.coins,
      wins,
      roundsWon: played,
    });

    if (ok) setHandle(clean);
    else setState('offline');
  };

  return (
    <div
      style={{
        marginTop: '2.4rem',
        background: 'var(--sunken)',
        borderRadius: '2.8rem',
        padding: '2.4rem 2.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.6rem',
      }}
    >
      <span className="t-micro">PICK A TAG SO PEOPLE CAN FIND YOU</span>
      <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'center' }}>
        <span style={{ font: '900 4rem/1 Nunito', color: 'var(--faint)' }}>@</span>
        <input
          value={clean}
          onChange={(e) => {
            setDraft(e.target.value);
            setState('idle');
          }}
          placeholder="yourname"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={16}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'none',
            border: 0,
            outline: 'none',
            font: '900 4rem/1 Nunito',
            color: 'var(--text)',
          }}
        />
        <button
          onClick={claim}
          disabled={!valid || state === 'checking' || state === 'saving'}
          style={{
            height: '9rem',
            padding: '0 3rem',
            borderRadius: 'var(--r-pill)',
            background: valid ? 'var(--action)' : 'var(--card)',
            color: valid ? 'var(--on-fill)' : 'var(--faint)',
            font: '900 2.8rem/1 Nunito',
            boxShadow: valid ? '0 0.8rem 0 var(--action-lip)' : 'none',
            flex: 'none',
          }}
        >
          {state === 'checking' || state === 'saving' ? '...' : 'CLAIM'}
        </button>
      </div>
      <span style={{ font: '700 2.4rem/1.3 Nunito', color: state === 'taken' ? 'var(--p2)' : 'var(--dim)' }}>
        {state === 'taken'
          ? 'Somebody already has that one.'
          : state === 'offline'
            ? 'Cannot reach the server. You can still play everything offline.'
            : '3 to 16 characters: letters, numbers and underscores.'}
      </span>
    </div>
  );
}

function Stat({ cap, value, colour }: { cap: string; value: string; colour: string }) {
  return (
    <div
      style={{
        background: 'var(--card-dim)',
        borderRadius: '2.8rem',
        padding: '2.2rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.8rem',
      }}
    >
      <span style={{ font: '800 2rem/1 Nunito', letterSpacing: '.16em', color: 'var(--muted)' }}>
        {cap}
      </span>
      <span style={{ font: '900 4.4rem/1 Nunito', color: colour }}>{value}</span>
    </div>
  );
}

/** Two players may not wear the same mark, so the other one's is greyed out. */
function Swatches({
  owned,
  worn,
  taken,
  onWear,
}: {
  owned: string[];
  worn: string;
  taken: string;
  onWear: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '1.4rem', flexWrap: 'wrap' }}>
      {MARK_COLOURS.filter((c) => owned.includes(c.id)).map((c) => {
        const blocked = c.id === taken;
        const on = c.id === worn;
        return (
          <button
            key={c.id}
            disabled={blocked}
            onClick={() => onWear(c.id)}
            title={blocked ? 'The other player is wearing this' : c.name}
            style={{
              width: '11rem',
              height: '11rem',
              borderRadius: '3.4rem',
              background: c.hex,
              opacity: blocked ? 0.22 : 1,
              boxShadow: on ? '0 0 0 0.8rem var(--text)' : 'inset 0 -1.2rem 0 rgba(0,0,0,.2)',
              transition: 'box-shadow 180ms ease, opacity 180ms ease',
            }}
          />
        );
      })}
    </div>
  );
}
