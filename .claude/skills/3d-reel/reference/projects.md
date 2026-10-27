# The reels so far

Always update a reel **in place**, at the same artifact URL. Never publish a separate artifact for a new version of an existing reel.

| Reel | Artifact | Length | Status | Workspace folder |
|---|---|---|---|---|
| Everyone Calls at Once (2D storyboard) | https://claude.ai/artifact/UtnAZWpJu6YGoPuDxfU3XG | 0:59 | First version; superseded by the 3D reel | `everyone-calls.html` (no database) |
| The Day the Phones Jammed | https://claude.ai/artifact/RN2HBbKnuBAkLfQKUfUGEC | 1:00 | Finished (explainer) | `phones-jammed-3d.html` (hand-edited page) + `vo/` (sound) |
| The 13th Floor | https://claude.ai/artifact/171jML4Snda7dxDHRjChNy | 1:14 | Finished and archived: don't touch unless asked | `f13/`, `build13.py` |
| The Graveyard Shift, Part 1 | https://claude.ai/artifact/SQrLWd74487d4TarLdRdj1 | 1:11 | Done; notes may still arrive | `ns/`, `buildns.py` |
| The Graveyard Shift, Part 2 (the RUN choice) | https://claude.ai/artifact/Ndam9Yzfit39RGc7iow9mB | 1:23 | Active (v25, narrated) | `ns2/`, `buildns2.py`, `mk_sound2.py`, `sound2_body.py`, `p1recap.py` |
| The Graveyard Shift, Part 3 | not made yet | | Part 2 ends on RUN FOR THE EXIT / STAY HIDDEN | start from `ns2/` |

## The Day the Phones Jammed

A 3D explainer about the August 23, 2011 Washington, D.C. earthquake: everyone called at once and the network jammed. It is in 9 chapters:
1. The hook (full signal, but the call won't connect).
2. August 23, 2011.
3. Everyone calls home.
4. Call failed.
5. Inside the tower: 10 lanes.
6. Built for a normal day: the scale.
7. Redial.
8. Text, don't call.
9. The ending.

- **Narrator:** Lee, ElevenLabs v4. The score is ElevenLabs music, and the phone sounds are the real network signals rebuilt in `vo/synth.py`.
- The page is the source: there's no module folder, so edit `phones-jammed-3d.html` directly. It's also the **player shell** every later reel is built from, so don't break its player or studio when editing it.
- **Saved data:** `settings/look` (the user's per-chapter look) and one done note.

## The 13th Floor

A one-minute scary story told in first person. Twelve floors, a late night, and the lift goes to 13: the same hallway, but every number starts with 13. His key fits 1304, his things are inside, and someone is in the shower. He runs back down to 12, home, and hides behind the bed with his phone. A notice from the building says the elevator is out of service. Then the bathroom light comes on, and cut to black.

- **Narrator:** Spuds Oxley "Grandpa", who whispers the notice himself. The score is short horror cues with silence between them.
- **Saved data:** their mix (`mix/timeline`, many edits: see `feedback.md`) and 25 done notes.
- Archived: "save this video as a older project". Rebuild only if the user asks.

## The Graveyard Shift, Part 1

First night on the night shift at a basement security counter. A man in a worn yellow hazmat suit walks in at 2:14 AM, works the hall, and stares when I ask if he's on the graveyard shift too. At 5:50 AM the morning guard calls: nobody else works there… don't look at— The line dies. A shadow comes up behind my chair. Freeze, and the question: TURN AROUND or RUN.

- **Narrator:** Grandpa. The guard is Jonathan Bowen through a phone line.
- **Hook:** "Everyone warned me about the night shift. Nobody warned me about my coworker."
- **Saved data:** their mix, their camera keys (`camera/keys`, which replace the built camera), 37 done notes.
- **Test:** `ns_t1.cjs`.
- The card's result line still says "Part 2 is coming soon." Update it only if the user asks.

## The Graveyard Shift, Part 2

The RUN choice:
1. The question hook (5.6 s, v25): Part 1's last seconds with its own sound, "What would you do if someone was behind you… and you only had two options?", the keys TURN AROUND (and find out) and RUN (and escape), RUN pressed.
2. I vault the desk and sprint down the hall. Behind me my desk is thrown upside down and the lights die.
3. The doors are locked. I lock myself in the storage room B-108 and find an old photo of the man from the morning shift in that suit, "I'M SORRY" under it.
4. Bangs on the door. I hide in a locker. The door bursts and he comes in slowly.
5. He stops at my locker, then something beside it catches his eye (the photo). He backs away, then turns away looking round the room and crosses to the desk, still looking.
6. While he is looking, a box falls behind him. He stares, looks round, and smashes the desk, then yanks open one of the lockers across the room: empty.
7. His head turns slowly toward my locker as the exit stands open. Freeze before the faceplate is fully round. RUN FOR THE EXIT or STAY HIDDEN.

**Clocks (v25):**
- `RECAP_END = 5.6`: the opening. Part 1's last seconds run 0 to `R_FREEZE` 2.05 (Part 1's 62.8 to 64.85), the question card holds to the pick at `R_PICK` 4.5. These must match `p1recap.py` SHOTS. The question's word times are `HOOK_Q`, `HOOK_Q2` and `HOOK_SUB` in `story.js`.
- Part 2's own clock is `ts = page - OFF` with `OFF = RECAP_END - 2.0 = 3.6`.
- `INSERTS = [[14.7, 1.6], [18.6, 4.35]]`: the look-round at the locked doors and the room look-round.
- So: page = beat + 3.6 before beat 14.7, beat + 5.2 between 14.7 and 18.6, and **beat + 9.55 after 18.6**. Recompute if the inserts change.
- `TOTAL = 83.5` (1:23). The card holds 6.5 s after `END_CUT` (page 77.0).
- **Notes written before v25 are 4.25 s later than today's times** (the recap was 9.85 s). Notes written before v19 used the 7.6 s recap: 2.25 s earlier than v19–v24's.

**Beats** (in `ns2/story.js`):
- The run and the room: LIGHT_ON, VAULT0/1, CRASH, LOOK0/1, DOORS, ROOM_IN, SLAM, LOCKED, PHOTO, BAMS[], LOCKER0, LOCKER_SHUT.
- His entrance and the locker: BURST, ENTER1, APPROACH0, AT_LOCKER, HUNCH0, GLANCE, NOTICE, AWAY0.
- The search: WALKO (he turns away from the photo looking round the room and crosses to the desk, still looking), FALL (while he is still looking), TURN0, LOOKB, AT_BOX, LOOKRM.
- The rage and the end: DESK0 + DESK_HITS[] (the two-hand slam, the sweep at DESK_SWEEP_AT), LOCK0, LOCK1 (at the east-wall lockers; `LOCK_HITS` is empty now, so no hammering), OPEN0/OPEN1 (the grab and the yank), LOOKIN, HEADME, END_CUT = LOCK1 + 2.45.
- The room tube's flashes: RFL, RTUBE_ON, RTUBE_LAST.

**What the user has settled** (don't regress):
- He never picks things up.
- At the box: stare, look round (head first, slow, holds), round on the desk, slam both hands on its edge, hang breathing, sweep it clear with one arm.
- Then he turns to the lockers on the east wall (right of my locker, across the room) and yanks one open: latch, creak, it bangs on its hinges, the tube flashes. It's empty. He steps straight back out of my line of sight and stares in, and his head turns slowly over his shoulder toward my locker. It freezes before the faceplate is fully round, and the question comes. No hammering on the lockers: the user cut it in v23 ("cut the part him hitting the lockers, and just make him open the locker").
- Never the lockers right beside mine.
- After the photo he backs away, then turns away looking round the room and crosses to the desk, still looking. The box falls while he is looking (v23: "make him look around and while he is doing the thing must fall"). The shelf search (v16–v22) and the far-wall act (cut in v22) are gone. Keep the narration gaps at the end short: the user has asked twice for a shorter ending.
- The dead ceiling tube catches at each blow, stutters after the last, and flares on the freeze.
- His breathing is the respirator model, kept low (the user lowered it 7 dB). My breathing is the realistic breath model, and my heart pounds when scared.
- Exit glances at the end: two slow ones.
- The desk crash (page 9.2 since v25) is loud and sounds like a real desk going over. It has 0.4 s alone before "Behind me, I heard a crash" (9.6); my footsteps dip under it, and my heart starts pounding just after (v24).
- The desk sweep: his right hand reaches behind the things at the back of the desk and drags them off to his right, with the elbow comfortably bent, never at full stretch (v24: "his arms glitches").
- The locker: he turns off the desk (head first, feet stepping round), steps in, puts his hand on the handle and keeps it there as the door swings open toward him, then lets go and his arm drops. Then he steps back (v24: "he opens it weirdly with his arms").
- The frozen frame behind the question is blurred as softly as Part 1's (blur 40; v24).
- The opening is the user's own hook (v25, "what would you do if someone was behind you, and you had only two options turn around and find out or run and escape"): Part 1's last seconds under that question, the keys, RUN pressed, straight into the run. Text only: they said "dont use credits yet". A narrated version (the narrator reading the question) needs their go-ahead and credits.
- Narration: Grandpa for everything, phrase-synced (see `narration.md`).

**Saved data:** their mix (the door burst muted with a stinger in its place, two heartbeats added, the respirator −7 dB), 81 done notes (mix version 20 after v25). No saved camera, effects or look.

**Build and test:**

```
python3 buildns2.py && node --check ns2_main_check.js && node errs.cjs
GOTO_MS=240000 node gensteps2.cjs                    # after any motion change
python3 mk_sound2.py && python3 ns2/sound.py          # note the K it prints (keep ≈1.8)
python3 ns2/vo2.py                                    # after any narration placement change
python3 buildns2.py                                   # again, to embed the new sound
GOTO_MS=240000 node coll.cjs                          # collisions: 0
./render2.sh NAME "t1,t2,…" "t3,t4,…"
GOTO_MS=240000 node p2_t.cjs
```

If K moves noticeably, find the new peak clip and rebalance. If it still changes, rerun `python3 p1recap.py <K>` so the opening stays at Part 1's exact levels.

**Bookkeeping when the length changes:**
- `TOTAL` in `buildns2.py` and `mk_sound2.py`, the length label ("1:23") and `aria-valuemax`.
- The test's times in `p2_t.cjs`, and `end` in `gensteps2.cjs`.
- The script file `The-Graveyard-Shift_Script_Part1-2.txt`.

## Part 3 (when the user asks)

- Start from Part 2's folder (`ns2/` to `ns3/`) and its scripts.
- The opening is Part 2's question put to the viewer, over Part 2's last seconds with Part 2's own mix (as `p1recap.py` does for Part 1): "What would you do…", the two keys with what each means, the picked answer pressed, then straight in.
- Same places, same suit (dirtier), same narrator.
- Captions only until the user approves the narration.
- End on a new one-question choice.
- Before writing the script, ask which choice won (RUN FOR THE EXIT or STAY HIDDEN), or offer both outlines.
