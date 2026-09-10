#!/usr/bin/env node
/**
 * Drives the real pages in a real browser: loads each one, feeds the controller
 * synthetic phone motion, and checks that the fusion pipeline moves the pointer
 * and that the game sees it. Also writes screenshots.
 *
 * Needs Playwright, which is not a dependency of this project:
 *   npx playwright install chromium
 *   node tools/browser-check.js [--out docs] [--headed]
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const OUT = valueOf('--out') || join(ROOT, 'screenshots');
const HEADED = args.includes('--headed');

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1];
}

const chromium = await loadChromium();

/** Accept Playwright either as a dev dependency here or installed globally. */
async function loadChromium() {
  const candidates = ['playwright', 'playwright-core'];
  try {
    const { execFileSync } = await import('node:child_process');
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    candidates.push(join(globalRoot, 'playwright', 'index.js'), join(globalRoot, 'playwright-core', 'index.js'));
  } catch { /* npm may not be on PATH; the plain specifiers may still work */ }
  for (const c of candidates) {
    try {
      const mod = await import(c);
      const found = mod.chromium ?? mod.default?.chromium;
      if (found) return found;
    } catch { /* try the next one */ }
  }
  console.error('Playwright not found. Run: npm i -D playwright && npx playwright install chromium');
  return process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const AMMO_FULL = 6;
let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
};

const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const PORT = probe.address().port;
await new Promise((r) => probe.close(r));

const BASE = `https://127.0.0.1:${PORT}`;
const server = spawn(process.execPath, ['server/index.js', '--port', String(PORT), '--http', '0', '--no-token'], {
  cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'],
});
server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${BASE}/api/info`)).ok) break; } catch { await sleep(150); }
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: !HEADED, args: ['--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required'] });

/* ── the phone ──────────────────────────────────────────────────── */

const phone = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 414, height: 860 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  permissions: ['accelerometer', 'gyroscope'],
});
// Force the DeviceMotion path (what iOS uses) so we can feed it events.
await phone.addInitScript(() => {
  delete window.Gyroscope;
  delete window.Accelerometer;
});
const phonePage = await phone.newPage();
const phoneErrors = [];
phonePage.on('pageerror', (e) => phoneErrors.push(e.message));
await phonePage.goto(`${BASE}/c?debug=1`);
await phonePage.click('#go');
await phonePage.waitForFunction(() => window.__pm?.sensors?.running === true, null, { timeout: 5000 });
check('controller page starts its sensors', true);

/**
 * Pretend to be a phone being turned to the right and tilted up: yaw/pitch come
 * out of gyro integration, so we feed rotation rates and a gravity vector.
 */
async function swingPhone({ yawRate = 0, pitchRate = 0, seconds = 0.6, jolt = 0 } = {}) {
  await phonePage.evaluate(async ({ yawRate, pitchRate, seconds, jolt }) => {
    const hz = 60;
    const steps = Math.round(seconds * hz);
    for (let i = 0; i < steps; i++) {
      // Holding it like a remote: gravity along -Z of the device, top edge forward.
      const ev = new Event('devicemotion');
      Object.assign(ev, {
        interval: 1000 / hz,
        rotationRate: { alpha: yawRate, beta: pitchRate, gamma: 0 },
        accelerationIncludingGravity: { x: 0, y: 0, z: 9.81 },
        acceleration: { x: jolt * Math.sin(i * 0.8), y: jolt, z: 0 },
      });
      if (jolt) ev.accelerationIncludingGravity.y += jolt;
      window.dispatchEvent(ev);
      await new Promise((r) => setTimeout(r, 1000 / hz));
    }
  }, { yawRate, pitchRate, seconds, jolt });
}

await swingPhone({ seconds: 0.5 });                       // settle, pointing "at the screen"
await phonePage.evaluate(() => window.__pm.engine.recenter());
const centre = await phonePage.evaluate(() => ({ ...window.__pm.engine.pointer }));
check('pointer sits in the middle after re-centring',
  Math.abs(centre.x - 0.5) < 0.05 && Math.abs(centre.y - 0.5) < 0.05, JSON.stringify(centre));

await swingPhone({ yawRate: -40, seconds: 0.5 });          // turn right
const right = await phonePage.evaluate(() => ({ ...window.__pm.engine.pointer }));
check('turning the phone moves the pointer sideways', right.x > centre.x + 0.1, `x ${centre.x.toFixed(2)} -> ${right.x.toFixed(2)}`);

await swingPhone({ pitchRate: 30, seconds: 0.4 });         // tip it up
const up = await phonePage.evaluate(() => ({ ...window.__pm.engine.pointer }));
check('tilting the phone moves the pointer vertically', Math.abs(up.y - right.y) > 0.08, `y ${right.y.toFixed(2)} -> ${up.y.toFixed(2)}`);

await phonePage.evaluate(() => window.__pm.engine.recenter());
const drift = await phonePage.evaluate(async () => {
  const before = { ...window.__pm.engine.pointer };
  await new Promise((r) => setTimeout(r, 1200));
  return { before, after: { ...window.__pm.engine.pointer } };
});
check('a still phone does not drift', Math.hypot(drift.after.x - drift.before.x, drift.after.y - drift.before.y) < 0.02,
  `moved ${Math.hypot(drift.after.x - drift.before.x, drift.after.y - drift.before.y).toFixed(4)}`);

const gestures = [];
await phonePage.exposeFunction('__onGesture', (k) => gestures.push(k));
await phonePage.evaluate(() => window.__pm.engine.addEventListener('gesture', (e) => window.__onGesture(e.detail.kind)));
await swingPhone({ yawRate: -200, seconds: 0.45, jolt: 26 });
check('a hard shove registers as a gesture', gestures.length > 0, gestures.join(', ') || 'nothing fired');

check('controller page threw no errors', phoneErrors.length === 0, phoneErrors.join(' | '));
await phonePage.click('[data-tab="debug"]');
await phonePage.screenshot({ path: join(OUT, 'controller-debug.png') });
await phonePage.click('[data-tab="pad"]');
await phonePage.screenshot({ path: join(OUT, 'controller.png') });

/* ── the game, with the phone attached ──────────────────────────── */

const desktop = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 760 } });
const gamePage = await desktop.newPage();
const gameErrors = [];
gamePage.on('pageerror', (e) => gameErrors.push(e.message));
await gamePage.goto(`${BASE}/game`);
await gamePage.waitForSelector('.pcard', { timeout: 6000 }).catch(() => {});
check('the game sees the phone as a player', await gamePage.locator('.pcard').count() > 0);
await gamePage.screenshot({ path: join(OUT, 'game-lobby.png') });

await gamePage.evaluate(() => document.getElementById('start').click());
await swingPhone({ yawRate: -60, seconds: 0.5 });
await phonePage.locator('[data-btn="b"]').dispatchEvent('pointerdown');
await phonePage.locator('[data-btn="b"]').dispatchEvent('pointerup');
await sleep(1200);
await swingPhone({ yawRate: 80, seconds: 0.5 });
await sleep(1500);
await gamePage.screenshot({ path: join(OUT, 'game-phone.png') });
check('the game is running a wave', (await gamePage.locator('#wave').textContent()).includes('WAVE'));
check('game page threw no errors', gameErrors.length === 0, gameErrors.join(' | '));

/* ── sandbox and landing ────────────────────────────────────────── */

const sandboxPage = await desktop.newPage();
const sandboxErrors = [];
sandboxPage.on('pageerror', (e) => sandboxErrors.push(e.message));
await sandboxPage.goto(`${BASE}/sandbox`);
await swingPhone({ yawRate: -30, pitchRate: 8, seconds: 0.8 });
await sleep(400);
check('sandbox picked up the controller', !(await sandboxPage.locator('#readout').textContent()).includes('waiting'));
check('sandbox page threw no errors', sandboxErrors.length === 0, sandboxErrors.join(' | '));
await sandboxPage.screenshot({ path: join(OUT, 'sandbox.png') });

const landing = await desktop.newPage();
const landingErrors = [];
landing.on('pageerror', (e) => landingErrors.push(e.message));
await landing.goto(BASE);
await landing.waitForFunction(() => document.getElementById('qr')?.complete === true, null, { timeout: 5000 }).catch(() => {});
check('landing page renders the QR code', await landing.evaluate(() => document.getElementById('qr').naturalWidth > 0));
check('landing page threw no errors', landingErrors.length === 0, landingErrors.join(' | '));
await landing.screenshot({ path: join(OUT, 'landing.png') });

/* ── the mouse fallback, with no phone at all ───────────────────── */

const solo = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 760 } });
const soloPage = await solo.newPage();
const soloErrors = [];
soloPage.on('pageerror', (e) => soloErrors.push(e.message));
await soloPage.goto(`${BASE}/game?debug=1`);
await soloPage.click('#useLocal');
await soloPage.click('#start');
const localSlot = await soloPage.evaluate(() => window.__game.pads.active.find((p) => p.local).slot);
check('the mouse fallback takes a free slot beside the phone', localSlot > 0, `slot ${localSlot + 1}`);

// Wait for something to actually be on screen, aim at it, and pull the trigger:
// this is the hit test and the scoring path, not just "the page did not crash".
const target = await soloPage.waitForFunction(() => {
  const e = window.__game?.game.entities.find(
    (x) => x.kind !== 'barrel' && x.x > 80 && x.x < innerWidth - 80 && x.y > 80 && x.y < innerHeight - 120,
  );
  return e ? { x: e.x, y: e.y, kind: e.kind } : null;
}, null, { timeout: 25000 }).then((h) => h.jsonValue());

// Targets keep moving, so aim once, then re-read where that one actually is now.
await soloPage.mouse.move(target.x, target.y);
const live = await soloPage.evaluate(({ x, y }) => {
  let best = null;
  let bestD = Infinity;
  for (const e of window.__game.game.entities) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (e.kind !== 'barrel' && d < bestD) { best = e; bestD = d; }
  }
  return best ? { x: best.x, y: best.y, kind: best.kind } : null;
}, target);
await soloPage.mouse.move(live.x, live.y);
await soloPage.mouse.down();
await soloPage.mouse.up();
await sleep(400);
const state = await soloPage.evaluate((slot) => ({
  score: window.__game.game.players[slot].score,
  ammo: window.__game.game.players[slot].ammo,
}), localSlot);
check('the mouse fallback fires the gun', state.ammo < AMMO_FULL, `ammo ${state.ammo}`);
check('shooting a target scores', state.score > 0, `score ${state.score} (aimed at a ${live.kind})`);

await soloPage.keyboard.press('r');
await sleep(900);
const reloaded = await soloPage.evaluate((slot) => window.__game.game.players[slot].ammo, localSlot);
check('shake reloads', reloaded === AMMO_FULL, `ammo ${reloaded}`);
await soloPage.screenshot({ path: join(OUT, 'game.png') });
check('fallback threw no errors', soloErrors.length === 0, soloErrors.join(' | '));

await browser.close();
server.kill('SIGTERM');
await Promise.race([once(server, 'exit'), sleep(2000)]);

console.log(`\nscreenshots in ${OUT}`);
console.log(failures ? `${failures} check(s) failed` : 'all browser checks passed');
process.exit(failures ? 1 : 0);
