// The Graveyard Shift Part 2: load, title card, captions (narrator / me / phone), sound editor, camera editor, offline mix,
// the two-question card and both votes, phone width
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1440, height:900 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p.waitForTimeout(5000);
  const log = (...a) => console.log(...a);
  log('ready:', await p.evaluate(() => !!window.reel));
  await p.evaluate(() => window.reel.play(false));
  // the opening: the narrator's question (its words lighting up, each line coming up as he gets to it), then the title
  // PART 2 · RUN CHOSEN over the held frame, then Part 2
  const hook = async t => { await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
    return p.evaluate(() => { const c = document.getElementById('rcard'), o = id => +(+document.getElementById(id).style.opacity || 0).toFixed(2), t2 = document.getElementById('title2');
      return { card:!c.hidden && +c.style.opacity > .5, lit:c.querySelectorAll('.on').length, lines:[o('hq2'), o('hq3'), o('hq4')], title:!t2.hidden && +t2.style.opacity > .5 }; }); };
  log('opening at 0.5:', JSON.stringify(await hook(.5)), '| 2.5:', JSON.stringify(await hook(2.5)), '| 4.5:', JSON.stringify(await hook(4.5)));
  log('opening at 6.4:', JSON.stringify(await hook(6.4)), '| 7.9:', JSON.stringify(await hook(7.9)), '| title at 8.9:', JSON.stringify(await hook(8.9)));
  await p.evaluate(() => window.reel.seek(10.0)); await p.waitForTimeout(300);
  log('card/title at 10.0 hidden:', await p.$eval('#rcard', e => e.hidden), await p.$eval('#title2', e => e.hidden));
  for (const t of [1.0, 5.0, 10.9, 21.1, 38.35, 51.85, 58.3, 60.25, 65.35, 70.55, 73.05, 77.05]){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
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
    return { dur:buf.duration, hook:rms(0, 8.35), hooktitle:rms(8.4, 9.5), vault:rms(10.3, 11.0), run:rms(10.9, 13.6), doors:rms(20.2, 22.0), crash:rms(13.2, 14.2), pops:rms(15.1, 17.6), walk:rms(31.95, 35.25), bams:rms(43.65, 46.45), locker:rms(46.85, 48.65), burst:rms(50.95, 51.95), close:rms(59.75, 61.25), search:rms(64.65, 67.95), burstwall:rms(51.05, 51.85), box:rms(69.15, 69.85), look:rms(70.75, 71.75), stare:rms(70.7, 71.7), lookround:rms(72.7, 74.6), desk:rms(74.85, 76.65), opening:rms(79.05, 80.15), rise:rms(74.35, 80.95), gap:rms(81.05, 81.4), question:rms(82.8, 86.8) }; });
  log('offline mix (dB):', Object.entries(lv).map(([k, v]) => k === 'dur' ? `dur ${v.toFixed(2)}s` : `${k} ${(20 * Math.log10(v)).toFixed(1)}`).join(' | '));
  // the end card: both questions, pick one answer each
  await p.evaluate(() => window.reel.seek(82.2)); await p.waitForTimeout(700);
  log('card shown:', await p.$eval('#choice', e => !e.hidden), '| groups:', await p.$$eval('#choice [data-q]', els => els.length));
  await p.click('#choice [data-q="q2"] button[data-k="hide"]'); await p.waitForTimeout(300);
  log('picked:', JSON.stringify(await p.evaluate(() => window.reel.choice.picked())), '| result:', await p.$eval('#choiceRes', e => e.textContent));
  await p.locator('#stage').screenshot({ path:'p2_card_picked.png' });
  const url = await p.evaluate(() => window.reel.choice.card(82.2)); require('fs').writeFileSync('p2_card_export.png', Buffer.from(url.split(',')[1], 'base64'));
  const url2 = await p.evaluate(() => window.reel.choice.card(8.95)); const url3 = await p.evaluate(() => window.reel.choice.card(1.0)); require('fs').writeFileSync('p2_title2_export.png', Buffer.from(url3.split(',')[1], 'base64')); require('fs').writeFileSync('p2_title_export.png', Buffer.from(url2.split(',')[1], 'base64'));
  await b.close();
  const { b: b2, p: p2, errs: e2 } = await open({ width:390, height:844 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p2.waitForTimeout(4500); log('phone width:', await p2.evaluate(() => document.documentElement.scrollWidth)); await b2.close();
  log([...errs, ...e2].filter(e => !/fonts|ERR_FAILED|net::|willReadFrequently/.test(e)).slice(0, 12).join('\n') || 'no errors');
})();
