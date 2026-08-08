# Duel Board

Seven two-player mind games on one phone, funding a persistent 3D base that
keeps running while you are away.

Built with React, TypeScript and Vite. The hub deck is real 3D under an
orthographic camera (React Three Fiber); everything else is DOM. No Unity, no
asset pipeline, no build step beyond `vite build`.

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. `npm run build` produces a static `dist/` you can
drop on any host.

## The loop

Play a match, take coins and **+10 energy** whatever the result. Energy makes
the base run at **x2** instead of its sleeping **x0.25**. Coins buy levels for
the three structures on the deck, which raise how fast the coins come in.

The base never stops and energy is **never for sale** - it is a boost you earn
by playing, not a gate you pay past. Offline production runs at sleep speed and
stops at four hours, with a welcome-back popup that says so.

## The games

Starting a match is a wizard, one question per screen: pick a game, then pick an
opponent. Two taps and you are playing. The duels ask a third - which board they
are fought over.

### Classic

| Game | Rules |
| --- | --- |
| Tic-Tac-Toe | 3x3, three in a row. |
| Connect 4 | 7x6, four in a row. Tap a column; the piece falls. |
| Number Guess | Secret **1-100**. Alternate guesses, each answered Higher or Lower. First to **2** rounds. |
| Tap the Time | A target between **2.00s** and **10.00s**. Closest stop takes the round; first to **3**. |

### Duel for a board

| Duel | Rules |
| --- | --- |
| Timer Duel | Target between **3.00s** and **8.00s**. Closest stop claims a square. |
| Number Duel | Secret **1-10**, **three tries each**. Closest guess claims the square; a shared distance goes to whoever reached it first. |
| Bid-Tac-Toe | **24 points each.** Take turns naming a square, then both seal a bid. Highest takes it, and **both** players pay what they bid. Bidding **0 banks you +1**. |

Both clock games hide the digits a second in - from there you are running blind
against a tick scale.

| Clock situation | Result |
| --- | --- |
| One player closer | They take the round |
| Deviations exactly equal | **Sudden death** - replay with a new target |
| *Both* off by more than 1.50s | **Round void** - nobody takes it |

### Bid-Tac-Toe in detail

Naming a square is public, so there is no hand-over screen for it - the lit
player bar is enough, and it saves a tap. Each player then seals a bid in
private, and the two numbers flip up together after a held beat rather than one
after the other, which would leak the result early.

A tie means nobody takes the square, **both still pay**, and the *same* square
comes straight back with the *same* player holding the pick - a tie settles
nothing, so it must not move the turn on either.

Passing pays, which means an emptied pool can always climb back and nobody can
be priced out of the rest of the match. That leaves one hole: if both players
pass forever, the square never settles. So the **third double pass in a row on
the same square hands it to whoever named it**.

## The bot

The bot always plays as player 2 and never touches a real profile - bot matches
pay **55%** coins and leave Mind Score and the win record alone. It plays
Tic-Tac-Toe with a full minimax search and a deliberate slip about one move in
seven, Connect 4 with alpha-beta to depth four over a window-count evaluation,
halves the range in the number games, and stops the clock with a human-shaped
error around the target.

Against the bot there is no hand-over screen - the match runs straight through.

## Mind Score

An Elo underneath, framed as growth on the surface: a win moves it fully, a loss
is damped hard, and a close loss still nudges it up. Four sub-scores - Pattern,
Timing, Deduction, Strategy - track which games moved it.

It is **not** an IQ and is never described as one, in the app or anywhere else.
It measures how you have played here and makes no other claim.

## The base

Three structures, left to right, each a separate `<Hoverable>`:

- **Oil Pump** - fills the cans. Nozzles are separate children; one is on now,
  one more every four levels.
- **Worker** - hauls the cans across. The star of the deck: pick up, walk
  loaded, drop, walk back empty, with an ease in and out at every stop.
- **Machine** - burns oil into coins. Burner, Gearbox and Cooler are always
  modelled and light up at milestone levels.

Hovering a structure lifts it off the deck and outlines every part of it;
tapping opens its upgrade sheet. On a touch screen there is no hover, so the
same treatment is driven while the sheet is open.

The line runs at the speed of its slowest part, so an upgrade that changes
nothing says which structure the line is actually waiting on rather than taking
the coins quietly.

Drag to pan, pinch or scroll to zoom, double-tap to put the framing back.

## Layout

Everything is authored in the design's **1080 x 2340** space. `html` carries a
font size of one tenth of a design pixel, so `1rem` is 10 design px and the
whole app scales from one number. On a desktop the frame letterboxes to phone
proportions.

Deep links: `#/play`, `#/shop`, `#/base/worker`, `#/mind`, and
`#/m/<game>/<bot|pvp>[/<board>]` to drop straight into a match.

## Layout of the source

```
src/
  config/balance.ts     every tunable number, and nothing hardcoded elsewhere
  game/                 the rules, pure and tested - board, timing, number, bid, bot
  state/                store, economy, Mind Score, cosmetics
  three/                the 3D deck: platform, structures, hover and outline
  ui/                   screens, sheets and the match flow
```

`npm test` runs the rule suite - 22 cases over the detector, the drop, the
clock, deduction and the bidding.

## Design

The look comes from the Claude design project *Duel Board* - 16 frames at
1080x2340. Every accent is lifted from this repo's own original colour tables
(ice, rose, signal, solar, nebula) so the new look is a re-skin of the existing
palette rather than an invention. Corners are large, buttons are pills with a
solid lip under them, and meters are blocks you can count rather than smooth
bars.

## History

The first version of this game was a single self-contained HTML file with no
build and no dependencies. It is kept as
[`legacy/duel-board-v1.html`](legacy/duel-board-v1.html) - open it in a browser
and it still runs.

`supabase/schema.sql` holds the tables the hosted version is headed for. The
current build is offline-first and keeps everything in `localStorage`; match
rows are already queued in an outbox ready to sync, but nothing is wired to a
live project yet.
