import { M, ROLE, PROTOCOL_VERSION } from '../shared/protocol.js';

const MAX_SLOTS = 4;
const PING_INTERVAL = 2000;
const DEAD_AFTER = 12000;

let nextId = 1;

/**
 * Keeps track of who is connected, hands controllers a player slot and relays
 * state frames from controllers to every game client. The hub is deliberately
 * dumb: it does not interpret motion, it only forwards and keeps the last
 * frame per player so a game that connects late starts with valid input.
 */
export class Hub {
  constructor({ token = null, onChange = () => {}, onInput = null } = {}) {
    this.token = token;
    this.onChange = onChange;
    this.onInput = onInput;
    this.clients = new Map();
    this.timer = setInterval(() => this.#tick(), PING_INTERVAL);
    this.timer.unref?.();
  }

  get controllers() {
    return [...this.clients.values()].filter((c) => c.role === ROLE.CONTROLLER);
  }

  get games() {
    return [...this.clients.values()].filter((c) => c.role === ROLE.GAME);
  }

  add(ws, { trusted = false, address = '' } = {}) {
    const client = {
      id: nextId++,
      ws,
      role: null,
      name: '',
      slot: null,
      trusted,
      address,
      seenAt: Date.now(),
      rtt: 0,
      lastState: null,
      frames: 0,
    };
    this.clients.set(client.id, client);

    ws.on('message', (raw) => this.#onMessage(client, raw));
    ws.on('close', () => this.#remove(client));
    ws.on('error', () => this.#remove(client));
    return client;
  }

  #remove(client) {
    if (!this.clients.delete(client.id)) return;
    this.#broadcastRoster();
    this.onChange(this.summary());
  }

  #onMessage(client, raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return; // a malformed frame is not worth killing the connection over
    }
    if (!msg || typeof msg.m !== 'string') return;
    client.seenAt = Date.now();

    if (msg.m === M.HELLO) return this.#onHello(client, msg);
    if (!client.role) return send(client.ws, { m: M.ERROR, error: 'say hello first' });

    switch (msg.m) {
      case M.STATE:
        if (client.role !== ROLE.CONTROLLER) return;
        client.frames++;
        client.lastState = msg;
        this.#toGames({ ...msg, slot: client.slot, id: client.id });
        this.onInput?.(msg, client);
        return;

      case M.EVENT:
        if (client.role !== ROLE.CONTROLLER) return;
        this.#toGames({ ...msg, slot: client.slot, id: client.id });
        this.onInput?.(msg, client);
        return;

      case M.RUMBLE: {
        if (client.role !== ROLE.GAME) return;
        const target = this.controllers.find((c) => c.slot === msg.slot);
        if (target) send(target.ws, { m: M.RUMBLE, ms: msg.ms, strength: msg.strength });
        return;
      }

      case M.CONFIG: {
        // Let a game push settings (pointer FOV, sensitivity...) to one pad.
        const target = this.controllers.find((c) => c.slot === msg.slot);
        if (target) send(target.ws, { m: M.CONFIG, config: msg.config });
        return;
      }

      case M.PONG:
        if (typeof msg.t === 'number') client.rtt = Date.now() - msg.t;
        return;
    }
  }

  #onHello(client, msg) {
    if (this.token && !client.trusted && msg.token !== this.token) {
      send(client.ws, { m: M.ERROR, error: 'bad-token', fatal: true });
      client.ws.close(4003, 'bad token');
      return;
    }
    if (msg.v && msg.v !== PROTOCOL_VERSION) {
      send(client.ws, {
        m: M.ERROR,
        error: `protocol mismatch (server ${PROTOCOL_VERSION}, client ${msg.v}) - reload the page`,
      });
    }

    client.role = msg.role === ROLE.GAME ? ROLE.GAME : ROLE.CONTROLLER;
    client.name = String(msg.name || '').slice(0, 24);

    if (client.role === ROLE.CONTROLLER) {
      const taken = new Set(this.controllers.map((c) => c.slot));
      client.slot = null;
      for (let s = 0; s < MAX_SLOTS; s++) {
        if (!taken.has(s)) { client.slot = s; break; }
      }
      if (client.slot === null) {
        send(client.ws, { m: M.ERROR, error: 'all four player slots are in use', fatal: true });
        client.ws.close(4004, 'full');
        return;
      }
      if (!client.name) client.name = `Player ${client.slot + 1}`;
    }

    send(client.ws, {
      m: M.WELCOME,
      v: PROTOCOL_VERSION,
      id: client.id,
      slot: client.slot,
      role: client.role,
      name: client.name,
      t: Date.now(),
    });

    // A game joining late gets the current state of every pad right away.
    if (client.role === ROLE.GAME) {
      for (const c of this.controllers) {
        if (c.lastState) send(client.ws, { ...c.lastState, slot: c.slot, id: c.id });
      }
    }

    this.#broadcastRoster();
    this.onChange(this.summary());
  }

  #toGames(msg) {
    const payload = JSON.stringify(msg);
    for (const g of this.games) {
      if (g.ws.readyState === 1) g.ws.send(payload);
    }
  }

  #broadcastRoster() {
    const roster = {
      m: M.ROSTER,
      players: this.controllers
        .sort((a, b) => a.slot - b.slot)
        .map((c) => ({ id: c.id, slot: c.slot, name: c.name, rtt: c.rtt })),
      games: this.games.length,
    };
    const payload = JSON.stringify(roster);
    for (const c of this.clients.values()) {
      if (c.role && c.ws.readyState === 1) c.ws.send(payload);
    }
  }

  #tick() {
    const now = Date.now();
    for (const c of this.clients.values()) {
      if (now - c.seenAt > DEAD_AFTER) {
        c.ws.terminate?.();
        this.#remove(c);
        continue;
      }
      send(c.ws, { m: M.PING, t: now });
    }
    if (this.clients.size) this.#broadcastRoster();
  }

  summary() {
    return {
      players: this.controllers
        .sort((a, b) => a.slot - b.slot)
        .map((c) => ({ slot: c.slot, name: c.name, rtt: c.rtt, frames: c.frames })),
      games: this.games.length,
    };
  }

  close() {
    clearInterval(this.timer);
    for (const c of this.clients.values()) c.ws.close(1001, 'server shutting down');
  }
}

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}
