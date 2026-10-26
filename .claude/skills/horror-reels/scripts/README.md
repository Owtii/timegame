# Helper scripts

Copies of the tools used to test and inspect the reels. Copy them into the project directory (the one holding `the-graveyard-shift-part2.html`, `ns2/`, `npmthree/`, `npmmux/`) and run them from there. They use the pre-installed Chromium through Playwright (`te_common.cjs`); three.js is served from a local copy in `npmthree/package/` (get it with `npm pack three@0.128.0` and untar if missing), mp4-muxer from `npmmux/package/`.

| Script | What it does |
|---|---|
| `errs.cjs` | Loads the page and prints page errors (`no errors` when clean). |
| `v2f.cjs` | `TIMES=a,b,c GOTO_MS=240000 node v2f.cjs`: real-camera frames `p2_<t>.png` (`DSF=2` for high-res). |
| `render2.sh` | `./render2.sh NAME "t1,t2,..." "t3,t4,..."`: two `v2f` batches in parallel, then contact sheets `NAME_sheet_a.png` / `NAME_sheet_b.png`. |
| `sheet2.py` | `PFX=p2_ python3 sheet2.py out.png COLS t1 t2 ...`: contact sheet of frames. |
| `dbgpose.cjs` | `CAM=x,y,z LOOK=x,y,z FOV=55 TIMES=... GOTO_MS=240000 node dbgpose.cjs`: lit stills from any camera, `dp_<t>.png`. Use it to see his pose clearly. |
| `coll.cjs` | `GOTO_MS=240000 node coll.cjs`: every moment he walks into furniture (must print `collisions: 0`). |
| `gensteps2.cjs` | `GOTO_MS=240000 node gensteps2.cjs`: his footstep times into `ns2/audio/steps.json` (turn steps flagged). Keep `end` past the film's last beat. |
| `mkwork.sh` | `./mkwork.sh NAME`: a private working copy `wk_NAME/` (own `ns2/`, everything else linked) for an agent to edit, build and render in without touching the main project. |
| `review_render.sh` | renders the review sheets into `review/` (grit, desk, lockers real + lit, continuity); edit its time lists for the beats being reviewed. |
| `migrate_mix.py` | `python3 migrate_mix.py <timeline read from the DB> <out.json> [<last migration>]`: carries the user's saved mix (lanes) onto a rebuilt `clips.json`. |

Never kill these with `pkill -f "node v2f.cjs"` and never wait on them with `until ! pgrep -f ...`: both patterns match your own shell.
