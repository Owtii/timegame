/**
 * Wire protocol shared by the server, the phone controller and the game clients.
 *
 * Everything is JSON over one WebSocket. Messages are `{ m: <type>, ... }`.
 * High-rate state frames are the only thing sent continuously; buttons and
 * gestures are sent as discrete events so a fast tap can never be dropped by
 * the state sampler.
 */

export const PROTOCOL_VERSION = 1;

export const M = {
  // client -> server
  HELLO: 'hello',
  STATE: 'state',
  EVENT: 'event',
  RUMBLE: 'rumble',
  PONG: 'pong',
  CONFIG: 'config',
  // server -> client
  WELCOME: 'welcome',
  ROSTER: 'roster',
  PING: 'ping',
  ERROR: 'error',
};

export const ROLE = { CONTROLLER: 'controller', GAME: 'game' };

/** Wii-style button set. Sent as a bitfield in state frames. */
export const BUTTONS = [
  'a', 'b', 'one', 'two', 'plus', 'minus', 'home',
  'up', 'down', 'left', 'right',
  'c', 'z',
];

export const BIT = Object.fromEntries(BUTTONS.map((name, i) => [name, 1 << i]));

export function packButtons(held) {
  let bits = 0;
  for (const name of BUTTONS) if (held[name]) bits |= BIT[name];
  return bits;
}

export function unpackButtons(bits) {
  const out = {};
  for (const name of BUTTONS) out[name] = (bits & BIT[name]) !== 0;
  return out;
}

/** Discrete gesture kinds emitted by the motion pipeline. */
export const GESTURE = {
  SWING: 'swing',   // fast sweep of the whole arm, has a direction + strength
  SHAKE: 'shake',   // repeated back-and-forth oscillation
  THRUST: 'thrust', // short stab along the pointing axis
  TWIST: 'twist',   // sharp roll about the pointing axis
};

/** The four player slots, Wii-style, with the colours used for cursors. */
export const SLOT_COLORS = ['#4cc9ff', '#ff5d73', '#ffd166', '#7ee787'];

/** Shape of a state frame, for reference (not enforced at runtime):
 *
 * {
 *   m: 'state', seq, t,            // sequence number + controller clock (ms)
 *   ori:  { yaw, pitch, roll },    // degrees, relative to the calibrated centre
 *   quat: [w, x, y, z],            // fused orientation, device -> world
 *   gyro: [x, y, z],               // deg/s, bias corrected, device frame
 *   acc:  [x, y, z],               // m/s^2 incl. gravity, device frame
 *   lin:  [x, y, z],               // gravity removed, world frame
 *   ptr:  { x, y, out },           // 0..1 screen space, `out` = aiming off-screen
 *   rel:  [dx, dy],                // mouse-style delta since the last frame
 *   mot:  { energy, peak },        // motion magnitude, for rumble/feel
 *   btn:  <bitfield>,
 *   stick: [x, y],                 // virtual nunchuk stick, -1..1
 * }
 */
export const STATE_HZ = 60;
