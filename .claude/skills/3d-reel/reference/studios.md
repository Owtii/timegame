# The studios: tools the user adjusts the reels with

Every reel page has a **Studio** panel under the player. The user asked for each tool in it, one request at a time, so they could direct more precisely than chat allows. Keep all of them working in every new reel; they are part of the product, not extras.

| Tool | Asked for | Where the code is (repository `studios/`) | Saves to (page database) |
|---|---|---|---|
| Notes | "make a part where I can put notes on the exact timeline… I'll tell u read the notes" | in the player shell (`projects/workspace/phones-jammed-3d.html`, patched by `notes_patch.txt`). A copy is in `notes-look-export/` | `notes` collection |
| Look and Text | "adjust brightness and contrast etc… part for part… move the texts a little bit, change size" | player shell (copy in `notes-look-export/`) | `settings/look` |
| Export | "a download option for the video", then 24/30/60 fps, 1440p and 4K, motion blur, max quality, "uses my pc", Cancel, correct blacks | `export/export.js`, `export/renderframe.js` | (nothing; it downloads an MP4) |
| Sound editor and library | "a time line like on after effects with the sound effects placed under the video", then a library with icons, preview, drag, groups, import, resizable track heights | `sound-editor/editor.js/.css/.html`, `sound-editor/engine.js` | `mix/timeline`, `sfxRequests`; imported sounds in the browser's IndexedDB `reel13-sounds` |
| Camera editor | "a studio for the camera movements… with keyframes, like on AE" | `camera-editor/camed.js/.css/.html` | `camera/keys` |
| Effects studio | "a light and effects studio with blurring effects and masking with layers and vignette and much more effects like on after effects" | `effects-studio/fx.js` (the effects and render pass), `fxed.js` (the editor), `fx.css`, `fx.html` | `fx/layers` |
| Choice card and votes | the end question of a series part | `choice-card/choice.js`, `choice.css` | `votes` |

Shared styling for the editors: `shared/studio.css`. The newest version of every module is the one in Part 2's folder (`projects/workspace/ns2/`); the copies in `studios/` are that version.

## How a studio gets into a page

The build script (`buildns2.py` and its siblings) takes the player shell page and splices in the reel's own modules plus the studio modules:
- The editors' HTML goes after the player.
- Their CSS is appended to the page's style.
- Their JS is inlined in the one main script, after the scene code, because the editors call into the scene: `reel.seek`, `CAM`, `CUES`, `TOTAL`.
- The clip library goes in as base64 JSON: the reel's own sounds from `clips.json` and the ElevenLabs library from `f13/audio/el.json`.

The page declares the artifact capabilities `db` (shared database), `downloads` (the exported video) and `user` (who may write). On a redeploy, omit `capabilities` so the stored declaration carries over.

Who can do what: anyone who can open the page can play it. Saving notes and edits needs edit rights ("View only: you can't save changes" otherwise). The editors keep an unsaved draft in the browser so nothing is lost on a reload.

## Notes

- Pause anywhere and press **Note at 0:12.4**. That pins the note to that exact time. Then write what should change and save it.
- Open notes show as markers on the timeline and in a list, and clicking a time jumps there.
- Done notes fold into a **History** list with no timeline markers. The user asked for that: "if those notes are done make them just a history note and not show up on the timeline anymore".
- Each note is `{created, done, t, text}`. `t` is the **page time** in seconds. Read open notes with `ArtifactData query` where `done == false`, and mark them done with `update {done:true}` pinned to the version you read.

## Look and Text

- Sliders:
  - Look: brightness, contrast, saturation, warmth, tint, glow, vignette, grain.
  - Text: headline size and position, kicker size, caption size and position, label size.
- **Apply to** picks the part being changed: the whole reel, one chapter, or a custom range (start and end, or "use playhead"). The edges of a part blend over 0.3 s. Parts with their own settings show as gold bands under the timeline.
- Saved as `settings/look`: `{base:{...}, segs:[{id,label,t0,t1,adj:{...}}]}`. Read it before you change the grade in code, so you know what the user already tuned (see `feedback.md`).

## Export

- Settings:
  - Size: 720p, 1080p, 1440p, 4K (vertical).
  - Frame rate: 24, 30, 60.
  - Quality: Standard, High, Maximum.
  - Motion blur: Off, Natural, Strong.
  - Tone: "Video standard" or "Same as preview".
- **Quality:**
  - Every frame is drawn larger than the video and scaled down: 1×, 1.25× or 1.5×.
  - Motion blur averages extra samples, but only where something moves (about one sample per 2 px of movement, up to 16).
  - High and Maximum encode at a constant quality where the encoder allows it (H.264 quantizer 19 or 14), otherwise at a high bitrate. Sound is 48 kHz.
- **Speed:** the graphics card's own encoder is tried first ("make it when rendering it uses my pc"), then the browser's. A warning shows when the browser is rendering without hardware acceleration. **Cancel** stops a render.
- **Blacks:** "rendered in max quality now it's too dark the dark spots are almost pitch black". The fix was the export's own BT.709 conversion with correct video levels and gamma, so shadows keep their detail. "Video standard" is that conversion; "Same as preview" matches the screen exactly. "What does video standard mean?" was a fair question: explain it in one line in the UI.
- The exported video includes captions, the effects layers and the sound mix as saved.

## Sound editor and library

- **Full-screen and laid out like After Effects:**
  - The picture is on top, with the chapters and the story's captions as reference rows.
  - One timeline row (lane) per sound, colour-coded by kind: voice, score, Claude-made effect, ElevenLabs effect, the user's own sound.
  - An inspector for the selected clip.
- **Editing:**
  - Drag a clip to move it, or drag its edge to trim it.
  - Volume (dB), fade in and out, pan, mute (M), duplicate, delete, undo (Ctrl Z), snap.
  - Track heights can be resized one by one ("make the timeline bigger in y-as like individually the effects/scores a bit bigger").
- **Library:**
  - Every sound is a tile with an icon and a name.
  - Tap to listen, drag or press + to add it at the playhead.
  - Grouped by source: **ElevenLabs** (generated effects, with a switch between the two takes), **Made by Claude** (the film's own sounds in story order, effects and score), **Yours** (imported files).
  - "Missing a sound? Ask Claude" sends a request to `sfxRequests`. Check it in a notes round.
- **Imports live only in that browser** (IndexedDB `reel13-sounds`). They are never uploaded, so you can't read them, and they won't be in the repository.
- **Captions follow the voice clips.** A voice clip carries `cap: ['c', captionIndex]`; moving it moves its caption, and muting it hides the caption.
- **Saved mix** `mix/timeline`: `{clips:[{id,key,label,t,track,ln?,mute?,vol?,off?,len?,fi?,fo?,pan?,cap?}], lanes, v, updated}`.
  - Build clips have ids like `s_…`, `r1_…`, `v00`. Clips the user adds get random ids.
  - Swapping a clip's sound changes its `key` to a library sound.
- **Every sound rebuild must carry their mix over:** `scripts/migrate_mix.py <timeline read from the DB> <out.json> <the previous build's clips.json> [shift_at shift]`. It keeps their lanes, mutes, volumes, trims, fades, pans, swapped sounds and their own clips. It applies their moves relative to the new times and shifts their clips if the film moved. Then write the result pinned to the version you read.
- **Audio engine** (`engine.js`):
  - Web Audio with one gain per clip.
  - Buses: plain effects ducked under the voice, `nd` beds ducked less, `hard` hits never ducked, voice, and the choice card's sound.
  - A keep-alive so phones don't drop the sound. "Why on the phone I can't hear the audio?": iOS needs a tap to start audio, so the player shows "Tap for sound" and resumes after interruptions.

## Camera editor

- The camera is a list of keys per shot: a time, where the camera is, and a point it looks at. Between keys it follows a smooth curve, eased over ±0.4 s.
- The keys sit on a timeline like After Effects keyframes. The voice and story rows are shown for timing.
- **Pause and drag the picture to aim.** Shift-drag or W A S D Q E moves, scroll steps in or out, I adds a key, J/K jumps between keys, Delete removes one, Ctrl Z undoes.
- Changes are auto-keyed at the playhead and solved so the eased picture at that moment is exactly what you set.
- **A saved `camera/keys` document replaces the whole built camera** when its shot count matches. If the user has saved keys, your camera changes in code won't show. Read `camera/keys` before camera work, apply the change to their keys as well (or migrate them), and tell them. Part 1 has saved keys (5 shots, 64 keys).

## Effects studio

- **Like an After Effects composition over the finished frame:**
  - A stack of layers, each one effect with its own in and out points, fades, opacity and blend mode.
  - Keyframed settings: a stopwatch per setting, and the interpolation can be chosen per key.
  - Masks: ellipse, rectangle and pen paths. They can be feathered, added, subtracted, intersected or inverted.
  - The layers run as one extra pass after the film's grade, in the player and in the export. Captions stay on top.
- **Effects:**
  - Blur and sharpen: gaussian, directional, radial (zoom/spin), sharpen.
  - Light: spot light, light leak, light rays, glow, lens flare, light flicker.
  - Colour: colour grade, duotone, levels, black and white, posterize, invert, vignette.
  - Stylize: film grain, chromatic aberration, glitch, VHS tape, mosaic, TV static.
  - Distort: mirror, lens distortion, camera shake, wave warp, zoom and rotate, bulge, twirl.
  - Generate and transition: solid/fade, gradient, fog, linear wipe, iris close, letterbox.
- **Presets** for horror: held frame, recap looks (washed out, tape, colour bleed, static), horror grade, dream blur, focus circle and focus blur, spotlight, found footage, flash to white, fade to black, impact shake, glitch hit, punch zoom, creeping fog, iris out, blink.
- Shortcuts: Space plays, J/K moves between keyframes, [ and ] set the layer's in and out, Ctrl D duplicates, Delete removes, G is the pen, \ compares with the effects off, Ctrl Z undoes, Ctrl S saves.
- **Saved layers are on the page clock.** When the film's timing changes (a cut, a longer recap), re-time the user's layers so they stay on their moments. It was done once for Part 1's face blur: "but why did his face changed at the end? it should stay blury".
- Some looks the user asked for are built into the scene rather than added as layers. Motion blur on the whole video when moving is a scene effect ("No, I want motion blur on the whole video when moving so it looks more smooth"). The face blur behind the faceplate is a scene effect too.

## The choice card and votes

- The question card at the end of a series part: matte keycaps, latched when picked. The design rules are in `craft.md`, and the design harness in `scripts/cardlab/`.
- A viewer's pick is saved in `votes`, and the card shows the result line ("You chose to stay hidden. Part 3 is coming soon.").
- The card is drawn twice: in CSS for the page, and in canvas for the exported video (`keycap()` in `choice.js`). Change both together.

## Building a new studio feature

- Ask what the user wants to do with it, in their words, then build the simplest version that does exactly that ("not too much unnecessary controls").
- It must save to the page's database (so you can read it), survive rebuilds (migrate it), work on a phone, and show in the export if it changes the picture or the sound.
- Test it headless (see `testing.md`). Say plainly what you could not test, for example a full-length 4K export or an encoder only their machine has.
