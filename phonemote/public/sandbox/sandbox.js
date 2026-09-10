import { Link, tokenFromUrl } from '/lib/net.js';
import { Pads } from '/lib/pads.js';
import { qRotate, qUnrotate, vAdd, vSub, vScale, vNorm, vDot, vLen, clamp } from '/lib/mathx.js';

/**
 * A deliberately tiny software renderer. The point is not the graphics, it is
 * that the camera orientation is the phone's orientation, unfiltered and
 * unmapped - the closest thing here to a headset.
 */

const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, focal = 0;

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  focal = Math.max(W, H) * 0.9;       // roughly a 60° vertical field of view
}
addEventListener('resize', resize);

const link = new Link({ role: 'game', name: 'Sandbox', token: tokenFromUrl() });
const pads = new Pads(link);
link.connect();

const cam = { pos: [0, 0, 1.6], quat: [1, 0, 0, 0] };
const NEAR = 0.12;

/* ── scene ──────────────────────────────────────────────────────── */

const boxes = [];
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const d = 9 + (i % 4) * 5;
  boxes.push({
    pos: [Math.cos(a) * d, Math.sin(a) * d, 0],
    size: [1.2 + (i % 3) * 0.6, 1.2 + (i % 2) * 0.8, 2 + (i % 5) * 1.8],
    color: ['#2d3f66', '#35507f', '#27364f'][i % 3],
  });
}

const rand = (a, b) => a + Math.random() * (b - a);

let targets = [];
function seedTargets() {
  targets = Array.from({ length: 10 }, () => ({
    pos: [rand(-14, 14), rand(-14, 14), rand(0.8, 4.5)],
    r: 0.45,
    hit: 0,
    bob: Math.random() * 6.28,
  }));
}
seedTargets();

const sparks = [];

/* ── projection ─────────────────────────────────────────────────── */

/** World point -> camera space, where +x right, +y up, +z forward. */
function toCamera(p) {
  const rel = vSub(p, cam.pos);
  const d = qUnrotate(cam.quat, rel);
  return [d[0], d[2], d[1]];      // device axes: x right, z up, y forward
}

function project(c) {
  if (c[2] < NEAR) return null;
  return [W / 2 + (c[0] * focal) / c[2], H / 2 - (c[1] * focal) / c[2], c[2]];
}

/** Clip a camera-space segment to the near plane so lines never wrap around. */
function clipSegment(a, b) {
  if (a[2] < NEAR && b[2] < NEAR) return null;
  if (a[2] >= NEAR && b[2] >= NEAR) return [a, b];
  const t = (NEAR - a[2]) / (b[2] - a[2]);
  const cut = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR];
  return a[2] < NEAR ? [cut, b] : [a, cut];
}

function strokeWorld(p0, p1, color, width = 1) {
  const seg = clipSegment(toCamera(p0), toCamera(p1));
  if (!seg) return;
  const s0 = project(seg[0]);
  const s1 = project(seg[1]);
  if (!s0 || !s1) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(s0[0], s0[1]);
  ctx.lineTo(s1[0], s1[1]);
  ctx.stroke();
}

const BOX_EDGES = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
function boxCorners({ pos, size }) {
  const out = [];
  for (const z of [0, size[2]]) for (const y of [-size[1] / 2, size[1] / 2]) for (const x of [-size[0] / 2, size[0] / 2]) {
    out.push([pos[0] + x, pos[1] + y, pos[2] + z]);
  }
  return out;
}

/* ── loop ───────────────────────────────────────────────────────── */

let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const pad = pads.active[0];
  if (pad) {
    cam.quat = pad.quat;
    walk(pad, dt);
    if (pad.takePress('b')) shoot(pad);
    if (pad.takePress('a')) { cam.pos = [0, 0, 1.6]; seedTargets(); }
    if (pad.takeGesture('swing')) shoot(pad, 2.2);
    pad.flush();
  }

  draw(now / 1000, pad);
  readout(pad);
}

function walk(pad, dt) {
  const fwdWorld = vNorm(qRotate(cam.quat, [0, 1, 0]));
  const flat = vNorm([fwdWorld[0], fwdWorld[1], 0]);
  const right = [flat[1], -flat[0], 0];
  let move = [0, 0, 0];
  move = vAdd(move, vScale(flat, pad.stick[1]));
  move = vAdd(move, vScale(right, pad.stick[0]));
  if (pad.btn.up) move = vAdd(move, flat);
  if (pad.btn.down) move = vSub(move, flat);
  if (pad.btn.left) move = vSub(move, right);
  if (pad.btn.right) move = vAdd(move, right);
  if (vLen(move) > 1e-3) {
    const step = vScale(vNorm(move), 4.2 * dt);
    cam.pos = [clamp(cam.pos[0] + step[0], -22, 22), clamp(cam.pos[1] + step[1], -22, 22), cam.pos[2]];
  }
}

function shoot(pad, radiusBoost = 1) {
  const dir = vNorm(qRotate(cam.quat, [0, 1, 0]));
  let best = null;
  let bestT = Infinity;
  for (const t of targets) {
    if (t.hit) continue;
    const rel = vSub(t.pos, cam.pos);
    const along = vDot(rel, dir);
    if (along <= 0) continue;
    const perp = vLen(vSub(rel, vScale(dir, along)));
    if (perp < t.r * radiusBoost * (1 + along * 0.04) && along < bestT) { best = t; bestT = along; }
  }
  if (best) {
    best.hit = 1;
    pads.rumble(pad.slot, 110, 0.8);
    const s = project(toCamera(best.pos));
    if (s) for (let i = 0; i < 18; i++) {
      const a = Math.random() * 6.28;
      sparks.push({ x: s[0], y: s[1], vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, life: 0.5 });
    }
  } else {
    pads.rumble(pad.slot, 40, 0.3);
  }
  if (targets.every((t) => t.hit)) setTimeout(seedTargets, 700);
}

function draw(t, pad) {
  // sky and ground, split at the horizon of the current view
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#060a14');
  sky.addColorStop(1, '#16233c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  // ground grid
  for (let i = -22; i <= 22; i += 2) {
    strokeWorld([i, -22, 0], [i, 22, 0], 'rgba(76,201,255,0.13)');
    strokeWorld([-22, i, 0], [22, i, 0], 'rgba(76,201,255,0.13)');
  }
  // a brighter cross through the origin, so "where am I" is always answerable
  strokeWorld([-22, 0, 0], [22, 0, 0], 'rgba(126,231,135,0.35)', 2);
  strokeWorld([0, -22, 0], [0, 22, 0], 'rgba(126,231,135,0.35)', 2);

  for (const b of boxes) {
    const c = boxCorners(b);
    for (const [i, j] of BOX_EDGES) strokeWorld(c[i], c[j], b.color, 1.6);
  }

  for (const target of targets) {
    const p = [target.pos[0], target.pos[1], target.pos[2] + Math.sin(t * 1.5 + target.bob) * 0.18];
    const s = project(toCamera(p));
    if (!s) continue;
    const r = (target.r * focal) / s[2];
    ctx.globalAlpha = target.hit ? 0.25 : 1;
    ctx.strokeStyle = target.hit ? '#44506e' : '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s[0], s[1], r, 0, 6.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s[0], s[1], r * 0.45, 0, 6.28);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  for (const s of sparks) {
    s.x += s.vx * 0.016;
    s.y += s.vy * 0.016;
    s.vy += 6;
    s.life -= 0.016;
    ctx.globalAlpha = Math.max(0, s.life * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(s.x, s.y, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;
  while (sparks.length && sparks[0].life <= 0) sparks.shift();

  // crosshair: the direction the phone is pointing is the centre of the screen
  ctx.strokeStyle = pad ? '#4cc9ff' : '#44506e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 9, 0, 6.28);
  ctx.moveTo(W / 2 - 18, H / 2); ctx.lineTo(W / 2 - 12, H / 2);
  ctx.moveTo(W / 2 + 12, H / 2); ctx.lineTo(W / 2 + 18, H / 2);
  ctx.moveTo(W / 2, H / 2 - 18); ctx.lineTo(W / 2, H / 2 - 12);
  ctx.moveTo(W / 2, H / 2 + 12); ctx.lineTo(W / 2, H / 2 + 18);
  ctx.stroke();
}

let readoutAt = 0;
function readout(pad) {
  const now = performance.now();
  if (now - readoutAt < 120) return;
  readoutAt = now;
  const el = document.getElementById('readout');
  if (!pad) { el.textContent = 'waiting for a controller…'; return; }
  const f = (v) => (v >= 0 ? ' ' : '') + v.toFixed(1).padStart(5, ' ');
  el.textContent = [
    `${pad.name}  P${pad.slot + 1}  ${Math.round(pad.rtt)} ms`,
    `yaw${f(pad.ori.yaw)}  pitch${f(pad.ori.pitch)}  roll${f(pad.ori.roll)}`,
    `quat ${pad.quat.map((v) => v.toFixed(2)).join(' ')}`,
    `pos  ${cam.pos.map((v) => v.toFixed(1)).join(', ')}`,
    `left ${targets.filter((t) => !t.hit).length} targets`,
  ].join('\n');
}

resize();
requestAnimationFrame(frame);
