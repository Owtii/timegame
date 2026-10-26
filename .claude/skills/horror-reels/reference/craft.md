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
- Breaking things: wrench the shelving out from the wall (it tips and slams back), boxes fall off; fists into the shelf; heavier breathing that speeds up.

**Physical sanity.**
- He never walks through furniture: run the collision check after any path change. Paths go around open drawers, buckets, boxes that fall during the scene.
- Feet don't slide: walk speed matches stride (`STRIDE`), and the walk phase carries across segments.
- Keep the important action in the light. If a spot is dark from the camera's view, move the action (or turn him toward the light) rather than adding an unmotivated lamp.
- Not too close to the camera: in the locker scene he stops about 1.2 m from the slits; a suit filling the frame reads as a wall.

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
- Light tells the story: a failing tube that drops out; a tube jolted by a crash flares and stutters so the place is seen in flashes; dead tubes try to strike again; lights cut off one after another toward you.
- Shadows sell entrances: going through a doorway darkens him; a shadow from behind reads as a human figure (an overlay, no extra light).
- Faces behind the faceplate: only barely visible, foggy; you can't tell if it's really a human face.

## Sound

- Realistic, "like in real movies": recorded effects layered (a door slammed, slowed so it booms; metal rattles; sub thumps), with reverb for space. Synthesis only to support.
- Hits that matter are loud and hard. The first bang out of nowhere is the hardest.
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

## Story and captions

- The narrator tells it afterwards, plainly (white). What I say in the moment is italic gold (`who:'me'`). The guard's remembered warning is green (`who:'phone'`).
- Captions never linger past their shot's cut or onto a transition.
- A caption must match what the viewer sees while it is on screen (not describe what happens a few seconds later), and keep a little mystery: hint ("something beside it") rather than spell out.
- Lines are short and natural; the user rewrites lines they don't like ("this might be my chance", not "...like or just stay").
- Every part ends on a choice card with two options (dark red vs dark blue buttons, text only, centred, "or" as plain text).
- The recap at the start: tiny "PREVIOUSLY / PART 1" tag, the earlier part's key shots, its own sound, its question with the picked answer.

## Before you publish, look

Render the moments you touched from the real camera, and from a lit side view (`dbgpose.cjs`) to see the body clearly. Ask: does this read instantly as what it's meant to be? Does anything snap, slide, clip, kick, or freeze? Is he lit? Is it smooth and slow enough? Then run the full test.
