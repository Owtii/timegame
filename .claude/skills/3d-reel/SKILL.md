---
name: 3d-reel
description: Make and revise the user's first-person 3D story reels. Each is a vertical 9:16 film in one self-contained HTML page, published as a claude.ai artifact with timeline notes, a sound editor and library, a camera editor, an effects studio and a video export. Covers explainers (The Day the Phones Jammed) and horror shorts and series (The 13th Floor, The Graveyard Shift Part 1/2/3). Use when the user asks for a new reel, a new part, video ideas or a script; says "check notes"; gives feedback on animation, camera, light, sound, narration, captions or the choice card; or asks for a studio feature or an export setting. It holds their standing rules, everything they have asked for so far, the build and test pipeline, the sound library and the craft rules, so the first version comes out natural.
---

# 3D reels: rules, workflow and craft

The user directs short vertical films (9:16, one to two minutes) in first person:
- a real-event explainer;
- a one-minute scary story with a twist;
- a horror series where every part ends on a choice for the viewers.

Each film is a single HTML page (a three.js scene, captions, a clip-based sound mix, a Studio panel), published as a private claude.ai artifact and updated in place.

They review each version in the page itself, leave timed notes in its database, and come back with **"check notes"**. Each round, you:
1. Implement every open note well and keep everything else intact.
2. Look at the result and test it.
3. Publish to the same URL.
4. Carry their saved studio edits over.
5. Mark the notes done.
6. Report back briefly in plain words.

## Read first

| Before you… | Read |
|---|---|
| touch any code | `reference/system.md` (the engine) and `reference/projects.md` (each reel: URL, clocks, beats, what's settled) |
| animate anything (people, camera, light, transitions, captions, the choice card) | `reference/craft.md` |
| design a look, a set or a UI | `reference/style.md` |
| want the exact number: a timing, a distance, a colour, a light, a material, how much detail a room or prop needs | `reference/rules.md` (the house rules in numbers, with checklists to run before publishing) |
| suggest ideas, write a script, plan a series part | `reference/story.md` |
| make or mix sound | `reference/sound.md`, and the repository's `sounds/README.md` (every recorded file) |
| record or sync narration | `reference/narration.md` |
| build or change a studio tool | `reference/studios.md` |
| render, test, review, publish | `reference/testing.md` |
| want the user's exact words, or think a note contradicts an older one | `reference/feedback.md` (every request and note, all reels, plus their own mix edits) |

## The repository: the durable copy

**https://github.com/Owtii/skill-3d-reel** has:
- `skill/3d-reel/`: this skill.
- `sounds/`: every sound with an index: the ElevenLabs library with prompts, all narration takes, each reel's own clips as files, the mixes.
- `studios/`: the studio modules with notes on wiring.
- `projects/workspace/`: the full working tree. All sources, build and sound scripts, clip files and tests, laid out exactly as they were, so the builds run from there.
- `projects/user-data/`: snapshots of each reel's saved notes, mixes, camera keys and look.
- `reels/`: the built pages.

The session scratchpad is ephemeral. In a new session, clone the repository, copy `projects/workspace/` into the scratchpad, fetch three.js 0.128.0 (`npm pack three@0.128.0`, untar it into `npmthree/`) and mp4-muxer (into `npmmux/`), and work there. **Always re-read the artifact's database before changing a reel**: the user keeps editing it.

## Standing rules (the user's own words, keep them)

1. **No narration until they say so, and price it first.** "dont add voice narrator yet till, I give u the permission to do it. because I need to see first then generate to save credits." Build with captions only. When they ask for the voice, state the credit cost (about 900 per minute of narration) unless that same message already gave the go-ahead. Re-record single lines rather than whole takes.
2. **ElevenLabs credits.**
   - Quote the cost before generating any sound effect (about 100 credits per effect for two takes) and generate only on a yes.
   - Prefer the recorded library and synthesis, and say when no credits were used.
   - Never repeat a generation call to retry.
   - If the credits look wrong, the connector is on the wrong account, or a free account is blocked: tell them plainly and stop.
3. **Never show the player's hands or legs.** First person: the camera is the eyes, and objects react on their own.
4. **Footage from an earlier part keeps its own sound** (an opening or a recap). "dont add ur own sound effects."
5. **Their saved edits are theirs.** After every rebuild, carry them over: the sound mix (lanes, mutes, volumes, swapped sounds, sounds they added) with `scripts/migrate_mix.py`; camera keys; effect layers (re-time them if the film moved); and look settings. Say so in the report.
6. **Update in place.** Same artifact URL for every version. A new artifact only for a new reel or a new part. On a redeploy, omit `capabilities` so the stored ones carry over.
7. **"Dont change anything yet, give me suggestions" means suggestions only.** Give clear numbered options and wait. They answer like "use 2".
8. **Don't create pull requests** unless asked. Commit and push only to the branch you were given. Keep the git repo clean: the working project lives in the scratchpad, not the repo.
9. **The user's email is for identification only.** Never send it anywhere or write it into files.
10. **Never put ElevenLabs flow links into files or repositories.** Their URLs can carry sign-in tokens.

## How to act

- **Do the work without asking questions; the notes are the brief.** If a note is ambiguous, pick the reading that best serves the scene and say in one line how you read it.
- **Treat every note as "this looks or sounds wrong to a viewer".** Fix the cause, not just the symptom, and check that nothing else broke (see "Don't regress").
- **Give short progress updates** while working: a few words on what you're on. Long silent stretches get flagged ("why is it taking so long?"). Before a long job, say roughly how long it will take.
- **Look at your own output before publishing**: frames at every changed moment, from the real camera and a lit side view, plus the full test (`reference/testing.md`). A frame that technically works but reads oddly is a failure.
- **Report per note or request:** the timestamp, and what they'll see and hear now, in plain words. Also mention:
  - the new length, if it changed;
  - that their mix and edits were carried over;
  - that the notes are marked done;
  - whether credits were spent;
  - anything you couldn't test (for example a full 4K export on their machine).

  No code talk, no file names, no internals.
- **When something can't be done from here**, say so plainly and give their options. Examples: using their own graphics card from the cloud, a blocked ElevenLabs account, their browser-only imported sounds.

## The "check notes" loop

1. **Read the open notes** of the reel(s) they mean: `ArtifactData query` on `notes` with `where: [["done","==",false]]`. Each note is `{created, done, t, text}`, where `t` is the page time they paused at. Also look at `sfxRequests`, and at whether `mix/timeline`, `camera/keys`, `fx/layers` or `settings/look` changed since your last round (note their versions).
2. **Map page time to the story** with the reel's clocks (`reference/projects.md`). Inserts and recaps shift things.
3. **Look first.** Render frames around each `t` to see what they saw.
4. **Implement**, following `craft.md`, `style.md`, `rules.md` and `sound.md`:
   - story beats and captions: `story.js`;
   - camera: `env.js`;
   - the figure's motion: `updates.js`;
   - sets and props: `sets.js`, `room.js`, `props.js`;
   - sound: the reel's sound script;
   - the choice card: `choice.css` + `choice.js` (both).
5. **Rebuild and verify:** build, check, page errors; footsteps and sound if motion changed; collisions; frames; the full test. Keep the master gain steady (`reference/projects.md` has Part 2's exact commands).
6. **Bookkeeping:**
   - The length in the build, the label and the scrubber.
   - The test's times and the step generator's end.
   - The script text file.
   - The page's own words (lede, credit, chapter descriptions) when they no longer match.
7. **Back up** the module folder and build scripts (`ns2_vN_backup/`, `…_project_vN.tar.gz`).
8. **Publish** the built page to the same artifact URL.
9. **Migrate their edits:**
   - Read `mix/timeline` and run `scripts/migrate_mix.py <read.json> <out.json> <previous build's clips.json> [shift_at shift]`.
   - Check its report: their sounds and edits kept, nothing of theirs dropped.
   - Re-time effect layers and camera keys if the film moved.
10. **Write the migrated mix and mark the notes done** in one `ArtifactData batch`, each entry pinned with `if_version`.
11. **Report back** (see "How to act").

## A new reel

1. **Ideas:** offer 5–8 options with a hook line each, then wait for the pick (`story.md`).
2. **Script:** scenes with times, in the form Environment / Camera (POV) / Audio / Narrator / Transition. If they paste one, build theirs. Deliver it as a text file when asked.
3. **Fork the newest project.** Copy `ns2/` to a new folder and its build script, give the page its title, lede and credit, and keep the shell, studios, engine, export and choice card. Write the new beats and captions, sets, figures, camera and lights to the numbers and detail minimums in `rules.md`, so the first version already looks real.
4. **Sound:** synthesis plus the free library. ElevenLabs only after a priced yes. No narration yet: captions only.
5. **Look before publishing** (`testing.md`) and run the checklists in `rules.md`. Then publish as a **new** artifact with `capabilities` `db`, `downloads` and `user`, and send the link.
6. From then on, it's the notes loop.

A new part of a series follows the series rules in `story.md`: it opens on the earlier part's question put to the viewer, over that part's last seconds and its own sound (no "Previously" recap); the same places; one question at the end. Part 3 has notes in `projects.md`.

## What "good" means (their quality bar)

These come up again and again across 260 messages and notes (evidence in `feedback.md`; the numbers behind each one in `rules.md`):

1. **Smooth:** one continuous camera path, eased moves, transitions that read as transitions, no snaps, stops or sudden switches of focus.
2. **Natural:** people turn head first and step their feet round, look slowly with holds, are never fully still, duck under doors, never hop, slide or clip.
3. **Readable at a glance:** the important thing is lit, in frame, not hidden behind someone, and organised. Particles and diagrams say what they mean.
4. **Real, not "AI":** real-world sounds, real objects (iPhone, iOS, iMessage), true scale, storytelling words, matte UI without glossy glow.
5. **Restrained:** "a little bit", "not too much". Small shake, small zooms, soft glow, low grain, thin lines.
6. **Scary where it's scary, quiet where it's quiet:** clear horror cues on the weird moments, real silence between, the first bang the loudest.
7. **Detailed:** more detail in rooms, buildings and props; dust and grit; darker darks and brighter brights.
8. **Logical:** every action has a visible reason, people behave as a normal person would, and captions say exactly what's on screen.
9. **First person:** no hands, no legs.
10. **Paced:** the first 1 to 5 seconds hook (every reel and every part; a series part opens on the last part's question), no dead pauses, exact timing changes honoured to the tenth of a second, endings that cut to black.

## Don't regress (things already settled across the reels)

- **Turns:** never magic. The feet step round, big turns take longer, the head leads and the body follows.
- **Camera:** smooth and slow. Looks hold for a beat, look-rounds are even sweeps, no darting, rushes only where a snap is meant. Not too zoomed in (0.9x was asked once). Shake only on impacts.
- **Captions:** end before their cut or transition, match the picture, stay a little mysterious, and use the user's wording when they gave it. Colours: narrator white, me italic gold, phone green.
- **Sound:**
  - Real, matched to the action, timed to the frame. The first bang out of nowhere is the loudest.
  - Lights cut off with breaker sounds, a call cut off is a click and the long beep, a clock is a real tick.
  - Quiet moments are quiet, with no constant drone.
  - Horror cues are clear where things are weird. No jump-scare sound on a casual moment.
  - Breathing is the realistic models, kept low.
- **Light:** motivated and visible. Failing tubes flicker for meaning, the end is pitch black, held about 1 s. No unmotivated extra light.
- **Figures:**
  - One seamless body with real proportions: no robot joints, no parts poking through, never walking through furniture (run the collision check).
  - The face behind glass stays foggy and blurred everywhere it shows.
- **The choice card:** matte 3D keycaps, dark red and dark blue, text only, centred, "or" plain, one question, held long enough. The exported video draws the same card.
- **Narration:**
  - The same narrator within a series. Lines fit the picture phrase by phrase, with natural short pauses and key words on their beats.
  - Captions show one phrase at a time and words light up as spoken.
- **Their saved edits:** carried through every rebuild.
- **The studios keep working:** notes with history, look and text per section, export with correct blacks and a Cancel button, the sound editor with library and imports, the camera editor, the effects studio, phone playback after a tap.
- **Reel-specific settled choices:** the "What the user has settled" list for each reel in `projects.md`.

## Gotchas that cost time before

- **Wait loops:** never `pkill -f "node …"` and never `until ! pgrep -f …` or `while pgrep -f …`. They match your own shell and kill or hang it. Use `render2.sh` (it waits) or `run_in_background`.
- **Headless loads** need `GOTO_MS=240000`: the pages are 6–8 MB and the browser renders in software.
- **Saved camera keys:** a saved `camera/keys` replaces the built camera, so your camera change won't show. Read it first (`studios.md`).
- **Mix migration:** compare against the **previous build's** `clips.json`, not your last migration (that already contains their edits, so their swaps get lost). Carry `cap` on voice clips, or their captions vanish.
- **Sample rates:** the mix engine is 44.1 kHz and the narration tools are 48 kHz. A 48 kHz index into a 44.1 kHz stem looks like silence.
- **The mix peak:** a new loud clip can become the peak and turn everything down through the master gain. Check `peak at …` after every sound build.
- **Things on the story clock:** they must be shifted by hand when an insert or the opening changes length. Beat-keyed things shift on their own.
- **Building code:** a `// comment` dropped mid-line swallows the rest of the line; `const` helpers inside an IIFE above their definition throw; keyed arrays need strictly increasing times; a head yaw from a world target must be clamped (about ±1.3 rad).
- **Arms that glitch:** an IK target near full stretch flips the elbow, and a pose control switched on without easing jumps in one frame. `scripts/armprobe.cjs` finds both; `rules.md` has the limits.
- **Stale page text:** read the page's own text after a big change. Part 2's credit kept saying "no narration recorded yet" after the narration went in.

## Using agents (only when the user, or ultracode, asks for it)

- This machine has 4 CPUs and software WebGL. A workflow runs about 2 agents at a time, a page load takes about a minute, and agents that render and iterate take an hour or more. Say how long up front, and cut stages when the user is waiting.
- What worked:
  - Choreographers each in a private copy (`scripts/mkwork.sh NAME`), rendering and iterating.
  - Independent judges reading their sheets (two of three agreeing is enough).
  - An independent review of every note against fresh sheets (`review_render.sh`). Reviewers caught a head turned past what a neck can, zombie-straight arms, glowing grit and captions over the wrong shot.
- For design work, give agents a harness that renders in seconds (`scripts/cardlab/`), not the 3D page. The matte keycap card came from 3 designers and 2 judges in about 17 minutes.
- Give agents the exact constraints to keep (files, counts, times the sound reads). Tell them that motion they can't change is a root cause to report.
