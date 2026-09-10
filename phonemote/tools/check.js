#!/usr/bin/env node
/**
 * End-to-end check with no browser and no phone: boots the server on a spare
 * port, fetches every page, then wires a fake controller to a fake game and
 * asserts that input actually arrives (and that pairing is enforced).
 *
 *   npm test
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { networkInterfaces } from 'node:os';
import WebSocket from 'ws';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.CHECK_PORT || 8499);
const TOKEN = 'TEST42';
const BASE = `https://127.0.0.1:${PORT}`;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Minimal stand-in for a `ws` socket, enough for the hub to talk to. */
function fakeSocket() {
  const listeners = {};
  return {
    readyState: 1,
    sent: [],
    closedWith: null,
    on(ev, cb) { (listeners[ev] ||= []).push(cb); return this; },
    emit(ev, ...args) { for (const cb of listeners[ev] || []) cb(...args); },
    send(text) { this.sent.push(JSON.parse(text)); },
    close(code) { this.closedWith = code; this.readyState = 3; },
    terminate() { this.readyState = 3; },
  };
}

let failures = 0;
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
}

const server = spawn(process.execPath, ['server/index.js', '--port', String(PORT), '--http', '0', '--token', TOKEN], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => { serverLog += d; });
server.stderr.on('data', (d) => { serverLog += d; process.stderr.write(`[server] ${d}`); });
server.on('exit', (code, signal) => {
  if (code === 0 || signal === 'SIGTERM') return;
  console.error(`\n[server exited unexpectedly: code=${code} signal=${signal}]\n${serverLog.slice(-1200)}`);
});

await waitFor(async () => (await fetch(`${BASE}/api/info`)).ok, 15000, 'server to start');

// ── pages and api
for (const [path, needle] of [
  ['/', 'phonemote'],
  ['/c', 'Connect'],
  ['/game', 'TARGET'],
  ['/sandbox', 'sandbox'],
  ['/controller/motion.js', 'MotionEngine'],
  ['/shared/protocol.js', 'PROTOCOL_VERSION'],
  ['/lib/mathx.js', 'OneEuro'],
  ['/api/qr.svg', '<svg'],
]) {
  const res = await fetch(BASE + path);
  const body = await res.text();
  check(`GET ${path}`, res.ok && body.includes(needle), res.ok ? '' : `status ${res.status}`);
}

const info = await (await fetch(`${BASE}/api/info`)).json();
check('/api/info exposes the pairing code on loopback', info.token === TOKEN);
check('/api/info lists a controller URL', typeof info.controllerUrl === 'string' && info.controllerUrl.includes('/c'));

const traversal = await fetch(`${BASE}/../package.json`);
check('path traversal is refused', !traversal.ok || !(await traversal.text()).includes('"name": "phonemote"'));

// ── pairing. Loopback is trusted on purpose (the game page on this machine
// must just work), so the rejection path is checked against the hub directly
// with a socket that claims to come from somewhere else.
const loopbackNoToken = await connect({ role: 'game' });
check('loopback is trusted without a pairing code', !!loopbackNoToken.welcome, loopbackNoToken.error);
loopbackNoToken.ws.terminate();

{
  const { Hub } = await import('../server/hub.js');
  const hub = new Hub({ token: TOKEN });
  const rogue = fakeSocket();
  hub.add(rogue, { trusted: false, address: '192.168.1.50' });
  rogue.emit('message', JSON.stringify({ m: 'hello', role: 'controller', token: 'NOPE' }));
  check('a wrong pairing code is rejected off-loopback',
    rogue.sent.some((m) => m.error === 'bad-token') && rogue.closedWith === 4003);

  const good = fakeSocket();
  hub.add(good, { trusted: false, address: '192.168.1.51' });
  good.emit('message', JSON.stringify({ m: 'hello', role: 'controller', token: TOKEN }));
  check('the right pairing code is accepted off-loopback', good.sent.some((m) => m.m === 'welcome'));
  hub.close();
}

// ── relay: controller -> server -> game
const game = await connect({ role: 'game', token: TOKEN });
check('game client gets a welcome', game.welcome?.role === 'game', game.error);

const ctl = await connect({ role: 'controller', token: TOKEN, name: 'Fake phone' });
check('controller is given player slot 0', ctl.welcome?.slot === 0, ctl.error);

const frames = [];
const events = [];
game.ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.m === 'state') frames.push(msg);
  if (msg.m === 'event') events.push(msg);
});

ctl.ws.send(JSON.stringify({
  m: 'state', seq: 1, t: Date.now(), ptr: { x: 0.25, y: 0.75, out: false },
  ori: { yaw: 5, pitch: -3, roll: 10 }, quat: [1, 0, 0, 0], btn: 2, stick: [0, 0],
}));
ctl.ws.send(JSON.stringify({ m: 'event', kind: 'gesture', gesture: 'swing', strength: 0.9 }));
ctl.ws.send(JSON.stringify({ m: 'event', kind: 'button', button: 'a', down: true }));

await waitFor(() => frames.length > 0 && events.length >= 2, 3000, 'relayed input');
check('state frames reach the game', frames[0]?.ptr?.x === 0.25);
check('frames are tagged with the player slot', frames[0]?.slot === 0);
check('gesture events reach the game', events.some((e) => e.gesture === 'swing'));
check('button events reach the game', events.some((e) => e.button === 'a' && e.down));

// ── rumble travels back the other way
const rumbles = [];
ctl.ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.m === 'rumble') rumbles.push(msg);
});
game.ws.send(JSON.stringify({ m: 'rumble', slot: 0, ms: 120, strength: 0.8 }));
await waitFor(() => rumbles.length > 0, 3000, 'rumble');
check('rumble is routed back to the right phone', rumbles[0]?.ms === 120);

// ── a late game gets the current state straight away
const late = await connect({ role: 'game', token: TOKEN });
const lateFrames = [];
late.ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.m === 'state') lateFrames.push(msg);
});
await waitFor(() => lateFrames.length > 0, 3000, 'replayed state').catch(() => {});
check('a game joining late receives the last frame', lateFrames.length > 0);

// ── slots
const extra = [];
for (let i = 0; i < 3; i++) extra.push(await connect({ role: 'controller', token: TOKEN }));
check('four controllers get four distinct slots', new Set([ctl, ...extra].map((c) => c.welcome.slot)).size === 4);
const fifth = await connect({ role: 'controller', token: TOKEN });
check('a fifth controller is turned away', fifth.error?.includes('slot'), fifth.error || 'it was let in');

for (const c of [game, ctl, late, fifth, ...extra]) c.ws.close();
server.kill('SIGTERM');
await Promise.race([once(server, 'exit'), sleep(2000)]);

console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures ? 1 : 0);

// ── helpers

function connect(hello, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${host}:${PORT}/ws`, { rejectUnauthorized: false });
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ws, ...value });
    };
    const timer = setTimeout(() => done({ error: 'connect timed out' }), 6000);
    ws.on('open', () => ws.send(JSON.stringify({ m: 'hello', v: 1, ...hello })));
    // A rejected client gets its socket closed under it; that must not crash us.
    ws.on('error', (err) => done({ error: err.message }));
    ws.on('close', () => done({ error: 'closed before welcome' }));
    ws.once('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.m === 'welcome') done({ welcome: msg });
      else done({ error: msg.error || `unexpected ${msg.m}` });
    });
  });
}

async function waitFor(cond, ms, what) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try { if (await cond()) return; } catch { /* keep trying */ }
    await sleep(60);
  }
  throw new Error(`timed out waiting for ${what}`);
}
