# Testing: look before you publish

The user notices everything: a hand clipping through a sleeve for a few frames, a caption still up during a transition, a 0.4 s pause, a light that twitches. So look at your own output before every publish: frames, levels, the studios, and the phone layout. Then say plainly what you couldn't check.

All tools are in `scripts/` (copies) and in `projects/workspace/` (where they run). They need:
- Node and the pre-installed Chromium through Playwright (`require('playwright')`). Never run `playwright install`.
- Python 3 with numpy, plus ffmpeg.
- pocketsphinx for word alignment (`pip install --target pylib pocketsphinx`).
- three.js 0.128.0 in `npmthree/package/` (`npm pack three@0.128.0` and untar) and mp4-muxer in `npmmux/package/`. `te_common.cjs` serves these instead of the CDN, and blocks web fonts.

## The tools

| Tool | What it does |
|---|---|
| `errs.cjs` | Loads the page and prints page errors (`no errors` when clean). Run it after every build. |
| `v2f.cjs` | `TIMES=a,b,c GOTO_MS=240000 node v2f.cjs`: real-camera frames `p2_<t>.png` at page times (`DSF=2` for double resolution). |
| `render2.sh` | `./render2.sh NAME "t1,t2,…" "t3,t4,…"`: two `v2f` batches in parallel, then contact sheets `NAME_sheet_a/b.png`. Waits with `wait`. |
| `sheet2.py` | `PFX=p2_ python3 sheet2.py out.png COLS t1 t2 …`: a contact sheet of frames. |
| `dbgpose.cjs` | `CAM=x,y,z LOOK=x,y,z FOV=55 TIMES=… node dbgpose.cjs`: lit stills from any camera (`dp_<t>.png`), to see a body's pose clearly. |
| `projprobe.cjs` | Where the figure, a target and the camera land on screen at given times. Use it to check that what the viewer must see isn't hidden behind him. |
| `camtrack.cjs` | The camera's position, yaw, pitch, field of view and where he is on screen every 0.1 s (`camtrack.json`). This is the beat map for syncing narration. |
| `coll.cjs` | Every moment the figure walks into furniture. It must print `collisions: 0`. |
| `armprobe.cjs` | `WIN="a,b;c,d" GOTO_MS=240000 node armprobe.cjs`: samples his pose 240 times a second over beat windows and prints the fastest hand, elbow and joint motions and the sharpest jolts. An elbow flip, a turn cut short or a pose switched on without easing stands out as a lone spike. Run it after any change to his arms or path. |
| `gensteps2.cjs` | His footstep times from his walk (`ns2/audio/steps.json`). Rerun after any change to his motion, before the sound build. |
| `chunks_sim.cjs` | Prints exactly what the captions will show and when. |
| `vo_phrases.py` / `vo_snr.py` | Pauses inside each placed narration line, and each line's level against the mix under it. |
| `migrate_mix.py` | Carries the user's saved sound mix onto a rebuilt clip list (see `studios.md`). |
| `mkwork.sh` | `./mkwork.sh NAME`: a private working copy `wk_NAME/` (its own `ns2/`, everything else linked) for an agent to edit, build and render in. |
| `review_render.sh` | Renders the review sheets into `review/` for an independent visual review. |
| `cardlab/` | The choice card in seconds, without the 3D page: `capbg.cjs` grabs the frozen frames; `mock.html` + `shot.cjs <dir>` renders a card design in four states. |
| `te_fonts.cjs` | Like `te_common.cjs`, but serves the reel's own fonts (Archivo, JetBrains Mono, from `cardlab/fonts`) instead of blocking them. Use it whenever text on the picture is being judged: with the fallback fonts, lines wrap differently. |

Full tests per reel, in `projects/workspace/`:
- `p2_t.cjs` (Part 2): the opening's question card (words lit, keys up, RUN pressed, gone by 6 s), captions at set times, mix levels per scene, the choice card, collisions and phone width.
- `ns_t1.cjs` (Part 1).
- Studio regressions:
  - Sound editor: `te1`–`te9` (drag, lanes, live playback, the phone layout, the database round trip with a stand-in runtime), `tdrag`, `timp` (imports), `taud` (offline mix levels).
  - Phone audio rules: `tm1`, `tm2`.
  - Notes history: `tn1`.
  - Camera editor: `tce1`, `tce2`.
  - Saved-mix loading: `tdb2`.
  - Effects studio: `fx_t`, `fx_ui`.
  - The choice card: `choice_t`.
  - Export: `studiotest`.

Update a test's times when the film's length or beats move.

## A round's checks, in order

1. **Build and load:** the build script, `node --check <main>_check.js`, `node errs.cjs`.
2. **Motion changed?** `gensteps2.cjs`, then the sound build, then build again (to embed the new sound), then `coll.cjs` and `armprobe.cjs` over the changed moments.
3. **Frames at every changed moment** (`render2.sh`), from the real camera **and** a lit side view (`dbgpose.cjs`).
4. **The full test** (`p2_t.cjs`): captions, levels (the gap must be −180 dB, i.e. silence), the card, no page errors.
5. **Narration touched?** One frame per phrase, `vo_phrases.py`, `chunks_sim.cjs`, `vo_snr.py`.
6. **Studios touched?** Their regression tests, plus a phone-width check (390 px, no sideways scroll).
7. **A new scene, set or figure?** Run the checklists in `rules.md` (section 5): the place, the light, the motion, the look, the frames.

## How to look at a frame

Ask:
- Does it read instantly as what it's meant to be?
- Does anything snap, slide, clip through, kick, hop or freeze?
- Is the important thing lit, and not hidden behind him?
- Is it smooth and slow enough?
- Does the caption describe this exact picture?

A frame that "technically works" but reads oddly is a failure: hands over the faceplate, a frog squat, a leg kicking up, arms straight out like a zombie. Use a brightened crop at double resolution for dark scenes.

## Independent review (for big changes)

- Render fresh sheets (`review_render.sh`). Ask one or more agents who haven't seen your reasoning to check every note against them, from the user's point of view.
- Reviewers caught real problems that looked fine at a glance: a head turned further than a neck can, zombie-straight arms, glowing grit, captions over the wrong shot.
- Hand them the frames and the notes, not your conclusion.

## Speed and the machine

- This machine has 4 CPUs and renders WebGL in software. A headless page load takes about a minute (`GOTO_MS=240000` for the ~6–8 MB pages), and each frame takes seconds.
- A workflow runs only about 2 agents at a time. Several agents that each render and iterate take an hour or more. The user once asked "why is it taking so long?" and then "use my gpu then", which isn't possible from here.
- So say up front roughly how long a big job will take, and cut stages when they're waiting: merge the judges' winner yourself instead of running another refine round.
- For design work, give agents a harness that renders in seconds (like `cardlab/`), not the 3D page.
- The user's own exports run on their graphics card (see the Export studio). Your renders here are only for checking.

## Gotchas that cost time before

- **Wait loops:** never `pkill -f "node v2f.cjs"` and never `until ! pgrep -f …` or `while pgrep -f …`. The pattern matches your own shell, which then kills itself or spins forever. Wait with `render2.sh` (it uses `wait`), or run the command with `run_in_background` and act on its notification.
- **Comments in one-line code:** a `// comment` added in the middle of a one-line edit swallows the rest of that line's code. Put comments on their own line.
- **Helpers in an IIFE:** `const` helpers used inside an IIFE above their definition throw a TDZ error. Define small helpers locally.
- **Keyframe times:** keyed animation arrays need strictly increasing times. A duplicate time divides by zero and makes NaN poses.
- **Head turns:** a pose that sets the head's yaw from a world target must clamp it (about ±1.3 rad), or the head turns like an owl's before the body catches up.
- **Glowing particles:** additive particles look like glowing stars unless their brightness is scaled to the scene.
- **Build anchors:** the builder's exact-match replacements (`must(s, old, new)`) abort when an anchor isn't found exactly once. Keep anchors unique.
- **Mixed sample rates:** a 48 kHz index into a 44.1 kHz stem reads the wrong moment and looks like silence.
- **Saved camera keys:** a saved `camera/keys` hides camera changes made in code (see `studios.md`).
- **Stale page text:** check the page's own text after each round: the lede, the credit line, the chapter descriptions. Part 2's credit still said "no narration recorded yet" a round after the narration went in.
