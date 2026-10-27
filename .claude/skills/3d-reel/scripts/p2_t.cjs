// The Graveyard Shift Part 2: load, title card, captions (narrator / me / phone), sound editor, camera editor, offline mix,
// the two-question card and both votes, phone width
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1440, height:900 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p.waitForTimeout(5000);
  const log = (...a) => console.log(...a);
  log('ready:', await p.evaluate(() => !!window.reel));
  await p.evaluate(() => window.reel.play(false));
  // the opening: the first question over the live shot (its words lighting up); the picture freezes, the first question
  // goes and the second comes in its place; the keys rise; RUN is pressed, RUN CHOSEN · PART 2; then Part 2
  const hook = async t => { await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
    return p.evaluate(() => { const c = document.getElementById('rcard'), o = id => +(+document.getElementById(id).style.opacity || 0).toFixed(2);
      return { card:!c.hidden && +c.style.opacity > .5, lit:c.querySelectorAll('.on').length, q1:o('hq'), q2:o('hq2'), keys:[o('rk0'), o('rk1')], chose:o('rchose'), picked:c.classList.contains('picked') }; }); };
  log('opening at 0.5:', JSON.stringify(await hook(.5)), '| 2.6:', JSON.stringify(await hook(2.6)), '| 3.8:', JSON.stringify(await hook(3.8)));
  log('opening at 5.6:', JSON.stringify(await hook(5.6)), '| 8.3:', JSON.stringify(await hook(8.3)), '| 8.7:', JSON.stringify(await hook(8.7)));
  await p.evaluate(() => window.reel.seek(10.0)); await p.waitForTimeout(300);
  log('card/title at 10.0 hidden:', await p.$eval('#rcard', e => e.hidden), await p.$eval('#title2', e => e.hidden));
  for (const t of [1.0, 5.0, 10.9, 19.8, 21.3, 23.7, 40.95, 54.45, 60.9, 62.85, 67.95, 73.15, 75.65, 79.65]){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
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
    return { dur:buf.duration, hooklive:rms(0, 2.85), hookhold:rms(3.4, 8.4), press:rms(8.45, 9.0), vault:rms(10.3, 11.0), run:rms(10.9, 13.6), doors:rms(22.8, 24.6), crash:rms(13.2, 14.2), pops:rms(15.1, 17.5), sil:rms(17.5, 20.1), walk:rms(34.55, 37.85), bams:rms(46.25, 49.05), locker:rms(49.45, 51.25), burst:rms(53.55, 54.55), close:rms(62.35, 63.85), search:rms(67.25, 70.55), burstwall:rms(53.65, 54.45), box:rms(71.75, 72.45), look:rms(73.35, 74.35), stare:rms(73.3, 74.3), lookround:rms(75.3, 77.2), desk:rms(77.45, 79.25), opening:rms(81.65, 82.75), rise:rms(76.95, 83.55), gap:rms(83.65, 84.0), question:rms(85.4, 89.4) }; });
  log('offline mix (dB):', Object.entries(lv).map(([k, v]) => k === 'dur' ? `dur ${v.toFixed(2)}s` : `${k} ${(20 * Math.log10(v)).toFixed(1)}`).join(' | '));
  // the end card: both questions, pick one answer each
  await p.evaluate(() => window.reel.seek(84.8)); await p.waitForTimeout(700);
  log('card shown:', await p.$eval('#choice', e => !e.hidden), '| groups:', await p.$$eval('#choice [data-q]', els => els.length));
  await p.click('#choice [data-q="q2"] button[data-k="hide"]'); await p.waitForTimeout(300);
  log('picked:', JSON.stringify(await p.evaluate(() => window.reel.choice.picked())), '| result:', await p.$eval('#choiceRes', e => e.textContent));
  await p.locator('#stage').screenshot({ path:'p2_card_picked.png' });
  const url = await p.evaluate(() => window.reel.choice.card(84.8)); require('fs').writeFileSync('p2_card_export.png', Buffer.from(url.split(',')[1], 'base64'));
  for (const [t, f] of [[1.0, 'q1'], [4.0, 'q2'], [6.4, 'keys'], [8.75, 'picked']]){ const u = await p.evaluate(t => window.reel.choice.card(t), t); require('fs').writeFileSync(`p2_hook_${f}_export.png`, Buffer.from(u.split(',')[1], 'base64')); }   // (the opening as the video draws it)
  await b.close();
  const { b: b2, p: p2, errs: e2 } = await open({ width:390, height:844 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p2.waitForTimeout(4500); log('phone width:', await p2.evaluate(() => document.documentElement.scrollWidth)); await b2.close();
  log([...errs, ...e2].filter(e => !/fonts|ERR_FAILED|net::|willReadFrequently/.test(e)).slice(0, 12).join('\n') || 'no errors');
})();
