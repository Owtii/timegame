# Sound: what the user wants, the library, recipes and mixing

Sound came up in 50 of the user's 260 messages and notes, more than any visual topic except looks and turns. The index of every recorded file is in the repository's `sounds/README.md`.

## What they want from sound

- **Real-world sounds that match the action.** Each round they pushed further from "beeps":
  - "Not the weird claude sound effects."
  - "The buzz sounds should be a real world buzz or the declining sound should sound like a real phone that declines."
  - "The shaking sound effect sounds like a bag of glass, make it sound like a real ground shaking."
  - "Use a sound that really sounds a clock tick."
  - "Like a real locker door."
  - "Something that really that uses in real movies."
- **Every visible event has its sound, timed to the frame:** a key going into a lock and turning, a light switching on "when he almost says turned on", a lift chime, the doors, a phone buzz, his footsteps (regenerated from his walk after every motion change).
- **Loud where it's a shock, subtle where it's small.**
  - "The first bang should be very loud and hard."
  - "Make the banging on the door very loud and shocking."
  - But a ball dropping into a lane is "something subtle and not too loud. something that sounds like it goes in", and a ball on the scale should sound like a real ball and not be too loud.
- **Horror cues on the weird moments, and you must hear them clearly:**
  - "On the weird parts more scary sounds that you can hear clearly."
  - A build-up that rises and drops ("make a buildup sound effect and scary little bit zoomin in, then drop it").
  - A near-scream that cuts off on the reveal, a jump-scare sound when he's suddenly staring, a sound that "comes from behind".
- **Real silence in between.** "Dont have constant background sound going on, like I hear a constant noise. cut for quite things just dont use anything and have just the footsteps." The "weird alien sound is not scary".
- **Music that builds the scene.** "Use more background songs that builds up the scene", "a scary background that builds up from the moment when he is in his bed till the end", and at the end card "a scary horror background music… more like a one tone… to have the viewers attention".
- **No jump-scare sound when the moment should be casual** ("dont use jumpscare sound effect, make it more casual").
- **Balance.** "The sound effects are too loud and background music needs to be a little lower" (first reel). The narration must always be clear.
- **Their own mixes add the obvious cue at big moments and lower the beds.** See `feedback.md`, "What they changed by hand".

## The library (free to reuse, no credits)

In the repository under `sounds/`:

- **`sounds/elevenlabs-sfx/`**: 22 recorded effects made with ElevenLabs for The 13th Floor, 20 of them with two takes. The prompts are in `sounds/index.json`.
  - Lift: chime, doors open, doors close.
  - Room: flickering tube light, switch plus tube strike.
  - Steps: slow steps on carpet, panicked running with breath, heavy steps approaching, wet steps.
  - Door: keys and deadbolt, door creak, handle turning, door slam with bolt and chain.
  - Water: shower behind a door, shower off with pipes and drips.
  - Horror hits: jump-scare stinger, horror braam, tension riser, whispers, scratching.
  - Body: slow heartbeat. Phone: phone vibrating.

  Also two near-screams cut off (`scream_1/2`, Part 1's reveal) and one test sting.
- **`sounds/elevenlabs-sfx/phones-jammed/`**: the 12 short effects made for the explainer's first sound pass (buzz, click, crowd, fail tone, night, quake, slam, static, swoosh, thud, vibrate, whoosh). Most were later replaced by more realistic synthesis.
- **`sounds/music/`**: two takes of the ElevenLabs 60-second score for the explainer.
- **`sounds/made-by-claude/<reel>/`**: every clip each reel's sound build made, one file per clip with its name. Examples: "Tube light pops on", "The line drops: a click, then the long beep", "His breathing through the respirator".
- **`sounds/narration/`**: every voice take (see `narration.md`).
- **`sounds/mixes/`**: full mixes of each reel for reference.

In a build, pull library sounds with `raw(name)`, `cut(name, a, b)`, `speed(x, k)` and `loop_to(x, d)` (in `sound2_body.py`), or `el(name)` (Part 1's `ns/sound.py`). The sound editor's library (`f13/audio/el.json`, the same effects trimmed and named) lets the user drop them in themselves.

**New ElevenLabs effects cost credits: about 100 per effect for the two default takes.** Say the number and wait for a yes. Prefer the library and synthesis, and say when no credits were used. Never repeat a generation call to retry: each call starts and charges a new generation.

## Recipes that worked

**Phones and networks (explainer):**
- Rebuild the real signals rather than inventing beeps: US ringback, call-ended beeps, busy and fast-busy, the "all circuits are busy" tones (SIT), the emergency alert tone, and a modelled vibration motor on a desk.
- For a declined or failed call, use the real call-end sound.
- A ball going into a lane: a soft "slot in" thunk, quiet. Balls on the scale: real small balls (`ball_hit`), not loud.
- The quake: a deep ground rumble with rattling windows and creaking concrete (`ground_quake`), not a glassy shake.

**Horror rooms:**
- A fluorescent tube: hum and buzz, a pop-buzz as it strikes, flutter when failing.
- Lights cutting off: the buzz strains, then a breaker CHUNK, the hum dies in a falling whoomp, a spark, glass ticking. "Real light getting cut off."
- A light switching on: a switch click and a subtle electrical buzz rising, "like subtle electricity". Not a glow sound.
- A clock: a real tick-tock, subtle (`clock_tick`).
- A call cut off: a click and the long flat beep, with CALL ENDED shown on the phone.
- A phone voice: band-limited through a phone line (`phone_line`), with a little line static.

**Doors and metal:**
- A heavy door: slammed and slowed so it booms, with a metal rattle and a sub thump, in a room reverb.
- A real lock: the key going in, turning, the bolt.
- A locker: thin steel, latch, hinge, a tinny clang. Fists on the locker next to mine are the loudest hits of the ending: a steel bang, a tinny ring, the louvres buzzing, my own door rattling.
- Bangs on a door (`bam`): the first the hardest, and they keep going after I'm hidden.

**Bodies:**
- My breathing, close to the mic (`my_breath` with `breath_phases`):
  - Uneven cycles, sometimes with voice in them.
  - A gasp at a shock, then held breath, then a shaky out-breath.
  - A catch of breath at each bang, grunts on effort, slowing down when safe.
  - Never a looped hiss.
- My heart: a recorded heartbeat, loud and fast when I'm scared and slowing as I calm. Heartbeats while hiding.
- His breathing through a respirator (`respirator`):
  - Air pulled through a filter (a faint whistle, the inlet valve ticking).
  - Pushed out through a rubber valve (a wet flutter, a heavy muffled puff, sometimes a groan), inside a small damped cavity.
  - Faster and heavier when he's angry. Keep it low in the mix: the user cut it by 7 to 13 dB.
- His boots: heavy rubber boots on concrete, loud. Turning steps are softer. No squeak.
- Steps behind a door: slow and wet, at a steady pace.

**Breakage:**
- A desk going over: lots of noise (the frame groaning, the slam, everything on it scattering).
- A desk smash: a heavy wooden thump with things jumping on it.
- The sweep: a whoosh, the lamp smashing (shade, bulb pop), the phone clattering, papers, and the mug breaking a moment later.

**Reveals and tension:**
- A reversed swell into a deep boom or braam.
- A build-up that rises and cuts dead into the drop (`build_up`, `horror_rise`).
- A near-scream cut off on the reveal (`scream_up`).
- Before he turns round, small sounds from left and right (a knock, something falling), then a squeak from behind.
- The question card: a held low tone (`question_tone`) under the card.

**Score (The 13th Floor):** short horror cues with silence in between:
- String tremolo, a low piano, brass hits and violin screeches (`f13/music2.py`: `trem`, `piano`, `low_cluster`, `braam`, `screech`, `reverse_swell`).
- A clock that speeds up while he hides.

## Mixing

- **One clip per sound**, placed on the story's clock with `clip(id, label, t0, signal, gainDb, pan, nd=False, card=False, rec=False)`. The page mixes them live in the audio engine, and the user can edit every one in the sound editor.
- **Master level:** the clips are summed, normalized (`fxScale`), soft-clipped (`tanh`), and given a master gain K = .95 / peak (Part 2 keeps K near 1.8).
  - A new loud clip can become the peak and turn every other sound down.
  - After each build, read the printed `peak at …` and the clips that make it.
- **Narration on top, in three tiers of ducking** (Part 2):
  - Plain effects dip 70% under the voice.
  - Beds (heart, boots, drones, breathing; `nd`) dip 60%.
  - Hard hits and stings (bams, burst, crash, light pops, strikes, locker hits) never dip.
  - The voice is mixed so its loudest word matches the biggest hits (`VPEAK` .36). A line over loud action gets its own lift of a couple of dB (`VLIFT`), never the whole voice.
- **A hit the narration names plays alone first.** Leave about 0.4 s between the impact and the voice. In Part 2 the desk crash lands at 13.45 and "Behind me, I heard a crash" starts at 13.85. If the voice sits on the hit, the hit sounds small.
- **Louder without moving the master:**
  - A hit's loudest instant must stay under the film's loudest moment (the first bang on the door). Otherwise K drops and every other sound gets quieter.
  - Make it louder where loudness is heard: denser (more saturation), longer in its body, and with the sounds under it dipped (footsteps for half a second, the heartbeat's first beat after it).
  - Compare clip loudness (the loudest 0.8 s), not settings: a long reverb tail can hide loudness, and the old crash was louder than its gain said.
- **Measure, don't guess:**
  - `scripts/vo_snr.py` gives each line's level against everything under it. Aim for 6 dB or more.
  - `check_mix.mp3` plus numpy gives RMS and peaks around a moment.
  - The test (`p2_t.cjs`) prints the levels per scene: recap, run, crash, bangs, rage, the quiet, the question, and the gap, which must be silence (−180 dB).
- **Sample rates:** the mix engine runs at 44.1 kHz (`vo/synth.py` SR), the narration tools at 48 kHz. Index stems with the right one.
- **After every sound rebuild, migrate the user's saved mix** (`scripts/migrate_mix.py`; see `studios.md`).

## Synthesis toolbox (where the "made by Claude" sounds come from)

- `projects/workspace/vo/synth.py` (explainer):
  - Phone signals: `ringback`, `busy`, `reorder_beep`, `call_end_beeps`, `sit`, `alert_tone`, `vibrate`, `speaker`, `relay`.
  - City and room: `rumble`, `ground_quake`, `crickets`, `traffic`, `hum`, `keytap`.
  - The lane and scale scenes: `ball_hit`, `tube_rise`, `latch`, `slot_in`, `seat`, `chime`, `swoosh`, `pop`, `clink`, `clack`, `slam`.
- `projects/workspace/f13/soundlib.py` (The 13th Floor):
  - The lift: `ding` (and a "wrong" ding), `lift_hum`, `lift_door`, `button`.
  - Doors and keys: `keys`, `key_in`, `lock_turn`, `creak`, `chain`.
  - The flat: `shower`, `muffle`, `pipe`, `switch`, `fluoro`, `room`.
  - The body: `step`, `beat`, `heart_times`, `breaths`.
  - Tension: `drone`, `boom`, `riser`, `whoosh`, `cluster`, `tick`, `rustle`.
- `projects/workspace/ns/sound.py` (Part 1, also the header of Part 2's sound build):
  - Space: `verb`, `ir`, `behind`, `afar`, `over_shoulder`.
  - The room: `hum`, `tube_pop`, `clock_tick(s)`, `failing`, `stare_buzz`, `room_tone`, `drip(s)`, `pipe_knocks`, `duct_pops`.
  - Doors, metal and objects: `metal_hit`, `clang`, `rattle`, `far_door`, `far_clank`, `fall_clatter`, `chair_creak`, `seat_creak`, `pen_writing`, `pen_roll`.
  - Him and me: `boot`, `respirator`, `panic_breath`, `close_breath`, `squeak_behind`.
  - The phone: `bell_ring`, `phone_line`, `static`, `line_drop`, `reader_beep`.
  - Tension: `heartbeat`, `sting`, `drone`, `rev_swell`, `scream_up`, `horror_rise`, `build_up`, `sub_hit`, `ring_out`, `time_rush`, `ffwd`, `question_tone`.
- `projects/workspace/sound2_body.py` (Part 2):
  - Steps: `shoe`, `steps_at`, `rec_steps` (recorded steps re-timed to his feet).
  - Hits and objects: `bam`, `creak`, `cutoff`, `tube_strike`, `wobble`, `rip`, `desk_hit`, `locker_hit`, `rtube`.
  - Breathing: `my_breath`, `breath_phases`, `respirator` (cycles and anger).
