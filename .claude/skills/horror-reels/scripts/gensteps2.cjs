// where his boots land: samples the walk (window.reel._fig.haz) and writes ns/audio/steps.json, a footfall each half stride
const fs = require('fs');
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:400, height:700 }, { page:'the-graveyard-shift-part2.html', dsf:1 });
  await p.waitForTimeout(4000);
  const steps = await p.evaluate(() => { const out = []; let last = null;
    const end = 79;
    for (let t = 37; t < end; t += .004){ const o = window.reel._fig.haz(t); if (!o){ last = null; continue; }
      const k = Math.floor(o.phase * 2);
      if (last && last.k !== k && o.walk > .2 && Math.abs(o.phase - last.phase) < .2) out.push({ t:+t.toFixed(3), x:+o.x.toFixed(2), z:+o.z.toFixed(2), foot:((k % 2) + 2) % 2, turn:o.turn ? 1 : 0 });
      last = { k, phase:o.phase }; }
    return out; });
  fs.writeFileSync('ns2/audio/steps.json', JSON.stringify(steps));
  console.log(steps.length, 'steps:', steps.map(s => s.t).join(' '));
  console.log(errs.filter(e => !/fonts|ERR_FAILED|net::/.test(e)).slice(0, 8).join('\n') || 'no errors'); await b.close();
})();
