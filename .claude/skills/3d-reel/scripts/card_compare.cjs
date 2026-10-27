// the opening's card and the end's question on the page (left) and as the exported video draws them (right), at TIMES
const { open } = require('./te_fonts.cjs'), fs = require('fs');
(async () => {
  const { b, p, errs } = await open({ width:600, height:1000 });
  await p.waitForTimeout(4000); await p.evaluate(() => window.reel.play(false));
  const T = (process.env.TIMES || '0.9,2.6,4.1,7.6,9.0,88.5').split(',').map(Number);
  for (const t of T){ await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(1000);
    await p.locator('#stage').screenshot({ path:`cmp_page_${t.toFixed(2)}.png` });
    const url = await p.evaluate(t => window.reel.choice.card(t, 540, 960), t); fs.writeFileSync(`cmp_vid_${t.toFixed(2)}.png`, Buffer.from(url.split(',')[1], 'base64')); }
  console.log(errs.filter(e => !/ERR_FAILED|net::|Canvas2D/.test(e)).slice(0, 5).join('\n') || 'no errors'); await b.close();
})();
