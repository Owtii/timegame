---
name: horror-reels
description: Make and revise the user's first-person 3D horror reels (The Graveyard Shift Part 1/2/3, The 13th Floor) published as claude.ai artifacts. Use whenever the user says "check notes", asks for a new part or scene, or gives feedback on animation, camera, lighting or sound in these reels. Holds their standing rules, the notes-to-publish loop, how the reel engine works, and the craft rules learned from their feedback so animations come out natural the first time.
---

# Horror reels: rules, workflow and craft

The user directs a series of short vertical (9:16) first-person horror films. Each is a single self-contained HTML page (three.js scene + synthesized/recorded sound + captions + a choice card) published as a private claude.ai artifact. They review each version in the page itself, leave timed notes in the page's database, and come back with **"check notes"**. Your job each round: implement every open note well, keep everything else intact, test, publish to the same URL, migrate their saved sound mix, mark the notes done, and report back briefly.

Read `reference/system.md` before touching the code, `reference/craft.md` before animating anything, and skim `reference/feedback-log.md` to see what has already been asked (and fixed) so you never regress it.

## The projects

| Reel | Artifact | Status |
|---|---|---|
| The Graveyard Shift, Part 1 | https://claude.ai/artifact/SQrLWd74487d4TarLdRdj1 | done, notes may still arrive |
| The Graveyard Shift, Part 2 (the RUN choice) | https://claude.ai/artifact/Ndam9Yzfit39RGc7iow9mB | active (v16, 1:36) |
| The Graveyard Shift, Part 3 | not made yet | Part 2 ends on RUN FOR THE EXIT / STAY HIDDEN |
| The 13th Floor | archived | finished project, don't touch unless asked |

Always update an artifact **in place** (same URL). Never publish a separate artifact for a new version.

## Standing rules (the user's own words, keep them)

- **No narration until they say so.** "dont add voice narrator yet till, I give u the permission to do it. because I need to see first then generate to save credits." Captions only. When narration is wanted, give a credit estimate first.
- **ElevenLabs credits:** quote the cost before generating any sound effect (about 100 credits per effect, two takes) and only generate on a yes. Prefer the recorded library you already have (see system.md, "Sound library") and synthesis; say when no credits were used.
- **Never show the player's hands or legs.** First person, camera only.
- **The recap at the start of a part uses that part's predecessor's own sound mix.** "dont add ur own sound effects" to the recap.
- **Respect their saved sound mix.** They edit clip positions and lanes in the page's sound editor; after every sound rebuild, migrate their saved mix onto the new clips (keep their lanes, new clips unlaned) and say so.
- **Don't create pull requests** unless asked. Commit/push only to the branch you were given.
- The user's email is for identification only; never send it anywhere.
- Keep the git repo clean: the project lives in the session's scratchpad, not the repo (a stop hook complains about untracked files in the repo).

## How to act

- Do the work without asking questions; the notes are the brief. If a note is ambiguous, pick the reading that best serves the scene and say in one line how you read it.
- Treat every note as "this looks/sounds wrong to a viewer": fix the cause, not just the symptom, and check nothing else broke (see "Don't regress").
- Give short progress updates while working (a few words: what you're on). Long silent stretches get flagged.
- Look at your own output before publishing: render frames at the note's time, from the real camera **and** a lit side view (`dbgpose.cjs`), and fix what looks off. A frame that "technically works" but reads oddly (hands over the faceplate, a frog squat, a leg kicking up) is a failure.
- When you finish, report per note: the timestamp, what they'll see/hear now, in plain words. Mention the new length if it changed, that their mix was carried over, that notes are marked done, and whether credits were spent. No code talk.

## The "check notes" loop

1. **Read open notes** (Part 2 and Part 1):
   `ArtifactData query` on collection `notes` with `where: [["done","==",false]]`. Each note is `{created, done, t, text}`; `t` is the **page time** in seconds where they paused.
2. **Map page time to the scene** (Part 2): page = recap until `RECAP_END` (7.6); then Part 2's own clock `ts = page - OFF` (OFF 5.6) and the beats clock `warp(ts)` which freezes during `INSERTS`. With the current inserts `[[14.7,1.6],[18.6,4.35]]`: beats = page-5.6 below beats 14.7, page-7.2 between 14.7 and 18.6, page-11.55 from 18.6. Recompute if INSERTS change.
3. **Look first**: render frames around `t` (real camera + side view) to see what they saw.
4. **Implement** (story beats in `story.js`, camera in `env.js`, his motion in `updates.js`, props in `room.js`/`sets.js`, sound in `sound2_body.py`). Follow `reference/craft.md`.
5. **Rebuild and verify** (from the scratchpad project dir):
   ```
   python3 buildns2.py && node --check ns2_main_check.js && node errs.cjs
   GOTO_MS=240000 node gensteps2.cjs            # his footstep times (after any change to his motion)
   python3 mk_sound2.py && python3 ns2/sound.py   # sound clips; note the K it prints
   python3 buildns2.py                            # again, to embed the new sound
   GOTO_MS=240000 node coll.cjs                   # he must never walk into furniture
   ./render2.sh NAME "t1,t2,..." "t3,t4,..."      # contact sheets NAME_sheet_a/b.png
   GOTO_MS=240000 node p2_t.cjs                   # full test: captions, mix levels, card, collisions
   ```
   Keep the master gain K near 1.8. If it moves noticeably, find the new peak clip (sound.py prints it) and rebalance; if K still changes, rerun `python3 p1recap.py <K>` so the recap stays at Part 1's exact levels.
6. **Update the bookkeeping**: total length (`TOTAL` in `buildns2.py` and `mk_sound2.py`, the "1:36" label and `aria-valuemax`), test times in `p2_t.cjs` (captions and level windows are page times: page = beat + 11.55 after the room look-round), `end` in `gensteps2.cjs` (past the last beat), the script text `The-Graveyard-Shift_Script_Part1-2.txt`.
7. **Back up**: `cp -r ns2 ns2_vN_backup` plus the build scripts, and `graveyard-shift_part2_project_vN.tar.gz`.
8. **Publish** the built HTML to the same artifact URL (omit `capabilities` so the stored db/downloads/user declaration carries forward).
9. **Migrate the mix**: read `mix/timeline` (note its version), run `scripts/migrate_mix.py <read.json> <out.json> <last_migration.json>`, write it with `if_version`.
10. **Mark notes done**: `update {done:true}` with `if_version` for each, in the same batch as the mix write.
11. Report back (see "How to act").

## Don't regress (things the user already asked for)

- Turns are never magic: his feet step round with him; big turns take longer; the head leads, the body follows.
- Smooth everything: no snaps between segments; looks hold for a beat; camera moves through gaussian easing; rushes only where a snap is meant.
- The recap's captions end before each cut; the recap uses Part 1's sounds only.
- The first bang on the door is the loudest and hardest.
- Lights "cut off" with real breaker sounds; the lobby flicker shows the overturned desk.
- At the fallen box he does NOT pick anything up: he stares at it, looks round the room (head first, slow, holds), then smashes the desk (fists, a sweep, fists), then crosses to the lockers next to mine and hits them, one, then the one beside mine; his head comes round to my slits and it freezes. (No shelf-wrenching any more.)
- Before the far wall he goes right, to the shelves and boxes, and really looks them over (up, down at the boxes, leaning in, holds), then turns round looking over the room, then walks to the far wall.
- The room's dead ceiling tube catches for an instant at each blow (desk and lockers), hangs on stuttering after the last, and flares once more on the freeze frame so his faceplate reads.
- His breathing is the `respirator` model (in through the filter with a faint whistle, out through a fluttering rubber valve, wet, a low groan, in a small damped cavity), never the old pipe-echo hiss.
- Captions describe exactly what is on screen while they show, and stay a little mysterious ("something beside it made him freeze", not "he saw the photo").
- My breathing is the realistic `my_breath` model (uneven, gasps, held breath, shaky, grunts), never a looped hiss; my heart pounds loud when I'm scared.
- Exit glances at the end: two slow ones, not many fast ones. Room look-rounds: evenly paced sweeps with short holds, no quick high-to-low jumps.
- The ending freezes as his faceplate comes round to my slits, lit by the tube's last flare.
- Contrast: darker darks, brighter highlights, subtle dust (not snow), contact shadows.

## Gotchas that cost time before

- Never `pkill -f "node v2f.cjs"` and never `until ! pgrep -f ...` loops: the pattern matches your own shell and kills/hangs it.
- Headless page loads need `GOTO_MS=240000` (the page is ~6 MB).
- A `// comment` appended in the middle of a one-line edit swallows the rest of that line's code. Put comments on their own line or at the true end.
- `const` helpers used inside an IIFE above their definition throw a TDZ error; define small helpers locally.
- Keyed animation arrays must have strictly increasing times (duplicate times divide by zero and produce NaN poses).
- Anything on Part 2's own clock (`INSERT_KEYS`, `WALKS`, the walk-bob base, `WALK_TS` in sound, `s_stop_room`) must shift when an insert grows; beat-keyed things shift automatically.
- New props in his path: rerun `coll.cjs`. Moving the action out of the doorway light makes him unreadable; move the action into the light rather than adding fake light.
- Sound peaks: a new loud clip can become the mix peak and lower everything via K. Check `peak at ...` after every sound build.
- Python `ff()` calls run ffmpeg per call; thousands of tiny calls are slow but fine.

## Recovering the project in a new session

The scratchpad (with `ns2/`, `ns/`, `f13/`, backups) is ephemeral. If it's gone:
- `Artifact read` the artifact URL: for the owner it returns the full built page (all JS modules inline in one `<script>`, the sound clips as base64 in the embedded clips JSON). Small fixes can be made in that HTML directly and republished.
- A full rebuild needs the source tree (`ns2/*.js`, `buildns2.py`, `mk_sound2.py`, `sound2_body.py`, `p1recap.py`, Part 1's `ns/` and `ns/audio/vo*`, the ElevenLabs library `f13/el/raw/*.mp3`, `ns2/el/*.mp3`, local three.js in `npmthree/`). If the user wants rebuilds across sessions, offer to archive the source somewhere durable.
- The helper scripts in `scripts/` are copies of the testing/rendering tools; they run from the project directory.
