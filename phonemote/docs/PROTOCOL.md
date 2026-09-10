# Wire protocol

One WebSocket at `/ws`, JSON messages, every one shaped `{ "m": "<type>", ... }`.
The definitive list of types and the button bitfield live in
[`shared/protocol.js`](../shared/protocol.js), which the server and both web
pages import, so there is only one copy.

Current version: **1** (`PROTOCOL_VERSION`).

## Connecting

Every client says hello first. The server answers `welcome` or closes the
socket.

```jsonc
// client -> server
{ "m": "hello", "v": 1, "role": "controller", "name": "iPhone", "token": "K7QMR" }
// role is "controller" (a phone) or "game" (something that consumes input)

// server -> client
{ "m": "welcome", "v": 1, "id": 3, "slot": 0, "role": "controller", "name": "iPhone", "t": 1770000000000 }
```

`slot` is the player number, 0–3, and is null for games. A fifth controller is
refused with `{ "m": "error", "error": "all four player slots are in use", "fatal": true }`.

Connections from localhost skip the token check; everything else must present
it. The token is only served to localhost, so it cannot be read off the network.

## State, 60 times a second

Controllers stream this. The server tags each frame with `slot` and `id` and
forwards it to every game client.

```jsonc
{
  "m": "state",
  "seq": 4213,                    // increments, so drops are visible
  "t": 1770000000123,             // controller clock, milliseconds
  "ori":  { "yaw": -12.4, "pitch": 3.1, "roll": 21.8 },   // degrees, relative to the re-centre point
  "quat": [0.99, 0.02, -0.11, 0.03],                       // fused orientation, device -> world (w,x,y,z)
  "gyro": [1.2, -0.4, 30.1],      // deg/s, bias corrected, device frame
  "acc":  [0.1, 0.3, 9.7],        // m/s^2 including gravity, device frame
  "lin":  [0.2, -1.1, 0.4],       // gravity removed, world frame
  "ptr":  { "x": 0.32, "y": 0.58, "out": false },          // 0..1 screen space; out = aiming off-screen
  "rel":  [0.004, -0.001],        // change in pointer since the last frame, for mouse-style use
  "mot":  { "energy": 1.8, "still": false },
  "btn":  6,                      // bitfield, see below
  "stick": [0.0, 0.0]             // virtual thumbstick, -1..1
}
```

Numbers are rounded before sending: two decimals for angles and
accelerations, three for the pointer. At 60 Hz that is roughly 40 kbit/s.

### Button bitfield

`a b one two plus minus home up down left right c z`, in that order, bit 0
upward. `packButtons` and `unpackButtons` in the shared module do the work, so
nothing else needs to know the order.

## Events

Anything a game must not miss is its own message rather than something sampled
out of the state stream: a 40 ms tap can fall between two frames.

```jsonc
{ "m": "event", "kind": "button",  "button": "b", "down": true, "t": 1770000000123 }
{ "m": "event", "kind": "gesture", "gesture": "swing", "strength": 0.74, "axis": "right",
  "dir": [0.8, -0.1, 0.5], "t": 1770000000123 }
```

`gesture` is one of `swing`, `shake`, `thrust`, `twist`. `strength` is 0–1 and
`axis` is the dominant direction of a swing (`up`, `down`, `left`, `right`,
`forward`, `back`). Each kind has its own refractory period, so one physical
swing produces exactly one event.

## Back to the phone

```jsonc
// game -> server -> the phone in that slot
{ "m": "rumble", "slot": 0, "ms": 150, "strength": 0.8 }
{ "m": "config", "slot": 0, "config": { "sensitivity": 1.4, "fov": 40 } }
```

Vibration motors have no intensity control on the web, so a weak rumble is sent
to the phone as a stutter rather than a shorter buzz.

`config` lets a game push controller settings — a sniper scope that halves
sensitivity while you aim, for instance.

## Housekeeping

```jsonc
{ "m": "ping",  "t": 1770000000000 }   // server -> everyone, every 2 s
{ "m": "pong",  "t": 1770000000000 }   // client echoes it straight back
{ "m": "roster", "players": [ { "id": 3, "slot": 0, "name": "iPhone", "rtt": 7 } ], "games": 1 }
```

Round trip time is measured from the ping/pong pair and reported in the roster,
which is how the phone and the game both show a latency figure. A client that
goes 12 seconds without a word is dropped.

## Writing your own game against it

You need three things, and `public/lib/` has all of them already:

```js
import { Link } from '/lib/net.js';
import { Pads } from '/lib/pads.js';

const link = new Link({ role: 'game', name: 'My game' });
const pads = new Pads(link);
link.connect();

function frame() {
  requestAnimationFrame(frame);
  for (const pad of pads.active) {
    const x = pad.ptr.x * canvas.width;
    const y = pad.ptr.y * canvas.height;
    if (pad.takePress('b')) shoot(x, y);
    if (pad.takeGesture('swing')) slash(x, y);
    if (pad.btn.up) walkForward();
    pad.flush();          // drop anything you did not read this frame
  }
}
```

`pads.rumble(slot, ms, strength)` sends the buzz back. `pads.enableLocal()`
gives you a mouse-and-keyboard stand-in so the game is playable with no phone
attached, which is worth having from day one.
