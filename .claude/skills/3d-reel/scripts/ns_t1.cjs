// The Graveyard Shift: load, captions (narrator and phone), sound editor, camera editor, offline mix, phone width
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1440, height:900 }, { page:'the-graveyard-shift.html' });
  await p.waitForTimeout(5000);
  const log = (...a) => console.log(...a);
  log('ready:', await p.evaluate(() => !!window.reel));
  await p.evaluate(() => window.reel.play(false));
  for (const t of [3, 23, 36, 58]){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(400);
    log(`caption at ${t}:`, JSON.stringify(await p.$eval('#subs', e => e.textContent)), '| phone style:', await p.$eval('#subs', e => e.classList.contains('phone'))); }
  log('script lines:', await p.$$eval('#script li', els => els.length), '|', await p.$eval('#script li:last-child', e => e.textContent));
  // the sound editor
  await p.evaluate(() => { window.reel.seek(0); window.reel.sound.open(); }); await p.waitForTimeout(3000);
  const m = await p.evaluate(() => window.reel.sound.mix());
  log('mix clips:', m.clips.length, '| tracks:', [...new Set(m.clips.map(c => c.track))].join(','), '| on screen:', await p.$$eval('.se-clip', els => els.length));
  await p.screenshot({ path:'ns_sound_editor.png' });
  await p.click('#seClose').catch(() => {}); await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(500);
  // the camera editor
  await p.click('#openCE2'); await p.waitForTimeout(2500);
  log('camera keys on the timeline:', await p.$$eval('.ce-k', els => els.length));
  await p.screenshot({ path:'ns_camera_editor.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  // the export's offline mix: loud at the bang, silent in the stare, silent after the cut
  const lv = await p.evaluate(async () => { const buf = await window.reel.sound.render(44100), d = buf.getChannelData(0), rms = (a, z) => { let s = 0, n = 0; for (let i = Math.floor(a * 44100); i < z * 44100; i++){ s += d[i] * d[i]; n++; } return Math.sqrt(s / n) + 1e-9; };
    return { dur:buf.duration, hum:rms(3, 6), bang:rms(8.45, 9.1), jump:rms(30.3, 30.9), ring:rms(38.7, 39.7), end:rms(64.25, 64.8), gap:rms(64.9, 65.25), question:rms(66.5, 70.5) }; });
  log('offline mix (dB):', Object.entries(lv).map(([k, v]) => k === 'dur' ? `dur ${v.toFixed(2)}s` : `${k} ${(20 * Math.log10(v)).toFixed(1)}`).join(' | '));
  await b.close();
  const { b: b2, p: p2, errs: e2 } = await open({ width:390, height:844 }, { page:'the-graveyard-shift.html' });
  await p2.waitForTimeout(4500); log('phone width:', await p2.evaluate(() => document.documentElement.scrollWidth));
  await p2.screenshot({ path:'ns_phone.png' }); await b2.close();
  log([...errs, ...e2].filter(e => !/fonts|ERR_FAILED|net::/.test(e)).slice(0, 12).join('\n') || 'no errors');
})();
