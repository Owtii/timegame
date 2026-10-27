# Helper scripts

These are copies of the tools used to build, test and inspect the reels. They run from the project workspace: the folder holding the built pages, `ns2/`, `npmthree/` and `npmmux/`. That folder is `projects/workspace/` in the repository, copied into the session's scratchpad. They use the pre-installed Chromium through Playwright (`te_common.cjs`). three.js is served from `npmthree/package/` (`npm pack three@0.128.0`, then untar) and mp4-muxer from `npmmux/package/`.

| Script | What it does |
|---|---|
| `te_common.cjs` | Shared Playwright setup: local copies of the CDN libraries, fonts blocked, a stand-in for the claude.ai runtime when asked. |
| `te_fonts.cjs` | The same setup, but with the reel's own fonts (Archivo, JetBrains Mono, from `cardlab/fonts`) served instead of blocked. Use it to judge any text on the picture: with fallback fonts, lines wrap differently. |
| `errs.cjs` | Loads the page and prints its errors (`no errors` when clean). |
| `v2f.cjs` | `TIMES=a,b,c GOTO_MS=240000 node v2f.cjs`: real-camera frames `p2_<t>.png` (`DSF=2` for high resolution). |
| `render2.sh` | `./render2.sh NAME "t1,t2,…" "t3,t4,…"`: two `v2f` batches in parallel, then contact sheets `NAME_sheet_a.png` / `NAME_sheet_b.png`. |
| `sheet2.py` | `PFX=p2_ python3 sheet2.py out.png COLS t1 t2 …`: a contact sheet of frames. |
| `dbgpose.cjs` | `CAM=x,y,z LOOK=x,y,z FOV=55 TIMES=… GOTO_MS=240000 node dbgpose.cjs`: lit stills from any camera, `dp_<t>.png`. Use it to see a pose clearly. |
| `projprobe.cjs` | `TIMES=…`: where he, the east lockers, an opened door's tips and the camera land on screen, so you know nothing the viewer needs is behind him. |
| `camtrack.cjs` | The camera's position, yaw, pitch, fov and where he is on screen every 0.1 s into `camtrack.json`: the beat map for narration sync. |
| `coll.cjs` | `GOTO_MS=240000 node coll.cjs`: every moment he walks into furniture (must print `collisions: 0`). |
| `armprobe.cjs` | `WIN="a,b;c,d" GOTO_MS=240000 node armprobe.cjs`: his fastest hand, elbow and joint motions and sharpest jolts over beat windows (finds elbow flips and one-frame jumps). |
| `gensteps2.cjs` | `GOTO_MS=240000 node gensteps2.cjs`: his footstep times into `ns2/audio/steps.json`, with turn steps flagged. Keep `end` past the film's last beat. |
| `chunks_sim.cjs` | Prints exactly what the captions show and when (one phrase at a time). |
| `vo2.py` + `vo2lib.py` | The narration placer (see `reference/narration.md`): splits the take, aligns the words, places each phrase on the page clock, writes `ns2/audio/vo2.json`. Needs pocketsphinx (`pip install --target pylib pocketsphinx`). |
| `vo_phrases.py` | The pauses inside each placed narration line. |
| `vo_snr.py` | Each narration line's level against everything under it (aim for 6 dB or more). |
| `migrate_mix.py` | `python3 migrate_mix.py <timeline read from the DB> <out.json> <previous build's clips.json> [shift_at shift]`: carries the user's saved mix onto a rebuilt `clips.json` (their lanes, mutes, volumes, trims, fades, pans, swapped sounds, moves and their own clips). |
| `mkwork.sh` | `./mkwork.sh NAME`: a private working copy `wk_NAME/` (its own `ns2/`, everything else linked) for an agent to edit, build and render in. |
| `review_render.sh` | Renders the review sheets into `review/` for an independent review. Edit its time lists for the beats being reviewed. |
| `p2_t.cjs` | Part 2's full test: the opening (the questions one after the other, the keys, RUN pressed), captions, sound editor, camera editor, offline mix levels per scene, the choice card, collisions, phone width. |
| `ns_t1.cjs` | Part 1's full test. |
| `cardlab/` | The choice card without the 3D page. `capbg.cjs` grabs the frozen frames without the cards; `mock.html` is the card markup over them with the real fonts (`fonts.css` + `fonts/`); `node cardlab/shot.cjs <dir>` renders `<dir>/card.css` in four states (`W=390` for phone width) in seconds. The shipped CSS is `choice.css`. |

Never stop these with `pkill -f "node v2f.cjs"`, and never wait on them with `until ! pgrep -f …`: both patterns match your own shell.
