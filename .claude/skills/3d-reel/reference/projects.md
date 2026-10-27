# The reels so far

Always update a reel **in place**, at the same artifact URL. Never publish a separate artifact for a new version of an existing reel.

| Reel | Artifact | Length | Status | Workspace folder |
|---|---|---|---|---|
| Everyone Calls at Once (2D storyboard) | https://claude.ai/artifact/UtnAZWpJu6YGoPuDxfU3XG | 0:59 | First version; superseded by the 3D reel | `everyone-calls.html` (no database) |
| The Day the Phones Jammed | https://claude.ai/artifact/RN2HBbKnuBAkLfQKUfUGEC | 1:00 | Finished (explainer) | `phones-jammed-3d.html` (hand-edited page) + `vo/` (sound) |
| The 13th Floor | https://claude.ai/artifact/171jML4Snda7dxDHRjChNy | 1:14 | Finished and archived: don't touch unless asked | `f13/`, `build13.py` |
| The Graveyard Shift, Part 1 | https://claude.ai/artifact/SQrLWd74487d4TarLdRdj1 | 1:11 | Done; notes may still arrive | `ns/`, `buildns.py` |
| The Graveyard Shift, Part 2 (the RUN choice) | https://claude.ai/artifact/Ndam9Yzfit39RGc7iow9mB | 1:29 | Active (v28; the narration muted while the scenes are fixed; the hook's voice waits for credits) | `ns2/`, `buildns2.py`, `mk_sound2.py`, `sound2_body.py`, `p1recap.py` |
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
1. The narrated question (9.6 s, v27): "What would you do if someone was behind you…" over the moment Part 1 ended (his steps, his shadow climbing over the desk); it freezes as Part 1 ended; "…and you only had two options?"; the keys TURN AROUND (and find out) and RUN (and escape) rise; RUN is pressed: RUN CHOSEN / PART 2.
2. I vault the desk and sprint down the hall. Behind me my desk is thrown upside down. As I look back, far back in the flickering lobby a dark figure in his shape stands still; the lobby's tube blows and he's gone; the lights die toward me. I panic.
3. The doors are locked. I lock myself in the storage room B-108 and find an old photo of the man from the morning shift in that suit, "I'M SORRY" under it.
4. Bangs on the door. I hide in a locker. The door bursts and he comes in slowly.
5. He stops at my locker, then something beside it catches his eye (the photo). He backs away, then turns away looking round the room and crosses to the desk, still looking.
6. While he is looking, a box falls behind him. He stares, looks round, and smashes the desk, then yanks open one of the lockers across the room: empty.
7. His head turns slowly toward my locker as the exit stands open. Freeze before the faceplate is fully round. RUN FOR THE EXIT or STAY HIDDEN.

**Clocks (v28):**
- `RECAP_END = 9.6`: the opening. The live shot to `R_FREEZE` 2.9 (his shadow over the desk, the first question); the second question from 3.2; the keys at `HOOK_KEYS` 4.85 and 5.0; their sublabels light at `HOOK_SUB` 6.15 and 7.7; RUN pressed at `R_PICK` 8.45; the card gone by 9.45. The narrator's words and their planned times are `HOOK_Q` to `HOOK_Q4` in `story.js`; `HOOK_LAYOUT` in `choice.js` is the card measured off the page for the video.
- Part 2's own clock is `ts = page - OFF` with `OFF = RECAP_END - 2.0 = 7.6`.
- `INSERTS = [[7.0, 2.0], [14.7, 1.6], [18.6, 4.35]]`: the hold on the figure in the first look back (`SIL`, `SIL_D`; the tube's flicker in it `SIL_LIGHT`; when he is there on the beats' clock `SIL_FIG`, from 6.0 to just after the lobby's tube blows; where `SIL_AT`, behind the overturned desk; the lobby's light while he is there `SIL_DIM`), the look-round at the locked doors, the room look-round.
- So: page = beat + 7.6 before beat 7.0, beat + 9.6 between 7.0 and 14.7, beat + 11.2 between 14.7 and 18.6, and **beat + 15.55 after 18.6**. Recompute if the inserts change.
- On Part 2's own clock (shift by hand when an insert before them changes): `INSERT_KEYS` and `WALKS` in `env.js`, `WALK_TS` and the room's stop in `sound2_body.py`, the figure's sounds (`S0`, `SB`, `SG`).
- `TOTAL = 89.5` (1:29). The card holds 6.5 s after `END_CUT` (page 83.0).
- **Old notes:** notes written in v27 at page 20.1 or later are 0.6 s later than today's times (v27 added 2.6 s at 17.5; v28 adds 2.0 s at 14.6 instead). Notes written in v26 or before at page 14.6 or later are 2.0 s earlier than today's times. Notes written in v19–v24 are also 0.25 s later than v26's (the recap was 9.85 s; v25's opening was 5.6 s). Notes written before v19 used the 7.6 s recap: 2.25 s earlier than v19–v24's.

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
- The desk crash (page 13.2 since v26) is loud and sounds like a real desk going over. It has 0.4 s alone before "Behind me, I heard a crash" (13.6); my footsteps dip under it, and my heart starts pounding just after (v24).
- The desk sweep: his right hand reaches behind the things at the back of the desk and drags them off to his right, with the elbow comfortably bent, never at full stretch (v24: "his arms glitches").
- The locker: he turns off the desk (head first, feet stepping round), steps in, puts his hand on the handle and keeps it there as the door swings open toward him, then lets go and his arm drops. Then he steps back (v24: "he opens it weirdly with his arms").
- The frozen frame behind the question is blurred as softly as Part 1's (blur 40; v24).
- The opening is the user's own hook, narrated (v26), and since v27 it freezes as Part 1 ended: the first question over the live shot, the second once the first is gone, the keys, RUN pressed ("once the shadow is standing there, it freezes like on part 1. then the other questions goed away then the next question comes then the buttons, it presses run then the part 2 starts. with smooth animations"). Its sound stops dead on the freeze (Part 1's riser), then the low tone. The narrator's line is not recorded yet ("dont use credits yet"): about 120 credits a take, 2 takes, Grandpa's voice. Once they say go, place its phrases at the HOOK times (0.2, 1.3, 3.4, 5.4, 7.05) and light the words from the recording.
- The figure in the first look back (v28, the user's notes at 0:14.3 and 0:18.5): as I come round at the doors, far back in the lobby behind the overturned desk, a dark figure in his shape stands in the flicker of its tube, still, breathing. His own model in a dark matte skin the lobby's light still shades, the outline feathered, a faint dark haze round him, the lobby darker than it was (55%). A 2 s hold while I stare, pushing in. The tube blows in a last flash with him in it, then dark; its next flash (page 18.2) shows the lobby empty: a hit, a gasp, my eyes darting, panic. v27's flat black cutout under a bright light after the lights died was "very stupid and ugly": never that again.
- **The narration is out for now** (v28: "get the voice memo out for a moment till we fix every scenes"): `VOICE_ON = False` in `sound2_body.py` keeps the voice clips (and the guard's remembered warning) in the mix but muted, so no voice, captions or ducking; the user's saved mix has them muted too. Bring it back when the scenes are done: set `VOICE_ON = True`, unmute them in the saved mix, re-place the lines with `ns2/vo2.py` ("nobody was there…" now waits for the empty flash) and check them against the picture.
- Narration: Grandpa for everything, phrase-synced (see `narration.md`).

**Saved data:** their mix (the door burst muted with a stinger in its place, two heartbeats added, the respirator −7 dB), 83 done notes (mix version 23 after v28, the narration muted in it). No saved camera, effects or look.

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

If K moves noticeably, find the new peak clip and rebalance. If it still changes, (Part 2's opening has its own sound since v26; `p1recap.py` is kept for an opening made of an earlier part's own mix.)

**Bookkeeping when the length changes:**
- `TOTAL` in `buildns2.py` and `mk_sound2.py`, the length label ("1:29") and `aria-valuemax`.
- The test's times in `p2_t.cjs`, and `end` in `gensteps2.cjs`.
- The script file `The-Graveyard-Shift_Script_Part1-2.txt`.

## Part 3 (when the user asks)

- Start from Part 2's folder (`ns2/` to `ns3/`) and its scripts.
- The opening is Part 2's question asked by the narrator ("What would you do…") over the moment Part 2 ended, live; it freezes as Part 2 ended, the second question comes, the keys rise, the winning answer is pressed (<THE ANSWER> CHOSEN / PART 3), then straight in.
- Same places, same suit (dirtier), same narrator.
- Captions only until the user approves the narration.
- End on a new one-question choice.
- Before writing the script, ask which choice won (RUN FOR THE EXIT or STAY HIDDEN), or offer both outlines.
