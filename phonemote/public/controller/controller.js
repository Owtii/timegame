import { Sensors, MotionEngine, DEFAULTS } from '/controller/motion.js';
import { Link, tokenFromUrl } from '/lib/net.js';
import { M, packButtons, SLOT_COLORS, STATE_HZ } from '/shared/protocol.js';
import { qRotate, clamp, clamp01, DEG } from '/lib/mathx.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ───────────────────────────────────────────────── settings

const SLIDERS = [
  { key: 'sensitivity', min: 0.2, max: 3, step: 0.05, label: 'Sensitivity', tip: 'How far the cursor travels for a given wrist movement.' },
  { key: 'fov', min: 10, max: 90, step: 1, label: 'Aim range', unit: '°', tip: 'Degrees of turn that span the whole screen. Smaller = twitchier.' },
  { key: 'smoothing', min: 0, max: 1, step: 0.01, label: 'Smoothing', tip: 'Filters hand shake. High values add a little lag.' },
  { key: 'deadzone', min: 0, max: 0.12, step: 0.005, label: 'Dead zone', tip: 'Ignores tiny wobble around the centre.' },
  { key: 'curve', min: 0, max: 1, step: 0.02, label: 'Aim curve', tip: 'Fine control near the centre, faster at the edges.' },
  { key: 'swingThreshold', min: 6, max: 30, step: 0.5, label: 'Swing force', unit: ' m/s²', tip: 'How hard you have to move for a swing to register.' },
];

const EXTRA_DEFAULTS = { haptics: true };
const STORE_KEY = 'phonemote.settings';

function loadSettings() {
  try {
    return { ...DEFAULTS, ...EXTRA_DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
  } catch {
    return { ...DEFAULTS, ...EXTRA_DEFAULTS };
  }
}

function saveSettings() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch { /* private mode */ }
}

let settings = loadSettings();

// ───────────────────────────────────────────────── state

const sensors = new Sensors();
const engine = new MotionEngine(settings);
const link = new Link({ role: 'controller', token: tokenFromUrl(), name: deviceName() });

const held = Object.create(null);
let stick = [0, 0];
let seq = 0;
let lastSend = 0;
let started = false;
let wakeLock = null;

// ───────────────────────────────────────────────── gate / startup

if (tokenFromUrl()) $('#codeRow').classList.add('hidden');

$('#go').addEventListener('click', async () => {
  const typed = $('#code').value.trim().toUpperCase();
  if (typed) {
    link.token = typed;
    try { localStorage.setItem('phonemote.token', typed); } catch { /* ignore */ }
  }
  try {
    const backend = await sensors.start();
    note(`sensors: ${backend}`);
  } catch (err) {
    return gateError(err.message);
  }
  started = true;
  $('#gate').classList.add('done');
  link.connect();
  keepAwake();
  requestAnimationFrame(tick);
});

function gateError(msg) {
  const el = $('#gateErr');
  el.textContent = msg;
  el.hidden = false;
}

async function keepAwake() {
  try {
    wakeLock = await navigator.wakeLock?.request('screen');
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && !wakeLock?.released) {
        try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ignore */ }
      }
    });
  } catch { /* not supported, or denied: harmless */ }
}

$('#full').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    await screen.orientation?.lock?.('any').catch(() => {});
  } catch { /* Safari refuses without a gesture chain; not fatal */ }
});

// ───────────────────────────────────────────────── sensors -> engine

sensors.addEventListener('frame', (e) => engine.update(e.detail));
sensors.addEventListener('note', (e) => note(e.detail));

engine.addEventListener('gesture', (e) => {
  const g = e.detail;
  link.send({ m: M.EVENT, kind: 'gesture', gesture: g.kind, strength: round(g.strength, 2), axis: g.axis, dir: g.dir?.map((v) => round(v, 2)), t: Date.now() });
  logGesture(g);
  if (settings.haptics) buzz(g.kind === 'shake' ? 30 : 14);
});

// ───────────────────────────────────────────────── buttons

for (const el of $$('[data-btn]')) {
  const name = el.dataset.btn;
  const down = (ev) => {
    ev.preventDefault();
    if (held[name]) return;
    held[name] = true;
    el.classList.add('held');
    el.setPointerCapture?.(ev.pointerId);
    link.send({ m: M.EVENT, kind: 'button', button: name, down: true, t: Date.now() });
    if (settings.haptics) buzz(8);
  };
  const up = (ev) => {
    ev.preventDefault();
    if (!held[name]) return;
    held[name] = false;
    el.classList.remove('held');
    link.send({ m: M.EVENT, kind: 'button', button: name, down: false, t: Date.now() });
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('contextmenu', (ev) => ev.preventDefault());
}

// ───────────────────────────────────────────────── stick

{
  const pad = $('#stick');
  const knob = $('#knob');
  let active = null;
  const set = (ev) => {
    const r = pad.getBoundingClientRect();
    const nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((ev.clientY - r.top) / r.height) * 2 - 1;
    const len = Math.hypot(nx, ny);
    const k = len > 1 ? 1 / len : 1;
    stick = [clamp(nx * k, -1, 1), clamp(-ny * k, -1, 1)];
    knob.style.transform = `translate(${-50 + stick[0] * 52}%, ${-50 - stick[1] * 52}%)`;
  };
  pad.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    active = ev.pointerId;
    pad.setPointerCapture(ev.pointerId);
    set(ev);
  });
  pad.addEventListener('pointermove', (ev) => { if (active === ev.pointerId) set(ev); });
  const release = (ev) => {
    if (active !== ev.pointerId) return;
    active = null;
    stick = [0, 0];
    knob.style.transform = 'translate(-50%, -50%)';
  };
  pad.addEventListener('pointerup', release);
  pad.addEventListener('pointercancel', release);
}

// ───────────────────────────────────────────────── link

link.addEventListener('status', (e) => {
  const { state, error, fatal } = e.detail;
  const dot = $('#netdot');
  dot.className = 'dot';
  if (state === 'open') dot.classList.add('on');
  else if (state === 'reconnecting' || state === 'connecting') dot.classList.add('warn');
  else dot.classList.add('bad');

  if (state === 'open') {
    const slot = link.slot ?? 0;
    $('#who').textContent = `Player ${slot + 1}`;
    $('#who').style.color = SLOT_COLORS[slot] || '';
  } else if (error) {
    $('#who').textContent = error;
    if (fatal) { $('#gate').classList.remove('done'); gateError(error === 'bad-token' ? 'Wrong pairing code.' : error); }
  } else {
    $('#who').textContent = state;
  }
});

link.addEventListener('message', (e) => {
  const msg = e.detail;
  if (msg.m === M.RUMBLE) rumble(msg.ms || 150, msg.strength ?? 1);
  if (msg.m === M.CONFIG && msg.config) applySettings({ ...settings, ...msg.config });
});

function rumble(ms, strength) {
  if (!navigator.vibrate) return;
  const on = Math.max(10, Math.round(ms * clamp01(strength)));
  // Vibration has no intensity control, so weak rumble is a stutter instead.
  if (strength >= 0.85) navigator.vibrate(on);
  else navigator.vibrate([on, Math.max(8, Math.round(on * (1 - strength) * 2)), on]);
}

const buzz = (ms) => navigator.vibrate?.(ms);

// ───────────────────────────────────────────────── main loop

function tick(now) {
  requestAnimationFrame(tick);
  if (!started) return;

  const interval = 1000 / STATE_HZ;
  if (now - lastSend >= interval - 1) {
    lastSend = now;
    link.send(engine.toFrame(seq++, packButtons(held), stick));
  }
  paint(now);
}

// ───────────────────────────────────────────────── painting

let lastPaint = 0;
function paint(now) {
  if (now - lastPaint < 60) return;           // the UI does not need 60 Hz
  lastPaint = now;

  $('#stats').textContent = `${sensors.rate} Hz · ${Math.round(link.rtt)} ms`;

  const p = engine.pointer;
  const cross = $('#cross');
  if (cross) {
    cross.style.left = `${p.x * 100}%`;
    cross.style.top = `${p.y * 100}%`;
    cross.style.opacity = p.out ? 0.35 : 1;
    cross.style.transform = `translate(-50%, -50%) rotate(${-engine.angles.roll}deg)`;
  }

  if (currentTab === 'debug') {
    drawCube();
    const a = engine.angles;
    const b = engine.bias.map((v) => round(v * DEG, 2));
    $('#readout').textContent = [
      `backend  ${sensors.backend}   rate ${sensors.rate} Hz   flip ${sensors.flipAccel}`,
      `yaw ${pad6(a.yaw)}  pitch ${pad6(a.pitch)}  roll ${pad6(a.roll)}`,
      `ptr ${p.x.toFixed(3)}, ${p.y.toFixed(3)}${p.out ? '  (off screen)' : ''}`,
      `gyro ${engine.gyroDeg.map((v) => pad6(v)).join(' ')}  deg/s`,
      `acc  ${engine.acc.map((v) => pad6(v)).join(' ')}  m/s²`,
      `lin  ${engine.lin.map((v) => pad6(v)).join(' ')}  energy ${engine.energy.toFixed(2)}`,
      `bias ${b.join(' ')} deg/s   ${engine.still ? 'still' : 'moving'}`,
    ].join('\n');
  }
}

const cube = $('#cube');
const cx2d = cube.getContext('2d');
const BOX = (() => {
  const w = 0.33, h = 0.68, d = 0.07;     // a phone, roughly
  const v = [];
  for (const sz of [-d, d]) for (const sy of [-h, h]) for (const sx of [-w, w]) v.push([sx, sy, sz]);
  const edges = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
  return { v, edges };
})();

function drawCube() {
  const w = cube.width, h = cube.height;
  cx2d.clearRect(0, 0, w, h);
  cx2d.strokeStyle = '#1d2740';
  cx2d.lineWidth = 1;
  // horizon + ground grid, so tilt is readable
  for (let i = -3; i <= 3; i++) {
    line(project([i * 0.5, -1.4, -0.9]), project([i * 0.5, 2.6, -0.9]));
    line(project([-1.5, i * 0.7 + 0.6, -0.9]), project([1.5, i * 0.7 + 0.6, -0.9]));
  }

  const pts = BOX.v.map((p) => project(qRotate(engine.q, p)));
  cx2d.strokeStyle = '#4cc9ff';
  cx2d.lineWidth = 2;
  for (const [a, b] of BOX.edges) line(pts[a], pts[b]);

  // the screen side, so you can tell which way it is facing
  cx2d.fillStyle = 'rgba(76, 201, 255, 0.18)';
  cx2d.beginPath();
  for (const i of [4, 5, 7, 6]) {
    const p = pts[i];
    if (i === 4) cx2d.moveTo(p[0], p[1]); else cx2d.lineTo(p[0], p[1]);
  }
  cx2d.closePath();
  cx2d.fill();

  // where it is aiming
  const fwd = qRotate(engine.q, engine.forwardDevice);
  cx2d.strokeStyle = '#ffd166';
  cx2d.setLineDash([4, 3]);
  line(project([0, 0, 0]), project(fwd.map((v) => v * 1.5)));
  cx2d.setLineDash([]);

  function line(a, b) {
    cx2d.beginPath();
    cx2d.moveTo(a[0], a[1]);
    cx2d.lineTo(b[0], b[1]);
    cx2d.stroke();
  }
}

/** Camera sits south of the origin looking north; screen up is world up. */
function project([x, y, z]) {
  const depth = y + 3.4;
  const f = 230;
  return [cube.width / 2 + (x * f) / depth, cube.height / 2 - (z * f) / depth];
}

function pad6(v) { return (v >= 0 ? ' ' : '') + v.toFixed(1).padStart(5, ' '); }
function round(v, n) { const k = 10 ** n; return Math.round((v ?? 0) * k) / k; }

// ───────────────────────────────────────────────── tabs

let currentTab = 'pad';
for (const b of $$('#tabs button')) {
  b.addEventListener('click', () => {
    currentTab = b.dataset.tab;
    $$('#tabs button').forEach((x) => x.classList.toggle('active', x === b));
    $$('.view').forEach((v) => { v.hidden = v.dataset.view !== currentTab; });
  });
}

// ───────────────────────────────────────────────── settings UI

function buildSliders() {
  const box = $('#sliders');
  box.innerHTML = '';
  for (const s of SLIDERS) {
    const wrap = document.createElement('div');
    wrap.className = 'slider';
    wrap.innerHTML = `
      <label for="s-${s.key}"><span>${s.label}</span><b id="v-${s.key}"></b></label>
      <input id="s-${s.key}" type="range" min="${s.min}" max="${s.max}" step="${s.step}">
      <div class="tip">${s.tip}</div>`;
    box.append(wrap);
    const input = wrap.querySelector('input');
    input.value = settings[s.key];
    const show = () => { wrap.querySelector('b').textContent = fmt(s, input.value); };
    show();
    input.addEventListener('input', () => {
      applySettings({ [s.key]: Number(input.value) });
      show();
    });
  }
}

const fmt = (s, v) => `${Number(v).toFixed(s.step < 0.1 ? 2 : s.step < 1 ? 1 : 0)}${s.unit || ''}`;

function applySettings(patch) {
  Object.assign(settings, patch);
  engine.setConfig(settings);
  saveSettings();
  syncSettingsUI();
}

function syncSettingsUI() {
  for (const seg of $$('.seg')) {
    const key = seg.dataset.setting;
    for (const b of seg.querySelectorAll('button')) b.classList.toggle('on', settings[key] === b.dataset.value);
  }
  for (const c of $$('input[type=checkbox][data-setting]')) c.checked = !!settings[c.dataset.setting];
  for (const s of SLIDERS) {
    const input = $(`#s-${s.key}`);
    if (input && Number(input.value) !== settings[s.key]) input.value = settings[s.key];
    const out = $(`#v-${s.key}`);
    if (out) out.textContent = fmt(s, settings[s.key]);
  }
  $('#gripHelp').textContent = settings.grip === 'remote'
    ? 'Hold it like a TV remote: screen towards you, top edge aimed at the screen.'
    : 'Hold it flat like a gamepad: screen facing up towards you, aim with the back of the phone.';
}

for (const seg of $$('.seg')) {
  for (const b of seg.querySelectorAll('button')) {
    b.addEventListener('click', () => applySettings({ [seg.dataset.setting]: b.dataset.value }));
  }
}
for (const c of $$('input[type=checkbox][data-setting]')) {
  c.addEventListener('change', () => applySettings({ [c.dataset.setting]: c.checked }));
}
$('#reset').addEventListener('click', () => {
  settings = { ...DEFAULTS, ...EXTRA_DEFAULTS };
  engine.setConfig(settings);
  saveSettings();
  buildSliders();
  syncSettingsUI();
});

$('#recenter').addEventListener('click', () => { engine.recenter(); buzz(12); });
$('#recenter2').addEventListener('click', () => { engine.recenter(); buzz(12); });
$('#calGyro').addEventListener('click', () => {
  engine.resetBias();
  note('gyro bias reset - hold still for a second');
  buzz([10, 40, 10]);
});

// ───────────────────────────────────────────────── log

const logEl = $('#log');
function logGesture(g) {
  const row = document.createElement('div');
  row.innerHTML = `<b>${g.kind}</b> ${g.axis ? g.axis + ' ' : ''}${(g.strength * 100).toFixed(0)}%`;
  logEl.prepend(row);
  while (logEl.children.length > 40) logEl.lastChild.remove();
}
function note(text) {
  const row = document.createElement('div');
  row.textContent = `· ${text}`;
  logEl.prepend(row);
}

function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  const m = /Android.*?;\s*([^;)]+)\s*(?:Build|\))/.exec(ua);
  if (m) return m[1].trim().slice(0, 20);
  return 'Phone';
}

buildSliders();
syncSettingsUI();
engine.recenter();

// Add ?debug=1 to the URL to poke at the pipeline from a console or a test.
if (new URLSearchParams(location.search).has('debug')) {
  window.__pm = { sensors, engine, link, settings, held };
}
