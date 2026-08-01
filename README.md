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
| Bid-Tac-Toe | **24 points each** (configurable). A toss decides who names the first square; from there you take turns naming one. Both then seal a bid on it — highest takes it, and **both** players pay what they bid. Bidding **0 banks you +1** instead of costing anything. |

### Bid-Tac-Toe in detail

The match opens with a toss: the two names flick past each other, slowing until
one lands, and that player names the first square. After that the pick alternates
every time a square actually settles.

Naming a square is public, so there is no hand-over screen for it — the lit
player bar is enough, and it saves a tap. The chooser taps an open square, then
seals their own bid straight away; only then does the phone change hands.

Each player seals a bid in private — drag the slider or tap Pass / Half / All in,
hit **Seal**, hand the phone over — and the two numbers flip up together after a
held beat. A tie means nobody takes the square, **both still pay**, and the *same*
square comes straight back up with the *same* player still holding the pick — a
tie settles nothing, so it shouldn't move the turn on either. A running log under
the board shows every settled square with both bids and who took it, so you can
track how much of the other pool is gone.

Run the 30-second move clock out on the pick and the app names a square for you
rather than stalling the match.

### Passing pays

Bidding **0 banks you +1** rather than costing nothing. An emptied pool can
always climb back, so there is no longer any way to be priced out of the rest of
the match — which also means the old "both pools are empty, end it here" rule is
gone. The only endings now are a line or a full board.

That does leave one hole: if both players pass, both gain, and the square comes
back — forever. So the **third double-pass in a row on the same square hands it
to whoever named it**. Passing is a real choice rather than a way to stall, and
nobody can freeze a match by refusing to bid.

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

## In a match

Every screen where somebody has to act carries the same header: both players
side by side, the active one lit, and a bar draining underneath them. **30
seconds** for a board move or a guess, **45** for a bid — long enough to think,
short enough that nobody sits on the phone. The last ten seconds count down in
figures; run out and the app plays a legal move for you rather than stalling
the match. The clock only runs while the app is on screen, and never in the
clock games, where the timing *is* the game.

Everything else gives way to the board: it is the largest thing on screen in
every game that has one.

## Boards

| Board | Grid | To win | Placement |
| --- | --- | --- | --- |
| Tic-Tac-Toe | 3×3 | 3 in a row | Tap any open square |
| Connect 4 | 7×6 | 4 in a row | Tap a column; the piece drops to the lowest open row |

Both use the same detector — an *n*-in-a-row scan across horizontals, verticals
and both diagonals — so the only difference between them is `need: 3` vs
`need: 4`. A full board with no line is a draw.

## History

The clock icon in the match topbar opens the history sheet at any point. It
shows one list at a time behind a two-way switch — **This match**, every round
with the board as it stood, or **Past matches**, the last 14 finished ones with
the game's own icon. Tap a past match to open it round by round, with a back
control in the sheet header. The hub's home tab lists the most recent three.
Nothing pauses; closing the sheet drops you back exactly where you were.

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

- **The bid reveal is the beat the round is built around.** Both numbers stay
  masked through a held pause with a low three-pulse cue, then flip up together
  rather than one after the other — reading one before the other would leak the
  result early. A win by one point or a blowout gets a burst behind the winning
  card, so the two outcomes worth reacting to look different from an ordinary win.
- **A tap is only asked for where it means something.** Results advance on their
  own with a depleting bar showing when; the button next to it skips ahead. The
  taps that remain are the ones you'd want: acting on your turn, and the
  hand-over screen that keeps a blind stop secret from your opponent.
- **The number games never hand the phone over.** Both players see the same
  clues, so the Higher/Lower reply flashes in place and the turn just moves on.
- **A dropping Connect 4 piece is drawn in the holes it passes through**, one row
  at a time, rather than animated as a single element over the board. A piece
  animated inside its final cell is invisible until it arrives (cells clip their
  contents); one animated over the board slides across the front of the frame
  instead of falling into it. Stepping through the holes is the only version that
  reads as a drop. Steps are spaced on the square root of the row, which is what
  constant acceleration looks like, and the piece squashes when it lands.
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
- **Board widths are capped in pixels, never in `vw`.** A `vw` cap does not know
  about the app's own padding, so `max-width:96vw` overflowed the right edge of
  a phone screen and cut the last column off.
- **A bid is a dial, not a typed number.** Bidding is a judgement about a
  fraction of your pool, so the slider plus Pass / Half / All in gets you there
  in one gesture, and the +/- keys settle the exact figure. It also costs half
  the height of a keypad, which the board takes instead.
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
