import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import selfsigned from 'selfsigned';

/**
 * Phones only expose motion sensors to pages in a secure context, so the
 * controller has to be served over HTTPS even on a LAN. We mint a long-lived
 * self-signed certificate that covers localhost plus every local IP, and cache
 * it so the phone only has to accept the warning once per network.
 */
export function ensureCert(dir, hosts) {
  mkdirSync(dir, { recursive: true });
  const keyPath = join(dir, 'key.pem');
  const certPath = join(dir, 'cert.pem');
  const metaPath = join(dir, 'hosts.json');
  const wanted = [...new Set(hosts)].sort();

  if (existsSync(keyPath) && existsSync(certPath) && existsSync(metaPath)) {
    try {
      const have = JSON.parse(readFileSync(metaPath, 'utf8'));
      const covered = wanted.every((h) => have.includes(h));
      if (covered) {
        return {
          key: readFileSync(keyPath),
          cert: readFileSync(certPath),
          fresh: false,
          path: certPath,
        };
      }
    } catch {
      // fall through and regenerate
    }
  }

  const altNames = wanted.map((h) =>
    /^[\d.]+$/.test(h) ? { type: 7, ip: h } : { type: 2, value: h },
  );
  const pems = selfsigned.generate([{ name: 'commonName', value: 'phonemote.local' }], {
    days: 3650,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames }],
  });

  writeFileSync(keyPath, pems.private, { mode: 0o600 });
  writeFileSync(certPath, pems.cert);
  writeFileSync(metaPath, JSON.stringify(wanted, null, 2));
  return { key: pems.private, cert: pems.cert, fresh: true, path: certPath };
}
