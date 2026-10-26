// close-up stills of him at given page times from a side camera, room lit up (TIMES=a,b; CAM=x,y,z; LOOK=x,y,z)
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:700, height:900 }, { page:'the-graveyard-shift-part2.html' });
  await p.waitForTimeout(4500);
  await p.evaluate(() => window.reel.play(false));
  const C = (process.env.CAM || '2.4,1.5,-16.6').split(',').map(Number), L = (process.env.LOOK || '3.7,.9,-18.1').split(',').map(Number);
  for (const t of process.env.TIMES.split(',').map(Number)){
    const url = await p.evaluate(([t, C, L, F]) => window.reel._fig.view(t, C, L, F, [], .22), [t, C, L, +(process.env.FOV || 55)]);
    require('fs').writeFileSync(`dp_${String(t).replace('.', '_')}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(errs.slice(0, 5).join('\n') || 'no errors'); await b.close();
})();
