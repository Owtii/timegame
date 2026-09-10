#!/usr/bin/env node
/**
 * A fake phone. Connects exactly like the real controller page and sends
 * synthetic motion, so the game and the server can be exercised (and watched)
 * without picking up a handset.
 *
 *   node tools/sim-controller.js                 # circles the pointer, taps the trigger
 *   node tools/sim-controller.js --pattern sweep --port 8443
 */
import WebSocket from 'ws';
import { packButtons, PROTOCOL_VERSION } from '../shared/protocol.js';

const args = Object.fromEntries(
  process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => {
    const [k, ...v] = s.trim().split(/\s+/);
    return [k, v.join(' ') || true];
  }),
);

const PORT = Number(args.port || 8443);
const HOST = args.host || 'localhost';
const PATTERN = args.pattern || 'circle';
const HZ = 60;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // our own self-signed certificate

const token = args.token === undefined ? await fetchToken() : (args.token === true ? null : args.token);

async function fetchToken() {
  try {
    const info = await (await fetch(`https://${HOST}:${PORT}/api/info`)).json();
    return info.token ?? null;
  } catch (err) {
    console.error(`could not read /api/info (${err.message}); continuing without a pairing code`);
    return null;
  }
}

const ws = new WebSocket(`wss://${HOST}:${PORT}/ws`, { rejectUnauthorized: false });
let seq = 0;
let t0 = Date.now();
let slot = null;

ws.on('open', () => {
  ws.send(JSON.stringify({ m: 'hello', v: PROTOCOL_VERSION, role: 'controller', name: `Sim (${PATTERN})`, token }));
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.m === 'welcome') {
    slot = msg.slot;
    console.log(`connected as player ${slot + 1}, pattern "${PATTERN}" - ctrl-c to stop`);
    setInterval(sendFrame, 1000 / HZ);
    setInterval(sendGesture, 2600);
    setInterval(tapTrigger, 1100);
  }
  if (msg.m === 'ping') ws.send(JSON.stringify({ m: 'pong', t: msg.t }));
  if (msg.m === 'rumble') process.stdout.write(`  rumble ${msg.ms}ms\n`);
  if (msg.m === 'error') console.error(`server: ${msg.error}`);
});

ws.on('error', (err) => { console.error(err.message); process.exit(1); });
ws.on('close', () => { console.log('disconnected'); process.exit(0); });

const held = {};

function sendFrame() {
  const t = (Date.now() - t0) / 1000;
  let x, y;
  if (PATTERN === 'sweep') {
    x = 0.5 + 0.45 * Math.sin(t * 0.9);
    y = 0.5 + 0.12 * Math.sin(t * 0.35);
  } else if (PATTERN === 'still') {
    x = 0.5; y = 0.5;
  } else {
    x = 0.5 + 0.32 * Math.cos(t * 1.4);
    y = 0.5 + 0.26 * Math.sin(t * 1.4);
  }
  const yaw = (x - 0.5) * 34;
  const pitch = -(y - 0.5) * 19;
  const roll = Math.sin(t * 0.7) * 18;
  ws.send(JSON.stringify({
    m: 'state',
    seq: seq++,
    t: Date.now(),
    ori: { yaw: +yaw.toFixed(2), pitch: +pitch.toFixed(2), roll: +roll.toFixed(2) },
    quat: euler(yaw, pitch, roll),
    gyro: [0, 0, 0],
    acc: [0, 0, 9.81],
    lin: [0, 0, 0],
    ptr: { x: +x.toFixed(3), y: +y.toFixed(3), out: false },
    rel: [0, 0],
    mot: { energy: 0.2, still: false },
    btn: packButtons(held),
    stick: [0, 0],
  }));
}

function tapTrigger() {
  press('b');
}

function sendGesture() {
  const kinds = ['swing', 'shake', 'thrust', 'twist'];
  const gesture = kinds[Math.floor(Math.random() * kinds.length)];
  ws.send(JSON.stringify({ m: 'event', kind: 'gesture', gesture, strength: 0.7, axis: 'right', t: Date.now() }));
}

function press(button) {
  held[button] = true;
  ws.send(JSON.stringify({ m: 'event', kind: 'button', button, down: true, t: Date.now() }));
  setTimeout(() => {
    held[button] = false;
    ws.send(JSON.stringify({ m: 'event', kind: 'button', button, down: false, t: Date.now() }));
  }, 90);
}

/** Yaw/pitch/roll (degrees, our convention) -> quaternion, for the sandbox view. */
function euler(yawDeg, pitchDeg, rollDeg) {
  const [y, p, r] = [yawDeg, pitchDeg, rollDeg].map((d) => (d * Math.PI) / 180 / 2);
  const qz = [Math.cos(y), 0, 0, Math.sin(y)];
  const qx = [Math.cos(p), Math.sin(p), 0, 0];
  const qy = [Math.cos(r), 0, Math.sin(r), 0];
  return mul(mul(qz, qx), qy).map((v) => +v.toFixed(4));
  function mul(a, b) {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
  }
}
