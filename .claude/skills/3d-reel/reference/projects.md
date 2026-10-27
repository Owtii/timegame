# The reels so far

Always update a reel **in place**, at the same artifact URL. Never publish a separate artifact for a new version of an existing reel.

| Reel | Artifact | Length | Status | Workspace folder |
|---|---|---|---|---|
| Everyone Calls at Once (2D storyboard) | https://claude.ai/artifact/UtnAZWpJu6YGoPuDxfU3XG | 0:59 | First version; superseded by the 3D reel | `everyone-calls.html` (no database) |
| The Day the Phones Jammed | https://claude.ai/artifact/RN2HBbKnuBAkLfQKUfUGEC | 1:00 | Finished (explainer) | `phones-jammed-3d.html` (hand-edited page) + `vo/` (sound) |
| The 13th Floor | https://claude.ai/artifact/171jML4Snda7dxDHRjChNy | 1:14 | Finished and archived: don't touch unless asked | `f13/`, `build13.py` |
| The Graveyard Shift, Part 1 | https://claude.ai/artifact/SQrLWd74487d4TarLdRdj1 | 1:11 | Done; notes may still arrive | `ns/`, `buildns.py` |
| The Graveyard Shift, Part 2 (the RUN choice) | https://claude.ai/artifact/Ndam9Yzfit39RGc7iow9mB | 1:28 | Active (v32; the narration rewritten, shown as captions until it is recorded) | `ns2/`, `buildns2.py`, `mk_sound2.py`, `sound2_body.py`, `p1recap.py` |
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
1. The narrated question (9.6 s, v27): "What would you do if someone was behind you…" over the moment Part 1 ended (his steps, his shadow climbing over the desk); it freezes as Part 1 ended; the card rises, "You only had two options?" over the keys TURN AROUND and RUN; RUN is pressed: RUN CHOSEN / PART 2.
2. I vault the desk and sprint down the hall. Behind me my desk is thrown upside down. As I look back, far back in the flickering lobby a dark figure in his shape stands still (a scare sting); every light goes out at once, pitch dark, and when they come back on he's gone. I panic.
3. The doors are locked. I lock myself in the storage room B-108 and find an old photo of the man from the morning shift in that suit, "I'M SORRY" under it.
4. Bangs on the door. I hide in a locker. The door bursts and he comes in slowly.
5. He stops at my locker, then something beside it catches his eye (the photo). He backs away, then turns away looking round the room and crosses to the desk, still looking.
6. While he is looking, a box falls behind him. He stares, looks round, and smashes the desk, then yanks open one of the lockers across the room: empty.
7. His head turns slowly toward my locker as the exit stands open. Freeze before the faceplate is fully round. RUN FOR THE EXIT or STAY HIDDEN.

**Clocks (v32):**
- `RECAP_END = 9.6`: the opening. The live shot to `R_FREEZE` 3.35 (his shadow over the desk; the question's first three phrases, `HOOK_LINES`); the card (`HOOK_HEAD` over the keys) at `HOOK_CARD` 4.5; the keys named at `HOOK_NAME` 6.05 and 6.8; RUN pressed at `R_PICK` 7.85; the card gone by 9.45. Behind the question: `HOOK_GLITCH` (when, how long, how hard) and `HOOK_DRIFT`. The narrator's whole line is `HOOK_SAY`; `HOOK_LAYOUT` and `CHOICE_LAYOUT` in `choice.js` are the cards measured off the page for the video.
- Part 2's own clock is `ts = page - OFF` with `OFF = RECAP_END - 2.0 = 7.6`.
- `INSERTS = [[7.0, 2.0], [9.4, -1.75], [14.7, 1.6], [18.6, 4.35]]`: the hold on the figure in the first look back (`SIL`, `SIL_D`; the tube's flicker in it `SIL_LIGHT` and `LFL`; when he is there on the beats' clock `SIL_FIG`, from 6.0 to just into the blackout; the blackout `DARK` = [7.5, 8.2] (page 17.1 to 17.8); where `SIL_AT`, in the open floor clear of the desk; how much taller `SIL_TALL`; how far his edges feather `SIL_FEATHER`; the lobby's light while he is there `SIL_DIM`), a cut (v30–v32: beats 9.4 to 11.15 skipped, so the look after he is gone is 1.5 s; a negative insert cuts, see `system.md`), the look-round at the locked doors, the room look-round.
- So: page = beat + 7.6 before beat 7.0, beat + 9.6 between 7.0 and 9.4, beats 9.4 to 11.15 are cut (they all land on page 19.0), beat + 7.85 between 11.15 and 14.7, beat + 9.45 between 14.7 and 18.6, and **beat + 13.8 after 18.6**. Recompute if the inserts change.
- On Part 2's own clock (shift by hand when an insert before them changes): `INSERT_KEYS` and `WALKS` in `env.js`, `WALK_TS` and the room's stop in `sound2_body.py`, the figure's sounds (`S0`, `SB`, `SG`).
- `TOTAL = 87.75` (1:28). The card holds 6.5 s after `END_CUT` (page 81.25).
- **Old notes:** notes written in v31 at page 19.0 or later are 0.5 s later than today's times; notes written in v30 at page 19.0 or later are 0.3 s earlier (v31 gave the look back 0.8 s, v32 took 0.5 s of it back). Notes written in v29 or before at page 21.05 or later are 1.75 s later than today's times (v30 cut 2.05 s at page 19.0, v31 gave 0.8 s back, v32 took 0.5 s again). Notes written in v27 at page 20.1 or later are 0.6 s later than today's times (v27 added 2.6 s at 17.5; v28 adds 2.0 s at 14.6 instead). Notes written in v26 or before at page 14.6 or later are 2.0 s earlier than today's times. Notes written in v19–v24 are also 0.25 s later than v26's (the recap was 9.85 s; v25's opening was 5.6 s). Notes written before v19 used the 7.6 s recap: 2.25 s earlier than v19–v24's.

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
- The opening is the user's own hook, narrated (v26); since v27 it freezes as Part 1 ended, and since v29 the question comes a phrase at a time with more context ("What would you do… if you were working alone at night… and someone was standing behind you?"), the end of it on a card over the keys (no sublabels), the frozen frame glitching, buzzing and drifting, and RUN CHOSEN / PART 2 held 1.2 s; since v30 the card says just "You only had two options?". Its sound stops dead on the freeze (Part 1's riser) on a short zap, then the low tone with a faint buzz. The narrator's line is not recorded yet ("dont use credits yet"): about 120 credits a take, 2 takes, Grandpa's voice. Once they say go, record `HOOK_SAY`, place its phrases at the times in `HOOK_LINES`, `HOOK_HEAD` and `HOOK_NAME` (0.2, 1.3, 2.88, 4.62, 6.05, 6.8) and light the words from the recording.
- The figure in the first look back (v28–v30, the user's notes at 0:14.3, 0:18.5, 0:15.1, 0:14.7, 0:16.3, 0:17.4 and 0:18.6): as I come round at the doors, far back in the open floor of the lobby (`SIL_AT` z −1.4, about 16.5 m from me), clear of the overturned desk, a figure in his shape, 15% taller, stands in the flicker of its tube, still, breathing. Near-black, his edges feathered like a mask in After Effects, the lobby much darker (its tube at 35%, the panels in front of him at 18%, every reflection dimmed), so you barely see him but his tall silhouette reads; his shadow pools on the floor at his feet. A scare sting as the camera lands on him (page 14.55). A hold while I stare, pushing in. Then every light goes out at once, the flashlight too (page 17.1): pitch black for 0.7 s. They come back on with a stutter, the lobby's first, then up the hall toward me: he is gone. A hit, a gasp, my eyes darting left and right for 1.5 s, then the doors (v30: "give it like 1-2 sec"). v27's flat black cutout under a bright light was "very stupid and ugly": never that again.
- **The narration was rewritten in v32** ("make the voice and text better so it wont, say all the time then this happens.. then, then, then"), and it isn't recorded yet ("yes do that but dont use credits yet"). The new words show as captions on the times they will be spoken at (`PLAN` in `ns2/vo2.py`, written to `vo2.json` as `planned`; the page reads them like recorded lines, so the words light at the narrator's pace). Only the unchanged first line ("I didn't turn around…") and the guard's warning still play from their recordings; the old take's other lines are kept in `LINES` with no caption. To record: one take of the 15 new lines (and the opening's question if they want it), about 1,000 credits (1,200 with the question); then place each phrase at its `PLAN` time (the pins: "went out" on the blackout, "locked" on the lock, "photo" on the beam, "came" as he steps in, "caught" on the photo), set those lines' captions in `LINES`, and drop `PLAN`. The script:
  1. "I didn't turn around. I grabbed the flashlight… and ran." (their own line, kept; still voiced)
  2. "Something crashed behind me." 3. "Someone was standing there." 4. "Every light went out… and he was gone."
  5. (me) "No… no, no… it's locked!" 6. "There was one door left… I locked myself in." 7. "Shelves. Old boxes. And on the wall… a photo."
  8. (me) "Wait… that's the guy from the morning shift. Why is he wearing that suit?" 9. "He'd found me. I hid in the only place I could… and held my breath."
  10. "The door gave way… and he came in. Slowly." 11. "His suit was stained now… dark red." 12. "He stopped… right in front of me."
  13. "But something else caught his eye…" 14. "Whoever he was looking for… he was losing patience." 15. (the guard, Part 1's recording) "…and do not look at—"
  16. "He knew. Someone was in here." 17. "The exit was wide open… if I ran now…"
- Narration: Grandpa for everything, phrase-synced (see `narration.md`).

**Saved data:** their mix (the door burst muted with a stinger in its place, two heartbeats added, the respirator −7 dB), 96 done notes (mix version 27 after v32: the old take's lines gone from it, the first line and the guard's warning on). No saved camera, effects or look.

**Build and test:**

```
python3 buildns2.py && node --check ns2_main_check.js && node errs.cjs
GOTO_MS=240000 node gensteps2.cjs                    # after any motion change
python3 mk_sound2.py && python3 ns2/sound.py          # K prints 1.765: held there (it only drops if the mix would clip)
python3 ns2/vo2.py                                    # after any narration placement change
python3 buildns2.py                                   # again, to embed the new sound
GOTO_MS=240000 node coll.cjs                          # collisions: 0
./render2.sh NAME "t1,t2,…" "t3,t4,…"
GOTO_MS=240000 node p2_t.cjs
```

If K moves noticeably, find the new peak clip and rebalance. If it still changes, (Part 2's opening has its own sound since v26; `p1recap.py` is kept for an opening made of an earlier part's own mix.)

**Bookkeeping when the length changes:**
- `TOTAL` in `buildns2.py` and `mk_sound2.py`, the length label ("1:28") and `aria-valuemax`.
- The test's times in `p2_t.cjs`, and `end` in `gensteps2.cjs`.
- The script file `The-Graveyard-Shift_Script_Part1-2.txt`.

## Part 3 (when the user asks)

- Start from Part 2's folder (`ns2/` to `ns3/`) and its scripts.
- The opening is Part 2's question asked by the narrator ("What would you do…") over the moment Part 2 ended, live; it freezes as Part 2 ended, the second question comes, the keys rise, the winning answer is pressed (<THE ANSWER> CHOSEN / PART 3), then straight in.
- Same places, same suit (dirtier), same narrator.
- Captions only until the user approves the narration.
- End on a new one-question choice.
- Before writing the script, ask which choice won (RUN FOR THE EXIT or STAY HIDDEN), or offer both outlines.
