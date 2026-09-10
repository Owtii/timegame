#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, extname, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { randomBytes } from 'node:crypto';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';

import { Hub } from './hub.js';
import { ensureCert } from './certs.js';
import { createMouse } from './mouse.js';
import { M, unpackButtons } from '../shared/protocol.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log(`
phonemote - your phone as a Wii-style motion controller

  npm start -- [options]

  --port <n>       HTTPS port (default 8443)
  --http <n>       plain HTTP port, redirects to HTTPS (default 8080, 0 disables)
  --host <addr>    interface to bind (default 0.0.0.0, all of them)
  --token <s>      pairing code to require (default: a random one per run)
  --no-token       skip pairing entirely, anyone on the LAN can connect
  --mouse          also drive the real desktop cursor from the pointer
  --screen <WxH>   screen size for --mouse when it cannot be detected
  --help
`);
  process.exit(0);
}

const PORT = opts.port ?? 8443;
const HTTP_PORT = opts.http ?? 8080;
const BIND = opts.host ?? '0.0.0.0';
const TOKEN = opts['no-token'] ? null : (opts.token ?? makeToken());

const addresses = localAddresses();
const lanIp = addresses[0] ?? '127.0.0.1';
const cert = ensureCert(join(ROOT, 'certs'), ['localhost', '127.0.0.1', ...addresses]);

const mouse = opts.mouse ? createMouse({ screen: opts.screen }) : null;
let mouseHeld = false;

const hub = new Hub({
  token: TOKEN,
  onChange: logRoster,
  onInput: (msg, client) => {
    if (!mouse || client.slot !== 0) return;
    if (msg.m === M.STATE) {
      if (msg.ptr) mouse.move(msg.ptr.x, msg.ptr.y);
      const held = unpackButtons(msg.btn || 0);
      if (held.b !== mouseHeld) {
        mouseHeld = held.b;
        mouse.click(1, mouseHeld);
      }
    }
  },
});

const handler = async (req, res) => {
  try {
    await route(req, res);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(`500 ${err.message}`);
  }
};

const secure = https.createServer({ key: cert.key, cert: cert.cert }, handler);
const wss = new WebSocketServer({ noServer: true });

secure.on('upgrade', (req, socket, head) => {
  if (new URL(req.url, 'https://x').pathname !== '/ws') return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => {
    const address = req.socket.remoteAddress || '';
    hub.add(ws, { trusted: isLoopback(address), address });
  });
});

wss.on('error', (err) => console.error('websocket error:', err.message));

secure.listen(PORT, BIND, () => banner());

let plain = null;
if (HTTP_PORT) {
  plain = http.createServer((req, res) => {
    const host = (req.headers.host || lanIp).replace(/:\d+$/, '');
    res.writeHead(302, { location: `https://${host}:${PORT}${req.url}` });
    res.end('phonemote needs HTTPS for phone sensors - redirecting.');
  });
  plain.listen(HTTP_PORT, BIND, () => {});
  plain.on('error', (err) => console.error(`http port ${HTTP_PORT}: ${err.message}`));
}

secure.on('error', (err) => {
  console.error(`\nCould not listen on port ${PORT}: ${err.message}`);
  if (err.code === 'EADDRINUSE') console.error('Another phonemote may already be running. Try --port 8444.');
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log('\nshutting down');
    hub.close();
    mouse?.close();
    secure.close();
    plain?.close();
    setTimeout(() => process.exit(0), 150).unref();
  });
}

// ---------------------------------------------------------------- routing

const PAGES = {
  '/': 'index.html',
  '/c': 'controller/index.html',
  '/controller': 'controller/index.html',
  '/game': 'game/index.html',
  '/sandbox': 'sandbox/index.html',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

async function route(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const path = decodeURIComponent(url.pathname);

  const local = isLoopback(req.socket.remoteAddress);

  if (path === '/api/info') {
    // The pairing code is only handed out on the machine running the server;
    // otherwise any device on the LAN could read it and skip pairing.
    return json(res, {
      token: local ? TOKEN : null,
      paired: !!TOKEN,
      port: PORT,
      addresses,
      controllerUrl: controllerUrl(),
      ...hub.summary(),
      mouse: mouse ? { enabled: mouse.enabled, screen: mouse.screen } : null,
    });
  }

  if (path === '/api/qr.svg') {
    const data = url.searchParams.get('d') || (local ? controllerUrl() : `https://${lanIp}:${PORT}/c`);
    const svg = await QRCode.toString(data, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b0f17', light: '#ffffff' },
    });
    res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' });
    return res.end(svg);
  }

  if (PAGES[path]) return sendFile(res, join(PUBLIC, PAGES[path]));

  // /shared/* is the protocol module, imported by both the pages and the server
  const base = path.startsWith('/shared/') ? ROOT : PUBLIC;
  const rel = normalize(path).replace(/^([/\\])+/, '');
  const file = join(base, rel);
  if (!file.startsWith(base + sep)) {
    res.writeHead(403).end('403');
    return;
  }
  return sendFile(res, file);
}

function sendFile(res, file) {
  let info;
  try {
    info = statSync(file);
    if (info.isDirectory()) throw new Error('directory');
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('404 not found');
  }
  res.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
    'content-length': info.size,
    'cache-control': 'no-cache',
  });
  createReadStream(file).pipe(res);
}

function json(res, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(200, { 'content-type': MIME['.json'], 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store' });
  res.end(body);
}

// ---------------------------------------------------------------- startup output

function controllerUrl(host = lanIp) {
  return `https://${host}:${PORT}/c${TOKEN ? `?t=${TOKEN}` : ''}`;
}

async function banner() {
  const url = controllerUrl();
  const qr = await QRCode.toString(url, { type: 'terminal', small: true, errorCorrectionLevel: 'L' });
  const line = '─'.repeat(58);
  console.log(`\n┌${line}┐`);
  console.log(`  phonemote  ·  your phone is the controller`);
  console.log(`└${line}┘`);
  console.log(qr);
  console.log(`  1. On your phone (same WiFi):  ${url}`);
  console.log(`     Accept the certificate warning once - it is your own machine.`);
  console.log(`  2. On this computer, open the game:`);
  console.log(`       https://localhost:${PORT}/game       (the test game)`);
  console.log(`       https://localhost:${PORT}/sandbox    (3D look-around + sensor debug)`);
  if (addresses.length > 1) {
    console.log(`  Other addresses this machine answers on:`);
    for (const a of addresses.slice(1)) console.log(`       https://${a}:${PORT}/c${TOKEN ? `?t=${TOKEN}` : ''}`);
  }
  if (TOKEN) console.log(`  Pairing code: ${TOKEN}   (use --no-token to drop it)`);
  if (mouse) console.log(`  Virtual mouse: on  (${mouse.screen.w}x${mouse.screen.h}, player 1 drives the cursor)`);
  if (cert.fresh) console.log(`  Fresh TLS certificate written to certs/`);
  console.log('');
}

let lastRoster = '';
function logRoster(summary) {
  const text = summary.players.map((p) => `P${p.slot + 1} ${p.name}`).join(', ') || 'none';
  const key = `${text}|${summary.games}`;
  if (key === lastRoster) return;
  lastRoster = key;
  console.log(`  pads: ${text}   ·   games open: ${summary.games}`);
}

// ---------------------------------------------------------------- helpers

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    const key = (eq === -1 ? a.slice(2) : a.slice(2, eq));
    let value = eq === -1 ? null : a.slice(eq + 1);
    if (value === null) {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { value = next; i++; }
    }
    if (value === null) out[key] = true;
    else out[key] = /^\d+$/.test(value) ? Number(value) : value;
  }
  return out;
}

function localAddresses() {
  const out = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family !== 'IPv4' || ni.internal) continue;
      out.push(ni.address);
    }
  }
  // Private LAN ranges first: that is the address the phone can actually reach.
  return out.sort((a, b) => score(b) - score(a));
  function score(ip) {
    if (ip.startsWith('192.168.')) return 3;
    if (/^10\./.test(ip)) return 2;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2;
    return 1;
  }
}

function isLoopback(addr = '') {
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

function makeToken() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I: these get typed by hand
  return [...randomBytes(5)].map((b) => alphabet[b % alphabet.length]).join('');
}
