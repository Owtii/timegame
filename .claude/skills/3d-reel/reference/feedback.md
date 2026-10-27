# What the user asked for, and what it taught

This is the full record of the user's direction across five reels made between October 17 and 26, 2026. It has every chat message about the reels, every timed note left in the pages, and the edits they made by hand in the studios. Read the summary first. Go to the verbatim log below it when a note seems to contradict an older one, or when you need their exact words.

The themed lessons (how to animate, light, sound and caption) are in `craft.md`, `style.md`, `story.md` and `sound.md`. This file is the evidence behind them.

## The short version: what they keep asking for

The same few things come back across 260 messages and notes. Treat them as defaults: the user should never have to ask twice.

1. **Smooth and natural, never robotic.** "Smooth" comes up 29 times; robotic, weird, awkward or glitchy 39 times; turns and looks 85 times.
   - Camera moves follow one continuous path and never switch focus suddenly.
   - Transitions read as transitions.
   - People turn head first, step their feet round, move slowly and hold their looks.
   - Nothing snaps, twitches, clips through, slides or pops.
2. **Real, not "AI".**
   - Sounds are real-world sounds that match the action. The quake rumble sounded "like a bag of glass"; early effects were "the weird claude sound effects".
   - Objects are real: iPhone and iOS UI, iMessage bubbles, a real jacket, shoes and mug, a real building with walls and windows, a hazmat suit like one seamless onesie.
   - Scale is true: people smaller than cars, the figure taller than the door frame.
   - Text sounds like a person telling a story ("the text seems too ai").
   - UI isn't "very ai design": no glossy, glowing pills.
3. **Clear at a glance.**
   - You understand the visuals at once without explanation: particles that plainly mean calls versus texts, a scale that plainly tips.
   - Layouts are organised and symmetrical, not chaotic.
   - Captions say exactly what is on screen while they show.
4. **Restraint.** "A little bit", "not too much" and "subtle" come up 34 times.
   - Small camera shake and small zooms. Once they asked for a 0.9x zoom-out across the whole reel.
   - Glow lowered by 15%, grain lower, call lines thinner and fainter.
   - Subtle sounds for small actions, and no constant drone.
5. **Scary where it should be, quiet where it should be.**
   - Clear horror sounds on the weird moments: build-ups that drop, a near-scream cut off at the reveal, stingers, heartbeats.
   - Real silence in between ("dont have constant background sound going on").
   - The first bang out of nowhere is the loudest.
6. **Detail and contrast.**
   - More detailed buildings, rooms, halls and props.
   - Particles and small details everywhere.
   - Darker darks and brighter brights, and shadows that sell an entrance.
   - Exports keep the shadow detail instead of crushing the blacks.
7. **Story logic and pacing.**
   - Every action has a reason you can see, and people behave the way a normal person would: hide, try to call the police.
   - A catchy hook and no dead pauses.
   - Exact timing changes ("0.4s more", "2 sec longer", "1 sec pitch black").
   - Endings that cut off with no explanation.
8. **First person: never show the player's hands or legs.**
9. **Tools to adjust things themselves:** timeline notes, a sound editor with a library, camera keyframes, effect layers, look and text sliders per section, and a real export.
10. **Credits are precious.**
    - No narration until they've approved the script.
    - Quote the ElevenLabs cost before generating sound effects.
    - If the credits look wrong, the connector is linked to the wrong account. They reconnect it.

How they work:
- They iterate in many small rounds and leave timed notes in the page, then say "check notes".
- They sometimes paste a full scene-by-scene script, with environment, camera, audio and narration for each scene.
- They send reference screenshots and want them matched closely ("make it more exactly like the photo").
- When they say "dont change anything yet, give me suggestions", reply with options only and touch nothing.
- They read your reports, so keep them in plain words.

## What they changed by hand (saved in the studios)

Their own edits say as much as their notes. Each reel's saved data is in the repository under `projects/user-data/`.

**Sound mixes.** Volumes are in dB relative to the build.
- **Part 1:**
  - Boosted everything after the stare a lot: clock +6, dread drone +8.5, heartbeat +8.5, the ringing hit +7, the stutter buzz +5.5, room tone +2. The silence-then-dread moment wasn't audible enough.
  - Raised the call drop's long beep +6.5 and the riser into the choice +6.
  - Cut the respirator breathing behind you and his steps behind you by 13 dB each, and the whispers by 3 to 4.
  - Added a tension riser at 0:25.9 (the stare, +12 dB) and panicked running with breath at 0:59.3 (the line goes dead).
- **The 13th Floor:**
  - Cut the realistic shower, tap and drips hard (−18 to −30 dB) and the hallway tube buzz (−10).
  - Boosted the wet steps behind the door (+12), the bathroom light switching on (+9), the reverse swell into the reveal (+11) and the hiding heartbeat (+9).
  - Added a jump-scare stinger on the figure (+8), elevator chimes and door sounds at every lift moment, the phone buzz, a door creak, and a riser while he hides.
  - Muted two duplicates.
- **Part 2:**
  - Muted the realistic door burst and put a jump-scare stinger there instead.
  - Lowered his respirator breathing by 7 dB.
  - Added slow heartbeats while I hide in the locker (0:36.8 and 0:41.8 on the clock of that version).

What the mixes teach:
1. A big moment wants an unmistakable horror cue (stinger, riser, swell), on top of the realistic sound or instead of it.
2. Breathing beds and running water were mixed too loud. Keep beds low and let the cue carry the moment.
3. After a silence, the dread bed has to be clearly audible.
4. Every mechanical event on screen gets its sound: the lift chime, the doors, the phone buzz.
5. Heartbeats while hiding.
6. Their mix is theirs. Carry every lane, mute, volume, swapped sound and added clip through every rebuild (`scripts/migrate_mix.py`).

**Camera (Part 1).** They saved their own camera keys in the camera editor (5 shots, 64 keys, October 24).
- A saved `camera/keys` document replaces the whole built camera when the page loads.
- So before any camera change on a reel that has one, read it. Apply your change to their keys as well, or tell them their saved camera hides it.

**Look (The Day the Phones Jammed).** Their look settings:
- Base: brightness +4, contrast +4, saturation +6, vignette +7, grain down to 35%.
- Per chapter: glow 92% on the August 23 chapter (with vignette 19), 116% inside the tower (brightness +11), 114% on the scale.
- A slightly brighter, cleaner, less grainy picture than the default suits them.

## Everything the user asked for in the chat, by reel

Verbatim (their spelling), in order. "(screenshot attached)" marks a reference image they sent with the message.

### Topic and first version (Everyone Calls at Once, a 2D storyboard)

**2026-10-17 00:48**

> give me a good informative topic about something that we use everyday but dont know how it actually works

**2026-10-17 00:50**

> give other topics, something better what we use daily

**2026-10-17 00:52**

> give me other ones something very niche but something we really use

**2026-10-17 00:55**

> okay do something like that but mix it with something intresting that never would happen but what if

**2026-10-17 00:57**

> no give me more excited ones

**2026-10-17 01:10**

> What if every phone in your city called someone at the same time?
>
> make a good story about this topic for a reel and make it have a very catchy hook for the beginning and then explain it simply so everyone should understand it and work together with good visuals that are minimalistic but very understandable by just looking and hearing the narrator and seeing the text. 
>
> so make a good viral reel of that topic.

**2026-10-17 01:12**

> yes do that

### The Day the Phones Jammed (3D explainer, 1:00)

**2026-10-17 01:30**

> no make the video like an animation and it will tell you a real story with good animations and transitions,  with consistent text.
>
> make it 3d animations.

**2026-10-17 01:48**

> can u add elevenlabs voice

**2026-10-17 01:59**

> I want u to use elevenlabs v4, LEE - middle aged australian male.
>
> add also background music and some sound effects but make the sound effects unique and not the weird claude sound effects, try to make new sound effects and use those.

**2026-10-17 02:12**

> the sound effects are too loud and background music is needs to be a little lower.
>
> the text seems too ai, make it more story telling style and make the animations more detailed, make the texts also make sense.
>
> It should be informative and simple but a good story.

**2026-10-17 13:30**

> make the visuals of the part of particals and text better and more clearly, so you can understand it immiedatly.
>
> make the weight scale better, like if everyone calls there should be lots of balls and thats why its heavier, so a normal day should just be stable and when everyone calls, lots of balls and it will give error.
>
> and texting should be smaller particals than the big circles.
>
> Improve the visuals more and make it have more details and better animations.

**2026-10-17 17:31**

> (screenshot attached)
> use this voice and give it a bit more emotion but not too much, have still in between for a good story telling voice and texts.
>
> Make the objects more detailed and looks smooth, give smooth transitions and smooth animations with smooth sound effects.
>
> use one color palette and stay within those color paelette and use also 3d texts for some parts to express the word more.

**2026-10-19 00:57**

> (screenshot attached)
> Make it dither style, and make it very professional looking the designs, make the text make sense and have good border width and have good animations.

**2026-10-19 01:03**

> no its too blue, make it have a color palette with dark backgrounds and use other style of 3d moduls to describe everything. make it more minimalistic and everything should harmonize each other and not overriding.

**2026-10-19 01:11**

> Make the buildings have more details, look like a real city and the poeple also have a body looking like a real human. 
>
> make the particals also more clearly what those are and what they are meant for. 
>
> make the phone designs look more like iphone and ios, and the text messages look like imessage.

**2026-10-19 01:37**

> make better sound effects that are realistic to the worlds, the sound effect should match the sound it probably make, like the buzz sounds should be a real world buzz or the declining sound should sound like a real phone that declines like a call that stops. 
>
> make the visuals of the first scene better, and the icons of the phone should be better and the call icon or decline icon should also look like a real world icon on ios.
>
> make the camera movement better and also make the buildings more square and not too round.
>
> and make the visual for calling also better and not too chatoic make everything a bit more organised and symettrical.

**2026-10-19 10:20**

> make the visual with the call balls going in a lane have better animations better and visuals. it must have a smooth animation no weird stops, the rest is good

**2026-10-19 10:42**

> make the visuals when texting instead of calling something better, it had to really show that it stops w calling and goes texting and when texting it should be very clearly with sound effects

**2026-10-19 10:59**

> make with the part with texts that some calls go through too instead of only texts in the lane but lots of text goes easier.
>
> make the camera movement in the beginning not go through buildings just show a preview of city then the earthquake. then it shows the humans and theyre cslling then show the cell line tower but all smooth with no weird stops and detailed animations with visuals.

**2026-10-19 11:34**

> (screenshot attached)
> now its good, small details make the hunans smaller than the cars so everything is true to their sizes. 
>
> and there s a weird glitchy thing going on with the buildings, something w the shadows I think but its twitching a bit. fix that. look at the screenshot circled red

**2026-10-19 11:55**

> the camera movements are not smooth in the beginning it moves very static and especially when it goes to the people then to the tower its a sudden switch of camera movement, the camera movement must feel likes it has one path and smooth and not switch quickly to another focus of object.

**2026-10-19 12:09**

> the shaking sound effect sounds like a bag of glass make it sound like a real ground shaking, and change the ball sound effect too on the weight scale, its too loud and doesnt sounds ike real balls.
>
> make also sound effects when a call ball goes into the lane on the (inside the tower part).
>
> on the camera zoom in in the beginning dont zoom in too much on the people, just make it clearly that they are calling and make more people come out to the street like coming out the building and call. 
>
> and dont make the camera too zoomed in when going to the celltower have a bit space between then on the final shot it can be zoomed in, just not in the middle when the camera moves to the last shot.

**2026-10-19 12:24**

> There is too much people now,  lots of peoples phone declines so the there should be more red lines than green lines.
>
> the sound effect of the call going in tot the lane is very bad make it something subtle and not too loud. something that sounds like it goes in.

**2026-10-19 12:39**

> use my elevenlabs account I have 10k credits on it

**2026-10-20 13:17**

> Okay last tweak delete the shadow of the 3d text.

**2026-10-20 17:07**

> (screenshot attached)
> (screenshot attached)
> (screenshot attached)
> (screenshot attached)
> Make the 3d moduls have mroe clean designs and minimalistic look with gradient a little bit of glow so it looks very smooth and clean.

**2026-10-20 17:14**

> (screenshot attached)
> make it more like this smooth and glowy effects

**2026-10-20 17:26**

> (screenshot attached)
> make it more dark and make it more exactly like the photo, with a bit blueish tone

**2026-10-20 17:37**

> (screenshot attached)
> add more contrast and make it a bit darker and the light should have a smooth glow.
>
> when they call make the call lines a bit lower opacity and a little bit thinner because it looks too much, if you look at the screenshot.
>
> lower the grain too.
>
> make the weight and the lanes and the balls also a bit in the same style but still have the green color and red and blue colors.
>
> when the phone shows up make the background gaussian blurry till the phone goes away.

**2026-10-20 17:52**

> Make a download option avabile for the video and make a part where I can put notes on the exact timeline and I'll tell u read the notes so you can change it according to the notes and timeline so you will understand it better. and make also an option to adjust brightness and contrast etc... all those settings so you can also adjust according my settings and save it and apply it. but it should be working also part for part like it should not affect the whole videos birghtness because only some part maybe need it and some parts dont.
>
> and maybe move the texts a little bit. change size etc.

**2026-10-20 18:25**

> oke ik heb de notes gedaan en geef het ook motion blur zodat het smoother lijkt and maak 24fps 30fps en 60fps en ook 1440p en 4k in size.

### The 13th Floor (horror short, 1:14)

**2026-10-20 21:45**

> Okay same style but I need a new video.
>
> Give me video ideas maybe something with a story and scary story

**2026-10-20 21:51**

> no make a scray story with a plot twist that with a building up script that is 1 min long and at the end it gives a plot twist with no explanation and the video just ends.
>
> make the video with a good hook and tell the viewer the story gradually

**2026-10-20 22:32**

> Use the same voice as the video before.

**2026-10-20 22:35**

> but I have an account with 10000 credit you are using the wrong account

**2026-10-20 22:37**

> now

**2026-10-20 22:56**

> (sent an ElevenLabs sample of the voice "Spuds Oxley - Grandpa") I'll use the grandpa one voice, and put new notes and updates, so you can update it.

**2026-10-20 23:31**

> (screenshot attached)
> Make the building a bite more detailed in the beginning showcasing the a real building.
>
> make the camera movements more smooth not too much sudden movements only when rushing.
>
> use more background songs that builds up the scene.
>
> Make the shadow figure look more human and not like a bathroom icon, (look screenshot for reference). make a little sound effect when he turns around and sees the figure.
>
> make the moment at 1:00 when he turns to lock everything make that better.
>
> The shower with the light turned change the sound to like a real light going on like subtle electricity, and it should turn on when he almost says turned on, and its still too gloomy and glowy make it less. 
>
> use a scary background that builds up from the moment when he is in his bed till the end when he checks his phone.

**2026-10-20 23:52**

> Use other background songs/sounds the weird alien sound is not scary make it something more scary and make the background sounds/songs more appropriate and should make the video more intense when looking at it.

**2026-10-20 23:57**

> Use other background songs/sounds the weird alien sound is not scary make it something more scary and make the background sounds/songs more appropriate and should make the video more intense when looking at it.
>
> and dont have constant background sound going on, like I hear a constant noise. cut for quite things just dont use anything and have just the footsteps or something else.
>
> at 0:45 make the scene better and more scary and use the background sounds and the shadow that walks past with the lightning better, then when running it sohuld have scary sound effect and just running with no background music then when he turns around a scary sound effect when seeing the shadowy figure but make the shadow figure taller and a little pose weird but standing and a little hudged forward and slightly looking out of the room but you can almost see his whole body.

**2026-10-21 00:19**

> make a little studio and make a time line like on after effects with the sound effects placed under the video so I can choose and maybe put new sound effects on and maybe delete some sounds that are extra etc. 
>
> use also elevenlabs sound effects if thats possilbe.

**2026-10-21 01:04**

> after youre done make the scene with the shadow figure move a little bit and make the hall darker when he is running with one light in the hall.

**2026-10-21 09:24**

> why on the phone i cant hear the audio?

**2026-10-21 09:38**

> make the ui of the studio more modern and simplistic design not too much unnecessary controls or buttons or overinformation.

**2026-10-21 09:53**

> make the end with the camera and the phone better camera movements.
>
> make also when he unlocks his room and looks at his jacket and shoes and mug make those models more detailed and look like a real jacket, shoes and mug. make the room also a little more detailed

**2026-10-21 10:17**

> small detail when it gets floor 13, there shouldnt be a floor 13 button only on the number it should be 13

**2026-10-21 10:31**

> read the new notes, and if those notes are done make them just a history note and not show up on the timeline anymore.

**2026-10-21 17:48**

> Change the end to maybe like an official statement of the building the elevator is still in maintenance from yesterday so you have to take the stairs or something.
>
> and rewrite the part with when he is running back to the 12th floor and saying my key my jacket my shoes my mug etc that sentence is too much, something subtle.

**2026-10-21 20:29**

> make the building design like a real building with walls and windows instead of see through. give it more details. and better visuals to count it to 12 and 13.
>
> the scary figure looks like a 3d model that is from five niggts at the freddy and I dont want that because it looks like a robot dark figure, the dark figure should have a real humanoid weird scary a bit long and skinny but not too skinny. but the legs and arms and shoulders should not look like a robot and it got assembled on each other.

**2026-10-22 01:15**

> Also after u are done, go on the studio and for the sounds have like a little library with icons and its names and when pressing on it you can hear and listen to it and you can drag or click on it to add it on the timeline, sort the sounds also by group like this is from elevenlabs and this is from claude itself etc and you can maybe import your own sounds.
>
> make it also you can make the timeline bigger in y-as like individually the effects/scores a bit bigger.

**2026-10-22 10:47**

> work further

**2026-10-22 11:43**

> (screenshot attached)
> make the building layout more like this instead of those weird vertical lines. and have a little bit more details on the building. and around it.
>
> the dark figure should like peak out of the apartment with his whole body out but not moving, maybe very slight movement.
>
> and make the elevator transition between 13 to 12 a bit slower because its too fast like a little 0.6s longer while him pressing the 12 fast as possible. 
>
> make the end different like when he comes in the apartment running on the 12 floor.
>
> but is not weird he goes into his bed but he already saw something scary, so a normal perosn would call the police or something.. I think he should be, be hiding somewhere in the apartment, could be in bed or somewhere that a normal person would hide behind and then trying to call someone but when picks his phone he sees a message saying the elevator is maintenacne take stairs etc. (not too long message.)
>
> then he peeks the bathroom door is wide open with light on and shower is on.
>
> the pov person should not have hands or legs showing so in the video.

**2026-10-22 12:48**

> I've put new notes fix those.

**2026-10-22 13:52**

> new notes done. fix it

**2026-10-22 14:49**

> I've put new ntoes

**2026-10-22 15:55**

> is there also a way to make a studio for the camera movements to adjust like camera movements to look other way etc with keyframes, like on AE.

**2026-10-22 16:19**

> why rendering is the quality not so good? make it better with higher bitrate and real render settings so you can have good output. with maxed quality options.

**2026-10-22 16:56**

> Make it when rendering it uses my pc beause rendering like that it takes soo long. make also a cancle button when rendering

**2026-10-22 18:16**

> rendered in max quality now it's too dark the dark spots are almost pitch black.
>
> fix that it should have good HDR with correct black and correct dark shadows.

**2026-10-22 21:35**

> what does video standartd mean?

**2026-10-22 21:40**

> (screenshot attached)
> delete that dark figure in the beginning just show the floor.
>
> also delete the text above in the middle that gives extra info.
>
> also delete the little 90degree thing looking like a camera thing(look screnshot).
>
> make the lift in the beginning a bit more detailed.

**2026-10-22 22:57**

> make the hall a bit more detailed.
>
> at the end when everything gets black, make it pitch black.
>
> the glow on the phone is a little bit too much lower it by 15%.
>
> the hallway with the dark figure make the light flicker to dark and light.

### The Graveyard Shift, Part 1 (1:11, ends on a choice)

**2026-10-23 01:35**

> Okay save this, video as a older project, now the next project.
>
> SCENE 1: THE HOOK (0:00 – 0:06)
>
> * Environment: Pitch black for the first 0.5 seconds. A harsh greenish-white fluorescent tube flickers to life overhead, revealing a cold, concrete basement hallway. In the foreground is a small security desk with an old landline phone, a warm desk lamp, and a digital clock reading `12:00 AM`.
> * Camera (POV): First-person eye level with a subtle breathing sway (no hands or arms visible). The camera slowly drifts forward a few inches, staring straight down the empty, silent hallway.
> * Audio: A sharp electrical pop-buzz as the light flickers on, settling into a low, eerie room hum and the hollow ticking of a clock.
> * Narrator (Internal Monologue - low, serious): "If you ever work the night shift alone and see a man in a yellow hazmat suit... do not let him know you can see him."
> * Narrator (Beat of silence, then slightly softer): "It was my first night on the job. Nobody warned me."
> * Transition: Slow eye-blink transition (top and bottom black vignettes closing and opening).
>
> SCENE 2: THE ARRIVAL (0:06 – 0:16)
>
> * Environment: The digital desk clock now reads `02:14 AM`. The hallway lights are slightly dimmer.
> * Camera (POV): Camera is tilted slightly downward toward the desk monitor, then abruptly tilts up as a loud noise echoes from the back. At the far end of the hall, the heavy double doors swing open by themselves. A tall figure in a dirty, bulky yellow hazmat suit walks in. He moves stiffly from door to door, turning the locked handles and peering through the small glass windows.
> * Audio: Heavy metallic clang of the doors, followed by the slow, rhythmic thud-squeak of rubber boots on concrete.
> * Narrator (Internal Monologue): "Around two in the morning, he just walked in. Since I was new, I figured he was just the night tech doing his rounds."
> * Transition: A quick camera whip-pan left toward the desk monitor, cutting seamlessly to later in the night as the camera pans back right.
>
> SCENE 3: THE MISTAKE (0:16 – 0:30)
>
> * Environment: The hazmat figure is now walking directly past the front of the desk from right to left, only four feet away. The glass visor of his helmet is completely pitch-black on the inside.
> * Camera (POV): Camera tracks smoothly left to right, following him as he walks past the desk.
> * Narrator (Internal Monologue): "He never said a word. Just kept walking around doing his thing. When he passed my desk, I tried to be polite... and asked if he was working the graveyard shift too."
> * Visual Action: The instant the narrator finishes that sentence, the figure freezes mid-step. His body remains facing down the hallway, but his helmet slowly turns 90 degrees to stare dead into the camera lens.
> * Audio: All background hums and footsteps cut out completely—3 full seconds of suffocating silence.
> * Visual Action (Continued): After 3 seconds, his head turns back forward, and he walks slowly into a dark open doorway to the left of the desk.
> * Narrator (Internal Monologue): "He just stared at me... then turned around and kept working."
> * Transition: Hard cut to an extreme close-up of the digital desk clock flipping from `05:49` to `05:50 AM`.
>
> SCENE 4: THE CALL (0:30 – 0:43)
>
> * Environment: The hallway in front of the desk is completely empty again.
> * Camera (POV): The phone on the desk rings. The camera turns and zooms slightly toward the phone as a mechanical click indicates the call is on speakerphone, then slowly pans back up to look down the empty hallway.
> * Audio: Sharp, jarring landline ring, a click, and thin phone-line static.
> * Narrator (Internal Monologue): "Right as my shift ended, the morning guard called. Said he was running ten minutes late and asked me to wait."
> * Camera (POV): Camera glances casually toward the dark doorway on the left where the figure went earlier.
> * Narrator (Internal Monologue): "I asked him if the other guy in the suit could just wait for him instead."
>
> SCENE 5: THE CLIMAX (0:43 – 0:56)
>
> * Environment: The overhead fluorescent light flickers violently and dims, casting long, dark shadows across the desk.
> * Camera (POV): Camera freezes, staring down the empty hall. A very slow, subtle zoom-in (dolly zoom) starts to build claustrophobia.
> * Audio: Phone static grows louder, layered with a faint, deep sub-bass heartbeat.
> * Coworker (Phone Filter - urgent, shaky whisper): "Listen to me... nobody else works there. He only shows up at night. Do not talk to him... and whatever you do, do NOT look at him."
> * Audio: The phone cuts to a dead dial tone. Immediately, in the rear audio channel (right behind the viewer's ears), a heavy rubber boot squeaks on the floor, followed by a slow, muffled respirator breath directly behind the neck.
> * Camera (POV): No narration—only the shaky, panicked breathing of the POV character. After a tense 1-second pause, the camera slowly, tremblingly turns 180 degrees to the right to look behind the desk chair.
> * The Final Frame: The man in the yellow hazmat suit is standing inches behind the chair, towering over the lens, his pitch-black visor filling the screen.
> * Audio & Cut: A loud, distorted bass sting—instant hard cut to black after 0.5 seconds.
>
> Dont use elevenlabs yet, just have only the background sound effects work, not the narrations voice. wait for my confirmation to do the narration voice beucase I might do some changes and it will save credits.

**2026-10-23 09:40**

> thats very good but sitting on a desk facing a hallway is not what a real situation would look like.  so change the room to something more logical,
>
> the part where looks at me, make it more smooth with smooth realistic movememts.
>
> make the hazard suit gay taller and a bit skinnier and on the side his black foggy screen on his face must be better made cuz on the side you see its not attached to the suit. 
>
> make his walk also a bit more realistic.

**2026-10-23 10:29**

> why does he walk so weirdly fix that. he shouldnt look like he is hopping around.
>
> make him more skinnier and a little bit taller, and a very little bit hunched.
>
> make him looking his way turn his body and face for a sec then he moves back to normal
>
> and make the scene where he is behind a bit more scary, by him looking at the door left of him then the big door to see where he is looks right a quick look nothing then call ends he turns around he sees him but it should be a little jumpscare and cut the end fully pitch black for 1 sec.
>
> make also the details of the room and phones and clocks and walls and doors a bit better. his suit also better make it a bit fading away yellow.

**2026-10-23 11:05**

> made new notes fix those.

**2026-10-23 11:36**

> (screenshot attached)
> its still sticking out the thing with his gloves. fixthat
>
> and at the end make the face more blurry you can clearly see circles, make it blurry so you wont see clear circles.
>
> also for the tick sound on the background make it a little subtle and use another sound that really sounds a clock tick.

**2026-10-23 11:47**

> after that make a light and effects studio with blurring effects and masking with layers and vignette and much more effects like on after effects.

**2026-10-23 13:08**

> (screenshot attached)
> bring motion blur in it, and the face still not blurred (I want it to be like this screenshot)

**2026-10-23 13:09**

> No, I want motion blur on the whole video when moving so it looks more smooth.

**2026-10-23 13:37**

> and check the notes too

**2026-10-23 15:10**

> make the clock better looking it looks a bit off centred the time.
>
> and check the notes.

**2026-10-23 15:37**

> check notes

**2026-10-23 16:23**

> Okay use the same voice as the elevator voice guy, and for the phone use another voice but with a call effect voice like you hear he is talking trough the phone.

**2026-10-23 16:52**

> delete the part saying it was my first night on the job nobody warned me. just transition to the next part.

**2026-10-23 17:18**

> Bring more sound effects and little dramatic effects and background noises, because it sounds a bit flat. and on the weird parts more scary sounds that you can hear clearly.
>
> check notes too.

**2026-10-23 17:49**

> check the note.

**2026-10-23 19:45**

> check notes.

**2026-10-23 20:07**

> but why did his face changed at thr end? it should stay blury

**2026-10-23 21:45**

> dont change anything of the script yet or anything about the video but what could we do to make people comment like they have a choice. 
>
> and something they get hooked on

**2026-10-23 22:36**

> i want to make then a second part with it. a small series then, so what do you suggest and let me choose what to do

**2026-10-23 23:25**

> okay make the part 1

**2026-10-24 00:28**

> (screenshot attached)
> make the hazmat suit like this.
>
> no ribbles on the foot or arms and the body too. Make the body seamless and good.
>
> at 0:40 the transition is a bit akward make it a bit more less akward add like sound effect or do something better. to get it better.
>
> at the end show a shadow that is coming from behind then the question comes.
>
> Make the buttons 3d with only text no emojis.
>
> delete also the part 1 of 3 text.
>
> and delete the watch again text.
>
> and centred the option buttons and make better ui or layour to show 2 options.

**2026-10-24 00:57**

> make the hazard suit better and make it lose its yellow color like its been worn alot. 
> make sure the gloves or shoes are not overlapping the suit.
>
> the end the shadow needs to be more clearly and coming up like its walking behind u. 
>
> the transition when it becomes 5am is still bad make it better

**2026-10-24 10:52**

> make the question on the end a bit longer 2sec longer
>
> and make the hazmat suit guy have a fully screen glass face like before. but make his head a little bit smaller like 15%, and have a little bit old blood stains on him, not too much just a little.

**2026-10-24 11:18**

> make the staring part the build up sound more scary and like a horror building high pitch sound.
>
> the end make it 1.5 sec longer

**2026-10-24 11:27**

> make the footsteps and shadow coming over a little more obvious like give 1 sec more to the scene so you understand his behind you.

**2026-10-24 11:38**

> and add like a sound that comes from behind

**2026-10-24 11:52**

> i think the hook must be something with my coworker... what do you think? dont vhange anything but have suggestions. 
>
> so ppl wont know coworker is a weird entity.
>
> and make the story a little bit different but same ending

**2026-10-24 12:00**

> the phone guy must say wait then a little pause and silence no no listen to me.. nobody else works there... 
>
> just.. just dont talk to him and do not look at- it gets cut off with a peep, the camera looks around a bit then the shadow of a person shows up from behind. then the questions comes up.

**2026-10-24 13:00**

> make the hook something else but something that brings mystery but also tells that the coworker is not safe, give me suggerions dotn change anything yet.

**2026-10-24 13:03**

> use 2

**2026-10-24 13:12**

> make the hook now a little less long and make it fit the hook, because it has weird pause in between and at the end.
> and adjust the cinematic scene

**2026-10-24 14:02**

> add also a scary horror background music at the end for the questions, but more like a one tone or something to have the viewers attention still in it.

**2026-10-24 14:12**

> no the shadow looks very bad, make it not a overlay make it a real shadow coming up and it must be look like a shadow use more feather effect so the edges wont be sharp.

**2026-10-24 14:47**

> make the question: what would you do?
>
> is there no free hazmat suit 3d model on internet so you can take it. because the 3d model now looks too weird and buldgy with weird ribles.

**2026-10-24 15:33**

> yes try to rebuild it first, but like really make it like those hamzat suit with no weird parts sticking out.
>
> show me a photo of it first.
>
> also make the middle part a bit different make it like he is working then when u aak he just works further then you look away for a sec to do your own stuff then he stands there and stares at u with scary sounds then he just casually goes further no words. 
>
> make the shadow part come up a little bit faster not too fast. and clearly see a persons shadow in it.

**2026-10-24 16:15**

> the suit looks very weird and he is too skinny and his ass looks like a diapers, make it smooth like the suit is a onesie not parts assembled to each other.
>
> as the note say, make him work in the hallway and make the script a bit different, when he works closer on the right side, then the part of asking comes about if he works too etc.. but he keeos doing his thing and then you look away then he stands infront of u staring then he keeps going and doing his thing.
>
> when u look at him make a scary jump scare sound. 
>
> check note

**2026-10-24 16:50**

> (screenshot attached)
> this part of his leg is weird it looks like he is a very long body and short legs. fix that.
>
> and check the notes.

**2026-10-24 18:44**

> what could he do more than run or turn around? 
>
> what should also be option. give me a suggestion

### The Graveyard Shift, Part 2 (1:29, the RUN choice)

**2026-10-24 22:09**

> what is the script of part 2?

**2026-10-24 22:11**

> use the run, and tell me the script

**2026-10-24 22:51**

> no make it he is searching for his body because he is a weird entity that left his body so he is getting mad that he cant find it, but doesnt talk and make it story around that

**2026-10-24 22:53**

> okay wait take part 1 script and now what I've said put it in a text file and let me download it

**2026-10-25 01:31**

> PART 2  (1:10)  -  "THE MAN IN THE SUIT"
> (the RUN choice)   **** Title card: "PART 2 - YOU CHOSE: RUN". One clock tick.   **** The frozen frame from Part 1 comes back to life. His shadow is over the desk. Without turning around, the camera lurches up and bolts straight down the hall, flashlight clicking on.   NARRATOR:
> "I didn't turn around. I grabbed the flashlight... and ran."   **** Running down the hall. Behind me, a huge crash. At ****, I look back. Nobody is there, just my desk thrown upside down against the wall.   NARRATOR:"Behind me, I heard a crash. When I looked back, nobody was there... just my desk thrown upside down."**** I reach the exit doors at the end of the hall and rattle the handles hard. They won't budge.ME (out loud, breathing heavy):"The doors are locked...!"**** I see another door right next to the exit. I rush inside, slam it shut, and lock it.NARRATOR:"So I ran into the room right next to it and locked the door."**** Inside, the flashlight moves across the walls, which are covered in old photos. It stops on one picture. A man is standing there wearing that exact yellow hazmat suit, holding the helmet under his arm. Shadows cover his eyes, but I can still recognize his face. Scratched in pen at the bottom of the photo are the words: DON'T LOOK AT HIS FACEPLATE.   NARRATOR:"When I looked around, I found this old photo on the wall."**** Slowly pushing in on the man's shadowed face in the picture.ME (whispering, confused):"Wait... this guy is the guy from the morning shift. Why does he have that suit on?"**** BAM! Something violently slams into the door and rattles the handle. BAM! BAM! The wood starts cracking. I quickly get inside a metal locker, pull the door shut, and turn off the flashlight.   NARRATOR:"Then someone started trying to break the door down, so I panicked and hid inside a locker."**** 🔥 [UPDATED - COMING TOWARD THE LOCKER] Looking through the narrow slits of the locker. The room door bursts open. The man in the hazmat suit storms in, breathing fast and heavy through his mask. His yellow suit is covered in dark red stains and dirt. He walks straight toward my locker, stepping right up to the metal door—his chest filling the slits—when he suddenly stops and glances to his side.   NARRATOR:"Then he broke the door open and walked right up to my locker. His suit was all stained and dirty now."**** 🔥 [UPDATED - THE DISTRACTION & THE OPENING] Just inches away from me, he notices the photo next to the locker and freezes. Then he slowly turns his back to me, stepping away to look at the other photos on the far wall. As he moves out of the way, I get a clear view through the broken doorway: the hall exit door is now wide open.NARRATOR:"Right before he reached for the handle, he noticed the photo... and got distracted looking at the other walls. Behind him, the exit door was wide open."**** Everything goes quiet. Suddenly, his helmet starts slowly turning away from the wall, back toward my locker—and I remember what the guard on the phone tried to warn me not to look at.   ME (whispering, panicked):"The exit is open... should I make a run for it, or just wait?"**** The picture freezes just before we see into his faceplate. The background blurs.   ON SCREEN:QUESTION 1: WHO IS IN THE SUIT?[ HIS OLD PARTNER ]  or  [ SOMETHING HE TRAPPED ]QUESTION 2: WHAT WOULD YOU DO?
> [ RUN FOR THE EXIT ]  or  [ STAY HIDDEN ]
>
> This is the 2nd part script, but look at the part 1 script and try to keep the visuals and place the same as part1 so it matches and actually becomes the part 2. dont change rooms or visuals that is different from part1.
>
> so make the 2nd part script match the same visuals as part 1 and have only little changes like the suit part he needs to be more stained and dirty.
>
> dont add voice narrator yet till, I give u the permission to do it. because I need to see first then generate to save credits.

**2026-10-25 12:55**

> why does he run so slow, make him run faster and over the table,
> at the end only one question

**2026-10-25 13:24**

> check notes and put more details in the room and make the sound effects more real.

**2026-10-25 14:50**

> its too short, we should more things to get you hooked, and add a little clip from part1, dont make a black screen w part 2 just show a little bit of previous reel with part 1 and good narrator text, then part 2

**2026-10-25 15:23**

> check the notes too

**2026-10-25 15:55**

> check the notes, make the first part w part 1 a little less just a quick good hook w saying previous part 1 or somsthing.. then choose run then u see him running

**2026-10-25 17:00**

> Try again

**2026-10-25 19:38**

> check the notes.

**2026-10-25 20:43**

> check the notes

**2026-10-25 22:28**

> check notes, and overall bring more particles and little details and little bit of shades and good lightnings shades so the contrast looks better etc. some dark spots a little darker and bright spot more bright on the objects and rooms and people.

**2026-10-26 00:53**

> check notes and make a skill on github with all these things I've said to do and how to act so everytime u can use the skill to make good animations and have good rules, and understand the whole system better.

**2026-10-26 16:27**

> why is it taking so long?

**2026-10-26 16:29**

> use my gpu then

**2026-10-26 19:49**

> bring the voice narrator in, and make the buttons and color at the end a little bit other design, it looks very ai design, make it more clean 3d type of design.

**2026-10-26 20:42**

> the text with narrator and video is a bit weird and akward sometimes, like sometimes there is weird pauses and sometimes it doesnt fit really good.

**2026-10-26 22:11** (after the repository)

> make the end part a bit smaller because there are some extra seconds with no narrations and it just weird akward silence with visuals.
>
> just cut some extra acts of the hazmat suit.
>
> dont make anything rushed, let them have natural movements and natural camera movements.

(v22: the far-wall photo-tearing act was cut. The film went from 1:39 to 1:32, and the last lines were re-placed so no gap at the end runs much over 3.5 s.)

**2026-10-26 22:44** (with two new timed notes in Part 2, written at 22:40 and 22:41)

> check the notes, so a bit more cutting to make it shorter. then the questions has to come after the last notes.

- **1:05.6** make him look around and while he is doing the thing must fall
- **1:22.6** cut the part  him hitting the lockers, and just make him open the locker.

(v23: after the photo he turns away looking round the room and crosses to the desk still looking. The box falls during that look, replacing the shelf search. At the lockers he yanks one open with no hammering, and the question comes right after his head starts to turn. The film went from 1:32 to 1:27.)

**2026-10-27 02:49** (with four new timed notes in Part 2, written at 02:45 to 02:48)

> the first part must also be a hook, so the viewer keeps watching the first 1 to 5 sec, give suggestions first.
>
> check notes.

- **0:13.8** make the crash, sound effect loud and really a desk falling to the ground
- **1:15.9** his arms glitches, fix that
- **1:20.3** he opens it weirdly with his arms, fix it
- **1:22.2** make the background have blur and the same effect as part 1, questions background effect.

(v24:
- **The crash:** a new desk crash that sounds like a real desk going over, about 4 dB louder, heard on its own for 0.4 s before the narrator comes in.
- **The desk sweep:** his arm had been reaching almost to full stretch, so the elbow flipped. He now reaches behind the things at the back of the desk and drags them off, with the elbow comfortably bent.
- **The locker:** his turn off the desk no longer gets cut short, his head no longer snaps, and his hand stays on the handle as the door swings open, then lets go and drops.
- **The question:** the frozen frame behind it is now as soft as Part 1's.
- **The opening hook:** suggestions given; waiting for the pick.)

**2026-10-27 12:33** (after the five hook suggestions)

> no make something like: what would you do if someone was behind you, and you had only two options turn around and find out or run and escape, something like this but dont yse credits yet

(v25: the recap of Part 1 is gone: the doors at 2:14, his stare, the call, the "Previously · Part 1" tag and its three narrator lines. Part 2 now opens on Part 1's last seconds under the question "What would you do if someone was behind you… and you only had two options?", its words lighting up one by one. The frame holds and blurs, the keys TURN AROUND (and find out) and RUN (and escape) come up, RUN is pressed, and the run starts at 5.6 s. Text only, no credits spent. The film went from 1:27 to 1:23; everything after the opening is 4.25 s earlier.)

**2026-10-27 13:34**

> no why is it a s text??? it should be narrated
> leave the text as it was and that shouldve been narrated before with good visuals that let the scene knows, and delete the part of recap just say part 2 run choosen
> dont use credits yet

(v26: the opening is narrated. The big words stay as they were, each lighting where the narrator says it: "What would you do if someone was behind you… and you only had two options? Turn around and find out… or run and escape." The pictures show each part: his boots and his shadow climbing over my desk, his breath at the back of my head, my eyes flicking round, my head turning toward my shoulder and snapping back, my eyes going up the hall to the doors. The keys and the RUN press are gone; the picture holds under THE GRAVEYARD SHIFT / PART 2 / RUN CHOSEN. Part 2's own sound throughout. No credits: the line is timed and ready, and the recording (about 240 credits for 2 takes) waits for their go-ahead. The film is 1:27 again.)

**2026-10-27 14:23**

> no have the visual with the question then once the shadow is standing there, it freezes like on part 1. then the other questions goed away then the next question comes then the buttons, it presses run then the part 2 starts. with smooth animations.
>
> but little change when running and turning around the lights flicker and turns dark and turns on for a sec, u see a weird shadow standing in the same shape as the hazmat suit but you cant see if thats the hazmat suit. it just stands there then the light goes off and back on he disappears then you panic and then the scene comes with trying to open the door but its locked...

(v27:
- **The opening:** "What would you do if someone was behind you…" over the live shot of his shadow climbing over my desk. Once he stands behind me the picture freezes as Part 1 ended: every sound stops dead, the frame goes soft, then the low tone. The first question drifts away and only then does the second come in its place. The keys rise one after the other, their sublabels lighting on the narrator's words. RUN is pressed with a soft click, RUN CHOSEN / PART 2 comes up under the keys, and the frozen frame comes back to life. Everything eases in and out.
- **The figure:** in the look back, after the lights die, the lobby tube catches and holds for a second. A black shape in his form stands at the end of the hall, still, so you can't tell it's him. The light drops out, catches again, and he's gone. A hit, a gasp, my eyes darting, panicked breathing, then the locked doors. The narrator's "nobody was there…" now waits until he's gone.
- **Narration:** the hook still isn't recorded; nothing spent. The film went from 1:27 to 1:30; everything after page 17.5 is 2.6 s later.)

**2026-10-27 15:40** (with two new timed notes in Part 2, written at 15:39 and 15:40)

> and get the voice memo out for a moment till we fix every scenes.
>
> check notes

- **0:14.3** here there should be a dark figure like the hazmat suit with feather on the edges, and the room must be darker and matching with the hazmat suit guy, so he really stands there far behind the room, just standing there scary, when the lights go off he gets away but everyone gets dark.
- **0:18.5** this looks very stupid and ugly, make it really match everything.

(v28:
- **The narration is out for now:** every narrator line, my two lines and the guard's remembered warning are muted in the mix, so no voice, no captions and no ducking. The take and its placements are kept; it comes back with one switch, or clip by clip in the sound editor.
- **The figure:** v27's flat black cutout under a bright light, in a moment added after the lights died, is gone. Now, as I come round at the doors, far back in the lobby, behind the overturned desk, a dark figure in his shape stands in the flicker of its tube. His own model in a dark matte skin that the room's light still shades, his outline thinning to nothing (feathered), a faint dark haze close round him. The lobby is darker than before (its lights at 55%, the corridor's tube nearest it sagging), so he belongs to it. The picture holds 2 s while I stare, pushing in slowly. The tube blows in a last flash with him in it; dark; the next flash shows the lobby empty. A hit, a gasp, my eyes darting, panic.
- The film went from 1:30 to 1:29; everything after the hold is 0.6 s earlier than v27.)

### This repository

**2026-10-26 21:28**

> make the skill better and see what I wanted to change and all the sounds and extra studios I made, and upload them all on github: https://github.com/Owtii/skill-3d-reel.git

**2026-10-27 01:17**

> make also rules about how to animate and how to design and what style to use. put it into the skill.
>
> and also how much details to make it real looking.

(The skill got `rules.md`: the approved numbers for motion, the camera, light, sets, props, figures, the UI, both looks, materials and how much detail each kind of place needs, with checklists to run before publishing.)

## Every timed note left in the pages

Each note: the page time (m:ss) where they paused, then their words. All are done. Sorted by when they were written, so the rounds show. Part 2 page times before v19 are on the old clock (recap 7.6 s); see projects.md to map them.

### The Day the Phones Jammed (1 notes)

*2026-10-20*

- **0:46.9** Make the background gaussian blur a little bit more so the phone pops more.

### The 13th Floor (25 notes)

*2026-10-20*

- **0:01.8** Make the building look like a real building but with seethrough glass, showing it's 12/13 floors then transitions to the first floor reay for next scene that normally starts from the bottom because the next scene is where he takes the elevator from first floor.
- **0:06.8** Make the elevator open its doors first then he gets in, make the elevator also a bit wider so it really looks like a elevator from the outside.
- **0:29.7** Make the scene with the key better, make the key really go inside the lock and unlocking the door. / Give a key sound effect and not a weird sound effect for the key. and a good unlocking door sound effect.
- **0:20.0** Make him wait a little bit and checking the number once more because of the number 13 then he gets out, then he looks a little slowly left and right to see the door numbers and realising it starts with 13.
- **0:44.1** Make the shadow a bit taller and more shadowy but you can only see a body figure standing there but a little more closer to the room.
- **0:44.9** Make it show that the elevator closes and goes to floor 12 and opens. and closes the door shut.
- **0:53.0** Make the light from the bathroom a little better and less gloomy but glowy, and make the bathroom sound effects sound more like a real bathroom.
*2026-10-21*

- **0:46.7** the foot steps and the shadows should be a bit thicker and darker, and give slow and subtle footstep sounds so it's more scary, dont add too much weird sounds.
- **0:37.9** When he comes in, he should look at his whole apartement a bit then when he says jacket or shoes he should then look at those objects but before he should be a little looking confusing at his room. without showing that there is someone in the shower.
- **0:52.7** Make the darkfigure have more smooth edges and have him more leaned in the door but most of his body out of the room. Make the sound when he sees the dark figure more scary and not a sound effect of a car slip, but more like something scratching sound effect.
*2026-10-22*

- **1:11.4** No dont show the shower, just have the door open slightly with lights on but you can really see inside the bathroom. / and no narration just straight background sound effects.
- **1:14.8** and just cut black with no explanation and no sound just show like 1 sec the bathroom.
- **1:04.1** make him get his phone up but he doesnt dial 911 he just picks it up to have in mind to call the police but he sees the message and reads it and then the lights and door is open in the bathroom while reading the sentence and the narration stop reading till he sees elevator is out of sercvie take the...
- **1:02.3** the phone shouldnt be already on the be, because it shouldve always been with him.
- **0:52.6** the black figure should be leaning outside his room with +-85% with his body out. and his shoulders still looks attached with his arms, it should be seamless and not looking like a doll or robot. and the head should not tilt too much.
- **0:41.3** make the jacket look a bit more realistic. because the weird black thing on the green jacket is not correct.
- **0:01.5** the outline white border of the building is too thick, it should be way less thick. only the top part white can be.
- **1:06.1** Make the phone better looking, no service and battery looks bad UI. and make the phone less shaky.
- **1:12.8** Make the voice fade out and he looks up fast because the lights goes on and the shower starts running, and the door is going to get more open but slowly but the video stops and it ends. so no one knows how the bathroom looks like and who is behind it.
- **0:52.6** Make him a bit more standing straight not too hunched over to his side.
- **0:22.2** Make him look 0.4s more at the number when it becomes 13 and when lifts open he looks forward. so there will be a little more notice when the 12 turns to 13.
- **1:08.0** make the message already been there but he just noticed it, and make the text like 5h ago, and it says elevator is out of service. / and he reads it with his own voice whispering but once he gets at the please the moment hits.
- **0:20.3** you removed the little part where he looks back at the 13, bring it back but dont change anything else, just a little quickc look back at the number 13.
- **1:04.5** the phone part is too long, its too long on the phones black screen, thats a whole 2 - 3 seconds. / It must be: I took out my phone (turns phone on), to call the po-... / reads then the notes then again mid sentence he hears the light pops up and he brings his phone down not too quick, then the door opens slowly with the sound effects. / When the screen turns black make the end black for a 1 extra second.
- **0:01.6** Make also the 13th floor visual more a clear seethrough scary dark floor, and make the camera movements better showing the building and then the 13 floor then back to the floor.

### The Graveyard Shift, Part 1 (37 notes)

*2026-10-23*

- **1:11.9** make it like 0.1s shorter the moment where he looks at him.
- **0:22.3** make this transition better and more smooth
- **0:13.2** make the eye whimp better it looks a bit weird. like it feels he didnt fully closed his eye because the sides are still open but middle closed.
- **0:35.7** make him look for a 0.8 sec longer
- **1:08.5** dont shake too much with the camera just a little bit.
- **0:40.7** make him hunched forward when he enters the door because he is taller than the door frame.
- **0:30.1** his suit is good only thing is his hands its glitching through the yellow suit, fix that.
- **1:11.2** make the face screen at the end only a little bit see through and you see a dark face looking but not very good still foggy, you just see the figure of an dark eye and dark mouth and little face shape. / but you cant tell if its a real humand or really have eyes or a nose
- **0:48.3** make him look a little bit more at the phone and hallway and things around but more at the phone. not too much but just very casual and slowly.
- **0:34.9** make him look longer 1 sec longer
- **1:03.6** make also when he looks right or left he hears weird sounds coming like things fall or something getting knocked or pressed. / then before he turns around he hears something from behind then when he looks he sees him.
- **0:38.1** when he turns back to go to the door, make his head turn first then his body.
- **0:41.8** when he walks trough the door make his head only go down and a little bit hunched because it will make it more scary.
- **0:43.0** when goes inside make it shadowy and so it really looks like he is going inside.
- **0:22.8** make this transition more blurry and smooth, so you know its a transition.
- **0:22.2** make the transition smooth because its not smooth
- **0:22.6** do another blinking transition for this
- **0:00.0** make the beginning a cinematic shot for the hook
- **0:48.9** why is there a random pause here?
- **0:22.5** Here dont keep looking and tracking him as the pov camera, just have a look at him then look forward or at your tv then back, then back forward then he passes by then when the narrator says I was asking then he stops. then you can like keep looking at him. / but when he passes by have a little jump scare for the pov.
- **0:25.6** no dont make it too sudden the camera movement and dont use jumpscare sound effect, / make it more casual the looking around, and smooth camera movements.
- **0:34.3** make a buildup sound effect and scary little bit zoomin in, then drop it.
- **1:07.7** use here a scary sound effect, like almost screaming. that gets cut off when he sees him. / make it a jumpscare.
*2026-10-24*

- **0:58.6** make the cut off sound effect like a real call getting cut off, the long beep and clearly show too that it has been cut off.
- **1:03.4** make the shadow more a human figure, dont add extra light because it got more bright on the end. just use a overlay shadow of a human figure that comes behind him. with some footsteps sound effects. / also make the camera movement when the shadow comes from behind move a little bit and zoom a little, just to show that he is getting focused, but not too much.
- **0:18.0** making him walking around and working in the hallway not close.
- **1:00.8** why does the table move? fix that. / Also note for everything not only this timestamp. make the paper on the desk not glitch through each other.
- **1:04.2** make him look more left and right but very slowly.
- **1:05.3** Dont let the camera turn around. freeze the scene and blur it out on the background. and make the button and or a better ui design to really choose in between these 2 buttons, give it 2 colors like red and blue but darker so it matches the theme.
- **0:28.7** when looking down, make him do something small so it makes sense that he is looking down.
- **0:35.2** there is little glitch at this timestamp 0:34-0:35 with the hazmat suit, fix that little glitch/twitch on his shoulder.
- **0:36.6** bring little shadows on it so it really feels like he is entering the door.
- **0:37.4** for this transition make the background get also a small radial blur or something like the time is getting fast forwarded with a little sound effect, but keep the focus on the clock that doesnt change tho.
- **0:37.8** but give the clock sound a real clock sounds. so update it to a better clock tick sound.
- **0:30.5** make it have a little more effects like it gets a bit darker and light flickers a bit. with a scary lasting sound effect.
- **0:59.0** there is a little weird camera movement on this time stamp when he wants to look at the phone, fix that.
- **1:08.9** delete the icons, only text, centred and with correct padding. / make the 'or' just text no border or background color.

### The Graveyard Shift, Part 2 (83 notes)

*2026-10-25*

- **0:06.4** make the camera turn around better.
- **0:12.1** here also the camera movement is very bad, make it more smooth.
- **0:17.7** bring more details and make it really look like you lock the door.
- **0:35.0** make the locker also better design and have smaller gaps so you can see barely.
- **0:39.7** make the guy not so robotic and let him move more real, and let him look around first then go to the locker before he comes he looks at the side of the locker then turns around but slowly with his head then his body like he is checking the room out.
- **0:49.3** the door should already be open, it should be open from the beginning and make it you can see a way to exit instead of dark black room.
- **1:02.6** make the questions centred
- **0:24.7** make the photos more real, like make a picture of a 3d moduled person.
- **0:02.6** make it look really that he jumps over the table and running forward.
- **0:12.6** make it really look he is pulling the door, make him then look around a little bit more sec then looking confused he goes inside the room, there he is looking around too.
- **0:28.5** no text, and make his face not really shown cuz of a shadow casting but you can little bit see his chin and face.
- **0:22.1** make the other photos more random people not only the hazmat suit.
- **0:42.8** make him not come too close, but make him stand infront of the locker and moving slowly to the locker but then disctracted by something beside the locker with the photo.
- **0:49.7** make the camera pov look a little bit better trhough the slits and focus a bit more on the exit and zoom a little at the exit. smooth vanera movements. the look back at the guy.
- **0:11.6** make it really a sound of a table/desk falling on the ground and making lots of noises.
- **0:02.4** Delete the previously on the graveyard shift and the red dot. / Make it just part1. and use the sound effects I really put and deleted from the last part, dont add ur own sound effects. I already deleted one weird sound effect.
- **0:08.5** make it more realistic jumping over his desk with the camera movement.
- **0:40.7** make the sounds harder and louder with real bonking on the door sound effect.
- **0:30.2** make him walk and watch around with his flashlight.
- **0:31.7** Make him double look at the photo in a smooth way and walk a littlbe bit forward to see the photo. / write a text on under the photo: I'M SORRY
- **0:36.3** dont zoom too much on it.
- **0:41.9** make the sound effect of the locker better when opening and shuting it down. make it sound like a real locker door.
- **0:43.7** when goes inside make it more smooth with no weird akward pose when goes inside he shutting the door with him smoothly so there wont be an awkard pause.
- **0:52.0** there is a weird cut around this moment with the guy in hamzat suit.
- **0:52.0** make his sound effect more scary and hollow breathing scary sound.
- **0:56.4** dont make him touch the door just let him come close and walk slowly but the his head tilts to the side watches the same picture we watched then he walks backwards and turning with his around the room and watching other things.
- **1:07.2** make something fall on the right side of the room, opposite form the door. make him then walk towards the thing that falls but he takes a quick look at the locker door then looks at the thing that fell.
- **0:04.6** you still see the text of: ...and do not look at-. when it already passed the scene, fix that.
- **0:03.0** you still see the text of:he jsut stared at me. when it already passed the scene, fix that.
- **0:01.6** you see the he walked in text. when its a transition
- **0:00.3** make the part1 something like previous and something with part1 text. but it should be not too much just something small, so u understand.
- **0:39.5** make the banging on the door very loud and shocking
- **0:43.9** make the banging on the door still go on even when he goes inside the locker.
- **0:47.2** make the door open hard but you can still see it get opened. and he should be walk smoothly and slowly in looking around and he is taller than the door so he should be hunching a bit so he gets under the door. make him walk also scarier and slow.
- **0:50.3** he is looking around too fast and robotic. make it more natural looking and make him watch slowly around and walking slowly too. he shouldnt be looking outside the exit tho. only the room.
- **0:54.9** make him hunch and look a bit more deeply to the locker but not touching or doing anything then slowly turn his head to the photo beside it.
- **1:07.4** he walks through the desk. fix that, make sure that never happends ever again.
- **1:09.5** make the thing that falls far right in the room, so opposite of the door, so his attention goes that way, but before he goes he takes a quick smoothly, natural look at the locker then walks to the thing that fell.
- **1:16.2** make him getting mad and breath heavier
- **1:11.9** the quick look is too quick must be more smooth and little bit slower
- **1:15.4** make him hit things because he is mad, dont change the camera movement here, just he has to hit things.
- **0:18.3** make him go a little bit closer tot he door, pull harder. with harder sound effects.
- **0:11.7** make him look behind a little bit faster, like he is scared. and also make him run a little bit faster so he gets at the door then he turns.
- **0:08.4** make here a big sound effects like smashing or little scream or anything.
- **1:09.7** here looking at the thing that fell, is too quick make it more natural and smoother.
- **1:16.4** make the text narrator: this might be my chance.. something like this. / dont say like or just stay.
- **0:50.4** make his footsteps sound effects heavier and more loud
- **0:58.0** when he looks at the photo make his body move a little bit to the photo.
- **1:13.4** make him look slower to the locker and slower to the thing that fell.
- **0:17.5** I feel a little bit that the camera is too mcuh zoomed, zoom out a little bit like 0.9x
- **0:26.1** make him stop a little bit and look around quick then he start looking more deeply into the room
- **1:16.6** he is just standing and hitting something, make it more sense like he is getting angry for a reason and like breaking stuff etc. not just randomly hitting
- **0:11.0** when he gets there make him turn smoothly around when he looks back so it looks like he is backing up and looking behind, and make the room where the desk is overthrown flicker the light to see the place a bit better. / and have better sound effects something that really that uses in real movies.
- **0:14.2** beter lightt sound effects that relaly sounds like light getting cut off.
- **0:40.6** make it louder first bang should be very loud and hard.
- **1:19.0** the movement looks very weird, fix that.
- **1:20.5** make him do something but you are just looking at the exit and the guy a little bit scared.
- **1:26.9** make him turn around the locker a bit then with his face. but right before he wants to turn around, it starts with the questions.
- **1:01.9** make him turn around with his foot too, not just turn around magically.
*2026-10-26*

- **1:02.9** make the movements more natural, it stil looks weird.
- **1:23.8** looking around too much... make it less and smooth and little slower
- **0:26.0** make the camera movements at these moments 26 - 28 better and smoother more natural.
- **1:16.9** he should not pick up things he should just watch around and state a bit at the thing that fell then look around start hitting some things,
- **0:13.4** make the breathing sound effect more realistic and add louder heartbeats
- **0:51.7** make the text something more accurate to the scene
- **0:59.6** make this text also something more accurate to the scene and keep it little mysterious
- **1:12.8** the breathing sound effect is weird it should come from the hazmat suit but it sounds Il breath like that. make it a bit more realistic scary breathing of the haxmat guy
- **1:01.3** make him move a bit more to the right like really watching stuff there and make him turn around watching the room then walking to the other wall
- **1:12.2** make him walk to the right and then he sees something fall and he hits another locker or desk  in there
- **1:26.8** make him move to other lockers and hit them
- **0:43.0** the partials are weird when they drop from the door its too organized
- **1:24.5** this movement of him is very weird change that. dont make him do too weird movements. / it feels very robotic
- **1:28.4** why is so close to him, he should be busy with lockers somewhere right of the camera not on the left.
- **1:29.8** make him open one of the lockers.
- **1:01.8** it says it freeze but then walks, so the text dont make sense
- **1:22.6** cut the part  him hitting the lockers, and just make him open the locker.
- **1:05.6** make him look around and while he is doing the thing must fall
*2026-10-27*

- **1:22.2** make the background have blur and the same effect as part 1, questions background effect.
- **1:15.9** his arms glitches, fix that
- **1:20.3** he opens it weirdly with his arms, fix it
- **0:13.8** make the crash, sound effect loud and really a desk falling to the ground
- **0:14.3** here there should be a dark figure like the hazmat suit with feather on the edges, and the room must be darker and matching with the hazmat suit guy, so he really stands there far behind the room, just standing there scary, when the lights go off he gets away but everyone gets dark.
- **0:18.5** this looks very stupid and ugly, make it really match everything.
