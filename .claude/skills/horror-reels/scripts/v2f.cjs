// renders frames of the reel at given times (TIMES=a,b,c), optional zoom crop of the phone (ZOOM=1)
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1000, height:1100 }, { page:'the-graveyard-shift-part2.html', dsf:+(process.env.DSF || 1) });
  await p.waitForTimeout(4500);
  await p.evaluate(() => { window.reel.play(false); const c = document.getElementById('optBlur'); if (c && c.checked) c.click(); });
  for (const t of process.env.TIMES.split(',').map(Number)){
    await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(900);
    await p.locator('#stage').screenshot({ path:`p2_${String(t).replace('.', '_')}.png` });
  }
  console.log(errs.filter(e => !/fonts|ERR_FAILED|net::/.test(e)).slice(0, 8).join('\n') || 'no errors'); await b.close();
})();
