# Duel Board

Two-player, pass-and-play on one phone. You don't win squares by playing the
board well — you win them by winning a **duel**. Pick a duel and a board at the
start of a match; every duel you win earns you one placement.

Single self-contained file: [`index.html`](index.html). No build, no
dependencies, no network calls.

## The duels

### Timer Duel

A target time between **3.00s** and **8.00s** appears. Tap Start, then Stop when
you think you've hit it. For the first second the clock is visible; after that
the digits dissolve and only a tick scale remains. Both players attempt the same
target, then the times are revealed side by side on a photo-finish scale.

| Situation | Result |
| --- | --- |
| One player closer | They earn the placement |
| Deviations exactly equal | **Sudden death** — replay immediately with a new target |
| *Both* off by more than 1.50s | **Round void** — nobody places |

### Number Duel

A secret number between **1** and **100** is drawn. Players alternate guesses on
a keypad; each guess answers **Higher** or **Lower** until someone lands it
exactly. That player earns the placement.

Rounds are capped at **7 guesses combined**. Run out and the round is void — the
number is revealed and a fresh one is drawn. Winning *on* the seventh guess still
counts; the cap only bites when the seventh guess misses.

Every guess so far is shown to both players as a chip (`42 ↑`, `71 ↓`) and
pinned on a 1–100 scale, with the still-possible range lit up.

## The boards

| Board | Grid | To win | Placement |
| --- | --- | --- | --- |
| Tic-Tac-Toe | 3×3 | 3 in a row | Tap any open square |
| Connect 4 | 7×6 | 4 in a row | Tap a column; the piece drops to the lowest open row |

Both use the same detector — an *n*-in-a-row scan across horizontals, verticals
and both diagonals — so the only difference between them is `need: 3` vs
`need: 4`. A full board with no line is a draw. "Play again" returns to the
board-selection screen.

Connect 4 needs far more placements than Tic-Tac-Toe, so those matches run long.
The match topbar has a quit control (tap once to arm, again to confirm) so you
aren't committed to finishing one.

## The hub

Outside a match the app is a five-tab hub. Both players have a persistent
profile on the device; the top-left control switches which one you're acting as.

| Tab | What's in it |
| --- | --- |
| Home | Series score, your stats, and the match button |
| Quests | Six daily objectives, claimable for coins; resets at midnight |
| Shop | Mark colours (per player) and board styles (shared) |
| Players | Both profiles side by side, plus a chat |
| You | Stats, display name, coin balance, and a reset |

Coins come from winning rounds (5), stopping inside 0.10s (3), winning matches
(25), and claiming quests. Everything persists in `localStorage`; if storage is
unavailable the app falls back to memory for the session rather than failing.

Two players can't wear the same colour — whichever the other has equipped is
greyed out in the shop, so you always stay distinguishable.

## Design notes

- **Timing precision matches display precision.** Elapsed times are quantised to
  centiseconds, the same 2 decimals shown on screen. Comparing at millisecond
  resolution would let two visible `4.28`s resolve to a winner, which reads as
  broken — and it makes exact ties reachable, so sudden death actually fires.
- **The blind phase can't be counted.** The tick scale's breathing is the sum of
  two sines with an incommensurate frequency ratio, so it never settles into a
  rhythm you could use as a metronome.
- **The hand-off to blind mode is signposted three ways** — a label before you
  start, a depleting fuse bar under the digits, and a soft tone in the last
  260ms. Without them the transition reads as a glitch rather than a rule.
- **Number Duel blocks repeat guesses.** Re-guessing a number is strictly
  wasteful against a shared 7-guess budget, so it's refused rather than spent.
  Guesses outside the deduced range are still allowed — narrowing it is the game.
- **Who acts first alternates every round**, including replays. It matters most
  in Number Duel, where the opener gets guesses 1, 3, 5 and 7 against the
  responder's 3.
- **The board sets `grid-template-rows`, not just columns.** With `auto` rows a
  row holding a mark sizes to its content and grows — squares come out visibly
  unequal (measured 96px against 55px).
- Connect 4's topbar glance is a piece tally, not a mini board — a 7×6 grid is
  illegible at 44px.
- Haptics use `navigator.vibrate` where supported (Android/Chrome; iOS Safari
  doesn't implement it). Audio is synthesised with the Web Audio API — there are
  no sound files to load.

## Running it

Open `index.html`. To serve it over HTTP instead:

```bash
python -m http.server 8000
```
