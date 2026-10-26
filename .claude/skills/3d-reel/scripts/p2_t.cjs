// The Graveyard Shift Part 2: load, title card, captions (narrator / me / phone), sound editor, camera editor, offline mix,
// the two-question card and both votes, phone width
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1440, height:900 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p.waitForTimeout(5000);
  const log = (...a) => console.log(...a);
  log('ready:', await p.evaluate(() => !!window.reel));
  await p.evaluate(() => window.reel.play(false));
  await p.evaluate(() => window.reel.seek(1.0)); await p.waitForTimeout(300);
  log('recap tag at 1.0 shown:', await p.$eval('#rtag', e => !e.hidden && +e.style.opacity > .5));
  await p.evaluate(() => window.reel.seek(8.45)); await p.waitForTimeout(300);
  log('recap question at 8.45 shown:', await p.$eval('#rcard', e => !e.hidden), '| RUN picked at 8.45:', await p.$eval('#rcard', e => e.classList.contains('picked')));
  await p.evaluate(() => window.reel.seek(9.05)); await p.waitForTimeout(300);
  log('RUN picked at 9.05:', await p.$eval('#rcard', e => e.classList.contains('picked')));
  await p.evaluate(() => window.reel.seek(10.25)); await p.waitForTimeout(300);
  log('card/tag/title at 10.25 hidden:', await p.$eval('#rcard', e => e.hidden), await p.$eval('#rtag', e => e.hidden), await p.$eval('#title2', e => e.hidden));
  for (const t of [.9, 2.9, 4.6, 5.2, 6.3, 11.15, 21.35, 38.6, 52.1, 58.55, 60.5, 73.85, 81.1, 83.6, 87.6]){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
    log(`caption at ${t}:`, JSON.stringify(await p.$eval('#subs', e => e.textContent)), '| style:', await p.$eval('#subs', e => e.classList.contains('me') ? 'me' : e.classList.contains('phone') ? 'phone' : 'narrator')); }
  log('script lines:', await p.$$eval('#script li', els => els.length));
  await p.evaluate(() => { window.reel.seek(0); window.reel.sound.open(); }); await p.waitForTimeout(3000);
  const m = await p.evaluate(() => window.reel.sound.mix());
  log('mix clips:', m.clips.length, '| tracks:', [...new Set(m.clips.map(c => c.track))].join(','), '| on screen:', await p.$$eval('.se-clip', els => els.length));
  await p.click('#seClose').catch(() => {}); await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(500);
  await p.click('#openCE2'); await p.waitForTimeout(2500);
  log('camera keys on the timeline:', await p.$$eval('.ce-k', els => els.length));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const hits = await p.evaluate(() => window.reel._fig.collide());   // (he must never walk through anything in the storage room)
  log('walks into furniture:', hits.length ? `${hits.length} times, first at ${hits[0].t} (${hits[0].x}, ${hits[0].z})` : 'never');
  const lv = await p.evaluate(async () => { const buf = await window.reel.sound.render(44100), d = buf.getChannelData(0), rms = (a, z) => { let s = 0, n = 0; for (let i = Math.floor(a * 44100); i < z * 44100; i++){ s += d[i] * d[i]; n++; } return Math.sqrt(s / n) + 1e-9; };
    return { dur:buf.duration, recap:rms(0, 7.95), guard:rms(4.4, 5.9), vault:rms(10.55, 11.25), run:rms(11.15, 13.85), doors:rms(20.45, 22.25), crash:rms(13.45, 14.45), pops:rms(15.35, 17.85), walk:rms(32.2, 35.5), bams:rms(43.9, 46.7), locker:rms(47.1, 48.9), burst:rms(51.2, 52.2), close:rms(60, 61.5), rage:rms(73.4, 75.4), quiet:rms(77.4, 78.6), burstwall:rms(51.3, 52.1), box:rms(79.7, 80.4), look:rms(81.3, 82.3), stare:rms(81.25, 82.25), lookround:rms(83.25, 85.15), desk:rms(85.4, 87.2), lockers:rms(89.3, 91.1), rise:rms(84.9, 91.7), gap:rms(93, 93.35), question:rms(94.75, 98.75) }; });
  log('offline mix (dB):', Object.entries(lv).map(([k, v]) => k === 'dur' ? `dur ${v.toFixed(2)}s` : `${k} ${(20 * Math.log10(v)).toFixed(1)}`).join(' | '));
  // the end card: both questions, pick one answer each
  await p.evaluate(() => window.reel.seek(94.15)); await p.waitForTimeout(700);
  log('card shown:', await p.$eval('#choice', e => !e.hidden), '| groups:', await p.$$eval('#choice [data-q]', els => els.length));
  await p.click('#choice [data-q="q2"] button[data-k="hide"]'); await p.waitForTimeout(300);
  log('picked:', JSON.stringify(await p.evaluate(() => window.reel.choice.picked())), '| result:', await p.$eval('#choiceRes', e => e.textContent));
  await p.locator('#stage').screenshot({ path:'p2_card_picked.png' });
  const url = await p.evaluate(() => window.reel.choice.card(94.15)); require('fs').writeFileSync('p2_card_export.png', Buffer.from(url.split(',')[1], 'base64'));
  const url2 = await p.evaluate(() => window.reel.choice.card(9.05)); const url3 = await p.evaluate(() => window.reel.choice.card(1.0)); require('fs').writeFileSync('p2_title2_export.png', Buffer.from(url3.split(',')[1], 'base64')); require('fs').writeFileSync('p2_title_export.png', Buffer.from(url2.split(',')[1], 'base64'));
  await b.close();
  const { b: b2, p: p2, errs: e2 } = await open({ width:390, height:844 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p2.waitForTimeout(4500); log('phone width:', await p2.evaluate(() => document.documentElement.scrollWidth)); await b2.close();
  log([...errs, ...e2].filter(e => !/fonts|ERR_FAILED|net::|willReadFrequently/.test(e)).slice(0, 12).join('\n') || 'no errors');
})();
