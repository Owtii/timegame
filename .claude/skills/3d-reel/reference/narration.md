# Narration: voices, credits, recording and sync

## The rule first

**No voice until the user says so.**
- "Dont use elevenlabs yet, just have only the background sound effects work… wait for my confirmation to do the narration voice because I might do some changes and it will save credits."
- "Dont add voice narrator yet till, I give u the permission to do it."

Build every new reel and part with captions only. When they say "bring the voice narrator in" or "use the same voice as…", price it first (see Credits) unless they already gave the go-ahead in that message. Then record.

## The voices so far

| Reel | Voice | Model | Notes |
|---|---|---|---|
| The Day the Phones Jammed | **Lee**, "Middle-Aged Australian Male" (narration) | ElevenLabs v4 | Their choice ("I want u to use elevenlabs v4, LEE - middle aged australian male"). Later they asked for a voice called Jarnathan "with a bit more emotion but not too much". The account was blocked then, so Lee stayed. Takes `lee1`, `lee2`. |
| The 13th Floor | **Spuds Oxley, "Grandpa"** | ElevenLabs v4 | They sent a sample ("I'll use the grandpa one voice"). He also whispers the closing notice to himself. Single lines were re-recorded (`hid`, `home`, `notice`, `phone`, `police`, `read`). |
| The Graveyard Shift, Part 1 | Grandpa as the narrator (voice id `NOpBlnGInO9m6vDvFkFC`); **Jonathan Bowen** as the morning guard on the phone (`Ufjib38uSsKFbrDM99ro`), played through a phone line | ElevenLabs v4 | "Use the same voice as the elevator voice guy, and for the phone use another voice but with a call effect voice". |
| The Graveyard Shift, Part 2 | Grandpa for every line, including my own words in the moment, spoken under the breath. The guard's warning is reused from Part 1's recording. | ElevenLabs v4 (`eleven_v4`) | One take of 17 lines, 1,344 credits. |

Keep a series on the same narrator. A phone voice is a different voice, filtered like a phone line (`phone_line` in `ns/sound.py`), with its own caption colour.

## Credits and the account

- **Price it and say the number before generating.**
  - About 900 credits per minute of narration: a 1-minute take cost 858 to 920.
  - About 200 for a short phone line, and about 100 per sound effect (two takes).
  - Part 1's full narration was about 2,110 credits (two narrator takes and two phone takes).
  - Part 2's was 1,344 for one take.
  - Use the tool's estimate option where it has one.
- **One take is usually enough.** Two takes doubles the cost; offer it, don't assume it. Re-record a single line rather than the whole take when only one line changes.
- **Never repeat a generation call to retry.** Each call starts and charges a new generation. A rate-limit (429) or a refusal isn't charged; report it and don't loop.
- **When credits look wrong, it's the account.**
  - The user once said "I have an account with 10000 credit you are using the wrong account". They reconnected the ElevenLabs connector, and the next call ran on the right workspace.
  - A free account can be blocked for speech: "Unusual activity has been detected on your account, so Free Tier access has been disabled… upgrade to a paid subscription". Only a paid plan fixes that.
  - Explain this plainly and stop. Don't keep trying.
- **Never put ElevenLabs flow links in files or the repository.** Their URLs can carry sign-in tokens. Name the flow by its id in chat if needed.

## Recording a take (the ElevenLabs connector)

1. Write all the lines into **one** script, in story order:
   - Separate lines with `[long pause]`.
   - Give each line a short delivery tag in brackets ("[low, serious]", "[whispering, confused]", "[softly]").
   - Write numbers the way they're spoken ("2:14 AM" is four spoken words; map them for the aligner).
2. Make a flow (`creative_create_flow`), then `creative_generate_speech` with the voice id and `eleven_v4`. Poll `creative_get_flow_run_status` until it's done. Download the take's audio and keep it in the project (e.g. `ns2/vo2/narr2_A.mp3`).
3. Listen-check by analysis: the take's length, the pauses found between lines, and the words recognised per line.

## Fitting the voice to the picture (Part 2's pipeline, `scripts/vo2.py` + `vo2lib.py`)

The user's complaint that shaped this: "the text with narrator and video is a bit weird and akward sometimes, like sometimes there is weird pauses and sometimes it doesnt fit really good."

1. **Split the take into its lines** at the long pauses (`segments`).
2. **Align the words** of each line (pocketsphinx through `align2`: each word's start and end).
3. **Cut each line into its phrases** at the commas, full stops and "…" (caption word indices). Cut in the quietest spot between the words.
4. **Place every phrase on the page clock**:
   - Give it a start time, or `(word, time)` to land a key word on its beat ("photo" as the beam comes back to the photo, "caught" as he freezes on it, "locked" as the lock turns).
   - Or `None` to follow the phrase before with a natural pause: about 0.16 s at a comma, 0.3 s at a full stop, 0.36 s at "…", with overrides per line.
   - Each line has a tempo (never past ~1.06x) and a "latest end" the script warns about.
5. **Re-align the finished line** and write `vo2.json` (start, word times, length, phrases) plus one audio file per line.
6. **Captions come one phrase at a time** (`buildChunks` in the build). A phrase over 7 words splits where the voice breathes. A caption stays up through short pauses (1 s or less) and goes away in long ones.

Map the picture first:
- `scripts/camtrack.cjs` writes where the camera looks every 0.1 s.
- The story's beat constants say what he does when.

Then anchor the phrases:
- A line starts as its action starts ("I didn't turn around" as I lurch up).
- A line ends before the picture moves on ("…just my desk thrown upside down" while the desk is still in view).
- When a line can't fit, **hold the shot a little longer** with camera keys rather than rushing the voice.

Check it with one frame per phrase before publishing (what is on screen while each phrase plays?). Use `scripts/vo_phrases.py`, which lists the pauses inside each placed line, and `scripts/chunks_sim.cjs`, which prints exactly what the captions will show.

## Pauses

- The voice takes come with long dramatic pauses (0.5–0.6 s at every comma). Over action they feel like dead air, so tighten them inside a line.
- Keep a longer pause only where the picture does something in it (the beam searching the wall).
- Keep at least ~0.3 s between two separate lines so they don't run together.
- The hook has no pause inside it: "make the hook now a little less long and make it fit the hook, because it has weird pause in between and at the end".
- A spoken recap needs time. Each line gets its own shot, long enough for the words and a breath (Part 2's recap grew from 7.6 to 9.85 s, before the question hook replaced it in v25).
- **A line written for the picture before it is recorded** (Part 2's hook, v26): the words on screen carry their planned times (`HOOK_Q`…`HOOK_Q4`), and the pictures are cut to them. When the take comes, place each phrase at its planned start (tempo up to about 1.1 if it runs long), then light the words from the alignment.
- **A line can leave the film without a new take.** Keep it in `vo2.py`'s LINES with its caption set to None, so the take still splits into the right number of lines; it is cut from nothing and placed nowhere. Renumber the captions of the lines after it (and `VLIFT`, which is keyed by caption).

## Mixing the voice

- The voice sits on top of a ducked room: three tiers (see `sound.md`).
- Raise whispered lines to the level of the rest.
- A line over loud action gets its own small lift, never the whole voice.
- Don't start a line on top of a big hit. Let the hit land and come in on its tail.
- Measure each line against everything under it (`scripts/vo_snr.py`), aiming for 6 dB or more.

## Captions and the voice

- Words light up as they're spoken (word times from the alignment).
- Colours: narrator white, me italic gold, phone green.
- In the sound editor each voice clip carries `cap` (its caption). Moving the clip moves its caption, and muting it hides the caption. Keep `cap` through every mix migration.
- If the user changes a line's words after recording, the recording no longer matches. Say so, and either re-record that one line (price it) or keep the old words.
