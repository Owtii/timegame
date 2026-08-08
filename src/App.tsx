import { useEffect, useRef, useState } from 'react';

import { gameById } from './game/catalog';
import type { BoardId, GameId, MatchRequest } from './game/types';
import type { StructureId } from './state/economy';
import { useSave } from './state/store';
import { Hud, TabBar, type Tab } from './ui/chrome';
import { Match } from './ui/match/Match';
import { BaseScreen } from './ui/screens/BaseScreen';
import { CupsScreen } from './ui/screens/CupsScreen';
import { FriendsScreen } from './ui/screens/FriendsScreen';
import { PlayScreen } from './ui/screens/PlayScreen';
import { ShopScreen } from './ui/screens/ShopScreen';
import { BoardSheet, MindSheet, OpponentSheet, UpgradePopup, WelcomeBack } from './ui/sheets';

const TABS: Tab[] = ['base', 'play', 'friends', 'cups', 'shop'];

/**
 * The hub tabs are addressable as `#/play` and so on.
 *
 * It costs one line to read and one to write, and it means a screen can be
 * opened directly - handy for sharing a link, and the only way to point a
 * screenshot at a tab without clicking through to it first.
 */
const tabFromHash = (): Tab => {
  const id = window.location.hash.replace(/^#\/?/, '') as Tab;
  return TABS.includes(id) ? id : 'base';
};

/** `#/m/bid/bot` and `#/m/dtimer/pvp/c4` drop straight into a match. */
function matchFromHash(): MatchRequest | null {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/');
  if (parts[0] !== 'm' || !parts[1]) return null;
  try {
    const entry = gameById(parts[1] as GameId);
    return {
      game: entry.id,
      vsBot: parts[2] !== 'pvp',
      board: (parts[3] as BoardId) ?? entry.board,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(tabFromHash);

  const setTab = (t: Tab) => {
    setTabState(t);
    window.location.hash = `#/${t}`;
  };

  useEffect(() => {
    const onHash = () => setTabState(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [match, setMatch] = useState<MatchRequest | null>(matchFromHash);
  const [picking, setPicking] = useState<{ game: GameId; vsBot?: boolean } | null>(null);
  // `#/base/pump` opens a structure sheet, `#/mind` the score sheet
  const [structure, setStructure] = useState<StructureId | null>(() => {
    const id = window.location.hash.replace(/^#\/?/, '').split('/')[1];
    return id === 'pump' || id === 'worker' || id === 'machine' ? id : null;
  });
  const [mindOpen, setMindOpen] = useState(() => window.location.hash === '#/mind');

  const tick = useSave((s) => s.tick);
  const bootOffline = useSave((s) => s.bootOffline);

  // what the base made while the app was shut, worked out once at boot
  useEffect(() => {
    bootOffline();
  }, [bootOffline]);

  /**
   * The production loop.
   *
   * A one-second interval rather than a frame loop: the figure on screen
   * only changes in whole coins, and pinning a timer to the refresh rate
   * would burn a phone battery to redraw the same number sixty times.
   */
  const last = useRef(performance.now());
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(5, (now - last.current) / 1000);
      last.current = now;
      tick(dt);
    }, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const start = (game: GameId, vsBot: boolean, board?: BoardId) => {
    setPicking(null);
    setMatch({ game, vsBot, board });
  };

  const chooseOpponent = (vsBot: boolean) => {
    if (!picking) return;
    const entry = gameById(picking.game);
    // the duels ask a third question - which board they are fought over
    if (entry.kind === 'duel') {
      setPicking({ game: picking.game, vsBot });
      return;
    }
    start(picking.game, vsBot);
  };

  if (match) {
    return (
      <div className="frame">
        <Match request={match} onExit={() => setMatch(null)} />
      </div>
    );
  }

  return (
    <div className="frame">
      <div className="screen">
        <Hud onMind={() => setMindOpen(true)} />

        {tab === 'base' && (
          <BaseScreen
            selected={structure}
            onSelect={setStructure}
            onPlay={() => setTab('play')}
          />
        )}
        {tab === 'play' && <PlayScreen onPick={(game) => setPicking({ game })} />}
        {tab === 'friends' && <FriendsScreen />}
        {tab === 'cups' && <CupsScreen />}
        {tab === 'shop' && <ShopScreen />}

        <TabBar tab={tab} onTab={setTab} />
      </div>

      {picking && picking.vsBot === undefined && (
        <OpponentSheet
          gameName={gameById(picking.game).name}
          onPick={chooseOpponent}
          onClose={() => setPicking(null)}
        />
      )}

      {picking && picking.vsBot !== undefined && (
        <BoardSheet
          onPick={(board) => start(picking.game, picking.vsBot!, board)}
          onClose={() => setPicking(null)}
        />
      )}

      {structure && <UpgradePopup id={structure} onClose={() => setStructure(null)} />}
      {mindOpen && <MindSheet onClose={() => setMindOpen(false)} />}
      <WelcomeBack />
    </div>
  );
}
