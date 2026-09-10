import { M, BUTTONS, unpackButtons, SLOT_COLORS } from '/shared/protocol.js';

/**
 * Game-side view of the connected phones. One `Pad` per player slot, holding
 * the latest motion frame plus queues for things a game must not miss: button
 * presses and gestures. A quick tap can land between two frames, so presses
 * arrive as their own events and are buffered until the game reads them.
 */
export class Pad {
  constructor(slot) {
    this.slot = slot;
    this.name = `Player ${slot + 1}`;
    this.color = SLOT_COLORS[slot % SLOT_COLORS.length];
    this.connected = false;
    this.local = false;
    this.ptr = { x: 0.5, y: 0.5, out: false };
    this.ori = { yaw: 0, pitch: 0, roll: 0 };
    this.quat = [1, 0, 0, 0];
    this.gyro = [0, 0, 0];
    this.acc = [0, 0, 9.81];
    this.lin = [0, 0, 0];
    this.stick = [0, 0];
    this.energy = 0;
    this.rtt = 0;
    this.lastSeen = 0;
    this.btn = Object.fromEntries(BUTTONS.map((b) => [b, false]));
    this.presses = [];
    this.releases = [];
    this.gestures = [];
  }

  /** True once, for the frame in which the button went down. */
  takePress(name) {
    const i = this.presses.indexOf(name);
    if (i === -1) return false;
    this.presses.splice(i, 1);
    return true;
  }

  takeRelease(name) {
    const i = this.releases.indexOf(name);
    if (i === -1) return false;
    this.releases.splice(i, 1);
    return true;
  }

  /** Pull one gesture of a kind off the queue, if it happened. */
  takeGesture(kind) {
    const i = this.gestures.findIndex((g) => g.gesture === kind);
    if (i === -1) return null;
    return this.gestures.splice(i, 1)[0];
  }

  /** Drop anything the game did not read, so it cannot fire a second later. */
  flush() {
    this.presses.length = 0;
    this.releases.length = 0;
    this.gestures.length = 0;
  }
}

export class Pads extends EventTarget {
  constructor(link) {
    super();
    this.link = link;
    this.pads = [0, 1, 2, 3].map((s) => new Pad(s));
    this.rumbleUntil = [0, 0, 0, 0];

    link.addEventListener('message', (e) => this.#onMessage(e.detail));
    link.addEventListener('roster', (e) => {
      const byslot = new Map(e.detail.players.map((p) => [p.slot, p]));
      for (const pad of this.pads) {
        const info = byslot.get(pad.slot);
        const was = pad.connected;
        // A real phone claiming this slot takes it over from the local stand-in.
        if (info && pad.local) pad.local = false;
        pad.connected = !!info || pad.local;
        if (info) { pad.name = info.name; pad.rtt = info.rtt; }
        if (pad.connected !== was) {
          this.dispatchEvent(new CustomEvent(pad.connected ? 'join' : 'leave', { detail: pad }));
        }
      }
    });
  }

  get active() { return this.pads.filter((p) => p.connected); }
  get(slot) { return this.pads[slot]; }

  #onMessage(msg) {
    const pad = this.pads[msg.slot ?? 0];
    if (!pad) return;
    pad.lastSeen = performance.now();

    if (msg.m === M.STATE) {
      pad.connected = true;
      if (msg.ptr) pad.ptr = msg.ptr;
      if (msg.ori) pad.ori = msg.ori;
      if (msg.quat) pad.quat = msg.quat;
      if (msg.gyro) pad.gyro = msg.gyro;
      if (msg.acc) pad.acc = msg.acc;
      if (msg.lin) pad.lin = msg.lin;
      if (msg.stick) pad.stick = msg.stick;
      if (msg.mot) pad.energy = msg.mot.energy;
      // The bitfield is authoritative for held state; presses come as events.
      Object.assign(pad.btn, unpackButtons(msg.btn || 0));
      return;
    }

    if (msg.m === M.EVENT) {
      if (msg.kind === 'button') {
        pad.btn[msg.button] = !!msg.down;
        (msg.down ? pad.presses : pad.releases).push(msg.button);
      } else if (msg.kind === 'gesture') {
        pad.gestures.push(msg);
      }
      this.dispatchEvent(new CustomEvent('input', { detail: { pad, msg } }));
    }
  }

  /** Ask a phone to buzz. Ignored if that phone is already buzzing. */
  rumble(slot, ms = 150, strength = 1) {
    const now = performance.now();
    if (now < this.rumbleUntil[slot]) return;
    this.rumbleUntil[slot] = now + ms * 0.6;
    this.pads[slot]?.local
      ? navigator.vibrate?.(ms)
      : this.link.send({ m: M.RUMBLE, slot, ms, strength });
  }

  /**
   * Mouse and keyboard stand-in for player 1, so the game is playable (and
   * testable) with no phone attached.
   *   move   = aim        left click = B / shoot    right click = A
   *   R      = shake      Space      = swing        T = twist
   */
  enableLocal(target = window, slot = null) {
    // Never fight a phone for a slot: take the first one nobody is using.
    const chosen = slot ?? (this.pads.find((p) => !p.connected)?.slot ?? 0);
    const pad = this.pads[chosen];
    pad.local = true;
    pad.connected = true;
    pad.name = 'Keyboard + mouse';

    const el = target === window ? document.documentElement : target;
    el.addEventListener('mousemove', (e) => {
      if (!pad.local) return;
      pad.ptr = { x: e.clientX / innerWidth, y: e.clientY / innerHeight, out: false };
    });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('mousedown', (e) => {
      if (!pad.local) return;
      const name = e.button === 2 ? 'a' : 'b';
      pad.btn[name] = true;
      pad.presses.push(name);
    });
    el.addEventListener('mouseup', (e) => {
      if (!pad.local) return;
      const name = e.button === 2 ? 'a' : 'b';
      pad.btn[name] = false;
      pad.releases.push(name);
    });
    window.addEventListener('keydown', (e) => {
      if (e.repeat || !pad.local) return;
      const g = { r: 'shake', ' ': 'swing', t: 'twist', f: 'thrust' }[e.key.toLowerCase()];
      if (g) { pad.gestures.push({ kind: 'gesture', gesture: g, strength: 0.8, axis: 'right' }); return; }
      const b = { Enter: 'a', Shift: 'b', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', '1': 'one', '2': 'two' }[e.key];
      if (b) { pad.btn[b] = true; pad.presses.push(b); }
    });
    window.addEventListener('keyup', (e) => {
      if (!pad.local) return;
      const b = { Enter: 'a', Shift: 'b', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', '1': 'one', '2': 'two' }[e.key];
      if (b) { pad.btn[b] = false; pad.releases.push(b); }
    });
    this.dispatchEvent(new CustomEvent('join', { detail: pad }));
    return pad;
  }
}
