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
  // the narration is out for now (v28): its clips are in the mix but muted, and its captions hidden
  log('narration clips muted:', await p.evaluate(() => { const v = window.reel.sound.mix().clips.filter(c => c.track === 'voice'); const e = window.reel.sound.mix().clips.find(c => c.id === 's_echo'); return `${v.filter(c => c.mute).length} of ${v.length}; the guard's echo muted: ${!!(e && e.mute)}`; }));
  for (const t of [10.9, 15.6, 18.9, 23.1, 40.35, 53.85, 60.3, 62.25, 67.35, 72.55, 75.05, 79.05]){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
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
    return { dur:buf.duration, hooklive:rms(0, 3.3), hookhold:rms(3.8, 7.8), press:rms(7.85, 8.4), unfreeze:rms(9.45, 9.75), vault:rms(10.3, 11.0), run:rms(10.9, 13.6), crash:rms(13.2, 14.2), figure:rms(14.6, 16.6), pops:rms(17.1, 19.5), doors:rms(22.2, 24.0), walk:rms(33.95, 37.25), bams:rms(45.65, 48.45), locker:rms(48.85, 50.65), burst:rms(52.95, 53.95), close:rms(61.75, 63.25), search:rms(66.65, 69.95), burstwall:rms(53.05, 53.85), box:rms(71.15, 71.85), look:rms(72.75, 73.75), stare:rms(72.7, 73.7), lookround:rms(74.7, 76.6), desk:rms(76.85, 78.65), opening:rms(81.05, 82.15), rise:rms(76.35, 82.95), gap:rms(83.05, 83.4), question:rms(84.8, 88.8) }; });
  log('offline mix (dB):', Object.entries(lv).map(([k, v]) => k === 'dur' ? `dur ${v.toFixed(2)}s` : `${k} ${(20 * Math.log10(v)).toFixed(1)}`).join(' | '));
  // the end card: both questions, pick one answer each
  await p.evaluate(() => window.reel.seek(84.2)); await p.waitForTimeout(700);
  log('card shown:', await p.$eval('#choice', e => !e.hidden), '| groups:', await p.$$eval('#choice [data-q]', els => els.length));
  await p.click('#choice [data-q="q2"] button[data-k="hide"]'); await p.waitForTimeout(300);
  log('picked:', JSON.stringify(await p.evaluate(() => window.reel.choice.picked())), '| result:', await p.$eval('#choiceRes', e => e.textContent));
  await p.locator('#stage').screenshot({ path:'p2_card_picked.png' });
  const url = await p.evaluate(() => window.reel.choice.card(84.2)); require('fs').writeFileSync('p2_card_export.png', Buffer.from(url.split(',')[1], 'base64'));
  for (const [t, f] of [[.8, 'l1'], [2.3, 'l2'], [3.9, 'l3'], [6.2, 'card'], [8.7, 'picked']]){ const u = await p.evaluate(t => window.reel.choice.card(t), t); require('fs').writeFileSync(`p2_hook_${f}_export.png`, Buffer.from(u.split(',')[1], 'base64')); }   // (the opening as the video draws it)
  await b.close();
  const { b: b2, p: p2, errs: e2 } = await open({ width:390, height:844 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p2.waitForTimeout(4500); log('phone width:', await p2.evaluate(() => document.documentElement.scrollWidth)); await b2.close();
  log([...errs, ...e2].filter(e => !/fonts|ERR_FAILED|net::|willReadFrequently/.test(e)).slice(0, 12).join('\n') || 'no errors');
})();
