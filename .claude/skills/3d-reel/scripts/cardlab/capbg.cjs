// the frozen frames behind the two cards, without the cards: cardlab/bg_end.png, cardlab/bg_recap.png (+ the current cards for reference)
const { open } = require('../te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:1000, height:1100 }, { page:'the-graveyard-shift-part2.html', dsf:2 });
  await p.waitForTimeout(4500);
  await p.evaluate(() => { window.reel.play(false); const c = document.getElementById('optBlur'); if (c && c.checked) c.click(); });
  const shot = async (t, hide, name) => {
    await p.evaluate(t => window.reel.seek(t), t); await p.waitForTimeout(1200);
    await p.locator('#stage').screenshot({ path:`cardlab/cur_${name}.png` });
    await p.evaluate(ids => ids.forEach(id => { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; document.querySelectorAll('.subs,.caption,#subs').forEach(s => s.style.visibility = 'hidden'); }), hide);
    await p.waitForTimeout(300);
    await p.locator('#stage').screenshot({ path:`cardlab/bg_${name}.png` });
    await p.evaluate(ids => ids.forEach(id => { const e = document.getElementById(id); if (e) e.style.visibility = ''; }), hide);
  };
  await shot(94.0, ['choice', 'choiceRes'], 'end');
  await shot(6.4, ['rcard', 'rtag'], 'recap');
  console.log(errs.filter(e => !/fonts|ERR_FAILED|net::|Canvas2D/.test(e)).slice(0, 5).join('\n') || 'no errors'); await b.close();
})();
