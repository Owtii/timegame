// The Graveyard Shift Part 2: load, title card, captions (narrator / me / phone), sound editor, camera editor, offline mix,
// the two-question card and both votes, phone width
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1440, height:900 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p.waitForTimeout(5000);
  const log = (...a) => console.log(...a);
  log('ready:', await p.evaluate(() => !!window.reel));
  await p.evaluate(() => window.reel.play(false));
  // the opening: the question a phrase at a time over the live shot (its words lighting up), each going as the next
  // comes; the picture freezes; the card rises (the end of the question over the keys); RUN is pressed, RUN CHOSEN ·
  // PART 2 holds; then Part 2
  const hook = async t => { await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
    return p.evaluate(() => { const c = document.getElementById('rcard'), o = id => +(+document.getElementById(id).style.opacity || 0).toFixed(2);
      return { card:!c.hidden && +c.style.opacity > .5, lit:c.querySelectorAll('.on').length, l:[o('hl0'), o('hl1'), o('hl2')], hcard:o('hcard'), chose:o('rchose'), picked:c.classList.contains('picked') }; }); };
  log('opening at 0.7:', JSON.stringify(await hook(.7)), '| 2.2:', JSON.stringify(await hook(2.2)), '| 3.8:', JSON.stringify(await hook(3.8)));
  log('opening at 5.6:', JSON.stringify(await hook(5.6)), '| 8.6:', JSON.stringify(await hook(8.6)), '| 9.2:', JSON.stringify(await hook(9.2)), '| 9.5:', JSON.stringify(await hook(9.5)));
  await p.evaluate(() => window.reel.seek(10.0)); await p.waitForTimeout(300);
  log('card/title at 10.0 hidden:', await p.$eval('#rcard', e => e.hidden), await p.$eval('#title2', e => e.hidden));
  // the narration (v34: the opening question and the first line recorded, the guard's warning from Part 1; the rest shows as captions on its planned times)
  log('narration clips muted:', await p.evaluate(() => { const v = window.reel.sound.mix().clips.filter(c => c.track === 'voice'); const e = window.reel.sound.mix().clips.find(c => c.id === 's_echo'); return `${v.filter(c => c.mute).length} of ${v.length}; the guard's echo muted: ${!!(e && e.mute)}`; }));
  for (const t of [10.9, 15.5, 18.4, 22.3, 38.9, 52.1, 57.5, 60.6, 65.5, 70.5, 73.5, 76.8]){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
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
    return { dur:buf.duration, hooklive:rms(0, 3.3), hookhold:rms(3.8, 7.8), press:rms(7.85, 8.4), unfreeze:rms(9.45, 9.75), vault:rms(10.3, 11), run:rms(10.9, 13.6), crash:rms(13.2, 14.2), figure:rms(14.6, 16.6), sting:rms(14.5, 15.3), dark:rms(17.3, 17.75), relight:rms(17.8, 18.6), doors:rms(20.45, 22.25), walk:rms(32.2, 35.5), bams:rms(43.9, 46.7), locker:rms(47.1, 48.9), burst:rms(51.2, 52.2), close:rms(60, 61.5), search:rms(64.9, 68.2), burstwall:rms(51.3, 52.1), box:rms(69.4, 70.1), look:rms(71, 72), stare:rms(70.95, 71.95), lookround:rms(72.95, 74.85), desk:rms(75.1, 76.9), opening:rms(79.3, 80.4), rise:rms(74.6, 81.2), gap:rms(81.3, 81.65), question:rms(83.05, 87.05) }; });
  log('offline mix (dB):', Object.entries(lv).map(([k, v]) => k === 'dur' ? `dur ${v.toFixed(2)}s` : `${k} ${(20 * Math.log10(v)).toFixed(1)}`).join(' | '));
  // the end card (v32: 1:28): both questions, pick one answer each
  await p.evaluate(() => window.reel.seek(82.45)); await p.waitForTimeout(700);
  log('card shown:', await p.$eval('#choice', e => !e.hidden), '| groups:', await p.$$eval('#choice [data-q]', els => els.length));
  await p.click('#choice [data-q="q2"] button[data-k="hide"]'); await p.waitForTimeout(300);
  log('picked:', JSON.stringify(await p.evaluate(() => window.reel.choice.picked())), '| result:', await p.$eval('#choiceRes', e => e.textContent));
  await p.locator('#stage').screenshot({ path:'p2_card_picked.png' });
  const url = await p.evaluate(() => window.reel.choice.card(82.45)); require('fs').writeFileSync('p2_card_export.png', Buffer.from(url.split(',')[1], 'base64'));
  for (const [t, f] of [[.8, 'l1'], [2.3, 'l2'], [3.9, 'l3'], [6.2, 'card'], [8.7, 'picked']]){ const u = await p.evaluate(t => window.reel.choice.card(t), t); require('fs').writeFileSync(`p2_hook_${f}_export.png`, Buffer.from(u.split(',')[1], 'base64')); }   // (the opening as the video draws it)
  await b.close();
  const { b: b2, p: p2, errs: e2 } = await open({ width:390, height:844 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p2.waitForTimeout(4500); log('phone width:', await p2.evaluate(() => document.documentElement.scrollWidth)); await b2.close();
  log([...errs, ...e2].filter(e => !/fonts|ERR_FAILED|net::|willReadFrequently/.test(e)).slice(0, 12).join('\n') || 'no errors');
})();
