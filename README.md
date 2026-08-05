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
| You | Stats, display name, coin balance, appearance, and the way out of the account |

The top-left control is who you are. Tapping it opens a short menu over the
button — **Your profile**, and **Log out** (or **Sign in**, as a guest). Logging
out is also spelled out at the bottom of the You tab, behind a confirm, since
that is where anyone goes looking for it.

## In a match

The match screen is the one screen that isn't a hub tab, and it's laid out like
a scoreboard: what you're playing across the top with the way out beside it,
then both players facing each other across the clock, then the board, then the
three utilities on a dock at the bottom.

The ring around the active player **is** the move clock — a conic-gradient arc
that drains as their turn does. The small dial in the middle shows the same
number of seconds off the same `--k`, so the two can never disagree about how
long is left. The pill under each name carries whatever that screen counts:
squares placed, tries left, points in hand.

The board sits in a tray: a floor, a rim and its own shadow, so it reads as
something you put pieces into rather than a grid drawn on the page. The square
that just landed keeps a yellow ring until the next one does, which is how you
find the last move without replaying the round.

The dock rides in the tab bar's slot, so chat, history and sound sit exactly
where the tabs do outside a match and the thumb never learns a second home.

## Colour

Two colours do the work, and they're kept apart on purpose:

| | |
| --- | --- |
| `--brand` | The app's own colour. Pastel butter yellow. Primary buttons, the lit tab, quest and reward furniture. |
| `--pc` | Whoever or whatever the thing in front of you is about. A player's mark, their ring, their pill, the line that won them the board. |

Mixing the two was the old mistake: with `--pc` driving the chrome, the whole
app changed colour when you bought a skin. Now the app stays yellow and the
player's colour means a player.

Anything carrying a player's colour derives two more shades from it in CSS — a
tint to sit on, and a lifted version legible against that tint:

```css
--pc-lit:  color-mix(in srgb, var(--pc) 80%, var(--pc-mixer));
--pc-tint: color-mix(in srgb, var(--pc) 14%, var(--pc-base));
```

`--pc-mixer` and `--pc-base` are the only per-skin part (white and the page in
the dark skin, near-black and white in the light one), so a gradient pulled out
of a case gets the same treatment as one of the sixteen without a new rule.

The two default players are **tomato** and **sage** — the pair the reference
draws. They're also the app's two semantic colours: tomato is what went wrong,
sage is what went right, which is why a row of three stat tiles reads as three
things rather than a wall of numbers. Red and blue are still in the shop.

Nothing is separated by a border. Surfaces are separated by shadow, and solid
buttons carry a hard lip underneath (`0 6px 0`) that they lose on the way down —
that plus the travel is the whole of the pressable feel.

## Light and dark

Both skins are the same app: same geometry, same yellow, different surfaces —
warm off-black in the dark skin, warm white in the light one, both carrying a
trace of the brand so the two never look like different apps. **System / Light
/ Dark** lives under Appearance in the You tab, and System follows the phone
live: flip the OS switch and the app follows without a reload.

Everything a skin has to change is a custom property at the top of the
stylesheet, so a screen is written once and gets both. Three things needed more
than a swapped surface:

- **Boards carry a second pair of colours.** A board is the one surface you
  stare at for a whole match, and a near-black well punched into a pale page
  reads as a hole rather than a board. Every terrain declares `lframe` / `lwell`
  alongside its dark pair.
- **Rarity tints are picked per skin.** The case tints are chosen to glow
  against near-black, which means they vanish against near-white; each tier
  carries a darker `lt` for the light skin.
- **Text on a fill of the brand or a player's colour stays dark in both.** The
  palette runs from mid to bright, so white would fail on the yellows; one dark
  ink works across all of it.

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
- **A solid button carries a lip and loses it on the way down.** That, plus
  scale, is the whole of the pressable feel; nothing animates position on hover,
  because a phone has no hover.
- **`min-width:0` on every flex column that holds content.** A flex item will
  not shrink below its own content, so one wide child prises the whole column
  open and drags the rest off the side of the phone. It has bitten this file
  twice: a fifty-ticket case strip, and a file input left visible inside a
  label, which draws its own 245px "Choose file" widget.
- **No bare class name is shared between a component and a modifier.** `.ghost`
  was both the faint mark a live square previews at 11% opacity and the
  secondary button style — so every secondary button in the app was rendered at
  11% opacity. The preview is `.mkghost` now.
- **The theme selector is scoped to the root.** A bare `[data-theme="light"]`
  also matches the theme picker's own buttons, and the Light one then paints
  itself in the skin it is offering.
- **A tray sets its width and the board fills it, never the other way round.**
  Connect 4's wrapper is a percentage width; inside a `fit-content` tray it has
  nothing to resolve against and the whole board collapses to nothing.
- **A fading blob names its own colour at both stops.** Fading to the
  `transparent` keyword interpolates through transparent *black*, which leaves a
  grey smudge in the corner instead of light.
- **The match top bar carries the title and nothing else.** The round, the
  clock and the score used to live up there, next to a 44px board glance that a
  7×6 grid was never legible in. They belong beside the two people they're
  about, so they moved down into the versus header and the glance went.
- Haptics use `navigator.vibrate` where supported (Android/Chrome; iOS Safari
  doesn't implement it). Audio is synthesised with the Web Audio API — there are
  no sound files to load.

## Running it

Open `index.html`. To serve it over HTTP instead:

```bash
npx serve -l 3000 .
```
