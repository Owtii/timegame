const { open } = require('./te_common.cjs');
(async () => { const { b, p, errs } = await open({ width:540, height:960 }, { page:'the-graveyard-shift-part2.html', timeout:240000 }); await p.waitForTimeout(3000);
  console.log(errs.filter(e => !/fonts|ERR_FAILED|net::|willRead/.test(e)).slice(0, 8).join('\n') || 'no errors'); await b.close(); })();
