# How the reel engine works

All paths are relative to the project directory (the session scratchpad). Part 2 lives in `ns2/`, Part 1 in `ns/`, The 13th Floor in `f13/`. Every part is built into one HTML file by a Python build script; nothing is served from the repo.

## Build: one page from many files

`buildns2.py` takes the original reel framework page `phones-jammed-3d.html` (player, timeline, editors, export) and splices in Part 2's modules, in this order inside one `<script>`:

`story.js` → helpers/page UI → `sets.js` → `props.js` → `figure.js` → `room.js` → `photos.js` → composer (post-processing, with the contrast S-curve patch) → `env.js` → `updates.js` → `details.js` → `choice.js` → `fx.js` → overlays → the main `updateScene(ts)`.

It also inlines the editors (`editor.js` sound editor, `camed.js` camera editor, `fxed.js` effects studio), `engine.js` (the clip audio engine), `export.js` (MP4 export via mp4-muxer, own BT.709 conversion), and the sound clips from `ns2/audio/clips.json` as base64. `TOTAL` (page length in seconds), the "1:33" label and `aria-valuemax` are set here. `must(s, old, new)` replacements abort the build if the anchor text isn't found exactly once; keep anchors unique.

Output: `the-graveyard-shift-part2.html` (~6.6 MB) and `ns2_main_check.js` (the main script alone, for `node --check`).

Part 1 is built the same way by `buildns.py` from `ns/`. The 13th Floor by `build13.py` from `f13/`.

## Clocks (Part 2)

- **Page clock**: what the player shows. `0..RECAP_END` (7.6) is the recap of Part 1; after it, Part 2.
- **Part 2's own clock** `ts = page - OFF` (OFF = 5.6). Held moments ("inserts") run on this clock: the world holds still while my eyes move.
- **Beats clock** `t = warp(ts)`: `INSERTS = [[14.7, 1.6], [18.6, 4.35]]` (at beats 14.7 the look-round at the locked doors, at 18.6 the room look-round). `toNew(beat)` converts a beat to Part 2's clock; `END_ABS = toNew(END_CUT) + OFF`.
- Everything in the story (`story.js` constants, HZ segments, camera keys in `CAM_DEF`, sound clip times via `clip(...)`) is on the beats clock and maps automatically. Things written directly on Part 2's clock (`INSERT_KEYS`, `WALKS`, the walk-bob base `ts - 23.6`, `WALK_TS`, any `clip(..., rec=True)` at `ts + OFF`) must be shifted by hand when an insert changes length.

## story.js: the beats and captions

Named beats for everything (LIGHT_ON, VAULT0/1, CRASH, LOOK0/1, DOORS, ROOM_IN, SLAM, LOCKED, PHOTO, BAMS[], LOCKER0, LOCKER_SHUT, BURST, ENTER1, APPROACH0, AT_LOCKER, HUNCH0, GLANCE, NOTICE, AWAY0, RIGHT0/1 (to the shelves), BACK1, WALK0, AWAY1, RIP1/2, PUNCH, QUIET, WALKO (to the desk), FALL, TURN0, LOOKB, AT_BOX, LOOKRM, DESK0 + DESK_HITS[], LOCK0, LOCK1 + LOCK_HITS[[t, locker]], HEADME, END_CUT = LOCK1 + 2.5). `RFL`/`RTUBE_ON`/`RTUBE_LAST`: the room tube's flashes. Also:
- `CUES`: captions `{t, text, who?, wps?}` (narrator plain, `who:'me'` italic gold, `who:'phone'` green). Recap cues carry their own word timings `w`, duration `d` and `cut` (gone before the shot's cut). Part 2 cues are timed from the text at `wps` words/second. No recorded voice yet (`VO_CUES = []`).
- `CHAPTERS` (the player's chapter list), `FLICK` (lobby tube dropouts), `LFL` (the lobby flicker/restrike segments `[from, to, level]`), `POPS` (lights cutting off), `breathT(t)` (his breath period; the sound and his chest both use it).
- `mk_sound2.py` reads these constants by regex for the sound build; add any new beat name you need in sound to its `B = {...}` list (and list constants to the parse lines). The regex only reads plain numbers: a beat written as an expression (`END_CUT = LOCK1 + 2.5`, `HEADME = LOCK1 + 1.95`) must be derived in Python (mk_sound2 derives END_CUT; sound2_body defines HEADME).

## env.js: the camera

- `CAM_DEF`: groups of keys `[time, position, lookAt]`. The recap has one group per shot (no easing across a cut). Part 2's keys are beat-timed (mapped with `toNew + OFF`) and merged with `INSERT_KEYS` (Part 2's clock + OFF).
- `camPath`: Catmull-style path, then a **gaussian average** over ±0.4 s (σ≈0.16 s) of position and view direction, so moves flow. Inside `RUSH_ON`/`rushAt` windows the smoothing is bypassed (deliberate snaps: the jolt up out of the chair, the slam, a fall). Quick glances shorter than ~0.3 s get averaged away: give each glance a short hold (two keys).
- `sampleCam(ts)`: adds head bob (`RUNS` for running, `WALKS` for walking), roll bumps, landing jolt, door-shove lurches, flinches (`[time, strength]` list), door-hit flinches (first bang stronger), locker breathing, and the scared tremble near the end.
- `lensAt(t)`: field of view over time (wide while running, narrow when staring, push-ins on reveals, zooms on the exit), with a global 0.9x zoom-out factor after Part 1's held frame.
- `LOCK_EYE`: my eye inside the locker, behind the middle of the slits (can see from the doorway to the east shelves).

## updates.js: his motion and the world per frame

- **HZ segments** (the man's path): `{t0, t1, at:[x,z], face}` (stand, turn to a heading) or `{t0, t1, pts:[[x,z]...], ease:'walk'|'stop'|'go'|'io', back?}` (walk a path; `back:true` walks backwards facing the other way); `cut:true` jumps. A precompute carries the heading and the walk phase across segments so nothing snaps. Turning on the spot steps the feet (`TURN_STEP`, small steps) and takes `turnDur(angle)` (0.85–1.4 s).
- `hazAt(t)` gives position, heading, walk phase/weight; `updHaz(t)` builds the pose object `P` and calls `poseHaz(P)` (figure.js).
- **Pose parameters** (`poseHaz`): `phase, walk` (gait), `lean` (torso pitch forward), `dip` (body height), `bodyZ` (hips back), `knee`, `hip` (extra flex both legs), `headYaw/headPitch/headRoll`, `twist` (torso yaw), `hipTurn`, `armHang`, `aim` (head holds its aim against body sway), `reachL/reachR = [pitch, roll, elbow, weight, wrist]`. Arm pitch is relative to the torso: world forward angle = −(pitch + torsoTilt), torsoTilt ≈ 0.09 + lean. Elbow negative bends. Roll positive = arm out, negative = across the body. Joint heights: hip 1.03, knee 0.58, ankle 0.13; shoulder 1.65, elbow 1.29, wrist 0.96 (thigh/shin 0.45 m, upper arm 0.36, forearm 0.33).
- Look keys (`LOOKS`, `LOOKP`, `LOOKS2`) and arm keys (`MAD_RP/RE/LP/LE/TW`, `RAGE_*`) are eased with `keyed(K, t)` (smoothstep between keys; times must strictly increase).
- `updInside(t)`: all lights (lobby tube `tubeAt` + flicker/restrikes, corridor tubes with `popK` cut-offs, B-108 doorway spill `roomSpill` and fill `roomBounce`, torch, red stairwell light), doors (`b108At`, `farDoorAt`, `lockerAt`), the desk flip, falling photos (`updFalls`), the falling box (`updBox`), the storage-room desk smash (`updDesk`: items jump at each blow, lamp/phone/papers fly at the sweep, the mug falls; handles in `deskBits` from room.js), the lockers jolting when hit (`updLockerHits`), the room tube (`rflAt` → `roomTube`, `roomTubeB`, `roomTubeMat` glow).
- `_fig` (on `window.reel`) is the debug/test hook: `view(t, P, L, fov, hide, lit)` renders any time from any camera (lit = hemi intensity for inspection), `collide()` lists moments his body overlaps room furniture, `haz(t)`, `pose(t)`, `cam(t)`.

## Sets and props

`sets.js` (lobby, counter, B2 corridor, doors, tubes, materials, `std()`, `boxAt()`, decals), `props.js`, `room.js` (storage room B-108: walls, shelving with `shelf2G` pivot unit, lockers, desk, filing cabinet, mop bucket, boards and photos, the falling box, papers, the desk items in `deskBits`, the dead ceiling tube and its lights `roomTube`/`roomTubeB`), `photos.js` (3D-rendered staff photos, the key photo with "I'M SORRY"), `details.js` (dust particles lit by nearby lights, falling grit on hits, AO strips along walls, contact shadows under furniture and him, cobwebs, grime). `figure.js` is the hazmat suit: one skinned SDF-like mesh with bones (body, torso, head, shoulder/elbow/wrist, hip/knee/ankle), faceplate glass, stains (`setSuitClean`).

## Sound

- `ns2/sound.py` is generated: `mk_sound2.py` takes Part 1's `ns/sound.py` header (synth helpers, `drone`, `hum`, `metal_hit`, `rattle`, `sub_hit`, `rev_swell`, `horror_rise`, `panic_breath`, `verb`, `afar` ...) plus `sound2_body.py` (Part 2's clips).
- `clip(id, label, t0, signal, gainDb, pan=0, nd=False, card=False, rec=False)`. `t0` is on the beats clock (`rec=True`: page clock). `nd`: not ducked under narration (scares). `RAWC`: recap clips already at their final level (from `p1recap.py`, Part 1's own mix cut shot by shot).
- Mixing: non-recap clips summed, `fxScale` normalization, `tanh(1.35x)` soft clip, master `K = .95 / peak` (keep ≈1.8; the build prints the peak time and which clips make it). Writes `ns2/audio/clips.json` and a check mix `ns2/audio/check_mix.mp3` (measure RMS/peaks around a moment with numpy + ffmpeg).
- **Sound library** (recorded, free to reuse): `f13/el/raw/*.mp3`: braam, door_creak, fluoro (tube buzz), handle, heartbeat, heavy_steps, keys_lock, lift_close/open/ding, light_on (switch + tube strike), phone_buzz, riser, run (sprint + breath), scratch, shower, slam_lock (door slam, bolt, chain), steps_carpet, stinger, wet_steps, whispers; each with a `_2` take. `ns2/el/scream_1/2.mp3`. Use `cut(name, a, b)`, `speed(x, k)`, `loop_to(x, d)`, `raw(name)`.
- Footsteps: his boots from `ns2/audio/steps.json` (written by `gensteps2.cjs` from his walk phase; turn steps flagged `turn:1` and played softer); my steps from `run_t` / `WALK_TS`.
- The narration voices exist from Part 1 (ElevenLabs "Grandpa" narrator, the phone guard) but Part 2 has none until the user allows it.

## The page's database (artifact `db` capability)

- `notes`: `{created, done, t, text}`; the user's timed notes. Mark done with `update {done:true}` + `if_version`.
- `mix/timeline`: the saved sound mix `{clips:[{id,key,label,t,track,ln?}], lanes, v, updated}`. Migrate after each sound rebuild (`scripts/migrate_mix.py`).
- `votes` (the choice card answers), `sfxRequests` (sound requests from the library panel).

## Tests and tools (in `scripts/`, run from the project dir)

- `errs.cjs`: load the page, print page errors.
- `v2f.cjs` + `render2.sh NAME "times" "times"`: real-camera frames `p2_<t>.png` and contact sheets (`sheet2.py`, `PFX=p2_`).
- `dbgpose.cjs`: lit stills from any camera (`CAM=x,y,z LOOK=x,y,z FOV=..`, `TIMES=..`), frames `dp_<t>.png`.
- `coll.cjs`: collision report (must print `collisions: 0`).
- `gensteps2.cjs`: his footstep times (end time must cover the film).
- `p2_t.cjs` (in the project): full test: recap card, captions at set times, mix levels per scene, the choice card, collisions. Update its times when the film's length or beats move.
- `te_common.cjs`: Playwright setup (local three.js from `npmthree/`, mp4-muxer from `npmmux/`, fonts blocked); `chromium.launch` with the pre-installed browser.
