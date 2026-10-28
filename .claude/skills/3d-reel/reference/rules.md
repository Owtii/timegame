# Rules: how to animate, design, style and detail a reel

The house rules, in numbers. `craft.md` says what each kind of moment should feel like and why, and `style.md` describes the two looks. This file says **how fast, how much, what colour and how detailed**.

Every value comes from a version the user approved or from their notes:
- The Graveyard Shift Part 2 (v23) and Part 1 (v34);
- The 13th Floor;
- The Day the Phones Jammed.

The file named in brackets, under `projects/workspace/`, is a working example.

- **Use these numbers for the first version.** The user should never have to ask for any of this.
- **Their notes still win.** When a note moves a value, change it here too and say so in `feedback.md`.
- **Section 5 has the checklists.** Run them before you publish a new reel, a new part or a new scene.

## 1. Animation

### 1.1 Motion in general

- **Ease everything.** Nothing starts or stops at full speed. There are two exceptions: a blow landing (it arrives at speed and stops dead) and a hard cut.
- **The four eases** [ns2/updates.js `easeN`]:

| Ease | Shape | Use |
|---|---|---|
| `io` | smoothstep | short moves, looks, small object moves |
| `walk` | speeds up over the first 20%, cruises, slows over the last 20% | a walk from standing to standing |
| `stop` | 14% in, 20% out | a walk that arrives at something and stops |
| `go` | 20% in, no slow-down | a walk that flows straight into the next segment |

- **Keys never stop the motion.**
  - Keyed channels ease *through* their keys. Looks use smoothstep between keys (`keyed`); the desk and locker actions use monotone Hermite curves (`spk`).
  - Key times must strictly increase.
  - A key marked `hit` is reached accelerating and stops dead. That is how a blow lands.
- **Nothing is perfectly still and nothing is perfectly steady.** People breathe and sway, the camera drifts, and fluorescent tubes hum (1.4).
- **Real physics:**
  - Objects fall with gravity: a 1.7 m drop takes 0.6 s.
  - They bounce a little (5 cm, gone in 0.06 s) and settle.
  - Doors swing on their hinges and rock when they hit the stop.
  - Sliding papers slow down exponentially (time constant 0.18 s).

**Timings that read as natural.** Start here, then tune by eye.

| Moment | Duration |
|---|---|
| A figure's head look | 0.5–0.7 s per key for 20–50° (40–90°/s), with a near-hold every 2–3 keys |
| A "quick look" (figure or camera) | about 1 s in all, holding 0.2–0.3 s on the thing |
| A camera look-round | about 120°/s: turns of 0.4–0.55 s, holds of 0.25 s, each new target near the last |
| Turning on the spot | 0.85–1.4 s: 0.7 s plus 0.32 s per radian |
| A step, walking | 0.52 s for me (the camera); 0.6–0.7 s for the slow, heavy figure (1.4–1.7 steps a second) |
| A step, running | 0.26–0.33 s (3–3.85 steps a second) |
| A breath | 2.2 s calm, 1.7 s alarmed, 1.25 s raging, 1.4 s hiding |
| A flinch | 0.025 s in, 0.18–0.26 s out |
| An object knocked off a shelf | tips for 0.2 s, falls for 0.6 s |
| A door or locker yanked open | 0.3 s to 106°, then rocks for 0.3 s |
| Words lighting up | exactly when spoken (the narration's word times) |
| A caption's end | at least 0.1 s before its shot's cut |
| The choice card | held at least 4 s (Part 2 holds 6.5 s); the frozen frame behind it blurs over 0.75 s |
| Black at the end | at least 1 s |

### 1.2 The camera: first person, the camera is my eyes

**Height and aim**
- Eye height 1.6 m standing, 1.21–1.22 m sitting at a desk.
- Aim at a point about 2 m or more ahead. A look target closer than 1 m makes the smoothing swing.
- Never show my hands or legs. Never pass through walls or objects.

**Smoothing** [ns2/env.js `camPath`]
- Every shot is one path: a centripetal Catmull-Rom curve through the keys.
- The path is then averaged over ±0.4 s, position and view direction both: 9 samples weighted exp(−(x/0.22)²), σ ≈ 0.16 s.
- **Snaps** (getting up, a slam, a fall) go in marked rush windows that skip the averaging.
  - Ramp the skip in over 0.05 s and out over 0.3–0.5 s.
  - The averaging must never look past the start of a snap, or the camera drifts ahead of it.
- A glance needs a hold of at least 0.2 s, or the averaging erases it.

**Always-on life**, added on top of the path. Aim offsets are measured at the point 2 m ahead.

| Layer | Amount |
|---|---|
| Idle drift | up and down ±4 mm (1.55 rad/s); aim ±2 cm sideways (0.29 rad/s, ±0.6°) and ±1.5 cm up and down (0.37 rad/s) |
| Walking | a step every 0.52 s: down 16 mm per step, ±6 mm side to side (half rate), aim dips 2 cm, roll ±0.01 rad. Blend in and out over 0.3 s |
| Running | down 28 mm per step, ±12 mm sideways, aim dips 5 cm, roll ±0.02 rad. Scale it: 135% flat out, 12–45% while looking back over the shoulder |
| Hiding | breathing: ±2.8 mm up and down, aim ±4 mm, one breath every 1.4 s. Cut it by 80% while I hold my breath (he is right there) |
| Scared | the aim jitters 2–3 mm at 17–29 rad/s, faded in over about 2 s |

**Hits and jolts.** All have a fast attack and an exponential decay.

| Event | Move | Attack / decay |
|---|---|---|
| Landing from a vault | 7 cm down, aim 16 cm down, a shudder of ±8 mm at 70 rad/s | 0.02 s / 0.11 s |
| Shoving a door | 11 cm along the view; pulling back is 0.9 of that | 0.03 s / 0.15 s |
| A bang on my door | back 7.5 cm the first time (it comes from nowhere), 4.5 cm after that, with a buzz of ±6 mm at 60 rad/s | 0.025 s / 0.26 s |
| A blow across the room | back 7–12 mm, aim down twice that | 0.025 s / 0.18 s |
| A door bursting in | screen shake 0.004 | decays over 0.2 s |
| Hiding, constant unease | screen shake 0.0005 | steady |
| Getting up, stumbling | roll bumps of 0.05–0.17 rad | gaussian, 0.08–0.3 s wide |

**The lens**, vertical field of view [ns2/env.js `lensAt`]:

| Moment | FOV |
|---|---|
| Part 1's held last frame (sitting, tight) | 32° |
| Getting up and sprinting | 54°: it opens 22° over 0.75 s as I get up |
| Looking back, my eyes fixing on something (the overturned desk) | 50° narrowing to 34° over 1.6 s, held about 3 s, back in 0.65 s |
| Panicking at the locked doors | 58°: wide |
| Walking round a room with the flashlight | 54° |
| Leaning in to a photo | 3° narrower over 5 s |
| In the locker, eye right behind the slits | 62° |
| He comes right up to my locker | 70°: wider, so he doesn't fill the frame |
| Staring with him, fear building | 3–5° narrower over 1–2.5 s |
| Showing the way out | 18° narrower in 0.5 s, held about 1.2 s, back in 0.4 s. The biggest zoom, and motivated: it shows the exit |
| Everywhere | 0.9x: tan(fov/2) × 1/0.9, from the moment the film starts moving |

- Push-ins are small and motivated (fear, focus, a reveal). Never zoom on a casual moment.

**Composition**
- The thing to watch sits 10–30° either side of centre, 2–3 m away, and lit.
- A person never fills the frame unless that is the scare. In the locker he stops 1.2 m from the slits.
- Put the action on the right when the room allows ("he should be busy with lockers somewhere right of the camera").
- Show the exit when escaping matters.

### 1.3 People and figures

**The body.** These are the hazmat man's joint heights in metres [ns2/figure.js `J`].
- About 2 m tall in the suit.
  - Neck 1.79, shoulder 1.65, elbow 1.29, wrist 0.96.
  - Pelvis 1.07, hip 1.03, knee 0.58, ankle 0.13.
- The legs are about half his height ("no long body on short legs"), so keep the crotch high.
- Feet 27 cm apart.
- A slight stoop, always: the torso leans 0.09 rad forward (0.11 when walking).
- The arms hang a little out from the hips (0.1 rad), elbows always bent at least 0.26 rad. Straight arms read as a zombie.

**The walk** [figure.js `legAt`, `poseHaz`]
- **Stride 1.1 m (two steps).** The walk phase advances by distance ÷ stride, so the boots never slide.
- **Speed.** About 0.8 m/s on average and under 1 m/s at peak: slow, heavy, menacing. A normal walk is about 1.3 m/s. Go faster only when running.
- **The legs blend into the stride with speed**, reaching a full stride at 0.55 m/s: `walk = smooth(0.05, 0.55, speed)`.
- **Legs:**
  - The thigh swings ±0.3 rad.
  - The knee is 0.06 standing and up to 0.66 in the swing.
  - Heel strike −0.14 rad, push-off +0.26 rad.
- **Body:**
  - It rides 2.5 cm up and down per step, lowest as a heel lands.
  - It sways ±14 mm over the standing leg and rolls ±0.015 rad.
  - The hips turn ±0.05 rad and the shoulders turn back against them ±0.04 rad.
- **Arms:** they swing ±0.13 rad against the legs, stiffly in the suit. The elbow bends a little more on the forward swing.
- **Heading:** it follows the walking direction over 0.5 s, never in one frame.

**Turning**
- **On the spot:** `turnDur = clamp(0.7 + 0.32 × angle, 0.85, 1.4)` s.
  - The feet step round with him: 0.42 of a stride per radian.
  - The steps are small and barely leave the floor (walk weight 0.42).
- **The head leads:**
  - The head starts first.
  - The shoulders take 30% of the head's angle and the hips 8–10%.
  - The body's heading follows about 0.3 s later.
- **The head never turns past ±1.3–1.45 rad from the body (75–83°).** Clamp any turn toward a point in the world.
- **The head holds its aim** against the body's sway when he looks at something (`aim` 0.5–1).

**Never still**
- **Weight shift:** hip turn 0.035·sin(0.8t) + 0.02·sin(1.9t + 1) rad.
- **Sway:** lean 0.012·sin(0.6t + 2) rad; head roll 0.03·sin(0.9t + 0.4) rad.
- **Breathing:** each breath heaves the chest by 0.025 rad of lean and 6 mm of dip, in time with the breathing sound (both read `BREATH_T`).
  - 2.2 s calm, 1.7 s after a shock.
  - About 1.25 s raging, with up to twice the heave.
- **"Not moving" still keeps all of this**, at about half.

**Poses that read.** Values are added to the pose.

| Pose | Values |
|---|---|
| Ducking under a door frame | lean +0.34 rad, dip −6 cm, knees 0.24, hips 0.14, head down 0.14. In over 0.3 s; straighten over about 1 s past the frame |
| Peering in close, hunched | lean +0.24, dip −3.5 cm, knees +0.12, head pitch 0.14 → 0.28 |
| A curious head tilt | up to 0.46 rad (26°) on a held stare. An idle tilt stays under 0.03 rad |
| Slamming both hands on a desk | he rounds on it (0.75 s) and both hands land as the turn ends, the left 0.06 s before the right. He grips the edge and breathes 0.5 s, then one arm reaches across and sweeps the desk clear (about 0.5 s in all). He grips again, breathing, for 0.7 s, and pushes off over 0.5 s |
| Yanking a door open | the hand rises to the handle over about 0.85 s, yanks in 0.2 s and is back at the hip 0.3 s later. Lean in 0.12 rad, then step straight back out of my line of sight |

**Hands on things** (the arm IK, `armTo` in [ns2/updates.js])
- **A hand that touches something follows it:** the desk's top as he sweeps it, a door's handle as the door swings.
- **Keep every target within about 0.8 m of the shoulder.**
  - The IK never goes past 93% of the arm's reach.
  - A target near full stretch flips the elbow from one side to the other, and that reads as "his arms glitch".
- **A comfortable reach:** shoulder to knuckles 0.7–0.8 m, elbow bent 45–75°. Under 0.6 m the elbow folds into a wing.
  - When he leans over a desk his shoulder is above its front edge, so his hand works at the back of it, behind the things he sweeps off.
- **Lift slowly:** lift a hand off a surface low (about 10 cm) over 0.3 s, never a 17 cm flick in 0.2 s.
- **Let go before the thing gets away.** On a yanked door the hand stays on the handle for the pull, about the first third of the swing (0.1 s). Then it lets go, and the arm drops to hang over 0.25 s.
- **A door yanked open:**
  - it speeds up for 0.07 s as he pulls;
  - it swings at an even speed and bangs on its stop at 0.3 s;
  - then it rocks.

**Joins between moves** (where one-frame jumps come from)
- **A turn must finish inside its segment** (its `dur` no longer than the segment). A turn cut short hands the next segment a body still swinging round.
- **A walk sets off the way he already faces.** A step at an angle to his facing makes the body swing toward it and back.
- **Every switch that turns a pose control on eases in with its block's weight** (`P.aim = lerp(P.aim || 0, .5, w)`, never `P.aim = .5`). A bare assignment snaps the pose on that frame.
- **Head targets match the story.** A head turn left over from an older version (looking at the wrong lockers) shows as a glance that means nothing.
- **Check it with `armprobe.cjs`.** Outside a blow, no hand faster than about 4.5 m/s, no joint faster than about 15 rad/s, and no jolt spike standing alone. A blow landing is the only place a spike belongs.

**Never:**
- hopping, sliding feet, a turn without steps, or a body that turns before its head;
- an arm at full stretch, or a hand left hanging in the air where the thing it held used to be;
- arms straight out, flung arms, overhead double-fist slams, or jumping-jack sweeps;
- picking things up;
- walking through furniture (run the collision check after any path change);
- hands or boots poking through the suit, or a twitch.

- **A figure seen but not known** (v27–v29: "a dark figure like the hazmat suit with feather on the edges, and the room must be darker and matching with the hazmat suit guy"; "make him taller and the room must be much darker already and not too bright, so you can barely see him but because he is so dark and tall, you still see his silhoutte"):
  - Far back (v30: "make him also stand a bit farther away"): about 16.5 m from the camera, in the depth of the room. His own shape, taller than he is (115%), standing in the open, clear of every prop (v29: "not overlapping or standing in the desk, but infront of behind it"). Never flat black under a bright light: v27's cutout was "very stupid and ugly, make it really match everything".
  - Feathered the way After Effects feathers a mask (v29: "like on after effects you apply more feather it softens the edges more"): the scene renders with his skin writing only his shadow; a pass then draws him alone in near-black into a half-size target, blurs it (two 17-tap passes, reach about 1.2% of the frame's height) and lays it over the picture before the bloom and the grade, so he takes the film's look. A skin fading toward its outline (v28) isn't soft enough.
  - The room much darker while he is there: its light at about 38% (35% until v33: "make it a bit more visible the silhoutte by 7%"; raising the light behind him is what makes a silhouette more visible, measured as the difference between him and the same frame without him), the lights between him and the camera at 18%, and every material's environment reflections dimmed with them (in v28 they kept the room bright with the lights down).
  - Grounded: the floors take his shadow while he is there (they took none before), from the light behind him raised well above the ceiling for it (4.2 m), so the shadow pools at his feet and runs a little toward the camera instead of smearing across the floor. Through the light's death flash the light stays on him and the lights in front stay low, so the flash shows his shadow black on the floor.
  - Barely visible but readable: a dark silhouette against a slightly less dark room and a lit patch of floor.
  - A scare sting the moment the camera lands on him (v30: "make scary sound effect when seeing him"; see `sound.md`).
  - A hold while I stare (about 2 s, the world still, the light still flickering), pushing in slowly. Then every light goes out at once, pitch black, and when they come back on he is gone (v30: "he should dissapear if all lights are going out for a moment then back on, so it becomes pitch dark"; the blackout below). A hit as they come back, then panic: a gasp, panicked breathing, the eyes darting left and right for 1–2 s, then on (v30: "these seconds are too long looking once he is gone give it like 1-2 sec").
  - Compile his skins at load (once), so his first frame never stutters.

### 1.4 Light that moves

- **A working fluorescent tube is never steady.** Its level wobbles ±14%: 0.42 ± 0.06·sin(13.7t)·sin(5.1t).
- **A failing tube drops to black for 0.06–0.08 s**, no more than once every 3–4 s, and always for a reason.
- **A light dying** (a pop): ×2.4 for 0.05 s, ×0.3 for 0.04 s, ×1.2 for 0.04 s, then off. A row of lights dies one by one toward me, 0.7–0.8 s apart, each with its breaker sound.
- **A blackout** (v30, Part 2's `DARK`): every light out in the same frame, the flashlight in my hand too, the hemisphere and every material's environment reflections with them (`darkK`), so the frame is truly black (about 2% luminance) for 0.7 s. Coming back, each light runs a starter's stutter (`relK`: ×0.8 for 0.05 s, ×0.1 for 0.05 s, ×1.1 for 0.06 s, ×0.35 for 0.04 s, then on), staggered from the far end toward the camera (the lobby's tube first, the hall's 0.08 s + 0.05 s each, the torch at 0.12 s, the door bulb at 0.3 s). Whatever the blackout explains stays explained: he is gone, and a lamp that died in the dark stays dead.
- **A jolted tube flares and stutters** for about 1.4 s, then blows.
  - Bursts of 0.04–0.37 s at 1.25–1.55× the steady level.
  - Gaps of 0.04–0.07 s near zero.
- **A blown tube tries to strike again:** flashes of 0.03–0.2 s, 0.7–0.9 s apart, for about 2 s.
- **A figure glimpsed in a failing light** (v28): the far tube keeps flickering through the hold, dimmer than before (bursts of 0.25–0.36 s at 0.7–0.85 of its old level, gaps of 0.04–0.06 s); it blows in a last bright flash with him in it, and dark; its next try to strike shows the place empty. See **A figure seen but not known** in 1.3.
- **A dead tube catching at a blow:** 1.1× for 0.05 s, off for 0.05 s, 0.8× for 0.08–0.16 s, 0.05× for 0.06 s, 0.55× for 0.04 s.
  - After the last blow it hangs on, weak and stuttering.
  - It catches full once more on the freeze, so his faceplate reads.
- **A steady lamp** may dip 12% now and then (when sin(9.3t)·sin(3.1t) > 0.8).
- **A flashlight:**
  - It stutters once when grabbed (0.3× for 0.08 s).
  - It brightens 1.7× close up on what it inspects.
  - It dims a little on a wall right in front, because my eyes adjust.
- **The fixture follows its light.** The tube's own glow colour, its glow sprite (opacity 0.3–0.4 × level) and its pool on the floor (0.1–0.14 × level) all move with the light's level.

### 1.5 Text, UI and transitions

- **Captions:**
  - One phrase at a time; words light up as spoken (unspoken words at 42–45% opacity).
  - A caption ends at least 0.1 s before a cut or a transition.
- **Fades:** the film fades in from black over 0.25 s. At the end the picture holds and dims to 64% over 0.45 s under the question.
- **Keycaps:** a key presses in 0.07 s (ease-out) and its colours change over 0.2 s. A press scripted into a video is slower: 0.16 s, cubic-bezier(.3, .7, .4, 1).
- **3D words** (explainers):
  - They drop in letter by letter: 0.45 s each with a small overshoot (ease-out-back), 0.04–0.05 s apart.
  - They leave by shrinking over 0.3–0.7 s.
- **A blink:** two black lids just in front of the lens.
  - Each lid has a soft, curved edge: the last 12% of the lid, curving 7% across the frame.
  - Closed, each lid's solid part reaches 30% of the frame past the middle, so the corners shut too.
  - A blink can hide a cut.
- **A recap cut:** a 0.04–0.05 s flicker of black under a burst of static.
- **The opening question** (a series part, v27): each word lights where the narrator says it (until his line is recorded, at the times it will be placed at: about 3 words a second, a beat after each "…" and "?"); unlit words at 42%.
  - The first question over the live shot. On the freeze it drifts up 1.6% and fades in 0.25 s; the second rises 1.6% into its place over 0.4 s, starting only once the first is gone.
  - The keys rise one after the other, 0.15 s apart, each over 0.45 s from 3% lower and 96% size; OR comes with the second.
  - The press: 0.16 s; the other key dims over 0.25 s; ANSWER CHOSEN / PART N rises 1.2% over 0.4 s from 0.15 s after the press.
  - The card fades 0.75–1.0 s after the press; the picture comes back to life 0.4 s later.
  - All moves ease out (cubic). Every piece is placed in CSS and moved per frame by the same functions the video uses, so page and video match.
- **The end:** a hard cut to black, held at least 1 s, then the card.

## 2. Design

### 2.1 Real places at real scale

- **Build in metres, at true size.** Look up the real measurement before inventing one.

| Thing | Size used so far |
|---|---|
| Ceiling | 2.7 m in the corridor, 2.9 m in the lobby |
| Corridor | 2.5 m wide, 14 m long |
| Door leaf | 0.89 × 2.25 m. A plain doorway: 1.0 × 2.15 m |
| Locker | 0.44 wide × 1.85 tall × 0.45 deep, louvres near the top |
| Security counter | a raised front with a ledge; behind it a lower work surface where the guard sits, eyes at 1.22 m |
| Wall paint | a dark band up to 1.2 m, pale above |
| Suspended ceiling | 60 × 120 cm tiles |
| Vinyl floor tiles | 30 cm |
| Concrete floor | saw-cut joints every 2 m |
| The figure | about 2 m: taller than the doors, so he ducks |

- **Scale against each other.** People are smaller than cars, and doors are taller than people ("so everything is true to their sizes").
- **Every place has a purpose and a layout that makes sense for it.**
  - A security counter goes in a lobby, not a desk in a hallway.
  - A storage room has lockers, shelves and an old desk.
  - Ask: who built this, who uses it, and what would really be here?

### 2.2 What a place must contain

Build every place in five layers, in this order:
1. **Structure:** floor, walls, ceiling and openings, in real materials (4.3).
2. **Services:** light fixtures you can see, pipes on brackets, conduit, a vent grille, switches and outlets, a fire extinguisher and alarm, signs.
3. **Furniture** that fits the purpose.
4. **Things people left:** papers, boxes, a mug, a coat, a mop and bucket, a wet-floor sign.
5. **Time and history:** stains, scuffs, grime, cobwebs, and something broken or stopped (the clock at 3:14 with cracked glass, a drawer left open, a missing ceiling tile).

**Minimums**

| Place | At least |
|---|---|
| A room the camera spends 5 s or more in | 15–20 kinds of things (B-108 has about 20). Something on every wall. 3 or more traces of what happened there. 2 or more light sources you can see |
| A corridor | walls with a base band; light fixtures every 3–4 m; doors with frames, numbers and signs; a cable tray or pipes; grime at the foot of the walls; something at the far end (doors, an exit sign) |
| A building from outside | windows set back in recesses with frames and sills; bay windows; balconies with railings; a fire escape; drainpipes; a roof with a railing, a tank and vents; a lobby under a canopy; a street with lamps, trees, parked cars and neighbours. Thin trim; only the cornice is white |
| A street or city (explainer) | square buildings with about two-thirds of the windows lit, storefronts, lamps, trees, cars, roads with lanes and sidewalks |

For reference, the B-108 storage room has:
- two rows of lockers;
- steel shelving with archive boxes, loose files and a hose;
- old photos on cork boards and taped to the blocks;
- a filing cabinet with a drawer pulled out;
- an old desk with a dead lamp, a phone, papers and a mug;
- a mop in its bucket and a folded wet-floor sign;
- a fire extinguisher and its sign;
- pipes and a vent overhead;
- a clock over the door, stopped, with cracked glass;
- a light switch with its conduit;
- boxes and papers on the floor, stains and a drain;
- cobwebs in the top corners and a dead ceiling tube.

### 2.3 Props

- **Model the real product, part by part.** Write the parts list before you build. The desk phone:
  - a rounded base and a sloped key panel;
  - line keys with their lights, a backlit two-line display, 12 keys;
  - function keys, with a lit speaker key;
  - a speaker grille and an extension label;
  - a hook switch, a curved handset and a coiled cord.
- **Anything seen within 2 m gets three levels of detail:**
  1. a silhouette with rounded, bevelled edges;
  2. at least 5 distinct parts;
  3. a surface with labels, wear, and the light it gives off or catches.

  Past 4 m, the silhouette, the colour and 2–3 parts are enough.
- **No razor edges on anything hand-sized.** Bevel boxes with `roundBoxGeo`: a corner radius plus a bevel of up to 60% of it, and at most a quarter of the height. 3D text gets a bevel of 2.8% of its size.
- **Text in the world is readable and correct.**
  - Signs say real things: LEVEL B2, SECURITY, KEEP SHUT, B-108, EXIT.
  - Digits sit dead centre. The alarm clock has seven-segment digits with bevelled ends, its unlit segments faintly visible and a small AM/PM dot at the left.
- **Screens show real interfaces:**
  - iOS, with the real status bar, Dynamic Island and icons;
  - iMessage bubbles;
  - a CCTV monitor with a grainy green-grey picture and a timestamp;
  - a desk phone's display with the call's running time.
- **A prop that moves has its pivot where the real one would:** a hinge, or a box's front edge as it tips.

### 2.4 Figures

- **One seamless body.**
  - Build it as a distance field: round cones and ellipsoids melted together with a smooth minimum. Blend 0.02–0.12 m: wider at the torso, tighter at the fingers.
  - Mesh it once (a surface net with 3 relaxing passes), with normals from the field.
  - No separate parts and no visible joins: nothing like a robot or a doll.
- **Skin it softly.** Each vertex takes up to 4 bones, weighted by exp(−distance / 0.028 m), so the joints bend like cloth.
- **Build the arms held out** (0.36 rad) so they come away clean, and let the pose bring them down.
- **Paint it in layers, per vertex:**
  1. the base colour;
  2. fading and rubbing: palest where it rubs (thighs, knees, elbows) and bleached on top;
  3. grime: worst low down, in blotches and drips, with a few splashes;
  4. stains with ragged edges and thin runs;
  5. seams and tape.
- **The hazmat suit:**
  - Yellow (0.78, 0.64, 0.20), worn toward grey-beige (0.72, 0.67, 0.55).
  - Tape (0.5, 0.5, 0.47), seams (0.62, 0.55, 0.3), the dirt brown-black.
  - Old blood (0.30, 0.06, 0.045): dark red-brown, never bright red.
  - Part 1 has 5 small old stains. Part 2 adds 10 big dark ones and a spray of droplets, and the grime is 1.35x.
  - The hood is 85% scale, and the faceplate is a window in the same surface.
- **A face behind glass:**
  - Drawn on a 256 px canvas in layers blurred 13–20 px: a dim oval, two dark eye hollows and a dark mouth. No nose.
  - Fog patches lie over it.
  - It stays blurred in every shot.
- **The 13th Floor's shadow figure:** the same melted-shapes method. Tall and long-limbed but not skinny, almost still, with a tiny head tilt.
- **Faceless people** (explainer): real body proportions, in dark coats (charcoal, slate, deep teal).

### 2.5 UI on the picture

- **Fonts:**
  - Archivo for display (weight 800, 125% stretch, uppercase) and for body text;
  - JetBrains Mono for labels and timecodes (uppercase, tracking 0.12–0.3 em).
- **Page palette:** ink #0E1012, background #111316, panel #181B1F, line #3A4047, text #E9E4DA, muted #8C9399, accent #E9C98B.
- **Captions:**
  - Archivo 700 at 5–5.4% of the frame's width, line height 1.3, centred, with 7% side margins.
  - The top edge sits at 71% of the frame's height, clear of the platform buttons.
  - A dark text shadow, no box behind the words.
  - Narrator #E9E4DA; me italic #F6E2B4; phone italic #CFEADB.
- **The choice card.** `choice.css` draws it on the page and `keycap()` in `choice.js` draws it in the video, in the same colours (`CAP`). Sizes are in % of the frame's width.
  - **Question:** Archivo 800 at 8.6%, at most 86% wide, #ECE6DB, 6.6% over the keys.
  - **Keys** (v29: "make it 3d but not just ai design. think about the correct spacing, padding, centering, goood border radius, correct color grading, right font size, not too much shado apply correct shadow"): real keycaps under a light from above.
    - The face 34% × 15.4%, corners 2.4%; it stands on walls 1.1% wide at each side and 3.2% deep at the front (0.7% latched down), their corners 3.3% at the top and 3.6% at the foot, concentric with the face. 9% between the keys, "or" centred in the gap and on the faces.
    - The face is a shallow dish: a lit rim along the top (0.25%), darker in its upper half, turning lighter low down, a lit rim along the front edge (0.3%), its sides 12% darker toward the edges.
    - The walls are darker than the face: the front wall darkening to its foot, the side walls darker still.
    - Shadow: a tight contact shadow (0 0.3% 0.5%, 55% black), a soft one under it (0 1.4% 2.4% −0.6%, 45%) and a 0.1% hairline. Nothing else: no glow, no gloss.
    - Colours graded in even steps of OKLCH lightness (`scripts/cardlab/palette.py`; the prototype is `scripts/cardlab/keycap.html`): rims .54 and .515, dish .39 → .415 → .45, front wall .325 → .235, side walls .17; red hue 25 at chroma .128, blue hue 262 at .10, the chroma easing off in the walls. Red face #832625, blue face #2c4a82. Latched: each step .045 lighter. The other key dulled: lightness × .74, chroma × .3.
    - Labels: Archivo 800 expanded at 4.4% (4% for the end's longer labels), tracking 0.06 em, line height 1.06, centred on the face and 0.35% below its middle (capitals sit high otherwise), a faint dark shadow under the letters; ink #F7EDE6 on red, #EEF2F9 on blue. "or" is JetBrains Mono 700 at 3%, 62% opacity.
    - Build: the face is the key's `::after` and the walls its `::before`, inside an isolated key. A `::before` at z-index −1 paints over the element's own background, so the face can never be the element's background (v29's first try hid the face under the walls).
- **The opening question card** (`.rcard` in `choice.css`; the video draws it in `drawRecap`, `choice.js`, from positions measured off the page with the real fonts by `scripts/card_measure.cjs`, against the stage's inner box, not its border):
  - The phrases, one at a time: Archivo 800 at 7.4%, line height 1.08, #ECE6DB, broken by hand (WHAT WOULD / YOU DO…; …IF YOU WERE / WORKING ALONE / AT NIGHT…; …AND SOMEONE / WAS STANDING / BEHIND YOU?), each centred on the same line, 74% of the width from the top. Each comes in as he starts it (0.03 s before its first word), rising 1.6% over 0.25 s, and goes, drifting up 1.6% over 0.16 s, 0.13 s before the next one's first word (v34: his recorded pauses are short), so it stays up to its last word. Its words sit at 42% until he says them.
  - The card: the last question (YOU ONLY HAD / TWO OPTIONS?, v30; Archivo 800 at 6.4%, line height 1.1) 6% over the keys, one block centred in the frame; it rises 2.4% and grows from 97% over 0.45 s. No sublabels under the keys (v29: "and find out and escape should be gone").
  - Each key brightens 16% as he names it (0.1 s up, settling over about 1 s).
  - RUN CHOSEN (mono 600 at 3.4%, tracking 0.2 em, 70%) with PART 2 under it (Archivo 800 at 6%), centred, its top at 116% of the width; it holds 1.2 s before the card goes (v29: "a little bit longer so you understand run has been chosen").
  - The held frame behind it is blurred to 40, as soft as the end's, and never dead (below).
- **A frozen frame behind a question glitches, buzzes and drifts** (v29: "background should have a little glitching and buzzing effect … and a little bit camera movement"):
  - Small glitches every 0.8–1 s, 0.07–0.12 s each: Glitch at amount .3–.38 with Tears only at .94 (torn rows; its inverted blocks look like grey UI rectangles) and a horizontal colour split of 20× the amount in px, fading.
  - A faint buzz in the picture: Light Flicker at 0.07, 26 steps a second.
  - Each glitch has a short electrical zap (a tube's buzz chopped 45 times a second and bit-crushed, a click in front), its peaks about 10 dB over the bed; a faint buzz under the question tone.
  - A slow push-in that carries on from the one before the freeze (the lens 2.2° narrower by the end), the eyes wandering a little (0.12 m across and 0.05 m up and down where they look).
  - A harder glitch (0.2 s, amount .45, Tears only .85) as the next part comes to life covers the camera's jump back from the drift.
- **Nothing else on the picture** unless asked: no part counter, no "watch again", no viewfinder corners, no info text.

## 3. Style: which look, and its exact settings

- **Pick the look by genre:**
  - a real-event explainer takes the explainer look;
  - a scary story or a series takes the horror look;
  - a new genre starts from the closer of the two plus the user's references.
- Both looks share the grade chain in 3.1.

### 3.1 The shared grade chain, in this order

1. **Bloom:** `UnrealBloomPass(strength 0.5, radius 0.9, threshold 0.74)`. Each scene sets its own strength and threshold (below), and the strength is scaled by the studio's glow setting.
2. **Saturation** ×0.84, times (1 + the studio's saturation).
3. **A soft S-curve:** 50% smoothstep, then ×0.93.
4. **A cool tint:** × (0.92, 0.96, 1.0) + (0, 0.008, 0.018), so the blacks lift slightly toward blue.
5. **Horror only:** a brightness S-curve pivoting at 0.16 (shadows pow 1.12, highlights pow 1.42): darker darks, brighter brights.
6. **The studio look:**
   - brightness in stops (×2^(1.4·bri));
   - contrast around 0.2;
   - warmth and tint as white-balance shifts.
7. **Vignette:** × (1 − r²·0.5·(1 + 2·vig)).
8. **Grain:** ±0.008 × grain, new every frame.

**The frozen frame behind the question:** blur 40 (measured against a 1080-wide frame) over 0.75 s, dimmed to 64%. A detailed frame needs more blur than a simple one to look as soft; match the softness by eye against Part 1's card ("the same effect as part 1, questions background effect"). Part 1's simpler frame used 14.

**The user's starting look for every new reel** (their saved settings): brightness +4, contrast +4, saturation +6, warmth 0, tint 0, glow 100%, vignette +7, grain 35%.

**Rendering**
- PCF soft shadows.
- A 24-bit depth buffer (stencil on), so far-off parts don't flicker through each other.
- Multisampling where WebGL2 allows.
- Anisotropy 8 or more on every texture.
- RoomEnvironment reflections (PMREM, blur 0.04), kept low: `env` 0.05–0.3 for matte things, up to 1.3 for glass.

### 3.2 The horror look

- **Darkness first.**
  - Background 0x020303; fog 0x050706 from 5 m to 30 m.
  - A hemisphere light (0x9fb8a8 over 0x0b0c0b) at only 0.024–0.08.
  - Most of the frame sits near black. What matters sits in pools of motivated light.
- **Bloom:** strength 0.8, threshold 0.62.
- **Every light is a practical with a source you can see.** Falloff is inverse-square (decay 2), ranges are short, and each colour says what the light is:

| Source | Colour | Level, range |
|---|---|---|
| Fluorescent tube, the key | 0xd9f5e2 spot | 1.6–2.2, 10 m, 1024 shadows |
| Corridor tubes | 0xcfeedd | 1.3, 7.5 m |
| Light through a doorway | 0xcfeedd spot | 3.2, 9 m, shadows; a bounce of 0xc8dcd0 at 0.38, 4.5 m |
| A dead tube catching | 0xe4f2ea | 2.4, 7 m; a floor bounce of 0xd8e6de at 1.0, 2.6 m |
| Desk lamp | 0xffb466 spot | 0.55, 2.6 m, 512 shadows |
| Caged bulb | 0xffd7a0 | 0.18, 3.2 m |
| Flashlight | 0xfff2d8 spot, cone 0.36 rad, penumbra 0.6 | 0.7, 12 m, 512 shadows |
| Stairwell light through doors | 0xfff0d6, and a 0xf2f6ea spot | 1.4–1.6, 6.5–14 m |
| Alarm red | 0xff3322 / 0xff2a18 | 1.5–2.2 |
| A monitor's glow | 0x9fd8b8 | 0.015, 0.9 m |
| Vending machine | 0xbfd2ff | 3.2 m |

- **Bounce light is a second, weaker light** (25–45% of its source) placed where the light lands. Never a general brightening.
- **Shadows:** at most 3–5 lights cast them.
  - The key light at 1024 (bias −0.0006, normal bias 0.02).
  - The others at 512 (bias −0.0008 to −0.001).
  - Fit near and far to the room.
- **Darker darks, brighter brights:** the S-curve in 3.1, plus contact shadows and dark bands everywhere (4.4).
- **Black means black.** Open on pitch black for half a second. The end is pure black, held at least 1 s.
- **Colour:** desaturated greens and greys; warm only where a warm light falls.
- The effects studio has a "Horror grade" preset (grain 0.28, vignette 0.7, saturation 0.6, temperature −0.35, contrast 0.18, shadows −0.12). It's for the user to apply, not the default.

### 3.3 The explainer look

- **One palette, and colour means something:**

| Name | Hex | Used for |
|---|---|---|
| ink | 0x0e1012 | backgrounds |
| navy, slate, steel | 0x171a1d, 0x343a40, 0x545c63 | buildings, the ground |
| mist, fog | 0x8c9399, 0xb9bdc0 | secondary shapes |
| ivory | 0xe9e4da | text, highlights |
| mint | 0x30d158 | connected, OK |
| coral | 0xff453a | failed, blocked |
| blue | 0x0a84ff | a text message |
| amber | 0xe9c98b | warm light only (headlights, sparks) |

- **Scenes:**

| Scene | Background | Fog | Hemisphere | Sun | Bloom |
|---|---|---|---|---|---|
| City by day | 0x1c2023; sky #070b0e → #1b262e | 0x18222a, 28–150 m | 0x9fb6c2 / 0x0a0e12, 0.34 | 0xcfdde6, 0.32, shadows | 0.85, threshold 0.5 |
| Diagram space | 0x0e1012; sky #04070a → #0f1820 | 0x0a1117, 34–125 m | 0.42 | 0.62 | 0.85, threshold 0.45 |
| City at night | 0x0b0c0e; sky #04070a → #111b22 | 0x0e161c, 28–145 m | 0x545c63, 0.55 | mist, 0.38 | 0.85, threshold 0.48; windows 1.15x |

- **Information shapes:**
  - Calls are big balls: radius 0.2 m, roughness 0.35, a little self-glow.
  - Texts are much smaller particles.
  - A tower has a fixed number of lanes (10), and a scale shows capacity.
  - The same meaning has the same size, colour and shape everywhere. Label each the first time it appears.
- **3D words:**
  - Extruded with a bevel: thickness 22% of the depth, size 2.8% of the letter height, 4 segments.
  - Lit by the scene, with no shadow. Extra glow only when the scene is dark.
- **The phone:**
  - iPhone proportions (width 0.48 of the height), rounded corners and a soft bevelled edge.
  - iOS screens.
  - The scene behind it blurs (BokehPass, max blur 0.034), ramping in over a third of a second.
  - While it fills the frame, bloom drops to 0.25 and its threshold rises to 0.88, so the screen doesn't bloom over the picture.
- **The dither pass** (3 px cells, the palette plus mint, coral and blue) was tried and dropped for "smooth and glowy". Use it only if asked.

## 4. Realism: how much detail

**The rule:** detail where the eye goes, at the distance it sees it from, and nothing perfect.

### 4.1 Detail by distance

| Distance from the camera | What it needs |
|---|---|
| Under 2 m, or on screen for 2 s or more | everything: a bevelled silhouette, 5 or more parts, labels and text, wear, a contact shadow, the light it catches |
| 2–6 m | its parts and a textured surface, a contact shadow, correct light |
| Over 6 m | its silhouette, colour and the light on it; the fog does the rest |

### 4.2 Surfaces

- **Every surface gets a painted canvas texture with at least four layers:**
  1. the base colour;
  2. the real pattern (blocks and mortar, tiles, saw-cut joints);
  3. variation;
  4. wear.
- **How much variation** (approved):
  - Painted block, 512 px per 2 m: each block ±4% brightness, 2,600 specks, 9 water stains running down from the top, 30 scuffs low down.
  - Sealed concrete, 1,024 px per 4 m: 260 soft blotches (20–120 px across, up to 16% opacity), 16,000 specks, joints every 2 m, 5 hairline cracks.
  - Vinyl tiles: 14% of them darker, 70 scuffs per tile, 40 soft stains.
  - Ceiling tiles: specks, a stain or two, one tile missing.
- **Texture density:** at least 200–256 px per metre on walls and floors near the camera; ceilings can have half. Repeat a texture at its real size (blocks every 2 m, the floor every 4 m).
- **Seeded randomness** (`rng(seed)`), so every build and the export look exactly like the preview.
- **Blur by hand** (`softBlur`). Safari and the iPhone app have no canvas blur filter, so anything that must look soft is blurred in code.

### 4.3 Materials

The default is `std(color)`: roughness 0.8, metalness 0, reflections 0.3. Approved values:

| Material | Colour | Roughness | Metalness | Reflections |
|---|---|---|---|---|
| Painted block wall | texture | 0.92 | 0 | 0.08 |
| Sealed concrete floor | texture | 0.62 | 0 | 0.3 |
| Vinyl tile floor | texture | 0.52 | 0 | 0.3 |
| Ceiling, ceiling tiles | texture | 0.95 | 0 | 0.05 |
| Painted steel door | 0x55635c | 0.55 | 0.25 | 0.25 |
| Door frame | 0x2c3330 | 0.5 | 0.4 | 0.3 |
| Lockers | 0x4d5953 | 0.5 | 0.35 | 0.3 |
| Steel, rails | 0x7b8079 to 0x9aa09a | 0.35–0.38 | 0.7 | 0.5 |
| Polished knob | 0xa9ada6 | 0.28 | 0.85 | 0.6 |
| Brass | 0xd2ad62 | 0.22 | 0.9 | 0.8 |
| Pipes | 0x6f746c | 0.6 | 0.3 | 0.25 |
| Pipe lagging, cork, paper | pale | 0.9–0.95 | 0 | 0.05–0.08 |
| Signs and labels | texture | 0.6 | 0 | 0.15–0.2 |
| Dark glass | 0x05070a | 0.08 | 0.2 | 0.9 |
| Suit cloth | painted | 0.8 | 0 | 0.25 |
| Rubber gloves and boots | painted | 0.42 | 0 | 0.5 |
| Faceplate | 0x030405, clear coat 1 (roughness 0.06) | 0.42 | 0 | 1.3 |
| A void (dark doorway, missing tile) | 0x050606 or black | 1 | 0 | 0 |

**Never:**
- metalness 1;
- roughness under 0.05, except glass;
- pure white on a lit surface (the brightest paint is about #e9e4da);
- pure black on anything that should show its form (the darkest lit material is about #141516).

### 4.4 Contact and occlusion: nothing floats

- **A dark band at the foot of every wall:** 0.38–0.42 m deep, opacity 0.5–0.55. It fades from 95% at the wall, to 45% a third of the way out, to nothing.
- **A soft shadow under every piece of furniture:** about its footprint plus 10–20%, opacity 0.45–0.55.
- **A shadow under every figure, moving with it:** 0.95 × 0.8 m at 0.42.
- **Decals sit on their surfaces with a polygon offset.** Never two surfaces in the same plane: papers on a desk must never flicker through each other.

### 4.5 Air and particles

- **Dust**
  - 3,400 motes, 4–10 mm each, in a 6 × 2.6 × 6 m box that moves with the camera.
  - They drift ±0.25 m on slow sines and settle about 1 cm a second.
  - They show only where light falls: the beams, and the 4 nearest lights within 2.4 m.
  - None within 0.3 m of the eye.
  - Warm white (1, 0.95, 0.86) at 55%, added on top.
- **Grit from an impact**
  - 120–320 bits from 2–4 cracks, 70% of them along the top of the frame, in clumps.
  - 30% heavy grit: falls fast against drag, drawn as a short streak.
  - 20% paint flakes: they flutter down.
  - 50% fine dust: it hangs and drifts apart.
  - Released over 0.25 s; 12% of the heavier bits trickle down 0.2–1 s late.
  - Each lives 2.6–3.2 s and is lit by the room (55% bright at most). Never glowing.
  - A door bursting in throws a cloud of 320.
- **Grime along walls:** strips of 2.9 × 0.4 m every 3.1 m, each with 260 specks densest against the wall, 9 paper scraps and 14 paint flakes.
- **Cobwebs** in the top corners, 0.4–0.55 m across, opacity 0.55. They catch the flashlight.

### 4.6 Light realism

- **Every light has a visible source:** a fixture (tube, bulb, lamp, screen), a glow and a pool on the floor.
- **Inverse-square falloff and short ranges.** Light dies off within a few metres, so rooms have pools and dark corners.
- **Each source has its own colour temperature** (the table in 3.2). Never one colour for every light.
- **Check the side of a figure the camera sees.** If he's a silhouette, move him or turn him toward a motivated light. Never add an unmotivated lamp.

### 4.7 Keep it cheap

The user exports every frame, up to 4K.
- Merge repeated static pieces into one mesh per material. Use instanced meshes for crowds, cars, trees and windows.
- Use 512 px shadow maps everywhere except the key light.
- Keep particle counts at the levels above.

## 5. Checklists

### Before a new scene is done

**The first seconds** (every reel and every part)
- [ ] Something striking on screen within the first second, with a sound within 0.2 s.
- [ ] Words on screen in the first second: a question, a stake or danger.
- [ ] Something loud or strange within 3 s. Nothing slow, calm or explanatory first; a recap comes second.
- [ ] A series part opens on the last part's question, asked by the narrator over the live moment that part ended; it freezes as that part ended, the second question comes once the first is gone, the keys rise and the winning answer is pressed. No "Previously" recap.

**The place**
- [ ] It's a real kind of place with a reason to exist, laid out the way that place really is.
- [ ] True scale in metres: doors, ceilings and furniture at their real sizes.
- [ ] All five layers: structure, services, furniture, things people left, history.
- [ ] The minimums in 2.2 for its kind.
- [ ] Every surface has a four-layer texture. Nothing within 6 m is a flat colour.
- [ ] A dark band at every wall's foot and a contact shadow under everything on the floor.
- [ ] Dust where the light falls; grit at every impact.

**The light**
- [ ] Every light has a visible source, its own colour and a short range.
- [ ] The important thing is lit from the camera's side.
- [ ] No unmotivated light. Darks dark, brights bright.
- [ ] Tubes hum, and failures happen for a reason.

**The motion**
- [ ] Every move is eased; nothing starts or stops dead except blows and cuts.
- [ ] Turns take 0.85–1.4 s with stepping feet, and the head leads.
- [ ] The walk speed matches the stride: no sliding, no hopping.
- [ ] Never fully still: breathing and sway on, and the camera drifts.
- [ ] Looks are slow with holds; the camera's look-rounds are even sweeps.
- [ ] Collision check: 0. The arm check (`armprobe.cjs`): no flips, no lone spikes.
- [ ] None of my hands or legs in frame.

**The look**
- [ ] The look's settings from section 3, starting from the user's look.
- [ ] Captions in the right colours, ending before cuts, clear of the buttons.
- [ ] Nothing glossy, glowing or emoji-like in the UI.

**The frames**
- [ ] Rendered from the real camera and from a lit side view at every changed moment, and the contact sheet looked at.
- [ ] Of every frame, ask: does it look like a photo of a real place, and does it read at a glance?

### When a note says "more detail", "more real" or "looks AI"

1. Find the distance band (4.1) of what they pointed at, and bring it up to that band.
2. Add the missing layer (2.2). It's usually services, things people left, or history.
3. Replace any flat colour with a four-layer texture, and add wear where hands and feet touch.
4. Check the materials against 4.3. Most "plastic" looks come from roughness too low or reflections too high.
5. Add the contact shadow and the dark band, and check the light comes from a visible source.
6. Render again and compare it with a photo of the real thing.
