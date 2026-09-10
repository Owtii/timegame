import { Link, tokenFromUrl } from '/lib/net.js';
import { Pads } from '/lib/pads.js';
import { clamp01 } from '/lib/mathx.js';

/* ═══════════════════════════════════════════════════ canvas */

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, ground = 0;

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ground = H * 0.84;
  stars = makeStars();
}
addEventListener('resize', resize);

let stars = [];
const makeStars = () => Array.from({ length: 90 }, () => ({
  x: Math.random() * W, y: Math.random() * ground * 0.8,
  r: Math.random() * 1.4 + 0.3, tw: Math.random() * 6.28,
}));

/* ═══════════════════════════════════════════════════ sound */

class Sfx {
  constructor() { this.ctx = null; }
  wake() {
    if (this.ctx) return this.ctx.resume?.();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.4;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  #env(node, t, a, dur, peak = 1) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g);
    g.connect(this.master);
    return g;
  }
  #tone(freq, dur, { type = 'sine', to = null, a = 0.005, peak = 0.5, delay = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    this.#env(o, t, a, dur, peak);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  #hiss(dur, { f0 = 1800, f1 = 300, q = 1, peak = 0.35, delay = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = q;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    src.connect(bp);
    this.#env(bp, t, 0.004, dur, peak);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
  shoot() { this.#hiss(0.12, { f0: 2600, f1: 400, peak: 0.3 }); this.#tone(320, 0.1, { type: 'square', to: 90, peak: 0.25 }); }
  hit() { this.#tone(760, 0.1, { type: 'triangle', to: 1500, peak: 0.35 }); }
  pop(n = 1) { this.#tone(520 + n * 60, 0.12, { type: 'sine', to: 180, peak: 0.3 }); }
  slash() { this.#hiss(0.22, { f0: 900, f1: 3400, q: 0.8, peak: 0.28 }); }
  empty() { this.#tone(180, 0.05, { type: 'square', peak: 0.2 }); }
  reload() { this.#tone(240, 0.05, { type: 'square', peak: 0.25 }); this.#tone(360, 0.06, { type: 'square', peak: 0.25, delay: 0.12 }); }
  damage() { this.#tone(140, 0.5, { type: 'sawtooth', to: 45, peak: 0.4 }); }
  bomb() { this.#hiss(0.7, { f0: 1200, f1: 60, q: 0.4, peak: 0.5 }); this.#tone(90, 0.6, { type: 'sine', to: 30, peak: 0.4 }); }
  wave() { [523, 659, 784, 1046].forEach((f, i) => this.#tone(f, 0.18, { type: 'triangle', peak: 0.3, delay: i * 0.09 })); }
  slowmo() { this.#tone(900, 0.6, { type: 'sine', to: 180, peak: 0.3 }); }
  over() { [523, 392, 330, 262].forEach((f, i) => this.#tone(f, 0.45, { type: 'triangle', peak: 0.32, delay: i * 0.18 })); }
}
const sfx = new Sfx();

/* ═══════════════════════════════════════════════════ networking */

const link = new Link({ role: 'game', name: 'Target Smash', token: tokenFromUrl() });
const pads = new Pads(link);

link.addEventListener('status', (e) => {
  const dot = document.getElementById('netdot');
  const label = document.getElementById('netlabel');
  dot.className = 'dot';
  if (e.detail.state === 'open') { dot.classList.add('on'); label.textContent = 'server connected'; }
  else if (e.detail.state === 'error') { dot.classList.add('bad'); label.textContent = e.detail.error; }
  else { dot.classList.add('warn'); label.textContent = e.detail.state; }
});
link.addEventListener('roster', renderRoster);
pads.addEventListener('join', (e) => {
  renderRoster();
  sfx.pop(e.detail.slot + 1);
  banner(`${e.detail.name} joined as P${e.detail.slot + 1}`);
});
pads.addEventListener('leave', renderRoster);
link.connect();

(async function lobbyInfo() {
  try {
    const info = await (await fetch('/api/info')).json();
    const url = info.controllerUrl || `https://${info.addresses?.[0]}:${info.port}/c`;
    document.getElementById('curl').textContent = url.replace(/\?t=.*/, '');
    document.getElementById('ccode').textContent = info.token || (info.paired ? 'see the terminal' : 'not required');
    document.getElementById('qr').src = `/api/qr.svg?d=${encodeURIComponent(url)}`;
  } catch {
    document.getElementById('curl').textContent = 'could not reach the server';
  }
})();

function renderRoster() {
  const ul = document.getElementById('roster');
  const active = pads.active;
  ul.innerHTML = active.length
    ? active.map((p) => `<li style="--slot:${p.color}">P${p.slot + 1} · ${escapeHtml(p.name)}${p.local ? '' : ` · ${Math.round(p.rtt)} ms`}</li>`).join('')
    : '<li class="empty">no controllers yet</li>';
}

const escapeHtml = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/* ═══════════════════════════════════════════════════ game state */

const AMMO = 6;
const BOMBS = 3;
const BASE_HP = 3;

const game = {
  phase: 'lobby',        // lobby | playing | wave-break | over
  wave: 0,
  baseHp: BASE_HP,
  timeScale: 1,
  slowCharge: 1,
  slowLeft: 0,
  shake: 0,
  flash: 0,
  flashColor: '#fff',
  breakLeft: 0,
  spawnLeft: 0,
  spawnTimer: 0,
  entities: [],
  parts: [],
  shots: [],
  slashes: [],
  floaters: [],
  banner: null,
  players: [0, 1, 2, 3].map(() => ({ score: 0, combo: 1, ammo: AMMO, bombs: BOMBS, reload: 0, kills: 0, pulse: 0, trail: [] })),
};

function startGame() {
  sfx.wake();
  game.phase = 'playing';
  game.wave = 0;
  game.baseHp = BASE_HP;
  game.entities.length = 0;
  game.parts.length = 0;
  game.floaters.length = 0;
  game.slowCharge = 1;
  game.slowLeft = 0;
  for (const p of game.players) Object.assign(p, { score: 0, combo: 1, ammo: AMMO, bombs: BOMBS, reload: 0, kills: 0 });
  document.getElementById('overlay').hidden = true;
  document.getElementById('gameover').hidden = true;
  nextWave();
}

function nextWave() {
  game.wave++;
  game.phase = 'wave-break';
  game.breakLeft = game.wave === 1 ? 1.6 : 2.6;
  game.spawnLeft = 5 + Math.round(game.wave * 2.6);
  game.spawnTimer = 0;
  banner(`WAVE ${game.wave}`);
  sfx.wave();
}

function gameOver() {
  game.phase = 'over';
  sfx.over();
  const rows = pads.active.length ? pads.active : [pads.get(0)];
  document.getElementById('finals').innerHTML = rows
    .map((p) => `<div style="color:${p.color}">P${p.slot + 1} &nbsp; ${game.players[p.slot].score.toLocaleString()} pts &nbsp; <span style="color:var(--muted)">${game.players[p.slot].kills} hits</span></div>`)
    .join('');
  document.getElementById('gameover').hidden = false;
}

function banner(text) {
  game.banner = { text, life: 1.8 };
}

document.getElementById('start').addEventListener('click', startGame);
document.getElementById('again').addEventListener('click', startGame);
document.getElementById('useLocal').addEventListener('click', () => {
  const pad = pads.enableLocal(window);
  renderRoster();
  banner(`mouse + keyboard ready as P${pad.slot + 1}`);
});
addEventListener('pointerdown', () => sfx.wake(), { once: true });
addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && game.phase !== 'playing') startGame();
});

/* ═══════════════════════════════════════════════════ entities */

const TYPES = {
  balloon: { r: 26, points: 100, hp: 1, color: '#ff7ab8' },
  drone: { r: 22, points: 150, hp: 1, color: '#9ad5ff' },
  crawler: { r: 20, points: 120, hp: 1, color: '#ff9f5a' },
  barrel: { r: 24, points: -200, hp: 1, color: '#ff5d73' },
  golden: { r: 18, points: 500, hp: 1, color: '#ffd166' },
};

function spawn() {
  const w = game.wave;
  const roll = Math.random();
  let kind = 'balloon';
  if (roll > 0.93 && w > 1) kind = 'golden';
  else if (roll > 0.78) kind = 'barrel';
  else if (roll > 0.5 && w > 1) kind = 'crawler';
  else if (roll > 0.28) kind = 'drone';

  const spec = TYPES[kind];
  const e = { kind, ...spec, born: performance.now(), phase: Math.random() * 6.28, dead: false };

  if (kind === 'balloon' || kind === 'barrel') {
    e.x = 60 + Math.random() * (W - 120);
    e.y = H + 40;
    e.vx = 0;
    e.vy = -(34 + w * 3.5 + Math.random() * 20);
  } else if (kind === 'drone' || kind === 'golden') {
    const fromLeft = Math.random() < 0.5;
    e.x = fromLeft ? -50 : W + 50;
    e.y = H * (0.12 + Math.random() * 0.42);
    e.vx = (fromLeft ? 1 : -1) * ((kind === 'golden' ? 210 : 90) + w * 7);
    e.vy = 0;
  } else {
    const fromLeft = Math.random() < 0.5;
    e.x = fromLeft ? -40 : W + 40;
    e.y = ground - 14;
    e.vx = (fromLeft ? 1 : -1) * (34 + w * 4.5);
    e.vy = 0;
  }
  game.entities.push(e);
}

function updateEntities(dt) {
  const baseX = W / 2;
  for (const e of game.entities) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.phase += dt * 4;

    if (e.kind === 'balloon' || e.kind === 'barrel') {
      e.x += Math.sin(e.phase * 0.5) * 22 * dt;
      if (e.y < -50) e.dead = true;
    } else if (e.kind === 'drone' || e.kind === 'golden') {
      e.y += Math.sin(e.phase) * 40 * dt;
      if (e.x < -70 || e.x > W + 70) e.dead = true;
    } else if (e.kind === 'crawler') {
      e.y = ground - 14 + Math.abs(Math.sin(e.phase * 1.6)) * 5;
      if (Math.abs(e.x - baseX) < 34) {
        e.dead = true;
        hurtBase();
      }
    }
  }
  game.entities = game.entities.filter((e) => !e.dead);
}

function hurtBase() {
  game.baseHp--;
  game.shake = Math.max(game.shake, 16);
  game.flash = 0.5;
  game.flashColor = '#ff5d73';
  sfx.damage();
  for (const p of pads.active) pads.rumble(p.slot, 320, 1);
  if (game.baseHp <= 0) gameOver();
}

/* ═══════════════════════════════════════════════════ player actions */

function cursorOf(pad) {
  return { x: pad.ptr.x * W, y: pad.ptr.y * H };
}

function hitTest(x, y, radius = 0) {
  let best = null;
  let bestD = Infinity;
  for (const e of game.entities) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < e.r + radius + 8 && d < bestD) { best = e; bestD = d; }
  }
  return best;
}

function fire(pad) {
  const st = game.players[pad.slot];
  const { x, y } = cursorOf(pad);
  if (st.reload > 0) return;
  if (st.ammo <= 0) { sfx.empty(); floater(x, y, 'RELOAD — SHAKE IT', '#ffd166'); return; }

  st.ammo--;
  st.pulse = 1;
  sfx.shoot();
  pads.rumble(pad.slot, 45, 0.45);
  game.shots.push({ x, y, life: 0.12, color: pad.color });

  const hit = hitTest(x, y);
  if (!hit) {
    st.combo = 1;
    return;
  }
  kill(hit, pad, 1);
}

function slash(pad, gesture, radius = 112) {
  const st = game.players[pad.slot];
  const { x, y } = cursorOf(pad);
  const power = 0.6 + clamp01(gesture.strength ?? 0.5);
  game.slashes.push({ x, y, life: 0.26, color: pad.color, angle: gesture.axis === 'up' || gesture.axis === 'down' ? Math.PI / 2 : 0, r: radius * power });
  sfx.slash();

  const caught = game.entities.filter((e) => Math.hypot(e.x - x, e.y - y) < radius * power + e.r);
  if (!caught.length) return;
  pads.rumble(pad.slot, 90, 0.7);
  caught.forEach((e, i) => kill(e, pad, 1.5, i));
  if (caught.length > 1) floater(x, y - 30, `${caught.length}× SLASH!`, pad.color);
  st.pulse = 1;
}

function kill(e, pad, multiplier, index = 0) {
  if (e.dead) return;
  e.dead = true;
  const st = game.players[pad.slot];

  if (e.kind === 'barrel') {
    st.combo = 1;
    st.score = Math.max(0, st.score + e.points);
    burst(e.x, e.y, '#ff5d73', 26);
    floater(e.x, e.y, `${e.points}`, '#ff5d73');
    game.shake = Math.max(game.shake, 10);
    game.flash = 0.35;
    game.flashColor = '#ff5d73';
    sfx.damage();
    pads.rumble(pad.slot, 220, 0.9);
    return;
  }

  const gained = Math.round(e.points * multiplier * st.combo);
  st.score += gained;
  st.kills++;
  st.combo = Math.min(8, st.combo + 1);
  burst(e.x, e.y, e.color, e.kind === 'golden' ? 34 : 18);
  floater(e.x, e.y - 10 - index * 16, `+${gained}${st.combo > 2 ? ` ×${st.combo}` : ''}`, st.combo > 4 ? '#ffd166' : pad.color);
  e.kind === 'golden' ? sfx.pop(4) : sfx.hit();
  pads.rumble(pad.slot, 70, 0.6);
}

function bomb(pad) {
  const st = game.players[pad.slot];
  if (st.bombs <= 0 || !game.entities.length) return;
  st.bombs--;
  sfx.bomb();
  game.flash = 0.8;
  game.flashColor = '#ffffff';
  game.shake = Math.max(game.shake, 22);
  for (const e of [...game.entities]) {
    if (e.kind === 'barrel') { e.dead = true; burst(e.x, e.y, '#ff5d73', 14); continue; }
    const gained = Math.round(e.points * 0.5);
    st.score += gained;
    st.kills++;
    e.dead = true;
    burst(e.x, e.y, e.color, 12);
  }
  for (const p of pads.active) pads.rumble(p.slot, 260, 1);
}

function reload(pad) {
  const st = game.players[pad.slot];
  if (st.ammo === AMMO || st.reload > 0) return;
  st.reload = 0.75;
  sfx.reload();
  pads.rumble(pad.slot, 70, 0.5);
}

function triggerSlowmo() {
  if (game.slowCharge < 1 || game.slowLeft > 0) return;
  game.slowCharge = 0;
  game.slowLeft = 3;
  sfx.slowmo();
  banner('SLOW MOTION');
}

/* ═══════════════════════════════════════════════════ effects */

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28;
    const s = 60 + Math.random() * 260;
    game.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5 + Math.random() * 0.6, max: 1, color, r: 1 + Math.random() * 2.6 });
  }
}

function floater(x, y, text, color) {
  game.floaters.push({ x, y, text, color, life: 1.1 });
}

function updateEffects(dt) {
  for (const p of game.parts) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 620 * dt;
    p.vx *= 1 - 1.6 * dt;
    p.life -= dt;
  }
  game.parts = game.parts.filter((p) => p.life > 0);

  for (const f of game.floaters) { f.y -= 34 * dt; f.life -= dt; }
  game.floaters = game.floaters.filter((f) => f.life > 0);

  for (const s of game.shots) s.life -= dt;
  game.shots = game.shots.filter((s) => s.life > 0);
  for (const s of game.slashes) s.life -= dt;
  game.slashes = game.slashes.filter((s) => s.life > 0);

  game.shake = Math.max(0, game.shake - dt * 42);
  game.flash = Math.max(0, game.flash - dt * 2.2);
  if (game.banner) {
    game.banner.life -= dt;
    if (game.banner.life <= 0) game.banner = null;
  }
}

/* ═══════════════════════════════════════════════════ main loop */

let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const real = Math.min(0.05, (now - last) / 1000);
  last = now;

  readInput(real);

  if (game.phase === 'playing' || game.phase === 'wave-break') {
    game.slowLeft = Math.max(0, game.slowLeft - real);
    game.timeScale = game.slowLeft > 0 ? 0.32 : 1;
    if (game.slowLeft <= 0) game.slowCharge = clamp01(game.slowCharge + real / 22);

    const dt = real * game.timeScale;
    if (game.phase === 'wave-break') {
      game.breakLeft -= real;
      if (game.breakLeft <= 0) game.phase = 'playing';
    } else {
      game.spawnTimer -= dt;
      const rate = Math.max(0.38, 1.5 - game.wave * 0.075);
      if (game.spawnLeft > 0 && game.spawnTimer <= 0) {
        game.spawnTimer = rate * (0.6 + Math.random() * 0.8);
        game.spawnLeft--;
        spawn();
      }
      if (game.spawnLeft <= 0 && !game.entities.length) nextWave();
    }
    updateEntities(dt);

    for (const st of game.players) {
      if (st.reload > 0) {
        st.reload -= real;
        if (st.reload <= 0) { st.ammo = AMMO; st.reload = 0; }
      }
      st.pulse = Math.max(0, st.pulse - real * 4);
    }
  }

  updateEffects(real);
  draw(now);
  updateHud(now);
}

function readInput(dt) {
  for (const pad of pads.active) {
    const playing = game.phase === 'playing' || game.phase === 'wave-break';

    if (!playing) {
      if (pad.takePress('a') || pad.takePress('b')) startGame();
      pad.flush();
      continue;
    }

    if (pad.takePress('b') || pad.takePress('one')) fire(pad);
    if (pad.takePress('a')) bomb(pad);
    if (pad.takePress('two') || pad.takePress('minus')) reload(pad);

    let g;
    while ((g = pad.takeGesture('swing'))) slash(pad, g);
    while ((g = pad.takeGesture('thrust'))) slash(pad, g, 70);
    if (pad.takeGesture('shake')) reload(pad);
    if (pad.takeGesture('twist')) triggerSlowmo();
    pad.flush();

    const st = game.players[pad.slot];
    const c = cursorOf(pad);
    st.trail.push({ x: c.x, y: c.y });
    if (st.trail.length > 9) st.trail.shift();
  }
}

/* ═══════════════════════════════════════════════════ drawing */

function draw(now) {
  const t = now / 1000;
  ctx.save();
  if (game.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }

  drawSky(t);
  drawGround();
  drawBase();

  for (const e of game.entities) drawEntity(e, t);

  for (const p of game.parts) {
    ctx.globalAlpha = clamp01(p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  }
  ctx.globalAlpha = 1;

  for (const s of game.shots) {
    const a = s.life / 0.12;
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = a;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, (1 - a) * 40 + 6, 0, 6.28);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const s of game.slashes) {
    const a = s.life / 0.26;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle + (1 - a) * 0.6);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = a;
    ctx.lineWidth = 10 * a + 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, s.r * (0.6 + 0.4 * (1 - a)), -0.9, 0.9);
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  for (const f of game.floaters) {
    ctx.globalAlpha = clamp01(f.life * 1.4);
    ctx.fillStyle = f.color;
    ctx.font = '700 18px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  for (const pad of pads.active) drawCursor(pad, t);

  if (game.banner) {
    const b = game.banner;
    const a = clamp01(b.life > 1.4 ? (1.8 - b.life) / 0.4 : b.life / 1.4);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#e8edf7';
    ctx.font = `700 ${Math.round(W * 0.055)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(b.text, W / 2, H * 0.3);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  if (game.flash > 0.01) {
    ctx.globalAlpha = clamp01(game.flash) * 0.6;
    ctx.fillStyle = game.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (game.slowLeft > 0) {
    ctx.strokeStyle = 'rgba(76, 201, 255, 0.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);
  }
}

function drawSky(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, '#070c18');
  sky.addColorStop(0.55, '#122040');
  sky.addColorStop(1, '#2a3b5e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, ground);

  for (const s of stars) {
    ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(t * 1.2 + s.tw));
    ctx.fillStyle = '#cfe2ff';
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#f2f6ff';
  ctx.beginPath();
  ctx.arc(W * 0.82, H * 0.16, 26, 0, 6.28);
  ctx.fill();
  ctx.fillStyle = '#122040';
  ctx.beginPath();
  ctx.arc(W * 0.82 - 9, H * 0.16 - 6, 22, 0, 6.28);
  ctx.fill();

  hills(ground * 0.96, 0.5, '#0d1628', 0.028, 46);
  hills(ground * 1.0, 0.8, '#101b30', 0.018, 70);
}

function hills(y, alpha, color, freq, amp) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= W; x += 12) {
    ctx.lineTo(x, y - (Math.sin(x * freq) * 0.5 + Math.sin(x * freq * 2.3) * 0.5) * amp - amp * 0.4);
  }
  ctx.lineTo(W, ground + 10);
  ctx.lineTo(0, ground + 10);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawGround() {
  const g = ctx.createLinearGradient(0, ground, 0, H);
  g.addColorStop(0, '#16233c');
  g.addColorStop(1, '#0a1120');
  ctx.fillStyle = g;
  ctx.fillRect(0, ground, W, H - ground);
  ctx.strokeStyle = 'rgba(76, 201, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 14; i++) {
    const x = (i / 14) * W;
    ctx.beginPath();
    ctx.moveTo(W / 2 + (x - W / 2) * 0.25, ground);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
}

function drawBase() {
  const x = W / 2;
  const y = ground;
  const hp = game.baseHp / BASE_HP;
  const tint = hp > 0.66 ? '#7ee787' : hp > 0.33 ? '#ffd166' : '#ff5d73';

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 62, 12, 0, 0, 6.28);
  ctx.fill();

  ctx.fillStyle = '#1d2b48';
  ctx.strokeStyle = '#2f4468';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 52, y + 8);
  ctx.lineTo(x - 34, y - 34);
  ctx.lineTo(x + 34, y - 34);
  ctx.lineTo(x + 52, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // turret, always aimed at the sky
  ctx.fillStyle = '#33496f';
  ctx.beginPath();
  ctx.arc(x, y - 34, 16, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(x - 4, y - 62, 8, 22);
  ctx.strokeRect(x - 4, y - 62, 8, 22);

  ctx.fillStyle = tint;
  ctx.shadowColor = tint;
  ctx.shadowBlur = 10;
  ctx.fillRect(x - 24, y - 26, 48 * hp, 5);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 24, y - 26, 48, 5);
}

function drawEntity(e, t) {
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.kind === 'balloon' || e.kind === 'barrel') {
    ctx.strokeStyle = 'rgba(200,220,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(0, e.r);
    ctx.quadraticCurveTo(Math.sin(e.phase) * 8, e.r + 20, 0, e.r + 34);
    ctx.stroke();
  }

  if (e.kind === 'drone' || e.kind === 'golden') {
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 8, -4);
      ctx.lineTo(s * (e.r + 6), -10);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(s * (e.r + 6), -10, 9, 2 + Math.abs(Math.sin(t * 40 + e.phase)) * 2, 0, 0, 6.28);
      ctx.stroke();
    }
  }

  ctx.fillStyle = e.color;
  ctx.shadowColor = e.color;
  ctx.shadowBlur = e.kind === 'golden' ? 22 : 12;

  if (e.kind === 'crawler') {
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) {
      const swing = Math.sin(e.phase * 2 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(i * 8, 4);
      ctx.lineTo(i * 8 + swing, 16);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, -2, e.r * 0.9, e.r * 0.62, 0, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = '#08101e';
    ctx.fillRect(-7, -6, 4, 4);
    ctx.fillRect(3, -6, 4, 4);
  } else if (e.kind === 'barrel') {
    ctx.beginPath();
    ctx.roundRect(-e.r * 0.72, -e.r, e.r * 1.44, e.r * 2, 6);
    ctx.fill();
    ctx.strokeStyle = '#1a0a10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-9, -9); ctx.lineTo(9, 9);
    ctx.moveTo(9, -9); ctx.lineTo(-9, 9);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(-e.r * 0.3, -e.r * 0.35, e.r * 0.26, 0, 6.28);
    ctx.fill();
    if (e.kind === 'golden') {
      ctx.strokeStyle = '#fff6d0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = t * 2 + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (e.r + 5), Math.sin(a) * (e.r + 5));
        ctx.lineTo(Math.cos(a) * (e.r + 13), Math.sin(a) * (e.r + 13));
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawCursor(pad, t) {
  const st = game.players[pad.slot];
  const { x, y } = cursorOf(pad);
  const roll = (pad.ori.roll || 0) * (Math.PI / 180);
  const dim = pad.ptr.out ? 0.4 : 1;

  ctx.globalAlpha = 0.3 * dim;
  ctx.strokeStyle = pad.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  st.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(roll);
  const pulse = 1 + st.pulse * 0.4;
  ctx.globalAlpha = dim;
  ctx.strokeStyle = pad.color;
  ctx.shadowColor = pad.color;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 20 * pulse, 0, 6.28);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
    ctx.lineTo(Math.cos(a) * (16 * pulse), Math.sin(a) * (16 * pulse));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // ammo, as pips around the reticle: the eyes never have to leave the target
  for (let i = 0; i < AMMO; i++) {
    const a = -Math.PI / 2 + (i / AMMO) * 6.28;
    ctx.globalAlpha = dim * (i < st.ammo ? 0.95 : 0.18);
    ctx.fillStyle = st.reload > 0 ? '#ffd166' : pad.color;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 28 * pulse, Math.sin(a) * 28 * pulse, 2.6, 0, 6.28);
    ctx.fill();
  }
  ctx.restore();

  ctx.globalAlpha = dim;
  ctx.fillStyle = pad.color;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`P${pad.slot + 1}`, x, y + 44);
  ctx.globalAlpha = 1;
}

/* ═══════════════════════════════════════════════════ hud */

let hudAt = 0;
function updateHud(now) {
  if (now - hudAt < 80) return;
  hudAt = now;

  const host = document.getElementById('players');
  const active = pads.active;
  if (host.children.length !== active.length) {
    host.innerHTML = active.map((p) => `
      <div class="pcard" data-slot="${p.slot}" style="border-left-color:${p.color}">
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="score">0</div>
        <div class="sub"><span class="combo"></span><span class="bombs"></span></div>
        <div class="ammo">${'<i></i>'.repeat(AMMO)}</div>
      </div>`).join('');
  }
  for (const card of host.children) {
    const slot = +card.dataset.slot;
    const st = game.players[slot];
    card.querySelector('.score').textContent = st.score.toLocaleString();
    card.querySelector('.combo').textContent = st.combo > 1 ? `×${st.combo}` : '';
    card.querySelector('.bombs').textContent = `${'◆'.repeat(st.bombs)}${'◇'.repeat(BOMBS - st.bombs)}`;
    card.classList.toggle('reloading', st.reload > 0);
    [...card.querySelectorAll('.ammo i')].forEach((pip, i) => pip.classList.toggle('on', i < st.ammo));
  }

  document.getElementById('wave').textContent = game.phase === 'lobby' ? 'READY' : `WAVE ${game.wave}`;
  const base = document.getElementById('base');
  if (base.children.length !== BASE_HP) base.innerHTML = '<i></i>'.repeat(BASE_HP);
  [...base.children].forEach((el, i) => el.classList.toggle('gone', i >= game.baseHp));
  document.getElementById('slowbar').style.width = `${(game.slowLeft > 0 ? game.slowLeft / 3 : game.slowCharge) * 100}%`;
}

/* ═══════════════════════════════════════════════════ go */

resize();
requestAnimationFrame(frame);

// Add ?debug=1 to the URL to inspect or drive the game from a console or a test.
if (new URLSearchParams(location.search).has('debug')) {
  window.__game = { game, pads, link, startGame, cursorOf };
}
