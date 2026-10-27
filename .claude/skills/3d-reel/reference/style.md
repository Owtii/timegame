# Style: how the reels should look

Everything here came from the user's requests and notes (see `feedback.md`). Two looks exist so far: the **explainer** look (The Day the Phones Jammed) and the **horror** look (The 13th Floor, The Graveyard Shift). A new reel takes one of them, or the user's reference images, as its starting point. The exact settings of each look (palettes, light colours and levels, the grade, materials) and how much detail a place needs are in `rules.md`.

## The format every reel shares

- **Vertical 9:16**, played in a phone-sized player on the reel's page. Exports at 1080×1920 by default, up to 1440p and 4K.
- **One to two minutes** long. The explainer ran 1:00; the horror shorts ran 1:11 to 1:39 (Part 2 was later trimmed to 1:27, then 1:29 with the figure in the look back). Every second must earn its place: no dead pauses ("why is there a random pause here?").
- **One self-contained HTML page**: a three.js scene with post-processing (bloom, colour grade, grain, vignette), captions over the picture, a clip-based sound mix, a studio panel, and the page's database for notes and saved edits.
- **Text sits clear of the platform buttons.** The first storyboard had a safe-zone toggle for the TikTok and Instagram buttons. Keep captions in the lower middle, above the bottom bar.
- **First person means the camera is the eyes.** Never show the player's hands or legs (said on The 13th Floor and in the Part 1 brief). Doors, phones and lockers move on their own in front of the camera.

## Not "AI-looking"

The user dislikes anything that looks or reads generated. They named it four times: "the text seems too ai", "not the weird claude sound effects", the choice buttons "looks very ai design", "make it look like a real...".

- **UI:** no glossy gradients, glows, glassy pills or emoji icons. Use flat, matte surfaces with real depth: visible thickness, a soft shadow, light from above. Padding and type are consistent, everything is centred, and "or" is plain text.
- **Words:** spoken, plain and concrete, like someone telling the story to a friend. No clever slogans and no list-like captions.
- **Objects:** modelled after the real thing. A phone is an iPhone with iOS screens and iMessage bubbles. A jacket has a real collar and seams, a mug is a mug, and a building has walls, windows, trim and a fire escape.
- **Sound:** recorded-sounding, matched to the action (see `sound.md`).

## Restraint (the most common correction after "smooth")

"A little bit", "not too much" and "subtle" come up 34 times in their notes.

- Camera shake: only a little, only on impacts.
- Zoom: small, motivated push-ins of a few degrees. Once they asked for the whole reel to be zoomed out to 0.9x.
- Glow: soft and wide, never a tight halo. They had the phone screen's glow lowered by 15%.
- Grain: low. The explainer's grain was cut by more than half, and their own look setting is 35%.
- Lines and overlays: thin and fairly transparent ("the call lines a bit lower opacity and a little bit thinner because it looks too much").
- Effects on small moments stay small. A big effect is kept for a big moment.

## The explainer look (The Day the Phones Jammed)

How it got there:
1. A 2D storyboard.
2. 3D.
3. "One color palette".
4. "Dither style, very professional".
5. "Too blue: dark backgrounds, other style of 3D models, minimalistic, everything should harmonize".
6. "Clean designs and minimalistic look with gradient a little bit of glow", from four reference screenshots.
7. "More like this smooth and glowy".
8. "More dark and more exactly like the photo, with a bit blueish tone".
9. "More contrast, a bit darker, smooth glow".
10. "Delete the shadow of the 3D text".

Where it ended:

- **City:**
  - Deep blue-slate buildings, nearly black and darker at street level.
  - A dark blue-grey sky and haze, so far blocks fade out.
  - About two-thirds of the window panes glow a pale mint-teal with soft, wide bloom. Ground-floor storefronts glow brighter.
  - Cool white street lamps and a near-black, slightly wet road with soft reflections.
  - Faceted low-poly trees in a dark blue-teal.
  - Square buildings ("make the buildings more square and not too round"), detailed like a real city.
- **People:** real human bodies ("looking like a real human"), faceless, in dark coats (charcoal, slate, deep teal). They are smaller than the cars ("so everything is true to their sizes"). They come out of the buildings onto the street to call.
- **Colour means something, the same everywhere:** mint/green is connected, coral/red is failed or blocked, blue is a text message. Warm amber appears only as warm light (headlights, sparks).
- **Grade:**
  - More contrast and a bit darker, with a slight blue tone and blacks lifted towards blue.
  - A soft vignette and low grain.
  - Their saved look settings: brightness +4, contrast +4, saturation +6, vignette +7, grain 35%, glow up to 116% inside the tower.
- **3D words** for the key ideas: "5.8 MAGNITUDE", "CALL FAILED", "FULL", "STABLE", "OVERLOAD". They have rounded edges, catch the scene's light, cast no shadow, and get extra glow when the scene is dark.
- **Information visuals must read at a glance:**
  - Calls are big balls and texts are much smaller particles.
  - The tower has a fixed number of lanes: calls hold a lane, and when all are full new calls bounce off as blocked.
  - A weight scale stays level on a normal day and overloads under a pile of balls when everyone calls.
  - During the texting part, some calls still get through while many texts slip past easily.
  - Everything flows without stops ("no weird stops") and is organised and symmetrical, not chaotic. More red (declined) lines than green when the network is jammed.
- **The phone:**
  - iOS-accurate: the call screen and the accept and decline buttons look like real iOS, with a clean status bar.
  - Messages look like iMessage.
  - When the phone is on screen, the city behind it blurs (depth of field). It ramps in over a third of a second and clears just before the phone leaves. Later they asked for "a little bit more" blur so the phone pops.

## The horror look (The 13th Floor, The Graveyard Shift)

- **Dark, high-contrast, lit by practical lights you can see:**
  - Greenish-white fluorescent tubes that flicker, fail and restrike.
  - A warm desk lamp, a torch, the green EXIT sign, a red stairwell light.
  - The phone screen's glow, a lit bathroom door, an open exit with light beyond it.
  - Darker darks and brighter brights on the rooms, the objects and the people ("some dark spots a little darker and bright spot more bright").
- **Black is truly black when the story says so.** Open on pitch black for half a second. Cut to full black at the end and hold it for an extra second ("make it pitch black").
- **Real, logical places.** They rejected a desk sitting in the middle of a hallway: "not what a real situation would look like". Things that work:
  - A lobby with a security counter.
  - A basement corridor, and a storage room with lockers, shelves, photos and a desk.
  - An apartment building that looks like a real one: solid walls, bay windows, a fire escape, street details and thin trim. Only the top border is white ("the outline white border of the building is too thick").
  - A real lift: wide, the doors open first, a floor display that counts clearly, and no button for floor 13 (only the display shows 13).
  - Rooms with real-looking props: a jacket, shoes, a mug, wall clocks, phones, doors with handles and small windows.
- **Small detail everywhere:**
  - Dust drifts only where light falls on it.
  - Grit falls from impacts in random clumps.
  - Contact shadows sit under furniture and people, with dark bands at the foot of walls, grime and cobwebs.
  - Papers never flicker through each other, and nothing twitches or glitches.
- **Figures:**
  - *The 13th Floor's shadow figure:*
    - Humanoid, tall and long-limbed but "not too skinny", with soft smooth edges.
    - Seamless shoulders and limbs. It must not look like a robot or a "five nights at freddy" model.
    - It leans about 85% of its body out of a doorway, stands fairly straight, and is almost still: a very slight movement and only a small head tilt.
  - *The man in the hazmat suit:*
    - Tall, a little skinny and slightly hunched.
    - One seamless suit "like a onesie": no ribs, nothing sticking out, no "diaper" seat, gloves and boots that never poke through.
    - Faded, worn yellow with a few old blood stains (more stained and dirty in Part 2).
    - A full glass faceplate, with the head 15% smaller than the first try. Behind the glass a dark, foggy face is barely visible: you can make out a dark eye and mouth, but you can't tell if it's really human.
    - Real leg proportions: no long body on short legs.
  - *A person's shadow coming up behind you:* a real cast shadow with feathered edges, not a flat overlay or a lit cut-out. It clearly reads as a person and rises at a medium speed.
- **Transitions:**
  - A full eye-blink that closes at the edges too.
  - A blurred, eased transition that clearly reads as one.
  - A time-lapse with a radial blur round the clock, which stays in focus.
  - A hard cut to black for the end.
- **Captions:** the narrator in white, my own in-the-moment words in italic gold, a phone voice in green. Words light up as they're spoken.
- **The choice card:**
  - Real 3D keycaps (a dished face, lit rims, darker walls, a tight contact shadow) in deep red and deep blue: text only, centred, with "or" as plain text; the question sits right over them as one card.
  - The question is "What would you do?".
  - No "Part 1 of 3" label, no "watch again", no emoji.
  - The picked key latches down and the other goes dull. Details are in `craft.md`.

## The studio panel's own look

"Make the ui of the studio more modern and simplistic design not too much unnecessary controls or buttons or overinformation."

- A few tabs (Notes, Sound, Camera, Effects, Look, Export), short labels, no explanation paragraphs, and controls only where they're needed.
- The editors open full-screen, After Effects style: a library on the left, the picture in the middle, the inspector on the right, the timeline below.
- The same dark, quiet palette as the reels.
