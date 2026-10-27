// The Graveyard Shift Part 2: load, title card, captions (narrator / me / phone), sound editor, camera editor, offline mix,
// the two-question card and both votes, phone width
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1440, height:900 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p.waitForTimeout(5000);
  const log = (...a) => console.log(...a);
  log('ready:', await p.evaluate(() => !!window.reel));
  await p.evaluate(() => window.reel.play(false));
  // the opening: the question over Part 1's last seconds (its words lighting up), then the keys, RUN picked, then Part 2
  const hook = async t => { await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
    return p.evaluate(() => { const c = document.getElementById('rcard'); return { shown:!c.hidden && +c.style.opacity > .5, lit:c.querySelectorAll('.on').length, keys:+document.getElementById('hlater').style.opacity, picked:c.classList.contains('picked') }; }); };
  log('question at 0.5:', JSON.stringify(await hook(.5)), '| at 1.9:', JSON.stringify(await hook(1.9)));
  log('keys at 3.0:', JSON.stringify(await hook(3.0)), '| RUN picked at 4.3:', (await hook(4.3)).picked, '| at 4.8:', (await hook(4.8)).picked);
  await p.evaluate(() => window.reel.seek(6.0)); await p.waitForTimeout(300);
  log('card/title at 6.0 hidden:', await p.$eval('#rcard', e => e.hidden), await p.$eval('#title2', e => e.hidden));
  for (const t of [1.0, 3.0, 6.9, 17.1, 34.35, 47.85, 54.3, 56.25, 61.35, 66.55, 69.05, 73.05]){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(300);
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
    return { dur:buf.duration, behind:rms(0, 2.05), hookq:rms(2.1, 5.5), vault:rms(6.3, 7.0), run:rms(6.9, 9.6), doors:rms(16.2, 18.0), crash:rms(9.2, 10.2), pops:rms(11.1, 13.6), walk:rms(27.95, 31.25), bams:rms(39.65, 42.45), locker:rms(42.85, 44.65), burst:rms(46.95, 47.95), close:rms(55.75, 57.25), search:rms(60.65, 63.95), burstwall:rms(47.05, 47.85), box:rms(65.15, 65.85), look:rms(66.75, 67.75), stare:rms(66.7, 67.7), lookround:rms(68.7, 70.6), desk:rms(70.85, 72.65), opening:rms(75.05, 76.15), rise:rms(70.35, 76.95), gap:rms(77.05, 77.4), question:rms(78.8, 82.8) }; });
  log('offline mix (dB):', Object.entries(lv).map(([k, v]) => k === 'dur' ? `dur ${v.toFixed(2)}s` : `${k} ${(20 * Math.log10(v)).toFixed(1)}`).join(' | '));
  // the end card: both questions, pick one answer each
  await p.evaluate(() => window.reel.seek(78.2)); await p.waitForTimeout(700);
  log('card shown:', await p.$eval('#choice', e => !e.hidden), '| groups:', await p.$$eval('#choice [data-q]', els => els.length));
  await p.click('#choice [data-q="q2"] button[data-k="hide"]'); await p.waitForTimeout(300);
  log('picked:', JSON.stringify(await p.evaluate(() => window.reel.choice.picked())), '| result:', await p.$eval('#choiceRes', e => e.textContent));
  await p.locator('#stage').screenshot({ path:'p2_card_picked.png' });
  const url = await p.evaluate(() => window.reel.choice.card(78.2)); require('fs').writeFileSync('p2_card_export.png', Buffer.from(url.split(',')[1], 'base64'));
  const url2 = await p.evaluate(() => window.reel.choice.card(4.85)); const url3 = await p.evaluate(() => window.reel.choice.card(1.0)); require('fs').writeFileSync('p2_title2_export.png', Buffer.from(url3.split(',')[1], 'base64')); require('fs').writeFileSync('p2_title_export.png', Buffer.from(url2.split(',')[1], 'base64'));
  await b.close();
  const { b: b2, p: p2, errs: e2 } = await open({ width:390, height:844 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p2.waitForTimeout(4500); log('phone width:', await p2.evaluate(() => document.documentElement.scrollWidth)); await b2.close();
  log([...errs, ...e2].filter(e => !/fonts|ERR_FAILED|net::|willReadFrequently/.test(e)).slice(0, 12).join('\n') || 'no errors');
})();
