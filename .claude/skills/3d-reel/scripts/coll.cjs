// does he ever walk into anything in the storage room? (window.reel._fig.collide: every sampled moment where his body,
// .22 m round, overlaps something standing on the floor there)
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:400, height:700 }, { page:'the-graveyard-shift-part2.html', dsf:1 });
  await p.waitForTimeout(4000);
  const hits = await p.evaluate(() => window.reel._fig.collide());
  const runs = []; hits.forEach(h => { const r = runs[runs.length - 1]; if (r && h.t - r.t1 < .2 && r.box.join() === h.box.join()) { r.t1 = h.t; r.d = Math.min(r.d, h.d); } else runs.push({ t0:h.t, t1:h.t, x:h.x, z:h.z, d:h.d, box:h.box }); });
  const by = {}; runs.forEach(r => { const k = r.box.join(); (by[k] = by[k] || []).push(r); });
  console.log('collisions:', runs.length, '| things hit:', Object.keys(by).length); Object.entries(by).forEach(([k, rs]) => console.log(k, '->', rs.map(r => `${r.t0}-${r.t1} at ${r.x},${r.z} (${r.d})`).join('; ')));
  console.log(errs.filter(e => !/fonts|ERR_FAILED|net::|willRead/.test(e)).slice(0, 5).join('\n') || 'no errors'); await b.close();
})();
