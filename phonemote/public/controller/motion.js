import {
  RAD, DEG, clamp, clamp01, wrapDeg, lerp,
  vAdd, vSub, vScale, vDot, vCross, vLen, vNorm,
  qIdentity, qMul, qNorm, qRotate, qUnrotate, qFromAxisAngle, qFromDeviceOrientation,
  OneEuro, Ema, Ring, expo, deadzone,
} from '../lib/mathx.js';
import { GESTURE } from '/shared/protocol.js';

const G = 9.80665;

/** Everything the feel of the controller depends on. Persisted on the phone. */
export const DEFAULTS = {
  grip: 'remote',          // 'remote': top edge aims at the screen. 'flat': screen faces you
  pointerMode: 'absolute', // 'absolute' aims like a Wii remote, 'relative' behaves like a mouse
  sensitivity: 1.0,        // overall pointer gain
  fov: 34,                 // degrees of yaw that span the screen in absolute mode
  smoothing: 0.45,         // 0 = raw and twitchy, 1 = heavy and smooth
  deadzone: 0.015,         // kills the wobble of a hand trying to hold still
  curve: 0.3,              // expo: fine control near the centre
  invertY: false,
  autoRecenter: true,      // in relative mode, drift the cursor home while still
  swingThreshold: 13,      // m/s^2 of gravity-free acceleration that counts as a swing
  aspect: 16 / 9,          // the game screen, so a circle of wrist movement stays round
  useCompass: false,       // fuse magnetometer heading (absolute yaw, but noisy indoors)
};

const STILL_GYRO = 2.5;   // deg/s
const STILL_ACC = 0.35;   // m/s^2 away from 1g
const KP_FAST = 2.5;      // accelerometer trust while settling
const KP_SLOW = 0.35;     // ...and once it has settled

/**
 * Reads whatever motion sensors the phone exposes and turns them into one
 * clean stream of frames: `{ dt, gyro (deg/s, device frame), acc (m/s^2,
 * device frame, gravity included), quat?, heading? }`.
 *
 * Two backends, because no single one works everywhere:
 *   - the Generic Sensor API (Chrome on Android) - higher rate, cleaner data
 *   - DeviceMotion/DeviceOrientation events (Safari on iOS, everything else)
 */
export class Sensors extends EventTarget {
  #handlers = {};

  constructor() {
    super();
    this.backend = 'none';
    this.rate = 0;
    this.running = false;
    this.flipAccel = isIOS();      // iOS reports accelerationIncludingGravity sign-flipped
    this.haveGyro = false;
    this.heading = null;
    this.refQuat = null;           // independent orientation estimate, when available
    this.lastTime = 0;
    this.frames = 0;
    this.rateWindow = performance.now();
    this.flipVotes = 0;
  }

  static get needsPermission() {
    return typeof DeviceMotionEvent !== 'undefined'
      && typeof DeviceMotionEvent.requestPermission === 'function';
  }

  /** iOS will only hand over sensors from inside a user gesture. */
  static async requestPermission() {
    const asks = [];
    if (typeof DeviceMotionEvent?.requestPermission === 'function') asks.push(DeviceMotionEvent.requestPermission());
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') asks.push(DeviceOrientationEvent.requestPermission());
    if (!asks.length) return 'granted';
    const results = await Promise.allSettled(asks);
    return results.every((r) => r.status === 'fulfilled' && r.value === 'granted') ? 'granted' : 'denied';
  }

  async start() {
    if (this.running) return this.backend;
    if (!window.isSecureContext) {
      throw new Error('Motion sensors need HTTPS. Open the https:// address, not http://.');
    }
    const granted = await Sensors.requestPermission();
    if (granted !== 'granted') throw new Error('Motion permission was denied. Reload and allow it.');

    this.running = true;
    if (this.#startGenericSensors()) this.backend = 'generic-sensor';
    else if (this.#startDeviceEvents()) this.backend = 'device-events';
    else throw new Error('This browser exposes no motion sensors.');
    return this.backend;
  }

  #startGenericSensors() {
    if (typeof window.Gyroscope !== 'function' || typeof window.Accelerometer !== 'function') return false;
    try {
      const gyro = new window.Gyroscope({ frequency: 90, referenceFrame: 'device' });
      const acc = new window.Accelerometer({ frequency: 90, referenceFrame: 'device' });
      let g = [0, 0, 0];
      // Generic Sensor gives rad/s; the rest of the pipeline speaks deg/s.
      gyro.addEventListener('reading', () => { g = [gyro.x * DEG, gyro.y * DEG, gyro.z * DEG]; });
      gyro.addEventListener('error', (e) => this.#fallback(e));
      acc.addEventListener('reading', () => {
        this.haveGyro = true;
        this.#emitFrame(g, [acc.x, acc.y, acc.z]);
      });
      acc.addEventListener('error', (e) => this.#fallback(e));
      gyro.start();
      acc.start();
      this.#handlers.sensors = [gyro, acc];
      this.#startOrientationReference();
      return true;
    } catch {
      return false;
    }
  }

  #fallback(err) {
    // Permission revoked or the sensor is not actually present: drop to events.
    if (this.backend !== 'generic-sensor') return;
    this.#stopGeneric();
    if (this.#startDeviceEvents()) {
      this.backend = 'device-events';
      this.dispatchEvent(new CustomEvent('note', {
        detail: `Generic sensors unavailable (${err?.error?.name || 'error'}); using DeviceMotion.`,
      }));
    }
  }

  #startDeviceEvents() {
    if (typeof window.DeviceMotionEvent === 'undefined') return false;
    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity;
      const r = e.rotationRate;
      if (!a) return;
      const s = this.flipAccel ? -1 : 1;
      // rotationRate: alpha about z, beta about x, gamma about y.
      const gyro = r ? [r.beta || 0, r.gamma || 0, r.alpha || 0] : [0, 0, 0];
      if (r && (r.alpha || r.beta || r.gamma)) this.haveGyro = true;
      this.#emitFrame(gyro, [s * (a.x || 0), s * (a.y || 0), s * (a.z || 0)], e.interval);
    };
    window.addEventListener('devicemotion', onMotion, { passive: true });
    this.#handlers.motion = onMotion;
    this.#startOrientationReference();
    return true;
  }

  /**
   * DeviceOrientation (or the absolute orientation sensor) is used for two
   * things only: a sanity check on the accelerometer sign, and an optional
   * compass heading. The pointer itself always comes from our own fusion.
   */
  #startOrientationReference() {
    const onOrient = (e) => {
      if (e.alpha === null && e.beta === null) return;
      this.refQuat = qFromDeviceOrientation(e.alpha, e.beta, e.gamma);
      if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
        this.heading = e.webkitCompassHeading;           // iOS, degrees clockwise from north
      } else if (e.absolute && typeof e.alpha === 'number') {
        this.heading = (360 - e.alpha) % 360;
      }
    };
    window.addEventListener('deviceorientationabsolute', onOrient, { passive: true });
    window.addEventListener('deviceorientation', onOrient, { passive: true });
    this.#handlers.orient = onOrient;
  }

  #emitFrame(gyro, acc, intervalMs) {
    const now = performance.now();
    let dt = this.lastTime ? (now - this.lastTime) / 1000 : (intervalMs ? intervalMs / 1000 : 1 / 60);
    this.lastTime = now;
    if (!(dt > 0) || dt > 0.25) dt = 1 / 60;          // a tab switch should not teleport the pointer

    this.frames++;
    if (now - this.rateWindow > 1000) {
      this.rate = Math.round((this.frames * 1000) / (now - this.rateWindow));
      this.frames = 0;
      this.rateWindow = now;
    }

    this.#voteOnAccelSign(acc);
    this.dispatchEvent(new CustomEvent('frame', {
      detail: { dt, gyro, acc, quat: this.refQuat, heading: this.heading },
    }));
  }

  /**
   * If our accelerometer sign convention disagrees with the browser's own
   * orientation estimate, flip it. This catches the iOS/Android difference
   * without having to trust user-agent sniffing.
   */
  #voteOnAccelSign(acc) {
    if (!this.refQuat) return;
    const mag = vLen(acc);
    if (Math.abs(mag - G) > 1.0) return;                 // only judge while roughly at rest
    const measured = vNorm(acc);
    const expected = qUnrotate(this.refQuat, [0, 0, 1]); // world up, seen from the device
    const agreement = vDot(measured, expected);
    if (agreement < -0.8) this.flipVotes++;
    else if (agreement > 0.8) this.flipVotes = Math.max(0, this.flipVotes - 1);
    if (this.flipVotes > 25) {
      this.flipAccel = !this.flipAccel;
      this.flipVotes = 0;
      this.dispatchEvent(new CustomEvent('note', {
        detail: `Accelerometer sign corrected (flip=${this.flipAccel}).`,
      }));
    }
  }

  #stopGeneric() {
    for (const s of this.#handlers.sensors || []) { try { s.stop(); } catch { /* already gone */ } }
    this.#handlers.sensors = null;
  }

  stop() {
    this.running = false;
    this.#stopGeneric();
    if (this.#handlers.motion) window.removeEventListener('devicemotion', this.#handlers.motion);
    if (this.#handlers.orient) {
      window.removeEventListener('deviceorientation', this.#handlers.orient);
      window.removeEventListener('deviceorientationabsolute', this.#handlers.orient);
    }
    this.#handlers = {};
  }
}

/**
 * Turns raw frames into what a game actually wants: a stable orientation, a
 * screen-space pointer that feels like a Wii remote, and discrete gestures.
 *
 * Orientation is a Mahony complementary filter - gyro integration for the fast,
 * detailed motion, nudged toward the accelerometer's gravity vector so it never
 * tips over. Gyro bias is learned whenever the phone is held still, which is
 * what stops the pointer sliding away on its own.
 */
export class MotionEngine extends EventTarget {
  constructor(config = {}) {
    super();
    this.cfg = { ...DEFAULTS, ...config };
    this.q = qIdentity();
    this.bias = [0, 0, 0];          // rad/s
    this.still = false;
    this.stillFor = 0;
    this.settle = 1;                // 1 -> trust the accelerometer hard, decays after start
    this.ref = { yaw: 0, pitch: 0, roll: 0 };
    this.angles = { yaw: 0, pitch: 0, roll: 0 };
    this.pointer = { x: 0.5, y: 0.5, out: false };
    this.rel = [0, 0];
    this.lin = [0, 0, 0];
    this.linDevice = [0, 0, 0];
    this.energy = 0;
    this.gyroDeg = [0, 0, 0];
    this.acc = [0, 0, G];
    this.#buildFilters();
    this.energyRing = new Ring(40);
    this.peakTimes = [];
    this.lastGesture = {};
    this.swing = null;
    this.relPos = [0.5, 0.5];
  }

  #buildFilters() {
    // smoothing 0..1 -> a low cutoff (heavy) through to a high one (immediate)
    const s = clamp01(this.cfg.smoothing);
    const minCutoff = lerp(12, 0.7, s);
    const beta = lerp(0.02, 0.9, 1 - s);
    this.fx = new OneEuro({ minCutoff, beta });
    this.fy = new OneEuro({ minCutoff, beta });
    this.rollFilter = new Ema(0.06);
    this.energyFilter = new Ema(0.05);
  }

  setConfig(patch) {
    const needsFilters = patch.smoothing !== undefined && patch.smoothing !== this.cfg.smoothing;
    Object.assign(this.cfg, patch);
    if (needsFilters) this.#buildFilters();
    if (patch.grip) this.recenter();
  }

  get forwardDevice() { return this.cfg.grip === 'remote' ? [0, 1, 0] : [0, 0, -1]; }
  get upDevice() { return this.cfg.grip === 'remote' ? [0, 0, 1] : [0, 1, 0]; }

  /** Treat wherever the phone points right now as the centre of the screen. */
  recenter() {
    const a = this.#anglesFromQuat();
    this.ref = { ...a };
    this.fx.reset();
    this.fy.reset();
    this.relPos = [0.5, 0.5];
    this.dispatchEvent(new CustomEvent('recentred', { detail: this.ref }));
  }

  /** Relearn gyro bias from scratch; the phone must be lying still. */
  resetBias() {
    this.bias = [0, 0, 0];
    this.stillFor = 0;
    this.settle = 1;
  }

  update({ dt, gyro, acc, heading }) {
    this.gyroDeg = gyro;
    this.acc = acc;

    const gRad = [gyro[0] * RAD - this.bias[0], gyro[1] * RAD - this.bias[1], gyro[2] * RAD - this.bias[2]];
    const accMag = vLen(acc);
    const gyroMag = vLen(gyro);

    // --- stillness, and the gyro bias we can only learn while still
    const isStill = gyroMag < STILL_GYRO && Math.abs(accMag - G) < STILL_ACC;
    this.stillFor = isStill ? this.stillFor + dt : 0;
    this.still = this.stillFor > 0.3;
    if (this.still) {
      const k = 1 - Math.exp(-dt / 1.5);
      for (let i = 0; i < 3; i++) this.bias[i] += (gyro[i] * RAD - this.bias[i]) * k;
    }

    // --- orientation: integrate the gyro, lean on gravity to stop it tipping
    let omega = gRad;
    if (accMag > 1 && accMag < 4 * G) {
      const aDir = vNorm(acc);
      const gravityInDevice = qUnrotate(this.q, [0, 0, 1]);
      const error = vCross(aDir, gravityInDevice);
      const kp = lerp(KP_SLOW, KP_FAST, clamp01(this.settle));
      omega = vAdd(omega, vScale(error, kp));
    }
    this.settle = Math.max(0, this.settle - dt / 3);

    const rate = vLen(omega);
    if (rate > 1e-8) this.q = qNorm(qMul(this.q, qFromAxisAngle(omega, rate * dt)));

    if (this.cfg.useCompass && heading !== null && heading !== undefined) this.#nudgeHeading(heading, dt);

    // --- gravity-free acceleration, in both frames
    const gravityDevice = vScale(qUnrotate(this.q, [0, 0, 1]), G);
    this.linDevice = vSub(acc, gravityDevice);
    this.lin = qRotate(this.q, this.linDevice);
    this.energy = this.energyFilter.push(vLen(this.linDevice), dt);

    // --- angles, pointer, gestures
    this.angles = this.#anglesFromQuat();
    this.#updatePointer(dt);
    this.#detectGestures(dt);
    return this;
  }

  /** Very gently pull yaw toward the compass, which is absolute but jittery. */
  #nudgeHeading(heading, dt) {
    const a = this.#anglesFromQuat();
    // heading is degrees clockwise from north; our yaw is counter-clockwise from +Y (north)
    const target = wrapDeg(-heading);
    const err = wrapDeg(target - a.yaw);
    const k = clamp(dt * 0.08, 0, 0.05);
    this.q = qNorm(qMul(qFromAxisAngle([0, 0, 1], err * RAD * k), this.q));
  }

  #anglesFromQuat() {
    const fwd = vNorm(qRotate(this.q, this.forwardDevice));
    const up = qRotate(this.q, this.upDevice);
    const yaw = Math.atan2(fwd[0], fwd[1]) * DEG;
    const pitch = Math.asin(clamp(fwd[2], -1, 1)) * DEG;

    // Roll: how far the device is twisted about the axis it is pointing along.
    const worldUp = [0, 0, 1];
    let ref = vSub(worldUp, vScale(fwd, vDot(worldUp, fwd)));
    if (vLen(ref) < 1e-3) ref = vSub([0, 1, 0], vScale(fwd, vDot([0, 1, 0], fwd))); // pointing straight up
    ref = vNorm(ref);
    const proj = vNorm(vSub(up, vScale(fwd, vDot(up, fwd))));
    const roll = Math.atan2(vDot(vCross(ref, proj), fwd), vDot(ref, proj)) * DEG;
    return { yaw, pitch, roll };
  }

  #updatePointer(dt) {
    const { cfg } = this;
    const dYaw = wrapDeg(this.angles.yaw - this.ref.yaw);
    const dPitch = clamp(this.angles.pitch - this.ref.pitch, -89, 89);

    const halfH = Math.max(4, cfg.fov) / 2;
    const halfV = halfH / Math.max(0.2, cfg.aspect);

    if (cfg.pointerMode === 'relative') {
      // Mouse-like: integrate how fast we are turning, so the cursor can be
      // recentred anywhere and the phone can be held however is comfortable.
      const prev = this._prevAngles || this.angles;
      const vYaw = wrapDeg(this.angles.yaw - prev.yaw);
      const vPitch = this.angles.pitch - prev.pitch;
      this._prevAngles = { ...this.angles };

      const speed = Math.hypot(vYaw, vPitch) / Math.max(dt, 1e-3); // deg/s
      const accel = 1 + clamp(speed / 400, 0, 1.5) * cfg.curve * 2; // pointer acceleration
      const gain = (cfg.sensitivity * accel) / halfH / 2;
      let x = this.relPos[0] + vYaw * gain;
      let y = this.relPos[1] - vPitch * gain * cfg.aspect * (cfg.invertY ? -1 : 1);

      if (cfg.autoRecenter && this.still) {
        const k = 1 - Math.exp(-dt / 2.5);
        x = lerp(x, 0.5, k);
        y = lerp(y, 0.5, k);
      }
      this.relPos = [clamp01(x), clamp01(y)];
      this.rel = [vYaw * gain, -vPitch * gain * cfg.aspect];
      this.pointer = { x: this.relPos[0], y: this.relPos[1], out: false };
      return;
    }

    // Absolute: the phone aims at the screen the way a Wii remote does.
    let nx = dYaw / halfH;
    let ny = -dPitch / halfV;
    if (cfg.invertY) ny = -ny;
    nx = expo(deadzone(clamp(nx, -2.5, 2.5), cfg.deadzone), cfg.curve) * cfg.sensitivity;
    ny = expo(deadzone(clamp(ny, -2.5, 2.5), cfg.deadzone), cfg.curve) * cfg.sensitivity;

    const sx = this.fx.filter(0.5 + nx * 0.5, dt);
    const sy = this.fy.filter(0.5 + ny * 0.5, dt);
    const out = sx < -0.02 || sx > 1.02 || sy < -0.02 || sy > 1.02;
    const prevX = this.pointer.x;
    const prevY = this.pointer.y;
    this.pointer = { x: clamp01(sx), y: clamp01(sy), out };
    this.rel = [this.pointer.x - prevX, this.pointer.y - prevY];
  }

  /**
   * Gestures come off the gravity-free acceleration. A swing is a single big
   * burst with a direction; a shake is several bursts in a row; a thrust is a
   * burst along the axis the phone is pointing; a twist is a roll spike.
   */
  #detectGestures(dt) {
    const now = performance.now();
    const mag = vLen(this.linDevice);
    this.energyRing.push(mag);

    const thr = this.cfg.swingThreshold;
    const fire = (kind, detail) => {
      const cool = { [GESTURE.SWING]: 260, [GESTURE.SHAKE]: 600, [GESTURE.THRUST]: 320, [GESTURE.TWIST]: 400 }[kind];
      if (now - (this.lastGesture[kind] || 0) < cool) return;
      this.lastGesture[kind] = now;
      this.dispatchEvent(new CustomEvent('gesture', { detail: { kind, t: now, ...detail } }));
    };

    // A swing is tracked across frames: catch the rise, follow it to its peak,
    // then report the direction of the strongest moment.
    if (this.swing) {
      if (mag > this.swing.peak) {
        this.swing.peak = mag;
        this.swing.dir = [...this.lin];
      }
      this.swing.age += dt;
      if (mag < thr * 0.45 || this.swing.age > 0.28) {
        const dir = vNorm(this.swing.dir);
        const fwd = vNorm(qRotate(this.q, this.forwardDevice));
        const along = vDot(dir, fwd);
        const strength = clamp01((this.swing.peak - thr) / (thr * 2.5));
        if (along > 0.72 && this.swing.peak > thr * 1.1) {
          fire(GESTURE.THRUST, { strength, dir, peak: this.swing.peak });
        } else {
          fire(GESTURE.SWING, { strength, dir, peak: this.swing.peak, axis: dominantAxis(dir) });
        }
        this.swing = null;
      }
    } else if (mag > thr) {
      this.swing = { peak: mag, dir: [...this.lin], age: 0 };
      this.peakTimes.push(now);
    }

    // Shake: three or more bursts inside 900ms.
    this.peakTimes = this.peakTimes.filter((t) => now - t < 900);
    if (this.peakTimes.length >= 3) {
      const strength = clamp01(this.energyRing.max() / (thr * 2));
      fire(GESTURE.SHAKE, { strength, count: this.peakTimes.length });
      this.peakTimes = [];
    }

    // Twist: fast roll about whatever axis the phone is pointing along.
    const fwdDev = this.forwardDevice;
    const rollRate = Math.abs(vDot(this.gyroDeg, fwdDev));
    if (rollRate > 260) fire(GESTURE.TWIST, { strength: clamp01(rollRate / 700), rate: rollRate });
  }

  /** The state frame that goes on the wire. Rounded: it is sent 60x a second. */
  toFrame(seq, buttons, stick) {
    const r2 = (v) => Math.round(v * 100) / 100;
    const r3 = (v) => Math.round(v * 1000) / 1000;
    return {
      m: 'state',
      seq,
      t: Date.now(),
      ori: { yaw: r2(wrapDeg(this.angles.yaw - this.ref.yaw)), pitch: r2(this.angles.pitch - this.ref.pitch), roll: r2(this.angles.roll) },
      quat: this.q.map(r3),
      gyro: this.gyroDeg.map(r2),
      acc: this.acc.map(r2),
      lin: this.lin.map(r2),
      ptr: { x: r3(this.pointer.x), y: r3(this.pointer.y), out: this.pointer.out },
      rel: this.rel.map(r3),
      mot: { energy: r2(this.energy), still: this.still },
      btn: buttons,
      stick: stick.map(r3),
    };
  }
}

function dominantAxis(dir) {
  const [x, y, z] = dir;
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  if (az >= ax && az >= ay) return z > 0 ? 'up' : 'down';
  if (ax >= ay) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'forward' : 'back';
}

function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
