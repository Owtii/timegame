/**
 * Small maths kit for the motion pipeline. Quaternions are [w, x, y, z] and
 * rotate a vector from the device frame into the world frame, where the world
 * is the one the DeviceOrientation spec uses: X east, Y north, Z up.
 */

export const RAD = Math.PI / 180;
export const DEG = 180 / Math.PI;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;

/** Shortest signed difference between two angles, in degrees. */
export function wrapDeg(d) {
  let x = d % 360;
  if (x > 180) x -= 360;
  if (x < -180) x += 360;
  return x;
}

// ---------------------------------------------------------------- vectors

export const v3 = (x = 0, y = 0, z = 0) => [x, y, z];
export const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vScale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vLen = (a) => Math.hypot(a[0], a[1], a[2]);
export const vCross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function vNorm(a) {
  const l = vLen(a);
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0];
}

// ---------------------------------------------------------------- quaternions

export const qIdentity = () => [1, 0, 0, 0];

export function qMul(a, b) {
  const [aw, ax, ay, az] = a;
  const [bw, bx, by, bz] = b;
  return [
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
  ];
}

export function qNorm(q) {
  const l = Math.hypot(q[0], q[1], q[2], q[3]);
  return l > 1e-9 ? [q[0] / l, q[1] / l, q[2] / l, q[3] / l] : qIdentity();
}

export const qConj = (q) => [q[0], -q[1], -q[2], -q[3]];

/** Rotate a device-frame vector into the world frame. */
export function qRotate(q, v) {
  const [w, x, y, z] = q;
  const [vx, vy, vz] = v;
  // t = 2 * (q_vec x v)
  const tx = 2 * (y * vz - z * vy);
  const ty = 2 * (z * vx - x * vz);
  const tz = 2 * (x * vy - y * vx);
  return [
    vx + w * tx + (y * tz - z * ty),
    vy + w * ty + (z * tx - x * tz),
    vz + w * tz + (x * ty - y * tx),
  ];
}

/** Rotate a world-frame vector back into the device frame. */
export const qUnrotate = (q, v) => qRotate(qConj(q), v);

export function qFromAxisAngle(axis, angleRad) {
  const a = vNorm(axis);
  const h = angleRad / 2;
  const s = Math.sin(h);
  return [Math.cos(h), a[0] * s, a[1] * s, a[2] * s];
}

/**
 * The Z-X'-Y'' sequence used by DeviceOrientationEvent (alpha, beta, gamma in
 * degrees) converted to a quaternion, exactly as specified by the W3C.
 */
export function qFromDeviceOrientation(alpha, beta, gamma) {
  const z = (alpha || 0) * RAD * 0.5;
  const x = (beta || 0) * RAD * 0.5;
  const y = (gamma || 0) * RAD * 0.5;
  const cX = Math.cos(x), cY = Math.cos(y), cZ = Math.cos(z);
  const sX = Math.sin(x), sY = Math.sin(y), sZ = Math.sin(z);
  return [
    cX * cY * cZ - sX * sY * sZ,
    sX * cY * cZ - cX * sY * sZ,
    cX * sY * cZ + sX * cY * sZ,
    cX * cY * sZ + sX * sY * cZ,
  ];
}

export function qSlerp(a, b, t) {
  let cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let to = b;
  if (cos < 0) { cos = -cos; to = [-b[0], -b[1], -b[2], -b[3]]; }
  if (cos > 0.9995) {
    return qNorm([
      lerp(a[0], to[0], t), lerp(a[1], to[1], t),
      lerp(a[2], to[2], t), lerp(a[3], to[3], t),
    ]);
  }
  const theta = Math.acos(cos);
  const s = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / s;
  const wb = Math.sin(t * theta) / s;
  return [
    a[0] * wa + to[0] * wb, a[1] * wa + to[1] * wb,
    a[2] * wa + to[2] * wb, a[3] * wa + to[3] * wb,
  ];
}

// ---------------------------------------------------------------- filters

/** Plain exponential smoothing with a time constant in seconds. */
export class Ema {
  constructor(tau = 0.08, value = 0) {
    this.tau = tau;
    this.value = value;
    this.primed = false;
  }
  push(x, dt) {
    if (!this.primed) { this.primed = true; this.value = x; return x; }
    const a = this.tau <= 0 ? 1 : 1 - Math.exp(-dt / this.tau);
    this.value += (x - this.value) * a;
    return this.value;
  }
  reset(value = 0) { this.value = value; this.primed = false; }
}

/**
 * One-Euro filter (Casiello, Roussel & Vogel). The cutoff rises with speed, so
 * a resting hand gets heavy smoothing and a fast flick stays responsive. This
 * is what keeps the pointer from either jittering or feeling laggy.
 */
export class OneEuro {
  constructor({ minCutoff = 1.2, beta = 0.05, dCutoff = 1.0 } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.x = null;
    this.dx = 0;
  }
  static #alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(x, dt) {
    if (dt <= 0) return this.x ?? x;
    if (this.x === null) { this.x = x; return x; }
    const dRaw = (x - this.x) / dt;
    const aD = OneEuro.#alpha(this.dCutoff, dt);
    this.dx += aD * (dRaw - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const a = OneEuro.#alpha(cutoff, dt);
    this.x += a * (x - this.x);
    return this.x;
  }
  reset() { this.x = null; this.dx = 0; }
}

/** First-order high pass, used to strip gravity and slow drift out of accel. */
export class HighPass {
  constructor(tau = 0.25) { this.tau = tau; this.low = null; }
  push(x, dt) {
    if (this.low === null) { this.low = x; return 0; }
    const a = 1 - Math.exp(-dt / this.tau);
    this.low += (x - this.low) * a;
    return x - this.low;
  }
  reset() { this.low = null; }
}

/** Fixed-size ring buffer of numbers with a running sum. */
export class Ring {
  constructor(size) { this.buf = new Float32Array(size); this.i = 0; this.n = 0; }
  push(v) {
    this.buf[this.i] = v;
    this.i = (this.i + 1) % this.buf.length;
    if (this.n < this.buf.length) this.n++;
  }
  get last() { return this.buf[(this.i - 1 + this.buf.length) % this.buf.length]; }
  max() { let m = -Infinity; for (let k = 0; k < this.n; k++) m = Math.max(m, this.buf[k]); return m; }
  mean() { let s = 0; for (let k = 0; k < this.n; k++) s += this.buf[k]; return this.n ? s / this.n : 0; }
  clear() { this.i = 0; this.n = 0; }
}

/**
 * Radio-control style expo curve: gentle near the centre for fine aiming,
 * full range at the edges. `amount` 0 = linear, 1 = fully cubic.
 */
export function expo(v, amount) {
  const a = clamp01(amount);
  return v * (1 - a) + v * v * v * a;
}

/** Cut out the wobble of a hand trying to hold still, without a dead step. */
export function deadzone(v, dz) {
  const a = Math.abs(v);
  if (a <= dz) return 0;
  return Math.sign(v) * ((a - dz) / (1 - dz));
}
