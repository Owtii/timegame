# Duel Board

Six games on one phone, against a friend sitting next to you or against the bot.
Four are played straight up. Two are **duels**: you don't win squares by playing
the board well, you win them by winning the mini-game.

Single self-contained file: [`index.html`](index.html). No build, no
dependencies, no network calls.

## The games

Starting a match is a wizard, one question per screen: pick a game, then pick an
opponent (**a friend** or **the bot**). Two taps and you're playing. The duels
ask a third question — which board you're fighting over — and Tap the Time asks
whether you want a random target or your own. Home keeps a one-tap shortcut back
into whatever you played last.

### Classic

| Game | Rules |
| --- | --- |
| Tic-Tac-Toe | 3×3, three in a row. Take turns on the board itself. |
| Connect 4 | 7×6, four in a row. Tap a column; the piece falls. |
| Number Guess | Secret number **1–100**. Alternate guesses, each answered Higher or Lower. First to land it takes the round; first to **2** rounds takes the match. |
| Tap the Time | A target between **2.00s** and **10.00s** — random, or one you set yourself. Closest stop takes the round; first to **3** rounds takes the match. |

### Duel for a board

| Duel | Rules |
| --- | --- |
| Timer Duel | Target between **3.00s** and **8.00s**. Closest stop claims a square. |
| Number Duel | Secret number **1–10**, **three tries each**. An exact hit ends it; otherwise the closest guess claims the square, and a shared distance goes to whoever reached it first. |

Both clock games hide the digits after the first second — from there you're
running blind against a tick scale.

| Clock situation | Result |
| --- | --- |
| One player closer | They take the round |
| Deviations exactly equal | **Sudden death** — replay with a new target |
| *Both* off by more than 1.50s | **Round void** — nobody takes it |

## The bot

The bot always plays as player 2 and never touches a real profile — no coins, no
stats, no quest progress. It plays Tic-Tac-Toe with a full minimax search and a
deliberate slip about one move in seven, Connect 4 with alpha-beta to depth four
over a window-count evaluation, halves the range in the number games, and stops
the clock with a human-shaped error around the target.

Against the bot there is no hand-over screen — the game runs straight through.

## Boards

| Board | Grid | To win | Placement |
| --- | --- | --- | --- |
| Tic-Tac-Toe | 3×3 | 3 in a row | Tap any open square |
| Connect 4 | 7×6 | 4 in a row | Tap a column; the piece drops to the lowest open row |

Both use the same detector — an *n*-in-a-row scan across horizontals, verticals
and both diagonals — so the only difference between them is `need: 3` vs
`need: 4`. A full board with no line is a draw.

## History

The clock icon in the match topbar opens the history sheet at any point: every
round of the current match with the board as it stood, then the last 14 finished
matches — tap one to replay its rounds. The hub's home tab lists the most recent
three. Nothing pauses; closing the sheet drops you back exactly where you were.

## The hub

Outside a match the app is a five-tab hub. Both players have a persistent
profile on the device; the top-left control switches which one you're acting as.

| Tab | What's in it |
| --- | --- |
| Home | Series score, your stats, recent matches, and the match button |
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

- **A tap is only asked for where it means something.** Results advance on their
  own with a depleting bar showing when; the button next to it skips ahead. The
  taps that remain are the ones you'd want: acting on your turn, and the
  hand-over screen that keeps a blind stop secret from your opponent.
- **The number games never hand the phone over.** Both players see the same
  clues, so the Higher/Lower reply flashes in place and the turn just moves on.
- **A dropping Connect 4 piece lives in an overlay, not in its cell.** Cells clip
  their contents, so a piece animated inside its final cell is invisible until it
  has already arrived. The overlay is clipped to the board instead, so the piece
  enters at the top edge, accelerates like gravity, and bounces on landing.
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
- **1-to-10 rounds resolve on distance, not on a hit.** With three tries each and
  Higher/Lower narrowing, waiting for an exact hit would stall; nearest-wins
  ends every round in at most six guesses.
- **Who acts first alternates every round**, including replays.
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
npx serve -l 3000 .
```
