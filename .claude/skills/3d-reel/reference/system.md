# How the reel engine works

All paths are relative to the project workspace: the session scratchpad while working, or `projects/workspace/` in the repository. Per-reel facts (clocks, beats, folders) are in `projects.md`.

## One page per reel

Every reel ships as **one HTML file**, published as a private claude.ai artifact and updated in place (same URL) for every version. It loads three.js 0.128.0 and its post-processing examples (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, BokehPass, RoomEnvironment) from jsdelivr. Everything else is inline: the scene code, the studio code, the fonts' CSS, and the sound clips as base64 MP3.

The page has three parts:
1. **The player:** a 9:16 stage, play/pause, a scrubber with chapters, the captions over the picture (word-by-word highlight), headlines and kickers for explainers, a sound chip ("Tap for sound" on phones), and the chapter list.
2. **The text around it:** the title, a lede, a credit line, and the script ("Story text") with a copy button.
3. **The Studio panel:** tabs for Notes, Sound, Camera, Effects, Look and Export, which open the editors (`studios.md`).

The page talks to its database through the artifact runtime (`window.claude.use('db')`), declared with the `db`, `downloads` and `user` capabilities. It exposes `window.reel` for tests and tools: `seek(t)`, `sound` (the engine: `playing()`, the offline mix render), and `_fig` (debug hooks; see below).

## The player shell and the build

The first 3D reel, `phones-jammed-3d.html`, was written as one hand-edited page. It holds the player, the Studio panel (notes, look and text sliders, export) and the explainer's scenes. **Every later reel is built from it** by a Python build script that:
- cuts the shell's player, studio and page text out of it;
- patches them (title, lede, credit, length label, tabs, the notes history from `notes_patch.txt`);
- splices in the reel's own modules and the studio modules, in a fixed order inside one `<script>`;
- inlines the sound (`<reel>/audio/clips.json`) and the ElevenLabs library (`f13/audio/el.json`).

| Reel | Build | Modules | Output |
|---|---|---|---|
| The 13th Floor | `build13.py` | `f13/` | `the-13th-floor.html` |
| The Graveyard Shift, Part 1 | `buildns.py` | `ns/` | `the-graveyard-shift.html` |
| The Graveyard Shift, Part 2 | `buildns2.py` | `ns2/` | `the-graveyard-shift-part2.html` |

Part 2's module order:
1. `story.js`, then helpers and page UI.
2. `sets.js`, `props.js`, `figure.js`, `room.js`, `photos.js`.
3. The composer, with the contrast S-curve.
4. `env.js`, `updates.js`, `details.js`, `choice.js`, `fx.js`.
5. The overlays, then the main `updateScene(ts)`.
6. The editors (`editor.js`, `camed.js`, `fxed.js`), `engine.js` and `export.js`.

Replacements use `must(s, old, new)`, which aborts the build unless the anchor is found exactly once. The build also writes `<reel>_main_check.js` (the main script alone) for `node --check`.

The build sets the length (`TOTAL`), the length label ("1:30") and the scrubber's `aria-valuemax`. Change all three when the length changes. Also keep the page's own words current: lede, credit, chapter descriptions.

**Starting a new reel:** copy the newest reel's folder (`ns2/`) and its build script, rename them, and replace the story, sets, figure and sound. Keep the shell, the studio modules, `engine.js`, `export.js` and `choice.*` as they are. See SKILL.md, "A new reel".

## Clocks

- **Page clock:** what the player shows and what the user's notes use (`t` in seconds).
- **Story clock:** a part can start with something that isn't the story, such as Part 2's recap of Part 1. Then `ts = page - OFF`.
- **Beats clock:** the story's named moments. Held moments ("inserts"), where the world stops while the camera looks round, stretch the story clock without moving the beats: `t = warp(ts)`, and `toNew(beat)` converts back.
- Things keyed to beats move automatically when an insert grows. Things written on the story clock or the page clock must be shifted by hand. Check every hand-placed time after a timing change, and re-time the user's saved effect layers and mix (`migrate_mix.py` with `shift_at shift`).

## `story.js`: beats, captions, chapters

- **Named beats for every moment** (LIGHT_ON, CRASH, DOORS, PHOTO, BURST, DESK0…), defined once and used by the camera, the figure, the lights and the sound.
- **`CUES`:** captions `{t, text, who?, wps?}`. The narrator is plain, `who:'me'` is italic gold, `who:'phone'` is green.
  - Recorded lines bring their word times `w`, length `d` and phrases `ph` from the narration build (`vo2.json` becomes `VO_CUES`).
  - Recap cues carry `cut`, so they end before their shot's cut.
- **`CHAPTERS`** for the player. Light schedules (flicker segments, pops), breathing periods (used by both the sound and the chest), and the end (`END_CUT`).
- The sound build reads these constants with a regex. Only plain numbers parse, so an expression-valued beat must be derived again in Python.

## `env.js`: the camera

- `CAM_DEF`: groups of keys `[time, position, lookAt]`, one group per shot, with no easing across a cut.
- `camPath`: a Catmull-style curve, then a **gaussian average** over ±0.4 s (σ≈0.16 s) of position and view direction, so moves flow. Inside rush windows the smoothing is bypassed for deliberate snaps.
- `sampleCam(ts)` adds:
  - head bob (running, walking) and roll bumps;
  - landing jolts, door-shove lurches and flinches at hits;
  - breathing while hiding, and a scared tremble.
- `lensAt(t)`: the field of view over time (wide while running, narrow when staring, push-ins), with a global 0.9x zoom-out after the user asked for it.
- The user's camera editor saves `camera/keys`, which replaces `CAM` when the page loads (see `studios.md`).

## `updates.js` and `figure.js`: a figure that moves like a person

- **Path segments** (`HZ`):
  - `{t0, t1, at:[x,z], face, dur?}`: stand and turn to a heading. `dur` overrides the turn length.
  - `{t0, t1, pts:[[x,z]…], ease, back?}`: walk a path. `back:true` walks backwards.
  - `cut:true` jumps.
  - A precompute carries heading and walk phase across segments, so nothing snaps. Turning on the spot steps the feet (`TURN_STEP`) and takes `turnDur(angle)`.
- `hazAt(t)` gives position, heading and walk phase. `updHaz(t)` builds the pose and `poseHaz(P)` applies it to the skinned suit.
- **Pose parameters:**
  - Gait: `phase`, `walk`.
  - Body: `lean`, `dip`, `bodyZ`, `knee`, `hip`.
  - Head: `headYaw`, `headPitch`, `headRoll`, and `aim` (the head holds its aim against body sway).
  - Torso and arms: `twist`, `hipTurn`, `armHang`, and `reachL/reachR = [pitch, roll, elbow, weight, wrist]`.
  - Joint heights: hip 1.03, knee 0.58, ankle 0.13, shoulder 1.65, elbow 1.29, wrist 0.96.
- **Looks and arm moves** are keyed (`keyed(K, t)`, smoothstep between keys, strictly increasing times). Hands placed on objects use a small arm IK (`dskArm`).
- **The world per frame** (`updInside(t)`): every light (tubes and their flicker, door spill, torch, emergency lights), the doors, falling and smashed props, lockers jolting when hit.
- **The figure** (`figure.js`) is one skinned mesh with bones: the seamless suit, faceplate glass and stains (`setSuitClean`).
- **The 13th Floor's shadow figure** (`shadowMan` in `f13/sets.js`) is also one body, not parts. Every limb is a chain of round cones and soft ellipsoids, melted together with a smooth minimum (neck into shoulders, shoulders into arms, hips into legs) and meshed once. That's how to get "seamless, not a robot or a doll".
- **Debug hooks** (`window.reel._fig`):
  - `view(t, P, L, fov, hide, lit)` renders any time from any camera.
  - `collide()` lists the moments his body overlaps furniture.
  - `haz(t)`, `pose(t)`, `cam(t)`, and `objs`.

## Sets, props and details

- `sets.js`: rooms, corridors, doors, tubes, materials (`std()`), boxes and decals.
- `props.js`: furniture and objects. `room.js`: a whole room with its own props and lights. `photos.js`: 3D-rendered photos of people.
- `details.js`: dust lit by nearby lights, grit on hits, ambient-occlusion strips along walls, contact shadows, cobwebs and grime.
- The 13th Floor adds `world.js`: the building exterior, with repeated pieces merged into one mesh per material so it can be detailed and still cheap.
- Repeated static pieces should be merged. Keep the scene cheap, because the user's exports render every frame up to 4K.

## Sound

1. `<reel>/sound.py` builds every clip with synthesis and library recordings. Part 2's is generated by `mk_sound2.py` from Part 1's synth header plus `sound2_body.py`.
2. It writes `<reel>/audio/clips.json`: `samples` (base64 MP3, name, category, gain, pan) plus `clips` (id, sample, track, time, label) plus `master` (the mix chain).
3. It also writes a check mix (`check_mix.mp3`).
4. The page plays it through `engine.js` (Web Audio, one gain per clip, ducking buses), and the user edits it in the sound editor.

Details and recipes are in `sound.md`. Footstep times come from the figure's walk (`gensteps2.cjs` writes `steps.json`).

## Narration

One ElevenLabs take, split, aligned, placed phrase by phrase on the page clock, written to `vo2.json` plus one audio file per line, and mixed on top with ducking. See `narration.md`.

## The page's database

| Key | What |
|---|---|
| `notes` | `{created, done, t, text}`: the user's timed notes. |
| `mix/timeline` | Their saved sound mix (lanes, mutes, volumes, swaps, their own clips). |
| `camera/keys` | Their saved camera (`{groups, updated, v}`). |
| `fx/layers` | Their effect layers. |
| `settings/look` | Look and text settings: `{base, segs:[{t0,t1,adj}]}`. |
| `votes` | Viewers' answers to the choice card. |
| `sfxRequests` | "Missing a sound? Ask Claude" requests. |

Read with `ArtifactData`. Write pinned to the version you read (`if_version`), and batch the mix write and the notes' `done` flags together.

## Recovering a reel in a new session

- **The repository** (`github.com/Owtii/skill-3d-reel`) holds the whole workspace: sources, build scripts, sound inputs, clips and tests. Clone it, copy `projects/workspace/` somewhere writable, fetch three.js 0.128.0 into `npmthree/` and mp4-muxer into `npmmux/`, and every build runs.
- **The published artifact:** `Artifact read` on the URL returns the full built page for the owner. A small fix can be made in that HTML and republished, but a rebuild needs the sources.
- **The user's saved data** lives only in each artifact's database. Read it again before any change, because the copy in `projects/user-data/` is a snapshot.
