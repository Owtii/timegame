import { M, PROTOCOL_VERSION } from '/shared/protocol.js';

/**
 * WebSocket link with reconnect and round-trip timing. Both the phone and the
 * game pages use this; the only difference is the role they announce.
 */
export class Link extends EventTarget {
  constructor({ role, name = '', token = null } = {}) {
    super();
    this.role = role;
    this.name = name;
    this.token = token;
    this.ws = null;
    this.ready = false;
    this.slot = null;
    this.id = null;
    this.rtt = 0;
    this.players = [];
    this.retry = 0;
    this.closedByUs = false;
    this.lastError = '';
  }

  get url() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }

  connect() {
    this.closedByUs = false;
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    this.#emit('status', { state: 'connecting' });

    let ws;
    try {
      ws = new WebSocket(this.url);
    } catch (err) {
      this.#scheduleRetry(err.message);
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      ws.send(JSON.stringify({
        m: M.HELLO, v: PROTOCOL_VERSION, role: this.role, name: this.name, token: this.token,
      }));
    };

    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      switch (msg.m) {
        case M.WELCOME:
          this.ready = true;
          this.slot = msg.slot;
          this.id = msg.id;
          this.name = msg.name || this.name;
          this.#emit('status', { state: 'open', slot: msg.slot });
          this.#emit('welcome', msg);
          return;
        case M.PING:
          this.send({ m: M.PONG, t: msg.t });
          return;
        case M.ROSTER:
          this.players = msg.players;
          this.rtt = msg.players.find((p) => p.id === this.id)?.rtt ?? this.rtt;
          this.#emit('roster', msg);
          return;
        case M.ERROR:
          this.lastError = msg.error;
          this.#emit('status', { state: 'error', error: msg.error, fatal: !!msg.fatal });
          return;
        default:
          this.#emit('message', msg);
      }
    };

    ws.onclose = (ev) => {
      this.ready = false;
      if (this.closedByUs) return this.#emit('status', { state: 'closed' });
      this.#scheduleRetry(ev.reason || `closed (${ev.code})`);
    };

    ws.onerror = () => { /* onclose always follows; reported there */ };
  }

  #scheduleRetry(reason) {
    this.#emit('status', { state: 'reconnecting', error: reason });
    const wait = Math.min(8000, 400 * 2 ** this.retry++);
    clearTimeout(this._retryTimer);
    this._retryTimer = setTimeout(() => this.connect(), wait);
  }

  send(obj) {
    if (this.ws?.readyState !== 1) return false;
    this.ws.send(JSON.stringify(obj));
    return true;
  }

  close() {
    this.closedByUs = true;
    clearTimeout(this._retryTimer);
    this.ws?.close(1000, 'bye');
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export function tokenFromUrl() {
  const p = new URLSearchParams(location.search);
  return p.get('t') || p.get('token') || localStorage.getItem('phonemote.token') || null;
}
