# Timer Tic-Tac-Toe

A two-player, pass-and-play mobile web game. You don't win squares by playing
tic-tac-toe well — you win them by knowing how long a second is.

Single self-contained file: [`index.html`](index.html). No build, no
dependencies, no network calls. Open it in a browser, or serve the folder.

## How a round works

1. A target time between **3.00s** and **8.00s** appears.
2. Player one taps **Start**, then **Stop** when they think they've hit it.
3. For the first second the clock is visible. After that the digits dissolve
   and only a tick scale remains — the rest is instinct.
4. Pass the phone. Player two does the same round, same target.
5. Both times are revealed side by side on a photo-finish scale. Whoever landed
   closer takes a square.

## Round outcomes

| Situation | Result |
| --- | --- |
| One player closer | They place their mark (X for Player 1, O for Player 2) |
| Deviations exactly equal | **Sudden death** — replay immediately with a new target |
| *Both* players off by more than 1.50s | **Round void** — nobody marks the board |

Standard tic-tac-toe win detection applies: three in a row horizontally,
vertically, or diagonally ends the match. A full board with no line is a draw.
"Play again" reshuffles who acts first.

## The hub

Outside a match the app is a five-tab hub. Both players have a persistent
profile on the device, and the top-left control switches which one you're
acting as.

| Tab | What's in it |
| --- | --- |
| Home | Series score, your stats, and the match button |
| Quests | Five daily objectives, each claimable for coins; resets at midnight |
| Shop | Mark colours (per player) and board styles (shared) |
| Players | Both profiles side by side, plus a chat |
| You | Stats, display name, coin balance, and a reset |

Coins come from winning rounds (5), landing inside 0.10s (3), winning matches
(25), and claiming quests. Everything persists in `localStorage`; if storage is
unavailable the app falls back to memory for the session rather than failing.

Two players can't wear the same mark colour — whichever the other player has
equipped is greyed out in the shop, so you always stay distinguishable.

## Design notes

- **Timing precision.** Elapsed times are quantised to centiseconds, the same
  precision the UI displays. Comparing at a finer resolution than players can
  see would produce results the numbers on screen don't justify — two visible
  `4.28`s must never resolve to a winner.
- **The blind phase can't be counted.** The tick scale's breathing is driven by
  two sines with an incommensurate frequency ratio, so it never settles into a
  rhythm you could use as a metronome.
- **The hand-off to blind mode is signposted three ways** — a label before you
  start, a depleting fuse bar under the digits while they're visible, and a
  soft tone in the last 260ms. Without them the transition reads as a glitch
  rather than a rule.
- **The board sets `grid-template-rows`, not just columns.** With `auto` rows a
  row holding a mark sizes to its content and grows — the squares come out
  visibly unequal.
- **Who goes first alternates** every round, including replays, so neither
  player is permanently last to act.
- **Sudden death draws a new target.** Replaying the same one would let both
  players correct against a number they'd already seen.
- Haptics fire via `navigator.vibrate` where supported (Android/Chrome; iOS
  Safari doesn't implement it). Audio is synthesised with the Web Audio API —
  there are no sound files to load.

## Running it

Just open `index.html`. To serve it over HTTP instead:

```bash
python -m http.server 8000
```
