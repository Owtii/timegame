# Craft: how to make these reels look and sound right

Everything here comes from the user's notes (see feedback-log.md). Follow it by default; the user should not have to ask twice.

## The figure (the man in the hazmat suit)

**Nothing moves "magically".**
- Turning on the spot: his feet step round with him, in small steps; the feet barely leave the floor; no high leg swings. A big turn takes longer (about 0.7 s + 0.3 s per radian, 0.85–1.4 s).
- The head leads, the body follows a beat later. When he looks at something, his head turns first (slowly), then his shoulders and hips come round. He never looks out of the room's door unless the story says so.
- Looks are slow and natural, with a hold on each thing. "Too fast and robotic" is the most common complaint. A "quick look" still takes about a second and is smooth.
- He is never fully still: breathing (chest heave in time with the breathing sound), weight shifts, a little sway.
- He is taller than door frames: he ducks/hunches under them, head down, slow.

**Poses must read at a glance, from the actual camera.**
- Picking something up: a stoop (knees bent, back bent well over, one arm down), not a deep frog squat.
- Reading: the sheet held at chest height in both hands, head bowed over it. Hands up at the faceplate reads as covering his face.
- Throwing down: short wind-up at shoulder height, then down. Not an overhead swing.
- Arms straight out in front reads as a zombie. Keep elbows bent and arms close unless he's reaching for something.
- Every action needs a reason the viewer can see, but keep it simple: at the box he stares at what fell, looks round the room for whoever might be there, then breaks things. (A sheet-reading scene was tried and the user cut it: "he should not pick up things".)
- Breaking things: give each blow a clear target the viewer can see from the camera: fists down on the desk, an arm sweeping everything off it (lamp, phone, papers fly; the mug rolls off and breaks), fists again; then hitting the lockers next to mine (the search coming closer to me). Heavier breathing that speeds up. (A shelf-wrenching version was replaced: the user asked for desk and lockers.)
- "Really watching stuff": a look at something is a sequence with holds (up the shelf, down at the boxes, leaning in a little), 2+ seconds, not one glance.
- Moving between two close targets (two lockers): plant him between them and turn on the spot from one to the other. A short side-step walk swings his body to face the walking direction and the turn back takes over a second, so blows land mid-turn and the final head turn reads backwards.

**Physical sanity.**
- He never walks through furniture: run the collision check after any path change. Paths go around open drawers, buckets, boxes that fall during the scene.
- Feet don't slide: walk speed matches stride (`STRIDE`), and the walk phase carries across segments.
- Keep the important action in the light. If a spot is dark from the camera's view, move the action (or turn him toward the light) rather than adding an unmotivated lamp.
- Not too close to the camera: in the locker scene he stops about 1.2 m from the slits; a suit filling the frame reads as a wall. Hitting the lockers beside mine he stands ~0.85 m off their fronts (fists reach that far at full stretch), which keeps him ~1.1 m from my eye.
- Where the action happens relative to my hiding place matters to the user: he should be "busy with lockers somewhere right of the camera", at a distance, not right beside my locker on the left. Things the viewer must watch go in the band ~10–30° either side of straight ahead and 2–3 m away (from my locker: the south half of the room); frame him a little off-centre toward where he is so the room shows.
- Something he opens (a locker, a door) has to be visible from my locker, and seen as open. Before rendering, run `scripts/projprobe.cjs` to see where he and the target land on screen: in v18 the locker he yanked open sat right behind his body, and its door folded back where he blocked it. Then: swing it about 100° so it stands out of the row, give its inside a look of its own (bare, lighter steel, a stiffener channel; seen face-on, a door painted like the fronts reads as one more closed locker), let a little of the tube's light into the empty box, and have him step straight back from it (back-steps face where he came from, so step along his facing) so the opening and the door are clear of him.
- Check readability on the real camera at `DSF=2` with a brightened crop. The lit debug view (`dbgpose.cjs`) shows the pose, not whether he blocks what my eye needs to see.
- Geometry from inside my locker: anything near the locker wall is at a steep angle (30–45° left) and its impact point is hidden behind the locker's side; frame his head and shoulders, not the fists. Anyone facing the locker wall is also facing me, so his faceplate shows: make the final head turn a lift and a turn of 0.4+ rad toward my eye (which is below his head: pitch ~0.3 down).

## The camera (first person)

- Smooth, always. Moves ease through the gaussian smoothing; snaps only where a real jolt happens (getting up, a slam, a fall).
- Not too much looking around. Scared POV = a few slow glances with holds, plus a very slight tremble, not darting.
- Turning round fast while scared: still a smooth turn, ideally while backing up, so it reads as "backing up and looking behind".
- A quick glance needs a short hold or the smoothing erases it. But a string of short darting glances (high, then low, then across) reads as jerky: pace a look-round as even sweeps (about 120°/s, holds of 0.2–0.3 s), each next target near the last, never a big jump in height.
- Don't zoom too much. The user asked for a general 0.9x zoom-out; push-ins are small (a few degrees) and motivated (fear, focus, a reveal).
- Show the way out when it matters (the exit through the doorway: stairs, green EXIT sign), and zoom on it a little.
- Through locker slits: narrow gaps; the eye sits at the middle of the slits so the far shelves are visible.
- Camera shake: only a little, and only on impacts.
- Never show the player's hands or legs.
- Cliffhanger endings: freeze right before the reveal (his faceplate coming round to me), blur the background, then the question card.

## Light and look

- Contrast: dark spots darker, bright spots brighter (a luminance S-curve in the grade), on rooms, objects and people.
- Small details everywhere: fine dust drifting only where light hits it (not snow), grit falling on impacts, contact shadows under furniture and him, dark bands at the foot of walls, grime, cobwebs, papers on the floor that never z-fight.
- Debris must look random, never "organized": no lines or sheets of particles moving together. Spawn from a few crack points (clumps), mix kinds (heavy grit falling fast under gravity with drag, paint flakes fluttering, fine dust hanging and spreading), stagger the release (most at the impact, some trickling late), vary size and brightness per particle.
- Light tells the story: a failing tube that drops out; a tube jolted by a crash flares and stutters so the place is seen in flashes; dead tubes try to strike again; lights cut off one after another toward you. In the storage room the dead ceiling tube catches at each of his blows (`RFL`, `roomTube`), with a bounce light off the locker fronts (`roomTubeB`) so the side of him facing my locker isn't black, and it flares on the freeze frame.
- Check the side of him the camera sees: the doorway light hits his back when he faces the lockers, so near the lockers he is a black shape unless a motivated light (the tube, its bounce) reaches his front.
- Shadows sell entrances: going through a doorway darkens him; a shadow from behind reads as a human figure (an overlay, no extra light).
- Faces behind the faceplate: only barely visible, foggy; you can't tell if it's really a human face.

## Sound

- Realistic, "like in real movies": recorded effects layered (a door slammed, slowed so it booms; metal rattles; sub thumps), with reverb for space. Synthesis only to support.
- Hits that matter are loud and hard. The first bang out of nowhere is the hardest. Fists on the locker right beside mine are the loudest of the ending (thin steel bang, a tinny ring, louvres buzzing, my own door rattling).
- A desk smash: a heavy wooden thump with the frame jarring and things jumping on it; the sweep: a whoosh, the lamp smashing (shade, bulb pop), the phone clattering, papers; the mug breaking a moment later. Each dead-tube catch: a snap, its buzz for as long as it holds, a tick.
- Reveals: a reversed swell into a deep boom/braam; a build-up that rises and cuts dead into the drop.
- Lights cutting off: the tube's buzz strains and flutters, then a breaker CHUNK, the hum dying in a falling whoomp, a spark, glass ticking.
- A desk going over: lots of noise (frame groan, slam, everything on it scattering).
- Lockers: a real thin-steel door (latch, hinge, tinny clang).
- My breathing (close to the mic): use `my_breath` with a schedule from `breath_phases`: uneven cycles, in-breath hiss rising, rounder out-breath with sometimes voice in it; a gasp at a shock, then held breath, then a shaky out; a catch of breath at each bang; grunts on effort; slowing when safe. Never a regular looped hiss.
- My heart: recorded heartbeat, loud and fast whenever I'm scared (after the run, in the locker), slowing as I calm.
- His breathing through the respirator: use `respirator(d, seed, cycles, mad)`. A real mask sounds like air pulled through a filter (faint whistle, inlet valve tick) and pushed out through a rubber valve (a wet flutter, a heavy muffled puff, sometimes a groan), inside a small damped cavity. Avoid feedback combs/pipe echoes: they sound fake. Keep it present in quiet moments; ease it under big crashes so it doesn't become the mix peak.
- (Older description) His breathing in the hood: hollow, slow, deep, wet rattle and a low groan on the out-breath; heavier and faster as he gets angry; held when he's reading something.
- His boots: heavy and loud; turning steps softer.
- Scary call cut-off: a click and the long flat beep, and show "call ended".
- No jump-scare stinger when the moment should be casual; a near-scream that cuts off on the reveal when it should be a jump scare.
- Footsteps and sounds must match the picture exactly (regenerate step times after any motion change).
- The recap uses Part 1's own sounds only.

- Narration over the mix: the voice sits on top of a ducked room. Beds dip under it, the hits never do; when a line has to run over loud action (the run, the rattled doors, the bangs on the door), lift that line a couple of dB rather than the whole voice (a louder voice becomes the mix peak and turns every scare down). Measure, don't guess (`vo_snr.py`).
- Don't start a line on top of a big hit: let the hit land, come in on its tail (the recap's first line starts 0.1 s after the doors bang open, and that bang never dips).
- A spoken recap needs time: each line gets its own shot, long enough for the words plus a breath (the v19 recap grew from 7.6 to 9.85 s). Don't speed the narrator past ~1.06x; trim pauses inside a line instead.

## Story and captions

- The narrator tells it afterwards, plainly (white). What I say in the moment is italic gold (`who:'me'`). The guard's remembered warning is green (`who:'phone'`).
- Captions never linger past their shot's cut or onto a transition.
- A caption must match what the viewer sees while it is on screen (not describe what happens a few seconds later), and keep a little mystery: hint ("something beside it") rather than spell out.
- Lines are short and natural; the user rewrites lines they don't like ("this might be my chance", not "...like or just stay").
- Every part ends on a choice card with two options (dark red vs dark blue, text only, centred, "or" as plain text), drawn as clean matte 3D keycaps: solid colour, visible thickness, soft shadow, light from above. No glows, no glossy gradients, no pill shapes ("very ai design").
- The recap at the start: tiny "PREVIOUSLY / PART 1" tag, the earlier part's key shots, its own sound, its question with the picked answer.

## Before you publish, look

Render the moments you touched from the real camera, and from a lit side view (`dbgpose.cjs`) to see the body clearly. Ask: does this read instantly as what it's meant to be? Does anything snap, slide, clip, kick, or freeze? Is he lit? Is it smooth and slow enough? Then run the full test.
